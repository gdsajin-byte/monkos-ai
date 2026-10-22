#!/usr/bin/env python3
"""brief_ledger — 브리핑 해소 원장 CLI. 승계 항목을 "처리한 쪽이 닫는" append-only JSONL.

원천: DESIGN_20261022_AUTOPILOT_브리핑_iMac이관_해소원장.md §3 · ORDER_20261022 해소원장 1단계 (PF_AUTOPILOT)
표준 라이브러리만 사용 (웹 컨테이너 호환).

  brief_ledger.py open    --id N --axis A --severity S [--due YYYY-MM-DD] --title T --owner O --by B
  brief_ledger.py resolve --id N --evidence E --by B
  brief_ledger.py reopen  --id N --evidence E --by B
  brief_ledger.py note    --id N --text T --by B
  brief_ledger.py list [--open] [--axis A]
  brief_ledger.py show --id N

원장 경로: --ledger > 환경변수 BRIEF_LEDGER > monkos-ops/ops/briefings/LEDGER.jsonl
상태: open·reopen = 열림 / resolve = 닫힘. note는 상태를 바꾸지 않는다.
쓰기 전 git pull은 호출자 책임. 이 도구는 기존 행을 고치지 않는다(추가만).
종료 코드: 0 정상 / 2 입력 거부·원장 오류 (`❌ brief_ledger: {사유}`)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parent.parent)
DEFAULT_LEDGER = ROOT / "monkos-ops/ops/briefings/LEDGER.jsonl"
KST = dt.timezone(dt.timedelta(hours=9))

AXES = ["mail", "repo", "live", "infra", "local", "session", "content", "secret"]
SEVERITIES = ["🔴", "⏸️", "ℹ️"]
DEVICES = ["M1", "iMac", "M2", "4060", "iPhone", "웹"]
BY_RE = re.compile(r"^(%s)/\S+$" % "|".join(DEVICES))
# 근거: 커밋 SHA(7자+, 숫자 1개 이상) / 2회 히트 / 대조군 / 사람 턴 시각 HH:MM
EVIDENCE_RES = [re.compile(r"(?<![0-9A-Za-z])(?=[0-9a-f]*\d)[0-9a-f]{7,40}(?![0-9A-Za-z])"),
                re.compile(r"2회\s*히트"), re.compile(r"대조군"),
                re.compile(r"(?<!\d)([01]\d|2[0-3]):[0-5]\d(?!\d)")]
OPEN_STATES = {"open", "reopen"}


class LedgerError(Exception):
    pass


def ledger_path(arg: str | None) -> Path:
    return Path(arg or os.environ.get("BRIEF_LEDGER") or DEFAULT_LEDGER)


def load(path: Path) -> list[dict]:
    if not path.exists():
        raise LedgerError("원장 부재: %s" % path)
    rows = []
    for n, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as e:
            raise LedgerError("원장 %d행 JSON 파손: %s" % (n, e))
    return rows


def states(rows: list[dict]) -> dict[int, dict]:
    """id → 현재 상태 요약(마지막 상태 이벤트 + open 시 메타)."""
    out: dict[int, dict] = {}
    for r in rows:
        i = r.get("id")
        if r.get("event") == "open":
            out[i] = dict(r, state="open")
        elif i in out and r.get("event") in ("resolve", "reopen"):
            out[i]["state"] = r["event"]
    return out


def append(path: Path, row: dict) -> None:
    data = path.read_bytes() if path.exists() else b""
    with path.open("ab") as f:
        if data and not data.endswith(b"\n"):
            f.write(b"\n")
        f.write((json.dumps(row, ensure_ascii=False) + "\n").encode("utf-8"))


def check_by(by: str) -> None:
    if not BY_RE.match(by or ""):
        raise LedgerError("by 형식 위반: %r ({디바이스}/{에이전트}, 디바이스=%s)" % (by, "|".join(DEVICES)))


def check_evidence(ev: str) -> None:
    if not ev or not any(rx.search(ev) for rx in EVIDENCE_RES):
        raise LedgerError("evidence 근거 없음: %r (SHA 7자+ / '2회 히트' / '대조군' / HH:MM 중 1개 이상)" % ev)


def event_row(ev: str, i: int, by: str, **kw) -> dict:
    row = {"ts": dt.datetime.now(KST).strftime("%Y-%m-%d %H:%M KST"), "id": i, "event": ev}
    row.update({k: v for k, v in kw.items() if v is not None})
    row["by"] = by
    return row


def cmd_open(a, path: Path) -> str:
    if a.axis not in AXES:
        raise LedgerError("axis 위반: %r (허용 %s)" % (a.axis, "|".join(AXES)))
    if a.severity not in SEVERITIES:
        raise LedgerError("severity 위반: %r (허용 %s)" % (a.severity, "|".join(SEVERITIES)))
    if a.due is not None:
        try:
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", a.due):
                raise ValueError
            dt.date.fromisoformat(a.due)
        except ValueError:
            raise LedgerError("due 형식 위반: %r (YYYY-MM-DD)" % a.due)
    if not a.title.strip() or not a.owner.strip():
        raise LedgerError("title·owner 비어 있음")
    check_by(a.by)
    st = states(load(path))
    if a.id in st:
        raise LedgerError("중복 open: id %d 이미 원장에 있음(상태 %s) — 닫힌 항목은 reopen" % (a.id, st[a.id]["state"]))
    append(path, event_row("open", a.id, a.by, axis=a.axis, severity=a.severity, due=a.due,
                           title=a.title, owner=a.owner))
    return "✅ open (%d) %s %s %s" % (a.id, a.severity, a.axis, a.title)


def cmd_transition(a, path: Path) -> str:
    check_by(a.by)
    check_evidence(a.evidence)
    st = states(load(path))
    if a.id not in st:
        raise LedgerError("id %d 원장에 없음" % a.id)
    cur = st[a.id]["state"]
    if a.cmd == "resolve" and cur not in OPEN_STATES:
        raise LedgerError("resolve 거부: id %d 는 열린 항목이 아님(상태 %s)" % (a.id, cur))
    if a.cmd == "reopen" and cur in OPEN_STATES:
        raise LedgerError("reopen 거부: id %d 는 이미 열려 있음(상태 %s)" % (a.id, cur))
    append(path, event_row(a.cmd, a.id, a.by, evidence=a.evidence))
    return "✅ %s (%d) — %s" % (a.cmd, a.id, a.evidence)


def cmd_note(a, path: Path) -> str:
    check_by(a.by)
    if not a.text.strip():
        raise LedgerError("note 내용 비어 있음")
    if a.id not in states(load(path)):
        raise LedgerError("id %d 원장에 없음" % a.id)
    append(path, event_row("note", a.id, a.by, text=a.text))
    return "✅ note (%d)" % a.id


def cmd_list(a, path: Path) -> str:
    st = states(load(path))
    items = [s for s in st.values() if (not a.open or s["state"] in OPEN_STATES)
             and (not a.axis or s.get("axis") == a.axis)]
    items.sort(key=lambda s: (SEVERITIES.index(s["severity"]) if s.get("severity") in SEVERITIES else 9,
                              s.get("due") or "9999-99-99", s["id"]))
    if not items:
        return "(항목 0건)"
    lines = ["| id | 심각 | 축 | 기한 | 상태 | 담당 | 제목 |", "|---|---|---|---|---|---|---|"]
    for s in items:
        lines.append("| (%d) | %s | %s | %s | %s | %s | %s |" % (
            s["id"], s.get("severity", ""), s.get("axis", ""), s.get("due") or "—",
            s["state"], s.get("owner", ""), s.get("title", "")))
    lines.append("— %d건" % len(items))
    return "\n".join(lines)


def cmd_show(a, path: Path) -> str:
    rows = [r for r in load(path) if r.get("id") == a.id]
    if not rows:
        raise LedgerError("id %d 원장에 없음" % a.id)
    out = []
    for r in rows:
        detail = r.get("title") or r.get("evidence") or r.get("text") or ""
        out.append("%s  %-7s %s  — %s" % (r.get("ts", ""), r.get("event", ""), r.get("by", ""), detail))
    return "\n".join(out)


def main() -> int:
    p = argparse.ArgumentParser(prog="brief_ledger", description="브리핑 해소 원장")
    p.add_argument("--ledger", default=None, help="원장 경로(스모크용). 기본 BRIEF_LEDGER 또는 정본")
    sub = p.add_subparsers(dest="cmd", required=True)

    o = sub.add_parser("open")
    o.add_argument("--id", type=int, required=True); o.add_argument("--axis", required=True)
    o.add_argument("--severity", required=True); o.add_argument("--due", default=None)
    o.add_argument("--title", required=True); o.add_argument("--owner", required=True)
    o.add_argument("--by", required=True)
    for name in ("resolve", "reopen"):
        t = sub.add_parser(name)
        t.add_argument("--id", type=int, required=True); t.add_argument("--evidence", required=True)
        t.add_argument("--by", required=True)
    n = sub.add_parser("note")
    n.add_argument("--id", type=int, required=True); n.add_argument("--text", required=True)
    n.add_argument("--by", required=True)
    l = sub.add_parser("list")
    l.add_argument("--open", action="store_true"); l.add_argument("--axis", default=None)
    s = sub.add_parser("show")
    s.add_argument("--id", type=int, required=True)

    try:
        a = p.parse_args()
    except SystemExit as e:
        if e.code:
            print("❌ brief_ledger: 인자 오류", file=sys.stderr)
            return 2
        return 0
    path = ledger_path(a.ledger)
    handler = {"open": cmd_open, "resolve": cmd_transition, "reopen": cmd_transition,
               "note": cmd_note, "list": cmd_list, "show": cmd_show}[a.cmd]
    try:
        print(handler(a, path))
    except LedgerError as e:
        print("❌ brief_ledger: %s" % e, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
