// === auth.js — Authentication Handlers (extracted from server.js) ===

import {
  usersCollection, log, safeJsonForScript,
  generateAuthToken, verifyAuthToken, parseCookies, parseJsonBody,
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
  KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI,
  LINE_CHANNEL_ID, LINE_CHANNEL_SECRET,
  LEMONSQUEEZY_WEBHOOK_SECRET, ALLOWED_POPUP_ORIGINS, allowedPopupOrigins, ADMIN_UIDS,
  pendingLineStates, createHmac, randomBytes, authSecret
} from './shared/config.js';
import { trackEvent, linkIdentity } from './tracking.js';
import { effectiveHost } from './shared/edge-trust.js';

// === 카카오 OAuth (KR) — /auth/kakao ===
export async function handleKakaoAuth(req, res) {
  const parsedUrl = new URL(req.url, `http://${effectiveHost(req)}`);
  const popup = parsedUrl.searchParams.get('popup') === '1';
  const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';
  const sourcePage = parsedUrl.searchParams.get('source_page') || '';
  const acqReferrer = parsedUrl.searchParams.get('acq_referrer') || '';
  const acqUrl = parsedUrl.searchParams.get('acq_url') || '';

  // state에 popup 정보 인코딩
  const state = Buffer.from(JSON.stringify({ popup, redirectApp, sourcePage, acqReferrer, acqUrl })).toString('base64url');
  const effectiveRedirect = `https://${effectiveHost(req)}/auth/kakao/callback`;
  const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(effectiveRedirect)}&response_type=code&scope=account_email,plusfriends&state=${state}`;
  res.writeHead(302, { Location: authUrl });
  res.end();
}

// === 카카오 OAuth Callback — /auth/kakao/callback ===
export async function handleKakaoCallback(req, res) {
  const url = new URL(req.url, `http://${effectiveHost(req)}`);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  try {
    const effectiveRedirect = `https://${effectiveHost(req)}/auth/kakao/callback`;
    const tokenBody = {
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: effectiveRedirect,
      code,
      ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
    };
    log(`[Kakao] 토큰 요청: client_id=${KAKAO_REST_API_KEY}, secret=${process.env.KAKAO_CLIENT_SECRET ? 'YES' : 'NO'}, redirect=${effectiveRedirect}`);
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenBody),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      log(`[Kakao] 토큰 실패 응답: ${JSON.stringify(tokenData)}`);
      throw new Error(`토큰 발급 실패: ${tokenData.error || tokenData.error_code || 'unknown'} - ${tokenData.error_description || ''}`);
    }

    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const kakaoId = String(userData.id);
    const nickname = userData.kakao_account?.profile?.nickname || '';
    const email = userData.kakao_account?.email || '';
    const profileImage = userData.kakao_account?.profile?.profile_image_url || '';
    const docId = `kakao_${kakaoId}`;

    let popupMode = false;
    let redirectApp = '';
    let sourcePage = '';
    let acqReferrer = '';
    let acqUrl = '';
    const stateParam = url.searchParams.get('state');
    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
        popupMode = stateData.popup === true;
        redirectApp = stateData.redirectApp || '';
        sourcePage = stateData.sourcePage || '';
        acqReferrer = stateData.acqReferrer || '';
        acqUrl = stateData.acqUrl || '';
      } catch {}
    }

    const userRef = usersCollection.doc(docId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        provider: 'kakao',
        providerId: kakaoId,
        name: nickname,
        email,
        picture: profileImage,
        credits: 10,
        kakaoAccessToken: tokenData.access_token,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        signupSource: sourcePage,
        ...(acqReferrer || acqUrl ? {
          acquisition: {
            referrer: acqReferrer || null,
            landing_url: acqUrl || null,
            first_visit: new Date().toISOString(),
          }
        } : {}),
      });
      log(`[Kakao] 신규 가입: ${docId} (${nickname}) +10c 보너스`);
    } else {
      await userRef.update({
        name: nickname,
        email,
        picture: profileImage,
        kakaoAccessToken: tokenData.access_token,
        lastLogin: new Date().toISOString(),
      });
      log(`[Kakao] 로그인: ${docId}`);
    }

    const isNewUser = !userDoc.exists;
    const finalDoc = await userRef.get();
    const finalData = finalDoc.data();
    const userInfo = {
      id: docId,
      name: nickname,
      email,
      picture: profileImage,
      provider: 'kakao',
      credits: finalData.credits ?? 0,
    };

    trackEvent({
      eventName: isNewUser ? 'auth_signup' : 'auth_login',
      userId: docId, sessionId: req.sessionId, pagePath: '/auth/kakao/callback',
      service: 'portal', params: { provider: 'kakao' },
    }).catch(() => {});
    linkIdentity(req.sessionId, docId).catch(() => {});

    if (popupMode) {
      // 팝업 모드: postMessage로 부모 윈도우에 전달 후 자동 닫힘
      const targetOrigin = allowedPopupOrigins().includes(redirectApp)
        ? redirectApp
        : 'https://monkos.ai';
      const { token } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000); // 30일

      // 크로스도메인 세션 쿠키 세팅
      res.setHeader('Set-Cookie',
        `monkos_session=${token}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>로그인 완료</title></head><body><script>
(function() {
  var data = { type: 'auth-success', user: ${safeJsonForScript(userInfo)}, token: ${safeJsonForScript(token)} };
  if (window.opener) {
    window.opener.postMessage(data, ${safeJsonForScript(targetOrigin)});
    window.close();
  } else {
    sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
    location.href = ${safeJsonForScript(redirectApp || '/')};
  }
})();
</script></body></html>`);
    } else {
      // 기존 리다이렉트 방식 (비팝업)
      const { token: sessionToken } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000);
      // 크로스도메인 세션 쿠키 세팅
      res.setHeader('Set-Cookie',
        `monkos_session=${sessionToken}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
      const isSafeInternalPath = redirectApp.startsWith('/') && !redirectApp.startsWith('//');
      const returnUrl = isSafeInternalPath ? redirectApp
        : allowedPopupOrigins().includes(redirectApp) ? redirectApp
        : '/';
      const userObj = JSON.stringify(userInfo);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>
sessionStorage.setItem('monkos_user', ${JSON.stringify(userObj)});
location.href = ${JSON.stringify(returnUrl)};
</script></body></html>`);
    }
  } catch (err) {
    log(`[Kakao] OAuth 에러: ${err.message}`);
    res.writeHead(302, { Location: '/?error=kakao_auth_failed' });
    res.end();
  }
}

