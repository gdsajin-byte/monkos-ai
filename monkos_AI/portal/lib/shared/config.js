/**
 * MONKOS Portal — 공통 인프라 (환경변수 + 싱글톤 + 유틸)
 *
 * 모든 모듈이 이 파일에서 import.
 * LEMONSQUEEZY_WEBHOOK_SECRET: 결제 웹훅 서명 전용
 * AUTH_SECRET: 인증 토큰 서명 전용 (미설정 시 LEMONSQUEEZY_WEBHOOK_SECRET 폴백)
 */

import { withEnvTag } from './env-tag.js';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { Firestore } from '@google-cloud/firestore';

// === 환경변수 (24개 전수) ===
export const PORT = parseInt(process.env.PORT || '8080', 10);
if (!process.env.PROJECT_ID) throw new Error('필수 환경변수 PROJECT_ID 미설정');
export const PROJECT_ID = process.env.PROJECT_ID;
export const LOCATION = process.env.LOCATION || 'us-central1';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://monkos.ai/auth/google/callback';

// Lemon Squeezy (JP/글로벌)
export const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
export const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
export const LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL || '';
export const LEMONSQUEEZY_STORE_ID = '415328';       // 글로벌 USD
export const LEMONSQUEEZY_STORE_ID_JP = '290457';    // JP ¥ (레거시)

// 인증 토큰 서명 (결제 시크릿과 분리)
export const AUTH_SECRET = process.env.AUTH_SECRET || '';
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET;
if (!authSecret) {
  console.error('[FATAL] AUTH_SECRET 또는 LEMONSQUEEZY_WEBHOOK_SECRET 미설정. 토큰 서명 불가.');
  if (process.env.K_SERVICE) {
    console.error('[FATAL] 프로덕션(Cloud Run)에서 시크릿 미설정 — 서비스 기동 차단');
  }
  process.exit(1);
}

// 토스페이먼츠 (KR)
export const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
// 토스 클라이언트 키 (공개키 — dev 테스트키/prod 라이브키 env 분기, 하드코딩 금지)
export const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || '';

// 레몬 specs 단건 $2 variant (env 주입 — 미설정 시 해당 시장 단건 결제 비활성)
export const LEMONSQUEEZY_VARIANT_SPECS_SINGLE = process.env.LEMONSQUEEZY_VARIANT_SPECS_SINGLE || '';
export const LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP = process.env.LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP || '';
export const SINGLE_DOWNLOAD_VARIANTS = new Set(
  [LEMONSQUEEZY_VARIANT_SPECS_SINGLE, LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP].filter(Boolean)
);

// Telegram
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
export const TELEGRAM_EVENT_BOT_TOKEN = process.env.TELEGRAM_EVENT_BOT_TOKEN || '';
export const TELEGRAM_TEAM_BOT_TOKEN = process.env.TELEGRAM_TEAM_BOT_TOKEN || '';
export const TEAM_CHAT_ID = process.env.TEAM_CHAT_ID || '';
export const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
export const TEAM_NOTIFY_SECRET = process.env.TEAM_NOTIFY_SECRET || '';

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

// 네이버 검색 API
export const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || '';
export const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || '';

// GitHub (SPREAD 배포)
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
export const GITHUB_REPO = process.env.GITHUB_REPO || 'gdsajin-byte/monkos-ai';

// GA4
export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '521406894';

// CMS
if (!process.env.GCS_BUCKET) throw new Error('필수 환경변수 GCS_BUCKET 미설정');
export const GCS_BUCKET = process.env.GCS_BUCKET;
// 고객 생성물(원본/결과 이미지) 버킷 — CMS 에셋 버킷(GCS_BUCKET)과 분리 (ch2 7조 정본)
export const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
export const ADMIN_UIDS = (process.env.ADMIN_UIDS || '').split(',').filter(Boolean);

// 에이전트 API 키 (민아/코웍이 등 — Cloud Run 환경변수에서 설정)
export const AGENT_API_KEYS = (process.env.AGENT_API_KEYS || '').split(',').filter(Boolean);

// D1 거래 원장 (CF Workers tx.js 제거됨 — 환경변수 미설정 시 비활성)
export const TX_API_URL = process.env.TX_API_URL || '';
export const TX_API_KEY = process.env.TX_API_KEY || '';

