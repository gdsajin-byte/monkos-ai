---
type: DESIGN
date: 2026-02-27
time: "17:40 KST"
from: iMac/쌍아
status: draft
priority: P0
scope: portal + idphoto-kr
---

# 크로스도메인 세션 통합 설계서

> **[2026-02-27 17:40 KST] iMac/쌍아 → 작가님**
> 포탈(monkos.ai) ↔ 앱(idphoto-kr.monkos.ai) 간 로그인 유지 + 크레딧 실시간 동기화.
> 작가님 승인 후 착수.

---

## 1. 현재 문제

| 증상 | 원인 |
|------|------|
| 포탈/앱 크레딧 금액 불일치 | 포탈=localStorage, 앱=sessionStorage, 다른 origin이라 공유 불가 |
| 포탈→앱 이동 시 로그인 풀림 | 인증 전달이 팝업 postMessage 경유만 가능, 일반 이동 시 세션 단절 |
| 충전 후 앱 복귀 시 옛 잔액 표시 | sessionStorage 캐시값이 갱신 안 됨 (visibilitychange는 user.id 있을 때만 동작) |
| credits.html 복귀 URL 검증에 idphoto-kr 누락 | isSafeReturnUrl() 화이트리스트에 서브도메인 미포함 |

---

## 2. 해결 전략: `.monkos.ai` 상위 도메인 쿠키

### 왜 쿠키인가

| 방식 | 장점 | 단점 |
|------|------|------|
| ~~URL 토큰 전달~~ | 구현 간단 | 매 이동마다 토큰 부착 필요, URL 노출 |
| ~~postMessage~~ | 이미 구현됨 | 팝업 경유만 가능, 일반 이동 불가 |
| **상위 도메인 쿠키** | 자동 전달, 일반 이동에도 동작 | SameSite/Secure 설정 필요 |

`monkos.ai`와 `idphoto-kr.monkos.ai`는 모두 `.monkos.ai` 하위.
`Domain=.monkos.ai` 쿠키를 세팅하면 **양쪽 도메인에서 자동으로** 쿠키가 전달됨.

---

## 3. 아키텍처

```
[사용자 로그인]
     │
     ▼
[OAuth 콜백 (portal)]
     │
     ├── sessionStorage에 user 저장 (기존 유지)
     └── Set-Cookie: monkos_session={token}
              Domain=.monkos.ai
              Secure; HttpOnly; SameSite=Lax
              Max-Age=2592000 (30일)
     │
     ▼
[앱 페이지 로드 (idphoto-kr.monkos.ai)]
     │
     ├── sessionStorage에 user 있음? → 그대로 사용 (기존 로직)
     └── sessionStorage 비어있음? → 쿠키 존재 확인
              │
              ▼
         GET /api/auth/verify-cookie (credentials: include)
              │
              ├── 쿠키 토큰 유효 → { user, credits } 반환 → sessionStorage 복원
              └── 쿠키 토큰 무효 → 비로그인 상태 유지
```

---

## 4. 변경 사항 (최소 침습)

### A. 포탈 서버 (3곳)

**A-1. auth.js — OAuth 콜백에서 쿠키 세팅**

기존 OAuth 콜백(Google/카카오/LINE) 성공 시, 응답에 `Set-Cookie` 추가:

```javascript
// OAuth 콜백 성공 후 (팝업/비팝업 공통)
const { token } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000); // 30일
res.setHeader('Set-Cookie',
  `monkos_session=${token}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
);
```

- `HttpOnly`: JS에서 직접 접근 불가 (XSS 방어)
- `Secure`: HTTPS에서만 전송
- `SameSite=Lax`: 일반 이동(GET) 시 쿠키 전송, POST CSRF 차단
- `Max-Age=2592000`: 30일

**A-2. auth.js — /api/auth/verify-cookie 엔드포인트 신설**

```javascript
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

  // Firestore에서 최신 사용자 정보 + 크레딧 조회
  const userDoc = await usersCollection.doc(result.userId).get();
  if (!userDoc.exists) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'user not found' }));
  }

  const userData = userDoc.data();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    user: {
      id: result.userId,
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      credits: userData.credits ?? 0,
    }
  }));
}
```

**A-3. server.js — 라우트 추가**

```javascript
'/api/auth/verify-cookie': (req, res) => handleVerifyCookie(req, res),
```

### B. 앱 프론트 (2곳)

**B-1. shared.js — initCredits() 보강**

```javascript
export async function initCredits() {
  // 1차: sessionStorage 확인 (기존 로직 유지)
  const stored = sessionStorage.getItem('monkos_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user.id) {
        store.user = { id: user.id, email: user.email, name: user.name || '', credits: user.credits ?? 0, avatar: user.avatar || user.picture || '' };
        Monk.log(`로그인: ${user.email} (${store.user.credits}c)`);
        fetchLatestCredits(); // 서버 최신값 동기화
        return;
      }
    } catch (e) {}
  }

  // 2차: 쿠키 세션 복원 시도 (신규)
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/auth/verify-cookie`, {
      credentials: 'include',  // ← 쿠키 전송
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id) {
        store.user = { id: data.user.id, email: data.user.email, name: data.user.name || '', credits: data.user.credits ?? 0, avatar: data.user.picture || '' };
        sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
        Monk.log(`쿠키 세션 복원: ${data.user.email} (${data.user.credits}c)`);
        return;
      }
    }
  } catch (e) {
    Monk.log('쿠키 세션 복원 실패 (무시)');
  }

  Monk.log('비로그인 상태');
}
```

