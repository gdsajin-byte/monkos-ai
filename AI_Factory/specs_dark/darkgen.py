#!/usr/bin/env python3
"""다크 값 생성 (ORDER_20261105 SPECS_다크테마 커밋2) — :root 색 변수의 다크 값을 시안 토큰표로 매핑.

시안 토큰(DESIGN_20261105_dsn_SPECS_다크테마_시안.html 하단표):
  페이지 #14131a · 면 #1d1c26 · 제목 #f1f0f6 · 본문 #d3d0de · 보조 #a9a5bd · 링크 #b3a5ff · 버튼 #9d8bff/글자 #1a1033
  요약 박스 #2a2640 · 구분선 #34313f · 칩 면 #262432 / 글자 #c9c5d8 · 공식 칩 #6fd3a6/#16281f · 보류 #f0b866/#33270f
규칙: 쓰임새(bg·fg·bd·sh·ot) × 원색의 밝기·색조. 매핑 못 한 변수가 있으면 실패(누락 방지).
사용: darkgen.py <css> → 표준출력 = 다크 :root 선언 줄들, 표준에러 = 매핑표
"""
import colorsys, re, sys

PAGE, SURF, SURF2, TINT = "#14131a", "#1d1c26", "#262432", "#2a2640"
TITLE, BODY, MUTED, LINK, BTN, ONBTN = "#f1f0f6", "#d3d0de", "#a9a5bd", "#b3a5ff", "#9d8bff", "#1a1033"
LINE, GREEN, GREEN_BG, AMBER, AMBER_BG, RED, RED_BG, BLUE = "#34313f", "#6fd3a6", "#16281f", "#f0b866", "#33270f", "#ff8a8a", "#3a1f26", "#8ab4f8"


def parse(lit):
    l = lit.strip().lower()
    if l.startswith("#"):
        h = l[1:]
        if len(h) == 3: h = "".join(c * 2 for c in h)
        return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0
    n = [float(x) for x in re.findall(r"[\d.]+", l)]
    return int(n[0]), int(n[1]), int(n[2]), (n[3] if len(n) > 3 else 1.0)


def hue_class(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    if s < 0.12 or l > 0.97 or l < 0.06: return "gray"
    deg = h * 360
    if deg < 20 or deg >= 340: return "red"
    if deg < 55: return "amber"
    if deg < 170: return "green"
    if deg < 230: return "blue"
    return "purple"


def lum(r, g, b):
    f = lambda c: (c / 255 / 12.92) if c / 255 <= 0.03928 else ((c / 255 + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def rgba(r, g, b, a): return f"rgba({r},{g},{b},{round(min(a, 1), 3)})"


# 규칙으로 안 맞는 개별 값(쓰임새, 소문자 리터럴) → 다크 값. 근거는 주석.
EXPLICIT = {
    ("bg", "#17151f"): "#17151f",   # .ip-card-t2 어두운 프리미엄 카드 — 다크에서도 그대로(테두리로 구분)
    ("bd", "#17151f"): "#4a4658",
    ("fg", "#17151f"): TITLE,
    ("fg", "#2d2a3a"): TITLE,       # 요약 박스 글자(.v2-uc-answer) — 시안: 요약 박스 위 제목색
    ("fg", "#b4afc6"): MUTED,       # 보조 회보라
    ("fg", "#9c93c4"): MUTED,
    ("fg", "#efedf6"): "#efedf6",   # 어두운 T2 카드 위 밝은 글자 — 그대로
    ("fg", "#c9bbff"): "#c9bbff",
    ("bg", "#5a3de6"): LINK,        # 채움 버튼 hover — 기본(#9d8bff)보다 밝게
    ("bg", "#333"): BODY,           # 검정 버튼 hover
}


def dark(kind, lit):
    r, g, b, a = parse(lit)
    hc, L = hue_class(r, g, b), lum(r, g, b)
    if (kind, lit.strip().lower()) in EXPLICIT: return EXPLICIT[(kind, lit.strip().lower())]
    if a < 1 and (r, g, b) in ((26, 26, 46), (23, 21, 31)): return lit   # 사진 위 딤·짙은 그림자 — 그대로
    if a < 1:  # 반투명 — 색 계열 유지, 어두운 바탕에서 보이게 알파 상향
        if (r, g, b) == (0, 0, 0):
            return {"bg": rgba(255, 255, 255, a * 2) if a < 0.2 else lit, "bd": rgba(255, 255, 255, a + 0.08),
                    "sh": rgba(0, 0, 0, max(a, min(a * 3, 0.45))), "fg": rgba(255, 255, 255, a), "ot": lit}[kind]
        if hc == "purple": return lit if a >= 0.8 or kind in ("sh", "ot") else rgba(157, 139, 255, a * 1.8)
        if hc == "red": return rgba(248, 113, 113, a * 1.8)
        if hc == "green": return rgba(74, 222, 128, a * 1.6)
        if hc == "amber": return rgba(251, 191, 36, a * 1.6)
        return lit  # (26,26,46)·(23,21,31) 등 사진 위 딤·그림자 — 그대로
    if kind in ("ot",): return lit                     # 화각 프레임(사진 위) — 그대로
    if kind == "bg":
        if L > 0.8:
            if hc == "purple": return TINT
            if hc == "green": return GREEN_BG
            if hc == "red": return RED_BG
            if hc == "amber": return AMBER_BG
            return SURF if (r, g, b) == (255, 255, 255) or L > 0.93 else SURF2
        if hc == "purple": return BTN if L < 0.2 else LINK
        if hc == "green": return lit                     # 성공 채움(#22c55e 등)
        if L < 0.05: return TITLE if (r, g, b) == (0x1a, 0x1a, 0x1a) else lit  # 검정 채움 버튼만 밝게 뒤집고, 원래 어두운 면(허브 히어로·T2 카드)은 그대로
        return BODY
    if kind == "fg":
        if (r, g, b) == (255, 255, 255): return ONBTN     # 채움 버튼 위 글자 — 사진·초록·T2 카드 예외는 수동 규칙
        if hc == "purple": return LINK
        if hc == "green": return GREEN
        if hc == "red": return RED
        if hc == "amber": return AMBER
        if hc == "blue": return BLUE
        if L < 0.03: return TITLE
        if L < 0.15: return BODY
        return MUTED
    if kind == "bd":
        if (r, g, b) == (255, 255, 255): return lit       # 사진 위 흰 키
        if hc == "purple": return BTN if L < 0.3 else LINE
        if hc == "green": return lit if L < 0.5 else "#2c4a3c"
        if hc == "red": return RED
        if L < 0.05: return "#4a4658"
        return LINE
    if kind == "sh": return lit
    raise ValueError(kind)


src = open(sys.argv[1], encoding="utf-8").read()
root = re.search(r":root \{\n(.*?)\n\}", src, re.S)
defs = re.findall(r"  (--[\w-]+): ([^;]+);", root.group(1))
lines, table = [], []
for name, lit in defs:
    k = name.split("-")[3]
    # 허브(specs-base)의 흰 글자는 사진 카드·어두운 띠 위 — 그대로. 채움 버튼 2곳은 수동 규칙(.specs-hero-cta·.specs-cta-btn)
    d = lit if name in ("--sb-fg-fff", "--sb-fg-ffffff") else dark(k, lit)
    if d is None: sys.exit(f"❌ darkgen: 매핑 없음 {name}")
    lines.append(f"    {name}: {d};")
    table.append(f"{name}\t{lit}\t{d}")
print("\n".join(lines))
print("\n".join(table), file=sys.stderr)
