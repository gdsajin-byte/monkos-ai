---
type: order
id: ORDER_20260614_iMac쌍아_막내_SPECS_구조화데이터_언어분기수정
date: 2026-06-14 15:59 KST
from: iMac/쌍아
to: 막내
portfolio: PF_SPECS
priority: P1
status: pending
---

# 구조화 데이터 + UI 언어 분기 수정 — P0 3건

> **[2026-06-14 15:59 KST] iMac/쌍아 → 막내**
> 귀속: PF_SPECS
> 근거: REPORT_20260614_iMac막내2_SPECS_구조화데이터_언어분기감사.md

---

## 목표

영/일 검색 노출을 차단하는 구조화 데이터 P0 결함 3건을 수정한다. 대상 파일은 `monkos_AI/portal/lib/cms/render-specs.js` 1개.

---

## 수정 항목

### 1. HowTo JSON-LD step[0].text — 한국어 하드코딩 해소 (render-specs.js:904)

**현재:**
```javascript
specData.size + ' / ' + specData.background
```

**수정:**
```javascript
locField(specData, 'size', lang) + ' / ' + locField(specData, 'background', lang)
```

영향: EN/JA 890페이지의 HowTo 리치결과에서 한국어 제거.

### 2. JA countryName 분기 누락 (render-specs.js:864)

**현재:**
```javascript
const countryName = lang === 'en' ? (specData.countryEn || specData.country) : specData.country;
```

**수정:**
```javascript
const countryName = lang === 'en'
  ? (specData.countryEn || specData.country)
  : lang === 'ja'
    ? (specData.countryJa || specData.country)
    : specData.country;
```

동일 패턴을 `buildHubData` (render-specs.js:604)에도 적용.

영향: JA 438페이지의 title/H1/hero에서 한국어 국가명 제거.

### 3. Article JSON-LD inLanguage 추가 (render-specs.js:878-887)

**현재:** Article 스키마에 `inLanguage` 필드 없음.

**수정:** Article 객체에 추가:
```javascript
"inLanguage": lang === 'ja' ? 'ja' : lang === 'en' ? 'en' : 'ko'
```

영향: 1,335페이지 전체에 언어 명시 → 구글 언어 분류 정확도 향상.

---

## ⚠️ 준수 조항

- `locField()` 함수가 이미 존재함 — 새 함수 만들지 말고 기존 것 사용
- `specData` 구조 변경 금지 — 렌더링 로직만 수정
- 배포는 `deploy.sh` 경유 (ch5 2조)
- P1 번역 커버리지(validity 4%, fileSpec 5% 등)는 **본 지시서 범위 밖** — 데이터 보강은 별건

---

## 검증

1. 로컬에서 EN/JA 페이지 렌더링 → JSON-LD 추출하여 확인:
   - HowTo step[0].text에 한국어 없음
   - Article에 `inLanguage` 존재
   - JA countryName이 일본어
2. prod 배포 후 3개 URL curl 실측:
   - `/en/specs/passport/korea` — HowTo text 영문, inLanguage "en"
   - `/ja/specs/passport/korea` — HowTo text 일문, countryName 일문, inLanguage "ja"
   - `/en/specs/passport/vietnam` — HowTo text 영문

---

## 산출물

- `render-specs.js` 수정 (3건)
- prod 배포 1건 (deploy.sh 경유)
- 검증 결과 (curl 실측)
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_SPECS 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
