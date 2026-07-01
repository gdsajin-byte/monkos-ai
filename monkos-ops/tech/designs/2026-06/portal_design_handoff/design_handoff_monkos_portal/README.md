# Handoff: MONKOS.AI 포털 메인 페이지 (전면 재편)

## Overview
MONKOS.AI 포털의 메인 랜딩 페이지 전면 재디자인입니다. 세 가지 제품을 한 페이지에서 소개·전환시키는 것이 목표입니다:

- **IDPHOTO** — AI 증명사진 **웹 서비스** (여권·비자·신분증·이력서, 200+국가 규격 자동 대응). 도메인: `idphoto.monkos.ai`
- **HeadShot** — AI 비즈니스 헤드샷 **웹 서비스** (LinkedIn·Corporate·Creative·Professional·Dating Profile 5스타일). *증명사진과 한 엔진/플로우를 공유하는 신규 영역.*
- **IDPASS** — 크롭·배경제거 **iOS 앱** (App Store 전용, 온디바이스 처리. **AI 생성 기능 없음** — 순수 크롭/배경제거).

페이지는 위에서부터 **NAV → HERO(증명사진) → HEADSHOT → IDPASS 다운로드 → RESOURCES(FAQ·게시판·블로그) → FOOTER(사업자정보)** 순으로 흐릅니다.

---

## About the Design Files
이 번들의 `reference/` 안 파일들은 **HTML로 만든 디자인 레퍼런스(시안)** 입니다 — 의도한 모양·동작을 보여주는 프로토타입이며, **그대로 복붙해 배포하는 프로덕션 코드가 아닙니다.**

작업 목표는 이 시안을 **팀의 실제 환경에서 재현**하는 것입니다:
- **프론트 스택: 순수 HTML / CSS / JS (바닐라, 프레임워크 없음, Tailwind 아님 — 직접 작성 CSS)**
- **SSR: Node.js 문자열 템플릿으로 HTML 조립** (`home.js`, `render-shell.js` 등 ch2 코딩 규칙)
- 시안 파일은 사내 미리보기 런타임(`support.js`)에 의존하는 특수 포맷(`.dc.html`)입니다. 이 런타임/포맷을 프로덕션에 가져가지 마세요. **시안은 "정답 비주얼"로만 참조**하고, 마크업·스타일은 팀의 문자열 템플릿 + 직접 CSS로 다시 작성합니다.
- 시안의 동적 부분(FAQ·블로그·게시판)은 컴포넌트 로직 안 배열로 하드코딩돼 있습니다. 프로덕션에서는 **Firebase(Firestore)** 에서 읽어 SSR 시 주입하세요. 데이터 형태는 `content.sample.json` 참고.

### 시안을 직접 열어보려면
`reference/MONKOS Portal Light.dc.html`을 브라우저로 열면 됩니다 (옆에 `support.js`와 `assets/`가 동봉돼 있어 오프라인으로 렌더됨). `reference/MONKOS Portal Responsive.dc.html`은 데스크탑/모바일을 나란히 보여주는 검증용 뷰입니다.

---

## Fidelity
**High-fidelity (hifi).** 최종 색·타이포·간격·반응형 규칙이 모두 확정된 시안입니다. 아래 디자인 토큰과 컴포넌트 스펙대로 픽셀 단위로 재현하세요. 단, "Known inconsistencies" 항목의 몇 개 값은 디자인 중 손으로 만진 흔적이라 **토큰 표의 값으로 통일**하는 것이 맞습니다(시안의 해당 인라인 값보다 토큰표 우선).

---

