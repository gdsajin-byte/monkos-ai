#!/usr/bin/env python3
"""실수 사전 표본 선정 + KataGo analysis 질의 생성.

표본: 사람 상대 · 승강급 · 호선(접바둑·정선 제외) · 승/패 확정 · 작가님 착수 20수 이상.
      시대 4구간 × 승·패 = 8칸 × 250국 = 2,000국. 시드 고정.
출력 (레포 밖 $GO_ANALYSIS_DIR/mistakes_v0/):
  sample_2000.jsonl        — 표본 목록 (id·시대·결과·파일 — 상대 아이디 없음)
  queries_{name}.jsonl     — KataGo analysis 엔진 입력 (대국자 이름 없음, 수순만)

사용:
  python3 sample_mistakes.py select                 # 2,000국 목록
  python3 sample_mistakes.py queries smoke10 --n 10 # 앞에서 칸별 균등 10국 질의
  python3 sample_mistakes.py queries full           # 2,000국 전체 질의
"""
import argparse
import json
import os
import random
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kibo_common import KIBO_DIR, ANALYSIS_DIR, sgf_header_and_moves  # noqa: E402

SEED = 20261104
PER_CELL = 250
ERAS = [("2004-08", 2004, 2008), ("2009-14", 2009, 2014), ("2015-20", 2015, 2020), ("2021-26", 2021, 2026)]
OUT = os.path.join(ANALYSIS_DIR, "mistakes_v0")
COLS = "ABCDEFGHJKLMNOPQRST"  # GTP: I 없음


def era_of(y):
    for name, a, b in ERAS:
        if a <= y <= b:
            return name
    return None


def sgf_to_gtp(c):
    if not c or c == "tt":
        return "pass"
    x, y = ord(c[0]) - 97, ord(c[1]) - 97
    return f"{COLS[x]}{19 - y}"


def select(force=False):
    if os.path.exists(os.path.join(OUT, "sample_2000.jsonl")) and not force:
        raise SystemExit("❌ sample_mistakes: sample_2000.jsonl 이 이미 있다 — 표본은 고정본이다(원장이 자라면 재선정 결과가 달라짐). 재선정은 --force")
    games = [json.loads(x) for x in open(os.path.join(ANALYSIS_DIR, "games_v1.jsonl"), encoding="utf-8")]
    pool = defaultdict(list)
    drop = Counter()
    for g in games:
        if g["opp_ai"]:
            drop["AI 상대"] += 1; continue
        if g["kind"] != "승강급":
            drop["친선"] += 1; continue
        if g["setup"] != "호선" or g["handicap"]:
            drop["정선·접바둑"] += 1; continue
        if g["result"] not in ("W", "L"):
            drop["무승부·결과 없음"] += 1; continue
        if g["my_moves"] < 20:
            drop["작가님 착수 20수 미만"] += 1; continue
        pool[(era_of(g["year"]), g["result"])].append(g)
    rng = random.Random(SEED)
    sample = []
    report = {"seed": SEED, "per_cell": PER_CELL, "drop": dict(drop), "pool": {}, "picked": {}}
    for name, _, _ in ERAS:
        for res in ("W", "L"):
            cell = sorted(pool[(name, res)], key=lambda g: g["id"])
            k = min(PER_CELL, len(cell))
            pick = rng.sample(cell, k)
            pick.sort(key=lambda g: g["datetime"])
            report["pool"][f"{name}/{res}"] = len(cell)
            report["picked"][f"{name}/{res}"] = k
            for g in pick:
                sample.append({"id": g["id"], "era": name, "result": res, "datetime": g["datetime"], "my_color": g["my_color"],
                               "my_rank": g["my_rank"], "opp_rank": g["opp_rank"], "moves": g["moves"], "komi": g["komi"],
                               "result_type": g["result_type"], "time": g["time"], "file": g["file"]})
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "sample_2000.jsonl"), "w", encoding="utf-8") as f:
        for s in sample:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    report["total"] = len(sample)
    report["positions_total"] = sum(s["moves"] + 1 for s in sample)
    json.dump(report, open(os.path.join(OUT, "sample_report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(report, ensure_ascii=False, indent=1))


def queries(name, n, visits):
    sample = [json.loads(x) for x in open(os.path.join(OUT, "sample_2000.jsonl"), encoding="utf-8")]
    if n:
        # 칸(시대×결과)별로 돌아가며 n국 — 시드 고정 표본의 각 칸 앞쪽부터
        cells = defaultdict(list)
        for s in sample:
            cells[(s["era"], s["result"])].append(s)
        rng = random.Random(SEED + 1)
        keys = sorted(cells)
        picked, i = [], 0
        while len(picked) < n:
            c = cells[keys[i % len(keys)]]
            picked.append(c.pop(rng.randrange(len(c))))
            i += 1
        sample = picked
    path = os.path.join(OUT, f"queries_{name}.jsonl")
    meta = []
    with open(path, "w", encoding="utf-8") as f:
        for s in sample:
            text = open(os.path.join(KIBO_DIR, s["file"]), encoding="utf-8", errors="replace").read()
            _, _, mv = sgf_header_and_moves(text)
            moves = [[c, sgf_to_gtp(p)] for c, p in mv]
            q = {"id": s["id"], "moves": moves, "rules": "korean", "komi": s["komi"] if s["komi"] is not None else 6.5,
                 "boardXSize": 19, "boardYSize": 19, "analyzeTurns": list(range(len(moves) + 1)), "maxVisits": visits}
            f.write(json.dumps(q) + "\n")
            meta.append({"id": s["id"], "era": s["era"], "result": s["result"], "my_color": s["my_color"], "moves": len(moves)})
    with open(os.path.join(OUT, f"queries_{name}.meta.jsonl"), "w", encoding="utf-8") as f:
        for m in meta:
            f.write(json.dumps(m, ensure_ascii=False) + "\n")
    print(f"{path}: {len(sample)}국 · 국면 {sum(m['moves'] + 1 for m in meta):,} · visits {visits}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sp = sub.add_parser("select")
    sp.add_argument("--force", action="store_true")
    q = sub.add_parser("queries")
    q.add_argument("name")
    q.add_argument("--n", type=int, default=0)
    q.add_argument("--visits", type=int, default=64)
    a = ap.parse_args()
    if a.cmd == "select":
        select(a.force)
    else:
        queries(a.name, a.n, a.visits)
