#!/bin/bash

###############################################################################
# MONKOS ID Photo JP Service — Cloud Run 배포
#
# 일본 시장 특화 AI 증명사진 서비스
# idphoto-jp.monkos.ai
#
# 사용법:
#   ./deploy.sh [dev|prod]
#
# 환경:
#   dev   → dev 서비스에 배포 (테스트)
#   prod  → production 서비스에 배포 (실서비스)
###############################################################################

set -eo pipefail
# ── 미커밋 게이트 (G4 2026-09-01 민아) — 커밋 안 된 코드의 무음 탑승 방지
_DDIR="$(cd "$(dirname "$0")" && pwd)"
_DIRTY="$(git -C "$_DDIR" status --porcelain -- . 2>/dev/null | head -5)"
if [ -n "$_DIRTY" ]; then
  echo "⚠️  이 서비스 디렉토리에 미커밋 변경 존재 — 커밋 안 된 코드가 배포에 실릴 수 있습니다:" >&2
  echo "$_DIRTY" >&2
  case " $* " in *" --yes "*|*" -y "*) echo "   (--yes: 경고 후 진행)";; *)
    { read -r -p "   계속하시겠습니까? [y/N] " _DGA </dev/tty; } 2>/dev/null || _DGA=n
    case "$_DGA" in y|Y) ;; *) echo "   중단 — 커밋 후 재시도하세요." >&2; exit 1;; esac;;
  esac
fi

# ── 이중 소스 경고 (G6 2026-09-01 민아) — 같은 서비스를 배포하는 디렉토리 2곳 (references.md §서비스 매핑)
echo "⚠️  이중 소스 서비스: monkos-idphoto-jp ← [apps/idphoto-jp-v079] 및 [monkos_AI/idphoto-jp]. 마지막 배포가 덮어씁니다." >&2
case " $* " in *" --yes "*|*" -y "*) ;; *)
  { read -r -p "   이 디렉토리(apps/idphoto-jp-v079)가 현행 정본입니까? [y/N] " _DSA </dev/tty; } 2>/dev/null || _DSA=n
  case "$_DSA" in y|Y) ;; *) echo "   중단 — 정본 확인: .claude/rules/references.md" >&2; exit 1;; esac;;
esac


RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-""}

# 인자 필수
if [ -z "$ENV" ]; then
  echo -e "${RED}사용법: ./deploy.sh [dev|prod]${NC}"
  echo -e "  dev   → dev 서비스에 배포 (テスト)"
  echo -e "  prod  → production 서비스에 배포 (本番)"
  exit 1
fi

# 유효한 환경값 체크
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo -e "${RED}エラー: 環境は 'dev' または 'prod' のみ可能です${NC}"
  exit 1
fi

# GCP 설정
PROJECT_ID="monkos"
REGION="us-central1"
GCS_BUCKET="monk-ai-images"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# API Key — .env에서 읽기 (하드코딩 금지)
if [ -f "${SCRIPT_DIR}/../.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/../.env" | cut -d'=' -f2)
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/.env" | cut -d'=' -f2)
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${RED}エラー: GEMINI_API_KEY が見つかりません${NC}"
  exit 1
fi

# 환경별 설정
if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="monkos-idphoto-jp-dev"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="2"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-idphoto-jp"
  MEMORY="2Gi"
  CPU="2"
  MAX_INSTANCES="10"

  # 브랜치 안전장치
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}production 배포는 main 브랜치에서만 가능합니다 (現在: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "キャンセル"
    exit 0
  fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MONKOS ID Photo JP Service 배포${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "環境: ${YELLOW}${ENV}${NC}"
echo -e "プロジェクト: ${YELLOW}${PROJECT_ID}${NC}"
echo -e "リージョン: ${YELLOW}${REGION}${NC}"
echo -e "サービス: ${YELLOW}${SERVICE_NAME}${NC}"
echo -e "リソース: ${YELLOW}${MEMORY} / ${CPU} CPU / max ${MAX_INSTANCES}${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. GCP 프로젝트 설정
echo -e "\n${GREEN}[1/3]${NC} GCP プロジェクト設定..."
gcloud config set project ${PROJECT_ID}

# 2. Docker 이미지 빌드
echo -e "\n${GREEN}[2/3]${NC} Docker イメージビルド中..."
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}

# 3. Cloud Run 배포
echo -e "\n${GREEN}[3/3]${NC} Cloud Run デプロイ中..."
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
  --set-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET},GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --service-account ${SERVICE_ACCOUNT}

# 결과 출력
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}デプロイ完了${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "サービス URL: ${YELLOW}${SERVICE_URL}${NC}"
echo -e "ヘルスチェック: ${YELLOW}${SERVICE_URL}/health${NC}"
echo -e "${BLUE}========================================${NC}"
