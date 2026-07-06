/**
 * 크레딧 환불 가드 테스트 (2026-07-06 F2 봉합)
 * - 환불은 직전 차감(lastUse) 대조로만 지급: 무증빙 셀프 환불 차단
 * - use → refund 정상 왕복 / 중복 환불 409 / 차감 없는 환불 409 / type 불일치 409 / 창 만료
 * Firestore·외부는 전부 모킹 (payments-direct.test.js 준용).
 */

import { jest } from '@jest/globals';

// ===== fake Firestore (최소 구현) =====
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
const verifyAuthTokenMock = jest.fn(() => ({ userId: 'u1' }));

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  usersCollection: fakeFirestore.collection('users'),
  firestore: fakeFirestore,
  log: jest.fn(),
  logTransaction: jest.fn(),
  parseJsonBody: jest.fn(async (req) => req.body),
  parseCookies: () => ({ monkos_session: 'tok' }),
  verifyAuthToken: verifyAuthTokenMock,
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
}));

jest.unstable_mockModule('../lib/tracking.js', () => ({
  trackEvent: jest.fn(async () => {}),
  linkIdentity: jest.fn(async () => {}),
}));

const credits = await import('../lib/credits.js');

function mockRes() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (payload) => { res.body = payload ? JSON.parse(payload) : null; };
  return res;
}
function postReq(body) {
  return { body, headers: { host: 'localhost', cookie: 'monkos_session=tok' }, method: 'POST' };
}

beforeEach(() => {
  fakeFirestore._data.clear();
  fakeFirestore._data.set('users/u1', { credits: 100 });
  verifyAuthTokenMock.mockReturnValue({ userId: 'u1' });
});

describe('환불 가드 — use/refund 왕복', () => {
  test('use(generate) → lastUse 기록 + 10c 차감', async () => {
    const res = mockRes();
    await credits.handleCreditsUse(postReq({ userId: 'u1', type: 'generate' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.credits).toBe(90);
    const user = fakeFirestore._data.get('users/u1');
    expect(user.lastUse).toMatchObject({ type: 'generate', cost: 10, refunded: false });
  });

  test('use 직후 refund(generate) → 정확히 차감분만 복원', async () => {
    await credits.handleCreditsUse(postReq({ userId: 'u1', type: 'generate' }), mockRes());
    const res = mockRes();
    await credits.handleCreditsRefund(postReq({ userId: 'u1', type: 'generate' }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.credits).toBe(100);
    expect(fakeFirestore._data.get('users/u1').lastUse.refunded).toBe(true);
  });

  test('중복 refund → 409 ALREADY_REFUNDED (이중 지급 차단)', async () => {
    await credits.handleCreditsUse(postReq({ userId: 'u1', type: 'generate' }), mockRes());
    await credits.handleCreditsRefund(postReq({ userId: 'u1', type: 'generate' }), mockRes());
    const res = mockRes();
    await credits.handleCreditsRefund(postReq({ userId: 'u1', type: 'generate' }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('ALREADY_REFUNDED');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(100);
  });

  test('차감 없이 refund → 409 NO_MATCHING_USE (셀프 환불 봉합)', async () => {
    const res = mockRes();
    await credits.handleCreditsRefund(postReq({ userId: 'u1', type: 'download' }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('NO_MATCHING_USE');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(100);
  });

  test('type 불일치 refund → 409 TYPE_MISMATCH', async () => {
    await credits.handleCreditsUse(postReq({ userId: 'u1', type: 'generate' }), mockRes());
    const res = mockRes();
    await credits.handleCreditsRefund(postReq({ userId: 'u1', type: 'download' }), res);
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('TYPE_MISMATCH');
    expect(fakeFirestore._data.get('users/u1').credits).toBe(90);
  });

  test('타인 계정 refund → 403', async () => {
    const res = mockRes();
    await credits.handleCreditsRefund(postReq({ userId: 'u2', type: 'generate' }), res);
    expect(res.statusCode).toBe(403);
  });
});

describe('refundEligibility 순수 함수', () => {
  const now = Date.parse('2026-07-06T12:00:00.000Z');

  test('10분 이내 미환불 동일 type → 허용', () => {
    const lastUse = { type: 'generate', cost: 10, at: '2026-07-06T11:55:00.000Z', refunded: false };
    expect(credits.refundEligibility(lastUse, 'generate', now)).toEqual({ ok: true, cost: 10 });
  });

  test('창 만료(10분 초과) → WINDOW_EXPIRED', () => {
    const lastUse = { type: 'generate', cost: 10, at: '2026-07-06T11:40:00.000Z', refunded: false };
    expect(credits.refundEligibility(lastUse, 'generate', now).reason).toBe('WINDOW_EXPIRED');
  });

  test('비정상 cost → INVALID_COST', () => {
    const lastUse = { type: 'generate', cost: -10, at: '2026-07-06T11:59:00.000Z', refunded: false };
    expect(credits.refundEligibility(lastUse, 'generate', now).reason).toBe('INVALID_COST');
  });
});
