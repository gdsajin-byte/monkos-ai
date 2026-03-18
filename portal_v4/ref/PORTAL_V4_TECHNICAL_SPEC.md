---
type: technical_spec
date: 2026-03-14
author: M1/쌍아
subject: MONKOS Portal v4 종합 기술명세
version: "1.0"
status: rollback_active
---

# MONKOS Portal v4 — 종합 기술명세

> **작성**: [2026-03-14 06:58 KST] M1/쌍아
> **대상**: monkos.ai 포털 index.html v4 전면 전환
> **현재 상태**: v3 라이브 / v4 preview 유지 (0% 트래픽)
> **소스 커밋**: `2cf33fd` (main)

---

## 1. 개요

v3 포털(단일 index.html 2510줄, 다크 테마, 단일컬럼)을 v4(265줄 HTML + CSS/JS 7파일 외부 분리, 라이트 테마, 3컬럼 그리드)로 전면 교체한 작업의 기술명세.

### 핵심 변경 요약

| 항목 | v3 | v4 |
|------|----|----|
| index.html 줄수 | 2,510 | 265 |
| 인라인 CSS/JS | 전부 인라인 | 전부 외부 분리 |
| 테마 | 다크 (#0a0a1a) | 라이트 (#FAFAF8) |
| 레이아웃 | 단일 컬럼 | 3컬럼 CSS Grid (200px \| 1fr \| 180px) |
| 파일 수 | 1 (index.html) | 8 (HTML 1 + CSS 1 + JS 5 + backup 1) |

---

## 2. 시계열 — 전체 작업 흐름

### Phase 0: 리서치 (21:30~22:00 KST, 2026-03-13)

쌍아 지시서 4건 하달 → 막내1~4 병렬 리서치 수행.

| 시각 | 에이전트 | 작업 | 산출물 |
|------|---------|------|--------|
| ~21:30 | 막내1 | 프레임워크 설계분석 | `REPORT_20260313_M1막내1_포털v4_프레임워크설계분석.md` (430줄) |
| ~21:30 | 막내2 | 충돌지점 전수조사 | `REPORT_20260313_막내2_포털v4_충돌지점전수조사.md` (318줄) |
| ~21:30 | 막내3 | 서브도메인·Auth·결제 안정성 | `REPORT_20260313_막내3_포털v4_서브도메인데이터_Auth결제안정성.md` (479줄) |
| ~21:30 | 막내4 | 배포라인 설계+롤백 전략 | `REPORT_20260313_막내4_포털v4_배포라인설계+롤백전략.md` (438줄) |

### Phase 1: Wave 0 — 기반 작업 (21:30~22:40 KST)

| 시각 | 에이전트 | 작업 | 커밋 |
|------|---------|------|------|
| ~22:00 | 막내1 | **Wave 0-A**: render.js fragment 분리 — `layoutShell()` + 7개 `*Fragment()` 신설 | `8f9ea8f` |
| ~22:00 | 막내2 | **Wave 0-B**: deploy.sh 블루/그린 배포 준비 — `--to-latest`, `preview` 모드 신설 | `d0f4a00` |
| 22:40 | 쌍아 | Wave 0 검토 통과 + 지시서 6건·보고서 3건 커밋 | `da8cb0c` |

### Phase 2: Wave 1 — v4 구현 + 배포 (22:40~23:18 KST)

| 시각 | 에이전트 | 작업 | 커밋/리비전 |
|------|---------|------|------------|
| 22:40 | 쌍아 | Wave 1-A/B 지시서 발급 | — |
| ~23:00 | 막내1 | **Wave 1-A**: index.html v4 전면 교체 (265줄 HTML + 7파일) | `2cf33fd` |
| 23:00 | — | push 완료 (`da8cb0c..2cf33fd → main`) | — |
| ~23:03 | 막내2 | **Wave 1-B**: `./deploy.sh preview` → rev `monkos-portal-00141-gik` (0% 트래픽) | — |
| ~23:10 | 막내2 | preview 검증 25항목 전수 확인 — 차단 이슈 없음 | — |
| 23:18 | 막내2 | `gcloud run services update-traffic --to-latest` → v4 100% 라이브 | — |

### Phase 3: 롤백 (23:19~23:22 KST)

| 시각 | 에이전트 | 작업 |
|------|---------|------|
| 23:19 | 작가님 | 실서비스 확인 — **컨텐츠 카드 얼어있음** (인터랙션 미동작) |
| 23:22 | 쌍아 | 롤백 실행: `--to-revisions monkos-portal-00133-9f6=100` |
| 23:22 | — | v4 preview 유지 (0% 트래픽, `v4-preview` 태그) |

---

## 3. 리서치 결과 종합

### 3.1 프레임워크 설계분석 (막내1)

**v3 구조 진단**:
- index.html 2,510줄 = HTML 720 + CSS 590 + JS 1,200
- 전역 변수 23개, 인라인 이벤트 핸들러 15개소
- 다크 테마 변수 36개 (#0a0a1a 기반)

**전환 전략 비교**:
| 전략 | 설명 | 채택 |
|------|------|------|
| A: 전면 교체 | 신규 HTML 작성 + CSS/JS 외부 분리 | **채택** |
| B: 점진 마이그레이션 | 기존 코드 내 점진 수정 | 기각 (2,510줄 내 수정 위험도 높음) |
| C: 프레임워크 도입 | React/Vue 등 SPA 전환 | 기각 (SSR 공존 복잡도 과다) |

**SPA+SSR 공존 설계**:
- render.js `layoutShell()` 공통 함수로 SSR 페이지에 동일 레이아웃 적용
- Wave 0-A에서 fragment 분리로 준비 완료
- SSR 페이지(blog/faq/gallery/board)는 Wave 2~3에서 순차 적용

**반응형 설계 권고**:
- 3단계: 데스크톱(3컬럼) → 태블릿 ≤1024px(2컬럼) → 모바일 ≤768px(1컬럼)

### 3.2 충돌지점 전수조사 (막내2)

**6개 영역 조사 결과**:

| 영역 | 위험도 | 내용 |
|------|--------|------|
| CSS 테마 | **H** | `--text-*` → `--ink-*` 변수 체계 전면 변경. 36개 변수 중 15 신규, 12 변경, 3 폐기 |
| CMS SSR | **H** | render.js 7개 렌더러 전부 v3 단일컬럼 기준 → 3컬럼 셸과 비호환 |
| 네비게이션 | M | v3 해시 앵커 → v4 sticky nav + /pricing 인터셉트 변경 |
| 카피 | L | "AI 리터칭" 등 마케팅 카피 대응 필요 |
| 챗봇 | **H** | v3 FAB+패널 → v4 하단바+모달 패턴으로 전면 변경 |
| 언어스위치 | M | 리전 셀렉터 UI 제거, setLang() 자동추론으로 대체 |

**CSS 변수 마이그레이션 맵** (주요):
```
v3 --bg: #0a0a1a       →  v4 --bg: #FAFAF8
v3 --text: #e0e0e0     →  v4 --ink: #1a1a2e
v3 --text-secondary    →  v4 --ink-m: #666680
v3 --accent: #6c63ff   →  v4 --accent: #4a90d9 (→ 실제 구현에서 --blue)
v3 --card-bg: #1a1a2e  →  v4 --card: #FFFFFF
```

### 3.3 서브도메인·Auth·결제 안정성 (막내3)

**서브도메인 공유 지점 7개**:
1. Cookie (`monkos_session`, Domain=`.monkos.ai`) — Auth 공유
2. `/api/auth/token` — 포털 → idphoto 토큰 전달
3. `/api/user/credits` — 크레딧 잔액 조회
4. Firestore `users` 컬렉션 — 공통 사용자 DB
5. Firestore `payments` — 결제 이력
6. Google OAuth clientId — 3서비스 동일
7. Kakao/LINE OAuth — 포털에서만 사용

**Auth 흐름**:
```
사용자 → 로그인 버튼 → loginModal 오픈
  → Google GIS / Kakao SDK / LINE redirect
  → 팝업 완료 → postMessage → restoreSession()
  → Cookie 설정 (monkos_session, 7일, .monkos.ai)
  → updateAuthUI() (v4: user-bar 갱신)
```

**결제 흐름**:
- KR: openCreditShop() → buyToss(amount) → `/credits` 페이지 리다이렉트 → 토스 위젯
- Global: openCreditShop() → buyCreditsLS(variantId) → `/api/checkout` → LemonSqueezy URL 오픈
- Firestore 트랜잭션 기반 크레딧 증감

**Firestore 스키마 불일치 주의**:
- `blog_posts`: multilingual 필드 구조 (title_ko, title_ja, title_en)
- `board_posts`: category 필드 매핑 불일치 (v3 잔재)

### 3.4 배포라인 설계+롤백 전략 (막내4)

**deploy.sh 분석**:
- 환경변수 24개 참조 (`.env` + 런타임)
- 2-stage Docker 빌드 (node:18-slim)
- 3가지 모드: `dev`(기본), `prod`, `preview`(신설)

**배포 전략 비교**:
| 전략 | 다운타임 | 위험도 | 채택 |
|------|---------|--------|------|
| 직접 교체 | 있음 | 높음 | 기각 |
| 카나리 | 없음 | 중간 | 기각 (복잡도) |
| **블루/그린** | 없음 | 낮음 | **채택** |
| A/B 테스트 | 없음 | 중간 | 기각 (인프라 부족) |
| 롤링 | 없음 | 중간 | 기각 (인스턴스 1개) |

**롤백 절차**:
```bash
# v4 → v3 롤백
gcloud run services update-traffic monkos-portal \
  --to-revisions monkos-portal-00133-9f6=100 \
  --region us-central1

# v3 → v4 재전환
gcloud run services update-traffic monkos-portal \
  --to-revisions monkos-portal-00141-gik=100 \
  --region us-central1
```

**서비스 의존성 맵**:
- `monkos-portal` ← `idphoto-kr`, `idphoto-jp` (크레딧/Auth/결제 경로 의존)
- 포털 v4 전환 시 idphoto 측 변경 불필요 (Cookie/API 인터페이스 무변경)

---

## 4. 파일 구성 상세

### 4.1 파일 목록

| 파일 | 줄수 | 역할 | 비고 |
|------|------|------|------|
| `public/index.html` | 265 | HTML 골격 | 인라인 CSS/JS 없음 (JSON-LD만 예외) |
| `public/css/portal.css` | 625 | 전체 CSS | :root 변수, Cr Coin 토큰, 반응형 |
| `public/js/i18n.js` | 294 | 다국어 + 리전 감지 | 전역: region, lang, t, getCtaUrl(), setLang(), applyLang() |
| `public/js/auth.js` | 235 | 인증 모듈 | 전역: currentUser, headerLogin(), googleLogin(), logout(), updateAuthUI() |
| `public/js/credits.js` | 107 | 크레딧/결제 | 전역: openCreditShop(), closeCreditShop(), buyCreditsLS(), buyToss() |
| `public/js/chat.js` | 105 | 챗봇 | 전역: openChat(), closeChat(), sendMessage() |
| `public/js/main.js` | 139 | 초기화 + 이벤트 | DOMContentLoaded 바인딩 |
| `public/backup/v3/index.html` | 2,510 | v3 원본 백업 | 롤백 참조용 |
| **합계** | **1,770** | | v3 대비 -740줄 (2,510 → 1,770) |

### 4.2 JS 로드 순서 및 의존성

```
index.html 내 <script> 순서:

1. js/i18n.js      ← 최초 로드. lang/region/t 전역 설정
2. js/auth.js      ← i18n.js의 lang, region 참조
3. js/credits.js   ← auth.js의 currentUser 참조
4. js/chat.js      ← i18n.js의 t, lang 참조
5. js/main.js      ← 위 4개 전역 함수 모두 참조하여 이벤트 바인딩
```

**전역 변수/함수 맵**:

| 파일 | 내보내는 전역 |
|------|-------------|
| i18n.js | `region`, `lang`, `t`, `getCtaUrl()`, `setLang()`, `applyLang()`, `getCookie()`, `setCookie()`, `detectRegion()` |
| auth.js | `currentUser`, `headerLogin()`, `googleLogin()`, `kakaoLogin()`, `lineLogin()`, `logout()`, `updateAuthUI()`, `restoreSession()`, `initGoogleAuth()`, `toggleLogoutPopover()` |
| credits.js | `openCreditShop()`, `closeCreditShop()`, `buyCreditsLS()`, `buyToss()`, `CREDIT_PACKAGES` |
| chat.js | `openChat()`, `closeChat()`, `sendMessage()`, `chatOpen`, `sessionId` |
| main.js | `handleCtaClick()` |

### 4.3 HTML 구조 (index.html)

```
<head>
  SEO meta, OG tags, hreflang (ko/ja/en), JSON-LD 구조화 데이터
  theme-color: #FAFAF8
  <link rel="stylesheet" href="css/portal.css">

<body lang="ja">
  .hero              — 컴팩트 다크 배너 (브랜드 아이덴티티)
  .user-bar          — 언어 스위치 + CTA 버튼 + 로그인/크레딧/프로바이더 뱃지
  .gallery-strip     — before/after 5쌍 자동 스크롤 (30ms 간격, 0.8px/tick)
  nav (sticky)       — 6개 링크 (/pricing → openCreditShop 인터셉트)
  .layout            — CSS Grid 3컬럼 (200px | 1fr | 180px)
    .left-sb         — 매거진 카드 4장 + 태그 8개 (정적 콘텐츠)
    .main            — 인트로 + 서비스카드 2열 + 활용법 3단계 + 블로그 4건 + 뉴스 2건
    .right-sb        — 가이드 카드 2장 + 크레딧 안내
  footer             — 사업자정보 + 링크 + 저작권 (SSR 포함)
  .chatbot-bar       — 하단 고정 입력창 (#cbInput + #cbSend)
  모달 5개:
    #chatModal       — 채팅 모달 (chatbot-bar에서 오픈)
    #loginModal      — OAuth 로그인 (Google/Kakao/LINE)
    #creditShopModal — 크레딧 충전 (Toss KR / LemonSqueezy Global)
    #privacyModal    — 개인정보 동의
    #portraitModal   — 초상권 동의

  <script> × 5 (순서 고정: i18n → auth → credits → chat → main)
```

### 4.4 CSS 아키텍처 (portal.css)

**:root 변수 체계**:
```css
/* 배경/잉크 */
--bg: #FAFAF8;           --ink: #1a1a2e;
--ink-m: #666680;        --ink-l: #9999aa;

/* 카드/서피스 */
--card: #FFFFFF;         --card-hover: #f0f0f5;
--side: #f5f5f0;         --border: #e0e0dd;

/* 브랜드 컬러 */
--blue: #4a90d9;         --green: #27ae60;
--gold: #f5a623;         --red: #e74c3c;

/* Cr Coin 전용 토큰 */
--cr-bg: #f8f4e8;        --cr-border: #e8d5a0;
--cr-text: #8b6914;      --cr-accent: #d4a017;
```

**반응형 브레이크포인트**:
| 화면폭 | 레이아웃 | 변경사항 |
|--------|---------|---------|
| >1024px | 3컬럼 (200px \| 1fr \| 180px) | 전체 레이아웃 |
| ≤1024px | 2컬럼 (1fr \| 180px) | 좌 사이드바 숨김 |
| ≤768px | 1컬럼 | 양 사이드바 숨김, 서비스카드·활용법 1컬럼 |

---

## 5. 주요 기능 모듈

### 5.1 다국어 + 리전 (i18n.js)

- **지원 언어**: ja (기본), ko, en
- **리전 매핑**: `ko` → `kr`, `ja`/`en` → `global`
- **자동 추론**: `setLang()` 호출 시 리전 자동 결정 (수동 리전 전환 UI 없음)
- **LINE 버튼 분기**: `region === 'kr'` → LINE 로그인 버튼 숨김
- **번역 데이터 구조**:
  ```javascript
  var translations = {
    ja: { hero: '...', ctaBtn: '...', /* 40+ 키 */ },
    ko: { hero: '...', ctaBtn: '...', /* 40+ 키 */ },
    en: { hero: '...', ctaBtn: '...', /* 40+ 키 */ }
  };
  ```
- **동의 텍스트**: `consentTexts` 객체에 3개 언어 privacy/portrait 동의문

### 5.2 인증 (auth.js)

- **Google GIS**: 동적 스크립트 로드 + 3회 재시도 (1초 간격)
- **세션 복원**: `restoreSession()` — 쿠키 `monkos_session` → `/api/auth/restore` POST → currentUser 설정
- **OAuth 팝업**: `window.open()` → 완료 시 `postMessage` 수신 → `restoreSession()` 재호출
- **v4 UI 적응**: `updateAuthUI()` — `.user-bar` 내 프로바이더 뱃지·크레딧·사용자명 갱신

### 5.3 결제 (credits.js)

- **한국 (region=kr)**: Toss Payments → `/credits` 페이지 리다이렉트
  - 5개 패키지: ₩1,450(10c) ~ ₩49,900(500c+250 bonus)
- **글로벌 (region=global)**: LemonSqueezy → `/api/checkout` → 외부 결제 URL
  - 5개 패키지: ¥150(10c) ~ ¥5,990(500c+250 bonus)
- **CREDIT_PACKAGES 배열**: 정의되어 있으나 미사용 (renderShopItems()가 하드코딩) → TODO

### 5.4 챗봇 (chat.js)

- **패턴**: 하단바 입력 (`chatbot-bar`) → 모달 오픈 (`chatModal`)
- **API**: `/api/chat` POST (message, sessionId, lang)
- **세션 ID**: `s_` + timestamp + random (클라이언트 생성)
- **타이핑 인디케이터**: 3-dot 애니메이션
- **XSS 방어**: URL auto-link만 허용 (innerHTML 사용 — 주의 필요)

### 5.5 메인 이벤트 (main.js)

- **즉시 실행**: `restoreSession()` (스크립트 로드 시)
- **window.onload**: `initGoogleAuth()` (GIS SDK 로드 대기)
- **DOMContentLoaded 바인딩**:
  - CTA: `.btn-shoot` 클릭 → `handleCtaClick()` (토큰 전달)
  - 서비스 카드: `.svc.live` 클릭 → CTA 동일
  - 크롭앱: `.svc.free` 클릭 → `crop.monkos.ai` 새 탭
  - 갤러리: `#gt` 자동 스크롤 (30ms, 0.8px)
  - 로그아웃 팝오버: 외부 클릭 닫기
  - 모달 백드롭: 4개 모달 외부 클릭 닫기

---

## 6. SSR 페이지 공존 전략

### 6.1 render.js fragment 분리 (Wave 0-A, 커밋 `8f9ea8f`)

- `layoutShell()` 공통 셸 함수 신설 — 3컬럼 HTML 구조 반환
- 7개 렌더러를 `*Fragment()` + `render*()` 이중 구조로 분리:
  - `renderBlog()` → `blogFragment()` + `renderBlog()`
  - `renderFaq()` → `faqFragment()` + `renderFaq()`
  - `renderGallery()` → `galleryFragment()` + `renderGallery()`
  - `renderBoard()` → `boardFragment()` + `renderBoard()`
  - (+ 3개 추가 렌더러)
- **server.js 무수정** — 기존 시그니처 100% 호환
- **현재 상태**: fragment 분리만 완료. SSR 페이지에 v4 셸 적용은 Wave 2~3

### 6.2 SSR ↔ SPA 테마 불일치 (미해결)

- SSR 페이지(blog/faq/gallery/board): 아직 v3 다크 테마 기반
- v4 포털은 라이트 테마 (#FAFAF8)
- **해결 방향**: Wave 2~3에서 `layoutShell()` 호출 시 v4 CSS 변수 적용 + portal.css 공유

---

## 7. 배포 인프라

### 7.1 Cloud Run 설정

- **서비스명**: `monkos-portal`
- **리전**: `us-central1`
- **빌드**: 2-stage Docker (node:18-slim)
- **deploy.sh 모드**:
  - `dev` — 기본, `--to-latest` 즉시 트래픽
  - `prod` — `--to-latest` + 프로덕션 태그
  - `preview` — `--no-traffic --tag v4-preview` (0% 트래픽)

### 7.2 현재 리비전 상태

| 리비전 | 버전 | 트래픽 | 태그 |
|--------|------|--------|------|
| `monkos-portal-00133-9f6` | v3 | **100%** | — |
| `monkos-portal-00141-gik` | v4 | 0% | `v4-preview` |

### 7.3 Preview URL

```
https://v4-preview---monkos-portal-4jeplpqpua-uc.a.run.app
```

### 7.4 롤백/전환 명령

```bash
# v3 → v4 전환
gcloud run services update-traffic monkos-portal \
  --to-revisions monkos-portal-00141-gik=100 \
  --region us-central1

# v4 → v3 롤백
gcloud run services update-traffic monkos-portal \
  --to-revisions monkos-portal-00133-9f6=100 \
  --region us-central1
```

---

## 8. 알려진 이슈

### 8.1 차단 이슈 (재배포 전 필수 수정)

| # | 이슈 | 심각도 | 상세 |
|---|------|--------|------|
| 1 | **컨텐츠 카드 인터랙션 미동작** | CRITICAL | 실서비스 전환 후 작가님 확인. 스크롤/클릭 반응 없음. 원인 미확정 — CSS overflow? JS 이벤트 미바인딩? sticky 사이드바 z-index 충돌? |

### 8.2 후속 정리 (Wave 2~3)

| # | 이슈 | 우선도 | 상세 |
|---|------|--------|------|
| 2 | `setRegion()` / `updateRegionButtons()` 미구현 | LOW | Wave 3 IP 기반 분기 때 함께 구현 |
| 3 | `CREDIT_PACKAGES` 배열 미사용 | LOW | renderShopItems() 하드코딩과 통합 필요 |
| 4 | `#ctaBtn` dead 참조 in applyLang() | LOW | null-guard로 에러 없으나 제거 대상 |
| 5 | obfuscate.mjs JSON-LD 오탐 | LOW | `<script type="application/ld+json">` 파싱 에러 경고 (실영향 없음) |
| 6 | SSR 페이지 다크↔라이트 불일치 | MEDIUM | render.js 셸 교체 필요 (Wave 2~3) |
| 7 | npm 취약점 8건 | LOW | 7 low + 1 high, 별도 점검 |

### 8.3 기존 미결 (이전 세션 이월)

| # | 이슈 | 상태 |
|---|------|------|
| 8 | 위젯 렌더 2~3초 지연 | 작가님 판단 대기 |
| 9 | GA4 측정 ID KR/JP 동일 (`G-JPZWSJ3323`) | 의도 확인 필요 |

---

## 9. 참조 문서

### 세션 로그
- `monkos-ops/ops/sessions/2026-03-13_M1_쌍아.md`
- `monkos-ops/ops/sessions/2026-03-13_M1_막내1.md`
- `monkos-ops/ops/sessions/2026-03-13_M1_막내2.md`

### 지시서
- `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내1_Wave0_renderjs_fragment분리.md`
- `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내2_Wave0_deploysh_블루그린준비.md`
- `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내1_Wave1_indexhtml_v4전면교체.md`
- `monkos-ops/ops/orders/2026-03/ORDER_20260313_M1쌍아_막내2_Wave1_preview배포+검증.md`

### 리서치 보고서
- `monkos-ops/ops/reports/2026-03/REPORT_20260313_M1막내1_포털v4_프레임워크설계분석.md` (430줄)
- `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내2_포털v4_충돌지점전수조사.md` (318줄)
- `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내3_포털v4_서브도메인데이터_Auth결제안정성.md` (479줄)
- `monkos-ops/ops/reports/2026-03/REPORT_20260313_막내4_포털v4_배포라인설계+롤백전략.md` (438줄)

### 코드 (v4 산출물)
- `monkos_AI/portal/public/index.html` (265줄)
- `monkos_AI/portal/public/css/portal.css` (625줄)
- `monkos_AI/portal/public/js/i18n.js` (294줄)
- `monkos_AI/portal/public/js/auth.js` (235줄)
- `monkos_AI/portal/public/js/credits.js` (107줄)
- `monkos_AI/portal/public/js/chat.js` (105줄)
- `monkos_AI/portal/public/js/main.js` (139줄)
- `monkos_AI/portal/public/backup/v3/index.html` (2,510줄 — v3 원본 백업)

### 커밋 이력
| 해시 | 메시지 | 에이전트 |
|------|--------|---------|
| `8f9ea8f` | `[refactor] render.js fragment 분리 — v4 3컬럼 셸 준비` | 막내1 |
| `d0f4a00` | `[feat] deploy.sh 블루/그린 배포 준비 — --to-latest + preview 모드` | 막내2 |
| `da8cb0c` | `[ops] 포털 v4 Wave 0 지시서 6건 + 보고서 3건 정리` | 쌍아 |
| `2cf33fd` | `[feat] index.html v4 전면 교체 — 3컬럼 라이트 테마 + CSS/JS 7파일 분리` | 막내1 |
