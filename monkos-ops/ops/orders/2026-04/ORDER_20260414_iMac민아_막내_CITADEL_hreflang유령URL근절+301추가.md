---
type: order
from: iMac/민아
to: 막내(any)
date: 2026-04-14 18:25 KST
priority: P0
subject: CITADEL Phase 1.8 — hreflang 유령 URL 근절 + blogRedirects 누락 6건 추가
tags: [portal, seo, citadel, hreflang, sitemap, 404]
status: pending
review: 쌍아 검토 후 진행
origin: iMac/민아 GSC 404 패턴 분석 — 31건 중 17건이 hreflang 기인 반복 생산 구조
---

# 지시서: hreflang 유령 URL 근절 + blogRedirects 누락 추가

**[2026-04-14 18:25 KST] iMac/민아 → 쌍아(검토) → 막내(실행)**

---

## 경위

GSC 404가 31건으로 증가. 4/10 조치(HEAD 404 수정 + 301 리다이렉트 10건)는 효과가 있었으나, **블로그가 발행될 때마다 404가 자동 생산되는 구조적 문제** 미해결.

### 패턴 분석 결과 (31건 분류)

| 유형 | 건수 | 원인 | 조치 |
|------|------|------|------|
| A. 301 이미 등록 (GSC 캐시) | 6 | Google 재크롤링 대기 | 방치 OK |
| B. vol 슬러그 301 누락 | 6 | blogRedirects 미등록 | **건 2에서 추가** |
| C. 서술형 슬러그 404 | 14 | **hreflang 유령 URL** | **건 1에서 근절** |
| D. 한글 슬러그 in /ja/ /en/ | 3 | **hreflang 유령 URL** | **건 1에서 근절** |
| E. 기타 (캐시 잔여) | 2 | 자연 해소 | 방치 OK |

### 근본 원인: render.js L417~423

```js
// 현재: 한국어 글이든 일본어 글이든 — 무조건 3개 언어 hreflang을 찍음
const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href=".../blog/${slug}">`,
    `<link rel="alternate" hreflang="ja" href=".../ja/blog/${slug}">`,
    `<link rel="alternate" hreflang="en" href=".../en/blog/${slug}">`,
    `<link rel="alternate" hreflang="x-default" href=".../blog/${slug}">`,
];
```

→ Google이 hreflang 링크를 크롤링 → 해당 언어 번역본 없으면 404 → GSC 누적.
→ 블로그 발행할 때마다 C+D 유형 404가 **자동으로 추가 생산**되는 구조.

---

## 건 1: hreflang 조건부 생성 [P0 — 반복 생산 구조 근절]

### 수정 대상

**파일**: `monkos_AI/portal/lib/cms/render.js` — `renderBlogPost` 함수 (L390 부근)

### 현재 코드 (L404~423)

```js
const docId = lang ? `${slug}-${lang}` : slug;
const doc = await blogCollection.doc(docId).get();
// ... 생략 ...
const hreflangTags = [
    `<link rel="alternate" hreflang="ko" href="https://monkos.ai/blog/${slug}">`,
    `<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/blog/${slug}">`,
    `<link rel="alternate" hreflang="en" href="https://monkos.ai/en/blog/${slug}">`,
    `<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/${slug}">`,
].join('\n');
```

### 수정 코드

```js
const docId = lang ? `${slug}-${lang}` : slug;
const doc = await blogCollection.doc(docId).get();
// ... 생략 (기존 코드 유지) ...

