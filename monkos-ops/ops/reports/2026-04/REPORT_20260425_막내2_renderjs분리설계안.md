---
type: report
id: REPORT_20260425_renderjs분리설계안
date: 2026-04-25
from: iMac/막내2
to: iMac/쌍아
subject: render.js 2,362줄 모듈 분리 최적 설계안 조사
order: ORDER_20260425_renderjs분리설계안
---

# render.js 모듈 분리 최적 설계안 리포트

> 대상: `monkos_AI/portal/lib/cms/render.js` (2,362줄)
> 진단일: 2026-04-25
> 코드 수정: 없음 (읽기·분석만)

---

## §1 render.js 함수맵

### export 함수 (외부에서 import하는 함수)

| # | 함수명 | 시작행 | 끝행 | 줄 수 | 타입 | 의존 함수 | server.js 호출 |
|---|--------|--------|------|-------|------|----------|---------------|
| 1 | `layoutShell()` | 163 | 176 | 14 | sync | layoutHead, layoutNav, layoutFooter | — (간접: render 함수 내부 사용) |
| 2 | `blogListFragment()` | 183 | 373 | 191 | async | escapeHtml, stripHtml | — |
| 3 | `renderBlogList()` | 376 | 387 | 12 | async | blogListFragment, layoutShell | ✅ |
| 4 | `blogPostFragment()` | 394 | 572 | 179 | async | escapeHtml, stripHtml, getSeoDescription, marked, blogRenderer | — |
| 5 | `renderBlogPost()` | 575 | 590 | 16 | async | blogPostFragment, layoutShell | ✅ |
| 6 | `faqFragment()` | 597 | 703 | 107 | async | escapeHtml, marked | — |
| 7 | `renderFaq()` | 706 | 729 | 24 | async | faqFragment, layoutHead, layoutNav, layoutFooter (커스텀 셸) | ✅ |
| 8 | `galleryFragment()` | 736 | 823 | 88 | async | escapeHtml | — |
| 9 | `renderGallery()` | 826 | 848 | 23 | async | galleryFragment, layoutHead, layoutNav, layoutFooter (커스텀 셸) | ✅ |
| 10 | `boardListFragment()` | 855 | 932 | 78 | async | escapeHtml | — |
| 11 | `renderBoardList()` | 935 | 957 | 23 | async | boardListFragment, layoutHead, layoutNav, layoutFooter (커스텀 셸) | ✅ |
| 12 | `boardPostFragment()` | 960 | 1035 | 76 | async | escapeHtml | — |
| 13 | `renderBoardPost()` | 1038 | 1053 | 16 | async | boardPostFragment, layoutShell | ✅ |
| 14 | `boardWriteFragment()` | 1056 | 1150 | 95 | async | — | — |
| 15 | `renderBoardWrite()` | 1153 | 1164 | 12 | async | boardWriteFragment, layoutShell | ✅ |
| 16 | `guideFragment()` | 1171 | 1333 | 163 | async | — (정적 HTML) | — |
| 17 | `renderGuide()` | 1336 | 1347 | 12 | async | guideFragment, layoutShell | ✅ |
| 18 | `specsListFragment()` | 1644 | 1724 | 81 | sync | escapeHtml, locField, SPECS_DATA, SPECS_I18N, SPECS_PAGE_STYLE | — |
| 19 | `specsDetailFragment()` | 1727 | 1977 | 251 | sync | escapeHtml, locField, SPECS_DATA, SPECS_I18N, SPECS_PAGE_STYLE | — |
| 20 | `renderSpecsList()` | 1980 | 1991 | 12 | sync | specsListFragment, layoutShell | ✅ |
| 21 | `renderSpecsDetail()` | 1994 | 2012 | 19 | sync | specsDetailFragment, layoutShell | ✅ |
| 22 | `renderSitemap()` | 2019 | 2090 | 72 | async | SPECS_DATA, blogCollection | ✅ |
| 23 | `pricingFragment()` | 2186 | 2338 | 153 | sync | escapeHtml, PRICING_DATA | — |
| 24 | `renderPricing()` | 2341 | 2362 | 22 | sync | pricingFragment, layoutHead, layoutNav, layoutFooter (커스텀 셸) | ✅ |

