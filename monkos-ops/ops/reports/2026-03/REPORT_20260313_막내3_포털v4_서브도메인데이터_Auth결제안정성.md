---
type: report
from: M1/막내3
to: M1/쌍아
date: 2026-03-13 21:32 KST
status: complete
tags: [포털v4, 서브도메인, Auth, 결제, Firestore, 리서치]
---

# 포털 v4 — 서브도메인 데이터 공유 + Auth/결제 안정성 분석

**[2026-03-13 21:32 KST] M1/막내3 → M1/쌍아**

---

## 산출물 1: 서브도메인 데이터 공유 현황표

### 서비스 구조

```
monkos.ai (portal)          — Cloud Run (monkos-portal)
idphoto-kr.monkos.ai        — Cloud Run (monkos-idphoto-kr)
idphoto-jp.monkos.ai        — Cloud Run (monkos-idphoto-jp)
crop-engine (내부)           — Cloud Run (monkos-crop-engine, asia-northeast3)
```

> `crop.monkos.ai`는 현재 **별도 서비스로 존재하지 않음**. 크롭앱은 idphoto-kr/jp의 `public/crop.html`에 내장.

### 공유 지점 전수

| 공유 항목 | 공유 방식 | 방향 | 관련 코드 |
|-----------|----------|------|----------|
| **Firebase Auth 세션** | 쿠키 (`monkos_session`, Domain=`.monkos.ai`) | portal ↔ idphoto-kr/jp 양방향 | `portal/lib/auth.js` L127-129 |
| **크레딧 잔고** | REST API (`/api/credits`, `/api/auth/verify-cookie`) | idphoto → portal API 호출 | `portal/lib/credits.js`, `idphoto-kr/public/shared.js` L237-247 |
| **사용자 프로필** | Firestore `users` 컬렉션 직접 읽기 (서버) + 쿠키 검증 API (클라이언트) | 전 서비스 공유 | `portal/lib/shared/config.js` |
| **CORS 허용 목록** | `ALLOWED_ORIGINS` 배열 | portal이 kr/jp 요청 허용 | `portal/lib/shared/config.js` L106-126 |
| **OAuth 팝업** | `postMessage` + `ALLOWED_POPUP_ORIGINS` | idphoto → portal 팝업 → postMessage 리턴 | `portal/lib/auth.js` L119-157 |
| **크롭 이미지 전달** | `sessionStorage('monkos_image')` | idphoto thankyou → crop.html (같은 도메인 내) | `idphoto-kr/public/crop.js` |
| **결제 콜백** | 외부 PG → portal 웹훅 | Toss/LemonSqueezy → portal | `portal/lib/payments.js` |

### CORS 허용 목록 (portal/lib/shared/config.js L106-126)

```
https://monkos.ai
https://idphoto-jp.monkos.ai
https://idphoto-kr.monkos.ai
https://monkos-idphoto-jp-933456016842.us-central1.run.app
https://monkos-idphoto-kr-933456016842.us-central1.run.app
https://monkos-idphoto-jp-dev-933456016842.us-central1.run.app
https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app
https://monkos-portal-dev-933456016842.us-central1.run.app
https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app
https://monkos-portal-dev-4jeplpqpua-uc.a.run.app
https://monk.kr
http://localhost:8080
http://localhost:3000
```

### v4 영향 평가

| 공유 지점 | v4 영향 | 위험도 |
|-----------|---------|:------:|
| 쿠키 (`.monkos.ai`) | **영향 없음** — 도메인 레벨 와일드카드, 라우트 변경 무관 | ✅ |
| 크레딧 API | **영향 없음** — API 엔드포인트 불변 | ✅ |
| CORS | **`/crop` 내부 통합 시 CORS 불필요** — 같은 origin | ✅ |
| OAuth 팝업 | **영향 없음** — portal origin 동일 | ✅ |
| sessionStorage | **⚠️ 주의** — `/crop`이 portal 내부가 되면 idphoto와 origin이 다름. sessionStorage 공유 불가 | ⚠️ |

---

## 산출물 2: 크롭앱 통합 영향 분석

### 현재 구조

