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
// 머리 덩어리 머리끝 (ORDER_20261104 여권두상_33mm재배율, 작가님 11-04 "머리 덩어리 기준"):
// 행 안에서 끊기지 않은 전경 구간의 최대 길이로 본다. 잔머리·뻗친 가닥은 행마다 1~3px짜리 점으로 흩어져
// 총합 폭(2% 기준)은 넘겨도 연속 구간은 짧다. 머리 덩어리는 돔이라 맨 위에서도 연속 구간이 바로 넓어진다
// (반지름 r인 돔에서 폭 c가 되는 깊이 = c²/8r — 512px 측정본에서 c=13px, r≈80px면 0.26px ≈ 0.05mm).
const LUMP_RUN_RATIO = 0.08;  // 열 범위(얼굴 폭 1.4배) 대비 연속 구간 최소 길이
const LUMP_RUN_MIN = 4;
const LUMP_GAP_PX = 1;        // 구간 안의 1px 구멍은 이어 본다 (매팅 노이즈)
const LUMP_ROWS = 3;          // 이 행 수만큼 연달아 넓어야 덩어리 — 가로로 누운 가닥 1줄 배제

// 임계 근거: COMPLETION_20261102 정수리게이트_실측전환 N·X 표 (dev 실측).
// 판정은 맨 위 1행만 본다(N). 머리는 돔이라 스치면 접촉 폭이 좁고 잘리면 넓다 — 맨 위 행 폭이 판별력이 가장 크다.
export const CROWN_CONTACT_RATIO = 0.20; // X: 맨 위 행에서 머리 폭 열 중 전경 비율

/**
 * @returns {{ hairTopRatio: number|null, hairTopRawRatio: number|null, contactRatio: number, rowContacts: number[], touched: boolean }}
 *   hairTopRatio = 머리 덩어리 머리끝 행 / 높이(0~1, 전경 없으면 null) — 배치 판정 기준
 *   hairTopRawRatio = 맨 위 전경 행(잔머리 포함, 로그용) / contactRatio = 맨 위 행 전경 비율
 */
export async function measureTopContact(imageBuf, bgColor, colFromRatio = 0, colToRatio = 1) {
  const { data, info } = await sharp(imageBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const bg = [1, 3, 5].map((i) => parseInt(bgColor.slice(i, i + 2), 16));
  const from = Math.max(0, Math.floor(colFromRatio * W));
  const to = Math.min(W, Math.ceil(colToRatio * W));
  const cols = Math.max(1, to - from);
  const threshold = Math.max(3, Math.floor(cols * HAIR_ROW_RATIO));

  const lumpRun = Math.max(LUMP_RUN_MIN, Math.floor(cols * LUMP_RUN_RATIO));

  let hairRow = null, lumpRow = null, lumpStreak = 0, contactRatio = 0;
  const rowContacts = [];
  for (let y = 0; y < H; y++) {
    let hits = 0, solidHits = 0, run = 0, best = 0, gap = 0;
    for (let x = from; x < to; x++) {
      const i = (y * W + x) * C;
      const diff = Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2]));
      if (diff > HAIR_BG_TOLERANCE) hits++;
      if (diff > HAIR_TOP_TOLERANCE) {
        solidHits++;
        run += gap + 1; gap = 0;
        if (run > best) best = run;
      } else if (run > 0 && gap < LUMP_GAP_PX) gap++;
      else { run = 0; gap = 0; }
    }
    if (y === 0) contactRatio = hits / cols;
    if (y < PROFILE_ROWS) rowContacts.push(+(hits / cols).toFixed(3));
    if (hairRow === null && solidHits >= threshold) hairRow = y;
    if (lumpRow === null) {
      lumpStreak = best >= lumpRun ? lumpStreak + 1 : 0;
      if (lumpStreak >= LUMP_ROWS) lumpRow = y - LUMP_ROWS + 1;
    }
    if (lumpRow !== null && y >= PROFILE_ROWS - 1) break;
  }
  // 덩어리를 못 찾으면(전경이 가는 선뿐) 기존 정의로 — 판정 누락보다 보수적으로 높게 잡는 쪽
  if (lumpRow === null) lumpRow = hairRow;
  return {
    hairTopRatio: lumpRow === null ? null : +(lumpRow / H).toFixed(4),
    hairTopRawRatio: hairRow === null ? null : +(hairRow / H).toFixed(4),
    contactRatio: +contactRatio.toFixed(4),
    rowContacts,
    touched: contactRatio >= CROWN_CONTACT_RATIO,
    matteRows: H,
  };
}

