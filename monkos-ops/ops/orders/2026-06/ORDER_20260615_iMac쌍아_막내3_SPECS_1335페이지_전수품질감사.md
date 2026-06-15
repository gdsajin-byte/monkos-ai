---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내3
subject: "specs 1,335페이지(445×3언어) 전수 품질 감사 — 데이터 정합성·오류·색인 장애 요인 완전 파악"
status: 발행
portfolio: PF_SPECS
priority: 즉시
---

# 지시서 — specs 1,335페이지 전수 품질 감사

> **[2026-06-15 14:18 KST] iMac/쌍아 → iMac/막내3**
> 작가님 지시: 워크플로우 기능을 사용하여 페이지마다 완벽하게 파악할 것.
> 배경: 사이트맵에 1,335건 제출했으나 구글 색인 극소수. "URL is unknown to Google" 상태가 대다수. 페이지 품질 자체에 문제가 있는지 전수 확인 필요.

---

## 배경

- specs-data.json: 445건 (207개국 × 문서유형)
- 3언어 서빙: `/specs/{type}/{country}` (ko) · `/en/specs/...` · `/ja/specs/...`
- 총 1,335 URL → 사이트맵 등록 완료
- 구글 색인: 한국 여권 등 극소수만 색인, 나머지 "unknown to Google"
- 구조화 데이터(Article·HowTo·FAQPage): 코드상 달려있으나 실제 품질 미검증

---

## 임무 — 워크플로우(Workflow) 활용 필수

### Phase 1 — 데이터 레벨 전수 검증

specs-data.json 445건을 전수 스캔. 워크플로우로 병렬 처리.

**검증 항목:**

1. **필수 필드 공란 체크**
   - `country`, `size`, `background`, `type`, `slug`, `continent` — 하나라도 비어있는 건 목록화
   - `countryEn`, `countryJa` — 비어있으면 EN/JA 페이지에서 국가명이 한국어로 노출

2. **데이터 정합성**
   - `size` 형식 통일 여부 (mm/cm/inch 혼재 패턴)
   - `background` 값 일관성 (같은 의미를 다르게 표기 — "흰색" vs "균일 흰색" vs "White" 등)
   - `slug` 중복 체크
   - `type` 표기 통일 (같은 여권인데 "여권" / "Passport" / "パスポート" 혼재)

3. **번역 데이터 교차 검증**
   - `backgroundEn` / `backgroundJa` — 한국어 원문과 의미 불일치 있는지
   - `validityEn` / `validityJa` — 동일
   - `headHeightEn` / `headHeightJa` — 동일
   - EN/JA 값이 있는데 한국어와 명백히 다른 것 (오역·오타)

4. **한국어 잔류 검출**
   - EN/JA 전용 필드에 한국어 문자가 포함된 건 전수 검출

### Phase 2 — 라이브 페이지 레벨 전수 검증

prod URL을 실제로 curl하여 검증. **워크플로우로 병렬 처리.**

445건 × 3언어 = 1,335 URL 전수. 각 URL에서:

1. **HTTP 상태** — 200이 아닌 건 목록화 (404, 500, 301 등)

2. **한국어 노출 검출 (EN/JA 페이지)**
   - EN 페이지 body에서 한국어 문자(가-힣) 검출
   - JA 페이지 body에서 한국어 문자 검출
   - 검출 시 해당 텍스트와 위치 기록

3. **구조화 데이터 검증**
   - `application/ld+json` 블록 존재 여부
   - Article: `headline` 언어 일치, `inLanguage` 값 정확
   - HowTo: step text 언어 일치 (EN 페이지에 한국어 step 없는지)
   - FAQPage: 있으면 Q&A 언어 일치

4. **메타 태그 검증**
   - `<title>` 언어 일치
   - `og:title`, `og:description` 언어 일치
   - canonical URL 존재 및 자기참조 여부
   - hreflang 태그 존재 여부

5. **콘텐츠 품질**
   - 페이지 body 텍스트 길이 — 극단적으로 짧은 건(thin content) 목록화
   - 동일 콘텐츠 복붙 여부 — 서로 다른 국가인데 body가 동일한 건 검출

### Phase 3 — 색인 장애 요인 분석

Phase 1·2 결과를 종합하여:

1. **색인 거부 가능 원인 분류**
   - thin content (본문 너무 짧음)
   - 중복 콘텐츠 (국가만 다르고 내용 동일)
   - 메타 태그 누락
   - canonical/hreflang 미설정
   - 기타 기술적 장애

2. **심각도별 분류** — 🔴 즉시 수정 / 🟡 개선 권장 / ⚪ 참고

---

## 워크플로우 실행 가이드

```
Phase 1 "데이터 감사" — specs-data.json 445건 스캔 (단일 에이전트 가능)

Phase 2 "라이브 감사" — parallel:
  각 언어별로 분할 (ko 445 / en 445 / ja 445)
  또는 대륙별 분할 (africa 108 / europe 107 / asia 96 / americas 72 / oceania 33 / middleeast 29)
  curl로 실측, 결과 집계

Phase 3 "종합 분석" — Phase 1+2 결과 합산, 분류, 보고서 작성
```

### prod URL 패턴

```
ko: https://monkos.ai/specs/{type}/{country-slug}
en: https://monkos.ai/en/specs/{type}/{country-slug}
ja: https://monkos.ai/ja/specs/{type}/{country-slug}

type = passport | visa | resume | drivers-license 등
country-slug = specs-data.json의 slug에서 type 접미사 제거 후 추출
  예: slug "br-passport" → type "passport", country "br"
      slug "korea-passport" → type "passport", country "korea"
      slug "us-visa" → type "visa", country "us"
```

---

## 산출물

1. **감사 보고서**: `REPORT_20260615_iMac막내3_SPECS_1335페이지_전수품질감사.md`
   - Phase 1 데이터 레벨 이상 건 전체 목록
   - Phase 2 라이브 레벨 이상 건 전체 목록
   - Phase 3 색인 장애 요인 분류 + 심각도별 집계
   - `monkos-ops/ops/reports/2026-06/` 배치

2. **이상 건 CSV** (선택): 대량이면 별도 CSV로 정리

3. **PF_SPECS 히스토리 1행 어펜드**

4. **커밋**

---

## ⚠️ 준수 조항

- 읽기 전용 감사 — 코드·데이터 수정 금지. 발견 사항은 보고만
- prod에 과도한 부하 금지 — curl 병렬 시 적절한 간격 유지 (100ms+ 딜레이)
- 헌법 4조 2항: 파괴적 명령 금지
