/**
 * 헤드샷 T1 직접결제 게이트 + 렌더 검증 (2026-07-05 specs v2 패턴 이식)
 * - ① paymentToken 유효 → 생성 진입 (크레딧 API 미호출 = 크레딧 미차감)
 * - ② 무토큰·무세션 → 402 PAYMENT_REQUIRED
 * - 생성 실패 시 토큰 쿼터 반환 / 로그인 크레딧 경로 무변경
 * - 렌더: /headshot = ko 기본 언어 + 결제 UI 요소 + 시장별 가격·토스 SDK 분기
 * 외부(토스/레몬/Vertex/GCS)·Firestore는 전부 모킹 (payments-direct.test.js 준용).
 */

import { jest } from '@jest/globals';
import { createHmac, randomBytes } from 'crypto';

// ===== fake Firestore (payments-direct.test.js와 동일 최소 구현) =====
function createFakeFirestore() {
  const data = new Map();
  function docRef(col, id) {
    return {
      _key: `${col}/${id}`,
      id,
      async get() {
        const d = data.get(this._key);
        return { exists: d !== undefined, data: () => (d ? { ...d } : undefined), ref: this };
      },
      async set(obj) { data.set(this._key, { ...obj }); },
      async update(obj) {
        const cur = data.get(this._key);
        if (cur === undefined) throw new Error('NOT_FOUND');
        data.set(this._key, { ...cur, ...obj });
      },
    };
  }
  return {
    _data: data,
    collection: (col) => ({ doc: (id) => docRef(col, id) }),
    async runTransaction(fn) {
      const tx = {
        get: (ref) => ref.get(),
        update: (ref, obj) => {
          const cur = data.get(ref._key);
          if (cur === undefined) throw new Error('NOT_FOUND');
          data.set(ref._key, { ...cur, ...obj });
        },
        set: (ref, obj) => data.set(ref._key, { ...obj }),
      };
      return fn(tx);
    },
  };
}

const fakeFirestore = createFakeFirestore();
const parseCookiesMock = jest.fn(() => ({}));
const verifyAuthTokenMock = jest.fn(() => null);

// ===== config.js 모킹 (payments.js + headshot-route.js + render-headshot.js 공용) =====
jest.unstable_mockModule('../lib/shared/config.js', () => ({
  PORT: 8080,
  usersCollection: fakeFirestore.collection('users'),
  firestore: fakeFirestore,
  log: jest.fn(),
  logTransaction: jest.fn(),
  parseJsonBody: jest.fn(async (req) => req.body),
  parseRawBody: jest.fn(async (req) => req.rawBody),
  parseCookies: parseCookiesMock,
  verifyAuthToken: verifyAuthTokenMock,
  // 생성 기록 테스트 딱지(ORDER_20261105) — headshot-route가 admin-auth(getAdminUser)를 import한다. 관리자·에이전트 없음
  ADMIN_UIDS: [],
  AGENT_API_KEYS: [],
  generateAuthToken: jest.fn(),
  createHmac,
  randomBytes,
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
  LEMONSQUEEZY_API_KEY: 'test-lemon-key',
  LEMONSQUEEZY_WEBHOOK_SECRET: 'test-webhook-secret',
  LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL: '',
  LEMONSQUEEZY_STORE_ID: '415328',
  LEMONSQUEEZY_STORE_ID_JP: '290457',
  LEMON_JP_VARIANTS: new Set(['1382355', '1382367', '1382348', '1382362', '1382436']), // JP 스토어 소속 variant (config.js 실형 미러)
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE: '999001',
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP: '999002',
  SINGLE_DOWNLOAD_VARIANTS: new Set(['999001', '999002']),
  TOSS_SECRET_KEY: 'test_sk_dummy',
  TOSS_CLIENT_KEY: 'test_ck_dummy',
  VARIANT_CREDITS: {},
  TOSS_AMOUNT_CREDITS: {},
  PRODUCTS: {},
  DIRECT_PRICING: {
    kr: { provider: 'toss', amount: 2000, currency: 'KRW' },
    global: { provider: 'lemon' },
    jp: { provider: 'lemon' },
  },
  DIRECT_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
  DIRECT_TOKEN_MAX_GENERATES: 1,
}));

const generateHeadshotMock = jest.fn(async () => 'GEN_B64');
jest.unstable_mockModule('../lib/headshot-generate.js', () => ({
  generateHeadshot: generateHeadshotMock,
}));
jest.unstable_mockModule('../lib/gcs-save.js', () => ({
  saveImages: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../lib/tracking.js', () => ({
  trackEvent: jest.fn(async () => {}),
  linkIdentity: jest.fn(async () => {}),
}));

const payments = await import('../lib/payments.js');
const { handleHeadshotGenerate } = await import('../lib/headshot-route.js');
const { renderHeadshot } = await import('../lib/cms/render-headshot.js');

