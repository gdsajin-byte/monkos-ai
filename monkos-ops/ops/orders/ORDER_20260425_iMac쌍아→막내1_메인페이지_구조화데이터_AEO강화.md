---
type: order
id: ORDER_20260425_메인_구조화데이터_AEO
date: 2026-04-25
from: iMac/쌍아
to: iMac/막내1
subject: monkos.ai 메인 페이지 구조화 데이터(JSON-LD) AEO 강화 — 26개국 규격 전문 사이트 정체성 선언
priority: high
status: 폐기 (ORDER_20260425_포털AEO통합개편으로 흡수)
affects: monkos_AI/portal/public/index.html
---

# 지시서 — 메인 페이지 구조화 데이터 AEO 강화

## 1. 목적

AI 봇(ChatGPT, Claude, Perplexity, Google)이 monkos.ai 메인 페이지를 처음 크롤링했을 때
**"26개국 증명사진 규격을 완비한 AI 전문 서비스"**임을 즉시 인지하도록
최상위 구조화 데이터를 강화한다.

## 2. 현황

**파일**: `monkos_AI/portal/public/index.html` 49~86행
- 현재: `@graph` 안에 `WebApplication` + 서비스 `ItemList`(5항목)만 존재
- **부재**: WebSite 스키마, Organization 상세, 26국 규격 목록, knowsAbout, areaServed, Service 스키마

## 3. 작업

기존 `@graph` 배열 안에 아래 3개 노드를 **추가**한다. 기존 `WebApplication`과 `ItemList`는 유지.

### 3-1. WebSite 노드 (사이트 정체성 선언)

```json
{
  "@type": "WebSite",
  "name": "MONKOS AI — 26개국 증명사진 AI 전문 서비스",
  "url": "https://monkos.ai",
  "inLanguage": ["ko", "ja", "en"],
  "description": "AI-powered ID photo service covering 26 countries. Passport, visa, resume, and official document photos with ICAO-compliant specifications. Free crop tool and AI retouching.",
  "keywords": "AI passport photo, AI ID photo, 증명사진 AI, 여권사진, 履歴書 写真, ICAO photo, visa photo, resume photo, 26 countries ID photo specs"
}
```

### 3-2. Organization 노드 (운영 주체 + 전문 분야)

```json
{
  "@type": "Organization",
  "name": "MONKOS",
  "alternateName": ["Monk Studio", "몽크사진관", "몽코스"],
  "url": "https://monkos.ai",
  "logo": "https://monkos.ai/favicon-192.png",
  "sameAs": ["https://monk.kr"],
  "founder": {
    "@type": "Person",
    "name": "Shin JeongKyu",
    "jobTitle": "Photographer & AI Architect"
  },
  "knowsAbout": [
    "AI ID photo generation",
    "ICAO passport photo standard",
    "Passport photo specifications by country",
    "Face landmark detection for photo cropping",
    "AI photo retouching",
    "증명사진 규격",
    "여권사진",
    "履歴書 証明写真",
    "AI 증명사진"
  ],
  "areaServed": [
    "KR", "JP", "US", "GB", "DE", "ES", "FR", "IT",
    "AU", "CA", "SG", "TH", "IN", "CN", "VN", "ID",
    "EU"
  ],
  "description": "사진작가 경력 20년·스튜디오 운영 12년차 전문가가 설계한 AI 증명사진 서비스. 26개국 공식 규격 데이터 완비."
}
```

### 3-3. ProfessionalService 노드 (핵심 서비스 + 26국 규격 강조)

```json
{
  "@type": "ProfessionalService",
  "name": "MONKOS AI 증명사진 서비스",
  "serviceType": "AI ID Photo Service",
  "url": "https://monkos.ai",
  "provider": { "@type": "Organization", "name": "MONKOS" },
  "areaServed": [
    "KR", "JP", "US", "GB", "DE", "ES", "FR", "IT",
    "AU", "CA", "SG", "TH", "IN", "CN", "VN", "ID",
    "EU"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "26개국 증명사진 규격 가이드",
    "numberOfItems": 26,
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 여권·신분증", "url": "https://monkos.ai/specs/korea-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 반명함 (3×4)", "url": "https://monkos.ai/specs/korea-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 반명함 (이력서)", "url": "https://monkos.ai/specs/korea-halfcard" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 주민등록증", "url": "https://monkos.ai/specs/korea-resident" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "한국 운전면허증", "url": "https://monkos.ai/specs/korea-drivers-license" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 パスポート", "url": "https://monkos.ai/specs/japan-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 マイナンバーカード", "url": "https://monkos.ai/specs/japan-mynumber" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 在留カード", "url": "https://monkos.ai/specs/japan-zairyu" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 履歴書", "url": "https://monkos.ai/specs/japan-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "日本 半名刺写真", "url": "https://monkos.ai/specs/japan-halfcard" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "USA Passport / Visa", "url": "https://monkos.ai/specs/us-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "USA Headshot · LinkedIn", "url": "https://monkos.ai/specs/usa-headshot" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "EU Passport · ID", "url": "https://monkos.ai/specs/eu-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Spain Pasaporte · NIE", "url": "https://monkos.ai/specs/spain-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Germany Bewerbungsfoto", "url": "https://monkos.ai/specs/germany-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "EU CV Photo", "url": "https://monkos.ai/specs/eu-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "UK Passport", "url": "https://monkos.ai/specs/uk-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Australia Passport · ID", "url": "https://monkos.ai/specs/australia-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Canada Passport · ID", "url": "https://monkos.ai/specs/canada-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Singapore Passport · PR", "url": "https://monkos.ai/specs/singapore-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Thailand Passport", "url": "https://monkos.ai/specs/thailand-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "India Passport", "url": "https://monkos.ai/specs/india-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "中国 护照 · 签证", "url": "https://monkos.ai/specs/china-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "中国 简历照片", "url": "https://monkos.ai/specs/china-resume" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Vietnam Hộ chiếu", "url": "https://monkos.ai/specs/vietnam-passport" }},
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Indonesia Paspor", "url": "https://monkos.ai/specs/indonesia-passport" }}
    ]
  },
  "description": "26개국 공식 증명사진 규격 데이터를 완비한 AI 서비스. 각국 여권·비자·이력서·신분증 사진을 ICAO 국제 표준에 맞춰 자동 생성·크롭. 무료 크롭 도구 + AI 리터칭 제공."
}
```

## 4. 삽입 위치

`monkos_AI/portal/public/index.html` 49행 `<script type="application/ld+json">` 내부,
기존 `@graph` 배열의 **끝에 3개 노드 추가** (기존 WebApplication, ItemList 뒤에).

## 5. 검증

1. 수정 후 로컬에서 JSON 문법 검증:
   ```bash
   node -e "const h=require('fs').readFileSync('monkos_AI/portal/public/index.html','utf8'); const m=h.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/); JSON.parse(m[1]); console.log('✅ Valid JSON-LD')"
   ```

2. Google Rich Results Test 검증용 URL (배포 후):
   - https://search.google.com/test/rich-results?url=https://monkos.ai

## 6. 배포

`./monkos_AI/portal/deploy.sh`

⚠️ 준수 조항:
- 배포는 반드시 deploy.sh 경유 (법률 5장 2조)
- 기존 JSON-LD 구조(WebApplication + ItemList) 삭제 금지 — 추가만

---

**완료 보고**: 수정 → 검증 → 배포 → curl 실측 → 보고
