---
type: ORDER
date: 2026-02-28
from: M1/쌍아
to: 막내3
priority: P0
subject: 쿠키 단일화 Phase C — 포털 클라이언트 전환
code: AUTH_COOKIE_PHASE_C
design_ref: DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md
depends_on: AUTH_COOKIE_PHASE_A
---

# 지시서: 쿠키 단일화 Phase C — 포털 클라이언트 전환

> **[2026-02-28] M1/쌍아 → 막내3**
> **유형**: 구현
> **설계서**: `monkos-ops/tech/DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md`
> **선행 조건**: Phase A 완료 (막내1 push 후)
> **병행 가능**: Phase B와 병행 가능 (파일 겹침 없음)

---

## 작업 개요

portal 클라이언트(index.html + credits.html)에서 sessionStorage/localStorage 인증 의존을 제거하고, 쿠키(verify-cookie)를 유일한 인증 소스로 전환한다.

---

## 작업 상세

### C1. portal/index.html — restoreSession() 교체

**파일**: `monkos_AI/portal/public/index.html`

**현행 restoreSession() (1453행 부근)**:
```javascript
function restoreSession() {
  const saved = sessionStorage.getItem('monkos_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUI();
    } catch (e) {
      sessionStorage.removeItem('monkos_user');
    }
  }
}
```

**변경**:
```javascript
async function restoreSession() {
  try {
    const res = await fetch('/api/auth/verify-cookie', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id) {
        currentUser = data.user;
        updateUI();
        return;
      }
    }
  } catch (e) {
    console.log('세션 복원 실패');
  }
  currentUser = null;
  updateUI();
}
```

- sessionStorage.getItem 제거
- verify-cookie API로 교체
- async 함수로 변경 → 호출부에서 await 처리 확인

### C2. portal/index.html — Google 콜백 sessionStorage 제거

**현행 (1561행, 1581행 부근)**:
```javascript
sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
```

**변경**: 해당 줄 제거. `currentUser = data.user; updateUI();`만 유지.
서버에서 Set-Cookie가 이미 발급되므로 클라이언트 저장 불필요.

### C3. portal/index.html — logout() 교체

**현행 (1603행 부근)**:
```javascript
function logout() {
  sessionStorage.removeItem('monkos_user');
  currentUser = null;
  updateUI();
}
```

**변경**:
```javascript
async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    console.log('로그아웃 API 호출 실패');
  }
  currentUser = null;
  updateUI();
}
```

- POST /api/auth/logout 호출 (Phase A에서 신설)
- sessionStorage.removeItem 제거
- 서버에서 쿠키 Max-Age=0으로 삭제

### C4. portal/credits.html — localStorage 전면 교체

**파일**: `monkos_AI/portal/public/credits.html`

credits.html은 **독립 인증 체계**로 동작 중 (localStorage.monkos_user 사용). 쿠키 기반으로 통일.

#### C4-1. checkAuth() 교체 (257행 부근)

**현행**:
```javascript
function checkAuth() {
  const saved = localStorage.getItem('monkos_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    // ...
  }
}
```

**변경**:
```javascript
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/verify-cookie', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id) {
        currentUser = data.user;
        updateCreditsUI();
        return;
      }
    }
  } catch (e) {
    console.log('인증 실패');
  }
  // 비로그인 → 로그인 유도 또는 리다이렉트
  location.href = '/';
}
```

#### C4-2. fetchBalance() 수정 (291행 부근)

**현행**:
```javascript
localStorage.setItem('monkos_user', JSON.stringify(currentUser));
```

**변경**: 해당 줄 제거. `currentUser.credits = data.credits;`만 유지 (메모리).

#### C4-3. googleLogin() 수정 (313행 부근)

**현행**:
```javascript
localStorage.setItem('monkos_user', JSON.stringify(data.user));
```

**변경**: 해당 줄 제거. 서버에서 Set-Cookie 발급됨. `currentUser = data.user; updateCreditsUI();`만 유지.

#### C4-4. 토스 결제 결과 처리 수정 (386행, 406행 부근)

**현행**:
```javascript
const saved = localStorage.getItem('monkos_user');  // 386행
// ...
localStorage.setItem('monkos_user', JSON.stringify(currentUser));  // 406행
```

**변경**:
- 386행: `currentUser` 변수 사용 (페이지 로드 시 checkAuth()로 이미 세팅됨)
- 406행: localStorage.setItem 제거. `currentUser.credits = ...;` 메모리만 갱신.

#### C4-5. 총 정리

| 줄 | 현행 | 변경 |
|----|------|------|
| 257 | `localStorage.getItem('monkos_user')` | verify-cookie API |
| 291 | `localStorage.setItem('monkos_user', ...)` | **제거** |
| 313 | `localStorage.setItem('monkos_user', ...)` | **제거** |
| 386 | `localStorage.getItem('monkos_user')` | `currentUser` 사용 |
| 406 | `localStorage.setItem('monkos_user', ...)` | **제거** |

---

## 변경 금지 (유지 대상)

| 키 | 스토리지 | 파일 | 이유 |
|----|----------|------|------|
| `monkos_credits_from` | sessionStorage | credits.html | 복귀 URL — 인증과 무관 |
| `monkos_lang` | localStorage | portal/index.html | 언어 설정 — 인증과 무관 |
| `monkos_region` 쿠키 | document.cookie | portal/index.html | 지역 설정 — 인증과 무관 |

---

## 완료 조건

- [ ] portal/index.html — restoreSession() → verify-cookie 교체
- [ ] portal/index.html — Google 콜백 sessionStorage SET 제거
- [ ] portal/index.html — logout() → POST /api/auth/logout 교체
- [ ] credits.html — localStorage.monkos_user 5곳 전면 교체/제거
- [ ] monkos_lang, monkos_credits_from **미수정** 확인
- [ ] 로컬 테스트: portal 로그인 → credits.html 이동 → 인증 유지 확인
- [ ] 로컬 테스트: 로그아웃 → 쿠키 삭제 확인
- [ ] 커밋 (develop, `[refactor]` 태그)
- [ ] push 승인 요청

---

## 주의사항

1. **checkAuth()가 async로 변경** — 호출부에서 await 처리 확인. DOMContentLoaded 이벤트 핸들러가 async인지 확인
2. **restoreSession()도 async로 변경** — 동일하게 호출부 확인
3. **credits.html의 토스 결제 흐름** — 토스 리다이렉트 복귀 시 currentUser가 null일 수 있음 → checkAuth()가 먼저 실행되어야 함. 페이지 로드 순서 확인
4. **portal/lib/auth.js는 건드리지 않는다** — 서버 쪽 Set-Cookie 로직은 Phase A에서 처리. 이미 구현됨
5. **fetch URL 확인** — portal은 same-origin이므로 상대 경로(`/api/auth/verify-cookie`) 사용 가능. idphoto-kr과 달리 `${API.PORTAL_URL}` 불필요
