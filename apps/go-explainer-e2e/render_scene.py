"""판 단독 해설 영상 — 대본 마커 발화 시각에 맞춰 실전 → 실패도 → (되돌림) → 정해도를 모션그래픽으로. 1080×1920 30fps.
작가님 11-07 04:07 "그냥 바둑판만 나와도 돼. 모션그래픽으로 내용과 흐름만 좋으면 됨." — 얼굴 창·캐릭터 없음.

  python3 -I render_scene.py <script.json> <out_dir>      # out_dir/audio/tracks.json(tts.py 결과) 필요
산출: out_dir/scene.mp4 · sync.json(마커별 발화/표시 시각·오차) · cue.md(수순 설계표 — 실제 발화 시각 기준) · sheet.png(검수 프레임)

마커: <fail:k>·<ok:k> 분기 k수까지(건너뛴 수는 0.3초 간격으로 앞당겨 놓음) · <pos> 장면 국면으로 되돌림(분기 돌이 사라짐)
      <hl:좌표> 그 돌 강조 고리 · <lib:좌표> 그 무리의 활로 점 · <arrow:A,B> 화살표 · <diff> 차이 카드 · <clear> 표시 지움
기보: 대국은 G번호로만 받고 수순은 레포 밖 실수 사전 질의 파일에서 읽는다(레포에 기보 원문 없음).
"""
import json
import math
import os
import subprocess
import sys
import time

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "go-commentary-pilot"))
from board import Board, gtp_to_xy, COLS, N  # noqa: E402

SC = json.load(open(sys.argv[1], encoding="utf-8"))
D = sys.argv[2]
V0 = os.path.expanduser("~/.monkos/go-board/analysis/mistakes_v0")
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
LEAD, TAIL, GAP = 1.2, 2.0, 0.45   # 앞 여백(판 먼저 보기) · 끝 여백 · 대사 사이 숨
STEP_GAP = 0.3                      # 한 마커에 여러 수일 때 수 간격
T_IN, T_OUT, T_REW = 0.22, 0.28, 0.5  # 돌 들어옴 · 따낸 돌 사라짐 · 되돌림
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
t0 = time.time()

# ---- 기보(레포 밖)
meta = [json.loads(x) for x in open(os.path.join(V0, "queries_full.meta.jsonl"), encoding="utf-8")]
gid = meta[int(SC["game"][1:]) - 1]["id"]
MOVES = next(json.loads(x) for x in open(os.path.join(V0, "queries_full.jsonl"), encoding="utf-8") if json.loads(x)["id"] == gid)["moves"]
TURN = SC["turn"]
COLOR0 = MOVES[TURN][0]
BR = SC["branches"]


def opp(c):
    return "W" if c == "B" else "B"


BASE = Board()
for c, m in MOVES[:TURN]:
    BASE.play(c, gtp_to_xy(m) if m.lower() != "pass" else None)
LAST = gtp_to_xy(MOVES[TURN - 1][1])


def branch_boards(seq):
    """k=0..len: (판, 번호표 {xy: k}, 직전 착점)"""
    out = [(BASE.copy(), {}, None)]
    b, c, num = BASE.copy(), COLOR0, {}
    for k, m in enumerate(seq, 1):
        p = gtp_to_xy(m)
        for q in b.play(c, p):
            num.pop(q, None)
        num = dict(num)
        num[p] = k
        out.append((b.copy(), num, p))
        c = opp(c)
    return out


BOARDS = {"fail": branch_boards(BR["fail"]), "ok": branch_boards(BR["ok"])}

# ---- 타임라인
tr = json.load(open(os.path.join(D, "audio", "tracks.json"), encoding="utf-8"))
t, timeline, raw = LEAD, [], []
for ln in tr["lines"]:
    timeline.append({"i": ln["i"], "text": ln["text"], "start": round(t, 3), "end": round(t + ln["dur"], 3), "marks": ln["marks"]})
    for m in ln["marks"]:
        raw.append({"marker": m["marker"], "t": round(t + m["t"], 3), "line": ln["i"], "char": m["char"]})
    t = t + ln["dur"] + GAP
