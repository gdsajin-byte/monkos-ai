---
type: order
date: 2026-03-25 07:18 KST
from: M1/쌍아
to: 막내1
priority: P0
scope: PETITION_20260325_쌍아_ch4_PROPOSAL유형등록 — 영향평가 (문서 구조 관점)
completion_level: 2
---

# 지시서: PROPOSAL 유형 등록 영향평가 — 문서 구조 (막내1)

> **[2026-03-25 07:18 KST] M1/쌍아 → 막내1**

---

## 배경

청구안 `PETITION_20260325_쌍아_ch4_PROPOSAL유형등록` 에 대한 영향평가.
막내1은 **문서 구조 관점**에서 평가한다.

## 청구안 요약

1. ch4 3조: 패턴 #15 `PROPOSAL_YYYYMMDD_{topic}.md` 신설
2. ch4 4조: 정본 `ops/proposals/YYYY-MM/` + 월별 이관·루트 배치 금지 적용
3. ch4 7조: type `proposal` + 필수 필드 `from`, `scope`
4. 부수: 기존 14건 → `2026-03/` 이동

## 평가 항목

### A. 기존 문서와의 충돌

1. `ops/proposals/` 현재 구조 확인 — flat 14건의 파일명이 패턴 #15에 부합하는지
2. 기존 14건 중 PROPOSAL_ 접두사가 아닌 파일이 있는지
3. 다른 위치(ops/reports/, ops/orders/, ops/agenda/ 등)에 PROPOSAL_ 접두사 파일이 산재하는지

### B. 정본 테이블 정합성

1. 4조 정본 테이블에서 proposals/와 역할이 겹치는 기존 행이 있는지
2. AGENDA_/RESEARCH_와 PROPOSAL_의 경계가 명확한지 (같은 폴더에 들어가는 것 아닌지)
3. 월별 서브폴더 도입 시 README.md 생성 의무(2조 7항) 충족 방안

### C. YAML 규격 정합성

1. 기존 14건의 YAML frontmatter 현황 — type 필드가 있는지, 어떤 값인지
2. 신규 필수 필드 `from`, `scope`가 기존 파일에 존재하는지
3. 7조 검증 규칙(`from` 값이 ch1 에이전트 테이블에 있는지) 적용 가능성

### D. 코드/자동화 영향

1. PROPOSAL_ 패턴을 참조하는 코드가 있는지 grep
2. ch4 패턴을 파싱하는 스크립트가 있는지 (scripts/ 확인)
3. .gitignore 등 영향 없는지

## 산출물

- 영향평가 보고서: `governance/constitution/petitions/IMPACT_20260325_막내1_PROPOSAL유형등록.md`
- 판정: approve / conditional / reject + 근거

## 완료 조건

- 평가 항목 A~D 전부 응답
- 보정 필요 사항이 있으면 구체적 보정안 기재
