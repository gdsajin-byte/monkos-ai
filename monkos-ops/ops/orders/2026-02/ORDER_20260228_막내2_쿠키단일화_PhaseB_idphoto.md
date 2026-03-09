---
type: ORDER
date: 2026-02-28
from: M1/쌍아
to: 막내2
priority: P0
subject: 쿠키 단일화 Phase B — idphoto-kr 클라이언트 전환
code: AUTH_COOKIE_PHASE_B
design_ref: DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md
depends_on: AUTH_COOKIE_PHASE_A
---

# 지시서: 쿠키 단일화 Phase B — idphoto-kr 클라이언트 전환

> **[2026-02-28] M1/쌍아 → 막내2**
> **유형**: 구현
> **설계서**: `monkos-ops/tech/DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md`
> **선행 조건**: Phase A 완료 (막내1 push 후)

---

## 작업 개요

idphoto-kr 클라이언트에서 sessionStorage 인증 의존을 제거하고, 쿠키(verify-cookie)를 유일한 인증 소스로 전환한다.

---

## 작업 상세

### B1. shared.js — initCredits() 단순화

**파일**: `monkos_AI/idphoto-kr/public/shared.js`

**현행 initCredits() (221~269행 부근)** — 2-phase:
- Phase 1 (223~241): sessionStorage.getItem('monkos_user') → store.user
- Phase 2 (246~266): fetch verify-cookie → store.user → sessionStorage 캐싱

**변경** — Phase 2만 유지:
```javascript
export async function initCredits() {
  try {
    const res = await fetch(`${API.PORTAL_URL}/api/auth/verify-cookie`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.id) {
        store.user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || '',
          credits: data.user.credits ?? 0,
          avatar: data.user.picture || '',
        };
        Monk.log(`쿠키 인증: ${data.user.email} (${data.user.credits}c)`);
        return;
      }
    }
  } catch (e) {
    Monk.log('쿠키 인증 실패');
  }
  store.user = null;
  Monk.log('비로그인 상태');
}
```

- Phase 1 (sessionStorage 읽기) 전체 제거
- Phase 2의 sessionStorage 캐싱 라인 제거
- store.user만 세팅

### B2. shared.js — checkTokenExpiry() 제거

**현행 (299~315행 부근)**: JWT 형식으로 파싱 시도 → 현행 HMAC 토큰과 불일치 → catch에서 세션 삭제

**변경**: 함수 전체 제거 + sharedInit() 내 호출부 제거 (387행 부근 `checkTokenExpiry()`)

### B3. shared.js — fetchLatestCredits() 수정

**현행 (271~289행 부근)**:
```javascript
const res = await fetch(`${API.PORTAL_URL}/api/credits?userId=${store.user.id}`);
// ... sessionStorage 갱신 ...
```

**변경**:
```javascript
const res = await fetch(`${API.PORTAL_URL}/api/credits?userId=${store.user.id}`, {
  credentials: 'include',  // ← 추가
});
if (res.ok) {
  const data = await res.json();
  store.user.credits = data.credits ?? store.user.credits;
  // sessionStorage 갱신 라인 제거
}
```

- `credentials: 'include'` 추가 (R16 필수 조치)
- sessionStorage.setItem('monkos_user', ...) 제거
- store.user.credits만 갱신

### B4. shared.js — initFromTossResult() 수정

**현행 (154~197행 부근)**: 토스 결제 완료 후 sessionStorage.monkos_user 갱신

**변경**: sessionStorage.setItem('monkos_user', ...) 라인 제거. store.user.credits만 갱신.

### B5. gate.js — sessionStorage SET 제거

**파일**: `monkos_AI/idphoto-kr/public/modules/gate.js`

3곳에서 동일 패턴 제거:

**_startKakaoLogin (102~103행)**:
```javascript
// 제거: sessionStorage.setItem('monkos_user', JSON.stringify(e.data.user));
// 제거: sessionStorage.setItem('monkos_token', e.data.token);
// 유지: store.user = { ... } + UI 업데이트 로직
```

**_startKakaoLoginSimple (436~437행)**: 동일 제거

**_startLineLoginSimple (464~465행)**: 동일 제거

총 6줄 제거. store.user 세팅 + UI 업데이트 콜백은 유지.

### B6. index.html — 인증 인라인 스크립트 정리

**파일**: `monkos_AI/idphoto-kr/public/index.html`

| 줄 | 현행 | 변경 |
|----|------|------|
| 929 | `sessionStorage.getItem('monkos_user')` | store.user 확인 (sharedInit 이후이므로 이미 세팅됨) |
| 955~970 | `checkTokenExpiry()` 인라인 함수 | **전체 제거** |
| 1046~1047 | Google OAuth → sessionStorage SET | sessionStorage SET 제거. store.user만 세팅 |
| 1084~1085 | 카카오/LINE postMessage → sessionStorage SET | sessionStorage SET 제거. store.user만 세팅 |
| 1097 | `sessionStorage.getItem('monkos_user')` | store.user 확인 |
| 1110 | `checkTokenExpiry()` 호출 | **제거** |

---

## 변경 금지 (유지 대상)

아래 sessionStorage 코드는 **절대 수정하지 않는다**:

| 키 | 파일 | 이유 |
|----|------|------|
| `monkos_captured` | camera.js, shared.js | 이미지 데이터 |
| `monkos_cropped` | shared.js | 이미지 데이터 |
| `monkos_generated` | result.js | 이미지 데이터 |
| `_mo_p` | result.js | 토스 리다이렉트 원본 보관 |
| `monkos_style/gender/age/...` | shared.js, prep.js | 선택 옵션 |
| `monkos_free_gen` | result.js | localStorage — 무료 생성 제한 |
| `saveSessionData/loadSessionData` | shared.js | 범용 헬퍼 |

---

## 완료 조건

- [ ] initCredits() — Phase 1 제거, Phase 2만 유지
- [ ] checkTokenExpiry() — 함수 + 호출부 제거 (shared.js + index.html)
- [ ] fetchLatestCredits() — credentials:'include' 추가 + sessionStorage 갱신 제거
- [ ] initFromTossResult() — sessionStorage 갱신 제거
- [ ] gate.js — sessionStorage SET 6줄 제거 (3곳 × 2줄)
- [ ] index.html — 인라인 checkTokenExpiry 제거, OAuth 콜백 sessionStorage 제거
- [ ] 이미지/선택옵션 sessionStorage 코드 **미수정** 확인
- [ ] 로컬 테스트: 페이지 로드 → verify-cookie로 인증 복원 확인
- [ ] 커밋 (develop, `[refactor]` 태그)
- [ ] push 승인 요청

---

## 주의사항

1. **index.html은 비모듈 `<script>`** — shared.js를 import할 수 없음. store 접근 방식 확인할 것 (window.store 또는 전역 변수)
2. **updateAuthUI()** — sessionStorage 대신 store.user를 읽도록 변경. sharedInit() 완료 후 호출되는지 순서 확인
3. **postMessage 수신은 유지** — 팝업 → 부모 윈도우 통신은 여전히 필요 (store.user + UI 업데이트용)
4. **result.js, camera.js, prep.js는 건드리지 않는다** — 인증 무관 파일
