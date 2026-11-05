"""모양·수 이름 판정 (사전 (가)층) — 착수 좌표와 주변 돌 배치만으로 결정적 판정. KataGo 불요.

  shapes(board, color, p, prev=None) → [{"id", "name", "detail"}]
    board: 착수 직전 Board, color: 'B'|'W', p: (x, y), prev: 직전 상대 수 (x, y) 또는 None

규칙은 lexicon.yaml shapes[].rule 과 1:1. 테스트: test_shapes.py
"""
from board import Board, neighbors, N

OPP = {"B": "W", "W": "B"}


def inb(q):
    return 0 <= q[0] < N and 0 <= q[1] < N


def diag(p):
    x, y = p
    for dx in (1, -1):
        for dy in (1, -1):
            q = (x + dx, y + dy)
            if inb(q):
                yield q


def gid(board, q):
    """그룹 대표값 (frozenset) — 같은 그룹 판별용."""
    return frozenset(board.group(q)[0])


def libs_after(board, color, p):
    b = board.copy()
    caps = b.play(color, p)
    return b, caps


def ladder_captures(board, attacker, target_stone, depth=0):
    """축 읽기: target 그룹이 단수 상태에서 attacker가 계속 단수로 몰아 잡을 수 있으면 True."""
    if depth > 40:
        return False
    if target_stone not in board.s:
        return True
    g, libs = board.group(target_stone)
    if len(libs) >= 2:
        return False
    if len(g) > 12:
        return False
    defender = OPP[attacker]
    (lib,) = tuple(libs)
    b = board.copy()
    caps = b.play(defender, lib)
    if target_stone not in b.s:
        return True
    g2, libs2 = b.group(target_stone)
    if caps or len(libs2) >= 3:
        return False
    if len(libs2) <= 1:
        return True
    for a in libs2:
        b2 = b.copy()
        b2.play(attacker, a)
        if a not in b2.s:  # 자충
            continue
        _, my_libs = b2.group(a)
        if len(my_libs) <= 1:
            continue
        if target_stone in b2.s and len(b2.group(target_stone)[1]) == 1:
            if ladder_captures(b2, attacker, target_stone, depth + 1):
                return True
    return False


def capturable(board, attacker, stone, depth=0):
    """수비 측이 둘 차례. 어느 활로로 뻗어도 공격 측이 단수→축 또는 다시 활로 2로 몰아 잡으면 True (장문 읽기)."""
    if stone not in board.s:
        return True
    g, libs = board.group(stone)
    if len(g) > 6 or depth > 3:
        return False
    defender = OPP[attacker]
    for l in libs:
        b = board.copy()
        if b.play(defender, l):
            return False  # 뻗으며 따내면 탈출
        if stone not in b.s:
            continue
        g2, libs2 = b.group(stone)
        if len(libs2) >= 4:
            return False
        caught = False
        for a in libs2:
            b2 = b.copy()
            b2.play(attacker, a)
            if a not in b2.s or len(b2.group(a)[1]) <= 1:
                continue
            if stone not in b2.s:
                caught = True
            else:
                n = len(b2.group(stone)[1])
                caught = (n == 1 and ladder_captures(b2, attacker, stone)) or \
                         (n == 2 and capturable(b2, attacker, stone, depth + 1))
            if caught:
                break
        if not caught:
            return False
    return True


