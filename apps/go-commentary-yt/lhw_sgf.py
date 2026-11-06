#!/usr/bin/env python3
"""판독 실전 수순 ↔ 기보(SGF) 대조 → 실제 수 번호 (PF_GO, 11-07 막내2, 무료·로컬)
  lhw_sgf.py align 폴더 기보.sgf   → 폴더/sgf_align.json {offset, agree, n, ok}  (offset = 영상 첫 국면까지 기보 수 수)
  lhw_sgf.py export 폴더 out.sgf   → 판독 실전 수순을 SGF로 (빈 판에서 시작한 영상만 — 첫 국면 돌 0)
  lhw_sgf.py selftest 폴더         → export 기보로 양성(offset 0·k) · 음성(다른 영상) 대조
대조: 기보를 한 수씩 놓아(따냄 포함) 국면이 영상 첫 국면(361자)과 같아지는 수 k를 찾고, 그 뒤 영상 실전 수(점·색)가 기보 k+1… 과 맞는 비율을 잰다.
실제 수 번호 = offset + 영상 수 번호(lhw_events의 mv). 기보가 없으면 lhw_pair가 '빈 판 시작 = 정확 / 중반 시작 = 돌 수 하한'으로 표기한다.
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from lhw_events import replay  # noqa: E402

COL = "ABCDEFGHJKLMNOPQRST"


def kof(s):
    return (19 - int(s[1:])) * 19 + COL.index(s[0])


def sgf_moves(text):
    out = []
    for c, xy in re.findall(r";\s*([BW])\[([a-s]{2}|)\]", text):
        if xy:
            out.append((ord(xy[1]) - 97) * 19 + (ord(xy[0]) - 97))
            out[-1] = (out[-1], "b" if c == "B" else "w")
    return [m for m in out if isinstance(m, tuple)]


def start_pos(d):
    st = [s for s in json.loads((Path(d) / "states.json").read_text()) if s["vis"]]
    ev = json.loads((Path(d) / "events.json").read_text())
    pre = [m for m in ev["main"] if m["how"] == "prepend"]
    g = st[0]["g"].lower()  # 영상 첫 판 = 실전 0수 국면(앞붙임 수가 있으면 그만큼 뺀 국면이 -n수)
    return g, ev


def align_moves(P0, video_moves, sg):
    """P0(361자)가 되는 기보 수 k → (k, 일치 수, 대조 수). 없으면 None."""
    b = "." * 361
    for k in range(len(sg) + 1):
        if b == P0:
            n = min(len(video_moves), len(sg) - k)
            agree = sum(1 for i in range(n) if video_moves[i] == sg[k + i])
            return k, agree, n
        if k < len(sg):
            b = replay(b, [sg[k]])
    return None


def video_main(ev):
    return [(kof(m["s"][1:]), "b" if m["s"][0] == "흑" else "w") for m in ev["main"] if m["no"] >= 1]


def align(d, sgf):
    P0, ev = start_pos(d)
    r = align_moves(P0, video_main(ev), sgf_moves(Path(sgf).read_text()))
    out = {"sgf": str(sgf), "ok": False} if r is None else {"sgf": str(sgf), "offset": r[0], "agree": r[1], "n": r[2], "ok": r[2] > 0 and r[1] / r[2] >= 0.9}
    (Path(d) / "sgf_align.json").write_text(json.dumps(out, ensure_ascii=False))
    print(out)
    return out


def export(d, out):
    P0, ev = start_pos(d)
    assert P0 == "." * 361, "빈 판에서 시작한 영상만 내보낸다"
    mv = video_main(ev)
    body = "".join(f";{'B' if c == 'b' else 'W'}[{chr(97 + k % 19)}{chr(97 + k // 19)}]" for k, c in mv)
    Path(out).write_text(f"(;GM[1]FF[4]SZ[19]PC[lhw_sgf export {Path(d).name}]{body})")
    print("수", len(mv), "→", out)


def selftest(d, other):
    tmp = Path(d) / "_selftest.sgf"
    export(d, tmp)
    _, ev = start_pos(d)
    sg = sgf_moves(tmp.read_text()); vm = video_main(ev)
    r0 = align_moves("." * 361, vm, sg)
    k = 50
    r50 = align_moves(replay("." * 361, sg[:k]), vm[k:], sg)
    P0o, evo = start_pos(other)
    rneg = align_moves(P0o, video_main(evo), sg)
    print("양성 offset 0:", r0, "/ 양성 50수 뒤 시작:", r50, "/ 음성(다른 영상):", rneg)
    return r0, r50, rneg


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "align":
        align(sys.argv[2], sys.argv[3])
    elif cmd == "export":
        export(sys.argv[2], sys.argv[3])
    else:
        selftest(sys.argv[2], sys.argv[3])
