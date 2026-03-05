/**
 * modules/charge.js — 충전 모달 모듈
 * v3: 4단 상품 + 소액충전 스테퍼 (10c 단위)
 * 토스 결제 연동
 * 데이터 정본: config.js CHARGE_OPTIONS
 */

import { store, Monk, TOSS_CLIENT_KEY, closeCreditModal, buyCreditsKR, CHARGE_OPTIONS, KRW_PER_CREDIT } from '../shared.js';

// ─── 소액충전 스테퍼 ───
const STEP_UNIT = 10;    // credits per step
const STEP_PRICE = 1450; // KRW per 10c
const STEP_MIN = 1;      // 10c
const STEP_MAX = 10;     // 100c

let _chargeEl = null;
let _chargeIdx = 0;
let _stepperActive = false;
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
  if (priceEl) priceEl.textContent = `₩${_fmt(_stepperQty * STEP_PRICE)}`;
  if (minBtn) minBtn.style.opacity = _stepperQty <= STEP_MIN ? '0.3' : '1';
  if (maxBtn) maxBtn.style.opacity = _stepperQty >= STEP_MAX ? '0.3' : '1';
}

function _activateStepper() {
  _stepperActive = true;
  if (_chargeEl) {
    _chargeEl.querySelectorAll('input[name=co]').forEach(r => { r.checked = false; });
    _chargeEl.querySelectorAll('label[data-ci]').forEach(l => {
      l.style.borderColor = 'rgba(167,139,250,0.12)';
    });
    const stepperBox = _chargeEl.querySelector('#cm-stepper-box');
    if (stepperBox) stepperBox.style.borderColor = '#a78bfa';
  }
}

function _deactivateStepper() {
  _stepperActive = false;
  _stepperQty = 1;
  _updateStepperDisplay();
  if (_chargeEl) {
    const stepperBox = _chargeEl.querySelector('#cm-stepper-box');
    if (stepperBox) stepperBox.style.borderColor = 'rgba(167,139,250,0.12)';
  }
}

/**
 * renderChargeCards — 충전 상품 카드 HTML 생성 (charge.html과 동일 디자인)
 * @param {Array} options - CHARGE_OPTIONS 배열
 * @returns {string} HTML 문자열
 */
