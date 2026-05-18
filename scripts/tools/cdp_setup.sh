#!/bin/bash
# CDP 환경 셋업 스크립트
# 용도: 디바이스에 CDP 브라우저 제어 환경을 원커맨드로 세팅
# 사용: ./scripts/tools/cdp_setup.sh [install|start|stop|status|ports]
#
# PF_CDP — MONK.KR

set -e

CDP_CONFIG_DIR="$HOME/.config/chrome-cdp"
CDP_PIDS_DIR="$CDP_CONFIG_DIR/pids"
CHROME_APP="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_err()  { echo -e "${RED}❌ $1${NC}"; }

case "$1" in

  install)
    echo "=== CDP 환경 설치 ==="
    echo ""

    # 1. Python websockets
    if python3 -c "import websockets" 2>/dev/null; then
      print_ok "websockets 이미 설치됨"
    else
      echo "websockets 설치 중..."
      pip3 install websockets
      print_ok "websockets 설치 완료"
    fi

    # 2. 설정 디렉토리
    mkdir -p "$CDP_PIDS_DIR"
    print_ok "설정 디렉토리 생성: $CDP_CONFIG_DIR"

    # 3. Chrome 확인
    if [ -f "$CHROME_APP" ]; then
      print_ok "Chrome 확인: $CHROME_APP"
    else
      print_err "Chrome을 찾을 수 없습니다"
      exit 1
    fi

    # 4. cdp_utils.py 확인
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    if [ -f "$SCRIPT_DIR/cdp_utils.py" ]; then
      print_ok "cdp_utils.py 확인: $SCRIPT_DIR/cdp_utils.py"
    else
      print_err "cdp_utils.py를 찾을 수 없습니다"
      exit 1
    fi

    echo ""
    print_ok "설치 완료! 사용법:"
    echo "  cdp_setup.sh start 9222     # 디버깅 크롬 시작 (포트 9222)"
    echo "  cdp_setup.sh stop 9222      # 중지"
    echo "  cdp_setup.sh status         # 전체 상태"
    echo "  cdp_setup.sh ports          # 포트 배당표"
    ;;

  start)
    PORT="${2:-9222}"
    PROFILE_DIR="$CDP_CONFIG_DIR/profile-$PORT"
    PID_FILE="$CDP_PIDS_DIR/$PORT.pid"

    # 이미 실행 중인지 확인
    if [ -f "$PID_FILE" ]; then
      OLD_PID=$(cat "$PID_FILE")
      if kill -0 "$OLD_PID" 2>/dev/null; then
        print_warn "포트 $PORT 이미 실행 중 (PID $OLD_PID)"
        exit 0
      fi
    fi

    # 포트 사용 중인지 확인
    if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
      print_warn "포트 $PORT에 이미 크롬이 응답 중"
      exit 0
    fi

    mkdir -p "$PROFILE_DIR"
    mkdir -p "$CDP_PIDS_DIR"

    echo "디버깅 크롬 시작: 포트 $PORT, 프로필 $PROFILE_DIR"
    "$CHROME_APP" \
      --remote-debugging-port="$PORT" \
      --user-data-dir="$PROFILE_DIR" \
      --no-first-run \
      --no-default-browser-check \
      about:blank &

    NEW_PID=$!
    echo "$NEW_PID" > "$PID_FILE"

    # 시작 대기
    for i in $(seq 1 10); do
      if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
        BROWSER=$(curl -s "http://127.0.0.1:$PORT/json/version" | python3 -c "import sys,json; print(json.load(sys.stdin).get('Browser',''))" 2>/dev/null)
        print_ok "시작 완료: 포트 $PORT (PID $NEW_PID, $BROWSER)"
        exit 0
      fi
      sleep 0.5
    done

    print_warn "시작됐으나 응답 대기 중 (PID $NEW_PID)"
    ;;

  stop)
    PORT="${2:-9222}"
    PID_FILE="$CDP_PIDS_DIR/$PORT.pid"

    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        rm -f "$PID_FILE"
        print_ok "포트 $PORT 중지 (PID $PID)"
      else
        rm -f "$PID_FILE"
        print_warn "PID $PID 이미 종료됨. PID 파일 정리"
      fi
    else
      print_warn "포트 $PORT 실행 기록 없음"
    fi
    ;;

  stop-all)
    echo "=== 전체 CDP 크롬 중지 ==="
    for PID_FILE in "$CDP_PIDS_DIR"/*.pid; do
      [ -f "$PID_FILE" ] || continue
      PORT=$(basename "$PID_FILE" .pid)
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID" 2>/dev/null
        print_ok "포트 $PORT 중지 (PID $PID)"
      fi
      rm -f "$PID_FILE"
    done
    print_ok "전체 중지 완료"
    ;;

  status)
    echo "=== CDP 인스턴스 상태 ==="
    echo ""
    FOUND=0
    for PID_FILE in "$CDP_PIDS_DIR"/*.pid; do
      [ -f "$PID_FILE" ] || continue
      PORT=$(basename "$PID_FILE" .pid)
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        TABS=$(curl -s "http://127.0.0.1:$PORT/json" 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
        echo -e "  ${GREEN}●${NC} 포트 $PORT (PID $PID) — 탭 ${TABS}개"
        FOUND=1
      else
        echo -e "  ${RED}●${NC} 포트 $PORT (PID $PID) — 종료됨"
        rm -f "$PID_FILE"
      fi
    done

    # PID 파일 없이 실행 중인 것도 체크
    for PORT in 9222 9223 9224 9225; do
      PID_FILE="$CDP_PIDS_DIR/$PORT.pid"
      [ -f "$PID_FILE" ] && continue
      if curl -s "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; then
        echo -e "  ${YELLOW}●${NC} 포트 $PORT — 외부 실행 (PID 파일 없음)"
        FOUND=1
      fi
    done

    if [ "$FOUND" = "0" ]; then
      echo "  실행 중인 CDP 인스턴스 없음"
    fi
    echo ""
    ;;

  ports)
    echo "=== CDP 포트 배당표 ==="
    echo ""
    echo "  포트   | 용도"
    echo "  -------|------------------"
    echo "  9222   | 기본 (쌍아/민아)"
    echo "  9223   | 막내1"
    echo "  9224   | 막내2"
    echo "  9225   | 막내3"
    echo "  9230   | M4 (한)"
    echo "  9231   | M2 (꾸)"
    echo ""
    echo "포트 변경은 cdp_utils.py CDP(port=XXXX)로 연결"
    echo ""
    ;;

  *)
    echo "CDP 환경 셋업 스크립트 (PF_CDP)"
    echo ""
    echo "Usage: cdp_setup.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  install            의존성 설치 + 환경 확인"
    echo "  start [port]       디버깅 크롬 시작 (기본: 9222)"
    echo "  stop [port]        디버깅 크롬 중지"
    echo "  stop-all           전체 중지"
    echo "  status             실행 상태 확인"
    echo "  ports              포트 배당표"
    echo ""
    echo "예시:"
    echo "  cdp_setup.sh install          # 최초 1회"
    echo "  cdp_setup.sh start 9222       # 쌍아/민아용"
    echo "  cdp_setup.sh start 9223       # 막내1용"
    echo "  cdp_setup.sh status           # 전체 확인"
    ;;
esac
