---
type: report
date: 2026-06-15
device: iMac
agent: 막내3
status: 완료
portfolio: PF_SPECS
---

# SPECS 1,335페이지 전수 품질 감사 보고서

> **[2026-06-15 14:30 KST]** iMac/막내3 → 작가님
> 지시서: ORDER_20260615_iMac쌍아_막내3_SPECS_1335페이지_전수품질감사

---

## 요약 (Executive Summary)

| 구분 | 건수 | 비고 |
|------|------|------|
| 검사 대상 | 1,335 URL (445건 × 3언어) | specs-data.json 445건 전수 |
| HTTP 에러 | **0건** | 전수 200 OK |
| 메타 태그 누락 | **0건** | title, og:title, og:description, canonical, hreflang 전수 정상 |
| 중복 콘텐츠 | **0건** | 해시 비교, 전 페이지 고유 |
| 🔴 FAQPage 구조화 데이터 누락 | **436건/445건** (98%) | 9건만 보유 (레거시 엔트리) |
| 🔴 seoTitle/seoDescription 공란 | **442건/445건** (99.3%) | 자동 생성 타이틀로 대체 중 |
| 🔴 FAQ 콘텐츠 공란 | **436건+** (98%) | FAQ 없으면 FAQPage 스키마도 불가 |
| 🟡 JA 한국어 잔류 | **21페이지, 74건** | 제목·og·본문 전방위 |
| 🟡 EN 한국어 잔류 | **3페이지, 5건** | |
| 🟡 JA thin content | **219건** (49%) | 500자 미만 |
| 🟡 번역 필드 대량 공란 | validity·fileSpec 90%+, headHeight 37% | |
| ⚪ type 필드 다국어 혼재 | 40개 고유값 (5개 언어 혼재) | |
| ⚪ size 형식 비통일 | cm/mm/inch 혼재 (34패턴) | |
| ⚪ background 비통일 | 16개 고유값, 비한국어 혼입 | |

---

## Phase 1 — 데이터 레벨 전수 검증

### 1-1. 필수 필드 공란 (총 4,236건)

| 필드 | 공란 수 | 비율 | 영향 |
|------|---------|------|------|
| seoTitle | 442/445 | 99.3% | 검색엔진 노출 타이틀 제어 불가, 자동생성으로 대체 |
| seoDescription | 442/445 | 99.3% | 메타 디스크립션 제어 불가, details 필드로 대체 |
| faqs.ko | 436/445 | 98.0% | FAQ 콘텐츠 부재 → 페이지 콘텐츠 빈약 |
| faqs.en | 438/445 | 98.4% | |
| faqs.ja | 437/445 | 98.2% | |
| validityEn | 417/445 | 93.7% | EN 페이지에서 유효기간 정보 미표시 |
| validityJa | 417/445 | 93.7% | JA 페이지에서 유효기간 정보 미표시 |
| fileSpecEn | 402/445 | 90.3% | EN 페이지에서 파일 규격 미표시 |
| fileSpecJa | 402/445 | 90.3% | JA 페이지에서 파일 규격 미표시 |
| headHeightEn | 165/445 | 37.1% | EN 페이지에서 머리 높이 정보 미표시 |
| headHeightJa | 165/445 | 37.1% | JA 페이지에서 머리 높이 정보 미표시 |
| countryJa | 26/445 | 5.8% | JA 페이지 국가명이 한국어로 노출 |
| rejectionReasons.en | 14/445 | 3.1% | EN 페이지 반려사유 미표시 |
| rejectionReasons.ja | 14/445 | 3.1% | JA 페이지 반려사유 미표시 |
| rejectionReasons.ko | 9/445 | 2.0% | KO 페이지 반려사유 미표시 |
| backgroundEn | 5/445 | 1.1% | |
| backgroundJa | 5/445 | 1.1% | |

