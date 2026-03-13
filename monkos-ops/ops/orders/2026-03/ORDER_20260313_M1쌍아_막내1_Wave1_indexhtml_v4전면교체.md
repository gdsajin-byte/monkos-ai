---
type: task
from: M1/쌍아
to: 막내1
date: 2026-03-13 22:07 KST
status: open
priority: high
tags: [포털v4, Wave1, index.html, 3컬럼, 라이트테마, JS분리]
---

# Wave 1-A: index.html v4 전면 교체 + CSS/JS 파일 분리

## 배경

Wave 0 완료 (render.js fragment 분리 + deploy.sh 블루/그린 준비).
이제 포털 메인 페이지를 v4 3컬럼 라이트 테마로 전면 교체한다.

프로토타입 HTML이 이미 존재하며, 현재 index.html의 40개 JS 함수를 외부 파일로 분리하면서 새 HTML 구조에 맞게 이식한다.

## ⚠ 핵심 제약: 파일 크기 제한

**index.html은 300줄 이내.** HTML 골격 + `<link>` + `<script src>` 참조만 포함한다.
CSS, JS는 **반드시 외부 파일로 분리**. 인라인 `<style>`, 인라인 `<script>` 금지.
v3의 2510줄 단일 파일 구조를 절대 반복하지 않는다.

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/public/index.html` | 현재 v3 (2510줄, 다크 테마, 인라인 JS) |
| `/Users/macmini/Desktop/쌍아/files 2/MONKOS_Portal_v4_3col.html` | v4 프로토타입 (3컬럼, 라이트 테마, 정적 목업) |
| `/Users/macmini/Desktop/쌍아/files 2/MONKOS_포털v4_쌍아전달_최종.md` | v4 설계 문서 18개 섹션 |

## 대상 파일

| 파일 | 작업 | 예상 줄수 |
|------|------|----------|
| `monkos_AI/portal/public/backup/v3/index.html` | 신규 — v3 백업 | (원본 복사) |
| `monkos_AI/portal/public/index.html` | 전면 교체 | **~300줄** |
| `monkos_AI/portal/public/css/portal.css` | 신규 — CSS 전체 | ~500줄 |
| `monkos_AI/portal/public/js/auth.js` | 신규 — 인증 모듈 | ~200줄 |
| `monkos_AI/portal/public/js/credits.js` | 신규 — 크레딧/결제 모듈 | ~150줄 |
| `monkos_AI/portal/public/js/chat.js` | 신규 — 챗봇 모듈 | ~100줄 |
| `monkos_AI/portal/public/js/i18n.js` | 신규 — 다국어/리전 모듈 | ~300줄 |
| `monkos_AI/portal/public/js/main.js` | 신규 — 초기화 + 이벤트 바인딩 | ~100줄 |

## 작업 순서

### 1단계: v3 백업

```bash
mkdir -p monkos_AI/portal/public/backup/v3
cp monkos_AI/portal/public/index.html monkos_AI/portal/public/backup/v3/index.html
```

백업 후 원본과 diff로 동일성 확인.

### 2단계: HTML 구조 교체

프로토타입(`MONKOS_Portal_v4_3col.html`)의 HTML 구조를 기반으로 index.html을 재작성한다.

#### v4 HTML 골격

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <!-- SEO: 현재 v3의 meta/OG/hreflang/JSON-LD 100% 유지 -->
  <!-- 폰트: 프로토타입의 Google Fonts 링크 사용 -->
  <!-- CSS: 외부 파일로 분리 (인라인 <style> 금지) -->
  <link rel="stylesheet" href="/css/portal.css">
</head>
<body>
  <!-- 히어로 배너 (컴팩트 다크) -->
  <div class="hero">...</div>

  <!-- 유저바 (인증 + 크레딧 + 언어) -->
  <div class="user-bar" id="userBar">...</div>

  <!-- 갤러리 슬라이더 (before/after) -->
  <div class="gallery-strip">...</div>

  <!-- 스티키 네비게이션 -->
  <nav>...</nav>

  <!-- 3컬럼 레이아웃 -->
  <div class="layout">
    <aside class="left-sb">...</aside>
    <main class="main" id="mainContent">...</main>
    <aside class="right-sb">...</aside>
  </div>

  <!-- 푸터 -->
  <footer>...</footer>

  <!-- 챗봇 바 (하단 고정) -->
  <div class="chatbot-bar">...</div>

  <!-- 모달: 챗봇, 로그인, 크레딧샵, 동의 -->
  <div class="chat-modal" id="chatModal">...</div>
  <div id="loginModal">...</div>
  <div id="creditShopModal">...</div>
  <div id="privacyModal">...</div>
  <div id="portraitModal">...</div>

  <!-- JS 외부 파일 -->
  <script src="/js/i18n.js"></script>
  <script src="/js/auth.js"></script>
  <script src="/js/credits.js"></script>
  <script src="/js/chat.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>
```

