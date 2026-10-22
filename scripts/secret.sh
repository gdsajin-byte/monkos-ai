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
#   scripts/secret.sh pages-sync <NAME> [--use <SM_NAME>] [--project monk-kr] [--env production|preview] [--dry-run]
#                                             # SM → Cloudflare Pages 시크릿 파이프 동기화 + 인벤토리 §E 자동 기록 (2026-10-22)
#
# 저장소: GCP Secret Manager (project=monkos) — 단일 정본
# 인벤토리: monkos-ops/ops/SECRET_INVENTORY.md — 메타정보(이름·용도·날짜)만 기록, 값 절대 금지

# ⚠️ 값 노출 회귀 방지 (2026-08-13, 헌법 4조 1항 / data-access.md "값 노출 금지")
# zsh 기본(TYPESET_SILENT 미설정)에서는 `local VAR`를 값 할당 없이 실행할 때
# 그 변수가 이미 존재하면 `VAR=<현재값>`을 stdout에 출력한다. cmd_env 루프에서
# 시크릿 실값이 이 경로로 새어나갔다. 아래 1줄이 해당 출력 전체를 차단한다.
setopt TYPESET_SILENT

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
  echo "  ${GREEN}secret pages-sync${NC} <NAME> [--use <SM_NAME>] [--project monk-kr] [--env production|preview] [--purpose \"용도\"] [--dry-run]"
  echo "                        SM → Cloudflare Pages 시크릿 파이프 동기화 + 인벤토리 §E 자동 기록 (값 미노출)"
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
    # 용도를 SM annotations에 기록 (메타 정본 = SM, 2026-07-24 P1-ⓓ) — 엔터로 건너뛰기 가능
    echo -n "용도(한 줄, 엔터=건너뜀): "
    read -r PURPOSE
    if [ -n "$PURPOSE" ]; then
      gcloud secrets update "$NAME" --project="$PROJECT" \
        --update-annotations="^@@@^purpose=${PURPOSE}" --update-labels=meta_src=secret_add >/dev/null 2>&1 \
        && echo -e "${GREEN}✓ 용도 기록(SM)${NC}" || echo -e "${YELLOW}⚠️ 용도 기록 실패 — secret annotate로 재시도${NC}"
    fi
    echo -e "${YELLOW}[인벤토리]${NC} SM 등록은 끝났다. ${RED}SECRET_INVENTORY.md 메타 1행은 수기 추가 필수${NC} (이 스크립트는 인벤토리를 쓰지 않는다)"
    echo -e "   확인: secret map $NAME  ← SM 실측 + 인벤 등재 여부만 표시"
    echo -e "   GitHub Actions에서 쓸 값이면 ${RED}gh secret set $NAME${NC} 별도 필요 (SM↔GitHub 자동 동기 없음)"
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

  # ⚠️ 값 노출 방지 (2026-08-13): 선언은 반드시 루프 밖 + 초기값 할당.
  # zsh는 TYPESET_SILENT 미설정(기본)일 때 `local VAR`를 값 할당 없이 실행하면서
  # 해당 변수가 이미 존재하면 `VAR=<현재값>`을 stdout에 출력한다. 루프 2회차부터
  # 직전 시크릿 실값이 그대로 새어나갔다. 초기값을 할당하면 출력되지 않는다.
  local SM_VALUE=""
  local CURRENT=""

  while IFS='=' read -r KEY VALUE; do
    # 주석/빈줄 건너뛰기
    [[ "$KEY" =~ ^#.*$ || -z "$KEY" ]] && continue
    KEY=$(echo "$KEY" | tr -d ' ')

    # SM에서 조회 시도
    SM_VALUE=$(gcloud secrets versions access latest --secret="$KEY" --project="$PROJECT" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$SM_VALUE" ]; then
      # .env 현재 값과 비교
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
  # 2) 용도 — SM annotations 정본 우선 (2026-07-24 P1-ⓓ 백필), 문서는 폴백
  local ann_p ann_s ann_n
  ann_p=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="value(annotations.purpose)" 2>/dev/null)
  ann_s=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="value(annotations.service)" 2>/dev/null)
  ann_n=$(gcloud secrets describe "$NAME" --project="$PROJECT" --format="value(annotations.note)" 2>/dev/null)
  if [ -n "$ann_p" ]; then
    echo "   용도(SM): $ann_p ${ann_s:+/ $ann_s}"
    [ -n "$ann_n" ] && echo "   비고(SM): $(echo "$ann_n" | cut -c1-90)"
  else
    local row
    row=$(grep -m1 "| $NAME |" "$INVENTORY" 2>/dev/null)
    if [ -n "$row" ]; then
      echo "   용도(문서 폴백): $(echo "$row" | awk -F'|' '{print $4}' | sed 's/^ *//;s/ *$//')"
    else
      echo -e "   ${YELLOW}⚠️ 메타 없음${NC} — \`secret annotate $NAME\`으로 용도 기록 요망"
    fi
  fi
  # 3) 소비처 (레포 실측)
  echo "   소비처:"
  (cd "$PROJECT_ROOT" 2>/dev/null && git grep -ln "$NAME" -- '*.sh' '*.js' '*.py' '*.yaml' '*.yml' '*.md' 2>/dev/null \
    | grep -v -e node_modules -e SECRET_INVENTORY -e sessions/ -e reports/ -e briefings/ | head -6 \
    | sed 's/^/     - /')
}

