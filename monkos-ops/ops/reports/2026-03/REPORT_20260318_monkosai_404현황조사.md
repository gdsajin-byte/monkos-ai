---
type: report
from: iMac/막내1
to: iMac/쌍아
date: 2026-03-18
subject: monkos.ai 404 현황 전수 조사 + 조치방안
---

# monkos.ai 404 현황 전수 조사 보고서

> **[2026-03-18 10:52 KST] iMac/막내1 → iMac/쌍아**

---

## 1. 색인 등록 현황

### A. sitemap.xml

**정적 파일** (`public/sitemap.xml`) — 5개 URL만 등록:

| URL | priority |
|-----|----------|
| `https://monkos.ai/` | 1.0 |
| `https://monkos.ai/credits.html` | 0.5 |
| `https://monkos.ai/privacy.html` | 0.3 |
| `https://monkos.ai/terms.html` | 0.3 |
| `https://monkos.ai/refund.html` | 0.3 |

**동적 SSR** (`/sitemap.xml` → `renderSitemap`) — server.js가 SSR 라우트 우선 처리하므로, 실제 Google이 보는 건 이쪽:

| URL | priority | 비고 |
|-----|----------|------|
| `/` | 1.0 | |
| `/credits.html` | 0.5 | |
| `/privacy.html` | 0.3 | |
| `/terms.html` | 0.3 | |
| `/refund.html` | 0.3 | |
| `/blog` | 0.8 | SSR |
| `/faq` | 0.7 | SSR |
| `/gallery` | 0.6 | SSR |
| `/board` | 0.5 | SSR |
| `/ja/blog` | 0.7 | 다국어 |
| `/en/blog` | 0.7 | 다국어 |
| `/llms.txt` | 0.5 | |
| 개별 블로그 포스트 | 0.7 | Firestore 동적 |

**sitemap에 누락된 유효 경로**: `/crop` (서비스 존재하지만 sitemap 미등록)

### B. robots.txt

```
Allow: /
Allow: /blog
Allow: /faq
Allow: /gallery
Allow: /board
Disallow: /admin
Disallow: /api/
Sitemap: https://monkos.ai/sitemap.xml
```

- `/crop` Allow 명시 없음 (기본 Allow이므로 크롤링은 됨, 하지만 명시적 등록이 바람직)
- `/pricing`, `/guide` — Allow/Disallow 모두 없음 (기본 Allow → 크롤러가 시도하면 404)

### C. index.html SEO 메타태그

- **Structured Data (JSON-LD)**: FAQPage + ItemList 포함
- ItemList에 등록된 서비스: `/`, `/crop`, `/blog`, `/faq`, `/gallery`
- **`/pricing`, `/guide`는 Structured Data에 없음** (다행히)

### D. `/guide` 유래 추적

- **index.html 211번 줄**: `<a href="/guide">전체보기 →</a>` — "증명사진 앱 활용법" 섹션의 링크
- server.js 라우트: **없음**
- public/ 정적 파일: **없음**
- sitemap: **없음**
- 결론: **index.html의 하드코딩 링크에서 유래. 실제 페이지 미구현 상태.**

---

## 2. 현황 매트릭스

