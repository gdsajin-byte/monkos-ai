#!/usr/bin/env python3
"""초읽기 수사(하나~열) v2 — 끊김 개선 두 방식 비교 (PF_GO, 11-05 07:47 작가님 "툭툭 끊겨… 부자연스러운").

  sound_count_v2.py wide SLUG          A: 이어 읽기 정렬본(count_seqts)을 넓게 다시 자름 — 단어 사이 에너지 최소점을 경계로,
                                          낮은 문턱(−40dB)으로 앞 무음만 정리 후 앞 50ms 여유, 끝 100ms 페이드. 크레딧 0
  sound_count_v2.py ctx VOICE_ID SLUG  B: 숫자마다 단독 생성 + previous_text/next_text(문맥) → 앞뒤 무음 정리(같은 여유·페이드)
  sound_count_v2.py measure SLUG MODE  조각별 앞·뒤 무음(ms)·길이·타격 시작 에너지 표 + 10조각 이어 붙인 확인용 mp3 → STT
출력: ~/.monkos/go-board-sound-candidates/v2/{wide,ctx}/voice_<SLUG>_count{1..10}.wav
"""
import json, subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_candidates as sc
from sound_count_split import decode, write as write_wav

SR = 22050
WORDS = ["하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열"]
OUT = sc.OUT / "v2"
PRE, FADE = 0.05, 0.10  # 앞 여유 50ms, 끝 페이드 100ms
SIL_DB = -40.0  # 무음 판정(조각 최대 대비)


def env_db(x):
    win = int(0.005 * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same")) + 1e-12
    return 20 * np.log10(r / r.max())


def tidy(x):
    """−40dB 아래 앞·뒤 무음 정리 → 앞 50ms 여유, 끝은 소리 끝 + 100ms 페이드(페이드 구간을 소리 뒤에 붙임)."""
    e = env_db(x)
    on = np.where(e > SIL_DB)[0]
    a, b = on[0], on[-1]
    s = max(0, a - int(PRE * SR))
    t = min(len(x), b + int(FADE * SR))
    y = x[s:t].copy()
    if s == 0 and a < int(PRE * SR):  # 원본 앞 여유가 모자라면 0으로 채움
        y = np.concatenate([np.zeros(int(PRE * SR) - a), y])
    short = b + int(FADE * SR) - len(x)
    if short > 0:  # 원본이 말 끝 직후에 끝나면 무음을 덧대 페이드가 말 뒤에서만 걸리게(말소리 끝을 깎지 않음)
        y = np.concatenate([y, np.zeros(short)])
    f = min(int(FADE * SR), len(y) // 3)
    y[-f:] *= np.linspace(1, 0, f) ** 2
    return y


def wide(slug):
    raw, aj = sc.OUT / f"voice_{slug}_count_seqts.mp3", sc.OUT / f"voice_{slug}_count_seqts.json"
    al = json.loads(aj.read_text())
    ch, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None
    for c, s, e in zip(ch, st, en):
        if "가" <= c <= "힣":
            cur = [s, e] if cur is None else [cur[0], e]
        elif cur is not None:
            words.append(tuple(cur)); cur = None
    if cur is not None:
        words.append(tuple(cur))
    assert len(words) == 10, words
    x = decode(raw)
    e = env_db(x)
    cuts = [0]
    for (s0, e0), (s1, e1) in zip(words, words[1:]):
        a, b = int(e0 * SR), max(int(e0 * SR) + 1, int(s1 * SR))
        cuts.append(a + int(np.argmin(e[a:b + 1])))
    cuts.append(len(x))
    d = OUT / "wide"; d.mkdir(parents=True, exist_ok=True)
    for i, (a, b) in enumerate(zip(cuts, cuts[1:]), 1):
        write_wav(d / f"voice_{slug}_count{i}.wav", tidy(x[a:b]))
    print(f"ok wide {slug}")


def ctx(vid, slug):
    d = OUT / "ctx"; d.mkdir(parents=True, exist_ok=True)
    n = 0
    for i, w in enumerate(WORDS, 1):
        mp3 = d / f"voice_{slug}_count{i}.mp3"
        if not mp3.exists():
            prev = ". ".join(WORDS[max(0, i - 3):i - 1]) + "." if i > 1 else ""
            nxt = ". ".join(WORDS[i:i + 2]) + "." if i < 10 else ""
            body = {"text": w + ".", "model_id": sc.MODEL, "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}
            if prev:
                body["previous_text"] = prev
            if nxt:
                body["next_text"] = nxt
            mp3.write_bytes(sc.call("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128", body, raw=True))
            n += len(w) + 1
        write_wav(d / f"voice_{slug}_count{i}.wav", tidy(decode(mp3)))
    print(f"ok ctx {slug} chars {n}")


def measure(slug, mode):
    d = sc.OUT if mode == "old" else OUT / mode  # old = 현재 팩(정렬 분할 v1)
    rows, parts = [], []
    gap = np.zeros(int(0.3 * SR))
    for i in range(1, 11):
        with wave.open(str(d / f"voice_{slug}_count{i}.wav")) as f:
            x = np.frombuffer(f.readframes(f.getnframes()), "<i2").astype(np.float64) / 32767
        e = env_db(x)
        on = np.where(e > SIL_DB)[0]
        lead, tail = on[0] / SR * 1000, (len(x) - on[-1]) / SR * 1000
        first = e[:int(0.003 * SR)].max()  # 첫 3ms 레벨 — 높으면 앞이 잘린 것(소리가 무음 없이 바로 시작)
        rows.append(f"count{i}\t{WORDS[i - 1]}\t{len(x) / SR * 1000:.0f}ms\t앞무음 {lead:.0f}ms\t뒤꼬리 {tail:.0f}ms\t첫3ms {first:.0f}dB")
        parts += [x, gap]
    y = np.concatenate(parts)
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "c.wav"
        write_wav(w, y)
        joined = sc.OUT / f"voice_{slug}_v2{mode}_joined.mp3"
        subprocess.run(["afconvert", "-f", "mp4f", "-d", "aac", str(w), str(joined.with_suffix(".m4a"))], check=True)
    print("\n".join(rows))
    return joined.with_suffix(".m4a")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[0] == "wide":
        wide(a[1])
    elif a[0] == "ctx":
        ctx(a[1], a[2])
    elif a[0] == "measure":
        print("joined", measure(a[1], a[2]))