TOTAL = timeline[-1]["end"] + TAIL
NF = math.ceil(TOTAL * FPS)

# 상태 이벤트 펼치기: 분기 k 증가는 한 수씩(건너뛴 수는 마커 시각 앞으로 STEP_GAP 간격)
state_ev = []   # (t, branch, k, kind)  kind: place | rewind
over_ev = []    # (t, kind, arg)
cur = (None, 0)
for e in raw:
    kind, _, arg = e["marker"].partition(":")
    if kind in ("fail", "ok"):
        k = int(arg)
        k0 = cur[1] if cur[0] == kind else 0
        for j in range(k0 + 1, k + 1):
            state_ev.append((round(e["t"] - (k - j) * STEP_GAP, 3), kind, j, "place"))
        cur = (kind, k)
    elif kind == "pos":
        state_ev.append((e["t"], None, 0, "rewind"))
        cur = (None, 0)
    else:
        over_ev.append((e["t"], kind, arg))
state_ev.sort(key=lambda x: x[0])


def state_at(sec):
    """(분기, k, 직전 상태, 전환 시작 시각, 종류)"""
    b, k, prev, ts, kind = None, 0, (None, 0), -9, None
    for (te, br, kk, kd) in state_ev:
        if te > sec:
            break
        prev, ts, kind = (b, k), te, kd
        b, k = br, kk
    return b, k, prev, ts, kind


def overlays_at(sec, st_change):
    """상태가 바뀌면 hl·lib·arrow는 지운다(diff는 유지). 반환 [(kind,arg,시작)]"""
    out = []
    for (te, kd, arg) in over_ev:
        if te > sec:
            break
        if kd == "clear":
            out = []
            continue
        if kd in ("hl", "lib", "arrow"):
            out = [o for o in out if o[0] != kd]
        if kd == "zone":  # 영역은 겹쳐 쌓인다(같은 이름만 교체)
            out = [o for o in out if not (o[0] == "zone" and o[1] == arg)]
        if kd == "diff":  # 차이 카드는 판 아래 꼬리표 자리를 쓴다 — 다른 표시는 지움
            out = []
        out.append((kd, arg, te))
    return [o for o in out if o[0] == "diff" or o[2] >= st_change]


# ---- 판 기하
X0, X1 = COLS.index(SC["box"][0]), COLS.index(SC["box"][1])
Y0, Y1 = N - SC["box"][2], N - SC["box"][3]
BW = 940  # 좌우에 줄 번호 자리
STEP = BW / max(X1 - X0 + 1, Y1 - Y0 + 1)
BX = (W - STEP * (X1 - X0 + 1)) / 2
BY = 300
R = STEP * 0.47
SS = 2  # 슈퍼샘플


def P(xy):
    return BX + (xy[0] - X0 + 0.5) * STEP, BY + (xy[1] - Y0 + 0.5) * STEP


F = {k: ImageFont.truetype(FONT, v * SS) for k, v in {"num": int(STEP * 0.46), "title": 44, "tag": 40, "cap": 46, "small": 30, "diff": 58}.items()}
_BN = SC.get("banners", {})
BANNER = {None: (_BN.get("pos", f"실전 · {TURN + 1}수 국면"), (90, 90, 96)), "fail": (_BN.get("fail", "실패도 — 실전 수 그대로라면"), (196, 52, 40)),
          "ok": (_BN.get("ok", "정해도 — 이렇게 뒀어야"), (40, 112, 200)), "rewind": (_BN.get("rewind", f"{TURN + 1}수 국면으로 되돌림"), (120, 120, 128))}
# 영역 강조(v1, 작가님 감수 1 — 활로 숫자 대신 두터움·약점·귀/변 영역): {"이름": {"rect": ["A1","C4"], "label": "귀", "color": [r,g,b]}}
# "rect" = 사각 영역(귀·변) / "points" = 돌 묶음 강조(두터움·약점 — 상대 돌을 덮지 않게)
ZONES = {k: dict(v, xy=[gtp_to_xy(q) for q in (v.get("rect") or v["points"])]) for k, v in SC.get("zones", {}).items()}


