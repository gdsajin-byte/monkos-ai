/**
 * modules/gate.js — 로그인 게이트 모듈
 * Phase 3: 비회원 결제 경로 소멸 → showLoginRequired / closeLoginRequired + 소셜 로그인만 보존
 * Phase 4: showLoginRequired(msg, onSuccess) 콜백 방식 추가 — 로그인 성공 시 원래 액션 자동 재시도
 */

import { store, Monk, API } from '../shared.js';
import { GOOGLE_CLIENT_ID } from '../config.js';

// ─── 스타일 ───
const GATE_CSS = `
.gate-login-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center}
.gate-login-card{background:#fff;border-radius:16px;padding:28px 20px;width:90%;max-width:340px;text-align:center}
.gate-login-msg{font-size:15px;color:#333;margin-bottom:20px;white-space:pre-line}
.gate-btn{display:block;width:100%;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px}
.gate-btn-kakao{background:#FEE500;color:#000}
.gate-btn-kakao:hover{background:#FDD835}
.gate-btn:disabled{opacity:.5;cursor:not-allowed}
`;

let _stylesInjected = false;
let _loginCallback = null;

function _injectStyles() {
  if (_stylesInjected) return;
  const el = document.createElement('style');
  el.id = 'gate-styles';
  el.textContent = GATE_CSS;
  document.head.appendChild(el);
  _stylesInjected = true;
}

// ─── 로그인 성공 콜백 발화 ───
function _fireLoginCallback() {
  if (_loginCallback) {
    const cb = _loginCallback;
    _loginCallback = null;
    cb();
  }
}

// ─── 로그인 필요 모달 ───
function _showLoginRequired(message, onSuccess) {
  _loginCallback = onSuccess || null;
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
      <button class="gate-btn" style="margin-top:8px;background:#f5f5f5;color:#333;border:1px solid #ddd;" id="gate-login-close-btn">닫기</button>
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
      window.location.href = `${API.PORTAL_URL}/auth/kakao?redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
      return;
    }
    popup.location.href = `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
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
        _fireLoginCallback();
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
      window.location.href = `${API.PORTAL_URL}/auth/line?redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
      return;
    }
    popup.location.href = `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
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
        _fireLoginCallback();
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
    `${API.PORTAL_URL}/auth/kakao?popup=1&redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`,
    'kakao-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/kakao?redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
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
      _fireLoginCallback();
    }
  }
  window.addEventListener('message', handler);
  setTimeout(() => window.removeEventListener('message', handler), 180000);
}

// ─── LINE 로그인 (Simple) ───
function _startLineLoginSimple() {
  const popup = window.open(
    `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`,
    'line-login', 'width=500,height=600'
  );
  if (!popup) {
    window.location.href = `${API.PORTAL_URL}/auth/line?redirect_app=${encodeURIComponent(window.location.origin)}&source_page=${encodeURIComponent(window.location.hostname + window.location.pathname)}`;
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
      _fireLoginCallback();
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
            body: JSON.stringify({ access_token: tokenResponse.access_token, signup_source: window.location.hostname + window.location.pathname }),
          });
          const data = await res.json();
          if (data.success && data.user) {
            store.user = {
              id: data.user.id, email: data.user.email, name: data.user.name,
              credits: data.user.credits ?? 0, avatar: data.user.picture || '',
            };
            Monk.log(`Google 로그인 성공: ${data.user.email} (${store.user.credits}c)`);
            if (typeof gtag === 'function') {
              gtag('event', data.isNewUser ? 'sign_up' : 'login', {
                method: 'google',
                service: 'idphoto-kr',
                signup_source: window.location.hostname + window.location.pathname
              });
            }
            _fireLoginCallback();
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
  /**
   * @param {string} message - 모달에 표시할 메시지
   * @param {Function} [onSuccess] - 로그인 성공 시 실행할 콜백 (닫기 시에는 호출되지 않음)
   */
  showLoginRequired(message, onSuccess) {
    _showLoginRequired(message, onSuccess);
  },

  closeLoginRequired() {
    _closeLoginRequired();
  },
};
