#!/bin/bash
# MONK 바둑판 실행 — 127.0.0.1:8765 (매팅 서버 8000과 분리). 이미 켜져 있으면 브라우저만 연다.
#   run.sh               실사용 (8765, 브라우저 자동 오픈)
#   run.sh --test [PORT] 테스트 인스턴스 (기본 8766). 실사용 포트·이미 판이 떠 있는 포트는 거부,
#                        브라우저를 열지 않고 기보는 games/_test/ 에 저장
set -u
cd "$(dirname "$0")"
LIVE_PORT=8765
TEST=0
if [ "${1:-}" = "--test" ]; then
  TEST=1
  PORT="${2:-8766}"
else
  PORT="${GO_BOARD_PORT:-$LIVE_PORT}"
fi
URL="http://127.0.0.1:${PORT}/"

if [ "$TEST" = 1 ]; then
  if [ "$PORT" = "$LIVE_PORT" ]; then
    echo "❌ go-board: 테스트 모드는 실사용 포트 $LIVE_PORT를 쓸 수 없음" >&2
    exit 1
  fi
  if curl -s -o /dev/null -m 2 "${URL}health"; then
    echo "❌ go-board: ${PORT}에 이미 사용 중인 판이 있음 — 테스트는 다른 포트로 (run.sh --test 다른포트)" >&2
    exit 1
  fi
  LOG="$HOME/.monkos/katago/go-board-web_test_${PORT}.log"
else
  LOG="$HOME/.monkos/katago/go-board-web.log"
  if curl -s -o /dev/null -m 2 "${URL}health"; then
    echo "이미 실행 중 — 브라우저만 엽니다: $URL"
    open "$URL"
    exit 0
  fi
fi

GO_BOARD_PORT="$PORT" GO_BOARD_TEST="$TEST" python3 server.py >"$LOG" 2>&1 &
PID=$!
for _ in $(seq 1 60); do
  if curl -s -o /dev/null -m 1 "${URL}health"; then
    head -1 "$LOG"
    [ "$TEST" = 1 ] && echo "테스트 인스턴스: $URL (브라우저 자동 오픈 안 함)" || open "$URL"
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
