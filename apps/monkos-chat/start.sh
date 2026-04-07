#!/bin/bash
echo ""
echo "  =========================================="
echo "   MONKOS AI - On-Device Chatbot Starting..."
echo "  =========================================="
echo ""
echo "  모델을 메모리에 적재 중입니다. 잠시 기다려주세요..."
echo ""
cd "$(dirname "$0")"
chmod +x monkos-chat.exe

# 8초 후 브라우저에서 채팅 UI 자동 오픈
(sleep 8 && open index.html 2>/dev/null || xdg-open index.html 2>/dev/null) &

./monkos-chat.exe -m model/EXAONE-3.5-2.4B-Instruct-Q4_K_M.gguf --server --ctx-size 4096 --port 8080 --threads 4
