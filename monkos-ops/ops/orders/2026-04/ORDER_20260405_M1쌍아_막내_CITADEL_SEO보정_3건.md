---
type: order
from: M1/쌍아
to: M1/막내
date: 2026-04-05 07:14 KST
priority: P0
subject: CITADEL SEO 기술 보정 3건 — JA/EN 메타 현지화 + Crop hreflang/H1 + Blog JSON-LD
tags: [portal, seo, citadel]
status: open
portfolio: PF_CITADEL
origin: M1/민아 SEO 진단 (ORDER_20260405_CITADEL_SEO보정_4건.md) → 쌍아 코드 검증 후 3건 확정
---

# 지시서: CITADEL SEO 기술 보정 3건

**[2026-04-05 07:14 KST] M1/쌍아 → M1/막내**

---

## 경위

민아 SEO 진단 4건 중 코드 검증 결과:
- 건 1~3: **확인됨** → 본 지시서로 하달
- 건 4 (이미지 alt): **이미 해결** — `home.js:102` 전체 gallery 이미지에 alt 존재. 제외

> 근거 보고서: `REPORT_20260405_M1민아_monkosai_애널리틱스_종합분석.md`

---

## 건 1: JA/EN 메인 메타 태그 현지화 [P0]

### 현상

`monkos_AI/portal/public/index.html` L15~39에 title/desc/canonical/og가 **한국어로 하드코딩**.
`monkos_AI/portal/lib/cms/home.js` `renderHome(req, res, forceLang)`이 콘텐츠만 교체하고 **메타 태그는 미교체**.

```
/ja/ 접속 시 → <title>MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진</title> (한국어)
/ja/ 접속 시 → <link rel="canonical" href="https://monkos.ai/"> (KO 메인)
```

→ 구글이 JA/EN을 **한국어 중복 콘텐츠**로 판정. 일본 시장 자연검색 구조적 차단.

### 작업

`home.js`의 `renderHome()` 함수 내에서, `forceLang` 분기로 메타 태그를 **치환**:

```javascript
// home.js renderHome() 내, html = getTemplate() 직후에 추가
const metaMap = {
  ko: {
    title: 'MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진',
    desc: 'AI 실시간 코칭으로 완벽한 증명사진을 촬영하세요. 여권, 비자, 이력서, 취업사진 지원. 고품질 AI 증명사진 생성.',
    ogTitle: 'MONKOS AI | AI 증명사진',
    ogDesc: 'AI 코치가 촬영을 실시간 가이드. 증명사진 · 여권사진 · 이력서사진 촬영.',
    canonical: 'https://monkos.ai/',
    locale: 'ko_KR',
    htmlLang: 'ko'
  },
  ja: {
    title: 'MONKOS AI | AI証明写真 · パスポート写真 · 履歴書写真',
    desc: 'AIリアルタイムコーチングで完璧な証明写真を撮影。パスポート、ビザ、履歴書対応。高品質AI証明写真生成。',
    ogTitle: 'MONKOS AI | AI証明写真',
    ogDesc: 'AIコーチがリアルタイムガイド。証明写真・パスポート写真・履歴書写真の撮影。',
    canonical: 'https://monkos.ai/ja/',
    locale: 'ja_JP',
    htmlLang: 'ja'
  },
  en: {
    title: 'MONKOS AI | AI ID Photos · Passport Photos · Resume Photos',
    desc: 'Capture perfect ID photos with AI real-time coaching. Passport, visa, resume photos supported. High-quality AI photo generation.',
    ogTitle: 'MONKOS AI | AI ID Photos',
    ogDesc: 'AI coach guides your photo session in real time. ID · Passport · Resume photos.',
    canonical: 'https://monkos.ai/en/',
    locale: 'en_US',
    htmlLang: 'en'
  }
};
const m = metaMap[lang] || metaMap.ko;

// 치환
html = html.replace(/<html lang="ko">/, `<html lang="${m.htmlLang}">`);
html = html.replace(/<title>[^<]+<\/title>/, `<title>${m.title}</title>`);
html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${m.desc}">`);
html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${m.ogTitle}">`);
html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${m.ogDesc}">`);
html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${m.canonical}">`);
html = html.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${m.locale}">`);
html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${m.canonical}">`);
html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${m.ogTitle}">`);
html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${m.ogDesc}">`);
```

### 삽입 위치

`home.js` `renderHome()` 함수 내, `let html = getTemplate();` 직후 (L72 이후), gallery 치환 전.

### 검증

- `/ja/` 접속 → title이 일본어, canonical이 `/ja/`
- `/en/` 접속 → title이 영어, canonical이 `/en/`
- `/` 접속 → 기존 한국어 유지 (변경 없음)

---

## 건 2: Crop 페이지 hreflang + H1 추가 [P1]

### 현상

`monkos_AI/portal/public/crop/index.html`:
- hreflang 태그: **0개** (L1~33 헤드 영역에 없음)
- H1 태그: **없음** (L41 `<span class="header-title">` 사용)

### 작업

**2-a. hreflang 추가** — `crop/index.html` `<head>` 내, canonical 다음 (L25 이후):

```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/crop">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/crop">
```

> JA/EN 크롭 페이지 미존재 → ko + x-default만. 향후 다국어 크롭 생성 시 추가.

**2-b. H1 추가** — L41 변경:

```html
<!-- 변경 전 -->
<span class="header-title">MONKOS Crop</span>