### 비-export 내부 함수/상수

| # | 이름 | 시작행 | 끝행 | 줄 수 | 성격 | 사용처 |
|---|------|--------|------|-------|------|--------|
| A | `blogRenderer` (marked Renderer) | 18 | 23 | 6 | 상수 | blogPostFragment |
| B | `escapeHtml()` | 25 | 28 | 4 | 유틸 | **전체** (Blog, FAQ, Gallery, Board, Specs, Pricing) |
| C | `stripHtml()` | 30 | 40 | 11 | 유틸 | blogListFragment, getSeoDescription |
| D | `getSeoDescription()` | 42 | 46 | 5 | 유틸 | blogPostFragment |
| E | `layoutHead()` | 48 | 134 | 87 | 셸 | layoutShell, renderFaq, renderGallery, renderBoardList, renderPricing |
| F | `layoutNav()` | 136 | 150 | 15 | 셸 | layoutShell, renderFaq, renderGallery, renderBoardList, renderPricing |
| G | `layoutFooter()` | 152 | 157 | 6 | 셸 | layoutShell, renderFaq, renderGallery, renderBoardList, renderPricing |
| H | `locField()` | 1638 | 1642 | 5 | 유틸 | specsListFragment, specsDetailFragment |
| I | `SPECS_I18N` | 1357 | 1421 | 65 | 상수 | specsListFragment, specsDetailFragment |
| J | `SPECS_PAGE_STYLE` | 1424 | 1634 | 211 | 상수 | specsListFragment, specsDetailFragment |
| K | `SPECS_DATA` (JSON import) | 1353 | 1355 | 3 | 데이터 | specsListFragment, specsDetailFragment, renderSitemap |
| L | `PRICING_DATA` | 2096 | 2184 | 89 | 상수 | pricingFragment |
| M | Firestore collections | 12 | 15 | 4 | 상수 | Blog, FAQ, Gallery, Board, Sitemap |

---

## §2 공유 유틸 목록

### 범용 유틸 (다수 도메인이 공유)

| 유틸 | 사용 도메인 | 분리 시 처리 |
|------|-----------|-------------|
| `escapeHtml()` | Blog, FAQ, Gallery, Board, Specs, Pricing (6/6) | **별도 파일 필수** |
| `stripHtml()` | Blog만 | Blog 파일에 내장 가능 |
| `getSeoDescription()` | Blog만 | Blog 파일에 내장 가능 |

### 레이아웃 셸 (4개 함수, 합계 122줄)

| 셸 함수 | 사용 패턴 |
|---------|----------|
| `layoutHead()` 87줄 | 모든 페이지 (layoutShell 경유 또는 직접) |
| `layoutNav()` 15줄 | 모든 페이지 |
| `layoutFooter()` 6줄 | 모든 페이지 |
| `layoutShell()` 14줄 | Blog List/Post, Board Post/Write, Guide, Specs List/Detail |

**특이 사항**: renderFaq, renderGallery, renderBoardList, renderPricing은 `layoutShell()`을 사용하지 않고 `layoutHead/Nav/Footer`를 직접 조합한다 (container max-width 커스텀 또는 lightbox 구조 때문). → 이 4개의 셸 함수는 반드시 공유 모듈에 있어야 한다.

### 데이터 의존 정리

| 도메인 | Firestore | specs-data.json | 정적 데이터 |
|--------|-----------|-----------------|------------|
| Blog | `blog_posts` | — | — |
| FAQ | `faq_items` | — | — |
| Gallery | `gallery_items` | — | — |
| Board | `board_posts` | — | — |
| Guide | — | — | 하드코딩 HTML |
| Specs | — | `SPECS_DATA` | `SPECS_I18N`, `SPECS_PAGE_STYLE` |
| Pricing | — | — | `PRICING_DATA` |
| Sitemap | `blog_posts` | `SPECS_DATA` | 정적 URL 목록 |

---

## §3 분리 후보안

### 안 A: 도메인별 분리 (1파일 = 1도메인)

