"""정성 개념 발동기 — 정량 신호(lexicon.yaml 머리말 정의) → 발동 개념 + 근거 수치.

  analyze_concepts(d, gm, lex) → {"cheer", "signals", "concepts": [{cid, id, name, layer, mode, evidence, text}]}

d: review.py 정밀 분석 결과 (before·after + pass_own = 그 자리에서 손을 뺐을 때의 소유권, before.policy)
임계값은 전부 lexicon.yaml threshold — 코드에 숫자를 박지 않는다(보정은 YAML만 고친다).
"""
import os
import sys

import yaml

from board import N, gtp_to_xy, neighbors, region
from facts import board_at
from shapes import shapes

HERE = os.path.dirname(os.path.abspath(__file__))
OPP = {"B": "W", "W": "B"}
# 사분면(외길×발견 난도) 정의 정본 — 실수 사전과 공유(사본 금지): AI_Factory/go_kibo/quadrant.py
sys.path.insert(0, os.path.join(HERE, "..", "..", "AI_Factory", "go_kibo"))
from quadrant import QUAD_EASY, necessity_gap, quad_of  # noqa: E402


def load_lexicon(path=os.path.join(HERE, "lexicon.yaml")):
    return yaml.safe_load(open(path, encoding="utf-8"))


def cheb(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]))


def edge_line(p):
    """1선 = 1. 가장자리에서의 줄 수."""
    return min(p[0], p[1], N - 1 - p[0], N - 1 - p[1]) + 1


def at(arr, p):
    return arr[p[1] * N + p[0]]


def groups_near(board, color, p, r):
    out, seen = [], set()
    for q, c in board.s.items():
        if c == color and cheb(q, p) <= r and q not in seen:
            g, libs = board.group(q)
            seen |= g
            out.append((g, libs))
    return out


def mean_own(g, own, sign):
    return sum(sign * at(own, q) for q in g) / len(g)


def cut_points(board, color, p, r):
    n = 0
    for y in range(N):
        for x in range(N):
            e = (x, y)
            if e in board.s or cheb(e, p) > r:
                continue
            gs = {frozenset(board.group(q)[0]) for q in neighbors(e) if board.s.get(q) == color}
            if len(gs) >= 2:
                n += 1
    return n