<!-- 변경 후 -->
<h1 class="header-title">증명사진 무료 크롭 — ICAO 규격 자동 맞춤</h1>
```

> CSS `.header-title` 스타일에 기존 span과 동일하게 `margin: 0; font-size: inherit;` 추가 필요시 보정.

### 검증

- `/crop` 접속 → hreflang 2개 존재 확인
- H1 시각적으로 기존과 동일 + DOM에서 `<h1>` 확인

---

## 건 3: Blog 목록 페이지 JSON-LD 추가 [P1]

### 현상

`monkos_AI/portal/lib/cms/render.js` `blogListFragment()` (L354):
```javascript
return { ..., pageScript: null };  // ← JSON-LD 없음
```

개별 포스트는 Article JSON-LD 있음 (L424~454). 허브만 누락.

### 작업

`render.js` `blogListFragment()` 리턴 직전, `pageScript`에 JSON-LD 주입:

```javascript
const blogJsonLd = `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": meta.title,
  "description": meta.description,
  "url": canonicalUrl,
  "publisher": {
    "@type": "Organization",
    "name": "Monk Studio",
    "url": "https://monkos.ai",
    "logo": { "@type": "ImageObject", "url": "https://monkos.ai/monkos-icon-1024.png" }
  }
})}
</script>`;
```

- `canonicalUrl` 변수가 이미 있는지 확인 → 없으면 `const canonicalUrl = lang ? \`https://monkos.ai/${lang}/blog\` : 'https://monkos.ai/blog';` 추가
- 리턴의 `pageScript: null` → `pageScript: blogJsonLd`

### 검증

- `/blog` 접속 → 소스에서 `application/ld+json` + `"@type": "Blog"` 확인
- `/ja/blog` 접속 → 일본어 meta.title 반영 확인

---

## 작업 순서

1. **건 1** 먼저 (P0, 일본 시장 차단 해소)
2. **건 2** (Crop hreflang + H1)
3. **건 3** (Blog JSON-LD)

## 배포

⚠️ **monkos.ai 도메인은 `monkos-portal` 서비스에 연결** (막내1 04/05 보고 확인)

```bash
cd monkos_AI/portal
gcloud run deploy monkos-portal \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated
```

> `portal` 서비스가 아닌 `monkos-portal` 대상. 향후 모든 포탈 배포 동일.

## 커밋 규칙

- 건별 개별 커밋: `[seo] CITADEL 건N: {내용 요약}`
- 3건 완료 후 1회 배포 (`monkos-portal`)
- 배포 후 GSC URL 검사 실행

## ⚠️ 준수 조항

- `index.html`의 KO 메타 원본은 **수정하지 않음** (SSR 치환 방식이므로 원본 유지)
- `crop/index.html` H1 스타일 깨짐 발생 시 CSS 보정 포함
- 완료 보고 `✅❌💡⏳📁🔀` 형식
