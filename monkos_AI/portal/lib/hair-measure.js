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
const PROFILE_ROWS = 5; // 로그용 상단 행별 접촉값 (임계 재산정 근거)

// 임계 근거: COMPLETION_20261102 정수리게이트_실측전환 N·X 표 (dev 실측).
// 판정은 맨 위 1행만 본다(N). 머리는 돔이라 스치면 접촉 폭이 좁고 잘리면 넓다 — 맨 위 행 폭이 판별력이 가장 크다.
export const CROWN_CONTACT_RATIO = 0.20; // X: 맨 위 행에서 머리 폭 열 중 전경 비율

/**
 * @returns {{ hairTopRatio: number|null, contactRatio: number, rowContacts: number[], touched: boolean }}
 *   hairTopRatio = 머리끝 행 / 높이(0~1, 전경 없으면 null), contactRatio = 맨 위 행 전경 비율
 */
export async function measureTopContact(imageBuf, bgColor, colFromRatio = 0, colToRatio = 1) {
  const { data, info } = await sharp(imageBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const bg = [1, 3, 5].map((i) => parseInt(bgColor.slice(i, i + 2), 16));
  const from = Math.max(0, Math.floor(colFromRatio * W));
  const to = Math.min(W, Math.ceil(colToRatio * W));
  const cols = Math.max(1, to - from);
  const threshold = Math.max(3, Math.floor(cols * HAIR_ROW_RATIO));

  let hairRow = null, contactRatio = 0;
  const rowContacts = [];
  for (let y = 0; y < H; y++) {
    let hits = 0;
    for (let x = from; x < to; x++) {
      const i = (y * W + x) * C;
      if (Math.abs(data[i] - bg[0]) > HAIR_BG_TOLERANCE || Math.abs(data[i + 1] - bg[1]) > HAIR_BG_TOLERANCE || Math.abs(data[i + 2] - bg[2]) > HAIR_BG_TOLERANCE) hits++;
    }
    if (y === 0) contactRatio = hits / cols;
    if (y < PROFILE_ROWS) rowContacts.push(+(hits / cols).toFixed(3));
    if (hairRow === null && hits >= threshold) hairRow = y;
    if (hairRow !== null && y >= PROFILE_ROWS - 1) break;
  }
  return {
    hairTopRatio: hairRow === null ? null : +(hairRow / H).toFixed(4),
    contactRatio: +contactRatio.toFixed(4),
    rowContacts,
    touched: contactRatio >= CROWN_CONTACT_RATIO,
  };
}

const CROWN_MATTE_LONG_SIDE = 512;
const CROWN_MATTE_BG = '#00FF00'; // 측정 전용 — 흰머리·검은 머리 모두 배경과 갈리는 색
const CROWN_MATTE_TIMEOUT_MS = 5000;

/**
 * precheck 정수리 실측 — 축소본 매팅 1회 → 머리 폭 열에서 맨 위 행 접촉 판정.
 * 실패·타임아웃은 판정 없이 통과 + WARNING (추정 게이트로 되돌아가지 않는다).
 * 자체 서버 불통(backup)이면 호출하지 않는다: RunPod 콜드는 5초 안에 못 끝나고 과금만 남는다.
 * @returns {{ status: 'measured'|'failed'|'skipped_backup', touched?: boolean, ms?: number }}
 */
export async function checkCrownContact({ imageBuf, faceBox, slug, engineState, runMatte, warn, timeoutMs = CROWN_MATTE_TIMEOUT_MS }) {
  const t0 = Date.now();
  if (engineState === 'backup') {
    warn('[IDPhoto][precheck] 정수리 실측 생략 (자체 매팅 서버 불통) → 판정 없이 통과');
    return { status: 'skipped_backup' };
  }
  let timer;
  try {
    const small = await sharp(imageBuf).resize(CROWN_MATTE_LONG_SIDE, CROWN_MATTE_LONG_SIDE, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
    const r = await Promise.race([
      runMatte(small.toString('base64'), CROWN_MATTE_BG, slug),
      new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`타임아웃 ${timeoutMs}ms`)), timeoutMs); }),
    ]);
    if (!r) throw new Error('매팅 체인 실패');
    const cx = faceBox.x + faceBox.w / 2;
    const m = await measureTopContact(Buffer.from(r.image, 'base64'), CROWN_MATTE_BG, cx - faceBox.w * 0.7, cx + faceBox.w * 0.7);
    return { status: 'measured', ...m, ms: Date.now() - t0 };
  } catch (err) {
    warn(`[IDPhoto][precheck] 정수리 실측 실패 (${err.message}) → 판정 없이 통과`);
    return { status: 'failed', ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}
