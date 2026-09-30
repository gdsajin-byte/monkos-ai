#!/usr/bin/env python3
"""pf — PF(포트폴리오) 원장 CLI. 마크다운 README가 정본, 이 도구는 쓰기·질의·검사를 기계화한다.

원천: DESIGN_20260930_PF원장화_pf_ledger.md (PF_MONK_OS) · ch4 9조
표준 라이브러리만 사용 (4060 WSL·웹 컨테이너 호환).

  pf.py append <PF_ID|코드네임> "<내용>" --agent iMac/민아 [--artifact 경로|링크] [--status ✅|⏳|❌|🔀|📁] [--date] [--force]
  pf.py query [--status active] [--pf X] [--stale 14] [--since YYYY-MM-DD] [--json]
  pf.py check [--days 3] [--strict]      # portfolio: 필드를 가진 문서가 해당 PF 히스토리에 링크됐는지
  pf.py show <PF_ID> [--tail 5]

종료 코드: 0 정상 / 1 검사 위반(--strict) 또는 입력 오류 / 2 PF 부재·구조 오류
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parent.parent)
PF_DIR = ROOT / "monkos-ops/ops/portfolios"
HIST_HEADER = re.compile(r"^\|\s*날짜\s*\|\s*주체\s*\|\s*내용\s*\|\s*산출물\s*\|\s*상태\s*\|")
DOC_DIRS = ["monkos-ops/ops/reports", "monkos-ops/ops/orders", "monkos-ops/ops/incidents",
            "monkos-ops/ops/proposals", "monkos-ops/tech/designs", "monkos-ops/tech/specs"]
LINE_CAP = 500
STATUS_BY_TYPE = {"completion": "✅", "incident": "🔴", "order": "⏳", "report": "📁",
                  "design": "⏳", "proposal": "⏳", "spec": "📁", "review": "📁", "petition": "⏳"}


class PFError(Exception):
    pass


# ---------- 파싱 ----------

def frontmatter(text: str) -> dict:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    out = {}
    for line in m.group(1).splitlines():
        mm = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", line)
        if mm:
            out[mm.group(1)] = mm.group(2).strip().strip('"').strip("'")
    return out


def resolve(pf: str) -> Path:
    pid = pf if pf.startswith("PF_") else "PF_" + pf
    p = PF_DIR / pid / "README.md"
    if not p.exists():
        raise PFError("PF 부재: %s (경로 %s)" % (pid, p.relative_to(ROOT)))
    return p


def history_block(lines: list[str]) -> tuple[int, int]:
    """(첫 데이터 행 인덱스, 마지막 데이터 행 인덱스+1). 헤더 다음 구분선 다음부터 연속 '|' 행."""
    for i, l in enumerate(lines):
        if HIST_HEADER.match(l):
            j = i + 1
            if j < len(lines) and re.match(r"^\|\s*-", lines[j]):
                j += 1
            k = j
            while k < len(lines) and lines[k].startswith("|"):
                k += 1
            return j, k
    raise PFError("히스토리 표 헤더(| 날짜 | 주체 | 내용 | 산출물 | 상태 |) 없음")


def row_date_format(rows: list[str]) -> str:
    for r in reversed(rows):
        cell = r.split("|")[1].strip() if r.count("|") >= 2 else ""
        if re.match(r"^\d{4}-\d{2}-\d{2}$", cell):
            return "%Y-%m-%d"
        if re.match(r"^\d{2}/\d{2}$", cell):
            return "%m/%d"
    return "%m/%d"


def parse_row_date(cell: str, today: dt.date) -> dt.date | None:
    cell = cell.strip().strip("*")
    try:
        if re.match(r"^\d{4}-\d{2}-\d{2}$", cell):
            return dt.date.fromisoformat(cell)
        m = re.match(r"^(\d{2})/(\d{2})$", cell)
        if m:
            d = dt.date(today.year, int(m.group(1)), int(m.group(2)))
            return d if d <= today else dt.date(today.year - 1, d.month, d.day)
    except ValueError:
        return None
    return None


# ---------- append ----------

def artifact_cell(artifact: str, pf_readme: Path) -> str:
    if not artifact:
        return "—"
    if artifact.startswith("[") or artifact.startswith("`"):
        return artifact
    cand = (ROOT / artifact) if not os.path.isabs(artifact) else Path(artifact)
    if cand.exists():
        rel = os.path.relpath(cand, pf_readme.parent)
        return "[%s](%s)" % (cand.stem, rel)
    return "`%s`" % artifact


def append(pf: str, content: str, agent: str, artifact: str = "", status: str = "✅",
           date: str | None = None, force: bool = False) -> str:
    readme = resolve(pf)
    lines = readme.read_text(encoding="utf-8").split("\n")
    j, k = history_block(lines)
    rows = lines[j:k]
    fmt = row_date_format(rows)
    d = dt.date.today() if not date else dt.date.fromisoformat(date)
    cell_date = d.strftime(fmt)
    art = artifact_cell(artifact, readme)
    key = Path(artifact).name if artifact and not artifact.startswith("[") else ""
    if key and not force and any(key in r for r in rows):
        raise PFError("중복: %s 가 이미 히스토리에 있음 (--force로 강제)" % key)
    safe = content.replace("|", "｜").replace("\n", " ").strip()
    row = "| %s | %s | %s | %s | %s |" % (cell_date, agent, safe, art, status)
    lines.insert(k, row)
    readme.write_text("\n".join(lines), encoding="utf-8")
    n = len(lines)
    warn = " ⚠️ %d줄 — 500줄 초과, 아카이브 트리거(ch4 9조)" % n if n > LINE_CAP else ""
    return "%s ← %s%s" % (readme.relative_to(ROOT), row[:100], warn)


# ---------- query / show ----------

def all_pfs():
    for d in sorted(PF_DIR.iterdir()):
        r = d / "README.md"
        if d.name.startswith("PF_") and r.exists():
            yield d.name, r


def summarize(pid: str, readme: Path, today: dt.date) -> dict:
    text = readme.read_text(encoding="utf-8")
    fm = frontmatter(text)
    lines = text.split("\n")
    try:
        j, k = history_block(lines)
        rows = [r for r in lines[j:k] if r.count("|") >= 5]
    except PFError:
        rows = []
    last = rows[-1] if rows else ""
    cells = [c.strip() for c in last.split("|")[1:-1]] if last else []
    last_date = parse_row_date(cells[0], today) if cells else None
    return {
        "pf": pid, "status": fm.get("status", "?"), "leads": fm.get("leads", ""),
        "rows": len(rows), "lines": len(lines),
        "last_date": last_date.isoformat() if last_date else (cells[0] if cells else ""),
        "stale_days": (today - last_date).days if last_date else None,
        "last": (cells[2][:70] if len(cells) > 2 else ""),
        "last_status": (cells[4] if len(cells) > 4 else ""),
    }


def query(args) -> int:
    today = dt.date.today()
    out = []
    for pid, r in all_pfs():
        s = summarize(pid, r, today)
        if args.pf and pid != (args.pf if args.pf.startswith("PF_") else "PF_" + args.pf):
            continue
        if args.status and not s["status"].startswith(args.status):
            continue
        if args.stale is not None and (s["stale_days"] is None or s["stale_days"] < args.stale):
            continue
        if args.since and (not s["last_date"] or s["last_date"] < args.since):
            continue
        out.append(s)
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=1))
        return 0
    print("| PF | status | 마지막 | 경과일 | 행 | 줄 | 마지막 내용 |")
    print("|----|--------|--------|------|----|----|------|")
    for s in out:
        print("| %s | %s | %s | %s | %d | %d%s | %s |" % (
            s["pf"], s["status"], s["last_date"] or "—",
            s["stale_days"] if s["stale_days"] is not None else "—", s["rows"], s["lines"],
            " ⚠️" if s["lines"] > LINE_CAP else "", s["last"]))
    print("\n%d PF" % len(out))
    return 0


def show(args) -> int:
    readme = resolve(args.pf)
    lines = readme.read_text(encoding="utf-8").split("\n")
    fm = frontmatter("\n".join(lines))
    j, k = history_block(lines)
    print("%s — status=%s leads=%s (%d줄, 히스토리 %d행)" % (args.pf, fm.get("status"), fm.get("leads"), len(lines), k - j))
    for r in lines[max(j, k - args.tail):k]:
        print(r[:160])
    return 0


# ---------- check ----------

def docs_with_portfolio(days: int):
    cutoff = dt.datetime.now().timestamp() - days * 86400
    for d in DOC_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*.md"):
            if p.stat().st_mtime < cutoff:
                continue
            fm = frontmatter(p.read_text(encoding="utf-8", errors="replace"))
            pf = fm.get("portfolio", "")
            if pf and pf.startswith("PF_") and " " not in pf:
                yield p, pf, fm


def check(args) -> int:
    missing, checked = [], 0
    for p, pf, fm in docs_with_portfolio(args.days):
        checked += 1
        try:
            readme = resolve(pf)
        except PFError as e:
            missing.append("%s → %s" % (p.relative_to(ROOT), e))
            continue
        if p.name not in readme.read_text(encoding="utf-8"):
            missing.append("%s → %s 히스토리에 링크 없음" % (p.relative_to(ROOT), pf))
    if missing:
        print("⚠️ PF 교차 링크 누락 %d/%d (헌법 3조 2항 PF 갱신 의무 · ch4 9조)" % (len(missing), checked))
        for m in missing:
            print("  - " + m)
        return 1 if args.strict else 0
    print("✅ 최근 %d일 portfolio: 문서 %d건 전건 PF 히스토리 링크됨" % (args.days, checked))
    return 0


# ---------- main ----------

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="pf", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("append")
    a.add_argument("pf"); a.add_argument("content")
    a.add_argument("--agent", required=True, help="예: iMac/민아")
    a.add_argument("--artifact", default=""); a.add_argument("--status", default="✅")
    a.add_argument("--date", default=None); a.add_argument("--force", action="store_true")
    q = sub.add_parser("query")
    q.add_argument("--status"); q.add_argument("--pf"); q.add_argument("--stale", type=int)
    q.add_argument("--since"); q.add_argument("--json", action="store_true")
    c = sub.add_parser("check")
    c.add_argument("--days", type=int, default=3); c.add_argument("--strict", action="store_true")
    s = sub.add_parser("show")
    s.add_argument("pf"); s.add_argument("--tail", type=int, default=5)
    args = ap.parse_args(argv)
    try:
        if args.cmd == "append":
            print(append(args.pf, args.content, args.agent, args.artifact, args.status, args.date, args.force))
            return 0
        if args.cmd == "query":
            return query(args)
        if args.cmd == "check":
            return check(args)
        if args.cmd == "show":
            return show(args)
    except PFError as e:
        print("❌ pf: %s" % e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
