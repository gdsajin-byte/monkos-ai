/**
 * modules/charge.js — 충전 모달 모듈
 * v4: 투터치 결제 + 스테퍼 버튼화
 * 데이터 정본: config.js CHARGE_OPTIONS
 */

import { store, Monk, TOSS_CLIENT_KEY, closeCreditModal, buyCreditsKR, CHARGE_OPTIONS, KRW_PER_CREDIT } from '../shared.js';

// ─── 소액충전 스테퍼 ───
const STEP_UNIT = 10;    // credits per step
const STEP_PRICE = 1450; // KRW per 10c
const STEP_MIN = 1;      // 10c
const STEP_MAX = 10;     // 100c

let _chargeEl = null;
let _confirmedIdx = -1;  // -1: 없음, 0~3: 카드, 4: 스테퍼
let _stepperQty = 1;

function _fmt(n) {
  return n.toLocaleString('ko-KR');
}

function _updateStepperDisplay() {
  if (!_chargeEl) return;
  const qtyEl = _chargeEl.querySelector('#cm-stepper-qty');
  const priceEl = _chargeEl.querySelector('#cm-stepper-price');
  const minBtn = _chargeEl.querySelector('#cm-stepper-minus');
  const maxBtn = _chargeEl.querySelector('#cm-stepper-plus');
  if (qtyEl) qtyEl.textContent = `${_stepperQty * STEP_UNIT}c`;
  if (priceEl) {
    const price = `₩${_fmt(_stepperQty * STEP_PRICE)}`;
    priceEl.textContent = _confirmedIdx === 4 ? `${price} 결제` : price;
    priceEl.style.color = _confirmedIdx === 4 ? '#f8fafc' : '#a78bfa';
  }
  if (minBtn) minBtn.style.opacity = _stepperQty <= STEP_MIN ? '0.3' : '1';
  if (maxBtn) maxBtn.style.opacity = _stepperQty >= STEP_MAX ? '0.3' : '1';
}

function _resetAllCards() {
  if (!_chargeEl) return;
  _confirmedIdx = -1;

  _chargeEl.querySelectorAll('[data-ci]').forEach(card => {
    const i = parseInt(card.dataset.ci);
    const opt = CHARGE_OPTIONS[i];
    if (!opt) return;
    const priceBlock = card.querySelector('.cm-price-block');
    if (!priceBlock) return;

    priceBlock.style.background = opt.best
      ? 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.15))'
      : 'linear-gradient(135deg,rgba(167,139,250,0.3),rgba(129,140,248,0.2))';

    const totalC = opt.credits + opt.bonus;
    const strikePrice = totalC * KRW_PER_CREDIT;
    priceBlock.innerHTML =
      '<div style="text-decoration:line-through;color:#666;font-size:0.78rem;">₩' + _fmt(strikePrice) + '</div>' +
      '<div style="color:#f8fafc;font-weight:700;font-size:1.1rem;">₩' + _fmt(opt.price) + '</div>';
  });

  const stepperPay = _chargeEl.querySelector('#cm-stepper-pay');
  if (stepperPay) stepperPay.style.background = 'linear-gradient(135deg,rgba(167,139,250,0.3),rgba(129,140,248,0.2))';
  _updateStepperDisplay();
}

/**
 * renderChargeCards — 충전 상품 카드 HTML 생성 (charge.html과 공유)
 * @param {Array} options - CHARGE_OPTIONS 배열
 * @returns {string} HTML 문자열
 */
export function renderChargeCards(options) {
  let html = '';
  options.forEach((opt, i) => {
    const totalC = opt.credits + opt.bonus;
    const strikePrice = totalC * KRW_PER_CREDIT;
    const isBest = opt.best;

    if (i === 0) {
      html += '<div style="font-size:0.75rem;color:#a78bfa;font-weight:600;margin-bottom:6px;">1장 완성</div>';
    } else if (i === 1) {
      html += '<div style="font-size:0.78rem;color:#8892a8;margin:10px 0 6px;">패키지</div>';
    }

    const cardBg = isBest
      ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(20,20,40,0.7))'
      : 'rgba(20,20,40,0.7)';
    const priceBg = isBest
      ? 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(245,158,11,0.15))'
      : 'linear-gradient(135deg,rgba(167,139,250,0.3),rgba(129,140,248,0.2))';
    const badge = isBest
      ? '<span style="position:absolute;top:-8px;right:12px;background:#f59e0b;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">★ BEST</span>'
      : '';

    html += '<div data-ci="' + i + '" data-price="' + opt.price + '" data-credits="' + totalC + '" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:' + cardBg + ';border-radius:12px;cursor:pointer;margin-bottom:6px;' + (isBest ? 'position:relative;' : '') + '">'
      + badge
      + '<div>'
      + '<div style="display:flex;align-items:baseline;gap:6px;">'
      + '<span style="font-size:1.3rem;font-weight:800;color:#f8fafc;">' + opt.credits + 'c</span>'
      + '<span style="color:#34d399;font-size:0.85rem;font-weight:600;">+' + opt.bonus + 'c</span>'
      + '</div>'
      + '<div style="color:#8892a8;font-size:0.78rem;margin-top:2px;">총 ' + totalC + 'c</div>'
      + '</div>'
      + '<div class="cm-price-block" style="background:' + priceBg + ';border-radius:12px;padding:8px 14px;text-align:center;">'
      + '<div style="text-decoration:line-through;color:#666;font-size:0.78rem;">₩' + _fmt(strikePrice) + '</div>'
      + '<div style="color:#f8fafc;font-weight:700;font-size:1.1rem;">₩' + _fmt(opt.price) + '</div>'
      + '</div>'
      + '</div>';
  });
  return html;
}

