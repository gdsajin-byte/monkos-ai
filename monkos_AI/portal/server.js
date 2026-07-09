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

// === 공통 인프라 ===
import {
  PORT, PROJECT_ID, LOCATION, log,
  ALLOWED_ORIGINS, MIME_TYPES, usersCollection,
  GOOGLE_CLIENT_ID, LEMONSQUEEZY_API_KEY, TOSS_SECRET_KEY,
  TELEGRAM_BOT_TOKEN, TELEGRAM_EVENT_BOT_TOKEN, TELEGRAM_TEAM_BOT_TOKEN,
  TELEGRAM_CHANNEL_ID, TEAM_CHAT_ID,
  TELEGRAM_TEAM_API, sendTelegramMessage,
  KAKAO_REST_API_KEY, KAKAO_CHANNEL_ID, LINE_CHANNEL_ID,
  LINE_MESSAGING_ACCESS_TOKEN,
  ADMIN_UIDS, AGENT_API_KEYS, NAVER_CLIENT_ID,
  parseCookies, parseJsonBody,
} from './lib/shared/config.js';

// === 핸들러 모듈 ===
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleRedirectAuth, handleGoogleRedirectCallback, handleGoogleAuth, handleAuthToken, handleAuthVerify, handleAuthRefresh, handleVerifyCookie, handleLogout } from './lib/auth.js';
import { handleCreditsGet, handleCreditsUse, handleCreditsRefund } from './lib/credits.js';
import { handleCheckout, handleLemonSqueezyWebhook, handleTossWebhook, handleTossConfirm, handleTossDirect, handleDownloadDirect, handleTossSuccess, handleTossFail, handleDirectInit, handleDirectStatus, consumeGenerateQuota, refundGenerateQuota } from './lib/payments.js';
import { handleTelegramGateCode, handleTelegramMissionCode, handleConsentSns, handleMissionComplete, handleCreditsEvent } from './lib/events.js';
import { handleTelegramCSWebhook, handleTelegramEventWebhook } from './lib/telegram.js';
import { handleTelegramTeamWebhook, handleTeamNotify } from './lib/telegram-team.js';
import { handleVerifyInit } from './lib/tg-auth.js';
import { handlePassportIssue, handleUploadMission } from './lib/tg-cs.js';
import { handleKakaoChatbot } from './lib/kakao-chatbot.js';
import { handleLineWebhook } from './lib/line-chatbot.js';
import { handleWebChat, handleCoaching } from './lib/coaching.js';
import { handleHeadshotGenerate } from './lib/headshot-route.js';
import { generateIdPhoto } from './lib/idphoto-generate.js';
import { cropToSpec, warmupCropEngine, getSpecCropParams } from './lib/spec-crop.js';
import { matteSpecPipeline, matteFitPipeline, matteEnabled, matteSlugAllowed, warmupMatteEngine, stripDataUri, getSpecBgColor } from './lib/matte.js';
import { judgeMetrics, metricsFromFit } from './lib/spec-judge.js';
import { trackEvent, linkIdentity } from './lib/tracking.js';
import { saveImages } from './lib/gcs-save.js';
import { handleAgentAuth, requireAdmin } from './lib/cms/admin-auth.js';
import { handleDashboardSummary, handleDashboardUsers, handleDashboardUsers360, handleDashboardCredits, handleDashboardTraffic } from './lib/cms/dashboard.js';
import { handleBlogList, handleBlogGet, handleBlogCreate, handleBlogUpdate, handleBlogDelete } from './lib/cms/blog.js';
import { handleFaqList, handleFaqCreate, handleFaqUpdate, handleFaqDelete } from './lib/cms/faq.js';
import { handleGalleryList, handleGalleryCreate, handleGalleryUpdate, handleGalleryDelete } from './lib/cms/gallery.js';
import { handleBoardPublicList, handleBoardPublicGet, handleBoardPublicCreate, handleBoardPublicDelete, handleBoardAdminList, handleBoardAdminReply, handleBoardAdminDelete, handleBoardAdminToggle } from './lib/cms/board.js';
import { handleUpload, handleImageList, handleImageDelete } from './lib/cms/upload.js';
import { handleIdphotoResults } from './lib/cms/idphoto-review.js';
import { handleAiImage, handleAiThumbnail, handleAiSuggest } from './lib/cms/ai.js';
import { handleTranslate } from './lib/cms/translate.js';
import { handleSearch } from './lib/cms/search.js';
import { renderBlogList, renderBlogPost, renderFaq, renderGallery, renderBoardList, renderBoardPost, renderBoardWrite, renderGuide, renderAiPhotoGuide, renderSitemap, renderSitemapStatic, renderSitemapSpecs, renderSitemapBlog, renderPricing, renderSpecsList, renderSpecsDetail } from './lib/cms/render.js';
import { renderHome, handleSettingsGet, handleSettingsPut, handleLayoutGet, handleLayoutPut } from './lib/cms/home.js';
import { renderLlmsTxt } from './lib/cms/render-llms.js';
import { renderHeadshot, renderHeadshotResult } from './lib/cms/render-headshot.js';
import { BLOG_REDIRECTS } from './lib/cms/redirects.js';
import { handlePodStart, handlePodStatus, handlePodStop, handleComfyProxy } from './lib/vton/runpod.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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
    return { buf, b64: buf.toString('base64'), width, height, rawBase64 };
  } catch (err) {
    log(`[normalizeImage] sharp 실패 (${err.message}) → 원본 폴백`, 'WARNING');
    const { width, height } = await sharp(raw).metadata().catch(() => ({ width: 0, height: 0 }));
    const b64 = rawBase64.includes(',') ? rawBase64.split(',')[1] : rawBase64;
    return { buf: raw, b64, width, height, rawBase64 };
  }
}

