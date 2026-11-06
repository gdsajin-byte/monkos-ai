"""세력 변형 고르기(사활 없음) — 호선 대표본(실수 사전 64탐색 집 차)에서 집 차 오차. 사용: python3 -I tune_influence.py [게임 수]"""
import json
import os
import random
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402

H = os.path.expanduser("~/.monkos/go-board")
n_g = int(sys.argv[1]) if len(sys.argv) > 1 else 60
q = {}
for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8"):
    g = json.loads(l)
    q[g["id"]] = g["moves"]
ids = sorted(q)
random.Random(11).shuffle(ids)
want = set(ids[:n_g])
pos = []
for l in open(f"{H}/analysis/mistakes_v0/moves_full.jsonl", encoding="utf-8"):
    d = json.loads(l)
    if d["id"] in want and (d["move_no"] - 1) % 10 == 0 and d["move_no"] > 1 and d.get("lead_before") is not None:
        pos.append((q[d["id"]][:d["move_no"] - 1], d["lead_before"] if d["move_no"] % 2 == 1 else -d["lead_before"], d["move_no"] - 1))
print("국면", len(pos))


def run(name, f):
    e = {s: [] for s in ("~100", "101~200", "201~")}
    for mv, lead, n in pos:
        s = "~100" if n <= 100 else "101~200" if n <= 200 else "201~"
        e[s].append(abs(f(mv) - lead))
    print(f"{name:28}", " · ".join(f"{s} {statistics.mean(v):5.1f}/{statistics.median(v):5.1f}" for s, v in e.items()))


for dil, ero in ((5, 21), (5, 10), (4, 6), (5, 5), (3, 3), (5, 0)):
    run(f"Bouzy {dil}/{ero}", lambda mv, d=dil, r=ero: ce.evaluate([tuple(m) for m in mv], (), 6.5, d, r, use_life=False)["lead"])
