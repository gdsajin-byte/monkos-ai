# scripts — 운영 스크립트

## 워처/데몬

| 스크립트 | 용도 | 실행 |
|----------|------|------|
| ~~mailbox_watcher.sh~~ | 꾸(M2) 우체통 파일 자동 전달 — **2026-10-02 폐기**, `_legacy/`로 이동 | — |
| session_watcher.sh | 소넷이 세션 로그 자동 분석 | `mk-sw` (tmux) |
| command_watcher.js | 지시서 감시 + 텔레그램 알림 | Node.js |
| command_bridge.js | Firestore→CLI 브릿지 | Node.js |
| command_bridge_simple.js | 간소화 브릿지 | Node.js |
| queue_sync.js | 작업 큐 동기화 | Node.js |

## 세션/로그

| 스크립트 | 용도 |
|----------|------|
| session_append.sh | 세션 로그 자동 타임스탬프 |
| collect_saga.sh | 세션 로그 수집 |
| soul_sync.sh | 소울 동기화 |

## 광고

| 스크립트 | 용도 |
|----------|------|
| ads_sync.py | GCS 광고 동기화 |
| ~~ads_upload.sh~~ | MONKOS_ADS → GCS 업로드 — **2026-10-02 폐기**, `_legacy/`로 이동 |

## 야간/알림

| 스크립트 | 용도 |
|----------|------|
| night_operator.py | 야간 자동화 오퍼레이터 |
| notify.ps1 | Windows 알림 (PowerShell) |
| runpod_balance_check.sh | RunPod 잔액 모니터 — $2 미만 시 텔레그램 팀 채널 경보. matte(BiRefNet) 선불 잔액 감시. **+ 사용량 스냅샷**(2026-07-25): `/v2/{ep}/health`의 `jobs.completed`·워커 상태를 `ops/audit/RUNPOD_USAGE.jsonl`에 적재 → **델타 − Cloud Logging `via=runpod` 실사용 = 예열 횟수**(포털 코드 무접촉 실측). PATH 이식성 수정으로 전 디바이스 실행 가능 |
| com.monkos.runpod-balance.plist | 위 스크립트 launchd 스케줄 정본 (09:00·21:00 KST). `cp → ~/Library/LaunchAgents/ → launchctl load` |

## 인프라

| 스크립트 | 용도 |
|----------|------|
| n8n/docker-compose.yml | n8n 워크플로우 엔진 |
| n8n/install_n8n.sh | n8n 설치 스크립트 |
