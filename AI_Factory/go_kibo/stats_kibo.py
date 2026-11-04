#!/usr/bin/env python3
"""games_v1.jsonl → 22년 기록 통계.

레포 출력: reports/STATS_v1.md (집계 표만 — 상대 아이디·기보 원문 없음)
레포 밖:   $GO_ANALYSIS_DIR/stats_v1/*.csv, *.svg
보고서의 '핵심 발견' 블록(<!-- FINDINGS --> … <!-- /FINDINGS -->)은 재실행 시 보존한다.
"""
import csv
import datetime as dt
import json
import os
import re
import sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kibo_common import ANALYSIS_DIR, rank_label  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
REPORT = os.path.join(HERE, "reports", "STATS_v1.md")
OUT = os.path.join(ANALYSIS_DIR, "stats_v1")
GROUPS = [("전체", lambda g: True), ("사람", lambda g: not g["opp_ai"]), ("AI", lambda g: g["opp_ai"])]


def load():
    with open(os.path.join(ANALYSIS_DIR, "games_v1.jsonl"), encoding="utf-8") as f:
        return [json.loads(x) for x in f]


def wl(games):
    c = Counter(g["result"] for g in games)
    w, l, d, n = c["W"], c["L"], c["D"], c[None]
    rate = w / (w + l) * 100 if w + l else None
    return {"n": len(games), "W": w, "L": l, "D": d, "none": n, "rate": rate}


def pct(x):
    return "—" if x is None else f"{x:.1f}%"


def cell(games, min_n=1):
    s = wl(games)
    if s["W"] + s["L"] < min_n:
        return f"{s['n']} / —"
    return f"{s['n']} / {pct(s['rate'])}"


def md_table(header, rows):
    out = ["| " + " | ".join(header) + " |", "|" + "|".join("---" for _ in header) + "|"]
    out += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return "\n".join(out)


