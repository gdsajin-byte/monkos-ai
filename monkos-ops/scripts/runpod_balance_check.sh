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
# 스케줄: ~/Library/LaunchAgents/com.monkos.runpod-balance.plist (09:00·21:00 KST, 1일 2회)
# 시크릿: GCP Secret Manager RUNPOD_API_KEY · TELEGRAM_TEAM_BOT_TOKEN — 값 화면 출력 절대 금지
# 헌법 4조 1항: 키 값 생성/추측 금지. 파이프/변수로만 취급.

set -uo pipefail
export PATH="/Users/macmini/google-cloud-sdk/bin:/usr/local/bin:/usr/bin:/bin"

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
unset KEY

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
