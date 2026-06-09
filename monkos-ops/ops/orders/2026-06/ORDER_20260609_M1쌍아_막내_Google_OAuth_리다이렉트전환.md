---
type: order
date: 2026-06-09
device: M1
agent: 쌍아
recipient: 막내
portfolio: PF_PORTAL
status: 발행
priority: 1
---

# Google OAuth 서버사이드 리다이렉트 전환

**[2026-06-09 12:38 KST] M1/쌍아 → 막내**

## 배경 (실서비스 이슈)

네이버 인앱 브라우저(WebView)에서 Google 로그인 시도 시:

```
403 오류: disallowed_useragent
"monkos.ai의 요청이 Google의 '보안 브라우저 사용' 정책을 준수하지 않습니다"
```

- **원인**: 현재 Google 로그인이 클라이언트 팝업 방식(`google.accounts.oauth2.initTokenClient`)으로 구현 → Google이 WebView User-Agent를 감지해서 차단
- **카카오/LINE**: 이미 서버사이드 리다이렉트 방식 → WebView에서 정상 동작
- **해법**: Google도 동일한 서버사이드 리다이렉트(Authorization Code Flow)로 전환

## 원칙

- **기존 `/api/auth/google` POST 엔드포인트 절대 삭제하지 않는다** (하위호환 유지)
- 카카오 패턴(`handleKakaoAuth` → `handleKakaoCallback`)을 **복제**해서 Google 버전 추가
- 클라이언트는 `googleLogin()` 함수 1곳만 변경

## 작업

### 0단계: GCP 콘솔 — 리다이렉트 URI 등록 (작가님 승인 필요)

> ⚠️ 이 단계는 작가님이 직접 하시거나 승인해야 함 (헌법 4조 1항)

1. GCP 콘솔 → APIs & Services → Credentials
2. OAuth 2.0 Client ID `933456016842-clagcrpo1juvukjif1m454jq811bd2rq` 클릭
3. "승인된 리디렉션 URI"에 추가:
   - `https://monkos.ai/auth/google/callback`
4. 저장

> **이 단계 없이 배포하면 Google이 `redirect_uri_mismatch` 에러를 반환한다.**

### 1단계: config.js — Google 시크릿 환경변수 준비

**파일**: `monkos_AI/portal/lib/shared/config.js`

```js
// 기존 GOOGLE_CLIENT_ID 아래에 추가:
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'https://monkos.ai/auth/google/callback';
```

> **GOOGLE_CLIENT_SECRET**: GCP 콘솔 → OAuth 2.0 Client → "클라이언트 보안 비밀"에서 복사.
> Cloud Run 환경변수로 등록 필요. 하드코딩 절대 금지 (헌법 4조 1항).

config.js 하단 export에 `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` 추가.

### 2단계: lib/auth.js — Google 리다이렉트 핸들러 추가

**파일**: `monkos_AI/portal/lib/auth.js`

기존 `handleGoogleAuth` 함수 **위에** 아래 2개 함수 추가. `handleKakaoAuth` / `handleKakaoCallback` 구조를 그대로 따른다.

#### handleGoogleRedirectAuth (신규)

