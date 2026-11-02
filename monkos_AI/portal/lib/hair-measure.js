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
// 머리끝 행은 반투명 경계를 뺀다 — 흰 배경 사진은 매팅 경계가 머리 위로 번져 15 기준이면 약 1.2mm 높게 잡힌다 (2026-11-03 실측, 밝은 두피 표본)
const HAIR_TOP_TOLERANCE = 100;
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
    let hits = 0, solidHits = 0;
    for (let x = from; x < to; x++) {
      const i = (y * W + x) * C;
      const diff = Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
      if (diff > HAIR_BG_TOLERANCE) hits++;
      if (diff > HAIR_TOP_TOLERANCE) solidHits++;
    }
    if (y === 0) contactRatio = hits / cols;
    if (y < PROFILE_ROWS) rowContacts.push(+(hits / cols).toFixed(3));
    if (hairRow === null && solidHits >= threshold) hairRow = y;
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

// ── 머리끝 배치 판정 (ORDER_20261103 여권머리끝_눈48상한) ──
// 판정 주체는 precheck이고 생성은 그 프레임을 그대로 재단한다. 두상 크기는 건드리지 않고 틀만 위로 평행 이동한다(위치 이동만, 얼굴 픽셀 불변).
export const HAIR_PLACEMENT_SLUGS = new Set(['kr-passport', 'jp-passport']);
export const HAIR_MARGIN_MIN_MM = 0.5; // 머리 위 최소 여백 (2026-11-03 작가님)
export const EYE_RATIO_MAX = 0.48;     // 이보다 내리면 얼굴이 너무 내려간다 (2026-11-03 작가님 — 경고 상한 유지)
const EPS = 1e-9;

/**
 * 머리끝 실측으로 프레임 배치를 정한다.
 * @param frame 눈 앵커 프레임 (원본 좌표) / lines.eyeY·chinY 원본 좌표 / hairTopRatio 머리끝 행 ÷ 원본 높이
 * @returns verdict: 'pass'(그대로) | 'moved'(틀을 올림) | 'no_room'(눈 상한 안에서 안 들어옴 — 프레임 유지)
 */
export function resolveHairPlacement({ frame, lines, hairTopRatio, imageHeight, frameHmm }) {
  const mmPerPx = frameHmm / frame.h;
  const hairTopY = hairTopRatio * imageHeight;
  const marginBeforeMm = (hairTopY - frame.y) * mmPerPx;
  const eyeRatio = (y) => (lines.eyeY - y) / frame.h;

  let verdict = 'pass', y = frame.y;
  if (marginBeforeMm < HAIR_MARGIN_MIN_MM - EPS) {
    const wanted = hairTopY - HAIR_MARGIN_MIN_MM / mmPerPx;
    if (eyeRatio(wanted) <= EYE_RATIO_MAX + EPS) { verdict = 'moved'; y = wanted; }
    else verdict = 'no_room';
  }
  const placed = verdict === 'moved' ? { ...frame, y } : frame;
  const round = (v) => +v.toFixed(2);
  return {
    verdict, frame: placed,
    marginBeforeMm: round(marginBeforeMm),
    marginAfterMm: round((hairTopY - y) * mmPerPx),
    eyeBeforePct: round(eyeRatio(frame.y) * 100),
    eyeAfterPct: round(eyeRatio(y) * 100),
    chinBelowMm: round((y + frame.h - lines.chinY) * mmPerPx),
  };
}

/** 머리끝 판정 대상·입력이 유효할 때만 true — 무효면 판정 없이 기존 프레임 */
export function hairPlacementApplies(slug, hairTopRatio) {
  return HAIR_PLACEMENT_SLUGS.has(slug) && Number.isFinite(hairTopRatio) && hairTopRatio >= 0 && hairTopRatio <= 1;
}
