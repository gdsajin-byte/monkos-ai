"""형세 소형망 v0 — 학습 자료 준비 (iMac CPU, 일꾼 1개 · nice 로 돌린다).

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 (작가님 11-07 20:23 승인).
입력(읽기만):
  · 정답지  ~/.monkos/go-board/analysis/ownership_v1/out1/{id}.jsonl — 행 = id·turnNumber·scoreLead·winrate·visits·own[361]
            (b18 64탐색, own = int ×100, 흑 기준 +100 = 흑 땅, 행 우선 y→x, y=0 이 19줄 — mistakes_runner.py 소유권 모드)
  · 수순    ~/.monkos/go-board/analysis/mistakes_v0/queries_full.jsonl — 같은 질의(korean·덤 6.5)
출력(레포 밖): ~/.monkos/go-board/models/own_v0/data/own_v0.npz + split.json
  board int8[N,361] (1 흑·-1 백·0 빈칸) · libs int8[N,361] (돌 칸의 활로 수, 3 이상은 3) · tomove int8[N] (1 흑 차례·-1 백)
  own int8[N,361] (−100~100) · score float32[N] (흑 기준 집 차) · winrate float32[N] · turn int16[N] · game int32[N]
분할: 판 단위 — 판 id 를 시드 0 으로 섞어 앞 200판 = 검증, 나머지 1,800판 = 학습.

사용: nice -n 15 python3 -I prep.py [--limit 판수] [--smoke 판id]
"""
import json
import os
import random
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "go_codeeval"))
import codeeval as ce  # noqa: E402  (판 재생 규칙 재사용 — idx·NB·block)

H = os.path.expanduser("~/.monkos/go-board")
OWN_DIR = f"{H}/analysis/ownership_v1/out1"
QUERIES = f"{H}/analysis/mistakes_v0/queries_full.jsonl"
OUT_DIR = f"{H}/models/own_v0/data"
N = ce.N


def play(b, col, mv):
    """판 b 에 한 수 두기(따내기 포함, 제자리 수정)."""
    if mv.lower() == "pass":
        return
    i = ce.idx(mv)
    b[i] = col
    for q in ce.NB[i]:
        if b[q] == -col:
            stones, libs = ce.block(b, q)
            if not libs:
                for s in stones:
                    b[s] = 0
    stones, libs = ce.block(b, i)
    if not libs:
        for s in stones:
            b[s] = 0


def liberties(b):
    out = [0] * N
    seen = [False] * N
    for i in range(N):
        if b[i] and not seen[i]:
            stones, libs = ce.block(b, i)
            v = min(len(libs), 3)
            for s in stones:
                out[s] = v
                seen[s] = True
    return out


def game_positions(moves):
    """turn 0..len(moves) 의 (판, 활로, 차례) 를 차례로 낸다."""
    b = [0] * N
    for t in range(len(moves) + 1):
        if t < len(moves):
            tm = 1 if moves[t][0] == "B" else -1
        else:
            tm = -1 if moves[-1][0] == "B" else 1
        yield t, b[:], liberties(b), tm
        if t < len(moves):
            c, mv = moves[t]
            play(b, 1 if c == "B" else -1, mv)


