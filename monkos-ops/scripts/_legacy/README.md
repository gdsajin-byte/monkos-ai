# monkos-ops/scripts/_legacy — 레거시 보관 (삭제 금지)

> 2026-10-01 도구 전수조사로 이동. 2월 자동화 체계(명령 워처·큐·야간 운영자·세션 워처)는 Routines·웹민아 E2E·집행 훅이 대체했고, n8n은 2026-07-24 서비스 삭제. 이력은 `git log --follow`.

| 파일 | 최종 커밋 | 대체물·사유 |
|------|------|------|
| n8n/ | 02-27 | monk-n8n 07-24 삭제 (SPREAD 3층 구조 대체) |
| command_watcher.js · queue_sync.js · command_bridge.js · command_bridge_simple.js | 02-22 | 크로스세션 메시징·훅 |
| night_operator.py · session_watcher.sh · session_append.sh | 02-22 | Routines·SessionStart/Stop 훅·pf.sh |
| notify.ps1 | 02-22 | 4060 윈도우 알림 — 텔레그램 CI notify.yml |
| collect_saga.sh | 02-22 | 1회성 수집 |
| ads_sync.py | 03-06 | `ads_upload.sh`(launchd com.monkos.ads-sync) |
| cheolchang_watcher.sh · com.monkos.cheolchang-sync.plist | 02-23 | 설치본 launchd가 `scripts/철창이_watcher.sh` 호출 |
