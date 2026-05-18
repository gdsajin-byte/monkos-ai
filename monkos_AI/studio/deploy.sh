#!/bin/bash

###############################################################################
# MONKOS Studio — Cloud Run 배포
#
# 내부용 AI 보정 앱
#
# 사용법:
#   ./deploy.sh [dev|prod]
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
  exit 1
fi

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo -e "${RED}에러: 환경은 'dev' 또는 'prod'만 가능합니다${NC}"
  exit 1
fi

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
GCS_BUCKET="monk-ai-images"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 시크릿은 GCP에 세팅된 값 유지 — deploy.sh가 덮어쓰지 않음
# GEMINI_API_KEY 등 시크릿은 GCP 콘솔 또는 gcloud로 1회 세팅

# 환경별 설정
if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="monkos-studio-dev"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="2"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-studio"
  MEMORY="1Gi"
  CPU="1"
  MAX_INSTANCES="5"

  echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "취소됨"
    exit 0
  fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS Studio 배포${NC}"
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
  --timeout 300 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances ${MAX_INSTANCES} \
  --update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET}" \
  --service-account ${SERVICE_ACCOUNT}

# 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e "${BLUE}========================================${NC}"
