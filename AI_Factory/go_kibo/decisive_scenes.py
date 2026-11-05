#!/usr/bin/env python3
"""결정 장면 정밀 분석 — 판마다 1~2국면만 소유권·정책망 포함 재분석해 해설 사전 판정(사석·떡수 등)을 붙인다.

결정 장면(판당 ≤2): ① 진 쪽의 승률 손해 최대 수(MISTAKES §8-3과 같은 기준) ② 작가님 자신의 승률 손해 최대 수(①과 다르면).
엔진: 4060 낮 창(학교 시간) — mistakes_runner.py --stage1-only --no-b10-wait --queries scenes_queries.jsonl (쌍아 판정 11-05 23:44,
      iMac은 8765 대국 엔진과 GPU 공유라 쓰지 않음).

  python3 decisive_scenes.py queries [--name full]      # moves_{name}.jsonl → mistakes_v0/scenes_{name}_queries.jsonl
  python3 decisive_scenes.py assemble --dir OUT1 [--name full] [--report]
      # 4060 out1/ → scenes_{name}.jsonl (+ reports/DECISIVE_SCENES_v0.md, G번호·수순만)
질의 id = "{대국id}__{수순}__deep|pass|save_{좌표}" — 러너는 id마다 out1/{id}.jsonl을 쓴다.
"""
import argparse
import datetime as dt
import json
import os
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
PILOT = os.path.join(HERE, "..", "..", "apps", "go-commentary-pilot")
sys.path.insert(0, HERE)
sys.path.insert(0, PILOT)
from kibo_common import ANALYSIS_DIR  # noqa: E402

OUT = os.path.join(ANALYSIS_DIR, "mistakes_v0")
DEEP_V, SIDE_V = 400, 200