const CROWN_MATTE_LONG_SIDE = 512;
const CROWN_MATTE_BG = '#00FF00'; // 측정 전용 — 흰머리·검은 머리 모두 배경과 갈리는 색
const CROWN_MATTE_TIMEOUT_MS = 5000;

/** precheck 매팅 1행 = 원본 몇 px인가 — 매팅 입력 축소(긴 변 512, 확대 없음)에서 파생. fit은 재매팅 없이 이 값으로 같은 보정을 한다 */
export function crownMatteRowPx(width, height) {
  const k = Math.min(1, CROWN_MATTE_LONG_SIDE / Math.max(width, height));
  return height / Math.round(height * k);
}

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
// 판정 주체는 precheck이고 생성은 그 프레임을 그대로 재단한다. 이 함수는 주어진 프레임 크기에서 틀만 위로 평행 이동한다.
// 11-04부터 프레임 크기는 resolveHeadPlacement(실측 두상 재배율)가 먼저 정하고 이 함수를 부른다.
export const HAIR_PLACEMENT_SLUGS = new Set(['kr-passport', 'jp-passport']);
export const HAIR_MARGIN_MIN_MM = 0.5; // 머리 위 최소 여백 (2026-11-03 작가님)
export const EYE_RATIO_MAX = 0.48;     // 이보다 내리면 얼굴이 너무 내려간다 (2026-11-03 작가님 — 경고 상한 유지)
// 측정 정밀도 보정 (2026-11-04 쌍아 판단, 작가님 결정 '최소 여백 0.5mm' 안의 보정): 머리끝은 512px 매팅에서 재므로
// 1행이 약 0.28mm. 무료 재단 실측이 예정보다 평균 −0.3·최대 −0.5mm 좁았다(dev 00235, jemison 0.5→0.0) → 배치 목표에 매팅 2행을 더한다
export const HAIR_MARGIN_SLACK_ROWS = 2;
const EPS = 1e-9;

/**
 * 머리끝 실측으로 프레임 배치를 정한다.
 * @param frame 눈 앵커 프레임 (원본 좌표) / lines.eyeY·chinY 원본 좌표 / hairTopRatio 머리끝 행 ÷ 원본 높이
 * @returns verdict: 'pass'(그대로) | 'moved'(틀을 올림) | 'no_room'(눈 상한 안에서 안 들어옴 — 프레임 유지)
 */
export function resolveHairPlacement({ frame, lines, hairTopRatio, imageHeight, frameHmm, slackPx = 0 }) {
  const mmPerPx = frameHmm / frame.h;
  const hairTopY = hairTopRatio * imageHeight;
  const marginBeforeMm = (hairTopY - frame.y) * mmPerPx;
  const targetMm = HAIR_MARGIN_MIN_MM + slackPx * mmPerPx; // 규정 하한 + 측정 정밀도 보정
  const eyeRatio = (y) => (lines.eyeY - y) / frame.h;

  let verdict = 'pass', y = frame.y;
  if (marginBeforeMm < targetMm - EPS) {
    const wanted = hairTopY - targetMm / mmPerPx;
    if (eyeRatio(wanted) <= EYE_RATIO_MAX + EPS) { verdict = 'moved'; y = wanted; }
    else verdict = 'no_room';
  }
  const placed = verdict === 'moved' ? { ...frame, y } : frame;
  const round = (v) => +v.toFixed(2);
  return {
    verdict, frame: placed,
    marginTargetMm: round(targetMm),
    slackMm: round(slackPx * mmPerPx),
    marginBeforeMm: round(marginBeforeMm),
    marginAfterMm: round((hairTopY - y) * mmPerPx),
    eyeBeforePct: round(eyeRatio(frame.y) * 100),
    eyeAfterPct: round(eyeRatio(y) * 100),
    chinBelowMm: round((y + frame.h - lines.chinY) * mmPerPx),
  };
}

