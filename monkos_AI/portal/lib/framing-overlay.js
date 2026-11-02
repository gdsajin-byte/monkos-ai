/**
 * 업로드 전 추천 화각 레퍼런스 — 대표 마스터 이미지 위 오버레이 좌표 (DESIGN_20261102 §1·§2)
 *
 * 부수 의존 없는 순수 모듈: 렌더러와 자산 생성 스크립트(tools/specs-diagrams/gen_framing_reference.mjs)가 함께 쓴다.
 * 좌표는 전부 확장 캔버스(REF_CANVAS) 픽셀이다. SVG viewBox와 같으므로 반응형은 브라우저가 처리한다.
 */

// 원본 좌표 정본: tools/specs-diagrams/gen_brand_diagrams_v5.mjs:14 FACE (crop-engine 106점)
const MASTER_FACE = { chinY: 461.0, hairTopY: 98.2, cx: 449.4 };
export const MASTER_SIZE = { width: 896, height: 1200 };

// 위쪽 흰 캔버스 확장 — 머리 위 필요량 = 0.37(추천 범위) × 두상 362.8 = 134.2px, 원본 여백 98.2px → 36px 부족, 4px 더해 40px
export const CANVAS_EXTEND_TOP = 40;
export const REF_CANVAS = { width: MASTER_SIZE.width, height: MASTER_SIZE.height + CANVAS_EXTEND_TOP };
export const REF_ASSET_PATH = '/images/guides/framing_reference_master.webp';

// 확장 캔버스 좌표. crop-engine은 눈을 턱~정수리 중점으로 본다(crown = eye − (chin − eye)).
// 2026-11-02 /api/fit-spec 실측: crown 98.24 · eye 279.64 · chin 461.04 — FACE의 hairTopY가 곧 엔진 crown이다.
const REF_FACE = {
  chinY: MASTER_FACE.chinY + CANVAS_EXTEND_TOP,
  crownY: MASTER_FACE.hairTopY + CANVAS_EXTEND_TOP,
  eyeY: (MASTER_FACE.chinY + MASTER_FACE.hairTopY) / 2 + CANVAS_EXTEND_TOP,
  cx: MASTER_FACE.cx,
};
const HEAD_PX = REF_FACE.chinY - REF_FACE.crownY;

// 추천 촬영 범위 상수 정본 — 전 규격 최대치(머리 위 0.34·턱 아래 0.66·좌우 반폭 0.98, 두상 배수) + 여유 0.03
const RECOMMENDED_RANGE = { above: 0.37, below: 0.69, halfWidth: 1.01 };

// crop-engine/lib/crop.js 배치 상수와 동일
const HAIR_MARGIN_RATIO = 0.044;
const BOTTOM_MIN_RATIO = 0.12;
const FACE_MIN_RATIO = 0.93;

const round1 = (v) => Math.round(v * 10) / 10;

/** 바깥 초록 점선: 추천 촬영 범위 */
export function recommendedRect() {
  const x = REF_FACE.cx - RECOMMENDED_RANGE.halfWidth * HEAD_PX;
  const y = REF_FACE.crownY - RECOMMENDED_RANGE.above * HEAD_PX;
  return {
    x: round1(x),
    y: round1(y),
    w: round1(RECOMMENDED_RANGE.halfWidth * 2 * HEAD_PX),
    h: round1(HEAD_PX * (1 + RECOMMENDED_RANGE.above + RECOMMENDED_RANGE.below)),
  };
}

/**
 * 안쪽 흰 실선: 이 규격의 완성 사진 범위.
 * crop-engine resolvePlacement()와 같은 식이다. crop-engine은 별도 서비스(독립 빌드 컨텍스트)라 import할 수 없어
 * 입력 중 마스터에 해당하는 값(hairTop = crown)만 대입해 옮겼다. 일치 여부는 __tests__/framing-overlay.test.js의
 * 엔진 실측값으로 검증한다. 엔진의 이미지 경계 클램프는 적용하지 않는다(규격 범위 자체를 보여주는 용도).
 *
 * @param {object} spec getSpecCropParams(slug) 반환값
 */
export function specCropRect(spec) {
  if (!spec) return null;
  const { frameW, frameH, frameHmm, faceTargetMm } = spec;
  if (!frameW || !frameH || !frameHmm || !faceTargetMm) return null;
  const mmPx = frameH / frameHmm;
  const faceMinMm = spec.faceMinMm || faceTargetMm * FACE_MIN_RATIO;
  const { chinY, crownY, eyeY, cx } = REF_FACE;

  let scale = (faceTargetMm * mmPx) / HEAD_PX;
  const targetEyeY = frameH * (frameHmm >= 60 ? 0.42 : 0.43);
  let extractTop = Math.round(eyeY * scale - targetEyeY);

  // 헤어 가드: 머리끝이 프레임 밖으로 나갈 때만 개입
  if (crownY * scale - extractTop < 0) {
    extractTop = Math.round(crownY * scale - frameH * HAIR_MARGIN_RATIO);
  }

  // 턱 아래 최소 여백: 부족하면 faceMin까지 축소 후 눈 재앵커
  if (frameH - (chinY * scale - extractTop) < frameH * BOTTOM_MIN_RATIO) {
    const minFacePx = faceMinMm * mmPx;
    let nextScale = scale;
    while (nextScale * HEAD_PX > minFacePx) {
      nextScale *= 0.995;
      const nextTop = Math.round(eyeY * nextScale - targetEyeY);
      const bottomOk = frameH - (chinY * nextScale - nextTop) >= frameH * BOTTOM_MIN_RATIO;
      if (bottomOk && crownY * nextScale - nextTop >= 0) {
        scale = nextScale;
        extractTop = nextTop;
        break;
      }
    }
  }

  const extractLeft = Math.round(cx * scale - frameW / 2);
  return {
    x: round1(extractLeft / scale),
    y: round1(extractTop / scale),
    w: round1(frameW / scale),
    h: round1(frameH / scale),
  };
}
