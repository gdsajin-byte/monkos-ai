---
type: DESIGN
date: 2026-02-28
from: M1/쌍아
approved_by: 작가님
subject: 인증 프로토콜 설계서 — 쿠키 단일화
code: AUTH_PROTOCOL_COOKIE_UNIFICATION
status: approved
refs:
  - REPORT_20260228_막내1_쿠키단일화_방향성.md
  - REPORT_20260228_막내2_쿠키단일화_기능효율.md
  - REPORT_20260228_막내3_쿠키단일화_리스크.md
---

# 인증 프로토콜 설계서 — 쿠키 단일화

> **[2026-02-28 07:31 KST] M1/쌍아 → 작가님 승인 완료**
> 3관점 리서치(방향성·기능효율·리스크) 교차 검증 기반

---

## 1. 목적

현행 3중 혼재 인증 체계(sessionStorage + localStorage + 쿠키)를 **HttpOnly 쿠키 단일 인증**으로 통일한다.

### 해결하는 문제
- 비로그인인데 12cr 표시 버그 (이중 소스 불일치)
- credits.html만 localStorage 사용 (격리 불일치)
- checkTokenExpiry()가 HMAC 토큰을 JWT로 파싱 시도 → 세션 삭제 위험
- 크로스도메인 세션 공유 불안정 (Phase 1 실패 → Phase 2 폴백)
- 토스 리다이렉트 시 인증 유실 가능성

### 해결하지 않는 문제 (별도 과제)
- 서버측 원본 격리 (Network 탭 2차 방어)
- GateModule 기존 유저 분기 (UX)
- idphoto-jp 인증 체계 (별도 설계 필요)

---

## 2. 설계 원칙

| 원칙 | 설명 |
|------|------|
| **단일 진실 소스** | `.monkos.ai` HttpOnly 쿠키가 유일한 인증 수단 |
| **서버 검증 우선** | 클라이언트는 인증을 판단하지 않음. 서버 `/api/auth/verify-cookie` 응답이 진실 |
| **점진 전환** | 추가만, 삭제 없음 → 병행 기간 후 제거. 빅뱅 전환 금지 |
| **sessionStorage = UI 캐시** | 인증 소스가 아닌 렌더링 가속용. 없어도 동작해야 함 |
| **인증 ≠ 데이터** | 이미지·선택옵션 등 sessionStorage 데이터는 인증과 분리, 유지 |

---

## 3. 쿠키 규격

```
Name:        monkos_session
Domain:      .monkos.ai
Path:        /
Secure:      true
HttpOnly:    true
SameSite:    Lax
Max-Age:     2592000 (30일)
```

### 토큰 형식 (현행 HMAC 유지)

```
base64url( userId : expiresTimestamp : hmac-sha256(userId:expires, AUTH_SECRET) )
크기: ~140 bytes (쿠키 4KB 한도 대비 충분)
```

### 변경 사항 (보안 결함 수정)

| # | 항목 | Before | After |
|---|------|--------|-------|
| 1 | 시크릿 | `LEMONSQUEEZY_WEBHOOK_SECRET` (결제와 공유) | `AUTH_SECRET` 환경변수 신설 (전용) |
| 2 | 비교 방식 | `sig !== expectedSig` (타이밍 공격 취약) | `crypto.timingSafeEqual()` |
| 3 | 폴백 시크릿 | `'monkos-default-secret'` 하드코딩 | 미설정 시 서버 시작 경고 + 로그 |

---

## 4. 인증 흐름 (전환 후)

### 4-1. 로그인 (카카오/LINE/구글)

```
사용자 → OAuth 팝업 → 카카오/LINE/구글 인증
  → /auth/{provider}/callback (portal 서버)
    → Firestore 사용자 upsert
    → generateAuthToken(userId, 30일)
    → Set-Cookie: monkos_session={token}; Domain=.monkos.ai; ...
    → postMessage({ type: 'auth-success', user }) → 팝업 닫힘

부모 윈도우:
  → message 이벤트 수신
  → store.user = data.user (메모리)
  → UI 업데이트 (헤더 크레딧 표시)
  → sessionStorage SET 하지 않음 ← 변경점
```

### 4-2. 페이지 로드 (인증 복원)

