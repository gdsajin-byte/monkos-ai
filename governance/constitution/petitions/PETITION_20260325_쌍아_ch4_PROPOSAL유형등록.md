---
type: petition
id: PETITION_20260325_쌍아_ch4_PROPOSAL유형등록
date: 2026-03-25 07:17 KST
from: M1/쌍아
to: 작가님
status: pending
category: 법률개정
procedure: 쌍아+작가님 합의 (법률 개정 — 헌법 7조 2항)
tags: [ch4, PROPOSAL, 파일유형, 문서체계]
---

# 개정 청구안: ch4 PROPOSAL 유형 등록

> **[2026-03-25 07:17 KST] M1/쌍아 → 작가님**

---

## 1. 청구 사유

문서 생애주기의 시작점인 기안서(PROPOSAL_)가 ch4에 미등록 상태.

```
PROPOSAL_(기안) → ORDER_(지시) → 실행 → REPORT_/COMPLETION_(보고) → 정착
```

ORDER_ 458건, REPORT_ 176건, COMPLETION_ 53건은 전부 등록되어 있으나,
그 출발점인 PROPOSAL_ 14건(민아 6건 포함)이 3조·4조·7조 어디에도 없다.

- 정본 위치 미정의 → `ops/proposals/` flat으로 산재
- YAML type 미등록 → 자동 분류 불가
- 월별 서브폴더 미적용 → ch4 4조 원칙 위반 상태

---

## 2. 개정 대상

법률 제4장 3개 조항.

### 2-1. 3조 패턴 #15 신설

| # | 패턴 | 대상 폴더 | 예시 |
|---|------|----------|------|
| 15 | `PROPOSAL_YYYYMMDD_{topic}.md` | `monkos-ops/ops/proposals/YYYY-MM/` | `PROPOSAL_20260322_민아_monkosAI_메인페이지_리디자인.md` |

### 2-2. 4조 정본 테이블 행 추가

| 영역 | 정본 위치 | 아카이브 | 비고 |
|------|----------|---------|------|
| **기안서 (PROPOSAL)** | `monkos-ops/ops/proposals/YYYY-MM/` | — | 문서 생애주기 기점. 신설 |

4조 월별 이관 원칙 적용 대상에 `proposals/` 추가:
> orders/, reports/, sessions/, incidents/, designs/, **proposals/** 는 YYYY-MM/ 서브폴더를 사용한다.

4조 루트 배치 금지 적용 대상에 `proposals/` 추가:
> sessions/, reports/, orders/, **proposals/** 루트에 직접 파일을 배치하지 않는다.

### 2-3. 7조 type 허용값 + 필수 필드 추가

**type 허용값**: 기존 11종 → 12종
> order, report, spec, incident, design, sprint, petition, research, completion, review, agenda, **proposal**

**타입별 추가 필수 필드**:

| 타입 | 필수 | 선택 |
|------|------|------|
| proposal | `from`, `scope` | `to`, `priority`, `ref`, `tags` |

- `from`: 기안 발의자
- `scope`: 기안 범위 (1줄 요약)
- `to`: 수신자 (작가님 또는 특정 에이전트). 기안서 특성상 수신자가 불특정일 수 있어 선택
- `ref`: 관련 어젠다/지시서 참조

---

## 3. 부수 정비

### 3-1. 기존 14건 월별 이동

현재 `ops/proposals/` 루트의 14건 → `ops/proposals/2026-03/` 이동.
(전부 2026-03 날짜)

### 3-2. IMPACT_ 유형

IMPACT_(영향평가) 2건이 governance/petitions/에 존재하나, PETITION 체계의 부속 산출물로서 별도 유형 등록 없이 현행 유지. 건수가 소량이고 petitions/ 폴더 내에서 자연스럽게 관리됨. 향후 증가 시 별도 청구.

---

## 4. 영향 범위

| 대상 | 영향 |
|------|------|
| ch4 3조 | 패턴 테이블 1행 추가 |
| ch4 4조 | 정본 테이블 1행 + 원칙 문구 2곳 proposals/ 추가 |
| ch4 7조 | type 허용값 1종 + 필수 필드 1행 추가 |
| ops/proposals/ | 기존 14건 → 2026-03/ 이동, README.md 생성 |
| 코드 영향 | 0건 |

---

## 5. 의결 요청

- 개정 절차: **법률 개정** (헌법 7조 2항 — 쌍아+작가님 합의)
- 영향평가: 코드 영향 0건, 문서 이동만 수반 → 막내 영향평가 생략 가능 (작가님 판단)
- 승인 시: 막내2 인덱스 갱신 지시서에 ch4 텍스트 수정 포함하여 일괄 실행

---

**— M1/쌍아 청구안 제출 완료 —**
