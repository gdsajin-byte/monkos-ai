#!/bin/bash
# ============================================
# Chrome DevTools MCP 전용 실행 스크립트
# MONK.KR — 로컬 MCP 브라우저 제어용
# ============================================
# 사용법: ./scripts/chrome-devtools.sh [start|stop|status]

CHROME_APP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PROFILE_DIR="$HOME/.config/chrome-devtools-mcp"
PORT=9222
PIDFILE="/tmp/chrome-devtools-mcp.pid"

case "${1:-start}" in
  start)
    # 이미 실행 중인지 확인
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "✅ Chrome DevTools 이미 실행 중 (PID: $(cat "$PIDFILE"))"
      echo "   http://localhost:$PORT"
      exit 0
    fi

    # 프로필 디렉토리 생성
    mkdir -p "$PROFILE_DIR"

    # Chrome 실행
    "$CHROME_APP" \
      --remote-debugging-port=$PORT \
      --user-data-dir="$PROFILE_DIR" \
      --no-first-run \
      --no-default-browser-check \
      "about:blank" &>/dev/null &

    echo $! > "$PIDFILE"
    sleep 2

    # 연결 확인
    if curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1; then
      echo "✅ Chrome DevTools 실행 완료"
      echo "   PID: $(cat "$PIDFILE")"
      echo "   Port: $PORT"
      echo "   Profile: $PROFILE_DIR"
    else
      echo "❌ Chrome DevTools 실행 실패"
      rm -f "$PIDFILE"
      exit 1
    fi
    ;;

  stop)
    if [ -f "$PIDFILE" ]; then
      kill "$(cat "$PIDFILE")" 2>/dev/null
      rm -f "$PIDFILE"
      echo "✅ Chrome DevTools 종료"
    else
      echo "⚠️ 실행 중인 인스턴스 없음"
    fi
    ;;

  status)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "✅ 실행 중 (PID: $(cat "$PIDFILE"))"
      curl -s "http://localhost:$PORT/json/version" | python3 -m json.tool 2>/dev/null
    else
      echo "⚠️ 실행 중 아님"
    fi
    ;;

  *)
    echo "Usage: $0 [start|stop|status]"
    ;;
esac
