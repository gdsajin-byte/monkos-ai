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
import { BLOG_REDIRECTS } from './lib/cms/redirects.js';
import { handlePodStart, handlePodStatus, handlePodStop, handleComfyProxy } from './lib/vton/runpod.js';

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
    res.end(JSON.stringify({ status: 'healthy', service: 'monkos-portal', timestamp: new Date().toISOString() }));
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
