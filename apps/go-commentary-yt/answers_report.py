#!/usr/bin/env python3
"""정답지 일괄 실지출 표 — answers/ledger.jsonl(호출마다 1행, 모델별 공식 단가 환산) → 마크다운 (PF_GO, 11-06)
  answers_report.py
"""
import json, os
from collections import defaultdict
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
L = [json.loads(l) for l in (B / "ledger.jsonl").read_text().splitlines() if l.strip()]
sel = json.loads((B / "selection.json").read_text())


def kind(r):
    if r["ok"]:
        return "성공"
    if r["finish"] == "MAX_TOKENS":
        return "실패·출력 상한(과금됨)"
    if "429" in (r["err"] or ""):
        return "실패·429(과금 없음)"
    return "실패·기타"


g = defaultdict(lambda: [0, 0, 0, 0, 0.0])
for r in L:
    a = g[(r["model"], kind(r))]
    a[0] += 1; a[1] += r["in"]; a[2] += r["out"]; a[3] += r["think"]; a[4] += r["usd"]
print("| 모델 | 결과 | 호출 | 입력 토큰 | 출력 토큰 | 생각 토큰 | 금액(USD) |\n|---|---|---|---|---|---|---|")
for (m, k), a in sorted(g.items()):
    print(f"| {m} | {k} | {a[0]} | {a[1]:,} | {a[2]:,} | {a[3]:,} | ${a[4]:.2f} |")
tot = sum(r["usd"] for r in L)
print(f"| **합** | | {len(L)} | | | | **${tot:.2f}** (≈₩{tot * 1470:,.0f}, 상한 $17) |")
done = {"flash": 0, "pro": 0}
want = {"flash": 0, "pro": 0}
for r in sel:
    for s in range(r["win60"][0], r["win60"][1], 600):
        want["flash"] += 1
        done["flash"] += (B / r["id"] / f"flash_{s}" / "gemini_full.json").exists()
pro_dirs = [d for d in B.glob("*/pro_*") if d.is_dir()]
done["pro"] = sum((d / "gemini_full.json").exists() for d in pro_dirs)
mins = sum((json.loads((d / "gemini_full.json").read_text())["_meta"]["window"][1] - json.loads((d / "gemini_full.json").read_text())["_meta"]["window"][0])
           for d in B.glob("*/flash_*") if (d / "gemini_full.json").exists()) / 60
print(f"\n산출: Flash 음성 정답본 {done['flash']}/{want['flash']} 조각({mins:.0f}분) · Pro 영상 {done['pro']}/18 조각")
