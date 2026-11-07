#!/usr/bin/env python3
"""작가님 감수 표본 50 — 유니 턴 + 장면 사실 + 바로 앞 해설자 턴. 휴대폰용 HTML 1개 + 점검용 JSONL.

  python3 review_doc.py [--n 50]

표본: 유형(실수·묘수·응징·난전) × act 층화, 대화당 최대 1턴, 시그니처 턴은 있으면 각 2개 이상 포함. 시드 20261107.
출력: reports/REVIEW50_v0.html (레포 — 대사·사실만, 대국자 정보 없음) · ~/.monkos/uni-caster/review50_v0.jsonl
"""
import argparse
import glob
import html
import json
import os
import random
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from check import SIG, judge_violations  # noqa: E402

D = os.path.expanduser("~/.monkos/uni-caster")
TYPES = ["실수", "묘수", "응징", "난전"]
QUOTA = {"실수": 18, "묘수": 10, "응징": 11, "난전": 11}


def fact_line(c):
    mv = f"{c['color']} {c['move_no']}수 · {c['phase']}"
    if c["type"] == "실수":
        same = "같은 " + c["best_region"] if c["best_region"] == c["move_region"] else f"최선은 {c['best_region']}"
        t = f"실전 {c['move_region']}({'·'.join(c['move_terms']) or '-'}) / {same}({'·'.join(c['best_terms']) or '-'}) · 손해 {c['loss']}집 · 승률 {c['wr_before']}%→{c['wr_after']}%"
    elif c["type"] == "묘수":
        t = f"{c['move_region']} {'·'.join(c['move_terms']) or '-'} = 엔진 1순위 · 첫 느낌 확률 {c.get('prior_pct')}% · 2순위와 {c.get('gap_second')}집 차 · 형세 {c['form_before']}"
    elif c["type"] == "응징":
        t = (f"직전 {c['prev_color']} {c['prev_region']}({'·'.join(c['prev_terms']) or '-'}) 손해 {c['prev_loss']}집 → "
             f"{c['color']} {c['move_region']}({'·'.join(c['move_terms']) or '-'}) 1순위 응징 · 승률 {c['wr_before']}%")
    else:
        t = f"{c['window'][0]}–{c['window'][1]}수 흑 승률 {'→'.join(map(str, c['wr_black_series']))} (50% 교차 {c['cross_50']}회)"
    if c.get("gold"):
        t += " · 감수 예문 장면"
    return mv, t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=50)
    a = ap.parse_args()
    rnd = random.Random(20261107)
    cards = {json.loads(x)["scene_id"]: json.loads(x) for x in open(os.path.join(D, "scene_cards_v0.jsonl"), encoding="utf-8")}
    gen = []
    for f in sorted(glob.glob(os.path.join(D, "gen", "part*.jsonl"))):
        gen += [json.loads(x) for x in open(f, encoding="utf-8") if x.strip()]
    rnd.shuffle(gen)
    cand = defaultdict(list)  # 유형 → [(대화, 턴 번호)]
    sig = []
    for g in gen:
        c = cards[g["scene_id"]]
        flagged = {ti for ti, _, _ in judge_violations(g)}
        for ti, t in enumerate(g["turns"]):
            if t["spk"] != "유니" or ti == 0:
                continue
            item = (g, ti, ti in flagged)
            if any(r.search(t["text"]) for r in SIG.values()):
                sig.append(item)
            else:
                cand[c["type"]].append(item)
    picked, used = [], set()
    for it in sig[:4]:
        picked.append(it)
        used.add(it[0]["scene_id"])
    for ty in TYPES:
        acts_seen = defaultdict(int)
        pool = sorted(cand[ty], key=lambda it: rnd.random())
        need = QUOTA[ty] - sum(1 for it in picked if cards[it[0]["scene_id"]]["type"] == ty)
        for it in pool:
            if need <= 0:
                break
            g, ti, _ = it
            act = g["turns"][ti].get("act")
            if g["scene_id"] in used or acts_seen[act] >= max(2, QUOTA[ty] // 4):
                continue
            picked.append(it)
            used.add(g["scene_id"])
            acts_seen[act] += 1
            need -= 1
    picked = picked[: a.n]
    picked.sort(key=lambda it: it[0]["scene_id"])

    rows, secs = [], []
    for k, (g, ti, flag) in enumerate(picked, 1):
        c = cards[g["scene_id"]]
        prev = next((g["turns"][j]["text"] for j in range(ti - 1, -1, -1) if g["turns"][j]["spk"] == "해설자"), "")
        t = g["turns"][ti]
        mv, fl = fact_line(c)
        rows.append({"no": k, "scene_id": g["scene_id"], "turn": ti, "type": c["type"], "act": t.get("act"),
                     "fact": fl, "prev_commentator": prev, "uni": t["text"], "auto_flag": flag})
        secs.append(f"""<section class="card" id="r{k}">
<h2>{k:02d}. {html.escape(c['type'])} · {html.escape(t.get('act') or '')} <small>{html.escape(g['scene_id'])} · {html.escape(mv)}</small></h2>
<p class="f">{html.escape(fl)}</p>
<p class="c"><span>해설자</span>{html.escape(prev)}</p>
<p class="u"><span>유니</span>{html.escape(t['text'])}</p>
{'<p class="w">자동 점검: 선판단 의심</p>' if flag else ''}
<p class="rv">감수: ✔ / ✘ / 고칠 말 — </p>
</section>""")
    with open(os.path.join(D, "review50_v0.jsonl"), "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    cnt = defaultdict(int)
    for r in rows:
        cnt[r["type"]] += 1
    doc = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>유니 감수 50</title>
<style>
:root{{--bg:#f6f1e7;--fg:#222;--mut:#666;--card:#fff;--acc:#b0361b;--uni:#1d6fa5}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#16130f;--fg:#eee;--mut:#aaa;--card:#24201a;--acc:#ff7a5c;--uni:#7cc4f5}}}}
:root[data-theme="dark"]{{--bg:#16130f;--fg:#eee;--mut:#aaa;--card:#24201a;--acc:#ff7a5c;--uni:#7cc4f5}}
body{{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 -apple-system,"Apple SD Gothic Neo",sans-serif}}
main{{max-width:720px;margin:0 auto;padding:12px 16px 40px}}
h1{{font-size:20px;margin:8px 0}} .lead{{color:var(--mut);font-size:13px}}
.card{{background:var(--card);border-radius:12px;padding:12px 14px;margin:14px 0;box-shadow:0 1px 3px #0002}}
h2{{font-size:15px;margin:2px 0 6px}} h2 small{{color:var(--mut);font-weight:400;font-size:12px}}
.f{{font-size:12px;color:var(--mut);margin:4px 0}}
.c,.u{{margin:6px 0}} .c{{color:var(--mut);font-size:14px}} .u{{font-size:17px;font-weight:600;color:var(--uni)}}
.c span,.u span{{display:inline-block;min-width:3.2em;font-size:11px;font-weight:700;margin-right:6px;color:var(--mut)}}
.w{{color:var(--acc);font-size:12px;margin:2px 0}} .rv{{color:var(--mut);font-size:13px;border-top:1px dashed #8884;padding-top:6px;margin-bottom:0}}
</style></head><body><main>
<h1>유니 캐스터 — 감수 표본 50</h1>
<p class="lead">합성 대사 v0 중 유니 턴 {len(rows)}개(유형 {dict(cnt)}). 위 회색 줄 = 장면 사실(엔진), 회색 문단 = 바로 앞 해설자 턴, 파란 굵은 글씨 = 감수 대상 유니 대사. 시트 v0: 호칭 '해설자님/해설자께서', 시그니처 장면당 1회, 유니는 수 판단 안 함. 생성 2026-11-07 KST.</p>
{chr(10).join(secs)}
</main></body></html>
"""
    open(os.path.join(HERE, "reports", "REVIEW50_v0.html"), "w", encoding="utf-8").write(doc)
    print(len(rows), dict(cnt), "flag", sum(r["auto_flag"] for r in rows))


if __name__ == "__main__":
    main()