// 메일 발신 (Resend — PF_INFRA). 키는 백엔드 환경변수에만, 폴백 금지: 헌법 4조 1항
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const RESEND_API_URL = 'https://api.resend.com/emails';
// 발신 주소·표시명 정본 (ch2 7조 — mailer.js·호출부 하드코딩 금지)
// 표시명은 브랜드 정본 "MONKOS" (ch8 — 내부 호칭·엔진명 노출 금지)
export const MAIL_FROM_ADDRESS = 'info@monkos.ai';
export const MAIL_FROM_NAME = 'MONKOS';
export const MAIL_FROM = `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`;
export const MAIL_REPLY_TO = MAIL_FROM_ADDRESS;

// VTON RunPod (PF_VTON Phase4 — 키는 백엔드 환경변수에만, 폴백 금지: 헌법 4조 1항)
export const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || '';
// pod id는 시크릿 아님 — 운영 중 교체 가능하도록 환경변수 우선, 미설정 시 문서화된 3090 pod
export const RUNPOD_POD_ID = process.env.RUNPOD_POD_ID || 'nkw5t0uvfn0ub1';

// === Firestore 초기화 ===
export const firestore = new Firestore({ projectId: PROJECT_ID });
export const usersCollection = firestore.collection('users');

// === Vertex AI ===
// 텍스트 전용. Gemini 3.x 텍스트 GA 모델은 global 로케이션에만 배치된다(2026-10-22 실호출 실측 —
// us-central1은 gemini-3.5-flash 404). 2.5 이전(Google 통지 10-20 기한)으로 global 전환.
export const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});
// 텍스트 모델 정본 — CMS(ai.js·translate.js·slug.js)·콜스코프·챗봇 로그가 이 상수를 쓴다
export const TEXT_MODEL = 'gemini-3.5-flash';

// 이미지 생성 전용 — Gemini 이미지 GA 모델은 global 로케이션에만 배치된다
// (2026-08-27 Vertex Imagen 계열 전면 폐지 대응). 텍스트용 `ai`도 10-22부터 global.
export const aiImage = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});
export const CMS_IMAGE_MODEL = 'gemini-3.1-flash-image';
// 콜스코프(어드민 내부 도구) 캡처 판독 — CMS 텍스트 경로(lib/cms/ai.js·translate.js)와 같은 모델을 `ai`로 호출한다
export const CALLSCOPE_MODEL = TEXT_MODEL;
// 콜스코프 판독 호출당 상한 — 정상 3~4s(10-22 합성 캡처 실측), 이상 사례 204s 1건. 내부 도구라 초과 시 명시 오류(건너뛰기 아님)
export const CALLSCOPE_TIMEOUT_MS = 30000;

// === Telegram API URL ===
export const TELEGRAM_CS_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
export const TELEGRAM_EVENT_API = `https://api.telegram.org/bot${TELEGRAM_EVENT_BOT_TOKEN}`;
export const TELEGRAM_TEAM_API = `https://api.telegram.org/bot${TELEGRAM_TEAM_BOT_TOKEN}`;

// === 크레딧 매핑 ===
export const VARIANT_CREDITS = {
  // Global USD 상품 (store#415328, 라이브 published)
  '1909373': 40,    // topup_40: $3.90, 40c
  '1909383': 80,    // single_80: $6.90, 80c
  '1909386': 130,   // package_130: $9.90, 130c
  '1909388': 420,   // package_420: $26.90, 420c
  '1909390': 750,   // package_750: $39.90, 750c
  // JP ¥ 상품 (store#290457, 라이브 published) — 06-23 전환(667ccdd6) 때 소실 → 07-05 응급 복원.
  // 미복원 시 JP 충전 결제가 "돈만 받고 크레딧 미지급"이 됨. 글로벌USD통합 완료 전까지 유지.
  '1382355': 10,    // topup_10: ¥150, 10c+0
  '1382367': 80,    // single_70: ¥990, 70c+10
  '1382348': 130,   // package_100: ¥1,490, 100c+30
  '1382362': 420,   // package_300: ¥3,990, 300c+120
  '1382436': 750,   // package_500: ¥5,990, 500c+250
};

// JP 레거시 스토어(#290457) 소속 variant 집합.
// 체크아웃 생성 시 store는 variant의 실소속과 일치해야 한다 — 글로벌 스토어로 만든
// JP variant 서명 링크는 실브라우저에서 404가 된다 (curl은 302→200이라 못 잡는다).
export const LEMON_JP_VARIANTS = new Set(['1382355', '1382367', '1382348', '1382362', '1382436']);

