---
type: order
from: M1/민아
to: M1/막내(any)
date: 2026-04-10 06:56 KST
priority: P0
subject: Search Console NOINDEX 경고 해소 — 사이트맵에서 noindex 페이지 제거 (JP + KR)
tags: [seo, idphoto-jp, idphoto-kr, sitemap, search-console]
status: done
origin: Google Search Console 경고 4건 (2026-04-08) + GA4 Organic Search 7건/주 진단
---

# 지시서: NOINDEX ↔ 사이트맵 충돌 해소

**[2026-04-10 06:56 KST] M1/민아 → M1/막내(any)**

---

## 경위

4/8 Google Search Console에서 monkos.ai + idphoto-jp.monkos.ai에 대해 NOINDEX 색인 차단 경고 4건 수신.

**근본 원인**: 사이트맵(`/sitemap.xml`)에 등재된 URL이 `<meta name="robots" content="noindex, follow">` 태그를 포함 — "색인해줘" + "색인하지마"가 동시 선언되는 모순.

**영향**: GA4 기준 Organic Search 주간 7건. 사이트맵 모순이 해소되면 Google 색인 신뢰도 상승 → 오가닉 유입 개선 기대.

---

## 작업 내용

### 건 1: idphoto-jp 사이트맵에서 noindex 페이지 제거

**파일**: `monkos_AI/idphoto-jp/server.js` L731~738

**현재 상태** (sitemap 라우트의 urls 배열):
```js
const urls = [
  { loc: '/',                   priority: '1.0', changefreq: 'weekly',  lastmod: today },
  { loc: '/charge',             priority: '0.5', changefreq: 'monthly', lastmod: today },      // ← noindex
  { loc: '/privacy.html',       priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-12' }, // ← noindex
  { loc: '/terms.html',         priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-12' }, // ← noindex
  { loc: '/refund.html',        priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-24' }, // ← noindex
  { loc: '/tokusho.html',       priority: '0.3', changefreq: 'monthly', lastmod: '2026-03-01' }, // ← noindex
  { loc: '/credits-policy.html', priority: '0.3', changefreq: 'monthly', lastmod: '2026-03-08' }, // ← noindex
];
```

**변경**: charge, privacy.html, terms.html, refund.html, tokusho.html, credits-policy.html 6개 항목 제거. `/` 만 남김.

**변경 후**:
```js
const urls = [
  { loc: '/',                   priority: '1.0', changefreq: 'weekly',  lastmod: today },
];
```

---

### 건 2: idphoto-kr 사이트맵에서 noindex 페이지 제거

**파일**: `monkos_AI/idphoto-kr/server.js` L686~692

**현재 상태**:
```js
const urls = [
  { loc: '/',                   priority: '1.0', changefreq: 'weekly',  lastmod: today },
  { loc: '/charge',             priority: '0.5', changefreq: 'monthly', lastmod: today },      // ← noindex
  { loc: '/privacy.html',       priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-12' }, // ← noindex
  { loc: '/terms.html',         priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-12' }, // ← noindex
  { loc: '/refund.html',        priority: '0.3', changefreq: 'monthly', lastmod: '2026-02-24' }, // ← noindex
  { loc: '/credits-policy.html', priority: '0.3', changefreq: 'monthly', lastmod: '2026-03-08' }, // ← noindex
];
```

**변경**: charge, privacy.html, terms.html, refund.html, credits-policy.html 5개 항목 제거. `/` 만 남김.

**변경 후**:
```js
const urls = [
  { loc: '/',                   priority: '1.0', changefreq: 'weekly',  lastmod: today },
];
```

---

### 건 3: monkos.ai (포탈) — 확인만 (수정 불필요)

포탈 사이트맵은 동적 SSR 렌더링(`renderSitemap`). 등재 페이지(blog, faq, gallery, board, pricing, guide, crop) 전부 noindex 없음 확인. `/thankyou`는 사이트맵 미등재 → 충돌 없음.

**조치**: 없음

---

## 규칙

- **브랜치**: main (본 프로젝트는 main 단일 브랜치 운영)
- **커밋**: `[seo] sitemap에서 noindex 페이지 제거 — Search Console 경고 해소`
- **금지**: prod 배포, .env 수정, HTML의 noindex 태그 자체를 수정하지 말 것 (약관/정책 noindex는 의도적)
- **에스컬레이션**: 서버 코드 다른 부분 수정 필요 시 `⏳ 대기` 보고
- **MEMORY.md 확인 의무**

---

## 검증

수정 후 로컬에서 서버 구동하여 `/sitemap.xml` 응답 확인:
1. `cd monkos_AI/idphoto-jp && node server.js` → `curl localhost:{PORT}/sitemap.xml` → `/` 만 포함 확인
2. `cd monkos_AI/idphoto-kr && node server.js` → `curl localhost:{PORT}/sitemap.xml` → `/` 만 포함 확인
3. noindex 페이지(charge, terms.html 등)가 sitemap XML에 **없음** 확인

---

## 완료 기준

**실행+커밋**: 코드 수정 → 커밋 → main 푸시. 배포는 별도 승인 후 진행.

---

## 완료 보고 형식

```
✅ idphoto-jp sitemap noindex 페이지 제거 (6건)
✅ idphoto-kr sitemap noindex 페이지 제거 (5건)
📁 커밋: {해시}
🔀 브랜치: main
```
