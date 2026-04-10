#!/bin/bash

###############################################################################
# MONKOS Portal — Cloud Run 배포
#
# monkos.ai 메인 포털 (인증 + 크레딧 + 결제)
#
# 사용법:
#   ./deploy.sh [dev|prod|preview]
#
# 환경:
#   dev     → dev 서비스에 배포 (테스트)
#   prod    → production 서비스에 배포 (실서비스)
#   preview → prod 이미지 빌드 → 트래픽 0%로 배포 → 태그 URL 반환
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
  echo -e "${RED}사용법: ./deploy.sh [dev|prod|preview]${NC}"
  echo -e "  dev     → dev 서비스에 배포 (테스트)"
  echo -e "  prod    → production 서비스에 배포 (실서비스)"
  echo -e "  preview → prod 이미지 → 트래픽 0% 배포 (블루/그린 검증용)"
  exit 1
fi

# 유효한 환경값 체크
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ] && [ "$ENV" != "preview" ]; then
  echo -e "${RED}에러: 환경은 'dev', 'prod', 'preview'만 가능합니다${NC}"
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
  DEPLOY_FLAGS=""
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="5"
  DEPLOY_FLAGS=""

  # 브랜치 안전장치
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}production 배포는 main 브랜치에서만 가능합니다 (현재: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  # 결제 키 안전장치: GCP에 세팅된 키가 라이브인지 확인 (deploy.sh는 시크릿을 덮어쓰지 않음)
  CURRENT_TOSS=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project=${PROJECT_ID} --format=yaml 2>/dev/null | grep -A1 "name: TOSS_SECRET_KEY" | grep value | awk '{print $2}')
  if [ -n "$CURRENT_TOSS" ] && [[ ! "$CURRENT_TOSS" == live_* ]]; then
    echo -e "${RED}🚨 GCP의 TOSS_SECRET_KEY가 라이브 키가 아닙니다 (현재: ${CURRENT_TOSS:0:10}...)${NC}"
    echo -e "${RED}GCP 콘솔에서 라이브 키로 교체 후 다시 시도하세요.${NC}"
    exit 1
  fi

  echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "취소됨"
    exit 0
  fi

elif [ "$ENV" = "preview" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="5"
  DEPLOY_FLAGS="--no-traffic --tag v4-preview"

  # 브랜치 안전장치
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}preview 배포는 main 브랜치에서만 가능합니다 (현재: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠ PREVIEW 배포 (트래픽 0%, 태그 URL 생성). 계속하시겠습니까? (y/N)${NC}"
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

# === 환경변수 가드 (4f71cbc 사고 재발 방지, 2026-04-10) ===
if [ -z "$GCS_BUCKET" ]; then
  echo -e "${RED}🚨 GCS_BUCKET 미설정. .env 또는 환경변수 확인 후 재시도.${NC}"
  echo -e "${RED}   참고: 진짜 버킷명은 monk-ai-images (config.js:66 폴백과 일치)${NC}"
  exit 1
fi
if [ -z "$ADMIN_UIDS" ]; then
  echo -e "${RED}🚨 ADMIN_UIDS 미설정. 빈값 배포 시 모든 로그인 사용자가 admin 권한 획득.${NC}"
  echo -e "${RED}   .env에 ADMIN_UIDS=uid1,uid2,uid3 추가 후 재시도.${NC}"
  exit 1
fi

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
  --update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::ADMIN_UIDS=${ADMIN_UIDS}" \
  --service-account ${SERVICE_ACCOUNT} \
  ${DEPLOY_FLAGS}

# 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}배포 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "서비스 URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "헬스 체크: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e ""

if [ "$ENV" = "preview" ]; then
  PREVIEW_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format json \
    | python3 -c "import sys,json; d=json.load(sys.stdin); tags=[t for t in d.get('status',{}).get('traffic',[]) if t.get('tag')=='v4-preview']; print(tags[0]['url'] if tags else 'URL 확인 필요')" 2>/dev/null || echo "태그 URL 확인 필요")
  echo -e "${GREEN}Preview 태그 URL:${NC}"
  echo -e "  ${YELLOW}${PREVIEW_URL}${NC}"
  echo -e ""
  echo -e "${YELLOW}검증 후 트래픽 전환:${NC}"
  echo -e "  gcloud run services update-traffic ${SERVICE_NAME} \\"
  echo -e "    --region ${REGION} \\"
  echo -e "    --to-latest"
  echo -e ""
  echo -e "${YELLOW}롤백 명령:${NC}"
  echo -e "  gcloud run services update-traffic ${SERVICE_NAME} \\"
  echo -e "    --region ${REGION} \\"
  echo -e "    --to-revisions REVISION_NAME=100"

elif [ "$ENV" = "prod" ]; then
  echo -e "${YELLOW}도메인 매핑 (최초 1회):${NC}"
  echo -e "  gcloud beta run domain-mappings create \\"
  echo -e "    --service ${SERVICE_NAME} \\"
  echo -e "    --domain monkos.ai \\"
  echo -e "    --region ${REGION}"
  echo -e ""
  echo -e "${YELLOW}롤백 명령:${NC}"
  echo -e "  gcloud run services update-traffic ${SERVICE_NAME} \\"
  echo -e "    --region ${REGION} \\"
  echo -e "    --to-revisions REVISION_NAME=100"
fi

echo -e "${BLUE}========================================${NC}"