// v3 상품 정의 — 상품c와 보너스c 분리
export const PRODUCTS = {
  single_70:   { price: 9900,  credits: 70,  bonus: 10 },
  package_100: { price: 12900, credits: 100, bonus: 30 },
  package_300: { price: 34900, credits: 300, bonus: 120 },
  package_500: { price: 49900, credits: 500, bonus: 250 },
  topup_10:    { price: 1500,  credits: 10,  bonus: 0 },  // 10c = $1 = ₩1,500 (2026-07-06 작가님 확정)
};

// 하위호환: amount → 총 크레딧 매핑 (payments.js 역참조용)
export const TOSS_AMOUNT_CREDITS = Object.fromEntries(
  Object.values(PRODUCTS).map(p => [p.price, p.credits + p.bonus])
);

// 글로벌 크레딧 충전 상품 (레몬 글로벌 스토어 #415328)
export const GLOBAL_TOPUP = [
  { variantId: '1909373', credits: 40,  priceUsd: 390,  label: '40 Credits' },
  { variantId: '1909383', credits: 80,  priceUsd: 690,  label: '80 Credits' },
  { variantId: '1909386', credits: 130, priceUsd: 990,  label: '130 Credits', recommended: true },
  { variantId: '1909388', credits: 420, priceUsd: 2690, label: '420 Credits' },
  { variantId: '1909390', credits: 750, priceUsd: 3990, label: '750 Credits', best: true },
];

// === specs 단건 직접결제 (T1) — 시장별 가격 정본 (클라이언트 금액 불신) ===
export const DIRECT_PRICING = {
  kr:     { provider: 'toss',  amount: 2000, currency: 'KRW' },  // ₩2,000 서버 고정
  global: { provider: 'lemon' },  // $1.99 — 금액 정본은 레몬 variant (글로벌 스토어 #415328)
  jp:     { provider: 'lemon' },  // $1.99 USD 통일 (2026-07-05 작가님) — JP 엔화는 촬영실 레거시에만 존속
};
export const DIRECT_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;  // 결제 후 다운로드 여유 24h
export const DIRECT_TOKEN_MAX_GENERATES = 1;              // 1결제 1생성 — 재생성 폐지 (2026-07-05 작가님: 재생성=룰렛, 사다리 붕괴. 무료 체험은 로그인 10c 경로 담당)

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
  'https://go.monkos.ai', // 바둑앱 — 포털 계정 공용 로그인 (ORDER_20261105 GO 로그인)
];
/** 실제 허용 출처 — 정본 목록 + dev 서비스에서만 로컬 바둑 테스트(8766) 출처. prod는 정본 목록 그대로 */
export function allowedPopupOrigins(kService = process.env.K_SERVICE) {
  const devExtra = typeof kService === 'string' && kService.endsWith('-dev') ? ['http://127.0.0.1:8766', 'http://localhost:8766'] : [];
  return [...ALLOWED_POPUP_ORIGINS, ...devExtra];
}

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
// directTokens 인메모리 Map 제거 (2026-07-04) — Firestore `directTokens` 컬렉션으로 전환.
// 다중 인스턴스/재시작 시 토큰 유실 문제 해소. 소모는 payments.js 트랜잭션 경유.

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
// 응답 미확인 → 침묵 실패 구조였음 (2026-07-06 실사고: orderId 밑줄이 Markdown 엔티티로
// 오해석 → 400 → 취소 회수 경보 유실). ok 확인 + 파스 실패 시 평문 폴백 + 실패 로그.
export async function sendTelegramMessage(chatId, text, botApi = TELEGRAM_CS_API) {
  try {
    const send = async (parseMode) => {
      const body = { chat_id: chatId, text: withEnvTag(text) };
      if (parseMode) body.parse_mode = parseMode;
      const r = await fetch(`${botApi}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) return { ok: true };
      const d = await r.json().catch(() => ({}));
      return { ok: false, desc: d.description || `HTTP ${r.status}` };
    };
    let out = await send('Markdown');
    if (!out.ok && /parse|entit/i.test(out.desc)) out = await send(null);
    if (!out.ok) log(`[Telegram] 메시지 전송 실패: ${out.desc}`, 'WARNING');
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

log('[Vertex AI] ADC 클라이언트 초기화 (Gemini 2.5 Flash 챗봇)');
