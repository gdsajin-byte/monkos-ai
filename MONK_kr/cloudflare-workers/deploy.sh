#!/bin/bash

# MONK Gemini Proxy - 빠른 배포 스크립트
# 실행: bash deploy.sh

set -e

echo "🚀 MONK Gemini Proxy 배포 시작..."
echo ""

# 1. Gemini API 키 확인
echo "📋 Step 1: Gemini API 키 확인"
echo "----------------------------------------"
echo "Google Cloud Console에서 API 키를 발급받으셨나요?"
echo "아직이라면: https://aistudio.google.com/app/apikey"
echo ""
read -p "API 키가 준비되었으면 Enter를 누르세요..."
echo ""

# 2. wrangler 설치 확인
if ! command -v wrangler &> /dev/null
then
    echo "📦 wrangler를 설치합니다..."
    npm install -g wrangler
fi

# 3. Cloudflare 로그인
echo "🔐 Step 2: Cloudflare 로그인"
echo "----------------------------------------"
wrangler login

# 4. 배포
echo ""
echo "🌍 Step 3: Workers 배포"
echo "----------------------------------------"
wrangler deploy

# 5. Workers URL 출력
echo ""
echo "✅ 배포 완료!"
echo ""
echo "📌 다음 단계:"
echo "1. Cloudflare Dashboard에서 GEMINI_API_KEY 환경변수 설정"
echo "   → https://dash.cloudflare.com/"
echo ""
echo "2. ai_lab.html에서 Workers URL 업데이트:"
echo "   const GEMINI_API_URL = 'https://monk-gemini-proxy.YOUR_SUBDOMAIN.workers.dev';"
echo ""
echo "3. 테스트:"
echo "   curl -X POST https://your-worker-url.workers.dev \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"prompt\":\"안녕하세요\"}'"
echo ""
