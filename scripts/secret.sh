#!/bin/zsh
# secret.sh — MONKOS 시크릿 등록/조회/목록 단일 스크립트
# 헌법 4조 1항: 키 값 생성/추측 금지. 작가님이 발급한 값만 입력.
#
# 사용법:
#   scripts/secret.sh add  <NAME>              # 시크릿 등록 (대화식 입력, 화면 미노출)
#   scripts/secret.sh get  <NAME>              # 시크릿 값 조회 (터미널 출력)
#   scripts/secret.sh list                     # 등록된 시크릿 전체 목록
#   scripts/secret.sh check <NAME>             # 존재 여부 + 버전 확인
#   scripts/secret.sh env                      # .env 파일 일괄 동기화 (SM → .env)
#
# 저장소: GCP Secret Manager (project=monkos) — 단일 정본
# 인벤토리: monkos-ops/ops/SECRET_INVENTORY.md — 메타정보(이름·용도·날짜)만 기록, 값 절대 금지

PROJECT="monkos"

# 프로젝트 루트 자동 탐지 (어느 디바이스·경로에서든 동작)
find_project_root() {
  local dir
  dir=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -n "$dir" ] && [ -d "$dir/monkos-ops" ]; then
    echo "$dir"
    return
  fi
  for candidate in \
    "$HOME/developer/monk_project" \
    "$HOME/monk_project" \
    "$HOME/Desktop/monk_project" \
    "$HOME/projects/monk_project"; do
    if [ -d "$candidate/monkos-ops" ]; then
      echo "$candidate"
      return
    fi
  done
  echo ""
}

PROJECT_ROOT=$(find_project_root)
INVENTORY="${PROJECT_ROOT:+$PROJECT_ROOT/}monkos-ops/ops/SECRET_INVENTORY.md"
ENV_FILE="${PROJECT_ROOT:+$PROJECT_ROOT/}monkos_AI/.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

usage() {
  echo -e "${BLUE}MONKOS 시크릿 관리${NC}"
  echo ""
  echo "  ${GREEN}secret${NC}               대화식 등록 (이름·값 순서대로 물어봄)"
  echo "  ${GREEN}secret add${NC} <NAME>    시크릿 등록 (이름 지정, 값만 물어봄)"
  echo "  ${GREEN}secret get${NC} <NAME>    시크릿 값 조회"
  echo "  ${GREEN}secret list${NC}          등록된 시크릿 전체 목록"
  echo "  ${GREEN}secret check${NC} <NAME>  존재 여부 + 최신 버전 확인"
  echo "  ${GREEN}secret map${NC} [NAME]    인지 1콜: 존재·상태·용도·소비처 (무인자=전체 맵+미등재 적발)"
  echo "  ${GREEN}secret env${NC}           SM → .env 일괄 동기화"
  exit 1
}

