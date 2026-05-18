---
type: tech_spec
title: Portal v4 Evolution — 기술명세 및 단계 설계
date: 2026-03-16
author: M1/쌍아
status: confirmed
---

# Portal v4 Evolution — 기술명세 및 단계 설계

> **분기점**: 2026-03-16
> **원칙**: 서두르지 않는다. 현재 레이아웃 기준으로 카드별 컨텐츠를 정비하며 점진 진화.
> **설계 근거**: 코웍이 레이아웃 설계 (`works/portal_v4/REPORT_20260316_코웍이_포털v4레이아웃설계.md`)

---

## 1. 현재 상태 (AS-IS)

### 1-1. 파일 구조

```
monkos_AI/portal/
├── server.js                    # 라우터 (278행)
├── public/
│   ├── index.html               # 홈 템플릿 (279행)
│   ├── css/portal.css           # 전체 CSS (630행)
│   ├── js/main.js               # 이벤트 바인딩 (139행)
│   ├── js/auth.js               # 인증
│   ├── js/credits.js            # 크레딧
│   ├── js/chat.js               # 챗봇
│   ├── js/i18n.js               # 다국어
│   └── admin/
│       ├── index.html           # 대시보드 (카운트 카드)
│       ├── blog-list.html       # 블로그 목록
│       ├── blog-edit.html       # 블로그 편집
│       ├── faq.html             # FAQ 관리
│       ├── gallery.html         # 갤러리 관리
│       ├── board.html           # 게시판 관리
│       └── settings.html        # 사이트 설정 (intro만)
└── lib/cms/
    ├── home.js                  # 홈 SSR (200행)
    ├── render.js                # 블로그/FAQ/갤러리/게시판 SSR (1010행)
    ├── gallery.js               # 갤러리 CRUD API (137행)
    ├── blog.js                  # 블로그 CRUD API
    ├── faq.js                   # FAQ CRUD API
    ├── board.js                 # 게시판 CRUD API
    ├── upload.js                # GCS 업로드
    ├── translate.js             # 번역 API
    └── admin-auth.js            # 어드민 인증
```

### 1-2. CSS 레이아웃 (현재 값)

```css
.layout {
  grid-template-columns: 200px 1fr 180px;  /* 비대칭 */
  max-width: 1280px;
}
```

- 헤더/갤러리스트립/네비: `.layout` 바깥 뷰포트 풀블리드
- `site-wrapper` 개념 없음

### 1-3. 홈페이지 컴포넌트 현황

| # | 컴포넌트 | HTML 위치 | SSR 동적 | 어드민 관리 | Firestore |
|---|---------|-----------|---------|-----------|-----------|
| 1 | 히어로 | `.hero` | ❌ | ❌ | — |
| 2 | 유저바 (로그인/크레딧) | `.user-bar` | ❌ (JS) | ❌ | — |
| 3 | 갤러리 스트립 | `.gallery-strip` | ❌→🔄 | ✅ gallery CRUD | `gallery_items` |
| 4 | 네비게이션 | `nav` | ❌ | ❌ | — |
| 5 | 좌측: 매거진 카드 | `.mag-card` | ✅ | ✅ blog pinned | `blog_posts` |
| 6 | 좌측: 태그 | `.sb-tags` | ✅ | ✅ blog tags 집계 | `blog_posts` |
| 7 | 메인: Intro 문구 | `.intro-text` | ✅ | ✅ settings | `site_config` |
| 8 | 메인: 서비스 카드 | `.svc-grid` | ❌ | ❌ | — |
| 9 | 메인: How-to | `.howto-grid` | ❌ | ❌ | — |
| 10 | 메인: 블로그 목록 | `.blog-list` | ✅ | ✅ blog CRUD | `blog_posts` |
| 11 | 메인: 뉴스 | `.blog-list` (news) | ✅ | ✅ blog category | `blog_posts` |
| 12 | 우측: 가이드 카드 | `.guide-card` | ❌ | ❌ | — |
| 13 | 우측: 크레딧 안내 | `.credit-info` | ❌ | ❌ | — |
| 14 | 챗봇바 | `.chatbot-bar` | ❌ (JS) | ❌ | — |

