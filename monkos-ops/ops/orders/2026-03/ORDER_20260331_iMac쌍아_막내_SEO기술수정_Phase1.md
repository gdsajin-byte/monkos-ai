---
type: order
from: iMac/쌍아
to: 막내
date: 2026-03-31
priority: 🟠 P1
subject: monkos.ai 블로그 SEO 기술 수정 Phase 1 — render.js 4건
related: REPORT_20260331_민아_SEO진단및개선제안서.md
---

# 지시서: 블로그 SEO 기술 수정 Phase 1

**[2026-03-31 12:03 KST] iMac/쌍아 → 막내**

---

## 배경

민아 SEO 진단 결과, 비브랜드 오가닉 클릭 3개월간 0건.
기술 감사에서 SSR 렌더링 엔진(`render.js`)에 SEO 감점 요인 4건 발견.
전부 `monkos_AI/portal/lib/cms/render.js` 단일 파일 수정.

---

## 작업 1: 마크다운 콘텐츠 내 H1 → H2 다운그레이드

### 현상

- 라인 498: `<h1>${escapeHtml(post.title)}</h1>` — 페이지 제목 H1
- 라인 383: `const contentHtml = marked(post.content || '')` — 마크다운 변환
- 콘텐츠 내 `# 제목`이 `<h1>`으로 변환되면 **페이지에 H1이 2개** → Google SEO 감점

### 수정

`marked` 렌더러를 커스터마이즈하여 콘텐츠 내 heading을 1단계씩 다운그레이드.

```javascript
// render.js 상단 (import 직후, blogCollection 선언 부근)

// SEO: 블로그 콘텐츠 내 heading 다운그레이드 (페이지 H1과 중복 방지)
const blogRenderer = new marked.Renderer();
blogRenderer.heading = function({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  // H1→H2, H2→H3, ... (최대 H6)
  const level = Math.min(depth + 1, 6);
  return `<h${level}>${text}</h${level}>`;
};
```

라인 383 수정:
```javascript
// 변경 전
const contentHtml = marked(post.content || '');

// 변경 후
const contentHtml = marked(post.content || '', { renderer: blogRenderer });
```

### 검증

- 마크다운 `# 제목` → `<h2>` 출력 확인
- 마크다운 `## 소제목` → `<h3>` 출력 확인
- 페이지 소스에서 `<h1>` 검색 시 1개만 존재

---

## 작업 2: 블로그 리스트 meta description 한국어화 + 다국어 분기

### 현상

라인 340:
```javascript
return { title: 'Blog | MONKOS AI', description: 'AI ID Photo tips, guides, and news', ... };
```

한국어 검색에서 영문 description → 관련성 점수 하락.

### 수정

라인 340 영역에서 `lang` 변수 활용하여 분기:

```javascript
// 다국어 블로그 리스트 메타
const listMeta = {
  ko: { title: 'AI 증명사진 블로그 | MONKOS AI', description: 'AI 증명사진 팁, 가이드, 최신 뉴스 | MONKOS AI 블로그' },
  ja: { title: 'AI証明写真ブログ | MONKOS AI', description: 'AI証明写真のヒント、ガイド、最新ニュース | MONKOS AI ブログ' },
  en: { title: 'AI ID Photo Blog | MONKOS AI', description: 'AI ID Photo tips, guides, and news | MONKOS AI Blog' },
};
const meta = listMeta[htmlLang] || listMeta.ko;

return { title: meta.title, description: meta.description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript: null };
```

**참고**: `htmlLang` 변수는 같은 함수(`blogListFragment`) 내 상단에서 이미 결정되고 있음. 해당 변수를 활용할 것.

### 검증

- `/blog` → `<meta name="description" content="AI 증명사진 팁...">`
- `/ja/blog` → 일본어 description
- `/en/blog` → 영문 description

---

## 작업 3: `<article>` 시맨틱 태그 도입

### 현상

라인 495~516: 포스트 본문이 `<div>` 구조. `<article>` 태그 없음.
Schema.org JSON-LD에 `"@type": "Article"` 선언했으나 DOM에 대응하는 시맨틱 태그 부재.

### 수정

라인 495~516 영역의 `bodyContent`를 `<article>` 태그로 감싸기:

```javascript
// 변경 전
const bodyContent = `
  <a href="${backLink}" class="post-back">&larr; Back to Blog</a>
  <div class="post-header">
    <h1>${escapeHtml(post.title)}</h1>
    ...
  </div>
  ...
  <div class="post-content">${contentHtml}</div>
  <div class="share-buttons">...</div>`;

// 변경 후
const bodyContent = `
  <a href="${backLink}" class="post-back">&larr; Back to Blog</a>
  <article>
    <div class="post-header">
      <h1>${escapeHtml(post.title)}</h1>
      ...
    </div>
    ...
    <div class="post-content">${contentHtml}</div>
  </article>
  <div class="share-buttons">...</div>`;
```

**핵심**: `<article>` 안에 post-header + post-thumb + post-content 포함. share-buttons는 article 바깥 유지.

### 검증

- 페이지 소스에서 `<article>` 태그 존재 확인
- `document.querySelector('article').textContent.length > 0` 확인
- Schema.org Article 스키마와 DOM 정합

---

## 작업 4: "Back to Blog" 링크 다국어 분기

### 현상

라인 496: `<a href="${backLink}" class="post-back">&larr; Back to Blog</a>`
한국어 페이지에서도 "Back to Blog" 영문 고정.

### 수정

```javascript
const backLabel = { ko: '블로그 목록으로', ja: 'ブログ一覧へ', en: 'Back to Blog' };
// bodyContent 내:
<a href="${backLink}" class="post-back">&larr; ${backLabel[htmlLang] || backLabel.ko}</a>
```

---

## 수정 범위 요약

| # | 파일 | 라인 영역 | 내용 |
|---|------|----------|------|
| 1 | render.js | 9~16 (상단) + 383 | marked 렌더러 H1 다운그레이드 |
| 2 | render.js | 340 | 블로그 리스트 meta 다국어화 |
| 3 | render.js | 495~516 | article 시맨틱 태그 |
| 4 | render.js | 496 | Back to Blog 다국어 |

**수정 파일 1개, 영향 범위 블로그 SSR 전체.**

---

## ⚠️ 준수 조항

- 기존 layoutShell / fragment 인터페이스 변경 금지 (라인 6~7 주석 참조)
- 다국어 처리 시 `htmlLang` 변수 활용 (함수 내 기존 값)
- CSS 추가/변경 불필요 (article 태그는 기본 block)
- 배포는 하지 말 것 — 수정 완료 후 보고만

## 완료 기준

- [ ] H1 다운그레이드 렌더러 적용
- [ ] 블로그 리스트 meta description 한국어/일어/영어 분기
- [ ] article 시맨틱 태그 적용
- [ ] Back to Blog 다국어
- [ ] 로컬 테스트 — 수정 전후 HTML diff 확인
- [ ] 완료 보고 (`✅❌💡⏳📁🔀`)
