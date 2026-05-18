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
} from './lib/shared/config.js';

// === 핸들러 모듈 ===
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleAuth, handleAuthToken, handleAuthVerify, handleAuthRefresh, handleVerifyCookie, handleLogout } from './lib/auth.js';
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
import { handleAgentAuth } from './lib/cms/admin-auth.js';
import { handleBlogList, handleBlogGet, handleBlogCreate, handleBlogUpdate, handleBlogDelete } from './lib/cms/blog.js';
import { handleFaqList, handleFaqCreate, handleFaqUpdate, handleFaqDelete } from './lib/cms/faq.js';
import { handleGalleryList, handleGalleryCreate, handleGalleryUpdate, handleGalleryDelete } from './lib/cms/gallery.js';
import { handleBoardPublicList, handleBoardPublicGet, handleBoardPublicCreate, handleBoardPublicDelete, handleBoardAdminList, handleBoardAdminReply, handleBoardAdminDelete, handleBoardAdminToggle } from './lib/cms/board.js';
import { handleUpload, handleImageList, handleImageDelete } from './lib/cms/upload.js';
import { handleTranslate } from './lib/cms/translate.js';
import { handleSearch } from './lib/cms/search.js';
import { renderBlogList, renderBlogPost, renderFaq, renderGallery, renderBoardList, renderBoardPost, renderBoardWrite, renderGuide, renderAiPhotoGuide, renderSitemap, renderPricing, renderSpecsList, renderSpecsDetail } from './lib/cms/render.js';
import { renderHome, handleSettingsGet, handleSettingsPut, handleLayoutGet, handleLayoutPut } from './lib/cms/home.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  const urlPath = req.url?.split('?')[0];

  // === 헬스체크 ===
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'monkos-portal', version: '1.0.0', timestamp: new Date().toISOString(), auth: 'Vertex AI ADC', chatbot: 'gemini-2.5-flash' }));
    return;
  }

  // === 가입자 통계 ===
  if (req.url === '/api/stats' && req.method === 'GET') {
    try {
      const snapshot = await usersCollection.count().get();
      const totalUsers = snapshot.data().count;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ totalUsers, timestamp: new Date().toISOString() }));
    } catch (err) {
      log(`[Stats] 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
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

  // === CMS 관리자 API ===
  if (urlPath === '/api/admin/blog' && req.method === 'GET') return handleBlogList(req, res);
  if (urlPath === '/api/admin/blog' && req.method === 'POST') return handleBlogCreate(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'GET') return handleBlogGet(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'PUT') return handleBlogUpdate(req, res);
  if (urlPath?.startsWith('/api/admin/blog/') && req.method === 'DELETE') return handleBlogDelete(req, res);
  if (urlPath === '/api/admin/upload' && req.method === 'POST') return handleUpload(req, res);
  if (urlPath === '/api/admin/images' && req.method === 'GET') return handleImageList(req, res);
  if (urlPath?.startsWith('/api/admin/images/') && req.method === 'DELETE') return handleImageDelete(req, res);
  if (urlPath?.endsWith('/translate') && urlPath?.startsWith('/api/admin/blog/') && req.method === 'POST') return handleTranslate(req, res);
  if (urlPath === '/api/admin/search' && req.method === 'GET') return handleSearch(req, res);

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

  // 구 슬러그 → 신규 슬러그 301 리다이렉트 (2026-04-10, GSC 404 해소)
  const blogRedirects = {
    // JA
    '/ja/blog/vol23-qa-5':     '/ja/blog/ai-de-shomei-shashin-geneki-shashinkan-review',
    '/ja/blog/vol22':          '/ja/blog/job-interview-updo-hair-5-steps',
    '/ja/blog/vol21-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',
    '/ja/blog/vol20-vs':       '/ja/blog/korea-vs-japan-job-photo-hair',
    // EN
    '/en/blog/vol23-qa-5':     '/en/blog/ai-id-photo-review-photography-studio-owner',
    '/en/blog/vol22':          '/en/blog/interview-updo-flight-attendant-hair-5-steps',
    '/en/blog/vol21-ai-monkosai': '/en/blog/ai-id-photo-created-by-a-20-year-photographer-monkos-ai',
    '/en/blog/vol20-vs':       '/en/blog/korean-vs-japanese-job-application-photos-hairstyle',
    '/en/blog/vol19':          '/en/blog/id-photo-job-application-photo-makeup-for-each-skin-tone',
    // KO
    '/blog/vol23-qa-5':        '/blog/vol24-20-ai-monkosai',

    // === 신규 3건 (2026-04-14 GSC 404 해소 — hreflang 유령 URL 잔존분) ===
    // 주: 오더 원안은 6건이었으나 JA 번역본 부재(vol17/18/19 JA)로 3건 제외.
    //    해당 3건은 건1(hreflang 조건부)로 장기 해소 예정. 기존 캐시는 자연 해소.
    '/en/blog/vol17-vs':       '/en/blog/korea-vs-japan-interview-attire-whats-the-difference',
    '/en/blog/vol18-ai-vs':    '/en/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo',
    '/ja/blog/vol24-20-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',

    // === KO 한글 slug → 영문 slug 301 (2026-04-27 B-2 마이그레이션) ===
    '/blog/20%EB%85%84-%EC%82%AC%EC%A7%84%EC%9E%91%EA%B0%80%EA%B0%80-ai%EB%A1%9C-%EB%A7%8C%EB%93%A0-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%84%9C%EB%B9%84%EC%8A%A4-monkosai': '/blog/20-year-photographer-creates-id-photos-with-ai-monkos-ai',
    '/blog/ai%EB%A1%9C-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A7%8C%EB%93%A4%EA%B8%B0-%EC%A7%84%EC%A7%9C-%EA%B0%80%EB%8A%A5%ED%95%A0%EA%B9%8C-%ED%98%84%EC%A7%81-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%9A%B4%EC%98%81%EC%9E%90%EC%9D%98-%EC%86%94%EC%A7%81%ED%95%9C-%EB%A6%AC%EB%B7%B0': '/blog/can-you-really-create-id-photos-with-ai-honest-review',
    '/blog/ai%EC%97%90-%EB%8C%80%ED%95%9C-%EC%84%9C%EB%A1%A0': '/blog/musings-on-ai',
    '/blog/claudemax-20x-2%EA%B0%9C%EC%9B%94-%EC%8B%A4%EC%82%AC%EC%9A%A9-%ED%9B%84%EA%B8%B0': '/blog/claude-max-20x-2-month-real-usage-review',
    '/blog/exaone-usb-ai-chatbot-%ED%9B%84%EA%B8%B0': '/blog/ai-on-a-usb-lg-exaone-35-korean-model-review',
    '/blog/monkos-ai-%EA%B0%80-%ED%83%84%EC%83%9D%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4': '/blog/birth-of-monkos-ai-20-year-photographers-ai-platform',
    '/blog/monkos-crop-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%8B%A4%EB%AC%B4%EB%A5%BC-%EA%B7%B8%EB%8C%80%EB%A1%9C-%EC%98%AE%EA%B8%B4-%ED%81%AC%EB%A1%AD%EC%95%B1': '/blog/monkos-crop-cropping-app-that-mirrors-photo-studio-work',
    '/blog/%EB%82%B4-%EC%86%90%EC%95%88%EC%97%90-%EC%82%AC%EC%A7%84%EA%B4%80-monkosai-%EC%82%AC%EC%9A%A9%EB%B2%95%EC%9D%84-%EC%86%8C%EA%B0%9C%ED%95%A9%EB%8B%88%EB%8B%A4': '/blog/photo-studio-in-my-hand-monkos-ai-usage-guide',
    '/blog/%EC%82%AC%EC%A7%84%EA%B4%80-12%EB%85%84-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%95%B1%EA%B0%9C%EB%B0%9C': '/blog/12-year-photo-studio-ai-id-photo-app',
    '/blog/%EC%82%AC%EC%A7%84%EA%B4%80-%EA%B0%80%EA%B8%B0-%EC%A0%84%EC%97%90-%EA%BC%AD-%EC%9D%BD%EC%96%B4%EC%95%BC-%ED%95%A0-%EC%B7%A8%EC%A4%80%EC%83%9D-%ED%97%A4%EC%96%B4%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EA%B0%80%EC%9D%B4%EB%93%9C-2026': '/blog/must-read-before-visiting-a-photo-studio-hair-makeup',
    '/blog/%EC%A0%9C%EB%AA%A9-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84%EC%97%90%EC%84%9C-%EB%B9%9B%EB%82%98%EB%8A%94-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%B9%84%EB%B2%95': '/blog/makeup-tips-to-shine-in-your-id-photo',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%B7%A8%EC%97%85-%EC%97%AC%EA%B6%8C-%EB%B9%84%EC%9E%90-%ED%95%9C-%EC%9E%A5%EC%9D%98-%EC%82%AC%EC%A7%84%EC%9D%B4-%EC%B2%AB%EC%9D%B8%EC%83%81%EC%9D%84-%EA%B2%B0%EC%A0%95%ED%95%9C%EB%8B%A4': '/blog/id-photo-makeup-job-passport-visa-first-impression',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%ED%86%A4%EC%97%85-%EC%84%B8%ED%8C%85%EB%B2%95': '/blog/id-photo-makeup-job-application-perfect-tone-guide',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%B4%EC%A0%91-%ED%97%A4%EC%96%B4%EC%97%90-%EB%8F%84%EC%9B%80%EC%9D%B4-%EB%90%98%EB%8A%94-%EC%9E%90%EC%97%B0%EC%8A%A4%EB%9F%AC%EC%9A%B4-%EB%B3%BC%EB%A5%A8-%EC%82%B4%EB%A6%AC%EB%8A%94-%EB%B0%A9%EB%B2%95': '/blog/natural-volume-secrets-for-photos-and-interviews',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9E%98-%EB%82%98%EC%98%A4%EB%8A%94-%ED%91%9C%EC%A0%95-%ED%8F%AC%EC%A6%88-%EC%97%B0%EC%8A%B5%EB%B2%95-%EC%B2%AB%EC%9D%B8%EC%83%81%EC%9D%80-%ED%91%9C%EC%A0%95%EC%9D%B4-%EB%A7%8C%EB%93%A0%EB%8B%A4': '/blog/id-photo-expression-pose-tips-first-impression',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%ED%86%A4%EB%B3%84%EB%A1%9C-%EC%99%84%EB%B2%BD%ED%95%98%EA%B2%8C-%EC%84%B8%ED%8C%85%ED%95%98%EB%8A%94-%EB%B2%95': '/blog/id-photo-job-application-photo-makeup-perfect-tone',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4%EC%8A%A4%ED%83%80%EC%9D%BC-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%8B%A4%EC%9D%8C%EC%9D%80-%ED%97%A4%EC%96%B4-%EC%9D%B8%EC%83%81%EC%9D%84-%EC%99%84%EC%84%B1%ED%95%98%EB%8A%94-%EB%A7%88%EC%A7%80%EB%A7%89-%ED%95%9C-%EC%88%98': '/blog/id-photo-hairstyle-hair-after-makeup-final-touch',
    '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4%EC%8A%A4%ED%83%80%EC%9D%BC%EB%A7%81-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%8B%A4%EC%9D%8C%EC%9D%80-%ED%97%A4%EC%96%B4-%EC%9D%B8%EC%83%81%EC%9D%84-%EC%99%84%EC%84%B1%ED%95%98%EB%8A%94-%EB%A7%88%EC%A7%80%EB%A7%89-%ED%95%9C-%EC%88%98': '/blog/id-photo-hairstyle-hair-after-makeup-finishing-touch',
    '/blog/%EC%B7%A8%EC%97%85-%EB%A9%B4%EC%A0%91-%EC%98%AC%EB%A6%BC%EB%A8%B8%EB%A6%AC-%EC%8A%B9%EB%AC%B4%EC%9B%90%EB%A8%B8%EB%A6%AC-%EC%99%84%EC%84%B1-5%EB%8B%A8%EA%B3%84-%ED%98%84%EC%9E%A5-%EA%B2%BD%EB%A0%A5-10%EB%85%84-%EB%85%B8%ED%95%98%EC%9A%B0-%EA%B3%B5%EA%B0%9C': '/blog/job-interview-updo-flight-attendant-hair-5-steps',
    '/blog/%EC%B7%A8%EC%97%85-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9D%98%EC%83%81-%EC%BB%AC%EB%9F%AC-%EC%84%A0%ED%83%9D%EB%B2%95-%EC%98%B7-%ED%95%9C-%EB%B2%8C%EC%9D%B4-%EB%8B%B9%EB%9D%BD%EC%9D%84-%EB%B0%94%EA%BE%BC%EB%8B%A4': '/blog/job-application-photo-clothing-color-selection',
    '/blog/%ED%81%B4%EB%A1%9C%EB%93%9C%EA%B0%80-%EC%BB%B4%ED%93%A8%ED%84%B0-%EA%BA%BC%EC%A0%B8%EC%9E%88%EC%9D%84-%EB%95%8C%EB%8F%84-%EC%9D%BC%EC%9D%84-%ED%95%9C%EB%8B%A4%EA%B3%A0': '/blog/does-claude-work-even-when-the-computer-is-off',
    '/blog/%ED%95%9C-%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84%EA%B3%BC-%EB%A9%B4%EC%A0%91%EC%97%90-%ED%95%84%EC%9A%94%ED%95%9C-%EC%9D%98%EC%83%81-%EB%A9%B4%EC%A0%91%EB%A8%B8%EB%A6%AC-%EC%9E%90%EC%8B%A0%EA%B0%90%EC%9D%98-%EC%8B%9C%EC%9E%91%EC%9D%80-%EB%82%98%EB%8B%A4%EC%9A%B4-%EB%AA%A8%EC%8A%B5': '/blog/job-interview-photo-outfit-hairstyle-confidence',
    '/blog/%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4-%EC%99%9C-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%A4%EB%A5%BC%EA%B9%8C': '/blog/korea-vs-japan-job-application-photo-hair-differences',
    '/blog/%ED%95%9C%EB%B2%88%EC%AF%A4-%EA%B3%A0%EB%AF%BC%ED%95%98%EA%B2%8C-%EB%90%98%EB%8A%94-%EC%95%84%EA%B8%B0-%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%95%88-%EA%B0%80%EB%8F%84-%EC%A7%91%EC%97%90%EC%84%9C-%EC%B0%8D%EC%9D%80-%EC%9D%B4%EC%95%BC%EA%B8%B0': '/blog/baby-passport-photo-at-least-once-taken-at-home',
    '/blog/%ED%95%9C%EB%B2%88%EC%AF%A4-%EA%B3%A0%EB%AF%BC%ED%95%98%EA%B2%8C-%EB%90%98%EB%8A%94-%EC%95%84%EA%B8%B0-%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%95%88-%EA%B0%80%EB%8F%84-%EC%A7%91%EC%97%90%EC%84%9C-%EC%B0%8D%EC%9D%80-%EC%9D%B4%EC%95%BC%EA%B8%B0-mmxg1mrn': '/blog/making-baby-passport-photos-at-home-success-story',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol15-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EB%A9%B4%EC%A0%91-%EB%B3%B5%EC%9E%A5-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/korean-researcher-magazine-vol-15-korea-vs-japan-interview',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol16-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%A4%80%EC%83%9D-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EC%B0%8D%EC%9C%BC%EB%A9%B4-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/researcher-magazine-vol16-japanese-job-seeker-photos',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol17-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EB%A9%B4%EC%A0%91-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/korean-vs-japanese-interview-makeup-the-differences',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol18-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-vs-%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%AD%90%EA%B0%80-%EB%8B%A4%EB%A5%BC%EA%B9%8C': '/blog/ai-id-photo-vs-studio-id-photo-whats-the-difference',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol19-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%B0%B0%EA%B2%BD%EC%83%89-%EB%AD%98%EB%A1%9C-%EA%B3%A8%EB%9D%BC%EC%95%BC-%ED%95%A0%EA%B9%8C-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EC%99%84%EC%A0%84-%EB%B9%84%EA%B5%90': '/blog/id-photo-background-color-korea-vs-japan-comparison',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol21-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%85%80%EC%B9%B4-%ED%95%9C-%EC%9E%A5%EC%9D%B4-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84%EC%9D%B4-%EB%90%9C%EB%8B%A4%EA%B3%A0-monkosai-%EC%A7%81%EC%A0%91-%EC%8D%A8%EB%B4%A4%EC%96%B4%EC%9A%94': '/blog/ai-profile-picture-one-selfie-becomes-a-profile',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol22-%EC%85%80%EC%B9%B4%EB%A1%9C-%EC%B7%A8%EC%97%85-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A7%8C%EB%93%A4%EB%A0%A4%EB%A9%B4-%EC%9D%B4%EA%B2%83%EB%A7%8C-%EC%95%8C%EB%A9%B4-%EB%8F%BC%EC%9A%94': '/blog/selfie-job-application-photo-heres-what-you-need-to-know',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol23-%EC%B7%A8%EC%A4%80%EC%83%9D%EC%9D%B4-%EA%B0%80%EC%9E%A5-%EB%A7%8E%EC%9D%B4-%EB%AC%BB%EB%8A%94-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-qa-5%EA%B0%80%EC%A7%80': '/blog/researcher-magazine-vol-23-top-5-resume-photo-questions',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EC%B9%BC%EB%9F%BC-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%B4%EC%A0%91%ED%97%A4%EC%96%B4%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85%EC%97%90-%EC%A4%91%EC%9A%94%ED%95%9C-%EA%B0%81%EC%A7%88%EC%A0%9C%EA%B1%B0-%EC%B2%AD%EA%B2%B0-%EC%8B%A0%EB%A2%B0%EA%B0%90%EC%9D%98-%EC%8B%9C%EC%9E%91': '/blog/clean-impression-first-step-exfoliation-for-id-interview',
    '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90%EB%A7%A4%EA%B1%B0%EC%A7%84vol20-%ED%95%9C%EA%B5%AD-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-vs-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%A4%EB%A6%85%EB%8B%88%EB%8B%A4': '/blog/korean-vs-japanese-job-application-photos-compared',
  };
  const decodedPath = decodeURIComponent(urlPath);
  const redirectTarget = blogRedirects[urlPath] || blogRedirects[decodedPath];
  if (redirectTarget) {
    res.writeHead(301, { 'Location': redirectTarget });
    return res.end();
  }

  // EN/JA 한글슬러그 → KO 영문슬러그 폴백 301 (hreflang 유령 URL 근절)
  const langBlogMatch = urlPath.match(/^\/(en|ja)\/blog\//);
  if (langBlogMatch) {
    const koPath = urlPath.replace(/^\/(en|ja)\/blog\//, '/blog/');
    const koDecoded = decodeURIComponent(koPath);
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

  if ((urlPath === '/' || urlPath === '/index.html') && req.method === 'GET') return renderHome(req, res);
  // 다국어 홈 라우트 (/ja/, /en/ → 경로 방식 통일)
  if ((urlPath === '/ja' || urlPath === '/ja/') && req.method === 'GET') return renderHome(req, res, 'ja');
  if ((urlPath === '/en' || urlPath === '/en/') && req.method === 'GET') return renderHome(req, res, 'en');
  if (urlPath === '/sitemap.xml' && req.method === 'GET') return renderSitemap(req, res);

  // 다국어 블로그 라우트 (언어 접두사 — 기존 /blog 라우트 앞에 배치)
  if (urlPath === '/ja/blog' && req.method === 'GET') return renderBlogList(req, res, 'ja');
  if (urlPath === '/en/blog' && req.method === 'GET') return renderBlogList(req, res, 'en');
  if (urlPath?.startsWith('/ja/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'ja');
  if (urlPath?.startsWith('/en/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'en');

  // 기존 라우트 (한국어 = 기본, 접두사 없음)
  if (urlPath === '/blog' && req.method === 'GET') return renderBlogList(req, res);
  if (urlPath?.startsWith('/blog/') && req.method === 'GET') return renderBlogPost(req, res);
  if (urlPath === '/guide/ai-photo' && req.method === 'GET') return renderAiPhotoGuide(req, res);
  if (urlPath === '/guide' && req.method === 'GET') return renderGuide(req, res);
  // 다국어 FAQ 라우트
  if (urlPath === '/ja/faq' && req.method === 'GET') return renderFaq(req, res, 'ja');
  if (urlPath === '/en/faq' && req.method === 'GET') return renderFaq(req, res, 'en');
  if (urlPath === '/faq' && req.method === 'GET') return renderFaq(req, res);
  // 다국어 Pricing 라우트
  if (urlPath === '/ja/pricing' && req.method === 'GET') return renderPricing(req, res, 'ja');
  if (urlPath === '/en/pricing' && req.method === 'GET') return renderPricing(req, res, 'en');
  if (urlPath === '/pricing' && req.method === 'GET') return renderPricing(req, res);
  // === Specs (규격 허브) ===
  if (urlPath === '/specs' && req.method === 'GET') return renderSpecsList(req, res);
  if (urlPath?.startsWith('/specs/') && req.method === 'GET') return renderSpecsDetail(req, res);
  if (urlPath === '/ja/specs' && req.method === 'GET') return renderSpecsList(req, res, 'ja');
  if (urlPath?.startsWith('/ja/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'ja');
  if (urlPath === '/en/specs' && req.method === 'GET') return renderSpecsList(req, res, 'en');
  if (urlPath?.startsWith('/en/specs/') && req.method === 'GET') return renderSpecsDetail(req, res, 'en');

  if (urlPath === '/gallery' && req.method === 'GET') return renderGallery(req, res);
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
