import sharp from 'sharp';
import { getSpec } from '../specs/formats.js';

/**
 * 증명사진 크롭 엔진 v3 — 스펙 주입형 단일 배치 산식
 *
 * 설계 원칙 (사진관 실무 기반):
 * - 정수리 = 눈~턱 거리를 위로 반전 (해부학: 눈은 두상의 1/2)
 * - 두상(crown~chin)을 spec.faceTargetMm으로 스케일
 * - 배치 모드 2종 (작가님 결정 2026-07-09):
 *   · 실측: landmarks.hairTop 존재 시 헤어탑 위 soft 여백(2mm)
 *   · 프리뷰 폴백: 미실측 시 눈 45% 고정 앵커
 * - 헤어탑이 프레임 밖이면 spec.faceMinMm까지 축소, 그래도 안 되면 정수리 여백 0(헤어 잘림 허용)
 *
 * 배치 수학의 정본은 resolvePlacement() 하나다 (REVIEW_20260709 B5 단일화).
 * cropToFrame(이름 규격 렌더)·cropToSpecV2(주입 스펙 렌더)·fitSpecGeometry(기하)는 전부 이를 경유한다.
 */

// ─── 배치 상수 ───
const EYE_ANCHOR_FALLBACK = 0.45;  // hairTop 미실측 시 눈 고정 앵커 (프리뷰 45%, 작가님 결정 2026-07-09)
const HAIR_MARGIN_MM = 2;          // 실측 헤어탑 위 soft 여백 (mm) — spec.hairMarginMm이 우선
const FACE_MIN_RATIO = 0.93;       // spec.faceMinMm 부재 시 최소 얼굴 = faceTargetMm × 0.93

/**
 * 공용 배치 산식 — 스케일과 extractTop/extractLeft를 결정한다.
 * 경계 클램프는 호출부 정책: 렌더는 하드 클램프+패딩, 기하는 프레임의 이미지 밖 돌출 허용.
 *
 * @param {object} landmarks - detectFace() 반환값 (chin, leftEye, rightEye, imageWidth, imageHeight[, hairTop, pose])
 * @param {object} spec - { frameW, frameH(px), frameHmm, faceTargetMm, faceMinMm?, hairMarginMm? }
 */
function resolvePlacement(landmarks, spec) {
  const { frameW, frameH, frameHmm, faceTargetMm } = spec;
  if (!frameW || !frameH || !frameHmm || !faceTargetMm) {
    throw new Error('[Crop] spec 필수 필드 누락 (frameW/frameH/frameHmm/faceTargetMm)');
  }
  const mmPx = frameH / frameHmm;
  const faceMinMm = spec.faceMinMm || faceTargetMm * FACE_MIN_RATIO;
  const softMarginPx = (spec.hairMarginMm ?? HAIR_MARGIN_MM) * mmPx;

  const { chin, leftEye, rightEye, imageWidth, imageHeight } = landmarks;
  const eyeY = (leftEye.y + rightEye.y) / 2;
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const pose = landmarks.pose || {};
  const pitchDeg = pose.pitch || 0;
  // pitch 보정 중립화 — 6DRepNet 오프셋(-4.8°) + 부호 미확정. 캘리브레이션 후 복원 (민아 검증 2026-07-09)
  const mirrorRatio = 1.0;
  const crownY = eyeY - (chin.y - eyeY) * mirrorRatio;
  const facePx = chin.y - crownY;
  if (facePx <= 0) throw new Error('[Crop] 유효하지 않은 얼굴 높이');

  const hairTopY = landmarks.hairTop ?? crownY;

  let scale = (faceTargetMm * mmPx) / facePx;

  // 제약 기반 clamp 배치 — hard 제약: 정수리 잘림 금지 (여백 ≥ 0)
  const topMax = Math.round(crownY * scale);
  const hasHairTop = landmarks.hairTop != null;
  const topTarget = hasHairTop
    ? Math.round(hairTopY * scale - softMarginPx)              // 실측 헤어탑 위 soft 여백
    : Math.round(eyeY * scale - frameH * EYE_ANCHOR_FALLBACK); // 눈 45% 앵커
  let extractTop = Math.max(0, Math.min(topMax, topTarget));

  // 스케일 축소 시도: 헤어탑이 프레임 밖이면 faceMinMm까지
  if (hairTopY * scale - extractTop < 0) {
    const minTargetFaceH = faceMinMm * mmPx;
    let newScale = scale;
    let fitted = false;
    while (newScale * facePx > minTargetFaceH) {
      newScale *= 0.995;
      const nTopMax = Math.round(crownY * newScale);
      const nTopTarget = Math.round(hairTopY * newScale - softMarginPx);
      const nExtractTop = Math.max(0, Math.min(nTopMax, nTopTarget));
      if (hairTopY * newScale - nExtractTop >= 0) {
        scale = newScale;
        extractTop = nExtractTop;
        fitted = true;
        break;
      }
    }
    // faceMinMm에서도 안 되면 → 타겟 유지, 헤어 잘림 허용 (정수리 여백 0)
    if (!fitted) extractTop = topMax;
  }

  const eyeAnchor = (eyeY * scale - extractTop) / frameH;

  const scaledW = Math.round(imageWidth * scale);
  const scaledH = Math.round(imageHeight * scale);
  // 좌우: 양 눈 중심이 프레임 수평 중앙
  const extractLeft = Math.round(eyeCenterX * scale - frameW / 2);

  return {
    scale, extractTop, extractLeft, scaledW, scaledH,
    mmPx, facePx, eyeAnchor, mirrorRatio, pitchDeg,
    lines: { crownY, eyeY, chinY: chin.y, hairTopY, eyeCenterX },
    imageSize: { width: imageWidth, height: imageHeight },
  };
}

