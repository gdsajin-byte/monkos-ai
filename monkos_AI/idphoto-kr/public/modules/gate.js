/**
 * modules/gate.js — 게이트 팝업 모듈
 * Phase 1: 카카오 로그인 → 30c
 * Phase 2: 채널 가입 (카카오톡 또는 텔레그램 택1) → 40c
 * 바로 결제 옵션
 * 70c 달성 시 onComplete 콜백
 *
 * v3: 멀티채널 UI + Cr 모션 연동 + 텔레그램 미설치 안내
 */

import { store, Monk, API, TOSS_CLIENT_KEY, fetchLatestCredits, CREDIT_COST, showEventCard } from '../shared.js';
import { KAKAO_JS_KEY, KAKAO_CHANNEL_ID } from '../config.js';

// ─── 스타일 ───
const GATE_CSS = `
.gate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center}
.gate-card{background:#fff;border-radius:20px 20px 0 0;padding:28px 20px 32px;width:100%;max-width:420px;position:relative;animation:gateUp .3s ease}
@keyframes gateUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.gate-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888}
.gate-title{font-size:18px;font-weight:700;text-align:center;margin-bottom:16px}
.gate-badge{background:#FFF3E0;color:#E65100;padding:8px 12px;border-radius:8px;font-size:14px;font-weight:600;text-align:center;margin-bottom:16px}
.gate-checklist{margin-bottom:12px}
.gate-check{display:flex;align-items:center;gap:8px;padding:8px 0;font-size:14px;color:#444}
.gate-check.done{color:#2E7D32}
.gate-check .icon{font-size:16px;width:20px}
.gate-check .credit{margin-left:auto;font-weight:600;color:#1976D2}
.gate-progress{text-align:center;font-size:15px;font-weight:600;padding:8px 0 16px;color:#333}
.gate-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.gate-btn-kakao{background:#FEE500;color:#000}
.gate-btn-kakao:hover{background:#FDD835}
.gate-btn-pay{background:#f5f5f5;color:#333;border:1px solid #ddd}
.gate-btn-pay:hover{background:#eee}
.gate-btn-share{background:#0088cc;color:#fff}
.gate-btn-share:hover{background:#0077b3}
.gate-btn-consent{background:#E8F5E9;color:#2E7D32;border:1px solid #C8E6C9}
.gate-btn-consent:hover{background:#C8E6C9}
.gate-btn:disabled{opacity:.5;cursor:not-allowed}
.gate-divider{display:flex;align-items:center;margin:12px 0}
.gate-divider::before,.gate-divider::after{content:'';flex:1;border-bottom:1px solid #eee}
.gate-divider span{padding:0 12px;color:#999;font-size:13px}
.gate-login-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center}
.gate-login-card{background:#fff;border-radius:16px;padding:28px 20px;width:90%;max-width:340px;text-align:center}
.gate-login-msg{font-size:15px;color:#333;margin-bottom:20px;white-space:pre-line}
.gate-ch-select{display:flex;gap:10px;margin-bottom:14px}
.gate-ch-card{flex:1;padding:16px 10px;border:2px solid #e0e0e0;border-radius:14px;text-align:center;cursor:pointer;transition:border-color .2s,box-shadow .2s}
.gate-ch-card:hover{border-color:#bbb}
.gate-ch-card.highlight{border-color:#1976D2;box-shadow:0 0 0 2px rgba(25,118,210,.15)}
.gate-ch-card.done{border-color:#2E7D32;background:#E8F5E9;pointer-events:none}
.gate-ch-card.disabled{opacity:.4;pointer-events:none}
.gate-ch-card .ch-icon{font-size:28px;margin-bottom:6px}
.gate-ch-card .ch-name{font-size:14px;font-weight:700;color:#333}
.gate-ch-card .ch-action{font-size:12px;color:#888;margin-top:2px}
.gate-ch-desc{text-align:center;font-size:13px;color:#888;margin-bottom:12px;min-height:18px}
.gate-tg-fallback{display:none;text-align:center;font-size:13px;color:#666;line-height:1.6;margin:8px 0;padding:10px;background:#f9f9f9;border-radius:8px}
.gate-tg-fallback a{color:#1976D2;text-decoration:underline;cursor:pointer}
`;

