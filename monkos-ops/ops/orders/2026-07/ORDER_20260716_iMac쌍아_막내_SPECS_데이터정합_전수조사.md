---
type: order
date: 2026-07-16
device: iMac
agent: 쌍아
recipient: 막내1
portfolio: PF_SPECS
subject: SPECS 전수조사 — 데이터 정합 + URL 형식 혼재 + 색인 중복 색출
status: 발행
supersedes: ORDER_20260714_M1쌍아_막내3_SPECS_seoTitle_P0수정3건.md
revision: 2 (12:52 KST — URL/색인 축 F·G·H 추가, 스코프 확장)
---

# SPECS 전수조사 — 데이터 정합 + URL/색인 정합

**[2026-07-16 11:59 KST]** iMac/쌍아 → 막내1
**[2026-07-16 12:52 KST]** 개정 — URL/색인 축 추가 (작가님 지시, GSC 실측 근거)

---

## 배경

### 데이터 결함 (쌍아 7/16 실측)

| 결함 | 건수 | 예시 |
|------|------|------|
| countryEn이 slug 국가코드와 불일치 | 2건 확정 | uk-passport → countryEn="Europe" (정답: United Kingdom) |
| seoTitle.en에 타국명/EU명 혼입 | 2건 확정 | de-resume → "Europe Application Photo..." |
| widthMm/heightMm = None (규격 미입력) | 다수 추정 | 전수 파악 필요 |
| EU 공통 페이지 vs 개별국 페이지 중복 | 미파악 | eu-passport ↔ 유럽 개별국 passport |

### URL/색인 결함 (쌍아+GSC 7/16 실측)

구글에 **3가지 URL 형식이 동시 색인**되어 크롤 예산 낭비 + 검색 자산 분산:

| URL 형식 | 예시 | GSC 노출 | 비고 |
|----------|------|----------|------|
| 구 전체국명 1-segment | `/specs/korea-passport` | **412회** | 정본의 6.6배 노출 |
| 구 ISO 1-segment | `/en/specs/ae-id`, `/ja/specs/fr-visa` | 다수 | EN 대부분이 이 형식 |
| 현 정본 2-segment | `/specs/passport/kr` | 62회 | 사이트맵 정본 |
| 구 전체국명 2-segment | `/ja/specs/passport/japan` | **164회** | ISO가 아닌 전체명 |

- 사이트맵에는 정본(2-segment)만 제출하고 있고, 301 리다이렉트도 걸려 있음.
- 그러나 구글이 구 URL을 canonical로 계속 들고 있어 이전이 지연 중.
- `/specs/korea-passport`(412노출)이 `/specs/passport/kr`(62노출)보다 6배 이상 노출 — 검색 자산이 구 URL에 묶여 있음.

기존 `ORDER_20260714_M1쌍아_막내3_SPECS_seoTitle_P0수정3건.md`은 본 지시서에 흡수.

---

## ⚠️ 준수 조항

- 데이터 수정: `specs-data.json`만. 렌더러·서버 코드 무접촉.
- URL/색인 조사: **코드 수정 없음. 조사+보고만.** 수정은 별도 지시.
- 수정 전 원본 백업: `cp specs-data.json specs-data.json.bak`
- seoTitle 수정 시 기존 SEO 자산 보호 — 국가명 교체 외 구조 변경 금지.
- ko/ja seoTitle이 정상이면 무접촉. 오류인 필드만 수정.
- 배포: dev까지. prod는 작가님 승인 후 별도.

---

## 작업 항목 — 데이터 정합 (A~E)

### A. countryEn / country 정합 전수 검사

428 슬러그 전체를 순회하여:

1. **slug 국가코드 ↔ countryEn 매칭**: slug 앞 2~3자리에 해당하는 영문 국가명이 countryEn에 있는지.
   - 허용 변형: US/United States, UK/United Kingdom, UAE/United Arab Emirates 등 약어 정상.
   - 불일치 기준: slug=`uk-*`인데 countryEn="Europe" → 불일치.
2. **country(ko) ↔ countryEn 교차 검증**: country="영국"인데 countryEn="Europe" → 불일치.
3. **eu- 슬러그는 정상**: eu-passport 등은 countryEn="Europe"/"European Union" 정상.

**산출물**: 불일치 목록 테이블 (slug, 현재 countryEn, 현재 country, 정답 countryEn)

### B. seoTitle 3언어 정합 전수 검사

428 × 4언어(ko/en/ja/es) seoTitle 전수:

1. **국가명 일관성**: seoTitle.en에 countryEn(또는 약어) 포함 여부.
2. **ko/ja에서 국가명 확인**: seoTitle.ko에 country(한국어 국가명) 포함 여부.
3. **EU/개별국 혼동**: eu- 아닌 슬러그의 seoTitle에 "Europe"/"EU"/"유럽" 포함 → 불일치.

**산출물**: 불일치 목록 테이블 (slug, 언어, 현재 seoTitle, 문제점, 수정안)

### C. EU 공통 ↔ 개별국 중복 분석

1. eu-passport/eu-visa/eu-resume/eu-license 4건 vs 유럽 개별국 동일 type 비교.
2. 비교 필드: widthMm, heightMm, dpi, bgColor, fileFormat, maxFileSizeMb, details, rejectionReasons.
3. **규격 동일 + 데이터 차별화 없음** → 중복 후보로 보고 (삭제 판단은 작가님).
4. **규격 다름 or 고유 데이터 있음** → 정당한 개별 페이지로 보고.

