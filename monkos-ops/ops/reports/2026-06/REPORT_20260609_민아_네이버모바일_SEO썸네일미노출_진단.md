---
type: report
date: 2026-06-09
device: M1
agent: 민아
status: 마감
---

# 네이버 모바일 검색 — MONKOS 썸네일 미노출 진단 보고서

**[2026-06-09 12:40 KST] M1/민아 → 작가님**

---

## 1. 현상

- **검색어**: "ai증명사진" (네이버 모바일)
- **순위**: 22위 노출
- **문제**: 경쟁사(enhanz.io, 픽미 등) 전부 썸네일 이미지 표시. **MONKOS만 텍스트 전용.**
- 사이트링크(규격·블로그·FAQ·가격) 정상 노출 → 인덱싱 자체는 되어 있음

---

## 2. 원인 분석

### 🔴 1순위 — 네이버 Search Advisor 미등록 (결정적 원인)

| 항목 | MONKOS | enhanz.io (경쟁사) |
|------|--------|-------------------|
| `naver-site-verification` 메타태그 | ❌ 없음 | ✅ `5f32ea7dc490...` |
| 네이버 Analytics (wcs_do) | ❌ 없음 | ✅ 있음 |
| 사이트맵 네이버 제출 | ❌ 미제출 | ✅ 제출됨 |

**영향**: 네이버는 Search Advisor 미등록 사이트를 "미인증 외부 사이트"로 취급. 크롤러(Yeti)가 og:image를 가져오긴 하지만 썸네일 생성 우선순위가 현저히 낮다. **이것이 홈페이지에 og:image가 있는데도 썸네일이 안 뜨는 직접 원인.**

### 🟡 2순위 — twitter:image 누락 (홈페이지)

```html
<!-- index.html 현재 상태 (28~33행) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="MONKOS AI | AI 증명사진">
<meta name="twitter:description" content="...">
<meta property="og:image" content="https://monkos.ai/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<!-- ❌ twitter:image 태그 없음 -->
```

일부 크롤러는 `og:image` 실패 시 `twitter:image`를 폴백으로 사용. 두 태그 모두 있어야 커버리지가 완전하다.

### 🟡 3순위 — 서브페이지 og:image 전면 누락

| 페이지 유형 | og:title | og:description | og:image | 파일 위치 |
|------------|----------|---------------|----------|----------|
| **홈** (`/`) | ✅ | ✅ | ✅ `og-image.png` | `public/index.html:31` |
| **Specs 허브** (`/specs`) | ✅ | ✅ | ❌ **없음** | `lib/cms/render-specs.js:644` |
| **Specs 개별** (`/specs/korea-passport`) | ✅ | ✅ | ❌ **없음** | `lib/cms/render-specs.js:907` |
| **블로그** (`/blog/{slug}`) | ✅ | ✅ | ⚠️ 조건부 | `lib/cms/render-blog.js:286` |

- Specs: `render-specs.js` 644행, 907행에 `og:image` 태그 자체가 없음
- 블로그: `post.ogImage || post.thumbnail || ''` — ogImage/thumbnail 미설정 시 빈 문자열
- **롱테일 검색("여권사진 규격" 등)에서 specs 페이지가 노출될 때 썸네일 0%**

### 🟡 4순위 — 사이트맵 이미지 정보 부재

```javascript
// render-sitemap.js 현재 — image 네임스페이스 없음
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
// ❌ xmlns:image 미선언, <image:image> 태그 없음
```

1,084개 URL에 이미지 정보 제로. 네이버·구글 이미지 검색 노출 기회 상실.

### 🟢 5순위 — robots.txt Yeti 명시 없음 (기능상 문제 없음)

```
User-agent: *
Allow: /
```

와일드카드로 Yeti 접근 허용 중이라 차단은 아니지만, 명시적 환영 신호 없음. GPTBot·ClaudeBot 등은 명시 등록되어 있는 반면 네이버 크롤러만 빠져 있음.

---

## 3. MONKOS 기술 우위 (참고)

경쟁사 대비 이미 잘하고 있는 것:

- **JSON-LD 구조화 데이터 7종**: WebApplication, FAQPage, VideoObject, Organization, ProfessionalService, ItemList, WebSite — 경쟁사(enhanz: 0종, idcut: 0종) 대비 압도
- **hreflang 3개 언어** (ko/en/ja) 정상
- **사이트맵 1,084개 URL** 동적 생성 (블로그+specs 자동 반영)
- **llms.txt** + AI 크롤러 명시 허용 — GEO 대비 완료

---

## 4. 개선 방안 (우선순위순)

| 순위 | 작업 | 대상 파일 | 효과 | 난이도 |
|------|------|----------|------|--------|
| **P0** | 네이버 Search Advisor 등록 + 인증 메타태그 삽입 | `index.html` + 네이버 웹마스터 | 썸네일 노출 직결. 사이트맵 제출·재크롤 요청 가능 | ⭐ |
| **P1** | 홈 `twitter:image` 추가 | `index.html` | 폴백 커버리지 확보 | ⭐ |
| **P2** | Specs 허브+개별 `og:image` 추가 | `render-specs.js` (644행, 907행) | 롱테일 검색 썸네일 | ⭐⭐ |
| **P3** | 블로그 `og:image` 폴백 보강 + `twitter:image` | `render-blog.js` (286행) | 빈 문자열 방지 | ⭐ |
| **P4** | 사이트맵 `image:image` 추가 | `render-sitemap.js` | 이미지 검색 노출 + 썸네일 후보 | ⭐⭐ |
| **P5** | robots.txt에 Yeti 명시 | `public/robots.txt` | 명시적 환영 신호 | ⭐ |
| **P6** | 네이버 Analytics 설치 | `index.html` + 서브페이지 | 네이버 유입 추적 | ⭐ |

---

## 5. 예상 타임라인

- **P0 (Search Advisor)**: 작가님 직접 등록 필요 (인증 코드 발급 → 메타태그 삽입 → 배포). 등록 후 네이버 재크롤까지 1~3일.
- **P1~P5 (코드 작업)**: 막내 지시서 1건으로 일괄 처리 가능. 작업량 약 1~2시간.
- **썸네일 반영**: Search Advisor 등록 + 코드 배포 후 네이버 재크롤 사이클(1~7일) 필요.

---

*끝.*
