#!/bin/bash
# Firestore TTL 정책 활성화 명령
#
# ⚠️ 실행 전 작가님 확인 필요
# ⚠️ PROJECT_ID 확인 후 실행할 것 (헌법 6조: 추측 금지)
#
# 확인 방법:
#   gcloud config get-value project
#   또는: cat monkos_AI/portal/lib/shared/config.js | grep PROJECT_ID

PROJECT_ID="${PROJECT_ID:-monkos}"

echo "=== Firestore TTL 정책 활성화 ==="
echo "프로젝트: $PROJECT_ID"
echo ""
echo "다음 명령을 순서대로 실행합니다:"
echo ""

# 1. 채팅 대화 (90일 TTL)
echo "--- chat_conversations (90일) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=chat_conversations \\"
echo "  --project=$PROJECT_ID"
echo ""

# 2. CS 대화 (3년 TTL)
echo "--- cs_conversations (3년) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=cs_conversations \\"
echo "  --project=$PROJECT_ID"
echo ""

# 3. 카카오 대화 (90일 TTL)
echo "--- kakao_conversations (90일) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=kakao_conversations \\"
echo "  --project=$PROJECT_ID"
echo ""

# 4. idphoto-kr 대화 (90일 TTL)
echo "--- idphoto_kr_conversations (90일) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=idphoto_kr_conversations \\"
echo "  --project=$PROJECT_ID"
echo ""

# 5. prep 대화 (90일 TTL)
echo "--- prep_conversations (90일) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=prep_conversations \\"
echo "  --project=$PROJECT_ID"
echo ""

# 6. telegramGateCodes (24시간 TTL)
echo "--- telegramGateCodes (24시간) ---"
echo "gcloud firestore fields ttls update expireAt \\"
echo "  --collection-group=telegramGateCodes \\"
echo "  --project=$PROJECT_ID"
echo ""

echo "=== 실행 후 확인 ==="
echo "gcloud firestore fields ttls list --project=$PROJECT_ID"
