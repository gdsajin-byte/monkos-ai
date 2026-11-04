#!/usr/bin/env python3
"""초읽기 수사(하나~열)를 한 번에 이어 읽혀 무음 구간에서 10조각으로 자른다 (PF_GO, 11-05 막내2).

이유: 기본(영어권) 목소리는 맥락 없는 단음절("셋"·"넷"·"아홉")을 영어처럼 읽는다(STT 되읽기 "See"·"ness"·"Ahab").
이어 읽기로 한국어 맥락을 주면 발음이 안정된다 — 조각마다 STT로 되읽어 확인한다.

  sound_count_split.py VOICE_ID SLUG   → ~/.monkos/go-board-sound-candidates/voice_<SLUG>_count{1..10}.wav (22.05kHz 16bit 모노)
실패 가시화: 조각 수 ≠ 10이면 ❌ + exit 1(파일 쓰지 않음).
"""
import subprocess, sys, tempfile, wave
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_candidates as sc

SR = 22050
TEXT = "하나. 둘. 셋. 넷. 다섯. 여섯. 일곱. 여덟. 아홉. 열."


def decode(mp3):
    with tempfile.TemporaryDirectory() as td:
        w = Path(td) / "d.wav"
        subprocess.run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1", str(mp3), str(w)], check=True)
        with wave.open(str(w)) as f:
            return np.frombuffer(f.readframes(f.getnframes()), "<i2").astype(np.float64) / 32767


def segments(x, gap=0.12, rel=0.04):
    """음성 구간: 20ms 창 RMS가 최대의 4% 위. gap초 이상 끊기면 다른 조각."""
    win = int(0.02 * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))
    on = r > rel * r.max()
    segs, start, last = [], None, None
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            elif i - last > gap * SR:
                segs.append((start, last)); start = i
            last = i
    if start is not None:
        segs.append((start, last))
    return [(s, e) for s, e in segs if e - s > 0.06 * SR]  # 60ms 미만 잡음 제외


def write(path, y):
    y = y / (np.max(np.abs(y)) or 1) * 10 ** (-1 / 20)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype("<i2").tobytes())


def by_alignment(vid, slug):
    """글자별 시각 정렬(/with-timestamps)로 단어 경계를 정확히 — 단어 i 끝과 i+1 시작 사이 구간에서 에너지 최소점으로 자른다."""
    import base64, json
    raw, aj = sc.OUT / f"voice_{slug}_count_seqts.mp3", sc.OUT / f"voice_{slug}_count_seqts.json"
    if not aj.exists():
        r = sc.call("POST", f"/v1/text-to-speech/{vid}/with-timestamps?output_format=mp3_44100_128",
                    {"text": TEXT, "model_id": sc.MODEL, "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}})
        raw.write_bytes(base64.b64decode(r["audio_base64"]))
        aj.write_text(json.dumps(r.get("alignment") or r.get("normalized_alignment"), ensure_ascii=False))
        print(f"tts(with-timestamps) {slug} chars {len(TEXT)}")
    al = json.loads(aj.read_text())
    ch, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    words, cur = [], None  # (시작초, 끝초) — 한글 음절만 단어로 묶는다
    for c, s, e in zip(ch, st, en):
        if "가" <= c <= "힣":
            cur = [s, e] if cur is None else [cur[0], e]
        elif cur is not None:
            words.append(tuple(cur)); cur = None
    if cur is not None:
        words.append(tuple(cur))
    if len(words) != 10:
        sys.exit(f"❌ sound_count_split: {slug} 정렬 단어 {len(words)}개(10 아님)")
    x = decode(raw)
    win = int(0.01 * SR)
    r = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, "same"))
    cuts = [0]
    for (s0, e0), (s1, e1) in zip(words, words[1:]):
        a, b = int(e0 * SR), max(int(e0 * SR) + 1, int(s1 * SR))
        cuts.append(a + int(np.argmin(r[a:b + 1])))
    cuts.append(len(x))
    segs = []
    for a, b in zip(cuts, cuts[1:]):
        seg_r = r[a:b]
        on = np.where(seg_r > 0.04 * r.max())[0]
        segs.append((a + on[0], a + on[-1]) if len(on) else (a, b))
    return x, segs, words


def main(vid, slug, mode="align"):
    if mode == "align":
        x, segs, words = by_alignment(vid, slug)
        pad_a, pad_b, fade = int(0.008 * SR), int(0.05 * SR), int(0.03 * SR)
        for i, ((s, e), (ws, we)) in enumerate(zip(segs, words), 1):
            y = x[max(0, s - pad_a): min(len(x), e + pad_b)].copy()
            y[-fade:] *= np.linspace(1, 0, fade)
            write(sc.OUT / f"voice_{slug}_count{i}.wav", y)
            print(f"ok voice_{slug}_count{i}.wav {len(y) / SR:.2f}s (정렬 {ws:.2f}-{we:.2f}s, 자름 {s / SR:.2f}-{e / SR:.2f}s)")
        return
    _legacy_split(vid, slug)


def _legacy_split(vid, slug):
    raw = sc.OUT / f"voice_{slug}_count_seq.mp3"
    if not raw.exists():
        b = sc.call("POST", f"/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                    {"text": TEXT, "model_id": sc.MODEL, "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}}, raw=True)
        raw.write_bytes(b)
        print(f"tts {slug} chars {len(TEXT)}")
    x = decode(raw)
    # 목소리마다 단어 사이 쉼이 달라(11-05 실측: alice 7·george 9·river 4조각) 문턱·간격을 바꿔 가며 정확히 10조각인 값을 찾는다
    segs, tried = None, []
    for rel in (0.04, 0.06, 0.08, 0.1, 0.13, 0.16, 0.2, 0.03, 0.02):
        for gap in (0.12, 0.09, 0.07, 0.05, 0.04, 0.03):
            s = segments(x, gap=gap, rel=rel)
            tried.append(len(s))
            if len(s) == 10:
                segs = s
                print(f"split {slug}: rel {rel} gap {gap}")
                break
        if segs:
            break
    if not segs:
        sys.exit(f"❌ sound_count_split: {slug} 10조각 분할 실패 — 시도별 조각 수 {sorted(set(tried))}")
    pad_a, pad_b, fade = int(0.008 * SR), int(0.05 * SR), int(0.03 * SR)
    for i, (s, e) in enumerate(segs, 1):
        y = x[max(0, s - pad_a): min(len(x), e + pad_b)].copy()
        y[-fade:] *= np.linspace(1, 0, fade)
        write(sc.OUT / f"voice_{slug}_count{i}.wav", y)
        print(f"ok voice_{slug}_count{i}.wav {len(y) / SR:.2f}s")


if __name__ == "__main__":
    main(*sys.argv[1:4])
