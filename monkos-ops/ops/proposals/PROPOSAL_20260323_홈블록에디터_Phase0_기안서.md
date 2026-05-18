---
type: PROPOSAL
id: PROPOSAL_20260323_홈블록에디터_Phase0
date: 2026-03-23
from: iMac/쌍아
to: 작가님
status: 기안
priority: 전략
ref:
  - PROPOSAL_20260316_블록에디터통합_기안서 (Phase A~C 로드맵)
  - SPEC_20260320_블로그에디터_기술명세서 (v5.0 통합 블록 시스템)
  - PROPOSAL_20260322_민아_monkosAI_메인페이지_리디자인 (메인 레이아웃 비전)
---

# 홈 블록 에디터 Phase 0 — 데이터 레이어 + 어드민 편집

## 1. 배경

### 현재 문제
메인 페이지의 대부분 영역이 **index.html에 하드코딩**되어 있어 수정 시 코드 배포가 필요. 블로그·FAQ·게시판은 이미 Firestore 동적이지만, 히어로·유저바·네비게이션·서비스 카드·활용법·가이드·크레딧·푸터 등 페이지 뼈대를 이루는 핵심 영역은 개발자가 직접 HTML을 수정해야 함.

### 작가님 방향
> "각각의 서비스 카드를 어드민 대시보드에서 내용 디자인 CSS 등을 조율하도록"
> "FAQ 문구카드도 누르면 FAQ 전문카드로 가는게 맞지 않나"
> "헤더영역, 로그인라인, 이미지 컨트롤라인, 네비게이션 파트도 구성을 함께하는게 나을거 같은데"

### 기안서 위상
블록 에디터 기안서(03-16)의 Phase C(홈+블로그 통합)로 가기 위한 **Phase 0 — 메인 페이지 전체를 블록 단위로 분해, 데이터 레이어 선행 구축**. Editor.js 전환 없이 현재 스택으로 실행 가능.

---

## 2. 현황 분석

### 메인 페이지 전체 블록 맵

| # | 블록 | 위치 | 현재 소스 | 편집 방법 | Phase 0 |
|---|------|------|-----------|-----------|---------|
| 1 | **히어로** (타이틀·태그라인) | header | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 2 | **유저바** (언어SW·CTA·로그인·크레딧) | header | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 3 | **갤러리 스트립** (이미지 슬라이드) | header | ✅ Firestore SSR | 어드민 gallery | ⚙️ 설정 추가 |
| 4 | **네비게이션** (메뉴 6개) | nav | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 5 | **인트로 텍스트** | main | Firestore `site_config` | ✅ 어드민 settings | ✅ 기존 유지 |
| 6 | **서비스 카드** (AI증명사진, 크롭앱) | main | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 7 | **활용법 (How-to)** 3단계 | main | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 8 | **FAQ 프리뷰** 3건 | main | ✅ Firestore SSR | 어드민 faq.html | ⚙️ 링크 추가 |
| 9 | **게시판 프리뷰** 5건 | main | ✅ Firestore SSR | 어드민 board.html | ⚙️ 설정 추가 |
| 10 | **블로그 카드** 4건 | main | ✅ Firestore SSR | 어드민 blog | ⚙️ 설정 추가 |
| 11 | **매거진** (좌측 사이드바) | left-sb | ✅ Firestore SSR | 어드민 blog (pinned) | ⚙️ 설정 추가 |
| 12 | **태그** (좌측 사이드바) | left-sb | ✅ Firestore SSR (집계) | 자동 | ⚙️ 설정 추가 |
| 13 | **사용 가이드** 2장 (우측 사이드바) | right-sb | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 14 | **크레딧 안내** (우측 사이드바) | right-sb | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |
| 15 | **푸터** (링크·카피라이트) | footer | HTML 하드코딩 | ❌ 코드 배포 | 🆕 신규 |

**🆕 = 9개 블록 신규 데이터화** / **⚙️ = 5개 블록 설정 확장** / **✅ = 1개 기존 유지**

