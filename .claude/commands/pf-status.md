---
name: PF현황
description: 활성 PF 현황을 스캔하여 대시보드 형태로 보고한다
---

## 활성 PF 스캔

!`for d in monkos-ops/ops/portfolios/PF_*/; do name=$(basename "$d"); status=$(grep -m1 'status:' "$d/README.md" 2>/dev/null | sed 's/.*: *//'); [ "$status" = "active" ] && echo "$name — $status"; done`

## 절차

1. 위 스캔 결과에서 active 상태 PF만 추출한다.
2. 각 PF의 README.md에서 현재 Phase와 최근 히스토리 1건을 읽는다.
3. 아래 형식으로 보고한다:

| PF | 현재 Phase | 최근 활동 | 비고 |
|----|-----------|----------|------|
| (PF명) | (Phase N — 설명) | (날짜 — 내용) | (블로커 있으면 표시) |

4. blocked 상태 PF가 있으면 별도 경고한다.
