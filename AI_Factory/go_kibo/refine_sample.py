#!/usr/bin/env python3
"""정제·분류 30편 정확도 검토 표본 — 전 발화(버림 포함)에서 무작위 N(시드 고정) + 앞뒤 발화 맥락 + 일꾼 판단 + 검토 칸.

  python3 refine_sample.py [--n 50] [--seed 2026110750] [--prefix v1]
입력(레포 밖): commentary_v0/refine/{prefix}_all.jsonl (refine_report.py)
출력(레포 밖, 방송 원문 포함): commentary_v0/refine/{prefix}_review{N}.md · {prefix}_review{N}.jsonl(검토 결과를 채워 넣을 칸)
검토 칸: keep·label·role·board_dep·terms 각각 ○/× + 정답(틀렸을 때). 채운 jsonl을 `--score`로 넘기면 항목별 정확도를 센다.
"""
import argparse
import json
import os
import random
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")
FIELDS = ("keep", "label", "role", "board_dep", "terms")


def judge(r):
    if r.get("keep") is False:
        return f"버림 {r.get('drop')}"
    s = f"{r.get('label')} · 화자 {r.get('role')} · 판의존 {'예' if r.get('board_dep') else '아니오'}"
    if r.get("qa"):
        s += f" · qa {r['qa']}"
    if r.get("terms") or r.get("concepts"):
        s += f" · 용어 {', '.join(r.get('terms') or []) or '-'} · 개념 {', '.join(r.get('concepts') or []) or '-'}"
    return s


def score(path):
    rows = [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()]
    c = Counter()
    for r in rows:
        for f in FIELDS:
            v = (r.get("review") or {}).get(f)
            if v in ("○", "×"):
                c[(f, v)] += 1
    for f in FIELDS:
        a, b = c[(f, "○")], c[(f, "×")]
        print(f"{f}: {a}/{a + b}" + (f" = {a / (a + b) * 100:.0f}%" if a + b else " (미검토)"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50)
    ap.add_argument("--seed", type=int, default=2026110750)
    ap.add_argument("--prefix", default="v1")
    ap.add_argument("--score")
    a = ap.parse_args()
    if a.score:
        return score(a.score)
    rows = [json.loads(x) for x in open(os.path.join(D, f"{a.prefix}_all.jsonl"), encoding="utf-8")]
    idx = {(r["id"], r["i"]): k for k, r in enumerate(rows)}
    pick = sorted(random.Random(a.seed).sample(range(len(rows)), a.n))
    L = [f"# 정제·분류 {a.prefix} 정확도 검토 표본 {a.n} (레포 밖 — 방송 원문 포함, 커밋·외부 공개 금지)\n",
         f"> 모집단: 30편 전 발화 {len(rows):,}(버림 포함) · 무작위 {a.n} · 시드 {a.seed} · `refine_sample.py`. 예시 문서(v1_examples.md)와 달리 골라 뽑지 않았다.",
         f"> 검토: 같은 이름의 `.jsonl` 각 행 `review`에 {', '.join(FIELDS)} 를 ○/×로, 틀리면 `fix`에 정답. 채운 뒤 `python3 AI_Factory/go_kibo/refine_sample.py --score <jsonl>`.\n"]
    J = []
    for n, k in enumerate(pick, 1):
        r = rows[k]
        prev = rows[idx[(r["id"], r["i"] - 1)]] if (r["id"], r["i"] - 1) in idx else None
        nxt = rows[idx[(r["id"], r["i"] + 1)]] if (r["id"], r["i"] + 1) in idx else None
        L += [f"## {n}. {r['commentator']} · {r['id']} · 발화 {r['i']} · {int(r.get('t') or 0)}초",
              f"- 앞: {(prev or {}).get('text') or '(없음)'}" if prev else "- 앞: (없음)",
              f"- **대상**: {r.get('text') or '(효과음만 ' + ','.join(r.get('sfx') or []) + ')'}",
              f"- 뒤: {(nxt or {}).get('text') or '(없음)'}" if nxt else "- 뒤: (없음)",
              f"- 일꾼 판단: {judge(r)}" + (f" · 메모 {r['note']}" if r.get("note") else ""),
              "- 검토: keep □ · label □ · role □ · board_dep □ · terms □\n"]
        J.append({"n": n, "id": r["id"], "i": r["i"], "text": r.get("text"),
                  **{f: r.get(f) for f in ("keep", "drop", "label", "role", "board_dep", "qa", "terms", "concepts")},
                  "review": {f: "" for f in FIELDS}, "fix": {}})
    dist = Counter("버림" if r.get("keep") is False else r.get("label") for r in (rows[k] for k in pick))
    L.insert(3, "> 표본 구성: " + " · ".join(f"{k} {v}" for k, v in dist.most_common()) + "\n")
    out = os.path.join(D, f"{a.prefix}_review{a.n}")
    open(out + ".md", "w", encoding="utf-8").write("\n".join(L) + "\n")
    with open(out + ".jsonl", "w", encoding="utf-8") as f:
        for j in J:
            f.write(json.dumps(j, ensure_ascii=False) + "\n")
    print(out + ".md", dict(dist))


if __name__ == "__main__":
    main()
