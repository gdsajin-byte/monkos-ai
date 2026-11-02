/**
 * MONKOS Portal — monkos.ai
 *
 * 라우터 전용 서버 (Phase 1 모듈화)
 * 비즈니스 로직은 lib/ 모듈로 분리됨
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { resolveEdgeClient } from './lib/shared/edge-trust.js';

// === 공통 인프라 ===
import {
  PORT, PROJECT_ID, LOCATION, TEXT_MODEL, log, firestore,
  ALLOWED_ORIGINS, MIME_TYPES, usersCollection,
  GOOGLE_CLIENT_ID, LEMONSQUEEZY_API_KEY, TOSS_SECRET_KEY,
  TELEGRAM_BOT_TOKEN, TELEGRAM_EVENT_BOT_TOKEN, TELEGRAM_TEAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID, TEAM_CHAT_ID,
  TELEGRAM_TEAM_API, sendTelegramMessage,
  KAKAO_REST_API_KEY, KAKAO_CHANNEL_ID, LINE_CHANNEL_ID,
  LINE_MESSAGING_ACCESS_TOKEN,
  ADMIN_UIDS, AGENT_API_KEYS, NAVER_CLIENT_ID,
  parseCookies, parseJsonBody, GLOBAL_TOPUP,
} from './lib/shared/config.js';

// === 핸들러 모듈 ===
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleRedirectAuth, handleGoogleRedirectCallback, handleGoogleAuth, handleAuthToken, handleAuthVerify, handleAuthRefresh, handleVerifyCookie, handleLogout } from './lib/auth.js';
import { handleCreditsGet, handleCreditsUse, handleCreditsRefund } from './lib/credits.js';
import { handleCheckout, handleLemonSqueezyWebhook, handleTossWebhook, handleTossConfirm, handleTossDirect, handleDownloadDirect, handleTossSuccess, handleTossFail, handleDirectInit, handleDirectStatus, handleDirectFail, handleDirectDevGrant, handlePayFail, consumeGenerateQuota, refundGenerateQuota } from './lib/payments.js';
import { handleTelegramGateCode, handleTelegramMissionCode, handleConsentSns, handleMissionComplete, handleCreditsEvent } from './lib/events.js';
import { handleTelegramCSWebhook, handleTelegramEventWebhook } from './lib/telegram.js';
import { handleTelegramTeamWebhook, handleTeamNotify } from './lib/telegram-team.js';
import { handleVerifyInit } from './lib/tg-auth.js';
import { handlePassportIssue, handleUploadMission } from './lib/tg-cs.js';
import { handleKakaoChatbot } from './lib/kakao-chatbot.js';
import { handleLineWebhook } from './lib/line-chatbot.js';
import { handleWebChat, handleCoaching } from './lib/coaching.js';
import { handleHeadshotGenerate } from './lib/headshot-route.js';
import { generateIdPhoto, buildT1Prompt } from './lib/idphoto-generate.js';
import { cropToSpec, warmupCropEngine, getSpecCropParams } from './lib/spec-crop.js';
import { matteSpecPipeline, matteFitPipeline, matteEnabled, matteSlugAllowed, warmupMatteEngine, getMatteEngineState, stripDataUri, getSpecBgColor, cropMetaWithinSpec, runMatteChain } from './lib/matte.js';
import { judgeMetrics, metricsFromFit } from './lib/spec-judge.js';
import { assessFov, fovRejectionReason, fitCacheGet, fitCacheSet } from './lib/fit-fov.js';
import { checkCrownContact } from './lib/hair-measure.js';
import { trackEvent, linkIdentity } from './lib/tracking.js';
import { saveImages } from './lib/gcs-save.js';
import { handleAgentAuth, requireAdmin } from './lib/cms/admin-auth.js';
import { isDevService } from './lib/shared/env-tag.js';
import { handleDashboardSummary, handleDashboardUsers, handleDashboardUsers360, handleDashboardCredits, handleDashboardTraffic, handleDashboardCitadel, handleDashboardUserDetail, handleDashboardChannels } from './lib/cms/dashboard.js';
import { handleDashboardGsc, handleDashboardNaver, handleDashboardBing, handleDashboardPerformance } from './lib/cms/seo-dashboard.js';
import { handleBlogList, handleBlogGet, handleBlogCreate, handleBlogUpdate, handleBlogDelete } from './lib/cms/blog.js';
import { handleFaqList, handleFaqCreate, handleFaqUpdate, handleFaqDelete } from './lib/cms/faq.js';
import { handleGalleryList, handleGalleryCreate, handleGalleryUpdate, handleGalleryDelete } from './lib/cms/gallery.js';
import { handleBoardPublicList, handleBoardPublicGet, handleBoardPublicCreate, handleBoardReportCreate, handleBoardPublicDelete, handleBoardAdminList, handleBoardAdminReply, handleBoardAdminDelete, handleBoardAdminToggle } from './lib/cms/board.js';
import { handleUpload, handleImageList, handleImageDelete } from './lib/cms/upload.js';
import { handleIdphotoResults } from './lib/cms/idphoto-review.js';
import { resolveCreditSource } from './lib/credit-source.js';
import { handleAiImage, handleAiThumbnail, handleAiSuggest } from './lib/cms/ai.js';
import { handleGwansangData, handleGwansangSaju } from './lib/cms/gwansang.js';
import { handleCallscopeIngest, handleCallscopeCalls, handleCallscopeVerify, handleCallscopeTiming } from './lib/callscope/api.js';
import { handleTranslate } from './lib/cms/translate.js';
import { handleSearch } from './lib/cms/search.js';
import { renderBlogList, renderBlogPost, renderFaq, renderGallery, renderBoardList, renderBoardPost, renderBoardWrite, renderGuide, renderAiPhotoGuide, renderSitemap, renderSitemapStatic, renderSitemapSpecs, renderSitemapSpecsLang, renderSitemapBlog, renderPricing, renderSpecsList, renderSpecsDetail } from './lib/cms/render.js';
import { renderHome, handleSettingsGet, handleSettingsPut, handleLayoutGet, handleLayoutPut } from './lib/cms/home.js';
import { renderLlmsTxt } from './lib/cms/render-llms.js';
import { renderHeadshot, renderHeadshotResult } from './lib/cms/render-headshot.js';
import { BLOG_REDIRECTS } from './lib/cms/redirects.js';
import { handlePodStart, handlePodStatus, handlePodStop, handleComfyProxy } from './lib/vton/runpod.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DETECT_LONG_SIDE = 1024;
const fitCacheKey = (slug, b64) => `${slug}:${crypto.createHash('sha1').update(b64).digest('hex')}`;

/**
 * 러프 크롭 → crop-engine 기하 피팅 → 원본 좌표 역산 + 랜드마크 검증. /fit·precheck(화각 판정) 공용.
 * 신뢰 랜드마크를 못 얻으면 frame=null.
 */
async function computeFitGeometry({ buf, W, H, fbPx, spec, slug, cropEngineUrl, slog, sharp, timeoutMs = 45000 }) {
  // FaceMesh 입력 정규화 (2026-07-07 작가님: "FaceMesh에겐 얼굴이 적정 크기로 나오는 입력을 보내야")
  // — IDPASS 카메라 가이드가 강제하던 조건의 웹 재현: 얼굴 높이를 목표 px로 리사이즈해 전달
  async function buildRough(targetFaceH) {
    if (!fbPx || fbPx.w <= 10 || fbPx.h <= 10) return { buf, rx: 0, ry: 0, scale: 1 };
    const fh = fbPx.h;
    const top = Math.max(0, Math.round(fbPx.y - fh * 1.3));
    const bottom = Math.min(H, Math.round(fbPx.y + fh * 2.7));
    const cx = fbPx.x + fbPx.w / 2;
    const winH = bottom - top;
    const winW = Math.min(W, Math.round(winH * (spec.frameW / spec.frameH) * 1.4));
    const left = Math.max(0, Math.min(W - winW, Math.round(cx - winW / 2)));
    if (winH < 50 || winW < 50) return { buf, rx: 0, ry: 0, scale: 1 };
    const sc = Math.min(2, targetFaceH / fh); // 얼굴을 targetFaceH px로 (업스케일은 2배 한도)
    const outW = Math.max(64, Math.round(winW * sc));
    const outH = Math.max(64, Math.round(winH * sc));
    const b = await sharp(buf).extract({ left, top, width: winW, height: winH })
      .resize(outW, outH, { fit: 'fill' }).jpeg({ quality: 92 }).toBuffer(); // PNG 대비 전송량 축소 — 왕복이 지연의 주 구간 (2026-11-02 구간 계측)
    return { buf: b, rx: left, ry: top, scale: sc };
  }
  // ② crop-engine 기하 피팅 — 정규화 입력, 랜드마크 해부학 검증, 실패 시 스케일 바꿔 1회 재시도.
  // 사일런트 미스(감지 성공 플래그 + 쓰레기 좌표)는 검증으로만 잡힌다 — 엉뚱한 가이드 절대 금지.
  let frame = null, lines = null, gate = null;
  for (const targetFaceH of [280, 200]) {
    const rough = await buildRough(targetFaceH);
    const fitRes = await fetch(`${cropEngineUrl}/api/fit-spec`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: rough.buf.toString('base64'), spec, hairScan: false }),
      signal: AbortSignal.timeout(timeoutMs),
    }).then((r) => r.json()).catch(() => null);
    if (!fitRes || !fitRes.success || !fitRes.detected) continue;
    const sc = rough.scale;
    const cand = {
      frame: { x: fitRes.frame.x / sc + rough.rx, y: fitRes.frame.y / sc + rough.ry, w: fitRes.frame.w / sc, h: fitRes.frame.h / sc },
      lines: {
        crownY: fitRes.lines.crownY / sc + rough.ry,
        eyeY: fitRes.lines.eyeY / sc + rough.ry,
        chinY: fitRes.lines.chinY / sc + rough.ry,
        hairTopY: (fitRes.lines.hairTopY ?? fitRes.lines.crownY) / sc + rough.ry,
        eyeCenterX: (fitRes.lines.eyeCenterX ?? 0) / sc + rough.rx,
      },
    };
    // FaceMesh 자체 정합으로 사일런트 미스 판정 — Gemini faceBox는 러프 크롭 산정에만 사용
    const faceH = cand.lines.chinY - cand.lines.crownY;
    const eyeChinRatio = (cand.lines.chinY - cand.lines.eyeY) / (faceH || 1);
    const ok = faceH > 30 && eyeChinRatio > 0.35 && eyeChinRatio < 0.70;
    if (ok) { frame = cand.frame; lines = cand.lines; gate = fitRes.gate || null; break; }
    slog(`[Fit] ${slug}: 랜드마크 검증 이탈 (targetFaceH=${targetFaceH}, faceH=${Math.round(faceH)}, eyeChinRatio=${eyeChinRatio.toFixed(3)}) → 재시도`);
  }
  return { frame, lines, gate };
}

async function normalizeImage(rawBase64) {
  const { default: sharp } = await import('sharp');
  const raw = Buffer.from(rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64, 'base64');
  try {
    const buf = await sharp(raw)
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const { width, height } = await sharp(buf).metadata();
    return { buf, b64: buf.toString('base64'), width, height, rawBase64, degraded: false };
  } catch (err) {
    // ⚠️ 폴백은 "디코드 실패"다 — 무음으로 두지 않는다 (2026-07-25 §11-2).
    // 구 코드는 크기를 sharp(raw).metadata()로 구했다. metadata()는 헤더만 읽으므로 픽셀을 못 여는
    // 파일(HEVC HEIC 등)도 600x800을 돌려주고, 그 때문에 호출자의 `!width || !height` 가드가 통과했다.
    // → 헤더가 아니라 디코드 성공 여부로 판정하도록 degraded 플래그를 실어 보낸다.
    log(`[normalizeImage] sharp 디코드 실패 (${err.message}) → degraded 반환`, 'WARNING');
    const b64 = rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64;
    return { buf: raw, b64, width: 0, height: 0, rawBase64, degraded: true, decodeError: err.message };
  }
}

