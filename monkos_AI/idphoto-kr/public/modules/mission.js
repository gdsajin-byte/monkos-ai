/**
 * modules/mission.js — 100c 미션 카드 모듈
 * SNS 동의서 + 텔레그램 캡쳐 전송 + 미션 완료 검증
 * 노출 조건: 로그인 + 다운로드 완료 + missionBonusClaimed !== true
 *
 * v3: 동의서 서명 전 전송/확인 버튼 비활성화 + Cr 모션 연동
 */

import { store, Monk, API, showThankYou } from '../shared.js';

// ─── 내부 상태 ───
let _mountEl = null;
let _containerEl = null;
let _missionTgSent = false;

function _buildHTML() {
  const div = document.createElement('div');
  div.id = 'mission-module';
  div.style.cssText = 'margin-bottom:12px;';
  div.innerHTML = `
    <div style="padding:16px;background:linear-gradient(135deg,rgba(167,139,250,0.08),rgba(124,58,237,0.06));border:1.5px solid rgba(167,139,250,0.2);border-radius:14px;">
      <div style="font-size:15px;font-weight:700;color:#c4b5fd;margin-bottom:8px;">🎁 100c 미션</div>
      <div style="font-size:13px;color:#8892a8;line-height:1.6;margin-bottom:14px;">
        결과물을 텔레그램으로 보내고<br>SNS 활용에 동의하면 <strong style="color:#a78bfa;">100c 즉시 지급!</strong>
      </div>

      <!-- 동의서 -->
      <div id="mission-consent-area" style="margin-bottom:12px;">
        <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:10px 12px;background:rgba(20,20,40,0.5);border-radius:10px;border:1px solid rgba(167,139,250,0.1);">
          <input type="checkbox" id="mission-consent-check" style="accent-color:#a78bfa;width:18px;height:18px;margin-top:2px;flex-shrink:0;">
          <span style="font-size:12px;color:#8892a8;line-height:1.5;">MONKOS가 마케팅 목적으로 결과 사진을 SNS에 게시할 수 있음에 동의합니다</span>
        </label>
        <button id="btn-consent-submit" style="width:100%;margin-top:8px;padding:12px;background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;">✅ 동의 완료</button>
      </div>

      <!-- 텔레그램 전송 -->
      <div id="mission-tg-hint" style="display:none;text-align:center;font-size:12px;color:#f87171;margin-bottom:4px;">먼저 SNS 활용 동의서에 서명해주세요</div>
      <button id="btn-mission-tg" style="width:100%;padding:12px;background:#555;color:#999;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:not-allowed;margin-bottom:8px;opacity:0.5;">📸 결과 사진을 텔레그램으로 보내기</button>

      <!-- 미션 완료 확인 -->
      <button id="btn-mission-verify" style="width:100%;padding:12px;background:#555;color:#999;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:not-allowed;opacity:0.5;">🎉 미션 완료 확인</button>
    </div>
  `;

  // 이벤트 바인딩
  div.querySelector('#btn-consent-submit').addEventListener('click', _submitSnsConsent);
  div.querySelector('#btn-mission-tg').addEventListener('click', () => {
    if (!store.missionConsentDone) {
      const hint = document.getElementById('mission-tg-hint');
      if (hint) hint.style.display = 'block';
      return;
    }
    _openMissionBot();
  });
  div.querySelector('#btn-mission-verify').addEventListener('click', () => {
    if (!store.missionConsentDone || !_missionTgSent) return;
    _verifyMission();
  });

  return div;
}

// ─── 버튼 상태 업데이트 ───
function _activateTgButton() {
  const btn = document.getElementById('btn-mission-tg');
  if (btn) {
    btn.style.background = '#0088cc';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  }
  const hint = document.getElementById('mission-tg-hint');
  if (hint) hint.style.display = 'none';
}

function _activateVerifyButton() {
  const btn = document.getElementById('btn-mission-verify');
  if (btn) {
    btn.style.background = 'linear-gradient(135deg,#a78bfa,#7c3aed)';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.style.opacity = '1';
  }
}

// ─── SNS 동의 ───
async function _submitSnsConsent() {
  const checkbox = document.getElementById('mission-consent-check');
  if (!checkbox || !checkbox.checked) {
    alert('동의에 체크해주세요.');
    return;
  }
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/consent/sns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, agreed: true }),
    });
    const data = await res.json();
    if (data.success) {
      store.missionConsentDone = true;
      const btn = document.getElementById('btn-consent-submit');
      if (btn) { btn.disabled = true; btn.textContent = '✅ 동의 완료됨'; btn.style.opacity = '0.6'; }
      checkbox.disabled = true;
      _activateTgButton();
      if (_missionTgSent) _activateVerifyButton();
      Monk.log('SNS 활용 동의 완료');
    } else {
      alert(data.error || '동의 처리 중 문제가 발생했습니다.');
    }
  } catch (err) {
    Monk.log('동의서 제출 에러: ' + err.message);
    alert('동의 처리 중 오류가 발생했습니다.');
  }
}

// ─── 텔레그램 미션 봇 ───
async function _openMissionBot() {
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/telegram/mission-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, type: 'mission' }),
    });
    const data = await res.json();
    if (data.deeplink) {
      window.open(data.deeplink, '_blank');
      _missionTgSent = true;
      if (store.missionConsentDone) _activateVerifyButton();
      Monk.log('미션 텔레그램 봇 오픈');
    } else {
      alert(data.error || '텔레그램 연결 중 오류가 발생했습니다.');
    }
  } catch (err) {
    Monk.log('미션 봇 딥링크 에러: ' + err.message);
    alert('텔레그램 연결 중 오류가 발생했습니다.');
  }
}

// ─── 미션 완료 검증 ───
async function _verifyMission() {
  if (!store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/mission-complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      store.showMission = false;
      showThankYou('+100 Cr', '텔레그램 미션을 완료했습니다');
      Monk.log(`미션 완료! +100c → ${data.credits}c`);
      MissionModule.unmount();
    } else {
      alert(data.error || '미션 조건을 확인해주세요.\n- SNS 활용 동의서 서명\n- 텔레그램으로 캡쳐 전송');
    }
  } catch (err) {
    Monk.log('미션 확인 에러: ' + err.message);
    alert('미션 확인 중 오류가 발생했습니다.');
  }
}

// ═══════════════════════════════════════
// Export: MissionModule
// ═══════════════════════════════════════
export const MissionModule = {
  mount(selector) {
    // 노출 조건: 로그인 + 다운로드 완료
    if (!store.user.id || !store.downloadComplete) return;

    _mountEl = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!_mountEl) return;

    // 이미 마운트된 경우 제거 후 재생성
    this.unmount();

    _missionTgSent = false;
    _containerEl = _buildHTML();
    _mountEl.appendChild(_containerEl);
    Monk.log('미션 모듈 마운트');
  },

  unmount() {
    if (_containerEl) {
      _containerEl.remove();
      _containerEl = null;
    }
  },
};