#### 주요 섹션별 지침

**A) `<head>` — SEO 100% 보존**
- 현재 v3의 `<meta>`, OG 태그, hreflang, JSON-LD 구조화 데이터를 그대로 유지
- `lang="ja"` 유지 (JS applyLang()이 동적으로 변경)
- `<meta name="theme-color">`: `#0f0f23` → `#FAFAF8` 변경
- 파비콘 링크 유지
- 프로토타입의 Google Fonts 링크 추가:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  ```

**B) CSS — `public/css/portal.css`로 완전 외부 분리**
- index.html에 `<style>` 태그 금지. 모든 CSS는 `portal.css`에 작성
- 프로토타입의 `:root` CSS 변수 + 전체 스타일을 `portal.css`로 이동:
  ```css
  /* portal.css */
  :root {
    --bg: #FAFAF8;
    --white: #FFF;
    --surface: #F5F4F0;
    --border: #E8E6E1;
    --ink: #1A1A18;
    --accent: #4A3ABA;
    --accent-l: #6C5CE7;
    --accent-xl: #A78BFA;
    --green: #1A7A5C;
    --serif: 'Cormorant Garamond', Georgia, serif;
    --sans: 'Noto Sans KR', -apple-system, sans-serif;
    --mono: 'DM Mono', monospace;
    /* ... 프로토타입 전체 변수 */
  }
  ```
- Cr Coin 토큰(`--cr-*`)은 현재 v3에서 가져와 유지 (크레딧 동전 디자인)
- 모달 스타일(로그인, 크레딧샵, 동의)도 `portal.css`에 포함
- 반응형 미디어 쿼리도 `portal.css` 하단에 배치

**C) 히어로 — 컴팩트 다크 배너**
- 프로토타입의 `.hero` 그대로 사용
- i18n 적용을 위해 텍스트 요소에 `data-i18n` 속성 또는 기존 ID 부여:
  - `#heroTitle` → "MONKOS AI"
  - 서브텍스트: "Photography × AI × K-Beauty"

**D) 유저바 — 동적 인증 UI**
- 프로토타입의 `.user-bar` 구조 사용
- **비로그인 시**: 로그인 버튼 표시 (현재 v3의 `headerLogin()` 연결)
- **로그인 시**: 유저명 + 크레딧 잔고 + 프로바이더 아이콘 + 로그아웃 팝오버
- 언어 스위치: 프로토타입의 `.lang-sw` 구조 사용 + 기존 `setLang()` 연결
- CTA 버튼: "촬영 시작하기" → 기존 `getCtaUrl()` + 토큰 전달 로직 연결

**E) 갤러리 슬라이더**
- 프로토타입의 `.gallery-strip` + `.gallery-track` 그대로 사용
- 자동 스크롤 JS 포함 (프로토타입에 있는 간단한 setInterval)

