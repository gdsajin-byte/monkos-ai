#!/usr/bin/env python3
"""목록 요약 — 해설자 3인(목진석·이현욱·송태곤): 편수·시간·연도·캐스터(설명에 있을 때만)·조회수 상위 (PF_GO, 11-05)
  catalog_summary.py [상위 N]   catalog.jsonl + catalog/desc_api.jsonl(조회수·게시일)
"""
import json, sys
from collections import Counter, defaultdict
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 5
api = {}
for l in (B / "catalog" / "desc_api.jsonl").read_text(encoding="utf-8").splitlines():
    j = json.loads(l); api[j["id"]] = j
rows = [json.loads(l) for l in (B / "catalog.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
WHO = ("목진석", "이현욱", "송태곤")
by = defaultdict(list)
for r in rows:
    for c in r["commentator"]:
        if c in WHO:
            by[c].append(r)
print("| 해설자 | 채널(편수) | 편수 | 총 시간 | 연도 분포 | 캐스터(설명 기준, 상위) | 조회수 합 |")
print("|---|---|---|---|---|---|---|")
for c in WHO:
    rs = by[c]
    ch = Counter(r["channel"] for r in rs)
    yrs = Counter(((api.get(r["id"]) or {}).get("date") or r.get("date") or "????")[:4] for r in rs)
    cas = Counter(x for r in rs for x in (r.get("caster") or []) if x != c)
    views = sum((api.get(r["id"]) or {}).get("views", 0) for r in rs)
    hours = sum((r.get("duration") or 0) for r in rs) / 3600
    print(f"| {c} | {', '.join(f'{k} {v}' for k, v in ch.items())} | {len(rs)} | {hours:,.0f}시간 | "
          f"{', '.join(f'{y}:{n}' for y, n in sorted(yrs.items()))} | {', '.join(f'{k} {v}' for k, v in cas.most_common(4)) or '-'} | {views:,} |")
print()
for c in WHO:
    print(f"### {c} 조회수 상위 {N}")
    top = sorted(by[c], key=lambda r: -((api.get(r["id"]) or {}).get("views", 0)))[:N]
    for r in top:
        a = api.get(r["id"]) or {}
        print(f"- {r['id']} · {a.get('views', 0):,}회 · {(r.get('duration') or 0) // 60}분 · {a.get('date')} · [{r['channel']}] {r['title'][:60]} · 캐스터 {r.get('caster') or '-'}")
