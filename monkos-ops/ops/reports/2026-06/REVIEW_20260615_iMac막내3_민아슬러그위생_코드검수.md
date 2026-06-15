---
type: report
date: 2026-06-15
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
---

# 코드 검수 보고서 — 웹/민아 색인 최적화(슬러그 위생+404→410)

> **[2026-06-15 15:27 KST]** iMac/막내3 → 작가님
> 검수 대상: 커밋 `37c87cd0` (웹/민아)
> 지시서: ORDER_20260615_iMac쌍아_막내3_SPECS_민아슬러그위생_코드검수

---

## 종합 판정

| 항목 | 판정 | 비고 |
|------|------|------|
| 코드 정확성 | 🔴 **FAIL** | VALID_SLUG_RE 숫자시작 슬러그 배제 버그 1건 |
| 사이드이펙트 | ✅ PASS | 기존 플로우 영향 없음 |
| 기존 코드 충돌 | ✅ PASS | IndexNow·specs-data 변경과 충돌 없음 |
| 제안서 B/C 정합성 | ✅ PASS | |
| node --check | ✅ PASS | 전 7파일 문법 오류 없음 |

---

## 1. 코드 정확성

### 🔴 FAIL — `VALID_SLUG_RE`가 숫자로 시작하는 유효 슬러그를 제외

**파일**: `lib/cms/seo-exclude.js:25`
```js
const VALID_SLUG_RE = /^[a-z][a-z0-9-]{2,}$/;
```

**문제**: 정규식이 `[a-z]`로 시작하는 슬러그만 허용. 숫자로 시작하는 유효 슬러그 3건이 사이트맵에서 제외됨:

| 제외되는 슬러그 | 언어 | 유형 |
|----------------|------|------|
| `20-year-photographer-ai-id-photo-monkos-ai-birth` | JA | 리다이렉트 타겟 |
| `20-year-photographer-creates-id-photos-with-ai-monkos-ai` | KO | 리다이렉트 타겟 |
| `12-year-photo-studio-ai-id-photo-app` | KO | 리다이렉트 타겟 |

이 3건은 한글 슬러그→영문 슬러그 301 마이그레이션의 **도착지**. 사이트맵에서 빠지면 구글이 새 URL을 발견하지 못해 301 마이그레이션 효과가 상쇄됨.

**수정 제안**: `^[a-z]` → `^[a-z0-9]`로 변경하면 해결. 숫자만으로 된 정크 슬러그(예: `3`, `5-10`)는 길이 조건(`{2,}`)과 `isWeakSlug`에서 이미 걸러짐.
```js
const VALID_SLUG_RE = /^[a-z0-9][a-z0-9-]{2,}$/;
```

### ✅ PASS — `isWeakSlug()` 판정 로직

| 입력 | 결과 | 정상 여부 |
|------|------|----------|
| `5-10` | weak | ✅ 숫자잔해 |
| `14-vs` | weak | ✅ 영문자 2자 미만 |
| `ai` | weak | ✅ 4자 미만 |
| `3` | weak | ✅ 4자 미만 |
| `vol23-qa-5` | OK | ✅ 기존 유효 슬러그 |
| `ai-id` | OK | ✅ 영문자 4자 |

false positive 없음. 판정 로직 정상.

### ✅ PASS — `isIndexableBlogUrl()` 전체 흐름 (VALID_SLUG_RE 제외)

4단계 필터 체인:
1. VALID_SLUG_RE → 정크 슬러그 걸러냄 (단, 숫자시작 버그 있음 — 위 참조)
2. NOINDEX_SLUGS → `claude-max-20x-2-month-real-usage-review` 1건만 유효 체크 (한글 슬러그는 1단계에서 이미 걸림)
3. SITEMAP_EXCLUDE_SLUGS → `ai-photo-retouch-natural-vol51` 1건 (404 확정분)
4. BLOG_REDIRECT_SOURCE_PATHS → vol23-qa-5 등 13건의 영문 리다이렉트 소스 유효 체크 (한글 경로 35건은 URL 인코딩 불일치로 사실상 미도달 — 1단계에서 이미 걸림)

### ✅ PASS — 410 경로 대상

```js
/^\/(monk_studio|ai_lab|Academy|b2b|debate)(\/|$)/
```

- `/monk_studio`, `/ai_lab`, `/Academy`, `/b2b`, `/debate` — 전부 레거시 monk.kr 전용 경로
- monkos.ai 라이브 라우트(`/`, `/blog`, `/specs`, `/admin`, `/api`, `/ja`, `/en`)와 중복 없음 ✅
- GET 요청에만 적용 ✅
- 정규식 `(\/|$)` — 슬래시 이후 또는 정확 매치만 허용, `/b2b-something` 같은 부분 매치 차단 ✅

