"""KataGo analysis 엔진 구동 — 1차(전 수, 저방문) 스캔 → 실수 국면 선정 → 2차(정밀) 분석.

  python3 analyze.py scan            # data/scan/{id}.json
  python3 analyze.py select 20       # data/selected.json
  python3 analyze.py deep            # data/deep/{pos_id}.json

엔진: ~/.monkos/katago/katago-ocl (OpenCL 빌드, 레포 밖). 값은 전부 흑 관점.
"""
import json
import os
import subprocess
import sys
import time

from board import ogs_to_gtp

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
KG = os.path.expanduser("~/.monkos/katago")
ENGINE = [os.path.join(KG, "katago-ocl"), "analysis",
          "-model", os.path.join(KG, "kata1-b18c384nbt-s9996604416-d4316597426.bin.gz"),
          "-config", os.path.join(KG, "configs", "analysis_example.cfg"),
          "-override-config",
          "numAnalysisThreads=2,numSearchThreadsPerAnalysisThread=8,reportAnalysisWinratesAs=BLACK"]

RULES = {"japanese": "japanese", "korean": "korean", "chinese": "chinese", "aga": "aga"}
SCAN_VISITS = 100
DEEP_VISITS = 400
MIN_LOSS = 2.0


class Engine:
    def __init__(self):
        self.p = subprocess.Popen(ENGINE, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, text=True, bufsize=1)
        while True:
            line = self.p.stderr.readline()
            if not line:
                raise RuntimeError("katago 기동 실패")
            if "ready to begin" in line:
                break

    def ask(self, q, n_resp):
        self.p.stdin.write(json.dumps(q) + "\n")
        self.p.stdin.flush()
        out = []
        while len(out) < n_resp:
            r = json.loads(self.p.stdout.readline())
            if "error" in r:
                raise RuntimeError(r)
            if r.get("isDuringSearch"):
                continue
            out.append(r)
        return out

    def close(self):
        self.p.stdin.close()
        self.p.wait()


def load_game(gid):
    g = json.load(open(os.path.join(DATA, "games", f"{gid}.json")))
    gd = g["gamedata"]
    moves = []
    for i, m in enumerate(gd["moves"]):
        color = "B" if i % 2 == 0 else "W"
        moves.append([color, ogs_to_gtp(m[0], m[1])])
    return {"id": gid, "moves": moves, "komi": float(g["komi"]),
            "rules": RULES.get(g["rules"], "japanese"), "game": g}


def base_query(gm, qid):
    return {"id": qid, "moves": gm["moves"], "rules": gm["rules"], "komi": gm["komi"],
            "boardXSize": 19, "boardYSize": 19}


def scan(eng, gm):
    q = base_query(gm, f"scan-{gm['id']}")
    q["analyzeTurns"] = list(range(len(gm["moves"]) + 1))
    q["maxVisits"] = SCAN_VISITS
    t = time.time()
    rs = eng.ask(q, len(q["analyzeTurns"]))
    rows = sorted(({"turn": r["turnNumber"], "lead": r["rootInfo"]["scoreLead"],
                    "winrate": r["rootInfo"]["winrate"],
                    "best": r["moveInfos"][0]["move"]} for r in rs), key=lambda x: x["turn"])
    return {"id": gm["id"], "visits": SCAN_VISITS, "secs": round(time.time() - t, 1), "turns": rows}


def losses(sc, gm):
    """수 i(0기준)의 손실 = 둔 쪽 관점 scoreLead 하락."""
    t = sc["turns"]
    out = []
    for i, (color, mv) in enumerate(gm["moves"]):
        sign = 1 if color == "B" else -1
        loss = sign * (t[i]["lead"] - t[i + 1]["lead"])
        wr = t[i]["winrate"] if color == "B" else 1 - t[i]["winrate"]
        out.append({"game": gm["id"], "move_index": i, "move_number": i + 1, "color": color,
                    "move": mv, "best": t[i]["best"], "loss_scan": round(loss, 2),
                    "mover_winrate_before": round(wr, 3)})
    return out


