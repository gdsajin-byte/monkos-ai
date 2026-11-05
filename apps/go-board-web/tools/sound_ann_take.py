#!/usr/bin/env python3
"""안내 문구 1테이크 — 한 번에 이어 읽기 → 무음 기준 분할 → 음량 맞춤 (PF_GO, 11-05 09:48 작가님 결정).

작가님 09:48: "마지막 회에서 회는 빼기 / 초읽기를 시작합니다 / 마지막, 두번남았습니다는 하나 전에 … 약 2초 전에 시작".
  sound_ann_take.py gen  SLUG VOICE_ID MODEL TAKE SEED   ANN 문구 전체를 1회 생성(숫자 테이크와 같은 설정·시드)
  sound_ann_take.py split NAME                           문장 사이 무음으로 len(ANN)조각 → take/NAME/{tag}.wav (앞 80·뒤 150ms, RMS −18dBFS)
"""
import io, contextlib, json, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_take as T
from sound_count_split import decode, write as write_wav

ANN = [("byo", "초읽기를 시작합니다."), ("remain1", "마지막."), ("remain2", "두 번 남았습니다."),
       ("remain3", "세 번 남았습니다."), ("remain4", "네 번 남았습니다."), ("remain5", "다섯 번 남았습니다."),
       ("start", "대국을 시작합니다."), ("counting", "계가를 시작합니다.")]
TEXT = " ".join(t for _, t in ANN)


def gen(slug, vid, model, take, seed):
    """숫자 테이크와 같은 설정(기운 프로필이면 그 설정)·시드. 기운 프로필에선 '마지막!'(긴장감 — 09:51 작가님)."""
    name = f"{slug}_{model}_t{take}"
    p = T.D / f"{name}_ann.mp3"
    pf = T.profile(take)
    text = TEXT.replace("마지막.", "마지막!") if pf else TEXT
    if not p.exists():
        p.write_bytes(T.tts(vid, model, text, seed, pf[0] if pf else None))
        print(f"tts {name}_ann chars {len(text)}")


def split(name):
    x = decode(T.D / f"{name}_ann.mp3")
    e = T.env_db(x)
    n = len(ANN)
    for thr in (-40, -35, -45, -30):
        sil = e < thr
        gaps, i = [], 0
        while i < len(sil):
            if sil[i]:
                j = i
                while j < len(sil) and sil[j]:
                    j += 1
                gaps.append((i, j)); i = j
            else:
                i += 1
        inner = [g for g in gaps if g[0] > 0 and g[1] < len(x)]
        if len(inner) >= n - 1:
            inner = sorted(sorted(inner, key=lambda g: g[1] - g[0], reverse=True)[:n - 1])
            break
    else:
        sys.exit(f"❌ sound_ann_take: {name} 안내 {n}조각 실패")
    on = np.where(e > thr)[0]
    starts = [on[0]] + [g[1] for g in inner]
    ends = [g[0] for g in inner] + [on[-1]]
    mids = [0] + [(g[0] + g[1]) // 2 for g in inner] + [len(x)]
    out = T.D / name
    out.mkdir(exist_ok=True)
    rows = []
    for k, ((tag, text), s, t) in enumerate(zip(ANN, starts, ends)):
        a = max(mids[k], s - int(T.PRE * T.SR)); b = min(mids[k + 1], t + int(T.POST * T.SR))
        y = x[a:b].copy()
        if s - a < int(T.PRE * T.SR):
            y = np.concatenate([np.zeros(int(T.PRE * T.SR) - (s - a)), y])
        if b - t < int(T.POST * T.SR):
            y = np.concatenate([y, np.zeros(int(T.POST * T.SR) - (b - t))])
        fi, fo = int(T.FIN * T.SR), int(T.FOUT * T.SR)
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
        write_wav(out / f"{tag}.wav", y)
        rows.append(f"{tag} '{text}' 말소리 {(t - s) / T.SR:.2f}s")
    with contextlib.redirect_stdout(io.StringIO()):
        T.level(name)
    print(f"split {name} 안내 문턱 {thr}dB\n  " + "\n  ".join(rows))


if __name__ == "__main__":
    a = sys.argv[1:]
    {"gen": lambda: gen(*a[1:6]), "split": lambda: split(a[1])}[a[0]]()
