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
    <div style="position:relative;padding:16px;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:14px;overflow:hidden;">
      <div style="position:absolute;top:8px;right:8px;background:rgba(167,139,250,0.2);color:#a78bfa;font-size:11px;font-weight:700;padding:3px 8px;border-radius:6px;">Coming Soon</div>
      <div style="font-size:15px;font-weight:700;color:#c4b5fd;margin-bottom:10px;opacity:0.6;">✨ プレミアムオプション</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;opacity:0.5;">
        <span style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;">精密クロップ</span>
        <span style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;">背景変更</span>
        <span style="padding:6px 12px;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:13px;color:#a78bfa;">追加補正</span>
      </div>
      <div style="font-size:13px;color:#8892a8;opacity:0.6;">まもなく利用可能になります</div>
    </div>
  `;

  return div;
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
    Monk.log('プレミアムモジュールマウント（Coming Soon）');
  },

  unmount() {
    if (_containerEl) {
      _containerEl.remove();
      _containerEl = null;
    }
  },
};
