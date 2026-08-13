---
description: 문서 생성/수정 시 적용 — 파일명·배치·서식 규칙
globs:
  - "monkos-ops/ops/sessions/**"
  - "monkos-ops/ops/reports/**"
  - "monkos-ops/ops/orders/**"
  - "monkos-ops/ops/proposals/**"
  - "monkos-ops/ops/incidents/**"
  - "monkos-ops/tech/specs/**"
  - "monkos-ops/tech/designs/**"
  - "governance/constitution/petitions/**"
---

> source: governance/laws/ch3_session_log.md@2026-03-29

# 문서 규칙 (ch3·ch4 발췌)

## 파일명 패턴 + 정본 위치

| 유형 | 패턴 | 정본 위치 |
|------|------|----------|
| 세션로그 | `YYYY-MM-DD_{디바이스}_{에이전트}.md` | `monkos-ops/ops/sessions/YYYY-MM/` |
| 보고서 | `{COMPLETION\|REPORT\|REVIEW}_YYYYMMDD_{주체}_{내용}.md` | `monkos-ops/ops/reports/YYYY-MM/` |
| 지시서 | `ORDER_YYYYMMDD_{발신}_{수신}_{내용}.md` | `monkos-ops/ops/orders/YYYY-MM/` |
| 제안서 | `PROPOSAL_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/proposals/` |
| 인시던트 | `INCIDENT_YYYYMMDD_{service}.md` | `monkos-ops/ops/incidents/YYYY-MM/` |
| 기술 스펙 | `SPEC_{service}_{feature}.md` | `monkos-ops/tech/specs/{service}/` |
| 설계서 | `DESIGN_YYYYMMDD_{feature}.md` | `monkos-ops/tech/designs/YYYY-MM/` |
| 개헌 청구 | `PETITION_YYYYMMDD_{agent}_{topic}.md` | `governance/constitution/petitions/` |
| 포트폴리오 | `PF_{코드네임}/README.md` | `monkos-ops/ops/portfolios/` |

- PF 귀속 문서: 파일명에 코드네임 삽입 (예: `ORDER_20260326_M1쌍아_막내1_CITADEL_Phase1.md`). 무귀속은 생략.

## 배치 규칙

- 월별 폴더(`YYYY-MM/`)에 배치. 루트 생성 금지. 폴더 없으면 `mkdir -p`로 생성.

## 수발신 헤더 (헌법 2조 2항)

- 형식: `**[YYYY-MM-DD HH:MM KST]** {디바이스}/{에이전트} → {수신자}`
- 모든 공식 커뮤니케이션(지시서·보고서·세션 로그 항목)에 필수.

## YAML frontmatter 필수

```yaml
---
type: session_log | completion | report | order | proposal | incident | spec | design | petition
date: YYYY-MM-DD
device: {디바이스}
agent: {에이전트}
status: 진행 | 마감
---
```

> 타임스탬프·완료 보고 형식은 헌법 3조 1-2항에 규정. 상세: governance/laws/ch3_session_log.md, ch4_docs_structure.md 3조, 4조
