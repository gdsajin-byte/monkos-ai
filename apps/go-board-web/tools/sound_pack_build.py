#!/usr/bin/env python3
"""후보 음원으로 앱 소리 팩 8개를 조립한다 (PF_GO, 11-05 06:15 작가님 "앱에 몇가지 선택버전으로 올려").

  sound_pack_build.py         → ~/.monkos/go-board-sounds/monk-{daniel,alice,george,river}-{a,b}/ (tygem-ref와 같은 파일명 25개 + README.txt)

파일 규격(앱 index.html buildSounds): count1~11·remain1~3·start·counting = 목소리, stone0·0s = 착수(0s=2번째 후보),
stone1~3·1s~3s = 따냄 1·2·3점+(s=2번째 후보). a팩 = A안(ElevenLabs 효과음), b팩 = B안(합성).
목소리: count1~10은 이어 읽기 정렬 분할본(sound_count_split.py), 나머지는 단독 생성 mp3를 앞뒤 무음 정리해 wav로.
기존 팩(tygem-ref 등)은 건드리지 않는다. 기본 팩 설정도 바꾸지 않는다(브라우저별 선택).
"""
import shutil, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np

SRC = Path.home() / ".monkos" / "go-board-sound-candidates"
PACKS = Path.home() / ".monkos" / "go-board-sounds"
SR = 22050
VOICES = {"daniel": "Daniel(차분한 해설형)", "alice": "Alice(또렷한 아나운서형)", "george": "George(따뜻한 중년형)", "river": "River(젊은 중성형)"}
SFX = {"a": "A안 ElevenLabs 효과음", "b": "B안 합성"}
SINGLE = ["count11", "remain1", "remain2", "remain3", "start", "counting"]


def trim_to_wav(mp3, dst):
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "d.wav"
        subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(mp3), str(w)], check=True)
        with wave.open(str(w)) as f:
            x = np.frombuffer(f.readframes(f.getnframes()), "<i2").astype(np.float64) / 32767
    win = int(0.01 * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))
    on = np.where(r > 0.03 * r.max())[0]
    a, b = max(0, on[0] - int(0.008 * SR)), min(len(x), on[-1] + int(0.06 * SR))
    y = x[a:b].copy()
    fade = int(0.03 * SR)
    y[-fade:] *= np.linspace(1, 0, fade)
    y = y / (np.max(np.abs(y)) or 1) * 10 ** (-1 / 20)
    with wave.open(str(dst), "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR)
        f.writeframes((y * 32767).astype("<i2").tobytes())
    return len(y) / SR


def main():
    need = [SRC / f"voice_{v}_count{i}.wav" for v in VOICES for i in range(1, 11)]
    need += [SRC / f"voice_{v}_{t}.mp3" for v in VOICES for t in SINGLE]
    need += [SRC / f"{k}_{s}{i}.wav" for s in SFX for k, n in (("stone", 2), ("capture", 2)) for i in range(1, n + 1)]
    miss = [p.name for p in need if not p.exists()]
    if miss:
        sys.exit("❌ sound_pack_build: 원본 누락 " + ", ".join(miss))
    v2 = len(sys.argv) > 1 and sys.argv[1] == "v2"
    if v2:  # 11-05 07:47 작가님 "툭툭 끊겨" — v1 정렬 분할은 앞을 잘라먹음(첫 3ms −19~−31dB 실측). 숫자는 문맥 단독 생성본
        from sound_count_v2 import tidy
        from sound_count_split import decode, write as write_wav
        miss = [p.name for p in (SRC / "v2" / "ctx" / f"voice_{v}_count{i}.wav" for v in VOICES for i in range(1, 11)) if not p.exists()]
        if miss:
            sys.exit("❌ sound_pack_build: v2 원본 누락 " + ", ".join(miss))
    for v, vlabel in VOICES.items():
        for s, slabel in SFX.items():
            d = PACKS / (f"monk-v2-{v}-{s}" if v2 else f"monk-{v}-{s}")  # v2는 새 팩 — v1을 덮어쓰지 않는다(비교용)
            d.mkdir(parents=True, exist_ok=True)
            for i in range(1, 11):
                src = SRC / "v2" / "ctx" / f"voice_{v}_count{i}.wav" if v2 else SRC / f"voice_{v}_count{i}.wav"
                shutil.copyfile(src, d / f"count{i}.wav")
            for t in SINGLE:
                if v2:  # 앞 50ms·끝 100ms 여유(−40dB 기준) — v1 trim_to_wav(문턱 3%·앞 8ms)는 약한 첫소리를 깎을 수 있음
                    write_wav(d / f"{t}.wav", tidy(decode(SRC / f"voice_{v}_{t}.mp3")))
                else:
                    trim_to_wav(SRC / f"voice_{v}_{t}.mp3", d / f"{t}.wav")
            shutil.copyfile(SRC / f"stone_{s}1.wav", d / "stone0.wav")
            shutil.copyfile(SRC / f"stone_{s}2.wav", d / "stone0s.wav")
            for k in (1, 2, 3):
                shutil.copyfile(SRC / f"capture_{s}1.wav", d / f"stone{k}.wav")
                shutil.copyfile(SRC / f"capture_{s}2.wav", d / f"stone{k}s.wav")
            (d / "README.txt").write_text(
                f"MONK 자체 후보{' v2(끊김 개선)' if v2 else ''} — 목소리 {vlabel} · 착수/따냄 {slabel} (11-05, ElevenLabs·합성)\n"
                "생성: apps/go-board-web/tools/sound_*.py · 후보 비교 ~/.monkos/go-board-sound-candidates/ · "
                "count11은 규격 채움(앱 미재생), 따냄 1·2·3점은 같은 소리(2단계에서 분화)\n", encoding="utf-8")
            n = len(list(d.glob("*.wav")))
            print(f"ok {d.name}: wav {n}개")


if __name__ == "__main__":
    main()
