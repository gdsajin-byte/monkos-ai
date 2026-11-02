/**
 * BiRefNet matte 파이프라인 — IDPASS 순서 이식 (ORDER_20260707 Task A-2)
 *
 * 신경로: 원본에서 FaceMesh 감지·크롭(spec-crop) → matte API(BiRefNet) → 배경색 합성.
 * Gemini 재생성물 위 감지의 비결정성 제거 + 원본 픽셀 보존 (정체성 보존 제1원칙).
 *
 * 서빙 이중구조 (2026-07-07 작가님·쌍아 확정):
 *   MATTE_API_URLS = 콤마 우선순위 체인 (예: "http://4060터널,https://api.runpod.ai/v2/xxx")
 *   ① 4060 (₩0) → ② RunPod T4 flex (₩수 원) → 전부 실패 시 null → Gemini L3
 *   각 엔드포인트는 짧은 /health 프리플라이트(2.5s)로 생사 판정 후 본 호출.
 *   RunPod(api.runpod.ai) 엔드포인트는 Bearer(MATTE_API_KEY) + {input:{...}} 큐 규약 자동 적용.
 *
 * 안전 스위치: MATTE_API_URLS(또는 MATTE_API_URL) 미설정 시 전 함수 무동작 → 현행 Gemini 경로 그대로.
 */
import sharp from 'sharp';
import { createRequire } from 'module';
import { log, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID } from './shared/config.js';
import { cropToSpec } from './spec-crop.js';

const SPECS_DATA = createRequire(import.meta.url)('./cms/specs-data.json');