function _buildModal() {
  if (_chargeEl) return;

  const cardsHtml = renderChargeCards(CHARGE_OPTIONS);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="charge-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1100;align-items:flex-end;justify-content:center;">
  <div id="cm-content" style="width:100%;max-width:480px;background:linear-gradient(180deg,#1e1e3a,#161630);border:1.5px solid rgba(167,139,250,0.35);border-bottom:none;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:max(24px,env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,0.7),0 0 80px rgba(167,139,250,0.15);max-height:85vh;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin:0 0 16px;">
      <button id="cm-back-btn" type="button" style="background:none;border:none;color:#a78bfa;font-size:0.95rem;font-weight:600;cursor:pointer;padding:4px 0;">← 이전</button>
      <span style="font-size:0.85rem;font-weight:600;color:#8892a8;">크레딧 충전</span>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="color:#a78bfa;font-size:0.85rem;font-weight:700;">Cr</span>
        <span id="cm-credit-display" style="color:#f8fafc;font-size:0.95rem;font-weight:700;">0</span>
      </div>
    </div>

    <div id="cm-pkg-container">${cardsHtml}</div>

    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 또는 소액 충전 ──</div>

    <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:4px;">
      <button id="cm-stepper-minus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
      <button id="cm-stepper-pay" type="button" style="background:linear-gradient(135deg,rgba(167,139,250,0.3),rgba(129,140,248,0.2));border:none;border-radius:12px;padding:10px 20px;min-width:120px;text-align:center;cursor:pointer;">
        <div id="cm-stepper-qty" style="color:#f8fafc;font-weight:700;font-size:1.05rem;">10c</div>
        <div id="cm-stepper-price" style="color:#a78bfa;font-size:0.8rem;margin-top:2px;">₩1,450</div>
      </button>
      <button id="cm-stepper-plus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
    </div>
    <div style="text-align:center;font-size:0.7rem;color:#666;margin-bottom:4px;">최소 10c · 최대 100c</div>
  </div>
</div>`;

  const overlay = wrap.firstElementChild;
  const content = overlay.querySelector('#cm-content');

  // 오버레이 배경 탭 → 닫기
  overlay.addEventListener('click', (e) => { if (e.target === overlay) ChargeModule.close(); });

  // 컨텐츠 빈 영역 탭 → 확인 해제
  content.addEventListener('click', () => { _resetAllCards(); });

  // ← 이전
  overlay.querySelector('#cm-back-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    ChargeModule.close();
  });

  // 카드 투터치
  overlay.querySelectorAll('[data-ci]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(card.dataset.ci);
      if (_confirmedIdx === idx) {
        const opt = CHARGE_OPTIONS[idx];
        ChargeModule.close();
        buyCreditsKR(opt.price, opt.credits + opt.bonus);
      } else {
        _resetAllCards();
        _confirmedIdx = idx;
        const opt = CHARGE_OPTIONS[idx];
        const priceBlock = card.querySelector('.cm-price-block');
        if (priceBlock) {
          priceBlock.style.background = 'linear-gradient(135deg,rgba(34,197,94,0.4),rgba(34,197,94,0.2))';
          priceBlock.innerHTML = '<div style="color:#f8fafc;font-weight:700;font-size:1.1rem;">₩' + _fmt(opt.price) + ' 결제</div>';
        }
      }
    });
  });

  // 스테퍼 가운데 버튼 투터치
  overlay.querySelector('#cm-stepper-pay').addEventListener('click', (e) => {
    e.stopPropagation();
    if (_confirmedIdx === 4) {
      ChargeModule.close();
      buyCreditsKR(_stepperQty * STEP_PRICE, _stepperQty * STEP_UNIT);
    } else {
      _resetAllCards();
      _confirmedIdx = 4;
      const stepperPay = _chargeEl.querySelector('#cm-stepper-pay');
      if (stepperPay) stepperPay.style.background = 'linear-gradient(135deg,rgba(34,197,94,0.4),rgba(34,197,94,0.2))';
      _updateStepperDisplay();
    }
  });

  // −/+ 수량 변경 + 확인 해제
  overlay.querySelector('#cm-stepper-minus').addEventListener('click', (e) => {
    e.stopPropagation();
    if (_stepperQty > STEP_MIN) _stepperQty--;
    _resetAllCards();
  });

  overlay.querySelector('#cm-stepper-plus').addEventListener('click', (e) => {
    e.stopPropagation();
    if (_stepperQty < STEP_MAX) _stepperQty++;
    _resetAllCards();
  });

  document.body.appendChild(overlay);
  _chargeEl = overlay;
}

// ═══════════════════════════════════════
// Export: ChargeModule
// ═══════════════════════════════════════
export const ChargeModule = {
  show() {
    _buildModal();
    _stepperQty = 1;
    _resetAllCards();
    _chargeEl.querySelector('#cm-credit-display').textContent = store.user.credits;
    _chargeEl.style.display = 'flex';
  },

  close() {
    if (_chargeEl) _chargeEl.style.display = 'none';
  },
};
