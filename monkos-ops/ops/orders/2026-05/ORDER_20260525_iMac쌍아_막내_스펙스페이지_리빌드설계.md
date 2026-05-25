---
type: order
date: 2026-05-25
from: iMac/쌍아
to: (다음 세션 배정)
status: 설계확정_구현대기
subject: 스펙스 페이지 리빌드 — URL 스키마 + 15개 언어 + JSON-LD + 445건 SSR
---

# 스펙스 페이지 리빌드 설계서

> 2026-05-25 작가님 확정. 다음 세션에서 구현 투입.

---

## 1. URL 스키마 (확정)

### 구조: 용도 → 국가

```
/specs                          → L1 허브 (용도 선택)
/specs/:type                    → L2 용도별 (국가 목록)
/specs/:type/:country           → L3 상세 (규격)
```

### type 값

| type | 한국어 | 영어 | 일본어 |
|------|--------|------|--------|
| passport | 여권 | Passport | パスポート |
| visa | 비자 | Visa | ビザ |
| license | 면허 | License | 免許 |
| id | 신분증 | National ID | 身分証 |
| resume | 이력서 | Resume | 履歴書 |
| custom | 기타 | Custom | カスタム |

### country 값

countries.jsonl의 id 필드 사용 (ISO 3166-1 alpha-2):
`korea`, `japan`, `us`, `uk`, `china`, `germany`, `france`, `brazil`, `india`, `vietnam`, `indonesia`, `thailand`, `russia`, `spain`, `italy`, ...

### 다국어 프리픽스 (15개 언어)

```
(없음) → 한국어 (기본)
/ja/   → 일본어
/en/   → 영어
/de/   → 독일어
/ru/   → 러시아어
/vi/   → 베트남어
/es/   → 스페인어
/ar/   → 아랍어
/it/   → 이탈리아어
/id/   → 인도네시아어
/zh/   → 중국어 (간체)
/pt/   → 포르투갈어 (브라질)
/fr/   → 프랑스어
/hi/   → 힌디어
/th/   → 태국어
```

### URL 예시

```
/specs/passport/korea           → 한국 여권 (한국어)
/en/specs/passport/korea        → 한국 여권 (영어)
/ja/specs/visa/japan            → 일본 비자 (일본어)
/th/specs/passport/thailand     → 태국 여권 (태국어)
/de/specs/visa/germany          → 독일 비자 (독일어)
```

### 총 URL 수

445건 × 15개 언어 = **6,675 URL** (SSR 자동 생성)

### 기존 URL 리다이렉트

```
/specs/korea-passport   → 301 → /specs/passport/korea
/specs/us-passport      → 301 → /specs/passport/us
/ja/specs/japan-resume  → 301 → /ja/specs/resume/japan
```

---

## 2. 서버 라우트

```javascript
// server.js — 기존 6줄 → 확장
const LOCALES = ['', 'ja', 'en', 'de', 'ru', 'vi', 'es', 'ar', 'it', 'id', 'zh', 'pt', 'fr', 'hi', 'th'];

// 동적 라우트 (locale prefix 처리)
GET /:locale?/specs              → renderSpecsHub(locale)
GET /:locale?/specs/:type        → renderSpecsTypeList(locale, type)
GET /:locale?/specs/:type/:country → renderSpecsDetail(locale, type, country)

// 기존 slug 리다이렉트
GET /:locale?/specs/:slug(하이픈 포함) → 301 → /:locale?/specs/:type/:country
```

---

## 3. JSON-LD 구조화 데이터

