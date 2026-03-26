---
type: order
date: 2026-03-25 07:18 KST
from: M1/쌍아
to: 막내2
priority: P0
scope: PETITION_20260325_쌍아_ch4_PROPOSAL유형등록 — 영향평가 (법률 정합성 관점)
completion_level: 2
---

# 지시서: PROPOSAL 유형 등록 영향평가 — 법률 정합성 (막내2)

> **[2026-03-25 07:18 KST] M1/쌍아 → 막내2**

---

## 배경

청구안 `PETITION_20260325_쌍아_ch4_PROPOSAL유형등록` 에 대한 영향평가.
막내2는 **법률 정합성 관점**에서 평가한다.

## 청구안 요약

1. ch4 3조: 패턴 #15 `PROPOSAL_YYYYMMDD_{topic}.md` 신설
2. ch4 4조: 정본 `ops/proposals/YYYY-MM/` + 월별 이관·루트 배치 금지 적용
3. ch4 7조: type `proposal` + 필수 필드 `from`, `scope`
4. 부수: 기존 14건 → `2026-03/` 이동

## 평가 항목

### A. 헌법 충돌 점검

1. 헌법 7개 조 중 본 개정과 충돌하는 조항이 있는지
2. 특히 헌법 1조 3항(문서 규격), 7조 2항(법률 개정 절차)과의 정합성

### B. 법률 간 충돌 점검

1. ch4 내 다른 조항과의 충돌 — 특히 2조(금지 사항), 6조(확장 절차)와 정합성
2. ch4 6조 5항(파일유형 편입 절차) 4단계를 본 청구안이 충족하는지:
   - ① 3조 패턴 테이블에 행 추가 ✓?
   - ② 필드 허용값 정의 ✓?
   - ③ 대상 폴더 지정 ✓?
   - ④ 7조 YAML — type 허용값 등록 + 타입별 필수 필드 정의 ✓?
3. ch1(에이전트 체계), ch3(세션 로그), ch7(막내 행동강령)에 파급 효과가 있는지
4. PROPOSAL이 ORDER와 혼동될 여지 — 경계 정의가 충분한지

### C. 필수 필드 적절성

1. `from`(필수) + `scope`(필수) + `to`(선택) 구성이 적절한지
2. 다른 유형의 필수 필드 패턴과 일관성이 있는지
   - order: from, to, priority
   - report: from, to, task_id, result
   - petition: from, to, category, procedure
3. PROPOSAL에 `to`가 선택인 근거가 타당한지
4. `ref`(선택) 외에 추가 필요한 필드가 있는지

### D. IMPACT_ 유형 미등록 판단

1. 청구안에서 IMPACT_ 유형을 "현행 유지(별도 등록 불요)"로 판단했는데 이것이 적절한지
2. IMPACT_ 2건의 위치(petitions/)와 역할이 법률 체계와 정합하는지

## 산출물

- 영향평가 보고서: `governance/constitution/petitions/IMPACT_20260325_막내2_PROPOSAL유형등록.md`
- 판정: approve / conditional / reject + 근거

## 완료 조건

- 평가 항목 A~D 전부 응답
- 보정 필요 사항이 있으면 구체적 조문 수정안 기재
