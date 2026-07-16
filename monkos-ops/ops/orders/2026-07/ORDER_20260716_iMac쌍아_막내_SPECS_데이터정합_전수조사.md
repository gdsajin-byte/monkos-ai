---
type: order
date: 2026-07-16
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_SPECS
subject: SPECS 428 데이터 정합 전수조사 — 슬러그·국가명·seoTitle·규격값·EU중복
status: 발행
supersedes: ORDER_20260714_M1쌍아_막내3_SPECS_seoTitle_P0수정3건.md
---

# SPECS 428 데이터 정합 전수조사

**[2026-07-16 11:59 KST]** iMac/쌍아 → 막내

---

## 배경

쌍아 사전 실측(7/16)에서 발견된 데이터 결함:

| 결함 | 건수 | 예시 |
|------|------|------|
| countryEn이 slug 국가코드와 불일치 | 2건 확정 | uk-passport → countryEn="Europe" (정답: United Kingdom) |
| seoTitle.en에 타국명/EU명 혼입 | 2건 확정 | de-resume → "Europe Application Photo..." |
| widthMm/heightMm = None (규격 미입력) | 다수 추정 | 전수 파악 필요 |
| EU 공통 페이지 vs 개별국 페이지 중복 | 미파악 | eu-passport ↔ 유럽 개별국 passport |

기존 `ORDER_20260714_M1쌍아_막내3_SPECS_seoTitle_P0수정3건.md`은 본 지시서에 흡수. 기존 M1 전수감사 지시서(규정 리서치 축)와는 별개 축(데이터 정합).

---

## ⚠️ 준수 조항

- `specs-data.json`만 수정 대상. 렌더러·서버 코드 무접촉.
- 수정 전 원본 백업: `cp specs-data.json specs-data.json.bak`
- seoTitle 수정 시 기존 SEO 자산(검색 순위) 보호 원칙 — 국가명 교체 외 구조 변경 금지.
- ko/ja seoTitle이 정상이면 무접촉. 오류인 필드만 수정.
- 배포: dev까지. prod 배포는 작가님 승인 후 별도.

---

## 작업 항목

### A. countryEn / country 정합 전수 검사

428 슬러그 전체를 순회하여 아래 검사 수행:

1. **slug 국가코드 ↔ countryEn 매칭**: slug 앞 2~3자리(국가코드)에 해당하는 영문 국가명이 countryEn에 들어가 있는지 확인.
   - 허용 변형: US/United States, UK/United Kingdom, UAE/United Arab Emirates 등 약어는 정상.
   - 불일치 기준: slug=`uk-*`인데 countryEn="Europe" → 불일치.
2. **country(ko) ↔ countryEn 교차 검증**: country="영국"인데 countryEn="Europe"이면 불일치.
3. **eu- 슬러그는 정상**: eu-passport, eu-visa 등은 countryEn="Europe"/"European Union"이 정상.

**산출물**: 불일치 목록 테이블 (slug, 현재 countryEn, 현재 country, 정답 countryEn)

### B. seoTitle 3언어 정합 전수 검사

428 × 3언어(ko/en/ja) + es(있는 경우) seoTitle 전수 검사:

1. **국가명 일관성**: seoTitle.en에 countryEn(또는 약어)이 포함되어 있는지.
   - 불일치 예: uk-passport의 seoTitle.en에 "Europe"이 포함 → countryEn 불일치와 연동.
2. **ko/ja에서 국가명 확인**: seoTitle.ko에 country(한국어 국가명)가 포함되어 있는지.
3. **EU/개별국 seoTitle 혼동**: eu- 아닌 슬러그의 seoTitle에 "Europe"/"EU"/"유럽" 포함 → 불일치.
4. **us-passport ko "비자" 제거 확인**: 이미 수정 완료 확정(쌍아 실측). 재확인만.

**산출물**: 불일치 목록 테이블 (slug, 언어, 현재 seoTitle, 문제점, 수정안)

### C. EU 공통 ↔ 개별국 중복 분석

1. eu-passport/eu-visa/eu-resume/eu-license 4건 vs 유럽 개별국(uk/de/fr/it/es/nl/at/ch/be/se/no/dk/fi/pt/ie/pl/cz/hu/gr) 동일 type 페이지 비교.
2. 비교 필드: widthMm, heightMm, dpi, bgColor, fileFormat, maxFileSizeMb.
3. **규격 동일 + 데이터 차별화 없음** → 중복 후보로 보고 (삭제 판단은 작가님).
4. **규격 다름 or 고유 데이터 있음** → 정당한 개별 페이지로 보고.

**산출물**: EU 중복 매트릭스 (slug, EU와 동일 여부, 차별 필드, 판정)

### D. widthMm / heightMm / bgColor 결번 전수 파악

428 전체에서:

1. widthMm = None 또는 미존재
2. heightMm = None 또는 미존재
3. bgColor = None 또는 미존재
4. dpi = None 또는 미존재

**산출물**: 결번 목록 테이블 (slug, 결번 필드들, 현재 type). 통계 요약 (전체 중 몇 건 결번).

### E. 확정 수정 반영

A~D 조사 결과 중 **명백한 오류**만 즉시 수정:

1. countryEn 불일치 수정 (A 결과)
2. seoTitle 국가명 불일치 수정 (B 결과, A와 연동)
3. widthMm/heightMm 결번은 **수정하지 않음** — 정답 데이터가 없으므로 보고만. (M1 전수감사 정밀리서치 지시서의 영역)
4. EU 중복은 **수정하지 않음** — 보고만. (작가님 판단 사안)

---

## 완료 기준

- [ ] A: countryEn 불일치 목록 완성 + 수정 반영
- [ ] B: seoTitle 3언어 불일치 목록 완성 + 국가명 오류 수정 반영
- [ ] C: EU 중복 매트릭스 보고서
- [ ] D: 규격값 결번 통계 + 목록 보고서
- [ ] E: 수정분 dev 배포 + curl 3건 이상 샘플 검증 (uk-passport, de-resume + 랜덤 1건)
- [ ] COMPLETION 보고서: `monkos-ops/ops/reports/2026-07/COMPLETION_20260716_{디바이스}{에이전트}_SPECS_데이터정합전수조사.md`
- [ ] 커밋 + 푸시
- [ ] PF_SPECS 히스토리 1행 어펜드

---

## 참조 문서

- 쌍아 사전 실측 결과 (본 지시서 배경란)
- `ORDER_20260714_M1민아_막내1_SPECS_전수감사_정밀리서치.md` — 별개 축(규정 리서치). 본 지시서와 겹치지 않음.
- `REPORT_20260714_M1막내3_SPECS_헤드텀구조화데이터_전수검수.md` — seoTitle P0 3건 원천.
