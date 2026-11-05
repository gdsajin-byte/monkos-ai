#!/usr/bin/env python3
"""청취 파일 — 앱 재생 시각(clock_sim.mjs 출력)을 그대로 써서 팩별 15초 m4a를 만든다 (PF_GO, 11-05 10:40).
같은 시나리오·같은 재생 시각에 팩 파일만 바꿔 놓으므로 두 팩을 그대로 비교할 수 있다.
  sound_listen_sim.py PACK_DIR OUT_M4A BYO PERIODS START_SEC [LEN_SEC]
"""
import json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from sound_fit_tygem import load, SR
from sound_count_split import write as write_wav

HERE = Path(__file__).resolve().parent


def main(pack, out, byo, per, start, length="15"):
    pack, start, length = Path(pack), float(start), float(length)
    r = subprocess.run(["node", str(HERE / "clock_sim.mjs"), str(HERE.parent / "index.html"), byo, per, "0", "0"], capture_output=True, text=True, check=True)
    ev = json.loads(r.stdout)["events"]
    buf = np.zeros(int(length * SR))
    used = []
    for e in ev:
        t = e["t"] - start
        if t < 0 or t >= length:
            continue
        f = next((pack / f"{e['file']}{ext}" for ext in (".wav", ".mp3") if (pack / f"{e['file']}{ext}").exists()), None)
        if not f:
            continue
        y = load(f.resolve())
        s = int(t * SR); buf[s:s + len(y)] += y[:len(buf) - s]
        used.append(f"{t:.1f}s {e['file']}")
    buf = buf / (np.max(np.abs(buf)) or 1) * 10 ** (-1 / 20)
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "l.wav"; write_wav(w, buf)
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(w), out], check=True)
    print(out, "|", " · ".join(used))


if __name__ == "__main__":
    main(*sys.argv[1:7])
