#!/bin/zsh
# vision-matte CF 터널 (2단계 — dev 시험 전용, 작가님 10-22 21:59 "C진행 승인")
# 사용: ./tunnel.sh setup|start|stop|status
#   setup : API로 원격 관리형 터널 생성(없으면) + 인그레스 설정 + DNS CNAME(없으면). 멱등.
#   start : 터널 토큰을 API로 받아 env(TUNNEL_TOKEN)로만 cloudflared에 넘긴다 — SM·파일·인자·출력 미기록.
# 인증 = SM CF_API_TOKEN(+Cloudflare Tunnel: Edit) · CF_ACCOUNT_ID (secret.sh 경유, 값 미출력). 존 ID는 이름(monkos.ai)으로 API 조회.
# 4060 터널(matte.monkos.ai)·기존 DNS는 건드리지 않는다: 이름·호스트가 정확히 일치하는 것만 다룬다.
set -uo pipefail
HERE="${0:A:h}"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
TUNNEL_NAME="${TUNNEL_NAME:-matte-imac}"
ZONE_NAME="monkos.ai"
HOSTNAME_FQDN="$TUNNEL_NAME.$ZONE_NAME"
ORIGIN="http://127.0.0.1:${PORT:-8000}"
HOME_DIR="$HOME/.monkos/vision-matte"
PIDF="$HOME_DIR/tunnel.pid"
LOG="$HOME_DIR/tunnel.log"
CFD="${CLOUDFLARED:-$(command -v cloudflared)}"
export SSL_CERT_FILE="${SSL_CERT_FILE:-/etc/ssl/cert.pem}"
mkdir -p "$HOME_DIR"
fail() { echo "❌ tunnel: $*"; exit 1; }

sm() { zsh "$ROOT/scripts/secret.sh" get "$1" 2>/dev/null; }

load_auth() {
  CF_T="$(sm CF_API_TOKEN)" || fail "SM CF_API_TOKEN 조회 실패"
  CF_A="$(sm CF_ACCOUNT_ID)" || fail "SM CF_ACCOUNT_ID 조회 실패"
  [ -n "$CF_T" ] && [ -n "$CF_A" ] || fail "SM 값 비어 있음"
}

zone_id() {
  CF_Z="$(api GET "/zones?name=$ZONE_NAME" | jget '"".join(z["id"] for z in r if z["name"]=="'"$ZONE_NAME"'")')" || exit 1
  [ -n "$CF_Z" ] || fail "존 $ZONE_NAME 조회 0건 — 토큰 Zone 권한 확인"
}

# api METHOD PATH [JSON] → 응답 JSON(stdout). success=false면 에러 코드 출력 후 exit 1. 토큰은 출력하지 않는다.
api() {
  local out; local -a body=()
  [ -n "${3:-}" ] && body=(--data "$3")   # zsh는 ${3:+--data "$3"}를 한 단어로 넘긴다(10-22 실측) → 배열
  out="$(curl -s -X "$1" "https://api.cloudflare.com/client/v4$2" -H "Authorization: Bearer $CF_T" -H 'Content-Type: application/json' "${body[@]}")"
  python3 -c 'import json,sys
d=json.loads(sys.argv[1] or "{}")
if not d.get("success"):
    print("❌ tunnel: API", sys.argv[2], [(e.get("code"), e.get("message")) for e in d.get("errors", [])], file=sys.stderr); sys.exit(1)' "$out" "$1 $(print -r -- "${2%%\?*}" | sed -E 's#/(accounts|zones|cfd_tunnel)/[0-9a-f]{32}#/\1/<id>#g')" || exit 1
  print -r -- "$out"
}

jget() { python3 -c "import json,sys; d=json.load(sys.stdin); r=d['result']; print($1)"; }

tunnel_id() {
  api GET "/accounts/$CF_A/cfd_tunnel?is_deleted=false&name=$TUNNEL_NAME" | jget '"".join(t["id"] for t in r if t["name"]=="'"$TUNNEL_NAME"'")'
}

