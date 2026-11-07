"""검증 200판 전 국면에 코드 형세(S1 단계식 사활 1차 = go_codeeval 기본)를 돌려 대조용 예측을 저장한다. iMac CPU, 엔진 없음.

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 §1-3 (코드 형세와 같은 표로 나란히).
입력: prep.py 출력(split.json) + 수순 queries_full.jsonl (읽기만)
출력: ~/.monkos/go-board/models/own_v0/data/code_val.npz — own int8[n,361](1·-1·0) · lead float32[n] · ms float32[n]
      (순서 = own_v0.npz 의 game<200 행 순서와 같다 — 판 순서 → turn 0..끝)
사용: nice -n 15 python3 -I code_baseline.py
"""
import json
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "go_codeeval"))
import codeeval as ce  # noqa: E402

H = os.path.expanduser("~/.monkos/go-board")
DATA = f"{H}/models/own_v0/data"


def main():
    split = json.load(open(f"{DATA}/split.json"))
    val = split["games"][:split["n_val"]]
    moves_by = {}
    for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8"):
        g = json.loads(l)
        moves_by[g["id"]] = [tuple(m) for m in g["moves"]]
    own, lead, ms = [], [], []
    t0 = time.time()
    for k, gid in enumerate(val):
        mv = moves_by[gid]
        for t in range(len(mv) + 1):
            s = time.time()
            r = ce.evaluate(mv[:t], komi=6.5, use_life="staged")
            ms.append(1000 * (time.time() - s))
            own.append(np.array(r["own"], np.int8))
            lead.append(r["lead"])
        if k % 20 == 0:
            print(f"{k}/{len(val)}판 · 국면 {len(own)} · {time.time() - t0:.0f}초", flush=True)
    np.savez_compressed(f"{DATA}/code_val.npz", own=np.stack(own), lead=np.array(lead, np.float32), ms=np.array(ms, np.float32))
    print(f"완료: {len(val)}판 · 국면 {len(own)} · 평균 {np.mean(ms):.1f}ms")


if __name__ == "__main__":
    main()
