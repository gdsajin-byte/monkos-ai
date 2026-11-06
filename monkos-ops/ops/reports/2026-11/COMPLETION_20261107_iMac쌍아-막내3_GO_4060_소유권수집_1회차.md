---
type: completion
date: 2026-11-07
from: iMac/쌍아-막내3
to: iMac/쌍아
order: monkos-ops/ops/orders/2026-11/ORDER_20261107_iMac쌍아_막내3_GO_4060_소유권수집.md
portfolio: PF_GO
status: 1회차 완료 · 이어받기 예약됨
---

# COMPLETION — 4060 소유권 수집 1회차

**[2026-11-07 08:42 KST]** iMac/쌍아-막내3 → iMac/쌍아

출처: 지시서 ORDER_20261107(작가님 11-07 05:29 iMac/쌍아 사람 턴 "4060 지금 진행시켜").

## ✅ 코드 변경 (브랜치 `worktree-makne3-go-own`)
- `AI_Factory/go_kibo/mistakes_runner.py` — `--ownership`(includeOwnership=true, `--own-visits` 기본 64, 1단계만), `--limit N`(스모크용). 국면당 `{id, turnNumber, scoreLead, winrate, visits, own[361]}`로 줄여 기록. own = ownership×100 정수, 흑 기준(설정 `reportAnalysisWinratesAs = BLACK`, +100=흑 땅), 행 우선 y*19+x. ownership이 없거나 361이 아니면 해당 대국을 `.error.jsonl`로 기록하고 로그에 ❌(무음 강등 금지, 리더 스레드 보호). 기존 모드는 동작 변화 없음.
- `AI_Factory/go_kibo/day_chain.py` — ① 실수 사전 → ② 결정 장면 → **③ 소유권**(`own/queries_full.jsonl`이 있을 때만, 각 단계 앞 창 가드).
- `AI_Factory/go_kibo/pull_own.sh` 신설 — 4060 `own/out1` → iMac `~/.monkos/go-board/analysis/ownership_v1/`, 완료·오류 판 수·크기 출력, 오류 판이 있으면 ❌ + exit 1.
- 4060 배치: `C:/Users/smuse73/go_kibo/own/queries_full.jsonl`(full 사본, 같은 2,000판·국면 순서). 기존 `full/out1·out2`·`scenes`는 그대로.

## ✅ 스모크 (4060, 05:31)
1판(29572500): 277국면 · 18초 · 오류 0 · 파일 488KB. 종국 국면 땅 분포를 문자 지도로 찍어 흑·백 영역 정상 확인.

## ✅ 1회차 본 실행 (일회 예약 `\MONK\GO-own-now`, 05:34~07:30)
| 항목 | 실측 |
|---|---|
| 처리 | **666 / 2,000판** · 150,447국면 · 오류 0 |
| 속도 | **21.61국면/초** (6,963초) |
| 저장 | `own/out1` 666파일 · **255.5MB**(255,547,305바이트, 08:42 dir 실측) → 2,000판이면 약 0.77GB |
| 종료 | 07:30:03 창 종료로 엔진 중단 → `paused_window_end`(진행 중이던 판은 버리고 다음 회차에 다시), GPU 0% 반납 확인 |

러너 로그의 `rc 1`은 창 종료 때 엔진을 끊은 값이다(aborted 경로, 실패 아님 — 연쇄 로그는 `rc 0 · state paused_window_end`).

## ✅ 이어받기 예약 (08:42 재실측)
- `\MONK\GO-night-run` 다음 실행 **2026-11-07 23:05** · `day_chain.py --start 23:05 --end 07:30` → ①② 즉시 all_done → ③ 소유권 남은 판.
- 남은 **1,334판**: 1회차 속도 기준 약 13,950초(**약 3.9시간**) → 오늘 밤 창(8.4시간) 안에 끝날 것으로 예상(23:05 시작이면 03:00 전후).
- 낮 창 예약 없음: `GO-day-run` 다음 실행 N/A, `GO-own-now` N/A(일회 소진).

## 💡 참고
- 회수: 수집이 끝나면 `AI_Factory/go_kibo/pull_own.sh`(GPU 미사용, 진행 중에 돌려도 안전).
- 국면 수는 1단계와 같다(대국당 analyzeTurns 전부). 2단계 400v는 소유권 모드에서 돌지 않는다.

## 🔀 병합
쌍아 소관. 브랜치 `worktree-makne3-go-own`.
