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
import { handleCheckout, handleLemonSqueezyWebhook, handleTossConfirm, handleTossDirect, handleDownloadDirect, handleTossSuccess, handleTossFail } from './lib/payments.js';
import { handleTelegramGateCode, handleTelegramMissionCode, handleConsentSns, handleMissionComplete, handleCreditsEvent } from './lib/events.js';
import { handleTelegramCSWebhook, handleTelegramEventWebhook } from './lib/telegram.js';
import { handleTelegramTeamWebhook, handleTeamNotify } from './lib/telegram-team.js';
import { handleVerifyInit } from './lib/tg-auth.js';
import { handlePassportIssue, handleUploadMission } from './lib/tg-cs.js';
import { handleKakaoChatbot } from './lib/kakao-chatbot.js';
import { handleLineWebhook } from './lib/line-chatbot.js';
import { handleWebChat, handleCoaching } from './lib/coaching.js';
import { generateHeadshot } from './lib/headshot-generate.js';
import { generateIdPhoto } from './lib/idphoto-generate.js';
import { trackEvent, linkIdentity } from './lib/tracking.js';
import { saveImages } from './lib/gcs-save.js';
import { handleAgentAuth, requireAdmin } from './lib/cms/admin-auth.js';
import { handleDashboardSummary, handleDashboardUsers, handleDashboardCredits, handleDashboardTraffic } from './lib/cms/dashboard.js';
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

