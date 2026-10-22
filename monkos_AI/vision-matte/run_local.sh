#!/bin/zsh
# vision-matte 로컬 상주 (2단계 — dev 시험 기간 한정, 재부팅 내성 없음)
# 사용: ./run_local.sh start|stop|status|restart   (개발용 nohup 상주)
#       ./run_local.sh run                          (launchd용 포그라운드 — 설치 사본 ~/.monkos/vision-matte/bin/에서 실행)
#       ./run_local.sh install|uninstall            (launchd 2잡: ai.monkos.vision-matte · ai.monkos.matte-imac-tunnel)
#   - 바이너리는 ~/.monkos/vision-matte/vision-matte 로 복사해 실행한다(worktree 삭제와 무관하게 유지).
#   - MATTE_SECRET은 4060과 같은 SM 시크릿을 scripts/secret.sh 경유로 env에만 주입한다. 값은 출력·파일 저장하지 않는다.
#   - SM 조회 실패 시 기동하지 않는다(시크릿 없이 무인증 서버를 띄우는 무음 강등 금지).
set -uo pipefail
HERE="${0:A:h}"
# 설치 사본은 레포 밖에서 돈다 → MONK_ROOT(plist가 지정)로 secret.sh·tg_notify를 찾는다.
ROOT="${MONK_ROOT:-$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null)}"
[ -n "$ROOT" ] && [ -f "$ROOT/scripts/secret.sh" ] || { echo "❌ run_local: 레포 루트 탐지 실패 (MONK_ROOT)"; exit 1; }
LA="$HOME/Library/LaunchAgents"
JOBS=(ai.monkos.vision-matte ai.monkos.matte-imac-tunnel)
HOME_DIR="$HOME/.monkos/vision-matte"
BIN="$HOME_DIR/vision-matte"
PIDF="$HOME_DIR/server.pid"
LOG="$HOME_DIR/server.log"
PORT="${PORT:-8000}"
mkdir -p "$HOME_DIR"

alive() { [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; }

fetch_secret() {
  S="$(zsh "$ROOT/scripts/secret.sh" get MATTE_SECRET 2>/dev/null)" || { echo "❌ run_local: MATTE_SECRET SM 조회 실패 — 기동 중단"; exit 1; }
  [ -n "$S" ] || { echo "❌ run_local: MATTE_SECRET 비어 있음 — 기동 중단"; exit 1; }
}

case "${1:-status}" in
  run)
    # launchd 포그라운드. 실패 시 exit≠0 → launchd 재기동(ThrottleInterval). 외부 헬스 경보는 터널 잡 워처가 낸다.
    [ -x "$BIN" ] || { echo "❌ run_local: $BIN 없음 — install 먼저"; exit 1; }
    fetch_secret
    echo "$(date '+%F %T') run_local: launchd 기동"
    MATTE_SECRET="$S" PORT="$PORT" exec "$BIN" ;;
  install)
    [ -x "$HERE/.build/out/vision-matte" ] || { echo "❌ run_local: 빌드 산출물 없음 — ./build.sh 먼저"; exit 1; }
    "$0" stop >/dev/null 2>&1; [ -x "$HERE/tunnel.sh" ] && "$HERE/tunnel.sh" stop >/dev/null 2>&1
    mkdir -p "$HOME_DIR/bin" "$LA"
    cp "$HERE/.build/out/vision-matte" "$BIN"
    cp "$HERE/run_local.sh" "$HERE/tunnel.sh" "$HOME_DIR/bin/" && chmod +x "$HOME_DIR/bin/"*.sh
    for j in $JOBS; do
      cp "$ROOT/monkos-ops/scripts/$j.plist" "$LA/$j.plist" || { echo "❌ run_local: plist 사본 없음 $j"; exit 1; }
      launchctl bootout "gui/$(id -u)/$j" 2>/dev/null
      launchctl bootstrap "gui/$(id -u)" "$LA/$j.plist" || { echo "❌ run_local: bootstrap 실패 $j"; exit 1; }
    done
    sleep 8
    for j in $JOBS; do echo "$j $(launchctl print "gui/$(id -u)/$j" | grep -E '^\s+(state|pid) =' | tr -s ' \n' ' ')"; done
    curl -sf "http://127.0.0.1:$PORT/health" >/dev/null && echo "✅ run_local: launchd 설치 · 로컬 /health 200" || { echo "❌ run_local: 설치 후 /health 실패 — $HOME_DIR/launchd-*.log"; exit 1; } ;;
  uninstall)
    for j in $JOBS; do launchctl bootout "gui/$(id -u)/$j" 2>/dev/null && echo "✅ bootout $j"; rm -f "$LA/$j.plist"; done ;;
  start)
    if alive; then echo "ℹ️ run_local: 이미 실행 중 pid=$(cat "$PIDF")"; exit 0; fi
    [ -x "$HERE/.build/out/vision-matte" ] || { echo "❌ run_local: 빌드 산출물 없음 — ./build.sh 먼저"; exit 1; }
    cp "$HERE/.build/out/vision-matte" "$BIN"
    fetch_secret
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
  *) echo "❌ run_local: run|install|uninstall|start|stop|status|restart"; exit 2 ;;
esac
