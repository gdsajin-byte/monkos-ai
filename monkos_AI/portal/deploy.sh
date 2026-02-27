#!/bin/bash

###############################################################################
# MONKOS Portal — Cloud Run 배포
#
# monkos.ai 메인 포털 (인증 + 크레딧 + 결제)
#
# 사용법:
#   ./deploy.sh [dev|prod]
#
# 환경:
#   dev   → dev 서비스에 배포 (테스트)
#   prod  → production 서비스에 배포 (실서비스)
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-""}

# 인자 필수
if [ -z "$ENV" ]; then
  echo -e "${RED}사용법: ./deploy.sh [dev|prod]${NC}"
  echo -e "  dev   → dev 서비스에 배포 (테스트)"
  echo -e "  prod  → production 서비스에 배포 (실서비스)"
  exit 1
fi

# 유효한 환경값 체크
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo -e "${RED}에러: 환경은 'dev' 또는 'prod'만 가능합니다${NC}"
  exit 1
fi

# .env 로드
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo -e "${GREEN}.env 로드 완료${NC}"
fi

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

# 환경별 설정 (Portal은 경량 서비스)
if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="monkos-portal-dev"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="2"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="5"

  # 브랜치 안전장치
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}production 배포는 main 브랜치에서만 가능합니다 (현재: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "취소됨"
    exit 0
  fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS Portal 배포${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "환경: ${YELLOW}${ENV}${NC}"
echo -e "프로젝트: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "리전: ${YELLOW}${REGION}${NC}"
echo -e "서비스: ${YELLOW}${SERVICE_NAME}${NC}"
echo -e "리소스: ${YELLOW}${MEMORY} / ${CPU} CPU / max ${MAX_INSTANCES}${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. GCP 프로젝트 설정
echo -e "\n${GREEN}[1/3]${NC} GCP 프로젝트 설정..."
gcloud config set project ${PROJECT_ID}

# 2. Docker 이미지 빌드
echo -e "\n${GREEN}[2/3]${NC} Docker 이미지 빌드 중..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# 3. Cloud Run 배포
echo -e "\n${GREEN}[3/3]${NC} Cloud Run 배포 중..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 60 \
  --concurrency 100 \
  --min-instances 0 \
  --max-instances ${MAX_INSTANCES} \
  --update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},KAKAO_REST_API_KEY=${KAKAO_REST_API_KEY},KAKAO_REDIRECT_URI=${KAKAO_REDIRECT_URI},KAKAO_CLIENT_SECRET=${KAKAO_CLIENT_SECRET},TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN},TELEGRAM_EVENT_BOT_TOKEN=${TELEGRAM_EVENT_BOT_TOKEN},TOSS_SECRET_KEY=${TOSS_SECRET_KEY},LEMONSQUEEZY_API_KEY=${LEMONSQUEEZY_API_KEY},LEMONSQUEEZY_WEBHOOK_SECRET=${LEMONSQUEEZY_WEBHOOK_SECRET},LINE_CHANNEL_ID=${LINE_CHANNEL_ID},LINE_CHANNEL_SECRET=${LINE_CHANNEL_SECRET},TX_API_KEY=${TX_API_KEY},TX_API_URL=${TX_API_URL},TELEGRAM_TEAM_BOT_TOKEN=${TELEGRAM_TEAM_BOT_TOKEN},TEAM_CHAT_ID=${TEAM_CHAT_ID},TEAM_NOTIFY_SECRET=${TEAM_NOTIFY_SECRET},KAKAO_CHANNEL_ID=${KAKAO_CHANNEL_ID}" \
  --service-account ${SERVICE_ACCOUNT}

# 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e ""
if [ "$ENV" = "prod" ]; then
  echo -e "${YELLOW}도메인 매핑 (최초 1회):${NC}"
  echo -e "  gcloud beta run domain-mappings create \\"
  echo -e "    --service ${SERVICE_NAME} \\"
  echo -e "    --domain monkos.ai \\"
  echo -e "    --region ${REGION}"
fi
echo -e "${BLUE}========================================${NC}"
