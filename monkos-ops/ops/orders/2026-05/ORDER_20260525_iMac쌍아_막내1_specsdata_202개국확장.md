---
type: order
date: 2026-05-25
from: iMac/쌍아
to: iMac/막내1
status: 대기
subject: specs-data.json 202개국 확장 — countries.jsonl → specs-data.json 변환
---

# 지시서: specs-data.json 202개국 확장

## 배경

monkos.ai/specs 페이지가 `specs-data.json` (26건)을 SSR 데이터로 사용 중. D1에 202개국 365건이 있지만 연결하지 않는다. 대신 **specs-data.json 자체를 202개국으로 확장**한다. 규격 데이터는 정적이므로 런타임 DB 호출 불필요.

## 소스 데이터

1. **기존**: `monkos_AI/portal/lib/cms/specs-data.json` — 26건 (풍부한 FAQs, rejectionReasons, details 포함)
2. **추가**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 202개국, 각국 docs 배열

## Task

### 1. 기존 26건 보존
- `specs-data.json`의 현재 26개 엔트리는 그대로 유지. 데이터 수정 금지.
- slug, FAQs, rejectionReasons, details 등 풍부한 필드 보존.

### 2. 신규 국가 추가
`countries.jsonl`에서 기존 26건에 없는 국가/규격을 추가.

**slug 형식**: `{country_id}-{type}` (예: `py-passport`, `py-visa`)

**신규 엔트리 구조** (기존 형식 준수):
```json
{
  "py-passport": {
    "slug": "py-passport",
    "country": "파라과이",
    "countryEn": "Paraguay",
    "countryJa": "パラグアイ",
    "type": "여권",
    "typeEn": "Passport",
    "typeJa": "パスポート",
    "size": "3.5 × 4.5cm",
    "pixels": "413 × 531px",
    "dpi": 300,
    "background": "흰색",
    "headHeight": "3.2~3.6cm",
    "validity": "",
    "fileSpec": "",
    "standard": "ICAO 9303",
    "continent": "americas",
    "details": {
      "ko": "ICAO 9303 국제 표준을 따릅니다. 흰색 배경, 정면 응시, 무표정.",
      "ja": "ICAO 9303国際基準に準拠。白背景、正面、無表情。",
      "en": "Follows ICAO 9303 international standard. White background, frontal view, neutral expression."
    },
    "rejectionReasons": {
      "ko": ["배경 불균일", "머리 기울어짐", "사이즈 불일치"],
      "ja": ["背景の不均一", "頭の傾き", "サイズ不一致"],
      "en": ["Uneven background", "Head tilt", "Wrong size"]
    },
    "faqs": {}
  }
}
```

### 3. countries.jsonl의 커스텀 규격 반영
- `docs` 배열에 커스텀 사이즈가 있는 국가 → 해당 사이즈 사용
- `docs` 배열이 비어있는 국가 → ICAO 기본 (35x45mm, 413x531px)
- `warning` 필드가 있으면 `details`에 반영
- `source`, `sourceName` 필드가 있으면 신규 필드 `source`, `sourceName`으로 보존

### 4. continent 필드 추가
기존 26건에도 continent 필드가 없으면 추가. countries.jsonl의 continent 값 사용:
- asia, europe, americas, africa, oceania, middle_east

### 5. 변환 스크립트 작성
재현 가능하도록 Node.js 변환 스크립트를 작성:
```
scripts/convert-specs-data.js
```
실행: `node scripts/convert-specs-data.js`
- 입력: specs-data.json (26건) + countries.jsonl (202개국)
- 출력: specs-data.json (덮어쓰기, 확장)

### 6. render-specs.js 호환성 확인
- `specsListFragment()`와 `specsDetailFragment(slug)`가 신규 엔트리를 정상 렌더링하는지 확인
- continent 기반 분류가 동작하는지 확인
- 다국어(ko/ja/en) 전환이 동작하는지 확인
- **코드 수정이 필요하면 최소한으로** — 데이터 확장에 맞춰 필요한 부분만

## 산출물

1. `scripts/convert-specs-data.js` — 변환 스크립트
2. `monkos_AI/portal/lib/cms/specs-data.json` — 202개국 확장 (기존 26건 보존 + 신규 추가)
3. render-specs.js 호환성 확인 결과
4. 완료 보고서

## ⚠️ 준수 조항
- 기존 26건 데이터 수정/삭제 절대 금지. 추가만.
- 헌법 3조 2항: 완료 시 세션 로그 어펜드 + 커밋.
