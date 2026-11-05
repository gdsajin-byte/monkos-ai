#!/usr/bin/env python3
"""청취 파일 — 앱 재생 시각(clock_sim*.mjs 출력)을 그대로 써서 팩별 m4a를 만든다 (PF_GO, 11-05 10:40·10:55·10:57·10:59).
같은 시나리오에 팩 파일만 바꿔 놓으므로 두 팩을 그대로 비교할 수 있다. 재생 시각 계산에는 그 팩의 파일 길이를 쓴다
(안내 뒤 '하나' 지연이 안내 길이에 달려 있으므로). 음성은 착수가 와도 끝까지 섞고(앱도 stop하지 않음), 돌 소리와 단순 합산.
  sound_listen_sim.py full  PACK_DIR OUT_M4A BYO PERIODS START_SEC [LEN_SEC]   한 차례를 계속 세는 판(회 넘김 포함)
  sound_listen_sim.py turns PACK_DIR OUT_M4A BYO PERIODS 'TURNS_JSON'           착수 왕복 판([[지연, 생각], ...]) — 돌 소리 포함
"""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sound_fit_tygem import load, SR
from sound_count_split import write as write_wav

HERE = Path(__file__).resolve().parent
INDEX = str(HERE.parent / "index.html")


def pfile(pack, name):
    return next((pack / f"{name}{ext}" for ext in (".wav", ".mp3") if (pack / f"{name}{ext}").exists()), None)


def durs(pack):
    d = {}
    for n in [f"count{i}" for i in range(1, 11)] + ["remain1", "remain2", "remain3"]:
        f = pfile(pack, n)
        if f:
            d[n] = round(len(load(f.resolve())) / SR, 3)
    return d


def render(pack, out, items, length):
    buf = np.zeros(int(length * SR) + SR)
    used = []
    for t, name in items:
        f = pfile(pack, name)
        if not f or t < 0 or t >= length:
            continue
        y = load(f.resolve()) * (0.9 if name.startswith("stone") else 1.0)
        s = int(t * SR); buf[s:s + len(y)] += y[:len(buf) - s]
        used.append(f"{t:.2f}s {name}")
    buf = buf[:int(length * SR)]
    buf = buf / (np.max(np.abs(buf)) or 1) * 10 ** (-1 / 20)
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "l.wav"; write_wav(w, buf)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(w), out], check=True)
    print(out, "|", " · ".join(used))


def full(pack, out, byo, per, start, length="15"):
    pack, start, length = Path(pack), float(start), float(length)
    r = subprocess.run(["node", str(HERE / "clock_sim.mjs"), INDEX, byo, per, "0", "0", json.dumps(durs(pack))], capture_output=True, text=True, check=True)
    render(pack, out, [(e["t"] - start, e["file"]) for e in json.loads(r.stdout)["events"]], length)


def turns(pack, out, byo, per, turns_json):
    pack = Path(pack)
    r = subprocess.run(["node", str(HERE / "clock_sim_turns.mjs"), INDEX, byo, per, turns_json, "0", json.dumps(durs(pack))], capture_output=True, text=True, check=True)
    tl = json.loads(r.stdout)
    t0 = tl[0]["arrive"] - 0.6
    items = []
    for t in tl:
        a = t["arrive"] - t0
        items.append((a, "stone0"))                       # 상대 돌이 화면에 놓인 순간
        items += [(a + s, f) for s, f in t["said"] if "(취소)" not in f]
        items.append((a + t["think"], "stone1"))           # 내 착수
    render(pack, out, items, max(i[0] for i in items) + 1.6)


if __name__ == "__main__":
    a = sys.argv[1:]
    {"full": lambda: full(*a[1:7]), "turns": lambda: turns(*a[1:6])}[a[0]]()
