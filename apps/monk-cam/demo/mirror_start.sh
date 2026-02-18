#!/bin/bash
# MONKOS Mirror — iMac 원터치 런처
# 사용법: bash mirror_start.sh

cd "$(dirname "$0")"

# 기존 서버 프로세스 종료
pkill -f "node signaling_server.js" 2>/dev/null
sleep 0.5

# 서버 시작
echo "[Mirror] 시그널링 서버 시작..."
node signaling_server.js &
SERVER_PID=$!
sleep 1

# 서버 기동 확인
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "[Mirror] 서버 PID: $SERVER_PID"
    # 콘솔 자동 열기
    open "https://localhost:8443/mirror_console.html"
    echo ""
    echo "=== Mirror 준비 완료 ==="
    echo "iMac 콘솔: https://localhost:8443/mirror_console.html"
    echo "iPhone 런처: https://100.97.103.10:8443/mirror"
    echo "========================"
    echo ""
    echo "종료: Ctrl+C"
    wait $SERVER_PID
else
    echo "[Mirror] 서버 시작 실패"
    exit 1
fi
