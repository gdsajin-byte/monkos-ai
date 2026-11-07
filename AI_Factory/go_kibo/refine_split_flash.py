#!/usr/bin/env python3
"""판독 9편 Gemini 전사(flash_*/scenes_board.json, 15초 장면) → LLM 일꾼 입력 묶음(대화록 30편과 같은 형식).

  python3 refine_split_flash.py [--prefix f1]
대화록 30편(refine_split.py)과 다른 점:
  · 원 자막 `>>`가 없다 — Gemini가 장면마다 화자(해설·캐스터·기타·침묵)를 이미 붙였다. 그 화자를 speaker_guess로 넘긴다(일꾼이 내용으로 다시 판단).
  · 한 장면 = 한 발화(15초 요약 가능성 — 일꾼은 그대로 판단). 같은 시각 중복 장면(창 경계)은 앞의 것만 둔다.
  · seg = 영상 안 장면 순번. t = t_abs 시작(초), t_end 추가.
출력(레포 밖): commentary_v0/refine/{prefix}_{영상}_in0.jsonl — 행 {i, seg, t, t_end, speaker_guess, text, sfx}
"""
import argparse
import glob
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from kibo_common import ANALYSIS_DIR  # noqa: E402

YT = os.path.expanduser("~/.monkos/go-commentary-yt/answers")
D = os.path.join(ANALYSIS_DIR, "commentary_v0", "refine")


def videos():
    return sorted({f.split(os.sep)[-3] for f in glob.glob(os.path.join(YT, "*", "frames_*", "board_states.json"))})


def scenes(vid):
    out, seen = [], set()
    for f in glob.glob(os.path.join(YT, vid, "flash_*", "scenes_board.json")):
        for x in json.load(open(f, encoding="utf-8")):
            if not x.get("t_abs"):
                continue
            key = (int(x["t_abs"][0]), (x.get("line") or "")[:20])
            if key in seen:
                continue
            seen.add(key)
            out.append(x)
    return sorted(out, key=lambda x: x["t_abs"][0])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prefix", default="f1")
    a = ap.parse_args()
    stat = defaultdict(int)
    for vid in videos():
        rows = []
        for k, x in enumerate(scenes(vid)):
            sp = x.get("speaker") or "기타"
            rows.append({"i": k, "seg": k, "t": float(x["t_abs"][0]), "t_end": float(x["t_abs"][1]),
                         "speaker_guess": sp, "text": (x.get("line") or "").strip(), "sfx": ["침묵"] if sp == "침묵" else []})
        with open(os.path.join(D, f"{a.prefix}_{vid}_in0.jsonl"), "w", encoding="utf-8") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        stat[vid] = len(rows)
    print(dict(stat), sum(stat.values()))


if __name__ == "__main__":
    main()