// ─── 내부 상태 ───
let _gateCredits = 0;
let _onComplete = null;
let _stylesInjected = false;
let _channelDone = false;
let _tgFallbackTimer = null;

function _injectStyles() {
  if (_stylesInjected) return;
  const el = document.createElement('style');
  el.id = 'gate-styles';
  el.textContent = GATE_CSS;
  document.head.appendChild(el);
  _stylesInjected = true;
}

// ─── 게이트 UI 업데이트 ───
function _updateUI(credits) {
  _gateCredits = credits;
  const num = document.getElementById('gate-progress-num');
  if (num) num.textContent = credits;

  if (credits >= 70) {
    GateModule.close();
    Monk.log(`게이트 달성: ${credits}c → 다운로드 진행`);
    if (_onComplete) _onComplete();
  }
}

// ─── 카카오 로그인 ───
function _startKakaoLogin() {
  const popup = window.open(
    `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr`,
    'kakao-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/kakao`;
    return;
  }

  function handler(e) {
    if (e.origin !== API.PORTAL_URL) return;
    if (e.data && e.data.type === 'auth-success') {
      window.removeEventListener('message', handler);
      const u = e.data.user;
      store.user = {
        id: u.id, email: u.email, name: u.name,
        credits: u.credits ?? 0, avatar: u.picture || '',
      };
      Monk.log(`로그인 성공: ${u.email || u.name} (${store.user.credits}c)`);
      _onKakaoLoginSuccess();
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

async function _onKakaoLoginSuccess() {
  const ckLogin = document.getElementById('gate-ck-login');
  if (ckLogin) {
    ckLogin.classList.add('done');
    ckLogin.querySelector('.icon').textContent = '✅';
  }

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, eventType: 'signup_bonus' }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      _updateUI(30);
      showEventCard('가입 보너스', '+30 Cr', '카카오 로그인 완료');
      Monk.log('가입 보너스 30c 지급');
    } else {
      _updateUI(Math.min(store.user.credits, 30));
      Monk.log('가입 보너스: ' + (data.error || '이미 수령'));
    }
  } catch (err) {
    Monk.log('가입 보너스 요청 실패: ' + err.message);
    _updateUI(0);
  }

  const phase1 = document.getElementById('gate-phase1');
  const phase2 = document.getElementById('gate-phase2');
  if (phase1) phase1.style.display = 'none';
  if (phase2) phase2.style.display = 'block';

  const ckEvent = document.getElementById('gate-ck-event');
  if (ckEvent) ckEvent.style.opacity = '1';
}

// ─── 이벤트 크레딧 ───
async function _requestEventCredit(eventType) {
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/credits/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, eventType }),
    });
    const data = await res.json();
    if (data.success) {
      store.user = { ...store.user, credits: data.credits ?? store.user.credits };
      return true;
    }
    Monk.log(`이벤트 크레딧 실패: ${data.error || eventType}`);
    return false;
  } catch (err) {
    Monk.log(`이벤트 크레딧 에러: ${err.message}`);
    return false;
  }
}

// ─── 채널 완료 마킹 (택1) ───
function _markChannelDone(which) {
  _channelDone = true;
  const kakaoCard = document.getElementById('gate-ch-kakao');
  const tgCard = document.getElementById('gate-ch-tg');
  if (which === 'kakao') {
    if (kakaoCard) kakaoCard.classList.add('done');
    if (tgCard) tgCard.classList.add('disabled');
  } else {
    if (tgCard) tgCard.classList.add('done');
    if (kakaoCard) kakaoCard.classList.add('disabled');
  }
}

