---
type: report
date: 2026-06-21
device: iMac
agent: 막내1
status: 완료
portfolio: PF_STYLER
subject: 인증·결제 구조 전수 조사 — OAuth 리다이렉션·Toss/LemonSqueezy 연동·크레딧 흐름 맵핑
---

# 인증·결제 구조 전수 조사

> **[2026-06-21 16:28 KST]** iMac/막내1 → 작가님

---

## 인증 맵

### Google OAuth

| 항목 | 내용 |
|------|------|
| redirect URI 구성 | **동적**: `https://${req.headers.host}/auth/google/callback` |
| 기본값(config.js L19) | `GOOGLE_REDIRECT_URI = 'https://monkos.ai/auth/google/callback'` |
| callback 경로 | `/auth/google/callback` → `handleGoogleRedirectCallback` (auth.js:375) |
| API 방식 | `/api/auth/google` POST — GIS One Tap(id_token) + OAuth 팝업(access_token) 겸용 (auth.js:501) |
| client ID 위치 | config.js L17: `GOOGLE_CLIENT_ID` (환경변수, 폴백값 하드코딩) |
| client secret 위치 | config.js L18: `GOOGLE_CLIENT_SECRET` (환경변수, 폴백 빈 문자열) |
| 도메인 범위 | `req.headers.host` 기반 동적 — **monkos.ai에서만 서빙**. idphoto-kr/jp는 Google OAuth 라우트 없음 |
| 서브디렉토리 영향 | `/headshot`에서 `/auth/google` 호출 → 동일 호스트이므로 **추가 등록 불필요** |

### Kakao OAuth

| 항목 | 내용 |
|------|------|
| redirect URI 구성 | **동적**: `https://${req.headers.host}/auth/kakao/callback` (auth.js:22,41) |
| 기본값(config.js L50) | `KAKAO_REDIRECT_URI = 'https://monkos.ai/auth/kakao/callback'` |
| callback 경로 | `/auth/kakao/callback` → `handleKakaoCallback` (auth.js:29) |
| REST API Key 위치 | config.js L49: `KAKAO_REST_API_KEY` (환경변수) |
| client secret 위치 | `process.env.KAKAO_CLIENT_SECRET` (auth.js:47, 선택적) |
| 도메인 범위 | `req.headers.host` 기반 동적 — **monkos.ai에서만 서빙** |
| 서브디렉토리 영향 | `/headshot`에서 `/auth/kakao` 호출 → **추가 등록 불필요** |
| ⚠️ 주의 | auth.js:49에 `KAKAO_CLIENT_SECRET` 실값이 로그에 출력됨 — 보안 수정 대상 |

### LINE OAuth

| 항목 | 내용 |
|------|------|
| redirect URI 구성 | **동적**: `https://${req.headers.host}/auth/line/callback` (auth.js:186,229) |
| 기본값(config.js L56) | `LINE_REDIRECT_URI = 'https://monkos.ai/auth/line/callback'` |
| callback 경로 | `/auth/line/callback` → `handleLineCallback` (auth.js:193) |
| channel ID/secret 위치 | config.js L54-55: `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET` (환경변수) |
| 도메인 범위 | `req.headers.host` 기반 동적 — **monkos.ai에서만 서빙** |
| CSRF 보호 | `pendingLineStates` Map으로 state 검증 (auth.js:214) |
| 서브디렉토리 영향 | `/headshot`에서 `/auth/line` 호출 → **추가 등록 불필요** |

### 인증 공통 구조

- **쿠키 도메인**: `Domain=.monkos.ai` (auth.js:133,153,300,320,464) — 서브도메인 전체(`idphoto-kr.monkos.ai`, `idphoto-jp.monkos.ai`)에 유효
- **세션 토큰**: HMAC-SHA256 서명, 30일 만료 (config.js:200)
- **서명 키**: `AUTH_SECRET` 환경변수 (config.js L27-28) — 포털·idphoto-kr·idphoto-jp 모두 동일 키 사용
- **가입 보너스**: 모든 OAuth 프로바이더에서 신규 가입 시 `credits: 10` 하드코딩 (auth.js:96, 265, 443)
- **signupSource**: `source_page` 쿼리파라미터로 가입 경로 추적 (auth.js:99,268,444)

---

## 결제 맵

### Toss Payments (KR)

