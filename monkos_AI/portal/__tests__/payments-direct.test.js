/**
 * specs 단건 직접결제(T1) 머니패스 테스트
 * - 금액 조작 거부 (서버 ₩2,000 고정)
 * - orderId 멱등성 (중복 confirm 차단)
 * - 토큰 생성 쿼터(1회 — 1결제 1생성) + 다운로드 1회성 소모
 * - 무결제 generate 402 게이트
 * - 레몬 단건 웹훅 (토큰 발급·멱등·환불 무효화)
 * 외부 API(토스/레몬)·Firestore는 전부 모킹.
 */

import { jest } from '@jest/globals';
import { createHmac, randomBytes } from 'crypto';

// ===== fake Firestore =====
function createFakeFirestore() {
  const data = new Map(); // `${col}/${id}` -> object
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
const VARIANT_SINGLE = '999001';
const VARIANT_SINGLE_JP = '999002';
const WEBHOOK_SECRET = 'test-webhook-secret';

// ===== config.js 모킹 =====
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
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
  LEMONSQUEEZY_API_KEY: 'test-lemon-key',
  LEMONSQUEEZY_WEBHOOK_SECRET: WEBHOOK_SECRET,
  LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL: '',
  LEMONSQUEEZY_STORE_ID: '415328',
  LEMONSQUEEZY_STORE_ID_JP: '290457',
  LEMON_JP_VARIANTS: new Set(['1382355', '1382367', '1382348', '1382362', '1382436']), // JP 스토어 소속 variant (config.js 실형 미러)
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE: VARIANT_SINGLE,
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP: VARIANT_SINGLE_JP,
  SINGLE_DOWNLOAD_VARIANTS: new Set([VARIANT_SINGLE, VARIANT_SINGLE_JP]),
  TOSS_SECRET_KEY: 'test_sk_dummy',
  TOSS_CLIENT_KEY: 'test_ck_dummy',
  VARIANT_CREDITS: { '1909373': 40 },
  TOSS_AMOUNT_CREDITS: {},
  PRODUCTS: { topup_10: { price: 1500, credits: 10, bonus: 0 } },
  DIRECT_PRICING: {
    kr: { provider: 'toss', amount: 2000, currency: 'KRW' },
    global: { provider: 'lemon' },
    jp: { provider: 'lemon' },
  },
  DIRECT_TOKEN_TTL_MS: 24 * 60 * 60 * 1000,
  DIRECT_TOKEN_MAX_GENERATES: 1,
  parseCookies: () => ({}),
  verifyAuthToken: jest.fn(() => null),
}));

jest.unstable_mockModule('../lib/tracking.js', () => ({
  trackEvent: jest.fn(async () => {}),
  linkIdentity: jest.fn(async () => {}),
}));

const payments = await import('../lib/payments.js');

// ===== 테스트 유틸 =====
function mockRes() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (payload) => { res.body = payload ? JSON.parse(payload) : null; };
  return res;
}

function postReq(body) {
  return { body, headers: { host: 'localhost' }, method: 'POST' };
}

async function initKrOrder(slug = 'kr-passport') {
  const res = mockRes();
  await payments.handleDirectInit(postReq({ slug, market: 'kr' }), res);
  expect(res.statusCode).toBe(200);
  return res.body;
}

beforeEach(() => {
  fakeFirestore._data.clear();
  global.fetch = jest.fn();
});

