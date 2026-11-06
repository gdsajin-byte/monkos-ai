#!/usr/bin/env python3
"""이현욱TV 개인 영상 판 판독 — 720p 1초 프레임 → 점마다 빈·흑·백 + 번호 돌(숫자 획) + 마지막 수 표시(노란 세모) (PF_GO, 11-07 막내2)
  lhw_read.py calib 폴더            → 폴더/calib.json (나무색 판 + 격자선 탐색, board_read.calib 재사용 — 상자는 480p 실측 ×1.5 기본)
  lhw_read.py read  폴더            → 폴더/states.json  [{t, g: 361자 '.bwBW', mk: 마지막 수 점 또는 -1, vis}]
  lhw_read.py overlay 폴더 t…       → 폴더/ov/ov_{t}.png  (판독 결과를 프레임 위에 그린 검수용 — 육안 대조)
board_read.py(바둑TV·480p 범용)와 다른 점: 이현욱 화면 전용 임계값, 노란 세모(마지막 수) 분리, 숫자 획 판정을 돌 색별로 따로.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))


def load(f):
    return np.asarray(Image.open(f).convert("RGB")).astype(np.int16)


def frames(d):
    return sorted((Path(d) / "frames1").glob("f_*.jpg"))


def tsec(f):
    return int(f.stem[2:]) - 1  # fps=1


def calib(d, box=None):
    import board_read
    fd = Path(d) / "frames1"
    res = board_read.calib(str(fd), box)
    (Path(d) / "calib.json").write_text(json.dumps(res))
    return res


def point(im, c, i, j):
    x0, y0, sx, sy = c["x0"], c["y0"], c["sx"], c["sy"]
    return int(round(x0 + i * sx)), int(round(y0 + j * sy))


def classify(im, c):
    """→ (g 361자, mk 마지막 수 점, 나무색 비율). B/W = 숫자가 쓰인 돌."""
    sx = min(c["sx"], c["sy"])
    r = max(3, int(round(sx * 0.27)))
    g, mk, wood = [], -1, 0
    best = 0  # 세모 점수: 노란(흑 위) 우선 — 커서(흰 화살표·남색 테)가 남색으로 잡히는 것 방지(11-07 t=118 실측)
    for j in range(19):
        for i in range(19):
            x, y = point(im, c, i, j)
            # 돌 몸통: 가운데에서 대각 0.27칸 네 점(숫자·격자선·세모 피함)의 중앙값
            pts = np.array([im[y + dy - 1:y + dy + 2, x + dx - 1:x + dx + 2].reshape(-1, 3).mean(axis=0)
                            for dx, dy in ((-r, -r), (r, -r), (-r, r), (r, r))])
            m = np.median(pts, axis=0); gr = m.mean(); sat = m.max() - m.min()
            h = max(3, int(sx * 0.2))
            ctr = im[y - h:y + h + 1, x - h:x + h + 1].reshape(-1, 3)
            cg = ctr.mean(axis=1); csat = ctr.max(axis=1) - ctr.min(axis=1)
            yellow = ((ctr[:, 0] > 180) & (ctr[:, 1] > 150) & (ctr[:, 2] < 90)).sum()
            blue = ((ctr[:, 2] > 60) & (ctr[:, 0] < 70) & (ctr[:, 2] - ctr[:, 0] > 45)).sum()  # 백돌 위 마지막 수 = 남색 세모
            if gr < 95:
                if yellow >= 4 and yellow + 1000 > best:
                    mk, best = j * 19 + i, yellow + 1000
                g.append("B" if (cg[csat < 40] > 150).sum() >= 4 else "b")  # 흑돌 위 흰 숫자
            elif gr > 175 and sat < 50:
                if blue >= 4 and blue > best:
                    mk, best = j * 19 + i, blue
                g.append("W" if (cg[csat < 40] < 150).sum() >= 4 else "w")  # 백돌 위 회색 숫자
            else:
                g.append(".")
                wood += (m[0] - m[2] > 60 and m[0] > 170)
    if mk >= 0 and g[mk] in "BW":
        g[mk] = g[mk].lower()  # 세모 획을 숫자로 읽지 않는다
    n_empty = g.count(".")
    return "".join(g), mk, (wood / n_empty if n_empty else 1.0)


def read(d):
    c = json.loads((Path(d) / "calib.json").read_text())
    out = []
    for f in frames(d):
        gstr, mk, wf = classify(load(f), c)
        out.append({"t": tsec(f), "g": gstr, "mk": mk, "vis": bool(wf > 0.8 and gstr.count(".") > 20)})
    (Path(d) / "states.json").write_text(json.dumps(out))
    v = [s for s in out if s["vis"]]
    print(f"{d}: 프레임 {len(out)} · 판 보임 {len(v)} · 번호 돌 있는 프레임 {sum(1 for s in v if any(ch in 'BW' for ch in s['g']))} · 세모 {sum(1 for s in v if s['mk'] >= 0)}")


def overlay(d, ts):
    c = json.loads((Path(d) / "calib.json").read_text())
    st = {s["t"]: s for s in json.loads((Path(d) / "states.json").read_text())}
    od = Path(d) / "ov"; od.mkdir(exist_ok=True)
    for t in ts:
        f = Path(d) / "frames1" / f"f_{t + 1:05d}.jpg"
        im = Image.open(f).convert("RGB"); dr = ImageDraw.Draw(im)
        s = st[t]
        for k, ch in enumerate(s["g"]):
            x, y = point(None, c, k % 19, k // 19)
            col = {"b": (255, 0, 0), "B": (255, 0, 255), "w": (0, 120, 255), "W": (0, 255, 255)}.get(ch)
            if col:
                dr.rectangle((x - 3, y + 8, x + 3, y + 13), fill=col)
            if k == s["mk"]:
                dr.rectangle((x - 9, y - 9, x + 9, y + 9), outline=(0, 255, 0), width=2)
        b = c["box"]
        im.crop((b[0] - 10, b[1] - 10, b[2] + 10, b[3] + 10)).save(od / f"ov_{t}.png")


if __name__ == "__main__":
    cmd, d = sys.argv[1], sys.argv[2]
    if cmd == "calib":
        calib(d, [int(v) for v in sys.argv[3:7]] if len(sys.argv) > 6 else None)
    elif cmd == "read":
        read(d)
    else:
        overlay(d, [int(v) for v in sys.argv[3:]])
