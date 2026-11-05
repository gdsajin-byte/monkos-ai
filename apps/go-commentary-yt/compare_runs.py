#!/usr/bin/env python3
"""두 풀 감상 결과 비교 — 대사(오류율·용어·이름)·장면 수·필드 채움 (PF_GO, 11-05 22:56 Flash 음성만 vs Pro 영상)
  compare_runs.py 기준폴더 비교폴더 시작초 끝초 이름,이름   (각 폴더의 gemini_full.json)
"""
import json, re, sys
from pathlib import Path

sys.argv = sys.argv
B = Path.home() / ".monkos" / "go-commentary-yt" / "cmp"
ref_d, hyp_d, s0, s1 = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
names = sys.argv[5].split(",") if len(sys.argv) > 5 else []


def secs(m):
    p = [int(x) for x in str(m).split(":")]
    return p[0] * 3600 + p[1] * 60 + p[2] if len(p) == 3 else p[0] * 60 + p[1]


def norm(s):
    return re.sub(r"[^가-힣A-Za-z0-9]", "", s)


def cer(a, b):
    a, b = norm(a), norm(b)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1] / max(1, len(a))


def load(d):
    j = json.loads((B / d / "gemini_full.json").read_text())
    return j, [s for s in j["scenes"] if s0 <= secs(s["t_start"]) < s1]


rj, rs = load(ref_d)
hj, hs = load(hyp_d)
ref, hyp = " ".join(s.get("line") or "" for s in rs), " ".join(s.get("line") or "" for s in hs)
terms = {t for s in rs for t in (s.get("terms") or [])}
tr = sum(min(norm(ref).count(norm(t)), norm(hyp).count(norm(t))) for t in terms) / max(1, sum(norm(ref).count(norm(t)) for t in terms))
nr = sum(min(norm(ref).count(n), norm(hyp).count(n)) for n in names) / max(1, sum(norm(ref).count(n) for n in names))
fill = lambda ss, k: sum(1 for s in ss if s.get(k) not in (None, "", [], "null"))
print(f"| 항목 | {ref_d} ({rj['_meta'].get('input')}) | {hyp_d} ({hj['_meta'].get('input')}) |")
print("|---|---|---|")
print(f"| 장면 수({s0}~{s1}초) | {len(rs)} | {len(hs)} |")
print(f"| 대사 글자 수 | {len(norm(ref))} | {len(norm(hyp))} |")
print(f"| 대사 차이(기준 대비 CER) | — | {cer(ref, hyp):.0%} |")
print(f"| 용어 재현율(기준 terms) | — | {tr:.0%} |")
print(f"| 이름 재현율 | — | {nr:.0%} |")
for k in ("board_draw", "expression", "humor", "term_context"):
    print(f"| {k} 채운 장면 | {fill(rs, k)} | {fill(hs, k)} |")
print(f"| 장면 종류(trigger) | {dict(__import__('collections').Counter(s.get('trigger') for s in rs))} | {dict(__import__('collections').Counter(s.get('trigger') for s in hs))} |")
