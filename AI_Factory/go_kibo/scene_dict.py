#!/usr/bin/env python3
"""해설 장면 사전 v0 — 유튜브 해설 판독 9편: 해설 문장 ↔ 시각 ↔ 판 국면(돌 수·실전/참고도) ↔ 판 용어 꼬리표(검출기) ↔ 문장 용어·개념 꼬리표.

  python3 scene_dict.py
입력(레포 밖): ~/.monkos/go-commentary-yt/answers/{영상}/frames_{s0}/board_states.json · board_events_{s0}.json · answers/corrected.jsonl
              ~/.monkos/go-board/analysis/commentary_v0/terms/terms_v0.jsonl (build_terms.py)
출력: 레포 밖 commentary_v0/scene_dict_{ver}.jsonl(행 = 해설 구간) · 레포 reports/SCENE_DICT_{ver}.md(건수·일치율만, 대화록 원문 없음)
v1(기본, 11-07 15시): 대사 = 정제본(refine_split_flash.py → LLM 일꾼 f1) 중 keep·해설 화자만, 문장 용어·개념 = LLM 판단(문자열 일치는 대조 칸 said_det_str). `--ver v0`는 옛 방식.

판 수 검출: 연속 프레임(2초, board_events.smooth 다수결) 사이에 돌이 정확히 1개 새로 생기면 착수 1건(따낸 돌 사라짐 허용) → go_terms.detect(직전 판).
          board_events 창(해설자가 놓고 지운 변화도) 안이면 '참고도', 밖이면 '실전'.
대사: 판독 9편은 대화록 30편과 다른 영상 — 영상별 flash_*/scenes_board.json(Gemini 전사, 15초 장면·화자·대사·용어)의 해설 화자 장면.
짝: 장면 [시작−4초, 끝+4초] 안의 착수 꼬리표를 그 장면의 판 꼬리표로 본다.
일치: 문장이 검출 가능한 용어를 말했고 그 용어가 짝 지은 판 꼬리표에 있으면 일치.
엔진 사실(b18 손해·정해도)은 v0에서 붙이지 않았다 — COMPLETION 참조.
"""
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "..", "apps", "go-commentary-yt"))
from kibo_common import ANALYSIS_DIR  # noqa: E402
import go_terms as GT  # noqa: E402
from build_terms import search_keys, hit  # noqa: E402
import board_events as BE  # noqa: E402

YT = os.path.expanduser("~/.monkos/go-commentary-yt/answers")
OUT = os.path.join(ANALYSIS_DIR, "commentary_v0")
BEFORE, AFTER = 12, 4


