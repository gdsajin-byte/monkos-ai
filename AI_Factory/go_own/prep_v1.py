"""형세 소형망 v1 — 학습 자료: v0 자료(own_v0.npz) + 국면별 포로 차(caps). iMac CPU, numpy 만.

출처: ORDER_20261108_iMac쌍아_막내7_GO_형세망_막대반영_v1학습 §1-2 (작가님 11-08 10:49 승인).
근거: v0 COMPLETION §💡 — 망 입력에 포로 수가 없어 집 차 머리가 포로를 추정해야 했다(소유 합+정확한 포로로도 종반 9.7→8.5).
v0 자료를 그대로 쓰고 caps 열 하나만 붙인다 → 같은 국면·같은 분할(검증 200판 / 학습 1,800판)·같은 평가표.
  caps int16[N] = 그 국면까지 (흑이 딴 돌 − 백이 딴 돌). 수순 = mistakes_v0/queries_full.jsonl(v0 와 같은 원본, 읽기만).
출력(레포 밖): ~/.monkos/go-board/models/own_v1/data/own_v1.npz + split.json(v0 사본)
사용: nice -n 15 python3 -I prep_v1.py
"""
import json
import os
import shutil
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from own_to_score import caps_seq  # noqa: E402  (v0 진단과 같은 포로 계산)

H = os.path.expanduser("~/.monkos/go-board")
SRC = f"{H}/models/own_v0/data"
OUT = f"{H}/models/own_v1/data"


def main():
    d = np.load(f"{SRC}/own_v0.npz")
    split = json.load(open(f"{SRC}/split.json"))
    mv = {}
    for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8"):
        g = json.loads(l)
        mv[g["id"]] = g["moves"]
    game, turn = d["game"], d["turn"].astype(int)
    caps = np.zeros(len(game), np.int16)
    for gi, gid in enumerate(split["games"]):
        m = np.nonzero(game == gi)[0]
        if not len(m):
            continue
        seq = np.array(caps_seq(mv[gid]), np.int16)
        caps[m] = seq[turn[m]]
    # 점검: 판 위 돌 수 + 따낸 돌 수의 짝 — 흑 돌 수 ≤ 흑 둔 수, 포로 차 크기 분포
    print(f"국면 {len(caps):,} · 포로 차 범위 {caps.min()}~{caps.max()} · |포로 차| 평균 {np.abs(caps).mean():.2f} · 0 아닌 국면 {np.mean(caps != 0) * 100:.1f}%")
    os.makedirs(OUT, exist_ok=True)
    np.savez_compressed(f"{OUT}/own_v1.npz", **{k: d[k] for k in d.files}, caps=caps)
    shutil.copyfile(f"{SRC}/split.json", f"{OUT}/split.json")
    print(f"완료 → {OUT}/own_v1.npz")


if __name__ == "__main__":
    main()