// === LINE OAuth (JP) — /auth/line ===
export async function handleLineAuth(req, res) {
  const parsedUrl = new URL(req.url, `http://${effectiveHost(req)}`);
  const popup = parsedUrl.searchParams.get('popup') === '1';
  const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';
  const sourcePage = parsedUrl.searchParams.get('source_page') || '';
  const acqReferrer = parsedUrl.searchParams.get('acq_referrer') || '';
  const acqUrl = parsedUrl.searchParams.get('acq_url') || '';

  const csrf = randomBytes(16).toString('hex');
  // CSRF 토큰 + popup 정보를 state에 합성
  const stateObj = { csrf, popup, redirectApp, sourcePage, acqReferrer, acqUrl };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  pendingLineStates.set(csrf, Date.now());
  for (const [k, v] of pendingLineStates) {
    if (Date.now() - v > 10 * 60 * 1000) pendingLineStates.delete(k);
  }
  const effectiveLineRedirect = `https://${effectiveHost(req)}/auth/line/callback`;
  const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(effectiveLineRedirect)}&state=${state}&scope=profile%20openid%20email`;
  res.writeHead(302, { Location: authUrl });
  res.end();
}

// === LINE OAuth Callback — /auth/line/callback ===
export async function handleLineCallback(req, res) {
  const url = new URL(req.url, `http://${effectiveHost(req)}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code) {
    res.writeHead(302, { Location: '/' });
    res.end();
    return;
  }

  // state에서 CSRF 토큰 + popup 정보 추출
  let lineStateData = { csrf: state, popup: false, redirectApp: '', sourcePage: '' };
  try {
    lineStateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    // 레거시 state (plain hex) — 하위 호환
    lineStateData = { csrf: state, popup: false, redirectApp: '' };
  }

  if (!lineStateData.csrf || !pendingLineStates.has(lineStateData.csrf)) {
    log('[LINE] state 검증 실패 (CSRF)');
    res.writeHead(302, { Location: '/?error=invalid_state' });
    res.end();
    return;
  }
  pendingLineStates.delete(lineStateData.csrf);

  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `https://${effectiveHost(req)}/auth/line/callback`,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('トークン発行失敗');

    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();

    let email = '';
    if (tokenData.id_token) {
      try {
        const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
        email = payload.email || '';
      } catch {}
    }

    const lineUserId = profileData.userId;
    const displayName = profileData.displayName || '';
    const pictureUrl = profileData.pictureUrl || '';
    const docId = `line_${lineUserId}`;

    const userRef = usersCollection.doc(docId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const lineAcqRef = lineStateData.acqReferrer || '';
      const lineAcqUrl = lineStateData.acqUrl || '';
      await userRef.set({
        provider: 'line',
        providerId: lineUserId,
        name: displayName,
        email,
        picture: pictureUrl,
        credits: 10,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        signupSource: lineStateData.sourcePage || '',
        ...(lineAcqRef || lineAcqUrl ? {
          acquisition: {
            referrer: lineAcqRef || null,
            landing_url: lineAcqUrl || null,
            first_visit: new Date().toISOString(),
          }
        } : {}),
      });
      log(`[LINE] 신규 가입: ${docId} (${displayName}) +10c 보너스`);
    } else {
      await userRef.update({
        name: displayName,
        picture: pictureUrl,
        lastLogin: new Date().toISOString(),
      });
      log(`[LINE] 로그인: ${docId}`);
    }

    const isNewUser = !userDoc.exists;
    const finalDoc = await userRef.get();
    const finalData = finalDoc.data();
    const userInfo = {
      id: docId,
      name: displayName,
      email,
      picture: pictureUrl,
      provider: 'line',
      credits: finalData.credits ?? 0,
    };

    trackEvent({
      eventName: isNewUser ? 'auth_signup' : 'auth_login',
      userId: docId, sessionId: req.sessionId, pagePath: '/auth/line/callback',
      service: 'portal', params: { provider: 'line' },
    }).catch(() => {});
    linkIdentity(req.sessionId, docId).catch(() => {});

    if (lineStateData.popup) {
      // 팝업 모드: postMessage로 부모 윈도우에 전달 후 자동 닫힘
      const targetOrigin = allowedPopupOrigins().includes(lineStateData.redirectApp)
        ? lineStateData.redirectApp
        : 'https://monkos.ai';
      const { token } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000); // 30일

      // 크로스도메인 세션 쿠키 세팅
      res.setHeader('Set-Cookie',
        `monkos_session=${token}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ログイン完了</title></head><body><script>
(function() {
  var data = { type: 'auth-success', user: ${safeJsonForScript(userInfo)}, token: ${safeJsonForScript(token)} };
  if (window.opener) {
    window.opener.postMessage(data, ${safeJsonForScript(targetOrigin)});
    window.close();
  } else {
    sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
    location.href = ${safeJsonForScript(lineStateData.redirectApp || '/')};
  }
})();
</script></body></html>`);
    } else {
      // 기존 리다이렉트 방식 (비팝업)
      const { token: sessionToken } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000);
      // 크로스도메인 세션 쿠키 세팅
      res.setHeader('Set-Cookie',
        `monkos_session=${sessionToken}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
      const lineRedirectApp = lineStateData.redirectApp || '';
      const isLineSafeInternalPath = lineRedirectApp.startsWith('/') && !lineRedirectApp.startsWith('//');
      const returnUrl = isLineSafeInternalPath ? lineRedirectApp
        : allowedPopupOrigins().includes(lineRedirectApp) ? lineRedirectApp
        : '/';
      const userObj = JSON.stringify(userInfo);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f0f23;display:flex;justify-content:center;align-items:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.logo{font-size:clamp(2rem,8vw,3rem);font-weight:800;background:linear-gradient(90deg,#a78bfa,#818cf8,#c084fc,#a78bfa);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2s linear infinite}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.sub{color:#64748b;margin-top:12px;font-size:0.9rem}
</style>
</head><body>
<div style="text-align:center"><div class="logo">MONKOS AI</div><div class="sub">ログイン中...</div></div>
<script>
sessionStorage.setItem('monkos_user', ${JSON.stringify(userObj)});
location.href = ${JSON.stringify(returnUrl)};
</script></body></html>`);
    }
  } catch (err) {
    log(`[LINE] OAuth 에러: ${err.message}`);
    res.writeHead(302, { Location: '/?error=line_auth_failed' });
    res.end();
  }
}

