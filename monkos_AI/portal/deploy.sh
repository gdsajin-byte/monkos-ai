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
# 2026-09-03 4060 라인업 배제(자녀 포맷, 메모리 project_4060_intentional_downtime) — matte.monkos.ai 프리플라이트 제거. 재구축 시 앞에 복원
# 2026-10-22 옛 4060 자리 = iMac 애플 비전(matte-imac, 작가님 22:42 "4060이 맡던것을 비전으로… 문제가 생기면 런팟이 받으면 되지").
#   무료·유료 공통 체인. 서버·터널: monkos_AI/vision-matte/ (launchd ai.monkos.vision-matte·matte-imac-tunnel)
MATTE_API_URLS="https://matte-imac.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34"
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
  # TELEGRAM_EVENT_BOT_TOKEN: dev는 SM 참조 미적용·현행 빈 값 유지 (2026-10-22 작가님 "2번승인" — dev 실발송 방지)
  EXTRA_SM_KEYS=""
  DEPLOY_FLAGS=""
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-portal"
  MEMORY="1Gi"
  CPU="1"
  MIN_INSTANCES="0"  # 2026-08-24 작가님 승인 웜 해제 — specs 열람 트래픽은 CF 엣지가 흡수(같은 날 컷오버), 오리진 도달은 API·SSR만. 콜드스타트는 생성·결제 첫 요청에 한정. 유료 전환 본격화 시 재검토
  MAX_INSTANCES="5"
  EXTRA_SM_KEYS="TELEGRAM_EVENT_BOT_TOKEN"  # prod 전용 SM 참조 (ORDER_20261022 SM 전환)
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
# 텔레그램 토큰·TEAM_NOTIFY_SECRET: 2026-10-22 평문 env 직주입 → SM 참조 전환 (ORDER_20261022_iMac쌍아_막내_SECURITY_포털env평문시크릿_SM전환,
#   INCIDENT_20261021 portal-env-telegram-token-exposure 보완). 공통 3종 + 환경별 EXTRA_SM_KEYS(prod=TELEGRAM_EVENT_BOT_TOKEN)
# 카카오·LINE 로그인 3종: 2026-10-22 2차 전환 (ORDER_20261022_iMac쌍아_막내_SECURITY_평문시크릿_2차_SM전환 — dev·prod 값=SM 일치 실측).
#   TX_API_KEY·LINE_MESSAGING_*는 prod 빈 값이라 제외(전환 시 기능이 처음 켜짐), AUTH_SECRET·GOOGLE_CLIENT_SECRET·GITHUB_TOKEN은 SM 등재 후 별도
ENV_VARS="^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::CHAT_WORKERS_URL=${CHAT_WORKERS_URL}::NAVER_CLIENT_ID=${NAVER_CLIENT_ID}::CROP_ENGINE_URL=${CROP_ENGINE_URL}::MATTE_API_URLS=${MATTE_API_URLS}::MATTE_SLUGS=${MATTE_SLUGS}::PILOT_T1_RETOUCH=${PILOT_T1_RETOUCH}::FREE_QUOTA_BYPASS=${FREE_QUOTA_BYPASS:-0}::GEN_DELIVERY_DEADLINE_MS=${GEN_DELIVERY_DEADLINE_MS:-115000}::TEAM_CHAT_ID=-1003794441262"
SECRETS="CHAT_API_KEY=CHAT_API_KEY:latest,NAVER_CLIENT_SECRET=NAVER_CLIENT_SECRET:latest,ADMIN_UIDS=ADMIN_UIDS:latest,AGENT_API_KEYS=AGENT-API-KEYS:latest,LEMONSQUEEZY_API_KEY=LEMONSQUEEZY_API_KEY:latest,LEMONSQUEEZY_WEBHOOK_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest,LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL=LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL:latest,LEMONSQUEEZY_VARIANT_SPECS_SINGLE=LEMONSQUEEZY_VARIANT_SPECS_SINGLE:latest,MATTE_API_KEY=RUNPOD_API_KEY:latest,MATTE_SECRET=MATTE_SECRET:latest,NAVER_SEARCHAD_API_KEY=NAVER_SEARCHAD_API_KEY:latest,NAVER_SEARCHAD_SECRET_KEY=NAVER_SEARCHAD_SECRET_KEY:latest,NAVER_SEARCHAD_CUSTOMER_ID=NAVER_SEARCHAD_CUSTOMER_ID:latest,NAVER_DATALAB_CLIENT_ID=NAVER_DATALAB_CLIENT_ID:latest,NAVER_DATALAB_CLIENT_SECRET=NAVER_DATALAB_CLIENT_SECRET:latest,BING_WMT_API_KEY=BING_WMT_API_KEY:latest,RESEND_API_KEY=RESEND_API_KEY:latest,EDGE_TRUST_KEY=EDGE_TRUST_KEY:latest"

# dev/prod 토스 키 분기 — 값은 전부 SM 정본 참조 (평문 기재 금지, 헌법 4조 1항)
SECRETS="${SECRETS},TOSS_CLIENT_KEY=${TOSS_CLIENT_KEY_NAME:-TOSS_CLIENT_KEY}:latest"
SECRETS="${SECRETS},TOSS_SECRET_KEY=${TOSS_SECRET_KEY_NAME:-TOSS_SECRET_KEY}:latest"

