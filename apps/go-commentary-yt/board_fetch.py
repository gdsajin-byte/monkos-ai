#!/usr/bin/env python3
"""판 판독 입력 — Pro 대상 9편의 20분 구간 영상(480p 이하, 무음)을 받고 2초 간격 프레임을 뽑는다 (PF_GO, 11-06 04:26 B안, 무료)
  board_fetch.py   → answers/{ID}/video480.mp4 + answers/{ID}/frames_{s}/f_00001.jpg …(2초 간격)
"""
import json, subprocess, sys
from pathlib import Path
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
STEP = 2
sel = json.loads((B / "selection.json").read_text())
sys.path.insert(0, str(Path(__file__).parent))
pro = __import__("answers_batch").pro_pick(sel)
for r in sel:
    if r["id"] not in pro[r["commentator"]]:
        continue
    s, e = r["win20"]
    v = B / r["id"] / "video480.mp4"  # 구간 받기(--download-sections)는 5분에 13MB로 느려 전체 무음 480p를 받고 로컬에서 자른다(11-06 실측)
    if not v.exists():
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-f", "bv*[height<=480][ext=mp4]/bv*[height<=480]",
                        "-o", str(v), f"https://www.youtube.com/watch?v={r['id']}"], check=True)
    fd = B / r["id"] / f"frames_{s}"
    if not fd.exists():
        fd.mkdir()
        subprocess.run([FF, "-loglevel", "error", "-ss", str(s), "-to", str(e), "-i", str(v), "-vf", f"fps=1/{STEP}", "-q:v", "3", str(fd / "f_%05d.jpg")], check=True)
    print(r["commentator"], r["id"], s, e, len(list(fd.glob("*.jpg"))), "프레임", flush=True)
