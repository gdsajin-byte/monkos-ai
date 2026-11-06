#!/usr/bin/env python3
"""정해도·실패도 시범 — 실수 사전 원자료에서 장면을 골라 SGF 분기 + 판 그림(SVG) + 해설 초안 묶음 문서를 만든다.

  python3 diagrams.py [--n 10] [--plan 2,5,3]

정의 (ORDER_20261107 막내1, 작가님 11-06 21:39 '정해도와 실패도'):
  정해도 = 착수 직전 국면(turn t)의 최선 수 PV — 2단계(400v) 응답.
  실패도 = 실전 수(①) + 착수 직후 국면(turn t+1)의 상대 최선 PV — 2단계(400v) 응답.
  차이   = 두 국면 평가의 집 차·승률 차(작가님 기준) = moves_full.jsonl 의 loss·wr_loss (400v 값).
입력 (레포 밖): $GO_ANALYSIS_DIR/mistakes_v0/{queries_full.jsonl, queries_full.meta.jsonl, moves_full.jsonl}
               $GO_ANALYSIS_DIR/mistakes_v1/out2/{대국id}.jsonl
출력: $GO_ANALYSIS_DIR/commentary_v0/  sNN.sgf · sNN_correct.svg · sNN_fail.svg · scenes.json   (기보 원문 — 레포 밖)
      AI_Factory/go_kibo/reports/DIAGRAMS_v0.html (묶음 문서, 휴대폰용) · DIAGRAMS_v0.md (선정 기준·표·해설 초안)
대국은 G번호(MISTAKES_v1과 같은 순번)만. 아이디·닉네임은 어디에도 쓰지 않는다.
"""
import argparse
import datetime as dt
import html
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "..", "apps", "go-commentary-pilot"))
from kibo_common import ANALYSIS_DIR  # noqa: E402
from board import Board, gtp_to_xy, region, N, COLS  # noqa: E402

V0 = os.path.join(ANALYSIS_DIR, "mistakes_v0")
OUT2 = os.path.join(ANALYSIS_DIR, "mistakes_v1", "out2")
DST = os.path.join(ANALYSIS_DIR, "commentary_v0")
REPORTS = os.path.join(HERE, "reports")
KO = {"B": "흑", "W": "백"}
PV_MAX = 10          # 그림·SGF에 싣는 수순 상한
ERAS = ["2004-08", "2009-14", "2015-20", "2021-26"]

# 선정 필터 — '이미 승부 난 판의 막판' 제외 + 400v 큰 실수 유지분
MIN_LOSS = 3.0       # 400v 손해 ≥ 3집 (실수 사전 '큰 실수')
MIN_WR_LOSS = 0.12   # 승률 손해 ≥ 12%p
WR_BEFORE = (0.30, 0.90)  # 착수 직전 작가님 승률 — 이 밖이면 이미 기운 판
MIN_PV = 6           # 정해도·실패도 각 최소 수순(엔진 PV 원본 기준)
LOCAL_MIN, TENUKI = 1, 5  # 국지 수순 자르기: 앞선 수순 모두와 체비셰프 거리 > 5 인 수(손빼기)에서 끊는다


def opp(c):
    return "W" if c == "B" else "B"


