import sharp from 'sharp';
import { getSpec } from '../specs/formats.js';

/**
 * 증명사진 크롭 엔진 v2 — 조건부 배치 로직
 *
 * 설계 원칙 (사진관 실무 기반):
 * - 눈 위치를 1차 앵커로 사용 (프레임 상단에서 ~40-42%)
 * - 정수리 = 눈~턱 거리를 위로 반전 (해부학: 눈은 두상의 1/2)
 * - 헤어탑 여백 최소 2mm 보장
 * - 어깨선 가시성: 하단 부족 시 얼굴 크기를 3.2cm 방향으로 축소
 * - 얼굴 크기 허용 범위: 3.2~3.6cm (프레임 45mm 기준)
 *
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {object} landmarks - detectFace() 반환값
 * @param {object} options - { format, country }
 * @returns {Promise<{buffer: Buffer, meta: object}>}
 */

// ─── 배치 상수 (45mm 프레임 기준, 비율) ───
const EYE_POSITION_RATIO = 0.43;    // 레거시 폴백 — 실사용은 computeEyeAnchor()
const HAIR_MARGIN_MIN = 0.044;      // soft 타겟 여백: 2mm / 45mm ≈ 4.4%
const FACE_TARGET_MM = 33;          // 얼굴 기본 타겟 (mm)
const FACE_MIN_MM = 32.5;           // 얼굴 최소 허용 (mm) — 32mm 터치 금지
const FRAME_MM = 45;                // 프레임 높이 (mm)
const BOTTOM_MIN_RATIO = 0.12;      // 하단 최소 비율: ~5.4mm / 45mm (어깨선 가시)

function computeEyeAnchor(spec) {
  const faceRatio = (FACE_TARGET_MM / FRAME_MM);
  const halfFace = faceRatio / 2;
  const topMarginMin = spec.topMargin || 0.04;
  const bottomMarginMin = spec.bottomMargin || 0.12;
  const eyeMin = topMarginMin + halfFace;
  const eyeMax = 1 - bottomMarginMin - halfFace;
  if (eyeMin > eyeMax) return 0.44;
  const eyeOptimal = (eyeMin + eyeMax) / 2;
  return Math.max(0.42, Math.min(0.48, eyeOptimal));
}