### 기존 인프라 (활용 가능)

| 자산 | 상태 | 활용 방안 |
|------|------|-----------|
| `layout.html` 어드민 페이지 | 존재하나 대시보드 미연결 (고아) | 확장하여 블록 편집 UI로 활용 |
| `handleLayoutGet/Put` API | 뼈대만 존재 (`sections[]` 배열) | 블록 데이터 스키마 확장 |
| `site_config/layout` Firestore 문서 | 미사용 | 블록 데이터 저장소로 활용 |
| `renderHome()` SSR | 이미 Firestore 데이터 주입 패턴 확립 | 블록 데이터 렌더링 추가 |

---

## 3. 설계

### 3.1 Firestore 블록 스키마

**저장 위치**: `site_config/layout`

모든 블록은 공통 필드 `{ id, type, visible, order }` + 블록별 `items[]` 또는 `data{}`.
다국어 텍스트는 `{ ko, ja, en }` 객체로 통일.

```javascript
{
  sections: [
    // ──────────── 헤더 영역 ────────────
    {
      id: "hero",
      type: "hero",
      visible: true,
      order: 1,
      data: {
        label: "AI Creative Platform",                    // 상단 라벨 (단일 언어, 영문 고정)
        title: "MONKOS <em>AI</em>",                      // 메인 타이틀 (HTML 허용)
        tagline: "<strong>Photography</strong> × <strong>AI</strong> × <strong>K-Beauty</strong>",
        style: {}                                          // 배경색·이미지 등 예약
      }
    },
    {
      id: "user-bar",
      type: "user-bar",
      visible: true,
      order: 2,
      data: {
        cta: { ko: "촬영 시작하기", ja: "証明写真を撮る", en: "Take ID Photo" },
        ctaUrl: {
          kr: "https://idphoto-kr.monkos.ai/app",
          global: "https://idphoto-jp.monkos.ai/app"
        },
        showLangSwitch: true,
        showLogin: true,
        showCredit: true
      }
    },
    {
      id: "gallery-strip",
      type: "gallery-strip",
      visible: true,
      order: 3,
      data: {
        maxItems: 10,              // 표시 개수
        autoScroll: true,          // 자동 스크롤
        speed: 30                  // 스크롤 속도 (px/s)
        // 이미지 데이터는 기존 Firestore gallery_items 컬렉션 사용
      }
    },
    {
      id: "nav",
      type: "nav",
      visible: true,
      order: 4,
      items: [
        {
          label: { ko: "홈", ja: "ホーム", en: "Home" },
          href: { ko: "/", ja: "/?lang=ja", en: "/?lang=en" },
          active: true    // 홈에서 기본 활성
        },
        {
          label: { ko: "블로그", ja: "ブログ", en: "Blog" },
          href: { ko: "/blog", ja: "/ja/blog", en: "/en/blog" }
        },
        {
          label: { ko: "FAQ", ja: "FAQ", en: "FAQ" },
          href: { ko: "/faq", ja: "/ja/faq", en: "/en/faq" }
        },
        {
          label: { ko: "갤러리", ja: "ギャラリー", en: "Gallery" },
          href: { ko: "/gallery", ja: "/gallery", en: "/gallery" }
        },
        {
          label: { ko: "게시판", ja: "掲示板", en: "Board" },
          href: { ko: "/board", ja: "/board", en: "/board" }
        },
        {
          label: { ko: "가격", ja: "料金", en: "Pricing" },
          href: { ko: "/pricing", ja: "/ja/pricing", en: "/en/pricing" }
        }
      ]
    },

    // ──────────── 메인 영역 ────────────
    {
      id: "service-cards",
      type: "service-grid",
      visible: true,
      order: 5,
      items: [
        {
          title: { ko: "AI 증명사진", ja: "AI証明写真", en: "AI ID Photo" },
          desc: { ko: "여권·이력서 — 사진관 품질 AI 리터칭. ICAO 국제 규격.", ja: "パスポート・履歴書 — スタジオ品質AIリタッチ。ICAO国際規格。", en: "Passport, resume, visa — studio-quality AI retouching. ICAO standard." },
          link: { ko: "촬영 시작 →", ja: "撮影開始 →", en: "Start shooting →" },
          url: "/app",
          icon: "📷",
          badge: { text: "LIVE", class: "lb" },
          cardClass: "live",
          style: {}
        },
        {
          title: { ko: "무료 크롭앱", ja: "無料クロップアプリ", en: "Free Crop App" },
          desc: { ko: "규격 크롭·배경 제거·배경 교체. 서버 전송 없음.", ja: "規格クロップ・背景除去・背景交換。サーバー送信なし。", en: "Spec crop, background removal & replacement. No server upload." },
          link: { ko: "/crop →", ja: "/crop →", en: "/crop →" },
          url: "/crop",
          icon: "✂️",
          badge: { text: "FREE", class: "fb" },
          cardClass: "free",
          style: {}
        }
      ]
    },
    {
      id: "howto",
      type: "howto-grid",
      visible: true,
      order: 6,
      header: {
        title: { ko: "증명사진 앱 활용법", ja: "証明写真アプリの使い方", en: "How to Use" },
        link: { ko: "전체보기 →", ja: "全て見る →", en: "View all →" },
        href: "/guide"
      },
      items: [
        {
          num: "01",
          title: { ko: "규격 선택", ja: "規格選択", en: "Select Spec" },
          desc: { ko: "여권/신분증 또는 반명함 선택", ja: "パスポート/身分証または半名刺選択", en: "Choose passport/ID or business card" }
        },
        {
          num: "02",
          title: { ko: "셀카 촬영", ja: "セルフィー撮影", en: "Take Selfie" },
          desc: { ko: "AI 코칭 가이드로 완벽 촬영", ja: "AIコーチングガイドで完璧撮影", en: "AI coaching guide for perfect shots" }
        },
        {
          num: "03",
          title: { ko: "AI 리터칭", ja: "AIリタッチ", en: "AI Retouch" },
          desc: { ko: "배경·조명·피부·의상 자동 보정", ja: "背景・照明・肌・服装自動補正", en: "Auto background, lighting, skin & clothing" }
        }
      ]
    },

    // ──────────── Firestore 동적 블록 (표시 설정만) ────────────
    {
      id: "faq-preview",
      type: "faq-preview",
      visible: true,
      order: 7,
      data: {
        maxItems: 3,
        linkToFull: true,            // 프리뷰 카드 → /faq#앵커 링크
        header: {
          title: { ko: "자주 묻는 질문", ja: "よくある質問", en: "FAQ" },
          link: { ko: "전체보기 →", ja: "全て見る →", en: "View all →" },
          href: "/faq"
        }
      }
    },
    {
      id: "board-preview",
      type: "board-preview",
      visible: true,
      order: 8,
      data: {
        maxItems: 5,
        header: {
          title: { ko: "고객 게시판", ja: "お客様掲示板", en: "Customer Board" },
          link: { ko: "전체보기 →", ja: "全て見る →", en: "View all →" },
          href: "/board"
        }
      }
    },
    {
      id: "blog-cards",
      type: "blog-cards",
      visible: true,
      order: 9,
      data: {
        maxItems: 4,
        header: {
          title: { ko: "최근 블로그", ja: "最新ブログ", en: "Latest Blog" },
          link: { ko: "전체보기 →", ja: "全て見る →", en: "View all →" },
          href: "/blog"
        }
      }
    },

    // ──────────── 사이드바 (좌측) ────────────
    {
      id: "magazine",
      type: "magazine",
      visible: true,
      order: 10,
      data: { maxItems: 4 }            // 데이터는 blog_posts (pinned) 사용
    },
    {
      id: "tags",
      type: "tags",
      visible: true,
      order: 11,
      data: { maxTags: 16, expandable: true }
    },

    // ──────────── 사이드바 (우측) ────────────
    {
      id: "guide",
      type: "guide-cards",
      visible: true,
      order: 12,
      items: [
        {
          title: { ko: "증명사진 촬영법", ja: "証明写真の撮り方", en: "How to Take ID Photo" },
          desc: { ko: "규격 선택 → 셀카 → AI 리터칭 → 다운로드", ja: "規格選択 → セルフィー → AIリタッチ → ダウンロード", en: "Select spec → Selfie → AI retouch → Download" },
          status: { ko: "▶ 자동 재생 중", ja: "▶ 自動再生中", en: "▶ Auto-playing" },
          style: { background: "#0a0a14", accentColor: "#6366f1" }
        },
        {
          title: { ko: "크롭앱 사용법", ja: "クロップアプリの使い方", en: "How to Use Crop App" },
          desc: { ko: "사진 선택 → 규격 크롭 → 누끼 → 다운로드", ja: "写真選択 → 規格クロップ → 背景除去 → ダウンロード", en: "Select photo → Spec crop → Remove BG → Download" },
          status: { ko: "▶ 자동 재생 중", ja: "▶ 自動再生中", en: "▶ Auto-playing" },
          style: { background: "#0a1a10", accentColor: "#10B981" }
        }
      ]
    },
    {
      id: "credit-info",
      type: "credit-box",
      visible: true,
      order: 13,
      data: {
        exchange: { ko: "💡 10c = $1 ≈ ₩1,450", ja: "💡 10c = ¥150", en: "💡 10c = $1" },
        rows: [
          { label: { ko: "AI 생성", ja: "AIリタッチ", en: "AI Retouch" }, value: "10c" },
          { label: { ko: "다운로드", ja: "ダウンロード", en: "Download" }, value: "70c" },
          { label: { ko: "1장 완성", ja: "1枚完成", en: "1 Photo" }, value: "80c", accent: true }
        ],
        promo: {
          oldPrice: { ko: "₩10,150", ja: "¥1,200", en: "$8.00" },
          newPrice: { ko: "₩9,900", ja: "¥990", en: "$6.90" },
          bonus: { ko: "🎁 회원가입 시 +10c", ja: "🎁 初回+10c", en: "🎁 +10c on sign-up" }
        }
      }
    },

    // ──────────── 푸터 ────────────
    {
      id: "footer",
      type: "footer",
      visible: true,
      order: 14,
      data: {
        links: [
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Terms of Service", href: "/terms" },
          { label: "Refund Policy", href: "/refund" },
          { label: "Support", href: "https://t.me/monkos_bot" }
        ],
        copyright: "© 2026 MONKOS.AI — Evolution of Creative Intelligence"
      }
    }
  ],
  updatedAt: "2026-03-23T..."
}
```

