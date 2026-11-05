#!/usr/bin/env python3
"""로컬 판 판독 vs Pro board_draw(대조군 3조각) 일치율 (PF_GO, 11-06 B안 3항, 무료)
  board_vs_pro.py   → 표 출력 + answers/board_vs_pro.json
지표(Pro 장면 15초 단위):
  탐지  — Pro board_draw 있음/없음 × 로컬 사건·표시 있음/없음
  영역  — 둘 다 있는 장면에서 Pro 글의 귀·변 이름이 로컬 영역과 같은가
  좌표  — Pro가 적은 좌표(board_draw·term_context.where)가 로컬 돌·표시 좌표에 있는가(정확 / ±1칸)
  순서  — Pro 글의 흑·백 순서 vs 로컬 놓은 순서(색열 SequenceMatcher 비율)
"""
import json, re, sys
from difflib import SequenceMatcher
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import board_events as be

B = be.B
PRO = [("xNABw3oHYXA", 1980, 1380), ("1OtxBf-EQJ8", 1200, 600), ("ZmmVvjBemPQ", 5040, 4440)]  # (영상, Pro 조각 시작, 판독 창 시작)
REG = r"(좌상귀|우상귀|좌하귀|우하귀|상변|하변|좌변|우변|중앙)"
CO = r"\b([A-HJ-T])(1[0-9]|[1-9])\b"
COL = be.COL


def colors(txt):
    seq = []
    for m in re.finditer(r"(흑|백)(?:돌)?\s*(\d+)\s*개|(흑|백)", txt or ""):
        if m.group(1):
            seq += [m.group(1)] * min(int(m.group(2)), 20)
        else:
            seq.append(m.group(3))
    return seq


def near(a, b):
    return abs(COL.index(a[0]) - COL.index(b[0])) <= 1 and abs(int(a[1:]) - int(b[1:])) <= 1


tot = {"both": 0, "pro_only": 0, "local_only": 0, "neither": 0, "reg_hit": 0, "reg_n": 0, "co_exact": 0, "co_near": 0, "co_n": 0, "all_n": 0, "all_hit": 0, "col_n": 0, "col_hit": 0, "ord": [], "per": {}}
for vid, ps, ws in PRO:
    pj = json.loads((B / vid / f"pro_{ps}" / "gemini_full.json").read_text())
    evf = B / vid / f"board_events_{ws}.json"
    if not evf.exists():
        print("판독 없음", vid); continue
    ev = json.loads(evf.read_text())
    states = be.smooth(json.loads((B / vid / f"frames_{ws}" / "board_states.json").read_text()))
    per = {"both": 0, "pro_only": 0, "local_only": 0, "neither": 0}
    for s, (a, b) in zip(pj["scenes"], be.scene_times(pj)):
        b = max(b, a + 1)
        pro_txt = s.get("board_draw")
        evs = [e for e in ev["events"] if not (e["end"] <= a or e["start"] >= b)]
        mks = [m for m in ev["marks"] if not (m["end"] <= a or m["start"] >= b)]
        loc = bool(evs or mks)
        k = "both" if pro_txt and loc else "pro_only" if pro_txt else "local_only" if loc else "neither"
        per[k] += 1; tot[k] += 1
        if not (pro_txt and loc):
            continue
        pr = set(re.findall(REG, pro_txt))
        lr = {r for e in evs for r in e["regions"]} | {r for m in mks for r in m["regions"]}  # 돌 하나하나의 귀·변
        if pr:
            tot["reg_n"] += 1; tot["reg_hit"] += bool(pr & lr)
        wh = " ".join([pro_txt] + [str(t.get("where") or "") for t in (s.get("term_context") or [])])
        pco = {f"{c}{n}" for c, n in re.findall(CO, wh)}
        lco = {x[1:] for e in evs for stp in e["seq"] for x in stp} | {p for m in mks for p in m["pts"]}
        for c in pco:
            tot["co_n"] += 1; tot["co_exact"] += c in lco; tot["co_near"] += any(near(c, l) for l in lco)
        pseq = colors(pro_txt)
        lseq = [x[0] for e in evs for stp in e["seq"] for x in stp]
        if len(pseq) >= 2 and lseq:
            tot["ord"].append(SequenceMatcher(None, pseq, lseq).ratio())
    # 좌표·색 — Pro가 적은 좌표(장면 전체, board_draw·where)를 그 장면 시각 판 위 '모든 돌'(실전+변화도)과 대조. 11-06 프레임 육안 확인: Pro가 Q4·O3 좌표는 맞히고 색은 반대로 적음
    for s, (a, b) in zip(pj["scenes"], be.scene_times(pj)):
        b = max(b, a + 1)
        wh = " ".join([s.get("board_draw") or ""] + [str(t.get("where") or "") for t in (s.get("term_context") or [])])
        board = {}
        for x in states:
            if a - ws <= x["t"] < b - ws:
                for k, ch in enumerate(x["grid"]):
                    if ch != ".":
                        board.setdefault(be.coord(k), set()).add("흑" if ch.lower() == "b" else "백")
        if not board:
            continue
        for m in re.finditer(r"(흑|백)?(?:돌)?[^A-Z흑백]{0,8}?\b([A-HJ-T](?:1[0-9]|[1-9]))\b", wh):
            c, col = m.group(2), m.group(1)
            tot["all_n"] += 1
            tot["all_hit"] += c in board
            if col and c in board:
                tot["col_n"] += 1; tot["col_hit"] += col in board[c]
    tot["per"][vid] = per
n = sum(tot[k] for k in ("both", "pro_only", "local_only", "neither"))
f = lambda x, y: f"{x}/{y} ({x / y:.0%})" if y else "-"
print("| 영상(Pro 조각) | 둘 다 | Pro만 | 로컬만 | 둘 다 없음 |\n|---|---|---|---|---|")
for v, p in tot["per"].items():
    print(f"| {v} | {p['both']} | {p['pro_only']} | {p['local_only']} | {p['neither']} |")
print(f"| 합 {n}장면 | {tot['both']} | {tot['pro_only']} | {tot['local_only']} | {tot['neither']} |")
print(f"\n- 탐지 일치(둘 다+둘 다 없음): {f(tot['both'] + tot['neither'], n)} · Pro 있는 장면 중 로컬도 잡음: {f(tot['both'], tot['both'] + tot['pro_only'])}")
print(f"- 영역 일치(Pro 글에 귀·변 이름 있는 장면): {f(tot['reg_hit'], tot['reg_n'])}")
print(f"- 변화도·표시 돌 좌표 일치(Pro 좌표 {tot['co_n']}개): 정확 {f(tot['co_exact'], tot['co_n'])} · ±1칸 {f(tot['co_near'], tot['co_n'])}")
print(f"- Pro 좌표가 그 시각 판 위 돌 자리인가(실전+변화도, 언급 {tot['all_n']}회): {f(tot['all_hit'], tot['all_n'])} · 그중 Pro가 적은 색이 맞음: {f(tot['col_hit'], tot['col_n'])}")
o = tot["ord"]
print(f"- 수순 순서(흑백 색열 유사도, Pro 2수↑ 장면 {len(o)}): 평균 {sum(o) / len(o):.0%}" if o else "- 수순 순서: 대조 가능 장면 없음")
(B / "board_vs_pro.json").write_text(json.dumps(tot, ensure_ascii=False, indent=1))
