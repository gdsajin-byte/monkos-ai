/**
 * specs v2 GA4 퍼널 계측 렌더 검증
 * - specsDetailV2Fragment 출력(pageScript)에 6개 이벤트명 + gtag 가드 포함
 * - transaction_id = orderId (paymentToken을 GA 파라미터로 전송 금지)
 * - layoutShell 최종 HTML에 gtag.js 스니펫 존재 (공통 레이아웃 로드 — 중복 추가 없음)
 * config.js는 PROJECT_ID 필수라 payments-direct.test.js와 동일하게 모킹.
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(),
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE: 'test-variant-single',
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP: 'test-variant-single-jp',
}));

const { specsDetailFragment } = await import('../lib/cms/render-specs.js');
const { layoutShell } = await import('../lib/cms/render-shell.js');

const EVENTS = ['spec_select', 'photo_upload', 'begin_checkout', 'purchase', 'generate_click', 'preview_view'];

describe('specs v2 GA4 계측', () => {
  // kr-passport = V2_DIRECT_SLUGS 파일럿 → 언어 무관 v2 fragment 반환
  const cases = [
    ['ko', null],
    ['ja', 'ja'],
    ['en', 'en'],
  ];

  test.each(cases)('kr-passport(%s) pageScript에 6개 이벤트명 포함', (label, forceLang) => {
    const parts = specsDetailFragment('kr-passport', forceLang);
    expect(parts).toBeTruthy();
    expect(typeof parts.pageScript).toBe('string');
    for (const ev of EVENTS) {
      expect(parts.pageScript).toContain(`'${ev}'`);
    }
  });

  test('gtag 가드(typeof gtag) 적용', () => {
    const parts = specsDetailFragment('kr-passport');
    expect(parts.pageScript).toContain("typeof gtag !== 'function'");
  });

  test('purchase transaction_id는 orderId — paymentToken 미전송', () => {
    const parts = specsDetailFragment('kr-passport');
    expect(parts.pageScript).toContain('transaction_id: orderId');
    // gtag 파라미터 빌더(gaTrack/gaTrackPurchase)에 paymentToken이 등장하지 않아야 한다
    const start = parts.pageScript.indexOf('function gaTrack');
    const end = parts.pageScript.indexOf('GEN_TEXT_DEFAULT');
    expect(start).toBeGreaterThan(-1);
    const gaBlock = parts.pageScript.slice(start, end);
    expect(gaBlock).not.toContain('paymentToken');
  });

  test('공통 파라미터: service=specs-v2 + market 포함', () => {
    const parts = specsDetailFragment('kr-passport');
    expect(parts.pageScript).toContain("service: 'specs-v2'");
    expect(parts.pageScript).toContain('market: CFG.market');
  });

  test('시장별 결제 파라미터: kr=toss/KRW/2000, 그 외=lemon/USD/1.99', () => {
    const ko = specsDetailFragment('kr-passport').pageScript;
    expect(ko).toContain("payment_provider: 'toss', currency: 'KRW', value: 2000");
    expect(ko).toContain("payment_provider: 'lemon', currency: 'USD', value: 1.99");
  });

  test('최종 HTML에 gtag.js 스니펫 존재 (공통 레이아웃 경유, 중복 없음)', () => {
    const parts = specsDetailFragment('kr-passport');
    const html = layoutShell(parts);
    const snippetCount = html.split('googletagmanager.com/gtag/js').length - 1;
    expect(snippetCount).toBe(1);
    expect(html).toContain('G-JPZWSJ3323');
  });
});
