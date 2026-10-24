#!/usr/bin/env python3
"""PreToolUse(Edit|Write) 집행 훅 — E5(파일)·E8·승인 디렉터리 보호.

원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.1 E5, §3.2 E8
- E5: `.env*` / `secrets/**` / `**/deploy.sh` 수정 → ask (헌법 4조 1항 "수정 전 승인")
- E8: `monkos-ops/ops/sessions/**` 기존 파일 Write/Edit → deny (헌법 3조 2항 append-only; 어펜드는 Bash `>>`)
- `.claude/approvals/**` 쓰기 → deny (E10 토큰은 훅만 발급)
- E11: `monkos-ops/ops/{sessions,orders,reports,proposals,incidents,briefings}/**.md`에 새로 들어가는 시각 헤더를
  실측 KST와 대조 → +2분 초과 미래·10분 초과 과거면 deny (헌법 3조 1항, ORDER_20261024 막내16 — time_header.py)
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from _common import APPROVAL_DIRNAME, decide, hook_err, kill_switch, project_dir, read_input  # noqa: E402
try:
    import time_header  # noqa: E402
except Exception as _e:  # noqa: BLE001 — 시각 대조 모듈 고장이 E5·E8까지 무력화하지 않도록
    time_header = None
    hook_err("시각 대조 모듈 로드 실패: %s" % _e)

EVENT = "PreToolUse"
SESSIONS_DIR = "monkos-ops/ops/sessions"


def rel(path: str) -> str:
    try:
        return os.path.relpath(path, project_dir())
    except ValueError:
        return path


def time_texts(tool: str, ti: dict, fp: str) -> tuple[str, str]:
    """(새로 쓰는 텍스트, 기존 텍스트). 기존 = 파일 현 내용 + Edit의 old_string."""
    old = ""
    try:
        if Path(fp).is_file():
            old = Path(fp).read_text(encoding="utf-8", errors="replace")[:2_000_000]
    except OSError:
        pass
    if tool == "Write":
        return ti.get("content") or "", old
    if tool == "Edit":
        return ti.get("new_string") or "", old + "\n" + (ti.get("old_string") or "")
    if tool == "MultiEdit":
        eds = ti.get("edits") or []
        return ("\n".join(e.get("new_string") or "" for e in eds),
                old + "\n" + "\n".join(e.get("old_string") or "" for e in eds))
    return "", old


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

    # E11 시각 헤더 쓰기 직전 대조 — 훅 오류는 쓰기를 막지 않는다
    if time_header and tool != "NotebookEdit" and time_header.is_target_path(r):
        try:
            new, old = time_texts(tool, data.get("tool_input") or {}, fp)
            why = time_header.check(new, old)
        except Exception as e:  # noqa: BLE001
            hook_err("시각 대조 실패: %s" % e)
            why = None
        if why:
            decide(EVENT, "deny", why)
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