const MATTE_API_URLS = (process.env.MATTE_API_URLS || process.env.MATTE_API_URL || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const MATTE_API_KEY = process.env.MATTE_API_KEY || ''; // RunPod 등 인증형 엔드포인트용
const MATTE_SECRET = process.env.MATTE_SECRET || ''; // 4060 자체 서빙 인증 (X-Matte-Secret)
// 카나리 게이트 (2026-07-07 작가님): 지정 슬러그만 신경로, 나머지는 현행 Gemini 유지.
// 미설정 = 전 슬러그 개방. 파일럿: kr-passport 단일 → 검증 후 확산.
const MATTE_SLUGS = (process.env.MATTE_SLUGS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const HEALTH_TIMEOUT_MS = 2500;  // 생사 프리플라이트 — 죽은 엔드포인트에 본 예산을 쓰지 않는다
// 25s (2026-07-25 작가님 확정, 구 60s에서 하향).
// 작가님 규정: "RunPod은 4060 가동 불가 대체 영역이지 '느리면 받는다'의 영역이 아니다."
//   → 대체재에 60초씩 두 번 인내할 이유가 없다. 실패가 확정이면 빨리 알리는 편이 낫다.
// 근거: RunPod 콜드 실측 16.1s(07-25) → 25s면 콜드까지 흡수하고 그것도 넘으면 진짜 실패.
//   4060 정상 0.37s · RunPod warm 0.35s 이므로 정상 요청 무영향.
// 예산: 앞단 16.3s + 4060 큐 20s + RunPod 25×2 ≈ 86s / Cloud Run 120s.
//   구 60s는 25×2 자리에 60×2가 들어가 158s로 예산을 넘겼다 — 07-25 504의 산식.
const MATTE_TIMEOUT_MS = Number(process.env.MATTE_TIMEOUT_MS || 25000);
// 줄 서기 예산 (2026-07-25 작가님 설계) — "헬스가 살아있으면 줄 세우기이지 폴백할 이유가 없다".
// 포화(503)는 고장이 아니라 "곧 빈다"는 신호다. 표 회전 0.8초 실측 기준 16 동시의 마지막 대기가
// 약 12초이므로, 20초면 오늘 INCIDENT 규모까지 4060이 자력 흡수한다.
// RunPod 콜드스타트(30초~3분)보다 빠르다는 것이 이 예산의 근거.
// ⚠️ MATTE_TIMEOUT_MS(개별 호출 타임아웃)와는 다른 축이다. 혼동 금지.
const MATTE_QUEUE_WAIT_MS = Number(process.env.MATTE_QUEUE_WAIT_MS || 20000);
const MATTE_QUEUE_KNOCK_MS = 2000; // 서버가 Retry-After를 안 줄 때의 노크 간격
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 장애 경보 폭주 방지
let lastAlertAt = 0;
let lastBackupAlertAt = 0; // 백업 전환 알림 — '전 엔드포인트 실패' 경보와 쿨다운 키 분리

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Retry-After(초 단위 정수) → ms. 값이 없거나 HTTP-date 형식이면 null. */
function parseRetryAfterMs(headerValue) {
  const sec = Number(headerValue);
  return Number.isFinite(sec) && sec >= 0 ? sec * 1000 : null;
}

/**
 * 규격 background 텍스트 → 합성 hex. 명확한 색만 매핑, 모호("단색" 등)는 흰색 보수 폴백.
 * 유색 실측치 미확보 국가는 업계 관용값 — Phase 3 국가별 교정 대상 (기안서 §5).
 */
const BG_COLOR_MAP = [
  [/밝은\s*회색|연회색/, '#F0F0F0'],
  [/^회색$/, '#D5D5D5'],
  [/파란/, '#438EDB'],
  [/빨간/, '#FF0000'],
  [/다양/, '#FFFFFF'],
];

const BG_OVERRIDE = { 'de-passport': '#CCCCCC' };

export function getSpecBgColor(slug) {
  if (BG_OVERRIDE[slug]) return BG_OVERRIDE[slug];
  const bgText = String(SPECS_DATA[slug]?.background || '');
  if (/흰|white/i.test(bgText)) return '#FFFFFF';
  for (const [re, hex] of BG_COLOR_MAP) {
    if (re.test(bgText)) return hex;
  }
  return '#FFFFFF';
}

export function matteEnabled() {
  return MATTE_API_URLS.length > 0;
}

/**
 * 데이터 URI 프리픽스 제거 — 프론트 업로드 원본은 "data:image/png;base64,..." 형태.
 * 구경로는 Gemini 출력물(순수 base64)만 다뤄 잠복했던 버그 (2026-07-07 카나리 1호 실측 발견).
 */
export function stripDataUri(b64) {
  const s = String(b64 || '');
  return s.includes(',') ? s.slice(s.indexOf(',') + 1) : s;
}

/**
 * 규격 안착 가드 — 크롭 성공 플래그만 믿지 않는다 (2026-07-07 카나리 2호 실측:
 * 인물이 작은 와이드 원본에서 crown 16.7mm·눈높이 72.4% 크롭이 success로 반환됨).
 * 허용창 밖이면 신경로 포기 → Gemini 재프레이밍 경로가 흡수.
 * 눈높이 창은 IDPASS 정본 blocked 게이트(spec-judge.js, eye 40~48%)와 동일 수치 —
 * 비-fit 경로 가드가 다운로드 물리 게이트보다 느슨하면 blocked 범위 산출물이 그대로
 * 출고된다 (2026-07-10 적대검증 #3. 구 창 33~58은 실측 정상군 39.7~48.0% 기반 임시치였음).
 * spec-judge는 "재해석 금지 이식" 정본이라 상수 공유 대신 수치 정렬로 유지.
 */
export function cropMetaWithinSpec(meta) {
  const crown = parseFloat(meta?.crownMarginMM);
  const eye = parseFloat(meta?.eyePositionPercent);
  // crown: warn-only (기하 유도 캘리브레이션 후 재활성화 예정)
  if (Number.isFinite(crown) && crown > 10) {
    console.log(`[CropGuard] crown ${crown.toFixed(1)}mm > 10mm — warn (게이트 완화 중)`);
  }
  // eye: warn-only (배치 복원 후 캘리브레이션 완료까지)
  if (Number.isFinite(eye) && (eye < 40 || eye > 48)) {
    console.log(`[CropGuard] eye ${eye.toFixed(1)}% ∉ [40,48] — warn (게이트 완화 중)`);
  }
  return true;
}

/** 카나리 게이트 — MATTE_SLUGS 미설정이면 전 슬러그 허용 */
export function matteSlugAllowed(slug) {
  return MATTE_SLUGS.length === 0 || MATTE_SLUGS.includes(slug);
}

function isRunpod(url) {
  return /api\.runpod\.ai/i.test(url);
}

function authHeaders(url) {
  const h = { 'Content-Type': 'application/json' };
  if (isRunpod(url)) { if (MATTE_API_KEY) h.Authorization = `Bearer ${MATTE_API_KEY}`; }
  else { if (MATTE_SECRET) h['X-Matte-Secret'] = MATTE_SECRET; }
  return h;
}

// 1×1 백색 JPEG — RunPod 워커 예열용 초소형 실잡 (모델 경유 ~0.7s, 비용 ~₩0.1)
const WARMUP_IMAGE_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

/**
 * 엔진 상태 판정 (2026-10-27 DESIGN 매팅워밍조건부 §2-1) — 1순위 자체 서버 /health로 생사를 본다.
 * 'primary' = 자체 서버 정상(백업 불요) / 'backup' = 자체 서버 불통 → 백업(RunPod)이 처리.
 * 60초 캐시 — 같은 요청 흐름의 precheck·generate가 같은 판정을 공유한다. 동시 조회는 1회로 합친다.
 * 자체 서버형이 체인에 없으면(RunPod 단독 구성) 'primary' — 그 구성에선 RunPod이 정상 경로다.
 */
const ENGINE_STATE_TTL_MS = 60 * 1000;
let engineState = null;     // 'primary' | 'backup'
let engineStateAt = 0;
let engineStateProbe = null;
export function getMatteEngineState() {
  if (engineState && Date.now() - engineStateAt < ENGINE_STATE_TTL_MS) return Promise.resolve(engineState);
  if (engineStateProbe) return engineStateProbe;
  const primary = MATTE_API_URLS.find((u) => !isRunpod(u));
  if (!primary) return Promise.resolve('primary');
  engineStateProbe = isAlive(primary).then((alive) => {
    engineState = alive ? 'primary' : 'backup';
    engineStateAt = Date.now();
    return engineState;
  }).finally(() => { engineStateProbe = null; });
  return engineStateProbe;
}

/**
 * matte 엔진 예열 (fire-and-forget 가능, 판정 state 반환) — 결제 전 precheck·생성 시작 시점에서 호출.
 * 2026-10-27 조건부화: 1순위 자체 서버가 살아 있으면 RunPod 워밍을 하지 않는다(백업 전용).
 *   근거: 10-22~27 출력 62건 전부 자체 서버, RunPod 완료 +62는 전부 이 함수의 워밍 잡(과금만 발생).
 * 자체 서버 불통일 때만 RunPod에 초소형 실잡을 보내 워커를 미리 기동 (콜드 16s+를 결제·검수 시간에 흡수).
 * 자체 서버형의 예열은 getMatteEngineState()의 /health 조회가 겸한다.
 */
let lastWarmupAt = 0;
export async function warmupMatteEngine() {
  const state = await getMatteEngineState().catch(() => 'primary');
  const hasPrimary = MATTE_API_URLS.some((u) => !isRunpod(u));
  if (hasPrimary && state === 'primary') return state;
  // 60s 쿨다운 — precheck·생성이 연달아 불러도 워밍 잡이 워커를 중복 점유하지 않게
  const now = Date.now();
  if (now - lastWarmupAt < 60 * 1000) return state;
  lastWarmupAt = now;
  for (const url of MATTE_API_URLS) {
    if (!isRunpod(url)) continue;
    log(`[Matte] 백업 워밍 발사 (자체 서버 ${hasPrimary ? '불통' : '미구성'}) → RunPod /run`, 'INFO');
    fetch(`${url.replace(/\/$/, '')}/run`, {
      method: 'POST',
      headers: authHeaders(url),
      body: JSON.stringify({ input: { image: WARMUP_IMAGE_B64, bgColor: '#FFFFFF' } }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});
  }
  return state;
}

/** 생사 프리플라이트 — 4060 등 자체 서버형만. RunPod 큐형은 항상 통과. */
async function isAlive(url) {
  if (isRunpod(url)) return true;
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return res.ok;
  } catch {
    return false;
  }
}

async function callMatteApi(url, imageB64, bgColor) {
  const runpod = isRunpod(url);
  const endpoint = runpod ? `${url.replace(/\/$/, '')}/runsync` : `${url}/api/matte`;
  const payload = runpod
    ? { input: { image: imageB64, bgColor } }
    : { image: imageB64, bgColor };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MATTE_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders(url),
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json();
    // RunPod 큐 규약: {status:'COMPLETED', output:{...}} 언랩
    const body = runpod ? (data.output || {}) : data;
    if (!res.ok || (runpod && data.status !== 'COMPLETED') || !body.success || !body.image) {
      // 미완료 잡은 취소 — 좀비 큐 적재 방지 (2026-07-07 IN_QUEUE 5건 실측)
      if (runpod && data.id && data.status !== 'COMPLETED') {
        fetch(`${url.replace(/\/$/, '')}/cancel/${data.id}`, { method: 'POST', headers: authHeaders(url), signal: AbortSignal.timeout(5000) }).catch(() => {});
      }
      const err = new Error(body.error || data.error || (runpod ? `runpod status=${data.status}` : `HTTP ${res.status}`));
      // 호출부가 "포화(503)"와 "고장(그 외)"을 구분할 수 있게 상태를 실어 보낸다.
      err.status = res.status;
      err.retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'));
      throw err;
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function alertMatteDown(reason) {
  const now = Date.now();
  if (!TEAM_CHAT_ID || now - lastAlertAt < ALERT_COOLDOWN_MS) return;
  lastAlertAt = now;
  sendTelegramMessage(TEAM_CHAT_ID, `🚨 *matte 전 엔드포인트 장애 — Gemini L3 폴백 가동*\n사유: ${reason}\n→ 4060/RunPod 상태 확인 필요`, TELEGRAM_TEAM_API).catch(() => {});
}

// 백업 사유 → 팀 알림 라벨 (2026-10-27 후속 ORDER — 포화로 넘어간 건을 '불통'으로 오기하지 않게)
const BACKUP_ALERT_LABELS = { '프리플라이트 불통': 'iMac 불통', '포화 초과': 'iMac 포화', '호출 실패': 'iMac 호출 실패' };
export function backupAlertText(slug, sec, reason) {
  const label = BACKUP_ALERT_LABELS[reason] || 'iMac 불통';
  return `⚠️ 매팅 백업 전환 — ${label}, RunPod 처리 (${slug}, ${sec}s)`;
}

function alertMatteBackup(slug, sec, reason) {
  const now = Date.now();
  if (!TEAM_CHAT_ID || now - lastBackupAlertAt < ALERT_COOLDOWN_MS) return;
  lastBackupAlertAt = now;
  sendTelegramMessage(TEAM_CHAT_ID, backupAlertText(slug, sec, reason), TELEGRAM_TEAM_API).catch(() => {});
}

/** 백업(RunPod) 처리 성공 시 — 사후 집계 로그 + 팀 알림. 자체 서버를 건너뛴 사유가 있을 때만. */
function noteBackup(url, slug, reason, startedAt) {
  if (!isRunpod(url) || !reason) return;
  const sec = ((Date.now() - startedAt) / 1000).toFixed(1);
  log(`[Matte] BACKUP via=runpod reason=${reason} cold=${sec}s slug=${slug}`, 'WARNING');
  alertMatteBackup(slug, sec, reason);
}

/** 매팅 결과 → 300dpi 스탬프 PNG. 성공 경로 공용부. */
async function stampMatteResult(data, url) {
  const stamped = await sharp(Buffer.from(data.image, 'base64'))
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
  return { image: stamped.toString('base64'), matteSec: data.meta?.elapsedSec, via: isRunpod(url) ? 'runpod' : url };
}

/**
 * matte 체인 공용부 — 크롭 b64 → 엔드포인트 순회 매팅 → 300dpi 스탬프. 실패 시 null(+경보).
 *
 * 상태를 셋으로 나눈다 (2026-07-25 작가님 설계):
 *   ① health 불통  = 진짜 장애 → 대기 없이 즉시 다음 엔드포인트
 *   ② 503 포화      = 바쁘지만 곧 빈다 → Retry-After만큼 자고 다시 노크 (≤ MATTE_QUEUE_WAIT_MS)
 *   ③ 그 외 실패    = 고장 → 기존대로 1회 재시도 후 다음 엔드포인트
 * ②를 ③으로 뭉개면 살아있는 4060을 두고 RunPod 콜드(30초~3분)를 타게 된다.
 */
export async function runMatteChain(cropB64, bgColor, slug) {
  let lastErr = 'no endpoint';
  let backupReason = null; // 자체 서버를 건너뛴 사유 — 백업 전환 로그·알림용 (체인 동작에는 무관)
  for (const url of MATTE_API_URLS) {
    if (!(await isAlive(url))) {
      log(`[Matte] ${slug}: ${url} 프리플라이트 불통 → 다음 엔드포인트`, 'WARNING');
      if (!isRunpod(url)) backupReason = backupReason || '프리플라이트 불통';
      continue;
    }

    const queueStart = Date.now();
    let knocks = 0;
    let toNextEndpoint = false;

    while (!toNextEndpoint) {
      try {
        const data = await callMatteApi(url, cropB64, bgColor);
        if (knocks > 0) {
          log(`[Matte] ${slug}: ${url} 줄서기 성공 — 노크 ${knocks}회, 누적 대기 ${Date.now() - queueStart}ms`, 'INFO');
        }
        noteBackup(url, slug, backupReason, queueStart);
        return await stampMatteResult(data, url);
      } catch (err) {
        lastErr = err.message;

        // ② 포화 — 기다렸다 다시 노크. 무음 대기 금지(매 노크 기록).
        if (err.status === 503) {
          const waited = Date.now() - queueStart;
          const delay = err.retryAfterMs ?? MATTE_QUEUE_KNOCK_MS;
          if (waited + delay > MATTE_QUEUE_WAIT_MS) {
            log(`[Matte] ${slug}: ${url} 포화 대기 상한 초과 (노크 ${knocks}회, 누적 ${waited}ms > ${MATTE_QUEUE_WAIT_MS}ms) → 다음 엔드포인트`, 'WARNING');
            if (!isRunpod(url)) backupReason = backupReason || '포화 초과';
            break;
          }
          knocks += 1;
          log(`[Matte] ${slug}: ${url} 포화(503) — ${knocks}번째 노크, ${delay}ms 대기 (누적 ${waited}ms)`, 'INFO');
          await sleep(delay);
          continue;
        }

        // ③ 고장 — 기존 동작 보존(같은 URL 1회 재시도 → 실패 시 다음 엔드포인트)
        log(`[Matte] ${slug}: ${url} 호출 실패 (${err.message}) → 1회 재시도`, 'WARNING');
        try {
          const retryData = await callMatteApi(url, cropB64, bgColor);
          log(`[Matte] ${slug}: ${url} 재시도 1회 성공`, 'INFO');
          noteBackup(url, slug, backupReason, queueStart);
          return await stampMatteResult(retryData, url);
        } catch (retryErr) {
          lastErr = retryErr.message;
          log(`[Matte] ${slug}: ${url} 재시도 실패 (${retryErr.message}) → 다음 엔드포인트`, 'WARNING');
          if (!isRunpod(url)) backupReason = backupReason || '호출 실패';
        }
        toNextEndpoint = true;
      }
    }
  }
  log(`[Matte] ${slug}: matte 전 엔드포인트 실패 (${lastErr}) → 폴백`, 'ERROR');
  alertMatteDown(lastErr);
  return null;
}

/**
 * fit 프레임(원본 좌표) 기하 재단 — FaceMesh 재실행 없이 검수 확정 프레임 그대로 (WYSIWYG).
 * 프레임이 이미지 경계를 벗어나면 흰 패딩. (ORDER_20260707 크롭정밀도 Task 3)
 */
export async function renderFitCrop(originalB64, fitFrame, frameW, frameH) {
  const g = await extractFitRegion(originalB64, fitFrame, frameW, frameH);
  if (!g.padded) return g.regionScaled.toString('base64');
  const out = await sharp({ create: { width: frameW, height: frameH, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: g.regionScaled, left: g.dx, top: g.dy }]).png().toBuffer();
  return out.toString('base64');
}

/**
 * fit 프레임에서 실픽셀 영역만 추출·규격 스케일로 축소 — 매팅 입력용.
 * 패딩은 매팅 이후에 붙인다: 흰 패딩을 먼저 만들면 원본 사진과 패딩의 경계선이
 * 매팅 마스크에 전경으로 살아남아 완성본에 세로줄로 출고됨 (2026-07-11 실사고).
 * 반환 좌표(dx/dy/rw/rh)는 frameW×frameH 캔버스 기준.
 */
async function extractFitRegion(originalB64, fitFrame, frameW, frameH) {
  const buf = Buffer.from(stripDataUri(originalB64), 'base64');
  const { width: W, height: H } = await sharp(buf).metadata();
  const fx = Math.round(fitFrame.x), fy = Math.round(fitFrame.y);
  const fw = Math.round(fitFrame.w), fh = Math.round(fitFrame.h);
  if (!fw || !fh || fw < 20 || fh < 20) throw new Error('fitFrame 무효');
  const ar = fw / fh, target = frameW / frameH;
  if (Math.abs(ar - target) / target > 0.03) throw new Error('fitFrame 비율 불일치');
  const ix = Math.max(0, fx), iy = Math.max(0, fy);
  const iw = Math.min(W, fx + fw) - ix, ih = Math.min(H, fy + fh) - iy;
  if (iw <= 0 || ih <= 0) throw new Error('fitFrame이 이미지 밖');
  const padded = !(ix === fx && iy === fy && iw === fw && ih === fh);
  // 프레임→규격 캔버스 스케일을 영역에 선적용 — 매팅 페이로드를 규격 크기로 고정.
  // x/y 독립 스케일: 비율 허용오차(3%) 안에서도 규격 치수에 정확히 안착 (fill과 동일 기하)
  const sx = frameW / fw, sy = frameH / fh;
  let dx = Math.max(0, Math.round((ix - fx) * sx)), dy = Math.max(0, Math.round((iy - fy) * sy));
  let rw = Math.max(1, Math.round(iw * sx)), rh = Math.max(1, Math.round(ih * sy));
  if (dx + rw > frameW) rw = frameW - dx;
  if (dy + rh > frameH) rh = frameH - dy;
  const regionScaled = await sharp(buf).extract({ left: ix, top: iy, width: iw, height: ih })
    .resize(rw, rh, { fit: 'fill' }).png().toBuffer();
  return { regionScaled, dx, dy, rw, rh, padded };
}

/**
 * fit 확정 경로: 검수 단계에서 확정된 프레임을 기하 재단 → 매팅. FaceMesh 미재실행 = 비결정성 0.
 * 순서 = 영역 매팅 → 배경색 캔버스 합성: 패딩과 매팅 배경이 같은 색이라 이음매가 구조적으로 없음.
 * 성공 시 {image, cropEngine:'fit', matte:true, meta}, 실패 시 null (호출부 L3 폴백).
 */
export async function matteFitPipeline(originalB64, slug, fitFrame, fitMeta, frameW, frameH) {
  if (!matteEnabled() || !matteSlugAllowed(slug)) return null;
  if (!frameW || !frameH) return null;
  try {
    const g = await extractFitRegion(originalB64, fitFrame, frameW, frameH);
    const bgColor = getSpecBgColor(slug);
    const r = await runMatteChain(g.regionScaled.toString('base64'), bgColor, slug);
    if (!r) return null;
    let image = r.image;
    if (g.padded) {
      const out = await sharp({ create: { width: frameW, height: frameH, channels: 3, background: bgColor } })
        .composite([{ input: Buffer.from(r.image, 'base64'), left: g.dx, top: g.dy }])
        .withMetadata({ density: 300 }).png().toBuffer();
      image = out.toString('base64');
    }
    log(`[Matte] ${slug}: fit 확정 매팅 완료 via=${r.via} bg=${bgColor} pad=${g.padded ? 1 : 0} ${r.matteSec}s face=${fitMeta?.faceMM}mm`);
    return { image, cropEngine: 'fit', matte: true, meta: { ...(fitMeta || {}), bgColor, matteSec: r.matteSec } };
  } catch (err) {
    log(`[Matte] ${slug}: fit 경로 실패 (${err.message}) → 폴백`, 'WARNING');
    return null;
  }
}

/**
 * 신경로 전체: 원본 감지·크롭 → matte 체인(우선순위 순회) → 300dpi 스탬프.
 * 성공 시 {image, cropEngine:'insight', matte:true, meta}, 실패·비활성 시 null (호출부 L3 폴백).
 */
export async function matteSpecPipeline(originalB64, slug) {
  if (!matteEnabled()) return null;
  if (!matteSlugAllowed(slug)) return null; // 카나리 밖 슬러그 → 현행 Gemini 경로

  // ① 감지·크롭은 사용자 원본에서 — 실패(insight 미안착)면 신경로 포기.
  //    커버 크롭 위 매팅은 "그럴듯한" 무규격 출고라 금지 (무음 폴백 금지).
  // 머리끝 실측이 잔머리에 흔들리는 비결정성 실측(2026-07-07: 동일 원본 crown 5.7 vs 22.2mm)
  // → 가드 이탈 시 1회 재크롭으로 흡수, 재이탈이면 Gemini 재프레이밍 폴백.
  const pureB64 = stripDataUri(originalB64);
  let cropRes = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    cropRes = await cropToSpec(pureB64, slug);
    if (!cropRes.cropped || cropRes.engine !== 'insight') {
      log(`[Matte] ${slug}: 원본 감지 미안착(engine=${cropRes.engine}, error=${cropRes.error})`, 'WARNING');
      return cropRes.error === 'FACE_NOT_DETECTED' ? { failed: 'FACE_NOT_DETECTED' } : null;
    }
    if (cropMetaWithinSpec(cropRes.meta)) break;
    if (attempt === 1) {
      log(`[Matte] ${slug}: 안착 가드 이탈(crown=${cropRes.meta?.crownMarginMM}mm eye=${cropRes.meta?.eyePositionPercent}%) → 재크롭 1회`, 'WARNING');
      continue;
    }
    log(`[Matte] ${slug}: 재크롭도 가드 이탈(crown=${cropRes.meta?.crownMarginMM}mm eye=${cropRes.meta?.eyePositionPercent}%) → Gemini 폴백`, 'WARNING');
    return null;
  }

  // ② matte 체인 순회 (공용부): 각 엔드포인트 프리플라이트 → 본 호출 → 300dpi
  const bgColor = getSpecBgColor(slug);
  const r = await runMatteChain(cropRes.image, bgColor, slug);
  if (!r) return null;
  log(`[Matte] ${slug}: 매팅 합성 완료 via=${r.via} bg=${bgColor} ${r.matteSec}s face=${cropRes.meta?.faceMM}mm`);
  return { image: r.image, cropEngine: 'insight', matte: true, meta: { ...cropRes.meta, bgColor, matteSec: r.matteSec } };
}
