/**
 * modules/premium.js — 프리미엄 옵션 모듈
 * 정밀 크롭, 배경 변경, 추가 보정 (UI 껍데기, 기능 미구현)
 * 잔액 부족 시 ChargeModule.show() 호출
 */

import { store, Monk } from '../shared.js';

let _mountEl = null;
let _containerEl = null;

function _buildHTML() {
  const div = document.createElement('div');
  div.id = 'premium-module';
  div.style.cssText = 'margin-bottom:12px;';
  div.innerHTML = `
    <div style="padding:16px;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:14px;">
      <div style="font-size:15px;font-weight:700;color:#c4b5fd;margin-bottom:10px;">✨ 프리미엄 옵션</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <button class="premium-opt-btn" data-feature="crop" style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;cursor:pointer;">정밀 크롭</button>
        <button class="premium-opt-btn" data-feature="background" style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;cursor:pointer;">배경 변경</button>
        <button class="premium-opt-btn" data-feature="retouch" style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;cursor:pointer;">추가 보정</button>
      </div>
      <div style="font-size:13px;color:#8892a8;">이 기능에는 크레딧이 필요합니다</div>
      <div style="font-size:13px;color:#a78bfa;font-weight:600;margin-top:4px;">현재 잔액: <span id="premium-credits">0</span>c</div>
    </div>
  `;

  // 버튼 이벤트 — "준비 중" 안내
  div.querySelectorAll('.premium-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('준비 중인 기능입니다.\n곧 이용 가능합니다!');
    });
  });

  return div;
}

// ─── 크레딧 표시 업데이트 ───
function _updateCredits() {
  const el = document.getElementById('premium-credits');
  if (el) el.textContent = store.user.credits || 0;
}

// ═══════════════════════════════════════
// Export: PremiumModule
// ═══════════════════════════════════════
export const PremiumModule = {
  mount(selector) {
    _mountEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!_mountEl) return;

    this.unmount();

    _containerEl = _buildHTML();
    _mountEl.appendChild(_containerEl);
    _updateCredits();
    Monk.log('프리미엄 모듈 마운트');
  },

  unmount() {
    if (_containerEl) {
      _containerEl.remove();
      _containerEl = null;
    }
  },
};