## Design Language: "아크릴판 벤토(Acrylic Bento)"
핵심 컨셉 한 줄: **뉴트럴 그레이 보드 위에, 반투명 아크릴 유리판(섹션)들이 두께감을 갖고 떠 있다.** 각 섹션 = 한 장의 아크릴판. 판 안에 다크 그래파이트 카드나 콘텐츠가 들어앉습니다. 컬러는 모노톤(그레이)을 기본으로 하고 **틸(#00D4AA) 한 점만 브랜드 액센트**로 사용합니다.

세 가지 표면(surface) 레벨:
1. **보드(배경)** — 페이지 전체 그레이 그라데이션
2. **아크릴판(섹션 셸)** — 반투명 흰색 + `backdrop-filter: blur` + 위쪽 하이라이트 보더 + 큰 그림자 → 떠 있는 유리판
3. **그래파이트 카드(판 안의 콘텐츠)** — 어두운 회색 카드. 사진/UI의 컬러가 여기서 살아남.

---

## Design Tokens

### Colors
```
/* Board / background */
--board-grad:        linear-gradient(180deg,#E4E5E8,#D7D8DC);  /* 페이지 루트 배경 */
--board-flat:        #DFE0E3;                                   /* body, 스크롤바 트랙 */
--scrollbar-thumb:   #b4b7bd;

/* Acrylic panel (섹션 셸) */
--acrylic-bg:        rgba(255,255,255,.46);     /* 판 배경(반투명) — 일부 판은 .50 */
--acrylic-border:    rgba(255,255,255,.70);     /* 판 테두리 */
--acrylic-border-top:rgba(255,255,255,.95);     /* 위쪽 테두리(하이라이트, 두께감) */
--acrylic-blur:      blur(20px);                /* backdrop-filter (작은 카드는 16px) */
--acrylic-shadow:    0 26px 62px rgba(45,49,57,.15);
--acrylic-inset:     inset 0 1px 0 rgba(255,255,255,.6);  /* 윗면 광택 */

/* Graphite cards (판 안 다크 카드) */
--graphite-card:     linear-gradient(180deg,#26282d,#1b1d21);   /* 증명사진 카드 */
--graphite-card-2:   linear-gradient(135deg,#34373d,#26282d);   /* 헤드샷 패널(살짝 밝게 띄움) */
--graphite-billboard:linear-gradient(118deg,#26282d 0%,#1a1c20 50%,#24262b 100%); /* 앱스토어 빌보드 */
--graphite-text:     #e8eaee;                   /* 다크 카드 위 본문 */
--graphite-shadow:   0 30px 64px rgba(40,44,52,.28);

/* Buttons */
--btn-solid-bg:      #2c3037;   /* 주요 CTA(솔리드 그래파이트) — 증명사진/로그인 등 */
--btn-solid-text:    #ffffff;

/* Brand accent (절제해서 한 점만) */
--teal:              #00D4AA;
--teal-dark:         #00a986;
--mascot-purple-glow:rgba(167,139,250,.35);  /* MONKOS 마스코트 아이콘 글로우 */

/* Text */
--text-strong:       #23272e;   /* 보드 위 제목/본문 */
--text-strong-2:     #1b2532;
--text-body:         #566070;   /* 본문(라이트 면) */
--text-muted:        #6B7280;   /* 보조 */
--text-muted-2:      #71767e;   /* eyebrow 라벨 */
--text-muted-3:      #8a93a1;
--divider-light:     #d4d9e0;   /* 통계 구분선 */
--divider-card:      #eceff3;   /* 라이트 카드 내부 구분선 */

/* Footer (유일하게 다크 밴드) */
--footer-bg:         #05080E;
--footer-text:       #6B7280;
--footer-legal:      #4a5260;
--footer-copyright:  #3a4250;
```

### Typography
```
폰트: 'DM Sans', 'Noto Sans KR', sans-serif
  - Google Fonts: DM Sans (400,500,700,800,900) + Noto Sans KR (400,500,700,900)
  - 한글은 Noto Sans KR, 라틴은 DM Sans로 자동 폴백

스케일 (clamp = 반응형 유동):
  H1(히어로):       clamp(30px, 4vw, 56px) / weight 900 / line-height 1.12 / letter-spacing -1.6px
  섹션 타이틀:       clamp(22px, 4.6vw, 30px) / weight 800 / letter-spacing -.5px
  eyebrow 라벨:      12px / weight 700 / letter-spacing 2px / 그레이(#71767e) 또는 틸
  배지(히어로):      12.5px / weight 700 / letter-spacing 1.8px
  통계 숫자:         30px / weight 800
  통계 라벨:         13px / #6B7280
  히어로 서브:        18px / line-height 1.6 / #566070
  카드 제목:         19~22px / weight 800
  카드 본문:         13~13.5px / line-height 1.55 / muted
  FAQ 질문:          15px / weight 700
  블로그 제목:        14.5px / weight 700 / line-height 1.4
  빌보드 헤드라인:    30px / weight 900 / line-height 1.1 / -.5px
  빌보드 eyebrow:    11px / weight 800 / letter-spacing 2px
  사업자정보:         11.5px / line-height 1.6
```

### Spacing & Radius
```
컨테이너 폭:        max-width 1240px, 중앙정렬
판 가로(거터):      width: min(1240px, 100% - 28px)   /* 좌우 14px 최소 거터 */
섹션 간 간격:        margin-bottom 30px (모든 아크릴판 공통)
히어로 상단:        margin-top 14px

판 radius:          28px
판 padding:         clamp(28px,4vw,46px) clamp(20px,4vw,40px) clamp(36px,4vw,56px)  /* 섹션별 미세 차이 */
다크 카드 radius:    18px(증명) / 22px(헤드샷) / 30px(빌보드)
작은 카드 radius:    13~16px (갤러리 타일/FAQ/블로그)
버튼 radius:         10~13px
배지 radius:         20px(pill) / 5~6px(작은 태그)

그림자 깊이 위계:
  아크릴판:    0 26px 62px rgba(45,49,57,.15) + inset 0 1px 0 rgba(255,255,255,.6)
  그래파이트:  0 30px 64px rgba(40,44,52,.28) + inset 0 1px 0 rgba(255,255,255,.06)
  작은 카드:   0 8px 26px rgba(45,49,57,.08)
```

### Border-radius/blur 주의
- 아크릴 효과는 `backdrop-filter: blur()` + `-webkit-backdrop-filter`를 **반드시 함께** 지정. 뒤에 보드 그라데이션/글로우가 비쳐야 유리판 느낌이 남.
- 판마다 코너에 은은한 흰색 radial-gradient 글로우(`rgba(255,255,255,.5~.6)`)를 깔아 빛번짐(프로스트) 표현. 컬러 글로우 아님 — **유백색**.

---

## Layout & Responsive Strategy (중요)
**미디어쿼리·JS 분기 없이 "intrinsic(본질적) 반응형"으로 구현합니다.** 브레이크포인트가 없어 320~1440px 사이 어디서도 안 깨집니다. iCloud 벤토와 같은 reflow 방식 — 카드는 작아지지 않고 **재배치**됩니다.

세 가지 기법만 쓰면 됩니다:

**1. 그리드는 `auto-fit` + `minmax`로 자동 접힘**
```css
grid-template-columns: repeat(auto-fit, minmax(min(<X>px, 100%), 1fr));
```
섹션별 최소 칸 폭(X):
- 히어로(2단 → 1단):        `340px`
- 헤드샷 5스타일 갤러리:      `130px` (5→4→3→2→1 자동)
- IDPASS 앱스토어 빌보드(3패널): `240px`
- RESOURCES(FAQ + 사이드):   `300px`
- 블로그 3카드:              `220px`

**2. 타이포·여백은 `clamp()`로 유동** (위 스케일 참고)

**3. 고정폭/nowrap 회피**
- 카드 폭: `width: min(392px, 100%)` 식
- 행은 `flex-wrap: wrap`
- 타이틀에 `white-space: nowrap` 쓰지 않기(좁은 화면 잘림 원인)

NAV도 `flex-wrap: wrap; gap: 14px 20px`로 좁아지면 줄바꿈됩니다.

---

## Screens / Sections

페이지는 단일 스크롤. 각 섹션은 위 "아크릴판" 셸을 공유합니다(FOOTER 제외). 아래는 위→아래 순.

### 1. NAV (상단 바, 판 아님 — 보드에 직접)
- **레이아웃**: max-width 1240px, 양끝 정렬(`space-between`), `flex-wrap: wrap`. padding `24px clamp(20px,4vw,40px)`.
- **좌측**: 로고(마스코트 SVG 34×34, radius 9px, 퍼플 글로우) + 워드마크 `MONKOS <i>AI</i>`(AI는 틸 이탤릭). 그 옆 텍스트 메뉴 `IDPASS / 규격 / 가격` (13.5px, #8b93a1).
- **우측**: 언어 `KO · EN · JA`(12px, #6B7280, 현재 장식) + **크레딧 펠**(아웃라인: 흰 반투명 배경 + `rgba(45,49,57,.18)` 보더, 틸 코인 ●+숫자) + **로그인 펠**(솔리드 `#2c3037`, 흰 글씨).
- **위계**: 크레딧 = 아웃라인 보조, 로그인 = 솔리드 주요. 둘 다 radius 10px, padding 8px.

### 2. HERO — 증명사진 (아크릴판)
- **레이아웃**: 2단 그리드(`auto-fit minmax(340px,1fr)`, gap 40px, 세로 가운데정렬). 좌측 카피 / 우측 비주얼.
- **좌측**:
  - 배지(pill): 틸 점(깜빡임 애니메이션 `mk-blink`) + `200+국가 규격 검수 · ICAO 준수 · 5가지 스타일`. 보더 `rgba(0,212,170,.28)`.
  - H1: **전문 스튜디오가 개발한 / <span 틸>AI 증명사진</span> 서비스** (2줄)
  - 서브(18px): `여권·비자·규격 대응 + 링크드인·프로페셔널·이력서 헤드샷. 셀카 한 장이면 끝.`
  - 통계 3개(가로, 구분선 `#d4d9e0`로 분리): **200+개국**(여권·비자 규격) · **ICAO**(국제 표준 준수) · **5가지**(헤드샷 스타일). 숫자 30px/800.
- **우측 비주얼**: 흰 반투명 아크릴 프레임(radius 28px, blur 22px) 안에 **증명사진 그래파이트 카드** 1장:
  - 상단 214px: 좌우 분할 BEFORE/AFTER 이미지(`idphoto-before.jpg` / `idphoto-after.jpg`). AFTER 쪽에 틸 좌측 보더 2px + `PASS ✓` 배지(틸) + 십자 규격 가이드선(틸 반투명).
  - 본문: 제목 `증명사진` + 틸 아웃라인 태그 `규격 · 200+개국`. 설명 + 칩(`흰 배경` `ICAO` `정수리 크롭`). 하단 CTA `증명사진 만들기 →`(솔리드 그래파이트) + `idphoto.monkos.ai`.
- **CTA 연결**: `증명사진 만들기` → idphoto 서비스 진입.

### 3. HEADSHOT — 비즈니스 헤드샷 (아크릴판)
- **헤더**: eyebrow `AI HEADSHOT`(그레이) + 타이틀 `전문가의 품격, 한컷의 사진으로`. 우측에 보조 설명(`규격이 필요한 증명사진은 위에서, 보여주고 싶은 헤드샷은 여기서.`).
- **본문**: 한 장의 큰 **그래파이트 패널**(linear-gradient 135deg, 살짝 밝은 #34373d, 위쪽 하이라이트로 띄움):
  - 패널 헤더: 제목 `헤드샷` + 아웃라인 태그 `NEW · 세미프로필`. 설명(링크드인·이력서·회사 소개용, 5컨셉 30초). 우측 CTA `헤드샷 만들기 →` + `30초 · 비즈니스 프로필`.
  - **5스타일 갤러리**(`auto-fit minmax(130px,1fr)`, 3:4 비율 타일): `LinkedIn`(인기 배지, 선택 보더 강조) / `Corporate` / `Creative` / `Professional` / `Dating Profile`. 각 타일은 하단 그라데이션 + 흰 라벨. 이미지: `headshot-*.jpg`.
  - **중요**: 5스타일 이름은 실제 헤드샷 서비스와 1:1 일치해야 함(LinkedIn/Corporate/Creative/Professional/Dating Profile).

### 4. IDPASS 다운로드 / 앱스토어 쇼케이스 (아크릴판)
- **상단 중앙 정렬**: IDPASS 앱 아이콘(`idpass-icon.png`, 46×46, radius 12px) + `Download <span 틸>IDPASS</span>`(30px/900). 설명(완벽한 배경제거/변경, 전 세계 규격 DB 크롭, 완전 무료·NO 광고, 온디바이스). 별점 4.9(App Store) · 5.5MB · iOS 16+. App Store 다운로드 배지(검정 버튼).
  - 별점 블록은 `showRating` 플래그로 토글(기본 표시). 프로덕션에선 실제 App Store 평점 연동 또는 상수.
- **빌보드**: 3패널을 **하나로 연결된 그래파이트 빌보드**(radius 30px)로 디자인. 각 패널 = eyebrow + 2줄 헤드라인 + 상단이 잘린 폰 목업(`store_01/03/05.jpg`, 노치 포함).
  - 패널1: `FREE · NO LOGIN` / `증명사진, 다 통과.`
  - 패널2: `200+ COUNTRIES` / `여권·비자 규격 자동`
  - 패널3: `ON-DEVICE` / `서버 전송 없이 안전하게.`
  - 반응형: `auto-fit minmax(240px,1fr)` → 좁으면 패널이 세로로 쌓임. 패널 사이 `rgba(255,255,255,.05)` 구분선.
- **연결**: App Store 배지/CTA → IDPASS App Store 링크(iOS 전용).

### 5. RESOURCES — FAQ + 게시판 + 블로그 (아크릴판)
- **상단**: eyebrow `RESOURCES` + 타이틀 `궁금한 점, 먼저 풀어드려요`.
- **2단 그리드**(`auto-fit minmax(300px,1fr)`):
  - **좌(넓게)**: FAQ 아코디언. 각 항목 = 흰 반투명 카드, 질문(15px/700) + `+`/`–` 토글(클릭 시 답변 펼침). **한 번에 하나만 열림**, 기본 첫 항목 열림. 데이터: `content.sample.json`의 `faqs`.
  - **우(좁게)**: ① `📑 증명사진 규격 가이드` 카드 + `규격 DB 보기 →` 버튼. ② `고객 게시판` 카드(최근 1건 미리보기 + `전체보기 →`). 데이터: `board`.
- **하단 — 최근 블로그**: `최근 블로그` 타이틀 + `전체보기 →`. 3카드(`auto-fit minmax(220px,1fr)`). 각 카드 = 모노그램 썸네일(또는 `thumbnailUrl`) + 태그 배지 + 제목 + 발췌 + `MONKOS · 날짜`. 데이터: `posts`(최근 3).

### 6. FOOTER (다크 밴드 — 유일하게 어두운 영역, 의도된 페이지 앵커)
- 배경 `#05080E`. 상단 행: 로고 + `powered by MONKOS AI` / 링크(`idphoto / IDPASS / 규격 DB / Terms / Privacy`) / `© 2026 MONK STUDIO`.
- **사업자 정보 블록**(법적 필수, 별도 구분선): 상호·대표·사업자등록번호·통신판매업신고·주소·개인정보보호책임자·이메일·고객문의 + 통신판매업자 고지 문구.
- **⚠️ 현재 모두 플레이스홀더값**(홍길동, 000-00-00000 등). 실제 사업자 정보로 교체 필요.

---

## Interactions & Behavior
- **FAQ 아코디언**: 항목 클릭 → 답변 펼침/접힘. 한 번에 하나만 열림(다른 항목 열면 이전 항목 닫힘). 같은 항목 재클릭 시 전부 닫힘. 초기값: 첫 항목 열림. 펼침 시 질문 아래 구분선 + 답변. 토글 기호 `+`(닫힘)/`–`(열림).
- **호버 상태**(시안엔 미구현, 프로덕션 권장): 카드/버튼에 미세한 lift(translateY -2px) + 그림자 강화. 갤러리 타일 hover 시 약한 확대. 팀 기존 인터랙션 패턴을 따르세요.
- **링크/네비게이션**:
  - `증명사진 만들기` → IDPHOTO 웹 서비스
  - `헤드샷 만들기` → HeadShot 웹 서비스
  - App Store 배지 → IDPASS App Store 페이지
  - `규격 DB 보기`, `전체보기`(게시판/블로그), 블로그 카드 → 각 라우트
- **애니메이션**(@keyframes): `mk-blink`(배지 틸 점, 2s 깜빡임). `mk-float`/`mk-float2`는 시안에 정의돼 있으나 현재 미사용(증명 카드 플로팅 제거됨) — 옮기지 않아도 됨.
- **반응형**: 위 "Layout & Responsive Strategy" 참고. 별도 모바일 레이아웃 없음 — 같은 마크업이 폭에 따라 reflow.

## State Management
시안은 거의 정적. 동적 상태는 둘뿐:
- `openFaq` (number): 현재 열린 FAQ 인덱스. 초기 0. 같은 인덱스 재클릭 시 -1(전부 닫힘). → 순수 HTML/JS에서는 작은 클릭 핸들러로 구현(프레임워크 불필요).
- `showRating` (boolean): App Store 별점 블록 표시 여부. 기본 true.
- 그 외 크레딧 수(120), 언어 토글은 현재 표시용. **언어 전환(KO/EN/JA)은 미구현** — 다국어가 필요하면 카피를 언어팩으로 분리해야 함(아래 참고).

## Data Fetching (Firebase)
- 동적 콘텐츠: **FAQ / 블로그(posts) / 게시판(board)**. 컬렉션 구조·필드·정렬·포털 노출 개수는 `content.sample.json` 참고.
- SSR 시 Firestore에서 읽어 문자열 템플릿에 주입 권장(클라이언트 fetch보다 SEO 유리 — 특히 블로그).
- 블로그 글 본문은 별도 라우트(`/blog/:id`). 포털엔 최근 3건 카드만.
- **FAQ는 JSON-LD(FAQPage 스키마) 삽입 권장** → 구글 검색결과 Q&A 노출.

## i18n (다국어) — 현재 한글 고정
- 현재 모든 카피가 **한국어 하드코딩**. NAV의 `KO·EN·JA`는 장식.
- 다국어로 갈 경우: 카피를 언어팩(예: `strings.ko/en/ja`)으로 분리하고 `lang`으로 스위칭. 레이아웃은 이미 nowrap을 풀고 유동(clamp/wrap)이라 영어가 길어져도 깨지지 않음.
- 확정된 EN 카피(참고): H1 `AI ID Photos & Headshots — Built by a Professional Studio` / Sub `Passport, visa, 200+ specs + LinkedIn, corporate, resume headshots` / 배지 `200+ Country Specs · ICAO · 5 Styles`.

---

## Assets
`reference/assets/`에 동봉. 프로덕션에서는 **오브젝트 스토리지/버킷 + CDN**으로 서빙 권장(레포에 바이너리 미추적). 베이스 URL만 환경변수로 두고 로컬 `assets/` ↔ `cdn.monkos.ai` 무전환 전환.

| 파일 | 용도 |
|---|---|
| `monkos-icon.svg` | MONKOS 브랜드 마스코트(보라). NAV·FOOTER 로고 |
| `idpass-icon.png` | IDPASS 실제 iOS 앱 아이콘. 다운로드 섹션 |
| `idphoto-before.jpg` / `idphoto-after.jpg` | 히어로 증명사진 BEFORE/AFTER |
| `headshot-linkedin/corporate/creative/professional/dating.jpg(png)` | 헤드샷 5스타일(동일 인물). 갤러리 |
| `store_01.jpg` / `store_03.jpg` / `store_05.jpg` | IDPASS 앱스토어 빌보드 3패널 폰 목업 |

원본 고화질 에셋은 사용자의 `MONKOS_ASSETS` 폴더(Google Drive 동기화)에 제품별로 정리됨: `IDPHOTO/` `HeadShot/` `CROP APP/`(IDPASS) `MONKOS_Potal/`(브랜드). 추가 컷이 필요하면 거기서 수급.

---

## Known inconsistencies (디자인 중 수기 편집 흔적 — 토큰값으로 통일 권장)
프로덕션 재현 시 아래는 **시안의 인라인값 대신 토큰표 값으로 통일**하세요:
1. **`규격 DB 보기` 버튼**이 파랑 `#2255ad`로 되어 있음 → 모노톤 시스템 위반. **`--btn-solid-bg #2c3037`** 로 통일(또는 의도적 강조면 틸 `#00D4AA`).
2. **`헤드샷 만들기` 버튼**이 `#6b707a`(연그레이) → 다른 주요 CTA와 맞추려면 `#2c3037` 권장.
3. **히어로 서브카피 / 헤드샷 패널 설명** 마크업에 직접편집으로 생긴 **불필요한 중첩 `<div>`** 가 있음 → 재작성 시 깔끔한 `<p>`+`<br>` 구조로.
4. **NAV 첫 메뉴 링크**에 빈 `<br><br>`만 들어간 잔재가 있음 → 제거.
5. **H1 inner span**이 `font-family: Arial; font-weight: normal`로 직접 지정됨 → 의도가 아니면 본문 폰트(DM Sans/Noto Sans KR) + weight 900 유지.
6. 통계 숫자/섹션 타이틀 일부 `font-weight: 500~600`으로 손이 가 있음 → 토큰표 weight(800)로 통일 권장.

이 값들은 손으로 잡은 것이라 통일감이 약간 떨어집니다. 위 토큰표가 정답입니다.

---

## Files (in this project)
디자인 작업본(이 대화의 프로젝트 내 위치):
- `MONKOS Portal Light.dc.html` — **메인 시안(모노톤 아크릴, 반응형)** ← 정답 비주얼
- `MONKOS Portal Responsive.dc.html` — 데스크탑/모바일 split 검증 뷰
- `MONKOS Portal.dc.html` — 초기 다크 버전(백업, 참고용)
- `MONKOS Portal Wireframes.dc.html` — 초기 와이어프레임(참고용)

이 번들(`design_handoff_monkos_portal/`):
- `README.md` — 이 문서
- `content.sample.json` — Firestore 동적 콘텐츠 형태(FAQ/블로그/게시판)
- `reference/MONKOS Portal Light.dc.html` (+ `support.js`, `assets/`) — 브라우저로 열어 확인하는 시안
- `reference/MONKOS Portal Responsive.dc.html` — split 검증 뷰

---

## 구현 체크리스트 (막내용 요약)
1. [ ] Google Fonts(DM Sans + Noto Sans KR) 로드
2. [ ] 보드 배경 + 아크릴판 셸 유틸리티 CSS 작성(blur/border/shadow/inset) — 섹션마다 재사용
3. [ ] 섹션 마크업을 Node 문자열 템플릿으로 분해(nav / hero / headshot / idpass / resources / footer)
4. [ ] 그리드는 전부 `auto-fit minmax(min(Xpx,100%),1fr)`, 타이포·여백 `clamp()` — 미디어쿼리 쓰지 말 것
5. [ ] FAQ/블로그/게시판 → Firestore 연동(`content.sample.json` 형태), SSR 주입
6. [ ] FAQ 아코디언 클릭 핸들러(한 번에 하나, 첫 항목 기본 열림) — 바닐라 JS
7. [ ] 에셋 → 버킷/CDN 경로로 치환(베이스 URL 환경변수)
8. [ ] 사업자 정보 실제값 입력 / 외부 링크(증명사진·헤드샷·App Store·Terms·Privacy) 연결
9. [ ] "Known inconsistencies" 6개 값 토큰으로 통일
10. [ ] (선택) FAQPage JSON-LD, 블로그 OG 태그 / (선택) i18n 언어팩
