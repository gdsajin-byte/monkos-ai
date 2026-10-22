---
type: completion
date: 2026-10-22
time: 17:06 KST
from: iMac/쌍아-막내2
to: iMac/쌍아
order: ORDER_20261022_iMac쌍아_막내_KKU_배포요청_텔레그램발송도구.md
commit: (원격 대조 SHA는 쌍아 세션 메시지에 기재)
branch: worktree-makne2-tg-notify (main 병합은 쌍아)
portfolio: PF_KKU
---

# COMPLETION — 배포 요청 텔레그램 발송 도구 (tg_notify.sh)

**[2026-10-22 17:06 KST]** iMac/쌍아-막내2 → iMac/쌍아

> 출처: 작가님 2026-10-22 17:04 iMac 쌍아 세션 사람 턴 "막내 투입은 너가 할수 있잖아"(16:23 "진행해" 범위) — 쌍아 경유 전달.

## ✅ 완료

- `scripts/tools/tg_notify.sh` 신설 — `--text` / `--button-text`+`--button-url`(https만, url 버튼만) / `--dry-run`.
  - 토큰: `scripts/secret.sh get TELEGRAM_TEAM_BOT_TOKEN` → 변수. curl에는 `-K -`(stdin 설정)로 URL 전달 → 프로세스 인자·출력에 토큰 미노출. `set -x` 없음.
  - chat_id: `monkos_AI/portal/deploy.sh`의 `TEAM_CHAT_ID=` 정규식 읽기(사본 없음). 실패 시 ❌.
  - 실패 가시화: HTTP≠200 또는 `ok`≠true → stderr `❌ tg_notify: HTTP {code} — {description}` + exit 1. 성공 `✅ tg_notify: message_id={id}`.
- `.claude/rules/references.md` 도구 맵 1행(3요건 기재) · `.claude/commands/deploy-cf.md` −1단계 3항 사용 예 1줄.

## 스모크

| # | 기준 | 결과 |
|---|------|------|
| 1 | `--dry-run` 정상, 토큰 미포함 | rc=0, payload 출력(토큰은 "획득됨 (46자)"만 표기), `grep -cF <토큰>` = **0** |
| 2 | 실발송 1회 | `✅ tg_notify: message_id=451` (17:06, 본문 `[스모크] tg_notify — 배포 아님` + 버튼 "민아 세션 열기") |
| 3 | 음성 대조군 `TG_CHAT_ID_OVERRIDE=1` | `❌ tg_notify: HTTP 400 — Bad Request: chat not found`, rc=1 |
| 4 | 도구 맵 등재 | 완료 |

## ⏳ 미해결

- 판정 기준 2의 **수신 확인**(작가님 폰 또는 민아 경유) 대기 — API `ok:true`·message_id만 실증.
- main 병합: 하네스 제약(main 직접 푸시 금지)으로 작업 브랜치 `worktree-makne2-tg-notify` 푸시까지. 병합은 쌍아.
- 버튼에 넣을 실제 "민아 세션" 링크 조달은 −1단계 운용 측(민아) 소관 — 도구는 임의 https URL 수용.

## 💡 메모

- 금지 호출(getUpdates·deleteWebhook·setWebhook) 0회. 발송 대상은 정본 chat_id 1곳 + 음성 대조군(존재하지 않는 chat_id, 미전달).

## 📁 변경 파일

- `scripts/tools/tg_notify.sh` (신규)
- `.claude/rules/references.md` (+1행)
- `.claude/commands/deploy-cf.md` (+1행)
- `monkos-ops/ops/sessions/2026-10/2026-10-22_iMac_쌍아-막내2.md` (신규)
- 본 보고 + PF_KKU 히스토리 1행

## 🔀 다음

- 쌍아: 브랜치 병합 → 민아 −1단계 실운용 시 이 도구 사용.
