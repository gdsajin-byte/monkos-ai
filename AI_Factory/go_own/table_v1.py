"""검증 200판 평가표 v1 — 여러 망(v0·v1 b6c96·v1 b10c128 …)과 코드 형세(S1)를 같은 표에. 정답 = b18(64탐색).

출처: ORDER_20261108_iMac쌍아_막내7_GO_형세망_막대반영_v1학습 §1-2 "같은 분할(1,800/200), 같은 평가표에 v0 열 추가".
지표 정의는 table.py(v0) 그대로 + '소유 합+포로' 집 차(Σown − Σ판 위 돌 + 포로 차 − 6.5, own_to_score.py 와 같은 식).
사용: python3 -I table_v1.py 이름=val_pred.npz [이름=val_pred.npz …] [--out 표.md]
  예) python3 -I table_v1.py v0=~/.monkos/go-board/models/own_v0/run1/val_pred.npz v1b6=…/own_v1/b6c96/val_pred.npz v1b10=…/own_v1/b10c128/val_pred.npz
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from table import SEGS, metrics  # noqa: E402

H = os.path.expanduser("~/.monkos/go-board/models")


def main():
    args = [x for x in sys.argv[1:] if "=" in x]
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
    d = np.load(f"{H}/own_v1/data/own_v1.npz")
    vm = d["game"] < 200
    own_t, score_t, turn = d["own"][vm], d["score"][vm], d["turn"][vm].astype(int)
    board_sum = d["board"][vm].astype(np.float32).sum(1)
    caps = d["caps"][vm].astype(np.float32)
    code = np.load(f"{H}/own_v0/data/code_val.npz")
    cols = []
    for a in args:
        name, path = a.split("=", 1)
        p = np.load(os.path.expanduser(path))
        assert len(p["score"]) == len(score_t) and np.array_equal(p["turn"].astype(int), turn), f"{name}: 검증 순서 불일치"
        o = p["own"].astype(np.float32)
        cols.append((name, o, p["score"].astype(np.float32), o.sum(1) - board_sum + caps - 6.5))
    cols.append(("코드", code["own"], code["lead"], None))
    names = " / ".join(c[0] for c in cols)
    lines = [f"| 구간 | 국면 | 소유 부호 일치 ({names}) | 소유 MAE ({names}) | 집 차 MAE 평균·중앙·90% ({names}) | 승자 일치 ({names}) | 소유 합+포로 집 차 MAE ({' / '.join(c[0] for c in cols if c[3] is not None)}) |",
             "|---|---|---|---|---|---|---|"]
    for seg, lo, hi in SEGS:
        m = (turn >= lo) & (turn <= hi)
        ms = [metrics(o, s, own_t, score_t, m) for _, o, s, _ in cols]
        so = [float(np.abs(c[3][m] - score_t[m]).mean()) for c in cols if c[3] is not None]
        lines.append(f"| {seg} | {ms[0]['n']:,} | " + " / ".join(f"{100 * x['own_agree']:.1f}%" for x in ms)
                     + " | " + " / ".join(f"{x['own_mae']:.3f}" for x in ms)
                     + " | " + " / ".join(f"{x['lead_mean']:.1f}·{x['lead_med']:.1f}·{x['lead_p90']:.1f}" for x in ms)
                     + " | " + " / ".join(f"{100 * x['win']:.1f}%" for x in ms)
                     + " | " + " / ".join(f"{x:.1f}" for x in so) + " |")
    txt = "\n".join(lines)
    print(txt)
    if out:
        open(out, "w", encoding="utf-8").write(txt + "\n")


if __name__ == "__main__":
    main()