/** 공용 meta 계측 — extractTop은 호출부 경계 클램프 이후 값, eyeAnchor는 클램프 전 값 유지 */
function placementMeta(p, extractTop) {
  return {
    faceMM: (p.facePx * p.scale / p.mmPx).toFixed(1),
    crownMarginMM: ((p.lines.crownY * p.scale - extractTop) / p.mmPx).toFixed(1),
    hairMarginMM: ((p.lines.hairTopY * p.scale - extractTop) / p.mmPx).toFixed(1),
    eyePositionPercent: (p.eyeAnchor * 100).toFixed(1),
    eyeAnchor: +p.eyeAnchor.toFixed(3),
    mirrorRatio: +p.mirrorRatio.toFixed(2),
    pitchDeg: p.pitchDeg,
  };
}

/**
 * 배치 → sharp 렌더 공용 경로 (cropToFrame·cropToSpecV2 공용)
 */
async function renderPlacement(imageBuffer, landmarks, spec) {
  const p = resolvePlacement(landmarks, spec);
  const { frameW, frameH } = spec;
  const { scale, scaledW, scaledH, mmPx } = p;

  // 경계 보정
  const extractTop = Math.max(0, Math.min(p.extractTop, scaledH - frameH));
  const extractLeft = Math.max(0, Math.min(p.extractLeft, scaledW - frameW));

  // 패딩 필요 시
  if (scaledW < frameW || scaledH < frameH) {
    console.log(`[Crop] 스케일 후 이미지(${scaledW}×${scaledH})가 프레임(${frameW}×${frameH})보다 작음 → 패딩`);
    return await cropWithPadding(imageBuffer, scale, extractTop, extractLeft, frameW, frameH, scaledW, scaledH);
  }

  const croppedBuffer = await sharp(imageBuffer)
    .resize(scaledW, scaledH, { fit: 'fill' })
    .extract({ left: extractLeft, top: extractTop, width: frameW, height: frameH })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();

  const meta = {
    ...placementMeta(p, extractTop),
    bottomMarginMM: ((frameH - (p.lines.chinY * scale - extractTop)) / mmPx).toFixed(1),
    scale: Math.round(scale * 100) / 100,
    extractRegion: { left: extractLeft, top: extractTop, width: frameW, height: frameH },
  };

  console.log(`[Crop] 완료: face=${meta.faceMM}mm, crown=${meta.crownMarginMM}mm, hair=${meta.hairMarginMM}mm, bottom=${meta.bottomMarginMM}mm, eye=${meta.eyePositionPercent}%, scale=${meta.scale}, mirror=${p.mirrorRatio.toFixed(2)}, pitch=${p.pitchDeg}°`);
  return { buffer: croppedBuffer, meta };
}

