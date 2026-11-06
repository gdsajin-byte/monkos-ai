#!/usr/bin/env python3
"""바둑 판 모양 검출기 v0 — 착수 1수 + 직전 판(+직전 두 수)으로 행마·모양 용어 이름을 붙인다. 엔진 없음, 표준 라이브러리만.

  from go_terms import detect
  tags = detect(board, color, xy, history)   # board: {(x,y): 'B'|'W'} 착수 직전, xy=(x,y) 0-기반(y=0 위), history=[(color, xy, tags), ...] 직전 수들(꼬리표 포함)
  python3 go_terms.py dist [--name full] [--limit N]   # 실수 사전 2,000판 출현 분포 → reports/GO_TERMS_v0.md 표에 쓸 JSON
  python3 go_terms.py game G836 [--to 40]              # 한 판 수순별 꼬리표

판정 규칙(정의 출처는 reports/GO_TERMS_v0.md 용어 표):
  거리 행마 — 같은 색 돌과의 상대 위치(가장 가까운 자기 돌 하나 기준, 사이 칸이 비어 있어야 '뜀'):
    한칸뜀 (0,2) · 두칸뜀 (0,3) · 날일자 (1,2) · 눈목자 (1,3) · 큰눈목자 (2,3) · 마늘모 (1,1) · 쌍점 (0,1)
  벌림 — 3·4선 착수가 변을 따라 같은 선(±1선) 자기 돌과 2~4칸 떨어지고 사이가 비어 있음: 두칸·세칸·네칸 벌림
  걸침 — 귀(각 변 6선 안)의 상대 돌(3·4선)에 날일자·한칸·두칸·눈목자 거리로 다가감, 그 귀에 내 돌 없음
  굳힘 — 귀의 자기 돌(3·4선)에 같은 거리로 붙여 귀를 지킴, 그 귀에 상대 돌 없음
  협공 — 3·4선 착수, 상대 걸친 돌(귀 바깥쪽)과 변을 따라 2~4칸, 그 귀에 내 돌 있음
  접촉 — 붙임·젖힘·이단젖힘·두점머리 젖힘·끊음·끼움·끼워잇기·이음·뻗음·밀기·내려섬·막음·젖혀잇기·들여다봄·어깨짚기·모자(씌움)
  사활·수상전 — 단수·따냄·빵때림 / 모양 — 빈삼각·호구
  엔진·문맥 필요(여기서 판정하지 않음) — 맞보기·선수·후수·두터움·실리·대세·사석·맛·축·장문·환격 등
"""
import json
import os
import sys
from collections import Counter, defaultdict

N = 19
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
DIAG = ((1, 1), (1, -1), (-1, 1), (-1, -1))

# 거리 행마 (|dx|,|dy|) 정렬 쌍 → 이름. 정의 확인 후 고정(GO_TERMS_v0.md §출처)
# 정의: 한국기원 바둑용어사전(baduk.or.kr/story/keyword.asp) — 날일자 #154 '날일자의 대각' · 한칸뜀 #976 · 두칸뜀 #263 · 마늘모 #288 '대각선'
#       눈목자 = 눈목자걸침 #186·굳힘 #187의 거리(1,3). 큰눈목자(2,3)는 사전 표제어 없음 → 관용 표기, 출처 미확인 꼬리표로만
JUMPS = {(1, 1): "마늘모", (0, 2): "한칸뜀", (0, 3): "두칸뜀", (1, 2): "날일자", (1, 3): "눈목자", (2, 3): "큰눈목자"}
EXT = {3: "두칸 벌림", 4: "세칸 벌림", 5: "네칸 벌림"}


def opp(c):
    return "W" if c == "B" else "B"


def on(p):
    return 0 <= p[0] < N and 0 <= p[1] < N


def nb(p):
    for dx, dy in DIRS:
        q = (p[0] + dx, p[1] + dy)
        if on(q):
            yield q