### 3.2 SSR 렌더링 흐름

```
renderHome(req, res)
  ├── [1] site_config/layout 로드 → 전체 블록 데이터 취득
  │
  ├── [2] 헤더 영역 렌더링 (layout 데이터)
  │    ├── hero → 타이틀·태그라인 주입
  │    ├── user-bar → CTA 문구·버튼 구성
  │    ├── gallery-strip → maxItems·스크롤 설정 적용
  │    └── nav → 메뉴 항목·URL 언어별 렌더링
  │
  ├── [3] 메인 영역 렌더링 (layout + Firestore 컬렉션 혼합)
  │    ├── service-cards → 서비스 카드 HTML 생성 (layout)
  │    ├── howto → 활용법 3단계 HTML 생성 (layout)
  │    ├── faq-preview → Firestore faq_items (maxItems 설정은 layout)
  │    ├── board-preview → Firestore board (maxItems 설정은 layout)
  │    └── blog-cards → Firestore blog_posts (maxItems 설정은 layout)
  │
  ├── [4] 사이드바 렌더링 (layout + Firestore 혼합)
  │    ├── magazine → Firestore blog_posts pinned (maxItems 설정은 layout)
  │    ├── tags → Firestore 집계 (maxTags 설정은 layout)
  │    ├── guide → 가이드 카드 HTML 생성 (layout)
  │    └── credit-info → 크레딧 안내 HTML 생성 (layout)
  │
  └── [5] 푸터 렌더링 (layout)
       └── footer → 링크·카피라이트 주입
```