// ============================================================
describe('POST /api/payments/direct/init (KR 토스)', () => {
  test('orderId 서버 발급 + 금액 서버 고정 ₩2,000 (클라이언트 금액 무시)', async () => {
    const res = mockRes();
    // 클라이언트가 amount를 끼워 보내도 무시된다
    await payments.handleDirectInit(postReq({ slug: 'kr-passport', market: 'kr', amount: 100 }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.orderId).toMatch(/^SPECS-kr-/);
    expect(res.body.amount).toBe(2000);
    expect(res.body.currency).toBe('KRW');
    expect(res.body.provider).toBe('toss');
    expect(res.body.clientKey).toBe('test_ck_dummy');

    const order = fakeFirestore._data.get(`directOrders/${res.body.orderId}`);
    expect(order.amount).toBe(2000);
    expect(order.status).toBe('pending');
    expect(order.slug).toBe('kr-passport');
    expect(order.market).toBe('kr');
  });

  test('유효하지 않은 slug/market 거부', async () => {
    const res1 = mockRes();
    await payments.handleDirectInit(postReq({ slug: '../etc', market: 'kr' }), res1);
    expect(res1.statusCode).toBe(400);

    const res2 = mockRes();
    await payments.handleDirectInit(postReq({ slug: 'kr-passport', market: 'us' }), res2);
    expect(res2.statusCode).toBe(400);
  });

  test('글로벌/JP — 레몬 체크아웃 생성 (custom order_ref 전달, JP도 글로벌 스토어 USD 단일 — 2026-07-05 통일)', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { attributes: { url: 'https://checkout.lemonsqueezy.com/xyz' } } }),
    });

    const res = mockRes();
    await payments.handleDirectInit(postReq({ slug: 'jp-passport', market: 'jp' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.provider).toBe('lemon');
    expect(res.body.checkoutUrl).toBe('https://checkout.lemonsqueezy.com/xyz');

    const sent = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sent.data.attributes.checkout_data.custom.order_ref).toBe(res.body.orderId);
    expect(sent.data.relationships.store.data.id).toBe('415328');
    expect(sent.data.relationships.variant.data.id).toBe(VARIANT_SINGLE);
  });
});

// ============================================================
describe('POST /api/payments/toss/direct — 서버 머니패스', () => {
  test('클라이언트 금액 조작 → 거부(400)·토스 미호출·주문 기록', async () => {
    const { orderId } = await initKrOrder();
    const res = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId, amount: 100 }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('AMOUNT_MISMATCH');
    expect(global.fetch).not.toHaveBeenCalled();
    expect(fakeFirestore._data.get(`directOrders/${orderId}`).status).toBe('amount_mismatch');
  });

  test('confirm은 서버 정본 금액(₩2,000)으로 호출 → 토큰 발급', async () => {
    const { orderId } = await initKrOrder();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ totalAmount: 2000 }) });

    const res = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.paymentToken).toMatch(/^[a-f0-9]{64}$/);

    // 토스 confirm에 전달된 금액 = 서버 정본 2000
    const sent = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sent.amount).toBe(2000);

    const token = fakeFirestore._data.get(`directTokens/${res.body.paymentToken}`);
    expect(token.status).toBe('active');
    expect(token.generateCount).toBe(0);
    expect(token.slug).toBe('kr-passport');
    expect(token.market).toBe('kr');
    expect(fakeFirestore._data.get(`directOrders/${orderId}`).status).toBe('paid');
  });

  test('멱등성 — 중복 confirm 시 기존 토큰 재응답, 토스 재호출 없음', async () => {
    const { orderId } = await initKrOrder();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ totalAmount: 2000 }) });

    const res1 = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId }), res1);
    const firstToken = res1.body.paymentToken;
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const res2 = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId }), res2);
    expect(res2.statusCode).toBe(200);
    expect(res2.body.duplicated).toBe(true);
    expect(res2.body.paymentToken).toBe(firstToken);
    expect(global.fetch).toHaveBeenCalledTimes(1); // 이중 confirm 없음
  });

  test('서버가 발급하지 않은 orderId → 거부(400)·토스 미호출', async () => {
    const res = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId: 'FORGED-ORDER-123' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('ORDER_NOT_FOUND');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('토스 승인 응답 금액이 정본과 다르면 거부', async () => {
    const { orderId } = await initKrOrder();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({ totalAmount: 100 }) });

    const res = mockRes();
    await payments.handleTossDirect(postReq({ paymentKey: 'pk_1', orderId }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('AMOUNT_MISMATCH');
    expect(fakeFirestore._data.get(`directOrders/${orderId}`).status).toBe('amount_mismatch');
  });
});

