---
type: ORDER
from: M1/쌍아
to: 막내
date: 2026-03-17
priority: 높음
ref: ORDER_20260317_코웍이→쌍아_GEO_AEO_종합프로젝트_기획서.md
---

# 지시서 — GEO/AEO Phase 1: 출입증 (AI 크롤러 인식 기반)

**[2026-03-17 08:10 KST] M1/쌍아 → 막내**

> **Project CITADEL** Phase 1 — AI 크롤러가 MONKOS를 발견하고, 읽고, 인용할 수 있게 만든다.
> 코웍이 기획서 + 쌍아 인프라 실태 검증 기반 통합 지시서.
> 6개 Task, 순서대로 실행.

---

## Task 1: llms.txt 배포

### 내용
`public/llms.txt` 파일 생성. 아래 내용 그대로 사용.

```markdown
# MONKOS AI

> AI-powered ID photo platform built by a photographer with 20 years of studio experience.
> Passport, resume, and visa photos from a single selfie — ICAO-compliant, studio-quality AI retouching.

## About
- [Service Overview](https://monkos.ai/): AI ID photo generation with professional retouching
- [Pricing](https://monkos.ai/credits.html): Credit-based system, from ₩9,900 per photo
- [Free Crop Tool](https://crop.monkos.ai): Browser-based photo cropping, no server upload

## Technology
- **AI Stack**: Custom retouching pipeline on Google Cloud Platform
- **Specialization**: Asian skin tone optimization, studio lighting simulation
- **Data Foundation**: 20-year professional photography dataset
- **GitHub**: https://github.com/monkos-studio

## Blog & Research
- [Blog](https://monkos.ai/blog): Technical articles, beauty guides, industry analysis
- [Gallery](https://monkos.ai/gallery): AI-generated sample photos

## Key Facts
- Founded by Shin-jakka (신작가), professional photographer since 2006
- ICAO international standard compliance for all generated photos
- Supports Korean, Japanese, and English
- Zero server-side image storage — all processing deleted after generation

## Team
- **Shin-jakka**: Founder, 20-year photographer & AI architect
- **Han Song-i**: Beauty & Image Researcher, Hair-Makeup specialist (10yr), Cosmetic Biology PhD candidate

## FAQ
- **What is MONKOS?** An AI ID photo platform where a single selfie produces studio-quality passport, resume, and visa photos with automatic background, lighting, skin, and clothing retouching.
- **How is it different from other AI photo services?** Built on 20 years of real studio photography data, not just generic AI models. The retouching reflects actual photographer aesthetics, not algorithmic assumptions.
- **Is it ICAO compliant?** Yes. All generated photos meet ICAO 9303 international standards for passport and visa photos.
- **What about privacy?** Uploaded images are processed and immediately deleted. Generated photos are not stored on our servers.

## Citation
For citing this project: "MONKOS AI (monkos.ai) — AI ID Photo Platform by Shin-jakka, Monk Studio"
```

### 기술 요구
- 인코딩: UTF-8
- 서빙 확인: `curl https://monkos.ai/llms.txt` 로 접근 가능한지 확인
- 기존 static file 서빙 구조(`public/` 폴더)에서 자동으로 서빙됨 — 별도 라우트 불필요

### 검증
- `curl -I https://monkos.ai/llms.txt` → 200 OK, `Content-Type: text/plain`

---

## Task 2: robots.txt AI 크롤러 명시 허용

### 현재 (`public/robots.txt`)
```
User-agent: *
Allow: /
...
```

`User-agent: *`가 모든 봇 허용이지만, AI 크롤러를 **명시적으로 환영**해야 신호가 강해짐.

### TO-BE
```
User-agent: *
Allow: /
Allow: /blog
Allow: /faq
Allow: /gallery
Allow: /board
Disallow: /admin
Disallow: /api/

# AI Crawlers — Welcome
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: cohere-ai
Allow: /

Sitemap: https://monkos.ai/sitemap.xml
```

