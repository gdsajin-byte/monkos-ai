/**
 * 토스 취소 웹훅 테스트 (2026-07-06 F1)
 * - 충전 취소 → 크레딧 회수 (0 하한 클램프) + 멱등
 * - 단건 취소 → 미소모 토큰 revoke / 이미 소모 시 회수 불가 기록
 * - 토스 조회 재검증 실패(위조) → 무시
 * 외부 API·Firestore 전부 모킹 (payments-direct.test.js 준용).
 */

import { jest } from '@jest/globals';
import { createHmac, randomBytes } from 'crypto';

// ===== fake Firestore (where 쿼리 지원 — payments-direct.test.js 동일) =====
function createFakeFirestore() {
  const data = new Map();
  let autoId = 0;

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

  function collection(col) {
    return {
      doc: (id) => docRef(col, id),
      add: async (obj) => {
        const id = `auto-${++autoId}`;
        data.set(`${col}/${id}`, { ...obj });
        return docRef(col, id);
      },
      where(field, op, value) {
        const filters = [[field, value]];
        const builder = {
          where(f, _o, v) { filters.push([f, v]); return builder; },
          limit(n) {
            return {
              async get() {
                const docs = [];
                for (const [key, d] of data) {
                  if (!key.startsWith(col + '/')) continue;
                  if (filters.every(([f, v]) => d[f] === v)) {
                    docs.push({ data: () => ({ ...d }), ref: docRef(col, key.slice(col.length + 1)) });
                    if (docs.length >= n) break;
                  }
                }
                return { empty: docs.length === 0, docs };
              },
            };
          },
        };
        return builder;
      },
    };
  }

  return {
    _data: data,
    collection,
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

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  usersCollection: fakeFirestore.collection('users'),
  firestore: fakeFirestore,
  log: jest.fn(),
  logTransaction: jest.fn(),
  parseJsonBody: jest.fn(async (req) => req.body),
  parseRawBody: jest.fn(async (req) => req.rawBody),
  createHmac,
  randomBytes,
  sendTelegramMessage: jest.fn(),
  verifyAuthToken: jest.fn(() => null),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
  LEMONSQUEEZY_API_KEY: '',
  LEMONSQUEEZY_WEBHOOK_SECRET: 'x',
  LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL: '',
  LEMONSQUEEZY_STORE_ID: '',
  LEMONSQUEEZY_STORE_ID_JP: '',
  LEMON_JP_VARIANTS: new Set(['1382355', '1382367', '1382348', '1382362', '1382436']), // JP 스토어 소속 variant (config.js 실형 미러)
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE: '1',
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP: '2',
  SINGLE_DOWNLOAD_VARIANTS: new Set(['1', '2']),
  TOSS_SECRET_KEY: 'test_sk_dummy',
  TOSS_CLIENT_KEY: 'test_ck_dummy',
  VARIANT_CREDITS: {},
  TOSS_AMOUNT_CREDITS: {},
  PRODUCTS: { topup_10: { price: 1500, credits: 10, bonus: 0 } },
  DIRECT_PRICING: { kr: { provider: 'toss', amount: 2000, currency: 'KRW' }, global: { provider: 'lemon' }, jp: { provider: 'lemon' } },
  DIRECT_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
  DIRECT_TOKEN_MAX_GENERATES: 1,
  parseCookies: () => ({}),
}));

jest.unstable_mockModule('../lib/tracking.js', () => ({
  trackEvent: jest.fn(async () => {}),
  linkIdentity: jest.fn(async () => {}),
}));

const payments = await import('../lib/payments.js');

function mockRes() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (payload) => { res.body = payload ? JSON.parse(payload) : null; };
  return res;
}
function webhookReq(paymentKey) {
  return { body: { eventType: 'PAYMENT_STATUS_CHANGED', data: { paymentKey } }, headers: {}, method: 'POST' };
}

// 토스 조회 API 모킹 — paymentKey → 응답 매핑
let tossPayments = {};
beforeEach(() => {
  fakeFirestore._data.clear();
  tossPayments = {};
  global.fetch = jest.fn(async (url) => {
    const m = String(url).match(/\/v1\/payments\/([^/?]+)$/);
    const entry = m ? tossPayments[decodeURIComponent(m[1])] : null;
    if (!entry) return { ok: false, status: 404, json: async () => ({ code: 'NOT_FOUND' }) };
    return { ok: true, status: 200, json: async () => entry };
  });
});

