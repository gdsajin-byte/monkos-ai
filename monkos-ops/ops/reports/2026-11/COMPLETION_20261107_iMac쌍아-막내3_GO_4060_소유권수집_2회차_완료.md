---
type: completion
date: 2026-11-07
from: iMac/쌍아-막내3
to: iMac/쌍아
order: monkos-ops/ops/orders/2026-11/ORDER_20261107_iMac쌍아_막내3_GO_4060_소유권수집.md
portfolio: PF_GO
status: 완료 — 2,000판 수집·회수
---

# COMPLETION — 4060 소유권 수집 2회차(완료)

**[2026-11-07 14:35 KST]** iMac/쌍아-막내3 → iMac/쌍아

출처: 쌍아 세션 간 메시지(09:12 수신)가 전달한 작가님 11-07 09:12 사람 턴 "오늘 낮에 비니까 돌려" — 지시서 §2 '낮 창 예약 안 함'의 예외로, 오늘 낮 사용이 승인됐다. 1회차: [COMPLETION_20261107_…_1회차](COMPLETION_20261107_iMac쌍아-막내3_GO_4060_소유권수집_1회차.md).

## ✅ 2회차 실행 (일회 예약 `\MONK\GO-own-now` 09:15~18:00, 09:13 재등록)
- 기동 전 09:12에 GPU 0%, katago 미실행 확인. 09:18 GPU 98%.
- 결과: **1,334/1,334판** · 287,047국면 · 19,037초 · **15.08국면/초** · 오류 0 · rc 0 → 14:32:20 `all_done`.
- 속도가 1회차(21.61)보다 30% 느렸다. 14:33 끝난 뒤에도 GPU 40%였고, GPU를 쓰는 프로세스 목록에 Roblox·Discord·Steam이 떠 있었다(아이들이 같이 쓴 것으로 보인다). 낮 창은 GPU를 나눠 쓴다고 보고 계획을 잡을 것.

## ✅ 전체 수집·회수 (14:35 실측)
- `pull_own.sh`로 회수 → `~/.monkos/go-board/analysis/ownership_v1/out1/` **2,000판 · 오류 0 · 712MB**.
- 대조: 2,000판 모두 질의의 analyzeTurns 수와 행 수가 같다(불일치 0). 361칸이 아닌 행 0. 합계 **437,354국면**.
  - 두 회차 엔진 처리량 합(150,447 + 287,047)이 140 더 많은 것은 1회차 07:30에 중단된 판들의 일부 국면이다. 그 판들은 2회차에서 처음부터 다시 돌았다.
- 형식: 행 `{id, turnNumber, scoreLead, winrate, visits, own[361]}`. own은 ownership×100 정수, 흑 기준(+100=흑 땅), y*19+x 순서.

## 🔀 밤 예약
`\MONK\GO-night-run` 23:05는 그대로 둔다. ① 실수 사전 ② 결정 장면 ③ 소유권이 모두 all_done이라 GPU를 쓰지 않고 바로 끝난다.

## 📁 산출물·브랜치
- 데이터: `~/.monkos/go-board/analysis/ownership_v1/`(iMac 로컬, 레포 밖) · 4060 원본 `C:/Users/smuse73/go_kibo/own/out1`.
- 브랜치 `worktree-makne3-go-own` — 병합은 쌍아 몫.

## 💡 다음
소형 형세 모델 학습은 지시서 §2대로 별건. 이 정답지(국면 437k × 361칸)를 입력으로 쓴다.