function trackPageView(req) {
  trackEvent({
    eventName: 'page_view',
    userId: req.userId || null,
    sessionId: req.sessionId,
    pagePath: req.url.split('?')[0],
    lang: req.lang,
    region: req.paymentRegion,
    service: 'portal',
    referer: req.headers.referer || null,
    userAgent: req.headers['user-agent'] || null,
    ipCountry: req.paymentRegion,
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

  // === AI 헤드샷 생성 (Vertex AI 직접) ===
  if (urlPath === '/api/headshot/generate' && req.method === 'POST') {
    try {
      const { verifyAuthToken, parseCookies, parseJsonBody } = await import('./lib/shared/config.js');
      const cookies = parseCookies(req.headers.cookie);
      const token = cookies.monkos_session;
      if (!token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '인증 필요' }));
      }
      const payload = verifyAuthToken(token);
      const userId = payload?.userId;
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '인증 만료' }));
      }

      const body = await parseJsonBody(req);
      const { image, purpose, model } = body;
      if (!image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지 필수' }));
      }

      const creditRes = await fetch(`http://localhost:${PORT}/api/credits/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
        body: JSON.stringify({ userId, type: 'generate' }),
      });
      const creditData = await creditRes.json();
      if (!creditRes.ok) {
        res.writeHead(creditRes.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(creditData));
      }

      const styleModifiers = {
        corporate: 'Composed, authoritative expression. Clean solid-color backdrop (dark navy or charcoal gray). Dramatic studio lighting with subtle rim light. Executive boardroom atmosphere. Neatly styled hair as if freshly blow-dried — same hairstyle but tidier. Polished, refined makeup if present in original — do not add makeup not in original. Full formal attire mood.',
        linkedin_pro: 'Confident, approachable expression with a natural smile. Modern office environment with soft bokeh background (blurred bookshelves, window light, office plants). Natural window-style lighting. Lightly groomed hair — maintain original style but neater. Clean, natural-looking makeup if present. Smart professional attire mood — blazer with shirt, no tie necessary.',
        professional: 'Warm, approachable expression with a gentle confident smile. Bright neutral studio background (light gray or off-white). Even, diffused lighting. Naturally tidy hair — original style maintained with subtle polish. Neat, understated makeup if present. Light business-casual styling — clean shirt with a soft unstructured blazer, not heavy or overly formal. The outfit should look natural and coherent, not layered over existing clothing.',
        creative: 'Relaxed, genuine smile showing personality. Warm-toned environment or textured backdrop (exposed brick, artistic studio, warm wood). Natural window-style lighting with soft shadows. Hair kept exactly as original — embrace the natural look. Minimal makeup, natural skin. Smart-casual creative industry vibe — individuality over formality.',
        dating: 'Natural, confident expression with a charming relaxed smile. Stylish urban lifestyle setting — trendy café interior with warm ambient lighting, modern boutique storefront, or chic city street with soft bokeh. Hair styled with effortless intention — looks natural but clearly groomed. Fresh, dewy makeup if present. Fashionable smart-casual outfit — current trend-aware styling, well-coordinated colors, the kind of outfit you would carefully choose for a first date in Gangnam or Hongdae. Sophisticated but not overdressed.',
      };
      const basePrompt = 'Waist-up portrait, crop above the navel. Do NOT show full body, legs, or desk/furniture below waist. Keep the subject\'s hairstyle exactly as-is, only tidy and groom. The subject must be clearly recognizable as the SAME person in the input photo. Enhance existing makeup to match the style level if makeup is present in the original photo. Do NOT add makeup that is not present in the original.';
      const styleMod = styleModifiers[purpose] || styleModifiers.linkedin_pro;
      const customPrompt = basePrompt + ' ' + styleMod;

      let generatedBase64;
      try {
        generatedBase64 = await generateHeadshot({
          image, purpose: purpose || 'linkedin_pro', model: model || 'nano-banana-pro', customPrompt, userId,
        });
      } catch (genErr) {
        await fetch(`http://localhost:${PORT}/api/credits/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
          body: JSON.stringify({ userId, type: 'generate' }),
        });
        log(`[Headshot] 생성 실패 → 크레딧 환불: ${userId} (${genErr.message})`, 'WARNING');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: genErr.message || '생성 실패' }));
      }

      try {
        await saveImages('headshot', userId, purpose || 'linkedin_pro', image, generatedBase64);
        log(`[Headshot] GCS 저장 완료: ${userId}`);
      } catch (e) {
        log(`[Headshot] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
      }

      log(`[Headshot] 생성 완료: ${userId}, 스타일: ${purpose}`);
      trackEvent({
        eventName: 'api_generate', userId, sessionId: req.sessionId,
        service: 'headshot', params: { style: purpose, model: model },
      }).catch(() => {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ image: generatedBase64, credits: creditData.credits }));
    } catch (err) {
      log(`[Headshot] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '서버 오류' }));
    }
  }

  // === 증명사진 규격 검수 ===
  if (urlPath === '/api/idphoto/precheck' && req.method === 'POST') {
    try {
      const { parseJsonBody, log: slog } = await import('./lib/shared/config.js');
      const { GoogleGenAI } = await import('@google/genai');
      const body = await parseJsonBody(req);
      if (!body.image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지 필수' }));
      }
      const base64Data = body.image.includes(',') ? body.image.split(',')[1] : body.image;
      const ai = new GoogleGenAI({ vertexai: true, project: process.env.PROJECT_ID, location: 'us-central1' });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: `You are a STRICT photo evaluator for MONKOS AI passport photo service. The user uploads a photo that AI will retouch into a passport photo. You must evaluate whether this input photo is SUITABLE for AI processing. Be strict — AI can fix backgrounds and lighting, but it CANNOT fix fundamentally unsuitable inputs.

CRITICAL RULES:
- This must be a PORTRAIT photo of a SINGLE PERSON showing their FACE clearly.
- The person must be wearing appropriate clothing (at minimum a top/shirt covering shoulders).
- Swimwear, underwear, lingerie, bare chest, costumes, or inappropriate clothing = IMMEDIATE FAIL for clothing AND suitability.
- Face must be roughly frontal and occupy a significant portion of the image.

Every item must include a "warnMsg" field: null if pass, a short Korean explanation if warn or fail.

ITEM 1 — "정면 응시" (Frontal face):
- PASS if: face is roughly frontal (within ~10 degrees), shoulders relatively square.
- WARN if: face or shoulders noticeably angled (10-25 degrees). Set warnMsg: "측면 각도가 커서 AI 보정 시 실물과 다를 수 있습니다."
- FAIL if: 3/4 pose, profile view, extreme angle, or back of head. Set warnMsg: "정면에 가까운 사진을 올려주세요."

ITEM 2 — "눈썹 노출" (Eyebrows visible):
- PASS if: both eyebrows mostly visible.
- WARN if: bangs partially cover eyebrows. Set warnMsg: "앞머리가 눈썹을 가려 AI가 추정 보정합니다."
- FAIL if: face obscured by hair/hat/mask/hand. Set warnMsg: "얼굴이 가려지지 않은 사진을 올려주세요."

ITEM 3 — "배경" (Background):
- PASS if: any background — AI will replace it.
- WARN if: extremely cluttered background with objects overlapping the person. Set warnMsg: "복잡한 배경은 AI 제거 시 경계가 부자연스러울 수 있습니다."

ITEM 4 — "조명" (Lighting):
- PASS if: face reasonably lit.
- WARN if: strong one-sided shadows or backlighting. Set warnMsg: "강한 그림자로 AI 보정 후 얼굴 톤이 달라질 수 있습니다."
- FAIL if: face in complete darkness/silhouette. Set warnMsg: "얼굴이 밝게 보이는 사진을 올려주세요."

ITEM 5 — "표정" (Expression):
- PASS if: neutral or slight closed-mouth smile.
- WARN if: teeth showing or laughing. Set warnMsg: "입을 다문 표정으로 AI가 보정합니다. 실물과 다를 수 있습니다."

ITEM 6 — "상의" (Clothing):
- PASS if: normal clothing (shirt, jacket, blouse, etc.) covering shoulders.
- WARN if: white top (will blend with white background). Set warnMsg: "흰색 상의는 흰 배경과 경계가 불분명할 수 있습니다."
- FAIL if: underwear, lingerie, swimwear, bare chest/shoulders, costume, or no clothing visible above chest. Set warnMsg: "증명사진에 적합한 상의를 착용한 사진을 올려주세요."

ITEM 7 — "안경/렌즈" (Glasses):
- PASS if: no glasses or clear glasses without glare.
- WARN if: glasses with light reflection. Set warnMsg: "안경 반사를 AI가 제거합니다. 눈 주변이 실물과 다를 수 있습니다."
- FAIL if: dark sunglasses or colored lenses. Set warnMsg: "선글라스/컬러렌즈를 벗고 촬영한 사진을 올려주세요."

ITEM 8 — "사진 적합성" (Photo suitability):
- PASS if: single person, face clearly visible, face occupies ~30%+ of image, bust-up framing.
- WARN if: face somewhat small (20-30%), slight blur. Set warnMsg: "얼굴 비중이 작아 AI 보정 시 실물과 다를 수 있습니다. 가슴 위까지 나온 사진을 권장합니다."
- FAIL if: multiple people, face <20% of image, full-body shot, extremely blurry, no face, or waist-down visible. Set warnMsg: "1인 정면 얼굴(가슴 위 구도) 사진을 올려주세요."

Respond in JSON only:
{"checks":[{"id":"frontal","label":"정면 응시","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"eyebrow","label":"눈썹 노출","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"background","label":"배경","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"lighting","label":"조명","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"expression","label":"표정","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"clothing","label":"상의","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"glasses","label":"안경/렌즈","pass":bool,"warn":bool,"warnMsg":"string or null"},{"id":"suitability","label":"사진 적합성","pass":bool,"warn":bool,"warnMsg":"string or null"}]}` }
        ]}],
        config: { responseMimeType: 'application/json' },
      });
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed;
      try { parsed = JSON.parse(text); } catch { parsed = { checks: [] }; }
      slog(`[IDPhoto][precheck] 검수 완료: ${parsed.checks?.length || 0}항목`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(parsed));
    } catch (err) {
      log(`[IDPhoto][precheck] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '검수 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
    }
  }

  // === 증명사진 생성 ===
  if (urlPath === '/api/idphoto/generate' && req.method === 'POST') {
    try {
      const { parseJsonBody } = await import('./lib/shared/config.js');
      const body = await parseJsonBody(req);
      const { image, format, gender, age, model } = body;
      if (!image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '이미지 필수' }));
      }
      const generatedBase64 = await generateIdPhoto({ image, format: format || 'passport', gender, age, model: model || 'nano-banana-pro', userId: 'specs-visitor' });
      try {
        await saveImages('idphoto', 'specs-visitor', format || 'passport', image, generatedBase64);
      } catch (e) {
        log(`[IDPhoto] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
      }
      log(`[IDPhoto] 생성 완료: 규격=${format || 'passport'}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ image: generatedBase64 }));
    } catch (err) {
      log(`[IDPhoto] 에러: ${err.message}`, 'ERROR');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
    }
  }

  // === 결제 ===
  if (urlPath === '/api/checkout' && req.method === 'POST') return handleCheckout(req, res);
  if (urlPath === '/api/webhooks/lemonsqueezy' && req.method === 'POST') return handleLemonSqueezyWebhook(req, res);
  if (urlPath === '/api/payments/toss/confirm' && req.method === 'POST') return handleTossConfirm(req, res);
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
    const trackIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const now = Date.now();
    if (!global._trackRL) global._trackRL = {};
    const rl = global._trackRL[trackIp] || { count: 0, reset: now + 60000 };
    if (now > rl.reset) { rl.count = 0; rl.reset = now + 60000; }
    rl.count++;
    global._trackRL[trackIp] = rl;
    if (rl.count > 60) { res.writeHead(429); return res.end(); }

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
