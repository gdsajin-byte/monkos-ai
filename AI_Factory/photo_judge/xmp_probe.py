#!/usr/bin/env python3
"""xmp_probe.py — 사이드카 .xmp 크롭 필드 확인 (표본 N건 + 전수 분포). stdlib만, 읽기 전용.

표본: 하남 시대 고객 중 연도·용도를 분산해 N건(기본 10). 출력은 가명 id·월·용도·필드값뿐.
전수 분포: manifest_v0.jsonl(--xmp로 만든 것)의 sidecar.crop 집계 — 크롭 비율·각도·방향.
"""
import argparse
import json
import os
import random
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402

FIELDS = ("HasCrop", "CropLeft", "CropTop", "CropRight", "CropBottom", "CropAngle", "Orientation")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default=os.path.join(bm.HOME, "manifest_v0.jsonl"))
    ap.add_argument("--pathmap", default=os.path.join(bm.HOME, "pathmap.jsonl"))
    ap.add_argument("-n", type=int, default=10)
    ap.add_argument("--seed", type=int, default=11)
    a = ap.parse_args()
    man = [json.loads(l) for l in open(a.manifest, encoding="utf-8")]
    pm = {p["id"]: p["refs"] for p in (json.loads(l) for l in open(a.pathmap, encoding="utf-8"))}
    # 표본: (연도, 대표 용도) 층에서 하나씩 돌아가며
    strata = defaultdict(list)
    for r in man:
        xs = [s for s in r["sidecar"] if s["type"] == "xmp"]
        if r["era"] != "hanam" or not xs:
            continue
        pur = (r["spec_final"][0]["purpose"] if r["spec_final"] else None) or "기타"
        strata[(r["date"][:4], pur)].append(r)
    rnd = random.Random(a.seed)
    keys = sorted(strata, key=lambda k: -len(strata[k]))[:a.n * 2]
    rnd.shuffle(keys)
    years = Counter()
    picked = []
    for k in sorted(keys, key=lambda k: (years[k[0]], -len(strata[k]))):
        if len(picked) >= a.n:
            break
        if years[k[0]] >= (a.n + 2) // 3:
            continue
        picked.append(rnd.choice(strata[k]))
        years[k[0]] += 1
    print("| # | id | 월 | 용도 | " + " | ".join(FIELDS) + " | 크롭 w/h(정규) |")
    print("|" + "---|" * (len(FIELDS) + 5))
    for i, r in enumerate(picked, 1):
        x = next(s for s in r["sidecar"] if s["type"] == "xmp")
        sh, rel = pm[r["id"]][x["path_ref"]].split(":", 1)
        f = bm.parse_xmp(os.path.join(bm.SHARES[sh], rel))
        pur = (r["spec_final"][0]["purpose"] if r["spec_final"] else "기타")
        wh = ""
        try:
            wh = f"{float(f['CropRight'])-float(f['CropLeft']):.3f}/{float(f['CropBottom'])-float(f['CropTop']):.3f}"
        except (KeyError, ValueError):
            pass
        print(f"| {i} | {r['id'][:10]} | {r['date']} | {pur} | " +
              " | ".join(str(f.get(k, "—")) for k in FIELDS) + f" | {wh} |")
    # 전수 분포
    n_x = n_c = 0
    ang = Counter(); ori = Counter(); asp = Counter(); px = Counter()
    for r in man:
        for s in r["sidecar"]:
            if s["type"] != "xmp":
                continue
            n_x += 1
            if not s.get("crop"):
                continue
            n_c += 1
            l, t, rr, b = s["crop"]
            a_ = abs(s.get("angle") or 0)
            ang["0" if a_ == 0 else "<1°" if a_ < 1 else "<3°" if a_ < 3 else "≥3°"] += 1
            ori[s.get("orientation")] += 1
            # 6000x4000 센서 가정 시 픽셀 비율 (R8/R6 계열 3:2)
            ratio = ((rr - l) * 6000) / max((b - t) * 4000, 1e-9)
            asp[f"{ratio:.2f}"] += 1
            px["min_side<1500" if min((rr - l) * 6000, (b - t) * 4000) < 1500 else "≥1500"] += 1
    print(f"\n전수: xmp {n_x:,}개 · 크롭 있음 {n_c:,} ({n_c/max(n_x,1):.1%})")
    print("각도:", dict(ang))
    print("tiff:Orientation:", dict(ori))
    print("크롭 가로/세로(3:2 센서 가정) 상위:", asp.most_common(6))
    print("크롭 짧은 변(px):", dict(px))


if __name__ == "__main__":
    main()
