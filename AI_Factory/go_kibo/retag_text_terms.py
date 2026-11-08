#!/usr/bin/env python3
"""정제본 문장 용어 재태깅 — go_text_terms.detect_text(개념·손익어)를 정제 일꾼 꼬리표에 합친다. 새 유료 호출 0.

  python3 retag_text_terms.py v1            # 30편 v1_all.jsonl → v1_all_t1.jsonl + 빈도 전·후 표
  python3 retag_text_terms.py f1            # 판독 9편 f1_{영상}_in0·out0 → f1_all.jsonl(+det) — refine_sample.py --prefix f1 입력
  python3 retag_text_terms.py spot [--k 4]  # 용어별 무작위 검출 예 k개(정밀도 판독용, 레포 밖 md)
입력·출력 모두 레포 밖(방송 원문 포함): commentary_v0/refine/. 레포에는 건수 표만(reports/GO_TEXT_TERMS_v1.md).
행 칸: det = [[표준명, kind, 규칙]] · terms_t1/concepts_t1 = 일꾼 꼬리표 ∪ 검출(일꾼 꼬리표는 지우지 않는다).
판 단서 판정 맥락 = 같은 영상 앞뒤 발화 1개씩.
"""
import glob
import json
import os
import random
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402
from go_text_terms import RULES, detect_text  # noqa: E402

D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")
YT = os.path.expanduser("~/.monkos/go-commentary-yt")
REPORT = os.path.join(HERE, "reports", "GO_TEXT_TERMS_v1.md")
KST = timezone(timedelta(hours=9))


def tag(rows):
    idx = {(r["id"], r["i"]): r for r in rows}
    for r in rows:
        r["det"] = []
        r["terms_t1"] = list(r.get("terms") or [])
        r["concepts_t1"] = list(r.get("concepts") or [])
        if not r.get("keep"):
            continue
        ctx = " ".join((idx.get((r["id"], r["i"] + d)) or {}).get("text") or "" for d in (-1, 1))
        for name, kind, rule in detect_text(r.get("text") or "", ctx):
            r["det"].append([name, kind, rule])
            have = set(r["terms_t1"]) | set(r["concepts_t1"])
            if name not in have:
                (r["terms_t1"] if kind == "term" else r["concepts_t1"]).append(name)
    return rows


def write(rows, path):
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def counts(rows, a, b):
    return Counter(t for r in rows if r.get("keep") for t in (r.get(a) or []) + (r.get(b) or []))


def load_f1():
    cat = {}
    for x in open(os.path.join(YT, "catalog.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        cat[d["id"]] = d
    rows = []
    for fin in sorted(glob.glob(os.path.join(D, "f1_*_in0.jsonl"))):
        vid = os.path.basename(fin)[3:-len("_in0.jsonl")]
        fout = fin.replace("_in0.", "_out0.")
        outs = {d["i"]: d for d in (json.loads(x) for x in open(fout, encoding="utf-8") if x.strip())} if os.path.exists(fout) else {}
        c = cat.get(vid, {})
        com = c.get("commentator") or "?"
        com = "·".join(com) if isinstance(com, list) else com
        cas = c.get("caster") or []
        for x in open(fin, encoding="utf-8"):
            u = json.loads(x)
            o = outs.get(u["i"], {})
            rows.append({"id": vid, "commentator": com, "caster": "·".join(cas) if isinstance(cas, list) else str(cas), **u,
                         **{k: o.get(k) for k in ("keep", "drop", "role", "label", "qa", "board_dep", "terms", "concepts", "note")}})
    return rows


def report(rows, prefix):
    before = counts(rows, "terms", "concepts")
    after = counts(rows, "terms_t1", "concepts_t1")
    det = Counter(t[0] for r in rows for t in r["det"])
    new = Counter(t[0] for r in rows for t in r["det"] if t[0] not in set(r.get("terms") or []) | set(r.get("concepts") or []))
    kept = sum(1 for r in rows if r.get("keep"))
    tagged_b = sum(1 for r in rows if r.get("keep") and ((r.get("terms") or []) or (r.get("concepts") or [])))
    tagged_a = sum(1 for r in rows if r.get("keep") and (r["terms_t1"] or r["concepts_t1"]))
    names = [n for n, *_ in RULES]
    src = {n: s for n, _, _, _, _, s in RULES}
    gate = {n: g for n, _, _, _, g, _ in RULES}
    L = [f"## {prefix} — 발화 {len(rows):,} · 남김 {kept:,}",
         f"- 꼬리표 있는 남김 발화: {tagged_b:,} → {tagged_a:,} (+{tagged_a - tagged_b:,})",
         f"- 검출 합계 {sum(det.values()):,} · 그중 일꾼 꼬리표에 없던 것 {sum(new.values()):,}\n",
         "| 표준명 | 출처 | 판 단서 | 전(일꾼) | 검출 | 새로 붙음 | 후(합) |", "|---|---|---|---|---|---|---|"]
    for n in sorted(names, key=lambda n: -after[n]):
        L.append(f"| {n} | {'보충(감수)' if src[n] == 'sup' else 'GO_TERMS'} | {'필요' if gate[n] else '—'} | {before[n]} | {det[n]} | {new[n]} | {after[n]} |")
    return L


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=("v1", "f1", "spot"))
    ap.add_argument("--k", type=int, default=4)
    ap.add_argument("--seed", type=int, default=2026110850)
    a = ap.parse_args()
    if a.cmd == "spot":
        rows = [json.loads(x) for x in open(os.path.join(D, "v1_all_t1.jsonl"), encoding="utf-8")]
        rnd = random.Random(a.seed)
        import re
        pats = {n: re.compile(p) for n, _, p, _, _, _ in RULES}
        L = [f"# 문장 용어 검출 정밀도 판독 표본 (레포 밖 — 방송 원문 포함) · 용어별 무작위 {a.k} · 시드 {a.seed}\n"]
        for n, *_ in RULES:
            hit = [r for r in rows if any(t[0] == n for t in r["det"])]
            L.append(f"## {n} ({len(hit)})")
            for r in rnd.sample(hit, min(a.k, len(hit))):
                t = r["text"]
                m = pats[n].search(t)
                lo = max(0, m.start() - 45) if m else 0
                L.append(f"- [{r['id'][:4]}·{r['i']}] …{t[lo:lo + 110]}…")
            L.append("")
        out = os.path.join(D, "v1_det_spot.md")
        open(out, "w", encoding="utf-8").write("\n".join(L) + "\n")
        print(out)
        return
    if a.cmd == "v1":
        rows = tag([json.loads(x) for x in open(os.path.join(D, "v1_all.jsonl"), encoding="utf-8")])
        write(rows, os.path.join(D, "v1_all_t1.jsonl"))
    else:
        rows = tag(load_f1())
        write(rows, os.path.join(D, "f1_all.jsonl"))
    L = report(rows, a.cmd)
    sec = os.path.join(D, f"{a.cmd}_t1_report.md")
    open(sec, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("\n".join(L[:3]))
    print(sec)


if __name__ == "__main__":
    main()
