"""E2E v0 합성 — 대본·음성 트랙·장면 → 1920×1080 30fps mp4. 판(PIL, go-board 좌표계) 90% + 우하단 유니 얼굴 창(10-25 Kling 재사용) + 자막.
마커(<move:n>·<ref:k>·<real>) 발화 시각에 돌을 놓는다 → 싱크표·오차 기록. 사용: python3 -I render.py <server.py 폴더> <e2e 폴더>"""
import json
import math
import os
import subprocess
import sys
import time

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, sys.argv[1])
import server as S  # noqa: E402

D = sys.argv[2]
FF = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 30
LEAD, TAIL, JCUT = 0.6, 1.4, 0.12  # 앞 여백 · 끝 여백 · 다음 화자가 앞 대사 끝 0.12초 전에 들어옴(J-cut)
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FACES = ["/Users/jeong-kyushin/Desktop/iMac_archive/monk_assets/generated/2026-10/session_a0c295e0_1025-1026/uni_video/cut1_kling.mp4",
         "/Users/jeong-kyushin/Desktop/iMac_archive/monk_assets/generated/2026-10/session_a0c295e0_1025-1026/uni_video/cut2_kling.mp4"]
t_start = time.time()

tr = json.load(open(os.path.join(D, "audio", "tracks.json"), encoding="utf-8"))
scene = json.load(open(os.path.join(D, "scene_g10.json"), encoding="utf-8"))
q = next(json.loads(l) for l in open("/Users/jeong-kyushin/.monkos/go-board/analysis/mistakes_v0/queries_smoke10.jsonl") if json.loads(l)["id"] == "160894228")
REAL = [tuple(m) for m in q["moves"]]
REF = [("B", "D5"), ("W", "D7"), ("B", "C7"), ("W", "B6"), ("B", "F5"), ("W", "F3")]  # scene_g10.json D5 → pv(검증된 수순)
assert [m for _, m in REF[1:]] == scene["D5"]["pv"][:5], "참고도 수순이 분석과 다름"

# ---- 타임라인(대사 시작·끝, 마커 절대 시각)
t, timeline, events = LEAD, [], []
for ln in tr["lines"]:
    timeline.append({"i": ln["i"], "who": ln["who"], "text": ln["text"], "start": round(t, 3), "end": round(t + ln["dur"], 3)})
    for m in ln["marks"]:
        events.append({"marker": m["marker"], "t": round(t + m["t"], 3)})
    t = t + ln["dur"] - JCUT
TOTAL = timeline[-1]["end"] + TAIL
NF = math.ceil(TOTAL * FPS)


# ---- 판 상태: (실전 수 n, 참고도 k)
def state_at(sec):
    n, k = 16, 0
    for e in events:
        if e["t"] > sec:
            break
        kind, _, v = e["marker"].partition(":")
        if kind == "move":
            n, k = int(v), 0
        elif kind == "ref":
            n, k = 16, int(v)
        elif kind == "real":
            n, k = 22, 0
    return n, k


# ---- 판 그리기(판 한 변 = 화면 높이 90%)
BS = int(H * 0.9)
BX, BY = 90, (H - BS) // 2
M = BS * 0.045
STEP = (BS - 2 * M) / 18
font_num = ImageFont.truetype(FONT, int(STEP * 0.5))
font_sub = ImageFont.truetype(FONT, 46)
font_who = ImageFont.truetype(FONT, 34)
font_tag = ImageFont.truetype(FONT, 30)
font_cap = ImageFont.truetype(FONT, 31)  # 자막 — 3줄까지(대사 전부)
cache = {}


def xy(p):
    x, y = S.to_xy(p)
    return BX + M + x * STEP, BY + M + y * STEP


def board_img(n, k):
    if (n, k) in cache:
        return cache[(n, k)]
    moves = REAL[:n] + (REF[:k] if k else [])
    g, _ = S.replay(moves, [])
    im = Image.new("RGB", (W, H), (24, 26, 32))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([BX, BY, BX + BS, BY + BS], 14, fill=(222, 184, 120))
    for i in range(19):
        a = BX + M + i * STEP
        d.line([(a, BY + M), (a, BY + M + 18 * STEP)], fill=(60, 44, 24), width=2)
        d.line([(BX + M, BY + M + i * STEP), (BX + M + 18 * STEP, BY + M + i * STEP)], fill=(60, 44, 24), width=2)
    for sx in (3, 9, 15):
        for sy in (3, 9, 15):
            cx, cy = BX + M + sx * STEP, BY + M + sy * STEP
            d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(60, 44, 24))
    r = STEP * 0.47
    for y in range(19):
        for x in range(19):
            c = g[y][x]
            if not c:
                continue
            cx, cy = BX + M + x * STEP, BY + M + y * STEP
            d.ellipse([cx - r + 3, cy - r + 4, cx + r + 3, cy + r + 4], fill=(150, 116, 70))
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(20, 20, 22) if c == "B" else (244, 244, 240),
                      outline=(0, 0, 0) if c == "W" else None, width=1)
    if k:  # 참고도 번호
        for i, (c, mv) in enumerate(REF[:k], 1):
            cx, cy = xy(mv)
            d.text((cx, cy), str(i), font=font_num, fill=(255, 255, 255) if c == "B" else (20, 20, 20), anchor="mm")
        d.rounded_rectangle([BX + 20, BY + 20, BX + 250, BY + 78], 10, fill=(180, 40, 40))
        d.text((BX + 135, BY + 49), "참고도 — 이으면", font=font_tag, fill=(255, 255, 255), anchor="mm")
    elif n > 16:  # 실전 마지막 수 표시
        cx, cy = xy(REAL[n - 1][1])
        d.ellipse([cx - r * 0.45, cy - r * 0.45, cx + r * 0.45, cy + r * 0.45], outline=(220, 40, 40), width=5)
    if n == 16 and not k:  # 시작: 단수 걸린 흑 C5
        cx, cy = xy("C5")
        d.regular_polygon((cx, cy, r * 0.5), 3, fill=(220, 40, 40))
    d.text((BX + BS + 30, BY + 10), f"{n}수" + (" · 참고도" if k else ""), font=font_tag, fill=(200, 200, 200))
    cache[(n, k)] = im
    return im