export async function cropToFrame(imageBuffer, landmarks, options = {}) {
  const { format = 'passport', country = 'KR' } = options;
  const spec = getSpec(format, country);
  if (!spec) {
    throw new Error(`[Crop] 미지원 규격: ${format}_${country}`);
  }

  const { width: frameW, height: frameH } = spec;
  const { chin, leftEye, rightEye, imageWidth, imageHeight } = landmarks;

  // ─── 1. 눈 위치 실측 ───
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;

  // ─── 2. 정수리 추산 (해부학: 눈~정수리 ≈ 눈~턱) ───
  const eyeToChin = chin.y - eyeCenterY;
  const pose = landmarks.pose || {};
  const pitchDeg = pose.pitch || 0;
  // pitch 보정 중립화 — 6DRepNet 오프셋(-4.8°) + 부호 미확정. 캘리브레이션 후 복원 (민아 검증 2026-07-09)
  const mirrorRatio = 1.0;
  const crownY = eyeCenterY - eyeToChin * mirrorRatio;
  const faceHeight = chin.y - crownY;

  if (faceHeight <= 0) {
    throw new Error('[Crop] 유효하지 않은 얼굴 높이');
  }

  // ─── 3. 헤어탑 추산 ───
  const hairTopY = landmarks.hairTop ?? crownY;

  // ─── 4. 스케일 결정 (타겟 얼굴 크기 기반) ───
  const faceTargetRatio = FACE_TARGET_MM / FRAME_MM;
  let targetFaceH = frameH * faceTargetRatio;
  let scale = targetFaceH / faceHeight;

  // ─── 5. 제약 기반 clamp 배치 ───
  const mmPx = frameH / FRAME_MM;
  const softMarginPx = 2 * mmPx;  // 헤어 위 soft 타겟 2mm

  // hard 제약: 정수리 잘림 금지 (여백 ≥ 0)
  const topMax = Math.round(crownY * scale);

  // soft 타겟: 헤어탑 위 2mm
  const topTarget = Math.round(hairTopY * scale - softMarginPx);

  // 하한 없음 — 어깨는 soft, 강제하지 않음
  const topMin = 0;

  let extractTop = Math.max(topMin, Math.min(topMax, topTarget));

  // 스케일 축소 시도: 헤어탑이 프레임 밖이면 32.5mm까지
  if (hairTopY * scale - extractTop < 0) {
    const faceMinRatio = FACE_MIN_MM / FRAME_MM;
    let newScale = scale;
    while (newScale * faceHeight > frameH * faceMinRatio) {
      newScale *= 0.995;
      const newTopMax = Math.round(crownY * newScale);
      const newTopTarget = Math.round(hairTopY * newScale - softMarginPx);
      const newTopMin = 0;
      const newExtractTop = Math.max(newTopMin, Math.min(newTopMax, newTopTarget));
      if (hairTopY * newScale - newExtractTop >= 0) {
        scale = newScale;
        extractTop = newExtractTop;
        break;
      }
    }
    // 32.5mm에서도 안 되면 → 33mm 유지, 헤어 잘림 허용
    if (scale === targetFaceH / faceHeight) {
      extractTop = topMax;  // 정수리 여백 0 = 헤어 최대 잘림
    }
  }

  const eyeAnchor = ((eyeCenterY * scale - extractTop) / frameH);

  // ─── 7. 스케일 적용 ───
  const scaledW = Math.round(imageWidth * scale);
  const scaledH = Math.round(imageHeight * scale);

  // 좌우: 양 눈 중심이 프레임 수평 중앙
  const scaledEyeCenterX = eyeCenterX * scale;
  let extractLeft = Math.round(scaledEyeCenterX - frameW / 2);

  // 경계 보정
  extractTop = Math.max(0, Math.min(extractTop, scaledH - frameH));
  extractLeft = Math.max(0, Math.min(extractLeft, scaledW - frameW));

  // 패딩 필요 시
  if (scaledW < frameW || scaledH < frameH) {
    console.log(`[Crop] 스케일 후 이미지(${scaledW}×${scaledH})가 프레임(${frameW}×${frameH})보다 작음 → 패딩`);
    return await cropWithPadding(imageBuffer, scale, extractTop, extractLeft, frameW, frameH, scaledW, scaledH);
  }

  // ─── 8. sharp: resize → extract ───
  const croppedBuffer = await sharp(imageBuffer)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extract({ left: extractLeft, top: extractTop, width: frameW, height: frameH })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();

  // ─── 메타 정보 ───
  const actualFaceMM = (faceHeight * scale / mmPx).toFixed(1);
  const crownMM = ((crownY * scale - extractTop) / mmPx).toFixed(1);
  const hairMM = ((hairTopY * scale - extractTop) / mmPx).toFixed(1);
  const bottomMM = ((frameH - (chin.y * scale - extractTop)) / mmPx).toFixed(1);
  const eyePosPercent = ((eyeAnchor) * 100).toFixed(1);

  const meta = {
    spec: `${format}_${country}`,
    scale: Math.round(scale * 100) / 100,
    faceMM: actualFaceMM,
    crownMarginMM: crownMM,
    hairMarginMM: hairMM,
    bottomMarginMM: bottomMM,
    eyePositionPercent: eyePosPercent,
    eyeAnchor: +eyeAnchor.toFixed(3),
    mirrorRatio: +mirrorRatio.toFixed(2),
    pitchDeg,
    extractRegion: { left: extractLeft, top: extractTop, width: frameW, height: frameH },
  };

  console.log(`[Crop] 완료: face=${actualFaceMM}mm, crown=${crownMM}mm, hair=${hairMM}mm, bottom=${bottomMM}mm, eye=${eyePosPercent}%, scale=${meta.scale}, mirror=${mirrorRatio.toFixed(2)}, pitch=${pitchDeg}°`);
  return { buffer: croppedBuffer, meta };
}

/**
 * 스케일 후 이미지가 프레임보다 작을 때 — 흰색 패딩으로 처리
 */