def load(name):
    meta = {m["id"]: m for m in (json.loads(x) for x in open(os.path.join(OUT, f"queries_{name}.meta.jsonl"), encoding="utf-8"))}
    q = {}
    for x in open(os.path.join(OUT, f"queries_{name}.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        q[d["id"]] = d
    rows = [json.loads(x) for x in open(os.path.join(OUT, f"moves_{name}.jsonl"), encoding="utf-8")]
    return meta, q, rows


def scenes_of(meta, rows):
    games = defaultdict(list)
    for x in rows:
        games[x["id"]].append(x)
    out = []
    for gid, rs in games.items():
        res = meta[gid]["result"]
        picks = []
        loser = [x for x in rs if x["who"] == ("me" if res == "L" else "opp")]
        if loser:
            picks.append(("결정", max(loser, key=lambda x: x["wr_loss"])))
        mine = [x for x in rs if x["who"] == "me"]
        if mine:
            m = max(mine, key=lambda x: x["wr_loss"])
            if not picks or m["move_no"] != picks[0][1]["move_no"]:
                picks.append(("작가님 최대 손해", m))
        out += [(kind, x) for kind, x in picks]
    return out


def gm_of(qd):
    return {"id": qd["id"], "moves": qd["moves"], "komi": qd["komi"], "rules": qd.get("rules", "korean"), "meta": {}, "initial": []}


def cmd_queries(a):
    from concepts import atari_saves, gtp_of, load_lexicon
    from facts import board_at
    from board import gtp_to_xy
    small = next(e["threshold"]["small"] for e in load_lexicon()["qualities"] if e["id"] == "sacrifice")
    meta, q, rows = load(a.name)
    sc = scenes_of(meta, rows)
    path = os.path.join(OUT, f"scenes_{a.name}_queries.jsonl")
    n_q = 0
    with open(path, "w", encoding="utf-8") as f:
        for kind, x in sc:
            qd = q[x["id"]]
            i = x["move_no"] - 1
            mv = qd["moves"]
            base = {"rules": qd.get("rules", "korean"), "komi": qd["komi"], "boardXSize": 19, "boardYSize": 19}
            key = f"{x['id']}__{x['move_no']}"
            f.write(json.dumps(dict(base, id=key + "__deep", moves=mv[:i + 1], analyzeTurns=[i, i + 1], maxVisits=DEEP_V,
                                    includeOwnership=True, includePolicy=True)) + "\n")
            f.write(json.dumps(dict(base, id=key + "__pass", moves=mv[:i] + [[mv[i][0], "pass"]], analyzeTurns=[i + 1],
                                    maxVisits=SIDE_V, includeOwnership=True)) + "\n")
            n_q += 2
            prev = gtp_to_xy(mv[i - 1][1]) if i > 0 else None
            pts, _ = atari_saves(board_at(gm_of(qd), i), mv[i][0], prev, small)
            for pt in sorted(pts)[:2]:
                s = gtp_of(pt)
                f.write(json.dumps(dict(base, id=f"{key}__save_{s}", moves=mv[:i] + [[mv[i][0], s]], analyzeTurns=[i + 1],
                                        maxVisits=SIDE_V)) + "\n")
                n_q += 1
    est = sum(DEEP_V * 2 + SIDE_V for _ in sc)
    print(f"{path}: 장면 {len(sc)} · 질의 {n_q} · visits 약 {est:,} (4060 b18 약 1,000 v/s 기준 약 {est / 1000 / 60:.0f}분)")


def cmd_assemble(a):
    from concepts import analyze_concepts, load_lexicon
    meta, q, rows = load(a.name)
    sc = scenes_of(meta, rows)
    lex = load_lexicon()
    resp = defaultdict(dict)
    for fn in os.listdir(a.dir):
        if not fn.endswith(".jsonl") or fn.endswith(".error.jsonl"):
            continue
        for line in open(os.path.join(a.dir, fn), encoding="utf-8"):
            d = json.loads(line)
            resp[d["id"]][d["turnNumber"]] = d
    gidx = {gid: f"G{k + 1:04d}" for k, gid in enumerate(meta)}
    out, miss = [], 0
    for kind, x in sc:
        key = f"{x['id']}__{x['move_no']}"
        i = x["move_no"] - 1
        dp, ps = resp.get(key + "__deep", {}), resp.get(key + "__pass", {})
        if i not in dp or i + 1 not in dp or i + 1 not in ps:
            miss += 1
            continue
        qd = q[x["id"]]
        save_eval = {k.split("__save_")[1]: v[i + 1]["rootInfo"]["scoreLead"] for k, v in resp.items()
                     if k.startswith(key + "__save_") and i + 1 in v}
        d = {"pos": {"move_index": i, "move_number": i + 1, "color": qd["moves"][i][0], "move": qd["moves"][i][1]},
             "before": dp[i], "after": dp[i + 1], "pass_own": ps[i + 1]["ownership"], "save_eval": save_eval}
        r = analyze_concepts(d, gm_of(qd), lex)
        s = r["signals"]
        out.append({"g": gidx[x["id"]], "id": x["id"], "kind": kind, "who": x["who"], "result_me": meta[x["id"]]["result"],
                    "era": x["era"], "rank": x.get("rank_label"), "move_no": x["move_no"], "move": x["move"], "phase": s["phase"],
                    "loss": s["loss"], "quad": s["quad"], "cheer": r["cheer"],
                    "concepts": [h["name"] for h in r["concepts"] if not h.get("name_only")]})
    with open(os.path.join(OUT, f"scenes_{a.name}.jsonl"), "w", encoding="utf-8") as f:
        for o in out:
            f.write(json.dumps(o, ensure_ascii=False) + "\n")
    print(f"장면 {len(sc)} · 조립 {len(out)} · 응답 누락 {miss}")
    if a.report:
        report(out, len(sc), miss)


def report(out, n_sc, miss):
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    L = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/decisive_scenes.py\n---\n",
         "# 결정 장면 정밀 분석 v0 — 사석·떡수·사분면 (MISTAKES §8 보강)\n",
         f"> 생성 {now} KST · 장면 {n_sc} · 조립 {len(out)} · 응답 누락 {miss} · 엔진 4060 b18 deep 400v + 패스 소유권 + 살리는 수 평가. 대국은 G번호·수순만.\n"]
    for title, filt in (("작가님이 진 판의 결정 장면(작가님 수)", lambda o: o["kind"] == "결정" and o["result_me"] == "L"),
                        ("작가님이 이긴 판의 결정 장면(상대 수)", lambda o: o["kind"] == "결정" and o["result_me"] == "W"),
                        ("작가님 최대 손해 수(결정 장면과 다를 때)", lambda o: o["kind"] != "결정")):
        g = [o for o in out if filt(o)]
        if not g:
            continue
        c = Counter(n for o in g for n in o["concepts"])
        L.append(f"## {title} — {len(g)}장면\n")
        L.append("| 개념 | 장면 | 비율 | 대표(G번호·수순) |\n|---|---|---|---|")
        for k, v in c.most_common(12):
            ex = [f"{o['g']}({o['move_no']}수)" for o in g if k in o["concepts"]][:3]
            L.append(f"| {k} | {v} | {v / len(g) * 100:.0f}% | {', '.join(ex)} |")
        sac = sum("사석 활용" in o["concepts"] for o in g)
        dumb = sum("떡수 이음" in o["concepts"] for o in g)
        L.append(f"\n- 사석 활용 {sac} · 떡수 이음 {dumb} · 사분면 {dict(Counter(o['quad'] for o in g))}\n")
    open(os.path.join(HERE, "reports", "DECISIVE_SCENES_v0.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    print("wrote reports/DECISIVE_SCENES_v0.md")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s1 = sub.add_parser("queries")
    s1.add_argument("--name", default="full")
    s2 = sub.add_parser("assemble")
    s2.add_argument("--dir", required=True)
    s2.add_argument("--name", default="full")
    s2.add_argument("--report", action="store_true")
    a = ap.parse_args()
    cmd_queries(a) if a.cmd == "queries" else cmd_assemble(a)
