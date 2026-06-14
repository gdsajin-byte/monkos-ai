#!/bin/bash

###############################################################################
# 장삼이사(張三李四) — Cloud Run 배포
#
# 삼국지 텍스트 어드벤처 POC
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

if [ -z "$ENV" ]; then
  echo -e "${RED}사용법: ./deploy.sh [dev|prod]${NC}"
  echo -e "  dev   → dev 서비스에 배포 (테스트)"
  echo -e "  prod  → production 서비스에 배포 (실서비스)"
  exit 1
fi

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo -e "${RED}에러: 환경은 'dev' 또는 'prod'만 가능합니다${NC}"
  exit 1
fi

PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="jangsam-dev"
  MEMORY="256Mi"
  CPU="1"
  MAX_INSTANCES="2"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="jangsam"
  MEMORY="256Mi"
  CPU="1"
  MAX_INSTANCES="5"

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
echo -e "${BLUE}장삼이사 Cloud Run 배포${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "환경: ${YELLOW}${ENV}${NC}"
echo -e "프로젝트: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "리전: ${YELLOW}${REGION}${NC}"
echo -e "서비스: ${YELLOW}${SERVICE_NAME}${NC}"
echo -e "리소스: ${YELLOW}${MEMORY} / ${CPU} CPU / max ${MAX_INSTANCES}${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${GREEN}[1/3]${NC} GCP 프로젝트 설정..."
gcloud config set project ${PROJECT_ID}

echo -e "\n${GREEN}[2/3]${NC} Docker 이미지 빌드 중..."
cd "$SCRIPT_DIR"
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

echo -e "\n${GREEN}[3/3]${NC} Cloud Run 배포 중..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 60 \
  --concurrency 80 \
  --max-instances ${MAX_INSTANCES} \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --service-account ${SERVICE_ACCOUNT}

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e "${BLUE}========================================${NC}"