def zone_box(z):
    xs, ys = [q[0] for q in z["xy"]], [q[1] for q in z["xy"]]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    (lx, ty), (rx, by) = P((x0, y0)), P((x1, y1))
    return lx - STEP * 0.5, ty - STEP * 0.5, rx + STEP * 0.5, by + STEP * 0.5


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def draw_frame(sec):
    br, k, prev, ts, kind = state_at(sec)
    cur_b, cur_num, cur_last = BOARDS[br][k] if br else (BASE, {}, LAST)
    pb, pk = prev
    prev_b, prev_num = (BOARDS[pb][pk][0], BOARDS[pb][pk][1]) if pb else (BASE, {})
    dt = sec - ts
    im = Image.new("RGB", (W * SS, H * SS), (22, 24, 30))
    d = ImageDraw.Draw(im)
    s = lambda v: v * SS  # noqa: E731
    # 제목·배너
    d.text((s(W / 2), s(70)), SC["title"], font=F["title"], fill=(236, 236, 236), anchor="mm")
    bk = "rewind" if (kind == "rewind" and dt < 1.6) else br
    text, col = BANNER[bk]
    a = ease(dt / 0.3) if dt < 0.3 else 1
    bw = d.textlength(text, font=F["tag"]) / SS + 60
    d.rounded_rectangle([s(W / 2 - bw / 2), s(140), s(W / 2 + bw / 2), s(212)], s(18),
                        fill=tuple(int(22 + (c - 22) * a) for c in col))
    d.text((s(W / 2), s(176)), text, font=F["tag"], fill=(255, 255, 255), anchor="mm")
    # 판
    gx0, gy0 = BX, BY
    gx1, gy1 = BX + STEP * (X1 - X0 + 1), BY + STEP * (Y1 - Y0 + 1)
    d.rounded_rectangle([s(gx0 - 10), s(gy0 - 10), s(gx1 + 10), s(gy1 + 10)], s(16), fill=(222, 184, 120))
    for x in range(X0, X1 + 1):
        cx = P((x, 0))[0]
        ya = P((0, Y0))[1] - (STEP / 2 if Y0 > 0 else 0)
        yb = P((0, Y1))[1] + (STEP / 2 if Y1 < N - 1 else 0)
        d.line([(s(cx), s(ya)), (s(cx), s(yb))], fill=(60, 44, 24), width=s(4 if x in (0, N - 1) else 2))
        d.text((s(cx), s(gy1 + 34)), COLS[x], font=F["small"], fill=(150, 150, 150), anchor="mm")
    for y in range(Y0, Y1 + 1):
        cy = P((0, y))[1]
        xa = P((X0, 0))[0] - (STEP / 2 if X0 > 0 else 0)
        xb = P((X1, 0))[0] + (STEP / 2 if X1 < N - 1 else 0)
        d.line([(s(xa), s(cy)), (s(xb), s(cy))], fill=(60, 44, 24), width=s(4 if y in (0, N - 1) else 2))
        d.text((s(gx0 - 34), s(cy)), str(N - y), font=F["small"], fill=(150, 150, 150), anchor="mm")
    for hx in (3, 9, 15):
        for hy in (3, 9, 15):
            if X0 <= hx <= X1 and Y0 <= hy <= Y1:
                cx, cy = P((hx, hy))
                d.ellipse([s(cx - 6), s(cy - 6), s(cx + 6), s(cy + 6)], fill=(60, 44, 24))
    # 영역(돌 아래 깔리는 색면)
    ovs = overlays_at(sec, ts if kind else -9)
    zs = [(ZONES[arg], te) for kd, arg, te in ovs if kd == "zone" and arg in ZONES]
    if zs:
        lay = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(lay)
        for z, te in zs:
            a = ease((sec - te) / 0.35)
            x0_, y0_, x1_, y1_ = zone_box(z)
            c = tuple(z.get("color", [255, 200, 60]))
            if "points" in z:
                rr = R * 1.32
                for q in z["xy"]:
                    qx, qy = P(q)
                    ld.ellipse([s(qx - rr), s(qy - rr), s(qx + rr), s(qy + rr)], fill=c + (int(150 * a),))
            else:
                ld.rounded_rectangle([s(x0_), s(y0_), s(x1_), s(y1_)], s(18), fill=c + (int(110 * a),), outline=c + (int(255 * a),), width=s(5))
        im = Image.alpha_composite(im.convert("RGBA"), lay).convert("RGB")
        d = ImageDraw.Draw(im)
    # 돌: 현재 판 + 사라지는 돌(직전 판에만 있는 것)
    trans = T_REW if kind == "rewind" else T_OUT
    stones = []
    for p, c in cur_b.s.items():
        new = p not in prev_b.s or prev_b.s[p] != c
        stones.append((p, c, "in" if (new and dt < T_IN and kind == "place") else "on"))
    if dt < trans:
        for p, c in prev_b.s.items():
            if p not in cur_b.s:
                stones.append((p, c, "out"))
    for p, c, st in stones:
        if not (X0 <= p[0] <= X1 and Y0 <= p[1] <= Y1):
            continue
        cx, cy = P(p)
        sc_, al = 1.0, 1.0
        if st == "in":
            x = ease(dt / T_IN)
            sc_, al = 1.35 - 0.35 * x, x
        elif st == "out":
            al = 1 - dt / trans
        r = R * sc_
        base = (20, 20, 22) if c == "B" else (244, 244, 240)
        board_c = (222, 184, 120)
        fill = tuple(int(bc + (sc - bc) * al) for sc, bc in zip(base, board_c))
        shadow = tuple(int(bc + (sc - bc) * al) for sc, bc in zip((150, 116, 70), board_c))
        d.ellipse([s(cx - r + 3), s(cy - r + 4), s(cx + r + 3), s(cy + r + 4)], fill=shadow)
        d.ellipse([s(cx - r), s(cy - r), s(cx + r), s(cy + r)], fill=fill,
                  outline=tuple(int(bc + (sc - bc) * al) for sc, bc in zip((40, 40, 40), board_c)) if c == "W" else None, width=s(1))
        num = cur_num.get(p) if st != "out" else prev_num.get(p)
        if num is not None and al > 0.4:
            tc = (255, 255, 255) if c == "B" else (20, 20, 20)
            if br == "fail" and num == 1:
                tc = (255, 90, 70)
            # 표기 관례(작가님 11-07 15:22): 기존 돌 그대로, 시작점 = A, 이후 수순 = 1·2·3(돌 위 = 동그라미 번호), 분기마다 다시 시작
            d.text((s(cx), s(cy)), "A" if num == 1 else str(num - 1), font=F["num"], fill=tc, anchor="mm")
    # 직전 착점 표시(분기 없을 때 = 36수 백, 분기 중 = 마지막 수)
    if cur_last and not (kind == "place" and dt < T_IN):
        cx, cy = P(cur_last)
        if br is None:
            d.rectangle([s(cx - 9), s(cy - 9), s(cx + 9), s(cy + 9)], fill=(220, 50, 40))
        else:
            d.ellipse([s(cx - R * 1.08), s(cy - R * 1.08), s(cx + R * 1.08), s(cy + R * 1.08)], outline=(255, 210, 60), width=s(5))
    # 표시(겹)
    for z, te in zs:  # 영역 이름표 — 판 아래 끝에 닿는 사각 영역은 안쪽 아래 줄(빈 1선), 그 밖은 지정 좌표(label_at) 또는 윗변 바깥
        a = ease((sec - te) / 0.35)
        x0_, y0_, x1_, y1_ = zone_box(z)
        c = tuple(z.get("color", [255, 200, 60]))
        tw = d.textlength(z["label"], font=F["tag"]) / SS + 36
        cx = (x0_ + x1_) / 2
        if z.get("label_at"):
            cx, ly = P(gtp_to_xy(z["label_at"]))
        elif "rect" in z and max(q[1] for q in z["xy"]) == N - 1:
            ly = y1_ - STEP * 0.5
        else:
            ly = y0_ - 30 if y0_ - 30 > BY - 20 else y0_ + 30
        if a > 0.2:
            d.rounded_rectangle([s(cx - tw / 2), s(ly - 28), s(cx + tw / 2), s(ly + 28)], s(14), fill=tuple(int(v * 0.75) for v in c))
            d.text((s(cx), s(ly)), z["label"], font=F["tag"], fill=(255, 255, 255), anchor="mm")
    for kd, arg, te in ovs:
        a = ease((sec - te) / 0.25)
        if kd == "hl":
            p = gtp_to_xy(arg)
            cx, cy = P(p)
            pulse = 1 + 0.12 * math.sin((sec - te) * 2 * math.pi * 1.2) if sec - te < 1.6 else 1
            rr = R * (1.25 + 0.4 * (1 - a)) * pulse
            d.ellipse([s(cx - rr), s(cy - rr), s(cx + rr), s(cy + rr)], outline=(255, 210, 60), width=s(7))
        elif kd == "lib":
            p = gtp_to_xy(arg)
            if p in cur_b.s:
                g, libs = cur_b.group(p)
                for q in libs:
                    if X0 <= q[0] <= X1 and Y0 <= q[1] <= Y1:
                        cx, cy = P(q)
                        rr = STEP * 0.2 * a
                        d.ellipse([s(cx - rr), s(cy - rr), s(cx + rr), s(cy + rr)], fill=(60, 200, 120), outline=(255, 255, 255), width=s(2))
                for q in g:  # 어느 무리인지: 돌마다 초록 고리
                    cx, cy = P(q)
                    d.ellipse([s(cx - R * 1.06), s(cy - R * 1.06), s(cx + R * 1.06), s(cy + R * 1.06)], outline=(60, 200, 120), width=s(4))
                # 꼬리표는 판 아래(돌을 가리지 않게)
                lab = f"{'흑' if cur_b.s[p] == 'B' else '백'} {len(g)}점 · 활로 {len(libs)}"
                tw = d.textlength(lab, font=F["tag"]) / SS + 40
                ly = BY + (Y1 - Y0 + 1) * STEP + 95
                d.rounded_rectangle([s(W / 2 - tw / 2), s(ly - 34), s(W / 2 + tw / 2), s(ly + 34)], s(16), fill=(30, 140, 80))
                d.text((s(W / 2), s(ly)), lab, font=F["tag"], fill=(255, 255, 255), anchor="mm")
        elif kd == "arrow":
            p1, p2 = [gtp_to_xy(v) for v in arg.split(",")]
            (x1, y1), (x2, y2) = P(p1), P(p2)
            L = math.hypot(x2 - x1, y2 - y1)
            ux, uy = (x2 - x1) / L, (y2 - y1) / L
            # 이웃한 두 점(한 칸)이어도 보이도록 돌 위에 그린다: 시작 = p1 중심 쪽, 끝 = p2 안쪽까지, 흰 테두리
            sx, sy = x1 + ux * R * 0.55, y1 + uy * R * 0.55  # 출발 돌의 번호는 가리지 않게 가장자리에서
            ex, ey = x2 - ux * R * 0.15, y2 - uy * R * 0.15
            ex, ey = sx + (ex - sx) * a, sy + (ey - sy) * a
            hx, hy = ex - ux * 26, ey - uy * 26
            head = [(s(ex), s(ey)), (s(hx - uy * 24), s(hy + ux * 24)), (s(hx + uy * 24), s(hy - ux * 24))]
            for colr, wd, grow in (((255, 255, 255), 20, 6), ((230, 50, 40), 11, 0)):
                d.line([(s(sx), s(sy)), (s(hx), s(hy))], fill=colr, width=s(wd))
                hh = [(s(ex + ux * grow), s(ey + uy * grow)), (s(hx - uy * (24 + grow) - ux * grow), s(hy + ux * (24 + grow) - uy * grow)),
                      (s(hx + uy * (24 + grow) - ux * grow), s(hy - ux * (24 + grow) - uy * grow))]
                d.polygon(hh if grow else head, fill=colr)
        elif kd == "diff":
            dd = SC["diff"]
            y0 = BY + (Y1 - Y0 + 1) * STEP + 90
            d.rounded_rectangle([s(60), s(y0), s(W - 60), s(y0 + 170)], s(22), fill=(48, 30, 30))
            d.text((s(W / 2), s(y0 + 55)), f"차이 {dd['loss']}집", font=F["diff"], fill=(255, 220, 120), anchor="mm")
            d.text((s(W / 2), s(y0 + 125)), f"흑 승률 {dd['wr_before']}% → {dd['wr_after']}%", font=F["tag"], fill=(255, 255, 255), anchor="mm")
    # 자막
    cur = next((l for l in reversed(timeline) if l["start"] - 0.05 <= sec <= l["end"] + GAP), None)
    if cur:
        cap_y = H - 350  # 4줄까지(줄 높이 약 60px)
        rows, row = [], ""
        for ch in cur["text"]:
            if d.textlength(row + ch, font=F["cap"]) / SS > W - 140:
                rows.append(row)
                row = ch
            else:
                row += ch
        rows.append(row)
        d.multiline_text((s(W / 2), s(cap_y)), "\n".join(rows[:4]), font=F["cap"], fill=(255, 255, 255), anchor="ma", align="center", spacing=s(14))
    # 진행 막대
    d.rectangle([0, s(H - 10), s(W * sec / TOTAL), s(H)], fill=(120, 120, 130))
    return im.resize((W, H), Image.LANCZOS)


