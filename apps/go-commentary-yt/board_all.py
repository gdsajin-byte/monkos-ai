#!/usr/bin/env python3
"""Pro 대상 9편 판 판독 일괄 — 보정(calib 없을 때만)·판독·사건·장면 채우기 (PF_GO, 11-06 B안, 무료)
  board_all.py   (board_fetch.py 다음)
"""
import json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
sel = json.loads((B / "selection.json").read_text())
sys.path.insert(0, str(HERE))
pro = __import__("answers_batch").pro_pick(sel)
for r in sel:
    if r["id"] not in pro[r["commentator"]]:
        continue
    s = r["win20"][0]
    d = B / r["id"] / f"frames_{s}"
    if not d.exists():
        print("프레임 없음", r["id"]); continue
    if not (d / "calib.json").exists():
        subprocess.run([sys.executable, str(HERE / "board_read.py"), "calib", str(d)], check=True)
    if not (d / "board_states.json").exists():
        subprocess.run([sys.executable, str(HERE / "board_read.py"), "read", str(d)], check=True)
    subprocess.run([sys.executable, str(HERE / "board_events.py"), r["id"], str(s)], check=True)
