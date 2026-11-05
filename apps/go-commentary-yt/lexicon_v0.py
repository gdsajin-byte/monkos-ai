#!/usr/bin/env python3
"""자막 교정 사전 v0 — 무료 자동 자막 ↔ Flash 음성 정답본(148조각) 정렬·오류율·교정 후보 상위 50 (PF_GO, 11-06 04:26 B안 4항, 무료)
  lexicon_v0.py   → answers/lexicon_v0.json(전체) + answers/lexicon_v0.md(표)
정렬: 10분 조각마다 정답본 line 전체 ↔ 같은 구간 자동 자막 이벤트 전체. 오류율 = 글자 편집 거리 / 정답 글자(공백·부호 제외).
교정 후보: 어절 정렬(SequenceMatcher)의 1~2어절 치환 쌍 중 글자 유사도 ≥ 0.34(소리 비슷한 오인식 — 정렬 어긋남 제외), 출현 조각 수 2↑, 빈도순.
"""
import json, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
HERE = Path(__file__).resolve().parent
sel = {r["id"]: r for r in json.loads((B / "selection.json").read_text())}
src = (HERE.parent / "go-commentary-pilot" / "lexicon.yaml").read_text(encoding="utf-8")
TERMS = set(t.strip() for t in re.findall(r'(?:name|ko|term)\s*:\s*"?([가-힣][가-힣 ]{0,8})', src)) | {
    "대세점", "쌍립", "삼삼", "걸침", "협공", "정석", "사활", "끝내기", "포석", "행마", "수상전", "형세", "대마", "어깨짚음", "입구자", "덤", "반집", "불계"}
NAMES = {"목진석", "이현욱", "송태곤", "류승희", "문도원", "최유진", "김여원", "김지명", "이유민"}


def norm(s):
    return re.sub(r"[^가-힣A-Za-z0-9]", "", s)


def lev(a, b):
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def subs_events(vid):
    f = next((B / "subs").glob(f"{vid}*.json3"), None)
    if not f:
        return []
    return [(e.get("tStartMs", 0) / 1000, "".join(s.get("utf8", "") for s in e.get("segs") or []).strip()) for e in json.loads(f.read_text()).get("events", [])]


rows, pairs, pair_chunks = [], Counter(), defaultdict(set)
term_ref, term_hit = Counter(), Counter()
subs_cache = {}
for jf in sorted(B.glob("*/flash_*/gemini_full.json")):
    vid = jf.parent.parent.name
    j = json.loads(jf.read_text())
    s0, s1 = j["_meta"]["window"]
    ref = " ".join(s.get("line") or "" for s in j["scenes"])
    ev = subs_cache.setdefault(vid, subs_events(vid))
    hyp = " ".join(x for t, x in ev if s0 <= t < s1 and x)
    if not ev:
        rows.append({"id": vid, "win": [s0, s1], "commentator": sel[vid]["commentator"], "cer": None, "ref": len(norm(ref)), "hyp": 0})
        continue
    a, b = norm(ref), norm(hyp)
    c = lev(a, b) / max(1, len(a))
    rows.append({"id": vid, "win": [s0, s1], "commentator": sel[vid]["commentator"], "cer": round(c, 4), "ref": len(a), "hyp": len(b)})
    for t in TERMS | NAMES:
        n = a.count(norm(t))
        if n:
            term_ref[t] += n
            term_hit[t] += min(n, b.count(norm(t)))
    ra, hb = ref.split(), hyp.split()
    for op, i1, i2, j1, j2 in SequenceMatcher(None, ra, hb, autojunk=False).get_opcodes():
        if op == "replace" and i2 - i1 <= 2 and j2 - j1 <= 2:
            r, h = norm(" ".join(ra[i1:i2])), norm(" ".join(hb[j1:j2]))
            if r and h and r != h and SequenceMatcher(None, r, h).ratio() >= 0.34:
                pairs[(r, h)] += 1
                pair_chunks[(r, h)].add(f"{vid}:{s0}")
    print(f"{vid} {s0} CER {c:.0%}", flush=True)

cand = [(r, h, n, len(pair_chunks[(r, h)])) for (r, h), n in pairs.most_common() if len(pair_chunks[(r, h)]) >= 2]
is_dom = lambda r: any(norm(t) in r for t in TERMS | NAMES)
top = cand[:50]
top_dom = [x for x in cand if is_dom(x[0])][:50]
ok = [r for r in rows if r["cer"] is not None]
by = defaultdict(list)
for r in ok:
    by[r["commentator"]].append(r)
wcer = lambda rs: sum(r["cer"] * r["ref"] for r in rs) / max(1, sum(r["ref"] for r in rs))
out = {"chunks": rows, "cer_all": wcer(ok), "cer_by": {k: wcer(v) for k, v in by.items()},
       "term_recall": {t: [term_hit[t], term_ref[t]] for t in term_ref}, "top50": top, "top50_domain": top_dom}
(B / "lexicon_v0.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
md = [f"## 자막 교정 사전 v0 — 자동 자막 ↔ Flash 정답본 ({len(ok)}조각, 자동 자막 없는 조각 {len(rows) - len(ok)})",
      "| 해설자 | 조각 | 글자 오류율(가중) |", "|---|---|---|"]
md += [f"| {k} | {len(v)} | {wcer(v):.1%} |" for k, v in by.items()] + [f"| 전체 | {len(ok)} | {wcer(ok):.1%} |", ""]
tr = sorted(((t, h, n) for t, (h, n) in out["term_recall"].items() if n >= 5), key=lambda x: x[1] / x[2])
md += ["### 용어·이름 재현율 하위 15 (정답 등장 5회↑)", "| 단어 | 자동 자막 일치/정답 | 재현율 |", "|---|---|---|"]
md += [f"| {t} | {h}/{n} | {h / n:.0%} |" for t, h, n in tr[:15]] + [""]
md += ["### 교정 후보 상위 50 (정답 ← 자동 자막, 빈도순·2조각 이상)", "| # | 정답 | 자동 자막 | 횟수 | 조각 수 | 용어·이름 |", "|---|---|---|---|---|---|"]
md += [f"| {i} | {r} | {h} | {n} | {k} | {'●' if is_dom(r) else ''} |" for i, (r, h, n, k) in enumerate(top, 1)] + [""]
md += ["### 용어·이름 교정 후보 상위 50", "| # | 정답 | 자동 자막 | 횟수 | 조각 수 |", "|---|---|---|---|---|"]
md += [f"| {i} | {r} | {h} | {n} | {k} |" for i, (r, h, n, k) in enumerate(top_dom, 1)]
(B / "lexicon_v0.md").write_text("\n".join(md))
print("\n".join(md[:12]))