def signals(d, gm, T=None):
    pos, before, after = d["pos"], d["before"], d["after"]
    i, color = pos["move_index"], pos["color"]
    sign, opp = (1 if color == "B" else -1), OPP[color]
    p = gtp_to_xy(pos["move"])
    b0 = board_at(gm, i)
    b1 = b0.copy()
    b1.play(color, p)
    own_a, own_p = after["ownership"], d["pass_own"]
    best = before["moveInfos"][0]
    loss = round(sign * (best["scoreLead"] - after["rootInfo"]["scoreLead"]), 2)
    gap2 = round(sign * (best["scoreLead"] - before["moveInfos"][1]["scoreLead"]), 2) if len(before["moveInfos"]) > 1 else 0
    pol = before.get("policy")
    prior = round(at(pol, p), 4) if pol else None
    rank = (sorted(range(N * N), key=lambda k: -pol[k]).index(p[1] * N + p[0]) + 1) if pol else None
    bxy = gtp_to_xy(best["move"])
    prior_best = round(at(pol, bxy), 4) if (pol and bxy) else None
    is_best = best["move"] == pos["move"]
    gap_nec = necessity_gap(gap2)
    quad = quad_of(gap_nec, prior_best, is_best)

    vs = [sign * (own_a[k] - own_p[k]) for k in range(N * N)]  # 그 수가 판에 한 일
    local = terr = infl = 0.0
    by_reg = {}
    for y in range(N):
        for x in range(N):
            q, v = (x, y), vs[y * N + x]
            by_reg[region(q)] = by_reg.get(region(q), 0) + v
            dist = cheb(q, p)
            if dist <= 4:
                local += v
            if q in b1.s:
                continue
            if dist <= 4 and edge_line(q) <= 3 and sign * own_a[y * N + x] >= 0.7:
                terr += v
            if dist <= 5 and edge_line(q) >= 4 and 0.2 <= sign * own_a[y * N + x] <= 0.75:
                infl += v

    own_g = groups_near(b1, color, p, 3)
    opp_g = groups_near(b1, opp, p, 3)
    opp_g0 = groups_near(b0, opp, p, 3)  # 착수 전 — 급소(상대 활로 감소) 판정용

    # 대세점 근사: 착점이 주인 없는 경계이고 반경 r 안에 양쪽 영향권 점이 함께 있는가.
    # 기준 소유권 = '여기서 손을 뺐다면(패스)'의 소유권 — 착수 전 루트 소유권은 최선수(=착점)를 둔다고 가정한 예측이라
    # 착점이 이미 내 땅으로 보인다(11-05 실측 대세점 0건 원인).
    tb = (T or {}).get("big_point", {})
    own_b0 = own_p
    band_r, band_side = tb.get("r", 4), tb.get("side", 0.3)
    near_mine = near_theirs = 0
    for yy in range(N):
        for xx in range(N):
            q = (xx, yy)
            if cheb(q, p) > band_r or q in b0.s:
                continue
            v = sign * own_b0[yy * N + xx]
            near_mine += v >= band_side
            near_theirs += v <= -band_side
    my_g, my_libs = b1.group(p)

    def gstat(gs, s):
        if not gs:
            return {"n": 0}
        stones = sum(len(g) for g, _ in gs)
        return {"n": len(gs), "stones": stones, "min_libs": min(len(l) for _, l in gs),
                "own": round(sum(mean_own(g, own_a, s) * len(g) for g, _ in gs) / stones, 3),
                "vs_pass": round(sum(sum(s * (at(own_a, q) - at(own_p, q)) for q in g) for g, _ in gs) / stones, 3)}

    # 자기 약한/위험 그룹 (착수 전 판, 착수 전 소유권 = before 루트)
    own_b = before["ownership"]
    weak, danger = [], []
    for c, g, libs in b0.groups():
        if c != color:
            continue
        m = mean_own(g, own_b, sign)
        dmin = min(cheb(q, p) for q in g)
        dbest = min(cheb(q, gtp_to_xy(best["move"])) for q in g)
        rec = {"size": len(g), "own": round(m, 3), "dist": dmin, "dist_best": dbest, "where": region(next(iter(g)))}
        if -0.3 <= m <= 0.4 and len(g) >= 3:
            weak.append(rec)
        if m <= -0.3 and len(g) >= 2:
            danger.append(rec)
    strong_opp = []
    for c, g, libs in b1.groups():
        if c == opp and len(g) >= 4 and min(cheb(q, p) for q in g) <= 3:
            strong_opp.append(round(mean_own(g, own_a, -sign), 3))
    # 착점 그룹이 붙은 자기 약한 그룹(착수 전) 의 강화량
    lift = None
    for q in neighbors(p):
        if b0.s.get(q) == color:
            g, _ = b0.group(q)
            m0 = mean_own(g, own_b, sign)
            if len(g) >= 3 and -0.2 <= m0 <= 0.5:
                lift = round(sum(sign * (at(own_a, r) - at(own_p, r)) for r in g) / len(g), 3)

    reply = after["moveInfos"][0]["move"]
    rp = gtp_to_xy(reply)
    prev = gtp_to_xy(gm["moves"][i - 1][1]) if i > 0 else None
    shp = shapes(b0, color, p, prev)
    friends = sum(1 for q, c in b0.s.items() if c == color and cheb(q, p) <= 4)
    contact = any(b0.s.get(q) == opp for q in neighbors(p))
    wr = before["rootInfo"]["winrate"] if color == "B" else 1 - before["rootInfo"]["winrate"]
    return {
        "loss": loss, "gap2": gap2, "prior": prior, "rank": rank, "is_best": is_best,
        "prior_best": prior_best, "gap_nec": gap_nec, "quad": quad,
        "opp_min_libs": [min((len(lb) for _, lb in opp_g0), default=None), min((len(lb) for _, lb in opp_g), default=None)],
        "own_at_p": round(sign * at(own_b0, p), 3), "band": [near_mine, near_theirs], "line": edge_line(p),
        "best": best["move"], "wr_before": round(wr, 3),
        "local_gain": round(local, 2), "territory_gain": round(terr, 2), "influence_gain": round(infl, 2),
        "region_vs_pass": {k: round(v, 2) for k, v in by_reg.items()},
        "own_near": gstat(own_g, sign), "opp_near": gstat(opp_g, -sign),
        "my_group": {"size": len(my_g), "libs": len(my_libs), "own": round(mean_own(my_g, own_a, sign), 3)},
        "cuts_own": [cut_points(b0, color, p, 4), cut_points(b1, color, p, 4)],
        "cuts_opp": [cut_points(b0, opp, p, 4), cut_points(b1, opp, p, 4)],
        "sente": rp is not None and cheb(rp, p) <= 3, "reply": reply,
        "reply_dist": cheb(rp, p) if rp else None,
        "prev_dist": cheb(prev, p) if prev else None,
        "shapes": shp, "friends": friends, "contact": contact,
        "sphere": round(sign * at(own_p, p), 3),
        "weak": weak, "danger": danger, "strong_opp": strong_opp, "lift": lift,
        "best_dist": cheb(gtp_to_xy(best["move"]), p),
        "where": region(p),
    }


