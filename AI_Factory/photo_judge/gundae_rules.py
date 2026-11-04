#!/usr/bin/env python3
"""gundae_rules.py — 건대 시대(2023~2024-05) 규격 완성본 파일명 규칙 근거 집계. 읽기 전용.

1) 월별 파일명 패턴 보유율(목록만): `출력용`·`웹용` JPG / `님_{용도}` JPG / PSD / RAW
2) 표본 N명(기본 40)의 `출력용`·`웹용` JPG 헤더만 읽어 픽셀·dpi → 실물 mm 환산 → 알려진 규격 크기 일치율
출력은 월·건수·치수뿐(이름·폴더명 없음).
"""
import argparse
import os
import random
import sys
from collections import Counter, defaultdict

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402

# 알려진 규격 실물 크기(mm, 가로×세로)
KNOWN_MM = {"35x45(여권·증명)": (35, 45), "30x40(반명함·민증·운전)": (30, 40), "25x30(증명 소)": (25, 30),
            "51x51(미국비자 2in)": (50.8, 50.8), "33x48(중국비자)": (33, 48), "3x4cm 근사": (30, 40)}


def mm(px, dpi):
    return px / dpi * 25.4


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--listing", default=os.path.join(bm.HOME, "listing.tsv"))
    ap.add_argument("-n", type=int, default=40)
    ap.add_argument("--seed", type=int, default=2023)
    a = ap.parse_args()
    recs, _ = bm.load_listing(a.listing)
    mon = defaultdict(Counter)
    for key, files in recs.items():
        if not ("20230101" <= key < "20240801"):
            continue
        m = f"{key[:4]}-{key[4:6]}"
        names = [os.path.basename(r) for sh, r, _ in files if sh == "intake"]
        jp = [n for n in names if n.lower().endswith((".jpg", ".jpeg"))]
        mon[m]["고객"] += 1
        mon[m]["출력용·웹용"] += any(("출력용" in n or "웹용" in n) for n in jp)
        mon[m]["님_용도 JPG(촬영접수)"] += any(bm.classify(r)[2] == "named" for sh, r, _ in files if sh == "intake")
        mon[m]["님_용도 JPG(작업백업)"] += any(bm.classify(r)[2] == "named" for sh, r, _ in files if sh == "backup")
        mon[m]["PSD"] += any(n.lower().endswith(".psd") for n in names)
        mon[m]["RAW"] += any(bm.classify(r)[0] == "raw" for sh, r, _ in files)
    cols = ["고객", "출력용·웹용", "님_용도 JPG(촬영접수)", "님_용도 JPG(작업백업)", "PSD", "RAW"]
    print("### 월별 패턴 보유 고객 수\n| 월 | " + " | ".join(cols) + " |\n|" + "---|" * (len(cols) + 1))
    for m in sorted(mon):
        print(f"| {m} | " + " | ".join(str(mon[m][c]) for c in cols) + " |")

    keys = [k for k in recs if k[:4] == "2023"]
    rnd = random.Random(a.seed)
    sample = rnd.sample(sorted(keys), a.n)
    dims = Counter(); match = Counter(); kinds = Counter(); per_cust = Counter()
    for k in sample:
        got = False
        for sh, rel, size in recs[k]:
            b = os.path.basename(rel)
            if not b.lower().endswith((".jpg", ".jpeg")) or not ("출력용" in b or "웹용" in b):
                continue
            got = True
            kind = "출력용" if "출력용" in b else "웹용"
            try:
                im = Image.open(os.path.join(bm.SHARES[sh], rel))
                w, h = im.size
                dpi = (im.info.get("dpi") or (72, 72))[0]
            except Exception as e:
                kinds[(kind, "ERR " + type(e).__name__)] += 1
                continue
            dims[(kind, w, h, int(dpi))] += 1
            mw, mh = mm(w, dpi), mm(h, dpi)
            hit = None
            for name, (kw, kh) in KNOWN_MM.items():
                if abs(mw - kw) <= 1.5 and abs(mh - kh) <= 1.5:
                    hit = name
                    break
            # 웹용은 픽셀 규격(정부 업로드)이라 mm가 아니라 비율로 본다
            ratio = h / w
            pix_hit = "비율 3:4·7:9(규격)" if abs(ratio - 4 / 3) < 0.04 or abs(ratio - 9 / 7) < 0.03 or abs(ratio - 1) < 0.01 else None
            match[(kind, "mm일치" if hit else ("비율일치" if pix_hit else "불일치"))] += 1
        per_cust["출력용·웹용 있음" if got else "없음"] += 1
    print(f"\n### 표본 {a.n}명 (2023) — 출력용·웹용 보유 {per_cust['출력용·웹용 있음']}명")
    for (kind, verdict), c in sorted(match.items()):
        print(f"- {kind}: {verdict} {c}")
    print("\n| 종류 | px | dpi | 실물 mm | 파일 수 |\n|---|---|---|---|---|")
    for (kind, w, h, dpi), c in dims.most_common(20):
        print(f"| {kind} | {w}×{h} | {dpi} | {mm(w, dpi):.1f}×{mm(h, dpi):.1f} | {c} |")


if __name__ == "__main__":
    main()
