#!/usr/bin/env python3
"""장면 사실 카드 v0 — 유니 캐스터 합성 대사의 입력. 사실만(엔진·코드), 판단 문장 없음.

  python3 scene_cards.py [--n 120]

유형 4 (ORDER_20261107 막내4 §1-3 '묘수·실수·난전' + 응징):
  실수  — 큰 실수(400v 손해 ≥3집, 승률 손해 ≥12%p, 직전 승률 30~90%) · 정해도 10장면(DIAGRAMS_v0) 우선 + 추가 표본
  묘수  — 엔진 1순위와 같은 수인데 정책망 첫 느낌(prior) ≤ 8%이고 2순위와 집 차 ≥ 3 (찾기 어려운 외길)
  응징  — 상대 큰 실수(손해 ≥ 5집) 바로 다음 수를 엔진 1순위로 받음
  난전  — 12수 창 안에서 승률이 50%를 3번 이상 가로지르고 출렁임 합 ≥ 1.2
입력(레포 밖): ~/.monkos/go-board/analysis/mistakes_v0/{moves_full,queries_full,queries_full.meta}.jsonl ·
              commentary_v0/scenes.json(정해도 10장면)
출력(레포 밖 — 수순 원문 포함): ~/.monkos/uni-caster/scene_cards_v0.jsonl
대국은 G번호만. 아이디·닉네임·기보 파일명은 싣지 않는다. 대화에서는 흑·백으로만 부른다(대국자 정보 없음).
"""
import argparse
import json
import os
import random
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "AI_Factory", "go_kibo"))
import go_terms as GT  # noqa: E402

A = os.path.expanduser(os.environ.get("GO_ANALYSIS_DIR", "~/.monkos/go-board/analysis"))
V0 = os.path.join(A, "mistakes_v0")
OUT = os.path.expanduser("~/.monkos/uni-caster/scene_cards_v0.jsonl")
KO = {"B": "흑", "W": "백"}
PLAN = {"실수": 50, "묘수": 25, "응징": 25, "난전": 20}   # 실수 50 = 정해도 10 + 추가 40
ERAS = ["2004-08", "2009-14", "2015-20", "2021-26"]
GOLD = {  # 감수 예문 COMMENTARY_GOLD_v0 — 작가님 감수 개념(이 장면만)
    ("G836", 37): {"concepts": ["끼워 이음", "귀와 변의 바꿔치기", "변쪽 밀어올림", "실리에 민감한 수", "두터워지다", "대세를 잃는 손해수"],
                  "pv_term": {"5": "껴붙임 — 백 모양을 누르는 맥점, 일반인에게 떠오르는 일감은 아님(고급 행마)"}},
}
NUM_KO = "영 한 두 세 네 다섯 여섯 일곱 여덟 아홉".split()


def region(p):
    x, y = p
    h = "좌" if x < 6 else ("우" if x > 12 else "")
    v = "상" if y < 6 else ("하" if y > 12 else "")
    return f"{h}{v}귀" if h and v else (f"{h}변" if h else (f"{v}변" if v else "중앙"))


def board_at(moves, n):
    """n번째 수 착수 직전 판 + 직전 4수 history(꼬리표 포함)."""
    s, hist = {}, []
    for c, m in moves[: n - 1]:
        p = GT.gxy(m)
        if p is None:
            hist.append((c, None, []))
            continue
        tags = GT.detect(s, c, p, [h for h in hist[-4:] if h[1] is not None])
        s, _ = GT.play(s, c, p)
        hist.append((c, p, tags))
    return s, [h for h in hist[-4:] if h[1] is not None]


def tags_for(moves, n, c, m):
    p = GT.gxy(m)
    if p is None:
        return []
    s, h = board_at(moves, n)
    if p in s:
        return []
    return GT.detect(s, c, p, h)


def lead_word(lead):
    """두는 쪽 기준 집 차 → 형세 사실(숫자)."""
    if abs(lead) < 1.5:
        return "비슷함"
    return f"{'앞섬' if lead > 0 else '뒤짐'} 약 {abs(lead):.0f}집"


