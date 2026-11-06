"""코드 형세 시제품 — 엔진 없이 즉시(순수 Python, 외부 의존 없음 → 모바일 이식 가능).

출처: 작가님 11-06 18:59·19:01·20:34(ORDER_20261106 GO_코드형세_시제품). 타이젬처럼 형세·계가를 코드로.
알고리즘은 공개 논문 설명만 보고 새로 작성했다(외부 코드 복사 없음 — GNU Go 등 GPL 코드는 보지도 가져오지도 않았다):
  · 세력: Bouzy(2003) "Mathematical morphology applied to computer go" — 돌 ±128, 팽창 D회·침식 E회(5/21)
  · 무조건 삶: Benson(1976) "Life in the game of Go" — 둘러싼 영역·생명 영역 반복 제거
  · 사활(간단): 무리(대마) 단위로 눈 개수(진짜·가짜 눈) → 2눈 이상 삶, 아니면 '무리 제거 시험'
    (그 무리를 들어낸 판의 세력에서 무리 자리의 몇 %가 상대 집이 되는지) → 높으면 사석, 낮으면 삶, 중간은 미정(억지 판정 금지)
판 표현: 361칸 정수 리스트(0 빈칸·1 흑·-1 백), 칸 번호 = y*19+x(y=0 이 19줄).
"""
SIZE = 19
N = SIZE * SIZE
COLS = "ABCDEFGHJKLMNOPQRST"
NB = [[j for j in ((i - SIZE) if i >= SIZE else -1, (i + SIZE) if i < N - SIZE else -1,
                   (i - 1) if i % SIZE else -1, (i + 1) if i % SIZE != SIZE - 1 else -1) if j >= 0] for i in range(N)]
DG = [[j for j, ok in ((i - SIZE - 1, i >= SIZE and i % SIZE), (i - SIZE + 1, i >= SIZE and i % SIZE != SIZE - 1),
                       (i + SIZE - 1, i < N - SIZE and i % SIZE), (i + SIZE + 1, i < N - SIZE and i % SIZE != SIZE - 1)) if ok] for i in range(N)]


def idx(mv):
    return (SIZE - int(mv[1:])) * SIZE + COLS.index(mv[0].upper())


def block(b, i):
    """i 를 포함한 같은 색 덩어리 → (돌 집합, 활로 집합)"""
    c, stones, libs, st = b[i], {i}, set(), [i]
    while st:
        p = st.pop()
        for q in NB[p]:
            v = b[q]
            if v == 0:
                libs.add(q)
            elif v == c and q not in stones:
                stones.add(q)
                st.append(q)
    return stones, libs


def replay(moves, setup=()):
    """수순 재생 → (판, 따낸 돌 {1: 흑이 딴 수, -1: 백이 딴 수})"""
    b = [0] * N
    caps = {1: 0, -1: 0}
    for s in setup:
        b[idx(s)] = 1
    for c, mv in moves:
        if mv.lower() == "pass":
            continue
        col = 1 if c == "B" else -1
        i = idx(mv)
        b[i] = col
        for q in NB[i]:
            if b[q] == -col:
                stones, libs = block(b, q)
                if not libs:
                    for s in stones:
                        b[s] = 0
                    caps[col] += len(stones)
        stones, libs = block(b, i)
        if not libs:  # 자충 — 규칙상 없음(기록 이상)
            for s in stones:
                b[s] = 0
            caps[-col] += len(stones)
    return b, caps


def blocks(b):
    """판의 모든 덩어리 → [(색, 돌 frozenset, 활로 frozenset)]"""
    seen, out = set(), []
    for i in range(N):
        if b[i] and i not in seen:
            stones, libs = block(b, i)
            seen |= stones
            out.append((b[i], frozenset(stones), frozenset(libs)))
    return out