// ─── 카카오 채널 가입 ───
function _loadKakaoSDK() {
  return new Promise((resolve, reject) => {
    if (window.Kakao) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.onload = () => {
      if (KAKAO_JS_KEY && window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(KAKAO_JS_KEY);
      }
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function _handleKakaoChannel() {
  if (_channelDone || !store.user.id) return;

  if (!KAKAO_JS_KEY || !KAKAO_CHANNEL_ID) {
    Monk.log('카카오 채널 설정 미완료 — config.js KAKAO_JS_KEY / KAKAO_CHANNEL_ID 필요');
    alert('카카오 채널 연결 준비 중입니다.\n텔레그램 채널로 진행해주세요.');
    return;
  }

  try {
    await _loadKakaoSDK();
    if (!window.Kakao) {
      alert('카카오 SDK를 불러올 수 없습니다.');
      return;
    }

    const res = await window.Kakao.Channel.followChannel({ channelPublicId: KAKAO_CHANNEL_ID });
    if (res) {
      const ok = await _requestEventCredit('kakao_channel_add');
      if (ok) {
        _markChannelDone('kakao');
        showEventCard('채널 가입 보너스', '+40 Cr', '카카오 채널 추가 완료');
        const ck = document.getElementById('gate-ck-event');
        if (ck) { ck.classList.add('done'); ck.querySelector('.icon').textContent = '✅'; }
        _updateUI(_gateCredits + 40);
        Monk.log('카카오 채널 추가 성공 +40c');
      } else {
        alert('채널 추가가 확인되지 않습니다.\n다시 시도해주세요.');
      }
    }
  } catch (err) {
    Monk.log('카카오 채널 에러: ' + (err.message || err));
    alert('카카오 채널 연결 중 오류가 발생했습니다.');
  }
}

// ─── 텔레그램 채널 가입 ───
async function _handleTelegramJoin() {
  if (_channelDone || !store.user.id) return;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/telegram/gate-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, type: 'gate' }),
    });
    const data = await res.json();
    if (data.deeplink) {
      window.open(data.deeplink, '_blank');

      const verifyBtn = document.getElementById('gate-verify-tg');
      const hint = document.getElementById('gate-tg-verify-hint');
      if (verifyBtn) verifyBtn.style.display = 'block';
      if (hint) hint.style.display = 'block';
      Monk.log('텔레그램 채널 가입 딥링크 오픈');

      // 3초 후 미설치 안내 표시
      if (_tgFallbackTimer) clearTimeout(_tgFallbackTimer);
      _tgFallbackTimer = setTimeout(() => {
        const fb = document.getElementById('gate-tg-fallback');
        if (fb) fb.style.display = 'block';
      }, 3000);
    }
  } catch (err) {
    Monk.log('텔레그램 딥링크 에러: ' + err.message);
    alert('텔레그램 연결 중 오류가 발생했습니다.');
  }
}

async function _verifyTelegramJoin() {
  const ok = await _requestEventCredit('telegram_join');
  if (ok) {
    _markChannelDone('telegram');
    showEventCard('채널 가입 보너스', '+40 Cr', '텔레그램 채널 가입 완료');
    const ck = document.getElementById('gate-ck-event');
    if (ck) { ck.classList.add('done'); ck.querySelector('.icon').textContent = '✅'; }
    _updateUI(_gateCredits + 40);
    if (_tgFallbackTimer) { clearTimeout(_tgFallbackTimer); _tgFallbackTimer = null; }
    Monk.log('텔레그램 채널 가입 검증 성공 +40c');
  } else {
    alert('채널 가입이 확인되지 않습니다.\n가입 후 다시 시도해주세요.');
  }
}

// ─── 텔레그램 미설치 → 카카오 전환 ───
function _switchToKakao() {
  const fb = document.getElementById('gate-tg-fallback');
  if (fb) fb.style.display = 'none';
  _handleKakaoChannel();
}

