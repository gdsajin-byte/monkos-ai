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

// ─── 배치 상수 (IDPASS CropEngine.swift 정본 이식) ───
const HAIR_MARGIN_RATIO = 0.044;   // 프레임 높이의 4.4%
const BOTTOM_MIN_RATIO = 0.12;     // 프레임 높이의 12% (턱 아래 최소 여백)
const FACE_MIN_RATIO = 0.93;       // spec.faceMinMm 부재 시 최소 얼굴 = faceTargetMm × 0.93
const HAIR_VOLUME_MAX = 0.15;      // hairTop 새니티: crown 위 fullFaceH × 15% 초과 시 오검출

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

  const { chin, leftEye, rightEye, imageWidth, imageHeight } = landmarks;
  const eyeY = (leftEye.y + rightEye.y) / 2;
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const pose = landmarks.pose || {};
  const pitchDeg = pose.pitch || 0;
  const mirrorRatio = 1.0;
  const crownY = eyeY - (chin.y - eyeY) * mirrorRatio;
  const facePx = chin.y - crownY;
  if (facePx <= 0) throw new Error('[Crop] 유효하지 않은 얼굴 높이');

  let hairTopY = landmarks.hairTop ?? crownY;
  let hasHairTop = landmarks.hairTop != null;

  let scale = (faceTargetMm * mmPx) / facePx;

  // hairTop 새니티: crown 위로 해부학적 한계 초과 시 오검출 판정 → 무시
  if (hasHairTop) {
    const maxHairExtent = crownY - facePx * HAIR_VOLUME_MAX;
    if (hairTopY < maxHairExtent) {
      console.log(`[Crop] hairTop 새니티 실패: hairTop=${hairTopY.toFixed(0)} < crown-${(facePx * HAIR_VOLUME_MAX).toFixed(0)}=${maxHairExtent.toFixed(0)} → 오검출, 무시`);
      hasHairTop = false;
      hairTopY = crownY;
    }
  }

  // IDPASS CropEngine.swift L263-294 정본 순서 이식
  // ① 눈 앵커 배치
  const eyePositionRatio = frameHmm >= 60 ? 0.42 : 0.43;
  const targetEyeY = frameH * eyePositionRatio;
  let extractTop = Math.round(eyeY * scale - targetEyeY);

  // ② 헤어 가드 (잘릴 때만 개입)
  if (hasHairTop) {
    const scaledHairTopY = hairTopY * scale;
    const hairTopInFrame = scaledHairTopY - extractTop;
    if (hairTopInFrame < 0) {
      const minHairMarginPx = frameH * HAIR_MARGIN_RATIO;
      extractTop = Math.round(scaledHairTopY - minHairMarginPx);
    }
  }

  // ③④ 하단 마진 체크 + 스케일 축소 루프 (눈 재앵커)
  const bottomMarginPx = frameH - (chin.y * scale - extractTop);
  if (bottomMarginPx < frameH * BOTTOM_MIN_RATIO) {
    const minTargetFaceH = faceMinMm * mmPx;
    let newScale = scale;
    let resolved = false;
    while (newScale * facePx > minTargetFaceH) {
      newScale *= 0.995;
      const nExtractTop = Math.round(eyeY * newScale - targetEyeY);
      const nBottomMargin = frameH - (chin.y * newScale - nExtractTop);
      if (nBottomMargin >= frameH * BOTTOM_MIN_RATIO) {
        // 헤어 체크: 축소 후에도 hairTop이 프레임 안이면 채택
        if (!hasHairTop || hairTopY * newScale - nExtractTop >= 0) {
          scale = newScale;
          extractTop = nExtractTop;
          resolved = true;
          break;
        }
      }
    }
    if (!resolved) {
      // faceMin까지 줄여도 안 되면 ②의 위치 유지 (IDPASS 동일)
    }
  }

  extractTop = Math.max(0, extractTop);

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

  const frame = { x: extractLeft / p.scale, y: extractTop / p.scale, w: frameW / p.scale, h: frameH / p.scale };
  const { width: imgW, height: imgH } = p.imageSize;
  // 프레임 높이·너비 대비 입력 이미지 밖 비율 0~1. 러프 크롭을 넣으면 러프 창 기준임에 주의 —
  // 포털 고객 판정은 원본 좌표로 역산해 lib/fit-fov.js에서 다시 잰다.
  const outside = {
    top: +(Math.max(0, -frame.y) / frame.h).toFixed(4),
    bottom: +(Math.max(0, frame.y + frame.h - imgH) / frame.h).toFixed(4),
    left: +(Math.max(0, -frame.x) / frame.w).toFixed(4),
    right: +(Math.max(0, frame.x + frame.w - imgW) / frame.w).toFixed(4),
  };

  return {
    frame,
    outside,
    lines: p.lines,
    imageSize: p.imageSize,
    meta,
  };
}

/**
 * 순백 배경에서 피사체 상단(머리끝) 행 실측 — 행의 2% 이상 비백색이면 피사체 시작
 */
export async function subjectTopRow(imageBuffer) {
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