**F) 스티키 네비게이션**
- 프로토타입의 `<nav>` 구조 사용
- 링크 목록:
  ```
  홈(/) | 블로그(/blog) | FAQ(/faq) | 갤러리(/gallery) | 게시판(/board) | 가격(/pricing)
  ```
- `/pricing`은 현재 없으므로 클릭 시 `openCreditShop()` 호출
- 크롭앱은 Wave 1에서 네비에 포함하지 않음 (내부 라우트 구현은 후속 Wave)
- `data-i18n` 속성으로 다국어 대응

**G) 3컬럼 레이아웃**
- 프로토타입의 `.layout` CSS 그리드 그대로:
  ```css
  .layout { display: grid; grid-template-columns: 200px 1fr 180px; gap: 0; max-width: 1280px; margin: 0 auto; }
  ```
- 좌 사이드바(`.left-sb`): 프로토타입의 매거진 카드 + 태그 — **정적 목업 데이터** (Wave 2에서 Firestore 연동)
- 메인(`.main`): 프로토타입의 서비스카드 + 활용법 + 블로그 리스트 + 업계소식 — **정적 목업 데이터**
- 우 사이드바(`.right-sb`): 가이드 카드 + 크레딧 안내 — **정적 목업 데이터**

**H) 서비스 카드 (메인 영역)**
- 2열 그리드: AI 증명사진(LIVE) + 무료 크롭앱(FREE)
- AI 증명사진 카드 클릭 → CTA URL (기존 로직)
- 크롭앱 카드 → `href="https://crop.monkos.ai"` target="_blank" (임시, 후속 Wave에서 /crop 내부 전환)

**I) 푸터**
- 프로토타입의 `<footer>` 구조 사용
- 사업자 정보 텍스트 유지
- 링크: 개인정보처리방침(/privacy), 이용약관(/terms), 환불정책(/refund), 고객센터(t.me/monkos_bot), crop.monkos.ai
- SNS 아이콘은 Wave 2에서 추가 (이번엔 미포함)

**J) 챗봇**
- 프로토타입의 `.chatbot-bar` (하단 고정 입력창) + `.chat-modal` (확장 모달) 구조 사용
- 기존 v3의 채팅 기능(`sendMessage`, `addMessage`, `showTyping`, `hideTyping`) 이식
- 챗봇바 입력 → Enter 또는 전송 버튼 → 모달 열림 + 메시지 전송
- `/api/chat` 엔드포인트 호출 로직 그대로 유지

**K) 모달 — 기존 기능 이식**
- 로그인 모달(`#loginModal`): v3 구조 유지 — Google/Kakao/LINE 버튼 (리전별 분기)
- 크레딧샵 모달(`#creditShopModal`): v3 구조 유지 — renderShopItems() 동적 렌더링
- 동의 모달(`#privacyModal`, `#portraitModal`): v3 구조 유지
- 스타일만 라이트 테마에 맞게 조정

**L) 반응형 (모바일)**
- 768px 이하:
  ```css
  .layout { grid-template-columns: 1fr; }
  .left-sb, .right-sb { display: none; }
  ```
- 1024px 이하:
  ```css
  .layout { grid-template-columns: 1fr 180px; }
  .left-sb { display: none; }
  ```
- 챗봇바: 하단 고정 유지

### 3단계: JS 파일 분리

현재 index.html의 인라인 JS 40개 함수를 5개 외부 파일로 분리한다.

#### `public/js/i18n.js` — 다국어 + 리전 + 유틸

```
포함 함수:
- i18n 객체 (ja/ko/en 번역 데이터)
- consentTexts 객체
- detectRegion()
- getCookie(name)
- setCookie(name, value)
- updateRegionButtons()
- setRegion(newRegion)     → window.setRegion 으로 expose
- detectLang()
- applyLang()
- setLang(newLang)         → window.setLang 으로 expose
- toggleLangDropdown()     → window.toggleLangDropdown
- closeLangDropdown()      → window.closeLangDropdown
- getCtaUrl()

전역 변수:
- region, lang, t
```