// ⚠️ 미러 동기 의무: edge/worker.mjs effectiveLang()이 이 함수를 그대로 미러한다 (엣지 캐시 키의
// 언어 차원 — 2026-08-24 쌍아 P1 심사). 판정 순서·값을 바꾸면 워커도 동시 수정할 것.
function detectLang(req) {
  const urlMatch = req.url.match(/^\/(ja|en)(\/|$|\?)/);
  if (urlMatch) return urlMatch[1];

  const cookies = parseCookies(req.headers.cookie);
  if (cookies.monkos_lang && ['ko', 'ja', 'en', 'es'].includes(cookies.monkos_lang)) {
    return cookies.monkos_lang;
  }

  const accept = (req.headers['accept-language'] || '').toLowerCase();
  if (accept.startsWith('ja')) return 'ja';
  if (accept.startsWith('en')) return 'en';
  return 'ko';
}

function detectPaymentRegion(req) {
  // CF 엣지 경유 시 Worker가 전달한 국가를 신뢰 (피어 CF 대역 검증 — edge-trust.js)
  const edge = resolveEdgeClient(req);
  if (edge.trusted && edge.country) return edge.country === 'KR' ? 'kr' : 'global';
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const geo = geoip.lookup(ip);
  return (geo?.country === 'KR') ? 'kr' : 'global';
}

/**
 * 인메모리 IP 레이트리밋 (버킷별 윈도 카운터)
 * Cloud Run 인스턴스별 독립 — dev 검증 기준 방어, prod 다중 인스턴스에선 완화됨.
 * @returns true = 허용, false = 초과(429 처리 필요)
 */
function checkRateLimit(req, bucket, limit, windowMs = 60000) {
  // XFF는 최우측 값 사용 — Cloud Run(GFE)이 실제 클라이언트 IP를 우측에 append.
  // 최좌측은 클라이언트 임의 주입 가능(스푸핑)이라 버킷 키로 쓰면 레이트리밋이 무력화됨 (2026-07-10 리뷰 확정).
  // CF 엣지 경유 시 최우측 = CF 이그레스 IP → 유저 간 버킷 충돌. 신뢰 검증된 실클라이언트 IP로 대체 (2026-08-24).
  const edge = resolveEdgeClient(req);
  const xff = req.headers['x-forwarded-for'];
  const ip = edge.ip || (xff ? xff.split(',').pop().trim() : '') || req.socket.remoteAddress;
  const now = Date.now();
  if (!global._rateLimits) global._rateLimits = {};
  const key = `${bucket}:${ip}`;
  const rl = global._rateLimits[key] || { count: 0, reset: now + windowMs };
  if (now > rl.reset) { rl.count = 0; rl.reset = now + windowMs; }
  rl.count++;
  global._rateLimits[key] = rl;
  return rl.count <= limit;
}

/**
 * T0 무료 쿼터 (kr-passport 파일럿 — 경로③ 작가님 직접 지시 2026-07-10)
 * 서명 쿠키가 정본(Cloud Run 다중 인스턴스 무관), 인메모리 IP 카운터는 쿠키 삭제 우회의 백스톱.
 * 날짜는 KST 기준 — 무료 3회/일의 "일"은 한국 자정에 리셋.
 */
const FREE_DAILY_CAP = process.env.FREE_QUOTA_BYPASS === '1' ? 999999 : 3;
// T1 전 슬러그 개방 (2026-07-13 작가님 승인 — kr-passport 파일럿 졸업). 상수는 축소 재롤백 대비 존치, isT1Path에서 미참조.
const FREE_PILOT_SLUGS = new Set(['kr-passport']);
function freeQuotaSign(payload) {
  const secret = process.env.AUTH_SECRET || process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url').slice(0, 16);
}
function kstToday() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function readFreeQuota(req) {
  const today = kstToday();
  const raw = parseCookies(req.headers.cookie).monkos_free;
  if (!raw) return { date: today, count: 0 };
  const [date, countStr, sig] = raw.split('.');
  if (!date || !countStr || !sig || freeQuotaSign(`${date}:${countStr}`) !== sig) return { date: today, count: 0 };
  if (date !== today) return { date: today, count: 0 };
  const count = parseInt(countStr, 10);
  return { date, count: Number.isFinite(count) && count >= 0 ? count : 0 };
}
function freeQuotaCookie(date, count) {
  // Domain 미지정(host-only) — dev(run.app)·prod(monkos.ai) 양쪽에서 유효.
  // HttpOnly 미적용: 클라가 잔여 횟수 표시용으로 읽는다. 쿠키는 UX 힌트 — 정본은 Firestore(아래).
  return `monkos_free=${date}.${count}.${freeQuotaSign(`${date}:${count}`)};Path=/;Max-Age=93600;SameSite=Lax`;
}
/**
 * 무료 쿼터 서버 정본 — Firestore 원자 트랜잭션 (2026-07-10 적대 리뷰 HIGH 대응).
 * 쿠키 삭제·XFF 회전으로도 우회 불가: 키 = sid+IP 해시(개인) + 날짜 전역 총량(원가 하드캡).
 * 선차감 방식 — 생성 실패(FREE_UNAVAILABLE) 시 refundFreeQuota로 반환. 멀티탭 레이스도 원자성으로 해소.
 * Firestore 장애 시 null 반환 → 쿠키+IP 백스톱만으로 진행(가용성 우선, WARNING 로그).
 */
// Cloud Run 요청 예산(120s) 대비 전달 판정 임계. 이 시간을 넘겨 완성된 산출물은
// 유저에게 닿지 않았다고 보고 소모분을 반환한다 (2026-07-25 INCIDENT 대응).
const GEN_DELIVERY_DEADLINE_MS = Number(process.env.GEN_DELIVERY_DEADLINE_MS || 115000);
const FREE_GLOBAL_DAILY_CAP = 300; // 전역 일일 상한 — 최악 매팅 원가 ~₩6,000/일
function freeQuotaKey(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (xff ? xff.split(',').pop().trim() : '') || req.socket.remoteAddress || '';
  const sid = parseCookies(req.headers.cookie).monkos_sid || '';
  return crypto.createHash('sha256').update(`${ip}|${sid}`).digest('hex').slice(0, 24);
}
async function consumeFreeQuota(req) {
  const date = kstToday();
  const key = freeQuotaKey(req);
  try {
    const userRef = firestore.collection('free_quota').doc(`${date}_${key}`);
    const globalRef = firestore.collection('free_quota').doc(`${date}_GLOBAL`);
    return await firestore.runTransaction(async (tx) => {
      const [u, g] = await Promise.all([tx.get(userRef), tx.get(globalRef)]);
      const uc = u.exists ? (u.data().count || 0) : 0;
      const gc = g.exists ? (g.data().count || 0) : 0;
      if (gc >= FREE_GLOBAL_DAILY_CAP) return { allowed: false, global: true };
      if (uc >= FREE_DAILY_CAP) return { allowed: false, global: false };
      tx.set(userRef, { count: uc + 1, updatedAt: new Date() }, { merge: true });
      tx.set(globalRef, { count: gc + 1, updatedAt: new Date() }, { merge: true });
      return { allowed: true, count: uc + 1 };
    });
  } catch (e) {
    log(`[FreeQuota] Firestore 트랜잭션 실패 — 쿠키 백스톱으로 진행 (${e.message})`, 'WARNING');
    return null;
  }
}
async function refundFreeQuota(req) {
  const date = kstToday();
  const key = freeQuotaKey(req);
  try {
    const userRef = firestore.collection('free_quota').doc(`${date}_${key}`);
    const globalRef = firestore.collection('free_quota').doc(`${date}_GLOBAL`);
    await firestore.runTransaction(async (tx) => {
      const [u, g] = await Promise.all([tx.get(userRef), tx.get(globalRef)]);
      if (u.exists) tx.set(userRef, { count: Math.max(0, (u.data().count || 0) - 1) }, { merge: true });
      if (g.exists) tx.set(globalRef, { count: Math.max(0, (g.data().count || 0) - 1) }, { merge: true });
    });
  } catch (e) {
    log(`[FreeQuota] 반환 실패 (무시): ${e.message}`, 'WARNING');
  }
}

// 우리 자동화(iMac 브리핑 프로브 curl -A monkos-probe)는 계측 적재 제외 (2026-10-28)
const INTERNAL_PROBE_UA = 'monkos-probe';
function isInternalProbe(req) {
  return (req.headers['user-agent'] || '').includes(INTERNAL_PROBE_UA);
}

/**
 * 엣지 중계 page_view 한도 초과 = 사이트맵 순회 크롤러로 판정 (2026-10-28 track 429 원인 확정).
 * IP 원문 대신 해시 앞 8자로 IP당 분 1회만 기록.
 */
function logBotSuspect(ip, req) {
  const hash = crypto.createHash('sha256').update(String(ip || '')).digest('hex').slice(0, 8);
  if (!global._botSuspectLogged) global._botSuspectLogged = {};
  const now = Date.now();
  if (now - (global._botSuspectLogged[hash] || 0) < 60000) return;
  global._botSuspectLogged[hash] = now;
  const asn = String(req?.headers?.['x-monkos-client-asn'] || '').slice(0, 12);
  const asOrg = String(req?.headers?.['x-monkos-client-asorg'] || '').slice(0, 80);
  log(`[track] bot_suspect ip#${hash} asn=${asn || '-'} org=${asOrg || '-'} — 엣지 page_view 분당 한도 초과, 204·무적재`, 'WARNING');
}

function trackPageView(req) {
  if (isInternalProbe(req)) return;
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const utmParams = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const val = urlObj.searchParams.get(key);
    if (val) utmParams[key] = val;
  }
  trackEvent({
    eventName: 'page_view',
    userId: req.userId || null,
    sessionId: req.sessionId,
    pagePath: urlObj.pathname,
    lang: req.lang,
    region: req.paymentRegion,
    service: 'portal',
    referer: req.headers.referer || null,
    userAgent: req.headers['user-agent'] || null,
    ipCountry: req.paymentRegion,
    params: Object.keys(utmParams).length > 0 ? utmParams : null,
  }).catch(() => {});
}

