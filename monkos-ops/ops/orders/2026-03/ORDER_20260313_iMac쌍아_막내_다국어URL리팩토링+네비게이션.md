---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내
project: portal
priority: high
---

# 지시서: 다국어 URL 리팩토링 + 최소 네비게이션

> 블로그 다국어 URL 패턴을 국제 SEO 표준으로 전환하고, 포털 메인에서 콘텐츠 접근 경로를 확보한다.

## 배경

- 현재: `/blog/my-article-ja` (접미사 방식)
- 변경: `/ja/blog/my-article` (언어 접두사 방식) — 구글 국제 SEO 가이드라인 부합
- Firestore doc ID는 기존 유지 (`slug-ja`, `slug-en`) — 내부 저장은 건드리지 않음
- URL 라우팅만 변경하여 외부 노출 패턴을 개선

## 작업 범위

### 1. server.js — 라우트 추가

SSR 라우트 섹션 (현재 194행 부근)에 다국어 라우트 추가:

```
// 다국어 블로그 라우트 (언어 접두사)
GET /ja/blog       → renderBlogList (lang=ja 자동 필터)
GET /ja/blog/:slug → renderBlogPost (lang=ja, Firestore doc ID: slug-ja)
GET /en/blog       → renderBlogList (lang=en 자동 필터)
GET /en/blog/:slug → renderBlogPost (lang=en, Firestore doc ID: slug-en)

// 기존 라우트 유지 (한국어 = 기본, 접두사 없음)
GET /blog          → renderBlogList (기존 그대로)
GET /blog/:slug    → renderBlogPost (기존 그대로)
```

**구현 방법**: render 함수에 lang 파라미터를 넘기는 방식. 예:
```js
// /ja/blog, /en/blog
if (urlPath === '/ja/blog' && req.method === 'GET') return renderBlogList(req, res, 'ja');
if (urlPath === '/en/blog' && req.method === 'GET') return renderBlogList(req, res, 'en');
if (urlPath?.startsWith('/ja/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'ja');
if (urlPath?.startsWith('/en/blog/') && req.method === 'GET') return renderBlogPost(req, res, 'en');
```

**순서 중요**: 다국어 라우트를 기존 `/blog` 라우트 **앞에** 배치 (prefix 매칭 충돌 방지)

### 2. render.js — renderBlogList 수정

`renderBlogList(req, res, forceLang = null)` 시그니처 변경:

- `forceLang`이 있으면 해당 lang으로 자동 필터 (쿼리파라미터 무시)
- 블로그 카드 링크: lang에 따라 URL 생성
  - `ko` 또는 기본: `/blog/${baseSlug}` (baseSlug = originalSlug || slug)
  - `ja`: `/ja/blog/${baseSlug}` (baseSlug = slug에서 `-ja` 제거)
  - `en`: `/en/blog/${baseSlug}` (baseSlug = slug에서 `-en` 제거)
- 언어 필터 링크 업데이트:
  - All: `/blog`
  - KO: `/blog` (또는 `/blog?lang=ko`)
  - JA: `/ja/blog`
  - EN: `/en/blog`
- canonical URL: `https://monkos.ai/ja/blog` 등
- `<html lang="ko">` → forceLang에 따라 `<html lang="ja">` 등 동적

### 3. render.js — renderBlogPost 수정

`renderBlogPost(req, res, lang = null)` 시그니처 변경:

- slug 추출 로직:
  - `lang === 'ja'`: URL에서 `/ja/blog/` 이후 부분 추출 → Firestore doc ID = `${slug}-ja`
  - `lang === 'en'`: URL에서 `/en/blog/` 이후 부분 추출 → Firestore doc ID = `${slug}-en`
  - `lang === null`: 기존 로직 (`/blog/` 이후 추출, doc ID = slug 그대로)
- hreflang 태그 업데이트:
  ```html
  <link rel="alternate" hreflang="ko" href="https://monkos.ai/blog/${baseSlug}">
  <link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog/${baseSlug}">
  <link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog/${baseSlug}">
  ```
- canonical URL: `https://monkos.ai/ja/blog/${baseSlug}` 등
- "Back to Blog" 링크: lang에 따라 `/ja/blog`, `/en/blog`, `/blog`
- `<html lang>` 동적

### 4. render.js — renderSitemap 수정

블로그 URL 생성 부분:
```js
// 기존: `https://monkos.ai/blog/${doc.id}`
// 변경: lang에 따라 접두사
const lang = data.lang || 'ko';
const baseSlug = data.originalSlug || doc.id.replace(/-(?:ja|en)$/, '');
const prefix = lang === 'ko' ? '' : `/${lang}`;
const loc = `https://monkos.ai${prefix}/blog/${baseSlug}`;
```

### 5. 포털 메인 (index.html) — 최소 네비게이션

메인 페이지 하단(또는 사이드)에 콘텐츠 섹션 링크 추가. 과하게 디자인하지 말 것 — 경로만 확보:

```html
<!-- 푸터 위 또는 사이드에 간단한 링크 섹션 -->
<div class="content-links">
  <a href="/blog">Blog</a>
  <a href="/faq">FAQ</a>
  <a href="/gallery">Gallery</a>
  <a href="/board">Board</a>
</div>
```

기존 디자인 톤에 맞춰 최소한으로. 눈에 띄되 메인 기능(AI 증명사진)을 방해하지 않는 위치.

### 6. SSR 테마 — 라이트 테마 동기화

현재 render.js의 SSR 페이지는 **다크 테마** (`:root { --bg: #0a0a1a; ... }`)
어드민은 이미 라이트로 전환했으나, **SSR 공개 페이지는 다크 유지** (의도적 — 메인 포털과 톤 일치)

→ **SSR 테마는 건드리지 말 것**

## ⚠️ 준수 조항

- **헌법 6조** (인프라 보호): `.env`, `deploy.sh` 수정 금지 (이번 작업에 해당 없음)
- **헌법 8조** (파괴적 명령 금지): 기존 라우트 삭제 금지 — 추가만
- **법률 2장** (코딩 규칙): 기존 코드 패턴 준수 (render.js 스타일 유지)

## 검증

1. 기존 URL 작동 확인: `/blog`, `/blog/:slug` (한국어)
2. 신규 URL 작동 확인: `/ja/blog`, `/ja/blog/:slug`, `/en/blog`, `/en/blog/:slug`
3. hreflang 태그가 올바른 URL을 가리키는지 확인
4. sitemap.xml에 다국어 URL 반영 확인
5. 메인 페이지에서 Blog/FAQ 등 링크 접근 가능 확인

## 커밋

```
[feat] 다국어 URL 리팩토링 (/ja/blog/slug) + 포털 네비게이션
```

## 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `portal/server.js` | 다국어 라우트 4개 추가 |
| `portal/lib/cms/render.js` | renderBlogList/Post/Sitemap 다국어 URL 대응 |
| `portal/public/index.html` | 콘텐츠 네비게이션 링크 추가 |

## 배포

- dev 우선 배포 → 검증 → prod 배포는 작가님 수동