export function renderChargeCards(options) {
  let html = '';
  options.forEach((opt, i) => {
    const totalC = opt.credits + opt.bonus;
    const strikePrice = totalC * KRW_PER_CREDIT;
    const isBest = opt.best;

    // 섹션 레이블
    if (i === 0) {
      html += '<div style="font-size:0.75rem;color:#a78bfa;font-weight:600;margin-bottom:8px;">1장 완성</div>';
    } else if (i === 1) {
      html += '<div style="font-size:0.78rem;color:#8892a8;margin:16px 0 8px;">패키지</div>';
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
    const checked = i === 0 ? ' checked' : '';

    html += '<label data-ci="' + i + '" style="display:flex;align-items:center;justify-content:space-between;padding:16px;border:1px solid rgba(167,139,250,0.12);background:' + cardBg + ';border-radius:12px;cursor:pointer;margin-bottom:8px;' + (isBest ? 'position:relative;' : '') + '">'
      + badge
      + '<input type="radio" name="co" value="' + i + '"' + checked + ' style="display:none;">'
      + '<div>'
      + '<div style="display:flex;align-items:baseline;gap:6px;">'
      + '<span style="font-size:1.5rem;font-weight:800;color:#f8fafc;">' + opt.credits + 'c</span>'
      + '<span style="color:#34d399;font-size:0.85rem;font-weight:600;">+' + opt.bonus + 'c</span>'
      + '</div>'
      + '<div style="color:#8892a8;font-size:0.78rem;margin-top:2px;">총 ' + totalC + 'c</div>'
      + '</div>'
      + '<div style="background:' + priceBg + ';border-radius:12px;padding:12px 16px;text-align:center;">'
      + '<div style="text-decoration:line-through;color:#666;font-size:0.78rem;">₩' + _fmt(strikePrice) + '</div>'
      + '<div style="color:#f8fafc;font-weight:700;font-size:1.1rem;">₩' + _fmt(opt.price) + '</div>'
      + '</div>'
      + '</label>';
  });
  return html;
}

function _buildModal() {
  if (_chargeEl) return;

  const cardsHtml = renderChargeCards(CHARGE_OPTIONS);

  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="charge-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1100;align-items:flex-end;justify-content:center;">
  <div style="width:100%;max-width:480px;background:linear-gradient(180deg,#1e1e3a,#161630);border:1.5px solid rgba(167,139,250,0.35);border-bottom:none;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:max(24px,env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,0.7),0 0 80px rgba(167,139,250,0.15);max-height:85vh;overflow-y:auto;">
    <h3 style="text-align:center;color:#f8fafc;font-size:1.1rem;font-weight:700;margin:0 0 20px;">크레딧 충전</h3>

    <div id="cm-pkg-container">${cardsHtml}</div>

    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 또는 소액 충전 ──</div>

    <div id="cm-stepper-box" style="display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;margin-bottom:8px;cursor:pointer;">
      <button id="cm-stepper-minus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
      <div style="text-align:center;min-width:100px;">
        <div id="cm-stepper-qty" style="font-size:1.1rem;font-weight:700;color:#f8fafc;">10c</div>
        <div id="cm-stepper-price" style="font-size:0.8rem;color:#a78bfa;margin-top:2px;">₩1,450</div>
      </div>
      <button id="cm-stepper-plus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
    </div>
    <div style="text-align:center;font-size:0.7rem;color:#666;margin-bottom:4px;">최소 10c · 최대 100c</div>

    <button id="chargePayBtn" style="width:100%;padding:16px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;margin-top:16px;box-shadow:0 4px 16px rgba(167,139,250,0.25);">토스페이먼츠로 결제</button>
    <button id="chargeCloseBtn" style="width:100%;padding:14px;background:rgba(30,30,60,0.8);color:#8892a8;border:1px solid rgba(167,139,250,0.12);border-radius:12px;font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:10px;">닫기</button>
  </div>
</div>`;

  const overlay = wrap.firstElementChild;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) ChargeModule.close(); });

  // 패키지 라디오 선택 → 스테퍼 비활성화
  overlay.querySelectorAll('label[data-ci]').forEach(l => {
    l.addEventListener('click', () => {
      _chargeIdx = parseInt(l.dataset.ci);
      _deactivateStepper();
      overlay.querySelectorAll('label[data-ci]').forEach(ll => {
        ll.style.borderColor = 'rgba(167,139,250,0.12)';
      });
      const opt = CHARGE_OPTIONS[_chargeIdx];
      if (opt.best) l.style.borderColor = '#f59e0b';
      else l.style.borderColor = '#a78bfa';
    });
  });

  // 스테퍼 클릭 → 패키지 해제
  const stepperBox = overlay.querySelector('#cm-stepper-box');
  stepperBox.addEventListener('click', (e) => {
    if (e.target.id === 'cm-stepper-minus' || e.target.id === 'cm-stepper-plus') return;
    _activateStepper();
  });

  overlay.querySelector('#cm-stepper-minus').addEventListener('click', (e) => {
    e.stopPropagation();
    _activateStepper();
    if (_stepperQty > STEP_MIN) _stepperQty--;
    _updateStepperDisplay();
  });

  overlay.querySelector('#cm-stepper-plus').addEventListener('click', (e) => {
    e.stopPropagation();
    _activateStepper();
    if (_stepperQty < STEP_MAX) _stepperQty++;
    _updateStepperDisplay();
  });

  // 결제 버튼
  overlay.querySelector('#chargePayBtn').addEventListener('click', () => {
    if (_stepperActive) {
      ChargeModule.close();
      buyCreditsKR(_stepperQty * STEP_PRICE, _stepperQty * STEP_UNIT);
    } else {
      const opt = CHARGE_OPTIONS[_chargeIdx];
      ChargeModule.close();
      buyCreditsKR(opt.price, opt.credits + opt.bonus);
    }
  });

  overlay.querySelector('#chargeCloseBtn').addEventListener('click', () => ChargeModule.close());

  document.body.appendChild(overlay);
  _chargeEl = overlay;
}

// ═══════════════════════════════════════
// Export: ChargeModule
// ═══════════════════════════════════════
export const ChargeModule = {
  show() {
    _buildModal();
    _chargeIdx = 0;
    _stepperActive = false;
    _stepperQty = 1;
    _chargeEl.querySelectorAll('input[name=co]').forEach(r => { r.checked = (r.value === '0'); });
    _updateStepperDisplay();
    _chargeEl.querySelectorAll('label[data-ci]').forEach(l => {
      l.style.borderColor = 'rgba(167,139,250,0.12)';
    });
    const first = _chargeEl.querySelector('label[data-ci="0"]');
    if (first) first.style.borderColor = '#a78bfa';
    const stepperBox = _chargeEl.querySelector('#cm-stepper-box');
    if (stepperBox) stepperBox.style.borderColor = 'rgba(167,139,250,0.12)';
    _chargeEl.style.display = 'flex';
  },

  close() {
    if (_chargeEl) _chargeEl.style.display = 'none';
  },
};