```
lib/cms/
├── render-shell.js     ← 공유 (layoutHead/Nav/Footer/Shell + escapeHtml + marked import)    ~140줄
├── render-blog.js      ← blogListFragment + blogPostFragment + renderBlogList/Post           ~410줄
├── render-faq.js       ← faqFragment + renderFaq                                             ~140줄
├── render-gallery.js   ← galleryFragment + renderGallery                                     ~120줄
├── render-board.js     ← boardListFragment/Post/Write + renderBoardList/Post/Write            ~310줄
├── render-guide.js     ← guideFragment + renderGuide                                         ~180줄
├── render-specs.js     ← SPECS_DATA/I18N/STYLE + locField + specsListFragment/Detail + renderSpecsList/Detail   ~700줄
├── render-pricing.js   ← PRICING_DATA + pricingFragment + renderPricing                      ~270줄
├── render-sitemap.js   ← renderSitemap (SPECS_DATA import + blogCollection)                   ~80줄
└── render.js           ← (삭제 또는 re-export barrel)
```

**평가:**
- 분리 후 파일 수: 9개 (shell 포함)
- 가장 큰 파일: render-specs.js ~700줄 (허용 범위)
- 공유 유틸: render-shell.js에 집중. 각 파일이 `import { layoutShell, layoutHead, layoutNav, layoutFooter, escapeHtml } from './render-shell.js'`
- server.js 변경: import 1줄 → 9줄 (또는 barrel re-export로 1줄 유지)
- 순환 의존: **없음**. 단방향 의존 (도메인 → shell)
- v5 타일 렌더러: `render-home.js` (신규) 또는 기존 `home.js`에 추가
- 장점: 도메인 독립성 최대. 각 파일이 자기 도메인만 책임. 병렬 개발 가능
- 단점: 파일 수 증가. FAQ(140줄), Gallery(120줄)은 분리 이득 작음

### 안 B: 기능군 분리 (3~4파일)

```
lib/cms/
├── render-shell.js     ← 공유 셸 + 유틸                                                      ~140줄
├── render-content.js   ← Blog + FAQ + Guide (콘텐츠 소비형)                                   ~720줄
├── render-community.js ← Board + Gallery (사용자 참여형)                                      ~430줄
├── render-specs.js     ← Specs + Pricing + Sitemap (정적 데이터 기반)                         ~1,050줄
└── render.js           ← (삭제 또는 barrel)
```

**평가:**
- 분리 후 파일 수: 4개 (shell 포함)
- 가장 큰 파일: render-specs.js ~1,050줄 (아직 크지만 단일 관심사)
- 공유 유틸: 안 A와 동일
- server.js 변경: import 1줄 → 4줄
- 순환 의존: **없음**
- v5 타일 렌더러: render-content.js 또는 별도 render-home.js
- 장점: 파일 수 적음. 관련 도메인이 같은 파일에 있어 수정 시 컨텍스트 유지
- 단점: render-specs.js가 1,050줄 — 79 리팩토링 원칙(2,000줄 분기) 미달이나 Specs+Pricing+Sitemap 혼재는 관심사 분리 약함

### 안 C: 기존 패턴 호환 분리 (도메인별 + barrel re-export)

```
lib/cms/
├── render-shell.js     ← 공유 셸 + 유틸                                                      ~140줄
├── render-blog.js      ← Blog (Fragment + Render)                                            ~410줄
├── render-board.js     ← Board (Fragment + Render ×3)                                        ~310줄
├── render-static.js    ← FAQ + Gallery + Guide (Firestore 읽기만, 단순 구조)                   ~440줄
├── render-specs.js     ← Specs (SPECS_DATA/I18N/STYLE + Fragment + Render)                   ~700줄
├── render-pricing.js   ← Pricing (PRICING_DATA + Fragment + Render)                          ~270줄
├── render-sitemap.js   ← Sitemap                                                             ~80줄
├── render.js           ← barrel: 전체 re-export (server.js import 변경 0)                     ~15줄
```