alive() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

case "${1:-status}" in
  setup)
    load_auth
    zone_id
    TID="$(tunnel_id)" || exit 1
    if [ -z "$TID" ]; then
      TID="$(api POST "/accounts/$CF_A/cfd_tunnel" "{\"name\":\"$TUNNEL_NAME\",\"config_src\":\"cloudflare\"}" | jget 'r["id"]')" || exit 1
      echo "✅ tunnel: 생성 $TUNNEL_NAME id=$TID"
    else
      echo "ℹ️ tunnel: 기존 $TUNNEL_NAME id=$TID 재사용"
    fi
    api PUT "/accounts/$CF_A/cfd_tunnel/$TID/configurations" \
      "{\"config\":{\"ingress\":[{\"hostname\":\"$HOSTNAME_FQDN\",\"service\":\"$ORIGIN\"},{\"service\":\"http_status:404\"}]}}" >/dev/null || exit 1
    echo "✅ tunnel: 인그레스 $HOSTNAME_FQDN → $ORIGIN"
    rec="$(api GET "/zones/$CF_Z/dns_records?name=$HOSTNAME_FQDN" | jget '";".join(x["type"]+"|"+x["content"] for x in r)')" || exit 1
    want="CNAME|$TID.cfargotunnel.com"
    if [ -z "$rec" ]; then
      api POST "/zones/$CF_Z/dns_records" "{\"type\":\"CNAME\",\"name\":\"$HOSTNAME_FQDN\",\"content\":\"$TID.cfargotunnel.com\",\"proxied\":true,\"comment\":\"vision-matte dev 시험 (ORDER_20261022 2단계)\"}" >/dev/null || exit 1
      echo "✅ tunnel: DNS CNAME $HOSTNAME_FQDN 생성"
    elif [ "$rec" = "$want" ]; then
      echo "ℹ️ tunnel: DNS 이미 정합"
    else
      fail "DNS $HOSTNAME_FQDN 기존 레코드($rec)가 이 터널과 다름 — 덮어쓰지 않고 중단"
    fi
    echo "$TID" > "$HOME_DIR/tunnel_id" ;;
  start)
    if alive; then echo "ℹ️ tunnel: 이미 실행 중 pid=$(cat "$PIDF")"; exit 0; fi
    [ -x "$CFD" ] || fail "cloudflared 없음"
    load_auth
    TID="$(tunnel_id)" || exit 1
    [ -n "$TID" ] || fail "터널 $TUNNEL_NAME 없음 — setup 먼저"
    TK="$(api GET "/accounts/$CF_A/cfd_tunnel/$TID/token" | jget 'r')" || exit 1
    unset CF_T
    TUNNEL_TOKEN="$TK" nohup "$CFD" --no-autoupdate tunnel run >>"$LOG" 2>&1 &
    echo $! > "$PIDF"; unset TK
    sleep 6
    alive || { echo "❌ tunnel: cloudflared 종료됨 — tail $LOG"; tail -5 "$LOG"; exit 1; }
    grep -q "Registered tunnel connection" "$LOG" && echo "✅ tunnel: 커넥터 등록 pid=$(cat "$PIDF")" || echo "⚠️ tunnel: 실행 중이나 등록 로그 미확인 — status로 재확인" ;;
  stop)
    if alive; then kill "$(cat "$PIDF")" && rm -f "$PIDF" && echo "✅ tunnel: 정지"; else echo "ℹ️ tunnel: 실행 중 아님"; rm -f "$PIDF"; fi ;;
  status)
    alive && echo "✅ cloudflared pid=$(cat "$PIDF")" || echo "⏹ cloudflared 정지"
    curl -s -o /dev/null -w "health https://$HOSTNAME_FQDN/health → %{http_code}\n" "https://$HOSTNAME_FQDN/health" ;;
  *) fail "setup|start|stop|status" ;;
esac
