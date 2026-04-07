@echo off
chcp 65001 >nul
echo.
echo  ==========================================
echo   MONKOS AI - On-Device Chatbot Starting...
echo  ==========================================
echo.
echo  모델을 메모리에 적재 중입니다. 잠시 기다려주세요...
echo.
cd /d "%~dp0"

REM 5초 후 브라우저에서 채팅 UI 자동 오픈
start /b cmd /c "timeout /t 8 /nobreak >nul && start index.html"

monkos-chat.exe -m model\EXAONE-3.5-2.4B-Instruct-Q4_K_M.gguf --server --ctx-size 4096 --port 8080 --threads 4
pause