**두 세대 데이터 공존**: 22건 레거시(korea-passport 등, 풍부)와 423건 배치 생성(kr-passport 등, 골격만). 배치 생성 시 SEO·FAQ·validity·fileSpec 번역이 생략됨.

### 1-2. 데이터 정합성

**type 필드 (40개 고유값, 5개 언어 혼재)**
- 한국어: `여권`(199), `비자`(174), `쉥겐 비자`(27), `운전면허`(6) 등
- 일본어: `パスポート`, `履歴書`, `マイナンバーカード`, `半名刺写真`, `在留カード`
- 영어: `Passport`, `Passport / Visa`, `Headshot · LinkedIn`, `EU Passport · ID`
- 중국어: `护照 · 签证`, `简历照片`
- 베트남어: `Hộ chiếu`
- → `type` 필드가 한국어 정본이어야 하나, 레거시 엔트리에서 현지어 사용

**background 필드 (16개 고유값)**
- 주력: `흰색`(417건)
- 비통일: `균일 흰색`(3), `밝은 회색`(8), `파란색`(4)
- 언어 혼입: `均一な白`(JA), `White or off-white`(EN) — 한국어 기본 필드에 외국어 진입

**size 형식 (34패턴)**
- 대다수 `cm` 단위: `3.5 × 4.5cm`(290건)
- `mm` 혼재: `35 × 45 mm`(9건) — 같은 규격을 다른 단위로 표기
- 기타: `inch` 1건, `px` 1건

**dpi**: 441건 300dpi, 3건 600dpi, 1건 `-`(korea-resume). 실질 문제 없음.
**continent**: 6값 (`africa`, `europe`, `asia`, `americas`, `oceania`, `middleeast`). 정합성 양호.
**slug 중복**: 0건.

### 1-3. 번역 교차 검증

수치·규격 번역 불일치: **0건** (채워진 필드 한정). 번역 품질 자체는 양호.

### 1-4. 한국어 잔류 (데이터 레벨)

| slug | 필드 | 잔류 텍스트 |
|------|------|------------|
| kr-visa | details.en | `출입국관리법` |
| kr-visa | details.ja | `출입국관리법` |
| kr-license | details.en | `도로교통법` |
| kr-license | details.ja | `도로교통법` |

---

## Phase 2 — 라이브 페이지 전수 검증

### 2-1. HTTP 상태

| 언어 | 검사 | 200 OK | 에러 |
|------|------|--------|------|
| KO | 445 | 445 | 0 |
| EN | 445 | 445 | 0 |
| JA | 445 | 445 | 0 |
| **합계** | **1,335** | **1,335** | **0** |

### 2-2. 한국어 잔류 (라이브 페이지)

#### EN 페이지 — 3페이지, 5건

| slug | 위치 | 잔류 텍스트 | 원인 |
|------|------|------------|------|
| uk-passport | body | `인화`, `디지털` | resolution 문자열 미번역 |
| kr-visa | body + og:description | `출입국관리법` | details.en 미번역 |
| kr-license | body + og:description | `도로교통법` | details.en 미번역 |

#### JA 페이지 — 21페이지, 74건

**패턴 ①: countryJa 미설정 → country(한국어) 폴백** (16페이지)

| 잔류 텍스트 | 해당 페이지 | 건수 |
|------------|------------|------|
| `한국` | korea-passport, korea-resume, korea-drivers-license, korea-halfcard, korea-resident | 11 |
| `유럽` | eu-passport, spain-passport, germany-resume, eu-resume, uk-passport | 20 |
| `기타 Others` | australia-, canada-, singapore-, thailand-, india-, china-, vietnam-, indonesia-passport + china-resume | 36 |

원인: 레거시 26건에 `countryJa` 미설정 → `render-specs.js:867` `(specData.countryJa || specData.country)` 폴백으로 한국어 country가 JA 제목·og:title·본문에 노출.

**패턴 ②: details 필드 내 미번역 법률명** (2페이지)