def board_of(grid):
    return {(k % 19, k // 19): ch.lower().upper() for k, ch in enumerate(grid) if ch.lower() in "bw"}


def moves_of(st, s_off, windows):
    out = []
    for a, b in zip(st, st[1:]):
        pa, pb = board_of(a["grid"]), board_of(b["grid"])
        new = [(p, c) for p, c in pb.items() if pa.get(p) != c]
        if len(new) != 1:
            continue
        (p, c), = new
        gone = [q for q in pa if q not in pb]
        if any(pa[q] == c for q in gone):  # 내 돌이 사라지면 판독 잡음
            continue
        prev = {q: cc for q, cc in pa.items() if q != p}
        t = b["t"] + s_off
        tags = GT.detect(prev, c, p, [])
        mode = "참고도" if any(w0 <= t <= w1 for w0, w1 in windows) else "실전"
        out.append({"t": t, "color": c, "move": f"{GT.COLS[p[0]]}{19 - p[1]}", "tags": tags, "mode": mode, "stones": len(pb)})
    return out


def refined_segs(prefix="f1"):
    """판독 9편 정제본(refine_split_flash.py + LLM 일꾼) — keep·해설 화자만. 문장 용어·개념은 LLM 판단을 쓴다."""
    D = os.path.join(OUT, "refine")
    segs = defaultdict(list)
    for fin in sorted(glob.glob(os.path.join(D, f"{prefix}_*_in0.jsonl"))):
        vid = os.path.basename(fin)[len(prefix) + 1:-len("_in0.jsonl")]
        fout = fin.replace("_in0", "_out0")
        if not os.path.exists(fout):
            raise SystemExit(f"❌ scene_dict: 정제 출력 없음 {fout}")
        outs = {d["i"]: d for d in (json.loads(x) for x in open(fout, encoding="utf-8") if x.strip())}
        for x in open(fin, encoding="utf-8"):
            u = json.loads(x)
            o = outs.get(u["i"]) or {}
            if not o.get("keep") or o.get("role") != "해설":
                continue
            segs[vid].append({"id": vid, "i": u["i"], "t_start": u["t"], "t_end": u.get("t_end", u["t"] + 15), "text": u["text"],
                              "gemini_terms": [], "move_no": None, "label": o.get("label"), "board_dep": o.get("board_dep"),
                              "llm_terms": [t for t in o.get("terms") or [] if isinstance(t, str)],
                              "llm_concepts": [t for t in o.get("concepts") or [] if isinstance(t, str)]})
    return segs


def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--ver", default="v1", choices=["v0", "v1"])
    VER = ap.parse_args().ver
    terms = [json.loads(x) for x in open(os.path.join(OUT, "terms", "terms_v0.jsonl"), encoding="utf-8")]
    tech = [t for t in terms if t["cat"] in range(1, 9)]
    keys = [(t, search_keys(t["term"])) for t in tech]
    # 판독 9편의 대사 = 영상별 flash_*/scenes_board.json(Gemini 전사 15초 장면 — 화자·대사·용어). 대화록 30편(corrected.jsonl)과는 다른 영상들이다.
    segs = defaultdict(list)
    for fsb in ([] if VER == "v1" else sorted(glob.glob(os.path.join(YT, "*", "flash_*", "scenes_board.json")))):
        vid = fsb.split(os.sep)[-3]
        for x in json.load(open(fsb, encoding="utf-8")):
            if x.get("speaker") == "해설" and x.get("line") and x.get("t_abs"):
                segs[vid].append({"id": vid, "commentator": None, "t_start": x["t_abs"][0], "t_end": x["t_abs"][1], "text": x["line"],
                                  "gemini_terms": x.get("terms") or [], "move_no": x.get("move_no")})
    if VER == "v1":
        segs = refined_segs()
    det_of = {}
    for t in tech:
        if t.get("det_tag"):
            det_of[t["term"]] = det_of[t["det_tag"]] = t["det_tag"]
    rows, per = [], []
    for f in sorted(glob.glob(os.path.join(YT, "*", "frames_*", "board_states.json"))):
        vid = f.split(os.sep)[-3]
        s0 = int(re.search(r"frames_(\d+)", f).group(1))
        raw = json.load(open(f, encoding="utf-8"))
        st = BE.smooth(raw)
        ev = json.load(open(os.path.join(YT, vid, f"board_events_{s0}.json"), encoding="utf-8"))
        tmax = max(s["t"] for s in raw)
        ev_starts = [e["start"] for e in (ev.get("events") or [])]
        # 판 상태 t가 창 상대 시각이면 s0를 더한다(사건 시각은 절대 시각)
        s_off = s0 if (ev_starts and min(ev_starts) > tmax) or (s0 > tmax) else 0
        windows = [(e["start"], e["end"]) for e in (ev.get("events") or [])]
        mv = moves_of(st, s_off, windows)
        lo, hi = s0, s0 + tmax + 2
        n_seg = n_pair = n_says = n_match = 0
        for d in segs.get(vid, []):
            if not (lo <= d["t_start"] <= hi):
                continue
            n_seg += 1
            ns = d["text"].replace(" ", "")
            said_str = [t["det_tag"] for t, k in keys if t.get("det_tag") and hit(k, ns)]  # v0 방식(문자열 일치) — 대조용
            if VER == "v1":
                said = d["llm_terms"]
                concept = d["llm_concepts"]
            else:
                said = [t["term"] for t, k in keys if hit(k, ns)]
                concept = [t["term"] for t, k in keys if t["cat"] == 8 and hit(k, ns)]
            near = [m for m in mv if d["t_start"] - AFTER <= m["t"] <= d["t_end"] + AFTER]  # 장면(15초) 안 착수 + 앞뒤 4초
            btags = sorted({tg for m in near for tg in m["tags"]})
            if VER == "v1":
                said_det = sorted({det_of.get(x) or next((t["det_tag"] for t, k in keys if t.get("det_tag") and hit(k, x.replace(" ", ""))), None) for x in said} - {None})
            else:
                said_det = said_str
            match = [x for x in said_det if x in btags]
            n_pair += bool(near)
            n_says += bool(said_det and near)
            n_match += bool(match)
            frame = max((s for s in st if s["t"] + s_off <= d["t_start"]), key=lambda s: s["t"], default=None)
            rows.append({"id": vid, "t": d["t_start"], "t_end": d["t_end"], "text": d["text"], "gemini_terms": d["gemini_terms"], "move_no": d["move_no"],
                         "stones": len(board_of(frame["grid"])) if frame else None,
                         "mode": "참고도" if any(w0 <= d["t_start"] <= w1 for w0, w1 in windows) else "실전",
                         "board_moves": [{k: m[k] for k in ("t", "color", "move", "tags", "mode")} for m in near],
                         "board_tags": btags, "text_terms": said, "concepts": concept, "said_detectable": said_det, "match": match,
                         **({"i": d["i"], "label": d["label"], "board_dep": d["board_dep"], "said_det_str": said_str} if VER == "v1" else {})})
        per.append({"id": vid, "window": [lo, hi], "moves": len(mv),
                    "moves_var": sum(m["mode"] == "참고도" for m in mv), "segs": n_seg, "paired": n_pair, "says_det": n_says, "match": n_match,
                    "tagcount": Counter(tg for m in mv for tg in m["tags"]).most_common(8)})
    with open(os.path.join(OUT, f"scene_dict_{VER}.jsonl"), "w", encoding="utf-8") as fo:
        for r in rows:
            fo.write(json.dumps(r, ensure_ascii=False) + "\n")
    report(rows, per, VER)
    print(json.dumps(per, ensure_ascii=False)[:1500])


def report(rows, per, VER="v0"):
    import datetime as dt
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    T = lambda xs: sum(xs)  # noqa: E731
    L = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/scene_dict.py\n---\n",
         f"# 해설 장면 사전 {VER} — 판독 9편\n",
         f"> 생성 {now} KST. 행 = 해설 화자 장면(판독 9편 — 영상별 Gemini 전사 15초 장면" + (", **정제본**: LLM 일꾼 f1이 남김·해설 화자로 판단한 것만, 문장 용어·개념도 LLM 판단" if VER == "v1" else "") + f"). 대사 원문·행 데이터는 레포 밖 `~/.monkos/go-board/analysis/commentary_v0/scene_dict_{VER}.jsonl`.",
         f"> 판 꼬리표 = 판독 프레임(2초) 사이 돌 1개 증가를 착수로 보고 `go_terms.detect`. 짝 = 장면 시작 앞 {AFTER}초~끝 뒤 {AFTER}초 착수. 엔진 사실은 v0 미부착.\n",
         "## 1. 영상별\n", "| 영상 | 창(초) | 판 착수 검출 | 그중 참고도 | 해설 구간 | 착수와 짝 | 검출 용어 언급+짝 | 말한 용어 = 판 꼬리표 | 판 꼬리표 상위 |",
         "|---|---|---|---|---|---|---|---|---|"]
    for p in per:
        top = " · ".join(f"{k} {v}" for k, v in p["tagcount"][:5])
        L.append(f"| {p['id'][:4]}… | {p['window'][0]}–{p['window'][1]} | {p['moves']} | {p['moves_var']} | {p['segs']} | {p['paired']} | {p['says_det']} | {p['match']} | {top} |")
    L.append(f"| 계 | | {T(p['moves'] for p in per)} | {T(p['moves_var'] for p in per)} | {T(p['segs'] for p in per)} | {T(p['paired'] for p in per)} | {T(p['says_det'] for p in per)} | {T(p['match'] for p in per)} | |")
    said = Counter(t for r in rows for t in r["said_detectable"])
    matched = Counter(t for r in rows for t in r["match"])
    L += ["\n## 2. 해설에서 말한 검출 용어 vs 판 꼬리표 일치\n", "| 용어(꼬리표) | 말한 구간 | 판 꼬리표와 일치 | 일치율 |", "|---|---|---|---|"]
    for t, n in said.most_common(20):
        L.append(f"| {t} | {n} | {matched[t]} | {matched[t] / n * 100:.0f}% |")
    con = Counter(c for r in rows for c in r["concepts"])
    L += ["\n## 3. 개념 언어 출현(분류 8, 문장 쪽)\n", "| 개념 | 구간 |", "|---|---|"] + [f"| {k} | {v} |" for k, v in con.most_common(20)]
    L += ["\n## 4. 한계\n",
          "- 판독은 프레임 2초 간격 — 2초 안에 두 수 이상 놓이면 착수로 잡지 않는다(검출 누락). 판독 오류 돌은 smooth 다수결로만 거른다.",
          "- 일치율은 '말한 용어가 같은 15초 장면 안 착수 꼬리표에 있다'는 느슨한 짝이다. 대사는 Gemini 전사(장면 단위 요약 가능성)라 원문 그대로가 아닐 수 있다.",
          "- 개념 '선수'에는 '선수(選手, 대국자)'가 섞여 있다 — 문자열 일치의 한계, 정제·분류 단계(LLM)에서 가른다.",
          "- 엔진 사실(손해·정해도)은 붙이지 않았다: 판독 판에는 두는 차례·패 정보가 없고, iMac 엔진은 실사용 바둑 서버와 GPU를 같이 쓴다."]
    if VER == "v1":
        lab = Counter(r["label"] for r in rows)
        bd = Counter(bool(r["board_dep"]) for r in rows)
        str_n = sum(bool(r["said_det_str"]) for r in rows)
        str_m = sum(bool(set(r["said_det_str"]) & set(r["board_tags"])) for r in rows)
        llm_n = sum(bool(r["said_detectable"]) for r in rows)
        llm_m = sum(bool(r["match"]) for r in rows)
        only_str = Counter(t for r in rows for t in set(r["said_det_str"]) - set(r["said_detectable"]))
        only_llm = Counter(t for r in rows for t in set(r["said_detectable"]) - set(r["said_det_str"]))
        L[L.index("\n## 4. 한계\n"):L.index("\n## 4. 한계\n")] = [
            "\n## 4. 정제본 효과(v1) — 같은 장면, 문자열 일치 vs LLM 용어\n",
            "| 항목 | 문자열 일치(v0 방식) | LLM 판단(v1) |", "|---|---|---|",
            f"| 검출 용어를 말한 장면 | {str_n} | {llm_n} |", f"| 그중 판 꼬리표와 일치 | {str_m} | {llm_m} |",
            f"| 일치율 | {str_m / max(str_n, 1) * 100:.0f}% | {llm_m / max(llm_n, 1) * 100:.0f}% |",
            "- 문자열만 잡은 꼬리표(오탐 후보): " + (", ".join(f"{k} {v}" for k, v in only_str.most_common(10)) or "-"),
            "- LLM만 잡은 꼬리표(활용형·표기 변이): " + (", ".join(f"{k} {v}" for k, v in only_llm.most_common(10)) or "-"),
            "- 장면 라벨: " + " · ".join(f"{k} {v}" for k, v in lab.most_common()) + f" · 판 의존 {bd[True]} / 판 없이 섬 {bd[False]}"]
        L = [x.replace("## 4. 한계", "## 5. 한계") for x in L]
    open(os.path.join(HERE, "reports", f"SCENE_DICT_{VER}.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")


if __name__ == "__main__":
    main()