**B-2. index.html — updateAuthUI()에서 쿠키 복원 트리거**

`sharedInit()` 호출 시 `initCredits()`가 async로 변경되므로, UI 갱신을 콜백으로 처리:

```javascript
// sharedInit 완료 후 UI 갱신
await initCredits();
updateAuthUI();
```

### C. 포탈 프론트 (1곳)

**C-1. credits.html — returnUrl 화이트리스트 수정**

```javascript
// 변경 전
var allowed = ['monkos.ai', 'www.monkos.ai', 'monk.kr', 'www.monk.kr'];

// 변경 후
var allowed = ['monkos.ai', 'www.monkos.ai', 'monk.kr', 'www.monk.kr',
               'idphoto-kr.monkos.ai', 'idphoto-jp.monkos.ai'];
```

### D. 로그아웃 처리

포탈에서 로그아웃 시 쿠키도 삭제:

```javascript
// 기존 로그아웃 + 쿠키 삭제
res.setHeader('Set-Cookie',
  'monkos_session=; Domain=.monkos.ai; Path=/; Max-Age=0');
```

---

## 5. 변경 파일 요약

| 파일 | 변경 내용 | 위험도 |
|------|----------|--------|
| portal/lib/auth.js | Set-Cookie 추가 + verify-cookie 엔드포인트 | 낮음 (추가만) |
| portal/server.js | 라우트 1줄 추가 | 최소 |
| portal/public/credits.html | 화이트리스트 2개 도메인 추가 | 최소 |
| idphoto-kr/public/shared.js | initCredits() 쿠키 폴백 추가 | 중간 |
| idphoto-kr/public/index.html | updateAuthUI async 대응 | 낮음 |

**기존 코드 삭제: 0건** — 전부 추가/보강만.
기존 sessionStorage/localStorage 로직은 그대로 유지, 쿠키는 **폴백 레이어**로만 동작.

---

## 6. 효과

| Before | After |
|--------|-------|
| 포탈 로그인 → 앱 이동 → 로그인 풀림 | 쿠키로 자동 복원, 서버에서 최신 크레딧 조회 |
| 앱에서 충전 후 복귀 → 옛 잔액 | verify-cookie가 Firestore 실시간 조회 |
| credits.html → 앱 복귀 차단 | 화이트리스트 수정으로 정상 복귀 |
| 크레딧 캐시 불일치 | 항상 서버 정본 조회 (Firestore) |

---

## 7. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| 쿠키 미지원 브라우저 | sessionStorage 로직 유지 (폴백) |
| Safari ITP (7일 쿠키 제한) | HttpOnly + 서버 세팅이라 ITP 적용 안 됨 |
| CSRF | SameSite=Lax + 상태 변경 API는 POST 바디 검증 |
| XSS | HttpOnly라 JS 접근 불가, 토큰 탈취 불가 |

---

## 8. 테스트 시나리오

1. 포탈에서 구글 로그인 → 앱으로 이동 → **로그인 유지 확인**
2. 포탈에서 카카오 로그인 → 앱으로 이동 → **로그인 유지 확인**
3. 앱에서 크레딧 충전 클릭 → 포탈 결제 → 앱 복귀 → **새 잔액 표시**
4. 포탈에서 로그아웃 → 앱 새로고침 → **로그아웃 상태**
5. 시크릿 모드에서 쿠키 없이 → **기존 동작 그대로 (폴백)**

---

## 9. 실행 계획

작가님 승인 시:
1. 막내에게 지시서 1건 (portal + idphoto-kr 동시 변경)
2. 스테이징 배포 → 테스트 5건 확인
3. 프로덕션 배포