async function cropWithPadding(imageBuffer, scale, extractTop, extractLeft, frameW, frameH, scaledW, scaledH) {
  const resized = await sharp(imageBuffer)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .png()
    .toBuffer();

  const padLeft = Math.max(0, -extractLeft);
  const padTop = Math.max(0, -extractTop);
  const safeLeft = Math.max(0, extractLeft);
  const safeTop = Math.max(0, extractTop);

  const availW = Math.min(scaledW - safeLeft, frameW);
  const availH = Math.min(scaledH - safeTop, frameH);

  const extracted = await sharp(resized)
    .extract({ left: safeLeft, top: safeTop, width: availW, height: availH })
    .png()
    .toBuffer();

  const croppedBuffer = await sharp({
    create: { width: frameW, height: frameH, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([{ input: extracted, left: padLeft, top: padTop }])
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();

  return {
    buffer: croppedBuffer,
    meta: { scale: Math.round(scale * 100) / 100, padded: true },
  };
}

/**
 * 규격 안착 크롭 v3 — IDPASS 크롭앱 정본 수학 이식 (2026-07-06 야간 교정)
 *
 * v2의 "머리끝~턱 = 얼굴" 측정은 오류였다: 규격의 머리 높이는 정수리~턱(두상)이며,
 * 헤어 볼륨을 얼굴에 포함하면 두상이 축소 배치돼 틀 안에서 붕 뜬다 (작가님 실사고 지적).
 *
 * 정본 배치 (portal/public/crop/crop.js = IDPASS 검증 로직):
 *   crown = 눈 - (턱 - 눈)  ← 해부학: 눈은 두상의 1/2
 *   face  = crown ~ chin  →  spec.faceTargetMm으로 스케일
 *   눈 위치 = 프레임 상단 44% (허용 40~48%)
 * 순백 스캔(머리끝 실측)은 "헤어 잘림 방지" 보조로만: 헤어가 프레임 밖이면
 * 내려 앉히고, 눈 48% 초과 시 faceMinMm까지 축소.
 *
 * @param {object} spec - { frameW, frameH(px), frameHmm, faceTargetMm, faceMinMm?, hairMarginMm? }
 */
/** @deprecated cropToFrame으로 통합 (2026-07-09) */
export async function cropToSpecV2(imageBuffer, landmarks, spec) {
  const format = (spec.frameHmm && spec.frameHmm <= 42) ? 'id' : 'passport';
  const country = spec.name?.includes('日本') ? 'JP' : 'KR';
  return cropToFrame(imageBuffer, landmarks, { format, country });
}

/**
 * 규격 프레임 피팅 기하 — cropToSpecV2와 동일 산식, 렌더 없이 좌표만 반환 (ORDER_20260707 크롭정밀도)
 *
 * 용도: 비전 검수·가이드 오버레이. 실사(비순백) 원본에서는 hairScan을 꺼야 한다 —
 * subjectTopRow는 순백 전제라 어두운 배경에서 hairTop=0(최상단)으로 오판, 프레임이 통째로
 * 위에 붙는 실사고의 원인 (2026-07-07 카나리 crown 22.2mm/눈 84.7% 규명).
 * 실사 입력의 헤어 잘림 판정은 상위(Gemini 비전 §6-2)가 담당.
 *
 * @returns 입력 이미지 좌표계 기준 { frame, lines, meta } — frame은 스케일 역산된 원본 좌표
 */
export async function fitSpecGeometry(imageBuffer, landmarks, spec, opts = {}) {
  const { frameW, frameH, frameHmm, faceTargetMm } = spec;
  if (!frameW || !frameH || !frameHmm || !faceTargetMm) {
    throw new Error('[FitSpec] spec 필수 필드 누락 (frameW/frameH/frameHmm/faceTargetMm)');
  }
  const mmPx = frameH / frameHmm;
  const faceMinMm = spec.faceMinMm || faceTargetMm * 0.93;

  const { chin, leftEye, rightEye, imageWidth, imageHeight } = landmarks;
  const eyeY = (leftEye.y + rightEye.y) / 2;
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const pose = landmarks.pose || {};
  const pitchDeg = pose.pitch || 0;
  // pitch 보정 중립화 — 6DRepNet 오프셋·부호 미확정 (민아 검증 2026-07-09)
  const mirrorRatio = 1.0;
  const crownY = eyeY - (chin.y - eyeY) * mirrorRatio;
  const facePx = chin.y - crownY;
  if (facePx <= 0) throw new Error('[FitSpec] 유효하지 않은 얼굴 높이');

  const hairTopY = landmarks.hairTop ?? crownY;
  const softMarginPx = 2 * mmPx;

  let scale = (faceTargetMm * mmPx) / facePx;

  // 제약 기반 clamp 배치
  const topMax = Math.round(crownY * scale);
  const topTarget = Math.round(hairTopY * scale - softMarginPx);
  const topMin = 0;
  let extractTop = Math.max(topMin, Math.min(topMax, topTarget));

  if (hairTopY * scale - extractTop < 0) {
    const minTargetFaceH = faceMinMm * mmPx;
    let newScale = scale;
    while (newScale * facePx > minTargetFaceH) {
      newScale *= 0.995;
      const nTopMax = Math.round(crownY * newScale);
      const nTopTarget = Math.round(hairTopY * newScale - softMarginPx);
      const nTopMin = 0;
      const nExtractTop = Math.max(nTopMin, Math.min(nTopMax, nTopTarget));
      if (hairTopY * newScale - nExtractTop >= 0) { scale = newScale; extractTop = nExtractTop; break; }
    }
    if (scale === (faceTargetMm * mmPx) / facePx) {
      extractTop = topMax;
    }
  }

  const eyeAnchor = (eyeY * scale - extractTop) / frameH;

  const scaledW = Math.round(imageWidth * scale);
  const scaledH = Math.round(imageHeight * scale);
  let extractLeft = Math.round(eyeCenterX * scale - frameW / 2);
  const canClampY = scaledH >= frameH;
  const canClampX = scaledW >= frameW;
  if (canClampY) extractTop = Math.max(0, Math.min(extractTop, scaledH - frameH));
  if (canClampX) extractLeft = Math.max(0, Math.min(extractLeft, scaledW - frameW));

  const meta = {
    faceMM: (facePx * scale / mmPx).toFixed(1),
    crownMarginMM: ((crownY * scale - extractTop) / mmPx).toFixed(1),
    hairMarginMM: ((hairTopY * scale - extractTop) / mmPx).toFixed(1),
    eyePositionPercent: (eyeAnchor * 100).toFixed(1),
    eyeAnchor: +eyeAnchor.toFixed(3),
    mirrorRatio: +mirrorRatio.toFixed(2),
    pitchDeg,
    scale: Math.round(scale * 1000) / 1000,
    padded: !canClampX || !canClampY,
  };

  return {
    frame: { x: extractLeft / scale, y: extractTop / scale, w: frameW / scale, h: frameH / scale },
    lines: { crownY, eyeY, chinY: chin.y, hairTopY, eyeCenterX },
    imageSize: { width: imageWidth, height: imageHeight },
    meta,
  };
}

/**
 * 순백 배경에서 피사체 상단(머리끝) 행 실측 — 행의 2% 이상 비백색이면 피사체 시작
 */
async function subjectTopRow(imageBuffer) {
  const { data, info } = await sharp(imageBuffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const threshold = Math.max(3, Math.floor(W * 0.02));
  for (let y = 0; y < H; y++) {
    let nonWhite = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C;
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) {
        if (++nonWhite >= threshold) break;
      }
    }
    if (nonWhite >= threshold) return y;
  }
  return 0;
}

/**
 * 폴백 크롭 — 얼굴 감지 실패 시 상단 중앙 기준 커버 크롭
 */
export async function fallbackCrop(imageBuffer, options = {}) {
  const { format = 'passport', country = 'KR' } = options;
  const spec = getSpec(format, country);
  if (!spec) {
    throw new Error(`[Crop] 미지원 규격: ${format}_${country}`);
  }

  console.log('[Crop] 폴백: 상단 중앙 커버 크롭');
  return sharp(imageBuffer)
    .resize(spec.width, spec.height, { fit: 'cover', position: 'top' })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}
