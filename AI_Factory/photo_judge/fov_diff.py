#!/usr/bin/env python3
"""fov_diff.py — 산식 전/후 대조 표(마크다운). 같은 표본·시드의 fov_compare jsonl 두 개를 id로 맞춘다.

전 = v0(11-04 막내7, 눈 43%·거울상 하한 32), 후 = v1(11-04 막내8, 눈 45%·규정 두상=실측·거울상 하한 30).
유료 T1 근사(crop-engine cropToSpec: 거울상 33mm·눈 43%, 헤어 가드·하단 루프 생략)는 v1의 geom으로 오프라인 계산한다.
가명 id·수치만 읽는다.
"""
import argparse
import json
import os
import sys
from collections import Counter

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402

KEYS = [("head", "두상 mm (턱~덩어리 끝)"), ("mirror", "거울상 두상 mm"), ("eye", "눈 %"),
        ("top", "머리 위 여백 mm"), ("chin", "턱 아래 mm")]
FRAME_HMM = 45.0


def q(v):
    return " / ".join(f"{np.percentile(v, p):.2f}" for p in (10, 50, 90)) if len(v) else "—"


def load(p):
    return {r["id"]: r for r in (json.loads(l) for l in open(p, encoding="utf-8")) if r.get("ok")}


def paid_like(g):
    """crop-engine resolvePlacement ① 근사 — 거울상 33mm·눈 43%. 반환: 같은 지표 dict"""
    L = g["lines"]; hair = g["hairTopRatio"] * g["H"]
    mirror_px = L["chinY"] - L["crownY"]
    h = mirror_px * FRAME_HMM / 33.0
    y = L["eyeY"] - 0.43 * h
    mm = FRAME_HMM / h
    return {"head": (L["chinY"] - hair) * mm, "mirror": 33.0, "eye": 43.0, "top": (hair - y) * mm,
            "chin": (y + h - L["chinY"]) * mm, "h": h, "y": y}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--before", default=os.path.join(bm.HOME, "fov_compare_v0.jsonl"))
    ap.add_argument("--after", default=os.path.join(bm.HOME, "fov_compare_v1.jsonl"))
    a = ap.parse_args()
    B, A = load(a.before), load(a.after)
    ids = sorted(set(B) & set(A))
    n = len(ids)
    print(f"전 {len(B)} · 후 {len(A)} · 공통 id {n} (후에만 {len(set(A) - set(B))} · 전에만 {len(set(B) - set(A))})")
    # 출고 측 지표가 같은지(같은 표본·같은 측정) — 재현성 확인
    dship = [abs(A[i]["ship"]["head"] - B[i]["ship"]["head"]) for i in ids]
    print(f"출고 두상 재측정 차 |Δ| p50/p90/max: {np.percentile(dship, 50):.3f} / {np.percentile(dship, 90):.3f} / {max(dship):.3f} mm")

    print("\n## 1. 산식 − 출고 차이 (p10 / p50 / p90)\n")
    print("| 지표 | 전(v0) | 후(v1) | 후 산식 값 |")
    print("|---|---|---|---|")
    for k, lab in KEYS:
        d0 = [B[i]["form"][k] - B[i]["ship"][k] for i in ids]
        d1 = [A[i]["form"][k] - A[i]["ship"][k] for i in ids]
        print(f"| {lab} | {q(d0)} | {q(d1)} | {q([A[i]['form'][k] for i in ids])} |")
    for key, lab in (("center_dy_mm", "틀 중심 세로 차 mm (+=산식 틀이 아래)"), ("scale_form_over_ship", "틀 높이 비 (산식÷출고)")):
        print(f"| {lab} | {q([B[i][key] for i in ids])} | {q([A[i][key] for i in ids])} | — |")

    print("\n## 2. 판정·가드 (전 → 후)\n")
    v0 = Counter(B[i]["verdict"] for i in ids); v1 = Counter(A[i]["verdict"] for i in ids)
    print("| 판정 | 전 | 후 |")
    print("|---|---:|---:|")
    for vv in ("pass", "moved", "no_room"):
        print(f"| {vv} | {v0[vv]} | {v1[vv]} |")
    print("\n- 전 가드:", dict(Counter(B[i]["headGuard"] or "없음" for i in ids)))
    print("- 후 가드:", dict(Counter(A[i]["headGuard"] or "없음" for i in ids)))
    print("- 후 no_room 원인:", dict(Counter(A[i].get("noRoomCause") for i in ids if A[i]["verdict"] == "no_room")))
    tr = Counter((B[i]["verdict"], A[i]["verdict"]) for i in ids)
    print("- 판정 전이(전→후):", {f"{x}→{y}": c for (x, y), c in sorted(tr.items())})
    big0 = sum(1 for i in ids if B[i]["verdict"] != "no_room" and B[i]["big"])
    big1 = sum(1 for i in ids if A[i]["verdict"] != "no_room" and A[i]["big"])
    print(f"- '크게 다름'(통과 중): 전 {big0} → 후 {big1} · 후 지표별 {dict(Counter(k for i in ids if A[i]['verdict'] != 'no_room' for k in A[i]['big']))}")

    nr = [i for i in ids if A[i]["verdict"] == "no_room"]
    if nr:
        print(f"\n### 후 no_room {len(nr)}건 (출고 vs 산식 시도 틀)\n")
        print("| 원인 | 출고 두상/거울상/눈/여백 | 산식 시도 두상/거울상/눈/여백 |")
        print("|---|---|---|")
        for i in nr:
            s, f = A[i]["ship"], A[i]["form"]
            print(f"| {A[i].get('noRoomCause')} | {s['head']:.2f} / {s['mirror']:.2f} / {s['eye']:.1f} / {s['top']:.2f} | "
                  f"{f['head']:.2f} / {f['mirror']:.2f} / {f['eye']:.1f} / {f['top']:.2f} |")

    print("\n## 3. 유료 T1 근사(거울상 33·눈 43%) vs 무료 후(v1) — 통과건\n")
    ok = [i for i in ids if A[i]["verdict"] != "no_room" and A[i].get("geom")]
    P = {i: paid_like(A[i]["geom"]) for i in ok}
    print(f"n={len(ok)}")
    print("| 지표 | 유료 근사 | 무료 후 | 무료−유료 |")
    print("|---|---|---|---|")
    for k, lab in KEYS:
        p = [P[i][k] for i in ok]; f = [A[i]["form"][k] for i in ok]
        print(f"| {lab} | {q(p)} | {q(f)} | {q([x - y for x, y in zip(f, p)])} |")
    sh = [P[i]["h"] / A[i]["geom"]["frame0"]["h"] for i in ok]
    print(f"- 유료 근사 틀 높이 ÷ 원 프레임(fit-spec) p50 {np.percentile(sh, 50):.4f} (≈1이면 근사가 crop-engine 원 배율과 같다)")
    print(f"- 유료 근사 머리 위 여백 < 0 (헤어 가드가 개입할 건): {sum(1 for i in ok if P[i]['top'] < 0)}/{len(ok)}")


if __name__ == "__main__":
    main()