| 경로 | server.js 라우트 | public/ 정적 파일 | JS 가로채기 | 실제 응답 (봇) | SEO 등록 | 판정 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` | SSR (`renderHome`) | index.html (템플릿) | - | 200 | sitemap + canonical | OK |
| `/blog` | SSR (`renderBlogList`) | - | - | 200 | sitemap + robots.txt | OK |
| `/blog/:slug` | SSR (`renderBlogPost`) | - | - | 200 | sitemap (동적) | OK |
| `/faq` | SSR (`renderFaq`) | - | - | 200 | sitemap + robots.txt | OK |
| `/gallery` | SSR (`renderGallery`) | - | - | 200 | sitemap + robots.txt | OK |
| `/board` | SSR (`renderBoardList`) | - | - | 200 | sitemap + robots.txt | OK |
| `/board/write` | SSR (`renderBoardWrite`) | - | - | 200 | - | OK |
| `/crop` | 라우트 있음 (206~212) | crop/index.html | - | 200 | **sitemap 누락** | 보완 필요 |
| `/pricing` | **없음** | **없음** | main.js → `openCreditShop()` | **404** | 없음 | **Dead Link** |
| `/guide` | **없음** | **없음** | **없음** | **404** | 없음 | **Dead Link** |
| `/privacy` | 없음 | privacy.html | - | 200 | sitemap | OK |
| `/terms` | 없음 | terms.html | - | 200 | sitemap | OK |
| `/refund` | 없음 | refund.html | - | 200 | sitemap | OK |
| `/credits.html` | 없음 | credits.html | - | 200 | sitemap | OK |
| `/admin/` | 없음 | admin/index.html | - | 200 | robots Disallow | OK |
| `/llms.txt` | 없음 | llms.txt | - | 200 | sitemap | OK |
| `/ja/blog` | SSR | - | - | 200 | sitemap | OK |
| `/en/blog` | SSR | - | - | 200 | sitemap | OK |

---

## 3. Dead Link 목록

### index.html 내부 링크 전수 대조

| 소스 위치 | href | 용도 | 상태 |
|-----------|------|------|------|
| nav (179줄) | `/pricing` | 네비게이션 "가격" | **Dead Link** (봇 404) |
| 본문 (211줄) | `/guide` | "증명사진 앱 활용법 전체보기" | **Dead Link** (404) |
| nav (174줄) | `/` | 홈 | OK |
| nav (175줄) | `/blog` | 블로그 | OK |
| nav (176줄) | `/faq` | FAQ | OK |
| nav (177줄) | `/gallery` | 갤러리 | OK |
| nav (178줄) | `/board` | 게시판 | OK |
| svc card (208줄) | `/crop` | 무료 크롭앱 | OK |
| 본문 (218줄) | `/blog` | 최근 블로그 전체보기 | OK |
| 본문 (226줄) | `/blog?tag=news` | 업계 소식 더보기 | OK |
| footer (262줄) | `/privacy` | 개인정보처리방침 | OK |
| footer (263줄) | `/terms` | 이용약관 | OK |
| footer (264줄) | `/refund` | 환불정책 | OK |

**총 Dead Link: 2건** (`/pricing`, `/guide`)

### SSR 렌더링 페이지(render.js) 내부 링크

| 소스 | href | 상태 |
|------|------|------|
| layoutNav | `/`, `/blog`, `/faq`, `/gallery`, `/board` | 모두 OK |
| layoutFooter | `/terms.html`, `/privacy.html`, `/refund.html` | 모두 OK |

---

## 4. 홈 vs /blog 데이터 불일치 분석

### 홈 페이지 (`/` → `renderHome`)
- **home.js**: index.html 템플릿을 읽은 후 Firestore `blog_posts` 데이터로 **동적 교체** (SSR)
- 교체 대상: 매거진 카드, 태그, 블로그 카드 4건, 뉴스 카드 2건, 갤러리 스트립
- **SSR 실패 시**: 정적 index.html 템플릿을 그대로 서빙 (하드코딩된 목업 데이터)

### /blog 페이지 (`renderBlogList`)
- **render.js**: Firestore `blog_posts` 컬렉션에서 `published == true` 조건으로 조회

### 분석 결과
- **정상 상태**: 두 페이지 모두 동일한 Firestore `blog_posts` 컬렉션을 읽으므로 데이터는 일치
- **리스크**: 홈 SSR 실패 시 fallback으로 정적 template이 나오면, 하드코딩된 목업 블로그 카드(취업사진 복장 가이드, 여권사진 체크마크 등)가 표시됨. 이 카드들의 링크가 `/blog/slug` 형태가 아닌 단순 텍스트이므로 **클릭 불가** (카드가 `<div>`이지 `<a>`가 아님)
- **Firestore 데이터 존재 여부**: 코드 레벨에서 `blog_posts`, `faq_items`, `gallery_items`, `board_posts` 4개 컬렉션 사용 확인. 실제 데이터 유무는 프로덕션 Firestore 조회 필요 (로컬에서 확인 불가)

---

## 5. 조치방안

### 우선순위 1 — Dead Link 해소 (Google 404 색인 직결)

| 경로 | 조치 방안 | 설명 |
|------|----------|------|
| **`/pricing`** | **방안 A (권장)**: `pricing.html` 정적 페이지 생성 (크레딧 가격표) | 봇이 접근해도 200 응답. SEO에도 유리 |
| | 방안 B: server.js에 302 리다이렉트 → `/` (또는 `/#credit`) 추가 | 간단하지만 SEO 가치 없음 |
| | 방안 C: index.html에서 `/pricing` href 제거, JS-only 트리거로 전환 | nav에서 제거하면 사용자 경험 저하 |
| **`/guide`** | **방안 A (권장)**: index.html에서 `<a href="/guide">` 링크 제거 또는 `/blog?tag=guide`로 변경 | 실제 guide 페이지 계획이 없다면 링크 제거가 가장 깔끔 |
| | 방안 B: `guide.html` 정적 페이지 생성 (앱 사용법 가이드) | 콘텐츠 제작 부담 |
| | 방안 C: server.js에 301 리다이렉트 → `/blog` 추가 | 임시 조치로 적합 |

### 우선순위 2 — sitemap 보완

| 항목 | 조치 |
|------|------|
| `/crop` sitemap 누락 | `renderSitemap`의 `staticUrls` 배열에 `/crop` 추가 |
| 정적 `public/sitemap.xml` 미사용 | SSR `renderSitemap`이 우선하므로 영향 없음. 단, 혼란 방지를 위해 정적 파일 삭제 또는 동기화 권장 |

### 우선순위 3 — robots.txt 보완

| 항목 | 조치 |
|------|------|
| `/crop` 명시적 Allow 추가 | `Allow: /crop` 한 줄 추가 |

### 우선순위 4 — 홈 SSR fallback 개선

| 항목 | 조치 |
|------|------|
| 정적 template 목업 데이터 | 목업 블로그 카드를 빈 placeholder로 교체하거나, 목업 카드에도 실제 `/blog/slug` 링크 부여 |

---

## 6. 참조

### 확인된 Firestore 컬렉션 (코드 레벨)

| 컬렉션 | 사용처 | 조건 |
|--------|--------|------|
| `blog_posts` | 홈 SSR, /blog, sitemap | `published == true` |
| `faq_items` | /faq | `published == true`, `order` 정렬 |
| `gallery_items` | /gallery, 홈 strip | `published == true`, `order` 정렬 |
| `board_posts` | /board | `published == true`, `createdAt` 정렬 |
| `site_config` | 홈 intro, 레이아웃 | doc: `main`, `layout` |

### 정적 파일 존재 확인

| 파일 | 존재 |
|------|:---:|
| `favicon-32.png` | O |
| `favicon-192.png` | O |
| `apple-touch-icon.png` | O |
| `monkos-icon.svg` | O |
| `og-image.png` | O |
| `css/portal.css` | O |
| `js/i18n.js`, `auth.js`, `credits.js`, `chat.js`, `main.js` | O |
| `privacy.html`, `terms.html`, `refund.html`, `credits.html` | O |
| `llms.txt` | O |
| `crop/index.html` | O |
| `admin/index.html` 외 7개 | O |
| `pricing.html` | **X** |
| `guide.html` 또는 `guide/` | **X** |