**핵심 원칙**:
- 순수 데이터 블록 (hero, nav, service-cards 등) → layout 문서에서 직접 렌더링
- Firestore 컬렉션 블록 (FAQ, 블로그 등) → 기존 컬렉션 쿼리 유지, layout에서 표시 설정(개수·헤더·표시여부)만 참조
- index.html 템플릿의 해당 영역을 regex replace로 교체 (기존 SSR 패턴과 동일)

### 3.3 어드민 페이지 확장

**layout.html 개편** (현재 244줄 → 예상 ~600줄)

현재:
- 섹션 7개의 표시/순서/크기 토글만 가능

확장 후:
- **14개 블록** 전체 관리 (표시·순서·내용 편집)
- 블록 카테고리 탭: 헤더 | 메인 | 사이드바 | 푸터
- 섹션별 **내용 편집 모달** (각 항목의 텍스트·링크·아이콘 수정)
- 다국어 탭 (KO/JA/EN 전환하며 편집)
- Firestore 동적 블록은 표시 설정만 (개수·헤더 문구)
- 대시보드(index.html)에 "Home Layout" 카드 추가

### 3.4 FAQ 프리뷰 → 전문카드 링크

현재 FAQ 프리뷰 카드:
```html
<div class="faq-item"><h4>질문</h4><p>답변(80자)</p></div>
```

