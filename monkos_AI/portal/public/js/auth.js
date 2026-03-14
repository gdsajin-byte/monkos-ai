/**
 * MONKOS Portal v4 — auth.js
 * 인증 (Google GIS, Kakao, LINE)
 */

// === Google OAuth ===
var GOOGLE_CLIENT_ID = '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

var currentUser = null;
var gisLoaded = false;
var gisLoadRetries = 0;
var GIS_MAX_RETRIES = 3;

function loadGIS() {
  return new Promise(function(resolve, reject) {
    if (typeof google !== 'undefined' && google.accounts) {
      gisLoaded = true;
      resolve();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = function() {
      console.log('[Auth] GIS 스크립트 로드 완료');
      gisLoaded = true;
      resolve();
    };
    script.onerror = function() {
      console.warn('[Auth] GIS 스크립트 로드 실패 (시도 ' + (gisLoadRetries + 1) + '/' + GIS_MAX_RETRIES + ')');
      reject(new Error('GIS load failed'));
    };
    document.head.appendChild(script);
  });
}

async function loadGISWithRetry() {
  for (var i = 0; i < GIS_MAX_RETRIES; i++) {
    try {
      gisLoadRetries = i;
      await loadGIS();
      return true;
    } catch (e) {
      if (i < GIS_MAX_RETRIES - 1) {
        await new Promise(function(r) { setTimeout(r, 1000 * (i + 1)); });
      }
    }
  }
  console.error('[Auth] GIS 스크립트 로드 최종 실패');
  return false;
}

async function restoreSession() {
  try {
    var res = await fetch('/api/auth/verify-cookie', { credentials: 'include' });
    if (res.ok) {
      var data = await res.json();
      if (data.user && data.user.id) {
        currentUser = data.user;
        updateAuthUI();
        return;
      }
    }
  } catch (e) {
    console.log('세션 복원 실패');
  }
  currentUser = null;
  updateAuthUI();
}

async function initGoogleAuth() {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === '__GOOGLE_CLIENT_ID__') return;
  if (!gisLoaded) await loadGISWithRetry();
  if (typeof google === 'undefined' || !google.accounts) {
    console.warn('[Auth] GIS 사용 불가 — Google 로그인 제한');
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCallback,
    auto_select: false,
    cancel_on_tap_outside: false,
    itp_support: true,
  });
}

window.loginKakao = function() { location.href = '/auth/kakao'; };
window.loginLine = function() { location.href = '/auth/line'; };

window.headerLogin = function() {
  if (region === 'kr') {
    document.getElementById('loginModal').classList.add('active');
  } else {
    window.googleLogin();
  }
};

window.closeLoginModal = function() {
  document.getElementById('loginModal').classList.remove('active');
};

window.googleLogin = async function() {
  if (typeof google === 'undefined' || !google.accounts) {
    var loaded = await loadGISWithRetry();
    if (!loaded) {
      var errMsg = {
        ja: 'Googleログインを読み込めませんでした。広告ブロッカーを無効にするか、ページを再読み込みしてください。',
        ko: 'Google 로그인을 불러올 수 없습니다. 광고 차단기를 끄거나 페이지를 새로고침해 주세요.',
        en: 'Could not load Google Sign-In. Please disable ad blockers or reload the page.'
      };
      alert(errMsg[lang] || errMsg.en);
      return;
    }
  }
  if (google.accounts.oauth2) {
    var tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: handleGoogleTokenCallback,
    });
    tokenClient.requestAccessToken();
  } else {
    google.accounts.id.prompt();
  }
};

async function handleGoogleTokenCallback(tokenResponse) {
  if (!tokenResponse || !tokenResponse.access_token) return;
  try {
    var res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access_token: tokenResponse.access_token }),
    });
    var data = await res.json();
    if (data.user) {
      currentUser = data.user;
      updateAuthUI();
    }
  } catch (err) {
    console.error('[Auth] Google token error:', err);
  }
}

async function handleGoogleCallback(response) {
  if (!response || !response.credential) return;
  try {
    var res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential }),
    });
    var data = await res.json();
    if (data.user) {
      currentUser = data.user;
      updateAuthUI();
    }
  } catch (err) {
    console.error('[Auth] Google callback error:', err);
  }
}

window.logout = async function() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (e) {}
  currentUser = null;
  updateAuthUI();
};

// === Auth UI 업데이트 (v4 유저바) ===
function updateAuthUI() {
  var creditBadge = document.getElementById('creditBadge');
  var creditCount = document.getElementById('creditCount');
  var providerBadge = document.getElementById('providerBadge');
  var providerIconInner = document.getElementById('providerIconInner');
  var popoverName = document.getElementById('popoverName');
  var headerLoginBtn = document.getElementById('headerLoginBtn');
  var userName = document.getElementById('userName');

  if (currentUser) {
    // 크레딧 표시
    if (creditBadge) creditBadge.style.display = 'flex';
    if (creditCount) creditCount.textContent = currentUser.credits || 0;

    // 유저명
    if (userName) {
      userName.textContent = currentUser.name || currentUser.email || '';
      userName.style.display = 'inline';
    }

    // Provider 아이콘
    if (providerBadge) {
      providerBadge.style.display = 'flex';
      providerBadge.className = 'provider-badge ' + (currentUser.provider || 'google');
      if (popoverName) popoverName.textContent = currentUser.name || currentUser.email || '';

      if (currentUser.picture) {
        providerIconInner.innerHTML = '<img src="' + currentUser.picture + '" alt="">';
      } else if (currentUser.provider === 'line') {
        providerIconInner.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 2C6.48 2 2 5.83 2 10.5c0 4.08 3.39 7.5 7.96 8.33.31.07.73.2.84.47.1.24.06.62.03.87l-.14.82c-.04.24-.19.94.82.51s5.46-3.21 7.44-5.5C21.23 13.37 22 11.98 22 10.5 22 5.83 17.52 2 12 2z" fill="#fff"/></svg>';
      } else if (currentUser.provider === 'kakao') {
        providerIconInner.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.33-.14.53-.9 3.4-.93 3.6 0 0-.02.16.08.22.1.06.22.01.22.01.29-.04 3.37-2.2 3.9-2.57.76.11 1.55.16 2.37.16 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" fill="#3C1E1E"/></svg>';
      } else {
        providerIconInner.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>';
      }
    }

    // 어드민 링크
    var adminLink = document.getElementById('adminLink');
    if (adminLink) adminLink.style.display = currentUser.isAdmin ? 'block' : 'none';

    // 로그인 버튼 숨김
    document.body.classList.add('logged-in');
    if (headerLoginBtn) headerLoginBtn.style.display = 'none';
  } else {
    if (creditBadge) creditBadge.style.display = 'none';
    if (providerBadge) providerBadge.style.display = 'none';
    if (userName) userName.style.display = 'none';
    document.body.classList.remove('logged-in');
    if (headerLoginBtn) headerLoginBtn.style.display = 'block';
  }
}

window.toggleLogoutPopover = function() {
  var pop = document.getElementById('logoutPopover');
  if (pop) pop.classList.toggle('open');
};

window.showConsentModal = function(type) {
  var modal = document.getElementById(type + 'Modal');
  if (modal) modal.classList.add('active');
};

window.closeConsentModal = function(type) {
  var modal = document.getElementById(type + 'Modal');
  if (modal) modal.classList.remove('active');
};