```js
// === Google OAuth 리다이렉트 — /auth/google ===
export async function handleGoogleRedirectAuth(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const popup = parsedUrl.searchParams.get('popup') === '1';
  const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';
  const sourcePage = parsedUrl.searchParams.get('source_page') || '';

  const csrf = randomBytes(16).toString('hex');
  const stateObj = { csrf, popup, redirectApp, sourcePage };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

  pendingLineStates.set(csrf, Date.now());  // LINE과 동일한 CSRF 맵 재사용

  const effectiveRedirect = `https://${req.headers.host}/auth/google/callback`;
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
```

#### handleGoogleRedirectCallback (신규)

```js
// === Google OAuth Callback — /auth/google/callback ===
export async function handleGoogleRedirectCallback(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error || !code) {
    log(`[Google Redirect] OAuth 에러: ${error || 'no code'}`, 'WARNING');
    res.writeHead(302, { Location: '/?error=google_auth_failed' });
    res.end();
    return;
  }

  // state에서 CSRF + 메타 추출
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
    // 1. code → token 교환
    const effectiveRedirect = `https://${req.headers.host}/auth/google/callback`;
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

    // 2. access_token → 사용자 정보
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoRes.json();
    if (!userInfo.sub) throw new Error('사용자 정보 조회 실패');

    // 3. Firestore 저장/업데이트 (기존 handleGoogleAuth와 동일 로직)
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

    const finalDoc = await userRef.get();
    const finalData = finalDoc.data();
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      provider: 'google',
      credits: finalData.credits ?? 0,
      isAdmin: ADMIN_UIDS.length === 0 || ADMIN_UIDS.includes(user.id),
    };

    // 4. 세션 쿠키 + 리다이렉트 (카카오 비팝업 방식 준용)
    const { token: sessionToken } = generateAuthToken(user.id, 30 * 24 * 60 * 60 * 1000);
    res.setHeader('Set-Cookie',
      `monkos_session=${sessionToken}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
    );

    if (stateData.popup) {
      const targetOrigin = ALLOWED_POPUP_ORIGINS.includes(stateData.redirectApp)
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
      const returnUrl = ALLOWED_POPUP_ORIGINS.includes(stateData.redirectApp) ? stateData.redirectApp : '/';
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
```

**import 추가**: config.js에서 `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` import.

### 3단계: server.js — 라우트 등록

**파일**: `monkos_AI/portal/server.js`

#### import 수정 (27행)

기존:
```js
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleAuth, ...
```

변경:
```js
import { handleKakaoAuth, handleKakaoCallback, handleLineAuth, handleLineCallback, handleGoogleAuth, handleGoogleRedirectAuth, handleGoogleRedirectCallback, ...
```

#### 라우트 추가 (118행 뒤)

```js
  if (req.url === '/auth/google' || req.url?.startsWith('/auth/google?')) return handleGoogleRedirectAuth(req, res);
  if (req.url?.startsWith('/auth/google/callback')) return handleGoogleRedirectCallback(req, res);
```

> 기존 `/api/auth/google` POST (119행)는 **그대로 유지**.

### 4단계: public/js/auth.js — googleLogin() 변경

**파일**: `monkos_AI/portal/public/js/auth.js`

`window.googleLogin` 함수 (101~124행) 전체를 아래로 교체:

```js
window.googleLogin = function() {
  var params = 'source_page=' + encodeURIComponent(window.location.hostname + window.location.pathname);
  location.href = '/auth/google?' + params;
};
```

> GIS 스크립트 로딩(`loadGIS`, `loadGISWithRetry`, `initGoogleAuth`) 함수들은 삭제하지 않는다 (하위호환).
> `googleLogin()`만 리다이렉트 방식으로 변경.

### 5단계: Cloud Run 환경변수

> 작가님 승인 후 실행 (헌법 4조 1항)

```bash
gcloud run services update monkos-portal \
  --region us-central1 \
  --update-env-vars "GOOGLE_CLIENT_SECRET=<GCP 콘솔에서 복사한 값>"
```

### 6단계: 배포 + 검증

```bash
monkos_AI/portal/deploy.sh prod
```

#### 검증 체크리스트

| # | 테스트 | 방법 | 기대 |
|---|--------|------|------|
| 1 | 일반 크롬에서 Google 로그인 | PC Chrome → monkos.ai → Google 로그인 | ✅ 리다이렉트 → 계정선택 → 로그인 성공 |
| 2 | Safari에서 Google 로그인 | iPhone Safari → monkos.ai → Google 로그인 | ✅ 동일 |
| 3 | 네이버 인앱에서 Google 로그인 | 네이버 앱 → monkos.ai 링크 → Google 로그인 | ✅ **403 없이** 동작 |
| 4 | 카카오 로그인 (회귀) | 기존 카카오 로그인 정상 여부 | ✅ 영향 없음 |
| 5 | LINE 로그인 (회귀) | 기존 LINE 로그인 정상 여부 | ✅ 영향 없음 |
| 6 | idphoto-kr에서 Google 로그인 | idphoto-kr.monkos.ai → 로그인 | ✅ popup 모드 동작 |
| 7 | 기존 세션 유지 | 이미 로그인된 사용자 세션 | ✅ verify-cookie 정상 |

#### 네이버 인앱 테스트 방법
1. 네이버 앱 열기
2. 검색창에 `monkos.ai` 입력하여 사이트 접속
3. Google 로그인 버튼 클릭
4. Google 계정 선택 → 로그인 완료 확인

## ⚠️ 준수 조항

- **헌법 4조 1항**: GOOGLE_CLIENT_SECRET은 GCP 콘솔에서 복사. 생성/추측 금지
- **헌법 4조 1항**: Cloud Run 환경변수 등록은 작가님 승인 후
- **ch5 2조**: 배포는 deploy.sh 경유 필수
- **하위호환**: 기존 `/api/auth/google` POST, GIS 관련 함수 삭제 금지

## 참조 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/shared/config.js` | +2행 (환경변수) |
| `monkos_AI/portal/lib/auth.js` | +2함수 (~100행 추가), import 추가 |
| `monkos_AI/portal/server.js` | +2행 (라우트), import 수정 |
| `monkos_AI/portal/public/js/auth.js` | googleLogin() 4행으로 교체 |

## 완료 보고

- COMPLETION 생성 → `monkos-ops/ops/completions/2026-06/`
- 검증 체크리스트 7건 전수 결과 기록
- PF_PORTAL 히스토리 1행 어펜드
- 커밋 → 푸시