// hreflang — 실제 존재하는 언어 버전만 출력 (2026-04-14 유령URL 근절)
const hreflangPairs = [
    { lang: 'ko', docId: slug, prefix: '' },
    { lang: 'ja', docId: `${slug}-ja`, prefix: '/ja' },
    { lang: 'en', docId: `${slug}-en`, prefix: '/en' },
];
const existChecks = await Promise.all(
    hreflangPairs.map(async (p) => {
        try {
            const d = await blogCollection.doc(p.docId).get();
            return d.exists && d.data().published ? p : null;
        } catch { return null; }
    })
);
const existingLangs = existChecks.filter(Boolean);
const hreflangTags = existingLangs.map(p =>
    `<link rel="alternate" hreflang="${p.lang}" href="https://monkos.ai${p.prefix}/blog/${slug}">`
).concat(
    existingLangs.length > 0
        ? [`<link rel="alternate" hreflang="x-default" href="https://monkos.ai/blog/${slug}">`]
        : []
).join('\n');
```

### 핵심 로직

1. 각 언어별 문서 ID(`slug`, `slug-ja`, `slug-en`)의 **존재 여부 + published 상태** 확인
2. `Promise.all`로 3건 병렬 조회 — 순차 대비 지연 최소화
3. 존재하는 언어만 hreflang 태그 출력
4. `x-default`는 하나라도 존재하면 KO 기본으로 출력

### 성능 고려

- Firestore `doc().get()`은 단건 조회로 매우 빠름 (~5ms)
- `Promise.all` 병렬이므로 추가 지연 ~5ms 수준
- 블로그 글 조회 자체가 이미 DB hit이므로 상대적 오버헤드 미미

---

## 건 2: blogRedirects 누락 6건 추가 [P1]

### 수정 대상

**파일**: `monkos_AI/portal/server.js` — `blogRedirects` 객체

### 추가할 매핑 6건

```js
const blogRedirects = {
    // === 기존 10건 유지 ===
    // JA
    '/ja/blog/vol23-qa-5':     '/ja/blog/ai-de-shomei-shashin-geneki-shashinkan-review',
    '/ja/blog/vol22':          '/ja/blog/job-interview-updo-hair-5-steps',
    '/ja/blog/vol21-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',
    '/ja/blog/vol20-vs':       '/ja/blog/korea-vs-japan-job-photo-hair',
    // EN
    '/en/blog/vol23-qa-5':     '/en/blog/ai-id-photo-review-photography-studio-owner',
    '/en/blog/vol22':          '/en/blog/interview-updo-flight-attendant-hair-5-steps',
    '/en/blog/vol21-ai-monkosai': '/en/blog/ai-id-photo-created-by-a-20-year-photographer-monkos-ai',
    '/en/blog/vol20-vs':       '/en/blog/korean-vs-japanese-job-application-photos-hairstyle',
    '/en/blog/vol19':          '/en/blog/id-photo-job-application-photo-makeup-for-each-skin-tone',
    // KO
    '/blog/vol23-qa-5':        '/blog/vol24-20-ai-monkosai',

    // === 신규 6건 추가 (2026-04-14 GSC 404 해소) ===
    '/en/blog/vol17-vs':       '/en/blog/korea-vs-japan-interview-attire-whats-the-difference',
    '/en/blog/vol18-ai-vs':    '/en/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo',
    '/ja/blog/vol17-vs':       '/ja/blog/korea-vs-japan-interview-attire-whats-the-difference',
    '/ja/blog/vol18-ai-vs':    '/ja/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo',
    '/ja/blog/vol19':          '/ja/blog/id-photo-job-application-photo-makeup-for-each-skin-tone',
    '/ja/blog/vol24-20-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',
};
```

> ⚠️ 신규 6건의 리다이렉트 대상(신규 슬러그)이 실제로 D1에 존재하는지 **반드시 확인** 후 매핑. 존재하지 않으면 해당 건은 제외하고 보고.

---

## 검증

### 건 1 검증

```bash
# 한국어만 존재하는 글의 페이지 소스에서 hreflang 확인
curl -s https://localhost:{PORT}/blog/{한국어전용슬러그} | grep hreflang
# → hreflang="ko"만 출력되어야 함. ja/en 없어야 함.

# 3개 언어 모두 존재하는 글
curl -s https://localhost:{PORT}/blog/{3개국어슬러그} | grep hreflang
# → ko, ja, en, x-default 모두 출력
```

### 건 2 검증

```bash
curl -sI http://localhost:{PORT}/ja/blog/vol17-vs -w '%{http_code}\n' | grep -E 'Location|HTTP'
# HTTP/1.1 301 Moved Permanently
# Location: /ja/blog/korea-vs-japan-interview-attire-whats-the-difference
```

---

## 규칙

- **브랜치**: main
- **커밋**: `[seo] hreflang 조건부 생성 — 유령URL 근절 + blogRedirects 6건 추가`
- **금지**: prod 배포, .env 수정
- **에스컬레이션**: render.js 구조 변경이 다른 SSR 함수에 영향 시 `⏳ 대기` 보고
- **MEMORY.md 확인 의무**

⚠️ 준수 조항:
- 헌법 4조 2항: 파괴적 명령 금지
- 법률 ch5 2조: 배포는 deploy.sh 경유 (이 지시서는 코딩+커밋까지)
- 법률 ch6: 커밋 메시지 `[seo]` 접두사

---

## 완료 기준

**실행+검증**: 코드 수정 → 로컬 검증(hreflang 조건부 + 301 동작) → 커밋 → main 푸시. 배포는 별도 승인.

---

## 완료 보고 형식

```
✅ 건 1: hreflang 조건부 생성 (render.js renderBlogPost) — 존재하는 언어만 출력
✅ 건 2: blogRedirects 6건 추가 (server.js) — vol17/18/19/24 JA/EN
✅ 로컬 검증: 한국어전용 글 hreflang ko만 / 3개국어 글 ko+ja+en / 301 리다이렉트 동작
📁 커밋: {해시}
🔀 브랜치: main
```
