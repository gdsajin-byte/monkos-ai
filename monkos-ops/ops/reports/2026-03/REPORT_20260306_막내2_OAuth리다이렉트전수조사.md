---
type: REPORT
date: 2026-03-06
from: M1/막내2
to: M1/쌍아, 작가님
scope: OAuth 3종 리다이렉트 설정 전수조사 + LINE 포털 리다이렉트 버그 분석
ref: ORDER_20260306_M1쌍아_막내2_OAuth리다이렉트전수조사.md
---

# OAuth 리다이렉트 전수조사 보고서

> **[2026-03-06 09:42 KST] M1/막내2 -> 작가님, M1/쌍아**

---

## Phase A: 현황 전수조사

### A-1. OAuth 3종 리다이렉트 흐름 전체 매핑

#### Google (GIS 방식 -- 리다이렉트 없음)

```
[idphoto-kr] gate.js _startGoogleLoginSimple()
  -> google.accounts.oauth2.initTokenClient() -- GIS 팝업 (Google 관리)
  -> callback: access_token 수신
  -> fetch POST ${PORTAL_URL}/api/auth/google { access_token }
  -> 포털 auth.js handleGoogleAuth(): tokeninfo 검증 -> Firestore 저장 -> JSON 응답
  -> gate.js: store.user 설정 + _fireLoginCallback()
```

- **리다이렉트 자체가 없음** -- Google Identity Services(GIS)가 자체 팝업으로 OAuth 처리
- 포털은 POST API만 제공 (`/api/auth/google`)
- `redirect_uri` 설정 불필요 (GIS가 내부 처리)
- **이슈 없음**

#### Kakao (팝업 + 폴백)

```
[idphoto-kr] gate.js 카카오 버튼 클릭
  -> window.open('about:blank') -- 팝업 선점 (iOS user gesture)
  -> popup.location.href = ${PORTAL_URL}/auth/kakao?popup=1&redirect_app=idphoto-kr

[팝업 차단 시]
  -> window.location.href = ${PORTAL_URL}/auth/kakao  (popup=1 없음!)

[포털] auth.js handleKakaoAuth()
  -> state = base64url({ popup, redirectApp })
  -> effectiveRedirect = https://${host}/auth/kakao/callback
  -> 302 -> kauth.kakao.com/oauth/authorize?...&state=...

[카카오 인증 완료]
  -> 302 -> https://monkos.ai/auth/kakao/callback?code=...&state=...

[포털] auth.js handleKakaoCallback()
  -> state 디코딩 -> { popup: true/false, redirectApp: 'idphoto-kr' }
  -> 토큰 교환 + Firestore 저장

  [popup=true]
    -> targetOrigin = ALLOWED_POPUP_ORIGINS.includes('idphoto-kr')
       ? 'idphoto-kr' : 'https://monkos.ai'
    -> 'idphoto-kr'는 ALLOWED_POPUP_ORIGINS에 없음 (전체 URL만 등록)
    -> targetOrigin = 'https://monkos.ai' (폴백)
    -> postMessage(data, 'https://monkos.ai')  <<<< BUG 1
    -> opener는 https://idphoto-kr.monkos.ai -> 브라우저가 메시지 드롭!

  [popup=false (팝업 차단 폴백)]
    -> location.href = '/'  <<<< BUG 2 (포털 루트로 이동)
```

#### LINE (팝업 + 폴백) -- 보고된 버그