| slug | 잔류 | 위치 |
|------|------|------|
| kr-visa | `출입국관리법` | og:description + body ×2 |
| kr-license | `도로교통법` | og:description + body ×2 |

**패턴 ③: 규격 문자열 내 미번역** (1페이지)

| slug | 잔류 | 위치 |
|------|------|------|
| uk-passport | `인화`, `디지털` | body (resolution 스펙) |

### 2-3. 구조화 데이터

| 스키마 | KO 보유 | KO 미보유 | 비고 |
|--------|---------|----------|------|
| Article | 445 | 0 | 전수 정상 |
| HowTo | 445 | 0 | 전수 정상 |
| FAQPage | **9** | **436** | faqs 데이터 있는 9건만 FAQPage 발행 |

FAQPage 보유 9건: `korea-passport`, `korea-resume`, `japan-passport`, `japan-resume`, `us-passport`, `korea-drivers-license`, `japan-mynumber`, `korea-halfcard`, `korea-resident`

EN/JA도 동일 패턴 (FAQPage 유무는 faqs 데이터 유무와 연동).

### 2-4. 메타 태그·SEO 인프라

| 항목 | KO | EN | JA | 판정 |
|------|----|----|----|----|
| `<title>` | 445/445 | 445/445 | 445/445 | ✅ |
| `og:title` | 445/445 | 445/445 | 445/445 | ✅ |
| `og:description` | 445/445 | 445/445 | 445/445 | ✅ |
| canonical (자기참조) | 445/445 | 445/445 | 445/445 | ✅ |
| hreflang (ko/en/ja/x-default) | 445/445 | 445/445 | 445/445 | ✅ |

### 2-5. 콘텐츠 품질

| 항목 | KO | EN | JA |
|------|----|----|-----|
| Thin content (<500자) | 0 | 0 | **219건 (49%)** |
| 중복 콘텐츠 | 0 | 0 | 0 |

JA thin content 원인: 번역 필드(validity, fileSpec, headHeight) 90%+ 공란 → JA 페이지 본문이 규격 카드만으로 구성, 산문 콘텐츠 부족.

---

## Phase 3 — 색인 장애 요인 분석

### 3-1. 색인 거부 가능 원인 분류

#### 🔴 즉시 수정 (색인 품질 직결)

| # | 원인 | 영향 범위 | 설명 |
|---|------|----------|------|
| R1 | **FAQPage 구조화 데이터 미발행** | 436건 × 3언어 = 1,308 URL | faqs 데이터 없어서 FAQPage 스키마 생성 불가. FAQ 리치결과 자격 박탈. 구글이 "thin structured data"로 판단 가능 |
| R2 | **seoTitle/seoDescription 미설정** | 442건 × 3언어 = 1,326 URL | 자동생성 타이틀(`2026 {국가} {유형} 규격 — ...`)이 동일 패턴 반복 → 구글이 boilerplate로 판단 가능 |
| R3 | **JA 한국어 잔류 (제목·og)** | 21페이지 | `<title>`과 `og:title`에 `한국`/`유럽`/`기타` 한국어 노출 → 구글이 언어 불일치로 JA 색인 거부 가능. hreflang 신뢰도 하락 |
| R4 | **EN/JA 한국어 잔류 (본문)** | EN 3건 + JA 2건 | 법률명·규격 문자열 미번역 → 언어 혼재 시그널 |

#### 🟡 개선 권장 (콘텐츠 품질 영향)

| # | 원인 | 영향 범위 | 설명 |
|---|------|----------|------|
| Y1 | **JA thin content** | 219건 (49%) | 500자 미만. 번역 필드 공란이 원인. "Discovered — currently not indexed" 판정 가능 |
| Y2 | **validityEn/Ja 93.7% 공란** | 417건 × 2언어 = 834 URL | 유효기간 정보 미표시 → 콘텐츠 불완전 |
| Y3 | **fileSpecEn/Ja 90.3% 공란** | 402건 × 2언어 = 804 URL | 파일 규격 미표시 |
| Y4 | **headHeightEn/Ja 37.1% 공란** | 165건 × 2언어 = 330 URL | 머리 높이 정보 미표시 |
| Y5 | **FAQ 콘텐츠 98% 공란** | 436건 × 3언어 | FAQ 없으면 페이지 깊이(depth) 부족 → 색인 우선순위 하락 |

