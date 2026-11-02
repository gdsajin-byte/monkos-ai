/**
 * specs v2 GA4 퍼널 계측 렌더 검증
 * - 2026-07-12 퍼널 분리 수술 반영: 위저드 클라 JS가 pageScript(인라인)에서
 *   public/js/specs-funnel.js(정적)로 이동 — 계측 코드 검사는 정적 파일에서,
 *   설정(CFG) 주입·스크립트 태그 배선은 fragment 출력에서 검사한다. 검증 의도 불변.
 * - transaction_id = orderId (paymentToken을 GA 파라미터로 전송 금지)
 * - layoutShell 최종 HTML에 gtag.js 스니펫 존재 (공통 레이아웃 로드 — 중복 추가 없음)
 * config.js는 PROJECT_ID 필수라 payments-direct.test.js와 동일하게 모킹.
 */

import { jest } from '@jest/globals';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(),
  // render-specs가 spec-crop.js(getSpecCropParams)를 import — 그쪽 텔레그램 경보부 링크 요건 (2026-07-10)
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE: 'test-variant-single',
  LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP: 'test-variant-single-jp',
  DIRECT_PRICING: { kr: { provider: 'toss', amount: 2000, currency: 'KRW' } },
}));

const { specsDetailFragment } = await import('../lib/cms/render-specs.js');
const { layoutShell } = await import('../lib/cms/render-shell.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const funnelJs = readFileSync(join(__dirname, '../public/js/specs-funnel.js'), 'utf8');

const EVENTS = ['spec_select', 'photo_upload', 'begin_checkout', 'purchase', 'generate_click', 'preview_view'];

describe('specs v2 GA4 계측', () => {
  // kr-passport = V2_DIRECT_SLUGS 파일럿 → 언어 무관 v2 fragment 반환
  const cases = [
    ['ko', null],
    ['ja', 'ja'],
    ['en', 'en'],
  ];

  test('specs-funnel.js(정적)에 6개 이벤트명 포함', () => {
    for (const ev of EVENTS) {
      expect(funnelJs).toContain(`'${ev}'`);
    }
  });

  test.each(cases)('kr-passport(%s) fragment가 CFG 주입 + funnel 스크립트 배선', (label, forceLang) => {
    const parts = specsDetailFragment('kr-passport', forceLang);
    expect(parts).toBeTruthy();
    expect(typeof parts.pageScript).toBe('string');
    expect(parts.pageScript).toContain('window.__SPECS_CFG__ = {');
    expect(parts.bodyContent).toContain('/js/specs-funnel.js?v=');
    expect(parts.seoMeta).toContain('/css/specs-funnel.css?v=');
  });

  test('funnel JS가 주입 CFG를 소비 (자동 마운트)', () => {
    // c168d47e SpecsFunnel 위젯 추출: 전역 var CFG → mount(el, CFG) 자동 마운트 패턴
    expect(funnelJs).toContain('SpecsFunnel.mount(_el, window.__SPECS_CFG__)');
  });

  test('gtag 가드(typeof gtag) 적용', () => {
    expect(funnelJs).toContain("typeof gtag !== 'function'");
  });

  test('purchase transaction_id는 orderId — paymentToken 미전송', () => {
    expect(funnelJs).toContain('transaction_id: orderId');
    // gtag 파라미터 빌더(gaTrack/gaTrackPurchase)에 paymentToken이 등장하지 않아야 한다
    const start = funnelJs.indexOf('function gaTrack');
    const end = funnelJs.indexOf('GEN_TEXT_DEFAULT');
    expect(start).toBeGreaterThan(-1);
    const gaBlock = funnelJs.slice(start, end);
    expect(gaBlock).not.toContain('paymentToken');
  });

  test('공통 파라미터: service=specs-v2 + market 포함', () => {
    expect(funnelJs).toContain("service: 'specs-v2'");
    expect(funnelJs).toContain('market: CFG.market');
  });

  test('시장별 결제 파라미터: kr=toss/KRW/2000, 그 외=lemon/USD/1.99', () => {
    expect(funnelJs).toContain("payment_provider: 'toss', currency: 'KRW', value: 2000");
    expect(funnelJs).toContain("payment_provider: 'lemon', currency: 'USD', value: 1.99");
  });

  test('최종 HTML에 gtag.js 스니펫 존재 (공통 레이아웃 경유, 중복 없음)', () => {
    const parts = specsDetailFragment('kr-passport');
    const html = layoutShell(parts);
    const snippetCount = html.split('googletagmanager.com/gtag/js').length - 1;
    expect(snippetCount).toBe(1);
    expect(html).toContain('G-JPZWSJ3323');
  });
});