### ✅ PASS — `redirects.js` 추출 (DRY)

server.js 인라인 맵 48건 → redirects.js 48건. 1:1 일치 확인.
`server.js`에서 `const blogRedirects = BLOG_REDIRECTS;`로 참조 전환 정상.

---

## 2. 사이드이펙트

### ✅ PASS — blog.js 발행 플로우

변경 범위: `handleBlogCreate`의 slug 판정 조건에 `isWeakSlug()` 추가.
기존 발행 로직(`handleBlogUpdate`, `handleBlogDelete`) 미변경. 새 글 작성 시에만 약한 슬러그를 AI 재생성으로 우회 — 기존 글에 영향 없음.

### ✅ PASS — render-sitemap.js specs/static 무영향

`isIndexableBlogUrl` 필터는 `renderSitemapBlog` 함수 내에서만 호출. `renderSitemapSpecs`, `renderSitemapStatic`, `renderSitemap(인덱스)` 함수는 미변경.

### ✅ PASS — server.js 410 경로

410 핸들러는 다른 라우트 핸들러보다 **앞**에 위치하지만, 301 리다이렉트(`blogRedirects`)보다 **뒤**에 위치. 현재 사용 중인 라우트와 중복 없음.

### ✅ PASS — blog-editor.js

```js
e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
```
`input` 이벤트 핸들러 — 사용자가 슬러그 필드에 타이핑할 때만 동작. 프로그래밍 방식 `.value` 설정(기존 글 로딩)에서는 트리거되지 않음. 기존 한글 슬러그 글의 편집에 영향 없음.

---

## 3. 기존 코드와 충돌

### ✅ PASS — IndexNow (막내2)

`notifySearchEngines`는 `blog.js:178, 260`에서 호출. 민아 변경은 `blog.js:130` 부근(slug 판정). 서로 다른 코드 영역, 충돌 없음.

### ✅ PASS — specs-data.json (막내1)

`render-sitemap.js` 변경은 blog sitemap 생성에만 적용. specs sitemap 로직(`renderSitemapSpecs`)은 미변경.

---

## 4. 제안서 B/C 항목 검토

### ✅ PASS — B1(정크 슬러그 31개) ↔ A1(사이트맵 제외) 정합성

31개 정크 슬러그 중 대부분은 한글 슬러그 또는 숫자잔해 → `VALID_SLUG_RE`에서 자동 필터. 영문이면서 라우트 404인 1건은 `SITEMAP_EXCLUDE_SLUGS`에 명시. 정합적.

### ✅ PASS — A3(410) 크로스도메인 301 고려

410 대상 경로(`/monk_studio` 등)는 monkos.ai에 대체 콘텐츠 없음. monk.kr → monkos.ai 이전 시 이 경로들은 의도적으로 폐기된 것. 410 Gone이 적절.

---

## 5. node --check

| 파일 | 결과 |
|------|------|
| `lib/cms/slug.js` | ✅ OK |
| `lib/cms/seo-exclude.js` | ✅ OK |
| `lib/cms/redirects.js` | ✅ OK |
| `lib/cms/blog.js` | ✅ OK |
| `lib/cms/render-sitemap.js` | ✅ OK |
| `lib/cms/render-blog.js` | ✅ OK |
| `server.js` | ✅ OK |

---

## 발견 사항 요약

### 🔴 수정 필요 (1건)

| # | 파일 | 내용 | 심각도 |
|---|------|------|--------|
| **F1** | `seo-exclude.js:25` | `VALID_SLUG_RE = /^[a-z][a-z0-9-]{2,}$/` → 숫자시작 유효 슬러그 3건 사이트맵 제외. `^[a-z0-9]`로 수정 필요 | 🔴 301 마이그레이션 효과 상쇄 |

### 🟡 참고 (2건, 수정 불필수)

| # | 파일 | 내용 |
|---|------|------|
| **N1** | `seo-exclude.js` | `NOINDEX_SLUGS`의 한글 슬러그(`claudemax-20x-2개월-실사용-후기`)는 `VALID_SLUG_RE`에서 먼저 걸려 도달 불가 — 기능상 무해하나 불필요한 엔트리 |
| **N2** | `render-sitemap.js` | `STATIC_LASTMOD = '2026-06-15'` 하드코딩 — 차후 실제 변경 시 수동 갱신 필요. 의도된 설계(lastmod 드리프트 방지)이므로 현 시점에서는 정상 |

---

**[2026-06-15 15:27 KST]** iMac/막내3 → 작가님