| 항목 | 내용 |
|------|------|
| 결제 확인 API | `/api/payments/toss/confirm` POST (payments.js:175) |
| 비로그인 직접결제 | `/api/payments/toss/direct` POST (payments.js:297) |
| 성공 리다이렉트 | `/toss-success?paymentKey=...&orderId=...&amount=...&userId=...` (payments.js:386) |
| 실패 리다이렉트 | `/toss-fail?message=...` (payments.js:426) |
| 시크릿 키 위치 | config.js L38: `TOSS_SECRET_KEY` (환경변수) |
| 웹훅 | 없음 — 클라이언트 리다이렉트 → 서버 confirm 방식 |
| 서브디렉토리 영향 | `/headshot`에서 결제 → `/toss-success`로 리다이렉트 (같은 호스트) → **추가 심사 불필요** |

### Toss 상품 정의 (config.js L117-123)

| 상품명 | 가격(₩) | 기본 크레딧 | 보너스 | 합계 |
|--------|---------|-----------|--------|------|
| topup_10 | 1,450 | 10 | 0 | 10c |
| single_70 | 9,900 | 70 | 10 | 80c |
| package_100 | 12,900 | 100 | 30 | 130c |
| package_300 | 34,900 | 300 | 120 | 420c |
| package_500 | 49,900 | 500 | 250 | 750c |

- **맞춤 충전**: 패키지 매핑 실패 시 ₩145/c 기준, 10c 배수만 허용 (payments.js:208-216)

### LemonSqueezy (JP/글로벌)

| 항목 | 내용 |
|------|------|
| 체크아웃 생성 | `/api/checkout` POST (payments.js:8) — LS API 호출하여 URL 반환 |
| 웹훅 | `/api/webhooks/lemonsqueezy` POST (payments.js:74) — HMAC 서명 검증 |
| 이벤트 처리 | `order_created` → 크레딧 지급, `order_refunded` → 크레딧 회수 |
| Store ID | config.js L24: `LEMONSQUEEZY_STORE_ID = '290457'` (하드코딩) |
| API Key 위치 | config.js L22: `LEMONSQUEEZY_API_KEY` (환경변수) |
| Webhook Secret 위치 | config.js L23: `LEMONSQUEEZY_WEBHOOK_SECRET` (환경변수) |
| locale | `ja` 고정 (payments.js:19) — JP 전용 |
| 서브디렉토리 영향 | LS는 외부 결제 페이지 → 웹훅으로 완결. **추가 설정 불필요** |

### LemonSqueezy Variant → 크레딧 매핑 (config.js L107-114)

| Variant ID | 상품명 | 가격 | 크레딧 |
|-----------|--------|------|--------|
| 1382355 | topup_10 | ¥150 | 10c |
| 1382367 | single_70 | ¥990 | 80c |
| 1382348 | package_100 | ¥1,490 | 130c |
| 1382362 | package_300 | ¥3,990 | 420c |
| 1382436 | package_500 | ¥5,990 | 750c |

---

## 크레딧 맵

### 차감 포인트 (credits.js:87)

| type | 비용 | 용도 | 호출 위치 |
|------|------|------|----------|
| `generate` | 10c | AI 증명사진/헤드샷 생성 | idphoto-kr server.js:561, idphoto-jp server.js:608, portal server.js:165 |
| `download` | 70c | 고해상도 다운로드 | idphoto-kr server.js:639, idphoto-jp server.js:720 |
| `extra_crop` | 10c | 추가 크롭 | 클라이언트 호출 |
| `full_original` | 10c | 원본 전체 | 클라이언트 호출 |

### 가입 보너스

| 위치 | 금액 | 조건 |
|------|------|------|
| auth.js:96 (Kakao) | +10c | 신규 가입 (`!userDoc.exists`) |
| auth.js:265 (LINE) | +10c | 신규 가입 (`!userDoc.exists`) |
| auth.js:443 (Google redirect) | +10c | 신규 가입 (`isNewUser`) |
| auth.js:569 (Google API) | +10c | 신규 가입 (`isNewUser`) |

- 중복 방지: Firestore doc ID 기반 (`kakao_{id}`, `line_{id}`, Google `sub`) — 동일 프로바이더로 재가입 불가

### 이벤트 크레딧 (events.js)

| eventType | 금액 | 조건 |
|-----------|------|------|
| signup_bonus | +10c | 가입 보너스 (중복: 위 가입 로직과 별도 경로) |
| telegram_join | +40c | 텔레그램 채널 가입 (kakao_channel_add와 택1) |
| kakao_channel_add | +40c | 카카오 채널 친구추가 (telegram_join과 택1) |
| mission_complete | +100c | 미션 완료 (missionBonusClaimed 플래그로 1회) |
| sns_share | +100c | SNS 공유 |
| passport_rejection | +100c | 여권 사진 불합격 보상 |