| 항목 | 현황 |
|------|------|
| **코드 위치** | `monkos_AI/idphoto-kr/public/crop.html`, `crop.js`, `crop.css` (JP 동일) |
| **배포 방식** | idphoto-kr/jp Cloud Run에 내장 (별도 서비스 아님) |
| **크롭 엔진** | `monkos_AI/crop-engine/` — 독립 마이크로서비스 (Cloud Run, asia-northeast3) |
| **외부 의존성** | MediaPipe FaceMesh (CDN: `@mediapipe/face_mesh`), 478-point 랜드마크 |
| **번들 크기** | crop.js 981줄, crop.css 371줄, crop.html 217줄 = 순수 바닐라 (경량) |
| **별도 레포** | 아님 — 같은 모노레포 (`monk_project`) |

### `crop.monkos.ai` 현황

**현재 존재하지 않음.** v4 문서 §13에서도 서브도메인 취소를 명시:
> ~~crop.monkos.ai~~ → **monkos.ai/crop** 내부 라우트

### 통합 방식별 분석

#### 방식 A: 코드 통합 (portal에 직접 포함) ← **추천**

| 장점 | 단점 |
|------|------|
| CORS/쿠키 이슈 제로 (같은 origin) | portal 번들에 MediaPipe CDN 로드 추가 |
| Auth 세션 자연 공유 | crop.js 981줄 포함 (but 바닐라라 충돌 위험 낮음) |
| 3컬럼 레이아웃에 자연스러운 삽입 | - |
| sessionStorage 대신 URL 파라미터로 이미지 전달 가능 | - |

**구현 포인트:**
- `crop.html` → portal의 `/crop` 라우트로 메인 영역에 렌더링
- MediaPipe CDN은 `/crop` 진입 시에만 동적 로드 (lazy load)
- 크롭 완료 후 "AI 리터칭 해보기" CTA → `/app` (같은 portal)

#### 방식 B: iframe 임베딩

| 장점 | 단점 |
|------|------|
| 기존 코드 무수정 | cross-origin iframe: 쿠키 차단 (SameSite=Lax) |
| 독립 배포 가능 | postMessage 브릿지 필요 |
| - | 모바일에서 iframe 스크롤 이슈 |
| - | 3컬럼 레이아웃과 충돌 가능 |

**추천: 방식 A (코드 통합)**
- crop.js는 바닐라 JS, 외부 프레임워크 의존성 없어 충돌 위험 극소
- 981줄은 portal 규모 대비 경량
- MediaPipe CDN은 lazy load로 초기 로드 영향 없음

### 리다이렉트 전략

```
crop.monkos.ai/* → 301 Redirect → monkos.ai/crop
```

- Cloud Run 서비스 또는 DNS 레벨에서 301 설정
- 현재 crop.monkos.ai가 없으므로 **신규 설정만 필요** (기존 북마크 걱정 없음)

### sessionStorage 이슈 (⚠️ 핵심)

현재 흐름:
```
idphoto-kr thankyou.js → sessionStorage.setItem('monkos_image', base64)
→ crop.html?from=thankyou&spec=passport → sessionStorage.getItem('monkos_image')
```

v4에서 `/crop`이 `monkos.ai` origin이 되면:
- `idphoto-kr.monkos.ai`의 sessionStorage와 `monkos.ai`의 sessionStorage는 **별개**
- **해결책**: URL 파라미터로 이미지 URL 전달, 또는 Firestore에 임시 저장 후 키로 로드

---

## 산출물 3: Auth 흐름도

### 전체 OAuth 흐름

```
┌─────────────────────────────────────────────────────────┐
│                    사용자 브라우저                         │
│                                                         │
│  [idphoto-kr.monkos.ai]    [monkos.ai (portal)]         │
│       │                         │                       │
│  ① "로그인" 클릭                 │                       │
│       │                         │                       │
│  ② window.open(                 │                       │
│     'monkos.ai/auth/kakao       │                       │
│      ?popup=true                │                       │
│      &redirect_app=             │                       │
│       idphoto-kr.monkos.ai')    │                       │
│       │                    ③ 302 → Kakao OAuth          │
│       │                    ④ 사용자 Kakao 로그인          │
│       │                    ⑤ Kakao → /auth/kakao/callback│
│       │                    ⑥ Firestore users 생성/갱신    │
│       │                    ⑦ monkos_session 쿠키 세팅     │
│       │                       Domain=.monkos.ai          │
│       │                    ⑧ postMessage({               │
│       │                         type:'auth-success',     │
│       │  ← ← ← ← ← ← ←      user, token })           │
│       │                    ⑨ window.close()              │
│  ⑩ onmessage 수신               │                       │
│     store.user = data.user       │                       │
│     UI 갱신                      │                       │
└─────────────────────────────────────────────────────────┘
```

