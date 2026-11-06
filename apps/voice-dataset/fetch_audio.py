#!/usr/bin/env python3
"""미사한울TV(작가님 본인 채널) 대상 편 음성만 받기 — 무로그인 공개 스트림, 최고 품질 오디오 (PF_PRESENTATION, ORDER_20261106 1항)
  fetch_audio.py   → ~/.monkos/voice/misa/raw/{ID}.{ext} + targets.json(제목·길이·게시순)
대상 = '신PD의 목소리 최초 공개'(U-GqdO1wEfc)와 그 이후 게시 편 중 드론 영상(MJaUjymTn8M) 제외. 채널 목록은 매번 다시 받아 확인한다.
"""
import json, subprocess, sys
from pathlib import Path

CH = "https://www.youtube.com/channel/UCzNcOMsWHhv-615zqYiUklQ/videos"
FIRST, SKIP = "U-GqdO1wEfc", {"MJaUjymTn8M"}
O = Path.home() / ".monkos/voice/misa"
R = O / "raw"
R.mkdir(parents=True, exist_ok=True)
lines = subprocess.run([sys.executable, "-m", "yt_dlp", "--flat-playlist", "--print", "%(id)s\t%(title)s\t%(duration)s", CH],
                       capture_output=True, text=True).stdout.strip().splitlines()
rows = [dict(zip(("id", "title", "duration"), l.split("\t"))) for l in lines]
ids = [r["id"] for r in rows]
if FIRST not in ids:
    sys.exit(f"❌ fetch_audio: 기준 편 {FIRST}이 목록에 없음")
tg = [r for r in rows[:ids.index(FIRST) + 1] if r["id"] not in SKIP]  # 목록은 최신순 — 기준 편까지
for r in tg:
    r["duration"] = int(float(r["duration"] or 0))
    if not list(R.glob(f"{r['id']}.*")):
        subprocess.run([sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "-f", "bestaudio", "-o", str(R / "%(id)s.%(ext)s"),
                        f"https://www.youtube.com/watch?v={r['id']}"], check=True)
    r["file"] = str(next(R.glob(f"{r['id']}.*")))
    print(r["id"], r["duration"], "초", Path(r["file"]).name, flush=True)
(O / "targets.json").write_text(json.dumps(tg, ensure_ascii=False, indent=1))
print(f"✅ fetch_audio: {len(tg)}편 · {sum(r['duration'] for r in tg) / 60:.1f}분 → {R}")