def line(p):
    """선(1선=가장자리)과 가장 가까운 변 방향"""
    x, y = p
    return min(x, y, N - 1 - x, N - 1 - y) + 1


def group(s, p):
    c = s[p]
    seen, st, libs = {p}, [p], set()
    while st:
        q = st.pop()
        for r in nb(q):
            if r not in s:
                libs.add(r)
            elif s[r] == c and r not in seen:
                seen.add(r)
                st.append(r)
    return seen, libs


def play(s, c, p):
    s = dict(s)
    s[p] = c
    cap = []
    for r in nb(p):
        if s.get(r) == opp(c):
            g, l = group(s, r)
            if not l:
                for q in g:
                    del s[q]
                cap += g
    return s, cap


def corner_of(p):
    """귀 영역(가로·세로 모두 6선 이내)이면 귀 id, 아니면 None"""
    x, y = p
    if (x < 6 or x > N - 7) and (y < 6 or y > N - 7):
        return (x < 9, y < 9)
    return None


def empty_between(s, a, b):
    """일직선(가로·세로) 사이 칸이 모두 비었나"""
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx and dy:
        return False
    n = max(abs(dx), abs(dy))
    sx, sy = (dx > 0) - (dx < 0), (dy > 0) - (dy < 0)
    return all((a[0] + sx * k, a[1] + sy * k) not in s for k in range(1, n))


def distance_move(s, c, p):
    """가장 가까운 자기 돌 기준 거리 행마 이름(접촉이 있으면 접촉 우선 — 호출부에서 판단)"""
    best = None
    for q, cq in s.items():
        if cq != c:
            continue
        dx, dy = abs(q[0] - p[0]), abs(q[1] - p[1])
        key = tuple(sorted((dx, dy)))
        if key not in JUMPS:
            continue
        name = JUMPS[key]
        if key[0] == 0 and key[1] >= 2 and not empty_between(s, p, q):
            continue
        d2 = dx * dx + dy * dy
        if best is None or d2 < best[0]:
            best = (d2, name, q)
    return best