### OAuth 프로바이더별 핸들러

| 프로바이더 | 핸들러 위치 | 엔드포인트 | 특이사항 |
|-----------|-----------|-----------|---------|
| **Kakao** | `portal/lib/auth.js` L13-163 | `/auth/kakao`, `/auth/kakao/callback` | popup/redirect 양 모드 |
| **LINE** | `portal/lib/auth.js` L165-338 | `/auth/line`, `/auth/line/callback` | CSRF state Map (10분 TTL) |
| **Google** | `portal/lib/auth.js` L341-444 | `POST /api/auth/google` | One Tap + OAuth popup 듀얼 |
| **Telegram** | `portal/lib/tg-auth.js` | `POST /api/tg/verify-init` | HMAC-SHA256, 5분 auth_date |

### 세션 관리

| 항목 | 값 |
|------|-----|
| 쿠키 이름 | `monkos_session` |
| 도메인 | `.monkos.ai` (서브도메인 전체 공유) |
| 유효기간 | 30일 (2592000초) |
| 플래그 | `Secure; HttpOnly; SameSite=Lax` |
| 토큰 서명 | HMAC-SHA256 (`AUTH_SECRET` 환경변수) |
| 토큰 형식 | `base64url(userId:expires:signature)` |

### 인증 API 엔드포인트 (portal/server.js L107-117)

| 엔드포인트 | 메서드 | 용도 |
|-----------|--------|------|
| `/api/auth/verify?token=` | GET | URL 토큰 검증 (5분 TTL) |
| `/api/auth/verify-cookie` | GET | 쿠키 기반 세션 확인 |
| `/api/auth/refresh` | POST | 토큰 갱신 (30일 이내) |
| `/api/auth/logout` | POST | 쿠키 삭제 |
| `/api/auth/token` | POST | 토큰 발급 |

### Admin 인증 (portal/lib/cms/admin-auth.js)

```
monkos_session 쿠키 → verifyAuthToken() → ADMIN_UIDS 화이트리스트 체크
```
- `ADMIN_UIDS`: 환경변수 (쉼표 구분 UID 목록)

### v4 영향 지점 마킹

| v4 변경사항 | Auth 영향 | 위험도 |
|------------|----------|:------:|
| 3컬럼 레이아웃 전환 | **영향 없음** — Auth는 API 레벨, DOM 의존 없음 | ✅ |
| 로그인 팝업 트리거 위치 변경 | **영향 없음** — `window.open()` 호출 위치만 변경, 흐름 동일 | ✅ |
| 크레딧 배지 user-bar 이동 | **영향 없음** — `/api/auth/verify-cookie` 결과를 다른 DOM에 렌더링할 뿐 | ✅ |
| 언어 스위치 관리자만 노출 | **영향 없음** — 언어 스위치는 UI 요소, Auth와 무관 | ✅ |
| `/crop` 내부 통합 | **영향 없음** — 같은 origin이므로 쿠키 자동 공유 | ✅ |
| `/pricing` 신설 | **⚠️ 확인 필요** — 충전 시 Auth 필요. 기존 charge.html의 로그인 게이트를 `/pricing`에 이식해야 함 | ⚠️ |
| `/admin` 라우트 | **영향 없음** — 기존 admin-auth.js 재활용 | ✅ |

**결론: Auth 시스템은 v4 레이아웃 변경에 영향받지 않음.** API 레벨로 분리되어 있고, 쿠키 도메인이 `.monkos.ai` 와일드카드이므로 라우트 변경에 무관.

---

## 산출물 4: 결제 흐름도

### KR 결제 흐름 (토스 페이먼츠)

```
┌──────────────────────────────────────────────────────────────┐
│ [사용자]                                                      │
│   ① "크레딧 충전" 클릭                                         │
│   ② idphoto-kr/charge.html 이동 (또는 portal/credits.html)     │
│   ③ 상품 선택 (single_70 ~ package_500, topup_10)              │
│   ④ Toss Payments v2 위젯 requestPayment() 호출                │
│      - customerKey: userId                                     │
│      - orderId: monkos-{userId}-{timestamp}                    │
│      - amount: ₩9,900 ~ ₩49,900                               │
│                                                                │
│ [Toss]                                                         │
│   ⑤ 사용자 결제 승인                                            │
│   ⑥ 리다이렉트 → /toss-success?paymentKey=X&orderId=Y&amount=Z │
│                                                                │
│ [Portal 프론트]                                                 │
│   ⑦ POST /api/payments/toss/confirm                            │
│      { paymentKey, orderId, amount }                            │
│                                                                │
│ [Portal 백엔드] (portal/lib/payments.js)                        │
│   ⑧ Toss API 결제 확인 (paymentKey 검증)                        │
│   ⑨ Firestore 트랜잭션:                                        │
│      - users/{userId}.credits += (기본 + 보너스)                 │
│      - payments 컬렉션에 기록                                    │
│      - transactions 컬렉션에 원장 기록                           │
│   ⑩ 응답: { success: true, credits: newBalance }                │
└──────────────────────────────────────────────────────────────┘
```