```
페이지 로드 → sharedInit()
  → initCredits()
    → fetch('/api/auth/verify-cookie', { credentials: 'include' })
    → 서버: 쿠키 파싱 → HMAC 검증 → Firestore 사용자 조회
    → 200 + { user } → store.user 세팅 → UI 렌더링
    → 401 or 실패 → store.user = null → 비로그인 UI
```

### 4-3. 크로스도메인 세션

```
idphoto-kr.monkos.ai → monkos.ai/api/auth/verify-cookie
  브라우저가 .monkos.ai 쿠키를 자동 전송 (same-site)
  → credentials: 'include' 필수
  → CORS: Access-Control-Allow-Credentials: true
        + Access-Control-Allow-Origin: https://idphoto-kr.monkos.ai
```

### 4-4. 토스 결제 리다이렉트

```
monkos.ai → toss.im (결제) → monkos.ai?toss=success&paymentKey=...
  SameSite=Lax + GET redirect → 쿠키 전송됨
  → 서버에서 쿠키로 userId 추출
  → _mo_p (sessionStorage) → 풀 원본 복원 (인증과 독립, 유지)
```

### 4-5. 로그아웃

```
POST /api/auth/logout
  → Set-Cookie: monkos_session=; Domain=.monkos.ai; Max-Age=0
  → 200
클라이언트:
  → store.user = null
  → UI 초기화
  → location.reload() 또는 redirect
```

---

## 5. 파일별 수정 명세

### Phase A: 서버 준비 (무파괴)

| # | 파일 | 수정 내용 | 줄 수 |
|---|------|----------|------|
| A1 | `portal/server.js` | `/api/auth/logout` 라우트 추가 | +5줄 |
| A2 | `portal/lib/auth.js` | handleLogout() 함수 추가 (쿠키 Max-Age=0) | +10줄 |
| A3 | `portal/lib/shared/config.js` | `AUTH_SECRET` 환경변수 사용, timingSafeEqual 적용, 폴백 시크릿 경고 | ~15줄 교체 |

### Phase B: idphoto-kr 클라이언트 전환

| # | 파일 | 수정 내용 | 줄 수 |
|---|------|----------|------|
| B1 | `idphoto-kr/public/shared.js` | initCredits() Phase 1(sessionStorage) 제거, Phase 2(쿠키)만 유지 | -15줄 |
| B2 | `idphoto-kr/public/shared.js` | checkTokenExpiry() 함수 + 호출부 제거 | -20줄 |
| B3 | `idphoto-kr/public/shared.js` | fetchLatestCredits()에 credentials:'include' 추가 + sessionStorage 갱신 제거 | ~5줄 교체 |
| B4 | `idphoto-kr/public/shared.js` | initFromTossResult() sessionStorage.monkos_user 갱신 제거 | -3줄 |
| B5 | `idphoto-kr/public/modules/gate.js` | postMessage 핸들러 3곳에서 sessionStorage SET 제거 (monkos_user 3줄 + monkos_token 3줄) | -6줄 |
| B6 | `idphoto-kr/public/index.html` | checkTokenExpiry() 인라인 제거, updateAuthUI() → store.user 기반, OAuth 콜백 sessionStorage 제거 | -25줄 |

### Phase C: 포털 클라이언트 전환

| # | 파일 | 수정 내용 | 줄 수 |
|---|------|----------|------|
| C1 | `portal/public/index.html` | restoreSession() → verify-cookie 호출로 교체 | ~10줄 교체 |
| C2 | `portal/public/index.html` | Google 콜백 sessionStorage SET 제거 | -4줄 |
| C3 | `portal/public/index.html` | logout() → POST /api/auth/logout 호출로 교체 | ~5줄 교체 |
| C4 | `portal/public/credits.html` | localStorage.monkos_user 5곳 → verify-cookie + store 기반으로 전환 | ~20줄 교체 |

### 총계

| 항목 | 수량 |
|------|------|
| 수정 파일 | 8개 |
| 유지 파일 | 6개 (result.js, camera.js, prep.js, thankyou.js 등) |
| 제거 | ~80줄 |
| 교체 | ~55줄 |
| 신규 | ~30줄 |
| 순감소 | ~50줄 |

---

## 6. 유지 대상 (변경 금지)

인증과 무관한 sessionStorage 데이터는 **절대 건드리지 않는다**.

