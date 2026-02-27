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
  KAKAO_REST_API_KEY, KAKAO_CHANNEL_ID, LINE_CHANNEL_ID,
} from './lib/shared/config.js';

// === 핸들러 모듈 ===
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleAuth, handleAuthToken, handleAuthVerify, handleAuthRefresh } from './lib/auth.js';
import { handleCreditsGet, handleCreditsUse, handleCreditsRefund } from './lib/credits.js';
import { handleCheckout, handleLemonSqueezyWebhook, handleTossConfirm, handleTossDirect, handleDownloadDirect, handleTossSuccess, handleTossFail } from './lib/payments.js';
import { handleTelegramGateCode, handleTelegramMissionCode, handleConsentSns, handleMissionComplete, handleCreditsEvent } from './lib/events.js';
import { handleTelegramCSWebhook, handleTelegramEventWebhook } from './lib/telegram.js';
import { handleTelegramTeamWebhook, handleTeamNotify } from './lib/telegram-team.js';
import { handleKakaoChatbot } from './lib/kakao-chatbot.js';
import { handleWebChat, handleCoaching, handleQC } from './lib/coaching.js';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    res.end(JSON.stringify({ status: 'healthy', service: 'monkos-portal', version: '1.0.0', timestamp: new Date().toISOString(), auth: 'Vertex AI ADC', chatbot: 'gemini-2.0-flash' }));
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
  if (urlPath === '/api/auth/refresh' && req.method === 'POST') return handleAuthRefresh(req, res);

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

  // === 봇 웹훅 ===
  if (urlPath === '/api/webhook/telegram' && req.method === 'POST') return handleTelegramCSWebhook(req, res);
  if (urlPath === '/api/webhook/telegram-event' && req.method === 'POST') return handleTelegramEventWebhook(req, res);
  if (urlPath === '/api/webhook/telegram-team' && req.method === 'POST') return handleTelegramTeamWebhook(req, res);
  if (urlPath === '/api/team/notify' && req.method === 'POST') return handleTeamNotify(req, res);

  // === 카카오 챗봇 ===
  if (urlPath === '/api/kakao/chatbot' && req.method === 'POST') return handleKakaoChatbot(req, res);

  // === 챗봇/코칭/QC ===
  if (urlPath === '/api/chat' && req.method === 'POST') return handleWebChat(req, res);
  if (urlPath === '/api/coaching' && req.method === 'POST') return handleCoaching(req, res);
  if (urlPath === '/api/qc' && req.method === 'POST') return handleQC(req, res);

  // === 정적 파일 ===
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = filePath.split('?')[0];
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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[resolvedExt] || 'application/octet-stream' });
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
  log(`챗봇: gemini-2.0-flash`);
  log(`DB: Firestore`);
  log('='.repeat(60));
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log(`Lemon Squeezy: ${LEMONSQUEEZY_API_KEY ? '설정됨' : '미설정'}`);
  log(`Toss Payments: ${TOSS_SECRET_KEY ? '설정됨' : '미설정'}`);
  log(`Telegram CS Bot: ${TELEGRAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Event Bot: ${TELEGRAM_EVENT_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Team Bot: ${TELEGRAM_TEAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Channel: ${TELEGRAM_CHANNEL_ID || '미설정'}`);
  log(`Team Chat ID: ${TEAM_CHAT_ID ? '설정됨' : '미설정'}`);
  log(`Kakao Login: ${KAKAO_REST_API_KEY ? '설정됨' : '미설정'}`);
  log(`Kakao Channel: ${KAKAO_CHANNEL_ID || '미설정'}`);
  log(`LINE Login: ${LINE_CHANNEL_ID ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});
