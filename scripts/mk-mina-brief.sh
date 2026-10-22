#!/usr/bin/env bash
# mk-mina-brief.sh — iMac 민아 헤드리스 데일리 브리핑 (로컬·인프라·세션 축) 1회 실행.
# 원천: ORDER_20261022_iMac쌍아_막내_AUTOPILOT_iMac민아_헤드리스브리핑_2단계.md
#       설계 DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장.md §4
# 하는 일:
#   1) 전용 worktree(.claude/worktrees/mina-brief, origin/main 분리 HEAD)를 origin/main 최신으로 맞춘다
#   2) 0번 축 — 로그인 전제(wrangler·gh·gcloud) 사전 점검. 하나라도 실패하면 헤드리스를 띄우지 않는다(쿼터 절약)
#   3) MONK_ROLE=민아 claude -p (정본 지시문 ROUTINE_iMac민아_로컬축.md) — 턴 상한 + 시간 상한
#   4) 브리핑 생성 확인 → push (origin main, 거부 시 rebase 1회 재시도)
#   실패(rc≠0·시간 초과·브리핑 미생성·push 실패) → tg_notify "❌ iMac 민아 브리핑 실패 — {사유}" + exit 1
# 사용: bash scripts/mk-mina-brief.sh [--dry-run] [--max-turns N] [--timeout 초]
# 환경: MINA_BRIEF_GCLOUD_CONFIG — 0번 축·헤드리스에만 적용할 gcloud 구성(스모크 음성 대조군용). 경보 발송에는 적용 안 함.
# 로그·실측: ~/.monkos/mina-brief/{YYYYMMDD-HHMM}.json (claude 결과: num_turns·duration_ms·total_cost_usd)
# 무인 규칙(ch1 7조): 이 스크립트가 쓰는 곳은 전용 worktree와 위 로그 폴더뿐. 배포·시크릿·설정 변경 없음.
set -u

SCRIPT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN_ROOT="$(cd "$SCRIPT_ROOT" && cd "$(git rev-parse --path-format=absolute --git-common-dir)/.." && pwd)" \
  || { echo "❌ mk-mina-brief: 본진 루트 탐지 실패"; exit 1; }
WT="$MAIN_ROOT/.claude/worktrees/mina-brief"
TEMPLATE="monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md"
LOGDIR="$HOME/.monkos/mina-brief"
export PATH="$MAIN_ROOT/node_modules/.bin:$HOME/.local/bin:$HOME/google-cloud-sdk/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

dry=0; max_turns=80; tmo=900
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)   dry=1; shift ;;
    --max-turns) max_turns="${2:-}"; shift 2 ;;
    --timeout)   tmo="${2:-}"; shift 2 ;;
    *) echo "❌ mk-mina-brief: 알 수 없는 인자 $1"; exit 1 ;;
  esac
done
case "$max_turns$tmo" in *[!0-9]*|"") echo "❌ mk-mina-brief: --max-turns·--timeout은 정수"; exit 1 ;; esac

ymd="$(date '+%Y%m%d')"; stamp="$(date '+%Y%m%d-%H%M')"
mkdir -p "$LOGDIR"

# 경보 — 0번 축 음성 대조용 gcloud 구성은 적용하지 않는다(경보 자체가 SM 토큰을 쓴다).
# tg 실패 시에도 무음 금지: 로그 폴더에 last_fail.txt + stderr.
fail() {
  local why="$1"
  echo "❌ mk-mina-brief: $why" >&2
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M KST')" "$why" >> "$LOGDIR/last_fail.txt"
  if [ "$dry" = 0 ]; then
    env -u MINA_BRIEF_GCLOUD_CONFIG -u CLOUDSDK_ACTIVE_CONFIG_NAME \
      bash "$MAIN_ROOT/scripts/tools/tg_notify.sh" --text "❌ iMac 민아 브리핑 실패 — $why" \
      || echo "❌ mk-mina-brief: 텔레그램 경보도 실패 — $LOGDIR/last_fail.txt 확인" >&2
  fi
  exit 1
}

