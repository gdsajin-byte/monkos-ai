/**
 * 크레딧 출처 판정 — 웰컴 vs 구매 (2026-09-26 어드민 배지 분리)
 * 순수 함수 + Firestore 래퍼(모킹) 검증.
 */
import { jest } from '@jest/globals';

// 원장(transactions) 모킹 — where(userId).where(type).limit().get()
let txRows = [];
let throwOnGet = false;
const chain = {
  where() { return chain; },
  limit() { return chain; },
  async get() {
    if (throwOnGet) throw new Error('firestore down');
    return { docs: txRows.map(r => ({ data: () => r })) };
  },
};
jest.unstable_mockModule('../lib/shared/config.js', () => ({
  firestore: { collection: () => chain },
  log: () => {},
}));

const { classifyCreditSource, resolveCreditSource, CREDIT_SOURCE } = await import('../lib/credit-source.js');

describe('classifyCreditSource (순수)', () => {
  test('결제 원장 0건 → 웰컴', () => {
    expect(classifyCreditSource([])).toBe(CREDIT_SOURCE.WELCOME);
    expect(classifyCreditSource(null)).toBe(CREDIT_SOURCE.WELCOME);
  });

  test('결제 1건 + 기준 시각 없음 → 구매', () => {
    expect(classifyCreditSource([{ createdAt: '2026-09-23T04:03:00Z' }])).toBe(CREDIT_SOURCE.PURCHASED);
  });

  test('생성 이전 결제 → 구매', () => {
    const txs = [{ createdAt: '2026-09-23T04:03:00Z' }];
    expect(classifyCreditSource(txs, '2026-09-26T03:45:00Z')).toBe(CREDIT_SOURCE.PURCHASED);
  });

  test('생성 이후 결제만 있음 → 웰컴 (소급 금지)', () => {
    const txs = [{ createdAt: '2026-09-27T01:00:00Z' }];
    expect(classifyCreditSource(txs, '2026-09-26T03:45:00Z')).toBe(CREDIT_SOURCE.WELCOME);
  });

  test('createdAt 결손 행은 무시', () => {
    expect(classifyCreditSource([{}], '2026-09-26T03:45:00Z')).toBe(CREDIT_SOURCE.WELCOME);
  });

  test('기준 시각 파싱 불가 → 결제 존재 사실 우선(구매)', () => {
    expect(classifyCreditSource([{ createdAt: '2026-09-23T04:03:00Z' }], 'not-a-date')).toBe(CREDIT_SOURCE.PURCHASED);
  });
});

describe('resolveCreditSource (Firestore 래퍼)', () => {
  beforeEach(() => { txRows = []; throwOnGet = false; });

  test('userId 없음 → null', async () => {
    expect(await resolveCreditSource(null)).toBeNull();
  });

  test('원장 0건 → 웰컴 (09-25·09-26 실고객 케이스)', async () => {
    expect(await resolveCreditSource('106875964498894155378')).toBe(CREDIT_SOURCE.WELCOME);
  });

  test('충전 결제 원장 있음 → 구매', async () => {
    txRows = [{ createdAt: '2026-09-01T00:00:00Z', type: 'charge' }];
    expect(await resolveCreditSource('u1', '2026-09-26T00:00:00Z')).toBe(CREDIT_SOURCE.PURCHASED);
  });

  test('조회 실패 → null (배지는 "크레딧" 폴백, 매출 단정 금지)', async () => {
    throwOnGet = true;
    expect(await resolveCreditSource('u1')).toBeNull();
  });
});
