#!/usr/bin/env python3
"""자체 소리 팩 후보 가공·합성 (ORDER_20261105 막내2, PF_GO). 음원은 레포 밖 ~/.monkos/go-board-sound-candidates/ 에만.

  sound_process.py a      ElevenLabs 효과음 원본(sfx_raw/*.mp3) → 규격 WAV (stone_a*.wav, capture_a*.wav)
  sound_process.py b      오프라인 합성(모달 합성) → stone_b1~3.wav, capture_b1~2.wav
  sound_process.py check  go-board-sound-candidates/*.wav 규격 검사(22.05kHz·16bit·모노·피크·타격 시작 지연)

규격(SOUNDS.md 가공 방식 준용): 22.05kHz 16bit 모노, 타격 시작 지연 10ms 이내(시작점 8ms 앞), 착수 0.35s·따냄 0.95s,
끝 60ms 페이드아웃, 피크 −1dBFS. 타사 음원(tygem-ref)은 입력으로 쓰지 않는다 — 참조는 귀로만.
"""
import subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np

OUT = Path.home() / ".monkos" / "go-board-sound-candidates"  # 팩 폴더(go-board-sounds) 밖 — 안에 두면 실사용 화면 팩 목록에 노출
SR = 22050
PEAK = 10 ** (-1 / 20)  # −1 dBFS
LEN = {"stone": 0.35, "capture": 0.95}


def write(path, x):
    x = x / (np.max(np.abs(x)) or 1) * PEAK
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def read(path):
    with wave.open(str(path)) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2, path
        return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767


def onset(x, rel=0.08):
    """SOUNDS.md 방식 — 주 타격(최대 피크)에서 거꾸로 피크의 8% 아래로 2ms 이상 머무는 지점까지 → 거기서 8ms 앞부터.
    (앞쪽의 작은 소리를 시작점으로 잡으면 주 타격이 늦게 나온다 — 11-05 1차 가공에서 실측 160·317ms 지연)"""
    a = np.abs(x)
    pk = int(np.argmax(a))
    quiet = a < rel * a[pk]
    run, need, i = 0, int(0.002 * SR), pk
    while i > 0:
        run = run + 1 if quiet[i] else 0
        if run >= need:
            break
        i -= 1
    return max(0, i + run - int(0.008 * SR))


def shape(x, kind):
    x = x[onset(x):][: int(LEN[kind] * SR)]
    if len(x) < int(LEN[kind] * SR):
        x = np.pad(x, (0, int(LEN[kind] * SR) - len(x)))
    f = int(0.06 * SR)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def do_a():
    for src in sorted((OUT / "sfx_raw").glob("*.mp3")):
        with tempfile.TemporaryDirectory() as td:
            tmp = Path(td) / "d.wav"
            subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(src), str(tmp)], check=True)
            x = read(tmp)
        kind = "capture" if src.stem.startswith("capture") else "stone"
        write(OUT / f"{src.stem}.wav", shape(x, kind))
        print("ok", f"{src.stem}.wav")


def modal(freqs, decays, amps, dur, rng, click=0.0025, click_amp=0.6, hp=1500):
    """감쇠 정현파 합(나무판·돌의 고유 진동) + 짧은 타격 잡음. 결정적(시드 고정)."""
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for f, d, a in zip(freqs, decays, amps):
        y += a * np.sin(2 * np.pi * f * (1 + rng.uniform(-0.01, 0.01)) * t + rng.uniform(0, 6.28)) * np.exp(-t / d)
    n = int(click * SR)
    burst = rng.standard_normal(n) * np.linspace(1, 0, n) ** 2
    burst = np.diff(burst, prepend=0) if hp else burst  # 1차 고역 강조 — '딱' 성분
    y[:n] += click_amp * burst / (np.max(np.abs(burst)) or 1)
    return y


