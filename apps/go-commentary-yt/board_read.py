#!/usr/bin/env python3
"""방송 화면 판 판독 — 판 격자 자동 보정 + 프레임마다 19×19 상태(빈·흑·백·번호 돌) (PF_GO, 11-06 B안 2항, 무료·로컬)
  board_read.py calib 폴더 [x1 y1 x2 y2] → 격자(x0,y0,step) 추정 + 오버레이 이미지 calib.jpg (상자를 주면 그 안에서만 찾는다 — 실물 자석판 등 자동 탐지 실패 시)
  board_read.py read  폴더            → 폴더/board_states.json  (프레임마다 {t, grid: "…361자 .bwBW"} — 대문자 = 번호 돌)
yt_board.py(10-23, 이현욱 480p 고정 기하·개수만)의 후속: 격자를 화면에서 찾고 점마다 상태를 남긴다.
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

STEP_S = 2  # board_fetch.py 프레임 간격(초)


def load(f):
    return np.asarray(Image.open(f).convert("RGB")).astype(np.int16)


def wood_mask(im):
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    return (r > 150) & (r - b > 40) & (g > 110) & (r - g < 90)


def calib(d, box=None):
    fs = sorted(Path(d).glob("f_*.jpg"))
    pick = fs[:: max(1, len(fs) // 12)]
    acc = None
    for f in pick:
        m = wood_mask(load(f)).astype(np.float32)
        acc = m if acc is None else acc + m
    m = acc / len(pick) > 0.5
    ys, xs = np.where(m)
    # 판 = 나무색이 가장 넓게 이어진 사각형: 행·열마다 나무색 비율 0.5↑ 구간
    col = m.mean(axis=0); row = m.mean(axis=1)
    cx = np.where(col > 0.35)[0]; cy = np.where(row > 0.35)[0]
    x_lo, x_hi, y_lo, y_hi = cx.min(), cx.max(), cy.min(), cy.max()
    if box:
        x_lo, y_lo, x_hi, y_hi = box
    im = np.median(np.stack([load(f) for f in pick]), axis=0)
    g = im.mean(axis=2)
    sub = g[y_lo:y_hi, x_lo:x_hi]
    best = None
    w, h = x_hi - x_lo, y_hi - y_lo
    # 격자선 = 어두운 가는 선. 판 안쪽 여백 0~8%, 간격 = (폭-2여백)/18 탐색
    for axis, L, prof in (("x", w, 255 - sub.mean(axis=0)), ("y", h, 255 - sub.mean(axis=1))):
        cand = []
        for st in np.arange(L / 19.6, L / 18.0, 0.05):
            for o in np.arange(0, L - 18 * st, 0.5):
                pos = (o + np.arange(19) * st).round().astype(int)
                if pos[-1] >= L:
                    continue
                cand.append((prof[pos].sum(), o, st))
        sc, o, st = max(cand)
        if axis == "x":
            x0, sx = x_lo + o, st
        else:
            y0, sy = y_lo + o, st
    res = {"x0": float(x0), "y0": float(y0), "sx": float(sx), "sy": float(sy), "box": [int(x_lo), int(y_lo), int(x_hi), int(y_hi)]}
    (Path(d) / "calib.json").write_text(json.dumps(res))
    ov = Image.open(pick[len(pick) // 2]).convert("RGB")
    dr = ImageDraw.Draw(ov)
    for i in range(19):
        dr.line([(x0 + i * sx, y0), (x0 + i * sx, y0 + 18 * sy)], fill=(0, 200, 255))
        dr.line([(x0, y0 + i * sy), (x0 + 18 * sx, y0 + i * sy)], fill=(0, 200, 255))
    ov.save(Path(d) / "calib.jpg")
    print(res)
    return res


def classify(im, c):
    """점마다 . b w B W (B/W = 가운데에 반대색 숫자 획). 판이 화면에 없으면 None."""
    x0, y0, sx, sy = c["x0"], c["y0"], c["sx"], c["sy"]
    r = max(2, int(round(min(sx, sy) * 0.22)))
    out = []
    wood = 0
    for j in range(19):
        for i in range(19):
            x, y = int(round(x0 + i * sx)), int(round(y0 + j * sy))
            # 돌 몸통 = 가운데에서 0.22칸 떨어진 네 점의 중앙값(숫자·격자선·입체 그림자 피함) — 11-06 바둑TV 480p 실측: 백 회색 180~240·채도 ≤60, 흑 <100, 나무 채도 ~90
            pts = np.array([im[y + dy - 1:y + dy + 2, x + dx - 1:x + dx + 2].reshape(-1, 3).mean(axis=0)
                            for dx, dy in ((-r, -r), (r, -r), (-r, r), (r, r))])
            m = np.median(pts, axis=0); gr = m.mean(); sat = m.max() - m.min()
            ctr = im[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3)
            cg = ctr.mean(axis=1); csat = ctr.max(axis=1) - ctr.min(axis=1)
            red = ((ctr[:, 0] > 150) & (ctr[:, 1] < 90) & (ctr[:, 2] < 90)).sum() >= 3  # 바둑TV: 착수·변화도 돌에 빨간 세모
            if gr < 100:
                out.append("B" if red or (cg[csat < 50] > 160).sum() >= 3 else "b")  # 흑돌 위 흰 숫자 획(무채색) 또는 빨간 표시
            elif gr > 180 and sat < 65:
                out.append("W" if red or (cg[csat < 50] < 110).sum() >= 3 else "w")  # 백돌 위 검은 숫자 획 또는 빨간 표시
            else:
                out.append(".")
                wood += (m[0] - m[2] > 40)
    return "".join(out) if wood > 361 * 0.3 * (out.count(".") / 361) else None


def read(d):
    c = json.loads((Path(d) / "calib.json").read_text())
    res = []
    for f in sorted(Path(d).glob("f_*.jpg")):
        t = (int(f.stem[2:]) - 1) * STEP_S
        res.append({"t": t, "grid": classify(load(f), c)})
    (Path(d) / "board_states.json").write_text(json.dumps(res))
    ok = [r for r in res if r["grid"]]
    print(f"{d}: 프레임 {len(res)} · 판 보임 {len(ok)} · 번호 돌 있는 프레임 {sum(1 for r in ok if any(ch in 'BW' for ch in r['grid']))}")


if __name__ == "__main__":
    if sys.argv[1] == "calib":
        calib(sys.argv[2], [int(v) for v in sys.argv[3:7]] if len(sys.argv) > 6 else None)
    else:
        read(sys.argv[2])
