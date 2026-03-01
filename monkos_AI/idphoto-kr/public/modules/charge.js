/**
 * modules/charge.js — 충전 모달 모듈
 * P2.1: 3단 패키지 + 소액충전 스테퍼 (10c 단위)
 * 토스 결제 연동
 */

import { store, Monk, TOSS_CLIENT_KEY, closeCreditModal, buyCreditsKR } from '../shared.js';

// ─── 충전 옵션 ───
const CHARGE_OPTIONS = [
  {
    label: '증명사진 1장',
    amount: 9900,
    credits: 80,
    desc: '생성 + 다운로드 1회 (보너스 +10c)',
    recommended: true,
  },
  {
    label: '증명사진 2장',
    amount: 18900,
    credits: 160,
    bonus: 20,
    originalAmount: 20300,
    desc: '보너스 20c 포함',
  },
  {
    label: '증명사진 4장 + 풀샷',
    amount: 34900,
    credits: 340,
    bonus: 60,
    originalAmount: 40600,
    desc: '보너스 60c + 풀샷 원본 1회 무료',
    best: true,
  },
];

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
  const qtyEl = _chargeEl.querySelector('#stepper-qty');
  const priceEl = _chargeEl.querySelector('#stepper-price');
  const minBtn = _chargeEl.querySelector('#stepper-minus');
  const maxBtn = _chargeEl.querySelector('#stepper-plus');
  if (qtyEl) qtyEl.textContent = `${_stepperQty * STEP_UNIT}c`;
  if (priceEl) priceEl.textContent = `₩${_fmt(_stepperQty * STEP_PRICE)}`;
  if (minBtn) minBtn.style.opacity = _stepperQty <= STEP_MIN ? '0.3' : '1';
  if (maxBtn) maxBtn.style.opacity = _stepperQty >= STEP_MAX ? '0.3' : '1';
}

function _activateStepper() {
  _stepperActive = true;
  // 패키지 라디오 해제
  if (_chargeEl) {
    _chargeEl.querySelectorAll('input[name=co]').forEach(r => { r.checked = false; });
    _chargeEl.querySelectorAll('label[data-ci]').forEach(l => {
      l.style.borderColor = 'rgba(167,139,250,0.12)';
    });
    const stepperBox = _chargeEl.querySelector('#stepper-box');
    if (stepperBox) stepperBox.style.borderColor = '#a78bfa';
  }
}

function _deactivateStepper() {
  _stepperActive = false;
  _stepperQty = 1;
  _updateStepperDisplay();
  if (_chargeEl) {
    const stepperBox = _chargeEl.querySelector('#stepper-box');
    if (stepperBox) stepperBox.style.borderColor = 'rgba(167,139,250,0.12)';
  }
}

