---
type: ORDER
date: 2026-03-14
time: "17:00 KST"
from: iMac/쌍아
to: 막내1
subject: docs/ 정리 리서치 — infrastructure + monkos 영역
priority: 일반
endline: 보고 후 대기
---

# 지시: docs/ 정리 리서치 — 인프라·기술문서

## 배경

docs/ 폴더에 555건의 파일이 혼재. 현행 체계(ops/orders, ops/reports, works/ 등)로 이관할 것과 레거시 아카이브로 뺄 것을 분류해야 한다.

## 담당 영역

- `docs/infrastructure/` (ai-models, architecture, audit, constitution, deployment, guides, history, laws, reports, strategy)
- `docs/monkos/` (designs, incidents, reports, specs, sprints, tasks)

## 작업

1. 각 폴더·파일의 내용을 확인하고 아래 기준으로 분류:

| 분류 | 기준 | 이관처 |
|------|------|--------|
| **활성** | 현재 참조 중이거나 최신 정보 | 현행 체계로 이관 (구체 경로 제안) |
| **중복** | 다른 위치에 정본 존재 | 삭제 (정본 경로 명시) |
| **레거시** | 과거 버전, 역사적 가치만 있음 | `docs/archives/`로 이관 |
| **사문화** | 참조도 없고 역사적 가치도 낮음 | 삭제 제안 |

2. 특히 확인할 것:
   - `docs/infrastructure/` 내 파일 중 CLAUDE.md 규정 참조 테이블에서 직접 참조하는 파일 (이건 현위치 유지 또는 명확한 대체 경로 필요)
   - `docs/monkos/tasks/` — 과거 TASK_ 파일들이 현행 ORDER_/REPORT_와 중복되는지
   - `docs/monkos/reports/` — ops/reports/와 중복 여부

## 산출물

보고서: `monkos-ops/ops/reports/REPORT_20260314_막내1_docs정리_인프라기술문서.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 법률 ch7 3조: 리서치만 수행, 실제 이동/삭제 금지