def smoke(gid, moves_by):
    """1판 스모크 — 마지막 국면 그림 + own 부호를 나란히. 흑 돌(X) 자리는 +, 백 돌(O) 자리는 − 여야 한다."""
    rows = {r["turnNumber"]: r for r in map(json.loads, open(f"{OWN_DIR}/{gid}.jsonl", encoding="utf-8"))}
    moves = moves_by[gid]
    last = None
    for t, b, lb, tm in game_positions(moves):
        last = (t, b)
    t, b = last
    own = rows[t]["own"]
    print(f"판 {gid} · {t}수 · scoreLead {rows[t]['scoreLead']:+.1f} (흑 기준)")
    print("   " + " ".join(ce.COLS) + "      " + " ".join(ce.COLS))
    agree = tot = 0
    for y in range(19):
        a = "".join("X " if b[y * 19 + x] == 1 else "O " if b[y * 19 + x] == -1 else ". " for x in range(19))
        o = "".join("+ " if own[y * 19 + x] > 30 else "- " if own[y * 19 + x] < -30 else "· " for x in range(19))
        print(f"{19 - y:2d} {a}  {19 - y:2d} {o}")
        for x in range(19):
            s = b[y * 19 + x]
            if s:
                tot += 1
                agree += (own[y * 19 + x] > 0) == (s > 0)
    # 방향 교차 점검: 상하 뒤집기·좌우 뒤집기·전치한 own 과의 일치율도 본다(정방향이 가장 높아야 한다)
    def rate(f):
        ok = n = 0
        for i in range(N):
            if b[i]:
                n += 1
                ok += (own[f(i)] > 0) == (b[i] > 0)
        return ok / n
    print(f"돌 자리 own 부호 일치: 정방향 {rate(lambda i: i):.3f} · 상하 뒤집기 {rate(lambda i: (18 - i // 19) * 19 + i % 19):.3f} · "
          f"좌우 뒤집기 {rate(lambda i: (i // 19) * 19 + 18 - i % 19):.3f} · 전치 {rate(lambda i: (i % 19) * 19 + i // 19):.3f}")


def main():
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    moves_by = {}
    for l in open(QUERIES, encoding="utf-8"):
        g = json.loads(l)
        assert g["komi"] == 6.5 and g["rules"] == "korean" and not g.get("initialStones"), g["id"]
        moves_by[g["id"]] = g["moves"]
    if "--smoke" in sys.argv:
        smoke(sys.argv[sys.argv.index("--smoke") + 1], moves_by)
        return
    ids = sorted(f[:-6] for f in os.listdir(OWN_DIR) if f.endswith(".jsonl"))
    assert set(ids) <= set(moves_by), "수순 없는 판"
    rnd = sorted(ids)
    random.Random(0).shuffle(rnd)
    val = sorted(rnd[:200])
    train = sorted(rnd[200:])
    order = val + train
    if limit:
        order = order[:limit]
    os.makedirs(OUT_DIR, exist_ok=True)
    B, L, TM, O, S, W, T, G = [], [], [], [], [], [], [], []
    missing = 0
    for gi, gid in enumerate(order):
        rows = {r["turnNumber"]: r for r in map(json.loads, open(f"{OWN_DIR}/{gid}.jsonl", encoding="utf-8"))}
        gb, gl, gt, go, gs, gw, gtt = [], [], [], [], [], [], []
        for t, b, lb, tm in game_positions(moves_by[gid]):
            r = rows.get(t)
            if r is None:
                missing += 1
                continue
            gb.append(b); gl.append(lb); gt.append(tm); go.append(r["own"])
            gs.append(r["scoreLead"]); gw.append(r["winrate"]); gtt.append(t)
        B.append(np.array(gb, np.int8)); L.append(np.array(gl, np.int8)); TM.append(np.array(gt, np.int8))
        O.append(np.array(go, np.int8)); S.append(np.array(gs, np.float32)); W.append(np.array(gw, np.float32))
        T.append(np.array(gtt, np.int16)); G.append(np.full(len(gb), gi, np.int32))
        if gi % 100 == 0:
            print(f"{gi}/{len(order)}판 · 국면 {sum(len(x) for x in B)}", flush=True)
    c = np.concatenate
    np.savez_compressed(f"{OUT_DIR}/own_v0.npz", board=c(B), libs=c(L), tomove=c(TM), own=c(O), score=c(S),
                        winrate=c(W), turn=c(T), game=c(G))
    n = int(sum(len(x) for x in B))
    json.dump({"games": order, "n_val": min(200, len(order)), "seed": 0, "positions": n, "missing_rows": missing},
              open(f"{OUT_DIR}/split.json", "w"), ensure_ascii=False)
    print(f"완료: {len(order)}판 · 국면 {n} · 정답 누락 {missing} → {OUT_DIR}")


if __name__ == "__main__":
    main()