command -v claude >/dev/null 2>&1 || fail "claude CLI 없음"
# 지시문: worktree(origin/main) 정본 우선, 없으면 이 스크립트가 놓인 체크아웃의 사본(병합 전 스모크)
tpl_path() { if [ -f "$WT/$TEMPLATE" ]; then echo "$TEMPLATE"; elif [ -f "$SCRIPT_ROOT/$TEMPLATE" ]; then echo "$SCRIPT_ROOT/$TEMPLATE"; fi; }
[ -n "$(tpl_path)" ] || fail "지시문 없음 ($TEMPLATE)"

# 1) 전용 worktree — 분리 HEAD로 origin/main을 따른다(본진 main 체크아웃과 충돌 없음)
prep_wt() {
  git -C "$MAIN_ROOT" fetch -q origin main || return 1
  if [ ! -d "$WT" ]; then
    git -C "$MAIN_ROOT" worktree add -q --detach "$WT" origin/main || return 1
  fi
  # 지난 실행 잔여물이 있으면 덮지 않는다(파괴적 정리 금지) — 사람이 확인
  [ -z "$(git -C "$WT" status --porcelain)" ] || { echo "worktree 미정리 변경 있음 ($WT)"; return 2; }
  git -C "$WT" checkout -q --detach origin/main || return 1
}

# 2) 0번 축 — 로그인 전제
precheck() {
  local bad=""
  ( cd "$WT" 2>/dev/null || cd "$MAIN_ROOT"; wrangler whoami 2>&1 ) | grep -qiE "logged in|associated with" || bad="$bad wrangler"
  gh auth status >/dev/null 2>&1 || bad="$bad gh"
  local acct
  acct="$(CLOUDSDK_ACTIVE_CONFIG_NAME="${MINA_BRIEF_GCLOUD_CONFIG:-${CLOUDSDK_ACTIVE_CONFIG_NAME:-}}" \
          gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null)"
  [ -n "$acct" ] || bad="$bad gcloud"
  [ -z "$bad" ] || { echo "$bad"; return 1; }
}

# 이미 오늘 E2E가 있으면(웹 루틴 재개 등) LOCAL로 쓴다 — 설계 §2
out="monkos-ops/ops/briefings/BRIEFING_E2E_${ymd}.md"
base_for_out="$WT"; [ -d "$WT" ] || base_for_out="$MAIN_ROOT"
[ -f "$base_for_out/$out" ] && out="monkos-ops/ops/briefings/BRIEFING_LOCAL_${ymd}.md"

prompt="너는 iMac/민아(헤드리스, 무인)다. $(tpl_path) 를 Read하고 그 지시문을 그대로 수행하라. 산출 경로: ${out}. 실행 ID: ${stamp}. push는 하지 말고 커밋까지만 한다(래퍼가 push)."
args=(-p "$prompt" --max-turns "$max_turns" --output-format json --dangerously-skip-permissions --name "iMac-민아헤드리스-$(date '+%m%d-%H%M')")

if [ "$dry" = 1 ]; then
  echo "[dry-run] 본진=$MAIN_ROOT"
  echo "[dry-run] worktree=$WT ($( [ -d "$WT" ] && echo 존재 || echo '미생성 — 실행 시 origin/main 분리 HEAD로 추가'))"
  echo "[dry-run] 지시문=$TEMPLATE · 산출=$out · 턴 상한 $max_turns · 시간 상한 ${tmo}s"
  if r="$(precheck)"; then echo "[dry-run] 0번 축 통과 (wrangler·gh·gcloud)"; else echo "[dry-run] 0번 축 실패:$r"; fi
  echo "[dry-run] (cd $WT && MONK_ROLE=민아 claude ${args[*]:0:1} \"<prompt>\" ${args[*]:2})"
  exit 0
fi

r="$(prep_wt)"; rc=$?
[ $rc = 0 ] || fail "worktree 준비 실패${r:+ — $r}"
# worktree가 막 생겼으면 산출 경로 재판정
[ -f "$WT/monkos-ops/ops/briefings/BRIEFING_E2E_${ymd}.md" ] && [ "$out" = "monkos-ops/ops/briefings/BRIEFING_E2E_${ymd}.md" ] \
  && { out="monkos-ops/ops/briefings/BRIEFING_LOCAL_${ymd}.md"; prompt="${prompt//BRIEFING_E2E_${ymd}/BRIEFING_LOCAL_${ymd}}"; args[1]="$prompt"; }

