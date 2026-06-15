---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "GEO P1 — 구조화 데이터 전면 보강 (BreadcrumbList·inLanguage·llms.txt)"
status: 발행
portfolio: PF_SPREAD
links: [PF_SPECS, PF_CITADEL]
priority: 즉시
---

# 지시서 — GEO P1 구조화 데이터 전면 보강

> **[2026-06-15 15:28 KST] iMac/쌍아 → iMac/막내**
> GEO 강화 로드맵 P1 실행. 설계서: `DESIGN_20260615_GEO강화_로드맵.md`

---

## 배경

P0(IndexNow 통지 파이프라인) 완료. P1은 AI 검색이 우리 콘텐츠를 "인용할 만한 구조화된 정보원"으로 인식하게 만드는 단계.

현행 확인 결과:
- ✅ specs: Article + HowTo + FAQPage — inLanguage 포함, 정상
- ✅ 블로그: Article — author·publisher·datePublished·dateModified 완비
- ✅ 홈: Organization + FAQPage
- ❌ 블로그 Article에 `inLanguage` 누락 — EN/JA 블로그에서 언어 미신호
- ❌ BreadcrumbList — 전체 미적용
- ❌ llms.txt — 58행, specs 카탈로그 미반영

---

## 임무

### 1. 블로그 Article JSON-LD에 inLanguage 추가

**파일:** `monkos_AI/portal/lib/cms/render-blog.js` (약 300행 부근)

현행:
```json
{
  "@type": "Article",
  "headline": "...",
  "datePublished": "...",
  "dateModified": "..."
}
```

추가:
```json
{
  "@type": "Article",
  "inLanguage": "{lang}",
  ...
}
```

`lang` 변수는 이미 render-blog.js에서 사용 중 (url에서 추출). 해당 값을 JSON-LD에 삽입.
- ko 기본경로 → `"ko"`
- `/en/blog/...` → `"en"`
- `/ja/blog/...` → `"ja"`

### 2. BreadcrumbList JSON-LD 전면 적용

**적용 대상:** 블로그 상세 + specs 상세 (허브·홈은 스킵 가능)

**블로그 상세** (`render-blog.js`):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai"},
    {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://monkos.ai/blog"},
    {"@type": "ListItem", "position": 3, "name": "{post.title}"}
  ]
}
```
EN/JA는 name을 언어에 맞게: "ブログ" / "Blog", item URL도 `/ja/blog` / `/en/blog`.

**specs 상세** (`render-specs.js`):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "MONKOS", "item": "https://monkos.ai"},
    {"@type": "ListItem", "position": 2, "name": "Specs", "item": "https://monkos.ai/specs"},
    {"@type": "ListItem", "position": 3, "name": "{country} {type}"}
  ]
}
```
언어별 name 분기 (규격 → Specs → 規格).

### 3. llms.txt 강화

**파일:** `monkos_AI/portal/public/llms.txt`

현행 58행 → 다음 섹션 추가:

```
## Specs (ID Photo Specifications)
> 445 country/document-type combinations with size, background, head height requirements
> Available in Korean, English, Japanese
> URL pattern: /specs/{type}/{country}, /en/specs/{type}/{country}, /ja/specs/{type}/{country}
> Types: passport, visa, resume, drivers-license, resident-id
> Coverage: 207 countries across 6 continents

## Blog
> Photography, AI development stories, ID photo guides
> Available in Korean, English, Japanese
> Auto-translated with human review
```

기존 내용 보존, 하단에 추가.

### 4. 검증

- 블로그 EN/JA 페이지에서 `inLanguage` 필드 확인 (3건 샘플)
- BreadcrumbList Rich Results Test 통과 확인 (블로그 1건 + specs 1건)
- llms.txt 내용 확인

### 5. 배포

- deploy.sh 경유 monkos.ai 배포
- monk.kr llms.txt도 업데이트 필요 시 반영

---

## 산출물

1. render-blog.js — inLanguage + BreadcrumbList 추가
2. render-specs.js — BreadcrumbList 추가
3. llms.txt — specs·blog 섹션 추가
4. COMPLETION 보고서
5. PF_SPREAD 히스토리 1행 어펜드
6. 커밋 → 배포

---

## ⚠️ 준수 조항

- 기존 JSON-LD 구조 유지 (추가만, 기존 필드 변경 금지)
- ch5 2조: 배포는 deploy.sh 경유
- 헌법 4조 2항: 파괴적 명령 금지