def detect(s, c, p, history=()):
    """s: 착수 직전 판, c: 두는 색, p: 착점(x,y). history: [(색, xy, tags)] 오래된 것 → 최근(직전 수가 마지막)."""
    tags = []
    o = opp(c)
    own_n = [q for q in nb(p) if s.get(q) == c]
    opp_n = [q for q in nb(p) if s.get(q) == o]
    own_d = [(p[0] + dx, p[1] + dy) for dx, dy in DIAG if s.get((p[0] + dx, p[1] + dy)) == c]
    ln = line(p)
    after, cap = play(s, c, p)

    # --- 사활·수상전
    if cap:
        tags.append("따냄")
        cp = next(iter(cap)) if len(cap) == 1 else None
        if cp and line(cp) >= 3 and sum(1 for q in nb(cp) if after.get(q) == c) == 4:  # 판 안쪽 한 점을 네 방향에서
            tags.append("빵때림")
    for q in opp_n:
        if q in after:
            g, l = group(after, q)
            if len(l) == 1:
                tags.append("단수")
                break

    # --- 연결·끊음
    own_groups = {frozenset(group(s, q)[0]) for q in own_n}
    if len(own_groups) >= 2:
        tags.append("이음")
    opp_groups = {frozenset(group(s, q)[0]) for q in opp_n}
    # 끊음: 상대 돌 둘이 이 점을 사이에 두고 대각으로 이어질 수 있던 자리(두 무리 모두에 닿음)
    if len(opp_groups) >= 2:
        axis = any(s.get((p[0] + dx, p[1] + dy)) == o and s.get((p[0] - dx, p[1] - dy)) == o for dx, dy in ((1, 0), (0, 1)))
        tags.append("끼움" if axis and not own_n else "끊음")
    # 끼워잇기: 직전 내 수가 끼움이었고 이번 수가 그 돌에 붙여 잇는다
    if len(history) >= 2:
        pc, pp, pt = history[-2]
        if pc == c and pp in own_n and "끼움" in pt:
            tags.append("끼워잇기")

    # 껴붙임(한국기원 #135 '자신의 돌과 접촉하고 있는 상대의 돌 한 점을 껴안듯이 붙이다'):
    #   붙는 상대 돌이 한 점이고, 그 반대편에 내 돌이 맞닿아 있다(내 돌—상대 한 점—이번 수 일직선)
    if opp_n and not own_n and not {"끼움", "끊음"} & set(tags):
        for b in opp_n:
            g, _ = group(s, b)
            d = (b[0] - p[0], b[1] - p[1])
            if len(g) == 1 and s.get((b[0] + d[0], b[1] + d[1])) == c and b in after and len(group(after, b)[1]) >= 2:
                tags.append("껴붙임")
                break
    # --- 접촉 수 (끼움·끊음·껴붙임이면 그것이 수의 이름 — 젖힘·붙임은 붙이지 않는다)
    if opp_n and not own_n and not {"끼움", "끊음", "껴붙임"} & set(tags):
        if own_d:
            # 젖힘: 대각의 내 돌 A와 붙은 상대 돌 B가 있고 이번 수가 B에 붙음
            hane = [a for a in own_d if any(s.get(b) == o and abs(b[0] - a[0]) + abs(b[1] - a[1]) == 1 for b in opp_n)]
            if hane:
                tags.append("젖힘")
                # 두점머리 젖힘: 붙은 상대 돌이 같은 방향 두 점 줄의 머리
                for b in opp_n:
                    d = (b[0] - p[0], b[1] - p[1])
                    b2, b3 = (b[0] + d[0], b[1] + d[1]), (b[0] + 2 * d[0], b[1] + 2 * d[1])
                    if s.get(b2) == o and s.get(b3) != o:
                        tags.append("두점머리 젖힘")
                        break
                if history and history[-1][0] == o:
                    lp = history[-1][1]
                    if lp in opp_n and len(history) >= 2 and history[-2][0] == c and "젖힘" in history[-2][2] and "젖힘" in history[-1][2]:
                        tags.append("이단젖힘")
            else:
                tags.append("붙임")
        else:
            tags.append("붙임")
    if own_n and opp_n:
        for a in own_n:
            d = (p[0] - a[0], p[1] - a[1])
            perp = ((d[1], d[0]), (-d[1], -d[0]))
            # 밀기(밀어올림): 내 돌 줄을 따라 한 칸 나가며 옆에 상대 돌이 나란히(내 돌 옆에도 상대 돌)
            side = [e for e in perp if s.get((p[0] + e[0], p[1] + e[1])) == o and s.get((a[0] + e[0], a[1] + e[1])) == o]
            if side:
                tags.append("밀기")
                if line(p) > line(a):
                    tags.append("밀어올림")
                break
        else:
            # 막음: 상대 돌의 진행 방향 앞을 막는다(상대 돌 B 뒤에 같은 색 B' 일직선)
            for b in opp_n:
                d = (p[0] - b[0], p[1] - b[1])
                if s.get((b[0] - d[0], b[1] - d[1])) == o:
                    tags.append("막음")
                    break
    if len(own_n) == 1 and not len(own_groups) >= 2:
        a = own_n[0]
        d = (p[0] - a[0], p[1] - a[1])
        if s.get((a[0] - d[0], a[1] - d[1])) != c and any(s.get(q) == o for q in nb(a)) and "밀기" not in tags:
            if ln < line(a):
                tags.append("내려섬")
            else:
                tags.append("뻗음")
    # 젖혀잇기: 직전 내 수가 젖힘, 이번 수가 그 돌에 이음
    if len(history) >= 2 and history[-2][0] == c and history[-2][1] in own_n and "젖힘" in history[-2][2]:
        tags.append("젖혀잇기")

    # --- 견제(접촉 없음)
    if not opp_n:
        # 들여다봄: 상대의 끊는 자리(서로 다른 무리 둘 이상에 닿는 빈 점, 또는 호구 입) 바로 옆
        for q in nb(p):
            if q in s:
                continue
            og = {frozenset(group(s, r)[0]) for r in nb(q) if s.get(r) == o}
            if len(og) >= 2 or (len([r for r in nb(q) if s.get(r) == o]) >= 3):
                tags.append("들여다봄")
                break
        for dx, dy in DIAG:
            b = (p[0] + dx, p[1] + dy)
            if s.get(b) == o and line(b) in (3, 4) and ln == line(b) + 1 and not own_n:
                tags.append("어깨짚기")
                break
        for dx, dy in DIRS:
            b = (p[0] + 2 * dx, p[1] + 2 * dy)
            if s.get(b) == o and (p[0] + dx, p[1] + dy) not in s and ln > line(b) and line(b) >= 3:
                tags.append("모자(씌움)")
                break

    # --- 포석: 벌림·걸침·굳힘·협공 (접촉 없는 3·4선)
    if not opp_n and not own_n and ln in (3, 4):
        cid = corner_of(p)
        tags_before = len(tags)
        if cid:
            near_opp = [q for q, cq in s.items() if cq == o and corner_of(q) == cid and line(q) in (3, 4)]
            near_own = [q for q, cq in s.items() if cq == c and corner_of(q) == cid]
            for q in near_opp:
                key = tuple(sorted((abs(q[0] - p[0]), abs(q[1] - p[1]))))
                if key in ((1, 2), (0, 2), (0, 3), (1, 3)) and not near_own:
                    tags.append("걸침")
                    break
            for q in near_own:
                key = tuple(sorted((abs(q[0] - p[0]), abs(q[1] - p[1]))))
                if key in ((1, 2), (0, 2), (0, 3), (1, 3)) and line(q) in (3, 4) and not any(cq == o and corner_of(qq) == cid for qq, cq in s.items()):
                    tags.append("굳힘")
                    break
        # 벌림: 변을 따라(같은 선 ±1) 자기 돌과 3~5 간격, 사이 비어 있음
        for q, cq in s.items():
            if cq != c or line(q) not in (3, 4, 5):
                continue
            dx, dy = abs(q[0] - p[0]), abs(q[1] - p[1])
            along = (dx in EXT and dy <= 1 and (p[1] < 6 or p[1] > N - 7)) or (dy in EXT and dx <= 1 and (p[0] < 6 or p[0] > N - 7))
            if along:
                k = dx if dx in EXT else dy
                lo, hi = sorted((p, q))
                if all(r not in s for r in _rect(p, q) if r not in (p, q)):
                    tags.append(EXT[k])
                    break
        # 협공: 변을 따라 상대 돌(걸친 돌)과 2~4칸, 그 상대 돌의 귀에 내 돌
        for q, cq in s.items():
            if cq != o or line(q) not in (3, 4) or corner_of(q) is None:
                continue
            dx, dy = abs(q[0] - p[0]), abs(q[1] - p[1])
            if (dx in (2, 3, 4) and dy <= 1) or (dy in (2, 3, 4) and dx <= 1):
                cid = corner_of(q)
                if any(cc == c and corner_of(r) == cid for r, cc in s.items()) and corner_of(p) != cid:
                    tags.append("협공")
                    break

    if ("걸침" in tags or "굳힘" in tags) and "모자(씌움)" in tags:  # 귀의 걸침·굳힘 거리는 씌움이 아니다
        tags.remove("모자(씌움)")

    # --- 모양
    for dx, dy in DIAG:
        a, b, cpt = (p[0] + dx, p[1]), (p[0], p[1] + dy), (p[0] + dx, p[1] + dy)
        cells = [after.get(a), after.get(b), after.get(cpt)]
        if cells.count(c) == 2 and None in cells and on(a) and on(b) and on(cpt):
            if after.get(a) == c and after.get(b) == c and cpt not in after:
                tags.append("빈삼각")
                break
            if (after.get(a) == c and after.get(cpt) == c and b not in after) or (after.get(b) == c and after.get(cpt) == c and a not in after):
                tags.append("빈삼각")
                break
    for q in nb(p):
        if q in after:
            continue
        if sum(1 for r in nb(q) if after.get(r) == c) >= 3 and all(after.get(r) != o for r in nb(q)):
            tags.append("호구")
            break

    # 거리 행마(접촉 수가 없을 때만)
    if not opp_n and not own_n:
        dm = distance_move(s, c, p)
        if dm:
            tags.append(dm[1])
    return list(dict.fromkeys(tags))