r="$(precheck)" || fail "0번 축 로그인 전제 실패:$r — 나머지 축은 거짓 음성이라 미실행"

start_head="$(git -C "$WT" rev-parse HEAD)"
t0=$(date +%s)
json="$LOGDIR/$stamp.json"
(
  cd "$WT" || exit 97
  export MONK_ROLE="민아"
  [ -n "${MINA_BRIEF_GCLOUD_CONFIG:-}" ] && export CLOUDSDK_ACTIVE_CONFIG_NAME="$MINA_BRIEF_GCLOUD_CONFIG"
  exec claude "${args[@]}"
) > "$json" 2> "$LOGDIR/$stamp.err" &
pid=$!
# 시간 상한 — macOS에 timeout(1)이 없어 감시 루프로 집행
while kill -0 "$pid" 2>/dev/null; do
  if [ $(( $(date +%s) - t0 )) -ge "$tmo" ]; then
    kill "$pid" 2>/dev/null; sleep 5; kill -9 "$pid" 2>/dev/null
    fail "시간 상한 ${tmo}s 초과 — 강제 종료 (로그 $json)"
  fi
  sleep 5
done
wait "$pid"; crc=$?
elapsed=$(( $(date +%s) - t0 ))
meta="$(python3 -c 'import json,sys
try:
  d=json.load(open(sys.argv[1])); print("turns=%s subtype=%s cost=$%.2f is_error=%s"%(d.get("num_turns"),d.get("subtype"),d.get("total_cost_usd") or 0,d.get("is_error")))
except Exception as e: print("결과 JSON 판독 실패: %s"%e)' "$json")"
echo "▶ 헤드리스 종료 rc=$crc · ${elapsed}s · $meta"
[ $crc = 0 ] || fail "헤드리스 rc=$crc · ${elapsed}s · $meta"
case "$meta" in *"is_error=True"*|*"error_max_turns"*) fail "헤드리스 오류 종료 · $meta" ;; esac

# 4) 브리핑 생성 확인 — 이번 실행의 커밋에 산출 파일이 들어 있어야 한다
[ -n "$(git -C "$WT" status --porcelain)" ] && fail "헤드리스가 미커밋 변경을 남김 ($WT) · $meta"
git -C "$WT" diff --name-only "$start_head" HEAD | grep -qxF "$out" || fail "브리핑 미생성 ($out) · $meta"
# 시크릿 값 유출 1차 가드 — 산출물에 값 형태 패턴이 있으면 push 중단
if git -C "$WT" diff "$start_head" HEAD | grep '^+' | grep -qE 'AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|-----BEGIN|ghp_[A-Za-z0-9]{20,}|[0-9]{8,10}:AA[0-9A-Za-z_-]{30,}'; then
  fail "산출물에 시크릿 값 형태 패턴 — push 중단, 사람 확인 필요 ($WT)"
fi

push_ok=0
for i in 1 2; do
  if git -C "$WT" push -q origin HEAD:main 2>>"$LOGDIR/$stamp.err"; then push_ok=1; break; fi
  git -C "$WT" fetch -q origin main && git -C "$WT" rebase -q origin/main 2>>"$LOGDIR/$stamp.err" \
    || { git -C "$WT" rebase --abort 2>/dev/null; break; }
done
[ $push_ok = 1 ] || fail "push 실패 (rebase 재시도 포함) · 로그 $LOGDIR/$stamp.err"

git -C "$MAIN_ROOT" fetch -q origin main
remote="$(git -C "$MAIN_ROOT" rev-parse --short origin/main)"; local_h="$(git -C "$WT" rev-parse --short HEAD)"
[ "$remote" = "$local_h" ] || fail "push 후 원격 대조 불일치 (local $local_h / origin $remote)"
echo "✅ mk-mina-brief: $out · origin/main=$remote · ${elapsed}s · $meta"