// ─── 채널 선택 시 설명 업데이트 ───
function _selectChannel(which) {
  const kakaoCard = document.getElementById('gate-ch-kakao');
  const tgCard = document.getElementById('gate-ch-tg');
  const desc = document.getElementById('gate-ch-desc');
  const tgArea = document.getElementById('gate-tg-action-area');
  const kakaoArea = document.getElementById('gate-kakao-action-area');

  if (which === 'kakao') {
    if (kakaoCard) kakaoCard.classList.add('highlight');
    if (tgCard) tgCard.classList.remove('highlight');
    if (desc) desc.textContent = '카카오톡 채널을 추가하면 40c!';
    if (tgArea) tgArea.style.display = 'none';
    if (kakaoArea) kakaoArea.style.display = 'block';
  } else {
    if (tgCard) tgCard.classList.add('highlight');
    if (kakaoCard) kakaoCard.classList.remove('highlight');
    if (desc) desc.textContent = '텔레그램 채널에 가입하면 40c!';
    if (tgArea) tgArea.style.display = 'block';
    if (kakaoArea) kakaoArea.style.display = 'none';
  }
}

// ─── 바로 결제 ───
async function _buyDirect() {
  GateModule.close();

  if (!TOSS_CLIENT_KEY) {
    alert('결제 시스템 준비 중입니다.\n곧 이용 가능합니다!');
    return;
  }

  const orderId = `DIRECT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);

    await tossPayments.requestPayment('카드', {
      amount: 10150,
      orderId,
      orderName: 'MONKOS AI 증명사진 1장',
      successUrl: `${window.location.origin}${window.location.pathname}?toss=direct`,
      failUrl: `${window.location.origin}${window.location.pathname}?toss=fail`,
    });
  } catch (err) {
    if (err.code !== 'PAY_PROCESS_CANCELED' && err.code !== 'USER_CANCEL') {
      alert('결제 오류: ' + (err.message || err.code));
    }
  }
}

// ─── 바로 결제 리다이렉트 처리 ───
async function _initDirectPaymentResult(afterPayCallback) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('toss') !== 'direct') return false;

  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');
  history.replaceState({}, '', window.location.pathname);

  if (!paymentKey || !orderId || !amount) return false;

  try {
    const res = await fetch(`${API.PORTAL_URL}/api/payments/toss/direct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    });
    const data = await res.json();
    if (data.success && data.downloadToken) {
      Monk.log('단건 결제 완료 → 다운로드 진행');
      if (afterPayCallback) afterPayCallback();
      return true;
    } else {
      alert('결제 확인 실패: ' + (data.error || ''));
    }
  } catch (err) {
    Monk.log('단건 결제 확인 에러: ' + err.message);
    alert('결제 확인 중 오류가 발생했습니다.');
  }
  return false;
}

