"""사활 판정 디버그 — 판 출력(X 흑·O 백, 소문자 = 코드 사석, ? = 미정, 대문자 = 삶, *= b18 사석) 사용: debug_board.py <truth.jsonl> <방 끝 4자>"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402

r = next(json.loads(l) for l in open(sys.argv[1], encoding="utf-8") if json.loads(l).get("final") and json.loads(l)["game"].endswith(sys.argv[2]))
b, caps = ce.replay([tuple(m) for m in r["moves"]], r["setup"])
st = ce.life(b)
bd = {y * 19 + x for x, y in r["dead"]}
v = ce.bouzy(b)
for y in range(19):
    row = ""
    for x in range(19):
        i = y * 19 + x
        c = b[i]
        if c == 0:
            row += "+" if v[i] > 0 else "-" if v[i] < 0 else "."
        else:
            s = st.get(i)
            ch = "X" if c == 1 else "O"
            ch = ch.lower() if s == "죽음" else "?" if s == "미정" else ch
            row += ch
        row += "*" if i in bd else " "
    print(f"{19 - y:2} {row}")
print("코드 사석", sum(1 for s in st.values() if s == "죽음"), "미정", sum(1 for s in st.values() if s == "미정"), "b18 사석", len(bd))
for col, stones in ce.dragons(b):
    if stones & bd:
        print("b18 사석 무리", "흑" if col == 1 else "백", len(stones), "돌 / b18 사석", len(stones & bd), "· 눈", ce.eyes(b, col, stones),
              "· 집 공간", ce.own_space(b, v, col, stones), "· 판정", ce.enclosed_status(b, col, stones, v))
    s = {st.get(p) for p in stones}
    if "죽음" in s and not (stones & bd):
        print("헛짚음 무리", "흑" if col == 1 else "백", len(stones), "돌 · 눈", ce.eyes(b, col, stones), "· 집 공간", ce.own_space(b, v, col, stones))