### 1-4. Firestore 스키마 (현재)

```
site_config/main          → { intro, updatedAt }
blog_posts/{slug}         → { title, content, summary, author, category, tags[], lang, published, pinned, thumbnail, createdAt, updatedAt, viewCount, originalSlug }
faq_items/{id}            → { question, answer, category, lang, order, published }
gallery_items/{id}        → { imageUrl, caption, category, lang, order, published, createdAt }
board_posts/{id}          → { title, content, author, password, category, published, replies[], createdAt }
users/{uid}               → { ... }
```

### 1-5. 어드민 API 엔드포인트 (현재)

```
GET/PUT  /api/admin/settings          # site_config
GET/POST /api/admin/blog              # blog CRUD
GET/PUT/DELETE /api/admin/blog/:slug
GET/POST /api/admin/faq               # FAQ CRUD
PUT/DELETE /api/admin/faq/:id
GET/POST /api/admin/gallery           # gallery CRUD
PUT/DELETE /api/admin/gallery/:id
GET/POST/PUT/DELETE /api/admin/board   # board 관리
POST /api/admin/upload                # GCS 업로드
```

---

## 2. 목표 상태 (TO-BE)

### 2-1. 레이아웃 확정값

```css
.site-wrapper {
  max-width: 1280px;
  margin: 0 auto;
}
.layout {
  grid-template-columns: 260px 1fr 260px;  /* 균등 */
}
.mag-img {
  aspect-ratio: 200/105;  /* OGP 1.91:1 */
}
```

- 전체를 `.site-wrapper`로 감싼다 (헤더 포함)
- 뷰포트 풀블리드 → 박스 내부 풀블리드로 전환

### 2-2. 브레이크포인트

```css
@media (max-width: 1024px) {
  .layout { grid-template-columns: 0 1fr 260px; }
  .sidebar-left { display: none; }
}
@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar-left, .sidebar-right { display: none; }
}
```

### 2-3. 블록 에디터 아키텍처 (최종 목표)

```
site-wrapper
 ├── slot: header        [fullbleed] → 블록 타입 선택
 ├── slot: photo_strip   [fullbleed] → 블록 타입 선택
 ├── slot: nav           [fullbleed, locked]
 └── grid layout
      ├── slot: sidebar_left   [sidebar]
      ├── slot: main_1~N       [main, 순서 변경]
      └── slot: sidebar_right  [sidebar]
```

### 2-4. Firestore 스키마 (목표)

```
site_config/main → {
  intro: "...",
  layout: {
    maxWidth: 1280,
    sidebar: { left: 260, right: 260 },
    breakpoints: { leftHide: 1024, bothHide: 768 }
  },
  blocks: [
    { slot: "header",        type: "site_header",    visible: true },
    { slot: "photo_strip",   type: "gallery_slider", visible: true },
    { slot: "nav",           type: "nav_bar",        visible: true, locked: true },
    { slot: "sidebar_left",  type: "ogp_cards",      visible: true },
    { slot: "main_1",        type: "hero",           visible: true, order: 1 },
    { slot: "main_2",        type: "service_grid",   visible: true, order: 2 },
    { slot: "main_3",        type: "howto",          visible: true, order: 3 },
    { slot: "main_4",        type: "blog_list",      visible: true, order: 4 },
    { slot: "sidebar_right", type: "video_cards",    visible: true }
  ],
  hero: { label, title, emphasis, tags[] },
  services: [{ icon, badge, badgeType, title, desc, link, url, type, order }],
  howto: [{ num, title, desc }],
  credit: { unit, rates[], price, originalPrice, bonus },
  updatedAt: "..."
}
```

### 2-5. 블록 타입 목록

