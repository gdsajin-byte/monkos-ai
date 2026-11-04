#!/usr/bin/env python3
"""KataGo analysis 응답 → 작가님 수별 손해 JSONL + 실수 사전 요약.

입력 (레포 밖 $GO_ANALYSIS_DIR/mistakes_v0/):
  queries_{name}.meta.jsonl, responses_{name}.jsonl
출력:
  moves_{name}.jsonl                     — 작가님 차례 수 1행 (레포 밖)
  summary_{name}.json                    — 집계 (레포 밖)
  AI_Factory/go_kibo/reports/MISTAKES_v0.md (--report 시, 수순·좌표·집계만 — 대국자 없음)

손해 정의 (KaTrain 방식):
  lead_me(t) = 국면 t(작가님 착수 직전) 루트 scoreLead, 작가님 기준
  손해 = lead_me(t) − lead_me(t+1)   (t+1 = 작가님 착수 직후 국면)
  승률 손해도 같은 방식. 음수(엔진 평가가 오른 경우)는 원값 보존, 집계는 0으로 자른 값.
국면 단계 (수순 = t+1): 포석 1–50 · 중반 51–150 · 끝내기 151+
최선 수와의 거리: 체비셰프 거리 max(|dx|,|dy|), 패스 포함 시 None.
"""
import argparse
import datetime as dt
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kibo_common import ANALYSIS_DIR  # noqa: E402

OUT = os.path.join(ANALYSIS_DIR, "mistakes_v0")
HERE = os.path.dirname(os.path.abspath(__file__))
COLS = "ABCDEFGHJKLMNOPQRST"
BIG = 3.0  # 큰 실수 기준(집)


def phase(n):
    return "포석" if n <= 50 else "중반" if n <= 150 else "끝내기"


def xy(m):
    if not m or m.lower() == "pass":
        return None
    return COLS.index(m[0].upper()), int(m[1:])


