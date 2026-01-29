#!/bin/bash

###############################################################################
# MONKOS Image Engine - Cloud Run 배포 스크립트
#
# 사용법:
#   ./deploy.sh [환경]
#
# 환경:
#   production (기본값) - 프로덕션 배포
#   staging              - 스테이징 배포
###############################################################################

set -e  # 에러 발생 시 즉시 종료

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 설정
ENV=${1:-production}

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_NAME="monk-image-engine"
GCS_BUCKET="monk-ai-images"

# 환경별 설정
if [ "$ENV" = "staging" ]; then
  SERVICE_NAME="monk-image-engine-staging"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS Image Engine 배포${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "환경: ${YELLOW}${ENV}${NC}"
echo -e "프로젝트: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "리전: ${YELLOW}${REGION}${NC}"
echo -e "서비스: ${YELLOW}${SERVICE_NAME}${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. GCP 프로젝트 설정
echo -e "\n${GREEN}[1/5]${NC} GCP 프로젝트 설정..."
gcloud config set project ${PROJECT_ID}

# 2. Cloud Build API 활성화 확인
echo -e "\n${GREEN}[2/5]${NC} 필요한 API 활성화 확인..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage-api.googleapis.com

# 3. Docker 이미지 빌드 및 푸시 (Cloud Build 사용)
echo -e "\n${GREEN}[3/5]${NC} Docker 이미지 빌드 중..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# 4. Cloud Run 배포
echo -e "\n${GREEN}[4/5]${NC} Cloud Run에 배포 중..."
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
  --set-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET}" \
  --service-account monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com

# 5. 배포 정보 출력
echo -e "\n${GREEN}[5/5]${NC} 배포 완료!"

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 배포 성공!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/${NC}"
echo -e "이미지 생성: ${YELLOW}${SERVICE_URL}/generate${NC}"
echo -e "${BLUE}========================================${NC}"

# 테스트 요청 예시
echo -e "\n${YELLOW}테스트 예시:${NC}"
echo -e "curl -X POST ${SERVICE_URL}/generate \\"
echo -e "  -H 'Content-Type: application/json' \\"
echo -e "  -d '{"
echo -e "    \"prompt\": \"A beautiful Korean woman with elegant makeup\","
echo -e "    \"aspectRatio\": \"1:1\","
echo -e "    \"numberOfImages\": 1"
echo -e "  }'"

echo -e "\n${GREEN}배포 완료!${NC}"