**평가:**
- 분리 후 파일 수: 7개 (shell + barrel 포함)
- 가장 큰 파일: render-specs.js ~700줄
- **server.js 변경: 0** — render.js가 barrel re-export 역할. 기존 import 문 그대로 유지
- 순환 의존: **없음**
- v5 타일 렌더러: home.js에 추가 (기존 패턴 유지)
- 기존 패턴 호환: lib/cms/ 아래 blog.js(CRUD), board.js(CRUD)와 render-blog.js(SSR), render-board.js(SSR)가 쌍으로 존재 — 관심사 분리가 CRUD(API) vs SSR(렌더)로 일관
- 장점: server.js 변경 0, 기존 패턴과 일관, FAQ/Gallery/Guide는 단순해서 묶어도 무방
- 단점: render-static.js 네이밍이 약간 임의적

---

## §4 추천안 + 근거

### 추천: **안 C** (기존 패턴 호환 분리 + barrel re-export)

**근거:**

1. **server.js 변경 0**: barrel re-export로 기존 import 문 변경 없음. 배포 위험 최소화
2. **기존 패턴 일관성**: lib/cms/ 아래 blog.js(CRUD API) / render-blog.js(SSR) 쌍 구조가 board.js / render-board.js와 동일 패턴. 새 개발자(또는 에이전트)가 "blog 관련 렌더링은 render-blog.js" 즉시 인지
3. **파일 크기 균형**: 최대 700줄(render-specs.js), 최소 80줄(render-sitemap.js). 2,000줄 분기선 이하
4. **순환 의존 0**: 모든 도메인 파일 → render-shell.js 단방향 참조
5. **FAQ/Gallery/Guide 묶기 합리성**: 이 3개는 구조가 단순(Fragment+Render 패턴 동일, 각 100~180줄). 별도 파일로 쪼개면 120줄짜리 파일이 3개 생기는데, 묶어서 440줄이면 관리가 더 편함

**barrel render.js 예시:**
```js
export { layoutShell } from './render-shell.js';
export { blogListFragment, renderBlogList, blogPostFragment, renderBlogPost } from './render-blog.js';
export { boardListFragment, renderBoardList, boardPostFragment, renderBoardPost, boardWriteFragment, renderBoardWrite } from './render-board.js';
export { faqFragment, renderFaq, galleryFragment, renderGallery, guideFragment, renderGuide } from './render-static.js';
export { specsListFragment, specsDetailFragment, renderSpecsList, renderSpecsDetail } from './render-specs.js';
export { pricingFragment, renderPricing } from './render-pricing.js';
export { renderSitemap } from './render-sitemap.js';
```

---

## §5 v5 타일 렌더러 삽입 위치 제안

### 현재 홈 렌더링 구조

- `home.js` (509줄): index.html 템플릿을 읽고 Firestore 데이터(블로그, 갤러리, FAQ, 게시판, site_config)를 주입하는 SSR
- home.js는 **render.js와 독립** (import 없음). 자체 `esc()` 유틸, 자체 셸 구조 (index.html 템플릿 기반)

### v5 타일 그리드 삽입 위치

**옵션 1: home.js 확장** (추천)
- home.js가 이미 홈 SSR 전담. v5 타일 그리드는 홈 페이지 디자인 변경이므로 home.js에 추가가 자연스러움
- 현재 509줄 + 타일 렌더러 예상 200~400줄 = 700~900줄 — 허용 범위
- home.js도 1,000줄 넘기면 render-home.js로 분리

**옵션 2: render-home.js 신규**
- home.js를 CRUD/설정 API 전담으로 두고, SSR 렌더링만 render-home.js로 분리
- render.js 분리 패턴과 동일 (CRUD ↔ SSR 분리)
- 초기 구현이 700줄 미만이면 오버엔지니어링

**제안**: v5 타일 그리드를 **home.js에 먼저 추가**. 1,000줄 초과 시 render-home.js 분리.

---

**[2026-04-25 16:44 KST] iMac/막내2 → 작가님**

✅ render.js 모듈 분리 설계안 조사 완료
📁 `monkos-ops/ops/reports/REPORT_20260425_막내2_renderjs분리설계안.md`
