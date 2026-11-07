"""검증 200판 평가표 — 소형망 vs 코드 형세(S1) 나란히, 정답 = b18(64탐색). iMac, numpy 만.

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 §1-3.
지표(구간별 = 둔 수 ~100 / 101~200 / 201~ · 전체):
  · 소유 부호 일치율 — b18 |소유| ≥ 0.5 칸에서 예측 부호가 같은 비율(예측 0 = 불일치; go_codeeval/compare.py 와 같은 정의)
  · 소유 MAE — 361칸 전부, 단위 −1~1 (코드 형세는 1·−1·0 값)
  · 집 차 MAE(평균 / 중앙값 / 90%) — |예측 − b18 scoreLead| 집
  · 승자 일치율 — 예측 집 차 부호 = b18 scoreLead 부호
사용: python3 -I table.py <val_pred.npz> [출력.md]
"""
import os
import sys

import numpy as np

H = os.path.expanduser("~/.monkos/go-board/models/own_v0/data")
SEGS = (("~100수", 0, 100), ("101~200수", 101, 200), ("201수~", 201, 10 ** 6), ("전체", 0, 10 ** 6))


def metrics(own_p, score_p, own_t, score_t, m):
    op, ot = own_p[m].astype(np.float32), own_t[m].astype(np.float32) / 100.0
    sure = np.abs(ot) >= 0.5
    agree = (np.sign(op) == np.sign(ot)) & (op != 0) & sure
    err = np.abs(score_p[m] - score_t[m])
    win = np.mean(np.sign(score_p[m]) == np.sign(score_t[m]))
    return {"n": int(m.sum()), "own_agree": agree.sum() / max(1, sure.sum()), "own_mae": float(np.abs(op - ot).mean()),
            "lead_mean": float(err.mean()), "lead_med": float(np.median(err)), "lead_p90": float(np.quantile(err, 0.9)), "win": float(win)}


def main():
    pred = np.load(sys.argv[1])
    d = np.load(f"{H}/own_v0.npz")
    vm = d["game"] < 200
    own_t, score_t, turn = d["own"][vm], d["score"][vm], d["turn"][vm].astype(int)
    n = len(pred["score"])
    code = np.load(f"{H}/code_val.npz")
    assert len(code["lead"]) == len(score_t), (len(code["lead"]), len(score_t))
    assert np.array_equal(pred["turn"].astype(int), turn[:n]), "검증 순서 불일치"
    own_t, score_t, turn = own_t[:n], score_t[:n], turn[:n]
    net_own, net_s = pred["own"].astype(np.float32), pred["score"].astype(np.float32)
    code_own, code_s = code["own"][:n], code["lead"][:n]
    lines = [f"| 구간 | 국면 | 소유 부호 일치 (망 / 코드) | 소유 MAE (망 / 코드) | 집 차 MAE 평균·중앙·90% — 망 | 코드 | 승자 일치 (망 / 코드) |",
             "|---|---|---|---|---|---|---|"]
    for name, lo, hi in SEGS:
        m = (turn >= lo) & (turn <= hi)
        a = metrics(net_own, net_s, own_t, score_t, m)
        b = metrics(code_own, code_s, own_t, score_t, m)
        lines.append(f"| {name} | {a['n']:,} | **{100 * a['own_agree']:.1f}%** / {100 * b['own_agree']:.1f}% | **{a['own_mae']:.3f}** / {b['own_mae']:.3f} | "
                     f"**{a['lead_mean']:.1f} · {a['lead_med']:.1f} · {a['lead_p90']:.1f}** | {b['lead_mean']:.1f} · {b['lead_med']:.1f} · {b['lead_p90']:.1f} | "
                     f"**{100 * a['win']:.1f}%** / {100 * b['win']:.1f}% |")
    lines.append(f"\n- 코드 형세 시간: 평균 {code['ms'].mean():.1f}ms · 최대 {code['ms'].max():.0f}ms (iMac CPU, S1 단계식 사활 1차)")
    out = "\n".join(lines)
    print(out)
    if len(sys.argv) > 2:
        open(sys.argv[2], "w", encoding="utf-8").write(out + "\n")


if __name__ == "__main__":
    main()
