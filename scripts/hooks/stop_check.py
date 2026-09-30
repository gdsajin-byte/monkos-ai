#!/usr/bin/env python3
"""Stop 훅 — E11 세션 로그 어펜드 의무 + PF 교차 링크 누락 경고 (비차단).

원천: DESIGN_20260930_집행코드화_hooks_deny.md E11 · DESIGN_20260930_PF원장화 1단계
- 오늘 mtime의 portfolio: 문서 중 PF 히스토리에 없는 것 → 경고 목록
- 오늘 세션 로그가 하나도 없거나, 레포에 최근 2시간 변경이 있는데 오늘 세션 로그 mtime이 2시간 이상 전이면 경고
상태 저장 없이 파일 mtime만 본다 (무상태·전 디바이스 동일).
"""
import datetime as dt
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
from _common import context, hook_err, kill_switch, project_dir, read_input  # noqa: E402

EVENT = "Stop"
TWO_H = 2 * 3600


def main() -> int:
    if kill_switch():
        return 0
    data = read_input()
    if data.get("stop_hook_active"):
        return 0
    root = project_dir()
    warns = []
    import pf
    # 1) PF 교차 링크 (오늘분)
    for p, pfid, fm in pf.docs_with_portfolio(1):
        try:
            readme = pf.resolve(pfid)
        except pf.PFError as e:
            warns.append("PF 부재: %s (%s)" % (pfid, p.name))
            continue
        if p.name not in readme.read_text(encoding="utf-8"):
            warns.append("PF 미갱신: %s → %s 히스토리에 없음 → `scripts/pf.sh append %s \"...\" --artifact %s --agent {디바이스}/{에이전트}`"
                         % (p.name, pfid, pfid, p.relative_to(root)))
    # 2) 세션 로그 신선도
    today = dt.date.today()
    sdir = root / "monkos-ops/ops/sessions" / today.strftime("%Y-%m")
    logs = sorted(sdir.glob(today.strftime("%Y-%m-%d") + "_*.md")) if sdir.exists() else []
    now = time.time()
    if not logs:
        warns.append("오늘 세션 로그 없음 (헌법 3조 2항) — session-start 스킬로 생성")
    else:
        newest = max(l.stat().st_mtime for l in logs)
        recent_change = any(
            (root / d).exists() and any(q.stat().st_mtime > now - TWO_H for q in (root / d).rglob("*") if q.is_file())
            for d in ("monkos-ops/ops/reports", "monkos-ops/tech/designs", "scripts", ".claude"))
        if recent_change and newest < now - TWO_H:
            warns.append("세션 로그 %d분째 미갱신인데 최근 2시간 내 레포 변경 있음 — 어펜드 필요 (헌법 3조 2항)" % ((now - newest) // 60))
    if warns:
        context(EVENT, "[Stop 훅 경고]\n- " + "\n- ".join(warns))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:  # noqa: BLE001
        hook_err("예외: %s" % e)
        sys.exit(1)