// === HTTP 서버 ===
const httpServer = createServer(async (req, res) => {
  // 보안 헤더
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // CORS
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 세션·언어·결제권역 식별은 메서드 무관 — GET 한정이던 구 구조에선 모든 POST 핸들러의
  // 서버측 trackEvent가 req.sessionId/req.paymentRegion을 잃었다 (2026-07-10 적대검증 #1).
  // 쿠키 발급(Set-Cookie)은 종전대로 GET 페이지 응답에서만.
  req.lang = detectLang(req);
  req.paymentRegion = detectPaymentRegion(req);
  const cookies = parseCookies(req.headers.cookie);
  req.sessionId = cookies.monkos_sid || null;

  if (req.method === 'GET') {
    const setCookies = [];
    if (cookies.monkos_lang !== req.lang) {
      setCookies.push(`monkos_lang=${req.lang};Domain=.monkos.ai;Path=/;Max-Age=31536000;SameSite=Lax`);
    }
    if (!cookies.monkos_sid) {
      const sid = crypto.randomUUID();
      setCookies.push(`monkos_sid=${sid};Domain=.monkos.ai;Path=/;Max-Age=63072000;SameSite=Lax`);
      req.sessionId = sid;
    }
    if (setCookies.length > 0) {
      res.setHeader('Set-Cookie', setCookies);
    }
  }

  const urlPath = req.url?.split('?')[0];

  // === 헬스체크 ===
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'monkos-portal', timestamp: new Date().toISOString() }));
    return;
  }

  // === 가입자 통계 (admin 전용) ===
  if (req.url === '/api/stats' && req.method === 'GET') {
    if (!requireAdmin(req, res)) return;
    try {
      const snapshot = await usersCollection.count().get();
      const totalUsers = snapshot.data().count;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ totalUsers, timestamp: new Date().toISOString() }));
    } catch (err) {
      log(`[Stats] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
    }
    return;
  }

  // === [DEPRECATED] ===
  if (req.url === '/api/credits/share-bonus' && req.method === 'POST') {
    log('[Credits] share-bonus 호출 시도 (deprecated)');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '이 엔드포인트는 더 이상 사용되지 않습니다' }));
    return;
  }
  if (req.url?.startsWith('/api/telegram-bonus/') && (req.method === 'GET' || req.method === 'POST')) {
    log(`[TG-Bonus] deprecated 호출: ${req.url}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '이 엔드포인트는 더 이상 사용되지 않습니다' }));
    return;
  }

  // === 인증 (Auth) ===
  if (req.url === '/auth/kakao' || req.url?.startsWith('/auth/kakao?')) return handleKakaoAuth(req, res);
  if (req.url?.startsWith('/auth/kakao/callback')) return handleKakaoCallback(req, res);
  if (req.url === '/auth/line' || req.url?.startsWith('/auth/line?')) return handleLineAuth(req, res);
  if (req.url?.startsWith('/auth/line/callback')) return handleLineCallback(req, res);
  if (req.url === '/auth/google' || req.url?.startsWith('/auth/google?')) return handleGoogleRedirectAuth(req, res);
  if (req.url?.startsWith('/auth/google/callback')) return handleGoogleRedirectCallback(req, res);
  if (urlPath === '/api/auth/google' && req.method === 'POST') return handleGoogleAuth(req, res);
  if (urlPath === '/api/auth/token' && req.method === 'POST') return handleAuthToken(req, res);
  if (urlPath === '/api/auth/verify' && req.method === 'GET') return handleAuthVerify(req, res);
  if (urlPath === '/api/auth/verify-cookie' && req.method === 'GET') return handleVerifyCookie(req, res);
  if (urlPath === '/api/auth/refresh' && req.method === 'POST') return handleAuthRefresh(req, res);
  if (urlPath === '/api/auth/logout' && req.method === 'POST') return handleLogout(req, res);

  // === 에이전트 인증 ===
  if (urlPath === '/auth/agent' && req.method === 'POST') return handleAgentAuth(req, res);

  // === 크레딧 ===
  if (req.url?.startsWith('/api/credits') && req.method === 'GET' && urlPath === '/api/credits') return handleCreditsGet(req, res);
  if (urlPath === '/api/credits/topup-products' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ products: GLOBAL_TOPUP }));
  }
  if (urlPath === '/api/credits/use' && req.method === 'POST') return handleCreditsUse(req, res);
  if (urlPath === '/api/credits/refund' && req.method === 'POST') return handleCreditsRefund(req, res);
  if (urlPath === '/api/credits/mission-complete' && req.method === 'POST') return handleMissionComplete(req, res);
  if (urlPath === '/api/credits/event' && req.method === 'POST') return handleCreditsEvent(req, res);

  // === AI 헤드샷 생성 (결제 게이트 — paymentToken 또는 로그인 크레딧, lib/headshot-route.js) ===
  if (urlPath === '/api/headshot/generate' && req.method === 'POST') {
    if (!checkRateLimit(req, 'hs-generate', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    return handleHeadshotGenerate(req, res);
  }

  // === 증명사진 규격 검수 (무료 — IP 레이트리밋만) ===
  // 퍼널 줄서기 (2026-07-07 작가님: RunPod 단일 집중 — 페이지 진입 시점부터 워커 의자 확보)
  // 진입→업로드→precheck→생성으로 이어지는 동안 워밍 잡 연쇄(60s 쿨다운)가 의자를 유지한다.
  if (urlPath === '/api/matte/warmup' && (req.method === 'GET' || req.method === 'POST')) {
    if (!checkRateLimit(req, 'matte-warmup', 20)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'rate limited' }));
    }
    const warmSlug = new URL(req.url, `http://${req.headers.host}`).searchParams.get('slug') || '';
    if (matteEnabled() && matteSlugAllowed(warmSlug)) warmupMatteEngine();
    res.writeHead(204);
    return res.end();
  }


  // === 프레임 피팅 + 비전 검수 (ORDER_20260707 크롭정밀도 Task 3) ===
  // 업로드 원본 → (faceBox 러프 크롭) → crop-engine 기하 피팅 → Gemini 비전 검수 → 가이드 좌표 반환.
  // "만들기"는 이 좌표를 기하 재단만 하므로 (FaceMesh 재실행 없음) 가이드 = 결과물 (WYSIWYG).
  if (urlPath === '/api/idphoto/fit' && req.method === 'POST') {
    if (!checkRateLimit(req, 'fit', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    try {
      const { parseJsonBody, log: slog } = await import('./lib/shared/config.js');
      const { default: sharp } = await import('sharp');
      const body = await parseJsonBody(req);
      const { image, slug, faceBox } = body;
      if (!image || !slug) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'image, slug 필수' }));
      }
      if (!matteEnabled() || !matteSlugAllowed(slug)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, code: 'NOT_AVAILABLE' }));
      }
      const spec = getSpecCropParams(slug);
      if (!spec) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '미지원 규격' }));
      }
      const norm = await normalizeImage(image);
      if (norm.degraded || !norm.width || !norm.height) { // §11-2: 디코드 실패 이미지로 프레임 계산 금지
        slog(`[Fit] ${slug}: 디코드 실패로 명시 반려`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: '이미지를 해석할 수 없습니다. JPG 또는 PNG로 올려주세요.', code: 'DECODE_FAILED' }));
      }
      const buf = norm.buf;
      const { width: W, height: H } = { width: norm.width, height: norm.height };

      // ① 얼굴 검출 → 러프 크롭 창 — FaceMesh 안정 입력 (사일런트 미스 방지). 얼굴높이 4배 창.
      // 1순위 SCRFD(crop-engine /api/detect, 정규화 프레임 절대픽셀 — 2026-07-08 비교실측 채택):
      //   Gemini 박스의 흔들림(카나리 7호·금일 오배치)이 뿌리라 검출을 결정론 엔진으로 교체.
      // 폴백 legacy = 클라이언트 전달 Gemini faceBox (비율 0~1 정본). FACE_DETECT_ENGINE=legacy로 원복.
      const CROP_ENGINE_URL = process.env.CROP_ENGINE_URL || '';
      const cachedFit = fitCacheGet(fitCacheKey(slug, norm.b64));
      if (cachedFit) slog(`[Fit] ${slug}: precheck 기하 재사용 (검출·피팅 생략)`);
      let rx = 0, ry = 0, roughScale = 1, roughBuf = buf;
      let fbPx = null;
      let detectSrc = 'none';
      if (!cachedFit && (process.env.FACE_DETECT_ENGINE || 'scrfd') !== 'legacy' && CROP_ENGINE_URL) {
        try {
          const det = await fetch(`${CROP_ENGINE_URL}/api/detect`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: norm.b64 }),
            signal: AbortSignal.timeout(15000),
          }).then((r) => r.json());
          if (det && det.success && Array.isArray(det.faces) && det.faces.length > 0 && det.faces[0].score >= 0.45) {
            const bb = det.faces[0].bbox;
            fbPx = { x: bb[0], y: bb[1], w: bb[2] - bb[0], h: bb[3] - bb[1] };
            detectSrc = 'scrfd';
            if (det.faces.length > 1) slog(`[Fit] ${slug}: 다인 검출 ${det.faces.length}명 (최고점 사용) — 게이트 후속 과제`);
          }
        } catch (de) {
          slog(`[Fit] ${slug}: SCRFD 검출 실패 (${de.message}) → legacy faceBox 폴백`);
        }
      }
      if (!fbPx && faceBox && faceBox.w > 0 && faceBox.h > 0) {
        const frac = (faceBox.x <= 1.5 && faceBox.y <= 1.5 && faceBox.w <= 1.5 && faceBox.h <= 1.5);
        fbPx = frac
          ? { x: faceBox.x * W, y: faceBox.y * H, w: faceBox.w * W, h: faceBox.h * H }
          : { x: faceBox.x, y: faceBox.y, w: faceBox.w, h: faceBox.h };
        detectSrc = 'legacy';
      }
      const { frame, lines, gate } = cachedFit || await computeFitGeometry({ buf, W, H, fbPx, spec, slug, cropEngineUrl: CROP_ENGINE_URL, slog, sharp });
      if (!frame) {
        slog(`[Fit] ${slug}: 정규화·재시도 후에도 신뢰 랜드마크 확보 실패 → fit 포기 (기존 경로 폴백)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, code: 'FIT_SANITY' }));
      }
      const frameInitial = { ...frame };
      const fov = assessFov(frame, { width: W, height: H }, spec.frameW);
      const { outside } = fov;
      slog(`[Fit] ${slug}: 화각 outside=${JSON.stringify(outside)} mag=${fov.magnification} verdict=${fov.verdict} cause=${fov.cause}`);

      // ③ 코드 소견 — metrics 기반 (Gemini 비전 퇴출 2026-07-09)
      let vision = null;
      const metrics = metricsFromFit(frame, lines, spec);
      const codedNote = (function() {
        if (!frame || !lines) return null;
        if (metrics.topMm < 2) return '머리 위 여백이 부족합니다. 헤어 볼륨이 큰 경우 다른 사진을 권장합니다.';
        if (metrics.topMm > 6) return '머리 위 공간이 넉넉합니다.';
        if (metrics.bottomMm < 4) return '어깨선 여백이 좁습니다.';
        return null;
      })();
      if (codedNote) vision = { note: codedNote };

      // ④ IDPASS 정본 판정표
      const judge = judgeMetrics(metrics, spec);
      const meta = {
        faceMM: String(metrics.faceMm), crownMarginMM: String(metrics.topMm),
        eyePositionPercent: (metrics.eyeRatio * 100).toFixed(1),
      };
      // gate 기반 postcheck
      const poseCheck = {};
      if (gate) {
        poseCheck.roll = { value: gate.rollDeg, ok: Math.abs(gate.rollDeg) <= 15 };
        poseCheck.yaw = { value: gate.yawRatio, ok: Math.abs(gate.yawRatio) <= 0.20 };
        poseCheck.eyeOpen = { value: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1), ok: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1) > 0.10 };
        // 0.15 → 0.22 완화 (2026-07-10 작가님 실기기 오탐 2건 — 입 다문 사진이 warn. 실측값은 아래 slog gate.mouth로 축적)
        poseCheck.mouthOpen = { value: gate.mouthOpen, ok: (gate.mouthOpen || 0) < 0.22 };
      }
      slog(`[Fit] ${slug}: face=${metrics.faceMm}mm top=${metrics.topMm}mm btm=${metrics.bottomMm}mm eye=${(metrics.eyeRatio * 100).toFixed(1)}% judge=${judge.blocked ? 'BLOCKED' : judge.face + '/' + judge.eye} vision=${vision ? (vision.note || 'ok') : 'skip'} detect=${detectSrc}${gate ? ` gate={mouth:${gate.mouthOpen},eyeL:${gate.eyeOpenL},eyeR:${gate.eyeOpenR},roll:${gate.rollDeg},yaw:${gate.yawRatio}}` : ''}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true, frame, frameInitial, outside, fov, lines, gate, poseCheck, imageSize: { width: W, height: H }, meta, metrics, judge, vision,
        spec: { frameW: spec.frameW, frameH: spec.frameH, frameHmm: spec.frameHmm, headHeightMin: spec.headHeightMinMm || spec.faceMinMm, headHeightMax: spec.headHeightMaxMm || null, faceTargetMm: spec.faceTargetMm },
      }));
    } catch (err) {
      log(`[Fit] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '프레임 피팅 중 오류', code: 'INTERNAL_ERROR' }));
    }
  }

  if (urlPath === '/api/idphoto/precheck' && req.method === 'POST') {
    if (!checkRateLimit(req, 'precheck', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    try {
      const { parseJsonBody, log: slog } = await import('./lib/shared/config.js');
      const body = await parseJsonBody(req);
      if (!body.image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지 필수' }));
      }
      // === 코드 게이트 (2026-07-08 검수 코드화 — Gemini 비전 퇴출, 작가님 확정) ===
      // SCRFD 검출 + 픽셀 통계. 하드컷: 얼굴무/다인/과소/과대각도/암흑. 그림자 등은 관측 로그 (임계 실측 후 승격).
      const t0 = Date.now();
      // 엔진 생사(1순위 자체 서버 /health, 60s 캐시)를 검수와 병렬로 조회 — 응답 engineReady 용 (2026-10-27)
      const enginePromise = matteEnabled() ? getMatteEngineState().catch(() => 'primary') : Promise.resolve('primary');
      const norm = await normalizeImage(body.image);
      const timings = { normalize: Date.now() - t0 };
      // 디코드가 선행 실패했으면 fail-open 금지 — "fit이 재검출·방어한다"는 전제는 픽셀을 못 여는
      // 이미지에 성립하지 않는다. 검출 실패를 측정성 통과로 흘려보내면 유저는 깨진 사진을 들고
      // 유료 생성까지 진행한다 (2026-07-25 §11-2).
      if (norm.degraded || !norm.width || !norm.height) {
        slog(`[IDPhoto][precheck] 디코드 실패로 명시 반려${norm.decodeError ? ` (${String(norm.decodeError).split('\n')[0]})` : ''}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지를 해석할 수 없습니다. JPG 또는 PNG로 올려주세요.', code: 'DECODE_FAILED' }));
      }
      const CROP_ENGINE_URL = process.env.CROP_ENGINE_URL || '';
      let det = null;
      const tDetect = Date.now();
      try {
        // 검출은 긴 변 1024px 축소본으로 — 전송량 축소, 좌표는 정규화 프레임으로 되돌린다 (2026-11-02 구간 계측)
        const { default: sharpDet } = await import('sharp');
        const detBuf = await sharpDet(norm.buf).resize(DETECT_LONG_SIDE, DETECT_LONG_SIDE, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
        const detMeta = await sharpDet(detBuf).metadata();
        det = await fetch(`${CROP_ENGINE_URL}/api/detect`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: detBuf.toString('base64') }),
          signal: AbortSignal.timeout(15000),
        }).then((r) => r.json());
        const detK = norm.width / detMeta.width;
        if (det && Array.isArray(det.faces)) {
          for (const f of det.faces) {
            f.bbox = f.bbox.map((v) => v * detK);
            if (Array.isArray(f.kps)) f.kps = f.kps.map(([x, y]) => [x * detK, y * detK]);
          }
        }
      } catch (de) {
        slog(`[IDPhoto][precheck] SCRFD 불가 (${de.message}) → fail-open (fit이 재검출·방어)`);
      }
      timings.detect = Date.now() - tDetect;
      const tStats = Date.now();
      let measurable = true, reason = null, faceBox = null, faceRatio = null;
      let bright = null, shadowDiff = null, rollDeg = null, yawRatio = null, nFaces = null, crownMargin = null;
      let posePitch = null, poseYaw = null, poseRoll = null, poseModel = null;
      if (det && det.success && Array.isArray(det.faces)) {
        const faces = det.faces.filter((f) => f.score >= 0.45);
        nFaces = faces.length;
        if (faces.length === 0) {
          measurable = false; reason = 'no_face';
        } else {
          const f = faces[0];
          const [x1, y1, x2, y2] = f.bbox;
          const fbW = x2 - x1, fbH = y2 - y1;
          faceBox = { x: x1 / norm.width, y: y1 / norm.height, w: fbW / norm.width, h: fbH / norm.height };
          // 다인: 2순위 얼굴이 유의미(면적 30%↑ + score 0.6↑)면 차단
          const second = faces[1];
          if (second && second.score >= 0.6) {
            const a1 = fbW * fbH, a2 = (second.bbox[2] - second.bbox[0]) * (second.bbox[3] - second.bbox[1]);
            if (a2 >= a1 * 0.3) { measurable = false; reason = 'multiple_faces'; }
          }
          // 고정 얼굴 비율(20~80%)·박스 윗변 5% 게이트 폐지 (2026-11-02 DESIGN 추천화각 §3) — 규격별 화각 판정·정수리 실측이 대체. 비율은 로그용
          faceRatio = +(fbH / norm.height).toFixed(3);
          // 위치: 하단 잘림 + 좌우 치우침
          if (measurable && (norm.height - y2) / norm.height < 0.05) { measurable = false; reason = 'chin_cropped'; }
          const faceCenterX = (x1 + x2) / 2;
          if (measurable && Math.abs(faceCenterX - norm.width / 2) / norm.width > 0.15) { measurable = false; reason = 'off_center'; }
          // precheck에서 headpose 호출 제거 — 콜드스타트 15초 원인 + 부호 미확정 (2026-07-09)
          // pitch 게이트는 캘리브레이션 후 복원. roll/yaw는 5점 kps로 충분 (R&D 실측 MAD 1°)
          // 5점 kps + 정수리 잘림 게이트
          const k = f.kps;
          if (k && k.length >= 5) {
            rollDeg = +((Math.atan2(k[1][1] - k[0][1], k[1][0] - k[0][0]) * 180) / Math.PI).toFixed(1);
            const eyeSpan = Math.hypot(k[1][0] - k[0][0], k[1][1] - k[0][1]) || 1;
            const midX = (k[0][0] + k[1][0] + k[3][0] + k[4][0]) / 4;
            yawRatio = +(((k[2][0] - midX) / eyeSpan)).toFixed(3);
            const eyeY = (k[0][1] + k[1][1]) / 2;
            const crownEstY = 2 * eyeY - y2;
            const hairTopEstY = crownEstY - (y2 - crownEstY) * 0.08;
            // 추정값은 로그 전용 — 반려·경고에 쓰지 않는다 (2026-11-02 작가님: 잘리지 않은 사진에 "잘렸다" 금지). 판정은 아래 매팅 실측
            crownMargin = +(hairTopEstY / norm.height).toFixed(3);
          }
          // 포즈 게이트 — 5점 kps (roll/yaw 충분, pitch는 캘리브레이션 후 복원)
          if (measurable && rollDeg !== null && Math.abs(rollDeg) > 8) { measurable = false; reason = 'head_tilted'; }
          if (measurable && yawRatio !== null && Math.abs(yawRatio) > 0.15) { measurable = false; reason = 'not_frontal'; }
          // 밝기·그림자: 얼굴 박스 픽셀 통계
          try {
            const { default: sharp } = await import('sharp');
            const exl = Math.max(0, Math.round(x1)), ext = Math.max(0, Math.round(y1));
            const ex = { left: exl, top: ext,
              width: Math.min(norm.width - exl, Math.round(fbW)),
              height: Math.min(norm.height - ext, Math.round(fbH)) };
            if (ex.width > 8 && ex.height > 8) {
              const half = Math.max(4, Math.floor(ex.width / 2));
              const [sAll, sL, sR] = await Promise.all([
                sharp(norm.buf).extract(ex).greyscale().stats(),
                sharp(norm.buf).extract({ ...ex, width: half }).greyscale().stats(),
                sharp(norm.buf).extract({ ...ex, left: ex.left + ex.width - half, width: half }).greyscale().stats(),
              ]);
              bright = +sAll.channels[0].mean.toFixed(0);
              shadowDiff = +Math.abs(sL.channels[0].mean - sR.channels[0].mean).toFixed(0);
              if (measurable && bright < 40) { measurable = false; reason = 'too_dark'; }
              if (measurable && bright > 240) { measurable = false; reason = 'too_bright'; }
              if (measurable && shadowDiff !== null && shadowDiff > 50) { measurable = false; reason = 'uneven_lighting'; }
            }
          } catch { /* 통계 실패 시 게이트 미적용 */ }
        }
      }
      timings.gates = Date.now() - tStats;
      // 화각 기하·정수리 실측은 서로 독립 — 병렬 실행. 둘 다 실패하면 판정 없이 통과 + WARNING
      const runFovCheck = async () => {
        const fovSpec = getSpecCropParams(body.slug);
        if (!fovSpec) return null;
        const t = Date.now();
        try {
          const { default: sharp } = await import('sharp');
          const [bx1, by1, bx2, by2] = det.faces.filter((f) => f.score >= 0.45)[0].bbox;
          const g = await computeFitGeometry({
            buf: norm.buf, W: norm.width, H: norm.height,
            fbPx: { x: bx1, y: by1, w: bx2 - bx1, h: by2 - by1 },
            spec: fovSpec, slug: body.slug, cropEngineUrl: CROP_ENGINE_URL, slog, sharp, timeoutMs: 15000,
          });
          if (!g.frame) {
            log(`[IDPhoto][precheck] ${body.slug} 화각 판정 불가 (프레임 없음) → 판정 없이 통과`, 'WARNING');
            return null;
          }
          fitCacheSet(fitCacheKey(body.slug, norm.b64), g);
          const r = assessFov(g.frame, { width: norm.width, height: norm.height }, fovSpec.frameW);
          slog(`[IDPhoto][precheck] ${body.slug} 화각 outside=${JSON.stringify(r.outside)} mag=${r.magnification} faceRatio=${faceRatio} verdict=${r.verdict} raw=${r.rawVerdict} cause=${r.cause}`);
          return r;
        } catch (fe) {
          log(`[IDPhoto][precheck] ${body.slug} 화각 판정 불가 (${fe.message}) → 판정 없이 통과`, 'WARNING');
          return null;
        } finally {
          timings.fit = Date.now() - t;
        }
      };
      let fov = null, crownCheck = null;
      if (measurable && faceBox) {
        const wantFov = body.slug && CROP_ENGINE_URL && matteEnabled() && matteSlugAllowed(body.slug);
        const tParallel = Date.now();
        [fov, crownCheck] = await Promise.all([
          wantFov ? runFovCheck() : null,
          matteEnabled() ? enginePromise.then((engineState) => checkCrownContact({
            imageBuf: norm.buf, faceBox, slug: body.slug || 'precheck',
            engineState, runMatte: runMatteChain, warn: (msg) => log(msg, 'WARNING'),
          })) : null,
        ]);
        timings.parallel = Date.now() - tParallel;
        if (crownCheck) timings.crown = crownCheck.ms ?? 0;
        if (crownCheck && crownCheck.touched) { measurable = false; reason = 'fov_tight_top'; }
        else if (fov && fov.verdict === 'block') { measurable = false; reason = fovRejectionReason(fov); }
      }
      if (measurable) warmupMatteEngine(); // 게이트 통과자만 예열 — 구경·불합격 트래픽 웜 비용 차단 (자체 서버 불통 시에만 RunPod)
      // engineReady=false → 백업 처리 예정. 고객 화면 사전 안내용 — 엔진명은 싣지 않는다 (ch8)
      const engineReady = (await enginePromise) !== 'backup';
      const out = { measurable, rejectionReason: reason, faceBox, faceRatio, checks: [], engineReady };
      if (fov) out.fov = fov;
      if (crownCheck) out.crownCheck = crownCheck;
      timings.total = Date.now() - t0;
      out.timings = timings;
      // 미리보기 썸네일 배선(§10-2)은 §11-1로 제거 — sharp가 HEIC를 디코드하지 못해 성립하지 않았다.
      // 서버 디코더(B안)를 도입하면 이 자리에 축소본을 실어 클라이언트 미리보기를 복구한다.
      slog(`[IDPhoto][precheck] 코드게이트 측정성=${measurable}${reason ? `(${reason})` : ''} faces=${nFaces} fbH=${faceRatio !== null ? Math.round(faceRatio * norm.height) : '-'}px faceRatio=${faceRatio} fov=${fov ? `${fov.verdict}/${fov.cause}/${fov.magnification}` : '-'} crown=${crownMargin} crownCheck=${crownCheck ? JSON.stringify(crownCheck) : '-'} bright=${bright} shadow=${shadowDiff} roll=${rollDeg} yaw=${yawRatio} engineReady=${engineReady} timings=${JSON.stringify(timings)}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(out));
    } catch (err) {
      log(`[IDPhoto][precheck] 에러: ${err.message} | stack: ${(err.stack || '').split('\n').slice(0,3).join(' > ')}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '검수 중 오류가 발생했습니다', detail: err.message, code: 'INTERNAL_ERROR' }));
    }
  }

  // === 증명사진 생성 (결제 게이트 — paymentToken 또는 로그인 크레딧 필수) ===
  if (urlPath === '/api/idphoto/generate' && req.method === 'POST') {
    if (!checkRateLimit(req, 'generate', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    // 게이트 소모분(무료 선차감·토큰 쿼터·크레딧) 반환 예약 — 게이트 통과 시 장착, 산출물 확정 시 해제.
    // 실패 경로 어디서든 최대 1회 발화. 게이트 이후 비보호 구간(normalizeImage·cropToSpec 등)의
    // throw가 과금+무산출로 남던 공백 봉합 (2026-07-10 적대검증 #2).
    let gateMode = null;
    let refundGate = null;
    let t1RawForSave = null;
    const fireRefundGate = () => { const fire = refundGate; refundGate = null; if (fire) fire(); };
    // 🔴 미전달 산출물에 생성권을 물리지 않는다 (2026-07-25) — 07-25 INCIDENT의 실제 누출 지점.
    // Cloud Run 타임아웃(504)으로 유저 연결이 끊겨도 이 프로세스는 계속 돌아 산출물을 만들고
    // "생성 완료"를 기록한다. 그 경로는 서버 기준 성공이라 기존 반환 분기(!finalBase64)에
    // 걸리지 않았고, 카운트 동기용 Set-Cookie도 504에 밀려 유저에게 도달하지 못했다.
    //
    // ⚠️ 소켓 절단 감지는 Cloud Run에서 쓸 수 없다 — 2026-07-25 실측: 클라이언트가 abort 해도
    //    컨테이너의 res 'close'가 발화하지 않고(프록시가 상류 연결을 유지) 응답 쓰기도 조용히 성공한다.
    //    따라서 절단은 관측 불가이며, **경과 시간이 유일한 신뢰 신호**다.
    // 'close' 훅은 절단을 전파하는 환경(로컬·타 프록시)을 위해 남겨 둔다.
    const reqStartedAt = Date.now();
    let clientGone = false;
    res.on('close', () => {
      if (res.writableFinished) return;
      clientGone = true;
      if (refundGate) {
        log(`[IDPhoto] 클라이언트 연결 종료 — 산출물 미전달 → 소모분 반환(${gateMode})`, 'WARNING');
        fireRefundGate();
      }
    });
    /** Cloud Run 요청 예산(120s)을 넘겼으면 응답은 유저에게 닿지 않는다 — 소모분을 반환한다. */
    const deliveryDoubtful = () => clientGone || (Date.now() - reqStartedAt) >= GEN_DELIVERY_DEADLINE_MS;
    try {
      const { parseJsonBody, parseCookies: pc, verifyAuthToken } = await import('./lib/shared/config.js');
      const body = await parseJsonBody(req);
      const { image, format, gender, age, model, paymentToken } = body;
      // specs 페이지 요청: slug로 규격 식별 → 무보정 모델 + 생성 후 규격 안착 크롭 (2026-07-06)
      const slug = (typeof body.slug === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(body.slug)) ? body.slug : null;
      if (!image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지 필수' }));
      }

      // 귀속 식별 — 게이트와 분리 (2026-08-26). 무료 트랙은 gateUserId가 'specs-visitor'로 고정이라
      // 로그인 유저의 무료 생성이 anonymous_*로 기록돼 왔다(동일인 무료↔유료 세션 연결 불가 → 전환율 산출 불능).
      // 과금·모델 경로는 gateUserId 그대로 두고, 기록·계측만 실제 로그인 uid로 귀속한다.
      const authUserId = (() => {
        try {
          const c = pc(req.headers.cookie);
          return c.monkos_session ? (verifyAuthToken(c.monkos_session)?.userId || null) : null;
        } catch { return null; }
      })();

      // 결제 게이트: ① 결제 토큰(비로그인 단건) ② 로그인 크레딧 ③ T0 무료(파일럿) — 셋 다 아니면 402
      let gateUserId = 'specs-visitor';
      let remainingGenerates = null;
      let freeQuota = null;

      // ③ T0 무료 (2026-07-11 작가님: 파일럿 검증 완료 → 전 슬러그 개방. T1 리터칭은 FREE_PILOT_SLUGS 파일럿 유지):
      //    fit 확정 프레임 필수, 매팅 전용(Gemini 폴백 금지 = 원가 상한 보장). 크롭 미지원 슬러그는 매팅 실패 시 503+반환으로 안전
      const isFreeReq = body.freeTier === true && !paymentToken;
      if (isFreeReq) {
        if (!slug) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '이 규격은 아직 무료 만들기를 지원하지 않아요.', code: 'FREE_NOT_AVAILABLE' }));
        }
        if (!body.fitFrame || !(body.fitFrame.w > 0 && body.fitFrame.h > 0)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '규격 검수를 먼저 진행해주세요.', code: 'FREE_REQUIRES_FIT' }));
        }
        if (!checkRateLimit(req, 'free-gen', 5) || !checkRateLimit(req, 'free-day', FREE_DAILY_CAP * 4, 86400000)) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
        }
        freeQuota = readFreeQuota(req);
        if (freeQuota.count >= FREE_DAILY_CAP) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '오늘 무료 횟수를 모두 사용했어요. 내일 다시 이용해주세요.', code: 'FREE_LIMIT', remainingFree: 0 }));
        }
        // 서버 정본 선차감 (Firestore 원자) — 쿠키·IP 우회를 무력화. 실패 경로에서 refund.
        const srvQuota = await consumeFreeQuota(req);
        if (srvQuota && !srvQuota.allowed) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({
            error: srvQuota.global ? '오늘 무료 서비스 물량이 마감됐어요. 내일 다시 이용해주세요.' : '오늘 무료 횟수를 모두 사용했어요. 내일 다시 이용해주세요.',
            code: 'FREE_LIMIT', remainingFree: 0,
          }));
        }
        if (srvQuota && srvQuota.count) freeQuota = { date: freeQuota.date, count: srvQuota.count - 1 }; // 쿠키 표기를 서버 정본에 동기
        gateMode = 'free';
        refundGate = () => refundFreeQuota(req).catch(() => {});
      } else if (paymentToken) {
        const gate = await consumeGenerateQuota(paymentToken);
        if (!gate.ok) {
          res.writeHead(gate.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: gate.error, code: gate.code }));
        }
        gateMode = 'token';
        remainingGenerates = gate.remainingGenerates;
        refundGate = () => refundGenerateQuota(paymentToken).catch(() => {});
      } else {
        const cookies = pc(req.headers.cookie);
        const session = cookies.monkos_session ? verifyAuthToken(cookies.monkos_session) : null;
        if (!session?.userId) {
          res.writeHead(402, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '결제가 필요합니다', code: 'PAYMENT_REQUIRED' }));
        }
        // 로그인 크레딧 차감 (generate 10c — 기존 credits.js 경로 준용)
        const creditRes = await fetch(`http://localhost:${PORT}/api/credits/use`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
          body: JSON.stringify({ userId: session.userId, type: 'generate' }),
        });
        const creditData = await creditRes.json();
        if (!creditRes.ok) {
          res.writeHead(creditRes.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(creditData));
        }
        gateMode = 'credits';
        gateUserId = session.userId;
        refundGate = () => fetch(`http://localhost:${PORT}/api/credits/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
          body: JSON.stringify({ userId: gateUserId, type: 'generate' }),
        }).catch(() => {});
      }

      // 엔진 예열 — 감지·크롭/매팅과 병렬로 콜드스타트 흡수 (fire-and-forget)
      if (slug) { warmupCropEngine(); warmupMatteEngine(); }

      const norm = await normalizeImage(image);
      // §11-2: 디코드 실패 이미지는 생성으로 넘기지 않는다. 게이트에서 선차감된 무료 쿼터·크레딧은
      // 반드시 환급 게이트를 발화시킨 뒤 반려 — 과금만 되고 산출물이 없는 경로를 남기지 않는다.
      if (norm.degraded || !norm.width || !norm.height) {
        fireRefundGate();
        log(`[IDPhoto] 생성 중단 — 디코드 실패${norm.decodeError ? ` (${String(norm.decodeError).split('\n')[0]})` : ''}`, 'WARNING');
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지를 해석할 수 없습니다. JPG 또는 PNG로 올려주세요.', code: 'DECODE_FAILED' }));
      }

      // 신경로 (IDPASS 순서, ORDER_20260707): 원본에서 감지·크롭 → BiRefNet 매팅 → 배경색 합성.
      // 원본 픽셀 보존 + Gemini 재생성물 위 감지의 비결정성 제거.
      // MATTE_API_URL 미설정·감지 미안착·matte 장애 → null 반환 → 현행 Gemini 경로(L3) 강등.
      let finalBase64 = null;
      let cropEngine = null;
      let genTrack = null;
      let resultMeta = null;
      // T1 전 슬러그 개방 (2026-07-13 작가님 승인) — UI 게이트(render-specs.js t1RetouchOn)와 동시 개방 정합
      const isT1Path = gateMode !== 'free' && process.env.PILOT_T1_RETOUCH === '1' && !!slug;
      if (slug && matteEnabled() && !isT1Path) {
        try {
          // fit 확정 경로 우선 (ORDER_20260707): 검수 단계 확정 프레임을 기하 재단 — WYSIWYG, FaceMesh 미재실행
          let matteRes = null;
          if (body.fitFrame && body.fitFrame.w > 0 && body.fitFrame.h > 0) {
            const specP = getSpecCropParams(slug);
            // IDPASS 정본 게이트: blocked면 fit 경로 차단 (face 범위 밖 OR eye 40~48% 밖)
            const blocked = specP && body.fitMetrics ? judgeMetrics(body.fitMetrics, specP).blocked : false;
            if (specP && !blocked) matteRes = await matteFitPipeline(norm.b64, slug, body.fitFrame, body.fitMeta || null, specP.frameW, specP.frameH);
          }
          if (!matteRes) matteRes = await matteSpecPipeline(norm.b64, slug);
          if (matteRes && matteRes.failed === 'FACE_NOT_DETECTED') {
            fireRefundGate();
            const FACE_FAIL_MSG = {
              ko: '얼굴을 찾을 수 없습니다. 얼굴이 잘 보이는 다른 사진으로 다시 시도해 주세요.',
              en: 'Could not detect a face. Please try again with a clearer photo.',
              ja: '顔を検出できませんでした。顔がはっきり写っている別の写真でもう一度お試しください。',
              es: 'No se pudo detectar un rostro. Inténtelo con otra foto más clara.',
            };
            const lang = body.lang || 'ko';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: FACE_FAIL_MSG[lang] || FACE_FAIL_MSG.ko, code: 'FACE_NOT_DETECTED' }));
          }
          if (matteRes && matteRes.image) {
            finalBase64 = matteRes.image;
            cropEngine = matteRes.cropEngine;
            genTrack = 'birefnet';
            resultMeta = matteRes.meta || null;
          }
        } catch (e) {
          log(`[IDPhoto] matte 신경로 예외 (${e.message}) → Gemini 폴백`, 'ERROR');
        }
      }

      // T1 의상+보정 (PILOT_T1_RETOUCH=1): 유료 게이트 한정.
      // 파이프라인: 원본 → 나노2(v4: 의상교체+보정+배경+넓은화각) → crop-engine 재크롭.
      // T1 실패 = 명시 에러 + 생성권 미소모. 강등 출고 금지 (작가님 7/17 확정).
      if (isT1Path) {
        const T1_FAIL_MSG = {
          ko: '사진 생성에 실패했습니다. 크레딧은 소모되지 않았습니다. 다른 사진으로 다시 시도해 주세요.',
          en: 'Photo generation failed. No credits were used. Please try again with a different photo.',
          ja: '写真の生成に失敗しました。クレジットは消費されていません。別の写真でもう一度お試しください。',
          es: 'Error en la generación de la foto. No se consumieron créditos. Inténtelo de nuevo con otra foto.',
        };
        try {
          const attireDesc = body.attireDesc || null;
          log(`[IDPhoto] T1 attireDesc=${attireDesc ? attireDesc.slice(0, 60) : 'null'}, gender=${gender}, age=${age}`);
          const t1Prompt = buildT1Prompt(attireDesc, { gender, age });
          let t1Done = false;
          for (let attempt = 1; attempt <= 2 && !t1Done; attempt++) {
            const t1Result = await generateIdPhoto({ image: norm.b64, format: format || 'passport', gender, age, model: 'nano-banana-2', userId: gateUserId, framing: 'wide', promptOverride: t1Prompt });
            if (!t1Result) break;
            t1RawForSave = t1Result;
            const cropRes = await cropToSpec(t1Result, slug);
            if (cropRes && cropRes.image && cropRes.engine === 'insight' && cropMetaWithinSpec(cropRes.meta)) {
              let t1Image = cropRes.image;
              // 비백색국 T1 재채색 (나노 백색 산출 → matte 배경 합성). 재채색 실패 시 백색 잠정 출고
              // = 작가님 승인 폴백 (2026-07-18 "일단 열자" 결정 상태로 회귀 — 무승인 폴백 아님)
              const bgColor = getSpecBgColor(slug);
              if (bgColor !== '#FFFFFF') {
                try {
                  const matteResult = await runMatteChain(t1Image, bgColor, slug);
                  if (matteResult && matteResult.image) t1Image = matteResult.image;
                } catch (e) {
                  log(`[IDPhoto] T1 배경 재채색 실패 (${slug}) — 흰배경 유지: ${e.message}`);
                }
              }
              finalBase64 = t1Image;
              cropEngine = cropRes.engine;
              genTrack = 't1-attire';
              resultMeta = cropRes.meta || resultMeta;
              t1Done = true;
            } else {
              log(`[IDPhoto] T1 프레이밍 게이트 이탈 (attempt ${attempt}, engine=${cropRes?.engine}, crown=${cropRes?.meta?.crownMarginMM}mm, eye=${cropRes?.meta?.eyePositionPercent}%) → ${attempt === 1 ? '재생성 1회' : '명시 실패'}`, 'WARNING');
            }
          }
          if (!t1Done) {
            fireRefundGate();
            const lang = body.lang || 'ko';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: T1_FAIL_MSG[lang] || T1_FAIL_MSG.ko, code: 'T1_GENERATE_FAILED' }));
          }
        } catch (e) {
          log(`[IDPhoto] T1 의상+보정 실패 (${e.message}) → 명시 에러 반환`, 'WARNING');
          fireRefundGate();
          const lang = body.lang || 'ko';
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: T1_FAIL_MSG[lang] || T1_FAIL_MSG.ko, code: 'T1_GENERATE_FAILED' }));
        }
      }

      // T0 무료: 매팅 실패 시 Gemini 폴백 금지 — 무료 원가 상한(매팅비)만 허용. 선차감분 반환 후 종료.
      if (gateMode === 'free' && !finalBase64) {
        fireRefundGate();
        res.writeHead(503, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '현재 이용자가 많습니다. 잠시 후 다시 시도해주세요.', code: 'FREE_UNAVAILABLE' }));
      }

      if (!finalBase64) {
        let generatedBase64;
        try {
          // L3/현행: specs(slug 보유)는 무보정 배경제거 = gemini-2.5-flash + 여유 프레이밍(wide)
          // — 크롭 원자재 확보 (AI의 타이트 크롭 위에서 재단하면 여백·어깨 부족, 2026-07-06 실사고)
          const effectiveModel = model || (slug ? 'gemini-2.5-flash' : 'nano-banana-pro');
          generatedBase64 = await generateIdPhoto({ image: norm.b64, format: format || 'passport', gender, age, model: effectiveModel, userId: gateUserId === 'specs-visitor' ? 'specs-visitor' : gateUserId, framing: slug ? 'wide' : undefined });
        } catch (genErr) {
          // 서버측 생성 실패 → 소모분 반환 (토큰 쿼터 / 크레딧)
          fireRefundGate();
          log(`[IDPhoto] 생성 실패 → 소모분 반환(${gateMode}): ${genErr.message}`, 'WARNING');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: '생성에 실패했습니다. 다시 시도해주세요.', code: 'GENERATE_FAILED' }));
        }

        // specs: 규격 안착 크롭 (FaceMesh 엔진, 실패 시 커버 폴백 — 결과는 항상 규격 비율)
        finalBase64 = generatedBase64;
        genTrack = 'gemini';
        if (slug) {
          const cropRes = await cropToSpec(generatedBase64, slug);
          finalBase64 = cropRes.image;
          cropEngine = cropRes.engine;
          resultMeta = cropRes.meta || null;
        }
      }

      try {
        // 크레딧 출처 스냅샷 — 생성 시점 기준 웰컴/구매 판정 (어드민 배지 분리, 2026-09-26)
        const creditSource = gateMode === 'credits' ? await resolveCreditSource(gateUserId) : null;
        await saveImages('idphoto', gateUserId, slug || format || 'passport', norm.rawBase64, finalBase64, { ...(t1RawForSave && { t1Raw: t1RawForSave }), sessionId: req.sessionId, slug: slug || null, authUserId, gate: gateMode, creditSource });
      } catch (e) {
        log(`[IDPhoto] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
      }
      log(`[IDPhoto] 생성 완료: 규격=${slug || format || 'passport'}, 게이트=${gateMode}${genTrack ? `, 트랙=${genTrack}` : ''}${cropEngine ? `, 크롭=${cropEngine}` : ''}`);
      // 서버측 확정 계측 (헤드샷 api_generate 패턴 준용 — 클라 GA 유실 대비 + 무료 쿼터 남용 감시)
      trackEvent({
        eventName: 'api_generate',
        userId: gateUserId === 'specs-visitor' ? authUserId : gateUserId,
        sessionId: req.sessionId,
        service: 'specs',
        params: { gate: gateMode, slug: slug || null, track: genTrack || null },
      }).catch(() => {});

      // 산출물은 완성했지만 유저에게 닿았는지 의심스러운 경우 — 소모분을 반환하고 쿼터를 확정하지 않는다.
      // 응답 자체는 그대로 보낸다: 닿으면 유저는 사진을 받고 횟수도 안 깎인다(관대한 방향의 오차).
      // 닿지 않으면 07-25처럼 "결과물 없이 생성권만 소모"가 되는 것을 막는다.
      const undelivered = deliveryDoubtful();
      if (undelivered) {
        log(`[IDPhoto] 전달 불확실(경과 ${Date.now() - reqStartedAt}ms) — 소모분 반환·쿼터 미확정(${gateMode})`, 'WARNING');
        fireRefundGate();
      }

      let remainingFree = null;
      if (gateMode === 'free' && !undelivered) {
        const newCount = freeQuota.count + 1;
        remainingFree = Math.max(0, FREE_DAILY_CAP - newCount);
        res.setHeader('Set-Cookie', freeQuotaCookie(freeQuota.date, newCount));
      } else if (gateMode === 'free') {
        remainingFree = Math.max(0, FREE_DAILY_CAP - freeQuota.count);
      }
      if (!undelivered) refundGate = null; // 산출물 확정 — 이후 실패는 반환 대상 아님
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ image: finalBase64, remainingGenerates, remainingFree, track: genTrack, cropEngine, meta: resultMeta }));
    } catch (err) {
      if (refundGate) log(`[IDPhoto] 처리 실패 → 소모분 반환(${gateMode})`, 'WARNING');
      fireRefundGate();
      log(`[IDPhoto] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
    }
  }

  // === 결제 ===
  if (urlPath === '/api/checkout' && req.method === 'POST') return handleCheckout(req, res);
  if (urlPath === '/api/webhooks/lemonsqueezy' && req.method === 'POST') return handleLemonSqueezyWebhook(req, res);
  // 별칭: 레몬 대시보드가 경로에 'lemonsqueezy' 포함 URL을 거부(피싱 방지 검증)해 /api/webhooks로 등록됨 (2026-07-05)
  if (urlPath === '/api/webhooks' && req.method === 'POST') return handleLemonSqueezyWebhook(req, res);
  // 토스 취소 회수 웹훅 (2026-07-06 F1) — 토스 개발자센터에 이 URL 등록 필요
  if (urlPath === '/api/webhooks/toss' && req.method === 'POST') return handleTossWebhook(req, res);
  if (urlPath === '/api/payments/toss/confirm' && req.method === 'POST') return handleTossConfirm(req, res);
  if (urlPath === '/api/payments/direct/init' && req.method === 'POST') {
    if (!checkRateLimit(req, 'direct-init', 10)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    return handleDirectInit(req, res);
  }
  if (urlPath === '/api/payments/direct/status' && req.method === 'GET') {
    if (!checkRateLimit(req, 'direct-status', 60)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    return handleDirectStatus(req, res);
  }
  // 에이전트 결제 E2E — dev 서비스에만 존재하는 경로 (ORDER_20261103). prod에서는 일반 404로 떨어진다
  if (isDevService() && urlPath === '/api/payments/direct/dev-grant' && req.method === 'POST') {
    if (!requireAdmin(req, res)) return;
    return handleDirectDevGrant(req, res);
  }
  // 결제 실패 수신 (2026-09-19) — 실패 사유의 정본. 서버 발급 orderId 아니면 핸들러가 거부
  if (urlPath === '/api/payments/direct/fail' && req.method === 'POST') {
    if (!checkRateLimit(req, 'direct-fail', 20)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    return handleDirectFail(req, res);
  }
  // 주문 문서 없는 결제 표면(크레딧 충전)의 실패 수신 (2026-09-20) — 로그 1행만 남긴다. 인증 불요, 레이트리밋이 남용 방어
  if (urlPath === '/api/payments/fail' && req.method === 'POST') {
    if (!checkRateLimit(req, 'pay-fail', 20)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', code: 'RATE_LIMITED' }));
    }
    return handlePayFail(req, res);
  }
  if (urlPath === '/api/payments/toss/direct' && req.method === 'POST') return handleTossDirect(req, res);
  if (urlPath === '/api/download/direct' && req.method === 'GET') return handleDownloadDirect(req, res);
  if (req.url?.startsWith('/toss-success')) return handleTossSuccess(req, res);
  if (req.url?.startsWith('/toss-fail')) return handleTossFail(req, res);

  // === 이벤트 ===
  if (urlPath === '/api/telegram/gate-code' && req.method === 'POST') return handleTelegramGateCode(req, res);
  if (urlPath === '/api/telegram/mission-code' && req.method === 'POST') return handleTelegramMissionCode(req, res);
  if (urlPath === '/api/consent/sns' && req.method === 'POST') return handleConsentSns(req, res);

  // === Mini App API ===
  if (urlPath === '/api/tg/verify-init' && req.method === 'POST') return handleVerifyInit(req, res);
  if (urlPath === '/api/tg/passport-issue' && req.method === 'POST') return handlePassportIssue(req, res);
  if (urlPath === '/api/tg/upload-mission' && req.method === 'POST') return handleUploadMission(req, res);

  // === 봇 웹훅 ===
  if (urlPath === '/api/webhook/telegram' && req.method === 'POST') return handleTelegramCSWebhook(req, res);
  if (urlPath === '/api/webhook/telegram-event' && req.method === 'POST') return handleTelegramEventWebhook(req, res);
  if (urlPath === '/api/webhook/telegram-team' && req.method === 'POST') return handleTelegramTeamWebhook(req, res);
  if (urlPath === '/api/team/notify' && req.method === 'POST') return handleTeamNotify(req, res);

  // === 카카오 챗봇 ===
  if (urlPath === '/api/kakao/chatbot' && req.method === 'POST') return handleKakaoChatbot(req, res);

  // === LINE 챗봇 ===
  if (urlPath === '/api/webhook/line' && req.method === 'POST') return handleLineWebhook(req, res);

  // === 챗봇/코칭 ===
  if (urlPath === '/api/chat' && req.method === 'POST') return handleWebChat(req, res);
  if (urlPath === '/api/coaching' && req.method === 'POST') return handleCoaching(req, res);

  // === 유저 트래킹 (rate-limit + payload cap) ===
  if (urlPath === '/api/track' && req.method === 'POST') {
    const withinLimit = checkRateLimit(req, 'track', 60);

    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1048576) { res.writeHead(413); return res.end(); }

    if (!withinLimit) {
      // 신뢰 엣지가 중계한 page_view만의 한도 초과는 크롤러 순회 — 204로 끝내고 적재하지 않는다.
      // 클라이언트 직접 이벤트(click_cta 등)의 한도 초과는 종전대로 429.
      const edge = resolveEdgeClient(req);
      if (edge.trusted) {
        let overEvents = [];
        try { overEvents = (await parseJsonBody(req)).events || []; } catch { overEvents = []; }
        if (overEvents.length && overEvents.every((e) => e?.event_name === 'page_view')) {
          logBotSuspect(edge.ip, req);
          res.writeHead(204);
          return res.end();
        }
      }
      res.writeHead(429);
      return res.end();
    }

    if (isInternalProbe(req)) { res.writeHead(204); return res.end(); }

    const body = await parseJsonBody(req);
    const events = (body.events || []).slice(0, 10);
    const ALLOWED_EVENTS = [
      'click_cta', 'upload_image', 'select_style',
      'open_credit_shop', 'start_payment', 'session_end',
      'generate_complete',
    ];
    // 엣지 정적 서빙 페이지는 SSR trackPageView를 타지 않는다 — 신뢰 엣지(Worker)가
    // 대신 쏘는 page_view만 허용 (임의 클라이언트의 page_view 주입은 차단 유지)
    if (resolveEdgeClient(req).trusted) ALLOWED_EVENTS.push('page_view');
    const sessionId = req.sessionId;
    for (const evt of events) {
      if (!ALLOWED_EVENTS.includes(evt.event_name)) continue;
      trackEvent({
        eventName: evt.event_name,
        userId: evt.user_id || null,
        sessionId,
        pagePath: evt.page_path || null,
        lang: evt.lang || null,
        region: evt.region || null,
        service: evt.service || 'portal',
        referer: req.headers.referer || null,
        userAgent: req.headers['user-agent'] || null,
        ipCountry: req.paymentRegion || null,
        params: evt.params || null,
      }).catch(() => {});
    }
    res.writeHead(204);
    return res.end();
  }

  // === Dashboard API ===
  if (urlPath === '/api/admin/dashboard/summary' && req.method === 'GET') return handleDashboardSummary(req, res);
  if (urlPath === '/api/admin/dashboard/users' && req.method === 'GET') return handleDashboardUsers(req, res);
  if (urlPath === '/api/admin/dashboard/users360' && req.method === 'GET') return handleDashboardUsers360(req, res);
  if (urlPath === '/api/admin/dashboard/credits' && req.method === 'GET') return handleDashboardCredits(req, res);
  if (urlPath === '/api/admin/dashboard/traffic' && req.method === 'GET') return handleDashboardTraffic(req, res);
  if (urlPath === '/api/admin/dashboard/citadel' && req.method === 'GET') return handleDashboardCitadel(req, res);
  if (urlPath === '/api/admin/dashboard/channels' && req.method === 'GET') return handleDashboardChannels(req, res);
  if (urlPath === '/api/admin/dashboard/gsc' && req.method === 'GET') return handleDashboardGsc(req, res);
  if (urlPath === '/api/admin/dashboard/naver' && req.method === 'GET') return handleDashboardNaver(req, res);
  if (urlPath === '/api/admin/dashboard/bing' && req.method === 'GET') return handleDashboardBing(req, res);
  if (urlPath === '/api/admin/dashboard/performance' && req.method === 'GET') return handleDashboardPerformance(req, res);
  if (urlPath.startsWith('/api/admin/dashboard/user/') && req.method === 'GET') {
    const userId = decodeURIComponent(urlPath.split('/').pop());
    return handleDashboardUserDetail(req, res, userId);
  }

  // === CMS 관리자 API ===
  if (urlPath === '/api/admin/blog' && req.method === 'GET') return handleBlogList(req, res);
  if (urlPath === '/api/admin/blog' && req.method === 'POST') return handleBlogCreate(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'GET') return handleBlogGet(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'PUT') return handleBlogUpdate(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'DELETE') return handleBlogDelete(req, res);
  if (urlPath === '/api/admin/ai/image' && req.method === 'POST') return handleAiImage(req, res);
  if (urlPath === '/api/admin/ai/thumbnail' && req.method === 'POST') return handleAiThumbnail(req, res);
  if (urlPath === '/api/admin/ai/suggest' && req.method === 'POST') return handleAiSuggest(req, res);
  if (urlPath === '/api/admin/upload' && req.method === 'POST') return handleUpload(req, res);
  if (urlPath === '/api/admin/images' && req.method === 'GET') return handleImageList(req, res);
  if (urlPath?.startsWith('/api/admin/images/') && req.method === 'DELETE') return handleImageDelete(req, res);
  if (urlPath?.endsWith('/translate') && urlPath?.startsWith('/api/admin/blog/') && req.method === 'POST') return handleTranslate(req, res);
  if (urlPath === '/api/admin/search' && req.method === 'GET') return handleSearch(req, res);
  if (urlPath === '/api/admin/idphoto/results' && req.method === 'GET') return handleIdphotoResults(req, res);

  // === CMS 사이트 설정 API ===
  if (urlPath === '/api/admin/settings' && req.method === 'GET') return handleSettingsGet(req, res);
  if (urlPath === '/api/admin/settings' && req.method === 'PUT') return handleSettingsPut(req, res);

  // === CMS 홈 레이아웃 API ===
  if (urlPath === '/api/admin/layout' && req.method === 'GET') return handleLayoutGet(req, res);
  if (urlPath === '/api/admin/layout' && req.method === 'PUT') return handleLayoutPut(req, res);

  // === CMS FAQ 관리자 API ===
  if (urlPath === '/api/admin/faq' && req.method === 'GET') return handleFaqList(req, res);
  if (urlPath === '/api/admin/faq' && req.method === 'POST') return handleFaqCreate(req, res);
  if (urlPath?.startsWith('/api/admin/faq/') && req.method === 'PUT') return handleFaqUpdate(req, res);
  if (urlPath?.startsWith('/api/admin/faq/') && req.method === 'DELETE') return handleFaqDelete(req, res);

  // === CMS 갤러리 관리자 API ===
  if (urlPath === '/api/admin/gallery' && req.method === 'GET') return handleGalleryList(req, res);
  if (urlPath === '/api/admin/gallery' && req.method === 'POST') return handleGalleryCreate(req, res);
  if (urlPath?.startsWith('/api/admin/gallery/') && req.method === 'PUT') return handleGalleryUpdate(req, res);
  if (urlPath?.startsWith('/api/admin/gallery/') && req.method === 'DELETE') return handleGalleryDelete(req, res);

  // === CMS 게시판 공개 API ===
  if (urlPath === '/api/board' && req.method === 'GET') return handleBoardPublicList(req, res);
  if (urlPath === '/api/board' && req.method === 'POST') return handleBoardPublicCreate(req, res);
  if (urlPath === '/api/board/report' && req.method === 'POST') return handleBoardReportCreate(req, res);
  if (urlPath?.startsWith('/api/board/') && req.method === 'GET') return handleBoardPublicGet(req, res);
  if (urlPath?.startsWith('/api/board/') && req.method === 'DELETE') return handleBoardPublicDelete(req, res);

  // === CMS 게시판 관리자 API ===
  if (urlPath === '/api/admin/board' && req.method === 'GET') return handleBoardAdminList(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/reply') && req.method === 'POST') return handleBoardAdminReply(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/toggle') && req.method === 'PUT') return handleBoardAdminToggle(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && req.method === 'DELETE') return handleBoardAdminDelete(req, res);

  // === 관상×사주 리포트 (PF_FACEREAD Phase A) — 어드민 비공개 ===
  if (urlPath === '/api/admin/gwansang/data' && req.method === 'GET') return handleGwansangData(req, res);
  if (urlPath === '/api/admin/gwansang/saju' && req.method === 'GET') return handleGwansangSaju(req, res);

  // === 콜스코프 수집 PoC (PF_RND) — 어드민 비공개 ===
  if (urlPath === '/api/admin/callscope/ingest' && req.method === 'POST') return handleCallscopeIngest(req, res);
  if (urlPath === '/api/admin/callscope/calls' && req.method === 'GET') return handleCallscopeCalls(req, res);
  if (urlPath === '/api/admin/callscope/verify' && req.method === 'POST') return handleCallscopeVerify(req, res);
  if (urlPath === '/api/admin/callscope/timing' && req.method === 'POST') return handleCallscopeTiming(req, res);

  // === VTON Studio (PF_VTON Phase4) — RunPod 프록시 ===
  if (urlPath === '/admin/api/vton/pod/start' && req.method === 'POST') return handlePodStart(req, res);
  if (urlPath === '/admin/api/vton/pod/status' && req.method === 'GET') return handlePodStatus(req, res);
  if (urlPath === '/admin/api/vton/pod/stop' && req.method === 'POST') return handlePodStop(req, res);
  if (urlPath?.startsWith('/admin/api/vton/comfy/')) return handleComfyProxy(req, res);

  // === 크롭앱 ===
  if (urlPath === '/crop' && req.method === 'GET') {
    try {
      const html = readFileSync(join(__dirname, 'public/crop/index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    } catch { /* fall through to static */ }
  }

  // === CMS 공개 페이지 (SSR) ===
  // HEAD 요청을 GET으로 처리 — Googlebot HEAD 404 방지 (2026-04-10)
  if (req.method === 'HEAD') req.method = 'GET';

  // /crop 수동 크롭앱 은퇴 → specs 허브 301 (2026-07-16 작가님: 산식 자산 보호 — 코드는 apps/crop-app 보관.
  // IDPASS 허브(/idpass) 신설 시 타깃 변경 예정)
  if (urlPath === '/crop' || urlPath.startsWith('/crop/')) {
    res.writeHead(301, { 'Location': '/specs' });
    return res.end();
  }

  // 구 슬러그 → 신규 슬러그 301 리다이렉트 — 맵 정본: lib/cms/redirects.js (BLOG_REDIRECTS)
  const blogRedirects = BLOG_REDIRECTS;
  let decodedPath;
  try { decodedPath = decodeURIComponent(urlPath); } catch { decodedPath = urlPath; }
  const redirectTarget = blogRedirects[urlPath] || blogRedirects[decodedPath];
  if (redirectTarget) {
    res.writeHead(301, { 'Location': redirectTarget });
    return res.end();
  }

  // EN/JA 정책 페이지 → 루트 정본 301 (정책 HTML은 루트에만 존재. GSC 404 해소 2026-07-05)
  const policyMatch = urlPath.match(/^\/(en|ja)\/(terms|privacy|refund)\.html$/);
  if (policyMatch) {
    res.writeHead(301, { 'Location': `/${policyMatch[2]}.html` });
    return res.end();
  }

  // EN/JA 한글슬러그 → KO 영문슬러그 폴백 301 (hreflang 유령 URL 근절)
  const langBlogMatch = urlPath.match(/^\/(en|ja)\/blog\//);
  if (langBlogMatch) {
    const koPath = urlPath.replace(/^\/(en|ja)\/blog\//, '/blog/');
    let koDecoded;
    try { koDecoded = decodeURIComponent(koPath); } catch { koDecoded = koPath; }
    const koTarget = blogRedirects[koPath] || blogRedirects[koDecoded];
    if (koTarget) {
      res.writeHead(301, { 'Location': koTarget });
      return res.end();
    }
  }

  // === /app → idphoto 서비스 리다이렉트 (ChatGPT referral 404 해소) ===
  if (urlPath === '/app' && req.method === 'GET') {
    const acceptLang = req.headers['accept-language'] || '';
    const target = acceptLang.startsWith('ja') ? 'https://idphoto-jp.monkos.ai/' : 'https://idphoto-kr.monkos.ai/';
    res.writeHead(302, { 'Location': target });
    return res.end();
  }

  if ((urlPath === '/kr' || urlPath === '/kr/') && req.method === 'GET') { res.writeHead(301, { 'Location': '/' }); return res.end(); }
  if ((urlPath === '/jp' || urlPath === '/jp/') && req.method === 'GET') { res.writeHead(301, { 'Location': '/ja' }); return res.end(); }

  // 레거시 monk.kr 경로 → 410 Gone (마이그레이션 잔재, monkos.ai에 대체 페이지 없음 — 색인 제거 신호)
  if (/^\/(monk_studio|ai_lab|Academy|b2b|debate)(\/|$)/.test(urlPath) && req.method === 'GET') {
    res.writeHead(410, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Gone');
  }

  // SSR page_view 트래킹 (API·정적·sitemap 제외)
  const STATIC_EXT = /\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|map|json)$/i;
  const STATIC_PREFIX = /^\/(js|css|assets|images|fonts)\//;
  if (req.method === 'GET' && !urlPath.startsWith('/api/') && !urlPath.startsWith('/admin/') && !urlPath.endsWith('.xml') && !urlPath.endsWith('.txt') && !STATIC_EXT.test(urlPath) && !STATIC_PREFIX.test(urlPath)) {
    trackPageView(req);
  }

  if ((urlPath === '/' || urlPath === '/index.html') && req.method === 'GET') return renderHome(req, res);
  // 다국어 홈 라우트 (/ja/, /en/ → 경로 방식 통일)
  if ((urlPath === '/ja' || urlPath === '/ja/') && req.method === 'GET') return renderHome(req, res, 'ja');
  if ((urlPath === '/en' || urlPath === '/en/') && req.method === 'GET') return renderHome(req, res, 'en');
  if (urlPath === '/sitemap.xml' && req.method === 'GET') return renderSitemap(req, res);
  if (urlPath === '/sitemap-static.xml' && req.method === 'GET') return renderSitemapStatic(req, res);
  if (urlPath === '/sitemap-specs.xml' && req.method === 'GET') return renderSitemapSpecs(req, res);
  if (urlPath === '/sitemap-specs-ko.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'ko');
  if (urlPath === '/sitemap-specs-en.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'en');
  if (urlPath === '/sitemap-specs-ja.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'ja');
  if (urlPath === '/sitemap-specs-es.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'es');
  if (urlPath === '/sitemap-specs-id.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'id');
  if (urlPath === '/sitemap-specs-vi.xml' && req.method === 'GET') return renderSitemapSpecsLang(req, res, 'vi');
  if (urlPath === '/sitemap-blog.xml' && req.method === 'GET') return renderSitemapBlog(req, res);
  if (urlPath === '/llms.txt' && req.method === 'GET') return renderLlmsTxt(req, res);

  // 다국어 블로그 라우트 (언어 접두사 — 기존 /blog 라우트 앞에 배치)
  if (urlPath === '/ja/blog' && req.method === 'GET') return renderBlogList(req, res, 'ja');
  if (urlPath === '/en/blog' && req.method === 'GET') return renderBlogList(req, res, 'en');
  if (urlPath?.startsWith('/ja/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'ja');
  if (urlPath?.startsWith('/en/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'en');

  // 기존 라우트 (한국어 = 기본, 접두사 없음)
  if (urlPath === '/blog' && req.method === 'GET') return renderBlogList(req, res);
  if (urlPath?.startsWith('/blog/') && req.method === 'GET') return renderBlogPost(req, res);
  if (urlPath === '/ja/guide/ai-photo' && req.method === 'GET') return renderAiPhotoGuide(req, res, 'ja');
  if (urlPath === '/en/guide/ai-photo' && req.method === 'GET') return renderAiPhotoGuide(req, res, 'en');
  if (urlPath === '/guide/ai-photo' && req.method === 'GET') return renderAiPhotoGuide(req, res);
  if (urlPath === '/ja/guide' && req.method === 'GET') return renderGuide(req, res);
  if (urlPath === '/en/guide' && req.method === 'GET') return renderGuide(req, res);
  if (urlPath === '/guide' && req.method === 'GET') return renderGuide(req, res);
  // 다국어 FAQ 라우트
  if (urlPath === '/ja/faq' && req.method === 'GET') return renderFaq(req, res, 'ja');
  if (urlPath === '/en/faq' && req.method === 'GET') return renderFaq(req, res, 'en');
  if (urlPath === '/faq' && req.method === 'GET') return renderFaq(req, res);
  // 다국어 Pricing 라우트
  if (urlPath === '/ja/pricing' && req.method === 'GET') return renderPricing(req, res, 'ja');
  if (urlPath === '/en/pricing' && req.method === 'GET') return renderPricing(req, res, 'en');
  if (urlPath === '/pricing' && req.method === 'GET') return renderPricing(req, res);
  // === AI 헤드샷 ===
  if (urlPath === '/headshot' && req.method === 'GET') return renderHeadshot(req, res);
  if (urlPath === '/headshot/result' && req.method === 'GET') return renderHeadshotResult(req, res);
  if (urlPath === '/en/headshot' && req.method === 'GET') return renderHeadshot(req, res, 'en');
  if (urlPath === '/en/headshot/result' && req.method === 'GET') return renderHeadshotResult(req, res, 'en');
  if (urlPath === '/ja/headshot' && req.method === 'GET') return renderHeadshot(req, res, 'ja');
  if (urlPath === '/ja/headshot/result' && req.method === 'GET') return renderHeadshotResult(req, res, 'ja');
  // === Specs (규격 허브) === LANGS: ko(프리픽스 없음), en, ja, es — specs-url.js SPECS_LANGS 정본 참조
  if (urlPath === '/specs' && req.method === 'GET') return renderSpecsList(req, res);
  if (urlPath?.startsWith('/specs/') && req.method === 'GET') return renderSpecsDetail(req, res);
  if (urlPath === '/ja/specs' && req.method === 'GET') return renderSpecsList(req, res, 'ja');
  if (urlPath?.startsWith('/ja/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'ja');
  if (urlPath === '/en/specs' && req.method === 'GET') return renderSpecsList(req, res, 'en');
  if (urlPath?.startsWith('/en/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'en');
  if (urlPath === '/es/specs' && req.method === 'GET') return renderSpecsList(req, res, 'es');
  if (urlPath?.startsWith('/es/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'es');
  if (urlPath === '/id/specs' && req.method === 'GET') return renderSpecsList(req, res, 'id');
  if (urlPath?.startsWith('/id/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'id');
  if (urlPath === '/vi/specs' && req.method === 'GET') return renderSpecsList(req, res, 'vi');
  if (urlPath?.startsWith('/vi/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'vi');

  if (urlPath === '/ja/gallery' && req.method === 'GET') return renderGallery(req, res);
  if (urlPath === '/en/gallery' && req.method === 'GET') return renderGallery(req, res);
  if (urlPath === '/gallery' && req.method === 'GET') return renderGallery(req, res);
  if (urlPath === '/ja/board' && req.method === 'GET') return renderBoardList(req, res);
  if (urlPath === '/en/board' && req.method === 'GET') return renderBoardList(req, res);
  if (urlPath === '/board' && req.method === 'GET') return renderBoardList(req, res);
  if (urlPath === '/board/write' && req.method === 'GET') return renderBoardWrite(req, res);
  if (urlPath?.startsWith('/board/') && req.method === 'GET') return renderBoardPost(req, res);

  // === favicon.ico ===
  if (urlPath === '/favicon.ico') {
    try {
      const ico = readFileSync(join(__dirname, 'public/favicon-32.png'));
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(ico);
    } catch { /* fall through */ }
  }

  // === 정적 파일 ===
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
  if (filePath.endsWith('/')) filePath += 'index.html';

  // /admin/*.html 인증 가드 (로그인 페이지 제외)
  if (filePath.startsWith('/admin/') && filePath.endsWith('.html') && filePath !== '/admin/index.html') {
    if (!requireAdmin(req, res)) return;
  }

  const fullPath = join(__dirname, 'public', filePath);
  const ext = extname(filePath);

  try {
    let content, resolvedExt = ext;
    try {
      content = readFileSync(fullPath);
    } catch {
      if (!ext) {
        content = readFileSync(fullPath + '.html');
        resolvedExt = '.html';
      } else { throw new Error('Not Found'); }
    }
    // specs 퍼널 정적 자산(2026-07-12 분리): ?v=K_REVISION 쿼리로 배포 단위 버스트 — URL이 바뀌므로 장기 캐시 안전
    const isVersionedSpecsAsset = /^\/(?:js|css)\/specs-[\w-]+\.(?:js|css)$/.test(filePath);
    let cacheHeader = isVersionedSpecsAsset ? 'public, max-age=31536000, immutable'
      : ['.css', '.js'].includes(resolvedExt) ? 'no-cache' : 'public, max-age=3600';

    // 토스 클라이언트 키 주입 (2026-07-25): 정적 파일 하드코딩 제거 → 환경별 키 주입.
    // ⚠️ credits.html의 inline JS는 Docker 빌드 1단계에서 난독화된다(obfuscate.mjs, stringArray+base64).
    //    문자열 토큰은 배열로 인코딩되어 사라지므로 치환이 불가능 → <head>에 전역 변수를 주입하고
    //    페이지는 window.__MONKOS_TOSS_CK__를 읽는다. 환경별로 내용이 다르므로 캐시 금지.
    if (/^\/credits(?:\.html)?$/.test(filePath)) {
      const tossClientKey = process.env.TOSS_CLIENT_KEY || '';
      if (!tossClientKey) {
        log('🚨 TOSS_CLIENT_KEY 미주입 — credits.html 결제 위젯이 뜨지 않습니다', 'ERROR');
      }
      let html = content.toString('utf8');
      const headTag = html.match(/<head[^>]*>/i);
      if (headTag) {
        const at = headTag.index + headTag[0].length;
        html = html.slice(0, at)
          + `<script>window.__MONKOS_TOSS_CK__=${JSON.stringify(tossClientKey)};</script>`
          + html.slice(at);
        content = Buffer.from(html, 'utf8');
      } else {
        log('🚨 credits.html에 <head>가 없어 토스 키 주입 실패 — 결제 위젯이 뜨지 않습니다', 'ERROR');
      }
      cacheHeader = 'no-cache';
    }
    // /proto/* = 미완성 프로토타입. robots.txt는 손대지 않고 응답 헤더로만 색인을 막는다
    // (Disallow는 크롤을 막을 뿐 색인 자체를 막지 못하고, 이미 수집된 URL의 색인 해제도 안 된다)
    const headers = {
      'Content-Type': MIME_TYPES[resolvedExt] || 'application/octet-stream',
      'Cache-Control': cacheHeader,
    };
    if (filePath.startsWith('/proto/')) headers['X-Robots-Tag'] = 'noindex, nofollow';

    res.writeHead(200, headers);
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// === 서버 시작 ===
httpServer.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS Portal — monkos.ai 서버 시작');
  log('='.repeat(60));
  // 무음 fail-secure 가시화 (2026-08-25 쌍아 관찰 1번): EDGE_TRUST_KEY가 빠진 채 배포되면
  // 전 트래픽이 조용히 비신뢰로 떨어져 429 충돌·권역 오판·page_view 전량 거부가 경고 없이 발생한다.
  if (!process.env.EDGE_TRUST_KEY) {
    log('⚠️ EDGE_TRUST_KEY 미설정 — 엣지 신뢰 판정 전면 비활성 (fail-secure). CF 경유 트래픽의 레이트리밋 실IP·지역 감지·page_view 계측이 모두 무효화된 상태. deploy.sh --set-secrets 라인 확인 필요', 'ERROR');
  }
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: Vertex AI ADC`);
  log(`텍스트 모델(CMS·콜스코프): ${TEXT_MODEL} @global`);
  log(`DB: Firestore`);
  log('='.repeat(60));
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log(`Lemon Squeezy: ${LEMONSQUEEZY_API_KEY ? '설정됨' : '미설정'}`);
  const kService = process.env.K_SERVICE || '';
  if (TOSS_SECRET_KEY && !TOSS_SECRET_KEY.startsWith('live_')) {
    log(`🚨 TOSS_SECRET_KEY가 테스트 키입니다! (${TOSS_SECRET_KEY.slice(0, 10)}...)`, 'ERROR');
    if (TEAM_CHAT_ID && !kService.includes('-dev')) {
      sendTelegramMessage(TEAM_CHAT_ID, `🚨 *포털 서버 시작 — 토스 테스트 키 감지*\nTOSS_SECRET_KEY가 \`${TOSS_SECRET_KEY.slice(0, 10)}...\`입니다.\n프로덕션에서 결제가 실패합니다. 즉시 확인 필요!`, TELEGRAM_TEAM_API).catch(() => {});
    }
  }
  log(`Toss Payments: ${TOSS_SECRET_KEY ? (TOSS_SECRET_KEY.startsWith('live_') ? '설정됨 (LIVE)' : '⚠️ TEST 키!') : '미설정'}`);
  // 2026-07-25: 클라이언트 키는 서빙 시 치환 주입 — 미주입이면 위젯이 조용히 안 뜬다(무음 강등 금지)
  const tossClientKey = process.env.TOSS_CLIENT_KEY || '';
  if (!tossClientKey) {
    log('🚨 TOSS_CLIENT_KEY 미주입 — 결제 위젯이 뜨지 않습니다', 'ERROR');
  } else if (!kService.includes('-dev') && !tossClientKey.startsWith('live_')) {
    log('🚨 prod인데 TOSS_CLIENT_KEY가 라이브 키가 아닙니다 — 결제 위젯이 테스트 모드입니다', 'ERROR');
  }
  log(`Toss Client Key: ${tossClientKey ? (tossClientKey.startsWith('live_') ? '설정됨 (LIVE)' : '설정됨 (TEST)') : '미설정'}`);
  log(`Telegram CS Bot: ${TELEGRAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Event Bot: ${TELEGRAM_EVENT_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Team Bot: ${TELEGRAM_TEAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Channel: ${TELEGRAM_CHANNEL_ID || '미설정'}`);
  log(`Team Chat ID: ${TEAM_CHAT_ID ? '설정됨' : '미설정'}`);
  log(`Kakao Login: ${KAKAO_REST_API_KEY ? '설정됨' : '미설정'}`);
  log(`Kakao Channel: ${KAKAO_CHANNEL_ID || '미설정'}`);
  log(`LINE Login: ${LINE_CHANNEL_ID ? '설정됨' : '미설정'}`);
  log(`LINE Messaging: ${LINE_MESSAGING_ACCESS_TOKEN ? '설정됨' : '미설정'}`);
  log(`CMS Admin: ${ADMIN_UIDS.length > 0 ? ADMIN_UIDS.length + '명 등록' : '전체 허용(개발모드)'}`);
  log(`Agent API Keys: ${AGENT_API_KEYS.length > 0 ? AGENT_API_KEYS.length + '개 등록' : '미설정'}`);
  log(`Naver Search: ${NAVER_CLIENT_ID ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});
