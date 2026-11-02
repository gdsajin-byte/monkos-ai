/**
 * 화각 부족 판정 — fit 프레임이 원본 밖으로 나간 비율 (ORDER_20261102 미국비자_화각부족판정)
 *
 * 계산 기준은 포털이 러프 크롭을 역산한 "원본 좌표" 프레임이다. crop-engine의 outside는 입력(러프 크롭)
 * 기준이라 러프 창 경계를 원본 경계로 오인할 수 있어 판정에 쓰지 않는다.
 * 위쪽 이탈은 배경과 같은 색으로 채워져 보이지 않으므로 판정에서 제외한다.
 */

// 임계 근거: COMPLETION_20261102 화각부족판정 임계 표 (dev 실측)
export const FOV_WARN_RATIO = 0.03;
export const FOV_BLOCK_RATIO = 0.12;

// 노출 규격 정본 — 판정 코드는 공통, 고객 노출은 여기 등재된 슬러그만
const FOV_EXPOSED_SLUGS = new Set(['us-visa']);

export function fovExposed(slug) {
  return FOV_EXPOSED_SLUGS.has(slug);
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
