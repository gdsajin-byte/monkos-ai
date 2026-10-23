"""사실 추출기 (설계 §3) — 2차 분석 결과 → 국면별 사실 JSON. 전부 결정적 계산.

  python3 facts.py          # data/deep/*.json → data/facts/{pos_id}.json

사실 ID: F1 손익 · F2 착점 · F3 손익 위치 · F4 그룹 상태 전환 · F5 응징 수순
         F6 최선수 목적 · F7 급함 vs 큼 · F8 승률 · F9 엔진 후보 순위
소유권: KataGo ownership(흑 +1 ~ 백 −1, 361칸 행 우선·상단부터). 1칸 차이 ≈ 0.5집 단위의 기대값
        — 영역 합계는 '집 환산 근사'로 표기한다(F3 문구에 명시).
"""
import glob
import json
import os

from board import Board, gtp_to_xy, region, N, COLS
from analyze import load_game

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data")
OUT = os.path.join(DATA, "facts")

ALIVE, DEAD = 0.5, -0.5
KO = {"B": "흑", "W": "백"}


def own_at(own, p):
    x, y = p
    return own[y * N + x]


def state(v):
    if v >= ALIVE:
        return "안정"
    if v <= DEAD:
        return "잡힘"
    return "미정"


def board_at(gm, turn):
    b = Board()
    for color, mv in gm.get("initial", []):
        b.s[gtp_to_xy(mv)] = color
    for color, mv in gm["moves"][:turn]:
        b.play(color, gtp_to_xy(mv))
    return b


def gname(color, stones):
    xs = sorted(stones, key=lambda p: (p[1], p[0]))
    cx = sum(p[0] for p in stones) / len(stones)
    cy = sum(p[1] for p in stones) / len(stones)
    rep = xs[0]
    return f"{KO[color]} {region((round(cx), round(cy)))} {len(stones)}점({COLS[rep[0]]}{N - rep[1]} 포함)"


def pv_line(start_color, pv, n):
    out, c = [], start_color
    for m in pv[:n]:
        out.append(f"{KO[c]} {m}")
        c = "W" if c == "B" else "B"
    return out


def pv_captures(board, start_color, pv, n):
    b, c, caps = board.copy(), start_color, []
    for k, m in enumerate(pv[:n], 1):
        p = gtp_to_xy(m)
        got = b.play(c, p)
        if got:
            caps.append(f"{k}수째 {KO[c]} {m}로 {KO['W' if c == 'B' else 'B']} {len(got)}점 따냄")
        c = "W" if c == "B" else "B"
    return caps