#### `public/js/auth.js` — 인증

```
포함 함수:
- GOOGLE_CLIENT_ID (상수)
- loadGIS()
- loadGISWithRetry()
- restoreSession()
- initGoogleAuth()
- loginKakao()             → window.loginKakao
- loginLine()              → window.loginLine
- headerLogin()            → window.headerLogin
- closeLoginModal()        → window.closeLoginModal
- googleLogin()            → window.googleLogin
- handleGoogleTokenCallback()
- handleGoogleCallback()
- logout()                 → window.logout
- updateAuthUI()
- toggleLogoutPopover()    → window.toggleLogoutPopover
- showConsentModal(type)   → window.showConsentModal
- closeConsentModal(type)  → window.closeConsentModal

전역 변수:
- currentUser, gisLoaded, gisLoadRetries, GIS_MAX_RETRIES
```

#### `public/js/credits.js` — 크레딧/결제

```
포함 함수:
- CREDIT_PACKAGES (상수)
- TOSS_CLIENT_KEY, TOSS_ENABLED (상수)
- openCreditShop()         → window.openCreditShop
- closeCreditShop()        → window.closeCreditShop
- renderShopItems()
- buyCreditsLS(variantId)  → window.buyCreditsLS
- buyToss(amount)          → window.buyToss
- loadTossSDK()

전역 변수:
- tossPayments
```

#### `public/js/chat.js` — 챗봇

```
포함 함수:
- toggleChat()
- closeChat()
- addMessage(text, type)
- showTyping()
- hideTyping()
- sendMessage()

전역 변수:
- chatOpen, sessionId, isLoading
```

#### `public/js/main.js` — 초기화 + 이벤트 바인딩

```
역할:
- DOMContentLoaded 또는 즉시 실행
- restoreSession() 호출
- window.addEventListener('load', initGoogleAuth)
- CTA 버튼 이벤트 리스너
- 문서 클릭 핸들러 (팝오버/드롭다운 닫기)
- 챗봇 이벤트 리스너 (send, close, Enter키, 입력창 클릭)
- 갤러리 자동 스크롤 setInterval
- 모달 backdrop 클릭 닫기
```

#### JS 분리 원칙

1. **`<script src>` 순서 중요**: i18n → auth → credits → chat → main (의존성 순)
2. **onclick 핸들러**: HTML에서 `onclick="functionName()"` 사용하는 함수는 `window.functionName = functionName` 으로 전역 노출
3. **전역 변수 공유**: `window.currentUser`, `window.region`, `window.lang` 등으로 파일 간 공유
4. **기능 변경 없음**: 함수 내부 로직은 수정하지 않음. DOM 셀렉터만 새 HTML 구조에 맞게 업데이트

### 4단계: DOM 셀렉터 업데이트

JS 함수 내부에서 참조하는 DOM 요소를 새 HTML의 ID/class에 맞게 수정한다.

주요 매핑:

| v3 셀렉터 | v4 셀렉터 | 용도 |
|-----------|-----------|------|
| `header .auth-area` | `#userBar .ub-right` | 인증 UI 영역 |
| `.header-login-btn` | `.btn-login` (신설) | 로그인 버튼 |
| `.header-balance` | `.ub-credit` | 크레딧 잔고 |
| `.balance-amount` | `.ub-credit .amt` | 크레딧 숫자 |
| `#chatPanel` | `#chatModal` | 챗봇 모달 |
| `#chatFab` | `.chatbot-bar` | 챗봇 트리거 |
| `#heroTitle`, `#heroSub` | `.hero h1`, `.hero-tag` | 히어로 텍스트 |
| `.region-btn` | `.lang-sw button` | 언어 버튼 |

