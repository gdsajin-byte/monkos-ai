#!/bin/bash
# MONK 바둑판 실행 — 127.0.0.1:8765 (매팅 서버 8000과 분리). 이미 켜져 있으면 브라우저만 연다.
set -u
cd "$(dirname "$0")"
PORT="${GO_BOARD_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/"
LOG="$HOME/.monkos/katago/go-board-web.log"

if curl -s -o /dev/null -m 2 "${URL}health"; then
  echo "이미 실행 중 — 브라우저만 엽니다: $URL"
  open "$URL"
  exit 0
fi

python3 server.py >"$LOG" 2>&1 &
PID=$!
for _ in $(seq 1 60); do
  if curl -s -o /dev/null -m 1 "${URL}health"; then
    head -1 "$LOG"
    open "$URL"
    echo "끄기: kill $PID  (로그: $LOG)"
    exit 0
  fi
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "❌ go-board: 서버 기동 실패 — 로그:" >&2
    cat "$LOG" >&2
    exit 1
  fi
  sleep 1
done
echo "❌ go-board: 60초 내 응답 없음 — 로그: $LOG" >&2
exit 1
