#!/usr/bin/env bash
# mk-soso.sh — 소소(디자인 TF 리드) CLI 세션 기동.
# 원천: PROPOSAL_20261002_iMac민아_디자인TF_소소세션_시범편성.md (작가님 10-02 14:34 지시)
# 하는 일: 주 세션 에이전트 정의 soso 적용 + 세션 이름 {디바이스}-소소-{MMDD}-{HHMM} + 에이전트 팀(실험 기능)을 이 세션에만 켠다.
#   전역 설정은 건드리지 않는다 — 플래그는 이 프로세스의 환경변수로만 준다.
# 사용: bash scripts/mk-soso.sh [모델ID]      (모델 생략 시 사용자 설정 기본값)
#       bash scripts/mk-soso.sh --dry-run     (실행하지 않고 명령만 출력)
# 실패 가시화: 전제 미충족은 ❌ 메시지 + exit 1.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || { echo "❌ mk-soso: 프로젝트 디렉터리 이동 실패 ($ROOT)"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "❌ mk-soso: claude CLI를 찾을 수 없음"; exit 1; }
[ -f .claude/agents/soso.md ] || { echo "❌ mk-soso: .claude/agents/soso.md 없음 — 소소 정의 부재"; exit 1; }

host="$(hostname 2>/dev/null || echo unknown)"
case "$host" in
  *iMac*)                     device="iMac" ;;
  *MacBook*|*M1*)             device="M1" ;;
  *mac-mini*|*Mac-mini*|*M2*) device="M2" ;;
  *) echo "❌ mk-soso: 디바이스 판별 실패 (hostname $host)"; exit 1 ;;
esac

dry=0
model=""
for a in "$@"; do
  case "$a" in
    --dry-run) dry=1 ;;
    -*) echo "❌ mk-soso: 알 수 없는 옵션 $a"; exit 1 ;;
    *) model="$a" ;;
  esac
done

name="${device}-소소-$(date '+%m%d-%H%M')"
args=(--agent soso --name "$name" --dangerously-skip-permissions)
[ -n "$model" ] && args+=(--model "$model")

export MONK_ROLE="소소"                          # session_start.sh가 역할 후보를 소소로 표시
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1    # 에이전트 팀 — 이 세션 한정

if [ "$dry" = 1 ]; then
  echo "MONK_ROLE=$MONK_ROLE CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude ${args[*]}"
  exit 0
fi
echo "▶ 소소 세션 기동: $name (에이전트 팀 켬${model:+, 모델 $model})"
exec claude "${args[@]}"