def cheb(a, b):
    pa, pb = xy(a), xy(b)
    if pa is None or pb is None:
        return None
    return max(abs(pa[0] - pb[0]), abs(pa[1] - pb[1]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--elapsed", type=float, default=None, help="엔진 실행 초 (처리량 계산)")
    ap.add_argument("--visits", type=int, default=64)
    ap.add_argument("--dir1", default=None, help="1단계 대국별 응답 폴더(out1) — 있으면 responses_{name}.jsonl 대신")
    ap.add_argument("--dir2", default=None, help="2단계 재평가 응답 폴더(out2)")
    ap.add_argument("--visits2", type=int, default=400)
    ap.add_argument("--report-name", default="MISTAKES_v0")
    a = ap.parse_args()

    meta = {m["id"]: m for m in (json.loads(x) for x in open(os.path.join(OUT, f"queries_{a.name}.meta.jsonl"), encoding="utf-8"))}
    q = {}
    for x in open(os.path.join(OUT, f"queries_{a.name}.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        q[d["id"]] = d["moves"]
    def lines_of(path_or_dir, single):
        if path_or_dir:
            for fn in sorted(os.listdir(path_or_dir)):
                if fn.endswith(".jsonl"):
                    yield from open(os.path.join(path_or_dir, fn), encoding="utf-8", errors="replace")
        else:
            yield from open(single, encoding="utf-8", errors="replace")

    def read_resp(it):
        resp, errs, warns = defaultdict(dict), [], 0
        for line in it:
            line = line.strip()
            if not line.startswith("{"):
                continue
            d = json.loads(line)
            if "error" in d:
                errs.append({"id": d.get("id"), "error": d["error"], "field": d.get("field")})
                continue
            if "warning" in d:
                warns += 1
                continue
            if d.get("isDuringSearch"):
                continue
            resp[d["id"]][d["turnNumber"]] = d
        return resp, errs, warns

    resp, errors, warnings = read_resp(lines_of(a.dir1, os.path.join(OUT, f"responses_{a.name}.jsonl")))
    resp2 = read_resp(lines_of(a.dir2, None))[0] if a.dir2 else {}

    rows = []
    missing_turns = 0
    for gid, m in meta.items():
        moves = q[gid]
        me = m["my_color"]
        sgn = 1 if me == "B" else -1
        r = resp.get(gid, {})
        for t, (c, mv) in enumerate(moves):
            if c != me:
                continue
            a0, a1 = r.get(t), r.get(t + 1)
            if not a0 or not a1:
                missing_turns += 1
                continue
            best = min(a0["moveInfos"], key=lambda mi: mi["order"]) if a0.get("moveInfos") else None
            l0, l1 = sgn * a0["rootInfo"]["scoreLead"], sgn * a1["rootInfo"]["scoreLead"]
            w0 = a0["rootInfo"]["winrate"] if me == "B" else 1 - a0["rootInfo"]["winrate"]
            w1 = a1["rootInfo"]["winrate"] if me == "B" else 1 - a1["rootInfo"]["winrate"]
            mine = next((mi for mi in a0.get("moveInfos", []) if mi["move"] == mv), None)
            rows.append({
                "id": gid, "era": m["era"], "result": m["result"], "move_no": t + 1, "phase": phase(t + 1),
                "move": mv, "best": best["move"] if best else None, "is_best": bool(best and best["move"] == mv),
                "lead_before": round(l0, 2), "lead_after": round(l1, 2), "loss": round(l0 - l1, 2),
                "wr_before": round(w0, 4), "wr_after": round(w1, 4), "wr_loss": round(w0 - w1, 4),
                "dist_best": cheb(mv, best["move"]) if best else None,
                "mine_visits": mine["visits"] if mine else 0,
                "mine_loss_same_search": round(sgn * (best["scoreLead"] - mine["scoreLead"]), 2) if (best and mine) else None,
            })
            r2 = resp2.get(gid, {})
            if t in r2 and t + 1 in r2:  # 2단계 재평가가 있으면 그 값으로 손해를 바꾼다(1단계 값은 loss64로 보존)
                b0, b1 = r2[t], r2[t + 1]
                m0, m1 = sgn * b0["rootInfo"]["scoreLead"], sgn * b1["rootInfo"]["scoreLead"]
                v0 = b0["rootInfo"]["winrate"] if me == "B" else 1 - b0["rootInfo"]["winrate"]
                v1 = b1["rootInfo"]["winrate"] if me == "B" else 1 - b1["rootInfo"]["winrate"]
                bb = min(b0["moveInfos"], key=lambda mi: mi["order"]) if b0.get("moveInfos") else None
                x = rows[-1]
                x.update(stage2=True, loss64=x["loss"], wr_loss64=x["wr_loss"], best64=x["best"],
                         loss=round(m0 - m1, 2), wr_loss=round(v0 - v1, 4), lead_before=round(m0, 2), lead_after=round(m1, 2),
                         best=bb["move"] if bb else x["best"], is_best=bool(bb and bb["move"] == mv),
                         dist_best=cheb(mv, bb["move"]) if bb else x["dist_best"])
    with open(os.path.join(OUT, f"moves_{a.name}.jsonl"), "w", encoding="utf-8") as f:
        for x in rows:
            f.write(json.dumps(x, ensure_ascii=False) + "\n")

    def agg(rs):
        if not rs:
            return {"n": 0}
        cl = [max(0.0, x["loss"]) for x in rs]
        return {"n": len(rs), "avg_loss": round(sum(cl) / len(rs), 3), "big": sum(1 for v in cl if v >= BIG),
                "big_rate": round(sum(1 for v in cl if v >= BIG) / len(rs) * 100, 2),
                "best_rate": round(sum(x["is_best"] for x in rs) / len(rs) * 100, 1),
                "avg_wr_loss": round(sum(max(0.0, x["wr_loss"]) for x in rs) / len(rs) * 100, 2)}

    summ = {"name": a.name, "games": len(meta), "games_with_resp": len(resp), "my_moves": len(rows),
            "positions_resp": sum(len(v) for v in resp.values()), "engine_errors": len(errors), "engine_warnings": warnings,
            "missing_turns": missing_turns, "errors_sample": errors[:5],
            "overall": agg(rows), "by_phase": {p: agg([x for x in rows if x["phase"] == p]) for p in ("포석", "중반", "끝내기")},
            "by_result": {r: agg([x for x in rows if x["result"] == r]) for r in ("W", "L")},
            "by_era": {e: agg([x for x in rows if x["era"] == e]) for e in sorted({x["era"] for x in rows})}}
    if a.dir2:
        cand = [x for x in rows if x.get("stage2")]
        cand64 = sum(1 for x in rows if (x.get("loss64", x["loss"]) >= BIG))
        kept = sum(1 for x in cand if x["loss"] >= BIG)
        summ["stage2"] = {"visits": a.visits2, "candidates_64": cand64, "reevaluated": len(cand), "kept_big": kept,
                          "kept_rate": round(kept / len(cand) * 100, 1) if cand else None,
                          "games_with_resp2": len(resp2)}
    if a.elapsed:
        pos = summ["positions_resp"]
        summ["elapsed_s"] = a.elapsed
        summ["positions_per_s"] = round(pos / a.elapsed, 2)
        sample_pos = json.load(open(os.path.join(OUT, "sample_report.json"), encoding="utf-8"))["positions_total"]
        summ["full_2000_est_hours"] = round(sample_pos / (pos / a.elapsed) / 3600, 2)
    json.dump(summ, open(os.path.join(OUT, f"summary_{a.name}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in summ.items() if k != "errors_sample"}, ensure_ascii=False, indent=1))

    if a.report:
        write_report(a, summ, rows, meta)


def write_report(a, summ, rows, meta):
    gidx = {gid: f"G{i + 1:02d}" for i, gid in enumerate(meta)}
    L = []
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    L.append(f"---\ntype: research\ndate: {now[:10]}\nportfolio: PF_GO\nsource: AI_Factory/go_kibo/analyze_mistakes.py\n---\n")
    ver = a.report_name.split("_")[-1]
    L.append(f"# 실수 사전 {ver} — {summ['games']}국\n")
    s2 = f" → 큰 실수 후보 visits {a.visits2} 재평가" if a.dir2 else ""
    L.append(f"> 생성 {now} KST · 엔진 KataGo v1.18.2 + b18(kata1-b18c384nbt) · visits {a.visits}{s2} · 4060\n"
             f"> 대국은 G01~ 번호로만 표기(아이디·기보 원문 없음). 원자료 `~/.monkos/go-board/analysis/mistakes_v0/moves_{a.name}.jsonl`.\n"
             f"> 손해 = 착수 직전 국면 평가 − 착수 직후 국면 평가 (작가님 기준 집, KaTrain 방식). 큰 실수 = {BIG:g}집 이상.\n")
    L.append("## 1. 실행 상태\n")
    L.append("| 항목 | 값 |\n|---|---|")
    for k, lab in [("games", "대국"), ("games_with_resp", "응답 받은 대국"), ("positions_resp", "평가 국면"), ("my_moves", "작가님 착수"),
                   ("engine_errors", "엔진 오류 질의"), ("engine_warnings", "엔진 경고"), ("missing_turns", "평가 누락 수"),
                   ("elapsed_s", "엔진 실행 초"), ("positions_per_s", "국면/초"), ("full_2000_est_hours", "2,000국 예상(시간)")]:
        if k in summ:
            L.append(f"| {lab} | {summ[k]} |")
    L.append("")
    if "stage2" in summ:
        s2 = summ["stage2"]
        L.append(f"### 2단계 재평가 (visits {s2['visits']})\n")
        L.append("| 항목 | 값 |\n|---|---|")
        L.append(f"| 1단계 큰 실수 후보(3집+) | {s2['candidates_64']} |")
        L.append(f"| 재평가된 착수 | {s2['reevaluated']} |")
        L.append(f"| 재평가 후에도 3집+ (유지) | {s2['kept_big']} ({s2['kept_rate']}%) |")
        L.append("\n아래 표의 손해는 재평가된 착수만 visits 400 값으로 바꾼 것이다(나머지는 visits 64).\n")

    def trow(lab, s):
        return f"| {lab} | {s.get('n', 0)} | {s.get('avg_loss', '—')} | {s.get('avg_wr_loss', '—')}%p | {s.get('big', '—')} | {s.get('big_rate', '—')}% | {s.get('best_rate', '—')}% |"
    hdr = "| 구분 | 착수 | 평균 손해(집) | 평균 승률 손해 | 큰 실수 | 큰 실수율 | 최선 수 일치 |\n|---|---|---|---|---|---|---|"
    L.append("## 2. 단계별 평균 손해\n\n국면 단계: 수순 1–50 포석 · 51–150 중반 · 151+ 끝내기.\n")
    L.append(hdr)
    L.append(trow("전체", summ["overall"]))
    for p, s in summ["by_phase"].items():
        L.append(trow(p, s))
    for r, s in summ["by_result"].items():
        L.append(trow("이긴 판" if r == "W" else "진 판", s))
    for e, s in summ["by_era"].items():
        L.append(trow(f"시대 {e}", s))
    L.append("")
    L.append("## 3. 손해 상위 수 (상위 25)\n")
    L.append("| 대국 | 시대 | 결과 | 수순 | 단계 | 작가님 수 | 엔진 최선 | 거리 | 손해(집) | 승률 손해 |\n|---|---|---|---|---|---|---|---|---|---|")
    for x in sorted(rows, key=lambda x: -x["loss"])[:25]:
        L.append(f"| {gidx[x['id']]} | {x['era']} | {'승' if x['result'] == 'W' else '패'} | {x['move_no']} | {x['phase']} | {x['move']} | {x['best']} | "
                 f"{x['dist_best'] if x['dist_best'] is not None else '—'} | {x['loss']:.1f} | {x['wr_loss'] * 100:.1f}%p |")
    L.append("")
    L.append("## 4. 대국별 요약\n")
    L.append("| 대국 | 시대 | 결과 | 수수 | 작가님 착수 | 평균 손해 | 큰 실수 | 첫 큰 실수 수순 |\n|---|---|---|---|---|---|---|---|")
    for gid, m in meta.items():
        rs = [x for x in rows if x["id"] == gid]
        big = [x for x in rs if x["loss"] >= BIG]
        avg = sum(max(0, x["loss"]) for x in rs) / len(rs) if rs else 0
        L.append(f"| {gidx[gid]} | {m['era']} | {'승' if m['result'] == 'W' else '패'} | {m['moves']} | {len(rs)} | {avg:.2f} | {len(big)} | {big[0]['move_no'] if big else '—'} |")
    L.append("")
    L.append("<!-- NOTES -->\n<!-- /NOTES -->\n")
    path = os.path.join(HERE, "reports", f"{a.report_name}.md")
    notes = "<!-- NOTES -->\n<!-- /NOTES -->"
    if os.path.exists(path):
        import re
        m = re.search(r"<!-- NOTES -->.*?<!-- /NOTES -->", open(path, encoding="utf-8").read(), re.S)
        if m:
            notes = m.group(0)
    text = "\n".join(L).replace("<!-- NOTES -->\n<!-- /NOTES -->", notes)
    open(path, "w", encoding="utf-8").write(text)
    print("wrote", path)


if __name__ == "__main__":
    main()