def write_csv(name, header, rows):
    with open(os.path.join(OUT, name), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


# ---------- SVG (표준 라이브러리, matplotlib 미설치) ----------
def svg_lines(name, title, xs, series, y_label, y_fmt=lambda v: f"{v:.0f}", bars=None, bar_label="", y_ticks=None):
    """series: [(label, color, [y or None])]; bars: [count] (보조축 막대)"""
    W, H, L, R, T, B = 1100, 420, 60, 60, 40, 60
    pw, ph = W - L - R, H - T - B
    ys = [y for _, _, s in series for y in s if y is not None]
    lo, hi = min(ys), max(ys)
    if lo == hi:
        hi = lo + 1
    pad = (hi - lo) * 0.08
    lo, hi = lo - pad, hi + pad
    n = len(xs)
    X = lambda i: L + (pw * i / max(n - 1, 1))  # noqa: E731
    Y = lambda v: T + ph * (1 - (v - lo) / (hi - lo))  # noqa: E731
    p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="sans-serif" font-size="11">',
         f'<rect width="{W}" height="{H}" fill="#fff"/>',
         f'<text x="{L}" y="22" font-size="14" font-weight="bold">{title}</text>']
    if bars:
        bm = max(bars) or 1
        bw = max(pw / n * 0.8, 1)
        for i, b in enumerate(bars):
            h = ph * 0.35 * b / bm
            p.append(f'<rect x="{X(i) - bw / 2:.1f}" y="{T + ph - h:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="#d9d9d9"/>')
        p.append(f'<text x="{W - R + 4}" y="{T + ph}" fill="#888">{bar_label} 최대 {bm}</text>')
    if y_ticks:
        lo, hi = min(y_ticks) - 0.5, max(y_ticks) + 0.5
    for v in (y_ticks or [lo + (hi - lo) * k / 5 for k in range(6)]):
        p.append(f'<line x1="{L}" x2="{W - R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" stroke="#eee"/>')
        p.append(f'<text x="{L - 6}" y="{Y(v) + 4:.1f}" text-anchor="end" fill="#555">{y_fmt(v)}</text>')
    step = 1 if any(x == "" for x in xs) else max(1, n // 24)
    for i in range(0, n, step):
        if not xs[i]:
            continue
        p.append(f'<text x="{X(i):.1f}" y="{H - B + 16}" text-anchor="middle" fill="#555">{xs[i]}</text>')
    for li, (lab, col, s) in enumerate(series):
        seg = []
        for i, y in enumerate(s):
            if y is None:
                if len(seg) > 1:
                    p.append(f'<polyline fill="none" stroke="{col}" stroke-width="2" points="{" ".join(seg)}"/>')
                seg = []
                continue
            seg.append(f"{X(i):.1f},{Y(y):.1f}")
        if len(seg) > 1:
            p.append(f'<polyline fill="none" stroke="{col}" stroke-width="2" points="{" ".join(seg)}"/>')
        p.append(f'<rect x="{L + 10 + li * 120}" y="{H - 22}" width="12" height="4" fill="{col}"/>'
                 f'<text x="{L + 26 + li * 120}" y="{H - 17}">{lab}</text>')
    p.append(f'<text x="14" y="{T + ph / 2}" transform="rotate(-90 14 {T + ph / 2})" text-anchor="middle">{y_label}</text>')
    p.append("</svg>")
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write("\n".join(p))


def main():
    os.makedirs(OUT, exist_ok=True)
    G = load()
    rep = json.load(open(os.path.join(ANALYSIS_DIR, "parse_report_v1.json"), encoding="utf-8"))
    sec = []

    # 0. 개요
    rows = []
    for name, f in GROUPS:
        gs = [g for g in G if f(g)]
        s = wl(gs)
        rows.append([name, s["n"], sum(g["kind"] == "승강급" for g in gs), sum(g["kind"] == "친선" for g in gs),
                     sum(g["setup"] == "접바둑" for g in gs), s["W"], s["L"], s["D"], s["none"], pct(s["rate"]),
                     sum(g["review"] for g in gs)])
    first, last = G[0]["date"], G[-1]["date"]
    sec.append(f"## 1. 개요\n\n기간 {first} ~ {last} · 파싱 {len(G):,}국. 승률 = 승/(승+패), 무승부·결과 없음 제외.\n\n" + md_table(
        ["상대", "대국", "승강급", "친선", "접바둑", "승", "패", "무", "결과없음", "승률", "ok_review"], rows))

    ai_rank = Counter(g["opp_rank_label"] for g in G if g["opp_ai"])
    non_ai_27 = sum(1 for g in G if not g["opp_ai"] and (g["opp_rank"] or 0) >= 27)
    sec.append(f"AI 판별: 상대 이름이 `AI_` 또는 `KataGo`로 시작(대소문자 무시). AI 상대 급수 분포 "
               + ", ".join(f"{k} {v}" for k, v in ai_rank.most_common(5))
               + f". 비AI인데 급수 코드 27(특수)인 상대 {non_ai_27}국 — 사람으로 집계(이름 판별 한계).")

    # 파싱 실패·이상치
    rows = [["원장 고유 id", rep.get("ledger_unique_ids")], ["status=ok", rep.get("status_ok", 0)],
            ["status=ok_review", rep.get("status_ok_review", 0)], ["status=fail (수집 실패, 제외)", rep.get("status_fail", 0)],
            ["SGF 없음", rep.get("fail_sgf_missing", 0)], ["SGF 파싱 실패", rep.get("fail_sgf_parse", 0)],
            ["작가님 아이디 미발견", rep.get("fail_me_not_found", 0)], ["날짜 파싱 실패", rep.get("fail_date", 0)],
            ["**파싱 성공**", rep.get("parsed_games")], ["이상치: 결과 없음 (승률 제외, 대국 수엔 포함)", rep.get("anomaly_no_result", 0)],
            ["이상치: 수수 0", rep.get("anomaly_zero_moves", 0)],
            ["결과 출처 SGF RE / 원장 문자열 / 원장 코드", f"{rep.get('result_src_sgf', 0)} / {rep.get('result_src_ledger', 0)} / {rep.get('result_src_grlt', 0)}"]]
    sec.append("### 1-1. 파싱 실패·이상치 (무음 제외 없음)\n\n" + md_table(["항목", "건수"], rows)
               + f"\n\n원장은 수집 중 파일이라 실행 시점 스냅샷이다(파싱 {rep.get('generated')}).")

    # 2. 급수 곡선
    by_month = defaultdict(list)
    for g in G:
        by_month[g["month"]].append(g)
    months = []
    y0, m0 = map(int, first[:7].split("-"))
    y1, m1 = map(int, last[:7].split("-"))
    while (y0, m0) <= (y1, m1):
        months.append(f"{y0:04d}-{m0:02d}")
        m0 += 1
        if m0 == 13:
            y0, m0 = y0 + 1, 1
    mrows = []
    for m in months:
        gs = by_month.get(m, [])
        ranks = [g["my_rank"] for g in gs if g["kind"] == "승강급" and g["my_rank"]]
        last_r = ranks[-1] if ranks else None
        s_h = wl([g for g in gs if not g["opp_ai"]])
        s_a = wl([g for g in gs if g["opp_ai"]])
        mrows.append([m, len(gs), s_h["n"], s_a["n"], last_r, rank_label(last_r) if last_r else "",
                      min(ranks) if ranks else "", max(ranks) if ranks else "",
                      f"{s_h['rate']:.1f}" if s_h["rate"] is not None else "", f"{s_a['rate']:.1f}" if s_a["rate"] is not None else ""])
    write_csv("monthly.csv", ["month", "games", "human", "ai", "rank_end_code", "rank_end", "rank_min", "rank_max", "human_winrate", "ai_winrate"], mrows)
    svg_lines("rank_curve.svg", "월별 급수(승강급 월말, 코드 22=5단) + 월별 대국 수", [m[:4] if m.endswith("-01") and int(m[:4]) % 2 == 0 else "" for m in months],
              [("월말 급수", "#c0392b", [r[4] for r in mrows])], "급수", y_fmt=lambda v: rank_label(round(v)), y_ticks=list(range(min(r[4] for r in mrows if r[4]), max(r[4] for r in mrows if r[4]) + 1)),
              bars=[r[1] for r in mrows], bar_label="월 대국")
    # 연도별 급수 요약
    by_year = defaultdict(list)
    for g in G:
        by_year[g["year"]].append(g)
    yrows = []
    for y in sorted(by_year):
        gs = by_year[y]
        rk = [g["my_rank"] for g in gs if g["kind"] == "승강급" and g["my_rank"]]
        cnt = Counter(rk)
        yrows.append([y, rank_label(rk[0]) if rk else "", rank_label(rk[-1]) if rk else "",
                      rank_label(max(rk)) if rk else "", rank_label(cnt.most_common(1)[0][0]) if rk else "",
                      sum(1 for m in months if m.startswith(str(y)) and by_month.get(m))])
    sec.append("## 2. 급수 곡선\n\n승강급 대국 시점의 작가님 급수(타이젬 코드 18=1단, 22=5단, 23=6단, 24=7단). 월별 표는 레포 밖 `stats_v1/monthly.csv`, 차트 `rank_curve.svg`.\n\n"
               + md_table(["연도", "첫 판 급수", "마지막 판 급수", "최고", "최빈", "대국 있는 달"], yrows))

    # 3. 연도별
    rows = []
    for y in sorted(by_year):
        gs = by_year[y]
        r = [y]
        for name, f in GROUPS:
            r.append(cell([g for g in gs if f(g)]))
        h = [g for g in gs if not g["opp_ai"]]
        r.append(cell([g for g in h if g["kind"] == "승강급"]))
        r.append(cell([g for g in h if g["kind"] == "친선"]))
        rows.append(r)
    write_csv("yearly.csv", ["year", "all", "human", "ai", "human_rank", "human_friendly"], rows)
    years = sorted(by_year)
    svg_lines("yearly_winrate.svg", "연도별 승률 (사람/AI)", [str(y) for y in years],
              [(name, col, [wl([g for g in by_year[y] if f(g)])["rate"] for y in years])
               for (name, f), col in zip(GROUPS[1:], ["#2c7fb8", "#d95f0e"])], "승률 %",
              bars=[len(by_year[y]) for y in years], bar_label="연 대국")
    sec.append("## 3. 연도별 대국 수·승률\n\n셀 = `대국 수 / 승률`.\n\n" + md_table(
        ["연도", "전체", "사람", "AI", "사람·승강급", "사람·친선"], rows))

    # 4. 시간대·요일
    rows = []
    for h in range(24):
        gs = [g for g in G if g["hour"] == h]
        rows.append([f"{h:02d}시"] + [cell([g for g in gs if f(g)]) for _, f in GROUPS])
    svg_lines("hour_winrate.svg", "시간대별 승률 (사람 상대) + 대국 수", [f"{h}" for h in range(24)],
              [("사람", "#2c7fb8", [wl([g for g in G if g["hour"] == h and not g["opp_ai"]])["rate"] for h in range(24)])],
              "승률 %", bars=[sum(1 for g in G if g["hour"] == h) for h in range(24)], bar_label="대국")
    sec.append("## 4. 시간대·요일\n\n시각 = 원장 목록 시각. GIB 시작 시각과 대조하면 원장이 중앙값 "
               f"{rep.get('ledger_minus_gibstart_min_p10_p50_p90', ['?'] * 3)[1]}분 늦다(p10~p90 "
               f"{rep.get('ledger_minus_gibstart_min_p10_p50_p90', ['?'] * 3)[0]}~{rep.get('ledger_minus_gibstart_min_p10_p50_p90', ['?'] * 3)[2]}분) → 종료 무렵 시각으로 읽는다.\n\n"
               + md_table(["시간대", "전체", "사람", "AI"], rows))
    rows = []
    for d in "월화수목금토일":
        gs = [g for g in G if g["weekday"] == d]
        rows.append([d] + [cell([g for g in gs if f(g)]) for _, f in GROUPS])
    sec.append(md_table(["요일", "전체", "사람", "AI"], rows))

    # 5. 급수 차 (호선만)
    def bucket(g):
        if g["my_rank"] is None or g["opp_rank"] is None:
            return None
        d = g["opp_rank"] - g["my_rank"]
        return max(-3, min(3, d))
    labels = {-3: "−3 이하", -2: "−2", -1: "−1", 0: "0", 1: "+1", 2: "+2", 3: "+3 이상"}
    ho = [g for g in G if g["setup"] == "호선"]
    rows = []
    for b in range(-3, 4):
        gs = [g for g in ho if bucket(g) == b]
        rows.append([labels[b]] + [cell([g for g in gs if f(g)]) for _, f in GROUPS])
    sec.append("## 5. 상대 급수 차별 승률 (호선만)\n\n급수 차 = 상대 − 작가님 (+면 상대가 높음). 접바둑·정선 제외.\n\n"
               + md_table(["급수 차", "전체", "사람", "AI"], rows))

    # 6. 연속 대국
    by_day = defaultdict(list)
    for g in G:
        by_day[g["date"]].append(g)
    for d in by_day:
        by_day[d].sort(key=lambda g: g["datetime"])
        prev = None
        for i, g in enumerate(by_day[d], 1):
            g["_nth"] = i
            g["_prev"] = prev["result"] if prev else None
            g["_prev_ai"] = prev["opp_ai"] if prev else None
            g["_prev2"] = prev.get("_prev") if prev else None
            prev = g
    nb = [("1", lambda n: n == 1), ("2", lambda n: n == 2), ("3", lambda n: n == 3), ("4", lambda n: n == 4),
          ("5", lambda n: n == 5), ("6~9", lambda n: 6 <= n <= 9), ("10+", lambda n: n >= 10)]
    rows = []
    for lab, f2 in nb:
        gs = [g for g in G if f2(g["_nth"])]
        rows.append([lab] + [cell([g for g in gs if f(g)]) for _, f in GROUPS])
    sec.append("## 6. 연속 대국 효과\n\n### 6-1. 같은 날 n번째 판\n\n" + md_table(["n번째", "전체", "사람", "AI"], rows))
    rows = []
    conds = [("그날 첫 판", lambda g: g["_nth"] == 1), ("직전 판 승 후", lambda g: g["_prev"] == "W"),
             ("직전 판 패 후", lambda g: g["_prev"] == "L"), ("2연패 후", lambda g: g["_prev"] == "L" and g["_prev2"] == "L"),
             ("2연승 후", lambda g: g["_prev"] == "W" and g["_prev2"] == "W")]
    for lab, f2 in conds:
        gs = [g for g in G if f2(g)]
        rows.append([lab] + [cell([g for g in gs if f(g)]) for _, f in GROUPS])
    sec.append("### 6-2. 직전 판 결과 후 승률 (틸트 지표, 같은 날 직전 판 기준)\n\n" + md_table(["조건", "전체", "사람", "AI"], rows))

    # 7. 결과 유형·수수
    tl = {"R": "불계", "N": "계가", "T": "시간", "D": "무승부", "?": "미상"}
    rows = []
    for t in ["R", "N", "T", "D", "?"]:
        r = [tl[t]]
        for name, f in GROUPS:
            gs = [g for g in G if f(g) and g["result"] is not None]
            k = [g for g in gs if g["result_type"] == t]
            w = sum(g["result"] == "W" for g in k)
            r.append(f"{len(k)} ({len(k) / len(gs) * 100:.1f}%) · 승 {w}" if gs else "—")
        rows.append(r)
    sec.append("## 7. 결과 유형·수수\n\n셀 = `건수 (비율) · 작가님 승`. 결과 없음 제외.\n\n" + md_table(["유형", "전체", "사람", "AI"], rows))
    cnt = [g for g in G if g["result_type"] == "N" and g["margin"] is not None and not g["opp_ai"]]
    if cnt:
        rows = []
        for lo, hi, lab in [(0, 1, "0.5집"), (1, 3, "1.5~2.5집"), (3, 6, "3.5~5.5집"), (6, 11, "6.5~10.5집"), (11, 999, "11.5집+")]:
            k = [g for g in cnt if lo <= g["margin"] < hi]
            rows.append([lab, cell(k)])
        sec.append("계가 차이별 (사람 상대):\n\n" + md_table(["집 차이", "대국 / 승률"], rows))
    rows = []
    for lo, hi in [(0, 1), (1, 50), (50, 100), (100, 150), (150, 200), (200, 250), (250, 300), (300, 999)]:
        lab = "0" if hi == 1 else (f"{lo}~{hi - 1}" if hi < 999 else f"{lo}+")
        rows.append([lab] + [cell([g for g in G if f(g) and lo <= g["moves"] < hi]) for _, f in GROUPS])
    mv = sorted(g["moves"] for g in G)
    sec.append(f"수수 분포 (전체 중앙값 {mv[len(mv) // 2]}수, 셀 = `대국 / 승률`):\n\n" + md_table(["수수", "전체", "사람", "AI"], rows))

    # 8. 제한시간
    tc = Counter(g["time"] or "미상" for g in G)
    rows = [[t, cell([g for g in G if (g["time"] or "미상") == t and not g["opp_ai"]]), cell([g for g in G if (g["time"] or "미상") == t and g["opp_ai"]])]
            for t, _ in tc.most_common(8)]
    sec.append("## 8. 제한시간 조건 (상위 8)\n\n" + md_table(["조건", "사람", "AI"], rows))

    # 보고서 조립 (발견 블록 보존)
    findings = "<!-- FINDINGS -->\n(작성 대기)\n<!-- /FINDINGS -->"
    if os.path.exists(REPORT):
        m = re.search(r"<!-- FINDINGS -->.*?<!-- /FINDINGS -->", open(REPORT, encoding="utf-8").read(), re.S)
        if m:
            findings = m.group(0)
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    head = (f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/stats_kibo.py\n---\n\n"
            f"# 내 기보 22년 통계 v1\n\n> 생성 {now} KST · 대상 = 타이젬 작가님 대국 전부 · 상대는 사람/AI·급수로만 표기(아이디 없음).\n"
            f"> 재생성: `python3 AI_Factory/go_kibo/parse_kibo.py && python3 AI_Factory/go_kibo/stats_kibo.py`\n\n"
            f"## 핵심 발견\n\n{findings}\n")
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(head + "\n" + "\n\n".join(sec) + "\n")
    print("wrote", REPORT, "and", OUT)


if __name__ == "__main__":
    main()
