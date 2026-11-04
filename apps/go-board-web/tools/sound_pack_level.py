#!/usr/bin/env python3
"""우리 소리 팩(monk-*)의 음성 파일을 말소리 RMS −18dBFS로 맞춘다 (PF_GO, 11-05 08:20 쌍아 승인 — REPORT 초읽기끊김 고침안 3).

- 대상: ~/.monkos/go-board-sounds/monk-*/ 의 count1~11·remain1~3·start·counting (.wav). 착수·따냄(stone*)은 타격음이라 제외.
- 타사 참조 팩(tygem-ref)은 손대지 않는다(가공 금지).
- 말소리 구간(−30dB 위) RMS를 −18dBFS로, 단 피크가 −1dBFS를 넘으면 피크 상한으로 낮춘다(클리핑 금지).
  sound_pack_level.py [--dry]   → 파일별 이전·이후 RMS/피크 요약
"""
import sys, wave
from pathlib import Path
import numpy as np

PACKS = Path.home() / ".monkos" / "go-board-sounds"
TARGET, PEAK = -18.0, -1.0
VOICE = [f"count{i}" for i in range(1, 12)] + ["remain1", "remain2", "remain3", "start", "counting"]


def speech_rms_db(x, sr):
    win = int(0.005 * sr)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same")) + 1e-12
    on = np.where(20 * np.log10(r / r.max()) > -30)[0]
    seg = x[on[0]:on[-1] + 1] if len(on) else x
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)


def main(dry):
    rows = []
    for d in sorted(PACKS.glob("monk-*")):
        for name in VOICE:
            p = d / f"{name}.wav"
            if not p.exists():
                continue
            with wave.open(str(p)) as f:
                sr, n = f.getframerate(), f.getnframes()
                x = np.frombuffer(f.readframes(n), "<i2").astype(np.float64) / 32767
            r0, p0 = speech_rms_db(x, sr), 20 * np.log10(np.max(np.abs(x)) + 1e-12)
            gain = TARGET - r0
            gain = min(gain, PEAK - p0)  # 피크 상한
            y = x * 10 ** (gain / 20)
            rows.append((d.name, name, r0, p0, speech_rms_db(y, sr), 20 * np.log10(np.max(np.abs(y)) + 1e-12)))
            if not dry:
                with wave.open(str(p), "wb") as f:
                    f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
                    f.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
    by = {}
    for pk, _, r0, p0, r1, p1 in rows:
        by.setdefault(pk, []).append((r0, r1, p1))
    for pk, v in by.items():
        a = np.array(v)
        print(f"{pk:22s} 파일 {len(v):2d} · RMS {a[:, 0].mean():.1f}→{a[:, 1].mean():.1f}dBFS(최저 {a[:, 1].min():.1f}) · 피크 최대 {a[:, 2].max():.1f}dBFS")
    print(f"합계 {len(rows)}개{' (dry)' if dry else ''}")


if __name__ == "__main__":
    main("--dry" in sys.argv)
