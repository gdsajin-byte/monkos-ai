#!/bin/bash

###############################################################################
# MONKOS ID Photo KR Service — Cloud Run 배포
#
# 한국 시장 특화 AI 증명사진 서비스
# idphoto-kr.monkos.ai
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

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_NAME="monkos-idphoto-kr"
GCS_BUCKET="monk-ai-images"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

# API Key — .env에서 읽기 (하드코딩 금지)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "${SCRIPT_DIR}/../.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/../.env" | cut -d'=' -f2)
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/.env" | cut -d'=' -f2)
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${RED}에러: GEMINI_API_KEY를 찾을 수 없습니다${NC}"
  exit 1
fi

if [ "$ENV" = "staging" ]; then
  SERVICE_NAME="monkos-idphoto-kr-staging"
fi

# 0. monkos-AI 레포 subtree push
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
echo -e "\n${GREEN}[0/4]${NC} monkos-AI 레포 동기화 중..."
cd "${REPO_ROOT}"
git subtree push --prefix=monkos_AI monkos-ai main 2>/dev/null && \
  echo -e "${GREEN}  subtree push 완료${NC}" || \
  echo -e "${YELLOW}  subtree push 스킵 (변경 없음 or 리모트 미설정)${NC}"
cd "${SCRIPT_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS ID Photo KR Service 배포${NC}"
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
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET},GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --service-account ${SERVICE_ACCOUNT}

# 4. 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e "${BLUE}========================================${NC}"
