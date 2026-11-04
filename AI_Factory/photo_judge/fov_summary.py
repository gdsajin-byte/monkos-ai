#!/usr/bin/env python3
"""fov_summary.py — fov_compare_v0.jsonl 집계 표(마크다운). 가명 id·수치만 읽는다."""
import argparse
import json
import os
import sys
from collections import Counter

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402

KEYS = [("head", "두상 mm (턱~덩어리 끝)"), ("mirror", "거울상 두상 mm"), ("eye", "눈 % (위에서)"),
        ("top", "머리 위 여백 mm"), ("chin", "턱 아래 mm")]


def q(v):
    return " / ".join(f"{np.percentile(v, p):.2f}" for p in (10, 50, 90))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inp", default=os.path.join(bm.HOME, "fov_compare_v0.jsonl"))
    a = ap.parse_args()
    rows = [json.loads(l) for l in open(a.inp, encoding="utf-8")]
    ok = [r for r in rows if r.get("ok")]
    n = len(ok)
    print(f"시도 {len(rows)} · 대조 성공 {n}")
    print("제외:", dict(Counter(r.get("why") for r in rows if not r.get("ok"))))
    yr = Counter(r["date"][:4] for r in ok)
    print("연도:", dict(sorted(yr.items())), "· 월 수:", len({r['date'] for r in ok}))
    print("정합 A 오차 중앙값(px, 원본) p10/p50/p90:", q([r["A_med_px"] for r in ok]), "· 기울기 |°| p50/p90:",
          f"{np.percentile([abs(r['tilt_deg']) for r in ok], 50):.2f} / {np.percentile([abs(r['tilt_deg']) for r in ok], 90):.2f}")

    print("\n## 1. 지표 분포 (p10 / p50 / p90)\n")
    print("| 지표 | 출고본 | 산식 | 차이(산식−출고) | 산식>출고 비율 |")
    print("|---|---|---|---|---:|")
    for k, lab in KEYS:
        s = [r["ship"][k] for r in ok]; f = [r["form"][k] for r in ok]; d = [x - y for x, y in zip(f, s)]
        print(f"| {lab} | {q(s)} | {q(f)} | {q(d)} | {sum(1 for x in d if x > 0)/n:.0%} |")
    sc = [r["scale_form_over_ship"] for r in ok]
    print(f"| 틀 높이 비 (산식÷출고, >1=얼굴 작게) | — | — | {q(sc)} | {sum(1 for x in sc if x > 1)/n:.0%} |")
    dy = [r["center_dy_mm"] for r in ok]; dx = [r["center_dx_mm"] for r in ok]
    print(f"| 틀 중심 차 세로 mm (+=산식 틀이 아래) | — | — | {q(dy)} | — |")
    print(f"| 틀 중심 차 가로 mm | — | — | {q(dx)} | — |")

    print("\n## 2. 산식 판정\n")
    v = Counter(r["verdict"] for r in ok)
    g = Counter((r["verdict"], r["headGuard"]) for r in ok)
    # 가드 이름은 산식 판에 따라 다르다(v0 face_min·face_max / v1 head_reg_min·head_reg_max·face_min_30) — 실제 값으로 열을 만든다
    gs = sorted({r["headGuard"] for r in ok if r["headGuard"]})
    print("| 판정 | 건수 | " + " | ".join(f"가드 {x}" for x in gs) + " | 가드 없음 |")
    print("|---|---:|" + "---:|" * (len(gs) + 1))
    for vv in ("pass", "moved", "no_room"):
        print(f"| {vv} | {v[vv]} | " + " | ".join(str(g[(vv, x)]) for x in gs) + f" | {g[(vv,None)]} |")
    nrc = Counter(r.get("noRoomCause") for r in ok if r["verdict"] == "no_room" and r.get("noRoomCause"))
    if nrc:
        print(f"\n- no_room 원인: {dict(nrc)}")
    tt = sum(1 for r in ok if r["topTouched"])
    print(f"\n- 정수리 접촉(fov_tight_top, 재배율 전 반려): {tt}건")
    fb = Counter((r["fov1"], r["fov1_cause"]) for r in ok)
    print(f"- 산식 틀 화각 rawVerdict: {dict(fb)} (FOV_BLOCK_ENABLED=false → block도 warn으로 통과)")

    nr = [r for r in ok if r["verdict"] == "no_room"]
    print(f"\n## 3. 오판 후보 — 사진관은 출고, 산식은 no_room: {len(nr)}/{n}\n")
    if nr:
        print("| 지표 | 출고본 p10/p50/p90 | 산식 최선 틀 p10/p50/p90 |")
        print("|---|---|---|")
        for k, lab in KEYS:
            print(f"| {lab} | {q([r['ship'][k] for r in nr])} | {q([r['form'][k] for r in nr])} |")
        m32 = sum(1 for r in nr if r["ship"]["mirror"] < 32)
        print(f"\n- 이 중 출고본 거울상 < 32mm: {m32}건 · 출고본 두상(덩어리) 32~36mm 안: "
              f"{sum(1 for r in nr if 32 <= r['ship']['head'] <= 36)}건 · 출고본 머리 위 여백 ≥ 0.5mm: "
              f"{sum(1 for r in nr if r['ship']['top'] >= 0.5)}건")
        print(f"- 산식 최선 틀 머리 위 여백(음수=잘림) p50 {np.percentile([r['form']['top'] for r in nr], 50):.2f}mm")

    big = [r for r in ok if r["verdict"] != "no_room" and r["big"]]
    print(f"\n## 4. 반대 — 산식 통과(pass·moved)인데 출고 크롭과 크게 다름: {len(big)}/{n - len(nr)}\n")
    print("기준(실행 전 고정): |Δ두상| ≥ 1.5mm · |Δ눈| ≥ 3.0%p · |Δ머리 위 여백| ≥ 1.5mm 중 하나")
    print("- 지표별:", dict(Counter(k for r in big for k in r["big"])))
    if big:
        for k in ("head", "eye", "top"):
            d = [r["form"][k] - r["ship"][k] for r in big]
            print(f"  - Δ{k} p10/p50/p90: {q(d)}")

    print("\n## 5. 출고본 자체 분포 (참고 — 규정 범위 대비)\n")
    s = ok
    print(f"- 두상(덩어리) 32~36mm 안: {sum(1 for r in s if 32 <= r['ship']['head'] <= 36)}/{n} · <32: "
          f"{sum(1 for r in s if r['ship']['head'] < 32)} · >36: {sum(1 for r in s if r['ship']['head'] > 36)}")
    print(f"- 거울상 < 32mm: {sum(1 for r in s if r['ship']['mirror'] < 32)}/{n}")
    print(f"- 눈 > 48%: {sum(1 for r in s if r['ship']['eye'] > 48)}/{n} · 머리 위 여백 < 0.5mm: {sum(1 for r in s if r['ship']['top'] < 0.5)}/{n}")
    print("\n## 6. 연도별 판정\n")
    for y in sorted(yr):
        c = Counter(r["verdict"] for r in ok if r["date"][:4] == y)
        print(f"- {y}: n={yr[y]} pass {c['pass']} · moved {c['moved']} · no_room {c['no_room']} · 출고 두상 p50 "
              f"{np.percentile([r['ship']['head'] for r in ok if r['date'][:4]==y], 50):.2f} · 출고 거울상 p50 "
              f"{np.percentile([r['ship']['mirror'] for r in ok if r['date'][:4]==y], 50):.2f}")


if __name__ == "__main__":
    main()