// ─── 로그인 필요 모달 ───
function _showLoginRequired(message) {
  _injectStyles();
  const old = document.getElementById('login-required-modal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'login-required-modal';
  overlay.className = 'gate-login-overlay';
  overlay.innerHTML = `
    <div class="gate-login-card">
      <p class="gate-login-msg">${message}</p>
      <button class="gate-btn gate-btn-google" id="gate-login-google-btn" style="background:#fff;color:#333;border:1px solid #ddd;">Google 로그인</button>
      <button class="gate-btn gate-btn-kakao" id="gate-login-kakao-btn" style="margin-top:8px;">카카오 로그인</button>
      <button class="gate-btn gate-btn-line" id="gate-login-line-btn" style="margin-top:8px;background:#06C755;color:#fff;">LINE 로그인</button>
      <button class="gate-btn gate-btn-pay" style="margin-top:8px" id="gate-login-close-btn">닫기</button>
    </div>
  `;

  overlay.querySelector('#gate-login-google-btn').addEventListener('click', () => {
    _closeLoginRequired();
    if (typeof window.loginGoogle === 'function') window.loginGoogle();
  });
  overlay.querySelector('#gate-login-kakao-btn').addEventListener('click', () => {
    _closeLoginRequired();
    _startKakaoLoginSimple();
  });
  overlay.querySelector('#gate-login-line-btn').addEventListener('click', () => {
    _closeLoginRequired();
    _startLineLoginSimple();
  });
  overlay.querySelector('#gate-login-close-btn').addEventListener('click', _closeLoginRequired);

  document.body.appendChild(overlay);
}

function _closeLoginRequired() {
  const el = document.getElementById('login-required-modal');
  if (el) el.remove();
}

function _startKakaoLoginSimple() {
  const popup = window.open(
    `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr`,
    'kakao-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/kakao`;
    return;
  }

  function handler(e) {
    if (e.origin !== API.PORTAL_URL) return;
    if (e.data && e.data.type === 'auth-success') {
      window.removeEventListener('message', handler);
      const u = e.data.user;
      store.user = {
        id: u.id, email: u.email, name: u.name,
        credits: u.credits ?? 0, avatar: u.picture || '',
      };
      Monk.log(`로그인 성공: ${u.email || u.name} (${store.user.credits}c)`);
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

function _startLineLoginSimple() {
  const popup = window.open(
    `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=idphoto-kr`,
    'line-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/line`;
    return;
  }

  function handler(e) {
    if (e.origin !== API.PORTAL_URL) return;
    if (e.data && e.data.type === 'auth-success') {
      window.removeEventListener('message', handler);
      const u = e.data.user;
      store.user = {
        id: u.id, email: u.email, name: u.name,
        credits: u.credits ?? 0, avatar: u.picture || '',
      };
      Monk.log(`LINE 로그인 성공: ${u.email || u.name} (${store.user.credits}c)`);
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

// ─── 게이트 달성 후 다운로드 진행 ───
async function _proceedAfterGate(downloadCallback) {
  await fetchLatestCredits();

  if (store.user.credits < CREDIT_COST.download) {
    const { ChargeModule } = await import('./charge.js');
    ChargeModule.show();
    return;
  }

  if (downloadCallback) downloadCallback();
}

// ═══════════════════════════════════════
// Export: GateModule
// ═══════════════════════════════════════
export const GateModule = {
  /**
   * show({ onComplete }) — 게이트 팝업 표시
   * onComplete: 70c 달성 시 호출될 콜백
   */
  show({ onComplete } = {}) {
    _injectStyles();
    const old = document.getElementById('download-gate');
    if (old) old.remove();

    _gateCredits = 0;
    _channelDone = false;
    _onComplete = async () => {
      await _proceedAfterGate(onComplete);
    };

    // locale 기반 디폴트 채널 추천
    const isKo = (navigator.language || '').startsWith('ko');

    const overlay = document.createElement('div');
    overlay.id = 'download-gate';
    overlay.className = 'gate-overlay';
    overlay.innerHTML = `
      <div class="gate-card">
        <button class="gate-close" id="gate-close-btn">&times;</button>
        <h2 class="gate-title">로그인이 필요한 서비스입니다</h2>
        <div class="gate-badge">가입 이벤트 — 첫 1장 무료!</div>
        <div class="gate-checklist">
          <div class="gate-check" id="gate-ck-login">
            <span class="icon">☐</span>
            <span>카카오 로그인</span>
            <span class="credit">30c 증정</span>
          </div>
          <div class="gate-check" id="gate-ck-event" style="opacity:.4">
            <span class="icon">☐</span>
            <span>채널 가입</span>
            <span class="credit">+40c</span>
          </div>
        </div>
        <div class="gate-progress" id="gate-progress">
          = <span id="gate-progress-num">0</span>c / 70c
        </div>
        <div id="gate-phase1">
          <button class="gate-btn gate-btn-kakao" id="gate-kakao-btn">카카오 로그인으로 무료 받기</button>
          <div class="gate-divider"><span>또는</span></div>
          <button class="gate-btn gate-btn-pay" id="gate-direct-btn1">바로 결제 ₩10,150</button>
        </div>
        <div id="gate-phase2" style="display:none">
          <div style="text-align:center;margin-bottom:12px;font-size:15px;font-weight:600;color:#333;">
            +40c 받기 — 채널 하나를 선택하세요
          </div>
          <div class="gate-ch-select">
            <div class="gate-ch-card ${isKo ? 'highlight' : ''}" id="gate-ch-kakao">
              <div class="ch-icon">💬</div>
              <div class="ch-name">카카오톡</div>
              <div class="ch-action">채널 추가</div>
            </div>
            <div class="gate-ch-card ${isKo ? '' : 'highlight'}" id="gate-ch-tg">
              <div class="ch-icon">✈️</div>
              <div class="ch-name">텔레그램</div>
              <div class="ch-action">채널 가입</div>
            </div>
          </div>
          <div class="gate-ch-desc" id="gate-ch-desc">${isKo ? '카카오톡 채널을 추가하면 40c!' : '텔레그램 채널에 가입하면 40c!'}</div>

          <!-- 카카오 액션 영역 -->
          <div id="gate-kakao-action-area" style="display:${isKo ? 'block' : 'none'}">
            <button class="gate-btn gate-btn-kakao" id="gate-kakao-ch-btn">💬 카카오톡 채널 추가하고 <b>+40c</b> 받기</button>
          </div>

          <!-- 텔레그램 액션 영역 -->
          <div id="gate-tg-action-area" style="display:${isKo ? 'none' : 'block'}">
            <button class="gate-btn gate-btn-share" id="gate-tg-join-btn">📱 텔레그램 가입하고 <b>+40c</b> 받기</button>
            <div id="gate-tg-verify-hint" style="display:none;text-align:center;margin:8px 0;font-size:13px;color:#888;">
              가입 후 아래 버튼을 눌러주세요
            </div>
            <button class="gate-btn gate-btn-consent" id="gate-verify-tg" style="display:none">✅ 40c 크레딧 받기</button>
            <div class="gate-tg-fallback" id="gate-tg-fallback">
              텔레그램이 열리지 않나요?<br>
              <a href="https://telegram.org/dl" target="_blank">앱 설치하기</a> 또는
              <a id="gate-tg-switch-kakao">카카오톡 채널로 대신하기</a>
            </div>
          </div>

          <div class="gate-divider"><span>또는</span></div>
          <button class="gate-btn gate-btn-pay" id="gate-direct-btn2">바로 결제하기 ₩10,150</button>
        </div>
      </div>
    `;

    // 이벤트 바인딩
    overlay.querySelector('#gate-close-btn').addEventListener('click', () => GateModule.close());
    overlay.querySelector('#gate-kakao-btn').addEventListener('click', _startKakaoLogin);
    overlay.querySelector('#gate-direct-btn1').addEventListener('click', _buyDirect);

    // Phase 2 — 채널 선택
    overlay.querySelector('#gate-ch-kakao').addEventListener('click', () => {
      if (!_channelDone) _selectChannel('kakao');
    });
    overlay.querySelector('#gate-ch-tg').addEventListener('click', () => {
      if (!_channelDone) _selectChannel('telegram');
    });

    // Phase 2 — 카카오 채널 액션
    overlay.querySelector('#gate-kakao-ch-btn').addEventListener('click', _handleKakaoChannel);

    // Phase 2 — 텔레그램 액션
    overlay.querySelector('#gate-tg-join-btn').addEventListener('click', _handleTelegramJoin);
    overlay.querySelector('#gate-verify-tg').addEventListener('click', _verifyTelegramJoin);
    overlay.querySelector('#gate-direct-btn2').addEventListener('click', _buyDirect);

    // 텔레그램 미설치 → 카카오 전환
    overlay.querySelector('#gate-tg-switch-kakao').addEventListener('click', (e) => {
      e.preventDefault();
      _switchToKakao();
    });

    document.body.appendChild(overlay);
    Monk.log('다운로드 게이트 팝업 표시');
  },

  close() {
    if (_tgFallbackTimer) { clearTimeout(_tgFallbackTimer); _tgFallbackTimer = null; }
    const el = document.getElementById('download-gate');
    if (el) el.remove();
  },

  /**
   * 바로 결제 리다이렉트 처리 (init 시 호출)
   */
  initDirectPayment(afterPayCallback) {
    return _initDirectPaymentResult(afterPayCallback);
  },

  /**
   * 로그인 필요 모달 (생성 2회차 차단)
   */
  showLoginRequired(message) {
    _showLoginRequired(message);
  },

  closeLoginRequired() {
    _closeLoginRequired();
  },
};
