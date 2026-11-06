"""단계식 사활(11-06 20:55 작가님 "돌의 생사를 완벽히 파악해야 형세가 가려지지") — 무리 단위로 (판정, 단계)를 낸다.

단계: ① Benson 무조건 삶 → ② 확실한 삶(2눈·넓은 집 공간) → ③ 눈 모양 사전 → ④ 국지 사활 탐색(닫힌 무리, 빈 점 ≤ SEARCH_MAX)
     → ⑤ 세키(탐색에서 양쪽 패스로 남음) → ⑥ 포위·눈 없음(확정 죽음) → ⑦ 미정. 억지로 판정하지 않는다.
알고리즘은 이 폴더 자체 작성(외부 코드 없음). 눈 모양 이름은 한국 바둑 용어(직사궁·곡사궁·방사궁 …).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from codeeval import (NB, N, SIZE, benson, block, bouzy, dragons, eyes, own_space, reaches_strong, SPACE_ALIVE,  # noqa: E402
                      ENCLOSE_MAX, BREATH_MAX)

SEARCH_MAX = 10      # 국지 탐색: 닫힌 영역 빈 점 상한
SEARCH_NODES = 20000  # 무리당 탐색 노드 상한(넘으면 미정)

# ---- 눈 모양 사전: 무리가 완전히 둘러싼 빈 영역(상대 돌 없음) 하나의 모양 → 판정. 회전·대칭 정규화
def _norm(cells):
    out = []
    pts = [(c % SIZE, c // SIZE) for c in cells]
    for t in range(8):
        q = []
        for x, y in pts:
            for _ in range(t % 4):
                x, y = y, -x
            if t >= 4:
                x = -x
            q.append((x, y))
        mx, my = min(a for a, _ in q), min(b for _, b in q)
        out.append(tuple(sorted((a - mx, b - my) for a, b in q)))
    return min(out)


def _shape(*rows):
    cells = [y * SIZE + x for y, r in enumerate(rows) for x, ch in enumerate(r) if ch == "#"]
    return _norm(cells)


SHAPES = {  # 판정: 삶 = 어느 쪽이 먼저 둬도 2눈 / 죽음 = 어느 쪽이 먼저 둬도 1눈 / 선수 = 급소를 먼저 두는 쪽(→ 탐색)
    _shape("#"): ("죽음", "1궁"), _shape("##"): ("죽음", "2궁"),
    _shape("###"): ("선수", "직삼궁"), _shape("##", "#."): ("선수", "곡삼궁"),
    _shape("####"): ("삶", "직사궁"), _shape("###", "#.."): ("삶", "곡사궁"), _shape("##", "##"): ("죽음", "방사궁"),
    _shape("###", ".#."): ("선수", "화살사궁"), _shape("##.", ".##"): ("삶", "굽은사궁"),
    _shape("###", "##."): ("선수", "매화오궁"), _shape(".#.", "###", ".#."): ("선수", "십자오궁"),
    _shape("####", "#..."): ("삶", "오궁(일자 굽음)"), _shape("#####"): ("삶", "직오궁"),
    _shape("###", "###"): ("삶", "판육궁"), _shape(".##", "###", ".#."): ("선수", "포도육궁"),
}


def enclosed_eye_regions(b, col, stones):
    """무리가(판 끝 포함) 완전히 둘러싼 빈 영역들 — 상대 돌이 없고 크기 ≤ 8. [(칸 집합)]"""
    out, seen = [], set()
    for p in stones:
        for e in NB[p]:
            if b[e] != 0 or e in seen:
                continue
            reg, st, ok = {e}, [e], True
            seen.add(e)
            while st and ok:
                x = st.pop()
                for q in NB[x]:
                    if b[q] == 0 and q not in reg:
                        reg.add(q); seen.add(q); st.append(q)
                        if len(reg) > 8:
                            ok = False
                    elif b[q] == -col:
                        ok = False
            if ok:
                out.append(reg)
    return out


# ---- 국지 사활 탐색
def closed_area(b, col, stones, strong):
    """닫힌 영역 — 무리에서 빈칸·자기 돌·(확실히 살지 않은) 상대 돌을 따라 퍼진 칸, 확실히 산 상대 돌에서 멈춤.
    빈 점이 SEARCH_MAX 를 넘거나 확실히 산 자기 돌에 닿으면 None(열림)"""
    seen, st, empties = set(stones), list(stones), 0
    while st:
        p = st.pop()
        for q in NB[p]:
            if q in seen:
                continue
            if b[q] == -col and q in strong:
                continue
            if b[q] == col and q in strong:
                return None
            seen.add(q)
            if b[q] == 0:
                empties += 1
                if empties > SEARCH_MAX:
                    return None
            st.append(q)
    return seen


def solve(b, col, anchor, area, first):
    """닫힌 영역 안에서만 두는 사활 탐색 — 결과: '삶'|'세키'|'죽음'|None(상한). first = 먼저 두는 색. 수비 = col"""
    nodes = [0]
    memo = {}
    cells = sorted(area)

    def key(board, to, passes, ko):
        return (tuple(board[c] for c in cells), to, passes, ko)

    def play(board, c, mv):
        nb = board[:]
        nb[mv] = c
        cap = []
        for q in NB[mv]:
            if nb[q] == -c:
                s, libs = block(nb, q)
                if not libs:
                    cap.extend(s)
                    for x in s:
                        nb[x] = 0
        s, libs = block(nb, mv)
        if not libs:
            return None, None
        ko = cap[0] if len(cap) == 1 and len(s) == 1 and len(libs) == 1 else -1
        return nb, ko

    def rec(board, to, passes, ko, depth):
        nodes[0] += 1
        if nodes[0] > SEARCH_NODES:
            raise TimeoutError
        if board[anchor] != col:
            return 0
        if eyes(board, col, block(board, anchor)[0]) >= 2:  # 진짜 눈 2개 = 삶(탐색 안에서는 빠른 근사 — Benson 은 판 전체라 느리다)
            return 2
        if passes >= 2:
            return 1  # 둘 다 둘 곳이 없다 — 무리가 남아 있으면 세키(집 없는 삶)
        if depth > 2 * SEARCH_MAX + 4:
            raise TimeoutError
        k = key(board, to, passes, ko)
        if k in memo:
            return memo[k]
        best = None
        for mv in cells:
            if board[mv] != 0 or mv == ko:
                continue
            nb, nko = play(board, to, mv)
            if nb is None:
                continue
            r = rec(nb, -to, 0, nko, depth + 1)
            if best is None or (r > best if to == col else r < best):
                best = r
            if (to == col and best == 2) or (to != col and best == 0):
                break
        r = rec(board, -to, passes + 1, -1, depth + 1)
        if best is None or (r > best if to == col else r < best):
            best = r
        memo[k] = best
        return best

    try:
        r = rec(b[:], first, 0, -1, 0)
    except TimeoutError:
        return None
    return {2: "삶", 1: "세키", 0: "죽음"}[r]


def life_staged(b):
    """{칸: (판정, 단계)} — 돌 칸만. 판정 ∈ 삶·죽음·세키·미정"""
    out = {}
    v = bouzy(b)
    safe = {1: benson(b, 1), -1: benson(b, -1)}
    drs = dragons(b)
    strong, weak = set(), []
    for col, st in drs:
        if st & safe[col]:
            for p in st:
                out[p] = ("삶", "① Benson")
            strong |= st
        elif eyes(b, col, st) >= 2 or own_space(b, v, col, st) >= SPACE_ALIVE:
            for p in st:
                out[p] = ("삶", "② 2눈·집 공간")
            strong |= st
        else:
            weak.append((col, st))
    for col, st in weak:
        res = None
        # ③ 눈 모양 사전 — 완전히 둘러싼 빈 영역이 정확히 하나이고 그 밖에 숨 쉴 곳이 없을 때
        regs = enclosed_eye_regions(b, col, st)
        libs = {q for p in st for q in NB[p] if b[q] == 0}
        if len(regs) == 1 and libs <= regs[0]:
            hit = SHAPES.get(_norm(regs[0]))
            if hit and hit[0] in ("삶", "죽음"):
                res = (hit[0], f"③ 모양 {hit[1]}")
        # ④·⑤ 국지 사활 탐색
        if res is None:
            area = closed_area(b, col, st, strong)
            if area is not None:
                anchor = min(st)
                a1 = solve(b, col, anchor, area, -col)  # 상대 선
                a2 = solve(b, col, anchor, area, col)   # 자기 선
                if a1 is not None and a2 is not None:
                    if a1 == a2:
                        res = (a1, "⑤ 세키" if a1 == "세키" else f"④ 탐색({a1})")
                    else:
                        res = ("미정", f"④ 탐색(선수 — 상대 선 {a1}·자기 선 {a2})")
        # ⑥ 포위·눈 없음(확정 죽음) — 기존 갇힘 판정
        if res is None:
            res = _enclosed(b, col, st, v, strong, sum(1 for x in b if x == 0) <= ENDGAME_EMPTY)
        for p in st:
            out[p] = res
    return out


ENDGAME_EMPTY = 170  # 빈 점이 이 이하면 끝내기 국면(경계 돌이 '확실히 산 무리'로 안 잡혀도 포위로 본다)


def _enclosed(b, col, stones, v, strong, endgame=True):
    seen, st, own_e, neutral, border = set(stones), list(stones), 0, set(), set()
    while st:
        p = st.pop()
        for q in NB[p]:
            if q in seen:
                continue
            if b[q] == -col:
                border.add(q)
                continue
            if b[q] == 0 and v[q] * col <= 0:
                if v[q] == 0:
                    neutral.add(q)
                continue
            seen.add(q)
            if b[q] == 0:
                own_e += 1
                if own_e > ENCLOSE_MAX:
                    return ("삶", "② 넓은 자기 세력(연결)")
            st.append(q)
    mine = {p for p in seen if b[p] == col}
    if eyes(b, col, mine) >= 2:
        return ("삶", "② 2눈·집 공간")
    if len(neutral) > BREATH_MAX and reaches_strong(b, col, seen, v, strong):
        return ("미정", "⑦ 연결 가능")
    if not endgame and (not border or len(neutral) > BREATH_MAX):  # 중반 — 맞닿은 상대 돌이 없거나 숨 쉴 곳이 많으면 포위가 아니다
        return ("미정", "⑦ 포위 미완(중반)")
    my_libs = {q for p in mine for q in NB[p] if b[q] == 0}
    done = set()
    for q in border:
        if q in done:
            continue
        s, libs = block(b, q)
        done |= s
        if s & strong:
            continue
        if not endgame:  # 11-06 판정표: 중반(빈 점 > ENDGAME_EMPTY)에 둘러싼 상대가 아직 약하면 포위가 끝난 게 아니다 → 미정
            m, o = len(my_libs), len(libs)
            return ("미정", "⑦ 수상전(선수)" if o == m else "⑦ 수상전(우리 활로 많음)" if o < m else "⑦ 포위 미완(상대 약함)")
        # 수상전 후보 — 확실히 살지 않은 상대 덩어리의 활로 o 가 우리 활로 m 이하면 우리가 잡을 수도 있다 → 미정(억지 판정 금지).
        # (11-06 시험: 공배·활로 수로 승패까지 가르는 규칙은 사석 옆 공유 활로를 과하게 잡아 정확도가 떨어져 쓰지 않는다)
        m, o = len(my_libs), len(libs)
        if o < m:
            return ("미정", "⑦ 수상전(우리 활로 많음)")
        if o == m:
            return ("미정", "⑦ 수상전(선수)")
    return ("죽음", "⑥ 포위·눈 없음")