```
[idphoto-kr] gate.js LINE 버튼 클릭
  -> window.open('about:blank') -- 팝업 선점
  -> popup.location.href = ${PORTAL_URL}/auth/line?popup=1&redirect_app=idphoto-kr

[팝업 차단 시]
  -> window.location.href = ${PORTAL_URL}/auth/line  (popup=1 없음!)

[포털] auth.js handleLineAuth()
  -> state = base64url({ csrf, popup, redirectApp })
  -> effectiveLineRedirect = https://${host}/auth/line/callback
  -> 302 -> access.line.me/oauth2/v2.1/authorize?...&state=...

[LINE 인증 완료]
  -> 302 -> https://monkos.ai/auth/line/callback?code=...&state=...

[포털] auth.js handleLineCallback()
  -> state 디코딩 -> { csrf, popup: true/false, redirectApp: 'idphoto-kr' }
  -> CSRF 검증 + 토큰 교환 + Firestore 저장

  [popup=true]
    -> targetOrigin = ALLOWED_POPUP_ORIGINS.includes('idphoto-kr')
       ? 'idphoto-kr' : 'https://monkos.ai'
    -> targetOrigin = 'https://monkos.ai' (폴백)
    -> postMessage(data, 'https://monkos.ai')  <<<< BUG 1 (동일)

  [popup=false (팝업 차단 폴백)]
    -> location.href = '/'  <<<< BUG 2 (auth.js L328 -- 포털 루트로 이동)
```

### A-2. 프로바이더별 확인 사항 (완성)

| 항목 | Google | Kakao | LINE |
|------|--------|-------|------|
| 로그인 진입 (gate.js) | GIS initTokenClient (자체 팝업) | window.open -> `/auth/kakao?popup=1&redirect_app=idphoto-kr` | window.open -> `/auth/line?popup=1&redirect_app=idphoto-kr` |
| OAuth redirect_uri | 없음 (GIS 내부) | `https://${host}/auth/kakao/callback` (동적) | `https://${host}/auth/line/callback` (동적) |
| 콜백 처리 (auth.js) | POST JSON 응답 | HTML + postMessage or location.href | HTML + postMessage or location.href |
| popup=1 전달 여부 | N/A | O (팝업 OK시) / X (차단시) | O (팝업 OK시) / X (차단시) |
| postMessage targetOrigin | N/A | **BUG: 'https://monkos.ai'** (should be idphoto-kr) | **BUG: 'https://monkos.ai'** (should be idphoto-kr) |
| non-popup 폴백 동작 | N/A | **location.href = '/' (포털 루트)** | **location.href = '/' (포털 루트)** |
| 최종 복귀 URL (정상) | idphoto-kr (자체 처리) | **idphoto-kr (팝업 성공 시에도 postMessage 실패)** | **monkos.ai (BUG)** |

### A-3. 외부 콘솔 설정 (코드 기준)

| 프로바이더 | 코드 상 redirect_uri | 콘솔 확인 필요 여부 |
|-----------|---------------------|-------------------|
| Google | 없음 (GIS 방식: POST API만 사용) | GOOGLE_CLIENT_ID의 authorized JavaScript origins에 `https://idphoto-kr.monkos.ai` 등록 필요 -- **콘솔 확인** |
| Kakao | `https://monkos.ai/auth/kakao/callback` (동적: `https://${host}/auth/kakao/callback`) | Kakao Developers -> redirect_uri에 해당 URL 등록 확인 -- **콘솔 확인** |
| LINE | `https://monkos.ai/auth/line/callback` (동적: `https://${host}/auth/line/callback`) | LINE Developers -> Callback URL에 해당 URL 등록 확인 -- **콘솔 확인** |

**config.js 기본값** (환경변수 미설정 시):
- `KAKAO_REDIRECT_URI`: `https://monkos.ai/auth/kakao/callback` (L44)
- `LINE_REDIRECT_URI`: `https://monkos.ai/auth/line/callback` (L50)

> 주의: auth.js에서는 config.js의 `KAKAO_REDIRECT_URI` / `LINE_REDIRECT_URI`를 **사용하지 않음**.
> 대신 `https://${req.headers.host}/auth/kakao/callback`으로 동적 생성.
> config.js의 값은 로그 메시지에만 사용 (auth.js L47).

---

## Phase B: LINE 포털 리다이렉트 버그 분석

### B-1. 원인 특정

**직접 원인: 2개의 버그가 동시 존재**

#### BUG 1: postMessage targetOrigin 불일치 (팝업 모드)

**파일**: `portal/lib/auth.js`
- Kakao: L121-123
- LINE: L285-287

```js
const targetOrigin = ALLOWED_POPUP_ORIGINS.includes(lineStateData.redirectApp)
  ? lineStateData.redirectApp
  : 'https://monkos.ai';
```

