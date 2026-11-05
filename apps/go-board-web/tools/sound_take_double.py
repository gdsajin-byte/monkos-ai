#!/usr/bin/env python3
"""기운 높음 테이크 — '하나! … 열!'을 한 테이크에 두 번 이어 읽혀 두 번째 바퀴만 쓴다 (PF_GO, 11-05 09:51).

이유: 높은 기운(안정성 0.45·스타일 0.5·느낌표)은 첫 '하나'와 '셋'에 강세가 몰려 +4~9반음 튐(시드 5개 실측).
두 번째 바퀴는 시작 강세가 빠진다 — 같은 1테이크 안이라 톤·음색 동일, 피치 가공 없음.
  sound_take_double.py SLUG VOICE_ID TAKE SEED   → take/{SLUG}_eleven_multilingual_v2_t{TAKE}/count1~10.wav (+ stats 출력)
"""
import io, contextlib, json, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_take as T
from sound_count_split import decode, write as write_wav

MODEL = "eleven_multilingual_v2"


def main(slug, vid, take, seed):
    vs, sep = T.PROFILES["h"]
    text = (sep.join(T.WORDS) + sep.strip() + " ") * 2
    name = f"{slug}_{MODEL}_t{take}"
    p = T.D / f"{name}.mp3"
    if not p.exists():
        p.write_bytes(T.tts(vid, MODEL, text.strip(), seed, vs))
        (T.D / f"{name}.json").write_text(json.dumps({"voice_id": vid, "seed": int(seed), "settings": vs, "text": text.strip(),
                                                      "use": "두 번째 바퀴"}, ensure_ascii=False))
        print(f"tts {name} chars {len(text.strip())}")
    x = decode(p); e = T.env_db(x)
    sil = e < -40; gaps, i = [], 0
    while i < len(sil):
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]:
                j += 1
            gaps.append((i, j)); i = j
        else:
            i += 1
    inner = sorted(sorted([g for g in gaps if g[0] > 0 and g[1] < len(x)], key=lambda g: g[1] - g[0], reverse=True)[:19])
    if len(inner) < 19:
        sys.exit(f"❌ {name}: 20조각 실패({len(inner) + 1})")
    on = np.where(e > -40)[0]
    starts = [on[0]] + [g[1] for g in inner]; ends = [g[0] for g in inner] + [on[-1]]
    mids = [0] + [(g[0] + g[1]) // 2 for g in inner] + [len(x)]
    out = T.D / name; out.mkdir(exist_ok=True)
    for n in range(10, 20):  # 두 번째 바퀴
        s, t = starts[n], ends[n]
        a = max(mids[n], s - int(T.PRE * T.SR)); b = min(mids[n + 1], t + int(T.POST * T.SR))
        y = x[a:b].copy()
        if s - a < int(T.PRE * T.SR):
            y = np.concatenate([np.zeros(int(T.PRE * T.SR) - (s - a)), y])
        if b - t < int(T.POST * T.SR):
            y = np.concatenate([y, np.zeros(int(T.POST * T.SR) - (b - t))])
        fi, fo = int(T.FIN * T.SR), int(T.FOUT * T.SR)
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
        write_wav(out / f"count{n - 9}.wav", y)
    with contextlib.redirect_stdout(io.StringIO()):
        r = T.stats(name); T.level(name)
    print(f"{name:36s} F0 {r['f0_med_hz']:5.0f}Hz · std {r['f0_std_st']:.2f}st · range {r['f0_range_st']:.1f}")
    print("    ", " / ".join(r["rows"]))


if __name__ == "__main__":
    main(*sys.argv[1:5])
