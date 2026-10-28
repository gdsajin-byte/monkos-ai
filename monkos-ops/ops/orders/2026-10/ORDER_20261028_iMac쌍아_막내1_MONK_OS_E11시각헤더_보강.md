---
type: order
date: 2026-10-28
from: iMac/쌍아
to: iMac/막내1
subject: E11 시각 헤더 대조 보강 — 미래 허용 0분 · 줄 중간 헤더 인식 · 응답 헤더 사후 경고
status: 대기
portfolio: PF_MONK_OS
---

# ORDER — E11 보강 (추정 시각 기재 재발 방지)

**[2026-10-28 18:31 KST]** iMac/쌍아 → iMac/막내1

출처: 작가님 18:29 사람 턴 "개선청구도 진행하고" — 쌍아 보고(같은 날 추정 시각 기재가 쌍아 3회·막내2 5회).

## 1. 사실
- `scripts/hooks/time_header.py`: FUTURE_MIN=2 · PAST_MIN=10. 헤더 인식은 굵은 `**[… KST]**` 또는 줄 머리 `[… KST]`만.
- 빠져나간 실사례: ① 쌍아 → 막내 SendMessage "… — [2026-10-28 18:24 KST] iMac/쌍아"(실측 18:22, 줄 중간이라 미인식 + 차이 +2분이라 허용) ② 쌍아 → 작가님 채팅 응답 헤더(18:24, 실측 18:17) — 응답 텍스트는 어떤 훅도 보지 않는다.
- 미래 시각은 정당한 경우가 없다(date 실측값은 항상 현재 이하). 2분 여유가 추정 기재를 통과시킨다.

## 2. 할 일
1. FUTURE_MIN 2 → 0 (같은 분까지 허용). PAST_MIN 유지.
2. SendMessage 본문은 **줄 머리가 아니어도** `[YYYY-MM-DD HH:MM KST]` + 바로 뒤 `{디바이스}/{에이전트}` 패턴이면 헤더로 인식(`출처:`·`근거:` 줄·인용 제외 규칙 유지 — 지시 원문 시각 인용은 오탐 금지).
3. 응답 헤더 사후 경고: Stop 훅(`stop_check.py`)이 transcript의 마지막 어시스턴트 텍스트 첫 헤더를 실측과 대조 → 미래면 `[Stop 훅 경고] 응답 헤더 HH:MM은 실측 HH:MM보다 미래 — 추정 기재` 1줄(차단 아님, 다음 턴 정정 유도). transcript 읽기 실패는 `[HOOK-ERR]`.
4. 스모크: 기존 `smoke.py` 전부 통과 + 양성(미래 1분 deny·줄 중간 헤더 deny·Stop 경고 발생) / 음성(같은 분 통과·출처 줄 인용 통과·과거 5분 통과) 각 3 이상.
5. references.md 도구 맵 집행 훅 행에 1줄 갱신안은 COMPLETION에 제시만(규정 파일 수정은 쌍아).

## 3. ⚠️ 준수
- `.claude/settings.json` 수정 불요(기존 Stop·PreToolUse 훅 내부 로직만) — 필요해지면 멈추고 질의.
- 헌법 3조 1항 `date` · 4조 1항. 동기화 `git merge origin/main`, 작업 브랜치 푸시, 병합은 쌍아. COMPLETION·세션 로그·PF_MONK_OS.

## 4. 커밋
`[ops] E11 보강 — 미래 허용 0분·줄 중간 헤더 인식·응답 헤더 사후 경고`
