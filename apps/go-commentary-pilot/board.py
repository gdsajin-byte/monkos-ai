"""19줄 바둑판 최소 구현 — 착수·따냄·그룹 탐색, 좌표 변환."""

COLS = "ABCDEFGHJKLMNOPQRST"  # I 제외 (GTP)
N = 19


def ogs_to_gtp(x, y):
    """OGS (x, y) — 좌상단 0 기준. 패스는 -1."""
    if x < 0:
        return "pass"
    return f"{COLS[x]}{N - y}"


def gtp_to_xy(m):
    if m.lower() == "pass":
        return None
    return COLS.index(m[0].upper()), N - int(m[1:])


def neighbors(p):
    x, y = p
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        q = (x + dx, y + dy)
        if 0 <= q[0] < N and 0 <= q[1] < N:
            yield q


class Board:
    def __init__(self):
        self.s = {}  # (x,y) -> 'B'|'W'

    def copy(self):
        b = Board()
        b.s = dict(self.s)
        return b

    def group(self, p):
        c = self.s[p]
        seen, stack, libs = {p}, [p], set()
        while stack:
            q = stack.pop()
            for r in neighbors(q):
                if r not in self.s:
                    libs.add(r)
                elif self.s[r] == c and r not in seen:
                    seen.add(r)
                    stack.append(r)
        return seen, libs

    def play(self, color, p):
        """착수 후 따낸 돌 목록 반환. p=None은 패스."""
        if p is None:
            return []
        self.s[p] = color
        opp = "W" if color == "B" else "B"
        captured = []
        for r in neighbors(p):
            if self.s.get(r) == opp:
                g, libs = self.group(r)
                if not libs:
                    for q in g:
                        del self.s[q]
                    captured += g
        g, libs = self.group(p)
        if not libs:  # 자살수 (규칙상 드묾)
            for q in g:
                del self.s[q]
        return captured

    def groups(self):
        seen, out = set(), []
        for p in self.s:
            if p not in seen:
                g, libs = self.group(p)
                seen |= g
                out.append((self.s[p], g, libs))
        return out


def region(p):
    """좌표 → 영역 이름 (귀·변·중앙). 경계 = 3선 기준 6줄."""
    x, y = p
    h = "좌" if x < 6 else ("우" if x > 12 else "")
    v = "상" if y < 6 else ("하" if y > 12 else "")
    if h and v:
        return f"{h}{v}귀"
    if h:
        return f"{h}변"
    if v:
        return f"{v}변"
    return "중앙"
