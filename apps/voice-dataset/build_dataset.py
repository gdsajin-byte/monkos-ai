#!/usr/bin/env python3
"""목소리 데이터셋 v0 — 보컬 트랙 받아쓰기(faster-whisper 단어 시각) → 문장 2~15초 조각 → 화자·품질 선별 → dataset_v0 (PF_PRESENTATION, ORDER_20261106 3~6항)
  build_dataset.py transcribe   → misa/asr/{ID}.json (편마다, 이미 있으면 건너뜀)
  build_dataset.py build        → misa/dataset_v0/{wavs/*.wav 24kHz 모노, metadata.csv, samples/, quality.json, quality.md}
선별(조각 단위, 모두 숫자로 남긴다):
  음량  — RMS < −35 dBFS 버림 / 클리핑 — |x| ≥ 0.99 표본 0.1%↑ 버림
  잡음  — 조각 안 20ms 프레임 에너지 상위 10% − 하위 10%(SNR 추정) < 25 dB 버림
  배경  — demucs 배경 트랙(no_vocals) 에너지가 보컬보다 −12 dB보다 크면(음악·현장음이 큼) 버림
  받아쓰기 — 평균 logprob < −0.8 또는 no_speech > 0.5 버림
  화자  — 조각 목소리 높이(F0 중앙값)·MFCC 평균이 전체 중앙값에서 크게 벗어나면(강건 z > 3.5) 다른 화자로 보고 버림
"""
import csv, json, math, subprocess, sys
from pathlib import Path
import numpy as np
import imageio_ffmpeg

M = Path.home() / ".monkos/voice/misa"
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 16000


