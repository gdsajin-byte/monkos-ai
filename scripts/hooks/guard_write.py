#!/usr/bin/env python3
"""PreToolUse(Edit|Write) 집행 훅 — E5(파일)·E8·승인 디렉터리 보호.

원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.1 E5, §3.2 E8
- E5: `.env*` / `secrets/**` / `**/deploy.sh` 수정 → ask (헌법 4조 1항 "수정 전 승인")
- E8: `monkos-ops/ops/sessions/**` 기존 파일 Write/Edit → deny (헌법 3조 2항 append-only; 어펜드는 Bash `>>`)
- `.claude/approvals/**` 쓰기 → deny (E10 토큰은 훅만 발급)
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import APPROVAL_DIRNAME, decide, hook_err, kill_switch, project_dir, read_input  # noqa: E402

EVENT = "PreToolUse"
SESSIONS_DIR = "monkos-ops/ops/sessions"


def rel(path: str) -> str:
    try:
        return os.path.relpath(path, project_dir())
    except ValueError:
        return path


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    tool = data.get("tool_name")
    if tool not in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
        return 0
    fp = (data.get("tool_input") or {}).get("file_path") or (data.get("tool_input") or {}).get("notebook_path") or ""
    if not fp:
        return 0
    r = rel(fp).replace("\\", "/")
    name = Path(r).name
    parts = r.split("/")

    # 승인 토큰 디렉터리 보호
    if r.startswith(APPROVAL_DIRNAME + "/") or r == APPROVAL_DIRNAME:
        decide(EVENT, "deny", "[집행 훅] ch1 7조: 승인 토큰은 훅만 발급한다 (에이전트 쓰기 금지)")
        return 0

    # E8 세션 로그 append-only
    if r.startswith(SESSIONS_DIR + "/") and Path(fp).exists():
        decide(EVENT, "deny",
               "[집행 훅] 헌법 3조 2항: 세션 로그는 append-only — 기존 파일 %s 를 %s 로 수정·덮어쓰기 금지. "
               "어펜드는 Bash `cat >> 파일 <<'EOF'` 경유" % (tool, r))
        return 0

    # E5 수정 전 승인
    if name.startswith(".env") or "secrets" in parts[:-1] or name == "deploy.sh":
        decide(EVENT, "ask",
               "[집행 훅] 헌법 4조 1항: %s 는 수정 전 작가님 승인 대상 (.env / secrets/ / deploy.sh)" % r)
        return 0

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