# 착수 3종: 나무판 저·중역 모드 + 돌 고역 모드. b1 맑고 단단 / b2 더 밝고 짧게 / b3 부드럽고 낮게
STONE = {
    "stone_b1": dict(freqs=[620, 1180, 1960, 3150, 4700], decays=[0.045, 0.03, 0.02, 0.012, 0.008], amps=[0.6, 0.8, 0.7, 0.5, 0.35], seed=11),
    "stone_b2": dict(freqs=[760, 1540, 2480, 3900, 5600], decays=[0.03, 0.022, 0.015, 0.01, 0.006], amps=[0.4, 0.7, 0.8, 0.7, 0.5], seed=12, click_amp=0.8),
    "stone_b3": dict(freqs=[420, 880, 1450, 2300], decays=[0.06, 0.04, 0.025, 0.012], amps=[0.9, 0.7, 0.5, 0.25], seed=13, click_amp=0.35),
}


def capture(seed, hits, spread, bowl):
    """따냄: 돌끼리 부딪는 고역 클릭 여러 번(무작위 간격·세기) + 통(나무 그릇) 울림."""
    rng = np.random.default_rng(seed)
    dur = LEN["capture"]
    y = np.zeros(int(dur * SR))
    times = np.sort(rng.uniform(0, spread, hits)); times[0] = 0
    for i, t0 in enumerate(times):
        base = rng.uniform(2600, 4200)
        c = modal([base, base * 1.53, base * 2.11], [0.012, 0.008, 0.005], [1, 0.6, 0.35], 0.08, rng, click=0.0012, click_amp=0.5)
        if bowl and i < 2:  # 처음 몇 개는 통 바닥에 닿는 나무 울림
            c = c + modal([330, 710, 1240], [0.06, 0.035, 0.02], [0.5, 0.35, 0.2], 0.08, rng, click=0.001, click_amp=0.1)[: len(c)]
        s = int(t0 * SR)
        g = rng.uniform(0.45, 1.0) * (0.9 ** i)
        y[s:s + len(c)] += g * c[: len(y) - s]
    return y


def do_b():
    for name, p in STONE.items():
        rng = np.random.default_rng(p.pop("seed"))
        write(OUT / f"{name}.wav", shape(modal(dur=0.4, rng=rng, **p), "stone"))
        print("ok", f"{name}.wav")
    write(OUT / "capture_b1.wav", shape(capture(21, hits=7, spread=0.45, bowl=True), "capture"))
    write(OUT / "capture_b2.wav", shape(capture(22, hits=4, spread=0.3, bowl=False), "capture"))
    print("ok capture_b1.wav", "ok capture_b2.wav")


def check():
    for p in sorted(OUT.glob("*.wav")):
        with wave.open(str(p)) as w:
            sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
            x = np.frombuffer(w.readframes(n), "<i2").astype(np.float64) / 32767
        pk = 20 * np.log10(np.max(np.abs(x)) or 1e-9)
        lead = int(np.argmax(np.abs(x) >= 0.08 * np.max(np.abs(x)))) / sr * 1000
        ok = sr == SR and ch == 1 and sw == 2 and lead <= 10 and -1.2 <= pk <= -0.8
        a = np.abs(x); main = int(np.argmax(a)) / sr * 1000
        win = int(0.005 * sr); e = np.convolve(a, np.ones(win) / win, "same"); thr = e.max() * 0.3
        hits = sum(1 for i in range(1, len(e) - 1) if e[i] > thr and e[i] >= e[i - 1] and e[i] > e[i + 1]
                   and e[i] == e[max(0, i - 220):i + 220].max())
        print(f"{'✅' if ok else '❌'} {p.name}\t{sr}Hz {sw * 8}bit ch{ch} {n / sr:.2f}s peak {pk:.2f}dBFS "
              f"시작지연 {lead:.1f}ms 주타격 {main:.1f}ms 타격봉우리 {hits}")


if __name__ == "__main__":
    {"a": do_a, "b": do_b, "check": check}[sys.argv[1] if len(sys.argv) > 1 else "check"]()
