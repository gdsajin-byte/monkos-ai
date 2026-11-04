#!/usr/bin/env python3
"""gate_table.py — P0 게이트 재료 표 (매니페스트 + 정합 결과 집계, 건수·비율만)."""
import json
import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402


def load(p):
    return [json.loads(l) for l in open(p, encoding="utf-8")] if os.path.exists(p) else []


def main():
    man = load(os.path.join(bm.HOME, "manifest_v0.jsonl"))
    reg = load(os.path.join(bm.HOME, "register_v0.jsonl"))
    gun = load(os.path.join(bm.HOME, "register_gundae_v0.jsonl"))
    c = Counter()
    for r in man:
        pair = bool(r["raw"]) and bool(r["spec_final"])
        if not pair:
            continue
        c["짝 전체"] += 1
        c[f"짝 {r['era']}"] += 1
        c[f"짝 conf={r['spec_conf']}"] += 1
        if r["era"] == "hanam":
            crop = any(s.get("crop") for s in r["sidecar"] if s["type"] == "xmp")
            c["하남 짝 중 xmp 크롭"] += crop
            c["하남 짝 중 마스터 TIF"] += bool(r["master"])
            c["하남 짝 중 xmp 크롭+마스터"] += crop and bool(r["master"])
    print("| 항목 | 값 |\n|---|---|")
    for k in ("짝 전체", "짝 hanam", "짝 gundae", "짝 conf=high", "짝 conf=medium", "짝 conf=low",
              "하남 짝 중 xmp 크롭", "하남 짝 중 마스터 TIF", "하남 짝 중 xmp 크롭+마스터"):
        print(f"| {k} | {c[k]:,} |")
    if reg:
        n = len(reg)
        for k in "ABC":
            ok = sum(1 for r in reg if r.get(f"{k}_ok"))
            print(f"| 정합 {k} 성공 | {ok}/{n} ({ok/n:.0%}) |")
    if gun:
        ok = sum(1 for r in gun if r["ok"])
        print(f"| 건대 정합(출력용↔RAW) 성공 | {ok}/{len(gun)} |")


if __name__ == "__main__":
    main()