def load():
    meta = [json.loads(x) for x in open(os.path.join(V0, "queries_full.meta.jsonl"), encoding="utf-8")]
    gidx = {m["id"]: f"G{i + 1:02d}" for i, m in enumerate(meta)}
    moves = {}
    for x in open(os.path.join(V0, "queries_full.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        moves[d["id"]] = d["moves"]
    by = defaultdict(dict)
    for x in open(os.path.join(V0, "moves_full.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        by[d["id"]][d["move_no"]] = d
    return gidx, moves, by


def base(gidx, moves, r, typ):
    gid, n = r["id"], r["move_no"]
    c = moves[gid][n - 1][0]
    p, b = GT.gxy(r["move"]), GT.gxy(r["best"]) if r["best"] and r["best"].lower() != "pass" else None
    return {
        "type": typ, "g": gidx[gid], "era": r["era"], "phase": r["phase"], "move_no": n,
        "color": KO[c], "move": r["move"], "best": r["best"], "is_best": r["is_best"],
        "move_region": region(p) if p else None, "best_region": region(b) if b else None,
        "move_terms": tags_for(moves[gid], n, c, r["move"]),
        "best_terms": tags_for(moves[gid], n, c, r["best"]) if b else [],
        "loss": round(r["loss"], 1), "wr_before": round(r["wr_before"] * 100), "wr_after": round(r["wr_after"] * 100),
        "lead_before": round(r["lead_before"], 1), "form_before": lead_word(r["lead_before"]),
        "_gid": gid,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=20261107)
    a = ap.parse_args()
    rnd = random.Random(a.seed)
    gidx, moves, by = load()
    cards, used = [], set()

    # 1) 정해도 10장면
    for sc in json.load(open(os.path.join(A, "commentary_v0", "scenes.json"), encoding="utf-8")):
        gid = next(k for k, v in gidx.items() if v == sc["g"])
        r = by[gid][sc["move_no"]]
        c = base(gidx, moves, r, "실수")
        c.update(pv_correct=sc["pv_correct"], pv_fail=sc["pv_fail"], decisive=sc["decisive"], diagram=sc["sid"])
        g = GOLD.get((sc["g"], sc["move_no"]))
        if g:
            c["gold"] = g
        cards.append(c)
        used.add(gid)

    rows = [r for g in by.values() for r in g.values()]
    rnd.shuffle(rows)

    def take(pool, k, typ, extra=None):
        per = defaultdict(int)
        cap = {"포석": k // 3 + 1, "중반": k // 3 + 1, "끝내기": k // 3 + 1}
        got = 0
        for r in pool:
            if got >= k:
                break
            if r["id"] in used or per[r["phase"]] >= cap[r["phase"]]:
                continue
            if r["move"].lower() == "pass":
                continue
            c = base(gidx, moves, r, typ)
            if extra:
                c.update(extra(r))
            cards.append(c)
            used.add(r["id"])
            per[r["phase"]] += 1
            got += 1

    # 2) 실수 추가 40
    mis = [r for r in rows if r["who"] == "me" and r.get("stage2") and r["loss"] >= 3 and r["wr_loss"] >= 0.12
           and 0.30 <= r["wr_before"] <= 0.90 and not r["is_best"]]
    take(mis, PLAN["실수"] - 10, "실수")

    # 3) 묘수 — 찾기 어려운 외길
    hid = [r for r in rows if r["is_best"] and r.get("prior_best") is not None and r["prior_best"] <= 0.08
           and r.get("gap_lead_abs", 0) >= 3 and 0.2 <= r["wr_before"] <= 0.85 and r["move_no"] > 20]
    take(hid, PLAN["묘수"], "묘수", lambda r: {"prior_pct": round(r["prior_best"] * 100), "gap_second": round(r["gap_lead_abs"], 1)})

    # 4) 응징 — 상대 큰 실수 다음 수를 1순위로
    pun = []
    for r in rows:
        if r["loss"] >= 5 and not r["is_best"] and 0.3 <= r["wr_before"] <= 0.85:
            nx = by[r["id"]].get(r["move_no"] + 1)
            if nx and nx["is_best"] and nx["move"].lower() != "pass":
                pun.append((nx, r))
    pm = {id(nx): pr for nx, pr in pun}

    def pun_extra(r):
        pr = pm[id(r)]
        c = moves[r["id"]][pr["move_no"] - 1][0]
        p = GT.gxy(pr["move"])
        return {"prev_move": pr["move"], "prev_color": KO[c], "prev_region": region(p) if p else None,
                "prev_terms": tags_for(moves[r["id"]], pr["move_no"], c, pr["move"]),
                "prev_loss": round(pr["loss"], 1), "prev_best": pr["best"],
                "prev_wr_before": round(pr["wr_before"] * 100), "prev_wr_after": round(pr["wr_after"] * 100)}
    take([nx for nx, _ in pun], PLAN["응징"], "응징", pun_extra)

    # 5) 난전 — 12수 창
    mess = []
    for gid, g in by.items():
        if gid in used:
            continue
        ns = sorted(g)
        # 흑 기준 승률 열
        col = {n: (g[n]["wr_before"] if moves[gid][n - 1][0] == "B" else 1 - g[n]["wr_before"]) for n in ns}
        for i in range(0, len(ns) - 12, 6):
            w = [col[n] for n in ns[i:i + 12]]
            cross = sum(1 for x, y in zip(w, w[1:]) if (x - 0.5) * (y - 0.5) < 0)
            swing = sum(abs(y - x) for x, y in zip(w, w[1:]))
            if cross >= 3 and swing >= 1.2:
                mess.append((gid, ns[i], ns[i + 11], cross, swing, w))
                break
    rnd.shuffle(mess)
    per = defaultdict(int)
    for gid, s0, s1, cross, swing, w in mess:
        if sum(1 for c in cards if c["type"] == "난전") >= PLAN["난전"]:
            break
        r = by[gid][s1]
        if per[r["phase"]] >= PLAN["난전"] // 3 + 1:
            continue
        c = base(gidx, moves, r, "난전")
        c.update(window=[s0, s1], cross_50=cross, swing_sum=round(swing, 2),
                 wr_black_series=[round(x * 100) for x in w])
        cards.append(c)
        used.add(gid)
        per[r["phase"]] += 1

    # 시그니처 허용(시트 §1-1): 앞='멋진 수' — 묘수·응징 + 정해도에 맥점 감수 있는 실수 / 뒤='뭐가 뭔지' — 난전
    for i, c in enumerate(cards):
        c["scene_id"] = f"u{i + 1:03d}"
        c["signature_ok"] = ("멋진 수" if c["type"] in ("묘수", "응징") or c.get("gold", {}).get("pv_term")
                             else ("뭐가 뭔지" if c["type"] == "난전" else None))
        c.pop("_gid", None)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        for c in cards:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    cnt = defaultdict(int)
    for c in cards:
        cnt[(c["type"], c["phase"])] += 1
    print(len(cards), dict(cnt))


if __name__ == "__main__":
    main()