def extract(d, gm):
    pos, before, after = d["pos"], d["before"], d["after"]
    i, color = pos["move_index"], pos["color"]
    opp = "W" if color == "B" else "B"
    sign = 1 if color == "B" else -1
    actual = pos["move"]
    best = before["moveInfos"][0]
    facts = []

    def add(fid, typ, text, data=None):
        facts.append({"id": fid, "type": typ, "text": text, "data": data or {}})

    # F1 손익: 최선수 기대 집 차 vs 실제 수 이후 기대 집 차 (둔 쪽 관점)
    lead_best = sign * best["scoreLead"]
    lead_after = sign * after["rootInfo"]["scoreLead"]
    loss = round(lead_best - lead_after, 1)
    add("F1", "손익", f"{KO[color]} {pos['move_number']}수 {actual}는 최선수 {best['move']}보다 약 {loss}집 손해다. "
        f"(최선수 후 {KO[color]} 기준 {lead_best:+.1f}집 → 실제 수 후 {lead_after:+.1f}집)",
        {"loss": loss, "lead_best": round(lead_best, 1), "lead_after": round(lead_after, 1)})

    pa, pb = gtp_to_xy(actual), gtp_to_xy(best["move"])
    dist = max(abs(pa[0] - pb[0]), abs(pa[1] - pb[1]))
    add("F2", "착점", f"실제 수 {actual}는 {region(pa)}, 최선수 {best['move']}는 {region(pb)}에 있다. 두 점의 거리는 {dist}칸이다.",
        {"actual": actual, "best": best["move"], "actual_region": region(pa), "best_region": region(pb), "dist": dist})

    # F3 손익 위치: 최선수 소유권 − 실제 수 소유권 (둔 쪽 관점), 영역별 합계
    own_b, own_a = best["ownership"], after["ownership"]
    by_reg = {}
    for y in range(N):
        for x in range(N):
            dv = sign * (own_b[y * N + x] - own_a[y * N + x])
            r = region((x, y))
            by_reg[r] = by_reg.get(r, 0) + dv
    lost = sorted(((r, v) for r, v in by_reg.items() if v >= 1.0), key=lambda t: -t[1])[:2]
    gained = sorted(((r, v) for r, v in by_reg.items() if v <= -1.0), key=lambda t: t[1])[:1]
    parts = [f"{r}에서 약 {v:.1f}집" for r, v in lost]
    txt = (f"최선수와 비교한 손실은 주로 {', '.join(parts)}이다." if parts else "손실이 한 영역에 몰려 있지 않고 판 전체에 흩어져 있다.")
    if gained:
        txt += f" 반대로 실제 수는 {gained[0][0]}에서 약 {-gained[0][1]:.1f}집을 더 얻었다."
    # 영역 값은 서로 상쇄된다 — 합계를 같이 적어 F1 총 손익과 혼동하지 않게 한다
    total = sum(by_reg.values())
    txt += f" 9개 영역을 모두 더한 순손실은 약 {total:.1f}집이다(근사치 — 총 손익은 F1이 정본)."
    add("F3", "손익 위치", txt + " (소유권 기대값 차이의 집 환산 근사)",
        {"lost": [[r, round(v, 1)] for r, v in lost], "gained": [[r, round(-v, 1)] for r, v in gained]})

    # F4 그룹 상태 전환: 실제 수 직전 판의 2점 이상 그룹, 소유권 평균의 상태 비교
    board = board_at(gm, i)
    trans = []
    for gcol, stones, libs in board.groups():
        if len(stones) < 2:
            continue
        s = 1 if gcol == "B" else -1
        vb = sum(s * own_at(own_b, p) for p in stones) / len(stones)
        va = sum(s * own_at(own_a, p) for p in stones) / len(stones)
        if state(vb) != state(va):
            trans.append((len(stones), gcol, stones, state(vb), state(va), len(libs)))
    trans.sort(key=lambda t: -t[0])
    if trans:
        lines = [f"{gname(g, st)}: 최선수면 {sb}, 실제 수 후 {sa}" for _, g, st, sb, sa, _ in trans[:3]]
        add("F4", "그룹 상태 전환", "; ".join(lines) + ".",
            {"groups": [{"name": gname(g, st), "best": sb, "actual": sa} for _, g, st, sb, sa, _ in trans[:3]]})
    else:
        add("F4", "그룹 상태 전환", "2점 이상 그룹 중 삶·죽음 상태가 바뀐 그룹은 없다.", {"groups": []})

    # F5 응징 수순: 실제 수 이후 상대 최선 PV
    pun = after["moveInfos"][0]
    b1 = board.copy()
    b1.play(color, pa)
    caps = pv_captures(b1, opp, pun["pv"], 6)
    add("F5", "응징 수순", f"실제 수 뒤 KataGo 예상 수순: {' → '.join(pv_line(opp, pun['pv'], 6))}."
        + (f" 이 수순에서 {'; '.join(caps)}." if caps else ""),
        {"pv": pun["pv"][:6], "captures": caps})

    # F6 최선수 목적: 최선 PV + 최선수로 상태가 좋아지는 그룹
    good = [f"{gname(g, st)}({sa}→{sb})" for _, g, st, sb, sa, _ in trans
            if (g == color and sb == "안정") or (g == opp and sb == "잡힘")]
    caps_b = pv_captures(board, color, best["pv"], 5)
    add("F6", "최선수 목적", f"최선수 수순: {' → '.join(pv_line(color, best['pv'], 5))}."
        + (f" 최선수는 {', '.join(good[:2])}을 만든다." if good else "")
        + (f" 이 수순에서 {'; '.join(caps_b)}." if caps_b else ""),
        {"pv": best["pv"][:5], "improves": good[:2], "captures": caps_b})

    # F7 급함 vs 큼
    if lost:
        main_reg = lost[0][0]
        if dist >= 5 and main_reg == region(pb) and main_reg != region(pa):
            txt = (f"급한 곳을 놓친 실수다: 실제 수는 {region(pa)}에 두었지만 손해는 최선수 자리인 {main_reg}에서 났다.")
            kind = "급함"
        elif main_reg == region(pa):
            txt = f"같은 지역({region(pa)}) 안에서 수를 잘못 고른 실수다: 손해가 실제 수를 둔 곳에서 났다."
            kind = "국지"
        else:
            txt = f"손해가 가장 큰 곳({main_reg})은 실제 수 자리({region(pa)})와도, 최선수 자리({region(pb)})와도 다른 지역이다."
            kind = "전국"
    else:
        txt, kind = "손해가 판 전체에 퍼져 있어 급함·큼으로 나누기 어렵다.", "분산"
    add("F7", "급함 vs 큼", txt, {"kind": kind})

    # F8 승률 (둔 쪽 관점)
    wb = best["winrate"] if color == "B" else 1 - best["winrate"]
    wa = after["rootInfo"]["winrate"] if color == "B" else 1 - after["rootInfo"]["winrate"]
    add("F8", "승률", f"{KO[color]} 승률은 최선수면 {wb * 100:.0f}%, 실제 수 후 {wa * 100:.0f}%다.",
        {"best": round(wb, 3), "actual": round(wa, 3)})

    # F9 엔진 후보 순위
    rank = next((k for k, m in enumerate(before["moveInfos"], 1) if m["move"] == actual), None)
    add("F9", "후보 순위", f"실제 수 {actual}는 KataGo 후보 {rank}위였다." if rank else
        f"실제 수 {actual}는 KataGo 상위 후보 {len(before['moveInfos'])}개 안에 없었다.", {"rank": rank})

    # F10 공동 최선: 1·2순위 기대 집 차이가 CO_BEST 미만이면 어느 쪽도 최선 (탐색 흔들림 대비)
    co = co_best(before, color, exclude=actual)
    if co:
        add("F10", "공동 최선", f"KataGo 1·2순위 {best['move']}와 {co['move']}는 기대 집 차이 {co['gap']}집으로 "
            f"사실상 같은 수다 — 어느 쪽도 최선이다.", co)

    return {"pos_id": pos["pos_id"], "game": pos["game"], "move_number": pos["move_number"],
            "color": color, "actual": actual, "best": best["move"], "co_best": co["move"] if co else None,
            "facts": facts}


CO_BEST = 0.5


def co_best(before, color, exclude=None):
    """1순위와 기대 집 차이 CO_BEST 미만인 2순위 수 (실제 수는 제외)."""
    sign = 1 if color == "B" else -1
    mi = before["moveInfos"]
    if len(mi) < 2 or mi[1]["move"] == exclude:
        return None
    gap = round(sign * (mi[0]["scoreLead"] - mi[1]["scoreLead"]), 1)
    return {"move": mi[1]["move"], "gap": gap} if gap < CO_BEST else None


def main():
    os.makedirs(OUT, exist_ok=True)
    games = {}
    for f in sorted(glob.glob(os.path.join(DATA, "deep", "P*.json"))):
        d = json.load(open(f))
        gid = d["pos"]["game"]
        games.setdefault(gid, load_game(gid))
        fx = extract(d, games[gid])
        json.dump(fx, open(os.path.join(OUT, f"{fx['pos_id']}.json"), "w"), ensure_ascii=False, indent=1)
        print(fx["pos_id"], fx["facts"][0]["text"][:60])


if __name__ == "__main__":
    main()
