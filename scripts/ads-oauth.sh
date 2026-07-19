#!/bin/bash
# Google Ads API OAuth — 브라우저 인증 → Refresh Token → SM 등록 원스톱
# 사용: ./scripts/ads-oauth.sh
# 작가님 전용 — 에이전트 실행 금지 (시크릿 값 접촉)

set -euo pipefail

PROJECT="monkos"
SCOPE="https://www.googleapis.com/auth/adwords"
REDIRECT_URI="http://localhost:8085"

echo "=== Google Ads OAuth — 원스톱 발급 ==="
echo ""

# 1. SM에서 Client ID / Secret 가져오기
CLIENT_ID=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_ID --project="$PROJECT" 2>/dev/null)
CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_SECRET --project="$PROJECT" 2>/dev/null)

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "❌ GOOGLE_ADS_CLIENT_ID 또는 CLIENT_SECRET이 SM에 없습니다."
  exit 1
fi

# 2. 인증 URL 생성 + 브라우저 열기
AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&response_type=code&access_type=offline&prompt=consent"

echo "브라우저가 열립니다."
echo "  → Google 로그인 → 고급 → 앱으로 이동 → 권한 승인"
echo "  → 주소창에서 code= 뒤의 값을 복사 (& 앞까지)"
echo ""
open "$AUTH_URL"

# 3. 코드 입력
read -p "인증 코드 붙여넣기: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
  echo "❌ 인증 코드가 비어 있습니다."
  exit 1
fi

# URL 디코딩
AUTH_CODE=$(python3 -c "import urllib.parse; print(urllib.parse.unquote('$AUTH_CODE'))")

# 4. 코드 → Refresh Token 교환
echo ""
echo "토큰 교환 중..."
RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "code=${AUTH_CODE}" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code")

REFRESH_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('refresh_token',''))" 2>/dev/null)

if [ -z "$REFRESH_TOKEN" ]; then
  echo "❌ Refresh Token 발급 실패:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
  exit 1
fi

echo "✅ Refresh Token 발급 성공!"

# 5. SM에 자동 등록 — Refresh Token
echo ""
echo "SM 등록 중..."
echo "$REFRESH_TOKEN" | gcloud secrets create GOOGLE_ADS_REFRESH_TOKEN --data-file=- --project="$PROJECT" 2>/dev/null \
  || echo "$REFRESH_TOKEN" | gcloud secrets versions add GOOGLE_ADS_REFRESH_TOKEN --data-file=- --project="$PROJECT"
echo "✅ GOOGLE_ADS_REFRESH_TOKEN 등록 완료"

# 6. Customer ID 등록
echo "6634139609" | gcloud secrets create GOOGLE_ADS_CUSTOMER_ID --data-file=- --project="$PROJECT" 2>/dev/null \
  || echo "6634139609" | gcloud secrets versions add GOOGLE_ADS_CUSTOMER_ID --data-file=- --project="$PROJECT"
echo "✅ GOOGLE_ADS_CUSTOMER_ID 등록 완료"

echo ""
echo "=== 전체 완료 ==="
echo "등록된 시크릿 5종:"
for s in GOOGLE_ADS_DEV_TOKEN GOOGLE_ADS_CLIENT_ID GOOGLE_ADS_CLIENT_SECRET GOOGLE_ADS_REFRESH_TOKEN GOOGLE_ADS_CUSTOMER_ID; do
  gcloud secrets versions list "$s" --project="$PROJECT" --limit=1 --format="value(name,state)" 2>/dev/null \
    && echo "  ✅ $s" || echo "  ❌ $s 미등록"
done
