#!/usr/bin/env python3
"""풀 감상 결과 분석 — 용어×단계 분포·캐스터 역할↔해설 응답 짝·유머 코드·판 그리기·입버릇 상위 (PF_GO, 11-05 지시서 §3·§7·§11 추가)
  analyze_full.py ID[:해설자] ID[:해설자] …   (cmp/<ID>_full/gemini_full.json + cmp/<ID>_1800/gemini_watch.json 대본)
"""
import json, re, sys
from collections import Counter, defaultdict
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "cmp"
args = [a.split(":") for a in sys.argv[1:]]
STOP = set("자 이제 그 이 저 좀 뭐 네 예 아 어 음 그리고 그래서 그런데 근데 지금 여기 거기 이거 그거 이렇게 그렇게 정말 진짜 또 더 너무 수 것 거 게 건 때 데 할 한 하는 있는 있습니다 합니다 거예요 거죠 했는데".split())


def ngrams(lines, n=2):
    c = Counter()
    for l in lines:
        w = [x for x in re.findall(r"[가-힣]+", l)]
        for i in range(len(w) - n + 1):
            g = w[i:i + n]
            if not all(x in STOP for x in g):
                c[" ".join(g)] += 1
    return c


phase_terms = defaultdict(Counter)
roles = Counter(); pairs = defaultdict(list)
humor = Counter(); humor_ex = defaultdict(list)
draws = []; trig = Counter()
speech = defaultdict(list)
print("## 표본별 장면 수")
for vid, *rest in args:
    who = rest[0] if rest else vid
    f = B / f"{vid}_full" / "gemini_full.json"
    if not f.exists():
        print(f"- {who}: 풀 감상 없음"); continue
    sc = json.loads(f.read_text())["scenes"]
    print(f"- {who} ({vid}): 장면 {len(sc)} · 화자 {dict(Counter(s.get('speaker') for s in sc))} · 단계 {dict(Counter(s.get('phase') for s in sc))} · move_no 확인 {sum(1 for s in sc if s.get('move_no') not in (None, 'null', ''))}")
    for i, s in enumerate(sc):
        ph = s.get("phase") or "?"
        for t in s.get("terms") or []:
            phase_terms[t][ph] += 1
        trig[(who, s.get("trigger"))] += 1
        if s.get("humor"):
            h = s["humor"]; humor[(who, h.get("code"))] += 1; humor_ex[who].append(f"[{h.get('code')}] {h.get('line')}")
        if s.get("board_draw"):
            draws.append((who, s["board_draw"]))
        sp = s.get("speaker")
        speech[(who, sp)].append(s.get("line") or "")
        if sp == "캐스터":
            nxt = next((x for x in sc[i + 1:i + 3] if x.get("speaker") == "해설"), None)
            role = s.get("trigger") or "?"
            roles[role] += 1
            if nxt:
                pairs[role].append((who, s.get("line", "")[:60], (nxt.get("line") or "")[:80]))
print("\n## 용어 × 단계(포석·중반·끝내기) — 2회 이상")
print("| 용어 | 포석 | 중반 | 끝내기 | 기타 |")
print("|---|---|---|---|---|")
for t, c in sorted(phase_terms.items(), key=lambda kv: -sum(kv[1].values())):
    if sum(c.values()) >= 2:
        print(f"| {t} | {c.get('포석', 0)} | {c.get('중반', 0)} | {c.get('끝내기', 0)} | {sum(v for k, v in c.items() if k not in ('포석', '중반', '끝내기'))} |")
print("\n## 캐스터 역할 → 해설 응답 짝(20분 시청본 caster_moves 기준)")
cr = Counter(); cex = defaultdict(list)
for vid, *rest in args:
    who = rest[0] if rest else vid
    g = B / f"{vid}_1800" / "gemini_watch.json"
    if g.exists():
        for m in json.loads(g.read_text()).get("caster_moves") or []:
            cr[m.get("role")] += 1; cex[m.get("role")].append((who, (m.get("line") or "")[:50], (m.get("reply") or "")[:70]))
print("| 역할 | 횟수 | 예(캐스터 → 해설 응답 요지) |")
print("|---|---|---|")
for r, n in cr.most_common():
    print(f"| {r} | {n} | " + " / ".join(f"[{w}] '{a}' → {b}" for w, a, b in cex[r][:2]) + " |")
print("\n## 발화 계기 분포(해설자별)")
for (w, t), n in sorted(trig.items()):
    print(f"- {w} · {t}: {n}")
print("\n## 유머 코드")
for (w, c), n in sorted(humor.items()):
    print(f"- {w} · {c}: {n}")
for w, ex in humor_ex.items():
    print(f"  - {w} 예: " + " | ".join(ex[:3]))
print("\n## 판 그리기 예")
for w, d in draws[:9]:
    print(f"- [{w}] {d}")
print("\n## 입버릇·자주 쓰는 말(2어절, 상위 20)")
for (w, sp), lines in sorted(speech.items(), key=lambda kv: kv[0]):
    if sp in ("해설", "캐스터") and lines:
        print(f"- {w} {sp}: " + ", ".join(f"{g}({n})" for g, n in ngrams(lines).most_common(20)))