def load(path, sr=SR):
    raw = subprocess.run([FF, "-loglevel", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def transcribe():
    from faster_whisper import WhisperModel
    m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=int(__import__("os").environ.get("VS_THREADS", "3")))
    (M / "asr").mkdir(exist_ok=True)
    for v in sorted((M / "vocals").glob("*.wav")):
        out = M / "asr" / f"{v.stem}.json"
        if out.exists():
            continue
        segs, info = m.transcribe(load(v), language="ko", vad_filter=True, beam_size=5, word_timestamps=True, condition_on_previous_text=False)
        rows = [{"start": s.start, "end": s.end, "text": s.text.strip(), "avg_logprob": s.avg_logprob, "no_speech": s.no_speech_prob,
                 "words": [[w.start, w.end, w.word, w.probability] for w in (s.words or [])]} for s in segs]
        out.write_text(json.dumps(rows, ensure_ascii=False))
        print(v.stem, len(rows), "문장", flush=True)


def clips_from(rows):
    """whisper 문장 → 2~15초 조각. 15초 넘으면 단어 경계(가장 긴 쉼)에서 자르고, 2초 미만은 버린다."""
    out = []
    for s in rows:
        ws = s["words"]
        if not ws:
            continue
        stack = [ws]
        while stack:
            w = stack.pop()
            a, b = w[0][0], w[-1][1]
            if b - a > 15 and len(w) > 2:
                gaps = [(w[i + 1][0] - w[i][1], i) for i in range(len(w) - 1)]
                _, i = max(gaps)
                stack += [w[i + 1:], w[:i + 1]]
                continue
            if b - a >= 2:
                out.append({"start": max(0.0, a - 0.15), "end": b + 0.15, "text": "".join(x[2] for x in w).strip(), "words": w,
                            "avg_logprob": s["avg_logprob"], "no_speech": s["no_speech"]})
    return sorted(out, key=lambda c: c["start"])


def f0_med(x):
    if len(x) < 2048:
        return None
    fr = np.lib.stride_tricks.sliding_window_view(x, 1024)[::320]
    fr = fr - fr.mean(axis=1, keepdims=True)
    e = (fr ** 2).mean(axis=1)
    fr = fr[e >= np.quantile(e, 0.5)]
    if not len(fr):
        return None
    sp = np.fft.rfft(fr * np.hanning(1024), n=2048)
    ac = np.fft.irfft(np.abs(sp) ** 2)[:, :400]
    ac = ac / np.maximum(ac[:, :1], 1e-9)
    lo, hi = SR // 400, SR // 70
    lag = lo + ac[:, lo:hi].argmax(axis=1)
    pk = ac[np.arange(len(ac)), lag]
    f = SR / lag[pk > 0.4]
    return float(np.median(f)) if len(f) >= 5 else None


def mfcc_mean(x, n=13):
    fr = np.lib.stride_tricks.sliding_window_view(x, 400)[::160] * np.hamming(400)
    p = np.abs(np.fft.rfft(fr, n=512)) ** 2
    mel = lambda f: 2595 * np.log10(1 + f / 700)
    imel = lambda m: 700 * (10 ** (m / 2595) - 1)
    pts = imel(np.linspace(mel(60), mel(7600), 42))
    bins = np.floor(513 * pts / SR).astype(int)
    fb = np.zeros((40, 257))
    for i in range(40):
        l, c, r = bins[i], bins[i + 1], bins[i + 2]
        if c > l:
            fb[i, l:c] = (np.arange(l, c) - l) / (c - l)
        if r > c:
            fb[i, c:r] = (r - np.arange(c, r)) / (r - c)
    lm = np.log(p @ fb.T + 1e-10)
    k = np.arange(40)
    dct = np.cos(np.pi / 40 * (k + 0.5)[None, :] * np.arange(n)[:, None])
    return (lm @ dct.T)[:, 1:].mean(axis=0)  # c0(음량) 제외


def db(x):
    return 10 * math.log10(max(float(np.mean(x ** 2)), 1e-12))


def build():
    tg = {r["id"]: r for r in json.loads((M / "targets.json").read_text())}
    D = M / "dataset_v0"
    (D / "wavs").mkdir(parents=True, exist_ok=True)
    for old in list((D / "wavs").glob("*.wav")) + list((D / "samples").glob("*.wav")):  # 다시 묶을 때 지난 조각이 섞이지 않게(이 스크립트가 만든 파일만)
        old.unlink()
    allc = []
    for a in sorted((M / "asr").glob("*.json")):
        vid = a.stem
        voc = load(M / "vocals" / f"{vid}.wav")
        bgf = M / "demucs_tmp" / "htdemucs" / vid / "no_vocals.wav"
        bg = load(bgf) if bgf.exists() else None
        for i, c in enumerate(clips_from(json.loads(a.read_text()))):
            s0, s1 = int(c["start"] * SR), int(c["end"] * SR)
            x = voc[s0:s1]
            if len(x) < SR:
                continue
            # SNR = 조각 안 20ms 프레임 에너지 상위 10% − 하위 10%(dB). 11-06 1차는 '단어 사이 틈'으로 쟀으나
            # whisper 단어 시각에 틈이 거의 없어 대부분 조각이 SNR 없음으로 검사를 건너뜀 → 모든 조각에 값이 나오는 분위 방식으로 교체
            fe = np.lib.stride_tricks.sliding_window_view(x, 320)[::320]
            fe = 10 * np.log10((fe ** 2).mean(axis=1) + 1e-12)
            snr = float(np.percentile(fe, 90) - np.percentile(fe, 10))
            bgr = (db(bg[s0:s1]) - db(x)) if bg is not None and len(bg) >= s1 else None
            allc.append({"id": vid, "n": i, "start": round(c["start"], 2), "end": round(c["end"], 2), "dur": round(c["end"] - c["start"], 2),
                         "text": c["text"], "rms_db": round(db(x), 1), "clip_frac": float(np.mean(np.abs(x) >= 0.99)), "snr_db": None if snr is None else round(snr, 1),
                         "bg_rel_db": None if bgr is None else round(bgr, 1), "avg_logprob": round(c["avg_logprob"], 3), "no_speech": round(c["no_speech"], 3),
                         "f0": f0_med(x), "mfcc": mfcc_mean(x).tolist()})
    # 화자 — 강건 z(중앙값·MAD). F0와 MFCC 거리 둘 중 하나라도 3.5 넘으면 다른 화자 후보
    f0s = np.array([c["f0"] for c in allc if c["f0"]])
    fm, fmad = np.median(f0s), np.median(np.abs(f0s - np.median(f0s))) * 1.4826
    mf = np.array([c["mfcc"] for c in allc])
    cen = np.median(mf, axis=0)
    dist = np.linalg.norm((mf - cen) / (np.median(np.abs(mf - cen), axis=0) * 1.4826 + 1e-6), axis=1)
    dm, dmad = np.median(dist), np.median(np.abs(dist - np.median(dist))) * 1.4826
    for c, d in zip(allc, dist):
        c["f0_z"] = None if not c["f0"] else round((c["f0"] - fm) / (fmad + 1e-6), 2)
        c["mfcc_z"] = round(float((d - dm) / (dmad + 1e-6)), 2)
        why = []
        if c["rms_db"] < -35: why.append("음량 작음")
        if c["clip_frac"] >= 0.001: why.append("클리핑")
        if c["snr_db"] is not None and c["snr_db"] < 25: why.append("잡음(SNR<25)")
        if c["bg_rel_db"] is not None and c["bg_rel_db"] > -12: why.append("배경 큼")
        if c["avg_logprob"] < -0.8 or c["no_speech"] > 0.5: why.append("받아쓰기 불확실")
        if (c["f0_z"] is not None and abs(c["f0_z"]) > 3.5) or c["mfcc_z"] > 3.5: why.append("다른 화자 의심")
        c["drop"] = why
    keep = [c for c in allc if not c["drop"]]
    with open(D / "metadata.csv", "w", newline="") as fh:
        w = csv.writer(fh, delimiter="|")
        for c in keep:
            fn = f"{c['id']}_{c['n']:04d}.wav"
            subprocess.run([FF, "-loglevel", "error", "-y", "-ss", str(c["start"]), "-to", str(c["end"]), "-i", str(M / "vocals" / f"{c['id']}.wav"),
                            "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", str(D / "wavs" / fn)], check=True)
            w.writerow([f"wavs/{fn}", c["text"]])
            c["file"] = f"wavs/{fn}"
    (D / "samples").mkdir(exist_ok=True)
    best = sorted([c for c in keep if c["snr_db"] is not None and 4 <= c["dur"] <= 12], key=lambda c: -(c["snr_db"] - max(c["bg_rel_db"] or -60, -60) * 0.2))[:5]
    for c in best:
        subprocess.run(["cp", str(D / c["file"]), str(D / "samples" / Path(c["file"]).name)], check=True)
    from collections import Counter
    per = []
    for vid, r in tg.items():
        cs = [c for c in allc if c["id"] == vid]
        per.append({"id": vid, "title": r["title"][:30], "dur_s": r["duration"], "clip_s": round(sum(c["dur"] for c in cs), 1),
                    "keep_s": round(sum(c["dur"] for c in cs if not c["drop"]), 1), "clips": len(cs), "keep": sum(1 for c in cs if not c["drop"]),
                    "drop_why": dict(Counter(w for c in cs for w in c["drop"]))})
    tot_keep = sum(c["dur"] for c in keep)
    summ = {"videos": len(tg), "source_min": round(sum(r["duration"] for r in tg.values()) / 60, 1), "clip_min": round(sum(c["dur"] for c in allc) / 60, 1),
            "keep_min": round(tot_keep / 60, 1), "clips": len(allc), "keep": len(keep), "pass_10min": tot_keep >= 600,
            "drop_why": dict(Counter(w for c in allc for w in c["drop"])), "f0_median_hz": round(float(fm), 1), "samples": [c["file"] for c in best],
            "per_video": per}
    for c in allc:
        c.pop("mfcc")
    (D / "quality.json").write_text(json.dumps({"summary": summ, "clips": allc}, ensure_ascii=False, indent=1))
    md = [f"# 목소리 데이터셋 v0 품질 요약", f"- 원 분량 {summ['source_min']}분 → 문장 조각 {summ['clip_min']}분({len(allc)}개) → **남은 {summ['keep_min']}분({len(keep)}개)** · 10분 기준 {'합격' if summ['pass_10min'] else '미달'}",
          f"- 버린 사유(조각 수, 중복 포함): {summ['drop_why']}", f"- 목소리 높이 중앙값 {summ['f0_median_hz']}Hz", "",
          "| 편 | 제목 | 원(초) | 조각(초) | 남음(초) | 조각 남음/전체 | 버린 사유 |", "|---|---|---|---|---|---|---|"]
    md += [f"| {p['id']} | {p['title']} | {p['dur_s']} | {p['clip_s']} | {p['keep_s']} | {p['keep']}/{p['clips']} | {p['drop_why']} |" for p in per]
    (D / "quality.md").write_text("\n".join(md))
    print("\n".join(md))


if __name__ == "__main__":
    {"transcribe": transcribe, "build": build}[sys.argv[1]]()