| 키 | 스토리지 | 용도 | 판정 |
|----|----------|------|------|
| `monkos_captured` | sessionStorage | 촬영 이미지 | **유지** |
| `monkos_cropped` | sessionStorage | 크롭 이미지 | **유지** |
| `monkos_generated` | sessionStorage | 생성 이미지 (워터마크) | **유지** |
| `_mo_p` | sessionStorage | 토스 리다이렉트 중 풀 원본 보관 | **유지** |
| `monkos_style/gender/age/...` | sessionStorage | 퍼널 선택값 9필드 | **유지** |
| `monkos_free_gen` | localStorage | 비로그인 1회 무료 제한 | **유지** |
| `monkos_lang` | localStorage | 언어 설정 | **유지** |
| `monkos_credits_from` | sessionStorage | credits.html 복귀 URL | **유지** |
| `saveSessionData/loadSessionData` | shared.js | 범용 헬퍼 | **유지** |

---

## 7. 전환 전 필수 조치

| # | 조치 | 근거 | 담당 |
|---|------|------|------|
| 1 | `fetchLatestCredits()`에 `credentials:'include'` 추가 | R16 — 없으면 크로스도메인 크레딧 조회 불능 | Phase B에 포함 |
| 2 | DNS 감사 — `*.monkos.ai` 미사용 서브도메인 제거 | R8 — CSRF 서브도메인 공격 방어 | 작가님 확인 |
| 3 | `AUTH_SECRET` 환경변수 생성 + deploy.sh 반영 | 시크릿 분리 | Phase A에 포함 |

---

## 8. 검증 체크리스트 (Phase D)

| # | 테스트 | 예상 결과 |
|---|--------|----------|
| D1 | 카카오 로그인 → 페이지 새로고침 | 쿠키로 세션 복원, 크레딧 정상 표시 |
| D2 | LINE 로그인 → 다른 탭에서 monkos.ai 열기 | 쿠키 공유로 로그인 유지 |
| D3 | 구글 로그인 → idphoto-kr ↔ portal 이동 | 크로스도메인 세션 유지 |
| D4 | 토스 결제 → 리다이렉트 복귀 | 쿠키 유지 + _mo_p 원본 복원 |
| D5 | 로그아웃 → 쿠키 삭제 확인 | DevTools에서 monkos_session 소멸 확인 |
| D6 | credits.html 직접 접근 | verify-cookie로 인증 정상 |
| D7 | 시크릿 모드에서 전체 흐름 | 쿠키 세션 내 유지, 창 닫으면 삭제 |
| D8 | 카카오톡 인앱 브라우저에서 링크 열기 | 비로그인 표시 → 로그인 후 정상 동작 |

---

## 9. 롤백 플레이북

### 전제: 점진 전환 (추가만, 삭제 없음)

```
문제 감지 → 쿠키 관련 코드 revert → Cloud Run 재배포
예상 소요: 5~10분
```

| 문제 유형 | 롤백 방법 |
|----------|----------|
| 쿠키 세팅 오류 | Set-Cookie 라인 제거 → sessionStorage 폴백 자동 동작 |
| verify-cookie 장애 | 라우트 제거 → initCredits() catch → sessionStorage 폴백 |
| CORS 문제 | ALLOWED_ORIGINS 수정 또는 credentials:'include' 제거 |

**모든 변경이 "추가"이므로 롤백 = 추가분 제거. 기존 코드 불변.**

---

## 10. 구현 일정

```
Phase A (서버 준비)     → 막내1 (로그아웃 API + 시크릿 분리 + timingSafeEqual)
Phase B (idphoto-kr)   → 막내2 (shared.js + gate.js + index.html)
Phase C (portal)       → 막내3 (portal index.html + credits.html)
Phase D (검증)         → 전원 (배포 후 테스트)
```

Phase A → B → C 순차. D는 각 Phase 완료 후 즉시 검증.

---

## 부록: 리서치 근거

| 보고서 | 경로 |
|--------|------|
| 방향성 (막내1) | `monkos-ops/ops/reports/REPORT_20260228_막내1_쿠키단일화_방향성.md` |
| 기능효율 (막내2) | `monkos-ops/ops/reports/REPORT_20260228_막내2_쿠키단일화_기능효율.md` |
| 리스크 (막내3) | `monkos-ops/ops/reports/REPORT_20260228_막내3_쿠키단일화_리스크.md` |
