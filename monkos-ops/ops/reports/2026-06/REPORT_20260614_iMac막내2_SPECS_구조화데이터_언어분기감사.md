---
type: report
date: 2026-06-14
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 구조화 데이터 + UI 언어 미분기 전수 감사

> **[2026-06-14 15:37 KST]** iMac/막내2 → 작가님
> 감사 대상: monkos.ai specs (445개 문서 × 3언어 = 1,335 페이지)
> 방법: 코드 레벨 (`render-specs.js` + `specs-data.json`) + prod 실측 (`curl` + JSON-LD 추출)

---

## 구조화 데이터 (JSON-LD)

| 스키마 | 필드 | 문제 | 영향 범위 |
|--------|------|------|----------|
| **Article** | `inLanguage` | 🔴 **필드 자체 누락** — Google이 언어 자동 판별에 의존. EN/JA 페이지가 한국어 콘텐츠로 오분류 가능 | 445×3 = 1,335페이지 전체 |
| **Article** | `description` | 🟡 description 미포함 (headline만 존재) | 1,335페이지 |
| **HowTo** | `step[0].text` | 🔴 **`specData.background` 직접 사용 — `locField()` 미경유**. 440/445 문서의 background가 한국어("균일 흰색", "흰색" 등). EN에서도 `"3.5 × 4.5cm / 균일 흰색"` 출력. prod 실측 확인 | EN/JA 총 890페이지 (440문서 × 2언어) |
| **HowTo** | `step[0].text` | 🟡 `specData.size` 직접 사용 — 현재 size 필드에 한국어 포함 1건뿐이라 실질 영향 미미. 단 `locField()` 미경유는 코드 결함 | 코드 결함 (실영향 1건) |
| **FAQPage** | `Question.name`, `Answer.text` | ✅ `specData.faqs[lang]` 참조 — 언어 분기됨. KO fallback 존재하나 faqs 자체가 9건뿐 (ko=9, ja=8, en=7) | 실질 영향 1~2건 (ko만 있고 ja/en 없는 문서) |
| **CollectionPage** (허브) | `name`, `description` | ✅ `SPECS_I18N[lang]` 참조 — 3언어 분기 정상 | 영향 없음 |

### prod 실측 결과

| URL | 스키마 | 문제 | 실제 출력 |
|-----|--------|------|----------|
| `/en/specs/passport/korea` | HowTo step[0] | 🔴 한국어 | `"3.5 × 4.5cm / 균일 흰색"` |
| `/ja/specs/passport/korea` | HowTo step[0] | 🔴 한국어 | `"3.5 × 4.5cm / 균일 흰색"` |
| `/en/specs/passport/japan` | HowTo step[0] | 🔴 일본어 | `"3.5 × 4.5cm / 無背景（白推奨）"` |
| `/en/specs/passport/vietnam` | HowTo step[0] | 🔴 한국어 | `"40 × 60 mm / 흰색"` |

---

## UI 텍스트

| 위치 | 한국어 텍스트 | 파일:라인 | 영향 페이지 수 |
|------|-------------|----------|--------------|
| **countryName (JA)** | `specData.country` 직접 사용 (438/445가 한국어). JA에서 `countryJa` 미참조 | `render-specs.js:864` | 🔴 JA 438페이지 (title, H1, hero, 태그) |
| **countryName (hub, JA)** | `buildHubData`에서 JA일 때 `spec.country` (한국어) 사용. `spec.countryJa` 미참조 | `render-specs.js:604` | 🔴 JA 허브 — 전 국가 카드에 한국어 국가명 |
| **validity (EN/JA table)** | `locField()` 경유하나 validityEn/Ja 커버리지 4% (19/445). 426건이 한국어 fallback | `render-specs.js:936` | 🟡 EN/JA 각 426페이지 (예: "6개월 이내") |
| **fileSpec (EN/JA table)** | 동일 — fileSpecEn/Ja 커버리지 5% (21/445). 424건이 한국어 fallback | `render-specs.js:937` | 🟡 EN/JA 각 424페이지 (예: "JPEG, 500KB 이하") |
| **headHeight (EN/JA table)** | headHeightEn/Ja 커버리지 59%. 183건이 한국어 fallback | `render-specs.js:935` | 🟡 EN/JA 각 183페이지 (예: "3.2~3.6cm (정수리~턱)") |
| **sizeEn/Ja** | 커버리지 0%. 단 size 필드 자체는 99.8% 범용 표기(숫자+mm). 한국어 포함 1건 | `render-specs.js:931` | ⚪ 실영향 1건 |
| **간판/히어로** | SPECS_I18N 3언어 분기 정상 | — | ✅ 영향 없음 |
| **버튼/CTA** | SPECS_I18N 3언어 분기 정상 | — | ✅ 영향 없음 |
| **푸터/헤더** | SPECS_I18N 3언어 분기 정상 | — | ✅ 영향 없음 |

