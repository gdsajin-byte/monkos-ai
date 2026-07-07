/**
 * BiRefNet matte 파이프라인 — IDPASS 순서 이식 (ORDER_20260707 Task A-2)
 *
 * 신경로: 원본에서 FaceMesh 감지·크롭(spec-crop) → matte API(BiRefNet) → 배경색 합성.
 * Gemini 재생성물 위 감지의 비결정성 제거 + 원본 픽셀 보존 (정체성 보존 제1원칙).
 *
 * 안전 스위치: MATTE_API_URL 미설정 시 전 함수 무동작 → 현행 Gemini 경로 그대로.
 * 실패 시 null 반환 → 호출부(server.js)가 L3 폴백(Gemini 경로)으로 강등.
 */
import sharp from 'sharp';
import { createRequire } from 'module';
import { log, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID } from './shared/config.js';
import { cropToSpec } from './spec-crop.js';

const SPECS_DATA = createRequire(import.meta.url)('./cms/specs-data.json');

const MATTE_API_URL = process.env.MATTE_API_URL || '';
const MATTE_TIMEOUT_MS = 30000; // 4060 GPU 실측 0.83s/장 — 콜드로드·전송 여유 포함
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
  return Boolean(MATTE_API_URL);
}

/** matte 엔진 예열 (fire-and-forget) — 감지·크롭과 병렬로 콜드스타트 흡수 */
export function warmupMatteEngine() {
  if (!MATTE_API_URL) return;
  fetch(`${MATTE_API_URL}/health`, { signal: AbortSignal.timeout(20000) }).catch(() => {});
}

async function callMatteApi(imageB64, bgColor) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), MATTE_TIMEOUT_MS);
  try {
    const res = await fetch(`${MATTE_API_URL}/api/matte`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageB64, bgColor }),
      signal: ctrl.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.image) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function alertMatteDown(reason) {
  const now = Date.now();
  if (!TEAM_CHAT_ID || now - lastAlertAt < ALERT_COOLDOWN_MS) return;
  lastAlertAt = now;
  sendTelegramMessage(TEAM_CHAT_ID, `🚨 *matte API 장애 — Gemini L3 폴백 가동*\n사유: ${reason}\n→ 4060/matte 서버 상태 확인 필요`, TELEGRAM_TEAM_API).catch(() => {});
}

/**
 * 신경로 전체: 원본 감지·크롭 → matte → 300dpi 스탬프.
 * 성공 시 {image, cropEngine:'facemesh', matte:true, meta}, 실패·비활성 시 null (호출부 L3 폴백).
 */
export async function matteSpecPipeline(originalB64, slug) {
  if (!MATTE_API_URL) return null;

  // ① 감지·크롭은 사용자 원본에서 — 실패(facemesh 미안착)면 신경로 포기.
  //    커버 크롭 위 매팅은 "그럴듯한" 무규격 출고라 금지 (무음 폴백 금지).
  const cropRes = await cropToSpec(originalB64, slug);
  if (!cropRes.cropped || cropRes.engine !== 'facemesh') {
    log(`[Matte] ${slug}: 원본 감지 미안착(engine=${cropRes.engine}) → Gemini 폴백`, 'WARNING');
    return null;
  }

  // ② BiRefNet 매팅 + 배경색 합성
  try {
    const bgColor = getSpecBgColor(slug);
    const data = await callMatteApi(cropRes.image, bgColor);
    // ③ 300dpi 스탬프 (fileSpec "300DPI 이상" 요건)
    const stamped = await sharp(Buffer.from(data.image, 'base64'))
      .withMetadata({ density: 300 })
      .png()
      .toBuffer();
    log(`[Matte] ${slug}: 매팅 합성 완료 bg=${bgColor} ${data.meta?.elapsedSec}s face=${cropRes.meta?.faceMM}mm`);
    return { image: stamped.toString('base64'), cropEngine: 'facemesh', matte: true, meta: { ...cropRes.meta, bgColor, matteSec: data.meta?.elapsedSec } };
  } catch (err) {
    log(`[Matte] ${slug}: matte API 실패 (${err.message}) → Gemini 폴백`, 'ERROR');
    alertMatteDown(err.message);
    return null;
  }
}
