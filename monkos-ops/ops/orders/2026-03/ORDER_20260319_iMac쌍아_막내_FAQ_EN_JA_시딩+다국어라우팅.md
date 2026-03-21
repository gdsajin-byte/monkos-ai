---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — FAQ EN/JA 시딩 + 다국어 라우팅

**[2026-03-19 13:44 KST] iMac/쌍아 → iMac/막내**

## 배경

KO FAQ 13건은 시딩 완료. EN/JA 번역 파일도 준비 완료. 시딩 스크립트 확장 + 렌더링 다국어 지원 + 라우팅 추가 3건.
Blog 다국어 패턴이 이미 있으니 동일 패턴으로 확장.

## 참조 파일

- KO 시딩 스크립트: `monkos_AI/portal/seed_faq.js`
- EN 번역: `monkos-ops/works/portal_v4/FAQ_20260315_MONKOS_AI_EN.md`
- JA 번역: `monkos-ops/works/portal_v4/FAQ_20260315_MONKOS_AI_JA.md`
- 렌더링: `monkos_AI/portal/lib/cms/render.js` L445~522 `faqFragment()`
- 라우팅: `monkos_AI/portal/server.js` L228 `/faq`
- Blog 다국어 참조: `server.js` L219~222 (`/ja/blog`, `/en/blog` 패턴)

---

## Task 1: seed_faq.js 확장

`seed_faq.js`에 EN/JA FAQ 데이터를 추가한다.

**규칙:**
- 번역 파일 원문 그대로 시딩 (임의 수정 금지, 헌법 5조 1항)
- id 패턴: `faq_en_01`~`faq_en_13`, `faq_ja_01`~`faq_ja_13`
- category는 각 언어별로:
  - EN: `About the Service`, `Quality & Technology`, `Pricing & Payment`, `Capturing & Usage`, `Standards & Safety`, `Customer Support`
  - JA: `サービス紹介`, `品質と技術`, `料金とお支払い`, `撮影と使い方`, `規格と安全性`, `カスタマーサポート`
- lang: `en` / `ja`
- order: 1~13 (KO와 동일)
- published: true
- 기존 KO 데이터는 건드리지 않는다. 추가만.

**seed 함수 수정:**
- 기존: 전체 삭제 후 KO만 시딩
- 변경: KO/EN/JA 전체 시딩. 기존 삭제 로직은 유지 (전체 re-seed 방식)

**실행:**
```bash
cd monkos_AI/portal
node seed_faq.js
# → 39건 시딩 확인 (13 × 3)
```

---

## Task 2: render.js faqFragment() 다국어 지원

**현행:** `faqFragment(req)` — lang 필터 없이 전체 조회

**변경:** Blog 패턴 따라 lang 파라미터 추가

```javascript
// 변경 전
export async function faqFragment(req) {
  const snapshot = await faqCollection.where('published', '==', true).orderBy('order', 'asc').get();

// 변경 후
export async function faqFragment(req, forceLang = null) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const lang = forceLang || url.searchParams.get('lang') || 'ko';
  const snapshot = await faqCollection
    .where('published', '==', true)
    .where('lang', '==', lang)
    .orderBy('order', 'asc')
    .get();
```

**추가 변경:**
- `htmlLang` 반환값도 `lang` 변수로 대체 (현재 `'ko'` 하드코딩)
- `canonical` URL도 언어별 분기:
  - ko: `https://monkos.ai/faq`
  - en: `https://monkos.ai/en/faq`
  - ja: `https://monkos.ai/ja/faq`
- og:title, og:description도 언어별 분기

---

## Task 3: server.js 라우팅 추가

Blog 다국어 라우트 패턴(L219~222)과 동일하게 FAQ 다국어 라우트 추가.

`/faq` 라우트(L228) **위에** 추가:

```javascript
// 다국어 FAQ 라우트
if (urlPath === '/ja/faq' && req.method === 'GET') return renderFaq(req, res, 'ja');
if (urlPath === '/en/faq' && req.method === 'GET') return renderFaq(req, res, 'en');
```

`renderFaq` 함수도 lang 파라미터를 `faqFragment`에 전달하도록 수정:

```javascript
// render.js 내 renderFaq
export async function renderFaq(req, res, forceLang = null) {
  const fragment = await faqFragment(req, forceLang);
  // ... 기존 renderPage 호출
}
```

---

## Task 4: Firestore 인덱스 확인

`faq_items` 컬렉션에 복합 인덱스 필요 여부 확인:
- `published` + `lang` + `order` 복합 쿼리
- 이미 있으면 skip, 없으면 Firestore 에러 로그에서 인덱스 생성 URL 확인 후 생성

---

## 완료 조건

- [ ] `seed_faq.js` 실행 → Firestore에 39건 확인 (ko 13 + en 13 + ja 13)
- [ ] `https://monkos.ai/faq` — KO FAQ 정상 렌더링 (기존과 동일)
- [ ] `https://monkos.ai/en/faq` — EN FAQ 렌더링
- [ ] `https://monkos.ai/ja/faq` — JA FAQ 렌더링
- [ ] JSON-LD FAQPage 스키마 언어별 정상 출력
- [ ] dev 배포 후 3개 URL 동작 확인

## ⚠️ 준수 조항

- FAQ 원문 임의 수정 금지 (헌법 5조 1항)
- 기존 KO FAQ 데이터 보존 확인
- prod 배포는 하지 않는다 (dev까지만)