def _rect(a, b):
    for x in range(min(a[0], b[0]), max(a[0], b[0]) + 1):
        for y in range(min(a[1], b[1]), max(a[1], b[1]) + 1):
            yield (x, y)


# ---------------- 실수 사전 판 돌리기 ----------------
COLS = "ABCDEFGHJKLMNOPQRST"


def gxy(m):
    if not m or m.lower() == "pass":
        return None
    return COLS.index(m[0].upper()), N - int(m[1:])


def run_game(moves, upto=None):
    """[(색, 'Q16')] → [(수순, 색, 수, tags)]"""
    s, hist, out = {}, [], []
    for i, (c, m) in enumerate(moves[:upto]):
        p = gxy(m)
        if p is None:
            hist.append((c, None, []))
            out.append((i + 1, c, m, []))
            continue
        tags = detect(s, c, p, [h for h in hist[-4:] if h[1] is not None])
        out.append((i + 1, c, m, tags))
        s, _ = play(s, c, p)
        hist.append((c, p, tags))
    return out


def main():
    import argparse
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from kibo_common import ANALYSIS_DIR
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd")
    ap.add_argument("arg", nargs="?")
    ap.add_argument("--name", default="full")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--to", type=int, default=None)
    a = ap.parse_args()
    v0 = os.path.join(ANALYSIS_DIR, "mistakes_v0")
    meta = [json.loads(x) for x in open(os.path.join(v0, f"queries_{a.name}.meta.jsonl"), encoding="utf-8")]
    gidx = {m["id"]: f"G{i + 1:02d}" for i, m in enumerate(meta)}
    if a.cmd == "game":
        gid = meta[int(a.arg[1:]) - 1]["id"]
        for x in open(os.path.join(v0, f"queries_{a.name}.jsonl"), encoding="utf-8"):
            d = json.loads(x)
            if d["id"] == gid:
                for n, c, m, t in run_game(d["moves"], a.to):
                    print(n, "흑" if c == "B" else "백", m, " · ".join(t))
                return
    if a.cmd == "dist":
        cnt, by_phase, games = Counter(), defaultdict(Counter), 0
        moves_total = 0
        for x in open(os.path.join(v0, f"queries_{a.name}.jsonl"), encoding="utf-8"):
            d = json.loads(x)
            games += 1
            for n, c, m, t in run_game(d["moves"]):
                moves_total += 1
                ph = "포석" if n <= 50 else ("중반" if n <= 150 else "끝내기")
                for tag in t:
                    cnt[tag] += 1
                    by_phase[tag][ph] += 1
            if a.limit and games >= a.limit:
                break
        res = {"games": games, "moves": moves_total, "count": cnt.most_common(), "by_phase": {k: dict(v) for k, v in by_phase.items()}}
        out = os.path.join(ANALYSIS_DIR, "commentary_v0", f"go_terms_dist_{a.name}.json")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(json.dumps({k: v for k, v in res.items() if k != "by_phase"}, ensure_ascii=False)[:2000])


if __name__ == "__main__":
    main()