def load():
    meta = [json.loads(x) for x in open(os.path.join(V0, "queries_full.meta.jsonl"), encoding="utf-8")]
    gidx = {m["id"]: f"G{i + 1:02d}" for i, m in enumerate(meta)}  # analyze_mistakes.write_report 와 같은 순번
    meta = {m["id"]: m for m in meta}
    rows = []
    for x in open(os.path.join(V0, "moves_full.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        if d["who"] == "me":
            rows.append(d)
    return meta, gidx, rows


def decisive_keys(meta, rows):
    """진 판에서 작가님 승률 손해 최대 수 = 결정 장면(decisive_scenes.scenes_of ① 과 같은 기준, 작가님 수 한정)."""
    by = defaultdict(list)
    for x in rows:
        by[x["id"]].append(x)
    out = set()
    for gid, rs in by.items():
        if meta[gid]["result"] == "L":
            m = max(rs, key=lambda x: x["wr_loss"])
            out.add((gid, m["move_no"]))
    return out


_resp_cache = {}


def resp2(gid):
    if gid not in _resp_cache:
        r = {}
        p = os.path.join(OUT2, f"{gid}.jsonl")
        if os.path.exists(p):
            for line in open(p, encoding="utf-8", errors="replace"):
                line = line.strip()
                if not line.startswith("{"):
                    continue
                d = json.loads(line)
                if "error" in d or "warning" in d or d.get("isDuringSearch"):
                    continue
                r[d["turnNumber"]] = d
        _resp_cache[gid] = r
    return _resp_cache[gid]


def best_pv(a):
    mis = sorted(a.get("moveInfos") or [], key=lambda mi: mi["order"])
    return (mis[0]["pv"], mis[0]) if mis else ([], None)


def local_cut(seq, anchor=()):
    """PV가 장면을 떠나는 첫 수(손빼기) 직전까지. anchor = 장면 기준 좌표."""
    pts = [p for p in anchor if p]
    out = []
    for m in seq:
        p = gtp_to_xy(m)
        if len(out) >= LOCAL_MIN and pts and min(max(abs(p[0] - q[0]), abs(p[1] - q[1])) for q in pts) > TENUKI:
            break
        out.append(m)
        pts.append(p)
    return out


def candidates(meta, rows, dec):
    out = []
    for x in rows:
        if not x.get("stage2") or x["loss"] < MIN_LOSS or x["wr_loss"] < MIN_WR_LOSS:
            continue
        if not (WR_BEFORE[0] <= x["wr_before"] <= WR_BEFORE[1]):
            continue
        if x["move"].lower() == "pass" or x["is_best"]:
            continue
        t = x["move_no"] - 1
        r = resp2(x["id"])
        if t not in r or t + 1 not in r:
            continue
        pv0, _ = best_pv(r[t])
        pv1, _ = best_pv(r[t + 1])
        if len(pv0) < MIN_PV or len(pv1) < MIN_PV - 1 or "pass" in [m.lower() for m in pv0[:PV_MAX] + pv1[:PV_MAX - 1]]:
            continue
        # 실패도: 실전 수는 늘 ①, 응징 수순은 상대 첫 응수 자리 기준으로 국지만(실전 수가 엉뚱한 곳이어도 응징 장면을 따른다)
        fail = [x["move"]] + local_cut(pv1[:PV_MAX - 1])
        corr = local_cut(pv0[:PV_MAX])
        out.append(dict(x, decisive=(x["id"], x["move_no"]) in dec, pv_correct=corr, pv_fail=fail,
                        pv_correct_full=len(pv0), pv_fail_full=len(pv1) + 1))
    return out


def pick(cands, plan):
    """단계 할당(포석·중반·끝내기) 안에서 시대 순환·대국 중복 금지. 점수 = 승률 손해 (결정 장면 +0.15 우대)."""
    used, chosen = set(), []
    for ph, k in zip(("포석", "중반", "끝내기"), plan):
        pool = sorted([c for c in cands if c["phase"] == ph], key=lambda c: -(c["wr_loss"] + (0.15 if c["decisive"] else 0)))
        era_i, got, guard = 0, [], 0
        while len(got) < k and guard < 40:
            era = ERAS[(len(chosen) + era_i) % len(ERAS)]
            c = next((c for c in pool if c["era"] == era and c["id"] not in used), None)
            if c:
                got.append(c)
                used.add(c["id"])
                chosen.append(c)
            else:
                era_i += 1
            guard += 1
    return chosen


# ---------------- 수순 재현 ----------------

def play_seq(board, start, seq):
    """수순을 두고 (최종 판, 번호표 {xy: 번호}, 겹친 자리 메모, 따냄 메모) 반환."""
    b, c = board.copy(), start
    num, notes, caps = {}, [], []
    for k, m in enumerate(seq, 1):
        p = gtp_to_xy(m)
        if p in num or p in b.s:
            if p in num:
                notes.append(f"{k} = {num[p]} 자리")
        got = b.play(c, p)
        if got:
            caps.append((k, c, m, len(got)))
            for q in got:
                num.pop(q, None)
        num[p] = k
        c = opp(c)
    return b, num, notes, caps


# ---------------- SVG ----------------

def view_box(points):
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    x0, x1, y0, y1 = min(xs) - 3, max(xs) + 3, min(ys) - 3, max(ys) + 3
    # 최소 10칸, 가장자리 근처(2칸 이내)는 판 끝까지 붙인다
    while x1 - x0 < 9:
        x0, x1 = x0 - 1, x1 + 1
    while y1 - y0 < 9:
        y0, y1 = y0 - 1, y1 + 1
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(N - 1, x1), min(N - 1, y1)
    if x0 <= 2:
        x0 = 0
    if y0 <= 2:
        y0 = 0
    if x1 >= N - 3:
        x1 = N - 1
    if y1 >= N - 3:
        y1 = N - 1
    # 판 끝에 붙어 좁아졌으면 반대쪽으로 늘려 최소 10줄 유지
    while x1 - x0 < 9:
        x0, x1 = (x0, x1 + 1) if x0 == 0 else (x0 - 1, x1)
    while y1 - y0 < 9:
        y0, y1 = (y0, y1 + 1) if y0 == 0 else (y0 - 1, y1)
    if (x1 - x0) >= 14 and (y1 - y0) >= 14:
        return 0, N - 1, 0, N - 1
    return x0, x1, y0, y1


def svg(board_final, num, box, last_xy=None, accent_first=False, title=""):
    x0, x1, y0, y1 = box
    S, M = 30, 26  # 칸, 여백(좌표 글자)
    w, h = (x1 - x0) * S + 2 * M, (y1 - y0) * S + 2 * M
    X = lambda x: M + (x - x0) * S  # noqa: E731
    Y = lambda y: M + (y - y0) * S  # noqa: E731
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" class="bd" role="img" aria-label="{html.escape(title)}">',
         f'<rect width="{w}" height="{h}" fill="#dcb46a"/>']
    for x in range(x0, x1 + 1):
        ya, yb = Y(y0) - (S / 2 if y0 > 0 else 0), Y(y1) + (S / 2 if y1 < N - 1 else 0)
        sw = 1.6 if x in (0, N - 1) else 0.8
        o.append(f'<line x1="{X(x)}" y1="{ya}" x2="{X(x)}" y2="{yb}" stroke="#3a2a10" stroke-width="{sw}"/>')
        o.append(f'<text x="{X(x)}" y="{M - 12}" font-size="10" text-anchor="middle" fill="#3a2a10">{COLS[x]}</text>')
    for y in range(y0, y1 + 1):
        xa, xb = X(x0) - (S / 2 if x0 > 0 else 0), X(x1) + (S / 2 if x1 < N - 1 else 0)
        sw = 1.6 if y in (0, N - 1) else 0.8
        o.append(f'<line x1="{xa}" y1="{Y(y)}" x2="{xb}" y2="{Y(y)}" stroke="#3a2a10" stroke-width="{sw}"/>')
        o.append(f'<text x="{M - 14}" y="{Y(y) + 3.5}" font-size="10" text-anchor="middle" fill="#3a2a10">{N - y}</text>')
    for hx in (3, 9, 15):
        for hy in (3, 9, 15):
            if x0 <= hx <= x1 and y0 <= hy <= y1:
                o.append(f'<circle cx="{X(hx)}" cy="{Y(hy)}" r="2.6" fill="#3a2a10"/>')
    for (x, y), c in board_final.s.items():
        if not (x0 <= x <= x1 and y0 <= y <= y1):
            continue
        fill, stroke, tc = ("#111", "#000", "#fff") if c == "B" else ("#fafafa", "#555", "#111")
        o.append(f'<circle cx="{X(x)}" cy="{Y(y)}" r="{S * 0.47}" fill="{fill}" stroke="{stroke}" stroke-width="0.8"/>')
        k = num.get((x, y))
        if k is not None:
            col = "#d22" if (accent_first and k == 1) else tc
            o.append(f'<text x="{X(x)}" y="{Y(y) + 5}" font-size="{14 if k < 10 else 12}" font-weight="700" '
                     f'text-anchor="middle" fill="{col}">{k}</text>')
        elif last_xy == (x, y):
            o.append(f'<rect x="{X(x) - 4}" y="{Y(y) - 4}" width="8" height="8" fill="#d22"/>')
    o.append("</svg>")
    return "\n".join(o)


# ---------------- SGF ----------------

def sgfc(m):
    x, y = gtp_to_xy(m)
    return "abcdefghijklmnopqrs"[x] + "abcdefghijklmnopqrs"[y]


def esc(s):
    return s.replace("\\", "\\\\").replace("]", "\\]")


def make_sgf(moves, t, komi, sc):
    me = sc["my_color"]
    head = (f"(;GM[1]FF[4]CA[UTF-8]SZ[19]RU[Korean]KM[{komi}]PB[{'작가님' if me == 'B' else '상대'}]"
            f"PW[{'작가님' if me == 'W' else '상대'}]GN[{sc['g']} {sc['move_no']}수 정해도·실패도]"
            f"C[{esc(sc['g'] + ' — 실전 ' + str(t) + '수까지 + 분기 2개(정해도·실패도). 평가 KataGo b18 400v.')}]")
    body = "".join(f";{c}[{sgfc(m) if m.lower() != 'pass' else ''}]" for c, m in moves[:t])

    def branch(seq, first_c, label):
        out, c = [], first_c
        for k, m in enumerate(seq, 1):
            cm = f"{k}"
            if k == 1:
                cm = f"{label}\n{k}"
            out.append(f";{c}[{sgfc(m)}]C[{esc(cm)}]")
            c = opp(c)
        return "(" + "".join(out) + ")"

    c0 = moves[t][0]
    lab_ok = f"정해도: 최선 {sc['best']} — 실전보다 {sc['loss']:.1f}집·승률 {sc['wr_loss'] * 100:.0f}%p 좋음(작가님 기준)"
    lab_ng = f"실패도: 실전 {sc['move']} → 상대 최선 응수. 손해 {sc['loss']:.1f}집·승률 {sc['wr_loss'] * 100:.0f}%p"
    return head + body + branch(sc["pv_correct"], c0, lab_ok) + branch(sc["pv_fail"], c0, lab_ng) + ")\n"


# ---------------- 해설 초안(사실만) ----------------

def seq_text(start, seq, n=6):
    c, out = start, []
    for m in seq[:n]:
        out.append(f"{KO[c]} {m}")
        c = opp(c)
    return " → ".join(out)


def draft(sc):
    me = sc["my_color"]
    bxy, axy = gtp_to_xy(sc["best"]), gtp_to_xy(sc["move"])
    rb, ra = region(bxy), region(axy)
    s = []
    if rb == ra:
        s.append(f"최선은 같은 {rb}의 {sc['best']}, 실전은 {sc['move']}.")
    else:
        s.append(f"최선은 {rb} {sc['best']}인데 실전은 {ra} {sc['move']} — 급한 곳이 {rb}{'이었' if (ord(rb[-1]) - 0xAC00) % 28 else '였'}다.")
    capsc = [f"{k}수째 {KO[c]} {m}로 {KO[opp(c)]} {n}점 따냄" for k, c, m, n in sc["caps_correct"]]
    capsf = [f"{k}수째 {KO[c]} {m}로 {KO[opp(c)]} {n}점 따냄" for k, c, m, n in sc["caps_fail"]]
    if capsf:
        s.append("실패도에서 " + ", ".join(capsf) + ".")
    if capsc:
        s.append("정해도에서는 " + ", ".join(capsc) + ".")
    if len(sc["pv_fail"]) > 1:
        rf = region(gtp_to_xy(sc["pv_fail"][1]))
        s.append(f"상대 응징 첫 수는 {rf} {sc['pv_fail'][1]}.")
    if len(sc["pv_correct"]) == 1:
        s.append("정해도는 한 수로 정리되고 엔진의 다음 수는 다른 곳이다.")
    s.append(f"차이 {sc['loss']:.1f}집 · 승률 {sc['wr_before'] * 100:.0f}% → {sc['wr_after'] * 100:.0f}% ({KO[me]} 작가님 기준).")
    return " ".join(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", default="2,5,3")
    a = ap.parse_args()
    plan = [int(v) for v in a.plan.split(",")]
    os.makedirs(DST, exist_ok=True)
    meta, gidx, rows = load()
    dec = decisive_keys(meta, rows)
    cands = candidates(meta, rows, dec)
    print(f"후보 {len(cands)} (400v 유지·손해≥{MIN_LOSS}집·승률≥{MIN_WR_LOSS * 100:.0f}%p·직전 승률 {WR_BEFORE})", file=sys.stderr)
    by_phase = defaultdict(int)
    for c in cands:
        by_phase[c["phase"]] += 1
    chosen = pick(cands, plan)
    q = {}
    for x in open(os.path.join(V0, "queries_full.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        if d["id"] in {c["id"] for c in chosen}:
            q[d["id"]] = d
    scenes = []
    for i, sc in enumerate(chosen, 1):
        gid, t = sc["id"], sc["move_no"] - 1
        moves, komi = q[gid]["moves"], q[gid]["komi"]
        sc.update(g=gidx[gid], my_color=meta[gid]["my_color"], sid=f"s{i:02d}")
        b = Board()
        for c, m in moves[:t]:
            b.play(c, gtp_to_xy(m) if m.lower() != "pass" else None)
        c0 = moves[t][0]
        bc, nc, notec, capc = play_seq(b, c0, sc["pv_correct"])
        bf, nf, notef, capf = play_seq(b, c0, sc["pv_fail"])
        sc.update(caps_correct=capc, caps_fail=capf, notes_correct=notec, notes_fail=notef)
        pts = [gtp_to_xy(m) for m in sc["pv_correct"] + sc["pv_fail"]]
        box = view_box(pts)
        last = gtp_to_xy(moves[t - 1][1]) if t > 0 and moves[t - 1][1].lower() != "pass" else None
        sc["svg_correct"] = svg(bc, nc, box, last, False, f"{sc['g']} {sc['move_no']}수 정해도")
        sc["svg_fail"] = svg(bf, nf, box, last, True, f"{sc['g']} {sc['move_no']}수 실패도")
        sc["text"] = draft(sc)
        sc["seq_correct"] = seq_text(c0, sc["pv_correct"], PV_MAX)
        sc["seq_fail"] = seq_text(c0, sc["pv_fail"], PV_MAX)
        open(os.path.join(DST, f"{sc['sid']}.sgf"), "w", encoding="utf-8").write(make_sgf(moves, t, komi, sc))
        open(os.path.join(DST, f"{sc['sid']}_correct.svg"), "w", encoding="utf-8").write(sc["svg_correct"])
        open(os.path.join(DST, f"{sc['sid']}_fail.svg"), "w", encoding="utf-8").write(sc["svg_fail"])
        scenes.append(sc)
    keep = ["sid", "g", "era", "result", "move_no", "phase", "my_color", "move", "best", "loss", "wr_loss", "wr_before", "wr_after",
            "lead_before", "lead_after", "decisive", "quad", "pv_correct", "pv_fail", "caps_correct", "caps_fail",
            "notes_correct", "notes_fail", "text"]
    json.dump([{k: s[k] for k in keep} for s in scenes], open(os.path.join(DST, "scenes.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    write_docs(scenes, len(cands), dict(by_phase), plan)
    print(f"✅ {len(scenes)}장면 → {DST}", file=sys.stderr)


def write_docs(scenes, n_cand, by_phase, plan):
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    crit = [
        ("자료", "실수 사전 v1 2000국 · 작가님 착수 중 2단계(400v) 재평가분"),
        ("큰 실수", f"400v 손해 ≥ {MIN_LOSS:.0f}집 그리고 승률 손해 ≥ {MIN_WR_LOSS * 100:.0f}%p"),
        ("승부 난 판 제외", f"착수 직전 작가님 승률 {WR_BEFORE[0] * 100:.0f}~{WR_BEFORE[1] * 100:.0f}% 안만 (이미 기운 판 막판 제외)"),
        ("수순 길이", f"엔진 PV 각 {MIN_PV}수 이상 · 패스 없음 · 그림은 최대 {PV_MAX}수, 장면을 떠나는 수(앞 수순 모두와 {TENUKI}칸 초과 — 손빼기)에서 끊음"),
        ("단계 배분", f"포석 {plan[0]} · 중반 {plan[1]} · 끝내기 {plan[2]} (포석 1–50·중반 51–150·끝내기 151+)"),
        ("시대 배분", "2004-08 → 2009-14 → 2015-20 → 2021-26 순환, 한 대국 1장면"),
        ("순위", "승률 손해 큰 순, 진 판의 결정 장면(그 판 작가님 최대 승률 손해 수) +15%p 우대"),
        ("후보 수", f"{n_cand} (단계별 {by_phase})"),
    ]
    rows = [f"| {s['sid']} | {s['g']} | {s['era']} | {'승' if s['result'] == 'W' else '패'} | {s['move_no']} | {s['phase']} | "
            f"{KO[s['my_color']]} {s['move']} | {s['best']} | {s['loss']:.1f} | {s['wr_loss'] * 100:.1f} | "
            f"{s['wr_before'] * 100:.0f}→{s['wr_after'] * 100:.0f}% | {'결정 장면' if s['decisive'] else ''} |" for s in scenes]
    md = [f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/diagrams.py\n---\n",
          "# 정해도·실패도 시범 v0 — 10장면\n",
          f"> 생성 {now} KST · 엔진 KataGo b18 400v(실수 사전 v1 2단계 응답 재사용, 새 엔진 실행 없음) · 대국은 G번호(MISTAKES_v1 순번)·수순만.",
          "> 정해도 = 착수 직전 국면의 최선 수순 · 실패도 = 실전 수(①, 빨간 번호) + 상대 최선 응징 수순 · 차이 = 두 국면 평가 차(작가님 기준).",
          "> **그림 묶음(휴대폰용)**: [DIAGRAMS_v0.html](DIAGRAMS_v0.html) · SGF·SVG 원본 `~/.monkos/go-board/analysis/commentary_v0/`(레포 밖).\n",
          "## 1. 선정 기준\n", "| 항목 | 기준 |", "|---|---|"] + [f"| {k} | {v} |" for k, v in crit] + [
          "\n## 2. 장면 표\n",
          "| 장면 | 대국 | 시대 | 결과 | 수순 | 단계 | 실전 수 | 최선 수 | 손해(집) | 승률 손해(%p) | 승률 | 비고 |",
          "|---|---|---|---|---|---|---|---|---|---|---|---|"] + rows + ["\n## 3. 한 줄 해설 초안 (사실만 — 감수 칸 비움)\n"]
    for s in scenes:
        md += [f"### {s['sid']} · {s['g']} {s['move_no']}수 ({s['phase']}, {s['era']})\n",
               f"- 정해도: {s['seq_correct']}", f"- 실패도: {s['seq_fail']}",
               f"- 초안: {s['text']}", "- 감수: ", ""]
    md += ["## 4. 한계\n",
           "- 응징 수의 이름(끊음·붙임·치중 등)은 자동 판정하지 않았다 — 사실(좌표·영역·따냄·집·승률)만. 이름은 감수에서.",
           "- 정해도·실패도 수순은 엔진 1순위 PV(400v)라 뒤쪽 수일수록 신뢰가 낮다. 그림은 10수까지, 손빼기에서 끊어 국지 수순만.",
           "- 소유권 미저장 — '어느 쪽이 어디를 얻는가'는 영역 이름 수준. 집 위치 분해는 소유권 재분석(별건)."]
    open(os.path.join(REPORTS, "DIAGRAMS_v0.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")

    cards = []
    for s in scenes:
        notes = ""
        if s["notes_correct"] or s["notes_fail"]:
            notes = f"<p class='n'>{html.escape(' · '.join(['정해도 ' + x for x in s['notes_correct']] + ['실패도 ' + x for x in s['notes_fail']]))}</p>"
        cards.append(f"""<section class="card" id="{s['sid']}">
<h2>{s['sid'][1:]}. {s['g']} · {s['move_no']}수 <small>{s['phase']} · {s['era']} · {'승' if s['result'] == 'W' else '패'}국{' · 결정 장면' if s['decisive'] else ''}</small></h2>
<p class="k"><b>실전</b> {KO[s['my_color']]} {s['move']} &nbsp;<b>최선</b> {s['best']} &nbsp;<b>차이</b> {s['loss']:.1f}집 · 승률 {s['wr_before'] * 100:.0f}%→{s['wr_after'] * 100:.0f}% (−{s['wr_loss'] * 100:.0f}%p)</p>
<figure><figcaption>정해도</figcaption>{s['svg_correct']}<p class="seq">{html.escape(s['seq_correct'])}</p></figure>
<figure><figcaption>실패도 <span class="r">① = 실전 수</span></figcaption>{s['svg_fail']}<p class="seq">{html.escape(s['seq_fail'])}</p></figure>
{notes}<p class="t">{html.escape(s['text'])}</p>
<p class="rv">감수: ________</p>
</section>""")
    page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>정해도·실패도 시범</title>
<style>
:root{{--bg:#f6f1e7;--fg:#222;--mut:#666;--card:#fff;--acc:#b0361b}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#16130f;--fg:#eee;--mut:#aaa;--card:#24201a;--acc:#ff7a5c}}}}
:root[data-theme="dark"]{{--bg:#16130f;--fg:#eee;--mut:#aaa;--card:#24201a;--acc:#ff7a5c}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.55 -apple-system,"Apple SD Gothic Neo",sans-serif}}
main{{max-width:760px;margin:0 auto;padding:12px 16px 40px}}
h1{{font-size:20px;margin:8px 0}} .lead{{color:var(--mut);font-size:13px}}
.card{{background:var(--card);border-radius:12px;padding:12px 14px;margin:16px 0;box-shadow:0 1px 3px #0002}}
h2{{font-size:17px;margin:2px 0 6px}} h2 small{{color:var(--mut);font-weight:400;font-size:12px}}
figure{{margin:10px 0}} figcaption{{font-weight:700;margin-bottom:4px}} .r{{color:var(--acc);font-weight:400;font-size:12px}}
svg.bd{{width:100%;height:auto;max-width:560px;display:block;border-radius:6px}}
.seq{{font-size:12px;color:var(--mut);margin:4px 0}} .t{{margin:8px 0 4px}} .n{{font-size:12px;color:var(--mut)}}
.k{{font-size:13px}} .rv{{color:var(--mut);font-size:13px;border-top:1px dashed #8884;padding-top:6px}}
nav a{{display:inline-block;margin:2px 6px 2px 0;font-size:13px;color:var(--acc)}}
</style></head><body><main>
<h1>정해도 · 실패도 시범 10장면</h1>
<p class="lead">작가님 타이젬 기보 2000국 실수 사전(KataGo b18 400v)에서 고른 장면. 정해도 = 그 국면 최선 수순, 실패도 = 실전 수(빨간 ①) 뒤 상대의 응징 수순. 차이 = 작가님 기준 집·승률. 빨간 네모 = 직전 상대 수. 생성 {now} KST.</p>
<nav>{''.join(f'<a href="#{s["sid"]}">{s["sid"][1:]} {s["g"]}</a>' for s in scenes)}</nav>
{''.join(cards)}
</main></body></html>"""
    open(os.path.join(REPORTS, "DIAGRAMS_v0.html"), "w", encoding="utf-8").write(page)


if __name__ == "__main__":
    main()
