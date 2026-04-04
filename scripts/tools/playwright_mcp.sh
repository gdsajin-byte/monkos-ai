#!/bin/bash
# Playwright MCP 래퍼 — CDP 디버그 크롬에 동적 연결
# WebSocket URL의 UUID가 크롬 재시작마다 바뀌므로 /json/version에서 동적 취득

PORT="${CDP_PORT:-9222}"
HOST="${CDP_HOST:-localhost}"

WS_URL=$(curl -s "http://${HOST}:${PORT}/json/version" | python3 -c "import sys,json; print(json.load(sys.stdin)['webSocketDebuggerUrl'])" 2>/dev/null)

if [ -z "$WS_URL" ]; then
  echo "ERROR: CDP 디버그 크롬이 포트 ${PORT}에서 응답하지 않습니다." >&2
  echo "실행: scripts/tools/cdp_setup.sh start ${PORT}" >&2
  exit 1
fi

exec npx @playwright/mcp@latest --cdp-endpoint "$WS_URL" "$@"