// ── 두상 재배율 (ORDER_20261104 여권두상_33mm재배율, 작가님 11-04 13:43) ──
// 두상 = 턱 ~ 실측 머리끝(덩어리). 11-03 "두상 33mm 불변(거울상 정수리)" 결정을 대체한다.
// 레퍼런스 도안(gen_reference_diagrams·gen_brand_diagrams_v5)과 같은 정의 — 매팅 머리끝 포함 두상을 목표 mm에 배율.
// 눈 앵커는 crop-engine resolvePlacement와 같은 규칙(프레임 60mm 이상 42%, 미만 43%).
export const eyeAnchorFor = (frameHmm) => (frameHmm >= 60 ? 0.42 : 0.43);

/**
 * 실측 두상으로 프레임 크기를 다시 정하고, 그 프레임에서 머리끝 배치(resolveHairPlacement)를 판정한다.
 * 얼굴 하한 가드: 거울상 두상(눈~턱 반전 = 얼굴 크기 지표, judgeMetrics 차단 기준)이 규정 하한 밑으로 가면
 * 그 지점에서 축소를 멈춘다. 상한도 같은 방식으로 막는다(대머리 등 실측 두상 < 거울상 — 얼굴 과확대 방지).
 * 위치·크기만 바꾼다(크롭 기하). 얼굴 픽셀 불변.
 * @param frame 거울상 기준 원 프레임(원본 좌표, fit-spec 역산) / lines 원본 좌표(crownY=거울상 정수리)
 * @returns null = 입력 무효(머리끝이 턱 아래 등) → 호출부가 원 프레임 유지 + WARNING
 */
export function resolveHeadPlacement({ frame, lines, hairTopRatio, imageHeight, frameHmm, headTargetMm, headMinMm, headMaxMm, slackPx = 0 }) {
  const hairTopY = hairTopRatio * imageHeight;
  const headPx = lines.chinY - hairTopY;
  const mirrorPx = lines.chinY - lines.crownY;
  if (!(headPx > 0) || !(mirrorPx > 0) || !(headTargetMm > 0)) return null;

  let h = headPx * frameHmm / headTargetMm;
  let headGuard = null;
  const mirrorAt = (fh) => mirrorPx * frameHmm / fh;
  if (Number.isFinite(headMinMm) && mirrorAt(h) < headMinMm) { h = mirrorPx * frameHmm / headMinMm; headGuard = 'face_min'; }
  else if (Number.isFinite(headMaxMm) && mirrorAt(h) > headMaxMm) { h = mirrorPx * frameHmm / headMaxMm; headGuard = 'face_max'; }

  const w = h * (frame.w / frame.h);
  const cx = Number.isFinite(lines.eyeCenterX) && lines.eyeCenterX > 0 ? lines.eyeCenterX : frame.x + frame.w / 2;
  const base = { x: cx - w / 2, y: lines.eyeY - eyeAnchorFor(frameHmm) * h, w, h };

  const r = resolveHairPlacement({ frame: base, lines, hairTopRatio, imageHeight, frameHmm, slackPx });
  // no_room이면 무료 경로가 닫히므로 프레임은 원 프레임 그대로 둔다(11-03 동작 유지 — 반려 화면 표시용)
  const placed = r.verdict === 'no_room' ? frame : r.frame;
  const round = (v) => +v.toFixed(2);
  const mm = frameHmm / placed.h;
  return {
    ...r,
    frame: placed,
    rescaled: r.verdict !== 'no_room',
    headGuard,
    headMeasuredMm: round(headPx * mm),          // 턱~덩어리 머리끝, 최종 프레임 기준
    headMirrorMm: round(mirrorPx * mm),          // 턱~거울상 정수리, 최종 프레임 기준
    headMeasuredOrigMm: round(headPx * frameHmm / frame.h), // 원(거울상) 프레임 기준 실측 두상 — 재배율 전
    marginOrigMm: round((hairTopY - frame.y) * frameHmm / frame.h),
    eyeOrigPct: round((lines.eyeY - frame.y) / frame.h * 100),
    scaleRatio: +(frame.h / placed.h).toFixed(4), // >1 = 얼굴 축소(프레임 확대)
  };
}

/** 머리끝 판정 대상·입력이 유효할 때만 true — 무효면 판정 없이 기존 프레임 */
export function hairPlacementApplies(slug, hairTopRatio) {
  return HAIR_PLACEMENT_SLUGS.has(slug) && Number.isFinite(hairTopRatio) && hairTopRatio >= 0 && hairTopRatio <= 1;
}
