---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 브리핑 해소 원장 1단계 — LEDGER.jsonl + brief_ledger CLI + 완료 절차·웹 루틴 연결
status: 발행
portfolio: PF_AUTOPILOT
---

# ORDER — 해소 원장 1단계

> 출처: 작가님 2026-10-22 19:02 (iMac-민아-1022-1703 사람 턴) "쌍아에게 전달해서 진행해" — 민아 전달·원문 대조(민아 로그 :70·:73). 민아 범위 맞춤 19:06 반영.
> 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장.md` §3·§6 1단계.

## 1. 목적

브리핑 승계 항목을 "처리한 쪽이 닫을 수 있는" 정형 원장으로 옮긴다. 이것 없이는 어느 주체가 브리핑해도 처리된 항목이 반복 보고된다.

## 2. 산출물

1. `monkos-ops/ops/briefings/LEDGER.jsonl` — 빈 파일로 신설(초기 적재는 웹민아 몫, 이 지시서 범위 밖). 단 시범 1건만: `(160)` open → resolve (evidence `prod rev 00567-bhd 4종 valueFrom · 6f9a2ee5`, by `iMac/쌍아-막내N`).
2. `scripts/brief_ledger.sh` (+ 필요시 동명 `.py`, `scripts/pf.sh`/`pf.py` 패턴 따름):
   - `open --id N --axis A --severity S [--due YYYY-MM-DD] --title T --owner O --by B`
   - `resolve|reopen --id N --evidence E --by B` · `note --id N --text T --by B`
   - `list [--open] [--axis A]` → 열린 항목 표(severity → due → id 순 정렬) · `show --id N` → 이력
   - 검사(설계 §3 CLI 규칙): axis enum `mail|repo|live|infra|local|session|content|secret` · severity `🔴|⏸️|ℹ️` · due 형식 · open 중복 id 거부 · resolve/reopen은 열린 id만 · `by` = `{디바이스}/{에이전트}` · evidence에 SHA(7자+)/"2회 히트"/"대조군"/`HH:MM` 중 1개 이상.
   - append-only: 기존 행 수정·삭제 경로 없음. 쓰기 전 `git pull --rebase`는 하지 않는다(호출자 책임) — 파일 끝 줄바꿈 보장만.
   - 실패 가시화: `❌ brief_ledger: {사유}` + rc 2.
3. 절차 연결 1줄씩:
   - `.claude/commands/makne-finish.md`·`.claude/commands/session-end.md`: "처리한 일이 브리핑 승계 번호와 관련 있으면 `brief_ledger.sh resolve` 1행".
   - `monkos-ops/ops/templates/ROUTINE_웹민아_데일리E2E.md`: 시작 직후 "`brief_ledger.sh list --open` 판독 — resolved 항목 재보고 금지, 재측정이 반증하면 reopen+근거" + "원장이 비어 있으면 최초 1회 초기 적재(전날 브리핑 열린 항목 전량 open)".
4. `.claude/rules/references.md` 도구 맵 1행(3요건).

## 3. 범위

**허용**: 위 파일 신설·수정 · 스모크용 임시 원장(`--ledger` 경로 인자 또는 환경변수로 대체) · 커밋·푸시(main 직접 아님 — 브랜치, 병합은 쌍아).
**금지**: 웹 Routine 트리거 설정 변경(RemoteTrigger) · 브리핑 본문 수정 · 기존 승계 항목 대량 적재(웹민아 몫).

## 4. 판정 기준

| # | 기준 |
|---|------|
| 1 | 양성: open → list --open 표시 → resolve → list --open 제외 → show 이력 2행 |
| 2 | 음성 6종 거부: 잘못된 axis / evidence 근거 없음 / 닫힌 id resolve / 중복 open / `by` 형식 위반 / due 형식 위반 |
| 3 | 시범 (160) 실원장 2행 |
| 4 | 절차 3곳 1줄 반영 + 도구 맵 등재 |

## 5. 반환

COMPLETION(`reports/2026-10/`): 브랜치·커밋 SHA(원격 대조), 판정 4건, 미해결.