def select(n, games):
    """게임별 균등 배분, 승부가 이미 기운 국면(둔 쪽 승률 <3%·>97%) 제외, 같은 게임 내 4수 간격."""
    per = [n // len(games) + (1 if k < n % len(games) else 0) for k in range(len(games))]
    chosen = {gid: [] for gid in games}
    pool = []

    def spaced(c):
        return all(abs(c["move_index"] - d["move_index"]) >= 4 for d in chosen[c["game"]])

    for k, gid in enumerate(games):
        gm = load_game(gid)
        sc = json.load(open(os.path.join(DATA, "scan", f"{gid}.json")))
        cands = [c for c in losses(sc, gm)
                 if c["loss_scan"] >= MIN_LOSS and 0.03 < c["mover_winrate_before"] < 0.97
                 and c["move"] != c["best"] and c["move"] != "pass"]
        cands.sort(key=lambda c: -c["loss_scan"])
        for c in cands:
            if len(chosen[gid]) < per[k] and spaced(c):
                chosen[gid].append(c)
            else:
                pool.append(c)
    # 할당 미달분은 남은 후보 중 손실 큰 순으로 보충 (게임 무관)
    pool.sort(key=lambda c: -c["loss_scan"])
    for c in pool:
        if sum(map(len, chosen.values())) >= n:
            break
        if c not in chosen[c["game"]] and spaced(c):
            chosen[c["game"]].append(c)
    picked = []
    for gid in games:
        picked += sorted(chosen[gid], key=lambda c: c["move_index"])
    for j, c in enumerate(picked, 1):
        c["pos_id"] = f"P{j:02d}"
    return picked


def deep(eng, gm, c):
    q = base_query(gm, c["pos_id"])
    q["analyzeTurns"] = [c["move_index"], c["move_index"] + 1]
    q["maxVisits"] = DEEP_VISITS
    q["includeOwnership"] = True
    q["includeMovesOwnership"] = True
    q["includePVVisits"] = True
    t = time.time()
    rs = sorted(eng.ask(q, 2), key=lambda r: r["turnNumber"])
    before, after = rs
    # 후보 수 소유권은 상위 3개만 보존 (용량)
    for r in rs:
        r["moveInfos"] = r["moveInfos"][:6]
        for mi in r["moveInfos"][3:]:
            mi.pop("ownership", None)
    return {"pos": c, "before": before, "after": after, "secs": round(time.time() - t, 1)}


def main():
    games = [g for g in json.load(open(os.path.join(HERE, "games.json")))]
    gids = [g["id"] for g in games]
    cmd = sys.argv[1]
    if cmd == "select":
        sel = select(int(sys.argv[2]), gids)
        json.dump(sel, open(os.path.join(DATA, "selected.json"), "w"), ensure_ascii=False, indent=1)
        for c in sel:
            print(c)
        return
    eng = Engine()
    try:
        if cmd == "scan":
            os.makedirs(os.path.join(DATA, "scan"), exist_ok=True)
            for gid in gids:
                sc = scan(eng, load_game(gid))
                json.dump(sc, open(os.path.join(DATA, "scan", f"{gid}.json"), "w"))
                print(gid, "turns", len(sc["turns"]), "secs", sc["secs"], flush=True)
        elif cmd == "deep":
            os.makedirs(os.path.join(DATA, "deep"), exist_ok=True)
            sel = json.load(open(os.path.join(DATA, "selected.json")))
            for c in sel:
                d = deep(eng, load_game(c["game"]), c)
                json.dump(d, open(os.path.join(DATA, "deep", f"{c['pos_id']}.json"), "w"))
                print(c["pos_id"], "secs", d["secs"], flush=True)
    finally:
        eng.close()


if __name__ == "__main__":
    main()