# ---- 얼굴 창(우하단) — Kling 클립 이어 붙여 반복, 머리 쪽 잘라 쓰기
FW, FH = 420, 520
face_frames = []
for f in FACES:
    rd = imageio_ffmpeg.read_frames(f)
    meta = next(rd)
    w0, h0 = meta["size"]
    for i, fr in enumerate(rd):
        if i % 2:  # 원본 fps 절반 → 30fps 근사(2 프레임 중 1)
            continue
        im = Image.frombytes("RGB", (w0, h0), fr)
        cw = int(w0 * 0.78)
        ch = int(cw * FH / FW)
        x0, y0 = (w0 - cw) // 2, int(h0 * 0.08)
        face_frames.append(im.crop((x0, y0, x0 + cw, y0 + ch)).resize((FW, FH)))
print(f"얼굴 프레임 {len(face_frames)} · 원본 {w0}x{h0}")
FX, FY = W - FW - 40, H - FH - 240

# ---- 프레임 → ffmpeg(무음 영상)
silent = os.path.join(D, "video_silent.mp4")
proc = subprocess.Popen([FF, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                         "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", silent], stdin=subprocess.PIPE)
placed = {}
for fi in range(NF):
    sec = fi / FPS
    n, k = state_at(sec)
    for e in events:  # 싱크표: 돌이 처음 화면에 나온 프레임 시각
        if e["marker"] not in placed and sec >= e["t"]:
            placed[e["marker"]] = round(sec, 3)
    im = board_img(n, k).copy()
    face = face_frames[fi % len(face_frames)]
    im.paste(face, (FX, FY))
    d = ImageDraw.Draw(im)
    cur = next((l for l in reversed(timeline) if l["start"] <= sec <= l["end"] + 0.25), None)
    speaking = cur and cur["who"]
    d.rounded_rectangle([FX - 6, FY - 6, FX + FW + 6, FY + FH + 6], 16, outline=(250, 120, 160) if speaking == "uni" else (90, 90, 100), width=6)
    d.text((FX + FW // 2, FY + FH + 26), "유니", font=font_who, fill=(250, 200, 220), anchor="mm")
    if cur:
        who = "유니" if cur["who"] == "uni" else "해설"
        d.rounded_rectangle([BX + BS + 30, H - 200, W - 30, H - 24], 14, fill=(0, 0, 0))
        d.text((BX + BS + 50, H - 190), who, font=font_who, fill=(250, 150, 190) if cur["who"] == "uni" else (140, 200, 255))
        txt, lines_, row = cur["text"], [], ""
        for ch in txt:  # 글자 폭 기준 줄바꿈
            if d.textlength(row + ch, font=font_cap) > (W - 30) - (BX + BS + 50) - 20:
                lines_.append(row); row = ch
            else:
                row += ch
        lines_.append(row)
        d.text((BX + BS + 50, H - 148), "\n".join(lines_[:3]), font=font_cap, fill=(255, 255, 255), spacing=8)
    proc.stdin.write(im.tobytes())
proc.stdin.close()
proc.wait()

# ---- 오디오: 대사별 지연 후 섞기 → 영상과 합치기
inputs, filt = [], []
for j, l in enumerate(timeline):
    inputs += ["-i", tr["lines"][j]["file"]]
    filt.append(f"[{j}:a]adelay={int(l['start'] * 1000)}|{int(l['start'] * 1000)}[a{j}]")
filt.append("".join(f"[a{j}]" for j in range(len(timeline))) + f"amix=inputs={len(timeline)}:normalize=0,apad=whole_dur={TOTAL}[out]")
mix = os.path.join(D, "voice_mix.m4a")
subprocess.run([FF, "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-c:a", "aac", "-b:a", "160k", mix], check=True)
final = os.path.join(D, "e2e_v0.mp4")
subprocess.run([FF, "-y", "-loglevel", "error", "-i", silent, "-i", mix, "-c:v", "copy", "-c:a", "copy", "-shortest", final], check=True)

errs = [abs(placed[e["marker"]] - e["t"]) for e in events if e["marker"] in placed]
sync = {"events": [{**e, "shown": placed.get(e["marker"])} for e in events],
        "errMeanMs": round(1000 * sum(errs) / len(errs), 1), "errMaxMs": round(1000 * max(errs), 1),
        "timeline": timeline, "total": round(TOTAL, 2), "renderSec": round(time.time() - t_start, 1)}
json.dump(sync, open(os.path.join(D, "sync.json"), "w"), ensure_ascii=False, indent=1)
print(f"완성 {final} · {TOTAL:.1f}s · 싱크 오차 평균 {sync['errMeanMs']}ms 최대 {sync['errMaxMs']}ms · 렌더 {sync['renderSec']}s")
