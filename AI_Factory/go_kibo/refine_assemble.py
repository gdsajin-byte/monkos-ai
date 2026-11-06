#!/usr/bin/env python3
"""대화록 정제·분류 결과 조립·검사 — 묶음별 입력(in*.jsonl)과 LLM 일꾼 출력(out*.jsonl)을 i로 맞춰 하나로, 형식 검사, 라벨 분량, 검토 표본.

  python3 refine_assemble.py rDXb5uPMJMg [--prefix pilot] [--sample 50]
출력(레포 밖, 대화록 원문 포함): commentary_v0/refine/{prefix}_{영상}_merged.jsonl · {prefix}_{영상}_kept.jsonl · {prefix}_{영상}_dropped.jsonl
                                 · {prefix}_{영상}_sample{N}.md(검토 표본 — 라벨 층화 무작위, 시드 고정)
출력(레포, 건수만): reports/REFINE_{PREFIX}_v0.md
"""
import argparse
import glob
import json
import os
import random
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")
LABELS = ["Q", "A", "국면", "형세", "수순", "선수대회", "추임새", "기타"]
DROPS = ["MUSIC", "AD", "GREET", "SCREEN", "CHAT", "NOISE"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("vid")
    ap.add_argument("--prefix", default="pilot")
    ap.add_argument("--sample", type=int, default=50)
    a = ap.parse_args()
    ins, outs = {}, {}
    for f in sorted(glob.glob(os.path.join(D, f"{a.prefix}_{a.vid}_in*.jsonl"))):
        for x in open(f, encoding="utf-8"):
            d = json.loads(x)
            ins[d["i"]] = d
    bad = []
    for f in sorted(glob.glob(os.path.join(D, f"{a.prefix}_{a.vid}_out*.jsonl"))):
        for n, x in enumerate(open(f, encoding="utf-8"), 1):
            x = x.strip()
            if not x:
                continue
            try:
                d = json.loads(x)
            except json.JSONDecodeError:
                bad.append(f"{os.path.basename(f)}:{n} JSON 오류")
                continue
            outs[d.get("i")] = d
    missing = sorted(set(ins) - set(outs))
    extra = sorted(set(outs) - set(ins))
    merged, kept, dropped = [], [], []
    for i in sorted(ins):
        o = outs.get(i, {})
        r = {**ins[i], **{k: o.get(k) for k in ("keep", "drop", "role", "label", "qa", "board_dep", "terms", "concepts", "note")}}
        if o and o.get("keep") is True and o.get("label") not in LABELS:
            bad.append(f"i={i} 라벨 '{o.get('label')}'")
        if o and o.get("keep") is False and o.get("drop") not in DROPS:
            bad.append(f"i={i} 버림 코드 '{o.get('drop')}'")
        merged.append(r)
        (kept if r.get("keep") else dropped).append(r)
    for name, rows in (("merged", merged), ("kept", kept), ("dropped", dropped)):
        with open(os.path.join(D, f"{a.prefix}_{a.vid}_{name}.jsonl"), "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    lab = Counter(r["label"] for r in kept)
    drp = Counter(r["drop"] for r in dropped)
    roles = Counter(r.get("role") for r in kept)
    role_shift = sum(1 for r in kept if r.get("role") and r["role"] != r["speaker_guess"])
    qa_ids = Counter(r["qa"] for r in merged if r.get("qa"))
    pairs = [q for q, n in qa_ids.items() if any(r["qa"] == q and r["label"] == "Q" for r in merged) and any(r["qa"] == q and r["label"] == "A" for r in merged)]
    terms = Counter(t for r in kept for t in (r.get("terms") or []))
    # 보정 지표(v0 대비): 짝 없는 A · 사람 '선수'가 개념으로 · 넓은 말 꼬리표 · 판 의존
    import re as _re
    qa_q = {r["qa"] for r in merged if r.get("label") == "Q" and r.get("qa")}
    a_orphan = sum(1 for r in kept if r["label"] == "A" and r.get("qa") not in qa_q)
    person_seonsu = sum(1 for r in kept if "선수" in (r.get("concepts") or []) and _re.search(r"(\S+ 선수|선수가|선수의|선수는|선수들)", r["text"]))
    broad = {"행마", "공격", "압박", "모양", "수읽기", "포석", "정석", "끝내기", "사활", "수상전", "살다", "죽다", "잡다", "공배", "계가"}
    broad_terms = sum(1 for r in kept for t in (r.get("terms") or []) if t in broad)
    bd = [r for r in kept if r.get("board_dep") is not None]
    bd_true = sum(1 for r in bd if r["board_dep"])
    bd_by = {l: (sum(1 for r in bd if r["label"] == l and r["board_dep"]), sum(1 for r in bd if r["label"] == l)) for l in LABELS}
    concepts = Counter(t for r in kept for t in (r.get("concepts") or []))
    # 검토 표본: 버림 10 + 라벨별 비례(최소 2) — 시드 고정
    rnd = random.Random(20261107)
    pick = rnd.sample(dropped, min(10, len(dropped)))
    rest = a.sample - len(pick)
    by = {l: [r for r in kept if r["label"] == l] for l in LABELS}
    quota = {l: max(2, round(rest * len(v) / max(1, len(kept)))) if v else 0 for l, v in by.items()}
    while sum(quota.values()) > rest:
        k = max(quota, key=quota.get)
        quota[k] -= 1
    for l, v in by.items():
        pick += rnd.sample(v, min(quota[l], len(v)))
    pick.sort(key=lambda r: r["i"])
    S = [f"# 검토 표본 {len(pick)}구간 — {a.vid} (정제·분류 시범, 레포 밖 — 대화록 원문 포함)\n",
         "> 칸: i · 시각(초) · 목소리 추정 → 판단 화자 · 라벨/버림 · qa · 용어 · 개념 · 메모 · 원문. 검토 칸(✔/✘ + 고친 라벨)은 비워 둠.\n",
         "| i | 초 | 화자 | 라벨/버림 | qa | 판의존 | 용어 | 개념 | 메모 | 원문 | 검토 |", "|---|---|---|---|---|---|---|---|---|---|---|"]
    for r in pick:
        lv = r["label"] if r.get("keep") else f"버림:{r.get('drop')}"
        txt = r["text"].replace("|", "/")
        S.append(f"| {r['i']} | {int(r['t'])} | {r['speaker_guess']}→{r.get('role')} | {lv} | {r.get('qa') or ''} | {'○' if r.get('board_dep') else ''} | {', '.join(r.get('terms') or [])} | "
                 f"{', '.join(r.get('concepts') or [])} | {r.get('note') or ''} | {txt} | |")
    open(os.path.join(D, f"{a.prefix}_{a.vid}_sample{a.sample}.md"), "w", encoding="utf-8").write("\n".join(S) + "\n")
    import datetime as dt
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    L = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/refine_assemble.py\n---\n",
         f"# 대화록 정제·분류 {a.prefix} v0 — {a.vid}\n",
         f"> 생성 {now} KST. 방법: LLM 일꾼(Claude, 구독 범위·외부 API 0)이 맥락 묶음 `COMMENTARY_CONTEXT_v0.md`를 읽고 구간마다 판단. 원문·표본은 레포 밖 `commentary_v0/refine/`.\n",
         "## 1. 형식 검사\n", "| 항목 | 값 |", "|---|---|",
         f"| 입력 구간 | {len(ins)} |", f"| 출력 구간 | {len(outs)} |", f"| 누락 | {len(missing)} |", f"| 남는 출력 | {len(extra)} |", f"| 형식 오류 | {len(bad)} |",
         "\n## 2. 정제(버림)\n", "| 코드 | 구간 |", "|---|---|"] + [f"| {k} | {drp.get(k, 0)} |" for k in DROPS] + [f"| 계 | {len(dropped)} ({len(dropped) / max(1, len(merged)) * 100:.0f}%) |",
         "\n## 3. 분류(남긴 구간)\n", "| 라벨 | 구간 |", "|---|---|"] + [f"| {k} | {lab.get(k, 0)} |" for k in LABELS] + [
         f"| 계 | {len(kept)} |",
         f"\n- 화자: {dict(roles)} · 목소리 추정과 다르게 판단한 구간 {role_shift}",
         f"- Q&A 쌍(Q와 A가 모두 있는 qa 번호): {len(pairs)}",
         f"- 용어 꼬리표 상위: {', '.join(f'{k} {v}' for k, v in terms.most_common(12))}",
         f"- 개념 꼬리표 상위: {', '.join(f'{k} {v}' for k, v in concepts.most_common(10))}",
         "\n### 보정 지표\n", "| 지표 | 값 |", "|---|---|",
         f"| 짝 없는 A(Q 없이 A) | {a_orphan} |", f"| 사람을 가리키는 '선수'가 개념 꼬리표로 | {person_seonsu} |",
         f"| 넓은 말(행마·공격·압박 등) 용어 꼬리표 | {broad_terms} |",
         f"| 판 의존(board_dep) true / 표시된 행 | {bd_true} / {len(bd)} |"] + [
         f"| 　판 의존 — {l} | {bd_by[l][0]} / {bd_by[l][1]} |" for l in LABELS if bd_by[l][1]] + [
         f"\n## 4. 검토 표본\n\n- {len(pick)}구간(버림 {min(10, len(dropped))} + 라벨 비례, 시드 20261107): 레포 밖 `{a.prefix}_{a.vid}_sample{a.sample}.md` — 검토 칸 비움."]
    if bad:
        L += ["\n## 5. 형식 오류(앞 10)\n"] + [f"- {b}" for b in bad[:10]]
    open(os.path.join(HERE, "reports", f"REFINE_{a.prefix.upper()}_v0.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(json.dumps({"in": len(ins), "out": len(outs), "missing": len(missing), "bad": len(bad), "drop": dict(drp), "labels": dict(lab), "pairs": len(pairs),
                      "a_orphan": a_orphan, "person_seonsu": person_seonsu, "broad_terms": broad_terms, "board_dep": [bd_true, len(bd)]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
