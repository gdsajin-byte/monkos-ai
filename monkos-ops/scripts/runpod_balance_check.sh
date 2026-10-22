#!/bin/bash
# runpod_balance_check.sh — RunPod 서버리스 잔액 모니터링
# 배경: monkos-matte(BiRefNet 배경제거)는 RunPod 선불 충전제. 잔액 소진 시 matte 서빙이
#       조용히 멈추고 Gemini L3 폴백으로 전환된다(서비스 유지되나 비용·품질 저하).
# 동작: 잔액 조회 → 임계값($2) 미만 시 텔레그램 팀 채널 경보. 조회 실패도 경보.
#
# 사용법:
#   ./runpod_balance_check.sh                # 조회 + 임계값 미만 시 경보 (launchd 기본)
#   ./runpod_balance_check.sh --check-only   # 조회만, 경보 미발송 (health-check 스킬용)
#   ./runpod_balance_check.sh --test-alert   # [테스트] 라벨로 경보 강제 발송 (배선 검증용)
#
# 스케줄: ~/Library/LaunchAgents/com.monkos.runpod-balance.plist (월·목 09:00 KST, 주 2회 — 10-22 작가님 조정)
# 시크릿: GCP Secret Manager RUNPOD_API_KEY · TELEGRAM_TEAM_BOT_TOKEN — 값 화면 출력 절대 금지
# 헌법 4조 1항: 키 값 생성/추측 금지. 파이프/변수로만 취급.

set -uo pipefail
# launchd는 최소 PATH로 실행되므로 보강한다. ⚠️ 단일 디바이스 경로를 하드코딩하면
# 다른 디바이스에서 gcloud 미탐지로 조용히 실패한다(2026-07-25 iMac 실측: 이 스크립트가
# /Users/macmini/ 고정이라 iMac에서 KEY 조회 실패). 후보 경로를 모두 얹고 존재하는 것을 쓴다.
export PATH="$PATH:/Users/macmini/google-cloud-sdk/bin:$HOME/google-cloud-sdk/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
if ! command -v gcloud >/dev/null 2>&1; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S KST')] ❌ gcloud 미탐지 — PATH: $PATH"
  exit 1
fi

PROJECT="monkos"
THRESHOLD="${RUNPOD_BALANCE_THRESHOLD:-2.0}"
TEAM_CHAT_ID="-1003794441262"   # 텔레그램 팀 채널 (비밀 아닌 설정값 — SECRET_INVENTORY §0)
MODE="${1:-alert}"

ts() { date '+%Y-%m-%d %H:%M:%S KST'; }

send_telegram() {
  local text="$1"
  local token
  token=$(gcloud secrets versions access latest --secret=TELEGRAM_TEAM_BOT_TOKEN --project="$PROJECT" 2>/dev/null)
  if [ -z "$token" ]; then
    echo "[$(ts)] ❌ TELEGRAM_TEAM_BOT_TOKEN 조회 실패 — 경보 발송 불가"
    return 1
  fi
  curl -s -m 15 -X POST "https://api.telegram.org/bot${token}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg chat "$TEAM_CHAT_ID" --arg text "$text" '{chat_id:$chat, text:$text}')" \
    | jq -r 'if .ok then "[텔레그램 발송 성공]" else "[텔레그램 발송 실패] \(.description // "unknown")" end'
}

# === 잔액 조회 ===
KEY=$(gcloud secrets versions access latest --secret=RUNPOD_API_KEY --project="$PROJECT" 2>/dev/null)
if [ -z "$KEY" ]; then
  echo "[$(ts)] ❌ RUNPOD_API_KEY 조회 실패 (Secret Manager)"
  [ "$MODE" != "--check-only" ] && send_telegram "⚠️ RunPod 잔액 모니터 이상 — Secret Manager에서 RUNPOD_API_KEY 조회 실패. M1 gcloud 인증 상태 확인 필요."
  exit 1
fi