**주의**: 이 매핑은 참고용. 실제 구현 시 프로토타입 HTML의 클래스명을 기준으로 JS를 맞춘다.

### 5단계: 기능 보존 체크리스트

아래 기능이 모두 동작하는지 확인:

- [ ] 비로그인 상태: 로그인 버튼 표시
- [ ] Google/Kakao/LINE 로그인 팝업
- [ ] 로그인 후: 유저명 + 크레딧 잔고 + 프로바이더 아이콘
- [ ] 크레딧 클릭 → 크레딧샵 모달
- [ ] 리전별 결제 (KR: Toss 리다이렉트, Global: LemonSqueezy)
- [ ] 언어 전환 (KO/JA/EN)
- [ ] CTA "촬영 시작하기" → 앱 URL + 토큰 전달
- [ ] 챗봇 입력 → 모달 열림 → /api/chat 호출 → 응답 표시
- [ ] 동의 모달 (privacy/portrait)
- [ ] 갤러리 슬라이더 자동 스크롤
- [ ] 네비게이션 링크 (/blog, /faq, /gallery, /board)
- [ ] 반응형: 768px 이하 단일 컬럼, 사이드바 숨김
- [ ] 로그아웃 → UI 복원

## 보정 사항 (막내1 적확성 검토 반영, 22:36 KST)

### A) v4 적응 구현 허용

지시서 원문의 "함수 내부 로직은 수정하지 않음, DOM 셀렉터만 업데이트"는 철회.
v4 HTML 구조에 맞게 아래 함수들은 **적응 재작성**한다:

- **chat.js**: v3 패널 슬라이드 → v4 하단바+모달 패턴으로 재작성. 코어 로직(sendMessage, addMessage, showTyping, hideTyping, /api/chat 호출)은 유지.
- **applyLang()** (i18n.js): card2/card3 i18n 키 삭제, v4 DOM 요소에 맞게 매핑 재작성.
- **updateAuthUI()** (auth.js): 유저바(.user-bar) 구조에 맞게 HTML 삽입 로직 재작성.
- **CTA 토큰 전달**: v3의 단일 #ctaBtn → v4의 다중 트리거(.btn-shoot, .svc-link, .svc 클릭)에 공통 함수로 바인딩.

### B) 리전/언어 UI 정책

- **일반 유저**: 리전 버튼 숨김. 언어 선택에서 리전 자동 추론 (KO→kr, JA/EN→global).
- **관리자 계정** (admins 컬렉션 UID 일치 시): 리전+언어 전환 UI 전체 노출.
- `detectRegion()`, `setRegion()`, `updateRegionButtons()`는 내부 로직 유지, UI 바인딩만 관리자 조건부.
- Wave 3에서 IP 기반 자동 분기로 교체 예정.

### C) 프로토타입 CF 아티팩트 제거

- `__cf_email__` (Cloudflare 이메일 프로텍션): 실제 구현 시 `info@monkos.ai` 직접 기재.

## 금지 사항

- `server.js` 수정 금지
- `render.js` 수정 금지
- `.env` 수정 금지
- 실제 배포(`deploy.sh`) 실행 금지
- API 키 하드코딩/변경 금지 (기존 값 그대로 유지)
- 외부 라이브러리 추가 금지 (기존 Google Fonts, GIS, Toss SDK만 사용)

## 커밋

```
[feat] index.html v4 전면 교체 — 3컬럼 라이트 테마 + CSS/JS 7파일 분리
```

## 완료 기준

**실행+보고** — v3 백업 확인 + index.html 교체 완료(300줄 이내) + CSS 1파일 + JS 5파일 생성 → 각 파일 줄수 보고 → 커밋 → 기능 보존 체크리스트 보고 → 대기 (push는 쌍아 검토 후).

**검증 항목 추가**: `wc -l` 로 index.html 줄수 보고 필수. 300줄 초과 시 분리 미흡으로 재작업.
