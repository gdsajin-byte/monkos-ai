---
type: completion
date: 2026-05-11
device: iMac
agent: 막내2
order: ORDER_20260511_iMac쌍아_막내2_텔레그램알림허브.md
portfolio: PF_AUTOPILOT
status: 완료
---

# COMPLETION: 텔레그램 알림 허브

**[2026-05-11 15:21 KST]** iMac/막내2

## 결과

✅ GitHub Secrets 2개 등록 (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
✅ `telegram_notify.py` 범용 스크립트 배치 (HTML + plain text fallback)
✅ `notify.yml` reusable workflow (workflow_call)
✅ `daily-briefing.yml` 텔레그램 step 추가
✅ 테스트 메시지 텔레그램 수신 확인 (로컬 + Actions)
✅ SECRET_INVENTORY.md 갱신

## 트러블슈팅

| 이슈 | 원인 | 해결 |
|------|------|------|
| chat not found (400) | 지시서의 TELEGRAM_BOT_TOKEN(CS봇)이 팀 채팅 접근 불가 | TELEGRAM_TEAM_BOT_TOKEN으로 교체 |
| YAML 문법 오류 → workflow_dispatch 무효 | 멀티라인 문자열이 YAML 블록 스칼라 깨뜨림 | printf로 메시지 조립 방식 전환 |
| Telegram Markdown 400 | 브리핑 내용의 특수문자(*, _, () 등) 충돌 | HTML parse_mode + 실패 시 plain text fallback |

## 산출물

| 파일 | 경로 |
|------|------|
| 텔레그램 스크립트 | `.github/scripts/telegram_notify.py` |
| 범용 알림 워크플로우 | `.github/workflows/notify.yml` |
| 브리핑 워크플로우 (텔레그램 추가) | `.github/workflows/daily-briefing.yml` |

💡 TELEGRAM_BOT_TOKEN(CS봇) ≠ TELEGRAM_TEAM_BOT_TOKEN(팀봇). 팀 내부 알림은 팀봇 사용 필수.
❌ 없음
⏳ 없음
📁 커밋 c79658ff (HTML fix)
🔀 push 완료
