#!/usr/bin/env python3
"""초읽기 음성 재작업 — 1테이크 이어 읽기 + 무음 기준 자르기 + 피치·음량 일관성 검사 + 청취 파일 (PF_GO, 11-05 09:12 작가님 전면 재작업).

작가님 09:12 "하나도 못써 전면 다시 작업해" — 숫자별 단독 생성은 톤이 들쭉날쭉. STT 통과≠합격.
  sound_take.py gen SLUG VOICE_ID MODEL TAKE SEED      "하나. 둘. … 열." 1회 생성(안정성 높게·스타일 0·약간 느리게·시드 고정)
  sound_take.py ann SLUG VOICE_ID MODEL TAKE SEED      안내 3문구(같은 설정)
  sound_take.py split NAME                             무음 구간 기준 10조각(앞 80ms·뒤 150ms 여유, 짧은 페이드)
  sound_take.py stats NAME                             숫자별 F0 중앙값·음량 → 편차 표
  sound_take.py listen NAME                            10초 초읽기 실제 재생 흉내 15초 m4a
NAME = {slug}_{model}_t{take}. 출력: ~/.monkos/go-board-sound-candidates/take/
"""
import json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_candidates as sc
from sound_count_split import decode, write as write_wav

SR = 22050
D = sc.OUT / "take"
SEQ = "하나. 둘. 셋. 넷. 다섯. 여섯. 일곱. 여덟. 아홉. 열."
# 변형 nl: 숫자마다 문단(줄바꿈 2번) — 쉼을 길게·목록 억양(오르내림 교대) 줄이기. TAKE 이름에 'n'이 붙으면 이 문안
SEQ_NL = "\n\n".join(w + "." for w in ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"])
WORDS = ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"]
ANN = [("remain3", "초읽기 세 번 남았습니다."), ("remain2", "초읽기 두 번 남았습니다."), ("remain1", "초읽기 마지막 회입니다.")]
# 짧은 안내(1초 안) — 11-05 09:22 박자 우선: 안내는 새 회 시작 격자에 1칸만 차지(10초 초읽기는 그 회 '하나' 자리). TAKE에 's' 접미
ANN_SHORT = [("remain3", "세 번 남음."), ("remain2", "두 번 남음."), ("remain1", "마지막 회.")]
PRE, POST, FIN, FOUT = 0.08, 0.15, 0.005, 0.03


def settings(model):
    if model in ("eleven_v3", "eleven_v4"):  # v3 계열 안정성은 0·0.5·1 단계 — 가장 안정(1.0)
        return {"stability": 1.0, "similarity_boost": 0.8, "style": 0.0, "speed": 0.95}
    return {"stability": 0.85, "similarity_boost": 0.8, "style": 0.0, "use_speaker_boost": True, "speed": 0.95}


def tts(vid, model, text, seed):
    body = {"text": text, "model_id": model, "voice_settings": settings(model), "seed": int(seed)}
    return sc.call("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128", body, raw=True)


def gen(slug, vid, model, take, seed):
    D.mkdir(parents=True, exist_ok=True)
    name = f"{slug}_{model}_t{take}"
    p = D / f"{name}.mp3"
    if not p.exists():
        text = SEQ_NL if str(take).startswith("n") else SEQ
        p.write_bytes(tts(vid, model, text, seed))
        (D / f"{name}.json").write_text(json.dumps({"slug": slug, "voice_id": vid, "model": model, "seed": int(seed),
                                                    "settings": settings(model), "text": text}, ensure_ascii=False))
        print(f"tts {name} chars {len(text)}")


def ann(slug, vid, model, take, seed, short=""):
    name = f"{slug}_{model}_t{take}"
    n = 0
    for tag, text in (ANN_SHORT if short else ANN):
        p = D / f"{name}_{tag}{'s' if short else ''}.mp3"
        if not p.exists():
            p.write_bytes(tts(vid, model, text, seed)); n += len(text)
    print(f"ann {name} chars {n}")


def env_db(x, win_s=0.01):
    win = int(win_s * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same")) + 1e-12
    return 20 * np.log10(r / r.max())


def split(name):
    x = decode(D / f"{name}.mp3")
    e = env_db(x)
    for thr in (-40, -35, -45, -30, -50):
        sil = e < thr
        gaps, i = [], 0
        while i < len(sil):  # 무음 구간 [a, b)
            if sil[i]:
                j = i
                while j < len(sil) and sil[j]:
                    j += 1
                gaps.append((i, j)); i = j
            else:
                i += 1
        inner = [g for g in gaps if g[0] > 0 and g[1] < len(x) and g[1] - g[0] >= int(0.06 * SR)]
        if len(inner) >= 9:
            inner = sorted(sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[:9])
            break
    else:
        sys.exit(f"❌ sound_take: {name} 무음 기준 10조각 실패")
    on = np.where(e > thr)[0]
    bounds = [(on[0], None)] + [(g[1], g[0]) for g in inner] + [(None, on[-1])]
    starts = [on[0]] + [g[1] for g in inner]
    ends = [g[0] for g in inner] + [on[-1]]
    out = D / name
    out.mkdir(exist_ok=True)
    mids = [0] + [(g[0] + g[1]) // 2 for g in inner] + [len(x)]
    lens = []
    for i, (s, t) in enumerate(zip(starts, ends), 1):
        a = max(mids[i - 1], s - int(PRE * SR))
        b = min(mids[i], t + int(POST * SR))
        y = x[a:b].copy()
        if s - a < int(PRE * SR):
            y = np.concatenate([np.zeros(int(PRE * SR) - (s - a)), y])
        if b - t < int(POST * SR):
            y = np.concatenate([y, np.zeros(int(POST * SR) - (b - t))])
        fi, fo = int(FIN * SR), int(FOUT * SR)
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
        write_wav(out / f"count{i}.wav", y)
        lens.append(len(y) / SR)
    for tag, _ in ANN:
        p = D / f"{name}_{tag}s.mp3"  # 짧은 안내가 있으면 그것을 쓴다
        if not p.exists():
            p = D / f"{name}_{tag}.mp3"
        if p.exists():
            z = decode(p); ez = env_db(z); o = np.where(ez > -40)[0]
            a, b = max(0, o[0] - int(PRE * SR)), min(len(z), o[-1] + int(POST * SR))
            y = z[a:b].copy(); fo = int(FOUT * SR); y[-fo:] *= np.linspace(1, 0, fo)
            write_wav(out / f"{tag}.wav", y)
    print(f"split {name} 문턱 {thr}dB · 조각 길이 {min(lens):.2f}~{max(lens):.2f}s")


def level(name, target=-18.0, peak=-1.0):
    """숫자·안내마다 말소리 RMS를 −18dBFS로(음색 무변경, 크기만). 피크 −1dBFS 상한. 같은 테이크 안 숫자 간 음량 차를 없앤다."""
    for p in sorted((D / name).glob("*.wav")):
        with wave.open(str(p)) as w:
            y = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767
        e = env_db(y); v = y[e > -30]
        r = 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12)
        g = min(target - r, peak - 20 * np.log10(np.max(np.abs(y)) + 1e-12))
        with wave.open(str(p), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((np.clip(y * 10 ** (g / 20), -1, 1) * 32767).astype("<i2").tobytes())


def f0_median(y):
    """자기상관 기반 F0(75~400Hz) — 40ms 창·10ms 이동, 유성 프레임(자기상관 0.5 이상) 중앙값."""
    n, hop = int(0.04 * SR), int(0.01 * SR)
    lo, hi = int(SR / 400), int(SR / 75)
    e = env_db(y, 0.02)
    f = []
    for s in range(0, len(y) - n, hop):
        if e[s + n // 2] < -20:
            continue
        w = y[s:s + n] - y[s:s + n].mean()
        ac = np.correlate(w, w, "full")[n - 1:]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] > 0.5:
            f.append(SR / lag)
    return float(np.median(f)) if f else float("nan"), len(f)


def stats(name):
    rows = []
    for i in range(1, 11):
        with wave.open(str(D / name / f"count{i}.wav")) as w:
            y = np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767
        f0, nv = f0_median(y)
        e = env_db(y); v = y[e > -30]
        rows.append((WORDS[i - 1], f0, nv, 20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12), len(y) / SR))
    f = np.array([r[1] for r in rows]); L = np.array([r[3] for r in rows])
    st = 12 * np.log2(f / np.nanmedian(f))
    res = {"name": name, "f0_med_hz": round(float(np.nanmedian(f)), 1), "f0_std_st": round(float(np.nanstd(st)), 2),
           "f0_range_st": round(float(np.nanmax(st) - np.nanmin(st)), 2), "loud_std_db": round(float(np.std(L)), 2),
           "loud_range_db": round(float(L.max() - L.min()), 2),
           "rows": [f"{w} {fz:.0f}Hz({s:+.1f}st) {l:.1f}dB {d:.2f}s" for (w, fz, nv, l, d), s in zip(rows, st)]}
    print(json.dumps(res, ensure_ascii=False))
    return res


def listen(name):
    """10초 초읽기 실제 재생 흉내(11-05 박자 우선 규칙 — 앱 cdSchedule과 같음): 0~9초 하나~열(정확히 1초 격자)
    → 10초 격자에 '마지막 회' 안내(그 회 '하나' 자리를 대신) → 11초부터 둘·셋… 정박 → 15초까지. 몰아 읽기 없음.
    각 조각은 앞 80ms 여유가 있으므로 격자 시각 − 80ms에 놓아 말소리 시작이 격자에 맞게 한다."""
    def load(p):
        with wave.open(str(p)) as w:
            return np.frombuffer(w.readframes(w.getnframes()), "<i2").astype(np.float64) / 32767
    out = np.zeros(int(15.6 * SR))
    def put(t, y):
        s = max(0, int((t + 0.1 - PRE) * SR)); out[s:s + len(y)] += y[:len(out) - s]
    for i in range(1, 11):
        put(i - 1, load(D / name / f"count{i}.wav"))
    r = D / name / "remain1.wav"
    if r.exists():
        put(10.0, load(r))
    for k in range(2, 7):  # 11~15초: 둘~여섯
        put(10.0 + (k - 1), load(D / name / f"count{k}.wav"))
    out = out / (np.max(np.abs(out)) or 1) * 10 ** (-1 / 20)
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "l.wav"; write_wav(w, out)
        m4a = D / f"listen_{name}.m4a"
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", str(w), str(m4a)], check=True)
    print(f"listen {m4a}")


if __name__ == "__main__":
    a = sys.argv[1:]
    {"gen": lambda: gen(*a[1:6]), "ann": lambda: ann(*a[1:7]), "split": lambda: split(a[1]), "level": lambda: level(a[1]),
     "stats": lambda: stats(a[1]), "listen": lambda: listen(a[1])}[a[0]]()
