---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 백그라운드 세션 승인 대기 → 텔레그램 알림 (Notification 훅 + tg_notify.sh)
status: 발행
portfolio: PF_MONK_OS
---

# ORDER — 백그라운드 세션 승인 대기 텔레그램 알림

> 출처: 작가님 2026-10-22 18:52 (iMac 쌍아 세션 사람 턴) "진행해" — 쌍아 18:50 제안("승인 대기 훅이 걸리면 텔레그램으로 '막내3 승인 대기' 발송") 수락.
> 근거 실측: 10-22 17:12~17:29 쌍아-막내3(bg 426d9359)이 `deploy.sh` 수정 ask(guard_write)에서 17분 무신호 정지. `claude agents` state=blocked 외 가시화 0. 쌍아 세션 로그 17:29 행.

## 1. 목적

`claude --bg`로 띄운 세션은 창이 없어 승인 프롬프트가 떠도 아무도 모른다. 승인 대기에 들어가는 순간 작가님 폰에 1줄이 가게 한다. **알림만** — 승인 경로는 불변(사람이 `claude attach`해 그 세션에서 응답).

## 2. 설계

- **훅**: `.claude/settings.json`에 `Notification` 이벤트 훅 추가 → `scripts/hooks/notify_blocked.py`.
  - Notification 훅의 입력 스키마(알림 종류 필드명·값, 예: 권한 프롬프트 vs 유휴)는 **실측으로 확정**한다. 문서 추정 금지 — 스모크 세션에서 입력 JSON을 덤프해 근거로 삼고 COMPLETION에 필드 목록을 기재.
  - 대상 = **권한/승인 프롬프트 대기**만. 유휴(입력 대기) 알림은 제외.
- **백그라운드 한정**: 대화형 세션(사람이 보고 있음)은 발송하지 않는다. 판별은 입력의 session_id를 `claude agents --json`의 `kind=="background"` 항목과 대조(또는 실측으로 더 확실한 신호가 있으면 그것 — 근거 기재). 판별 실패 시 **발송하지 않고** stderr `[HOOK-ERR]` 1줄(오발송보다 무발송, 단 무음 금지).
- **발송**: `scripts/tools/tg_notify.sh --text "⏸ {세션 이름} 승인 대기 — {사유 요약 ≤80자}" ` + 본문에 `claude attach {id}` 1줄. 버튼 없음(attach는 터미널 명령).
  - 사유 요약에 시크릿·토큰·명령 인자 원문을 넣지 않는다(도구명·파일 경로까지만).
- **중복 억제**: 같은 세션 10분 내 1회(상태 파일 `~/.claude/monk_notify_blocked/{session_id}`).
- **실패 가시화**: tg_notify 실패 시 `[HOOK-ERR] notify_blocked: …` stderr. 훅은 어떤 경우에도 세션을 막지 않는다(exit 0).
- **킬스위치**: 기존 `MONK_HOOKS_OFF=1` 존중(`_common.py` 패턴 따름).

## 3. 범위

**허용**: `scripts/hooks/notify_blocked.py` 신설 · `.claude/settings.json` hooks 블록에 Notification 1항 추가 · `scripts/hooks/smoke.py`에 케이스 추가 · 스모크용 bg 세션 1회 기동(승인 프롬프트를 일부러 유발 — 예: `deploy.sh` 아닌 무해 대상이 ask에 걸리지 않으면 테스트용 임시 ask 조건은 **환경변수 한정**으로) · 실발송 스모크 1회 · references.md 도구 맵 집행 훅 행 갱신.
**금지**: 기존 훅 판정 로직 변경 · 승인 자동 응답(알림이 승인을 대신하는 어떤 경로도 금지, ch1 7조) · 전역 사용자 설정 변경 · 텔레그램 버튼(callback).

## 4. 판정 기준

| # | 기준 |
|---|------|
| 1 | Notification 입력 JSON 실측 덤프 1건(민감값 제거) + 권한 프롬프트 식별 필드 확정 |
| 2 | 양성: bg 세션 승인 대기 → 텔레그램 1건 도착(message_id) |
| 3 | 음성: 대화형 세션 승인 대기 → 발송 0 |
| 4 | 음성: 같은 bg 세션 10분 내 재대기 → 발송 0 |
| 5 | smoke.py 전체 통과(기존 케이스 회귀 0) |
| 6 | 실패 가시화: tg_notify 강제 실패(`TG_CHAT_ID_OVERRIDE=1`) → `[HOOK-ERR]`, 세션 진행 영향 0 |

## 5. 반환

COMPLETION(`reports/2026-10/`): 커밋 SHA(원격 대조), 판정 6건, Notification 스키마 실측, 미해결.