# annotate — 기존 시크릿에 용도 메타 기록/갱신 (값 비접촉)
cmd_annotate() {
  local NAME="$1"
  [ -z "$NAME" ] && { echo -e "${RED}이름 필요${NC}: secret annotate <NAME>"; exit 1; }
  echo -n "용도(한 줄): "
  read -r PURPOSE
  [ -z "$PURPOSE" ] && { echo "입력 없음 — 중단"; exit 1; }
  gcloud secrets update "$NAME" --project="$PROJECT" \
    --update-annotations="^@@@^purpose=${PURPOSE}" >/dev/null 2>&1 \
    && echo -e "${GREEN}✓ 기록 완료${NC}" || { echo -e "${RED}✗ 실패${NC}"; exit 1; }
}

# 메인
# ── pages-sync: SM 정본 → Cloudflare Pages 시크릿 동기화 + 인벤토리 §E 자동 기록 (2026-10-22 민아) ──
# 왜: Pages Functions는 GCP SM을 못 읽는다. 값을 사람 손·화면 없이 파이프로 옮기고, 옮긴 사실을 인벤토리에 남긴다.
# 사용: secret pages-sync <NAME> [--use <SM_NAME>] [--project monk-kr] [--env production|preview] [--purpose "용도"] [--dry-run]
# 실패 가시화: 전제(wrangler 로그인)·SM 조회·put·사후 목록 대조·인벤토리 기록 각각 ❌ + exit≠0. 무음 통과 없음.
cmd_pages_sync() {
  local NAME="" SRC="" PRJ="monk-kr" ENVN="production" PURPOSE="" DRY=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --use) SRC="$2"; shift 2 ;;
      --project) PRJ="$2"; shift 2 ;;
      --env) ENVN="$2"; shift 2 ;;
      --purpose) PURPOSE="$2"; shift 2 ;;
      --dry-run) DRY=1; shift ;;
      -*) echo -e "${RED}❌ pages-sync: 알 수 없는 옵션 $1${NC}"; exit 2 ;;
      *) if [ -z "$NAME" ]; then NAME="$1"; else echo -e "${RED}❌ pages-sync: 인자 과다 ($1)${NC}"; exit 2; fi; shift ;;
    esac
  done
  [ -n "$NAME" ] || { echo -e "${RED}❌ pages-sync: 이름을 지정하세요 — secret pages-sync <NAME> [--use <SM_NAME>]${NC}"; exit 2; }
  [ -n "$SRC" ] || SRC="$NAME"
  case "$ENVN" in production|preview) ;; *) echo -e "${RED}❌ pages-sync: --env 는 production|preview${NC}"; exit 2 ;; esac
  local WR="$PROJECT_ROOT/node_modules/.bin/wrangler"
  [ -x "$WR" ] || { echo -e "${RED}❌ pages-sync: wrangler 없음 ($WR) — 루트에서 npm install${NC}"; exit 1; }
  local ENVFLAG=""
  [ "$ENVN" = "preview" ] && ENVFLAG="--env preview"

  # 전제 1: Cloudflare 로그인 (wrangler OAuth — 인벤토리 §H)
  if ! "$WR" whoami >/dev/null 2>&1; then
    echo -e "${RED}❌ pages-sync: wrangler 미로그인 — 이 기기에서 'npx wrangler login' 후 재시도 (인벤토리 §H 전제)${NC}"; exit 1
  fi
  # 전제 2: SM 조회 (값은 변수에만 — 출력·파일 금지)
  local VALUE
  VALUE=$(gcloud secrets versions access latest --secret="$SRC" --project="$PROJECT" 2>/dev/null) || VALUE=""
  [ -n "$VALUE" ] || { echo -e "${RED}❌ pages-sync: SM 조회 실패 — $SRC (존재하지 않거나 권한 부족)${NC}"; exit 1; }
  local VLEN=${#VALUE}
  echo -e "${BLUE}pages-sync${NC} SM:$SRC (길이 $VLEN) → Pages:$PRJ/$ENVN 변수 $NAME"
  if [ "$DRY" = "1" ]; then
    echo -e "${YELLOW}[dry-run]${NC} put 생략. 인벤토리 기록도 생략. (현재 목록만 조회)"
    "$WR" pages secret list --project-name "$PRJ" $ENVFLAG 2>/dev/null | grep -E "^\s+- " || echo "  (목록 조회 실패 또는 0건)"
    unset VALUE; return 0
  fi
  # put — stdin 파이프 (프로세스 인자·화면에 값 없음)
  if ! printf '%s' "$VALUE" | "$WR" pages secret put "$NAME" --project-name "$PRJ" $ENVFLAG >/dev/null 2>&1; then
    unset VALUE
    echo -e "${RED}❌ pages-sync: wrangler pages secret put 실패 — 프로젝트명($PRJ)·권한 확인${NC}"; exit 1
  fi
  unset VALUE
  # 사후 대조 — 목록에 이름이 있어야 성공
  if ! "$WR" pages secret list --project-name "$PRJ" $ENVFLAG 2>/dev/null | grep -qE "^\s+- $NAME:"; then
    echo -e "${RED}❌ pages-sync: put 후 목록에 $NAME 없음 — 반영 미보장${NC}"; exit 1
  fi
  echo -e "${GREEN}✅ Pages 반영${NC} — $PRJ/$ENVN $NAME (목록 대조 통과)"

  # 인벤토리 §E 자동 기록 (메타만)
  local TODAY; TODAY=$(TZ=Asia/Seoul date '+%Y-%m-%d')
  python3 - "$INVENTORY" "$NAME" "$SRC" "$PRJ" "$ENVN" "$PURPOSE" "$TODAY" "$VLEN" <<'PYEOF'
import sys, re, pathlib
inv, name, src, prj, envn, purpose, today, vlen = sys.argv[1:9]
p = pathlib.Path(inv); lines = p.read_text().split('\n')
hdr = None
for i, l in enumerate(lines):
    if l.startswith('### ') and 'Cloudflare Dashboard' in l and f'({prj} Pages' in l:
        hdr = i; break
if hdr is None:
    print(f"❌ pages-sync: 인벤토리에 '### … Cloudflare Dashboard ({prj} Pages — N개)' 섹션 없음 — 수기 추가 필요 (Pages 반영은 완료)"); sys.exit(2)
end = next((j for j in range(hdr + 1, len(lines)) if lines[j].startswith('### ') or lines[j].startswith('## ')), len(lines))
rows = [j for j in range(hdr, end) if re.match(r'^\| *\d+ *\|', lines[j])]
envtag = '' if envn == 'production' else f' [{envn}]'
stamp = f'재동기화 {today} (secret pages-sync{envtag}, 길이 {vlen})'
for j in rows:
    cells = [c.strip() for c in lines[j].strip().strip('|').split('|')]
    if len(cells) >= 2 and cells[1] == name:
        line = lines[j].rstrip()
        lines[j] = (line[:-1].rstrip() + ' · ' + stamp + ' |') if line.endswith('|') else (line + ' · ' + stamp)
        p.write_text('\n'.join(lines)); print(f"✅ 인벤토리 §E 갱신 — {name} 행에 '{stamp}'"); sys.exit(0)
n = len(rows) + 1
use = purpose or '(용도 미기재 — secret pages-sync로 등록, 수기 보완 필요)'
new = f"| {n} | {name} | {use} — SM #{src} 동일 값 | ⭐ {today} 추가 (secret pages-sync{envtag}, 길이 {vlen}). SM↔Pages 자동 동기 없음 — 로테이션 시 재실행 |"
ins = rows[-1] + 1 if rows else hdr + 3
lines.insert(ins, new)
m = re.search(r'— (\d+)개\)', lines[hdr])
if m: lines[hdr] = lines[hdr].replace(f'— {m.group(1)}개)', f'— {n}개)')
p.write_text('\n'.join(lines)); print(f"✅ 인벤토리 §E 추가 — #{n} {name} (헤더 {n}개)")
PYEOF
  local RC=$?
  [ "$RC" = "0" ] || { echo -e "${YELLOW}⚠️ Pages 반영은 끝났으나 인벤토리 기록 실패(rc=$RC) — SECRET_INVENTORY.md §E 수기 보완${NC}"; exit 2; }
  echo -e "${YELLOW}[다음]${NC} 인벤토리 변경분 커밋 필요: git add $INVENTORY"
}

case "${1:-}" in
  add)   cmd_add "$2" ;;
  get)   cmd_get "$2" ;;
  list)  cmd_list ;;
  check) cmd_check "$2" ;;
  map)   cmd_map "${2:-}" ;;
  annotate) cmd_annotate "${2:-}" ;;
  env)   cmd_env ;;
  pages-sync) shift; cmd_pages_sync "$@" ;;
  -h|--help|help) usage ;;
  *)     cmd_interactive ;;
esac
