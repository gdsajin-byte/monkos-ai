#!/usr/bin/env python3
"""원장 + SGF(+GIB) → 대국별 1행 표.

출력 (레포 밖): $GO_ANALYSIS_DIR/games_v1.jsonl, games_v1.csv, parse_report_v1.json
원본 기보 폴더는 읽기만 한다.
"""
import csv
import datetime as dt
import json
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kibo_common import KIBO_DIR, ANALYSIS_DIR, ME, rank_label, is_ai, sgf_header_and_moves  # noqa: E402

WEEK = "월화수목금토일"


def load_ledger():
    rows, order, bad = {}, [], 0
    with open(os.path.join(KIBO_DIR, "ledger.jsonl"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                bad += 1
                continue
            if r.get("id") not in rows:
                order.append(r.get("id"))
            rows[r.get("id")] = r  # id 기준 마지막 행
    return rows, order, bad


def parse_kind_setup(cate, gn):
    s = re.sub(r"^\S+ \S+\s+", "", cate or "")
    # 원장 cate가 정본. SGF GN은 cate가 비었을 때만 (AI 친선 대국의 GN이 '승강급 대국'인 사례 실측)
    if "승강급" in s:
        kind = "승강급"
    elif "친선" in s:
        kind = "친선"
    else:
        g = gn or ""
        kind = "승강급" if re.search(r"승강급|升降|Rank|レーティング", g) else "친선" if re.search(r"친선|友情", g) else "?"
    m = re.search(r"(\d+)점접바둑", s)
    if m:
        setup, hcp = "접바둑", int(m.group(1))
    elif "정선" in s:
        setup, hcp = "정선", 0
    elif "호선" in s or s == "":
        setup, hcp = "호선", 0
    else:
        setup, hcp = "?", 0
    return kind, setup, hcp


def parse_result(re_sgf, ledger_res, grlt):
    """→ (winner 'B'|'W'|'D'|None, type 'R'|'N'|'T'|'D'|'?', margin float|None, source)"""
    r = (re_sgf or "").strip()
    m = re.match(r"^([BW])\+(R|T|[\d.]+)?", r)
    if m:
        t = m.group(2)
        if t in ("R", "T"):
            return m.group(1), t, None, "sgf"
        if t:
            return m.group(1), "N", float(t), "sgf"
        return m.group(1), "?", None, "sgf"
    if r in ("0", "Draw", "D") or r.startswith("Jigo"):
        return "D", "D", 0.0, "sgf"
    L = (ledger_res or "").strip()
    if L and not re.match(r"^(백|흑|白|黑|W|B|무)", L):
        # 중국 서버 기보: GBK 바이트가 cp949로 잘못 해독된 문자열 복원 (예: 겜펙櫓턍價 → 白棋中盘胜)
        try:
            L = L.encode("cp949").decode("gbk")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    if "무승부" in L or "和" in L or "Draw" in L:
        return "D", "D", 0.0, "ledger"
    w = "W" if re.match(r"^(백|白|W)", L) else "B" if re.match(r"^(흑|黑|B)", L) else None
    if w:
        if re.search(r"불계|中盘|R", L):
            return w, "R", None, "ledger"
        if "시간" in L or "超时" in L or "T" in L[1:3]:
            return w, "T", None, "ledger"
        mm = re.search(r"(\d+)(?:집|目)(반|半)?", L)
        if mm:
            return w, "N", int(mm.group(1)) + (0.5 if mm.group(2) else 0), "ledger"
        mm = re.search(r"([\d.]+)", L)
        if mm:
            return w, "N", float(mm.group(1)), "ledger"
        return w, "?", None, "ledger"
    code = {"0": ("B", "N"), "1": ("W", "N"), "3": ("B", "R"), "4": ("W", "R"), "7": ("B", "T"), "8": ("W", "T")}
    if str(grlt) in code:
        c, t = code[str(grlt)]
        return c, t, None, "grlt"
    return None, "?", None, "none"


def parse_time(ot, gib_text):
    """→ 'base분/byo초×n' 또는 None"""
    s = ot or ""
    m = re.match(r"^(\d+)-(\d+)-(\d+)$", s)
    if m:
        b, y, n = map(int, m.groups())
        return f"{b // 60}분/{y}초×{n}"
    m = re.search(r"제한시간\s*(\d+)분\s*:?\s*(\d+)초\s*초읽기\s*(\d+)번", s)
    if not m and gib_text:
        m = re.search(r"제한시간\s*(\d+)분\s*(\d+)초\s*초읽기\s*(\d+)번", gib_text.replace("\n", " "))
        if not m:
            mm = re.search(r"GTIME:(\d+)-(\d+)-(\d+)", gib_text)
            if mm:
                b, y, n = map(int, mm.groups())
                return f"{b // 60}분/{y}초×{n}"
    if m:
        return f"{int(m.group(1))}분/{int(m.group(2))}초×{int(m.group(3))}"
    return None


def gib_start(gib_text):
    m = re.search(r"GDATE:\s*(\d+)-\s*(\d+)-\s*(\d+)-\s*(\d+)-\s*(\d+)-\s*(\d+)", gib_text or "")
    if not m:
        return None
    try:
        return dt.datetime(*map(int, m.groups()))
    except ValueError:
        return None


def main():
    os.makedirs(ANALYSIS_DIR, exist_ok=True)
    rows, order, bad_json = load_ledger()
    rep = Counter()
    rep["ledger_unique_ids"] = len(rows)
    rep["ledger_bad_json"] = bad_json
    out = []
    start_minus_list = []
    for gid in order:
        r = rows[gid]
        st = r.get("status", "")
        rep[f"status_{st}"] += 1
        if not st.startswith("ok"):
            continue
        path = os.path.join(KIBO_DIR, r.get("file", ""))
        if not r.get("file") or not os.path.exists(path):
            rep["fail_sgf_missing"] += 1
            continue
        try:
            text = open(path, encoding="utf-8", errors="replace").read()
            props, ab, moves = sgf_header_and_moves(text)
        except Exception:
            rep["fail_sgf_parse"] += 1
            continue
        gpath = path[:-4] + ".gib"
        gtext = None
        if os.path.exists(gpath):
            try:
                gtext = open(gpath, encoding="utf-8", errors="replace").read(6000)
            except Exception:
                rep["warn_gib_read"] += 1
        white, black = r.get("white") or props.get("PW"), r.get("black") or props.get("PB")
        if ME == white and ME != black:
            color, opp = "W", black
        elif ME == black and ME != white:
            color, opp = "B", white
        else:
            rep["fail_me_not_found"] += 1
            continue
        try:
            when = dt.datetime.strptime(r["date"], "%Y-%m-%d %H:%M:%S")
        except Exception:
            rep["fail_date"] += 1
            continue
        start = gib_start(gtext)
        if start:
            start_minus_list.append((when - start).total_seconds() / 60)

        def rc(v):
            try:
                return int(v)
            except (TypeError, ValueError):
                return None
        wr, br = rc(r.get("w_rank") or props.get("WR")), rc(r.get("b_rank") or props.get("BR"))
        my_rank, opp_rank = (wr, br) if color == "W" else (br, wr)
        kind, setup, hcp = parse_kind_setup(r.get("cate"), props.get("GN"))
        if setup == "접바둑" and not hcp:
            hcp = len(ab)
        winner, rtype, margin, rsrc = parse_result(props.get("RE"), r.get("result"), r.get("grlt"))
        rep[f"result_src_{rsrc}"] += 1
        if winner is None:
            res = None
            rep["anomaly_no_result"] += 1
        elif winner == "D":
            res = "D"
        else:
            res = "W" if winner == color else "L"
        nmov = len(moves)
        if nmov == 0:
            rep["anomaly_zero_moves"] += 1
        my_moves = sum(1 for c, _ in moves if c == color)
        km = props.get("KM")
        out.append({
            "id": gid,
            "review": st == "ok_review",
            "datetime": when.strftime("%Y-%m-%d %H:%M"),
            "date": when.strftime("%Y-%m-%d"),
            "year": when.year,
            "month": when.strftime("%Y-%m"),
            "hour": when.hour,
            "weekday": WEEK[when.weekday()],
            "start_gib": start.strftime("%Y-%m-%d %H:%M") if start else None,
            "my_color": color,
            "my_rank": my_rank,
            "my_rank_label": rank_label(my_rank),
            "opp_rank": opp_rank,
            "opp_rank_label": rank_label(opp_rank),
            "opp_ai": is_ai(opp),
            "opp": opp,  # 레포 밖 전용 — 레포 보고서에는 쓰지 않는다
            "kind": kind,
            "setup": setup,
            "handicap": hcp,
            "komi": float(km) if km and re.match(r"^-?[\d.]+$", km) else None,
            "result": res,
            "result_type": rtype,
            "margin": margin,
            "moves": nmov,
            "my_moves": my_moves,
            "time": parse_time(props.get("OT"), gtext),
            "file": r.get("file"),
        })
    out.sort(key=lambda g: (g["datetime"], g["id"]))
    with open(os.path.join(ANALYSIS_DIR, "games_v1.jsonl"), "w", encoding="utf-8") as f:
        for g in out:
            f.write(json.dumps(g, ensure_ascii=False) + "\n")
    with open(os.path.join(ANALYSIS_DIR, "games_v1.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)
    start_minus_list.sort()
    n = len(start_minus_list)
    rep_d = dict(rep)
    rep_d["parsed_games"] = len(out)
    rep_d["gib_start_available"] = n
    if n:
        rep_d["ledger_minus_gibstart_min_p10_p50_p90"] = [round(start_minus_list[int(n * q)], 1) for q in (0.1, 0.5, 0.9)]
    rep_d["generated"] = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(os.path.join(ANALYSIS_DIR, "parse_report_v1.json"), "w", encoding="utf-8") as f:
        json.dump(rep_d, f, ensure_ascii=False, indent=1)
    print(json.dumps(rep_d, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