RESP=$(curl -s -m 30 -H "Content-Type: application/json" -H "Authorization: Bearer $KEY" \
  https://api.runpod.io/graphql -d '{"query":"query { myself { clientBalance } }"}')

# === 사용량 스냅샷 (2026-07-25 신설, 작가님 "런팟도 api가 등록되어있으니 필요 신호를 수집하면 된다") ===
# 목적: **예열 횟수를 포털 코드 무접촉으로 실측한다.**
#   jobs.completed 델타 = 예열 잡 + 실제 매팅 잡
#   실제 매팅 잡은 Cloud Logging `via=runpod` 카운트로 별도 확인 → **차이가 곧 예열 횟수**
# 현재 warmupMatteEngine()의 RunPod 분기는 fire-and-forget에 로그가 0이라 이 경로 외에는
# 예열을 셀 방법이 없다. 소비자(RunPod) 쪽에서 보는 것이 생산자에 로그를 넣는 것보다 싸다.
EP="${MATTE_ENDPOINT_ID:-di9upymdumei34}"
HEALTH=$(curl -s -m 20 -H "Authorization: Bearer $KEY" "https://api.runpod.ai/v2/${EP}/health" 2>/dev/null)
unset KEY

USAGE_LOG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/ops/audit/RUNPOD_USAGE.jsonl"
if echo "$HEALTH" | jq -e '.jobs.completed' >/dev/null 2>&1; then
  PREV=$(tail -n 1 "$USAGE_LOG" 2>/dev/null | jq -r '.completed // empty' 2>/dev/null)
  CUR=$(echo "$HEALTH" | jq -r '.jobs.completed')
  DELTA=""
  [ -n "$PREV" ] && DELTA=$((CUR - PREV))
  mkdir -p "$(dirname "$USAGE_LOG")"
  echo "$HEALTH" | jq -c --arg ts "$(ts)" --arg delta "$DELTA" \
    '{ts:$ts, completed:.jobs.completed, failed:.jobs.failed, inQueue:.jobs.inQueue,
      w_idle:.workers.idle, w_ready:.workers.ready, w_running:.workers.running,
      w_init:.workers.initializing, w_throttled:.workers.throttled,
      delta:(if $delta=="" then null else ($delta|tonumber) end)}' >> "$USAGE_LOG"
  echo "[$(ts)] RunPod 사용량: completed=${CUR}${DELTA:+ (직전 대비 +${DELTA})} · workers idle/ready=$(echo "$HEALTH" | jq -r '.workers.idle')/$(echo "$HEALTH" | jq -r '.workers.ready')"
else
  # 무음 강등 금지 — 수집 실패를 조용히 넘기지 않는다(0으로 오독되면 예열 통제 판단이 뒤집힌다).
  echo "[$(ts)] ⚠️ RunPod 사용량 스냅샷 실패 — /v2/${EP}/health 응답 파싱 불가"
fi

BALANCE=$(echo "$RESP" | jq -r '.data.myself.clientBalance // empty' 2>/dev/null)

if ! echo "$BALANCE" | grep -Eq '^[0-9]+(\.[0-9]+)?$'; then
  ERR=$(echo "$RESP" | jq -r '.errors[0].message // "응답 파싱 불가"' 2>/dev/null || echo "응답 파싱 불가")
  echo "[$(ts)] ❌ RunPod 잔액 조회 실패: $ERR"
  [ "$MODE" != "--check-only" ] && send_telegram "⚠️ RunPod 잔액 조회 실패 — $ERR. API 키 폐기 또는 API 장애 가능. matte 서빙 상태 확인 필요."
  exit 1
fi

BALANCE_FMT=$(printf '%.2f' "$BALANCE")
LOW=$(awk -v b="$BALANCE" -v t="$THRESHOLD" 'BEGIN{print (b < t) ? 1 : 0}')

echo "[$(ts)] RunPod 잔액: \$${BALANCE_FMT} (임계값 \$${THRESHOLD}) $([ "$LOW" = "1" ] && echo '🚨 부족' || echo '✅ 정상')"

# === 경보 판정 ===
case "$MODE" in
  --check-only)
    exit $([ "$LOW" = "1" ] && echo 1 || echo 0)
    ;;
  --test-alert)
    send_telegram "🧪 [테스트] RunPod 잔액 모니터 배선 검증 — 현재 잔액 \$${BALANCE_FMT}, 임계값 \$${THRESHOLD}. 실제 경보 아님."
    ;;
  *)
    if [ "$LOW" = "1" ]; then
      send_telegram "🚨 RunPod 잔액 부족 — 충전 필요
현재 잔액: \$${BALANCE_FMT} (임계값 \$${THRESHOLD})
matte 서빙(BiRefNet) Gemini 폴백 전환 임박 — 비용·품질 저하
→ https://console.runpod.io/user/billing 에서 충전"
    fi
    ;;
esac
