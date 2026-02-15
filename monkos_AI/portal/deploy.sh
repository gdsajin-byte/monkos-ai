#!/bin/bash

###############################################################################
# MONKOS Portal — Cloud Run 배포
#
# monkos.ai 메인 포털 (Gemini 2.0 챗봇 + 국가별 분기)
#
# 사용법:
#   ./deploy.sh [환경]
#
# 환경:
#   production (기본값)
#   staging
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-production}

# .env 로드
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo -e "${GREEN}.env 로드 완료${NC}"
fi

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_NAME="monkos-portal"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

if [ "$ENV" = "staging" ]; then
  SERVICE_NAME="monkos-portal-staging"
fi

# 0. monkos-AI 레포 subtree push
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
echo -e "\n${GREEN}[0/4]${NC} monkos-AI 레포 동기화 중..."
cd "${REPO_ROOT}"
git subtree push --prefix=monkos_AI monkos-ai main 2>/dev/null && \
  echo -e "${GREEN}  subtree push 완료${NC}" || \
  echo -e "${YELLOW}  subtree push 스킵 (변경 없음 or 리모트 미설정)${NC}"
cd "${SCRIPT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS Portal 배포${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "환경: ${YELLOW}${ENV}${NC}"
echo -e "프로젝트: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "리전: ${YELLOW}${REGION}${NC}"
echo -e "서비스: ${YELLOW}${SERVICE_NAME}${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. GCP 프로젝트 설정
echo -e "\n${GREEN}[1/4]${NC} GCP 프로젝트 설정..."
gcloud config set project ${PROJECT_ID}

# 2. Docker 이미지 빌드
echo -e "\n${GREEN}[2/4]${NC} Docker 이미지 빌드 중..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# 3. Cloud Run 배포
echo -e "\n${GREEN}[3/4]${NC} Cloud Run 배포 중..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 60 \
  --concurrency 100 \
  --min-instances 0 \
  --max-instances 5 \
  --update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},KAKAO_REST_API_KEY=${KAKAO_REST_API_KEY},KAKAO_REDIRECT_URI=${KAKAO_REDIRECT_URI},KAKAO_CLIENT_SECRET=${KAKAO_CLIENT_SECRET},TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN},TELEGRAM_EVENT_BOT_TOKEN=${TELEGRAM_EVENT_BOT_TOKEN},TOSS_SECRET_KEY=${TOSS_SECRET_KEY},LEMONSQUEEZY_API_KEY=${LEMONSQUEEZY_API_KEY},LEMONSQUEEZY_WEBHOOK_SECRET=${LEMONSQUEEZY_WEBHOOK_SECRET},LINE_CHANNEL_ID=${LINE_CHANNEL_ID},LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET},TX_API_KEY=${TX_API_KEY},TX_API_URL=${TX_API_URL}" \
  --service-account ${SERVICE_ACCOUNT}

# 4. 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e ""
echo -e "${YELLOW}도메인 매핑 (최초 1회):${NC}"
echo -e "  gcloud beta run domain-mappings create \\"
echo -e "    --service ${SERVICE_NAME} \\"
echo -e "    --domain monkos.ai \\"
echo -e "    --region ${REGION}"
echo -e "${BLUE}========================================${NC}"
