#!/bin/bash

###############################################################################
# MONKOS Portal — Cloud Run 배포
#
# monkos.ai 메인 포털 (인증 + 크레딧 + 결제)
#
# 사용법:
#   ./deploy.sh [dev|prod|preview] [--yes|-y]
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

AUTO_YES=0
ENV=""
for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_YES=1 ;;
    *) [ -z "$ENV" ] && ENV="$arg" ;;
  esac
done

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

# === 비시크릿 운영값 (deploy.sh가 정본, .env 의존 금지) ===
# 4f71cbc 사고(2026-04-10) 재발 방지: 폴백값과 .env 누락이 트리거였음
# - GCS_BUCKET: 코드 폴백(config.js:66) + idphoto deploy.sh와 일치하는 단일 진실값
# - ADMIN_UIDS: Google sub UID 리스트, 시크릿 아님 (외부 노출 무해)
#   추가/제거 시 monkos_AI/portal/scripts/find_admin_uids.js 사용
GCS_BUCKET="monk-ai-images"
ADMIN_UIDS="108827115052045057530,115646365617285208759"
# 스펙스 규격 안착 크롭 엔진 (2026-07-06, DESIGN_20260705 옵션 B) — monkos-crop-engine Cloud Run
CROP_ENGINE_URL="https://monkos-crop-engine-933456016842.asia-northeast3.run.app"
# 2026-07-07: .env 미비 디바이스(M1 등)에서 배포 시 빈값 덮임 방지 — 라이브 정본값 명시 (비시크릿)
CHAT_WORKERS_URL="${CHAT_WORKERS_URL:-https://monk.kr/api/chat}"
NAVER_CLIENT_ID="${NAVER_CLIENT_ID:-JaqN_J5ashaxBC7t6aya}"
# === matte 신경로 — 4060 우선 + RunPod 폴백 (2026-07-23 Phase 4 배선) ===
# 우선순위 체인: 4060(₩0) → RunPod T4 flex(₩수 원) → 전부 실패 시 Gemini L3.
# 각 엔드포인트는 2.5s /health 프리플라이트로 생사 판정 후 본 호출.
MATTE_API_URLS="https://matte.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34"
# 카나리 게이트 (2026-07-07 작가님): kr-passport 파일럿 → 크롭 정확도·디자인 검증 후 확산. 빈값 = 전 슬러그
MATTE_SLUGS=""  # 빈 값 = 전 슬러그 매팅 허용 (2026-07-11 작가님 T0 전면 개방 지시. 카나리 kr-passport 졸업)
# T1 의상+보정 파일럿 (2026-07-11): 유료 게이트 한정. 원본→나노2(v4)→crop-engine. RunPod 불필요.
PILOT_T1_RETOUCH="1"

# 환경별 설정 (Portal은 경량 서비스)
if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="monkos-portal-dev"
  MEMORY="1Gi"
  CPU="1"
  MIN_INSTANCES="0"  # dev는 콜드스타트 허용 (유휴 과금 방지)
  MAX_INSTANCES="2"
  FREE_QUOTA_BYPASS="1"  # dev 무료 횟수 제한 해제
  TOSS_CLIENT_KEY_NAME="TOSS_CLIENT_KEY_TEST"  # dev 테스트 클라이언트 키 (SM 참조)
  TOSS_SECRET_KEY_NAME="TOSS_SECRET_KEY_TEST"  # dev 테스트 시크릿 키
  DEPLOY_FLAGS=""
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="1Gi"
  CPU="1"
  MIN_INSTANCES="1"  # prod 상시 대기 = 콜드스타트 이탈 방지 (변경 금지)
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

  if [ "$AUTO_YES" != "1" ]; then
    if [ ! -t 0 ]; then
      echo -e "${RED}ERROR: 비TTY 환경에서는 --yes 플래그가 필요합니다 (조용한 미배포 방지, ch5)${NC}" >&2
      exit 1
    fi
    echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
    read -r confirm
    if [ "$confirm" != "y" ]; then
      echo "취소됨"
      exit 0
    fi
  fi

