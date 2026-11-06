#!/usr/bin/env python3
"""출력 검사 ① — 생성 해설이 방송 원문과 길게 겹치는지(연속 어절 n개↑) 경고. 정정 05:24(작가님): 선은 출력에서만.

  python3 AI_Factory/corpus/check_overlap.py 대본.json [--n 8] [--db …]      # 대본 JSON(lines[].text) 또는 텍스트 파일
  python3 AI_Factory/corpus/check_overlap.py --text "검사할 문장" [--n 8]
판정: 어절(공백 단위, 문장부호 제거) n-gram이 원문(source.kind='youtube') 발화·구간과 겹치면 경고 + 가장 긴 일치 길이·출처.
② 실존 해설자 이름·목소리 흉내: 대본에 해설자 실명(speaker.kind='real', role 해설·캐스터)이 나오면 경고(목소리는 tts.py VOICES — 작가님·유니·다인·공개 기본 보이스만).
"""
import argparse
import json
import os
import re
import sqlite3
import sys
from collections import defaultdict

PUNCT = re.compile(r"[^\w가-힣]+")


def words(t):
    return [w for w in (PUNCT.sub(" ", t or "").split()) if w]


def strip_markers(t):
    return re.sub(r"<[^>]+>", "", t)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?")
    ap.add_argument("--text")
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    a = ap.parse_args()
    if a.text:
        lines = [a.text]
    elif a.path and a.path.endswith(".json"):
        lines = [strip_markers(l["text"]) for l in json.load(open(a.path, encoding="utf-8"))["lines"]]
    elif a.path:
        lines = [l for l in open(a.path, encoding="utf-8").read().splitlines() if l.strip()]
    else:
        sys.exit("사용: check_overlap.py 대본.json | --text …")
    db = sqlite3.connect(a.db)
    n = a.n
    idx = defaultdict(set)
    rows = db.execute("""SELECT u.id, u.source_id, u.text FROM utterance u JOIN source s ON s.id=u.source_id WHERE s.kind='youtube'
                         UNION ALL SELECT -g.id, g.source_id, g.text FROM segment g JOIN source s ON s.id=g.source_id WHERE s.kind='youtube'""").fetchall()
    for rid, sid, t in rows:
        w = words(t)
        for i in range(len(w) - n + 1):
            idx[tuple(w[i:i + n])].add((rid, sid))
    names = {r[0] for r in db.execute("SELECT name FROM speaker WHERE kind='real' AND role IN ('해설','캐스터')")}
    warn = 0
    for k, line in enumerate(lines):
        w = words(line)
        hits = [(i, idx[tuple(w[i:i + n])]) for i in range(len(w) - n + 1) if tuple(w[i:i + n]) in idx]
        # 가장 긴 연속 일치 길이(n-gram이 이어지는 구간)
        best, run, start = 0, 0, None
        prev = -2
        for i, _ in hits:
            run = run + 1 if i == prev + 1 else 1
            prev = i
            best = max(best, run + n - 1)
        named = [nm for nm in names if nm in line]
        if hits or named:
            warn += 1
            src = sorted({s for _, ss in hits for _, s in ss})[:3]
            print(f"⚠️ {k}줄: 원문 연속 일치 최장 {best}어절 · 출처 {src} · 실명 {named} — {line[:60]}")
    print(f"검사 {len(lines)}줄 · n={n} · 원문 {len(rows)}행 색인 · 경고 {warn}")
    sys.exit(1 if warn else 0)


if __name__ == "__main__":
    main()