### JP 결제 흐름 (Lemon Squeezy)

```
┌──────────────────────────────────────────────────────────────┐
│ [사용자]                                                      │
│   ① "크레딧 충전" 클릭                                         │
│   ② idphoto-jp/charge.html 이동                               │
│   ③ 상품 선택                                                  │
│   ④ POST /api/checkout → LemonSqueezy checkout URL 생성        │
│   ⑤ location.href = checkout URL (LemonSqueezy 페이지 이동)    │
│                                                                │
│ [LemonSqueezy]                                                 │
│   ⑥ 사용자 결제 승인                                            │
│   ⑦ 웹훅 POST /api/webhooks/lemonsqueezy                       │
│      - event: order_created                                     │
│      - HMAC SHA256 서명 검증                                    │
│                                                                │
│ [Portal 백엔드] (portal/lib/payments.js)                        │
│   ⑧ variant_id → VARIANT_CREDITS 매핑으로 크레딧 수 결정         │
│   ⑨ Firestore 트랜잭션: users.credits += X                     │
│   ⑩ transactions 컬렉션에 원장 기록                              │
│                                                                │
│ [사용자 브라우저]                                                │
│   ⑪ 폴링: fetchLatestCredits() → 잔고 갱신 확인                 │
└──────────────────────────────────────────────────────────────┘
```

### 익명 결제 (KR 비로그인)

```
POST /api/payments/toss/direct
→ 결제 확인 → downloadToken 발급 (5분 TTL)
→ GET /api/download/direct?token=X → 1회성 다운로드
```

### 가격 체계

**KR (토스):**

| 상품 | 가격 | 크레딧 | 보너스 | 합계 |
|------|------|--------|--------|------|
| single_70 | ₩9,900 | 70c | +10 | 80c |
| package_100 | ₩12,900 | 100c | +30 | 130c |
| package_300 | ₩34,900 | 300c | +120 | 420c |
| package_500 | ₩49,900 | 500c | +250 | 750c |
| topup_10 | ₩1,450 | 10c | 0 | 10c |

**JP (LemonSqueezy):**

| 상품 | 가격 | 크레딧 | 보너스 | 합계 |
|------|------|--------|--------|------|
| single_70 | ¥990 | 70c | +10 | 80c |
| package_100 | ¥1,490 | 100c | +30 | 130c |
| package_300 | ¥3,990 | 300c | +120 | 420c |
| package_500 | ¥5,990 | 500c | +250 | 750c |
| topup_10 | ¥150 | 10c | 0 | 10c |

### 크레딧 소비 단가

| 동작 | 크레딧 |
|------|--------|
| AI 리터칭 (generate) | 10c |
| 다운로드 (download) | 70c |
| 추가 크롭 (extraCrop) | 10c |
| 원본 풀사이즈 (full_original) | 10c |

### v4 영향 지점 마킹

| v4 변경사항 | 결제 영향 | 위험도 |
|------------|----------|:------:|
| `/pricing` 라우트 신설 | **charge.html과 별개 페이지** — 새로 만들어야 함. 기존 charge.html은 idphoto-kr/jp에 있음 | ⚠️ |
| 토스 위젯 | **DOM 의존성 없음** — 위젯은 자체 iframe으로 동작 | ✅ |
| 레이아웃 전환 | **영향 없음** — 결제 API는 서버 사이드 | ✅ |
| 콜백 URL | **하드코딩 확인 필요** — `/toss-success`, `/toss-fail`이 portal에 있음 | ⚠️ |

**`/pricing` 구현 시 결정 사항:**
1. portal의 `/pricing`은 **새 페이지** (charge.html 리다이렉트 아님)
2. 토스 위젯을 `/pricing` 내에 직접 포함할지, 기존 charge.html로 리다이렉트할지
3. JP 사용자가 `/pricing`에 접근하면 LemonSqueezy로 분기해야 함
4. 현재 charge.html은 idphoto-kr/jp 각각에 있음 → portal `/pricing`으로 통합하면 단일 진입점

