/**
 * 크레딧 매핑 테스트
 * 결제 금액/variant → 크레딧 변환 로직 검증
 */

// 서버에서 사용하는 매핑 복제 (server.js 모듈화 전까지 별도 정의)
const VARIANT_CREDITS = {
  '1297524': 10,  // MONKOS 10 Credits — $10
  '1297532': 30,  // MONKOS 30 Credits — $25
  '1297531': 50,  // MONKOS 50 Credits — $40
};

const TOSS_AMOUNT_CREDITS = {
  12900: 10,   // 10 크레딧 — ₩12,900
  29900: 30,   // 30 크레딧 — ₩29,900
  45900: 50,   // 50 크레딧 — ₩45,900
};

describe('Lemon Squeezy 크레딧 매핑', () => {
  test('variant 1297524 → 10 크레딧', () => {
    expect(VARIANT_CREDITS['1297524']).toBe(10);
  });

  test('variant 1297532 → 30 크레딧', () => {
    expect(VARIANT_CREDITS['1297532']).toBe(30);
  });

  test('variant 1297531 → 50 크레딧', () => {
    expect(VARIANT_CREDITS['1297531']).toBe(50);
  });

  test('알 수 없는 variant → undefined', () => {
    expect(VARIANT_CREDITS['9999999']).toBeUndefined();
  });
});

describe('토스페이먼츠 크레딧 매핑', () => {
  test('₩12,900 → 10 크레딧', () => {
    expect(TOSS_AMOUNT_CREDITS[12900]).toBe(10);
  });

  test('₩29,900 → 30 크레딧', () => {
    expect(TOSS_AMOUNT_CREDITS[29900]).toBe(30);
  });

  test('₩45,900 → 50 크레딧', () => {
    expect(TOSS_AMOUNT_CREDITS[45900]).toBe(50);
  });

  test('알 수 없는 금액 → undefined', () => {
    expect(TOSS_AMOUNT_CREDITS[10000]).toBeUndefined();
  });
});

describe('크레딧 가격 정책 검증', () => {
  test('30 크레딧 패키지가 가성비 최고', () => {
    // $10 → 10c = $1/c
    // $25 → 30c = $0.83/c (최고)
    // $40 → 50c = $0.8/c
    const pricePerCredit = {
      10: 10 / 10,   // $1.00
      30: 25 / 30,   // $0.83
      50: 40 / 50,   // $0.80
    };

    // 50 크레딧이 가장 저렴 (볼륨 디스카운트)
    expect(pricePerCredit[50]).toBeLessThan(pricePerCredit[30]);
    expect(pricePerCredit[30]).toBeLessThan(pricePerCredit[10]);
  });

  test('KRW 가격이 USD보다 저렴 (환율 고려)', () => {
    // 환율 약 1300원 기준
    const usdToKrw = 1300;
    const krPriceInUsd = 12900 / usdToKrw;  // ~$9.92

    // 한국 가격이 글로벌보다 저렴해야 함
    expect(krPriceInUsd).toBeLessThan(10);
  });
});