변경 후:
```html
<a href="/faq#faq-{id}" class="faq-item"><h4>질문</h4><p>답변(80자)…</p></a>
```

FAQ 전문 페이지(`/faq`)에서 해당 ID 앵커로 스크롤.

---

## 4. 작업 분할 (지시서 단위)

### 단계 1: 기반 (직렬, 선행 필수)

| # | 지시서 | 수정 파일 | 난이도 |
|---|--------|-----------|--------|
| 1 | **Firestore 초기 데이터 시딩** — 14개 블록 전체 시딩 스크립트 | scripts/seed-layout.js (1회성) | 중 |

### 단계 2: 병렬 실행 (막내 2~3명)

| # | 지시서 | 수정 파일 | 난이도 | 담당 |
|---|--------|-----------|--------|------|
| 2 | **SSR 블록 렌더링 — 헤더+메인** | home.js (hero, user-bar, nav, service-cards, howto) | 중상 | 막내A |
| 3 | **SSR 블록 렌더링 — 사이드바+푸터+설정** | home.js (guide, credit, footer) + Firestore 블록 설정 (maxItems 등) | 중 | 막내A 후속 |
| 4 | **layout.html 확장 — 블록 편집 UI** | layout.html (14블록 편집 모달 + 다국어 탭) | 중상 | 막내B |
| 5 | **FAQ 프리뷰 링크 + 갤러리 스트립 설정** | home.js, render.js (faq 앵커, gallery maxItems/scroll) | 하 | 막내C |

### 단계 3: 마무리 (직렬)

| # | 지시서 | 수정 파일 | 난이도 |
|---|--------|-----------|--------|
| 6 | **i18n.js 정리 + 대시보드 연결** | i18n.js (이관된 ~40개 키 제거 + applyLang 정리), index.html(어드민) 카드 추가 | 중 |
| 7 | **통합 검증 + 배포** | dev 테스트 → prod 배포 | 하 |

**총 7건 / 막내 2~3명 / 단계2가 핵심 (4건 병렬)**

### 실행 흐름