def benson(b, col):
    """Benson 무조건 삶 — col 색 중 무조건 사는 돌 집합"""
    blks = [(s, l) for c, s, l in blocks(b) if c == col]
    owner = {}
    for k, (s, _) in enumerate(blks):
        for p in s:
            owner[p] = k
    # col 돌이 아닌 칸의 연결 영역
    regions, seen = [], set()
    for i in range(N):
        if b[i] != col and i not in seen:
            reg, st = {i}, [i]
            seen.add(i)
            while st:
                p = st.pop()
                for q in NB[p]:
                    if b[q] != col and q not in seen:
                        seen.add(q)
                        reg.add(q)
                        st.append(q)
            empties = {p for p in reg if b[p] == 0}
            around = {owner[q] for p in reg for q in NB[p] if b[q] == col}
            regions.append((reg, empties, around))
    alive = set(range(len(blks)))
    live_regions = set(range(len(regions)))
    while True:
        vital = {k: 0 for k in alive}
        for r in live_regions:
            reg, empties, around = regions[r]
            for k in around:
                if k in alive and empties <= blks[k][1]:
                    vital[k] += 1
        drop = {k for k in alive if vital[k] < 2}
        if not drop:
            break
        alive -= drop
        live_regions = {r for r in live_regions if regions[r][2] <= alive}
    return set().union(*(blks[k][0] for k in alive)) if alive else set()


def bouzy(b, dil=5, ero=21):
    """Bouzy 팽창·침식 → 칸별 값(양수 흑 세력·음수 백 세력)"""
    v = [128 * x for x in b]
    for _ in range(dil):
        w = v[:]
        for i in range(N):
            vi, nb = v[i], NB[i]
            if vi >= 0 and all(v[j] >= 0 for j in nb):
                w[i] += sum(1 for j in nb if v[j] > 0)
            if vi <= 0 and all(v[j] <= 0 for j in nb):
                w[i] -= sum(1 for j in nb if v[j] < 0)
        v = w
    for _ in range(ero):
        w = v[:]
        for i in range(N):
            vi = v[i]
            if vi > 0:
                w[i] = max(0, vi - sum(1 for j in NB[i] if v[j] <= 0))
            elif vi < 0:
                w[i] = min(0, vi + sum(1 for j in NB[i] if v[j] >= 0))
        v = w
    return v


def dragons(b):
    """같은 색 덩어리를 활로 공유·대각 연결로 묶은 무리 → [(색, 돌 집합)]"""
    blks = blocks(b)
    parent = list(range(len(blks)))

    def find(k):
        while parent[k] != k:
            parent[k] = parent[parent[k]]
            k = parent[k]
        return k
    at = {}
    for k, (_, s, _) in enumerate(blks):
        for p in s:
            at[p] = k
    for k, (c, s, libs) in enumerate(blks):
        for p in s:
            for q in DG[p]:  # 대각 — 두 끊는 점 중 하나라도 비어 있으면 연결로 본다
                if b[q] == c:
                    cuts = set(NB[p]) & set(NB[q])
                    if any(b[x] == 0 for x in cuts):
                        parent[find(k)] = find(at[q])
        for lp in libs:  # 활로 공유
            for q in NB[lp]:
                if b[q] == c and at[q] != k:
                    parent[find(k)] = find(at[q])
    groups = {}
    for k, (c, s, _) in enumerate(blks):
        groups.setdefault(find(k), (c, set()))[1].update(s)
    return list(groups.values())


def reaches_strong(b, col, region, v, strong):
    """영역에서 자기 세력·중립 빈칸과 자기 돌을 따라 퍼져 확실히 산 자기 돌에 닿는가(상대 세력 빈칸·상대 돌에서 멈춤)"""
    seen, st = set(region), list(region)
    while st:
        p = st.pop()
        for q in NB[p]:
            if q in seen or b[q] == -col or (b[q] == 0 and v[q] * col < 0):
                continue
            if b[q] == col and q in strong:
                return True
            seen.add(q)
            st.append(q)
    return False


def eyes(b, col, stones):
    """무리의 눈 수(근사) — col 돌로만 둘러싸인 빈 영역. 1칸 눈은 대각 상대 돌로 가짜 눈 판정, 7칸 이상 영역은 2눈으로 센다"""
    seen, n = set(), 0
    adj = {q for p in stones for q in NB[p] if b[q] == 0}
    for e in adj:
        if e in seen:
            continue
        reg, st, closed = {e}, [e], True
        seen.add(e)
        while st and len(reg) <= 12:
            p = st.pop()
            for q in NB[p]:
                if b[q] == 0 and q not in reg:
                    reg.add(q); seen.add(q); st.append(q)
                elif b[q] == -col:
                    closed = False
        if not closed or len(reg) > 12:
            continue
        if len(reg) >= 7:
            n += 2
        elif len(reg) == 1:
            p = next(iter(reg))
            bad = sum(1 for q in DG[p] if b[q] == -col)
            edge = len(DG[p]) < 4
            n += 0 if (bad >= 1 if edge else bad >= 2) else 1
        else:
            n += 1
    return n