/**
 * 이름 규격 렌더 크롭 — getSpec(format, country) 규격을 스펙 필드로 정규화해 renderPlacement 경유.
 * 얼굴 타겟·프레임 mm은 전부 규격에서 온다 (구 모듈 상수 33/45 고정 산식 폐지, 2026-07-10).
 *
 * @param {Buffer} imageBuffer - 원본 이미지 버퍼
 * @param {object} landmarks - detectFace() 반환값
 * @param {object} options - { format: 'passport'|'id', country: 'KR'|'JP' }
 * @returns {Promise<{buffer: Buffer, meta: object}>}
 */
export async function cropToFrame(imageBuffer, landmarks, options = {}) {
  const { format = 'passport', country = 'KR' } = options;
  const named = getSpec(format, country);
  if (!named) {
    throw new Error(`[Crop] 미지원 규격: ${format}_${country}`);
  }
  const { buffer, meta } = await renderPlacement(imageBuffer, landmarks, {
    frameW: named.width,
    frameH: named.height,
    frameHmm: named.frameHmm,
    faceTargetMm: named.faceTargetMm,
    faceMinMm: named.faceMinMm,
  });
  return { buffer, meta: { spec: `${format}_${country}`, ...meta } };
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
 * 주입 스펙 렌더 크롭 v3 — 스펙스 파이프라인(server.js /api/crop-spec) 전용.
 * 주입된 spec을 그대로 배치에 사용한다. 428개 슬러그 규격이 각각 다르므로
 * id_kr/passport_kr 2종으로의 강제 매핑 금지 (2026-07-10 R1 적대검증 확정).
 *
 * @param {object} spec - { frameW, frameH(px), frameHmm, faceTargetMm, faceMinMm?, hairMarginMm? }
 * @returns {Promise<{buffer: Buffer, meta: object}>}
 */
export async function cropToSpecV2(imageBuffer, landmarks, spec) {
  return renderPlacement(imageBuffer, landmarks, spec);
}

/**
 * 규격 프레임 피팅 기하 — 렌더 없이 좌표만 반환 (ORDER_20260707 크롭정밀도)
 *
 * 용도: 비전 검수·가이드 오버레이. 실사(비순백) 원본에서는 hairScan을 꺼야 한다 —
 * subjectTopRow는 순백 전제라 어두운 배경에서 hairTop=0(최상단)으로 오판, 프레임이 통째로
 * 위에 붙는 실사고의 원인 (2026-07-07 카나리 crown 22.2mm/눈 84.7% 규명).
 * 실사 입력의 헤어 잘림 판정은 상위(Gemini 비전 §6-2)가 담당.
 *
 * @returns 입력 이미지 좌표계 기준 { frame, lines, meta } — frame은 스케일 역산된 원본 좌표
 */
export async function fitSpecGeometry(imageBuffer, landmarks, spec, opts = {}) {
  const p = resolvePlacement(landmarks, spec);
  const { frameW, frameH } = spec;

  let { extractTop, extractLeft } = p;
  const canClampY = p.scaledH >= frameH;
  const canClampX = p.scaledW >= frameW;
  if (canClampY) extractTop = Math.max(0, Math.min(extractTop, p.scaledH - frameH));
  if (canClampX) extractLeft = Math.max(0, Math.min(extractLeft, p.scaledW - frameW));

  const meta = {
    ...placementMeta(p, extractTop),
    scale: Math.round(p.scale * 1000) / 1000,
    padded: !canClampX || !canClampY,
  };

  return {
    frame: { x: extractLeft / p.scale, y: extractTop / p.scale, w: frameW / p.scale, h: frameH / p.scale },
    lines: p.lines,
    imageSize: p.imageSize,
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