### prod 실측 — body 한국어 검출

| URL | body 한국어 | 원인 |
|-----|-----------|------|
| `/en/specs/passport/korea` | 0건 | EN 번역 완비 (korea-passport는 seoTitle/validity/fileSpec 전부 EN 존재) |
| `/ja/specs/passport/korea` | 1건 ("한국") | `countryName = specData.country` = "한국" (countryJa 누락) |
| `/en/specs/passport/japan` | 0건 (일본어 9건) | japan은 base가 일본어. background/validity/headHeight/fileSpec이 일본어 |
| `/en/specs/passport/germany` | 0건 | backgroundEn 존재 |
| `/en/specs/passport/vietnam` | 0건 | body는 locField 경유. **JSON-LD만 미분기** |

---

## 사이트맵

| 항목 | 상태 |
|------|------|
| URL 3언어 생성 | ✅ KO 445 + JA 445 + EN 445 = 1,335 URL |
| `<xhtml:link rel="alternate" hreflang>` | 🔴 **사이트맵에 hreflang 미포함** — Google이 KO/JA/EN 페이지를 별개 문서로 인식, 중복 콘텐츠 판정 위험 |
| 개별 HTML의 hreflang | ✅ `<link rel="alternate" hreflang>` 4개(ko/ja/en/x-default) 포함 — 코드 확인 + prod 실측 |
| `render-sitemap.js` hreflang 로직 | 🔴 없음 — URL 생성만, hreflang 연결 없음 (`render-sitemap.js:113-115`) |

---

## 요약 — 심각도별 분류

### 🔴 P0 (Google 검색 노출에 직접 영향)

1. **HowTo JSON-LD `step[0].text` 한국어 하드코딩** — EN/JA 890페이지에 한국어/일본어 background 값 혼입. Google 리치 결과에 외국어 표시.
   - 원인: `render-specs.js:904` — `specData.background` 직접 사용 (`locField()` 미경유)
   - 수정: `locField(specData, 'background', lang)` + `locField(specData, 'size', lang)`

2. **JA countryName 한국어 노출** — JA 438페이지의 title/H1/hero에 한국어 국가명.
   - 원인: `render-specs.js:864` — `lang === 'en' ? countryEn : country`. JA분기 누락
   - 수정: JA일 때 `specData.countryJa || specData.country` 참조

3. **Article JSON-LD `inLanguage` 누락** — 1,335페이지 전체. Google 언어 오분류 위험.
   - 수정: `"inLanguage": lang` 추가

### 🟡 P1 (데이터 커버리지 — 점진 보강 필요)

4. **validity** EN/JA 번역 4% (19/445) — 426건 한국어 fallback
5. **fileSpec** EN/JA 번역 5% (21/445) — 424건 한국어 fallback
6. **headHeight** EN/JA 번역 59% (262/445) — 183건 한국어 fallback
7. **countryJa** 94% (419/445) — 26건 누락 (한국·일본·미국 등 주요국 포함)

### 🟢 P2 (사이트맵 보강)

8. **사이트맵 hreflang 미포함** — 개별 HTML에는 있으나 sitemap-specs.xml에 없음. 보강 권장.

---

## 코드 위치 인덱스

| # | 파일 | 라인 | 내용 |
|---|------|------|------|
| 1 | `render-specs.js` | 904 | HowTo step[0].text `specData.size / specData.background` |
| 2 | `render-specs.js` | 864 | `countryName` JA 분기 누락 |
| 3 | `render-specs.js` | 604 | `buildHubData` countryName JA 분기 누락 |
| 4 | `render-specs.js` | 878-887 | Article JSON-LD inLanguage 누락 |
| 5 | `render-specs.js` | 876 | FAQs fallback `faqs.ko` |
| 6 | `render-specs.js` | 941 | details fallback `details.ko` |
| 7 | `render-specs.js` | 947 | rejectionReasons fallback `rejectionReasons.ko` |
| 8 | `render-sitemap.js` | 113-115 | sitemap hreflang 미생성 |
| 9 | `specs-data.json` | — | validity/fileSpec/headHeight EN/JA 커버리지 부족 |
