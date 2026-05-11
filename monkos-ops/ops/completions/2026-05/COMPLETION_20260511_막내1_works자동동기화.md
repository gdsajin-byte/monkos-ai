---
type: completion
date: 2026-05-11
device: iMac
agent: 막내1
portfolio: PF_AUTOPILOT
order: ORDER_20260511_iMac쌍아_막내1_works자동동기화.md
status: 완료
---

# COMPLETION — works submodule 자동 동기화 Action

**[2026-05-11 15:45 KST] iMac/막내1 → 작가님, 쌍아**

## 결과

✅ `sync-works.yml` 워크플로우 배치 (6시간 cron + workflow_dispatch)
✅ `workflow_dispatch` 수동 실행 → 전 스텝 성공 (submodule 변경분 자동 커밋 확인)
✅ PF_AUTOPILOT 히스토리 1행 어펜드 + Phase 1 항목 갱신

## 이슈 → 해결

| 이슈 | 원인 | 해결 |
|------|------|------|
| checkout 단계 실패 | `monkos-works` private 레포 → `GITHUB_TOKEN`은 현재 레포만 접근 가능 | `PAT_TOKEN` (Fine-grained PAT) 적용. git insteadOf로 SSH→HTTPS 변환 |

## 산출물

| 파일 | 내용 |
|------|------|
| `.github/workflows/sync-works.yml` | 6시간 cron + workflow_dispatch, PAT_TOKEN 교차 레포 접근 |

## 동작 방식

```
monk_project 레포 — cron 매 6시간 (또는 수동)
  → PAT_TOKEN으로 monkos-works checkout
  → git submodule update --init --remote
  → 변경 있으면 [sync] 커밋 + push
  → 변경 없으면 skip
```

💡 `mk-pull.sh` 수동 경로는 보존 (지시서 준수)