- `redirectApp` = `'idphoto-kr'` (gate.js에서 전달)
- `ALLOWED_POPUP_ORIGINS` = `['https://idphoto-kr.monkos.ai', 'https://idphoto-jp.monkos.ai', 'https://monkos.ai']`
- `'idphoto-kr'` !== `'https://idphoto-kr.monkos.ai'` -> includes 실패
- `targetOrigin` = `'https://monkos.ai'` (폴백)
- `postMessage(data, 'https://monkos.ai')` but opener origin is `https://idphoto-kr.monkos.ai`
- **브라우저가 origin 불일치로 메시지를 무시** (보안 정책)
- 결과: 팝업은 닫히지만, 부모 윈도우에 인증 정보가 전달되지 않음

#### BUG 2: non-popup 폴백에서 원래 앱으로 복귀 불가

**파일**: `portal/lib/auth.js`
- Kakao: L152-155
- LINE: L316-329

```js
// non-popup 폴백
sessionStorage.setItem('monkos_user', JSON.stringify(userObj));
location.href = '/';  // <- 포털 루트!
```

**그리고** gate.js에서 팝업 차단 시:
- Kakao: gate.js L70-71: `window.location.href = ${PORTAL_URL}/auth/kakao` (popup=1 없음)
- LINE: gate.js L95-96: `window.location.href = ${PORTAL_URL}/auth/line` (popup=1 없음)

팝업 차단 -> popup=1 미전달 -> state에 popup=false -> non-popup 분기 -> `location.href = '/'` on monkos.ai -> **포털 루트로 이동**

### B-2. 작가님 발견 시나리오 재현 경로

가장 유력한 시나리오:
1. iOS Safari / 모바일 브라우저에서 팝업 차단
2. gate.js L95-96: `window.location.href = ${PORTAL_URL}/auth/line` (popup=1 없음)
3. 전체 페이지가 monkos.ai로 이동
4. LINE 인증 완료
5. handleLineCallback: popup=false -> `location.href = '/'`
6. monkos.ai 포털 루트에 도착

### B-3. Google, Kakao 동일 이슈 여부

| 프로바이더 | BUG 1 (postMessage targetOrigin) | BUG 2 (non-popup 폴백) |
|-----------|--------------------------------|----------------------|
| Google | 해당 없음 (GIS 방식) | 해당 없음 |
| Kakao | **동일 버그** (auth.js L121-123) | **동일 버그** (auth.js L152-155, gate.js L70-71) |
| LINE | **동일 버그** (auth.js L285-287) | **동일 버그** (auth.js L316-329, gate.js L95-96) |

Google만 안전. **Kakao와 LINE은 동일한 2개 버그를 공유.**

### B-4. 현재 로그인이 "작동하는 것처럼 보이는" 이유

쿠키 기반 인증이 별도로 존재:
```js
res.setHeader('Set-Cookie',
  `monkos_session=${token}; Domain=.monkos.ai; Path=/; ...`);
```

- 쿠키 Domain이 `.monkos.ai` -> 모든 서브도메인에서 공유
- 팝업 모드에서 postMessage가 실패해도, 쿠키는 설정됨
- 사용자가 idphoto-kr로 수동 복귀 또는 새로고침하면 `initCredits()` -> `/api/auth/verify-cookie` -> 로그인 상태 복원
- **즉, 로그인 자체는 되지만 UX가 깨짐** (즉시 반영 안 됨, 포털로 빠짐)

---

## Phase C: 수정 제안

### C-1. BUG 1 수정 -- postMessage targetOrigin

**gate.js 측 수정** (권장):

`redirect_app` 파라미터를 full origin URL로 전달:
```js
// 현행
popup.location.href = `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=idphoto-kr`;

// 수정
popup.location.href = `${API.PORTAL_URL}/auth/line?popup=1&redirect_app=${encodeURIComponent(window.location.origin)}`;
```

또는 **auth.js 측 수정** (대안):

