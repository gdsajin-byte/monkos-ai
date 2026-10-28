#!/bin/bash
# Playwright MCP 래퍼 — CDP 디버그 크롬에 동적 연결
# WebSocket URL의 UUID가 크롬 재시작마다 바뀌므로 /json/version에서 동적 취득
# 지정 포트(기본 9222)가 미응답이면 그 포트로 디버그 크롬을 자동 기동한다. 다른 포트로 대체 연결하지 않는다.
# ⚠️ stdout은 MCP 프로토콜 채널 — exec 전까지 래퍼의 모든 출력은 stderr로만 보낸다.

PORT="${CDP_PORT:-9222}"
HOST="${CDP_HOST:-localhost}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$HOME/.config/chrome-cdp/logs/${PORT}.log"

get_ws_url() {
  curl -s -m 2 "http://${HOST}:${PORT}/json/version" | python3 -c "import sys,json; print(json.load(sys.stdin)['webSocketDebuggerUrl'])" 2>/dev/null
}

WS_URL=$(get_ws_url)

if [ -z "$WS_URL" ]; then
  case "$HOST" in
    localhost|127.0.0.1)
      echo "playwright_mcp: CDP ${PORT} 미응답 — 디버그 크롬 자동 기동" >&2
      bash "$SCRIPT_DIR/cdp_setup.sh" start "$PORT" 1>&2
      for i in $(seq 1 20); do
        WS_URL=$(get_ws_url)
        [ -n "$WS_URL" ] && break
        sleep 0.5
      done
      ;;
  esac
fi

if [ -z "$WS_URL" ]; then
  echo "❌ playwright_mcp: CDP ${PORT} 기동 실패 — 로그 ${LOG_FILE}" >&2
  exit 1
fi

# 버전 고정(10-28, 정상 동작 실측 0.0.83). 올릴 때: `npm view @playwright/mcp version` 확인 → 9229 스모크 통과 후 아래 숫자만 교체
exec npx @playwright/mcp@0.0.83 --cdp-endpoint "$WS_URL" "$@"
