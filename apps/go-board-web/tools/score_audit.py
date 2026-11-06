"""계가 검산기(11-06 작가님 17:05 "직접 세어봤는데 틀려. 계가 시스템은 전면 재검토") — server.py 와 독립된 코드로 다시 센다.

방(rooms/*.json)·정답 기록(scoring/answers.jsonl)은 읽기만 한다. 판정 엔진(b18) 프로세스는 이 스크립트가 띄우고 끝나면 내린다.
세는 방법 3가지(한국 규칙 = 집 + 포로(따낸 돌 + 사석), 백은 덤 더함):
  R  기록값            — 방 finalCount(black·white·result)
  C  검산(기록 재현)   — 실제 수순 + 마무리 수순(answers.finish) 재생 → 기록 사석 제거 → 한쪽 색에만 닿은 빈 칸 = 집
  O  소유권 계가        — 실제 최종 국면(마무리 없이)에 b18 소유권: 돌의 소유권이 반대 색 ≥ OWN_DEAD 면 사석,
                          빈 칸은 소유권 ≥ OWN_TERR 쪽 집, 나머지 공배. 사람이 판을 보고 세는 방식에 가장 가깝다
  K  b18 final_score   — 실제 최종 국면
사용: python3 -I tools/score_audit.py <rooms 폴더> <answers.jsonl> <방 id …> [--visits N] [--json 출력]
"""
import json
import os
import re
import subprocess
import sys

SIZE = 19
COLS = "ABCDEFGHJKLMNOPQRST"
OWN_DEAD, OWN_TERR = 0.6, 0.6
KATA = os.path.expanduser("~/.monkos/katago")


def xy(mv):
    return COLS.index(mv[0].upper()), SIZE - int(mv[1:])


def gtp(x, y):
    return f"{COLS[x]}{SIZE - y}"


def play_all(moves, setup):
    """독립 재생 — (판, 따낸 돌 {B: 흑이 딴 수, W: 백이 딴 수})"""
    g = [[None] * SIZE for _ in range(SIZE)]
    caps = {"B": 0, "W": 0}
    for s in setup:
        x, y = xy(s)
        g[y][x] = "B"

    def group(x0, y0):
        c, seen, st, libs = g[y0][x0], {(x0, y0)}, [(x0, y0)], 0
        lib = set()
        while st:
            x, y = st.pop()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < SIZE and 0 <= ny < SIZE:
                    v = g[ny][nx]
                    if v is None:
                        lib.add((nx, ny))
                    elif v == c and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        st.append((nx, ny))
        return seen, lib

    for c, mv in moves:
        if mv.lower() == "pass":
            continue
        x, y = xy(mv)
        g[y][x] = c
        o = "W" if c == "B" else "B"
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < SIZE and 0 <= ny < SIZE and g[ny][nx] == o:
                grp, lib = group(nx, ny)
                if not lib:
                    for px, py in grp:
                        g[py][px] = None
                    caps[c] += len(grp)
        grp, lib = group(x, y)
        if not lib:  # 자충(규칙상 없음 — 기록 이상 표시)
            raise ValueError(f"자충 수 {c} {mv}")
    return g, caps


def count_board(g, caps, dead, komi):
    """사석 제거 후 한국식 집계 — 한쪽 색에만 닿은 빈 영역 = 집"""
    g = [row[:] for row in g]
    pris = dict(caps)
    for x, y in dead:
        c = g[y][x]
        if c:
            pris["W" if c == "B" else "B"] += 1
            g[y][x] = None
    terr = {"B": 0, "W": 0}
    seen = set()
    dame = 0
    for y0 in range(SIZE):
        for x0 in range(SIZE):
            if g[y0][x0] or (x0, y0) in seen:
                continue
            reg, bord, st = 0, set(), [(x0, y0)]
            seen.add((x0, y0))
            while st:
                x, y = st.pop()
                reg += 1
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < SIZE and 0 <= ny < SIZE:
                        v = g[ny][nx]
                        if v:
                            bord.add(v)
                        elif (nx, ny) not in seen:
                            seen.add((nx, ny))
                            st.append((nx, ny))
            if len(bord) == 1:
                terr[bord.pop()] += reg
            else:
                dame += reg
    b, w = terr["B"] + pris["B"], terr["W"] + pris["W"] + komi
    return {"terrB": terr["B"], "terrW": terr["W"], "prisB": pris["B"], "prisW": pris["W"], "black": b, "white": w,
            "result": res(b - w), "dame": dame}


def res(d):
    return "0" if d == 0 else (f"B+{d:g}" if d > 0 else f"W+{-d:g}")


def count_own(g, caps, own, komi):
    """소유권 계가 — 돌은 반대 소유 ≥ OWN_DEAD 면 사석, 빈 칸은 소유 ≥ OWN_TERR 쪽 집(흑 +)"""
    pris = dict(caps)
    terr = {"B": 0, "W": 0}
    dead = []
    for y in range(SIZE):
        for x in range(SIZE):
            o, c = own[y * SIZE + x], g[y][x]
            if c == "B" and o <= -OWN_DEAD:
                dead.append((x, y)); pris["W"] += 1; terr["W"] += 1
            elif c == "W" and o >= OWN_DEAD:
                dead.append((x, y)); pris["B"] += 1; terr["B"] += 1
            elif c is None and o >= OWN_TERR:
                terr["B"] += 1
            elif c is None and o <= -OWN_TERR:
                terr["W"] += 1
    b, w = terr["B"] + pris["B"], terr["W"] + pris["W"] + komi
    return {"terrB": terr["B"], "terrW": terr["W"], "prisB": pris["B"], "prisW": pris["W"], "black": b, "white": w,
            "result": res(b - w), "dead": sorted(dead)}


