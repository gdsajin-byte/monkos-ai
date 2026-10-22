#!/bin/zsh
# vision-matte CF 터널 (2단계 — dev 시험 전용, 작가님 10-22 21:59 "C진행 승인")
# 사용: ./tunnel.sh setup|start|stop|status
#       ./tunnel.sh run   (launchd용 포그라운드 + 외부 헬스 워처 — 실패·복구 전이 때만 tg_notify 1줄, 최소 간격 10분)
#   setup : API로 원격 관리형 터널 생성(없으면) + 인그레스 설정 + DNS CNAME(없으면). 멱등.
#   start : 터널 토큰을 API로 받아 env(TUNNEL_TOKEN)로만 cloudflared에 넘긴다 — SM·파일·인자·출력 미기록.
# 인증 = SM CF_API_TOKEN(+Cloudflare Tunnel: Edit) · CF_ACCOUNT_ID (secret.sh 경유, 값 미출력). 존 ID는 이름(monkos.ai)으로 API 조회.
# 4060 터널(matte.monkos.ai)·기존 DNS는 건드리지 않는다: 이름·호스트가 정확히 일치하는 것만 다룬다.
set -uo pipefail
HERE="${0:A:h}"
ROOT="${MONK_ROOT:-$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$ROOT" ] && [ -f "$ROOT/scripts/secret.sh" ] || { echo "❌ tunnel: 레포 루트 탐지 실패 (MONK_ROOT)"; exit 1; }
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

fetch_tunnel_token() {
  load_auth
  TID="$(tunnel_id)" || exit 1
  [ -n "$TID" ] || fail "터널 $TUNNEL_NAME 없음 — setup 먼저"
  TK="$(api GET "/accounts/$CF_A/cfd_tunnel/$TID/token" | jget 'r')" || exit 1
  unset CF_T
}

# 외부 헬스 워처 — 60초마다 /health 2회 히트(2차 판정, live-verify). 연속 2회 실패 = down.
# 알림은 상태 전이(up→down, down→up) 때만, 직전 알림 후 10분 이내면 다음 주기로 보류 → 남발 방지.
# 감시 대상 PID(=exec 뒤 cloudflared)가 죽으면 같이 끝난다(재기동 시 중복 워처 방지).
health_watch() {
  local target="$1" st="$HOME_DIR/health_state" last="$HOME_DIR/health_last_notify" fails=0 state=up new code now prev msg
  sleep "${WATCH_GRACE_SEC:-90}"
  while kill -0 "$target" 2>/dev/null; do
    curl -s -o /dev/null -m 10 "https://$HOSTNAME_FQDN/health"
    code="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://$HOSTNAME_FQDN/health")"
    if [ "$code" = 200 ]; then fails=0; new=up; else fails=$((fails+1)); if [ $fails -ge 2 ]; then new=down; else new=$state; fi; fi
    if [ "$new" != "$state" ]; then
      now=$(date +%s); prev=$(cat "$last" 2>/dev/null || echo 0)
      if [ $((now - prev)) -ge 600 ]; then
        if [ "$new" = down ]; then msg="🔴 matte-imac 헬스 실패(HTTP $code) — 포털 매팅은 RunPod로 폴백 중. iMac vision-matte·터널 확인"
        else msg="✅ matte-imac 헬스 복구 — 매팅 1순위 Vision 재개"; fi
        if bash "$ROOT/scripts/tools/tg_notify.sh" --text "$msg" >/dev/null 2>>"$HOME_DIR/health_watch.err"; then echo "$now" > "$last"
        else echo "$(date '+%F %T') ❌ tg_notify 실패" >> "$HOME_DIR/health_watch.err"; fi
        state=$new; echo "$(date '+%F %T') $state $code" > "$st"
      fi
    fi
    sleep "${WATCH_INTERVAL_SEC:-60}"
  done
}

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
  run)
    [ -x "$CFD" ] || fail "cloudflared 없음"
    fetch_tunnel_token
    echo "$(date '+%F %T') tunnel: launchd 기동"
    health_watch $$ &
    TUNNEL_TOKEN="$TK" exec "$CFD" --no-autoupdate tunnel run ;;
  start)
    if alive; then echo "ℹ️ tunnel: 이미 실행 중 pid=$(cat "$PIDF")"; exit 0; fi
    [ -x "$CFD" ] || fail "cloudflared 없음"
    fetch_tunnel_token
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
  *) fail "setup|run|start|stop|status" ;;
esac
