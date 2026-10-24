---
type: order
date: 2026-10-24
from: iMac/쌍아
to: iMac/쌍아-막내16
device: iMac
agent: 쌍아
subject: 집행 훅 — 새로 쓰는 `**[YYYY-MM-DD HH:MM KST]**` 헤더를 쓰기 직전에 실측 시각과 대조(±2분 초과 차단 + 실측값 안내)
status: 대기
portfolio: PF_INFRA
---

# ORDER — 시각 헤더 쓰기 직전 대조 훅 (헌법 3조 1항 코드 집행)

**[2026-10-24 22:23 KST]** iMac/쌍아 → iMac/쌍아-막내16

> 출처: 작가님 2026-10-24 22:22 KST (iMac 쌍아 세션 사람 턴) "진행 승인" — 쌍아 22:21 제안 B안(쓰기 직전 대조). 진단 합의: 작가님 22:21 "시간의 시점이 턴과 로그 작성 시점의 오차를 추정으로 메우는 문제".
> 실사고(10-24, 전부 '미래 시각' = 추정 가산): 쌍아 14:16(실측 14:14)·14:23(14:22), 막내15 메시지 22:02(22:00)·22:07(22:04).
> 현행: `scripts/hooks/prompt_submit.py` E6가 **턴 시작에만** 시각 주입. 쓰기 시점 대조 없음.

## 1. 동작

- 대상 쓰기에서 **새로 추가되는** 헤더 `**[YYYY-MM-DD HH:MM KST]**`(및 굵게 없는 `[YYYY-MM-DD HH:MM KST]` 머리 형태)를 찾아 현재 KST와 비교.
- **실측보다 2분 넘게 미래이거나 10분 넘게 과거**(인용·이월 오기 방지 — 과거 상한은 실측해 조정 가능)면 **차단**(PreToolUse deny) + 사유에 `실측 YYYY-MM-DD HH:MM KST — 이 값으로 다시 쓰세요`.
- 기존 내용에 이미 있던 헤더(Edit의 old_string에 있던 것, 파일에 이미 있는 줄)는 검사하지 않는다 — **새로 들어가는 것만**.
- 인용 예외: 코드 블록(```) 안, `> 출처:`·`근거:` 인용 줄, 날짜가 오늘이 아닌 헤더(과거 사건 기록)는 검사 제외.

## 2. 대상 경로

| 도구 | 대상 |
|---|---|
| Write·Edit·MultiEdit (`guard_write.py` 확장) | `monkos-ops/ops/sessions/`·`orders/`·`reports/`·`proposals/`·`incidents/`·`briefings/` 아래 `.md` |
| Bash (`guard_bash.py` 확장) | 위 경로로 가는 `>>`/heredoc/`tee -a` 어펜드 중 **명령 문자열에 시각이 리터럴로 박힌 경우**. `$(date …)`·`$D` 같은 치환은 통과(실측 치환이 정답 패턴) |
| SendMessage (PreToolUse matcher 신설) | `message` 본문 헤더 |

- 설정 `.claude/settings.json` hooks에 SendMessage matcher 추가(규정 계층 변경 — 쌍아 승인 범위, 작가님 22:22 승인).

## 3. 실패 가시화·안전

- 훅 자체 오류 시 쓰기를 막지 않고 `[HOOK-ERR] 시각 대조 실패` 경고(기존 `_common.py` 관례).
- 킬스위치 `MONK_HOOKS_OFF=1` 기존 동작 유지.
- 시간대: 시스템 시각 기준 KST(`Asia/Seoul`) 명시 계산 — 기기 TZ에 의존하지 않는다.

## 4. 스모크 (`scripts/hooks/smoke.py`에 추가)

- 양성(통과): 실측 헤더 / `$(date)` 치환 어펜드 / 기존 헤더 유지 Edit / 코드 블록 안 헤더 / `> 출처:` 줄의 과거 시각 / 어제 날짜 헤더.
- 음성(차단): +3분 미래 헤더(Write·Edit·Bash 리터럴 어펜드·SendMessage 각 1) / −15분 과거 헤더.
- 기존 스모크 전부 통과 유지(현 118/118 기준 — 실측 후 숫자 갱신).
- 실세션 1회: 이 세션에서 일부러 +3분 헤더 Write 시도 → 차단 메시지 실측 캡처.

## 5. 범위 밖

- PostToolUse 시각 재주입(A안) — 이번엔 안 함. 다른 훅 규칙 변경 금지.

## ⚠️ 준수 조항

- **헌법 3조 1항**(이 훅이 집행하는 조항) — 작업 중 본인 헤더도 `date` 실측. **3조 2항**: 세션 로그·COMPLETION·PF_INFRA 1행.
- **헌법 4조 2항**: 파괴적 명령 금지. 훅 변경은 전 세션에 즉시 적용되므로 **스모크 전부 통과 전 main 푸시 금지**.
- `references.md` 도구 맵 '집행 훅' 행에 1줄 갱신(인지 3요건 — 쌍아 소관 파일이나 본 지시서로 위임).

## 완료 기준

- [ ] §4 스모크 양성 6·음성 5 + 기존 전부 통과(숫자 명기)
- [ ] 실세션 차단 1회 실측
- [ ] references.md 도구 맵 갱신
- [ ] COMPLETION `monkos-ops/ops/reports/2026-10/COMPLETION_20261024_iMac쌍아-막내16_MONK_OS_시각헤더대조훅.md` + 원격 SHA 대조

## 커밋 메시지

```
[ops] 집행 훅 — 시각 헤더 쓰기 직전 대조(±2분 미래·10분 과거 차단, Write·Bash 어펜드·SendMessage)
```