**결론: 결제 백엔드(API, 웹훅)는 v4에 영향 없음. `/pricing` 프론트엔드는 신규 구현 필요.**

---

## 산출물 5: Firestore 스키마 비교표

### blog_posts 비교

| 필드 | v4 문서 스키마 | 현재 CMS 구현 | 차이 |
|------|--------------|-------------|------|
| **다국어 구조** | `ko: {title, content, summary}`, `ja: {...}`, `en: {...}` — **단일 문서에 다국어 필드 내장** | `lang: 'ko'|'ja'|'en'` — **언어별 별도 문서** (`{slug}`, `{slug}-ja`, `{slug}-en`) | ❌ **구조 불일치** |
| slug | 문서 ID로 사용 | 문서 ID로 사용 + `slug` 필드 | ✅ 호환 |
| title | `ko.title` | 최상위 `title` | ❌ 위치 다름 |
| content | `ko.content` (md) | 최상위 `content` (md) | ❌ 위치 다름 |
| summary | `ko.summary` | 최상위 `summary` (160자 max) | ❌ 위치 다름 |
| author | `author: {uid, name, role}` | `author: string` (기본값 'MONKOS') | ❌ **타입 불일치** (객체 vs 문자열) |
| thumbnail | `thumbnail: URL` | `thumbnail: URL` | ✅ 일치 |
| ogImage | `ogImage: URL` | 미구현 | ❌ **누락** |
| tags | `tags: string[]` | `tags: string[]` | ✅ 일치 |
| category | `category: "blog"|"news"|"guide"` | 미구현 | ❌ **누락** |
| published | `published: boolean` | `published: boolean` | ✅ 일치 |
| createdAt | `createdAt` | `createdAt: ISO8601` | ✅ 일치 |
| updatedAt | `updatedAt` | `updatedAt: ISO8601` | ✅ 일치 |
| — | — | `lang: string` | ➕ 현재에만 있음 |
| — | — | `viewCount: number` | ➕ 현재에만 있음 |
| — | — | `originalSlug: string` | ➕ 현재에만 있음 (번역 원본 추적) |
| — | — | `autoTranslated: boolean` | ➕ 현재에만 있음 |

### 핵심 차이 요약 (blog_posts)

**1. 다국어 구조 (가장 큰 차이)**
- v4 설계: 1문서 = 다국어 통합 (`blog_posts/{slug}` 안에 ko/ja/en 필드)
- 현재 구현: 1문서 = 1언어 (`{slug}` = ko, `{slug}-ja` = ja, `{slug}-en` = en)
- 현재 구현이 더 실용적: 자동번역 시 별도 문서 생성이 자연스럽고, 언어별 독립 CRUD 가능

**2. author 타입**
- v4: 객체 `{uid, name, role}`
- 현재: 문자열 `'MONKOS'`
- v4 스키마가 더 정교하지만, 현재 단일 저자 체계에서는 문자열로 충분

**3. 누락 필드**
- `ogImage`: Puppeteer 자동 생성 파이프라인 구현 시 추가 필요
- `category`: blog/news/guide 분류. 현재 미구현 → v4에서 추가 필요

### board_posts 비교

| 필드 | v4 문서 스키마 | 현재 CMS 구현 | 차이 |
|------|--------------|-------------|------|
| category | `"beauty"|"photo"|"ai"|"travel"|"free"|"notice"` | `"후기"|"문의"|"건의"` | ❌ **카테고리 불일치** |
| author | `author: {uid, name, avatar}` | `author: string` (닉네임, 50자) | ❌ **타입 불일치** |
| title | `title` | `title` (200자 max) | ✅ 일치 |
| content | `content` | `content` (5000자 max) | ✅ 일치 |
| createdAt | `createdAt` | `createdAt: ISO8601` | ✅ 일치 |
| likes | `likes` | 미구현 | ❌ **누락** |
| replies | `replies[]` | `replies: [{text, createdAt}]` | ⚠️ 부분 일치 (v4에 구조 미명시) |
| tags | `tags[]` | 미구현 | ❌ **누락** |
| — | — | `password: string` (HMAC hash) | ➕ 현재에만 있음 (익명 삭제용) |
| — | — | `lang: string` | ➕ 현재에만 있음 |
| — | — | `published: boolean` | ➕ 현재에만 있음 |
| — | — | `updatedAt: ISO8601` | ➕ 현재에만 있음 |