```
[단계 1] #1 시딩 스크립트 ──────────────────────────┐
                                                      ▼
[단계 2] #2 SSR 헤더+메인 ─→ #3 SSR 사이드바+푸터    │ 막내A (직렬)
         #4 layout.html 편집 UI                       │ 막내B (병렬)
         #5 FAQ 링크 + 갤러리 설정                    │ 막내C (병렬)
                                                      ▼
[단계 3] #6 i18n 정리 + 대시보드 ─→ #7 통합 검증+배포
```

---

## 5. i18n 영향도

현재 i18n.js(21KB)에 하드코딩된 번역 키 중 블록으로 이관되는 항목:

| 키 그룹 | 현재 | Phase 0 후 |
|---------|------|------------|
| heroTag | i18n.js | Firestore 블록 (hero) |
| ctaText | i18n.js | Firestore 블록 (user-bar) |
| navHome/Blog/Faq/Gallery/Board/Pricing | i18n.js | Firestore 블록 (nav) |
| svcPhotoTitle/Desc/Link | i18n.js | Firestore 블록 (service-cards) |
| svcCropTitle/Desc/Link | i18n.js | Firestore 블록 (service-cards) |
| howto1/2/3, howto1d/2d/3d | i18n.js | Firestore 블록 (howto) |
| secHowto/secFaq/secBoard/secBlog + All | i18n.js | Firestore 블록 (각 섹션 header) |
| sbMagazine/sbTags/sbTagMore/sbTagLess | i18n.js | Firestore 블록 (magazine, tags) |
| guide1Title/Desc, guide2Title/Desc, guideStatus | i18n.js | Firestore 블록 (guide) |
| sbCredit, creditExchange/Gen/Dl/Total/Old/New/Bonus | i18n.js | Firestore 블록 (credit-info) |
| login/loginGoogle/loginKakao/loginLine/loginClose | i18n.js | **유지** (모달, SSR 범위 밖) |
| chatPlaceholder/chatHint/chatWelcome/chatTitle | i18n.js | **유지** (챗봇, SSR 범위 밖) |
| consent 텍스트 (privacy/portrait) | i18n.js | **유지** (동의 모달) |

→ i18n.js에서 약 **40개 키 + applyLang() DOM 조작 ~120줄** Firestore로 이관
→ **i18n.js 21KB → ~10KB 예상** (52% 감소)
→ 잔류 항목: 로그인 모달, 챗봇, 동의 모달 (클라이언트 전용 UI)

---

## 6. 향후 합류 경로

```
[Phase 0] 데이터 레이어 + 어드민 편집 (본 기안서) ← 지금
    ↓
[Phase A] 블로그 HTML 블록 템플릿 (기안서 03-16)
    ↓
[Phase B] Editor.js 전환 PoC
    ↓
[Phase C] 홈+블로그 통합 블록 시스템
            └─ Phase 0의 Firestore 스키마가 그대로 합류
               (sections[].items → Editor.js JSON blocks로 마이그레이션)
```

Phase 0의 Firestore 스키마가 Phase C에서 Editor.js의 데이터 레이어로 자연스럽게 진화합니다. 지금 깔아놓는 구조가 버려지는 게 아니라 **기반이 됩니다**.

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Firestore 1회 읽기 추가 (layout 문서) | SSR 응답 시간 ~50ms 증가 | layout 문서는 1개 doc이라 경미. 필요 시 메모리 캐시 (TTL 60s) |
| regex replace 패턴 깨짐 | SSR 렌더링 실패 | fallback: layout 로드 실패 시 기존 하드코딩 템플릿 그대로 반환 (현재 패턴) |
| i18n.js 키 제거 시 누락 | 일부 텍스트 미번역 | 단계3에서 전수 검증 후 제거. SSR 렌더링이 확인된 키만 삭제 |

---

## 8. 결정 필요 사항

1. **스키마 승인** — 3.1의 14개 블록 데이터 구조가 적절한지
2. **어드민 편집 범위** — Phase 0에서 CSS 커스텀(배경색·폰트 등)까지 열 것인지, 텍스트·링크만 할 것인지
3. **착수 시점** — 즉시 지시서 발행할 것인지