// ============================================================
describe('결제 게이트 — consumeGenerateQuota / handleDownloadDirect', () => {
  test('무결제(토큰 없음) generate → 402 PAYMENT_REQUIRED', async () => {
    const gate = await payments.consumeGenerateQuota(undefined);
    expect(gate.ok).toBe(false);
    expect(gate.status).toBe(402);
    expect(gate.code).toBe('PAYMENT_REQUIRED');
  });

  test('형식 불량·미발급 토큰 → 402', async () => {
    const bad = await payments.consumeGenerateQuota('not-a-token');
    expect(bad.status).toBe(402);

    const forged = await payments.consumeGenerateQuota('a'.repeat(64));
    expect(forged.status).toBe(402);
    expect(forged.code).toBe('INVALID_TOKEN');
  });

  test('생성 쿼터 1회 허용, 2회째 거부 (1결제 1생성 — 07-05 재생성 폐지)', async () => {
    const { token } = await payments.issueDirectToken({ orderId: 'SPECS-kr-x-aaaaaaaa', slug: 'kr-passport', market: 'kr', amount: 2000, currency: 'KRW', provider: 'toss' });

    const g1 = await payments.consumeGenerateQuota(token);
    expect(g1).toMatchObject({ ok: true, remainingGenerates: 0 });

    const g2 = await payments.consumeGenerateQuota(token);
    expect(g2.ok).toBe(false);
    expect(g2.status).toBe(402);
    expect(g2.code).toBe('GENERATE_LIMIT');
  });

  test('생성 실패 시 refundGenerateQuota로 쿼터 반환', async () => {
    const { token } = await payments.issueDirectToken({ orderId: 'o1', provider: 'toss' });
    await payments.consumeGenerateQuota(token);
    await payments.refundGenerateQuota(token);
    expect(fakeFirestore._data.get(`directTokens/${token}`).generateCount).toBe(0);
  });

  test('만료 토큰 → 402 TOKEN_EXPIRED', async () => {
    const { token } = await payments.issueDirectToken({ orderId: 'o1', provider: 'toss' });
    fakeFirestore._data.set(`directTokens/${token}`, {
      ...fakeFirestore._data.get(`directTokens/${token}`),
      expiresAt: Date.now() - 1000,
    });
    const gate = await payments.consumeGenerateQuota(token);
    expect(gate.status).toBe(402);
    expect(gate.code).toBe('TOKEN_EXPIRED');
  });

  test('다운로드 1회성 — 최종 소모 후 재사용·재생성 전부 차단', async () => {
    const { token } = await payments.issueDirectToken({ orderId: 'SPECS-kr-x-bbbbbbbb', slug: 'kr-passport', market: 'kr', provider: 'toss' });

    const req = { url: `/api/download/direct?token=${token}`, headers: { host: 'localhost' } };
    const res1 = mockRes();
    await payments.handleDownloadDirect(req, res1);
    expect(res1.statusCode).toBe(200);
    expect(res1.body.success).toBe(true);

    // 2회째 다운로드 → 거부
    const res2 = mockRes();
    await payments.handleDownloadDirect(req, res2);
    expect(res2.statusCode).toBe(409);
    expect(res2.body.success).toBe(false);

    // 소모된 토큰으로 generate → 402
    const gate = await payments.consumeGenerateQuota(token);
    expect(gate.status).toBe(402);
    expect(gate.code).toBe('TOKEN_USED');
  });
});

