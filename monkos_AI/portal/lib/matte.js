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
// 카나리 게이트 (2026-07-07 작가님): 지정 슬러그만 신경로, 나머지는 현행 Gemini 유지.
// 미설정 = 전 슬러그 개방. 파일럿: kr-passport 단일 → 검증 후 확산.
const MATTE_SLUGS = (process.env.MATTE_SLUGS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const HEALTH_TIMEOUT_MS = 2500;  // 생사 프리플라이트 — 죽은 엔드포인트에 본 예산을 쓰지 않는다
// 45s: 의자뺏기 실측 29~35s 일정(2026-07-07 8회 캠페인) + 여유 — 콜드 히트도 birefnet 성공.
// 작가님 UX 예산 60s 이내. 포털 Cloud Run 타임아웃 120s(deploy.sh)와 짝 — 폴백 Gemini까지 수용.
const MATTE_TIMEOUT_MS = 45000;
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 장애 경보 폭주 방지
let lastAlertAt = 0;

/**
 * 규격 background 텍스트 → 합성 hex. 명확한 색만 매핑, 모호("단색" 등)는 흰색 보수 폴백.
 * 유색 실측치 미확보 국가는 업계 관용값 — Phase 3 국가별 교정 대상 (기안서 §5).
 */
const BG_COLOR_MAP = [
  [/밝은\s*회색|연회색/, '#F0F0F0'],
  [/파란/, '#438EDB'],
  [/빨간/, '#FF0000'],
];

export function getSpecBgColor(slug) {
  const bgText = String(SPECS_DATA[slug]?.background || '');
  // 복합 표기("흰색·파란 배경" 등)는 흰색 우선 — 제출 안전측
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
 * 준거: 새벽 실측 정상군 crown 5.4~5.7mm·눈높이 39.7~48.0% (크롭 수학 v3 개선 시 재조정).
 */
export function cropMetaWithinSpec(meta) {
  const crown = parseFloat(meta?.crownMarginMM);
  const eye = parseFloat(meta?.eyePositionPercent);
  if (Number.isFinite(crown) && crown > 10) return false;
  if (Number.isFinite(eye) && (eye < 33 || eye > 58)) return false;
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
  if (MATTE_API_KEY && isRunpod(url)) h.Authorization = `Bearer ${MATTE_API_KEY}`;
  return h;
}

// 1×1 백색 JPEG — RunPod 워커 예열용 초소형 실잡 (모델 경유 ~0.7s, 비용 ~₩0.1)
const WARMUP_IMAGE_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

/**
 * matte 엔진 예열 (fire-and-forget) — 자체 서버형은 /health, RunPod은 초소형 실잡으로
 * 워커를 미리 기동 (유휴 후 첫 활성화 30s+가 30s 예산을 초과하는 실측 대응, idleTimeout 90s와 짝).
 * 결제 전 precheck 시점 + 생성 시작 시점에서 호출.
 */
let lastWarmupAt = 0;
export function warmupMatteEngine() {
  // 60s 쿨다운 — precheck·생성이 연달아 불러도 워밍 잡이 워커를 중복 점유하지 않게
  const now = Date.now();
  if (now - lastWarmupAt < 60 * 1000) return;
  lastWarmupAt = now;
  for (const url of MATTE_API_URLS) {
    if (isRunpod(url)) {
      fetch(`${url.replace(/\/$/, '')}/run`, {
        method: 'POST',
        headers: authHeaders(url),
        body: JSON.stringify({ input: { image: WARMUP_IMAGE_B64, bgColor: '#FFFFFF' } }),
        signal: AbortSignal.timeout(10000),
      }).catch(() => {});
      continue;
    }
    fetch(`${url}/health`, { signal: AbortSignal.timeout(20000) }).catch(() => {});
  }
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
      throw new Error(body.error || data.error || (runpod ? `runpod status=${data.status}` : `HTTP ${res.status}`));
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

/**
 * 신경로 전체: 원본 감지·크롭 → matte 체인(우선순위 순회) → 300dpi 스탬프.
 * 성공 시 {image, cropEngine:'facemesh', matte:true, meta}, 실패·비활성 시 null (호출부 L3 폴백).
 */
export async function matteSpecPipeline(originalB64, slug) {
  if (!matteEnabled()) return null;
  if (!matteSlugAllowed(slug)) return null; // 카나리 밖 슬러그 → 현행 Gemini 경로

  // ① 감지·크롭은 사용자 원본에서 — 실패(facemesh 미안착)면 신경로 포기.
  //    커버 크롭 위 매팅은 "그럴듯한" 무규격 출고라 금지 (무음 폴백 금지).
  // 머리끝 실측이 잔머리에 흔들리는 비결정성 실측(2026-07-07: 동일 원본 crown 5.7 vs 22.2mm)
  // → 가드 이탈 시 1회 재크롭으로 흡수, 재이탈이면 Gemini 재프레이밍 폴백.
  const pureB64 = stripDataUri(originalB64);
  let cropRes = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    cropRes = await cropToSpec(pureB64, slug);
    if (!cropRes.cropped || cropRes.engine !== 'facemesh') {
      log(`[Matte] ${slug}: 원본 감지 미안착(engine=${cropRes.engine}) → Gemini 폴백`, 'WARNING');
      return null;
    }
    if (cropMetaWithinSpec(cropRes.meta)) break;
    if (attempt === 1) {
      log(`[Matte] ${slug}: 안착 가드 이탈(crown=${cropRes.meta?.crownMarginMM}mm eye=${cropRes.meta?.eyePositionPercent}%) → 재크롭 1회`, 'WARNING');
      continue;
    }
    log(`[Matte] ${slug}: 재크롭도 가드 이탈(crown=${cropRes.meta?.crownMarginMM}mm eye=${cropRes.meta?.eyePositionPercent}%) → Gemini 폴백`, 'WARNING');
    return null;
  }

  // ② matte 체인 순회: 4060 → RunPod → … (각각 프리플라이트 → 본 호출)
  const bgColor = getSpecBgColor(slug);
  let lastErr = 'no endpoint';
  for (const url of MATTE_API_URLS) {
    try {
      if (!(await isAlive(url))) {
        log(`[Matte] ${slug}: ${url} 프리플라이트 불통 → 다음 엔드포인트`, 'WARNING');
        continue;
      }
      const data = await callMatteApi(url, cropRes.image, bgColor);
      // ③ 300dpi 스탬프 (fileSpec "300DPI 이상" 요건)
      const stamped = await sharp(Buffer.from(data.image, 'base64'))
        .withMetadata({ density: 300 })
        .png()
        .toBuffer();
      log(`[Matte] ${slug}: 매팅 합성 완료 via=${isRunpod(url) ? 'runpod' : url} bg=${bgColor} ${data.meta?.elapsedSec}s face=${cropRes.meta?.faceMM}mm`);
      return { image: stamped.toString('base64'), cropEngine: 'facemesh', matte: true, meta: { ...cropRes.meta, bgColor, matteSec: data.meta?.elapsedSec } };
    } catch (err) {
      lastErr = err.message;
      log(`[Matte] ${slug}: ${url} 호출 실패 (${err.message}) → 다음 엔드포인트`, 'WARNING');
    }
  }

  log(`[Matte] ${slug}: matte 전 엔드포인트 실패 (${lastErr}) → Gemini 폴백`, 'ERROR');
  alertMatteDown(lastErr);
  return null;
}
