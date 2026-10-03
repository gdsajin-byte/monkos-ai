#!/usr/bin/env python3
"""MONK 하네스 훅 공통 모듈.

원천: DESIGN_20260930_집행코드화_hooks_deny.md §1·§4
- stdin JSON 읽기 / 판정 JSON 출력 / 킬스위치 / 실패 가시화([HOOK-ERR])
- 외부 의존 0 (표준 라이브러리만). jq 금지 (4060 WSL·웹 컨테이너 호환).
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

APPROVAL_DIRNAME = ".claude/approvals"
APPROVAL_TTL_SEC = 3600  # 1시간


def project_dir() -> Path:
    """훅 실행 시 Claude Code가 주입하는 CLAUDE_PROJECT_DIR 우선, 없으면 cwd."""
    p = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    return Path(p)


def read_input() -> dict:
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except Exception as e:  # noqa: BLE001
        hook_err("stdin JSON 파싱 실패: %s" % e)
        return {}


def kill_switch() -> bool:
    """MONK_HOOKS_OFF=1 — 작가님 터미널 셸 환경에서만 유효 (에이전트 Bash 세션은 별 프로세스)."""
    if os.environ.get("MONK_HOOKS_OFF") == "1":
        sys.stderr.write("[HOOK-OFF] MONK_HOOKS_OFF=1 — 집행 훅 비활성\n")
        return True
    return False


def hook_err(msg: str) -> None:
    """훅 스크립트 자체 오류 = 비차단(exit 1)이라 무음이 된다 → 접두어로 가시화 (§1-4)."""
    sys.stderr.write("[HOOK-ERR] %s: %s\n" % (Path(sys.argv[0]).name, msg))


def decide(event: str, decision: str, reason: str, extra: dict | None = None) -> None:
    """PreToolUse 판정 출력. decision: allow | deny | ask"""
    out = {
        "hookSpecificOutput": {
            "hookEventName": event,
            "permissionDecision": decision,
            "permissionDecisionReason": reason,
        }
    }
    if extra:
        out["hookSpecificOutput"].update(extra)
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()


def context(event: str, text: str) -> None:
    """컨텍스트 주입 (UserPromptSubmit·SessionStart·Stop 공용)."""
    out = {"hookSpecificOutput": {"hookEventName": event, "additionalContext": text}}
    sys.stdout.write(json.dumps(out, ensure_ascii=False))
    sys.stdout.flush()


# ---- E10 승인 토큰 (세션 바인딩 · 1h · 1회용) ----

def approval_path(session_id: str) -> Path:
    return project_dir() / APPROVAL_DIRNAME / ("%s.token" % session_id)


def issue_approval(session_id: str, note: str) -> Path:
    p = approval_path(session_id)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("%s\t%s\n" % (time.strftime("%Y-%m-%d %H:%M:%S"), note), encoding="utf-8")
    return p


def consume_approval(session_id: str) -> tuple[bool, str]:
    """토큰 존재+유효(1h)면 소각 후 True. 아니면 (False, 사유)."""
    p = approval_path(session_id)
    if not p.exists():
        return False, "승인 토큰 없음"
    age = time.time() - p.stat().st_mtime
    if age > APPROVAL_TTL_SEC:
        try:
            p.unlink()
        except OSError:
            pass
        return False, "승인 토큰 만료(%d분 경과, 유효 60분)" % (age // 60)
    try:
        p.unlink()
    except OSError as e:
        return False, "토큰 소각 실패: %s" % e
    return True, "승인 토큰 소각(1회용)"