function _buildModal() {
  if (_chargeEl) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="charge-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1100;align-items:flex-end;justify-content:center;">
  <div style="width:100%;max-width:480px;background:linear-gradient(180deg,#1e1e3a,#161630);border:1.5px solid rgba(167,139,250,0.35);border-bottom:none;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:max(24px,env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,0.7),0 0 80px rgba(167,139,250,0.15);">
    <h3 style="text-align:center;color:#f8fafc;font-size:1.1rem;font-weight:700;margin:0 0 20px;">크레딧 충전</h3>

    <!-- 기본: 증명사진 1장 (추천) -->
    <label data-ci="0" style="display:flex;align-items:center;gap:12px;padding:16px;border:2px solid #a78bfa;background:linear-gradient(135deg,rgba(167,139,250,0.2),rgba(124,58,237,0.15));border-radius:14px;cursor:pointer;margin-bottom:4px;position:relative;">
      <span style="position:absolute;top:-8px;right:12px;background:#a78bfa;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">추천</span>
      <input type="radio" name="co" value="0" checked style="accent-color:#a78bfa;width:18px;height:18px;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:700;color:#f8fafc;">증명사진 1장 &nbsp;<span style="color:#a78bfa;">₩9,900</span></div>
        <div style="font-size:0.8rem;color:#8892a8;margin-top:2px;">생성 + 다운로드 1회 <span style="color:#34d399;">(보너스 +10c)</span></div>
      </div>
    </label>

    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 패키지 충전 ──</div>

    <!-- 스탠다드: 증명사진 2장 -->
    <label data-ci="1" style="display:flex;align-items:center;gap:10px;padding:14px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="1" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">증명사진 2장</span>
          <span>
            <span style="text-decoration:line-through;color:#666;font-size:0.75rem;">₩20,300</span>
            <span style="color:#a78bfa;font-weight:600;font-size:0.85rem;margin-left:4px;">₩18,900</span>
          </span>
        </div>
        <div style="font-size:0.72rem;color:#34d399;margin-top:3px;">+20c 보너스</div>
      </div>
    </label>

    <!-- 프리미엄: 증명사진 4장 + 풀샷 (★BEST) -->
    <label data-ci="2" style="display:flex;align-items:center;gap:10px;padding:14px 16px;border:1.5px solid rgba(245,158,11,0.3);background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(20,20,40,0.7));border-radius:10px;cursor:pointer;margin-bottom:8px;position:relative;">
      <span style="position:absolute;top:-8px;right:12px;background:#f59e0b;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">★ BEST</span>
      <input type="radio" name="co" value="2" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">증명사진 4장 + 풀샷</span>
          <span>
            <span style="text-decoration:line-through;color:#666;font-size:0.75rem;">₩40,600</span>
            <span style="color:#a78bfa;font-weight:600;font-size:0.85rem;margin-left:4px;">₩34,900</span>
          </span>
        </div>
        <div style="font-size:0.72rem;color:#34d399;margin-top:3px;">+60c 보너스 · 풀샷 원본 1회 무료</div>
      </div>
    </label>

    <!-- 소액충전 스테퍼 -->
    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 또는 소액 충전 ──</div>

    <div id="stepper-box" style="display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;margin-bottom:8px;cursor:pointer;">
      <button id="stepper-minus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">−</button>
      <div style="text-align:center;min-width:100px;">
        <div id="stepper-qty" style="font-size:1.1rem;font-weight:700;color:#f8fafc;">10c</div>
        <div id="stepper-price" style="font-size:0.8rem;color:#a78bfa;margin-top:2px;">₩1,450</div>
      </div>
      <button id="stepper-plus" type="button" style="width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.1);color:#a78bfa;font-size:18px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;">+</button>
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
      // 선택된 패키지 border 복원
      overlay.querySelectorAll('label[data-ci]').forEach(ll => {
        ll.style.borderColor = 'rgba(167,139,250,0.12)';
      });
      if (_chargeIdx === 0) l.style.borderColor = '#a78bfa';
      else if (_chargeIdx === 2) l.style.borderColor = 'rgba(245,158,11,0.3)';
      else l.style.borderColor = 'rgba(167,139,250,0.12)';
    });
  });

  // 스테퍼 클릭 → 패키지 해제
  const stepperBox = overlay.querySelector('#stepper-box');
  stepperBox.addEventListener('click', (e) => {
    if (e.target.id === 'stepper-minus' || e.target.id === 'stepper-plus') return;
    _activateStepper();
  });

  overlay.querySelector('#stepper-minus').addEventListener('click', (e) => {
    e.stopPropagation();
    _activateStepper();
    if (_stepperQty > STEP_MIN) _stepperQty--;
    _updateStepperDisplay();
  });

  overlay.querySelector('#stepper-plus').addEventListener('click', (e) => {
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
      buyCreditsKR(opt.amount, opt.credits);
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
    // 패키지 border 초기화
    _chargeEl.querySelectorAll('label[data-ci]').forEach(l => {
      l.style.borderColor = 'rgba(167,139,250,0.12)';
    });
    const first = _chargeEl.querySelector('label[data-ci="0"]');
    if (first) first.style.borderColor = '#a78bfa';
    const stepperBox = _chargeEl.querySelector('#stepper-box');
    if (stepperBox) stepperBox.style.borderColor = 'rgba(167,139,250,0.12)';
    _chargeEl.style.display = 'flex';
  },

  close() {
    if (_chargeEl) _chargeEl.style.display = 'none';
  },

  mountInline(selector) {
    const mount = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!mount) return;

    const div = document.createElement('div');
    div.id = 'charge-inline';
    div.style.cssText = 'padding:12px 0;text-align:center;';
    div.innerHTML = `
      <div style="font-size:13px;color:#8892a8;margin-bottom:8px;">💰 또는 크레딧 충전</div>
      <button id="charge-inline-btn" style="width:100%;padding:12px;background:rgba(30,30,60,0.8);color:#8892a8;border:1px solid rgba(167,139,250,0.12);border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">충전하기</button>
    `;
    div.querySelector('#charge-inline-btn').addEventListener('click', () => ChargeModule.show());
    mount.appendChild(div);
  },
};
