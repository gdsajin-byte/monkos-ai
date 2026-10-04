#!/usr/bin/env bash
# 컨트롤 룸 PoC 기동 — 플러그인을 스크래치 사본으로 이 프로세스에만 로딩한다 (설치·전역 설정 없음).
# 사용: mk-control.sh [작업 디렉터리(기본: 현재)] [추가 claude 인자...]
# 시연 안전 기본값: 쓰기·실행 도구 차단, 프로젝트 MCP 미로딩(--strict-mcp-config → MCP 활성화 대화가 뜨지 않아 settings.local.json 기록 없음)
set -euo pipefail

SRC="$(cd "$(dirname "$0")" && pwd)"
WORKDIR="${1:-$PWD}"
[ $# -gt 0 ] && shift

[ -d "$WORKDIR/monkos-ops" ] || { echo "❌ mk-control: $WORKDIR 에 monkos-ops/ 가 없다 (레포 루트를 지정)"; exit 1; }
command -v claude >/dev/null || { echo "❌ mk-control: claude CLI 없음"; exit 1; }

SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/control-room.XXXXXX")"
mkdir -p "$SCRATCH/control-room"
cp -R "$SRC/.claude-plugin" "$SRC/hooks" "$SRC/types" "$SCRATCH/control-room/"
echo "[mk-control] 플러그인 사본: $SCRATCH/control-room  · 작업 디렉터리: $WORKDIR"
echo "[mk-control] 패널: 입력창에 /control"

cd "$WORKDIR"
exec claude --plugin-dir "$SCRATCH/control-room" \
  --strict-mcp-config \
  --disallowedTools Bash Edit Write NotebookEdit Agent \
  "$@"
