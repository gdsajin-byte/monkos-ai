/**
 * MONKOS Portal — 공통 인프라 (환경변수 + 싱글톤 + 유틸)
 *
 * 모든 모듈이 이 파일에서 import.
 * LEMONSQUEEZY_WEBHOOK_SECRET: 결제 웹훅 서명 + HMAC 인증 토큰 이중 용도 (주의)
 */

import { createHmac, randomBytes } from 'crypto';
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

// D1 거래 원장
export const TX_API_URL = process.env.TX_API_URL || 'https://monk.kr/api/tx';
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
  '1297524': 10,
  '1297532': 30,
  '1297531': 50,
};

export const TOSS_AMOUNT_CREDITS = {
  1450: 10,
  11600: 80,
  13050: 100,
  34800: 300,
  50750: 500,
};

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
  const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
  const hmac = createHmac('sha256', secret);
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

    const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
    const hmac = createHmac('sha256', secret);
    hmac.update(`${userId}:${expiresStr}`);
    const expectedSig = hmac.digest('hex');
    if (sig !== expectedSig) return null;

    if (!opts.allowExpired && Date.now() > expires) return null;
    if (opts.allowExpired && opts.maxAgeMs) {
      if (Date.now() - expires > opts.maxAgeMs) return null;
    }

    return { userId, expires };
  } catch {
    return null;
  }
}

// === D1 거래 원장 로깅 ===
export function logTransaction({ userId, amount, type, service = 'portal', provider = 'system', balanceAfter, description, referenceId, metadata }) {
  if (!TX_API_KEY) return;
  fetch(TX_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': TX_API_KEY },
    body: JSON.stringify({ userId, amount, type, service, provider, balanceAfter, description, referenceId, metadata }),
  }).catch(err => log(`[TX] 원장 기록 실패: ${err.message}`, 'WARNING'));
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

// === randomBytes re-export ===
export { createHmac, randomBytes };

log('[Vertex AI] ADC 클라이언트 초기화 (Gemini 2.0 Flash 챗봇)');