`redirectApp`이 짧은 이름일 때 전체 URL로 변환:
```js
const APP_ORIGIN_MAP = {
  'idphoto-kr': 'https://idphoto-kr.monkos.ai',
  'idphoto-jp': 'https://idphoto-jp.monkos.ai',
};
const targetOrigin = APP_ORIGIN_MAP[redirectApp]
  || (ALLOWED_POPUP_ORIGINS.includes(redirectApp) ? redirectApp : 'https://monkos.ai');
```

### C-2. BUG 2 수정 -- non-popup 폴백 원래 앱 복귀

**gate.js 측 수정**:

팝업 차단 시에도 `redirect_app` 전달:
```js
// 현행
window.location.href = `${API.PORTAL_URL}/auth/line`;

// 수정
window.location.href = `${API.PORTAL_URL}/auth/line?redirect_app=${encodeURIComponent(window.location.origin)}`;
```

**auth.js 측 수정** (Kakao / LINE 공통):

non-popup 분기에서 `redirectApp`을 사용하여 원래 앱으로 복귀:
```js
// 현행
location.href = '/';

// 수정
const returnUrl = redirectApp || '/';
// ALLOWED_POPUP_ORIGINS에 등록된 URL만 허용 (오픈 리다이렉트 방지)
location.href = ALLOWED_ORIGINS.includes(returnUrl) ? returnUrl : '/';
```

### C-3. JP 클론 시 필요한 redirect_uri 추가 목록

idphoto-jp는 현재 SPA 방식(index.html 인라인)이고, gate.js 모듈을 사용하지 않음.

| 항목 | 현행 JP | 수정 필요 |
|------|---------|----------|
| LINE 로그인 | `location.href = '/auth/line'` (L1390) -- 자체 서버 경로? 포털 아님 | portal 경유로 변경 필요 or JP Cloud Run에 자체 auth 라우트 필요 |
| Google 로그인 | `PORTAL_URL + '/auth/google?returnTo=...'` (L1420) -- portal에 `/auth/google` GET 라우트 없음 (POST만) | GET 라우트 추가 or GIS 방식으로 전환 |
| Kakao 로그인 | 없음 (JP에서는 Kakao 미사용) | N/A |

**외부 콘솔 추가 등록 목록**:

| 콘솔 | 현재 등록 (추정) | JP 추가 필요 |
|------|-----------------|-------------|
| Google Cloud Console - authorized JS origins | `https://idphoto-kr.monkos.ai`, `https://monkos.ai` | `https://idphoto-jp.monkos.ai` |
| LINE Developers - Callback URL | `https://monkos.ai/auth/line/callback` | JP 독자 auth시: `https://idphoto-jp.monkos.ai/auth/line/callback` |
| Kakao Developers - redirect_uri | `https://monkos.ai/auth/kakao/callback` | N/A (JP에서 Kakao 미사용) |

### C-4. 우선순위 정리

| 순위 | 버그 | 영향 | 수정 범위 |
|------|------|------|----------|
| P0 | BUG 2: non-popup 폴백 포털 이동 | LINE/Kakao 팝업 차단 환경에서 idphoto-kr 이탈 | gate.js (2곳) + auth.js (2곳) |
| P1 | BUG 1: postMessage targetOrigin 불일치 | 팝업 성공 시에도 인증 즉시 반영 안 됨 (수동 새로고침 필요) | gate.js (4곳) or auth.js (2곳) |
| P2 | JP 로그인 체계 정비 | JP 서비스 로그인 불가/불완전 | 별도 설계 필요 |

---

## 수정 파일 목록 (예상 -- 이 보고서에서 코드 수정 없음)

| # | 파일 | 수정 내용 |
|---|------|----------|
| 1 | `idphoto-kr/public/modules/gate.js` | redirect_app을 full origin URL로 변경 (4곳), non-popup 폴백에 redirect_app 추가 (2곳) |
| 2 | `portal/lib/auth.js` | targetOrigin 매핑 로직 수정 (2곳), non-popup 분기에서 redirectApp 기반 복귀 (2곳) |
| 3 | `portal/lib/shared/config.js` | ALLOWED_POPUP_ORIGINS 정합성 검토 (변경 불필요 가능) |
