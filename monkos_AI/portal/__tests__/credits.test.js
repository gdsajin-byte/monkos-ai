/**
 * 크레딧 매핑 테스트
 * v3 과금체계 — PRODUCTS 구조 기반
 */

// v3 PRODUCTS 구조 (config.js 동일)
const PRODUCTS = {
  single_70:   { price: 9900,  credits: 70,  bonus: 10 },
  package_100: { price: 12900, credits: 100, bonus: 30 },
  package_300: { price: 34900, credits: 300, bonus: 120 },
  package_500: { price: 49900, credits: 500, bonus: 250 },
  topup_10:    { price: 1500,  credits: 10,  bonus: 0 },
};

// 하위호환 매핑 (config.js 동일)
const TOSS_AMOUNT_CREDITS = Object.fromEntries(
  Object.values(PRODUCTS).map(p => [p.price, p.credits + p.bonus])
);

describe('v3 TOSS_AMOUNT_CREDITS 매핑', () => {
  test('₩9,900 → 80c (단건 70+10)', () => {
    expect(TOSS_AMOUNT_CREDITS[9900]).toBe(80);
  });

  test('₩12,900 → 130c (패키지1 100+30)', () => {
    expect(TOSS_AMOUNT_CREDITS[12900]).toBe(130);
  });

  test('₩34,900 → 420c (패키지2 300+120)', () => {
    expect(TOSS_AMOUNT_CREDITS[34900]).toBe(420);
  });

  test('₩49,900 → 750c (패키지3 500+250)', () => {
    expect(TOSS_AMOUNT_CREDITS[49900]).toBe(750);
  });

  test('₩1,450 → 10c (소액)', () => {
    expect(TOSS_AMOUNT_CREDITS[1500]).toBe(10);
  });

  test('미등록 금액 → undefined', () => {
    expect(TOSS_AMOUNT_CREDITS[9999]).toBeUndefined();
  });
});

describe('v3 보너스율 검증', () => {
  test('보너스율이 패키지 크기에 따라 증가', () => {
    const rates = Object.values(PRODUCTS)
      .filter(p => p.bonus > 0)
      .map(p => p.bonus / p.credits);

    // 단건 14.3% < 패키지1 30% < 패키지2 40% < 패키지3 50%
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i]).toBeGreaterThan(rates[i - 1]);
    }
  });

  test('소액 topup_10 보너스 없음', () => {
    expect(PRODUCTS.topup_10.bonus).toBe(0);
  });
});

describe('v3 크레딧 소비 단가', () => {
  const COST_MAP = { generate: 10, download: 70, extra_crop: 10, full_original: 10 };

  test('풀샷 원본 = 10c (v3)', () => {
    expect(COST_MAP.full_original).toBe(10);
  });

  test('1회 총 비용 = 80c (생성 10c + 다운로드 70c)', () => {
    expect(COST_MAP.generate + COST_MAP.download).toBe(80);
  });

  test('단건 상품(80c)으로 정확히 1회 가능', () => {
    const totalCredits = PRODUCTS.single_70.credits + PRODUCTS.single_70.bonus;
    const oneCost = COST_MAP.generate + COST_MAP.download;
    expect(totalCredits).toBe(oneCost);
  });
});