#### ⚪ 참고 (색인 직접 영향 낮음)

| # | 원인 | 설명 |
|---|------|------|
| W1 | `type` 필드 다국어 혼재 (40값) | 렌더링 시 `typeEn`/`typeJa` 사용하므로 라이브 영향 제한적. 데이터 정돈 차원 |
| W2 | `background` 비통일 (16값) | 동일. `backgroundEn`/`backgroundJa` 폴백 시 비한국어 표기 노출 가능 |
| W3 | `size` 형식 혼재 (cm/mm) | 사용자 혼란 가능. 색인 영향 없음 |
| W4 | countryJa 26건 미설정 | R3의 근본 원인. countryJa 보충하면 R3 해결 |
| W5 | backgroundEn/Ja 5건 미설정 | 레거시 일본 엔트리 |
| W6 | rejectionReasons 9~14건 공란 | 소수. 보충 권장 |

### 3-2. 근본 원인 진단

**1,335페이지 중 "URL is unknown to Google"이 대다수인 핵심 원인:**

1. **콘텐츠 차별화 부족**: 445건 × 3언어가 동일 템플릿에서 생성. seoTitle이 `2026 {국가} {유형} 규격 — サイズ・背景・服装 完全ガイド | MONKOS` 패턴 반복 → 구글이 "similar thin pages" 판정
2. **FAQ 부재로 페이지 깊이 부족**: FAQ가 있는 9건은 콘텐츠 양이 충분하나, 나머지 436건은 규격 스펙 카드만 존재 → thin content 판정 경계
3. **일본어 페이지 언어 혼재**: 21페이지 제목에 한국어 → hreflang 신뢰도 저하 → 해당 국가 클러스터 전체의 JA 색인 우선순위 하락 가능

### 3-3. 수정 우선순위 권고

| 순위 | 작업 | 영향 | 난이도 |
|------|------|------|--------|
| 1 | **countryJa 26건 보충** (R3·W4 해결) | JA 21페이지 제목 한국어 즉시 제거 | 데이터 수정 (10분) |
| 2 | **한국어 잔류 5건 번역** (R4 해결) | EN/JA 법률명·규격 문자열 번역 | 데이터 수정 (10분) |
| 3 | **FAQ 3언어 대량 생성** (R1·Y5 해결) | 436건 × 3언어 FAQPage 스키마 활성화 + 콘텐츠 깊이 확보 | 대규모 (스크립트 생성) |
| 4 | **seoTitle/seoDescription 3언어 생성** (R2 해결) | 1,326 URL 고유 타이틀 확보 | 대규모 (스크립트 생성) |
| 5 | **validity·fileSpec EN/JA 번역 보충** (Y2·Y3 해결) | 834+804 URL 콘텐츠 보강, JA thin content 해소 | 중규모 |
| 6 | **type·background 한국어 정규화** (W1·W2 해결) | 데이터 정합성 향상 | 중규모 |

---

## 산출물

- 본 보고서: `monkos-ops/ops/reports/2026-06/REPORT_20260615_iMac막내3_SPECS_1335페이지_전수품질감사.md`
- Phase 1 상세 JSON: `/tmp/phase1_audit_results.json` (134KB)
- Phase 2 KO 결과: `/tmp/phase2_ko_results.json`
- Phase 2 EN 결과: `/tmp/phase2_en_results.json`
- Phase 2 JA 결과: `/tmp/phase2_ja_results.json`

---

**[2026-06-15 14:30 KST]** iMac/막내3 → 작가님