def shapes(board, color, p, prev=None):
    out = []
    opp = OPP[color]
    s = board.s
    x, y = p

    def add(i, name, detail=""):
        out.append({"id": i, "name": name, "detail": detail})

    own_adj = [q for q in neighbors(p) if s.get(q) == color]
    opp_adj = [q for q in neighbors(p) if s.get(q) == opp]
    own_groups = {gid(board, q) for q in own_adj}
    opp_groups = {gid(board, q) for q in opp_adj}

    # --- 자기 돌과의 기하 관계 (어느 돌에도 붙지 않은 행마) ---
    if not own_adj and not opp_adj:
        rel = []
        for (qx, qy), c in s.items():
            if c != color:
                continue
            d = tuple(sorted((abs(qx - x), abs(qy - y))))
            between = []
            if d == (0, 2):
                between = [((qx + x) // 2, (qy + y) // 2)]
            elif d == (0, 3):
                sx, sy = (qx > x) - (qx < x), (qy > y) - (qy < y)
                between = [(x + sx, y + sy), (x + 2 * sx, y + 2 * sy)]
            empty_between = all(b not in s for b in between)
            if d == (0, 2) and empty_between:
                rel.append(("one_space", "한칸뛰기", (qx, qy)))
            elif d == (0, 3) and empty_between:
                rel.append(("two_space", "두칸뛰기", (qx, qy)))
            elif d == (1, 2):
                rel.append(("knight", "날일자", (qx, qy)))
            elif d == (1, 3):
                rel.append(("large_knight", "눈목자", (qx, qy)))
            elif d == (1, 1):
                shared = [(x, qy), (qx, y)]
                if all(q not in s for q in shared):
                    rel.append(("diagonal", "마늘모", (qx, qy)))
        # 행마 이름은 가장 가까운 자기 돌 기준 1개만 (가까운 관계 우선)
        order = ["diagonal", "one_space", "knight", "two_space", "large_knight"]
        if rel:
            i, name, q = min(rel, key=lambda r: order.index(r[0]))
            add(i, name, f"기준 돌 {q}")

    # --- 접촉 수 ---
    if opp_adj and not own_adj:
        add("attach", "붙이기")
    if len(own_groups) >= 2:
        add("connect", "이음", f"자기 그룹 {len(own_groups)}개 연결")
    if len(opp_groups) >= 2:
        add("cut", "끊기", f"상대 그룹 {len(opp_groups)}개 사이")

    # 젖히기: 대각 자기 돌 q, p·q 공통 이웃에 상대 돌
    for q in diag(p):
        if s.get(q) == color:
            shared = [(x, q[1]), (q[0], y)]
            if any(s.get(r) == opp for r in shared) and any(r not in s for r in shared):
                add("hane", "젖히기")
                break

    # 치받기: 자기 돌 q - p - 상대 돌 o 가 일직선 (머리를 맞부딪침)
    for q in own_adj:
        o = (2 * x - q[0], 2 * y - q[1])
        if inb(o) and s.get(o) == opp:
            add("bump", "치받기")
            break

    # 꼬부리기: 자기 돌 q에서 꺾어 돎 — q의 자기 이웃 r이 p-q와 수직, p가 상대 돌에 닿음
    if opp_adj:
        for q in own_adj:
            dx, dy = x - q[0], y - q[1]
            for r in neighbors(q):
                if s.get(r) == color and (r[0] - q[0], r[1] - q[1]) not in ((dx, dy), (-dx, -dy)):
                    add("turn", "꼬부리기")
                    break
            else:
                continue
            break

    # 호구: p와 붙은 빈 점 e의 네 이웃 중 3개가 자기 돌(p 포함)
    for e in neighbors(p):
        if e in s:
            continue
        cnt = sum(1 for r in neighbors(e) if s.get(r) == color or r == p)
        if cnt >= 3 and len(list(neighbors(e))) == 4:
            add("tiger", "호구", f"빈 점 {e}")
            break

    # 쌍립: 착점 p와 붙은 자기 돌 q(한 쌍) + 한 줄 건너 평행한 자기 돌 두 점(다른 쌍), 가운데 두 점은 빈 점
    #   X . X      p·q가 한 쌍, p+2e·q+2e가 다른 쌍(e = p→q와 수직인 단위 방향), p+e·q+e 빈 점
    #   X . X      → 가운데 하나를 상대가 두면 다른 하나로 이어 끊기지 않는다
    for q in own_adj:
        d = (q[0] - x, q[1] - y)
        for e in ((d[1], d[0]), (-d[1], -d[0])):
            p2, q2 = (x + 2 * e[0], y + 2 * e[1]), (q[0] + 2 * e[0], q[1] + 2 * e[1])
            m1, m2 = (x + e[0], y + e[1]), (q[0] + e[0], q[1] + e[1])
            if all(inb(r) for r in (p2, q2)) and s.get(p2) == color and s.get(q2) == color and m1 not in s and m2 not in s:
                add("twin", "쌍립", f"맞은편 {p2}·{q2}")
                break
        else:
            continue
        break

    # 두점머리: 상대 돌 두 점이 일렬, p가 그 연장선의 머리
    for o in opp_adj:
        o2 = (2 * o[0] - x, 2 * o[1] - y)
        o3 = (3 * o[0] - 2 * x, 3 * o[1] - 2 * y)
        if inb(o2) and s.get(o2) == opp and not (inb(o3) and s.get(o3) == opp):
            add("two_head", "두점머리")
            break

    # --- 착수 후 결과로 보는 수 ---
    b, caps = libs_after(board, color, p)
    if p not in b.s:
        return out  # 자충(자살수)
    my_g, my_libs = b.group(p)
    if len(caps) == 1:
        c0 = caps[0]
        if all(b.s.get(r) == color for r in neighbors(c0)) and len(list(neighbors(c0))) == 4:
            add("ponnuki", "빵따냄")
        else:
            add("capture", "따냄", "1점")
    elif caps:
        add("capture", "따냄", f"{len(caps)}점")

    ataris = []
    for o in {q for q in neighbors(p) if b.s.get(q) == opp}:
        g, libs = b.group(o)
        if len(libs) == 1:
            ataris.append((o, g, libs))
    seen_g = set()
    for o, g, libs in ataris:
        key = frozenset(g)
        if key in seen_g:
            continue
        seen_g.add(key)
        add("atari", "단수", f"상대 {len(g)}점")
        # 촉촉수: 상대가 이어도(활로에 둬도) 여전히 단수
        (lib,) = tuple(libs)
        b2 = b.copy()
        b2.play(opp, lib)
        if lib in b2.s and len(b2.group(lib)[1]) == 1 and len(b2.group(lib)[0]) >= 2:
            add("connect_die", "촉촉수")
        # 축: 상대가 뻗어도 계속 단수로 몰려 잡힘 (2선 이상에서만 의미)
        elif ladder_captures(b, color, o) and len(g) <= 3:
            add("ladder", "축", f"상대 {len(g)}점")

    # 먹여치기 / 환격: 자기 돌 1점이 단수 상태로 상대 진영에 들어감
    if len(my_g) == 1 and len(my_libs) == 1 and opp_adj:
        (lib,) = tuple(my_libs)
        b3 = b.copy()
        b3.play(opp, lib)
        if p not in b3.s and lib in b3.s:
            g3, l3 = b3.group(lib)
            if len(l3) == 1 and len(g3) >= 2:
                add("snapback", "환격")
            else:
                add("throw_in", "먹여치기")
        else:
            add("throw_in", "먹여치기")

    # 장문: 붙지 않은 수로 상대 그룹(≤3점)을 활로 2로 묶고, 어느 활로로 뻗어도 2 이하
    if not opp_adj:
        for q in diag(p):
            if b.s.get(q) != opp:
                continue
            g, libs = b.group(q)
            if len(g) > 3 or len(libs) != 2:
                continue
            if capturable(b, color, q):
                add("net", "장문", f"상대 {len(g)}점")
                break
    return suppress(out)


# 더 구체적인 이름이 있으면 일반 이름은 뗀다 (해설이 한 수에 이름을 남발하지 않게)
SPECIFIC_CONTACT = {"hane", "cut", "atari", "capture", "ponnuki", "bump", "turn", "two_head", "throw_in", "snapback"}
RELATIONS = {"one_space", "two_space", "knight", "large_knight", "diagonal"}


def suppress(out):
    ids = {o["id"] for o in out}
    drop = set()
    if ids & SPECIFIC_CONTACT:
        drop.add("attach")
    if "tiger" in ids:
        drop |= RELATIONS
    if "snapback" in ids:
        drop |= {"throw_in", "connect_die"}
    if ids & {"ladder", "net", "connect_die", "snapback", "ponnuki"}:
        drop |= {"atari", "capture"} - ({"capture"} if "ponnuki" not in ids else set())
    return [o for o in out if o["id"] not in drop]
