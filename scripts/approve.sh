#!/usr/bin/env bash
# E10 승인 토큰 — 작가님 전용 예비 경로 (원격·무인 맥락에서 의도적으로 열 때만).
# 기본 경로는 채팅에 '배포 승인'을 치는 것이다 (UserPromptSubmit 훅이 발급).
# 에이전트는 이 스크립트를 실행할 수 없다 (settings deny + guard_bash.py 이중 차단).
#
# 사용: scripts/approve.sh <session_id> ["메모"]
#   session_id 는 해당 세션의 SessionStart 훅 출력 마지막 줄에 있다.
set -euo pipefail
sid="${1:-}"
note="${2:-terminal approve}"
if [ -z "$sid" ]; then
  echo "사용: scripts/approve.sh <session_id> [메모]  — session_id는 세션 시작 출력 참조" >&2
  exit 2
fi
root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$root/.claude/approvals"
mkdir -p "$dir"
printf '%s\t%s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$note" > "$dir/$sid.token"
echo "승인 토큰 발급: $dir/$sid.token (60분 · 1회용 · 세션 $sid 한정)"