cmd_interactive() {
  echo -e "${BLUE}MONKOS 시크릿 등록${NC}"
  echo ""
  echo -e "1) 먼저 키 값을 복사(Cmd+C)하세요"
  echo -e "2) 복사했으면 Enter:"
  read -r DUMMY
  SECRET_VALUE=$(pbpaste | tr -d '\n\r\t ')

  if [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}클립보드가 비어있습니다. 키를 복사 후 다시 시도하세요.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓${NC} 클립보드 값 수신 (${#SECRET_VALUE}자)"
  echo ""

  echo -e "시크릿 이름 (예: LEMONSQUEEZY_API_KEY_GLOBAL):"
  read -r NAME
  if [ -z "$NAME" ]; then
    echo -e "${RED}이름이 비어있습니다.${NC}"
    exit 1
  fi
  if [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}빈 값은 등록할 수 없습니다.${NC}"
    exit 1
  fi

  echo -ne "${YELLOW}등록 중...${NC}"

  # 3. 등록
  local EXISTS
  EXISTS=$(gcloud secrets describe "$NAME" --project="$PROJECT" 2>/dev/null)
  if [ -n "$EXISTS" ]; then
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "$NAME" --project="$PROJECT" --data-file=- 2>/dev/null
  else
    echo -n "$SECRET_VALUE" | gcloud secrets create "$NAME" --project="$PROJECT" --data-file=- --replication-policy=automatic 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    local VER
    VER=$(gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=1 --format="value(name)" 2>/dev/null)
    echo -e "${GREEN}✅ 등록 완료${NC} — $NAME (version $VER)"
  else
    echo -e "${RED}❌ 등록 실패${NC} — gcloud 인증 상태를 확인하세요."
    exit 1
  fi
}

cmd_add() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}이름을 지정하세요: secret.sh add <NAME>${NC}"
    exit 1
  fi

  # 존재 여부 확인
  local EXISTS
  EXISTS=$(gcloud secrets describe "$NAME" --project="$PROJECT" 2>/dev/null)
  if [ -n "$EXISTS" ]; then
    echo -e "${YELLOW}[기존]${NC} $NAME — 새 버전을 추가합니다."
  else
    echo -e "${GREEN}[신규]${NC} $NAME — 시크릿을 생성합니다."
  fi

  echo -e "키 값을 복사(Cmd+C)한 상태에서 Enter:"
  read -r DUMMY
  SECRET_VALUE=$(pbpaste | tr -d '\n\r\t ')

  if [ -z "$SECRET_VALUE" ]; then
    echo -e "${RED}클립보드가 비어있습니다.${NC}"
    exit 1
  fi

  echo -ne "${YELLOW}등록 중...${NC}"

  # 등록
  if [ -n "$EXISTS" ]; then
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "$NAME" --project="$PROJECT" --data-file=- 2>/dev/null
  else
    echo -n "$SECRET_VALUE" | gcloud secrets create "$NAME" --project="$PROJECT" --data-file=- --replication-policy=automatic 2>/dev/null
  fi

  if [ $? -eq 0 ]; then
    local VER
    VER=$(gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=1 --format="value(name)" 2>/dev/null)
    echo -e "${GREEN}✅ 등록 완료${NC} — $NAME (version $VER)"
    echo ""
    echo -e "${YELLOW}[인벤토리]${NC} $INVENTORY 에 메타 정보를 추가하세요:"
    echo "  | $NAME | (용도) | (사용처) | $(date +%Y-%m-%d) |"
  else
    echo -e "${RED}❌ 등록 실패${NC} — gcloud 인증 상태를 확인하세요."
    exit 1
  fi
}

cmd_get() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}이름을 지정하세요: secret.sh get <NAME>${NC}"
    exit 1
  fi
  local VALUE
  VALUE=$(gcloud secrets versions access latest --secret="$NAME" --project="$PROJECT" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "$VALUE"
  else
    echo -e "${RED}❌ $NAME 조회 실패${NC} — 존재하지 않거나 권한 부족"
    exit 1
  fi
}

cmd_list() {
  echo -e "${BLUE}GCP Secret Manager (project=$PROJECT)${NC}"
  echo ""
  gcloud secrets list --project="$PROJECT" --format="table(name,createTime.date('%Y-%m-%d'),replication.automatic)" 2>/dev/null
  echo ""
  local COUNT
  COUNT=$(gcloud secrets list --project="$PROJECT" --format="value(name)" 2>/dev/null | wc -l | tr -d ' ')
  echo -e "총 ${GREEN}${COUNT}${NC}개"
}

cmd_check() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    echo -e "${RED}이름을 지정하세요: secret.sh check <NAME>${NC}"
    exit 1
  fi
  local DESC
  DESC=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="yaml(name,createTime,replication)" 2>/dev/null)
  if [ -n "$DESC" ]; then
    echo -e "${GREEN}✅ 존재${NC} — $NAME"
    gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=3 --format="table(name,state,createTime.date('%Y-%m-%d %H:%M'))" 2>/dev/null
  else
    echo -e "${RED}❌ 없음${NC} — $NAME"
    exit 1
  fi
}

