"""종국 10판 사석 점검 — 사용: check_final.py <truth.jsonl> [staged|basic]"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402

mode = sys.argv[2] if len(sys.argv) > 2 else "staged"
for l in open(sys.argv[1], encoding="utf-8"):
    r = json.loads(l)
    if not r.get("final"):
        continue
    t = time.time()
    e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], use_life="staged" if mode == "staged" else True)
    dt = time.time() - t
    bd = {y * 19 + x for x, y in r["dead"]}
    cd, cu = set(e["dead"]), set(e["undecided"])
    stg = {}
    if e.get("stages"):
        for p, (s, g) in e["stages"].items():
            if p in bd:
                stg[g] = stg.get(g, 0) + 1
    print(r["game"][-4:], f"{dt * 1000:.0f}ms", "b18", len(bd), "맞음", len(bd & cd), "미정", len(bd & cu), "놓침", len(bd - cd - cu),
          "헛짚음", len(cd - bd), f"집 차 {e['lead']:+.1f} vs {r['kata']}", "· b18 사석의 단계", stg)