// ===== 테스트 유틸 =====
function mockRes() {
  const res = { statusCode: null, body: null, raw: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (payload) => {
    res.raw = payload;
    try { res.body = payload ? JSON.parse(payload) : null; } catch { res.body = null; }
  };
  return res;
}

function genReq(body, cookie = '') {
  return { body, headers: { host: 'localhost', cookie }, method: 'POST' };
}

async function issueToken() {
  const { token } = await payments.issueDirectToken({
    orderId: 'SPECS-kr-x-aaaaaaaa', slug: 'headshot', market: 'kr', amount: 2000, currency: 'KRW', provider: 'toss',
  });
  return token;
}

beforeEach(() => {
  fakeFirestore._data.clear();
  global.fetch = jest.fn();
  generateHeadshotMock.mockClear();
  generateHeadshotMock.mockResolvedValue('GEN_B64');
  parseCookiesMock.mockReturnValue({});
  verifyAuthTokenMock.mockReturnValue(null);
});

// ============================================================
describe('POST /api/headshot/generate — 결제 게이트', () => {
  test('① paymentToken 유효 → 생성 진입 + 크레딧 API 미호출(미차감) + 쿼터 1 소모', async () => {
    const token = await issueToken();
    const res = mockRes();
    await handleHeadshotGenerate(genReq({ image: 'data:image/jpeg;base64,xxx', purpose: 'linkedin_pro', paymentToken: token }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.image).toBe('GEN_B64');
    expect(res.body.remainingGenerates).toBe(0); // 1결제 1생성 (07-05)
    expect(res.body.credits).toBeUndefined();
    expect(generateHeadshotMock).toHaveBeenCalledTimes(1);
    // 크레딧 경로(/api/credits/use fetch) 미진입 — 크레딧 미차감
    expect(global.fetch).not.toHaveBeenCalled();
    expect(fakeFirestore._data.get(`directTokens/${token}`).generateCount).toBe(1);
  });

  test('② 무토큰·무세션 → 402 PAYMENT_REQUIRED, 생성 미진입', async () => {
    const res = mockRes();
    await handleHeadshotGenerate(genReq({ image: 'data:image/jpeg;base64,xxx', purpose: 'corporate' }), res);

    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe('PAYMENT_REQUIRED');
    expect(generateHeadshotMock).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('위조 토큰 → 402, 생성 미진입', async () => {
    const res = mockRes();
    await handleHeadshotGenerate(genReq({ image: 'x', paymentToken: 'a'.repeat(64) }), res);
    expect(res.statusCode).toBe(402);
    expect(res.body.code).toBe('INVALID_TOKEN');
    expect(generateHeadshotMock).not.toHaveBeenCalled();
  });

  test('토큰 경로 생성 실패 → refundGenerateQuota로 쿼터 반환 + 500', async () => {
    const token = await issueToken();
    generateHeadshotMock.mockRejectedValue(new Error('vertex down'));

    const res = mockRes();
    await handleHeadshotGenerate(genReq({ image: 'x', purpose: 'creative', paymentToken: token }), res);

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe('GENERATE_FAILED');
    // 반환은 best-effort 비동기 — 마이크로태스크 플러시 후 검증
    await new Promise((r) => setTimeout(r, 0));
    expect(fakeFirestore._data.get(`directTokens/${token}`).generateCount).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled(); // 크레딧 환불 API 미호출 (토큰 분기)
  });

  test('기존 로그인 크레딧 경로 무변경 — 세션 유효 시 /api/credits/use 경유 + credits 응답', async () => {
    parseCookiesMock.mockReturnValue({ monkos_session: 'sess-token' });
    verifyAuthTokenMock.mockReturnValue({ userId: 'user-1' });
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, credits: 30 }) });

    const res = mockRes();
    await handleHeadshotGenerate(genReq({ image: 'x', purpose: 'dating' }, 'monkos_session=sess-token'), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.image).toBe('GEN_B64');
    expect(res.body.credits).toBe(30);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/api/credits/use');
  });
});

// ============================================================
describe('렌더 — /headshot ko 기본 + 결제 UI', () => {
  function render(forceLang) {
    const res = mockRes();
    renderHeadshot({ headers: {}, url: '/headshot' }, res, forceLang);
    expect(res.statusCode).toBe(200);
    return res.raw;
  }

  test('기본 언어 = ko (라우트 /headshot, hreflang 정합)', () => {
    const html = render(null);
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain("window.__HS_LANG__ = 'ko'");
  });

  test('결제 UI 요소 존재 — 결제 섹션·토스 위젯 컨테이너·결제하기 버튼', () => {
    const html = render(null);
    expect(html).toContain('id="hsPaySection"');
    expect(html).toContain('id="hs-pm"');
    expect(html).toContain('id="hs-agree"');
    expect(html).toContain('id="hsPayConfirm"');
    expect(html).toContain('id="hsPayGo"'); // 2카드+상태 CTA (07-06 시안)
  });

  test('ko = kr 시장 — ₩2,000 표기 + 토스 위젯 SDK(v2/standard) 로드', () => {
    const html = render(null);
    expect(html).toContain('₩2,000');
    expect(html).toContain('https://js.tosspayments.com/v2/standard');
    expect(html).toContain('"market":"kr"');
  });

  test('en = global 시장 — $1.99 표기, 토스 SDK 미로드', () => {
    const html = render('en');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('$1.99');
    expect(html).not.toContain('js.tosspayments.com');
    expect(html).toContain('"market":"global"');
  });

  test('ja = jp 시장 — $1.99(레몬 글로벌 단일) + 일본어 결제 문구', () => {
    const html = render('ja');
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain('$1.99');
    expect(html).toContain('"market":"jp"');
    expect(html).toContain('お支払い方法');
  });
});