// ============================================================
describe('dev-grant + prod 거부 가드', () => {
  const savedK = process.env.K_SERVICE;
  afterEach(() => {
    if (savedK === undefined) delete process.env.K_SERVICE; else process.env.K_SERVICE = savedK;
  });
  const asDev = () => { process.env.K_SERVICE = 'monkos-portal-dev'; };
  const asProd = () => { process.env.K_SERVICE = 'monkos-portal'; };
  async function grant() {
    const order = await initKrOrder('us-visa');
    const res = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: order.orderId }), res);
    return { orderId: order.orderId, res };
  }
  const statusOf = async (orderId) => {
    const res = mockRes();
    await payments.handleDirectStatus({ url: `/api/payments/direct/status?orderId=${orderId}`, headers: { host: 'localhost' } }, res);
    return res;
  };

  test('dev: pending 주문 → paid + 토큰, 양쪽 devGrant, payments 원장 미기록', async () => {
    asDev();
    const { orderId, res } = await grant();
    expect(res.statusCode).toBe(200);
    const token = res.body.paymentToken;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(fakeFirestore._data.get(`directOrders/${orderId}`)).toMatchObject({ status: 'paid', devGrant: true, paymentToken: token });
    expect(fakeFirestore._data.get(`directTokens/${token}`)).toMatchObject({ provider: 'dev-grant', devGrant: true, status: 'active' });
    expect([...fakeFirestore._data.keys()].filter((k) => k.startsWith('payments/'))).toEqual([]);
  });

  test('dev: pending 아닌 주문 거부', async () => {
    asDev();
    const { orderId } = await grant();
    const res = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('ORDER_NOT_PENDING');
  });

  test('dev: 없는 주문·형식 불량 거부', async () => {
    asDev();
    const r1 = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: 'SPECS-kr-x-aaaaaaaa' }), r1);
    expect(r1.statusCode).toBe(404);
    const r2 = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: '../x' }), r2);
    expect(r2.statusCode).toBe(400);
  });

  test('dev: prod에서 생성한 주문 거부, 주문 불변', async () => {
    asProd();
    const order = await initKrOrder('us-visa');
    expect(fakeFirestore._data.get(`directOrders/${order.orderId}`).originService).toBe('monkos-portal');
    asDev();
    const res = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: order.orderId }), res);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('ORDER_NOT_DEV_ORIGIN');
    expect(fakeFirestore._data.get(`directOrders/${order.orderId}`).status).toBe('pending');
  });

  test('dev: 표식 없는 구 주문 거부', async () => {
    asDev();
    const order = await initKrOrder('us-visa');
    const key = `directOrders/${order.orderId}`;
    const { originService, ...legacy } = fakeFirestore._data.get(key);
    fakeFirestore._data.set(key, legacy);
    const res = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: order.orderId }), res);
    expect(res.statusCode).toBe(403);
    expect(fakeFirestore._data.get(key).status).toBe('pending');
  });

  test('prod: 핸들러 자체가 404, 주문 불변', async () => {
    asProd();
    const order = await initKrOrder('us-visa');
    const res = mockRes();
    await payments.handleDirectDevGrant(postReq({ orderId: order.orderId }), res);
    expect(res.statusCode).toBe(404);
    expect(fakeFirestore._data.get(`directOrders/${order.orderId}`).status).toBe('pending');
  });

  test('dev: 발급 토큰으로 폴링·생성·다운로드 통과', async () => {
    asDev();
    const { orderId, res } = await grant();
    const token = res.body.paymentToken;
    const st = await statusOf(orderId);
    expect(st.body).toMatchObject({ status: 'paid', paymentToken: token });
    expect(await payments.consumeGenerateQuota(token)).toMatchObject({ ok: true });
    const dl = mockRes();
    await payments.handleDownloadDirect({ url: `/api/download/direct?token=${token}`, headers: { host: 'localhost' } }, dl);
    expect(dl.statusCode).toBe(200);
  });

  describe.each([['monkos-portal'], [undefined]])('K_SERVICE=%s (dev 아님)', (k) => {
    const setEnv = () => { if (k) process.env.K_SERVICE = k; else delete process.env.K_SERVICE; };

    test('생성 거부 INVALID_TOKEN, 쿼터 불변', async () => {
      asDev();
      const { res } = await grant();
      const token = res.body.paymentToken;
      setEnv();
      const gate = await payments.consumeGenerateQuota(token);
      expect(gate).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
      expect(fakeFirestore._data.get(`directTokens/${token}`).generateCount).toBe(0);
    });

    test('다운로드 거부 INVALID_TOKEN, 소모 안 됨', async () => {
      asDev();
      const { res } = await grant();
      const token = res.body.paymentToken;
      setEnv();
      const dl = mockRes();
      await payments.handleDownloadDirect({ url: `/api/download/direct?token=${token}`, headers: { host: 'localhost' } }, dl);
      expect(dl.statusCode).toBe(404);
      expect(dl.body.code).toBe('INVALID_TOKEN');
      expect(fakeFirestore._data.get(`directTokens/${token}`).status).toBe('active');
    });

    test('폴링: 토큰 미반환 + 종료값 failed', async () => {
      asDev();
      const { orderId } = await grant();
      setEnv();
      const st = await statusOf(orderId);
      expect(st.statusCode).toBe(200);
      expect(st.body).toEqual({ orderId, status: 'failed' });
    });
  });

  test('provider만 dev-grant이거나 devGrant만 있어도 거부 (둘 중 하나)', () => {
    asProd();
    expect(payments.tokenEnvOk({ provider: 'dev-grant' })).toBe(false);
    expect(payments.tokenEnvOk({ provider: 'toss', devGrant: true })).toBe(false);
  });

  test('일반 토큰·주문은 prod에서 영향 없음', async () => {
    asProd();
    expect(payments.tokenEnvOk({ provider: 'toss' })).toBe(true);
    const { token } = await payments.issueDirectToken({ orderId: 'o2', provider: 'toss' });
    expect(fakeFirestore._data.get(`directTokens/${token}`).devGrant).toBeUndefined();
    expect(await payments.consumeGenerateQuota(token)).toMatchObject({ ok: true });
  });
});