// === Google OAuth 리다이렉트 — /auth/google ===
export async function handleGoogleRedirectAuth(req, res) {
  const parsedUrl = new URL(req.url, `http://${effectiveHost(req)}`);
  const popup = parsedUrl.searchParams.get('popup') === '1';
  const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';
  const sourcePage = parsedUrl.searchParams.get('source_page') || '';

  const csrf = randomBytes(16).toString('hex');
  const stateObj = { csrf, popup, redirectApp, sourcePage };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  pendingLineStates.set(csrf, Date.now());

  const effectiveRedirect = `https://${effectiveHost(req)}/auth/google/callback`;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(effectiveRedirect)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${state}` +
    `&access_type=online` +
    `&prompt=select_account`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}

// === Google OAuth Callback — /auth/google/callback ===
export async function handleGoogleRedirectCallback(req, res) {
  const url = new URL(req.url, `http://${effectiveHost(req)}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code) {
    log(`[Google Redirect] OAuth 에러: ${error || 'no code'}`, 'WARNING');
    res.writeHead(302, { Location: '/?error=google_auth_failed' });
    res.end();
    return;
  }

  let stateData = { csrf: state, popup: false, redirectApp: '', sourcePage: '' };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {}

  if (!stateData.csrf || !pendingLineStates.has(stateData.csrf)) {
    log('[Google Redirect] state 검증 실패 (CSRF)', 'WARNING');
    res.writeHead(302, { Location: '/?error=invalid_state' });
    res.end();
    return;
  }
  pendingLineStates.delete(stateData.csrf);

  try {
    const effectiveRedirect = `https://${effectiveHost(req)}/auth/google/callback`;
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: effectiveRedirect,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      log(`[Google Redirect] 토큰 실패: ${JSON.stringify(tokenData)}`, 'WARNING');
      throw new Error('토큰 발급 실패');
    }

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    if (!userInfo.sub) throw new Error('사용자 정보 조회 실패');

    const userRef = usersCollection.doc(userInfo.sub);
    const userDoc = await userRef.get();
    const isNewUser = !userDoc.exists;

    const user = {
      id: userInfo.sub,
      provider: 'google',
      email: userInfo.email,
      name: userInfo.name,
      givenName: userInfo.given_name || '',
      familyName: userInfo.family_name || '',
      picture: userInfo.picture,
      locale: userInfo.locale || '',
      emailVerified: userInfo.email_verified === true,
      lastLogin: new Date().toISOString(),
      ...(isNewUser ? {
        createdAt: new Date().toISOString(),
        credits: 10,
        signupSource: stateData.sourcePage || '',
      } : {}),
    };

    await userRef.set(user, { merge: true });
    log(`[Google Redirect] ${isNewUser ? '신규 가입 (+10c)' : '로그인'}: ${user.email}`);

    trackEvent({
      eventName: isNewUser ? 'auth_signup' : 'auth_login',
      userId: user.id, sessionId: req.sessionId, pagePath: '/auth/google/callback',
      service: 'portal', params: { provider: 'google' },
    }).catch(() => {});
    linkIdentity(req.sessionId, user.id).catch(() => {});

    const finalDoc = await userRef.get();
    const finalData = finalDoc.data();
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      credits: finalData.credits ?? 0,
      isAdmin: ADMIN_UIDS.length > 0 && ADMIN_UIDS.includes(user.id),
    };

    const { token: sessionToken } = generateAuthToken(user.id, 30 * 24 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie',
      `monkos_session=${sessionToken}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    if (stateData.popup) {
      const targetOrigin = allowedPopupOrigins().includes(stateData.redirectApp)
        ? stateData.redirectApp : 'https://monkos.ai';
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>로그인 완료</title></head><body><script>
(function() {
  var data = { type: 'auth-success', user: ${safeJsonForScript(sessionUser)}, token: ${safeJsonForScript(sessionToken)} };
  if (window.opener) {
    window.opener.postMessage(data, ${safeJsonForScript(targetOrigin)});
    window.close();
  } else {
    sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
    location.href = ${safeJsonForScript(stateData.redirectApp || '/')};
  }
})();
</script></body></html>`);
    } else {
      const googleRedirectApp = stateData.redirectApp || '';
      const isGoogleSafeInternalPath = googleRedirectApp.startsWith('/') && !googleRedirectApp.startsWith('//');
      const returnUrl = isGoogleSafeInternalPath ? googleRedirectApp
        : allowedPopupOrigins().includes(googleRedirectApp) ? googleRedirectApp
        : '/';
      const userObj = JSON.stringify(sessionUser);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>
sessionStorage.setItem('monkos_user', ${JSON.stringify(userObj)});
location.href = ${JSON.stringify(returnUrl)};
</script></body></html>`);
    }
  } catch (err) {
    log(`[Google Redirect] OAuth 에러: ${err.message}`, 'ERROR');
    res.writeHead(302, { Location: '/?error=google_auth_failed' });
    res.end();
  }
}

// === Google 로그인 API — /api/auth/google (POST) ===
export async function handleGoogleAuth(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { credential, access_token, signup_source, acquisition } = JSON.parse(body);
      if (!credential && !access_token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'credential 또는 access_token 필수' }));
        return;
      }

      let tokenInfo;

      if (credential) {
        // 방법1: GIS One Tap id_token 검증
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
        const verifyRes = await fetch(verifyUrl);
        tokenInfo = await verifyRes.json();
        if (tokenInfo.error || tokenInfo.aud !== GOOGLE_CLIENT_ID) {
          log(`[Auth] id_token 검증 실패: ${tokenInfo.error || 'aud 불일치'}`, 'WARNING');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '토큰 검증 실패' }));
          return;
        }
      } else {
        // 방법2: OAuth 팝업 access_token → userinfo 조회
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const userInfo = await userInfoRes.json();
        if (userInfo.error || !userInfo.sub) {
          log(`[Auth] access_token 검증 실패: ${userInfo.error || 'sub 없음'}`, 'WARNING');
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '토큰 검증 실패' }));
          return;
        }
        tokenInfo = {
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          given_name: userInfo.given_name || '',
          family_name: userInfo.family_name || '',
          picture: userInfo.picture,
          locale: userInfo.locale || '',
          email_verified: String(userInfo.email_verified),
        };
      }

      // Firestore에서 기존 사용자 확인
      const userRef = usersCollection.doc(tokenInfo.sub);
      const userDoc = await userRef.get();
      const isNewUser = !userDoc.exists;

      // 사용자 정보 저장/업데이트
      const user = {
        id: tokenInfo.sub,
        provider: 'google',
        email: tokenInfo.email,
        name: tokenInfo.name,
        givenName: tokenInfo.given_name || '',
        familyName: tokenInfo.family_name || '',
        picture: tokenInfo.picture,
        locale: tokenInfo.locale || '',
        emailVerified: tokenInfo.email_verified === 'true',
        lastLogin: new Date().toISOString(),
        ...(isNewUser ? {
          createdAt: new Date().toISOString(),
          credits: 10,
          signupSource: signup_source || '',
          ...(acquisition && (acquisition.referrer || acquisition.landing_url) ? { acquisition } : {}),
        } : {}),
      };

      await userRef.set(user, { merge: true });
      log(`[Auth] ${isNewUser ? '신규 가입 (+10c 보너스)' : '로그인'}: ${user.email}`);

      // 현재 크레딧 조회
      const updatedDoc = await userRef.get();
      const credits = updatedDoc.data()?.credits ?? 0;

      // 크로스도메인 세션 쿠키 세팅
      const { token: sessionToken } = generateAuthToken(user.id, 30 * 24 * 60 * 60 * 1000);
      res.setHeader('Set-Cookie',
        `monkos_session=${sessionToken}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          credits,
          provider: 'google',
          isAdmin: ADMIN_UIDS.length > 0 && ADMIN_UIDS.includes(user.id),
        }
      }));
    } catch (err) {
      log(`[Auth] 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// === 크로스 도메인 인증 토큰 생성 — /api/auth/token (POST) ===
export async function handleAuthToken(req, res) {
  // N-1 페일클로즈: 세션 쿠키로 본인 확인 후에만 토큰 발급
  const cookies = parseCookies(req.headers.cookie);
  const sessionToken = cookies.monkos_session;
  if (!sessionToken) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '인증 필요 (세션 쿠키 없음)' }));
    return;
  }

  const session = verifyAuthToken(sessionToken);
  if (!session) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '유효하지 않은 세션' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { userId } = JSON.parse(body);
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userId 필수' }));
        return;
      }

      if (session.userId !== userId) {
        log(`[Auth] 토큰 발급 거부: 세션(${session.userId}) ≠ 요청(${userId})`, 'WARNING');
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '본인의 userId만 토큰 발급 가능' }));
        return;
      }

      // 5분 만료 HMAC 토큰
      const expires = Date.now() + 5 * 60 * 1000;
      const payload = `${userId}:${expires}`;
      const hmac = createHmac('sha256', authSecret);
      hmac.update(payload);
      const sig = hmac.digest('hex');
      const token = Buffer.from(`${payload}:${sig}`).toString('base64url');

      log(`[Auth] 토큰 생성: ${userId} (만료: ${new Date(expires).toISOString()})`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ token, expires }));
    } catch (err) {
      log(`[Auth] 토큰 생성 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
}

// === 크로스 도메인 인증 토큰 검증 — /api/auth/verify (GET) ===
export async function handleAuthVerify(req, res) {
  const urlParams = new URL(req.url, `http://${effectiveHost(req)}`);
  const token = urlParams.searchParams.get('token');

  if (!token) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'token 파라미터 필수' }));
    return;
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) throw new Error('토큰 형식 오류');

    const [userId, expiresStr, sig] = parts;
    const expires = parseInt(expiresStr, 10);

    // 만료 체크
    if (Date.now() > expires) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '토큰 만료' }));
      return;
    }

    // 서명 검증 (authSecret 사용)
    const hmac = createHmac('sha256', authSecret);
    hmac.update(`${userId}:${expiresStr}`);
    const expectedSig = hmac.digest('hex');

    if (sig !== expectedSig) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '토큰 검증 실패' }));
      return;
    }

    // Firestore에서 사용자 정보 조회
    const userRef = usersCollection.doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '사용자 없음' }));
      return;
    }

    const userData = userDoc.data();
    log(`[Auth] 토큰 검증 성공: ${userId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      user: {
        id: userId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        credits: userData.credits ?? 0,
      }
    }));
  } catch (err) {
    log(`[Auth] 토큰 검증 에러: ${err.message}`);
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === 토큰 갱신 API (장기 세션용) — /api/auth/refresh (POST) ===
export async function handleAuthRefresh(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { token } = JSON.parse(body);
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'token 필수' }));
        return;
      }

      // 만료 허용 검증 (30일 이내)
      const decoded = verifyAuthToken(token, {
        allowExpired: true,
        maxAgeMs: 30 * 24 * 60 * 60 * 1000,
      });
      if (!decoded) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'invalid_token' }));
        return;
      }

      // Firestore에서 사용자 존재 확인
      const userRef = usersCollection.doc(decoded.userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'user_not_found' }));
        return;
      }

      // 새 토큰 발급 (30일 만료)
      const userData = userDoc.data();
      const newToken = generateAuthToken(decoded.userId, 30 * 24 * 60 * 60 * 1000);

      log(`[Auth] 토큰 갱신: ${decoded.userId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        token: newToken.token,
        expires: newToken.expires,
        user: {
          id: decoded.userId,
          name: userData.name || '',
          email: userData.email || '',
          picture: userData.picture || '',
          credits: userData.credits ?? 0,
          provider: userData.provider || '',
        },
      }));
    } catch (err) {
      log(`[Auth] 토큰 갱신 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

// === 쿠키 기반 세션 검증 — /api/auth/verify-cookie (GET) ===
export async function handleVerifyCookie(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies['monkos_session'];

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'no session' }));
  }

  const result = verifyAuthToken(token);
  if (!result) {
    // 만료된 쿠키 삭제
    res.setHeader('Set-Cookie',
      'monkos_session=; Domain=.monkos.ai; Path=/; Max-Age=0');
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'invalid token' }));
  }

  // 에이전트 세션 (POST /auth/agent 발급분) — users 컬렉션에 문서가 없으므로 조회 전에 처리 (2026-08-26).
  // 이게 없으면 서버 가드는 통과해도 어드민 페이지의 클라이언트 게이트가 로그인 화면을 띄운다
  // (= 에이전트 로그인 기능의 나머지 절반).
  if (typeof result.userId === 'string' && result.userId.startsWith('agent_')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      user: { id: result.userId, email: '', name: result.userId, picture: '', credits: 0, provider: 'agent', isAdmin: true, isAgent: true },
    }));
  }

  try {
    const userDoc = await usersCollection.doc(result.userId).get();
    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'user not found' }));
    }

    const userData = userDoc.data();
    const isAdmin = ADMIN_UIDS.length > 0 && ADMIN_UIDS.includes(result.userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: {
        id: result.userId,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        credits: userData.credits ?? 0,
        provider: userData.provider || '',
        isAdmin,
      }
    }));
  } catch (err) {
    log(`[Auth] verify-cookie 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === 로그아웃 — POST /api/auth/logout ===
export async function handleLogout(req, res) {
  res.setHeader('Set-Cookie',
    'monkos_session=; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0'
  );
  log('[Auth] 로그아웃 — 세션 쿠키 삭제');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}