| category | id | label | 적용 슬롯 |
|---|---|---|---|
| fullbleed | `site_header` | 사이트 헤더 | header |
| fullbleed | `gallery_slider` | 갤러리 슬라이더 | photo_strip |
| fullbleed | `nav_bar` | 네비게이션 | nav (locked) |
| main | `hero` | 히어로 | main_N |
| main | `service_grid` | 서비스 카드 | main_N |
| main | `howto` | 사용법 | main_N |
| main | `blog_list` | 블로그 목록 | main_N |
| main | `credits` | 크레딧 안내 | main_N |
| sidebar | `ogp_cards` | OGP 카드 (1.91:1) | sidebar_left |
| sidebar | `video_cards` | 영상 카드 (9:16) | sidebar_right |
| sidebar | `guide_card` | 가이드 카드 (3:4) | sidebar_right |
| sidebar | `credit_mini` | 크레딧 미니 | sidebar_right |

---

## 3. 진화 단계 설계

> **원칙**: 각 단계는 독립 배포 가능. 이전 단계 완료 없이 다음 진행 불가한 항목만 의존성 표기.

### Phase 0: CSS 기준값 + site-wrapper

**목표**: 레이아웃 골격을 v4 확정값으로 전환

| # | 작업 | 파일 |
|---|------|------|
| 0-1 | `.site-wrapper` 도입 (1280px, 전체 감싸기) | `index.html` |
| 0-2 | 그리드 `260px 1fr 260px` 전환 | `portal.css` |
| 0-3 | `.mag-img` → `aspect-ratio: 200/105` | `portal.css` |
| 0-4 | 브레이크포인트 업데이트 (1024/768) | `portal.css` |
| 0-5 | 갤러리 스트립 `.gi` → `aspect-ratio: 3/4` (Safari 대응) | `portal.css` |

**Firestore 변경**: 없음
**어드민 변경**: 없음
**의존성**: 없음

---

### Phase 1: 갤러리 스트립 동적 연동

**목표**: 홈 갤러리 스트립을 Firestore에서 렌더

| # | 작업 | 파일 |
|---|------|------|
| 1-1 | `galleryCollection` 쿼리 추가 | `home.js` |
| 1-2 | 갤러리 스트립 HTML 교체 로직 | `home.js` |

**Firestore 변경**: 없음 (기존 `gallery_items` 활용)
**어드민 변경**: 없음 (기존 `/admin/gallery.html` 활용)
**의존성**: 없음 (Phase 0과 병렬 가능)
**지시서**: 발급 완료 (`ORDER_20260316_홈갤러리스트립_Firestore동적연동.md`)

---

### Phase 2: 서비스 카드 동적화

**목표**: 서비스 카드를 어드민에서 추가/수정/순서변경/숨기기

| # | 작업 | 파일 |
|---|------|------|
| 2-1 | `site_config.services[]` 스키마 추가 | Firestore |
| 2-2 | settings API에 services 필드 허용 | `home.js` |
| 2-3 | SSR 서비스 카드 교체 로직 | `home.js` |
| 2-4 | `settings.html`에 Services 탭 추가 | `settings.html` |
| 2-5 | 초기 시딩 (현재 하드코딩 값 → Firestore) | 수동 or 스크립트 |

**Firestore 변경**: `site_config.main.services[]` 추가
**의존성**: 없음

---

### Phase 3: 히어로 + How-to + 크레딧 동적화

**목표**: 나머지 하드코딩 메인 컴포넌트를 어드민 관리로 전환

| # | 작업 | 파일 |
|---|------|------|
| 3-1 | `site_config`에 `hero{}`, `howto[]`, `credit{}` 추가 | Firestore |
| 3-2 | settings API 확장 | `home.js` |
| 3-3 | SSR 교체 로직 (hero/howto/credit) | `home.js` |
| 3-4 | `settings.html`에 Hero/How-to/Credits 탭 추가 | `settings.html` |
| 3-5 | 초기 시딩 | 수동 or 스크립트 |

**Firestore 변경**: `site_config.main` 필드 3개 추가
**의존성**: Phase 2와 병렬 가능 (settings.html 탭 구조만 공유)

