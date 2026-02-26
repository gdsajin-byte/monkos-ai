/**
 * modules/gate.js — 게이트 팝업 모듈
 * Phase 1: 카카오 로그인 → 30c
 * Phase 2: 텔레그램 채널 가입 → 40c
 * 바로 결제 옵션
 * 70c 달성 시 onComplete 콜백
 */

import { store, Monk, API, TOSS_CLIENT_KEY, fetchLatestCredits, CREDIT_COST } from '../shared.js';

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
`;

// ─── 내부 상태 ───
let _gateCredits = 0;
let _onComplete = null;
let _stylesInjected = false;

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
      localStorage.setItem('monkos_user', JSON.stringify(e.data.user));
      if (e.data.token) localStorage.setItem('monkos_token', e.data.token);
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

// ─── 텔레그램 채널 가입 ───
async function _handleTelegramJoin() {
  if (!store.user.id) return;
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
    }
  } catch (err) {
    Monk.log('텔레그램 딥링크 에러: ' + err.message);
    alert('텔레그램 연결 중 오류가 발생했습니다.');
  }
}

async function _verifyTelegramJoin() {
  const ok = await _requestEventCredit('telegram_join');
  if (ok) {
    const ck = document.getElementById('gate-ck-event');
    if (ck) { ck.classList.add('done'); ck.querySelector('.icon').textContent = '✅'; }
    _updateUI(_gateCredits + 40);
    Monk.log('텔레그램 채널 가입 검증 성공 +40c');
  } else {
    alert('채널 가입이 확인되지 않습니다.\n가입 후 다시 시도해주세요.');
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
    const payment = tossPayments.payment({ customerKey: `GUEST_${orderId}` });

    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: 10150 },
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
      <button class="gate-btn gate-btn-kakao" id="gate-login-simple-btn">카카오 로그인</button>
      <button class="gate-btn gate-btn-pay" style="margin-top:8px" id="gate-login-close-btn">닫기</button>
    </div>
  `;

  overlay.querySelector('#gate-login-simple-btn').addEventListener('click', () => {
    _closeLoginRequired();
    _startKakaoLoginSimple();
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
      localStorage.setItem('monkos_user', JSON.stringify(e.data.user));
      if (e.data.token) localStorage.setItem('monkos_token', e.data.token);
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
    _onComplete = async () => {
      await _proceedAfterGate(onComplete);
    };

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
            <span>텔레그램 채널 가입</span>
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
          <div style="text-align:center;margin-bottom:12px;font-size:14px;color:#666;line-height:1.5;">
            MONKOS 텔레그램 채널에 가입하면<br>40c를 드립니다!
          </div>
          <button class="gate-btn gate-btn-share" id="gate-tg-join-btn">📱 텔레그램 채널 가입하기</button>
          <div id="gate-tg-verify-hint" style="display:none;text-align:center;margin:8px 0;font-size:13px;color:#888;">
            가입 후 아래 버튼을 눌러주세요
          </div>
          <button class="gate-btn gate-btn-consent" id="gate-verify-tg" style="display:none">가입 확인하기</button>
          <div class="gate-divider"><span>또는</span></div>
          <button class="gate-btn gate-btn-pay" id="gate-direct-btn2">바로 결제하기 ₩10,150</button>
        </div>
      </div>
    `;

    // 이벤트 바인딩 (onclick 대신 addEventListener)
    overlay.querySelector('#gate-close-btn').addEventListener('click', () => GateModule.close());
    overlay.querySelector('#gate-kakao-btn').addEventListener('click', _startKakaoLogin);
    overlay.querySelector('#gate-direct-btn1').addEventListener('click', _buyDirect);
    overlay.querySelector('#gate-tg-join-btn').addEventListener('click', _handleTelegramJoin);
    overlay.querySelector('#gate-verify-tg').addEventListener('click', _verifyTelegramJoin);
    overlay.querySelector('#gate-direct-btn2').addEventListener('click', _buyDirect);

    document.body.appendChild(overlay);
    Monk.log('다운로드 게이트 팝업 표시');
  },

  close() {
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