describe('레몬 웹훅 — specs 단건 $2 분기', () => {
  function signBody(rawBody) {
    return createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  }

  // signature: undefined = 유효 서명 자동 부여, null = 헤더 제거(무서명), 문자열 = 해당 값 그대로
  function webhookReq(payload, { signature } = {}) {
    const rawBody = JSON.stringify(payload);
    const headers = {};
    const sig = signature === undefined ? signBody(rawBody) : signature;
    if (sig !== null) headers['x-signature'] = sig;
    return { rawBody, headers, method: 'POST' };
  }

  function orderCreatedPayload({ lemonOrderId, orderRef, variantId }) {
    return {
      meta: { event_name: 'order_created', custom_data: orderRef ? { order_ref: orderRef } : {} },
      data: {
        id: lemonOrderId,
        attributes: {
          total: 200, currency: 'USD',
          first_order_item: { variant_id: Number(variantId) },
        },
      },
    };
  }

  test('단건 variant 수신 → 크레딧 대신 다운로드 토큰 발급 + 주문 연결', async () => {
    await fakeFirestore.collection('directOrders').doc('SPECS-global-t-cccccccc').set({
      orderId: 'SPECS-global-t-cccccccc', slug: 'us-passport', market: 'global', provider: 'lemon', status: 'pending',
    });

    const res = mockRes();
    await payments.handleLemonSqueezyWebhook(
      webhookReq(orderCreatedPayload({ lemonOrderId: '5001', orderRef: 'SPECS-global-t-cccccccc', variantId: VARIANT_SINGLE })), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.action).toBe('direct_token_issued');

    const order = fakeFirestore._data.get('directOrders/SPECS-global-t-cccccccc');
    expect(order.status).toBe('paid');
    expect(order.paymentToken).toMatch(/^[a-f0-9]{64}$/);

    const token = fakeFirestore._data.get(`directTokens/${order.paymentToken}`);
    expect(token.status).toBe('active');
    expect(token.provider).toBe('lemon');
    expect(token.slug).toBe('us-passport');
  });

  test('웹훅 재전송(동일 lemon order id) → 토큰 이중 발급 차단', async () => {
    const res1 = mockRes();
    await payments.handleLemonSqueezyWebhook(
      webhookReq(orderCreatedPayload({ lemonOrderId: '5002', variantId: VARIANT_SINGLE })), res1);
    expect(res1.body.action).toBe('direct_token_issued');

    const res2 = mockRes();
    await payments.handleLemonSqueezyWebhook(
      webhookReq(orderCreatedPayload({ lemonOrderId: '5002', variantId: VARIANT_SINGLE })), res2);
    expect(res2.body.action).toBe('duplicate');

    const tokens = [...fakeFirestore._data.keys()].filter(k => k.startsWith('directTokens/'));
    expect(tokens.length).toBe(1);
  });

  test('환불 웹훅 → 미사용 토큰 무효화, 이후 generate 402', async () => {
    const res1 = mockRes();
    await payments.handleLemonSqueezyWebhook(
      webhookReq(orderCreatedPayload({ lemonOrderId: '5003', variantId: VARIANT_SINGLE_JP })), res1);
    const tokenKey = [...fakeFirestore._data.keys()].find(k => k.startsWith('directTokens/'));
    const token = tokenKey.split('/')[1];

    const refundRes = mockRes();
    await payments.handleLemonSqueezyWebhook(webhookReq({
      meta: { event_name: 'order_refunded', custom_data: {} },
      data: { id: '5003', attributes: { first_order_item: { variant_id: Number(VARIANT_SINGLE_JP) } } },
    }), refundRes);

    expect(refundRes.body.action).toBe('direct_token_revoked');
    expect(fakeFirestore._data.get(tokenKey).status).toBe('revoked');

    const gate = await payments.consumeGenerateQuota(token);
    expect(gate.status).toBe(402);
  });

  test('크레딧 variant는 기존 경로 유지 (단건 분기 미개입)', async () => {
    const res = mockRes();
    // userId 없음 + 크레딧 variant → 기존 skipped 동작
    await payments.handleLemonSqueezyWebhook(
      webhookReq(orderCreatedPayload({ lemonOrderId: '5004', variantId: '1909373' })), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.action).toBe('skipped');
  });
});