cmd_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}.env 파일 없음: $ENV_FILE${NC}"
    exit 1
  fi

  echo -e "${BLUE}SM → .env 동기화${NC} ($ENV_FILE)"
  echo ""

  local UPDATED=0
  local SKIPPED=0

  while IFS='=' read -r KEY VALUE; do
    # 주석/빈줄 건너뛰기
    [[ "$KEY" =~ ^#.*$ || -z "$KEY" ]] && continue
    KEY=$(echo "$KEY" | tr -d ' ')

    # SM에서 조회 시도
    local SM_VALUE
    SM_VALUE=$(gcloud secrets versions access latest --secret="$KEY" --project="$PROJECT" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$SM_VALUE" ]; then
      # .env 현재 값과 비교
      local CURRENT
      CURRENT=$(grep "^${KEY}=" "$ENV_FILE" | head -1 | cut -d'=' -f2-)
      if [ "$CURRENT" != "$SM_VALUE" ]; then
        # macOS sed
        sed -i '' "s|^${KEY}=.*|${KEY}=${SM_VALUE}|" "$ENV_FILE"
        echo -e "  ${GREEN}↻${NC} $KEY"
        UPDATED=$((UPDATED + 1))
      else
        SKIPPED=$((SKIPPED + 1))
      fi
    fi
  done < "$ENV_FILE"

  echo ""
  echo -e "갱신 ${GREEN}${UPDATED}${NC}개 / 동일 ${SKIPPED}개"
}

# map — 시크릿 인지 1콜: 존재·상태·용도·소비처를 한 번에 (2026-07-24 작가님 지시 "인지 코드화")
# 에이전트 규약: "키가 있네없네" 판단은 grep/문서 탐색이 아니라 `secret map <NAME>` 1콜로 한다.
cmd_map() {
  local NAME="$1"
  if [ -z "$NAME" ]; then
    # 전체 요약: SM 실측 + 인벤토리 등재 여부
    echo -e "${BLUE}=== 시크릿 전체 맵 (SM 실측 기준) ===${NC}"
    while IFS=$'\t' read -r n created; do
      local reg="⚠️ 인벤 미등재"
      grep -q "$n" "$INVENTORY" 2>/dev/null && reg="등재"
      printf "%-36s %s  %s\n" "$n" "${created%%T*}" "$reg"
    done < <(gcloud secrets list --project="$PROJECT" --format="value(name,createTime)" 2>/dev/null)
    return
  fi
  echo -e "${BLUE}=== $NAME ===${NC}"
  # 1) SM 실측: 존재 + 최신 버전 상태
  local desc
  desc=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="value(createTime)" 2>/dev/null)
  if [ -z "$desc" ]; then
    echo -e "${RED}✗ SM에 없음${NC} — 등록 필요 시: 작가님에게 \`secret add $NAME\` 요청 (에이전트 값 접촉 금지)"
  else
    echo -e "${GREEN}✓ SM 존재${NC} (생성 ${desc%%T*})"
    gcloud secrets versions list "$NAME" --project="$PROJECT" --limit=2 \
      --format="value(name.basename(),state,createTime)" 2>/dev/null \
      | while IFS=$'\t' read -r v st ct; do echo "   버전 $v: $st (${ct%%T*})"; done
  fi
  # 2) 용도 (인벤토리 행 — SM 라벨 정본화 전까지 문서 조인)
  local row
  row=$(grep -m1 "| $NAME |" "$INVENTORY" 2>/dev/null)
  if [ -n "$row" ]; then
    echo "   용도: $(echo "$row" | awk -F'|' '{print $4}' | sed 's/^ *//;s/ *$//')"
    echo "   비고: $(echo "$row" | awk -F'|' '{print $6}' | sed 's/^ *//;s/ *$//' | cut -c1-90)"
  else
    echo -e "   ${YELLOW}⚠️ 인벤토리 미등재${NC} — 등재 필요 (메타만)"
  fi
  # 3) 소비처 (레포 실측)
  echo "   소비처:"
  (cd "$PROJECT_ROOT" 2>/dev/null && git grep -ln "$NAME" -- '*.sh' '*.js' '*.py' '*.yaml' '*.md' 2>/dev/null \
    | grep -v -e node_modules -e SECRET_INVENTORY -e sessions/ -e reports/ -e briefings/ | head -6 \
    | sed 's/^/     - /')
}

# 메인
case "${1:-}" in
  add)   cmd_add "$2" ;;
  get)   cmd_get "$2" ;;
  list)  cmd_list ;;
  check) cmd_check "$2" ;;
  map)   cmd_map "${2:-}" ;;
  env)   cmd_env ;;
  -h|--help|help) usage ;;
  *)     cmd_interactive ;;
esac
