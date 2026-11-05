#!/usr/bin/env python3
"""목소리 파일을 타이젬 참조 팩의 '틀'(말소리 시작 위치·전체 길이·말소리 음량)에 맞춘다 (PF_GO, 11-05 10:40 작가님
"타이젬의 방식을 따르면서 목소리만 변동"). 타이젬 파일은 읽어서 수치만 잰다(가공·복사 없음).

  sound_fit_tygem.py measure                 tygem-ref 파일별 틀 표
  sound_fit_tygem.py fit SRC_DIR OUT_DIR     SRC_DIR(우리 wav)의 같은 이름 파일을 틀에 맞춰 OUT_DIR에 wav로
정렬 기준: 말소리 시작 = 음량이 파일 최대의 −20dB를 처음 넘는 지점(자음 앞 미세 잡음에 덜 흔들리는 중간 문턱).
길이: 우리 말소리가 틀보다 짧으면 끝 무음으로 채우고, 길면 말소리를 자르지 않고 그대로 둔다(표에 표시).
"""
import subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np

SR = 22050
TY = Path.home() / ".monkos" / "go-board-sounds" / "tygem-ref"
NAMES = [f"count{i}" for i in range(1, 11)] + ["remain1", "remain2", "remain3", "start", "counting"]
TEMPLATE = {"byo": "start", "byo_short": "start", "remain4": "remain3", "remain5": "remain3"}  # 타이젬에 없는 파일 → 비슷한 길이 문구의 틀(시작 위치·음량). 길이는 안내 규칙(말 끝 +150ms)


def load(p):
    if p.suffix == ".mp3":
        with tempfile.TemporaryDirectory() as td:
            w = Path(td) / "d.wav"
            subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(p), str(w)], check=True)
            return load(w)
    with wave.open(str(p)) as w:
        assert w.getframerate() == SR
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767


def shape(x):
    win = int(0.005 * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same")) + 1e-12
    db = 20 * np.log10(r / r.max())
    on20 = int(np.argmax(db > -20)); on40 = int(np.argmax(db > -40)); end40 = int(np.where(db > -40)[0][-1])
    v = x[db > -30]
    return {"len": len(x), "on20": on20, "on40": on40, "end40": end40, "rms": 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12),
            "peak": 20 * np.log10(np.max(np.abs(x)) + 1e-12)}


def measure():
    out = {}
    for n in NAMES:
        s = shape(load(TY / f"{n}.mp3")); out[n] = s
        print(f"{n:9s} 길이 {s['len'] / SR * 1000:5.0f}ms · 시작(−20dB) {s['on20'] / SR * 1000:4.0f}ms · 시작(−40dB) {s['on40'] / SR * 1000:4.0f}ms · "
              f"말 끝 {s['end40'] / SR * 1000:5.0f}ms · 말 RMS {s['rms']:.1f}dBFS · 피크 {s['peak']:.1f}")
    return out


def fit(src_dir, out_dir):
    src, out = Path(src_dir), Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    rows = []
    for n in NAMES + list(TEMPLATE):
        t = shape(load(TY / f"{TEMPLATE.get(n, n)}.mp3"))
        p = src / f"{n}.wav"
        if not p.exists():
            rows.append(f"{n:9s} 원본 없음"); continue
        x = load(p); s = shape(x)
        # 말소리 시작(−20dB)을 틀과 같은 자리로: 앞 무음을 더하거나 덜어낸다(말소리 앞 −40dB 지점 앞까지만 덜어냄)
        shift = t["on20"] - s["on20"]
        if shift >= 0:
            y = np.concatenate([np.zeros(shift), x])
        else:
            cut = min(-shift, max(0, s["on40"] - int(0.005 * SR)))
            y = x[cut:]
            if cut < -shift:
                rows.append(f"  ⚠ {n}: 앞 무음이 모자라 시작이 {(-shift - cut) / SR * 1000:.0f}ms 늦음")
        # 길이: 틀 길이로(말소리 끝 뒤만 자르고, 말소리가 길면 그대로)
        sy = shape(y)
        L = t["len"]
        if n.startswith("remain") or n in TEMPLATE:  # 11-05 10:55 "remain 파일 길이는 짧을수록" — 안내는 말소리 끝 + 150ms까지만(채우지 않음)
            L = min(L, max(sy["end40"] + int(0.15 * SR), len(y) if sy["end40"] + int(0.03 * SR) > L else 0))
        if len(y) >= L and sy["end40"] + int(0.03 * SR) <= L:
            y = y[:L]
        elif len(y) < L:
            y = np.concatenate([y, np.zeros(L - len(y))])
        fo = int(0.03 * SR)
        y[-fo:] *= np.linspace(1, 0, fo)
        # 음량: 말소리 RMS를 틀과 같게(피크 −1dBFS 상한)
        g = min(t["rms"] - shape(y)["rms"], -1.0 - 20 * np.log10(np.max(np.abs(y)) + 1e-12))
        y = np.clip(y * 10 ** (g / 20), -1, 1)
        with wave.open(str(out / f"{n}.wav"), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((y * 32767).astype("<i2").tobytes())
        f = shape(y)
        rows.append(f"{n:9s} 시작 {t['on20'] / SR * 1000:4.0f}→{f['on20'] / SR * 1000:4.0f}ms · 길이 {t['len'] / SR * 1000:5.0f}→{len(y) / SR * 1000:5.0f}ms"
                    f"{' (말소리가 틀보다 김)' if len(y) > L else ''} · RMS {t['rms']:.1f}→{f['rms']:.1f}dBFS")
    print("\n".join(rows))


if __name__ == "__main__":
    a = sys.argv[1:]
    measure() if a[0] == "measure" else fit(a[1], a[2])
