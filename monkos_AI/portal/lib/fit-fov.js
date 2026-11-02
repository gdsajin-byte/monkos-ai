/**
 * 화각 판정 — 규격 프레임 기하 하나로 전 규격 공통 (DESIGN_20261102 추천화각 §3)
 *
 * 계산 기준은 포털이 러프 크롭을 역산한 "원본 좌표" 프레임이다. crop-engine의 outside는 입력(러프 크롭)
 * 기준이라 러프 창 경계를 원본 경계로 오인할 수 있어 판정에 쓰지 않는다.
 * 위쪽 이탈은 배경과 같은 색으로 채워져 보이지 않으므로 판정에서 제외한다(정수리는 hair-measure 실측).
 */

// 임계 근거: COMPLETION_20261102 화각부족판정 임계 표 (dev 실측). 초안 warn 3%는 어깨가 가장자리에 닿지 않는 3.2~3.7%대를 오경보해 5%로 상향.
// block은 초안 12%에서 8%로 하향 — 11% 실물에서 몸 좌·우·아래 직선 잘림이 또렷해 출고 불가 품질 (2026-11-02 쌍아 결정)
export const FOV_WARN_RATIO = 0.05;
export const FOV_BLOCK_RATIO = 0.08;

// 확대 배율 = 규격 출력 px ÷ 원본 안의 프레임 px. 해상도가 아니라 "얼마나 멀리서 찍었나"의 지표 (설계 §3)
export const FOV_WIDE_WARN = 1.0;
export const FOV_WIDE_BLOCK = 1.5;

// 작은 쪽 좌우·아래가 모두 이 값 이하이면 거리 부족이 아니라 좌우 쏠림으로 본다 (2026-11-02 쌍아 결정). 문안만 가른다
const FOV_ONE_SIDED_RATIO = 0.03;

/** 이탈 원인 — 'off_center'(한쪽만 이탈) | 'narrow'. 판정에는 영향 없음 */
export function fovCause(outside) {
  const oneSided = Math.min(outside.left, outside.right) <= FOV_ONE_SIDED_RATIO
    && outside.bottom <= FOV_ONE_SIDED_RATIO;
  return oneSided ? 'off_center' : 'narrow';
}

const ratio = (px, base) => +(Math.max(0, px) / base).toFixed(4);

/** frame·imageSize(같은 좌표계) → 프레임 높이·너비 대비 원본 밖 비율 0~1 */
export function frameOutside(frame, imageSize) {
  return {
    top: ratio(-frame.y, frame.h),
    bottom: ratio(frame.y + frame.h - imageSize.height, frame.h),
    left: ratio(-frame.x, frame.w),
    right: ratio(frame.x + frame.w - imageSize.width, frame.w),
  };
}

/** 좌·우·아래 최댓값 기준 ok / warn / block. 임계값 자체는 통과(초과만 상향) */
export function judgeFov(outside) {
  const worst = Math.max(outside.left, outside.right, outside.bottom);
  if (worst > FOV_BLOCK_RATIO) return 'block';
  if (worst > FOV_WARN_RATIO) return 'warn';
  return 'ok';
}

/** 확대 배율 기준 ok / warn / block. 임계값 자체는 통과 */
export function judgeWide(magnification) {
  if (magnification > FOV_WIDE_BLOCK) return 'block';
  if (magnification > FOV_WIDE_WARN) return 'warn';
  return 'ok';
}

const RANK = { ok: 0, warn: 1, block: 2 };

/**
 * 종합 판정. 수준이 높은 쪽을 택하고, 같으면 이탈(몸이 잘리는 문제)을 먼저 말한다.
 * @param frameW 규격 출력 폭 px
 * @returns {{ frame, imageSize, outside, magnification, verdict, cause }} cause: narrow | off_center | wide | null(ok)
 */
export function assessFov(frame, imageSize, frameW) {
  const outside = frameOutside(frame, imageSize);
  const magnification = +(frameW / frame.w).toFixed(3);
  const tight = judgeFov(outside);
  const wide = judgeWide(magnification);
  const verdict = RANK[tight] >= RANK[wide] ? tight : wide;
  let cause = null;
  if (verdict !== 'ok') cause = RANK[tight] >= RANK[wide] ? fovCause(outside) : 'wide';
  return { frame, imageSize, outside, magnification, verdict, cause };
}

const BLOCK_REASON = { narrow: 'fov_tight_side', off_center: 'fov_off_center', wide: 'fov_wide' };

/** block 판정의 반려 코드 (rej_{코드} 문구) */
export function fovRejectionReason(fov) {
  return BLOCK_REASON[fov.cause] || null;
}
