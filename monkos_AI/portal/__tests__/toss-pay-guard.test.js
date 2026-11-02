// 결제 버튼 가드 판정 — public/js/toss-pay-guard.js (브라우저 스크립트를 vm으로 적재)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

function loadGuard() {
  const sandbox = { setTimeout, clearTimeout, Promise };
  sandbox.window = sandbox;
  vm.runInNewContext(readFileSync(join(process.cwd(), 'public/js/toss-pay-guard.js'), 'utf8'), sandbox);
  return sandbox.TossPayGuard;
}

function fakeWidgets({ selected, agreement }) {
  const handlers = {};
  const on = (name, fn) => { handlers[name] = fn; };
  return {
    handlers,
    pm: { on, getSelectedPaymentMethod: selected },
    ag: { on, getAgreementStatus: agreement },
  };
}

const CARD_EMPTY = { method: 'CARD', card: {} };
const CARD_PICKED = { method: 'CARD', card: { cardCompany: 'SHINHAN' } };

function setup(widgetOpts) {
  const btn = { disabled: false, textContent: '' };
  const guard = loadGuard().create({ btn, needCardLabel: 'NEED_CARD', needAgreeLabel: 'NEED_AGREE' });
  guard.setPriceLabel('PRICE');
  return { btn, guard, w: fakeWidgets(widgetOpts) };
}

describe('isMethodReady', () => {
  test.each([
    [CARD_EMPTY, false],
    [{ method: 'CARD' }, false],
    [CARD_PICKED, true],
    [{ method: 'CARD', card: { easyPay: 'TOSSPAY' } }, true],
    [{ method: 'CARD', card: { appCard: 'KBPAY' } }, true],
    [{ method: 'TRANSFER', transfer: {} }, true],
    [null, true],
  ])('%j → %s', (sel, expected) => {
    expect(loadGuard().isMethodReady(sel)).toBe(expected);
  });
});

describe('버튼 상태', () => {
  test('위젯 렌더 전에는 비활성 + 가격 문구', () => {
    const { btn, guard } = setup({});
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('PRICE');
    expect(guard.canPay()).toBe(false);
  });

  test('미선택 → 비활성·카드사 문구 / 선택 이벤트 → 활성·가격 문구', async () => {
    const { btn, guard, w } = setup({
      selected: async () => CARD_EMPTY,
      agreement: async () => ({ agreedRequiredTerms: true }),
    });
    await guard.attach(w.pm, w.ag);
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('NEED_CARD');
    w.handlers.paymentMethodSelect(CARD_PICKED);
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('PRICE');
    expect(guard.canPay()).toBe(true);
  });

  test('약관 해제 → 비활성·약관 문구, 카드사 미선택이 먼저', async () => {
    const { btn, guard, w } = setup({
      selected: async () => CARD_PICKED,
      agreement: async () => ({ agreedRequiredTerms: true }),
    });
    await guard.attach(w.pm, w.ag);
    w.handlers.agreementStatusChange({ agreedRequiredTerms: false });
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toBe('NEED_AGREE');
    w.handlers.paymentMethodSelect(CARD_EMPTY);
    expect(btn.textContent).toBe('NEED_CARD');
  });

  test('재오픈 refresh가 보관 인스턴스로 상태를 다시 잰다', async () => {
    let current = CARD_PICKED;
    const { btn, guard, w } = setup({
      selected: async () => current,
      agreement: async () => ({ agreedRequiredTerms: true }),
    });
    await guard.attach(w.pm, w.ag);
    expect(btn.disabled).toBe(false);
    current = CARD_EMPTY;
    await guard.refresh();
    expect(btn.disabled).toBe(true);
  });

  test('조회 실패는 막지 않는다', async () => {
    const { btn, guard, w } = setup({
      selected: async () => { throw new Error('boom'); },
      agreement: async () => { throw new Error('boom'); },
    });
    await guard.attach(w.pm, w.ag);
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('PRICE');
  });

  test('조회 중 도착한 선택 이벤트를 늦은 조회 응답이 덮지 않는다', async () => {
    let resolveSelected;
    const { btn, guard, w } = setup({
      selected: () => new Promise((r) => { resolveSelected = r; }),
      agreement: async () => ({ agreedRequiredTerms: true }),
    });
    const done = guard.attach(w.pm, w.ag);
    await new Promise((r) => setTimeout(r, 0));
    w.handlers.paymentMethodSelect(CARD_PICKED);
    resolveSelected(CARD_EMPTY);
    await done;
    expect(btn.disabled).toBe(false);
  });
});