def static_key(sec):
    br, k, prev, ts, kind = state_at(sec)
    dt = sec - ts
    ov = overlays_at(sec, ts if kind else -9)
    anim = dt < max(T_IN, T_OUT, T_REW, 1.6) or any(sec - te < 1.6 for _, _, te in ov)
    if anim:
        return None
    cur = next((l["i"] for l in reversed(timeline) if l["start"] - 0.05 <= sec <= l["end"] + GAP), None)
    return (br, k, kind, tuple((a, b) for a, b, _ in ov), cur)


if __name__ == "__main__":
    os.makedirs(D, exist_ok=True)
    silent = os.path.join(D, "video_silent.mp4")
    proc = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                             "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", silent], stdin=subprocess.PIPE)
    cache, shown = {}, {}
    probes = sorted({round(e["t"] + 0.9, 2) for e in raw} | {round(TOTAL - 1, 2)})
    sheet_frames = []
    for fi in range(NF):
        sec = fi / FPS
        key = static_key(sec)
        if key is not None and key in cache:
            im = cache[key]
        else:
            im = draw_frame(sec)
            # 바로 다음 프레임(1/30초 뒤)과 같은 정지 상태라면 캐시해서 재사용(정지 화면은 그리지 않는다)
            if key is not None:
                cache[key] = im
        for e in raw:
            if e["marker"] not in shown and sec >= e["t"]:
                shown[e["marker"] + f"@{e['t']}"] = round(sec, 3)
        if probes and sec >= probes[0]:
            sheet_frames.append(im.resize((W // 4, H // 4)))
            probes.pop(0)
        proc.stdin.write(im.tobytes())
    proc.stdin.close()
    proc.wait()
    # 오디오
    inputs, filt = [], []
    for j, l in enumerate(timeline):
        inputs += ["-i", tr["lines"][j]["file"]]
        filt.append(f"[{j}:a]adelay={int(l['start'] * 1000)}|{int(l['start'] * 1000)}[a{j}]")
    filt.append("".join(f"[a{j}]" for j in range(len(timeline))) + f"amix=inputs={len(timeline)}:normalize=0,apad=whole_dur={TOTAL}[out]")
    mix = os.path.join(D, "voice_mix.m4a")
    subprocess.run([FF, "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-c:a", "aac", "-b:a", "160k", mix], check=True)
    final = os.path.join(D, "scene.mp4")
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", silent, "-i", mix, "-c:v", "copy", "-c:a", "copy", "-shortest", final], check=True)
    # 싱크: 상태 마커는 돌이 처음 그려진 프레임(펼친 수 중 마커 자신의 수) 기준
    errs = []
    evs = []
    for e in raw:
        sh = math.ceil(e["t"] * FPS) / FPS
        err = abs(sh - e["t"])
        errs.append(err)
        evs.append({**e, "shown": round(sh, 3), "errMs": round(err * 1000, 1)})
    sync = {"events": evs, "errMeanMs": round(1000 * sum(errs) / len(errs), 1), "errMaxMs": round(1000 * max(errs), 1),
            "timeline": [{k: v for k, v in l.items() if k != "marks"} for l in timeline], "total": round(TOTAL, 2),
            "stateEvents": state_ev, "renderSec": round(time.time() - t0, 1), "cachedStates": len(cache)}
    json.dump(sync, open(os.path.join(D, "sync.json"), "w"), ensure_ascii=False, indent=1)
    # 검수 시트
    cols = 6
    rows_ = math.ceil(len(sheet_frames) / cols)
    sheet = Image.new("RGB", (cols * W // 4, rows_ * H // 4), (0, 0, 0))
    for i, fr in enumerate(sheet_frames):
        sheet.paste(fr, ((i % cols) * W // 4, (i // cols) * H // 4))
    sheet.save(os.path.join(D, "sheet.png"))
    # 큐시트(실제 발화 시각)
    def label(br):
        return {None: f"실전({TURN + 1}수 국면)", "fail": "실패도", "ok": "정해도"}[br]
    seqs = {"fail": BR["fail"], "ok": BR["ok"]}
    rows = ["| 시각(초) | 판 상태 | 놓이는 수 | 대사 구간 | 표시 |", "|---|---|---|---|---|",
            f"| 0.00 | 실전({TURN + 1}수 국면) | — (36수 백 {MOVES[TURN - 1][1]} 빨간 네모) | (무음 {LEAD}초) | 배너 '실전 · 37수 국면' |"]
    brs, kdone = None, {}
    for l in timeline:
        text, marks = l["text"], sorted(l["marks"], key=lambda m: m["char"])
        cuts = [0] + [m["char"] for m in marks] + [len(text)]
        segs = [text[cuts[i]:cuts[i + 1]].strip() for i in range(len(cuts) - 1)]
        if segs[0]:
            rows.append(f"| {l['start']:.2f} | {label(brs)} | — | {segs[0]} | — |")
        for m, seg in zip(marks, segs[1:]):
            tm = l["start"] + m["t"]
            kd, _, arg = m["marker"].partition(":")
            put, show = "—", "—"
            if kd in ("fail", "ok"):
                kk = int(arg)
                k0 = kdone.get(kd, 0) if brs == kd else 0
                kdone[kd] = kk
                brs = kd
                ps = []
                for j in range(k0 + 1, kk + 1):
                    c = COLOR0 if j % 2 else opp(COLOR0)
                    ps.append(f"{j} {'흑' if c == 'B' else '백'} {seqs[kd][j - 1]}")
                put = " · ".join(ps)
                show = "번호" + (" · ① 빨강(실전 수)" if kd == "fail" and kk == 1 else "") + (" · 배너 전환" if k0 == 0 else "") + \
                       (f" · 앞 수는 {STEP_GAP}초 간격으로 먼저" if kk - k0 > 1 else "")
            elif kd == "pos":
                brs = None
                show = f"분기 돌 사라짐(0.5초) · 배너 '{BANNER['rewind'][0]}'"
            elif kd == "hl":
                show = f"{arg} 강조 고리(맥동)"
            elif kd == "lib":
                show = f"{arg} 무리 활로 점 + '활로 n' 꼬리표"
            elif kd == "arrow":
                show = f"화살표 {arg.replace(',', '→')}"
            elif kd == "zone":
                z = SC["zones"][arg]
                show = (f"영역 '{z['label']}' {z['rect'][0]}–{z['rect'][1]}" if "rect" in z
                        else f"돌 묶음 강조 '{z['label']}' {'·'.join(z['points'])}")
            elif kd == "diff":
                show = f"차이 카드 '{SC['diff']['text']}'"
            rows.append(f"| {tm:.2f} | {label(brs)} | {put} | {seg} | {show} |")
    rows.append(f"| {TOTAL:.2f} | 끝 | — | — | — |")
    open(os.path.join(D, "cue.md"), "w", encoding="utf-8").write("\n".join(rows) + "\n")
    print(f"완성 {final} · {TOTAL:.1f}s · 마커 {len(raw)} · 싱크(프레임 반올림) 평균 {sync['errMeanMs']}ms 최대 {sync['errMaxMs']}ms · 렌더 {sync['renderSec']}s · 정지 캐시 {len(cache)}")
