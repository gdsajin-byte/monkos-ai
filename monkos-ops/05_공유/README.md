# 05_공유 — 팀원 채널

팀원별 우체통 시스템. 각 채널에 inbox/outbox/reference/archive.
(teams/ 폴더에서 2026-02-22 통합 완료)

| 채널 | 팀원 | 통신 방식 |
|------|------|----------|
| han/ | 한송이 | 텔레그램/Google Drive 경유 |
| kku/ | 와이프 | SSH + mailbox_watcher 경유 |

## mailbox_watcher.sh

경로: `monkos-ops/scripts/mailbox_watcher.sh`
워처가 참조하는 TEAMS_DIR: `monkos-ops/05_공유/`
로그: `monkos-ops/06_로그/orchestration/mailbox.log`