class B18:
    def __init__(self, visits):
        ovr = f"rules=korean,reportAnalysisWinratesAs=BLACK,logDir={os.path.expanduser('~/.claude/jobs/66441cd2/tmp/go/klog')},maxVisits={visits},maxTime=30"
        self.p = subprocess.Popen([f"{KATA}/katago-ocl", "gtp", "-config", f"{KATA}/gtp_play.cfg", "-model",
                                   f"{KATA}/kata1-b18c384nbt-s9996604416-d4316597426.bin.gz", "-override-config", ovr],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

    def cmd(self, c):
        self.p.stdin.write(c + "\n"); self.p.stdin.flush()
        out = []
        while True:
            ln = self.p.stdout.readline()
            if ln.strip() == "":
                if out:
                    return " ".join(out).lstrip("= ").strip()
                continue
            out.append(ln.strip())

    def pos(self, moves, setup, komi):
        self.cmd("clear_board"); self.cmd(f"komi {komi}")
        if setup:
            self.cmd("set_free_handicap " + " ".join(setup))
        for c, m in moves:
            self.cmd(f"play {c} {m}")

    def own(self, color):
        self.p.stdin.write(f"kata-search_analyze {color} ownership true\n"); self.p.stdin.flush()
        info = ""
        while True:
            ln = self.p.stdout.readline().strip()
            if "ownership" in ln and "info move" in ln:
                info = ln
            if re.match(r"^(?:=\s*)?play \S+", ln):
                while self.p.stdout.readline().strip() != "":
                    pass
                break
        m = re.search(r"ownership ((?:-?[\d.e-]+ ?){361})", info)
        own = [float(v) for v in m.group(1).split()]
        sl = re.search(r"scoreLead (\S+)", info)
        return own, float(sl.group(1)) if sl else None

    def kill(self):
        self.p.kill()


def main():
    rooms_dir, ans_file, ids = sys.argv[1], sys.argv[2], [a for a in sys.argv[3:] if not a.startswith("--")]
    visits = int(sys.argv[sys.argv.index("--visits") + 1]) if "--visits" in sys.argv else 1000
    out_json = sys.argv[sys.argv.index("--json") + 1] if "--json" in sys.argv else None
    ids = [i for i in ids if not i.isdigit() and not i.endswith(".json")]
    ans = {}
    for ln in open(ans_file, encoding="utf-8"):
        if ln.strip():
            r = json.loads(ln)
            ans[r["room"]] = r
    eng = B18(visits)
    rows = []
    try:
        for rid in ids:
            d = json.load(open(os.path.join(rooms_dir, f"{rid}.json"), encoding="utf-8"))
            moves = [tuple(m) for m in d["moves"]]
            setup = d.get("setup") or []
            komi = 0.5 if d.get("handicap") else 6.5
            fc = d.get("finalCount") or {}
            a = ans.get(rid)
            row = {"room": rid, "handicap": d.get("handicap"), "moveN": len(moves), "komiRoom": d.get("komiValue"), "komi": komi,
                   "R": {k: fc.get(k) for k in ("terrB", "terrW", "prisB", "prisW", "black", "white", "result", "kata")} | {"result": d.get("result")}}
            g, caps = play_all(moves, setup)
            row["capsActual"] = caps
            if a:
                fin = [tuple(m) for m in a.get("finish") or []]
                g2, caps2 = play_all(moves + fin, setup)
                row["C"] = count_board(g2, caps2, [tuple(p) for p in a.get("dead") or []], komi)
                row["finish"] = [list(m) for m in fin]
                row["deadRec"] = [list(p) for p in a.get("dead") or []]
                row["kataRec"] = a.get("kata")
                row["komiRec"] = a.get("komi")
            eng.pos(moves, setup, komi)
            row["K"] = eng.cmd("final_score")
            to = "W" if moves and moves[-1][0] == "B" else "B"
            own, lead = eng.own(to)
            row["leadK"] = lead
            row["O"] = count_own(g, caps, own, komi)
            if a:  # 기록 사석 vs 소유권 사석(실제 판 기준) vs 마무리 뒤 판에서 사라진 돌
                rec = {tuple(p) for p in a.get("dead") or []}
                od = {tuple(p) for p in row["O"]["dead"]}
                fin_gone = {(x, y) for y in range(SIZE) for x in range(SIZE) if g[y][x] and g2[y][x] != g[y][x]}
                row["deadDiff"] = {"recOnly": sorted(rec - od - fin_gone), "ownOnly": sorted(od - rec - fin_gone),
                                   "finishCaptured": sorted(fin_gone), "finishCapturedNotOwnDead": sorted(fin_gone - od)}
            rows.append(row)
            print(json.dumps({k: row[k] for k in ("room", "handicap", "moveN", "R", "K", "leadK") if k in row}, ensure_ascii=False))
            if "C" in row:
                print("   C", row["C"]["black"], row["C"]["white"], row["C"]["result"], "· O", row["O"]["black"], row["O"]["white"], row["O"]["result"],
                      "· 마무리", len(row["finish"]), "수 · 사석 기록", len(row["deadRec"]), "소유권", len(row["O"]["dead"]),
                      "· 차이", {k: len(v) for k, v in row["deadDiff"].items()}, flush=True)
    finally:
        eng.kill()
    if out_json:
        json.dump(rows, open(out_json, "w", encoding="utf-8"), ensure_ascii=False)


if __name__ == "__main__":
    main()
