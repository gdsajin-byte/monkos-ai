# monkos-ops/scripts/_legacy — 레거시 보관 (삭제 금지)

> 2026-10-01 도구 전수조사로 이동. 2월 자동화 체계(명령 워처·큐·야간 운영자·세션 워처)는 Routines·웹민아 E2E·집행 훅이 대체했고, n8n은 2026-07-24 서비스 삭제. 이력은 `git log --follow`.

| 파일 | 최종 커밋 | 대체물·사유 |
|------|------|------|
| n8n/ | 02-27 | monk-n8n 07-24 삭제 (SPREAD 3층 구조 대체) |
| command_watcher.js · queue_sync.js · command_bridge.js · command_bridge_simple.js | 02-22 | 크로스세션 메시징·훅 |
| night_operator.py · session_watcher.sh · session_append.sh | 02-22 | Routines·SessionStart/Stop 훅·pf.sh |
| notify.ps1 | 02-22 | 4060 윈도우 알림 — 텔레그램 CI notify.yml |
| collect_saga.sh | 02-22 | 1회성 수집 |
| ads_sync.py | 03-06 | `ads_upload.sh`(launchd com.monkos.ads-sync) — 그것도 10-02 폐기(아래) |
| ads_upload.sh · com.monkos.ads-sync.plist | 03-06 | **2026-10-02 폐기**(작가님 지시 — 아이디어 존치·구성 폐기). iMac `~/MONKOS_ADS/` 드롭 → GCS `monk-ai-images/ads/` 공개 업로드 → 최신 6장 FIFO → `manifest.json`. 실업로드 7건, 마지막 03-02. launchd 해제·드롭 폴더 제거. **GCS 자산은 라이브 소비 중이라 존치.** 재설계: `ops/proposals/PROPOSAL_20261002_iMac민아_광고슬롯_재설계.md` |
| cheolchang_watcher.sh · com.monkos.cheolchang-sync.plist | 02-23 | 설치본 launchd가 `scripts/철창이_watcher.sh` 호출 |
| mailbox_watcher.sh · com.monk.mailbox-watcher.plist | 02-22 | **2026-10-02 폐기**(작가님 지시). 꾸 우체통 워처 — 대상 호스트가 tailnet에서 사라지고 수신 폴더가 없어 07-13 이후 전달 0(프로세스만 81일 생존). launchd 해제, plist는 `~/Library/LaunchAgents/`에서 이리로 이동. 스크립트의 평문 비밀번호 1행은 제거(값은 git 이력에 잔존). 대체: `ssh m2`(키 인증) + 세션 메시지 |
