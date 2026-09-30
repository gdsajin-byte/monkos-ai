---
description: PF(포트폴리오) 파일 접근 시 적용
paths:
  - "monkos-ops/ops/portfolios/**"
---

> source: governance/laws/ch4_docs_structure.md@2026-08-13

# PF 운용 규칙 (ch4 9조 발췌)

## 히스토리
- 테이블 열: `| 날짜 | 주체 | 내용 | 산출물 | 상태 |`
- Phase 현황은 상태 반영 갱신 허용.

## 갱신 의무
- 활성 PF 대상 작업 완료 시 히스토리 1행 어펜드.
- 세션 마감 시 해당 세션에서 작업한 PF 확인 → 미갱신 시 즉시 보정.

## YAML 필수 필드
```yaml
type: portfolio
id: PF_{코드네임}
name: "{코드네임}"
subject: "{한 줄 요약}"
owner: 작가님
leads: "{에이전트}({역할})"
status: draft | active | blocked | paused | completed
```

## 인덱스 등록
- PF 신설 시 `portfolios/README.md` 인덱스에 즉시 1행 추가.

## 비대화 관리
- 500줄 초과 시 아카이브 트리거. 쌍아가 세션 마감 시 확인.

## 메타 PF (ch4 9조 7항)
- 메타 PF = 흐름·연결·KPI 정본. 하위 PF = 실측·실행 정본.
- 메타 PF Phase는 하위 PF와 독립.

## 원장 도구 (2026-09-30 신설 — DESIGN_20260930_PF원장화)
- 히스토리 어펜드는 **`scripts/pf.sh append PF_X "내용" --agent {디바이스}/{에이전트} [--artifact 경로] [--status ✅]`** 경유. 표 열·날짜 형식·링크·중복을 도구가 맞춘다. 수동 행 삽입 금지.
- `portfolio:` 필드를 가진 공식 문서(reports·orders·incidents·proposals·designs·specs)는 **Write 시 훅이 PF 히스토리에 자동 링크**한다 — 같은 문서를 수동으로 또 붙이지 않는다.
- 현황: `scripts/pf.sh query [--status active] [--stale 14]` / 누락 검사: `scripts/pf.sh check [--days 3]` (Stop 훅·CI C15가 같은 검사를 자동 실행).

> 상세: governance/laws/ch4_docs_structure.md 9조
