"""b18 정답지 — 국면별 판정 엔진(b18) 집 차·소유권·(종국판) 사석. 방·실수 사전은 읽기만, 엔진 프로세스는 이 스크립트가 띄우고 내린다(iMac GPU, 4060 미사용).
출력: JSONL 1줄 = 1국면 {set, game, n, handicap, komi, lead, own(361, 흑 +), dead?}. 이어 쓰기(이미 있는 (game,n) 건너뜀).
사용: python3 -I make_truth.py <출력.jsonl> [--visits 400]
"""
import glob
import json
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "apps", "go-board-web", "tools"))
from score_audit import B18, xy  # noqa: E402  (같은 레포 — 판정 엔진 GTP 래퍼)

H = os.path.expanduser("~/.monkos/go-board")
OUT = sys.argv[1]
VISITS = int(sys.argv[sys.argv.index("--visits") + 1]) if "--visits" in sys.argv else 400
FINAL10 = ["20261105-172228-baad", "20261105-173818-0630", "20261106-090841-7c7f", "20261106-114109-6cbb", "20261106-123014-4a02",
           "20261106-125611-ca40", "20261106-131252-a63d", "20261106-154412-44a4", "20261106-160323-00f3", "20261106-165125-d32d"]


def jobs():
    # ① 작가님 접바둑 실판(대 AI, 100수↑) — 20수마다(d32d 는 5수)
    for f in sorted(glob.glob(f"{H}/rooms/2026*.json")):
        try:
            d = json.load(open(f, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if not isinstance(d, dict) or not d.get("handicap") or d.get("bots") or len(d.get("moves") or []) < 100:
            continue
        step = 5 if d["id"].endswith("d32d") else 20
        for n in range(step, len(d["moves"]) + 1, step):
            yield "handi", d["id"], n, d["moves"][:n], d.get("setup") or [], 0.5, d["handicap"]
    # ② 호선(실수 사전 표본 25국) — 20수마다(소유권 정답용)
    q = [json.loads(l) for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8")]
    random.Random(20261106).shuffle(q)
    for g in q[:25]:
        for n in range(20, len(g["moves"]) + 1, 20):
            yield "even", g["id"], n, g["moves"][:n], [], 6.5, 0


def main():
    done = set()
    if os.path.exists(OUT):
        for l in open(OUT, encoding="utf-8"):
            r = json.loads(l)
            done.add((r["game"], r["n"], r.get("final", False)))
    e = B18(VISITS)
    out = open(OUT, "a", encoding="utf-8")
    try:
        # 종국 10판 사석(final_status_list dead, 실제 최종 국면)
        for rid in FINAL10:
            if (rid, -1, True) in done:
                continue
            d = json.load(open(f"{H}/rooms/{rid}.json", encoding="utf-8"))
            komi = 0.5 if d.get("handicap") else 6.5
            e.pos([tuple(m) for m in d["moves"]], d.get("setup") or [], komi)
            dead = [xy(m) for m in e.cmd("final_status_list dead").split()]
            out.write(json.dumps({"set": "final", "game": rid, "n": -1, "final": True, "moves": d["moves"], "setup": d.get("setup") or [],
                                  "komi": komi, "handicap": d.get("handicap") or 0, "dead": dead, "kata": e.cmd("final_score")}) + "\n")
            out.flush()
        k = 0
        for kind, gid, n, mv, setup, komi, hc in jobs():
            if (gid, n, False) in done:
                continue
            e.pos([tuple(m) for m in mv], setup, komi)
            to = "W" if mv and mv[-1][0] == "B" else ("W" if setup and not mv else "B")
            own, lead = e.own(to)
            out.write(json.dumps({"set": kind, "game": gid, "n": n, "handicap": hc, "komi": komi, "setup": setup, "moves": mv,
                                  "lead": lead, "own": [round(x, 3) for x in own]}) + "\n")
            k += 1
            if k % 50 == 0:
                out.flush()
                print(f"{k} 국면", flush=True)
    finally:
        out.close()
        e.kill()


if __name__ == "__main__":
    main()