### 크레딧 풀

- **공유**: 포털·idphoto-kr·idphoto-jp 모두 **동일 Firestore `users` 컬렉션** 사용
- idphoto-kr/jp는 포털 API 프록시: `PORTAL_API_URL/api/credits/use` 호출 (idphoto-kr server.js:104, idphoto-jp server.js:105)
- `PORTAL_API_URL` 기본값: `https://monkos.ai` (idphoto-kr server.js:28, idphoto-jp server.js:28)

---

## 서비스 간 관계

### 인증 구조

| 서비스 | OAuth 자체 라우트 | 인증 방식 |
|--------|-----------------|----------|
| **포털** (monkos.ai) | ✅ Google/Kakao/LINE 전부 | 자체 처리 → `monkos_session` 쿠키 발급 |
| **idphoto-kr** (idphoto-kr.monkos.ai) | ❌ 없음 | 포털 쿠키(`Domain=.monkos.ai`) 공유 + 로컬 검증 |
| **idphoto-jp** (idphoto-jp.monkos.ai) | ❌ 없음 | 포털 쿠키(`Domain=.monkos.ai`) 공유 + 로컬 검증 |

- idphoto-kr/jp는 `AUTH_SECRET` (또는 `LEMONSQUEEZY_WEBHOOK_SECRET` 폴백) 로 `monkos_session` 쿠키를 **로컬 검증** (idphoto-kr server.js:68-87)
- 포털에서 인증 → `.monkos.ai` 도메인 쿠키 → idphoto 서비스에서 동일 키로 검증 → 포털 API로 크레딧 차감

### 쿠키 도메인

- `Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`
- **서브도메인 유효**: `monkos.ai`, `idphoto-kr.monkos.ai`, `idphoto-jp.monkos.ai` 전부 공유
- **서브디렉토리 자동 유효**: `/headshot`, `/specs` 등 경로 무관

### CORS (config.js L131-145)

허용 오리진:
- `https://monkos.ai`
- `https://idphoto-kr.monkos.ai`, `https://idphoto-jp.monkos.ai`
- Cloud Run 직접 URL 6개 (kr/jp/portal, dev/prod)
- `https://monk.kr`
- `http://localhost:8080`, `http://localhost:3000`

### 팝업 오리진 (config.js L147-151)

`ALLOWED_POPUP_ORIGINS`: `idphoto-kr.monkos.ai`, `idphoto-jp.monkos.ai`, `monkos.ai`

---

## 결론

### /headshot에 새 가격 적용 시 추가 심사/등록 필요 여부: **NO**

| 항목 | 추가 작업 | 이유 |
|------|----------|------|
| Google OAuth | ❌ 불필요 | redirect URI가 `req.headers.host` 기반 동적. `/headshot`은 동일 호스트 |
| Kakao OAuth | ❌ 불필요 | 동일 이유 |
| LINE OAuth | ❌ 불필요 | 동일 이유 |
| Toss Payments | ❌ 불필요 | 결제 후 `/toss-success` 리다이렉트 — 동일 호스트 내 경로 |
| LemonSqueezy | ❌ 불필요 | 외부 결제 페이지 + 웹훅 방식 — 프론트 경로 무관 |
| 쿠키/세션 | ❌ 불필요 | `Domain=.monkos.ai` — 모든 경로·서브도메인 공유 |

### 변경 필요 파일 목록 (10c 통합 가격 적용 시)

| 파일 | 변경 내용 |
|------|----------|
| `portal/lib/shared/config.js` L117-123 | PRODUCTS 상품 정의 변경 (가격, 크레딧 수) |
| `portal/lib/shared/config.js` L107-114 | VARIANT_CREDITS 변경 (LS 상품 변경 시) |
| `portal/lib/credits.js` L87 | COST_MAP 변경 (단가 변경 시) |
| `portal/lib/payments.js` L209 | 맞춤 충전 단가 ₩145/c 변경 (단가 변경 시) |
| `portal/lib/credits.js` L52 | krwRate: 145 변경 (단가 변경 시) |
| `/headshot` 페이지 프론트엔드 | 가격표 UI, 결제 버튼, 크레딧 차감 type 연동 |

### 발견된 보안 이슈

- **auth.js:49**: Kakao OAuth 토큰 요청 로그에 `KAKAO_CLIENT_SECRET` 실값 출력 — 즉시 수정 권고

---

> 본 보고서는 읽기 전용 조사이며, 코드 수정은 수행하지 않았습니다.