// ============================================================
describe('레몬 웹훅 — 서명 검증 필수 (P0 무서명 위조 차단)', () => {
  function signBody(rawBody) {
    return createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  }

  function forgedOrderCreated({ lemonOrderId, orderRef, variantId }) {
    return {
      meta: { event_name: 'order_created', custom_data: orderRef ? { order_ref: orderRef } : {} },
      data: {
        id: lemonOrderId,
        attributes: { total: 200, currency: 'USD', first_order_item: { variant_id: Number(variantId) } },
      },
    };
  }

  test('공격 체인 재현 — init으로 orderId 발급 후 무서명 위조 order_created → 401, 토큰 미발급, status에도 토큰 없음', async () => {
    // (1) 공격자가 자기 orderId 발급 (레몬 체크아웃 모킹)
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { attributes: { url: 'https://checkout.lemonsqueezy.com/xyz' } } }),
    });
    const initRes = mockRes();
    await payments.handleDirectInit(postReq({ slug: 'us-passport', market: 'global' }), initRes);
    const { orderId } = initRes.body;

    // (2) x-signature 없이 위조 order_created POST
    const res = mockRes();
    await payments.handleLemonSqueezyWebhook(
      { rawBody: JSON.stringify(forgedOrderCreated({ lemonOrderId: '6001', orderRef: orderId, variantId: VARIANT_SINGLE })), headers: {}, method: 'POST' },
      res);

    expect(res.statusCode).toBe(401);
    // 토큰 미발급 + 주문 상태 불변(pending)
    const tokens = [...fakeFirestore._data.keys()].filter(k => k.startsWith('directTokens/'));
    expect(tokens.length).toBe(0);
    expect(fakeFirestore._data.get(`directOrders/${orderId}`).status).toBe('pending');

    // (3) status 폴링으로 paymentToken 회수 시도 → 토큰 없음
    const statusRes = mockRes();
    await payments.handleDirectStatus({ url: `/api/payments/direct/status?orderId=${orderId}`, headers: { host: 'localhost' } }, statusRes);
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.status).toBe('pending');
    expect(statusRes.body.paymentToken).toBeUndefined();
  });

  test('위조 서명(불일치) → 401, 토큰 미발급', async () => {
    const payload = forgedOrderCreated({ lemonOrderId: '6002', variantId: VARIANT_SINGLE });
    const res = mockRes();
    await payments.handleLemonSqueezyWebhook(
      { rawBody: JSON.stringify(payload), headers: { 'x-signature': 'f'.repeat(64) }, method: 'POST' },
      res);

    expect(res.statusCode).toBe(401);
    const tokens = [...fakeFirestore._data.keys()].filter(k => k.startsWith('directTokens/'));
    expect(tokens.length).toBe(0);
  });

  test('무서명 크레딧 variant 위조 → 401, 크레딧 미지급', async () => {
    await fakeFirestore.collection('users').doc('victim-user').set({ credits: 0 });

    const payload = {
      meta: { event_name: 'order_created', custom_data: { user_id: 'victim-user' } },
      data: { id: '6003', attributes: { total: 200, currency: 'USD', first_order_item: { variant_id: 1909373 } } },
    };
    const res = mockRes();
    await payments.handleLemonSqueezyWebhook(
      { rawBody: JSON.stringify(payload), headers: {}, method: 'POST' }, res);

    expect(res.statusCode).toBe(401);
    expect(fakeFirestore._data.get('users/victim-user').credits).toBe(0);
  });

  test('다른 raw body에 대한 유효 서명 재사용(리플레이 변조) → 401', async () => {
    const original = JSON.stringify(forgedOrderCreated({ lemonOrderId: '6004', variantId: VARIANT_SINGLE }));
    const stolenSig = signBody(original);
    const tampered = JSON.stringify(forgedOrderCreated({ lemonOrderId: '6005', variantId: VARIANT_SINGLE }));

    const res = mockRes();
    await payments.handleLemonSqueezyWebhook(
      { rawBody: tampered, headers: { 'x-signature': stolenSig }, method: 'POST' }, res);

    expect(res.statusCode).toBe(401);
    const tokens = [...fakeFirestore._data.keys()].filter(k => k.startsWith('directTokens/'));
    expect(tokens.length).toBe(0);
  });
});
