---
description: PF(포트폴리오) 파일 접근 시 적용
globs:
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

> 상세: governance/laws/ch4_docs_structure.md 9조