# 평문 env → SM 참조 전환 대상 (2026-10-22). 현행 서비스에 같은 이름의 평문 env가 있으면
# 같은 배포 명령에서 --remove-env-vars로 걷어낸다 (동명 평문·시크릿 공존 시 Cloud Run 거부).
SM_MIGRATE_KEYS="TELEGRAM_BOT_TOKEN TELEGRAM_TEAM_BOT_TOKEN TEAM_NOTIFY_SECRET KAKAO_REST_API_KEY KAKAO_CLIENT_SECRET LINE_CHANNEL_SECRET LINE_MESSAGING_CHANNEL_SECRET LINE_MESSAGING_ACCESS_TOKEN ${EXTRA_SM_KEYS:-}"
REMOVE_PLAIN=""
_CUR_ENV_JSON=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --project=${PROJECT_ID} \
  --format=json 2>/dev/null | tr -d ' \n' || true)
for _k in ${SM_MIGRATE_KEYS}; do
  SECRETS="${SECRETS},${_k}=${_k}:latest"
  if printf '%s' "$_CUR_ENV_JSON" | grep -qE "\"name\":\"${_k}\"(,\"value\":|\})"; then
    REMOVE_PLAIN="${REMOVE_PLAIN:+${REMOVE_PLAIN},}${_k}"
  fi
done
unset _CUR_ENV_JSON
REMOVE_FLAG=""
if [ -n "$REMOVE_PLAIN" ]; then
  echo -e "${YELLOW}⚠ 평문 env → SM 참조 전환: ${REMOVE_PLAIN} (값 미출력)${NC}"
  REMOVE_FLAG="--remove-env-vars=${REMOVE_PLAIN}"
else
  echo -e "SM 전환 대상 평문 env 없음 (이미 SM 참조 또는 부재)"
fi

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
  ${REMOVE_FLAG} \
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

# ─── 엣지 정적본 드리프트 검사 (2026-08-25 신설 — 쌍아 🟡 "SSG 재배포 누락 = 무음 구본" 가시화) ───
# specs 렌더 정본이 엣지 SSG 빌드 시점(gitRev) 이후 변경됐으면 엣지 재배포 없이는 라이브가 구본이다.
EDGE_MANIFEST="$(dirname "$0")/tools/specs-ssg/dist/build-manifest.json"
SPECS_SOURCES="lib/cms/specs-data.json lib/cms/render-specs.js lib/cms/specs-i18n.js lib/cms/specs-url.js lib/cms/components lib/cms/render-shell.js"
# 2026-09-02 보정 (ch5 6조 "무음 강등 금지" / 7조 발효 선행 조건 ④):
# 종전 구조는 gitRev 미상(필드 없음)·빈 문자열·로컬에 없는 커밋 3경로에서 아무 출력 없이 통과했다.
# 특히 필드 자체가 없으면 grep 미히트가 pipefail에 걸려 배포 완료 후 스크립트가 메시지 없이 exit 1 했다.
# → 3경로 전부 명시 출력. grep 실패는 `|| true` 로 흡수한다.
# ⚠️ 본 게이트는 "로컬 빌드 산출물(dist/build-manifest.json)" 기준이라 이 머신의 빌드 이력만 반영한다.
#    실제 배포본 기준 판정은 G1(`scripts/tools/specs_drift.sh`)이 정본이다.
if [ -f "$EDGE_MANIFEST" ]; then
  SSG_REV=$(grep -o '"gitRev": *"[^"]*"' "$EDGE_MANIFEST" | sed 's/.*"gitRev": *"\([^"]*\)".*/\1/' || true)
  if [ -z "$SSG_REV" ]; then
    echo -e "${YELLOW}⚠️  엣지 SSG 매니페스트에 gitRev 없음 (${EDGE_MANIFEST}) — 드리프트 검사 미실시.${NC}"
    echo -e "${YELLOW}    specs 변경 배포라면 ./edge/deploy.sh 필요 여부를 직접 확인하라.${NC}"
  elif ! git -C "$(dirname "$0")" cat-file -e "${SSG_REV}^{commit}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  SSG 빌드 커밋 ${SSG_REV} 이 로컬에 없음 — 드리프트 검사 미실시.${NC}"
    echo -e "${YELLOW}    'git fetch origin' 후 재실행하거나 ./edge/deploy.sh 필요 여부를 직접 확인하라.${NC}"
  else
    DRIFT=$(cd "$(dirname "$0")" && git diff --name-only "$SSG_REV" HEAD -- $SPECS_SOURCES 2>/dev/null || true)
    if [ -n "$DRIFT" ]; then
      echo -e "${RED}⚠️  엣지 정적본 드리프트 감지 — specs 정본이 로컬 SSG 빌드(${SSG_REV}) 이후 변경됨:${NC}"
      echo "$DRIFT" | sed 's/^/    /'
      echo -e "${RED}    라이브 specs가 구본일 수 있음. 반드시 실행: ./edge/deploy.sh${NC}"
      echo -e "${YELLOW}    (로컬 빌드 기준 판정이다. 이 머신에서 빌드하지 않고 타 디바이스가 배포했다면 오탐일 수 있으니${NC}"
      echo -e "${YELLOW}     'scripts/tools/specs_drift.sh' 로 배포 원장 기준 재확인할 것)${NC}"
    else
      echo -e "${GREEN}✓ 엣지 정적본 드리프트 없음 (로컬 SSG rev ${SSG_REV})${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️  엣지 SSG 매니페스트 없음 — 이 머신에서 엣지 빌드 이력 없음. specs 변경 배포라면 ./edge/deploy.sh 필요 여부 확인${NC}"
fi

echo -e "${BLUE}========================================${NC}"
