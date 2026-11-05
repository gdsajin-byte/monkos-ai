#!/usr/bin/env python3
"""계가 정답 기록 요약 (형세봇 1/8, PF_GO 11-05) — answers.jsonl 건수·결과 일치율(앱 vs KataGo)·사석 수정 비율·마무리 사유.
  scoring_answers.py [JSONL 경로]   (기본 ~/.monkos/go-board/scoring/answers.jsonl, 테스트는 ~/.monkos/go-board/_test/scoring/answers.jsonl)
"""
import json, sys
from collections import Counter
from pathlib import Path


def signed(r):
    if not r:
        return None
    if r == "0":
        return 0.0
    try:
        c, v = r.split("+", 1)
        return (1 if c == "B" else -1) * float(v)
    except ValueError:
        return None


def main(path):
    p = Path(path)
    if not p.exists():
        sys.exit(f"❌ scoring_answers: 기록 파일 없음 — {p}")
    rows, bad = [], 0
    for line in p.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            bad += 1
    n = len(rows)
    print(f"파일: {p}\n건수: {n}" + (f" (읽지 못한 줄 {bad})" if bad else ""))
    if not n:
        return
    same = sum(1 for r in rows if r.get("result") == r.get("kata"))
    dirs = [(signed(r.get("result")), signed(r.get("kata"))) for r in rows]
    dir_ok = sum(1 for a, b in dirs if a is not None and b is not None and (a > 0) == (b > 0))
    within1 = sum(1 for a, b in dirs if a is not None and b is not None and abs(a - b) <= 1)
    fixed = sum(1 for r in rows if (r.get("toggles") or 0) > 0)
    print(f"결과 일치(앱 = KataGo): {same}/{n} ({same / n:.0%}) · 승패 방향 일치 {dir_ok}/{n} · 1집 이내 {within1}/{n}")
    print(f"사석 수정한 계가: {fixed}/{n} ({fixed / n:.0%}) · 토글 합 {sum((r.get('toggles') or 0) for r in rows)}")
    print("마무리 사유:", dict(Counter(r.get("finishWhy") or "-" for r in rows)))
    print("봇/사람:", dict(Counter("봇" if r.get("bot") else "KataGo" for r in rows)))
    have = [r for r in rows if r.get("preLead") is not None]
    if have:
        gap = [abs(r["preLead"] - signed(r["kata"])) for r in have if signed(r.get("kata")) is not None]
        if gap:
            print(f"마무리 전 형세(preLead) vs KataGo 판정 차: 평균 {sum(gap) / len(gap):.1f}집 (n={len(gap)})")
    print("최근 3건:")
    for r in rows[-3:]:
        print(f"  {r.get('at')} {r.get('room')} {r.get('moveN')}수 마무리 {len(r.get('finish') or [])}수 · 앱 {r.get('result')} · KataGo {r.get('kata')} · 토글 {r.get('toggles')}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else str(Path.home() / ".monkos/go-board/scoring/answers.jsonl"))
