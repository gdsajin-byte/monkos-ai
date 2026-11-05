#!/usr/bin/env python3
"""짧은 남은 횟수 안내 — 문구마다 따로 생성(숫자 테이크와 같은 목소리·설정·시드) (PF_GO, 11-05 10:55·10:59 지시).

10초 초읽기 순서 "마지막 → 하나 → 둘": '하나'는 안내 말소리가 끝난 뒤, '둘'은 회 시작 +1초 격자 →
안내 말소리가 약 0.45초를 넘으면 '하나'와 '둘'이 겹친다. 그래서 remain2·3을 "두 번."·"세 번."으로 줄인다.
  sound_ann_short.py VOICE_ID MODEL TAKE SEED OUT_DIR [--full|--extra]   (--full = 온전한 문구 4개 12:01, --extra = 남은 4·5회 + 짧은 진입 12:08)
"""
import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_take as T
from sound_count_split import decode, write as write_wav

PHRASES = [("remain1", "마지막!"), ("remain2", "두 번!"), ("remain3", "세 번!")]
# 11-05 12:01 작가님 "두번남았습니다 1초 하나 … 마지막 입니다 1초 하나" — 안내 뒤 1초 쉬고 하나(유예가 안내 길이만큼 늘어남) → 온전한 문구
PHRASES_FULL = [("remain1", "마지막입니다."), ("remain2", "두 번 남았습니다."), ("remain3", "세 번 남았습니다."), ("byo", "초읽기를 시작합니다.")]
# 12:08 쌍아: 남은 4·5회 + 통일안(하나 항상 +1.5초)용 짧은 진입 안내 대안
PHRASES_EXTRA = [("remain4", "네 번 남았습니다."), ("remain5", "다섯 번 남았습니다."), ("byo_short", "초읽기 시작.")]
if "--full" in sys.argv:
    sys.argv.remove("--full"); PHRASES = PHRASES_FULL
if "--extra" in sys.argv:
    sys.argv.remove("--extra"); PHRASES = PHRASES_EXTRA


def main(vid, model, take, seed, out):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    pf = T.profile(take)
    for tag, text in PHRASES:
        mp = out / f"{tag}.mp3"
        if not mp.exists():
            mp.write_bytes(T.tts(vid, model, text, seed, pf[0] if pf else None))
        x = decode(mp); e = T.env_db(x)
        on = np.where(e > -40)[0]
        s, t = on[0], on[-1]
        a = max(0, s - int(T.PRE * T.SR)); b = min(len(x), t + int(T.POST * T.SR))
        y = x[a:b].copy()
        fi, fo = int(T.FIN * T.SR), int(T.FOUT * T.SR)
        y[:fi] *= np.linspace(0, 1, fi); y[-fo:] *= np.linspace(1, 0, fo)
        write_wav(out / f"{tag}.wav", y)
        mp.unlink()
        print(f"{tag} '{text}' 말소리 {(t - s) / T.SR:.2f}s")


if __name__ == "__main__":
    main(*sys.argv[1:6])
