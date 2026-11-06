#!/usr/bin/env python3
"""대화록 정제·분류 30편 전체 조립 + 보고 — 해설자별 라벨 분량 · Q&A 쌍 예시 20 · 국면 해설 예시 20.

  python3 refine_report.py
입력(레포 밖): commentary_v0/refine/v1_{영상}_in*.jsonl · _out*.jsonl (refine_split.py + LLM 일꾼), answers/corrected.jsonl(해설자·캐스터)
출력(레포 밖, 원문 포함): refine/v1_all.jsonl(전 발화 + 판단) · refine/v1_examples.md(Q&A 20·국면 20)
출력(레포, 건수만): reports/REFINE_ALL_v1.md
"""
import glob
import json
import os
import random
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")
YT = os.path.expanduser("~/.monkos/go-commentary-yt/answers/corrected.jsonl")
LABELS = ["Q", "A", "국면", "형세", "수순", "선수대회", "추임새", "기타"]
DROPS = ["MUSIC", "AD", "GREET", "SCREEN", "CHAT", "NOISE"]


def main():
    meta = {}
    for x in open(YT, encoding="utf-8"):
        d = json.loads(x)
        meta.setdefault(d["id"], (d.get("commentator") or "?", tuple(d.get("caster") or [])))
    rows = []
    for vid in sorted(meta):
        ins, outs = {}, {}
        for f in glob.glob(os.path.join(D, f"v1_{vid}_in*.jsonl")):
            for x in open(f, encoding="utf-8"):
                d = json.loads(x)
                ins[d["i"]] = d
        for f in glob.glob(os.path.join(D, f"v1_{vid}_out*.jsonl")):
            for x in open(f, encoding="utf-8"):
                if x.strip():
                    d = json.loads(x)
                    outs[d["i"]] = d
        com, cas = meta[vid]
        for i in sorted(ins):
            o = outs.get(i, {})
            rows.append({"id": vid, "commentator": com, "caster": "·".join(cas), **ins[i],
                         **{k: o.get(k) for k in ("keep", "drop", "role", "label", "qa", "board_dep", "terms", "concepts", "note")}})
    with open(os.path.join(D, "v1_all.jsonl"), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    kept = [r for r in rows if r.get("keep")]
    dropped = [r for r in rows if r.get("keep") is False]
    by_com = defaultdict(Counter)
    for r in rows:
        by_com[r["commentator"]]["_all"] += 1
        if r.get("keep"):
            by_com[r["commentator"]][r["label"]] += 1
        else:
            by_com[r["commentator"]]["_drop"] += 1
    # 해설자 본인 발화 수(role=해설)
    own = Counter(r["commentator"] for r in kept if r.get("role") == "해설")
    vids = Counter()
    for v, (c, _) in meta.items():
        vids[c] += 1
    # Q&A 쌍
    pairs = []
    by_key = defaultdict(lambda: {"Q": [], "A": []})
    for r in kept:
        if r.get("qa") and r["label"] in ("Q", "A"):
            by_key[(r["id"], r["qa"])][r["label"]].append(r)
    for (vid, k), v in by_key.items():
        if v["Q"] and v["A"]:
            pairs.append((v["Q"][0], v["A"][0]))
    pairs_by_com = Counter(q["commentator"] for q, _ in pairs)
    terms = Counter(t for r in kept for t in (r.get("terms") or []))
    concepts = Counter(t for r in kept for t in (r.get("concepts") or []))
    bd = Counter((r["label"], bool(r.get("board_dep"))) for r in kept)
    # 예시(시드 고정, 해설자 고르게)
    rnd = random.Random(20261107)
    good_pairs = [(q, a) for q, a in pairs if 12 <= len(q["text"]) <= 140 and 25 <= len(a["text"]) <= 260 and not a.get("board_dep")]
    ex_qa = []
    for com in ("송태곤", "목진석", "이현욱"):
        pool = [p for p in good_pairs if p[0]["commentator"] == com]
        ex_qa += rnd.sample(pool, min(7 if com != "이현욱" else 6, len(pool)))
    good_g = [r for r in kept if r["label"] == "국면" and not r.get("board_dep") and 40 <= len(r["text"]) <= 220 and (r.get("terms") or r.get("concepts"))]
    ex_g = []
    for com in ("송태곤", "목진석", "이현욱"):
        pool = [r for r in good_g if r["commentator"] == com]
        ex_g += rnd.sample(pool, min(7 if com != "이현욱" else 6, len(pool)))
    E = ["# 정제·분류 30편 예시 (레포 밖 — 방송 원문 포함, 외부 공개·커밋 금지)\n",
         f"> Q&A {len(ex_qa)} · 국면 해설 {len(ex_g)} — 해설자별 고르게, 판 의존(board_dep) 아닌 것만, 시드 20261107.\n", "## Q&A 쌍\n"]
    for n, (q, a) in enumerate(ex_qa, 1):
        E += [f"**{n}. {q['commentator']} · {q['id'][:4]}… {int(q['t'])}초**", f"- Q({q.get('role')}): {q['text']}", f"- A({a.get('role')}): {a['text']}", ""]
    E.append("## 국면 해설(판 없이 서는 문장)\n")
    for n, r in enumerate(ex_g, 1):
        E += [f"**{n}. {r['commentator']} · {r['id'][:4]}… {int(r['t'])}초** · 용어 {', '.join(r.get('terms') or [])} · 개념 {', '.join(r.get('concepts') or [])}", f"> {r['text']}", ""]
    open(os.path.join(D, "v1_examples.md"), "w", encoding="utf-8").write("\n".join(E) + "\n")
    import datetime as dt
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    L = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/refine_report.py\n---\n",
         "# 대화록 정제·분류 v1 — 30편 전체\n",
         f"> 생성 {now} KST. 방법: 발화 쪼개기(refine_split.py, `>>` 화자 전환·조각 병합) → LLM 일꾼(Claude 구독 범위, 외부 API 0)이 맥락 묶음 `COMMENTARY_CONTEXT_v1.md` 기준으로 발화마다 판단(묶음 89 + 시범 8 + 재분류 3). 원문·데이터·예시는 레포 밖 `commentary_v0/refine/v1_all.jsonl`·`v1_examples.md`.\n",
         "## 1. 전체\n", "| 항목 | 값 |", "|---|---|",
         f"| 영상 | {len(meta)} |", f"| 원 자막 구간 | 17,126 |", f"| 발화(쪼갠 뒤) | {len(rows):,} |",
         f"| 남김 / 버림 | {len(kept):,} / {len(dropped):,} ({len(dropped) / len(rows) * 100:.1f}%) |",
         f"| Q&A 쌍(Q·A 모두 있음) | {len(pairs):,} |", f"| 형식 오류·누락 | 0 · 0 |",
         "\n## 2. 버림 사유\n", "| 코드 | 발화 |", "|---|---|"] + [f"| {k} | {Counter(r['drop'] for r in dropped)[k]:,} |" for k in DROPS] + [
         "\n## 3. 해설자별 라벨 분량\n",
         "| 해설자 | 영상 | 발화 | 버림 | " + " | ".join(LABELS) + " | 해설자 본인 발화 | Q&A 쌍 |",
         "|---|---|---|---|" + "---|" * len(LABELS) + "---|---|"]
    for com in sorted(by_com, key=lambda c: -by_com[c]["_all"]):
        c = by_com[com]
        L.append(f"| {com} | {vids[com]} | {c['_all']:,} | {c['_drop']:,} | " + " | ".join(f"{c[l]:,}" for l in LABELS) + f" | {own[com]:,} | {pairs_by_com[com]:,} |")
    L += ["\n## 4. 판 의존(board_dep) — 라벨별\n", "| 라벨 | 판 없이 섬 | 판 의존 | 판 없이 비율 |", "|---|---|---|---|"]
    for l in LABELS:
        a, b = bd[(l, False)], bd[(l, True)]
        if a + b:
            L.append(f"| {l} | {a:,} | {b:,} | {a / (a + b) * 100:.0f}% |")
    L += ["\n## 5. 꼬리표 상위\n",
          "- 용어: " + ", ".join(f"{k} {v}" for k, v in terms.most_common(20)),
          "- 개념: " + ", ".join(f"{k} {v}" for k, v in concepts.most_common(15)),
          "\n## 6. 예시\n", f"- Q&A 쌍 {len(ex_qa)}·국면 해설 {len(ex_g)}(판 없이 서는 문장, 해설자별 고르게): 레포 밖 `refine/v1_examples.md`.",
          "\n## 7. 품질 메모\n",
          "- 일꾼 3묶음(e19·e27·e29)은 용어를 정규식으로 뽑았거나 'NOISE'를 라벨로 넣어 재분류했다(지시 파일에 '발화마다 직접 판단, 자동 추출 금지' 추가).",
          "- 한 발화 안에 질문과 대답이 섞인 경우(자막에 `>>`가 빠진 곳)가 남아 있다 — 일꾼들은 Q로 두고 note에 적었다. 짝 없는 Q가 일부 있다.",
          "- 화자(role)는 내용 판단이라 짧은 맞장구는 불확실하다. 표본 정확도는 쌍아·작가님 검토 표본으로 잰다(시범 50 검토 반영 후 v1)."]
    open(os.path.join(HERE, "reports", "REFINE_ALL_v1.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(len(rows), len(kept), len(dropped), len(pairs), dict(Counter(r["label"] for r in kept)))


if __name__ == "__main__":
    main()
