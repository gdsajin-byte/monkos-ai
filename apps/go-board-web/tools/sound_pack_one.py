#!/usr/bin/env python3
"""테이크 1개로 목소리 전용 팩 조립 (PF_GO, 11-05 09:48 작가님 Anna Kim 채택).

  sound_pack_one.py NAME PACK [--hidden]
    NAME = take 폴더 이름(예: annakim_eleven_multilingual_v2_t3), PACK = 팩 이름(예: monk-annakim)
    파일: count1~10 · remain1~5 · byo(초읽기를 시작합니다) · start · counting — 돌소리 파일은 넣지 않는다(앱이 기본 녹음 돌소리를 씀)
    --hidden: '.staged-PACK' 이름으로(앱 팩 목록 정규식에 안 걸려 노출 안 됨 — 작가님 승인 전 보관)
"""
import shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sound_take as T

FILES = [f"count{i}" for i in range(1, 11)] + [f"remain{i}" for i in range(1, 6)] + ["byo", "start", "counting"]


def main(name, pack, hidden=False):
    src = T.D / name
    miss = [f for f in FILES if not (src / f"{f}.wav").exists()]
    if miss:
        sys.exit("❌ sound_pack_one: 원본 누락 " + ", ".join(miss))
    root = Path.home() / ".monkos" / "go-board-sounds"
    d = root / (f".staged-{pack}" if hidden else pack)
    d.mkdir(parents=True, exist_ok=True)
    for f in FILES:
        shutil.copyfile(src / f"{f}.wav", d / f"{f}.wav")
    (d / "README.txt").write_text(
        f"MONK 목소리 팩 — {name.split('_')[0]} (ElevenLabs 1테이크·무음 분할·RMS −18dBFS, 11-05). 돌소리는 기본 녹음\n"
        "숫자 1테이크 + 안내 1테이크(초읽기를 시작합니다·마지막·N번 남았습니다·대국/계가 시작). 생성: apps/go-board-web/tools/sound_take.py·sound_ann_take.py\n",
        encoding="utf-8")
    print(f"ok {d.name}: {len(list(d.glob('*.wav')))} wav")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], "--hidden" in sys.argv)
