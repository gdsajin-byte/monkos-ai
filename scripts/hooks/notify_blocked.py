#!/usr/bin/env python3
"""Notification 훅 — 백그라운드 세션이 승인 대기에 들어가면 텔레그램 1줄 (알림만).

원천: ORDER_20261022_iMac쌍아_막내_MONK_OS_백그라운드승인대기_텔레그램알림.md
- 대상: 권한/승인 프롬프트 대기(notification_type == "permission_prompt")만. 유휴 등은 무시.
- 백그라운드 한정: session_id를 `claude agents --json`의 kind=="background" 항목과 대조.
  판별 실패 시 발송하지 않고 [HOOK-ERR] (오발송보다 무발송, 무음 금지).
- 중복 억제: 같은 세션 10분 내 1회 (~/.claude/monk_notify_blocked/{session_id}).
- 승인 경로 불변: 응답은 사람이 `claude attach`로. 이 훅은 어떤 판정도 출력하지 않고 항상 exit 0.
- 덤프(스키마 실측용): {STATE_DIR}/.dump 파일이 있으면 입력 JSON을 {STATE_DIR}/dump.jsonl에 어펜드.
  bg 세션은 데몬 프로세스에서 기동돼 셸 환경변수를 상속하지 않으므로(10-22 실측) 파일 스위치를 쓴다.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import hook_err, kill_switch, project_dir, read_input  # noqa: E402

DEDUP_SEC = 600
STATE_DIR = Path(os.environ.get("MONK_NOTIFY_STATE_DIR") or Path.home() / ".claude/monk_notify_blocked")
PERMISSION_TYPE = "permission_prompt"


def background_entry(session_id: str) -> tuple[dict | None, str]:
    """(bg 항목 | None, 사유). 테스트용 MONK_NOTIFY_AGENTS_JSON(파일 경로)로 대체 가능."""
    src = os.environ.get("MONK_NOTIFY_AGENTS_JSON")
    try:
        if src:
            raw = Path(src).read_text(encoding="utf-8")
        else:
            p = subprocess.run(["claude", "agents", "--json"], capture_output=True, text=True, timeout=8)
            if p.returncode != 0:
                return None, "claude agents --json rc=%d" % p.returncode
            raw = p.stdout
        agents = json.loads(raw)
    except Exception as e:  # noqa: BLE001
        return None, "claude agents --json 실패: %s" % e
    for a in agents:
        if a.get("sessionId") == session_id:
            if a.get("kind") == "background":
                return a, "background"
            return None, "kind=%s" % a.get("kind")
    return None, "세션 목록에 없음"


PATH_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit", "Read"}


def last_tool(transcript_path: str) -> str:
    """기록 끝의 마지막 tool_use → '도구명[ 파일경로]'. 명령 인자·URL 등 원문은 넣지 않는다."""
    try:
        with open(transcript_path, "rb") as f:
            f.seek(0, 2)
            f.seek(max(0, f.tell() - 262144))
            lines = f.read().decode("utf-8", "replace").splitlines()
    except (OSError, TypeError):
        return ""
    for line in reversed(lines):
        try:
            content = json.loads(line).get("message", {}).get("content")
        except (json.JSONDecodeError, AttributeError):
            continue
        if not isinstance(content, list):
            continue
        for b in reversed(content):
            if isinstance(b, dict) and b.get("type") == "tool_use":
                name = str(b.get("name", "?"))
                fp = (b.get("input") or {}).get("file_path") if name in PATH_TOOLS else None
                if fp:
                    try:
                        fp = str(Path(fp).relative_to(project_dir()))
                    except ValueError:
                        pass
                    return "%s %s" % (name, fp)
                return name
    return ""


def summarize(data: dict) -> str:
    """사유 요약 ≤80자. message 실측값은 고정 문구('Claude needs your permission')라 도구명을 덧붙인다."""
    msg = (data.get("message") or "승인 필요").splitlines()[0]
    msg = re.sub(r"`[^`]*`|\"[^\"]*\"|'[^']*'", "…", msg)
    tool = last_tool(data.get("transcript_path") or "")
    return ("%s · %s" % (tool, msg) if tool else msg)[:80]


def build_text(name: str, summary: str, short: str) -> str:
    """알림 본문. attach는 같은 기기 터미널 전용 — 다른 기기(맥 미니 등)에서는 attach가 실패하므로
    Remote Control 경로를 함께 적는다 (10-22 22:52 실전: 작가님 맥 미니 attach 실패 → Remote Control로 승인)."""
    return "⏸ %s 승인 대기 — %s\nclaude attach %s\n원격: claude.ai/code 세션 목록 → %s" % (name, summary, short, name)


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    if (STATE_DIR / ".dump").exists():
        try:
            with open(STATE_DIR / "dump.jsonl", "a", encoding="utf-8") as f:
                f.write(json.dumps(data, ensure_ascii=False) + "\n")
        except OSError as e:
            hook_err("덤프 실패: %s" % e)

    if data.get("notification_type") != PERMISSION_TYPE:
        return 0
    sid = data.get("session_id") or ""
    if not sid:
        hook_err("session_id 없음 — 미발송")
        return 0

    entry, why = background_entry(sid)
    if entry is None:
        if why.startswith("kind="):
            return 0  # 대화형 — 사람이 보고 있음, 정상 무발송
        hook_err("백그라운드 판별 실패(%s) — 미발송" % why)
        return 0

    stamp = STATE_DIR / sid
    if stamp.exists() and time.time() - stamp.stat().st_mtime < DEDUP_SEC:
        return 0

    name = entry.get("name") or sid[:8]
    short = entry.get("id") or sid[:8]
    text = build_text(name, summarize(data), short)
    tool = project_dir() / "scripts/tools/tg_notify.sh"
    try:
        p = subprocess.run(["bash", str(tool), "--text", text], capture_output=True, text=True, timeout=40)
    except Exception as e:  # noqa: BLE001
        hook_err("tg_notify 실행 실패: %s" % e)
        return 0
    if p.returncode != 0:
        hook_err("tg_notify rc=%d %s" % (p.returncode, (p.stderr or "").strip()[:200]))
        return 0
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        stamp.write_text(time.strftime("%Y-%m-%d %H:%M:%S") + "\t" + p.stdout.strip() + "\n", encoding="utf-8")
    except OSError as e:
        hook_err("중복 억제 상태 기록 실패: %s" % e)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001
        hook_err("%s" % e)
        sys.exit(0)
