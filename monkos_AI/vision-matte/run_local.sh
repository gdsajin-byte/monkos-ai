#!/bin/zsh
# vision-matte 로컬 상주 (2단계 — dev 시험 기간 한정, 재부팅 내성 없음)
# 사용: ./run_local.sh start|stop|status|restart
#   - 바이너리는 ~/.monkos/vision-matte/vision-matte 로 복사해 실행한다(worktree 삭제와 무관하게 유지).
#   - MATTE_SECRET은 4060과 같은 SM 시크릿을 scripts/secret.sh 경유로 env에만 주입한다. 값은 출력·파일 저장하지 않는다.
#   - SM 조회 실패 시 기동하지 않는다(시크릿 없이 무인증 서버를 띄우는 무음 강등 금지).
set -uo pipefail
HERE="${0:A:h}"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)"
HOME_DIR="$HOME/.monkos/vision-matte"
BIN="$HOME_DIR/vision-matte"
PIDF="$HOME_DIR/server.pid"
LOG="$HOME_DIR/server.log"
PORT="${PORT:-8000}"
mkdir -p "$HOME_DIR"

alive() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

case "${1:-status}" in
  start)
    if alive; then echo "ℹ️ run_local: 이미 실행 중 pid=$(cat "$PIDF")"; exit 0; fi
    [ -x "$HERE/.build/out/vision-matte" ] || { echo "❌ run_local: 빌드 산출물 없음 — ./build.sh 먼저"; exit 1; }
    cp "$HERE/.build/out/vision-matte" "$BIN"
    S="$(zsh "$ROOT/scripts/secret.sh" get MATTE_SECRET 2>/dev/null)" || { echo "❌ run_local: MATTE_SECRET SM 조회 실패 — 기동 중단"; exit 1; }
    [ -n "$S" ] && [[ "$S" != *"조회 실패"* ]] || { echo "❌ run_local: MATTE_SECRET 비어 있음 — 기동 중단"; exit 1; }
    MATTE_SECRET="$S" PORT="$PORT" nohup "$BIN" >>"$LOG" 2>&1 &
    echo $! > "$PIDF"; unset S
    sleep 1
    if alive && curl -sf "http://127.0.0.1:$PORT/health" >/dev/null; then
      echo "✅ run_local: 기동 pid=$(cat "$PIDF") :$PORT (log $LOG)"
    else
      echo "❌ run_local: 기동 실패 — tail $LOG"; tail -3 "$LOG"; exit 1
    fi ;;
  stop)
    if alive; then kill "$(cat "$PIDF")" && rm -f "$PIDF" && echo "✅ run_local: 정지"; else echo "ℹ️ run_local: 실행 중 아님"; rm -f "$PIDF"; fi ;;
  restart) "$0" stop; "$0" start ;;
  status)
    if alive; then echo "✅ pid=$(cat "$PIDF")"; curl -s "http://127.0.0.1:$PORT/health"; echo; else echo "⏹ 정지 상태"; exit 1; fi ;;
  *) echo "❌ run_local: start|stop|status|restart"; exit 2 ;;
esac
