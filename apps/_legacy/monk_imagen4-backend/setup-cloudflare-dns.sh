#!/bin/bash

# ============================================
# Cloudflare DNS 레코드 추가 스크립트
# ============================================
#
# 용도: image.monkos.ai → ghs.googlehosted.com CNAME 추가
# Cloud Run 커스텀 도메인 매핑용
#
# 사용법:
#   1. .env 파일에 API 토큰 설정
#   2. chmod +x setup-cloudflare-dns.sh
#   3. ./setup-cloudflare-dns.sh
#
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🌐 Cloudflare DNS 레코드 추가 스크립트"
echo "========================================"
echo ""

# .env 파일 로드
if [ -f .env ]; then
    echo "📄 .env 파일 로드 중..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  .env 파일이 없습니다.${NC}"
    echo ""
    echo "다음 내용으로 .env 파일을 생성해주세요:"
    echo ""
    echo "# Cloudflare API 토큰 (DNS 편집 권한 필요)"
    echo "CLOUDFLARE_API_TOKEN=your_api_token_here"
    echo ""
    echo "# monkos.ai 도메인의 Zone ID"
    echo "CLOUDFLARE_ZONE_ID=your_zone_id_here"
    echo ""
    echo "API 토큰 생성: https://dash.cloudflare.com/profile/api-tokens"
    echo "Zone ID 확인: https://dash.cloudflare.com/ > monkos.ai > Overview (오른쪽 하단)"
    exit 1
fi

# 필수 환경변수 확인
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}❌ CLOUDFLARE_API_TOKEN이 설정되지 않았습니다.${NC}"
    exit 1
fi

if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
    echo -e "${RED}❌ CLOUDFLARE_ZONE_ID가 설정되지 않았습니다.${NC}"
    exit 1
fi

# DNS 레코드 설정
RECORD_TYPE="CNAME"
RECORD_NAME="image"
RECORD_CONTENT="ghs.googlehosted.com"
RECORD_TTL=1  # 자동 (Cloudflare 기본값)
PROXIED=false  # SSL 발급 위해 처음엔 DNS Only

echo "✅ 환경변수 로드 완료"
echo ""
echo "📝 추가할 DNS 레코드:"
echo "   Type:    $RECORD_TYPE"
echo "   Name:    $RECORD_NAME.monkos.ai"
echo "   Content: $RECORD_CONTENT"
echo "   Proxied: $PROXIED (DNS Only - SSL 발급 후 변경 가능)"
echo ""

# 기존 레코드 확인
echo "🔍 기존 레코드 확인 중..."
EXISTING_RECORD=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=$RECORD_TYPE&name=$RECORD_NAME.monkos.ai" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

# 응답 확인
if echo "$EXISTING_RECORD" | grep -q '"success":false'; then
    echo -e "${RED}❌ Cloudflare API 오류:${NC}"
    echo "$EXISTING_RECORD" | jq '.errors'
    exit 1
fi

# 레코드 개수 확인
RECORD_COUNT=$(echo "$EXISTING_RECORD" | jq '.result | length')

if [ "$RECORD_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  이미 존재하는 레코드가 있습니다:${NC}"
    echo "$EXISTING_RECORD" | jq '.result[] | {name, type, content, proxied}'
    echo ""
    read -p "기존 레코드를 삭제하고 새로 추가하시겠습니까? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        RECORD_ID=$(echo "$EXISTING_RECORD" | jq -r '.result[0].id')
        echo "🗑️  기존 레코드 삭제 중... (ID: $RECORD_ID)"

        DELETE_RESPONSE=$(curl -s -X DELETE \
          "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$RECORD_ID" \
          -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
          -H "Content-Type: application/json")

        if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ 기존 레코드 삭제 완료${NC}"
        else
            echo -e "${RED}❌ 삭제 실패:${NC}"
            echo "$DELETE_RESPONSE" | jq '.errors'
            exit 1
        fi
    else
        echo "❌ 작업 취소됨"
        exit 0
    fi
fi

# DNS 레코드 추가
echo ""
echo "🚀 DNS 레코드 추가 중..."

RESPONSE=$(curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"type\": \"$RECORD_TYPE\",
    \"name\": \"$RECORD_NAME\",
    \"content\": \"$RECORD_CONTENT\",
    \"ttl\": $RECORD_TTL,
    \"proxied\": $PROXIED
  }")

# 결과 확인
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ DNS 레코드 추가 성공!${NC}"
    echo ""
    echo "📋 레코드 정보:"
    echo "$RESPONSE" | jq '.result | {id, name, type, content, proxied, created_on}'
    echo ""
    echo -e "${GREEN}🎉 설정 완료!${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. SSL 인증서 발급 대기 (5~10분)"
    echo "2. 확인: https://image.monkos.ai"
    echo "3. (선택) Cloudflare Proxy 활성화 (대시보드에서 Orange Cloud 켜기)"
    echo ""
    echo "Cloud Run 서비스: https://monk-image-engine-933456016842.us-central1.run.app"
    echo "커스텀 도메인: https://image.monkos.ai"
else
    echo -e "${RED}❌ DNS 레코드 추가 실패${NC}"
    echo ""
    echo "오류 메시지:"
    echo "$RESPONSE" | jq '.errors'
    exit 1
fi