elif [ "$ENV" = "preview" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="1Gi"
  CPU="1"
  MIN_INSTANCES="0"  # --no-traffic 태그 리비전 = 트래픽 0 → 웜 불요 (2026-07-26 유휴 1대 31일 점유 실측)
  MAX_INSTANCES="5"
  DEPLOY_FLAGS="--no-traffic --tag v4-preview"

  # 브랜치 안전장치
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}preview 배포는 main 브랜치에서만 가능합니다 (현재: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  if [ "$AUTO_YES" != "1" ]; then
    if [ ! -t 0 ]; then
      echo -e "${RED}ERROR: 비TTY 환경에서는 --yes 플래그가 필요합니다 (조용한 미배포 방지, ch5)${NC}" >&2
      exit 1
    fi
    echo -e "${YELLOW}⚠ PREVIEW 배포 (트래픽 0%, 태그 URL 생성). 계속하시겠습니까? (y/N)${NC}"
    read -r confirm
    if [ "$confirm" != "y" ]; then
      echo "취소됨"
      exit 0
    fi
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
cd "$SCRIPT_DIR"
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# 3. Cloud Run 배포
echo -e "\n${GREEN}[3/3]${NC} Cloud Run 배포 중..."

# 토스 클라이언트 키: dev=TOSS_CLIENT_KEY_TEST / prod=TOSS_CLIENT_KEY — 둘 다 SM 참조 (2026-07-25 평문 하드코딩 제거)
# TEAM_CHAT_ID: 팀 알림 텔레그램 채널(비시크릿 정본값) — 4f71cbc 빈값 덮임 사고 재발 방지 정본화 (2026-07-14 작가님 승인)
# TELEGRAM_TEAM_BOT_TOKEN·TEAM_NOTIFY_SECRET은 시크릿 성격 — deploy.sh 비기재, 서비스 env 직주입 유지 (--update-env-vars는 미나열 키 보존)
ENV_VARS="^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::CHAT_WORKERS_URL=${CHAT_WORKERS_URL}::NAVER_CLIENT_ID=${NAVER_CLIENT_ID}::CROP_ENGINE_URL=${CROP_ENGINE_URL}::MATTE_API_URLS=${MATTE_API_URLS}::MATTE_SLUGS=${MATTE_SLUGS}::PILOT_T1_RETOUCH=${PILOT_T1_RETOUCH}::FREE_QUOTA_BYPASS=${FREE_QUOTA_BYPASS:-0}::GEN_DELIVERY_DEADLINE_MS=${GEN_DELIVERY_DEADLINE_MS:-115000}::TEAM_CHAT_ID=-1003794441262"
SECRETS="CHAT_API_KEY=CHAT_API_KEY:latest,NAVER_CLIENT_SECRET=NAVER_CLIENT_SECRET:latest,ADMIN_UIDS=ADMIN_UIDS:latest,AGENT_API_KEYS=AGENT-API-KEYS:latest,LEMONSQUEEZY_API_KEY=LEMONSQUEEZY_API_KEY:latest,LEMONSQUEEZY_WEBHOOK_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest,LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL=LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL:latest,LEMONSQUEEZY_VARIANT_SPECS_SINGLE=LEMONSQUEEZY_VARIANT_SPECS_SINGLE:latest,MATTE_API_KEY=RUNPOD_API_KEY:latest,MATTE_SECRET=MATTE_SECRET:latest,NAVER_SEARCHAD_API_KEY=NAVER_SEARCHAD_API_KEY:latest,NAVER_SEARCHAD_SECRET_KEY=NAVER_SEARCHAD_SECRET_KEY:latest,NAVER_SEARCHAD_CUSTOMER_ID=NAVER_SEARCHAD_CUSTOMER_ID:latest,NAVER_DATALAB_CLIENT_ID=NAVER_DATALAB_CLIENT_ID:latest,NAVER_DATALAB_CLIENT_SECRET=NAVER_DATALAB_CLIENT_SECRET:latest,BING_WMT_API_KEY=BING_WMT_API_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest"

# dev/prod 토스 키 분기 — 값은 전부 SM 정본 참조 (평문 기재 금지, 헌법 4조 1항)
SECRETS="${SECRETS},TOSS_CLIENT_KEY=${TOSS_CLIENT_KEY_NAME:-TOSS_CLIENT_KEY}:latest"
SECRETS="${SECRETS},TOSS_SECRET_KEY=${TOSS_SECRET_KEY_NAME:-TOSS_SECRET_KEY}:latest"

# 2026-07-25 이행 정리: 과거 dev는 TOSS_CLIENT_KEY를 평문 env로 주입했다.
# 같은 키가 평문 env와 시크릿 참조로 동시에 존재하면 Cloud Run이 배포를 거부하므로 선제 제거한다.
if gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project=${PROJECT_ID} \
     --format=json 2>/dev/null | tr -d ' \n' \
     | grep -q '"name":"TOSS_CLIENT_KEY","value":'; then
  echo -e "${YELLOW}⚠ 과거 평문 TOSS_CLIENT_KEY env 감지 — 시크릿 참조 전환 위해 제거${NC}"
  gcloud run services update ${SERVICE_NAME} --region ${REGION} --project=${PROJECT_ID} \
    --remove-env-vars=TOSS_CLIENT_KEY
fi

gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 120 \
  --concurrency 20 \
  --min-instances ${MIN_INSTANCES} \
  --max-instances ${MAX_INSTANCES} \
  --update-env-vars "${ENV_VARS}" \
  --set-secrets="${SECRETS}" \
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