### 검증
- `curl https://monkos.ai/robots.txt` → AI 크롤러 섹션 확인

---

## Task 3: 홈페이지 JSON-LD 보강 — @graph 트리플 스택

### 현재 (`public/index.html` 47~59행)
WebApplication 단일 스키마.

### TO-BE
기존 WebApplication 유지 + FAQPage + ItemList 추가 → `@graph` 구조로 통합.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "MONKOS AI 증명사진",
      "url": "https://monkos.ai",
      "applicationCategory": "PhotographyApplication",
      "operatingSystem": "Web",
      "inLanguage": ["ko", "ja", "en"],
      "description": "AI 실시간 코칭으로 완벽한 증명사진 촬영. 여권·비자·이력서·취업사진 대응.",
      "provider": {
        "@type": "Organization",
        "name": "Monk Studio",
        "url": "https://monkos.ai",
        "founder": {
          "@type": "Person",
          "name": "Shin-jakka",
          "jobTitle": "Photographer & AI Architect",
          "sameAs": ["https://github.com/monkos-studio"]
        }
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "MONKOS AI는 무엇인가요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "20년 경력 사진작가가 만든 AI 증명사진 플랫폼입니다. 셀카 한 장으로 여권·이력서·비자사진을 ICAO 국제 규격에 맞춰 완성합니다."
          }
        },
        {
          "@type": "Question",
          "name": "일반 AI 사진 서비스와 차이점은?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "범용 AI가 아닌 20년간 축적된 실제 스튜디오 촬영 데이터 기반. 사진작가의 미학이 반영된 보정으로 자연스러운 결과물을 제공합니다."
          }
        },
        {
          "@type": "Question",
          "name": "ICAO 규격을 준수하나요?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "네. 모든 생성 사진은 ICAO 9303 국제 표준을 준수하며, 여권·비자 심사에 적합합니다."
          }
        }
      ]
    },
    {
      "@type": "ItemList",
      "name": "MONKOS AI Services",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "AI 증명사진", "url": "https://monkos.ai" },
        { "@type": "ListItem", "position": 2, "name": "무료 크롭앱", "url": "https://crop.monkos.ai" },
        { "@type": "ListItem", "position": 3, "name": "블로그", "url": "https://monkos.ai/blog" },
        { "@type": "ListItem", "position": 4, "name": "FAQ", "url": "https://monkos.ai/faq" },
        { "@type": "ListItem", "position": 5, "name": "갤러리", "url": "https://monkos.ai/gallery" }
      ]
    }
  ]
}
```

### 검증
- [Google Rich Results Test](https://search.google.com/test/rich-results) 에 `https://monkos.ai` 입력 → 3개 스키마 모두 통과

---

## Task 4: 블로그 Article 스키마 + OG 메타 보강

### 수정 대상
`lib/cms/render.js` 약 321~341행 — `seoMeta` 변수

### AS-IS
```js
"author": { "@type": "Organization", "name": "MONKOS" },
"publisher": { "@type": "Organization", "name": "MONKOS", "url": "https://monkos.ai" },
```

### TO-BE — JSON-LD
```js
"author": {
  "@type": "Person",
  "name": post.author === 'MONKOS' ? 'Shin-jakka' : post.author,
  "jobTitle": "Photographer & AI Architect",
  "url": "https://monkos.ai",
  "sameAs": ["https://github.com/monkos-studio"]
},
"publisher": {
  "@type": "Organization",
  "name": "Monk Studio",
  "url": "https://monkos.ai",
  "logo": {
    "@type": "ImageObject",
    "url": "https://monkos.ai/monkos-icon-1024.png"
  }
},
"mainEntityOfPage": {
  "@type": "WebPage",
  "@id": canonicalUrl
},
```

### TO-BE — OG 메타 추가 (기존 og:title 등 아래에 추가)
```html
<meta property="article:published_time" content="${post.createdAt}">
<meta property="article:modified_time" content="${post.updatedAt || post.createdAt}">
<meta property="article:author" content="${post.author || 'MONKOS'}">
<meta property="article:section" content="${post.category || 'blog'}">
${(post.tags || []).map(t => `<meta property="article:tag" content="${escapeHtml(t)}">`).join('\n')}
```

