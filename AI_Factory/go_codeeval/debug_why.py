"""미정 사유 — 종국판별 4돌 이상 무리. 사용: debug_why.py <truth.jsonl> <방 끝 4자 …>"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402
ce.DEBUG = True

fin = {json.loads(l)["game"][-4:]: json.loads(l) for l in open(sys.argv[1], encoding="utf-8") if json.loads(l).get("final")}
for g in sys.argv[2:]:
    r = fin[g]
    b, _ = ce.replay([tuple(m) for m in r["moves"]], r["setup"])
    ce.WHY.clear()
    ce.life(b)
    print(g, [w for w in ce.WHY if w[1] >= 4])