def own_space(b, v, col, stones):
    """무리에 닿은 자기 세력 빈칸(Bouzy 값 부호 = 자기 색) — 그 빈칸들을 따라 이어진 칸 수(집 공간)"""
    seen = set()
    st = [q for p in stones for q in NB[p] if b[q] == 0 and v[q] * col > 0]
    seen.update(st)
    while st:
        p = st.pop()
        for q in NB[p]:
            if q not in seen and b[q] == 0 and v[q] * col > 0:
                seen.add(q)
                st.append(q)
    return len(seen)


SPACE_ALIVE = 7  # 집 공간이 이 칸 이상이면 삶으로 본다(제거 시험 생략)


def life(b, alive_frac=0.3, dead_frac=0.8):
    """사활 — {칸: '삶'|'죽음'|'미정'} (돌 칸만). Benson → 눈 2+ → 집 공간 SPACE_ALIVE+ → 무리 제거 시험"""
    status = {}
    safe = benson(b, 1) | benson(b, -1)
    v_all = bouzy(b)
    drs = dragons(b)
    strong = set()  # 확실히 산 돌(Benson·2눈·넓은 집 공간)
    weak = []
    for col, stones in drs:
        if stones & safe or eyes(b, col, stones) >= 2 or own_space(b, v_all, col, stones) >= SPACE_ALIVE:
            strong |= stones
        else:
            weak.append((col, stones))
    for p in strong:
        status[p] = "삶"
    for col, stones in weak:
        st = enclosed_status(b, col, stones, v_all, strong)
        for p in stones:
            status[p] = st
    return status


WHY = []  # 디버그 — 미정 사유(무리 돌 수, …). DEBUG 일 때만 쌓는다(상주 프로세스에서 무한히 늘지 않게)
DEBUG = False
ENCLOSE_MAX = 12  # 갇힌 영역의 자기 세력 빈칸이 이보다 많으면 삶
BREATH_MAX = 6    # 갇힌 영역에 닿은 중립 빈칸(숨 쉴 곳)이 이보다 많으면 미정 — 억지로 죽이지 않는다


def enclosed_status(b, col, stones, v=None, strong=frozenset()):
    """갇힘 판정 — 무리에서 자기 돌·자기 세력 빈칸(Bouzy 부호 = 자기 색)을 따라 퍼진 영역.
    자기 세력 빈칸 > ENCLOSE_MAX → 삶 / 눈 2+ → 삶 / 닿은 중립 빈칸 > BREATH_MAX → 미정 /
    둘러싼 상대 덩어리 중 활로가 우리 쪽 이하인 것(수상전) → 미정 / 그 밖 → 죽음"""
    if v is None:
        v = bouzy(b)
    seen, st, own_e, neutral = set(stones), list(stones), 0, set()
    border = set()
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
                    return "삶"
            st.append(q)
    mine = {p for p in seen if b[p] == col}
    if eyes(b, col, mine) >= 2:
        return "삶"
    if len(neutral) > BREATH_MAX and reaches_strong(b, col, seen, v, strong):  # 중립 빈칸을 따라 확실히 산 자기 무리에 닿으면 이어질 수 있다
        if DEBUG:
            WHY.append(("숨", len(stones), len(neutral)))
        return "미정"
    my_libs = {q for p in mine for q in NB[p] if b[q] == 0}
    done = set()
    for q in border:
        if q in done:
            continue
        s, libs = block(b, q)
        done |= s
        if s & strong:  # 확실히 산 상대 무리 — 수상전 상대가 아니다
            continue
        if len(libs) <= len(my_libs):
            if DEBUG:
                WHY.append(("수상전", len(stones), len(s), len(libs), len(my_libs)))
            return "미정"
    return "죽음"