---

### Phase 4: 우측 사이드바 동적화

**목표**: 가이드 카드, 크레딧 미니를 어드민에서 관리

| # | 작업 | 파일 |
|---|------|------|
| 4-1 | 사이드바 컴포넌트 스키마 설계 | Firestore |
| 4-2 | SSR 교체 로직 | `home.js` |
| 4-3 | 어드민 UI | `settings.html` |

**의존성**: Phase 2~3 완료 후 (탭 구조 안정화 후)

---

### Phase 5: site-wrapper + HTML 구조 전환

**목표**: 코웍이 설계대로 HTML 구조를 site-wrapper 기반으로 리팩토링

| # | 작업 | 파일 |
|---|------|------|
| 5-1 | `index.html` 구조 변경 (site-wrapper 포함) | `index.html` |
| 5-2 | `home.js` SSR 정규식 전체 재조정 | `home.js` |
| 5-3 | `portal.css` 셀렉터 업데이트 | `portal.css` |

**의존성**: Phase 0~4 완료 후 (기존 정규식 교체가 안정화된 후)
**위험도**: 높음 — 정규식 기반 SSR이 HTML 구조에 밀결합

---

### Phase 6: 블록 배열 도입 + layout 필드

**목표**: `site_config.blocks[]` + `layout{}` 도입, 슬롯 기반 렌더러

| # | 작업 | 파일 |
|---|------|------|
| 6-1 | Firestore `blocks[]`, `layout{}` 스키마 도입 | Firestore |
| 6-2 | `home.js` → 블록 배열 순회 렌더러로 전환 | `home.js` |
| 6-3 | settings API → blocks/layout 필드 지원 | `home.js` |
| 6-4 | 기존 탭별 편집 → 블록 편집기 전환 | `settings.html` → 신규 `homepage.html` |

**의존성**: Phase 5 완료 필수
**비고**: 이 단계에서 `home.js`가 정규식 교체 → 블록 렌더러로 아키텍처 전환

---

### Phase 7: 어드민 블록 에디터 UI

**목표**: 코웍이 프로토(`PROTO_admin_dashboard_v1.html`) 기반 실서비스 연동

| # | 작업 | 파일 |
|---|------|------|
| 7-1 | 프로토 → 실서비스 HTML 변환 | `admin/homepage.html` |
| 7-2 | Firestore CRUD 연동 (localStorage → API) | JS |
| 7-3 | 슬롯 에디터 + 블록 팔레트 실동작 | JS |
| 7-4 | 레이아웃 프리뷰 내장 | CSS/JS |

**의존성**: Phase 6 완료 필수
**비고**: 이 단계 완료 시 코웍이 프로토와 동일 수준 달성

---

## 4. 단기 실행 계획 (즉시)

현재 발급 완료 / 실행 대기 중인 지시서:

| 지시서 | Phase | 상태 |
|--------|-------|------|
| Safari 비율 2차 수정 (aspect-ratio) | P0-5 | ⏳ 막내 대기 |
| 홈 갤러리 Firestore 동적 연동 | P1 | ⏳ 막내 대기 |

이 2건 실행 후 Phase 2(서비스 카드 동적화)로 진입.

---

## 5. 참조 문서

| 문서 | 경로 |
|------|------|
| 코웍이 레이아웃 설계 보고서 | `works/portal_v4/REPORT_20260316_코웍이_포털v4레이아웃설계.md` |
| 코웍이 어드민 프로토타입 | `works/portal_v4/PROTO_admin_dashboard_v1.html` |
| 코웍이 레이아웃 프리뷰 도구 | `works/portal_v4/LAYOUT_preview.html` |
| 포털 v4 컨텍스트 | `works/portal_v4/CONTEXT_PORTAL_V4.md` |
| 현행 디자인 시스템 | `tech/guides/DESIGN_SYSTEM.md` |
| 현행 코딩 표준 | `tech/guides/CODING_STANDARDS.md` |
