#!/usr/bin/env python3
"""specs CSS 색 변수화 (ORDER_20261105 SPECS_다크테마 커밋1 — 라이트 화면 불변).

선언(prop: value) 안의 색 리터럴을 쓰임새별 변수 var(--sf-{kind}-{token})로 바꾸고, 라이트 값 = 원 리터럴 그대로를 :root 블록으로 붙인다.
kind: bg(background·fill) / fg(color) / bd(border·outline) / sh(shadow) / ot(그 밖).
같은 리터럴도 쓰임새가 다르면 다른 변수 — 다크에서 면과 글자를 따로 매핑하기 위해서.
라이트 값을 원 문자열 그대로 두므로 계산값·픽셀이 바뀌지 않는다(캡처 비교로 별도 증명).
사용: varify.py <in.css> <prefix>  → 표준출력에 새 CSS, 표준에러에 변수 수
"""
import re, sys

src = open(sys.argv[1], encoding="utf-8").read()
prefix = sys.argv[2]  # 'sf'(funnel) / 'sb'(base)
COLOR = re.compile(r"#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\([^()]*\)")
DECL = re.compile(r"(?<![\w-])([a-z-]+)(\s*:\s*)([^;{}]+)")


def kind(prop):
    if "shadow" in prop: return "sh"
    if prop.startswith("background") or prop in ("fill",): return "bg"
    if prop == "color": return "fg"
    if prop.startswith("border") or prop.startswith("outline"): return "bd"
    return "ot"


def token(lit):
    l = lit.lower()
    if l.startswith("#"): return l[1:]
    nums = re.findall(r"[\d.]+", l)
    return ("rgba-" if l.startswith("rgba") else "rgb-") + "-".join(n.replace(".", "p") for n in nums)


defs = {}


def repl_decl(m):
    prop, sep, val = m.group(1), m.group(2), m.group(3)
    if prop.startswith("--") or "var(--" in val and not COLOR.search(val):
        return m.group(0)
    k = kind(prop)

    def rc(cm):
        lit = cm.group(0)
        name = f"--{prefix}-{k}-{token(lit)}"
        defs[name] = lit
        return f"var({name})"
    return prop + sep + COLOR.sub(rc, val)


# @import 줄·주석은 건드리지 않는다
out_lines, in_comment = [], False
body = DECL.sub(repl_decl, re.sub(r"/\*.*?\*/", lambda c: c.group(0).replace(":", "\0COLON\0"), src, flags=re.S))
body = body.replace("\0COLON\0", ":")
root = "/* 색 변수 (다크 테마 커밋1 — 라이트 값 = 원 리터럴 그대로, 화면 불변). 다크 값은 파일 끝 @media (prefers-color-scheme: dark) */\n:root {\n" + \
    "".join(f"  {n}: {v};\n" for n, v in sorted(defs.items())) + "}\n"
# :root는 @import 줄들 뒤에 둔다(@import는 맨 앞이어야 함)
lines = body.split("\n")
idx = max([i for i, l in enumerate(lines) if l.startswith("@import")], default=0) + 1
print("\n".join(lines[:idx] + [root.rstrip("\n")] + lines[idx:]), end="")
print(f"{sys.argv[1]}: 변수 {len(defs)}개 · 원 리터럴 {len(set(defs.values()))}종", file=sys.stderr)
