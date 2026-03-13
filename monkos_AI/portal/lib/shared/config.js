/**
 * MONKOS Portal — 공통 인프라 (환경변수 + 싱글톤 + 유틸)
 *
 * 모든 모듈이 이 파일에서 import.
 * LEMONSQUEEZY_WEBHOOK_SECRET: 결제 웹훅 서명 전용
 * AUTH_SECRET: 인증 토큰 서명 전용 (미설정 시 LEMONSQUEEZY_WEBHOOK_SECRET 폴백)
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { Firestore } from '@google-cloud/firestore';

// === 환경변수 (24개 전수) ===
export const PORT = parseInt(process.env.PORT || '8080', 10);
export const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
export const LOCATION = process.env.LOCATION || 'us-central1';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

// Lemon Squeezy (JP/글로벌)
export const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
export const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
export const LEMONSQUEEZY_STORE_ID = '290457';

// 인증 토큰 서명 (결제 시크릿과 분리)
export const AUTH_SECRET = process.env.AUTH_SECRET || '';
if (!AUTH_SECRET) {
  console.warn('[AUTH] ⚠️ AUTH_SECRET 환경변수 미설정 — 프로덕션에서는 반드시 설정 필요');
}
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';

// 토스페이먼츠 (KR)
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';

// Telegram
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_EVENT_BOT_TOKEN = process.env.TELEGRAM_EVENT_BOT_TOKEN || '';
export const TELEGRAM_TEAM_BOT_TOKEN = process.env.TELEGRAM_TEAM_BOT_TOKEN || '';
export const TEAM_CHAT_ID = process.env.TEAM_CHAT_ID || '';
export const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
export const TEAM_NOTIFY_SECRET = process.env.TEAM_NOTIFY_SECRET || 'monkos-internal';

// 카카오 (KR)
export const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '';
export const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'https://monkos.ai/auth/kakao/callback';
export const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID || '';

// LINE (JP)
export const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '';
export const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
export const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI || 'https://monkos.ai/auth/line/callback';

// LINE Messaging API (봇)
export const LINE_MESSAGING_CHANNEL_SECRET = process.env.LINE_MESSAGING_CHANNEL_SECRET || '';
export const LINE_MESSAGING_ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN || '';
export const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';

// D1 거래 원장 (CF Workers tx.js 제거됨 — 환경변수 미설정 시 비활성)
export const TX_API_URL = process.env.TX_API_URL || '';
export const TX_API_KEY = process.env.TX_API_KEY || '';

// === Firestore 초기화 ===
export const firestore = new Firestore({ projectId: PROJECT_ID });
export const usersCollection = firestore.collection('users');

// === Vertex AI ===
export const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

// === Telegram API URL ===
export const TELEGRAM_CS_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
export const TELEGRAM_EVENT_API = `https://api.telegram.org/bot${TELEGRAM_EVENT_BOT_TOKEN}`;
export const TELEGRAM_TEAM_API = `https://api.telegram.org/bot${TELEGRAM_TEAM_BOT_TOKEN}`;

// === 크레딧 매핑 ===
export const VARIANT_CREDITS = {
  // JP v3 상품 (Lemon Squeezy Variant ID → 총 크레딧)
  '1382355': 10,    // topup_10: ¥150, 10c+0
  '1382367': 80,    // single_70: ¥990, 70c+10
  '1382348': 130,   // package_100: ¥1,490, 100c+30
  '1382362': 420,   // package_300: ¥3,990, 300c+120
  '1382436': 750,   // package_500: ¥5,990, 500c+250
};

// v3 상품 정의 — 상품c와 보너스c 분리
export const PRODUCTS = {
  single_70:   { price: 9900,  credits: 70,  bonus: 10 },
  package_100: { price: 12900, credits: 100, bonus: 30 },
  package_300: { price: 34900, credits: 300, bonus: 120 },
  package_500: { price: 49900, credits: 500, bonus: 250 },
  topup_10:    { price: 1450,  credits: 10,  bonus: 0 },
};

// 하위호환: amount → 총 크레딧 매핑 (payments.js 역참조용)
export const TOSS_AMOUNT_CREDITS = Object.fromEntries(
  Object.values(PRODUCTS).map(p => [p.price, p.credits + p.bonus])
);

// === CORS ===
export const ALLOWED_ORIGINS = [
  'https://monkos.ai',
  'https://idphoto-jp.monkos.ai',
  'https://idphoto-kr.monkos.ai',
  'https://monkos-idphoto-jp-933456016842.us-central1.run.app',
  'https://monkos-idphoto-kr-933456016842.us-central1.run.app',
  'https://monkos-idphoto-jp-dev-933456016842.us-central1.run.app',
  'https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app',
  'https://monkos-portal-dev-933456016842.us-central1.run.app',
  'https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app',
  'https://monkos-portal-dev-4jeplpqpua-uc.a.run.app',
  'https://monk.kr',
  'http://localhost:8080',
  'http://localhost:3000',
];

export const ALLOWED_POPUP_ORIGINS = [
  'https://idphoto-kr.monkos.ai',
  'https://idphoto-jp.monkos.ai',
  'https://monkos.ai',
];

// === MIME 타입 ===
export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// === 인메모리 저장소 ===
export const directTokens = new Map();
const DIRECT_TOKEN_TTL = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of directTokens) {
    if (now - data.created > DIRECT_TOKEN_TTL) directTokens.delete(token);
  }
}, 60 * 1000);

export const pendingLineStates = new Map();

// === 구조화 로깅 ===
export function log(msg, severity = 'INFO', meta = {}) {
  const entry = {
    severity,
    message: msg,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.timestamp}] [${severity}] ${msg}`, meta.error || '');
  }
}

// === JSON 이스케이프 (script 태그 인젝션 방지) ===
export function safeJsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

// === HMAC 인증 토큰 ===
export function generateAuthToken(userId, ttlMs = 5 * 60 * 1000) {
  const expires = Date.now() + ttlMs;
  const payload = `${userId}:${expires}`;
  const hmac = createHmac('sha256', authSecret);
  hmac.update(payload);
  const sig = hmac.digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  return { token, expires };
}

export function verifyAuthToken(token, opts = {}) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;

    const [userId, expiresStr, sig] = parts;
    const expires = parseInt(expiresStr, 10);

    const hmac = createHmac('sha256', authSecret);
    hmac.update(`${userId}:${expiresStr}`);
    const expectedSig = hmac.digest('hex');

    // timingSafeEqual로 타이밍 공격 방지
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

    if (!opts.allowExpired && Date.now() > expires) return null;
    if (opts.allowExpired && opts.maxAgeMs) {
      if (Date.now() - expires > opts.maxAgeMs) return null;
    }

    return { userId, expires };
  } catch {
    return null;
  }
}

// === 거래 원장 로깅 (Firestore transactions 컬렉션) ===
export async function logTransaction({ userId, amount, type, service = 'portal', provider = 'system', balanceAfter, description, referenceId, metadata }) {
  try {
    await firestore.collection('transactions').add({
      userId,
      amount,
      type,
      service,
      provider,
      balanceAfter,
      description,
      referenceId: referenceId || null,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    log(`[TX] 원장 기록 실패: ${err.message}`, 'WARNING');
  }
}

// === Telegram 메시지 전송 ===
export async function sendTelegramMessage(chatId, text, botApi = TELEGRAM_CS_API) {
  try {
    await fetch(`${botApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    log(`[Telegram] 메시지 전송 실패: ${err.message}`);
  }
}

// === Telegram 인라인 키보드 전송 ===
export async function sendTelegramInlineKeyboard(chatId, text, keyboard, botApi = TELEGRAM_CS_API) {
  try {
    await fetch(`${botApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      }),
    });
  } catch (err) {
    log(`[Telegram] 인라인 키보드 전송 실패: ${err.message}`);
  }
}

// === Telegram 콜백 쿼리 응답 ===
export async function answerCallbackQuery(callbackQueryId, text, botApi = TELEGRAM_CS_API) {
  try {
    await fetch(`${botApi}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch (err) {
    log(`[Telegram] 콜백 쿼리 응답 실패: ${err.message}`);
  }
}

// === Request Body 파싱 유틸 ===
export function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export async function parseJsonBody(req) {
  const raw = await parseRawBody(req);
  return JSON.parse(raw);
}

// === Cookie 파싱 유틸 ===
export function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const [key, ...vals] = pair.trim().split('=');
    if (key) cookies[key.trim()] = vals.join('=').trim();
  });
  return cookies;
}

// === crypto re-export ===
export { createHmac, randomBytes, authSecret };

log('[Vertex AI] ADC 클라이언트 초기화 (Gemini 2.0 Flash 챗봇)');
