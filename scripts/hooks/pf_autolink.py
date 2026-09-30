#!/usr/bin/env python3
"""PostToolUse(Write) 훅 — portfolio: 필드를 가진 공식 문서가 생성되면 해당 PF 히스토리에 자동 어펜드.

원천: DESIGN_20260930_PF원장화_pf_ledger.md 1단계 · 헌법 3조 2항(PF 갱신 의무)의 코드화
- 대상: reports/orders/incidents/proposals/designs/specs 아래 .md 신규 Write
- frontmatter: portfolio: PF_X (필수) · type · subject · device · agent
- 이미 링크돼 있으면 무동작. 에이전트는 같은 문서를 수동으로 또 붙이지 않는다(중복은 pf.py가 거부).
- 실패는 비차단 — [HOOK-ERR]로 가시화.
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
from _common import context, hook_err, kill_switch, project_dir, read_input  # noqa: E402

EVENT = "PostToolUse"


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    if data.get("tool_name") != "Write":
        return 0
    fp = (data.get("tool_input") or {}).get("file_path") or ""
    if not fp:
        return 0
    root = project_dir()
    try:
        rel = os.path.relpath(fp, root).replace("\\", "/")
    except ValueError:
        return 0
    import pf  # scripts/pf.py
    if not any(rel.startswith(d + "/") for d in pf.DOC_DIRS):
        return 0
    p = Path(fp)
    if not p.exists():
        return 0
    fm = pf.frontmatter(p.read_text(encoding="utf-8", errors="replace"))
    pfid = fm.get("portfolio", "")
    if not pfid.startswith("PF_") or " " in pfid:
        return 0
    typ = (fm.get("type") or "doc").lower()
    subject = fm.get("subject") or p.stem
    agent = "%s/%s" % (fm.get("device", "?"), fm.get("agent", "?"))
    status = pf.STATUS_BY_TYPE.get(typ, "📁")
    try:
        msg = pf.append(pfid, "**%s** %s" % (typ.upper(), subject), agent, rel, status)
    except pf.PFError as e:
        if "중복" in str(e):
            return 0
        hook_err("PF 자동 링크 실패: %s" % e)
        context(EVENT, "[PF 자동 링크 실패] %s — 수동으로 `scripts/pf.sh append` 하라" % e)
        return 1
    context(EVENT, "[PF 자동 링크] %s (헌법 3조 2항 — 이 문서는 수동 어펜드 불요)" % msg)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
