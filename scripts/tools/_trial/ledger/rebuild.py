#!/usr/bin/env python3
"""지휘 원장 0단계 — 지시서 YAML + 세션 로그만으로 원장 재구성 (읽기 전용).

설계: monkos-ops/tech/designs/2026-10/DESIGN_20261004_iMac쌍아_지휘원장_지휘소.md §4
범위(쌍아 10-04 12:23): 대화 기록 jsonl 소스 제외. 세션 로그에 적힌 위임·수신·전달·완료 행만.
원장 1행 = 사건 1건. 본문 없음, 행 첫 120자만.

사용:
  rebuild.py build [--since 2026-10-01] [--until 2026-10-04] [--out PATH]
  rebuild.py query [--kind K] [--frm S] [--to S] [--day YYYY-MM-DD] [--text S] [--ledger PATH]
  rebuild.py chain <ORDER 부분문자열> [--ledger PATH]
  rebuild.py open [--ledger PATH]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
DEFAULT_OUT = Path(__file__).resolve().parent / "out" / "COMMAND_LEDGER_20261001-04.jsonl"
KST = dt.timezone(dt.timedelta(hours=9))
CUT = 120

ORDER_RE = re.compile(r"ORDER_\d{8}_[0-9A-Za-z가-힣_·\-]+")
SHA_RE = re.compile(r"\b[0-9a-f]{7,40}\b")
HEAD_RE = re.compile(r"^\*\*\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) KST\]\*\*\s*(\S+)\s*→\s*(.+?)\s*$")
HEAD_ONLY_RE = re.compile(r"^\*\*\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}) KST\]\*\*\s*(\S.*)$")

# 행 분류 — 앞에 있을수록 우선
KINDS = [
    ("ack", re.compile(r"수신 확인|수신:|수령")),
    ("delegate", re.compile(r"위임")),
    ("message", re.compile(r"전달|세션 메시지|메시지로|회신")),
    ("complete", re.compile(r"완료|COMPLETION")),
]


EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE_RE = re.compile(r"\b01\d-?\d{3,4}-?\d{4}\b")


def redact(text: str) -> str:
    """원장 제목에서 이메일·전화번호 가림 (원문 기록에 섞여 있어도 원장으로는 옮기지 않는다)."""
    return PHONE_RE.sub("[전화]", EMAIL_RE.sub("[이메일]", text))


def refs(text: str) -> list[str]:
    return sorted({m.removesuffix(".md") for m in ORDER_RE.findall(text)})


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if not text.startswith("---"):
        return {}
    meta = {}
    for line in text[3:text.find("\n---", 3)].splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"')
    return meta


def git_added(path: Path) -> str:
    r = subprocess.run(["git", "log", "--diff-filter=A", "--format=%aI", "--", str(path.relative_to(ROOT))],
                       cwd=ROOT, capture_output=True, text=True)
    out = r.stdout.split()
    return dt.datetime.fromisoformat(out[-1]).astimezone(KST).isoformat(timespec="seconds") if out else ""


def months(since: str, until: str) -> list[str]:
    return sorted({since[:7], until[:7]})


def build(since: str, until: str) -> list[dict]:
    rows: list[dict] = []
    for m in months(since, until):
        for p in sorted((ROOT / "monkos-ops/ops/orders" / m).glob("ORDER_*.md")):
            meta = frontmatter(p)
            day = meta.get("date", "")
            if not (since <= day <= until):
                continue
            ts = git_added(p) or f"{day}T00:00:00+09:00"
            rows.append({"ts": ts, "kind": "order", "from": meta.get("from", ""), "to": meta.get("to", ""),
                         "ref": [p.stem], "subject": redact(meta.get("subject", ""))[:CUT], "status": meta.get("status", ""),
                         "pf": meta.get("portfolio", ""), "source": f"{p.relative_to(ROOT)}"})
        for p in sorted((ROOT / "monkos-ops/ops/sessions" / m).glob("*.md")):
            if not (since <= p.name[:10] <= until):
                continue
            owner = p.stem.split("_", 1)[1].replace("_", "/", 1)
            ts, frm, to = "", owner, ""
            for n, line in enumerate(p.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
                h = HEAD_RE.match(line.strip())
                if h:
                    ts = dt.datetime.strptime(h.group(1), "%Y-%m-%d %H:%M").replace(tzinfo=KST).isoformat()
                    frm, to = h.group(2), h.group(3)
                    continue
                # 쌍아 로그 형식: 머리 행에 수신자 없이 내용이 바로 붙는다 → 머리 행 자체를 사건 행으로
                h2 = HEAD_ONLY_RE.match(line.strip())
                if h2:
                    ts = dt.datetime.strptime(h2.group(1), "%Y-%m-%d %H:%M").replace(tzinfo=KST).isoformat()
                    frm, to = owner, ""
                    line = "- " + h2.group(2)
                if not ts or not line.strip().startswith(("-", "*", "|")):
                    continue
                kind = next((k for k, rx in KINDS if rx.search(line)), None)
                if not kind:
                    continue
                row = {"ts": ts, "kind": kind, "from": frm, "to": to, "ref": refs(line),
                       "subject": redact(line.strip().lstrip("-* ").strip())[:CUT], "source": f"{p.relative_to(ROOT)}:{n}"}
                shas = [s for s in SHA_RE.findall(line) if re.search(r"[a-f]", s) and re.search(r"\d", s)]
                if kind == "complete" and shas:
                    row["sha"] = shas
                rows.append(row)
    rows.sort(key=lambda r: (r["ts"], r["kind"] != "order"))
    return rows


def load(path: Path) -> list[dict]:
    return [json.loads(l) for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]


def show(rows: list[dict]) -> None:
    for r in rows:
        extra = f" sha={','.join(r['sha'])}" if r.get("sha") else ""
        print(f"{r['ts'][:16]} {r['kind']:<8} {r['from']} → {r['to']} | {r['subject'][:90]}{extra}  [{r['source']}]")
    print(f"({len(rows)}건)")


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build")
    b.add_argument("--since", default="2026-10-01")
    b.add_argument("--until", default="2026-10-04")
    b.add_argument("--out", default=str(DEFAULT_OUT))
    for name in ("query", "chain", "open"):
        s = sub.add_parser(name)
        s.add_argument("--ledger", default=str(DEFAULT_OUT))
        if name == "query":
            for f in ("kind", "frm", "to", "day", "text"):
                s.add_argument(f"--{f}")
        if name == "chain":
            s.add_argument("order")
    a = ap.parse_args()

    if a.cmd == "build":
        rows = build(a.since, a.until)
        out = Path(a.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
        counts: dict[str, int] = {}
        for r in rows:
            counts[r["kind"]] = counts.get(r["kind"], 0) + 1
        print(f"{out} ← {len(rows)}건 {counts}")
        return

    rows = load(Path(a.ledger))
    if a.cmd == "query":
        sel = [r for r in rows
               if (not a.kind or r["kind"] == a.kind) and (not a.frm or a.frm in r["from"])
               and (not a.to or a.to in r["to"]) and (not a.day or r["ts"].startswith(a.day))
               and (not a.text or a.text in r["subject"] or any(a.text in x for x in r["ref"]))]
        show(sel)
    elif a.cmd == "chain":
        show([r for r in rows if any(a.order in x for x in r["ref"])])
    elif a.cmd == "open":
        linked = {x for r in rows if r["kind"] in ("ack", "complete") for x in r["ref"]}
        show([r for r in rows if r["kind"] == "order" and r.get("status") == "발행" and r["ref"][0] not in linked])


if __name__ == "__main__":
    main()
