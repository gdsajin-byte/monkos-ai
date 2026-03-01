/**
 * modules/gate.js — 결제/로그인 유틸
 * P2 구조 개선: Phase1/Phase2 제거, 핵심 유틸만 보존
 * - showLoginRequired(): 카메라 진입 시 로그인 유도
 * - buyDirect(): 비로그인 직결제 (₩9,900)
 * - initDirectPayment(): 토스 리다이렉트 처리
 */

import { store, Monk, API, TOSS_CLIENT_KEY } from '../shared.js';
import { GOOGLE_CLIENT_ID } from '../config.js';

// ─── 스타일 ───
const GATE_CSS = `
.gate-login-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center}
.gate-login-card{background:#fff;border-radius:16px;padding:28px 20px;width:90%;max-width:340px;text-align:center}
.gate-login-msg{font-size:15px;color:#333;margin-bottom:20px;white-space:pre-line}
.gate-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.gate-btn-kakao{background:#FEE500;color:#000}
.gate-btn-kakao:hover{background:#FDD835}
.gate-btn-pay{background:#f5f5f5;color:#333;border:1px solid #ddd}
.gate-btn-pay:hover{background:#eee}
.gate-btn:disabled{opacity:.5;cursor:not-allowed}
`;

let _stylesInjected = false;

function _injectStyles() {
  if (_stylesInjected) return;
  const el = document.createElement('style');
  el.id = 'gate-styles';
  el.textContent = GATE_CSS;
  document.head.appendChild(el);
  _stylesInjected = true;
}

// ─── 바로 결제 (₩9,900 → 70c) ───
async function _buyDirect() {
  if (!TOSS_CLIENT_KEY) {
    alert('결제 시스템 준비 중입니다.\n곧 이용 가능합니다!');
    return;
  }

  const orderId = `DIRECT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);

    await tossPayments.requestPayment('카드', {
      amount: 9900,
      orderId,
      orderName: 'MONKOS AI 증명사진 다운로드 1장',
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
    _startGoogleLoginSimple();
  });
  overlay.querySelector('#gate-login-kakao-btn').addEventListener('click', () => {
    // iOS Safari: window.open MUST happen before DOM removal (user gesture context)
    const popup = window.open('about:blank', 'kakao-login', 'width=500,height=600');
    _closeLoginRequired();
    if (!popup) {
      window.location.href = `${API.PORTAL_URL}/auth/kakao`;
      return;
    }
    popup.location.href = `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr`;
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
  });
  overlay.querySelector('#gate-login-line-btn').addEventListener('click', () => {
    // iOS Safari: window.open MUST happen before DOM removal (user gesture context)
    const popup = window.open('about:blank', 'line-login', 'width=500,height=600');
    _closeLoginRequired();
    if (!popup) {
      window.location.href = `${API.PORTAL_URL}/auth/line`;
      return;
    }
    popup.location.href = `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=idphoto-kr`;
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
  });
  overlay.querySelector('#gate-login-close-btn').addEventListener('click', _closeLoginRequired);

  document.body.appendChild(overlay);
}

function _closeLoginRequired() {
  const el = document.getElementById('login-required-modal');
  if (el) el.remove();
}

// ─── 카카오 로그인 (Simple) ───
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

// ─── LINE 로그인 (Simple) ───
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

// ─── Google 로그인 (GIS) ───
function _startGoogleLoginSimple() {
  if (!GOOGLE_CLIENT_ID) {
    Monk.log('Google Client ID 미설정');
    return;
  }

  function doLogin() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) return;
        try {
          const res = await fetch(`${API.PORTAL_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ access_token: tokenResponse.access_token }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            store.user = {
              id: data.user.id, email: data.user.email, name: data.user.name,
              credits: data.user.credits ?? 0, avatar: data.user.picture || '',
            };
            Monk.log(`Google 로그인 성공: ${data.user.email} (${store.user.credits}c)`);
          }
        } catch (err) {
          Monk.log('Google 로그인 에러: ' + err.message);
        }
      },
    });
    tokenClient.requestAccessToken();
  }

  if (typeof google !== 'undefined' && google.accounts?.oauth2) {
    doLogin();
  } else {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => doLogin();
    script.onerror = () => Monk.log('Google Identity Services 로드 실패');
    document.head.appendChild(script);
  }
}

// ═══════════════════════════════════════
// Export: GateModule
// ═══════════════════════════════════════
export const GateModule = {
  /** @deprecated Phase1/Phase2 제거됨 (P2 구조 개선) */
  show() {
    console.warn('[Gate] show() is deprecated');
  },

  close() {
    const el = document.getElementById('download-gate');
    if (el) el.remove();
  },

  initDirectPayment(afterPayCallback) {
    return _initDirectPaymentResult(afterPayCallback);
  },

  showLoginRequired(message) {
    _showLoginRequired(message);
  },

  closeLoginRequired() {
    _closeLoginRequired();
  },

  buyDirect() {
    _buyDirect();
  },
};
