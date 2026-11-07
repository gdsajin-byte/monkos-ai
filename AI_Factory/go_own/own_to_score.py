"""진단: 망 소유권 합 + 실제 포로 차로 집 차를 다시 세면 집 차 머리보다 나은가 (한국 규칙 = 집 + 포로).

집 차(흑 기준) ≈ Σown(면적 차) − (판 위 흑 돌 − 백 돌) + (흑이 딴 돌 − 백이 딴 돌) − 덤 6.5
  · 죽은 흑 돌: own 은 백(−1), 돌 수에서 −1 → −2 = 백 집 1 + 포로 1 과 같다.
망 입력엔 포로 수가 없다 → 이 계산이 머리보다 크게 나으면 v1 에 포로 차 입력면을 넣을 근거.
사용: python3 -I own_to_score.py <val_pred.npz>
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "go_codeeval"))
import codeeval as ce  # noqa: E402

H = os.path.expanduser("~/.monkos/go-board")
D = f"{H}/models/own_v0/data"


def caps_seq(moves):
    """turn 0..끝의 (흑이 딴 수 − 백이 딴 수)"""
    b = [0] * ce.N
    out = [0]
    diff = 0
    for c, mv in moves:
        if mv.lower() != "pass":
            col = 1 if c == "B" else -1
            i = ce.idx(mv)
            b[i] = col
            for q in ce.NB[i]:
                if b[q] == -col:
                    st, lb = ce.block(b, q)
                    if not lb:
                        for s in st:
                            b[s] = 0
                        diff += col * len(st)
            st, lb = ce.block(b, i)
            if not lb:
                for s in st:
                    b[s] = 0
                diff -= col * len(st)
        out.append(diff)
    return out


def main():
    pred = np.load(sys.argv[1])
    d = np.load(f"{D}/own_v0.npz")
    vm = d["game"] < 200
    board, score_t, turn = d["board"][vm].astype(np.float32), d["score"][vm], d["turn"][vm].astype(int)
    split = json.load(open(f"{D}/split.json"))
    mv = {}
    for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8"):
        g = json.loads(l)
        mv[g["id"]] = g["moves"]
    cap = np.concatenate([caps_seq(mv[gid]) for gid in split["games"][:split["n_val"]]]).astype(np.float32)
    assert len(cap) == len(score_t)
    own = pred["own"].astype(np.float32)
    s_own = own.sum(1) - board.sum(1) + cap - 6.5
    s_head = pred["score"].astype(np.float32)
    s_mix = 0.5 * (s_own + s_head)
    s_b18 = d["own"][vm].astype(np.float32).sum(1) / 100.0 - board.sum(1) + cap - 6.5  # 바닥값: b18 자기 소유권으로 같은 계산
    print("| 구간 | 집 차 머리 MAE | 소유 합+포로 MAE | 둘 평균 MAE | (바닥) b18 소유 합+포로 vs b18 scoreLead | 승자 일치(머리 / 소유 합) |\n|---|---|---|---|---|---|")
    for name, lo, hi in (("~100수", 0, 100), ("101~200수", 101, 200), ("201수~", 201, 10 ** 6), ("전체", 0, 10 ** 6)):
        m = (turn >= lo) & (turn <= hi)
        e = lambda s: np.abs(s[m] - score_t[m]).mean()
        w = lambda s: 100 * np.mean(np.sign(s[m]) == np.sign(score_t[m]))
        print(f"| {name} | {e(s_head):.1f} | {e(s_own):.1f} | {e(s_mix):.1f} | {e(s_b18):.1f} | {w(s_head):.1f}% / {w(s_own):.1f}% |")


if __name__ == "__main__":
    main()
