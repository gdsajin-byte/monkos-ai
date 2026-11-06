#!/usr/bin/env python3
"""대화록 구간 → 발화 단위 쪼개기(보정 ①②, 쌍아 05:14 승인) + LLM 일꾼 입력 묶음 만들기.

  python3 refine_split.py VIDEO [VIDEO ...] --prefix v1 --chars 30000
  python3 refine_split.py --all --prefix v1 --chars 30000

규칙(코드, LLM 앞단):
  ① 자동 자막의 `>>`(화자 전환) 위치에서 구간을 발화로 쪼갠다. 시각은 글자 수 비율로 나눈다.
  ② 조각 발화(효과음 표기를 뺀 본문 6자 이하이고 감탄·반응어가 아닌 것)는 앞 발화에 이어 붙인다.
  · 발화 안의 [음악]·[웃음]·[박수] 같은 표기는 지우고 `sfx` 칸에 남긴다. 표기만 있는 발화는 text를 비우고 sfx만 둔다(LLM이 MUSIC으로 버림).
출력(레포 밖): commentary_v0/refine/{prefix}_{영상}_in{k}.jsonl — 행 {i(영상 안 발화 번호), seg(원 구간 번호), t, text, sfx, speaker_guess}
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

YT = os.path.expanduser("~/.monkos/go-commentary-yt/answers/corrected.jsonl")
D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")
SFX = re.compile(r"\[(음악|웃음|박수|목을 가다듬음|[^\]]{1,8})\]")
REACT = re.compile(r"^(네+|예|아+|어+|오+|음+|와+|그렇죠|그렇네요|맞아요|맞습니다|좋네요|아하|헐)[.!?~ ]*$")


def split_segment(d):
    parts = [p.strip() for p in d["text"].split(">>")]
    parts = [p for p in parts if p]
    if not parts:
        return []
    total = sum(len(p) for p in parts) or 1
    dur = max(0.0, d["t_end"] - d["t_start"])
    out, acc = [], 0
    for p in parts:
        sfx = SFX.findall(p)
        body = re.sub(r"\s+", " ", SFX.sub(" ", p)).strip()
        out.append({"t": round(d["t_start"] + dur * acc / total, 1), "text": body, "sfx": sfx, "speaker_guess": d["speaker"]})
        acc += len(p)
    return out


def utterances(segs):
    out = []
    for si, d in enumerate(segs):
        for u in split_segment(d):
            u["seg"] = si
            frag = u["text"] and len(u["text"].replace(" ", "")) <= 6 and not REACT.match(u["text"])
            if frag and out and out[-1]["text"]:
                out[-1]["text"] = (out[-1]["text"] + " " + u["text"]).strip()
                out[-1]["sfx"] += u["sfx"]
                out[-1]["merged"] = out[-1].get("merged", 0) + 1
                continue
            out.append(u)
    for i, u in enumerate(out):
        u["i"] = i
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--prefix", default="v1")
    ap.add_argument("--chars", type=int, default=30000)
    a = ap.parse_args()
    by = defaultdict(list)
    for x in open(YT, encoding="utf-8"):
        d = json.loads(x)
        by[d["id"]].append(d)
    vids = sorted(by) if a.all else a.videos
    os.makedirs(D, exist_ok=True)
    plan = []
    for v in vids:
        segs = sorted(by[v], key=lambda d: d["t_start"])
        us = utterances(segs)
        chunks, cur, n = [], [], 0
        for u in us:
            cur.append(u)
            n += len(u["text"]) + 20
            if n >= a.chars:
                chunks.append(cur)
                cur, n = [], 0
        if cur:
            chunks.append(cur)
        for k, ch in enumerate(chunks):
            with open(os.path.join(D, f"{a.prefix}_{v}_in{k}.jsonl"), "w", encoding="utf-8") as f:
                for u in ch:
                    f.write(json.dumps({kk: u[kk] for kk in ("i", "seg", "t", "speaker_guess", "text", "sfx")}, ensure_ascii=False) + "\n")
        com = segs[0].get("commentator")
        cas = segs[0].get("caster") or []
        plan.append({"id": v, "segs": len(segs), "utts": len(us), "merged": sum(u.get("merged", 0) for u in us), "chunks": len(chunks),
                     "chars": sum(len(u["text"]) for u in us), "commentator": com, "caster": cas})
    json.dump(plan, open(os.path.join(D, f"{a.prefix}_plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"영상 {len(plan)} · 구간 {sum(p['segs'] for p in plan)} → 발화 {sum(p['utts'] for p in plan)} (조각 병합 {sum(p['merged'] for p in plan)}) · 묶음 {sum(p['chunks'] for p in plan)} · {sum(p['chars'] for p in plan)}자")


if __name__ == "__main__":
    main()
