---
type: ORDER
date: 2026-02-25
from: iMac/쌍아
to: 막내3
status: pending
priority: normal
---

# 지시서: idphoto-kr 헤더 모듈 고도화 — 백엔드 (포털 서버)

**[2026-02-25 15:52 KST] iMac/쌍아 → 막내3**

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내3 → iMac/쌍아` 형식

## 배경

idphoto-kr 헤더 고도화(막내2 프론트엔드 작업)에 필요한 **포털 서버 백엔드 지원**을 구현한다.

핵심: idphoto-kr에서 **페이지 이탈 없이** OAuth 로그인을 완료할 수 있도록, 포털 서버의 Kakao/LINE OAuth 콜백에 **팝업 모드**를 추가한다.

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/server.js` | 포털 서버 (OAuth 라우트 포함) |
| `monkos_AI/portal/public/index.html` | 포털 프론트 (참조) |
| `monkos_AI/idphoto-kr/public/config.js` | idphoto-kr API 설정 (참조) |
| `functions/api/auth.js` | CF Workers OAuth (참조, monk.kr용) |

## 작업 내용

### 1. Kakao OAuth — 팝업 모드 지원

현재 `/auth/kakao` → Kakao 인증 → `/auth/kakao/callback` → 홈으로 리다이렉트.

**변경: `popup=1` 쿼리 파라미터 감지 시 팝업 응답으로 전환.**

**/auth/kakao 라우트 수정:**
```javascript
app.get('/auth/kakao', (req, res) => {
    const popup = req.query.popup === '1';
    const redirectApp = req.query.redirect_app || '';

    // state에 popup 플래그 포함
    const state = JSON.stringify({ popup, redirectApp });
    const stateEncoded = Buffer.from(state).toString('base64');

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?...&state=${stateEncoded}`;
    res.redirect(kakaoAuthUrl);
});
```

**/auth/kakao/callback 수정:**
```javascript
app.get('/auth/kakao/callback', async (req, res) => {
    // ... 기존 토큰 교환 + 사용자 저장 로직 유지 ...

    const state = JSON.parse(Buffer.from(req.query.state, 'base64').toString());

    if (state.popup) {
        // 팝업 모드: postMessage로 부모 윈도우에 전달 후 자동 닫힘
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>로그인 완료</title></head>
            <body>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'auth-success',
                            user: ${JSON.stringify(user)},
                            token: '${token}'
                        }, 'https://idphoto-kr.monkos.ai');
                        window.close();
                    } else {
                        // 팝업이 아닌 경우 폴백
                        location.href = 'https://idphoto-kr.monkos.ai?uid=${user.id}&token=${token}';
                    }
                </script>
            </body>
            </html>
        `);
        return;
    }

    // 기존 리다이렉트 방식 유지 (비팝업)
    // ... 기존 코드 ...
});
```

### 2. LINE OAuth — 팝업 모드 지원

Kakao와 동일 패턴. `/auth/line` + `/auth/line/callback`에 `popup=1` 분기 추가.

- state 파라미터에 popup 플래그 인코딩 (LINE은 CSRF 방지용 state를 이미 사용 — 기존 값에 popup 정보를 합성)
- 콜백에서 postMessage 응답

### 3. CORS 설정

idphoto-kr → 포털 API 호출에 필요한 CORS 헤더 확인 및 보강.

**확인 대상 엔드포인트:**
- `POST /api/auth/google` — Google 토큰 검증
- `GET /api/auth/verify` — 토큰 검증
- `GET /api/credits` — 크레딧 조회
- `POST /api/chat` — 챗봇

**CORS 설정:**
```javascript
const allowedOrigins = [
    'https://monkos.ai',
    'https://idphoto-kr.monkos.ai',
    'https://idphoto-jp.monkos.ai',
    'http://localhost:3000',  // 개발용
    'http://localhost:8080',  // 개발용
];

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
```

- 기존 CORS 설정이 있으면 `idphoto-kr.monkos.ai` 추가만.
- 없으면 위 미들웨어 추가.

### 4. 토큰 갱신 API

현재 HMAC 토큰 만료: 5분. 이건 포털→앱 전달용.
idphoto-kr의 자동 로그인용 **장기 토큰**이 필요.

**신규 API: `POST /api/auth/refresh`**
```javascript
app.post('/api/auth/refresh', async (req, res) => {
    const { token } = req.body;

    // 1. 기존 토큰 검증 (만료 허용 — 30일 이내만)
    const decoded = verifyToken(token, { allowExpired: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    if (!decoded) return res.json({ success: false, error: 'invalid_token' });

    // 2. Firestore에서 사용자 존재 확인
    const user = await getUser(decoded.id);
    if (!user) return res.json({ success: false, error: 'user_not_found' });

    // 3. 새 토큰 발급 (30일 만료)
    const newToken = generateToken(user, 30 * 24 * 60 * 60 * 1000);

    res.json({
        success: true,
        token: newToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            credits: user.credits,
            provider: user.provider
        }
    });
});
```

- 만료 기간: **30일** (작가님 확인 완료)
- 기존 5분 HMAC 토큰과 별개 — 이건 장기 세션용
- 보안: 토큰 재발급 시 이전 토큰 무효화 (선택, 구현 복잡도에 따라)
- **[후속 고도화]** 현재는 단일 토큰 갱신 방식이나, 스케일 시 access/refresh 이중 토큰 분리 필요. 단일 토큰으로 만료 허용 갱신은 탈취 시 무한 갱신 리스크 있음. 당장은 현행 유지, 인증 고도화 스프린트에서 분리 예정.

### 5. postMessage origin 화이트리스트

팝업 콜백의 `postMessage` target origin 보안:

```javascript
// 허용 origin만 전달
const ALLOWED_POPUP_ORIGINS = [
    'https://idphoto-kr.monkos.ai',
    'https://idphoto-jp.monkos.ai',
    'https://monkos.ai',
];

// 콜백에서:
const targetOrigin = ALLOWED_POPUP_ORIGINS.includes(state.redirectApp)
    ? state.redirectApp
    : 'https://monkos.ai';
```

- `redirect_app` 파라미터를 그대로 신뢰하지 말 것 — 화이트리스트 검증 필수

## ⚠️ 준수 조항

- **헌법 제6조**: OAuth 시크릿(KAKAO_CLIENT_SECRET, LINE_CLIENT_SECRET) 절대 클라이언트에 노출 금지. 서버 환경변수만.
- **헌법 제8조**: 기존 OAuth 로직 삭제 금지. 팝업 분기만 추가.
- **ch5 배포**: develop 브랜치 커밋+push까지. dev 배포는 별도 지시.
- **보안**: postMessage의 origin 검증 필수. 와일드카드(*) 사용 금지.
- idphoto-kr 코드(`monkos_AI/idphoto-kr/`) **수정 금지** — 프론트는 막내2 범위.

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `monkos_AI/portal/server.js` 수정 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |
