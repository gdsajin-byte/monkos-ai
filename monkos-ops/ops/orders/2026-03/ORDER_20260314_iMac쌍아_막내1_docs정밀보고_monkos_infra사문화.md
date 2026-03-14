---
type: ORDER
date: 2026-03-14
time: "18:15 KST"
from: iMac/쌍아
to: 막내1
subject: docs/ 정밀 보고 — monkos/ 193건 + infrastructure/ 사문화 8건
priority: 일반
endline: 보고 후 대기
---

# 지시: docs/ 정밀 보고 — monkos + infrastructure 사문화

## 배경

막내1 리서치 보고에서 monkos/ 193건(전량 레거시), infrastructure/ 사문화 8건이 식별됨. 작가님 지시: 정밀 보고 후 판단.

## 작업

### 1. docs/monkos/ 193건 정밀 분류

이전 보고에서 "전량 레거시"로 일괄 분류했으나, 작가님이 정밀 보고를 요청. 다음 기준으로 재분류:

| 분류 | 기준 | 처리 |
|------|------|------|
| **ops 정본 중복** | ops/reports, ops/orders에 동일 문서 존재 | 삭제 제안 (정본 경로 명시) |
| **ops 미이관** | ops에 없지만 이관할 가치 있음 | 이관 경로 제안 |
| **역사적 가치** | 과거 운영 기록으로 보존 의미 | docs/archives/monkos/로 이관 |
| **사문화** | 가치 없음 | 삭제 제안 |

특히 확인할 것:
- `docs/monkos/tasks/` — 현행 ORDER_와 중복되는지 (내용 비교)
- `docs/monkos/reports/` — ops/reports/와 중복되는지
- `docs/monkos/sprints/` — 현행 체계에서 사용 중인지

### 2. docs/infrastructure/ 사문화 8건 상세

이전 보고에서 식별한 사문화 8건에 대해 **파일명 + 내용 요약 + 삭제/보존 근거**를 파일별로 제시.

## 산출물

보고서: `monkos-ops/ops/reports/REPORT_20260314_막내1_docs정밀_monkos_infra.md`

포맷:
- monkos/ 193건: 분류별 건수 + 대표 파일 5건씩 예시
- infrastructure/ 8건: 전건 상세 (파일명, 요약, 판정, 근거)

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 법률 ch7 3조: 리서치만 수행, 실제 이동/삭제 금지