def quadrant(cells):
    xs = [c % SIZE for c in cells]
    ys = [c // SIZE for c in cells]
    x, y = sum(xs) / len(xs), sum(ys) / len(ys)
    h = "좌" if x < 6 else "우" if x > 12 else ""
    v = "상" if y < 6 else "하" if y > 12 else ""
    return (h + v) if (h and v) else (h + "변") if h else (v + "변") if v else "중앙"  # 좌하·우상 / 좌변 / 하변 / 중앙


def evaluate_core(b, caps, dead, komi, dil=5, ero=21):
    """사석을 들어낸 집 차만(흑 기준)"""
    nb = b[:]
    pris = {1: caps[1], -1: caps[-1]}
    for p in set(dead):
        if nb[p]:
            pris[-nb[p]] += 1
            nb[p] = 0
    v = bouzy(nb, dil, ero)
    tb = sum(1 for i in range(N) if not nb[i] and v[i] > 0)
    tw = sum(1 for i in range(N) if not nb[i] and v[i] < 0)
    return tb + pris[1] - tw - pris[-1] - komi


def evaluate(moves, setup=(), komi=6.5, dil=5, ero=21, use_life=True):
    """국면 평가 → dict(lead: 흑 기준 집 차, own: 361 칸 소유(1·-1·0), dead: 사석 칸, undecided: 미정 칸, terrB·terrW·prisB·prisW)"""
    b, caps = replay(moves, setup)
    if use_life in ("staged", "staged2"):  # 단계식 사활(lifestage.py) — {칸: (판정, 단계)}. staged = 1차(①②③⑥), staged2 = +④⑤ 국지 탐색·세키
        from lifestage import life_staged
        stg = life_staged(b, search=use_life == "staged2")
        st = {p: r[0] for p, r in stg.items()}
    else:
        stg = None
        st = life(b) if use_life else {}
    dead = [p for p, s in st.items() if s == "죽음"]
    und = [p for p, s in st.items() if s == "미정"]
    kos = [p for p, s in st.items() if s == "패"]
    nb = b[:]
    pris = {1: caps[1], -1: caps[-1]}
    for p in dead:
        pris[-nb[p]] += 1
        nb[p] = 0
    v = bouzy(nb, dil, ero)
    own = [0] * N
    terr = {1: 0, -1: 0}
    for i in range(N):
        if nb[i]:
            own[i] = nb[i]
        elif v[i] > 0:
            own[i] = 1; terr[1] += 1
        elif v[i] < 0:
            own[i] = -1; terr[-1] += 1
    lead = terr[1] + pris[1] - terr[-1] - pris[-1] - komi
    # 미정 무리 반영값 — 미정 돌 하나 = 죽으면 상대 +2(포로 1 + 집 1), 살면 0 → 기대값 절반 = 1집씩 상대 쪽
    lead_mid = lead - sum(b[p] for p in und)
    # 패 — 검출·표시만(형세 계산에선 중립 = 들어내지 않는다). 걸린 크기·범위는 쓰지 않는다(작가님 21:08 범위 축소)
    ko_list = []
    if use_life in ("staged", "staged2"):
        seen = set()
        for p in kos:
            if p in seen:
                continue
            grp, _ = block(b, p)
            seen |= grp
            ko_list.append({"cells": sorted(grp), "where": quadrant(grp), "kind": "사활 패"})
        from lifestage import active_ko
        ak = active_ko(moves, setup)
        if ak:
            ko_list.append({"cells": list(ak), "where": quadrant(ak), "kind": "진행 중 패"})
    who = lambda x: f"흑 {x:.1f}집" if x > 0 else f"백 {-x:.1f}집" if x < 0 else "반반"
    text = who(lead) + "".join(f" · {k['where']} 패" for k in ko_list)
    return {"lead": lead, "leadMid": lead_mid, "stages": stg, "ko": ko_list, "text": text, "own": own, "dead": dead, "undecided": und, "terrB": terr[1], "terrW": terr[-1], "prisB": pris[1], "prisW": pris[-1]}


if __name__ == "__main__":  # 속도 시험: python3 -I codeeval.py
    import random
    import time
    random.seed(1)
    mv, b = [], [0] * N
    cols = "BW"
    for k in range(200):
        empt = [i for i in range(N) if b[i] == 0]
        i = random.choice(empt)
        mv.append((cols[k % 2], f"{COLS[i % SIZE]}{SIZE - i // SIZE}"))
        b, _ = replay(mv)
    t0 = time.time(); r = evaluate(mv, use_life=False); t1 = time.time(); r2 = evaluate(mv); t2 = time.time()
    print(f"세력만 {1000 * (t1 - t0):.1f}ms · 사활 포함 {1000 * (t2 - t1):.1f}ms · lead {r2['lead']:+.1f} 사석 {len(r2['dead'])} 미정 {len(r2['undecided'])}")