### 핵심 차이 요약 (board_posts)

**1. 카테고리 체계**
- v4: 커뮤니티 지향 (뷰티/사진/AI/여행/자유/공지)
- 현재: CS 지향 (후기/문의/건의)
- **전환 필요**: v4의 커뮤니티 카테고리는 현재 CS 게시판과 성격이 다름. 병존 or 전환 결정 필요

**2. 인증 체계**
- v4: `author: {uid, name, avatar}` → **로그인 필수** (Auth 연동)
- 현재: `author: string` + `password: string` → **익명 가능** (비밀번호로 삭제)
- v4 §11에서 "게시판 글 작성"은 Auth 필요로 명시 → 현재 익명 체계와 충돌

**3. 누락 기능**
- `likes`: 좋아요 시스템 미구현
- `tags`: 태그 시스템 미구현
- 두 기능 모두 v4 커뮤니티 확장 시 구현 필요

### 기타 Firestore 컬렉션 (현재 구현에만 존재, v4 미언급)

| 컬렉션 | 용도 | v4 언급 |
|--------|------|:------:|
| `users` | 사용자 계정 + 크레딧 | 간접 (Auth 구조에서 암시) |
| `payments` | 결제 기록 | ✗ |
| `transactions` | 크레딧 원장 | ✗ |
| `gallery_items` | 갤러리 | 간접 (§2 페이지 목록) |
| `faq_items` | FAQ | 간접 (§2 페이지 목록) |
| `chat_conversations` | 웹 챗봇 (90일 TTL) | ✗ |
| `cs_conversations` | CS 챗봇 (90일 TTL) | ✗ |
| `cs_knowledge` | RAG 지식베이스 | ✗ |
| `telegram_links` | TG ↔ 사용자 매핑 | ✗ |
| `telegramGateCodes` | TG 인증코드 (24시간) | ✗ |
| `cs_tickets` | CS 티켓 | ✗ |
| `team_reports` | 팀 내부 로그 | ✗ |

---

## 종합 판정

### v4 전환 시 안전한 영역 (코드 수정 불필요)

| 영역 | 이유 |
|------|------|
| Auth 백엔드 | API 레벨 분리, 쿠키 `.monkos.ai` 와일드카드 |
| 결제 백엔드 | 웹훅/API 불변, PG 연동 코드 독립 |
| Firestore 기존 컬렉션 | 기존 데이터 유지, 신규 필드 추가만 |
| CORS | `/crop` 내부 통합 시 오히려 단순화 |

### v4 전환 시 주의 영역 (설계 결정 필요)

| 영역 | 이슈 | 우선도 |
|------|------|:------:|
| **blog_posts 다국어 구조** | v4(단일문서) vs 현재(문서분리) — 현재 구현 유지 추천 | 🔴 |
| **blog_posts author 타입** | 객체 vs 문자열 — v4 스키마로 전환 시 마이그레이션 필요 | 🟡 |
| **blog_posts category/ogImage** | 미구현 필드 — Wave 1~2에서 추가 | 🟡 |
| **board_posts 카테고리** | CS → 커뮤니티 전환 — 기존 데이터 호환성 | 🔴 |
| **board_posts 인증** | 익명 → Auth 필수 전환 — 기존 익명 글 처리 | 🟡 |
| **`/pricing` 페이지** | 신규 구현 — 토스/LS 통합 진입점 | 🟡 |
| **크롭앱 sessionStorage** | origin 변경으로 공유 불가 — 대체 전달 방식 설계 | 🟡 |

---

## ✅ 보고 완료

| 산출물 | 상태 |
|--------|:----:|
| 1. 서브도메인 데이터 공유 현황표 | ✅ |
| 2. 크롭앱 통합 영향 분석 | ✅ |
| 3. Auth 흐름도 + v4 영향 | ✅ |
| 4. 결제 흐름도 (KR/JP) + v4 영향 | ✅ |
| 5. Firestore 스키마 비교표 | ✅ |

❌ 없음
💡 blog_posts 다국어 구조는 현재 구현(문서분리) 유지 추천. v4 문서를 현재 구현 기준으로 보정하는 것이 안전.
⏳ 없음
📁 `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내3_포털v4_서브도메인데이터_Auth결제안정성.md`
🔀 코드 수정 없음 (리서치만)