**산출물**: EU 중복 매트릭스 (slug, EU와 동일 여부, 차별 필드, 판정)

### D. widthMm / heightMm / bgColor 결번 전수 파악

428 전체에서 None 또는 미존재인 필드 색출:
widthMm, heightMm, widthPx, heightPx, bgColor, dpi

**산출물**: 결번 목록 테이블 + 통계 요약 (전체 중 몇 건 결번, type별 분포)

### E. 확정 수정 반영 (데이터)

A~D 중 **명백한 오류**만 즉시 수정:
1. countryEn 불일치 수정 (A 결과)
2. seoTitle 국가명 불일치 수정 (B 결과)
3. widthMm/heightMm 결번은 **수정 금지** — 보고만 (M1 전수감사 영역)
4. EU 중복은 **수정 금지** — 보고만 (작가님 판단 사안)

---

## 작업 항목 — URL/색인 정합 (F~H)

### F. URL 형식 전수 카탈로그

specs 페이지가 실제로 응답하는 **모든 URL 경로**를 색출한다. 코드 기반 정적 분석:

1. **ROUTE_MAP** (render-specs.js): 428 슬러그 → 2-segment 정본 경로 매핑 전수 출력.
2. **REDIRECT_MAP**: 구 슬러그 → 정본 경로 301 매핑 전수 출력.
3. **COUNTRY_SLUG_TO_ISO** (render-specs.js:95~100): 전체 국가명→ISO 변환 테이블 전수 출력.
4. **TYPE_ALIASES** (render-specs.js:108~114): 구 type→신 type 변환 테이블 전수 출력.
5. **4언어 프리픽스**: ko(없음), /ja/, /en/, /es/ × 위 전체 = 총 URL 수 산출.

**산출물**:
- 총 URL 수 (정본 + 301 대상 + 언어 분기)
- COUNTRY_SLUG_TO_ISO에 **미등재 전체 국가명** 목록 (301 누락 후보)
- TYPE_ALIASES에 **미등재 구 type** 목록 (301 누락 후보)

### G. GSC 색인 현황 vs 정본 대조

GSC MCP를 사용하여 실측:

1. `search_analytics` — dimensions=page, pageFilter="specs" contains, 7/1~7/16, rowLimit=25000.
2. 결과 URL을 분류:
   - **정본(2-segment)**: `/specs/passport/kr`, `/en/specs/visa/us` 등
   - **구 ISO 1-segment**: `/specs/kr-passport`, `/en/specs/ae-id` 등
   - **구 전체국명 1-segment**: `/specs/korea-passport` 등
   - **구 전체국명 2-segment**: `/ja/specs/passport/japan` 등
   - **기타 미분류**: 위에 해당 안 되는 URL
3. 각 분류별: URL 수, 총 노출, 총 클릭, 평균 순위.
4. **정본과 구 URL이 같은 페이지를 가리키는 쌍** 식별 (예: `/specs/korea-passport` ↔ `/specs/passport/kr`).

**산출물**: 색인 현황 분류 테이블 + 중복 쌍 목록 + 분류별 통계

### H. 301 커버리지 갭 분석

F와 G를 교차하여:

1. **GSC에 노출되는 구 URL 중 301이 안 걸리는 것**: canonicalCountry에 미등재 국가명, TYPE_ALIASES에 미등재 type, 또는 라우팅 로직이 catch하지 못하는 패턴.
2. **301이 걸리지만 구글이 아직 이전 안 한 것**: 구 URL 노출이 정본보다 높은 케이스 (이건 시간 문제이므로 보고만).
3. **잠재적 301 루프나 404 빠짐**: 구 URL 접근 시 의도와 다른 응답이 나오는 케이스.

검증 방법: 대표 구 URL 10건 이상 curl -I로 실제 301 응답 + Location 헤더 확인.

**산출물**: 301 갭 목록 (구 URL, 현재 응답코드, Location 헤더, 정본 URL, 판정)

---

## 완료 기준

- [ ] A: countryEn 불일치 목록 + 수정 반영
- [ ] B: seoTitle 4언어 불일치 목록 + 국가명 오류 수정 반영
- [ ] C: EU 중복 매트릭스 보고
- [ ] D: 규격값 결번 통계 + 목록 보고
- [ ] E: 수정분 dev 배포 + curl 3건 이상 샘플 검증
- [ ] F: URL 형식 전수 카탈로그 + 미등재 국가명/type 목록
- [ ] G: GSC 색인 현황 분류 + 중복 쌍 목록 + 통계
- [ ] H: 301 커버리지 갭 목록 + curl 10건 이상 실측
- [ ] COMPLETION 보고서: `monkos-ops/ops/reports/2026-07/COMPLETION_20260716_{디바이스}{에이전트}_SPECS_전수조사.md`
- [ ] 커밋 + 푸시
- [ ] PF_SPECS 히스토리 1행 어펜드

---

## 참조

- 쌍아 GSC 실측 원본 (7/1~7/16, page dimension, "specs" contains) — 본 지시서 배경란
- render-specs.js: ROUTE_MAP(138), REDIRECT_MAP(139), COUNTRY_SLUG_TO_ISO(95), TYPE_ALIASES(108), canonicalCountry(102), renderSpecsDetail(1028)
- render-sitemap.js: renderSitemapSpecs(120) — seen Set으로 정본만 제출 확인
- `ORDER_20260714_M1민아_막내1_SPECS_전수감사_정밀리서치.md` — 별개 축(규정 리서치). 본 지시서와 겹치지 않음.