function detectLang(req) {
  const urlMatch = req.url.match(/^\/(ja|en)(\/|$|\?)/);
  if (urlMatch) return urlMatch[1];

  const cookies = parseCookies(req.headers.cookie);
  if (cookies.monkos_lang && ['ko', 'ja', 'en'].includes(cookies.monkos_lang)) {
    return cookies.monkos_lang;
  }

  const accept = (req.headers['accept-language'] || '').toLowerCase();
  if (accept.startsWith('ja')) return 'ja';
  if (accept.startsWith('en')) return 'en';
  return 'ko';
}

function detectPaymentRegion(req) {
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
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const now = Date.now();
  if (!global._rateLimits) global._rateLimits = {};
  const key = `${bucket}:${ip}`;
  const rl = global._rateLimits[key] || { count: 0, reset: now + windowMs };
  if (now > rl.reset) { rl.count = 0; rl.reset = now + windowMs; }
  rl.count++;
  global._rateLimits[key] = rl;
  return rl.count <= limit;
}

function trackPageView(req) {
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

  if (req.method === 'GET') {
    req.lang = detectLang(req);
    req.paymentRegion = detectPaymentRegion(req);
    const cookies = parseCookies(req.headers.cookie);
    const setCookies = [];
    if (cookies.monkos_lang !== req.lang) {
      setCookies.push(`monkos_lang=${req.lang};Domain=.monkos.ai;Path=/;Max-Age=31536000;SameSite=Lax`);
    }
    if (!cookies.monkos_sid) {
      const sid = crypto.randomUUID();
      setCookies.push(`monkos_sid=${sid};Domain=.monkos.ai;Path=/;Max-Age=63072000;SameSite=Lax`);
      req.sessionId = sid;
    } else {
      req.sessionId = cookies.monkos_sid;
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
      const buf = norm.buf;
      const { width: W, height: H } = { width: norm.width, height: norm.height };

      // ① 얼굴 검출 → 러프 크롭 창 — FaceMesh 안정 입력 (사일런트 미스 방지). 얼굴높이 4배 창.
      // 1순위 SCRFD(crop-engine /api/detect, 정규화 프레임 절대픽셀 — 2026-07-08 비교실측 채택):
      //   Gemini 박스의 흔들림(카나리 7호·금일 오배치)이 뿌리라 검출을 결정론 엔진으로 교체.
      // 폴백 legacy = 클라이언트 전달 Gemini faceBox (비율 0~1 정본). FACE_DETECT_ENGINE=legacy로 원복.
      const CROP_ENGINE_URL = process.env.CROP_ENGINE_URL || '';
      let rx = 0, ry = 0, roughScale = 1, roughBuf = buf;
      let fbPx = null;
      let detectSrc = 'none';
      if ((process.env.FACE_DETECT_ENGINE || 'scrfd') !== 'legacy' && CROP_ENGINE_URL) {
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
          .resize(outW, outH, { fit: 'fill' }).png().toBuffer();
        return { buf: b, rx: left, ry: top, scale: sc };
      }
      // ② crop-engine 기하 피팅 — 정규화 입력, 랜드마크 해부학 검증, 실패 시 스케일 바꿔 1회 재시도.
      // 사일런트 미스(감지 성공 플래그 + 쓰레기 좌표)는 검증으로만 잡힌다 — 엉뚱한 가이드 절대 금지.
      let frame = null, lines = null, gate = null;
      for (const targetFaceH of [280, 200]) {
        const rough = await buildRough(targetFaceH);
        const fitRes = await fetch(`${CROP_ENGINE_URL}/api/fit-spec`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: rough.buf.toString('base64'), spec, hairScan: false }),
          signal: AbortSignal.timeout(45000),
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
      if (!frame) {
        slog(`[Fit] ${slug}: 정규화·재시도 후에도 신뢰 랜드마크 확보 실패 → fit 포기 (기존 경로 폴백)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, code: 'FIT_SANITY' }));
      }
      const frameInitial = { ...frame };

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
        poseCheck.eyeOpen = { value: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1), ok: Math.min(gate.eyeOpenL || 1, gate.eyeOpenR || 1) > 0.15 };
        poseCheck.mouthOpen = { value: gate.mouthOpen, ok: (gate.mouthOpen || 0) < 0.15 };
      }
      slog(`[Fit] ${slug}: face=${metrics.faceMm}mm top=${metrics.topMm}mm btm=${metrics.bottomMm}mm eye=${(metrics.eyeRatio * 100).toFixed(1)}% judge=${judge.blocked ? 'BLOCKED' : judge.face + '/' + judge.eye} vision=${vision ? (vision.note || 'ok') : 'skip'} detect=${detectSrc}${gate ? ` gate={mouth:${gate.mouthOpen},eyeL:${gate.eyeOpenL},eyeR:${gate.eyeOpenR},roll:${gate.rollDeg},yaw:${gate.yawRatio}}` : ''}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true, frame, frameInitial, lines, gate, poseCheck, imageSize: { width: W, height: H }, meta, metrics, judge, vision,
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
      const norm = await normalizeImage(body.image);
      if (!norm.width || !norm.height) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지를 해석할 수 없습니다. JPG 또는 PNG로 올려주세요.', code: 'DECODE_FAILED' }));
      }
      const CROP_ENGINE_URL = process.env.CROP_ENGINE_URL || '';
      let det = null;
      try {
        det = await fetch(`${CROP_ENGINE_URL}/api/detect`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: norm.b64 }),
          signal: AbortSignal.timeout(15000),
        }).then((r) => r.json());
      } catch (de) {
        slog(`[IDPhoto][precheck] SCRFD 불가 (${de.message}) → fail-open (fit이 재검출·방어)`);
      }
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
          // 크기: 비율 기반 (2026-07-09 게이트 강화 → 12:00 완화: 재규격 여권사진 bbox 0.53~0.68 수용.
          // 잘림 판정은 아래 정수리 여백 게이트가 담당, 0.80은 측량 신뢰 대역 위생 캡)
          faceRatio = +(fbH / norm.height).toFixed(3);
          if (measurable && faceRatio < 0.20) { measurable = false; reason = 'face_too_small'; }
          if (measurable && faceRatio > 0.80) { measurable = false; reason = 'face_too_close'; }
          // 위치: 상단·하단 잘림 + 좌우 치우침
          if (measurable && y1 / norm.height < 0.05) { measurable = false; reason = 'head_cropped'; }
          if (measurable && (norm.height - y2) / norm.height < 0.05) { measurable = false; reason = 'chin_cropped'; }
          const faceCenterX = (x1 + x2) / 2;
          if (measurable && Math.abs(faceCenterX - norm.width / 2) / norm.width > 0.15) { measurable = false; reason = 'off_center'; }
          // 6DRepNet 정밀 포즈 (5점 kps 간접추정 교체, R&D 실측 2026-07-09)
          try {
            const poseRes = await fetch(`${CROP_ENGINE_URL}/api/headpose`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: norm.b64, bbox: [x1, y1, x2, y2] }),
              signal: AbortSignal.timeout(10000),
            }).then(r => r.json());
            if (poseRes.pose) {
              posePitch = poseRes.pose.pitch;
              poseYaw = poseRes.pose.yaw;
              poseRoll = poseRes.pose.roll;
              poseModel = '6drep';
            }
          } catch (pe) {
            slog(`[IDPhoto][precheck] headpose 불가 (${pe.message}) → 5점 kps 폴백`);
          }
          // 5점 kps 폴백 + 정수리 잘림 게이트 (kps는 항상 계산 — crown 추정에 필요)
          const k = f.kps;
          if (k && k.length >= 5) {
            rollDeg = +((Math.atan2(k[1][1] - k[0][1], k[1][0] - k[0][0]) * 180) / Math.PI).toFixed(1);
            const eyeSpan = Math.hypot(k[1][0] - k[0][0], k[1][1] - k[0][1]) || 1;
            const midX = (k[0][0] + k[1][0] + k[3][0] + k[4][0]) / 4;
            yawRatio = +(((k[2][0] - midX) / eyeSpan)).toFixed(3);
            const eyeY = (k[0][1] + k[1][1]) / 2;
            const crownEstY = 2 * eyeY - y2;
            const hairTopEstY = crownEstY - (y2 - crownEstY) * 0.08;
            crownMargin = +(hairTopEstY / norm.height).toFixed(3);
            if (measurable && hairTopEstY < 0) { measurable = false; reason = 'crown_cropped'; }
          }
          // 포즈 게이트 — 6DRepNet 우선, 불가 시 5점 kps 폴백
          const effectiveRoll = poseRoll !== null ? poseRoll : rollDeg;
          const effectiveYaw = poseYaw !== null ? poseYaw : (yawRatio !== null ? Math.asin(Math.min(1, Math.abs(yawRatio) * 2)) * 180 / Math.PI * Math.sign(yawRatio) : null);
          const effectivePitch = posePitch;
          if (!poseModel) poseModel = 'kps';
          if (measurable && effectiveRoll !== null && Math.abs(effectiveRoll) > 8) { measurable = false; reason = 'head_tilted'; }
          if (measurable && effectiveYaw !== null && Math.abs(effectiveYaw) > 15) { measurable = false; reason = 'not_frontal'; }
          if (measurable && effectivePitch !== null && Math.abs(effectivePitch) > 20) { measurable = false; reason = effectivePitch > 0 ? 'chin_too_low' : 'chin_too_high'; }
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
      if (measurable) warmupMatteEngine(); // 게이트 통과자만 예열 — 구경·불합격 트래픽 웜 비용 차단
      const out = { measurable, rejectionReason: reason, faceBox, faceRatio, checks: [] };
      slog(`[IDPhoto][precheck] 코드게이트 측정성=${measurable}${reason ? `(${reason})` : ''} faces=${nFaces} fbH=${faceRatio !== null ? Math.round(faceRatio * norm.height) : '-'}px crown=${crownMargin} bright=${bright} shadow=${shadowDiff} roll=${poseRoll ?? rollDeg} yaw=${poseYaw ?? yawRatio} pitch=${posePitch} poseModel=${poseModel ?? 'none'} ${Date.now() - t0}ms`);
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

      // 결제 게이트: ① 결제 토큰(비로그인 단건) ② 로그인 크레딧 — 둘 다 없으면 402
      let gateMode = null;
      let gateUserId = 'specs-visitor';
      let remainingGenerates = null;
      if (paymentToken) {
        const gate = await consumeGenerateQuota(paymentToken);
        if (!gate.ok) {
          res.writeHead(gate.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: gate.error, code: gate.code }));
        }
        gateMode = 'token';
        remainingGenerates = gate.remainingGenerates;
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
      }

      // 엔진 예열 — 감지·크롭/매팅과 병렬로 콜드스타트 흡수 (fire-and-forget)
      if (slug) { warmupCropEngine(); warmupMatteEngine(); }

      const norm = await normalizeImage(image);

      // 신경로 (IDPASS 순서, ORDER_20260707): 원본에서 감지·크롭 → BiRefNet 매팅 → 배경색 합성.
      // 원본 픽셀 보존 + Gemini 재생성물 위 감지의 비결정성 제거.
      // MATTE_API_URL 미설정·감지 미안착·matte 장애 → null 반환 → 현행 Gemini 경로(L3) 강등.
      let finalBase64 = null;
      let cropEngine = null;
      let genTrack = null;
      let resultMeta = null;
      if (slug && matteEnabled()) {
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
          if (matteRes) {
            finalBase64 = matteRes.image;
            cropEngine = matteRes.cropEngine;
            genTrack = 'birefnet';
            resultMeta = matteRes.meta || null;
          }
        } catch (e) {
          log(`[IDPhoto] matte 신경로 예외 (${e.message}) → Gemini 폴백`, 'ERROR');
        }
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
          if (gateMode === 'token') {
            refundGenerateQuota(paymentToken).catch(() => {});
          } else if (gateMode === 'credits') {
            fetch(`http://localhost:${PORT}/api/credits/refund`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
              body: JSON.stringify({ userId: gateUserId, type: 'generate' }),
            }).catch(() => {});
          }
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
        await saveImages('idphoto', gateUserId, slug || format || 'passport', norm.rawBase64, finalBase64);
      } catch (e) {
        log(`[IDPhoto] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
      }
      log(`[IDPhoto] 생성 완료: 규격=${slug || format || 'passport'}, 게이트=${gateMode}${genTrack ? `, 트랙=${genTrack}` : ''}${cropEngine ? `, 크롭=${cropEngine}` : ''}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ image: finalBase64, remainingGenerates, track: genTrack, cropEngine, meta: resultMeta }));
    } catch (err) {
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
    if (!checkRateLimit(req, 'track', 60)) { res.writeHead(429); return res.end(); }

    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 1048576) { res.writeHead(413); return res.end(); }

    const body = await parseJsonBody(req);
    const events = (body.events || []).slice(0, 10);
    const ALLOWED_EVENTS = [
      'click_cta', 'upload_image', 'select_style',
      'open_credit_shop', 'start_payment', 'session_end',
      'generate_complete',
    ];
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.monkos_sid || null;
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
  if (urlPath?.startsWith('/api/board/') && req.method === 'GET') return handleBoardPublicGet(req, res);
  if (urlPath?.startsWith('/api/board/') && req.method === 'DELETE') return handleBoardPublicDelete(req, res);

  // === CMS 게시판 관리자 API ===
  if (urlPath === '/api/admin/board' && req.method === 'GET') return handleBoardAdminList(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/reply') && req.method === 'POST') return handleBoardAdminReply(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && urlPath?.endsWith('/toggle') && req.method === 'PUT') return handleBoardAdminToggle(req, res);
  if (urlPath?.startsWith('/api/admin/board/') && req.method === 'DELETE') return handleBoardAdminDelete(req, res);

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
  if (req.method === 'GET' && !urlPath.startsWith('/api/') && !urlPath.startsWith('/admin/') && !urlPath.endsWith('.xml') && !urlPath.endsWith('.txt')) {
    trackPageView(req);
  }

  if ((urlPath === '/' || urlPath === '/index.html') && req.method === 'GET') return renderHome(req, res);
  // 다국어 홈 라우트 (/ja/, /en/ → 경로 방식 통일)
  if ((urlPath === '/ja' || urlPath === '/ja/') && req.method === 'GET') return renderHome(req, res, 'ja');
  if ((urlPath === '/en' || urlPath === '/en/') && req.method === 'GET') return renderHome(req, res, 'en');
  if (urlPath === '/sitemap.xml' && req.method === 'GET') return renderSitemap(req, res);
  if (urlPath === '/sitemap-static.xml' && req.method === 'GET') return renderSitemapStatic(req, res);
  if (urlPath === '/sitemap-specs.xml' && req.method === 'GET') return renderSitemapSpecs(req, res);
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
  // === Specs (규격 허브) ===
  if (urlPath === '/specs' && req.method === 'GET') return renderSpecsList(req, res);
  if (urlPath?.startsWith('/specs/') && req.method === 'GET') return renderSpecsDetail(req, res);
  if (urlPath === '/ja/specs' && req.method === 'GET') return renderSpecsList(req, res, 'ja');
  if (urlPath?.startsWith('/ja/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'ja');
  if (urlPath === '/en/specs' && req.method === 'GET') return renderSpecsList(req, res, 'en');
  if (urlPath?.startsWith('/en/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'en');

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
    const cacheHeader = ['.css', '.js'].includes(resolvedExt) ? 'no-cache' : 'public, max-age=3600';
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[resolvedExt] || 'application/octet-stream',
      'Cache-Control': cacheHeader,
    });
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
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: Vertex AI ADC`);
  log(`챗봇: gemini-2.5-flash`);
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
