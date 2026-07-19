#!/bin/bash
# Google Ads OAuth — 수동 코드 입력 모드
set -euo pipefail

PROJECT="monkos"
REDIRECT_URI="http://localhost:8085"

CLIENT_ID=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_ID --project="$PROJECT")
CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_SECRET --project="$PROJECT")

echo "=== Refresh Token 교환 (수동) ==="
echo "브라우저 주소창에서 code= 뒤의 값을 복사하세요 (& 앞까지)"
echo ""
read -p "인증 코드: " AUTH_CODE

AUTH_CODE=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$AUTH_CODE'))")

echo "토큰 교환 중..."
RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "code=${AUTH_CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code")

REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

if [ -z "$REFRESH_TOKEN" ]; then
  echo "❌ 실패:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✅ Refresh Token 발급 성공!"
echo ""
echo "SM에 자동 등록합니다..."
echo "$REFRESH_TOKEN" | gcloud secrets create GOOGLE_ADS_REFRESH_TOKEN --data-file=- --project="$PROJECT" 2>/dev/null \
  || echo "$REFRESH_TOKEN" | gcloud secrets versions add GOOGLE_ADS_REFRESH_TOKEN --data-file=- --project="$PROJECT"
echo "✅ GOOGLE_ADS_REFRESH_TOKEN 등록 완료"

echo "6634139609" | gcloud secrets create GOOGLE_ADS_CUSTOMER_ID --data-file=- --project="$PROJECT" 2>/dev/null \
  || echo "6634139609" | gcloud secrets versions add GOOGLE_ADS_CUSTOMER_ID --data-file=- --project="$PROJECT"
echo "✅ GOOGLE_ADS_CUSTOMER_ID 등록 완료"

echo ""
echo "=== 전체 완료 ==="
echo "secret check GOOGLE_ADS_REFRESH_TOKEN"
echo "secret check GOOGLE_ADS_CUSTOMER_ID"
