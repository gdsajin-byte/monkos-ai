---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 높음
---

# 지시서: SEO 보강 — GA 태그 + hreflang 완성 + 색인 자동등록

> **[2026-03-22 15:48 KST] iMac/쌍아 → 막내1**

## 대상 파일

- `monkos_AI/portal/lib/cms/render.js`
- `monkos_AI/portal/lib/cms/blog.js`

**다른 막내가 수정하는 파일(upload.js, translate.js, blog-editor.js, blog-edit.html)은 절대 건드리지 말 것.**

## 수정 1: GA 태그 SSR 전 페이지 주입

### render.js — layoutHead() 함수 (22행 부근)

현재 `<head>` 여는 부분에 GA 태그가 없음. 홈(index.html)에만 하드코딩되어 있고 SSR 페이지는 전부 누락.

`layoutHead()` 함수의 `<head>` 바로 다음에 추가:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-JPZWSJ3323"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-JPZWSJ3323');
  gtag('config', 'G-FKG0CPTC14');
</script>
```

이러면 블로그 목록, 블로그 상세, FAQ, 갤러리, 게시판, 가이드 — SSR 전 페이지에 GA가 붙음.

## 수정 2: 블로그 목록 hreflang 추가

### render.js — blogListFragment() (146행 부근)

현재 `/blog`, `/en/blog`, `/ja/blog`에 canonical만 있고 hreflang 없음.

seoMeta에 추가:

```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog">
```

## 수정 3: 블로그 포스트 hreflang 상호 연결

### render.js — blogPostFragment() (332행 부근)

현재 자기 자신만 hreflang 선언. 번역본으로의 연결 없음.

포스트 렌더링 시 Firestore에서 같은 `originalSlug`를 가진 포스트를 조회하여 hreflang 상호 연결:

```javascript
// 번역본 hreflang 조회
const hreflangs = [];
const baseSlug = post.originalSlug || slug;

// 원본
hreflangs.push(`<link rel="alternate" hreflang="${post.lang || 'ko'}" href="https://monkos.ai/${post.lang === 'ko' ? '' : post.lang + '/'}blog/${slug}">`);

// 번역본 조회
const siblings = await blogCollection.where('originalSlug', '==', baseSlug).get();
siblings.forEach(doc => {
  const d = doc.data();
  if (d.slug !== slug && d.published) {
    const langPrefix = d.lang === 'ko' ? '' : d.lang + '/';
    hreflangs.push(`<link rel="alternate" hreflang="${d.lang}" href="https://monkos.ai/${langPrefix}blog/${d.slug}">`);
  }
});

// 원본이 자기 자신이 아닌 경우 (번역본에서 원본 참조)
if (post.originalSlug && post.originalSlug !== slug) {
  const origDoc = await blogCollection.doc(post.originalSlug).get();
  if (origDoc.exists && origDoc.data().published) {
    const orig = origDoc.data();
    const langPrefix = orig.lang === 'ko' ? '' : orig.lang + '/';
    hreflangs.push(`<link rel="alternate" hreflang="${orig.lang}" href="https://monkos.ai/${langPrefix}blog/${orig.slug}">`);
  }
}

hreflangs.push(`<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/${baseSlug}">`);
```

이 hreflangs를 seoMeta에 합쳐서 `<head>`에 삽입.

## 수정 4: 홈페이지 hreflang EN 추가

### render.js 또는 home.js — 홈페이지 seoMeta

현재:
```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/">
<link rel="alternate" hreflang="ja" href="https://idphoto-jp.monkos.ai/">
```

추가:
```html
<link rel="alternate" hreflang="en" href="https://monkos.ai/">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/">
```

(EN 별도 도메인이 없으므로 본진과 동일 URL. x-default도 본진.)

**주의**: 이건 `public/index.html`에 하드코딩되어 있을 수 있음. home.js SSR에서 주입하는지 index.html에 있는지 확인 후 적절한 곳에서 수정.

## 수정 5: 색인 자동등록

### blog.js — 발행(published=true) 성공 후

POST(신규 발행)와 PUT(수정 발행) 성공 시, published가 true일 때:

```javascript
// Google 색인 등록 ping (간단 버전)
if (published) {
  try {
    await fetch(`https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml`);
    log(`[CMS] Google sitemap ping 완료: ${savedSlug}`);
  } catch (e) {
    log(`[CMS] Google sitemap ping 실패: ${e.message}`, 'WARN');
  }
}
```

Indexing API는 서비스 계정 토큰이 필요하므로 1차는 sitemap ping으로. 실패해도 발행 자체는 성공해야 함 (try-catch).

## 수정 6: summary 빈값 방지

### blog.js — 저장 로직

summary가 비어있으면 본문에서 자동 추출:

```javascript
if (!body.summary && body.content) {
  // 마크다운에서 이미지/제목 태그 제거 후 앞 160자
  body.summary = body.content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/^#+\s.*/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 160);
}
```

## 커밋

```bash
git add monkos_AI/portal/lib/cms/render.js monkos_AI/portal/lib/cms/blog.js
git commit -m "[seo] GA태그 SSR주입 + hreflang완성 + 색인ping + summary자동생성"
```

**배포는 막내3과 합류하여 1회만 실행. 단독 배포 금지.**

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- **render.js, blog.js만 수정. 다른 파일 절대 금지**
- index.html의 GA 태그는 중복 방지를 위해 제거하지 말 것 (SSR이 아닌 정적 서빙 경로도 있으므로)
