---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내2
status: 진행
portfolio: PF_GO
---

# COMPLETION — 계가 정답 기록 (형세봇 1/8)

**[2026-11-05 21:40 KST]** iMac/쌍아-막내2 → iMac/쌍아(세션2)

출처: 지시서 `monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내2_GO_계가정답기록.md`(작가님 21:31 "권장안으로 진행해 취지를 이해했잖아"), 설계 `monkos-ops/tech/designs/2026-11/DESIGN_20261105_GO_형세봇_계가정답지_MONKOS성장.md` §2-2. 쌍아 21:34 정정: "봇 대국" = AI vs AI 방, `bot` 불리언 대신 흑·백 대국자 각각.

## 결론
- 계가가 확정될 때마다 `answers.jsonl`에 1행을 기록한다. 사람 vs KataGo·사람 vs MONKOS·AI vs AI 모두 기록하고, 계가 취소는 기록하지 않는다. 8767 시험 결과 3행, 필드가 모두 채워졌다.

## 구현 (`apps/go-board-web/server.py`, 브랜치 makne2-go-scoring-answers)
| 항목 | 내용 |
|---|---|
| 위치 | `~/.monkos/go-board/scoring/answers.jsonl`(append-only, 레포 밖). 테스트 인스턴스는 `~/.monkos/go-board/_test/scoring/answers.jsonl` — 실기록과 섞이지 않게 |
| 시점 | `confirm_score()` — 사람이 누른 확정, 양쪽 패스 자동 확정, AI vs AI 진행기 자동 확정이 모두 이 경로를 지난다 |
| 필드 | `room`·`at`·`kind`·`players{B,W}`(사람 = `human`, 엔진 = `bot_sgf_name` 태그)·`level`·`user`(AI vs AI는 null)·`rules`·`komi`·`handicap`·`setup`·`moveN`·`movesHash`(원국면 수순 sha1 16자)·`finish`(마무리 수순)·`finishWhy`(passes/ended)·`finishSecs`·`dead`·`terrB`·`terrW`·`dame`·`black`·`white`·`result`(앱 count)·`kata`(KataGo final_score)·`preLead`(마무리 전 흑 기준 형세)·`toggles`(사석 손 고침 횟수) |
| preLead | 마지막 엔진 수 때 이미 잰 점수(`room.score`)를 재사용한다. 엔진 추가 호출 없음. 엔진 수가 없던 판은 null |
| 토글 | `toggle_dead()`마다 +1. 계가 상태 저장·복원에도 넣어 재기동해도 유지된다 |
| 취소 | 기록하지 않는다. 취소 횟수는 기존 이벤트(`score/cancel`)로 센다 |
| 실패 | 기록이 실패해도 대국은 계속되고, 로그에 `⚠️ go-board: 계가 정답 기록 실패 — 방 …: 사유` 1줄을 남긴다 |
| 읽기 도구 | `tools/scoring_answers.py [경로]` — 건수·앱 vs KataGo 일치율(정확·방향·1집 이내)·사석 수정 비율·마무리 사유·대국자별·preLead 오차·최근 3건 |

## 판정 (8767, 8765 진행 판 0 확인 뒤, 21:38~21:40)
| 시험 | 대국자(흑 vs 백) | 동작 | 기록 |
|---|---|---|---|
| c002 끝내기 256수 | human vs KataGo(7단) | 계가 → 사석 토글 1회 → 확정 | 1행, toggles 1, 앱 W+51.5(토글로 큰 무리를 사석 처리 — 시험용) · kata W+0.5 |
| c001 캡처 판 217수 | human vs MONKOS-Go-b10-s83M(1500v) | 계가(마무리 46수) → 확정 | 1행, W+12.5 = kata |
| c003 끝내기 251수 | human vs MONKOS | 계가 → **취소** | **0행** |
| c006 AI vs AI 256수부터 | MONKOS-Go-b10-s83M(1500v) vs KataGo(7단) | 진행기가 이어 둠 → "둘 곳 없음" 판단 → 자동 계가 확정(31초) | 1행, user null, W+1.5 = kata |

- 요약 도구 출력: 건수 3 · 결과 일치 2/3(불일치 1건은 시험 토글) · 승패 방향 3/3 · 사석 수정 1/3 · 마무리 사유 passes 3 · preLead vs KataGo 평균 0.3집.
- 미시험: 기록 실패 경로(파일 쓰기 불가)는 코드 리뷰만 했다(예외를 잡아 로그 1줄).

## 반영
- server.py 변경이라 쌍아 병합 → 8765 진행 판 0 확인 → kickstart(별도 명령) → 라이브 2회 조회가 필요하다.
- 막내8 MONKOS 패스 조치와 server.py에서 겹치는 곳: 상수 `ANSWERS_FILE`, `start_scoring`(scoring 필드 3개 추가), `toggle_dead`(1줄), `confirm_score`(1줄), 새 `_record_answer`, `to_dict`/`from_dict`의 scoring 필드.

## 완료 보고
- ✅ 계가 정답 기록(answers.jsonl) + 읽기 도구 — 8767 사람 vs KataGo·사람 vs MONKOS·AI vs AI 3행, 취소 0행
- ⏳ 쌍아 병합 → 8765 재기동(판 0 확인 분리) → 라이브 2회 조회
- 📁 브랜치 makne2-go-scoring-answers