### L1 허브 (`/specs`)
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "증명사진 규격 가이드 — 200+국가",
  "description": "여권, 비자, 면허, 이력서 증명사진 규격 정보. 200개국 이상 대응.",
  "publisher": {"@type": "Organization", "name": "MONKOS AI", "url": "https://monkos.ai"},
  "hasPart": [
    {"@type": "CollectionPage", "name": "여권사진 규격", "url": "https://monkos.ai/specs/passport"},
    {"@type": "CollectionPage", "name": "비자사진 규격", "url": "https://monkos.ai/specs/visa"}
  ]
}
```

### L2 용도별 (`/specs/passport`)
```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "여권사진 규격 — 200+국가",
  "mainEntity": {
    "@type": "ItemList",
    "numberOfItems": 202,
    "itemListElement": [
      {"@type": "ListItem", "position": 1, "name": "한국 여권사진 규격", "url": "https://monkos.ai/specs/passport/korea"},
      ...
    ]
  }
}
```

### L3 상세 (`/specs/passport/korea`)
```json
[
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "한국 여권사진 규격 — 크기, 배경, 요구사항 (2026)",
    "author": {"@type": "Organization", "name": "MONKOS AI"},
    "publisher": {"@type": "Organization", "name": "MONKOS AI", "logo": {"@type": "ImageObject", "url": "https://monkos.ai/logo.png"}},
    "datePublished": "2026-05-25",
    "dateModified": "2026-05-25"
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "여권사진 배경은 흰색만 가능한가요?",
        "acceptedAnswer": {"@type": "Answer", "text": "네, 대한민국 여권사진은 균일한 흰색 배경만 허용됩니다."}
      }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "한국 여권사진 만드는 방법",
    "step": [
      {"@type": "HowToStep", "name": "규격 확인", "text": "3.5×4.5cm, 흰색 배경, 정면 응시"},
      {"@type": "HowToStep", "name": "촬영", "text": "MONKOS AI 실시간 코칭으로 촬영"},
      {"@type": "HowToStep", "name": "완성", "text": "AI 자동 크롭 + 품질 검증 후 다운로드"}
    ]
  }
]
```

---

## 4. 페이지 콘텐츠 패턴

### L1 허브
- 용도 카드 그리드 (여권/비자/면허/이력서/신분증/기타)
- 인기 규격 TOP 10
- CTA: MONKOS AI / 크롭앱

### L2 용도별
- 국가 검색 바
- 대륙별 탭 (아시아/유럽/아메리카/아프리카/오세아니아/중동)
- 국가 카드 그리드 (국기 + 국가명 + 사이즈)
- CTA: MONKOS AI / 크롭앱

### L3 상세
- 규격 요약 카드 (사이즈/픽셀/DPI/배경/머리높이)
- 상세 요구사항
- 반려 사유 TOP 5
- FAQ 아코디언
- CTA: MONKOS AI로 만들기 / 크롭앱
- 같은 나라 다른 규격 링크
- 출처 (공식 기관 URL)

---

## 5. 다국어 번역 전략

### 번역 대상 분류

| 콘텐츠 | 방법 | 양 |
|--------|------|-----|
| 규격 수치 (사이즈, 픽셀, DPI) | 번역 불필요 | 0 |
| 국가명 | countries.jsonl ko/en/ja + 12개 언어 추가 | 202 × 12 |
| 용도명 (여권/비자/면허...) | 6개 용도 × 15언어 | 90단어 |
| UI 텍스트 (버튼, 라벨, 탭) | i18n 파일 1개 | ~50키 × 15언어 |
| 상세 설명 (기존 26건) | ko/ja/en 있음, 12개 추가 | 26 × 12 |
| 상세 설명 (신규 국가) | ICAO 표준 템플릿 15개 언어 | 템플릿 3종 × 15 |
| FAQ (기존 26건) | ko/ja/en 있음, 12개 추가 | 선택적 |
| 반려 사유 | 공통 5개 × 15개 언어 | 75문장 |

### 템플릿 방식 (신규 국가)

기존 26건에 없는 국가는 ICAO 표준 템플릿으로 자동 생성:

```
"{국가명} {용도} 사진 규격은 {사이즈}mm ({픽셀}px)입니다. 
{표준} 국제 기준을 따르며, {배경색} 배경, 정면 응시, 무표정이 필요합니다."
```

이 템플릿을 15개 언어로 작성해놓으면 419건(신규) × 15언어 자동 커버.

---

## 6. SEO 설정

### sitemap
```xml
<!-- sitemap-specs.xml (동적 생성) -->
<url>
  <loc>https://monkos.ai/specs/passport/korea</loc>
  <xhtml:link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/passport/korea"/>
  <xhtml:link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/passport/korea"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/passport/korea"/>
  ... (15개 언어)
  <lastmod>2026-05-25</lastmod>
</url>
```

### meta 태그 (L3 상세)
```html
<title>한국 여권사진 규격 — 크기, 배경, 요구사항 | MONKOS</title>
<meta name="description" content="한국 여권사진 규격: 3.5×4.5cm (413×531px), 흰색 배경, 정면 응시. 반려 사유, FAQ, AI 제작 가이드.">
<link rel="canonical" href="https://monkos.ai/specs/passport/korea">
<link rel="alternate" hreflang="ko" href="https://monkos.ai/specs/passport/korea">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/ja/specs/passport/korea">
<link rel="alternate" hreflang="en" href="https://monkos.ai/en/specs/passport/korea">
... (15개 언어)
```

---

## 7. 구현 단계 (다음 세션)

| Phase | 내용 | 예상 |
|-------|------|------|
| **P1** | server.js 라우트 교체 + 기존 URL 301 리다이렉트 | 막내 1명 |
| **P2** | render-specs.js 리팩토링 (type/country 기반 + L1/L2/L3) | 막내 1명 |
| **P3** | 15개 언어 i18n 파일 + 국가명 번역 + 템플릿 번역 | 막내 1명 |
| **P4** | JSON-LD 구조화 데이터 삽입 | P2에 포함 |
| **P5** | sitemap-specs.xml 동적 생성 | 막내 1명 |
| **P6** | 디자인 (L1/L2/L3 페이지 UI) | 막내 1명 |

---

## ⚠️ 준수 조항
- 헌법 4조 3항: 내부 기술명 비공개. 페이지에 AI 엔진명 노출 금지.
- 헌법 4조 4항: 미출시 기능 안내 금지.
- IDPASS 앱과 용도→국가 흐름 동조.