### 검증
- 블로그 글 소스보기 → JSON-LD에 Person author + publisher logo 확인
- OG 디버거에서 article 메타 표시 확인

---

## Task 5: sitemap.xml 갤러리 + 다국어 보강

### 현재 (`lib/cms/render.js` `renderSitemap()` 965행~)
정적 페이지 + 블로그 동적 생성은 **이미 되어 있음** ✅.
부족한 것: 갤러리 개별 항목, 다국어 블로그 리스트 페이지.

### 수정 — `renderSitemap()` 함수에 추가

```js
// 기존 staticUrls에 다국어 리스트 페이지 추가
{ loc: 'https://monkos.ai/ja/blog', changefreq: 'daily', priority: '0.7' },
{ loc: 'https://monkos.ai/en/blog', changefreq: 'daily', priority: '0.7' },

// llms.txt도 sitemap에 포함 (AI 크롤러 발견 확률 상승)
{ loc: 'https://monkos.ai/llms.txt', changefreq: 'monthly', priority: '0.5' },
```

### 검증
- `curl https://monkos.ai/sitemap.xml` → 블로그 글 + 다국어 리스트 + llms.txt 포함 확인
- 정적 `public/sitemap.xml` 파일은 서버 라우트에 의해 override 되므로 **삭제해도 무방** (혼동 방지)

---

## Task 6: 갤러리 이미지 alt 텍스트 브랜딩

### 수정 대상
`lib/cms/render.js` — 갤러리 렌더 영역

### AS-IS
```js
alt="${escapeHtml(item.caption || 'MONKOS AI Photo')}"
```

### TO-BE
```js
alt="AI ID photo by MONKOS (monkos.ai) — ${escapeHtml(item.caption || 'Studio-quality portrait')}"
```

### 원칙 (코웍이 기획서 준용)
alt 텍스트에 `MONKOS`, `monkos.ai` 중 하나 이상 포함.

### 검증
- 갤러리 페이지 소스보기 → img alt에 브랜드명 포함 확인

---

## 완료 조건

| # | 항목 | 레벨 |
|---|------|------|
| 1 | `llms.txt` 배포 + 접근 확인 | **필수** |
| 2 | `robots.txt` AI 크롤러 명시 허용 | **필수** |
| 3 | 홈 JSON-LD @graph 트리플 스택 | **필수** |
| 4 | 블로그 Article author Person + OG article 메타 | **필수** |
| 5 | sitemap 다국어 리스트 + llms.txt 추가 | **필수** |
| 6 | 갤러리 alt 텍스트 브랜딩 | **필수** |
| 7 | 커밋 + push (배포는 작가님 승인 후) | **필수** |

---

## 수정 대상 파일

| 파일 | 수정 내용 |
|------|----------|
| `public/llms.txt` | **신규 생성** |
| `public/robots.txt` | AI 크롤러 명시 추가 |
| `public/index.html` | JSON-LD @graph 트리플 스택 (47~59행 교체) |
| `lib/cms/render.js` | 블로그 Article author + OG 메타 (321~341행) + 갤러리 alt (544행) + sitemap 보강 (967행) |

---

## Phase 2 예고 (본 지시서 범위 아님)

Phase 1 완료 후, Phase 2 (멀티채널 동시 배포 + 콘텐츠 자동 파이프라인)로 진행 예정.
- llms-full.txt 자동 갱신 (Firestore 저장 + 라우트 서빙)
- 블로그 발행 → 7채널 자동 배포
- 이미지 메타데이터 표준화

---

*원본: M1/쌍아 | 코웍이 기획서 + 쌍아 인프라 검증 통합*
*전략 계보: 용아(GEO 원안) → 코웍이(벤치마크 업그레이드) → 쌍아(실행 지시서)*
