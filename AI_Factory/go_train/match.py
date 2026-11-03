"""우리 망 vs 상대(사람 급수 흉내 망 / KataGo 공개 망 수읽기 제한) 대국 측정.

두 KataGo GTP 프로세스를 직접 붙여 둔다(흑백 교대). 승패는 기권·두 번 패스·수 상한 후
심판 엔진(final_score)으로 정한다. 결과는 JSONL 1국 1행으로 남긴다.

사용 예:
  python match.py --ours C:/Users/smuse73/go_train/export/x.bin.gz --ours-visits 1 \
      --opp human:rank_5k --games 40 --out C:/Users/smuse73/go_train/eval/x.jsonl
  --opp b18:8   (공개 망 b18, maxVisits 8)

실패 가시화: 엔진 비정상 종료·GTP 오류는 해당 국을 error로 기록하고 끝에 건수를 출력, 0국 성공이면 exit 1.
"""
import argparse, json, math, os, subprocess, sys, threading, time
from concurrent.futures import ThreadPoolExecutor

ROOT = os.environ.get("GO_TRAIN_ROOT", r"C:\Users\smuse73\go_train")
ENGINE = os.path.join(ROOT, "engine", "katago.exe")
CFG = os.path.join(ROOT, "engine", "default_gtp.cfg")
HUMAN_CFG = os.path.join(ROOT, "engine", "gtp_human5k_example.cfg")
B18 = os.path.join(ROOT, "nets", "b18.bin.gz")
HUMAN = os.path.join(ROOT, "nets", "humanv0.bin.gz")
MAX_MOVES = 400


class Gtp:
    def __init__(self, args, label):
        self.label = label
        self.p = subprocess.Popen([ENGINE, "gtp"] + args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True, cwd=os.path.dirname(ENGINE))

    def cmd(self, c):
        self.p.stdin.write(c + "\n")
        self.p.stdin.flush()
        out = []
        while True:
            line = self.p.stdout.readline()
            if line == "":
                raise RuntimeError(f"{self.label}: 엔진 종료 ({c})")
            line = line.rstrip("\r\n")
            if line == "" and out:
                break
            if line:
                out.append(line)
        head = out[0]
        if head.startswith("?"):
            raise RuntimeError(f"{self.label}: GTP 오류 {head} ({c})")
        return " ".join([head[1:].strip()] + out[1:]).strip()

    def close(self):
        try:
            self.cmd("quit")
        except Exception:
            pass
        self.p.kill()


def overrides(d):
    return ["-override-config", ",".join(f"{k}={v}" for k, v in d.items())]


def ours_args(model, visits):
    o = {"maxVisits": visits, "numSearchThreads": 1 if visits <= 8 else 4, "ponderingEnabled": "false",
         "logToStderr": "false", "logDir": "", "logFile": os.path.join(ROOT, "eval", "gtp_ours.log"),
         "maxTime": 60, "allowResignation": "true"}
    return ["-model", model, "-config", CFG] + overrides(o)


def opp_args(spec):
    kind, val = spec.split(":", 1)
    common = {"ponderingEnabled": "false", "logToStderr": "false", "logDir": "",
              "logFile": os.path.join(ROOT, "eval", "gtp_opp.log"), "maxTime": 60}
    if kind == "human":
        # 사람 급수 흉내: 사람 망이 고른 수를 그대로 둔다(예제 cfg 기본 = 표본 추출).
        common.update({"humanSLProfile": val})
        return ["-model", B18, "-human-model", HUMAN, "-config", HUMAN_CFG] + overrides(common)
    if kind == "b18":
        common.update({"maxVisits": int(val), "numSearchThreads": 1 if int(val) <= 8 else 4,
                       "allowResignation": "true"})
        return ["-model", B18, "-config", CFG] + overrides(common)
    raise ValueError(spec)


def play_one(ours_is_black, a_ours, a_opp, a_ref):
    ours = Gtp(a_ours, "ours")
    opp = Gtp(a_opp, "opp")
    try:
        for e in (ours, opp):
            e.cmd("boardsize 19")
            e.cmd("komi 7.5")
            e.cmd("clear_board")
        players = {"b": ours if ours_is_black else opp, "w": opp if ours_is_black else ours}
        moves, passes, color, winner, how = [], 0, "b", None, "score"
        while len(moves) < MAX_MOVES:
            mv = players[color].cmd(f"genmove {color}").lower()
            other = "w" if color == "b" else "b"
            if mv == "resign":
                winner, how = other, "resign"
                break
            players[other].cmd(f"play {color} {mv}")
            moves.append(f"{color} {mv}")
            passes = passes + 1 if mv == "pass" else 0
            if passes >= 2:
                break
            color = other
        if winner is None:
            ref = Gtp(a_ref, "ref")
            try:
                ref.cmd("boardsize 19"); ref.cmd("komi 7.5"); ref.cmd("clear_board")
                for m in moves:
                    ref.cmd(f"play {m}")
                res = ref.cmd("final_score")  # 예: B+3.5 / W+12.5 / 0
            finally:
                ref.close()
            winner = res[0].lower() if res and res[0] in "BW" else None
            how = f"score {res}" + (" (수 상한)" if len(moves) >= MAX_MOVES else "")
        ours_color = "b" if ours_is_black else "w"
        return {"ours_black": ours_is_black, "moves": len(moves), "result": how,
                "ours_win": None if winner is None else (winner == ours_color)}
    finally:
        ours.close()
        opp.close()


def elo_from_rate(p):
    p = min(max(p, 1e-3), 1 - 1e-3)
    return -400 * math.log10(1 / p - 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ours", required=True)
    ap.add_argument("--ours-visits", type=int, default=1)
    ap.add_argument("--opp", required=True)
    ap.add_argument("--games", type=int, default=40)
    ap.add_argument("--parallel", type=int, default=4)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    a_ours, a_opp = ours_args(a.ours, a.ours_visits), opp_args(a.opp)
    a_ref = ["-model", B18, "-config", CFG] + overrides({"maxVisits": 1, "logToStderr": "false", "logDir": "",
                                                       "logFile": os.path.join(ROOT, "eval", "gtp_ref.log")})
    lock = threading.Lock()
    t0 = time.time()

    def job(i):
        try:
            r = play_one(i % 2 == 0, a_ours, a_opp, a_ref)
        except Exception as ex:  # 실패 가시화
            r = {"ours_black": i % 2 == 0, "error": str(ex)}
        r.update({"game": i, "ours": os.path.basename(a.ours), "ours_visits": a.ours_visits, "opp": a.opp,
                  "t": time.strftime("%Y-%m-%d %H:%M:%S")})
        with lock, open(a.out, "a", encoding="utf-8") as f:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
        return r

    with ThreadPoolExecutor(a.parallel) as ex:
        rs = list(ex.map(job, range(a.games)))
    ok = [r for r in rs if r.get("ours_win") is not None]
    err = [r for r in rs if "error" in r]
    w = sum(r["ours_win"] for r in ok)
    rate = w / len(ok) if ok else float("nan")
    print(json.dumps({"ours": os.path.basename(a.ours), "ours_visits": a.ours_visits, "opp": a.opp,
                      "games": len(ok), "wins": w, "win_rate": round(rate, 3),
                      "elo_diff": round(elo_from_rate(rate)) if ok else None,
                      "errors": len(err), "secs": round(time.time() - t0)}, ensure_ascii=False))
    if err:
        print(f"⚠️ match: 오류 {len(err)}국 — 첫 오류: {err[0]['error']}", file=sys.stderr)
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