def analyze_concepts(d, gm, lex, f3_best=None):
    """f3_best: facts F3 data(최선 대비 영역 손익) — 소탐대실 판정용."""
    T = {e["id"]: e.get("threshold", {}) for k in ("keypoints", "proverbs", "qualities") for e in lex[k]}
    s = signals(d, gm, T)
    names = {e["id"]: (e["name"], k) for k in ("shapes", "keypoints", "proverbs", "qualities") for e in lex[k]}
    plain = {e["id"]: e.get("plain", e.get("definition", "")) for k in ("keypoints", "proverbs", "qualities", "shapes") for e in lex[k]}
    phrase = {e["id"]: e["phrase"] for e in lex["shapes"] if e.get("phrase")}  # 해설 문장용 '호구 자리'·'쌍립 자리' 
    hits = []

    def hit(cid, mode, ev, why):
        name, layer = names[cid]
        hits.append({"id": cid, "name": name, "layer": layer, "mode": mode, "evidence": ev,
                     "text": f"{name}{'(' + ('준수' if mode == 'follow' else '위반') + ')' if mode else ''} — {why}. 쉬운 풀이: {plain[cid]}"})

    L, on, onear = s["loss"], s["own_near"], s["opp_near"]
    shape_ids = {x["id"] for x in s["shapes"]}
    shape_names = [x["name"] for x in s["shapes"]]

    # (가) 모양
    shape_t = {e["id"]: e.get("threshold", {}) for e in lex["shapes"]}
    for x in s["shapes"]:
        name, _ = names[x["id"]]
        ok = shape_t.get(x["id"], {}).get("ok")
        if ok is not None and L > ok:  # 칭찬 조건 미달(쌍립 등) — 모양 이름만 표기, 해설 근거로 쓰지 않음(쌍아 판정 11-05 22:18)
            hits.append({"id": x["id"], "name": name, "layer": "shapes", "mode": None, "name_only": True,
                         "evidence": {"detail": x["detail"], "loss": L, "칭찬 조건": f"손해 ≤ {ok}"}, "text": f"모양: {name}"})
            continue
        hits.append({"id": x["id"], "name": name, "layer": "shapes", "mode": None, "evidence": {"detail": x["detail"]},
                     "text": f"모양: {name}" + (f" ({x['detail']})" if x["detail"] else "")
                     + (f". 해설에서는 '{phrase[x['id']]}'라고 부른다" if x["id"] in phrase else "") + f". 뜻: {plain[x['id']]}"})

    # (나) 급소·맥
    # 급소(v1, 작가님 21:47 "상대의 모양이나 사활을 추궁하는 자리"): 엔진 최선 · 외길 성향 · 당연한 수(쉬움) 제외 · 상대 돌뭉치 약화
    t = T["vital"]
    swing_opp = -(onear.get("vs_pass") or 0)
    swing_own = on.get("vs_pass") or 0
    l0, l1 = s["opp_min_libs"]
    libs_cut = l0 is not None and l1 is not None and l1 < l0 and l1 <= t["libs"]
    not_easy = s["prior_best"] is not None and s["prior_best"] < QUAD_EASY
    if s["is_best"] and s["gap2"] >= t["gap2"] and not_easy and (swing_opp >= t["swing"] or libs_cut):
        hit("vital", None, {"gap2": s["gap2"], "1순위 직감": s["prior_best"], "상대 약화": round(swing_opp, 2), "상대 최소 활로": [l0, l1]},
            "엔진 최선이고 다른 수보다 확실히 낫다, 일감으로 바로 보이는 수는 아니다, "
            + (f"주변 상대 돌의 활로가 {l0}에서 {l1}로 줄었다" if libs_cut else "주변 상대 돌이 눈에 띄게 약해졌다"))
    t = T["tesuji"]
    if s["is_best"] and s["prior"] is not None and s["prior"] <= t["prior"] and s["gap2"] >= t["gap2"] and s["contact"]:
        hit("tesuji", None, {"prior": s["prior"], "gap2": s["gap2"]},
            "엔진 최선인데 일감으로는 잘 안 보이는 수")

    # 대세점(v1 근사, 작가님 21:47 "당장 집은 아닌데 세력이 마주보는 자리") — 형세봇 3층 v0가 나오면 성분으로 교체
    t = T["big_point"]
    if (abs(s["own_at_p"]) <= t["band"] and s["band"][0] >= t["n"] and s["band"][1] >= t["n"] and s["line"] >= 3
            and s["territory_gain"] <= t["terr"] and s["local_gain"] >= t["value"] and L <= t["ok"]):
        hit("big_point", None, {"착점 소유권": s["own_at_p"], "주변 자기·상대 영향권 점": s["band"], "확정집 변화": s["territory_gain"],
                                "주변 효과": s["local_gain"]},
            f"착점은 아직 주인이 없고 주변에 양쪽 세력이 맞닿아 있다, 확정집 변화는 작지만 주변 효과가 {s['local_gain']:.1f}집이다")

    # (다) 위기십결
    t = T["no_greed"]
    if s["wr_before"] >= t["lead_wr"] and L >= t["loss"] and s["contact"]:
        hit("no_greed", "break", {"착수 전 승률": s["wr_before"], "loss": L}, f"앞선 상태에서 붙여 싸우다 {L}집 손해")
    t = T["enter_gently"]
    if s["sphere"] <= -t["sphere"]:
        if not s["contact"] and L <= t["ok"]:
            hit("enter_gently", "follow", {"착점 소유권(패스 기준)": s["sphere"], "loss": L}, "상대 영향권에 붙지 않고 들어갔다")
        elif s["contact"] and L >= t["bad"]:
            hit("enter_gently", "break", {"착점 소유권(패스 기준)": s["sphere"], "loss": L}, f"상대 영향권에서 바로 붙어 {L}집 손해")
    t = T["defend_first"]
    weak = [w for w in s["weak"] if t["weak_lo"] <= w["own"] <= t["weak_hi"] and w["size"] >= t["size"]]
    if weak:
        near = [w for w in weak if w["dist"] <= 2]
        if near and L <= t["ok"]:
            hit("defend_first", "follow", {"약한 그룹": near[0]}, f"{near[0]['where']} 약한 자기 돌({near[0]['size']}점)을 먼저 챙겼다")
        elif not near and s["contact"] and L >= t["bad"] and any(w["dist_best"] <= 2 for w in weak):
            w = next(w for w in weak if w["dist_best"] <= 2)
            hit("defend_first", "break", {"약한 그룹": w, "loss": L}, f"{w['where']} 약한 돌({w['size']}점)을 두고 공격했고 최선수는 그 돌 옆이었다")
    t = T["sente_first"]
    if s["sente"] and L <= t["ok"]:
        hit("sente_first", "follow", {"상대 최선 응수": s["reply"], "거리": s["reply_dist"]}, f"상대가 {s['reply']}로 받아야 한다(선수)")
    elif s["reply_dist"] is not None and s["reply_dist"] >= t["far"] and t["slack_lo"] <= L < t["slack_hi"]:
        hit("sente_first", "break", {"상대 최선 응수": s["reply"], "거리": s["reply_dist"], "loss": L}, f"상대가 받지 않고 {s['reply']}로 손을 뺄 수 있다(후수)")
    t = T["small_for_big"]
    rv = s["region_vs_pass"]
    gives = [(r, -v) for r, v in rv.items() if v <= -t["give"]]
    takes = [(r, v) for r, v in rv.items() if v > 0]
    if gives and takes and L <= t["ok"]:
        g, k = max(gives, key=lambda x: x[1]), max(takes, key=lambda x: x[1])
        if k[1] >= g[1] * t["ratio"]:
            hit("small_for_big", "follow", {"내준 곳": g, "얻은 곳": k}, f"{g[0]}에서 {g[1]:.1f}집을 내주고 {k[0]}에서 {k[1]:.1f}집을 얻었다")
    if f3_best and f3_best.get("gained") and f3_best.get("lost"):
        gr, gv = f3_best["gained"][0]
        lr, lv = f3_best["lost"][0]
        if lv >= gv * t["ratio"]:
            hit("small_for_big", "break", {"얻은 곳": [gr, gv], "잃은 곳": [lr, lv]}, f"{gr}에서 {gv}집을 얻었지만 {lr}에서 {lv}집을 잃었다(소탐대실)")
    t = T["sacrifice_danger"]
    for w in s["danger"]:
        if w["dist"] >= t["far"] and L <= t["ok"]:
            hit("sacrifice_danger", "follow", {"위험 그룹": w}, f"{w['where']} 위험한 돌({w['size']}점)에 매달리지 않고 다른 곳에 두었다")
            break
        if w["dist"] <= 1 and L >= t["bad"]:
            hit("sacrifice_danger", "break", {"위험 그룹": w, "loss": L}, f"{w['where']} 위험한 돌({w['size']}점)을 살리러 가다 {L}집 손해")
            break
    t = T["not_hasty"]
    if L >= t["bad"] and s["prev_dist"] is not None and s["prev_dist"] <= t["near"] and s["best_dist"] >= t["far"]:
        hit("not_hasty", "break", {"직전 수와 거리": s["prev_dist"], "최선수와 거리": s["best_dist"], "loss": L},
            f"상대 수 바로 옆에 응수했지만 최선은 {s['best_dist']}칸 떨어진 {s['best']}")
    t = T["coordinate"]
    if s["friends"] >= t["friends"] and L <= t["ok"] and s["local_gain"] >= t["gain"]:
        hit("coordinate", "follow", {"반경 4 자기 돌": s["friends"], "local_gain": s["local_gain"]}, f"주변 자기 돌 {s['friends']}개와 함께 주변 {s['local_gain']:.1f}집 효과")
    elif s["friends"] == 0 and L >= t["bad"]:
        hit("coordinate", "break", {"반경 4 자기 돌": 0, "loss": L}, "주변에 자기 돌이 없는 외딴 수")
    t = T["careful_strong"]
    strong = [v for v in s["strong_opp"] if v >= t["strong"]]
    if strong:
        if L >= t["bad"]:
            hit("careful_strong", "break", {"상대 강한 그룹 소유권": max(strong), "loss": L}, f"상대 강한 그룹 근처에서 {L}집 손해")
        elif L <= t["ok"]:
            hit("careful_strong", "follow", {"상대 강한 그룹 소유권": max(strong), "loss": L}, "상대 강한 그룹 근처에서 손해 없이 처리")
    t = T["seek_peace"]
    if s["lift"] is not None and s["lift"] >= t["lift"] and L <= t["ok"]:
        hit("seek_peace", "follow", {"약한 그룹 강화": s["lift"]}, f"붙어 있던 약한 자기 돌의 소유권이 평균 {s['lift']:+.2f} 좋아졌다")

    # 정성어
    t = T["thick"]
    if on.get("n") and on["min_libs"] >= t["libs"] and on["own"] >= t["own"] and s["cuts_own"][1] <= s["cuts_own"][0] and s["influence_gain"] >= t["infl"]:
        hit("thick", None, {"최소 활로": on["min_libs"], "주변 자기 돌 소유권": on["own"], "세력 증분": s["influence_gain"]},
            f"주변 자기 돌 활로 {on['min_libs']} 이상·끊음점 늘지 않음·영향권 {s['influence_gain']:.1f}집 증가")
    t = T["thin"]
    if s["cuts_own"][1] >= t["cuts"] or (on.get("stones", 0) >= 3 and on["own"] <= t["own"]):
        hit("thin", None, {"끊음점": s["cuts_own"][1], "주변 자기 돌 소유권": on.get("own")},
            f"주변 끊음점 {s['cuts_own'][1]}곳" + (f", 주변 자기 돌 소유권 평균 {on['own']:.2f}" if on.get("n") else ""))
    t = T["sharp"]
    if swing_opp >= t["swing"] or (shape_ids & {"cut", "atari", "hane"} and L <= t["ok"]):
        hit("sharp", None, {"상대 약화": round(swing_opp, 2), "모양": shape_names},
            f"주변 상대 돌 소유권이 평균 {swing_opp:.2f} 나빠졌다" if swing_opp >= t["swing"] else f"{'·'.join(shape_names)}로 상대를 압박")
    t = T["good_shape_move"]
    shape_moves = shape_ids & {"one_space", "knight", "large_knight", "diagonal", "tiger"}
    if shape_moves and L <= t["ok"] and swing_own >= t["lift"]:
        hit("good_shape_move", None, {"모양": shape_names, "자기 돌 강화": round(swing_own, 2)}, f"{'·'.join(shape_names)}로 주변 자기 돌이 평균 {swing_own:+.2f} 강해졌다")
    t = T["heavy"]
    mg = s["my_group"]
    if mg["size"] >= t["size"] and mg["libs"] <= t["libs"] and mg["own"] <= t["own"] and L >= t["loss"]:
        hit("heavy", None, {"그룹 크기": mg["size"], "활로": mg["libs"], "소유권": mg["own"]}, f"{mg['size']}점이 활로 {mg['libs']}로 뭉쳤다")
    t = T["light"]
    if shape_ids & {"one_space", "two_space", "knight", "large_knight", "diagonal"} and L <= t["ok"] and t["lo"] <= mg["own"] <= t["hi"]:
        hit("light", None, {"모양": shape_names, "착점 소유권": mg["own"]}, f"{'·'.join(shape_names)}로 붙지 않고 가볍게")
    t = T["territory"]
    if s["territory_gain"] >= t["gain"]:
        hit("territory", None, {"실리 증분": s["territory_gain"]}, f"주변 변·귀 집이 {s['territory_gain']:.1f}집 굳었다")
    t = T["influence"]
    if s["influence_gain"] >= t["gain"]:
        hit("influence", None, {"세력 증분": s["influence_gain"]}, f"주변 영향권이 {s['influence_gain']:.1f}집 늘었다")
    t = T["slack"]
    if t["lo"] <= L < t["hi"] and not s["sente"] and s["local_gain"] <= t["gain"]:
        hit("slack", None, {"loss": L, "local_gain": s["local_gain"]}, f"{L}집 손해·후수·주변 효과 {s['local_gain']:.1f}집")
    t = T["overplay"]
    if L >= t["loss"] and swing_own <= -t["drop"]:
        hit("overplay", None, {"loss": L, "자기 돌 약화": round(swing_own, 2)}, f"{L}집 손해, 주변 자기 돌 소유권 평균 {swing_own:+.2f}")
    if s["prev_dist"] is not None:
        if s["prev_dist"] >= T["good_tenuki"]["far"] and L <= T["good_tenuki"]["ok"]:
            hit("good_tenuki", None, {"직전 수와 거리": s["prev_dist"], "loss": L}, f"상대 직전 수에서 {s['prev_dist']}칸 떨어진 곳으로 손을 뺐고 손해 없음")
        elif s["prev_dist"] >= T["bad_tenuki"]["far"] and L >= T["bad_tenuki"]["bad"]:
            hit("bad_tenuki", None, {"직전 수와 거리": s["prev_dist"], "loss": L}, f"상대 직전 수에서 {s['prev_dist']}칸 떨어진 곳으로 손을 빼 {L}집 손해")
    t = T["cut_effect"]
    if "cut" in shape_ids and swing_opp >= t["swing"]:
        hit("cut_effect", None, {"상대 약화": round(swing_opp, 2)}, f"끊은 뒤 주변 상대 돌 소유권이 평균 {swing_opp:.2f} 나빠졌다")
    if s["sente"] and L <= T["sente_move"]["ok"]:
        hit("sente_move", None, {"상대 최선 응수": s["reply"]}, f"상대 최선 응수 {s['reply']}가 착점 근처")

    # 추임새(v1): 와우 = 사분면 묘수·AI식 감각수를 엔진 1순위로 둔 수만. 당연한 수(외길·쉬움)는 '외길'(칭찬 없이 1줄)
    c = lex["cheers"]["threshold"]
    if L <= c["wow_loss"] and s["is_best"] and s["quad"] in ("brilliant", "ai_sense"):
        cheer = "와우"
    elif s["quad"] == "obvious" and L <= c["good_loss"]:
        cheer = "외길"
    elif L <= c["good_loss"]:
        cheer = "좋네요"
    elif L <= c["ok_loss"]:
        cheer = "무난"
    elif L < c["regret_loss"]:
        cheer = "살짝 아쉬움"
    elif L < c["big_loss"]:
        cheer = "아쉬워요"
    else:
        cheer = "큰 실수"
    # 해설 반영 우선순위: 급소·맥 > 위기십결 > 모양(1개) > 정성어 — 상위 MAX_USE개만 교사에게 (전부는 근거표에 남김)
    rank = {"keypoints": 0, "proverbs": 1, "shapes": 2, "qualities": 3}
    used, shape_taken = 0, False
    for h in sorted(hits, key=lambda h: rank[h["layer"]]):
        if h.get("name_only"):
            h["use"] = False
            continue
        if h["layer"] == "shapes":
            if shape_taken:
                h["use"] = False
                continue
            shape_taken = True
        h["use"] = used < MAX_USE
        used += h["use"]
    for k, h in enumerate(hits, 1):
        h["cid"] = f"X{k}"  # C1~C19는 바둑판 좌표와 겹친다
    return {"cheer": cheer, "signals": s, "concepts": hits}


MAX_USE = 5