describe('토스 취소 웹훅 — 충전(toss_confirm)', () => {
  beforeEach(() => {
    fakeFirestore._data.set('users/u1', { credits: 80 });
    fakeFirestore._data.set('payments/p1', {
      type: 'toss_confirm', userId: 'u1', orderId: 'O1', amount: 9900, paymentKey: 'pk1', creditsAdded: 80,
    });
  });

  test('전액 취소 → 크레딧 전액 회수 + cancelProcessed', async () => {
    tossPayments.pk1 = { status: 'CANCELED', orderId: 'O1' };
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk1'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.action).toBe('credits_revoked');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(0);
    expect(fakeFirestore._data.get('payments/p1').cancelProcessed).toBe(true);
    expect(fakeFirestore._data.get('payments/p1').revokedCredits).toBe(80);
  });

  test('잔액 부족(이미 소진) → 0 하한 클램프', async () => {
    fakeFirestore._data.set('users/u1', { credits: 30 });
    tossPayments.pk1 = { status: 'CANCELED', orderId: 'O1' };
    await payments.handleTossWebhook(webhookReq('pk1'), mockRes());
    expect(fakeFirestore._data.get('users/u1').credits).toBe(0);
    expect(fakeFirestore._data.get('payments/p1').revokedCredits).toBe(30);
  });

  test('중복 수신 → already_processed, 잔액 불변', async () => {
    tossPayments.pk1 = { status: 'CANCELED', orderId: 'O1' };
    await payments.handleTossWebhook(webhookReq('pk1'), mockRes());
    fakeFirestore._data.set('users/u1', { ...fakeFirestore._data.get('users/u1'), credits: 50 });
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk1'), res);
    expect(res.body.action).toBe('already_processed');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(50);
  });

  test('부분 취소 → 자동 회수 없이 경보만', async () => {
    tossPayments.pk1 = { status: 'PARTIAL_CANCELED', orderId: 'O1' };
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk1'), res);
    expect(res.body.action).toBe('partial_cancel_alerted');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(80);
  });
});

describe('토스 취소 웹훅 — 단건(direct)', () => {
  beforeEach(() => {
    fakeFirestore._data.set('payments/p2', {
      type: 'direct', provider: 'toss', orderId: 'S1', amount: 2000, paymentKey: 'pk2', downloadToken: 'tok1', slug: 'kr-passport',
    });
  });

  test('미소모 토큰 → revoked', async () => {
    fakeFirestore._data.set('directTokens/tok1', { status: 'active', downloaded: false, generateCount: 0 });
    tossPayments.pk2 = { status: 'CANCELED', orderId: 'S1' };
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk2'), res);
    expect(res.body.action).toBe('direct_token_revoked');
    expect(fakeFirestore._data.get('directTokens/tok1').status).toBe('revoked');
  });

  test('이미 소모된 토큰 → 회수 불가 기록', async () => {
    fakeFirestore._data.set('directTokens/tok1', { status: 'used', downloaded: true, generateCount: 1 });
    tossPayments.pk2 = { status: 'CANCELED', orderId: 'S1' };
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk2'), res);
    expect(res.body.action).toBe('direct_token_already_used');
    expect(fakeFirestore._data.get('directTokens/tok1').status).toBe('used');
  });
});

describe('토스 취소 웹훅 — 방어', () => {
  test('토스 조회 실패(위조 paymentKey) → 무시, 데이터 불변', async () => {
    fakeFirestore._data.set('users/u1', { credits: 80 });
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk-forged'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.action).toBe('ignored_unverifiable');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(80);
  });

  test('취소 아닌 상태(DONE) → 무시', async () => {
    tossPayments.pk1 = { status: 'DONE', orderId: 'O1' };
    const res = mockRes();
    await payments.handleTossWebhook(webhookReq('pk1'), res);
    expect(res.body.action).toBe('ignored_status_DONE');
  });

  test('paymentKey 없는 페이로드 → 무시', async () => {
    const res = mockRes();
    await payments.handleTossWebhook({ body: {}, headers: {}, method: 'POST' }, res);
    expect(res.body.action).toBe('ignored_no_payment_key');
  });
});
