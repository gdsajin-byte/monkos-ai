#!/usr/bin/env python3
"""판독 정확도 육안 대조 시트 (PF_GO, 11-07 막내2) — 사람이 그림을 보고 틀린 점을 센다.
  lhw_check.py 폴더 points N seed  → check/points_{t}.png  N장 무작위(판 보이는 프레임) — 판독 표시: 빨강=흑 · 파랑=백 · 분홍/하늘=번호 돌 · 초록 네모=마지막 수
  lhw_check.py 폴더 vars N seed    → check/vars_{t}.png    변화도 진행 중 무작위 N초 — 돌 옆 노란 글씨 = 우리가 매긴 번호(화면 숫자와 대조)
  lhw_check.py 폴더 moves N seed   → check/moves.png       실전 수 N개 무작위 — 칸마다 [직전 초 | 그 초] 5×5칸 확대, 빨간 테 = 판독한 착점
"""
import json, random, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
import lhw_read

COL = "ABCDEFGHJKLMNOPQRST"
try:
    FONT = ImageFont.truetype("/System/Library/Fonts/AppleSDGothicNeo.ttc", 16)
except Exception:
    FONT = ImageFont.load_default()


def kof(s):
    return (19 - int(s[1:])) * 19 + COL.index(s[0])


def frame(d, t):
    f = Path(d) / "frames1" / f"f_{t + 1:05d}.jpg"
    if not f.exists():  # 스트리밍 판독 영상(lhw_stream)은 프레임을 남기지 않는다 → 그 초만 영상에서 뽑는다
        import subprocess, imageio_ffmpeg
        f = Path(d) / "check" / f"_f_{t}.jpg"; f.parent.mkdir(exist_ok=True)
        if not f.exists():
            subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-ss", f"{t + 0.5}", "-i", str(Path(d) / "video720.mp4"),
                            "-frames:v", "1", "-vf", "scale=1280:720", "-q:v", "2", str(f)], check=True)
    return Image.open(f).convert("RGB")


def main(d, mode, n, seed):
    d = Path(d); random.seed(seed)
    c = json.loads((d / "calib.json").read_text())
    ev = json.loads((d / "events.json").read_text())
    od = d / "check"; od.mkdir(exist_ok=True)
    xy = lambda k: lhw_read.point(None, c, k % 19, k // 19)
    if mode == "points":
        st = [s["t"] for s in json.loads((d / "states.json").read_text()) if s["vis"]]
        ts = sorted(random.sample(st, n))
        lhw_read.overlay(str(d), ts)
        for t in ts:
            (d / "ov" / f"ov_{t}.png").rename(od / f"points_{t}.png")
        print(ts)
    elif mode == "vars":
        cand = [x["t"] for x in ev["timeline"] if x.get("var")]
        ts = sorted(random.sample(cand, min(n, len(cand))))
        V = {v["id"]: v for v in ev["vars"]}
        for t in ts:
            vid = next(x["var"] for x in ev["timeline"] if x["t"] == t)
            path = []  # 수순 다시 쌓기: 무르기 = 끝에서 빼기, 놓기 = 잇기. 같은 점은 마지막 번호만 그린다(패 되따냄)
            for s in V[vid]["steps"]:
                if s["t"] > t:
                    break
                del path[len(path) - len(s["back"]):]
                path += [a["s"] for a in s["add"]]
            alive = {}
            for nn, s in enumerate(path, 1):
                for kk in [x for x, v in alive.items() if v[1:] == s[1:]]:
                    del alive[kk]
                alive[nn] = s
            im = frame(d, t); dr = ImageDraw.Draw(im)
            for nn, s in alive.items():
                x, y = xy(kof(s[1:]))
                dr.text((x + 9, y - 22), str(nn), fill=(255, 230, 0), font=FONT, stroke_width=2, stroke_fill=(0, 0, 0))
            b = c["box"]
            im.crop((b[0] - 10, b[1] - 10, b[2] + 30, b[3] + 10)).save(od / f"vars_{t}.png")
        print(ts)
    else:
        mv = [m for m in ev["main"] if m["t"] is not None]
        pick = sorted(random.sample(mv, min(n, len(mv))), key=lambda m: m["t"])
        cell = 34; half = 2.5 * cell
        tiles = []
        for m in pick:
            k = kof(m["s"][1:]); x, y = xy(k)
            pair = Image.new("RGB", (int(4 * half) + 6, int(2 * half) + 22), (40, 40, 40))
            for j, tt in enumerate((m["t"] - 1, m["t"])):
                cr = frame(d, tt).crop((int(x - half), int(y - half), int(x + half), int(y + half)))
                if j:
                    ImageDraw.Draw(cr).rectangle((half - 17, half - 17, half + 17, half + 17), outline=(255, 0, 0), width=2)
                pair.paste(cr, (j * (int(2 * half) + 6), 22))
            ImageDraw.Draw(pair).text((4, 2), f"{m['no']}수 {m['s']} {m['t']}s {m['how']}", fill=(255, 255, 0), font=FONT)
            tiles.append(pair)
        W = tiles[0].width; H = tiles[0].height; cols = 4
        sheet = Image.new("RGB", (cols * W + 8 * cols, ((len(tiles) + cols - 1) // cols) * (H + 8)), (0, 0, 0))
        for i, tl in enumerate(tiles):
            sheet.paste(tl, ((i % cols) * (W + 8), (i // cols) * (H + 8)))
        sheet.save(od / "moves.png")
        print([f"{m['no']}{m['s']}@{m['t']}" for m in pick])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
