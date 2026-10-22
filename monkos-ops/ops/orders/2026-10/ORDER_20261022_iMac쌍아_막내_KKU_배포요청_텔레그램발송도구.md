---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 배포 요청 텔레그램 발송 도구 — 팀봇 1줄 + 인라인 URL 버튼, 실패 가시화
status: 발행
portfolio: PF_KKU
---

# ORDER — 배포 요청 텔레그램 발송 도구

> 출처: 작가님 2026-10-21 17:54 (iMac-민아-1015-1939 사람 턴) "세가지다 권고안으로 처리" → 폰 알림 경로 = 팀봇 텔레그램 + 링크 버튼 확정. 작가님 2026-10-22 16:23 (iMac 쌍아 세션 사람 턴) "진행해".
> 설계: `monkos-ops/tech/designs/2026-10/DESIGN_20261021_KKU_배포요청_앱알림_승인버튼.md` §2·§4 1b.

## 1. 목적

iMac 민아가 배포 요청을 받고 사전 점검을 마친 뒤, 작가님 폰에 텔레그램 1줄 + "민아 세션 열기" 링크 버튼을 보낸다. 10-21 15:38 민아의 수동 curl 발송(message_id 450, 아이폰 수신 1/1)을 재사용 가능한 도구로 만든다.

## 2. 산출물

`scripts/tools/tg_notify.sh`

```
tg_notify.sh --text "<본문>" [--button-text "<라벨>" --button-url "<URL>"] [--dry-run]
```

- **봇 토큰**: SM `TELEGRAM_TEAM_BOT_TOKEN` — `scripts/secret.sh` 경유로 읽는다(값 출력·로그·인자 노출 금지. curl에는 환경변수나 stdin으로 넘기고 `set -x` 금지).
- **chat_id**: 비시크릿 정본 `monkos_AI/portal/deploy.sh`의 `TEAM_CHAT_ID=` 값을 읽는다. **값을 스크립트에 복사하지 않는다**(references.md 사본 금지). 읽기 실패 시 ❌.
- **전송**: `curl`로 `sendMessage` (python urllib는 10-21 SSL 체인 오류 실측). 버튼은 `reply_markup.inline_keyboard`의 **url 버튼만** — `callback_data` 버튼 금지(클릭은 사람 턴이 아님, ch1 7조).
- **실패 가시화**: HTTP≠200 또는 응답 `ok`≠true → stderr `❌ tg_notify: {description}` + exit 1. 성공 시 `✅ tg_notify: message_id={id}` 1줄.
- `--dry-run`: 토큰·chat_id 획득 여부와 페이로드(JSON, 토큰 제외)만 출력, 미발송.

## 3. 범위

**허용**: `scripts/tools/tg_notify.sh` 신설 · 실발송 스모크 **1회**(본문 `[스모크] tg_notify — 배포 아님`) · `.claude/rules/references.md` 도구 맵 1행 추가 · `.claude/commands/deploy-cf.md` −1단계 3항에 사용 예 1줄.

**금지**: 시크릿 생성·수정 · 봇 웹훅 설정 변경(getUpdates·deleteWebhook 호출 금지 — 팀봇은 포털 dev 웹훅 사용 중) · 토큰 값을 어떤 출력에도 노출 · 다른 채팅으로 발송.

## 4. 판정 기준

| # | 기준 |
|---|------|
| 1 | `--dry-run` 정상 출력, 토큰 문자열 미포함(`grep -c` 0 실증) |
| 2 | 실발송 1회 `✅ message_id=` + 작가님(또는 민아 경유) 수신 확인 |
| 3 | 음성 대조군: 잘못된 chat_id 주입 시(환경변수 재정의 옵션 `TG_CHAT_ID_OVERRIDE`로) ❌ + exit 1 |
| 4 | 도구 맵 등재(3요건 기재) |

## 5. 반환

완료 보고(`reports/2026-10/COMPLETION_…`): 커밋 SHA(원격 대조), 스모크 3건 결과, 실발송 message_id, 미해결.
