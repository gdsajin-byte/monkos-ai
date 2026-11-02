/**
 * 매팅 합성본에서 피사체 상단 실측 — 측정 정의 단일 모듈 (ORDER_20261102 정수리게이트_실측전환)
 *
 * 매팅 체인은 알파가 아니라 배경색 합성본을 돌려주므로, 배경색과의 채널 차이로 전경을 판별한다.
 * 머리끝 정의는 막내2 subjectTopInMatte(worktree-makne2-kr-hairtop)와 같다: 채널 차이 15 초과 픽셀이
 * 열 범위의 2% 이상인 첫 행. 그 브랜치를 병합할 때 이 모듈로 합칠 것.
 */
import sharp from 'sharp';

const HAIR_BG_TOLERANCE = 15;
const HAIR_ROW_RATIO = 0.02;

// 임계 근거: COMPLETION_20261102 정수리게이트_실측전환 N·X 표 (dev 실측)
export const CROWN_TOP_ROWS_RATIO = 0.01; // N: 사진 높이 대비 최상단 검사 구간
export const CROWN_CONTACT_RATIO = 0.10;  // X: 그 구간의 한 행에서 머리 폭 열 중 전경 비율

/**
 * @returns {{ hairTopRatio: number|null, contactRatio: number, touched: boolean }}
 *   hairTopRatio = 머리끝 행 / 높이(0~1, 전경 없으면 null), contactRatio = 최상단 구간 행별 전경 비율의 최댓값
 */
export async function measureTopContact(imageBuf, bgColor, colFromRatio = 0, colToRatio = 1) {
  const { data, info } = await sharp(imageBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const bg = [1, 3, 5].map((i) => parseInt(bgColor.slice(i, i + 2), 16));
  const from = Math.max(0, Math.floor(colFromRatio * W));
  const to = Math.min(W, Math.ceil(colToRatio * W));
  const cols = Math.max(1, to - from);
  const threshold = Math.max(3, Math.floor(cols * HAIR_ROW_RATIO));
  const topRows = Math.max(1, Math.round(H * CROWN_TOP_ROWS_RATIO));

  let hairRow = null, contactRatio = 0;
  const rowContacts = [];
  for (let y = 0; y < H; y++) {
    let hits = 0;
    for (let x = from; x < to; x++) {
      const i = (y * W + x) * C;
      if (Math.abs(data[i] - bg[0]) > HAIR_BG_TOLERANCE || Math.abs(data[i + 1] - bg[1]) > HAIR_BG_TOLERANCE || Math.abs(data[i + 2] - bg[2]) > HAIR_BG_TOLERANCE) hits++;
    }
    if (y < topRows) {
      contactRatio = Math.max(contactRatio, hits / cols);
      rowContacts.push(+(hits / cols).toFixed(3));
    }
    if (hairRow === null && hits >= threshold) hairRow = y;
    if (hairRow !== null && y >= topRows) break;
  }
  return {
    hairTopRatio: hairRow === null ? null : +(hairRow / H).toFixed(4),
    contactRatio: +contactRatio.toFixed(4),
    rowContacts,
    touched: contactRatio >= CROWN_CONTACT_RATIO,
  };
}
