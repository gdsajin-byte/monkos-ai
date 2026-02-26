/**
 * modules/charge.js — 충전 모달 모듈
 * 단건 ₩11,600 (80c) + 패키지 10c/100c/300c/500c
 * 토스 결제 연동
 */

import { store, Monk, TOSS_CLIENT_KEY, closeCreditModal, buyCreditsKR } from '../shared.js';

// ─── 충전 옵션 ───
const CHARGE_OPTIONS = [
  { label: '📸 1장 구매', amount: 11600, credits: 80, desc: '생성+다운로드 1회분', recommended: true },
  { label: '10c', amount: 1450, credits: 10, desc: '' },
  { label: '100c', amount: 13050, credits: 100, desc: '10% 할인' },
  { label: '300c', amount: 34800, credits: 300, desc: '20% 할인' },
  { label: '500c', amount: 50750, credits: 500, desc: '30% 할인' },
];

let _chargeEl = null;
let _chargeIdx = 0;

function _buildModal() {
  if (_chargeEl) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = `
<div id="charge-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:1100;align-items:flex-end;justify-content:center;">
  <div style="width:100%;max-width:480px;background:linear-gradient(180deg,#1e1e3a,#161630);border:1.5px solid rgba(167,139,250,0.35);border-bottom:none;border-radius:16px 16px 0 0;padding:24px 20px;padding-bottom:max(24px,env(safe-area-inset-bottom));box-shadow:0 -8px 40px rgba(0,0,0,0.7),0 0 80px rgba(167,139,250,0.15);">
    <h3 style="text-align:center;color:#f8fafc;font-size:1.1rem;font-weight:700;margin:0 0 20px;">크레딧 충전</h3>

    <label data-ci="0" style="display:flex;align-items:center;gap:12px;padding:16px;border:2px solid #a78bfa;background:linear-gradient(135deg,rgba(167,139,250,0.2),rgba(124,58,237,0.15));border-radius:14px;cursor:pointer;margin-bottom:4px;position:relative;">
      <span style="position:absolute;top:-8px;right:12px;background:#a78bfa;color:#fff;font-size:0.65rem;font-weight:700;padding:2px 8px;border-radius:8px;">추천</span>
      <input type="radio" name="co" value="0" checked style="accent-color:#a78bfa;width:18px;height:18px;flex-shrink:0;">
      <div>
        <div style="font-size:1rem;font-weight:700;color:#f8fafc;">📸 1장 구매 &nbsp;<span style="color:#a78bfa;">₩11,600</span></div>
        <div style="font-size:0.8rem;color:#8892a8;margin-top:2px;">생성+다운로드 1회분</div>
      </div>
    </label>

    <div style="text-align:center;font-size:0.78rem;color:#8892a8;margin:12px 0;">── 패키지 충전 (할인) ──</div>

    <label data-ci="1" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="1" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">10c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩1,450</span>
      </div>
    </label>
    <label data-ci="2" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="2" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">100c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩13,050 <span style="color:#34d399;font-size:0.72rem;">(10% 할인)</span></span>
      </div>
    </label>
    <label data-ci="3" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="3" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">300c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩34,800 <span style="color:#34d399;font-size:0.72rem;">(20% 할인)</span></span>
      </div>
    </label>
    <label data-ci="4" style="display:flex;align-items:center;gap:10px;padding:12px 16px;border:1px solid rgba(167,139,250,0.12);background:rgba(20,20,40,0.7);border-radius:10px;cursor:pointer;margin-bottom:8px;">
      <input type="radio" name="co" value="4" style="accent-color:#a78bfa;width:16px;height:16px;flex-shrink:0;">
      <div style="flex:1;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:0.9rem;font-weight:600;color:#e2e8f0;">500c</span>
        <span style="font-size:0.85rem;color:#a78bfa;font-weight:600;">₩50,750 <span style="color:#34d399;font-size:0.72rem;">(30% 할인)</span></span>
      </div>
    </label>

    <button id="chargePayBtn" style="width:100%;padding:16px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:14px;font-size:1.05rem;font-weight:700;cursor:pointer;margin-top:16px;box-shadow:0 4px 16px rgba(167,139,250,0.25);">토스페이먼츠로 결제</button>
    <button id="chargeCloseBtn" style="width:100%;padding:14px;background:rgba(30,30,60,0.8);color:#8892a8;border:1px solid rgba(167,139,250,0.12);border-radius:12px;font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:10px;">닫기</button>
  </div>
</div>`;

  const overlay = wrap.firstElementChild;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) ChargeModule.close(); });

  overlay.querySelectorAll('label[data-ci]').forEach(l => {
    l.addEventListener('click', () => { _chargeIdx = parseInt(l.dataset.ci); });
  });

  overlay.querySelector('#chargePayBtn').addEventListener('click', () => {
    const opt = CHARGE_OPTIONS[_chargeIdx];
    ChargeModule.close();
    buyCreditsKR(opt.amount, opt.credits);
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
    _chargeEl.querySelectorAll('input[name=co]').forEach(r => { r.checked = (r.value === '0'); });
    _chargeEl.style.display = 'flex';
  },

  close() {
    if (_chargeEl) _chargeEl.style.display = 'none';
  },

  mountInline(selector) {
    const mount = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!mount) return;

    // 인라인 충전 버튼 (포스트 다운로드 하단)
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
