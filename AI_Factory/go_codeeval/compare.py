"""코드 형세 vs b18 정답지 대조 — 정확도 표(마크다운) + d32d 그래프(SVG). 엔진 없음.
입력: make_truth.py 출력(JSONL) · 실수 사전 moves_full/queries_full(호선 집 차 대표본, 64탐색). 읽기만.
사용: python3 -I compare.py <truth.jsonl> <출력 폴더> [--even-games 300]
"""
import json
import os
import random
import statistics
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402

H = os.path.expanduser("~/.monkos/go-board")
VARIANTS = {"S Bouzy 5/21+단계식 사활": dict(dil=5, ero=21, use_life="staged"), "V1 Bouzy 5/21+기본 사활": dict(dil=5, ero=21, use_life=True),
            "V2 Bouzy 5/21(사활 없음)": dict(dil=5, ero=21, use_life=False)}
SEGS = (("~100", 0, 100), ("101~200", 101, 200), ("201~", 201, 10 ** 6))


def seg(n):
    return next(s for s, lo, hi in SEGS if lo <= n <= hi)


def stats(xs):
    if not xs:
        return "—"
    xs = sorted(xs)
    return f"{statistics.mean(xs):.1f} / {statistics.median(xs):.1f} / {xs[int(0.9 * (len(xs) - 1))]:.1f} (n={len(xs)})"


def main():
    truth_f, outdir = sys.argv[1], sys.argv[2]
    n_even = int(sys.argv[sys.argv.index("--even-games") + 1]) if "--even-games" in sys.argv else 300
    os.makedirs(outdir, exist_ok=True)
    rows = [json.loads(l) for l in open(truth_f, encoding="utf-8")]
    pos = [r for r in rows if not r.get("final")]
    finals = [r for r in rows if r.get("final")]
    # 호선 대표본(실수 사전 64탐색 집 차)
    q = {}
    for l in open(f"{H}/analysis/mistakes_v0/queries_full.jsonl", encoding="utf-8"):
        g = json.loads(l)
        q[g["id"]] = g["moves"]
    ids = sorted(q)
    random.Random(7).shuffle(ids)
    want = set(ids[:n_even])
    lead_by = {}
    for l in open(f"{H}/analysis/mistakes_v0/moves_full.jsonl", encoding="utf-8"):
        d = json.loads(l)
        if d["id"] in want and (d["move_no"] - 1) % 10 == 0 and d["move_no"] > 1 and d.get("lead_before") is not None:
            mover_b = d["move_no"] % 2 == 1
            lead_by[(d["id"], d["move_no"] - 1)] = d["lead_before"] if mover_b else -d["lead_before"]
    even64 = [{"set": "even64", "game": g, "n": n, "moves": q[g][:n], "setup": [], "komi": 6.5, "lead": v} for (g, n), v in lead_by.items()]

    lines = ["# 코드 형세 대조표(정답 = b18)", "",
             f"- 국면: 접바둑 실판 {sum(1 for r in pos if r['set'] == 'handi')} (b18 400탐색·소유권) · 호선 표본 {sum(1 for r in pos if r['set'] == 'even')} (b18 400탐색·소유권) · 호선 대표본 {len(even64)} (실수 사전 b18 64탐색 집 차만) · 종국 {len(finals)}판(사석)", ""]
    res_all = {}
    for vname, kw in VARIANTS.items():
        err = {}
        own_m = {}
        times = []
        for r in pos + even64:
            t0 = time.perf_counter()
            kw2 = {k: v for k, v in kw.items() if k != "mid"}
            e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], **kw2)
            if kw.get("mid"):
                e["lead"] = e["leadMid"]
            times.append(1000 * (time.perf_counter() - t0))
            key = (r["set"], seg(r["n"]))
            err.setdefault(key, []).append(abs(e["lead"] - r["lead"]))
            if "own" in r:
                ok = tot = 0
                for i, o in enumerate(r["own"]):
                    if abs(o) >= 0.5:
                        tot += 1
                        ok += (e["own"][i] > 0) == (o > 0) and e["own"][i] != 0
                own_m.setdefault(key, [0, 0])
                own_m[key][0] += ok
                own_m[key][1] += tot
        res_all[vname] = (err, own_m, times)
        lines += [f"## {vname}", "", f"- 시간: 평균 {statistics.mean(times):.1f}ms · 90% {sorted(times)[int(0.9 * (len(times) - 1))]:.1f}ms · 최대 {max(times):.0f}ms", "",
                  "| 표본 | 구간 | 집 차 오차 평균 / 중앙값 / 90% | 소유 일치율(b18 |값|≥0.5 칸) |", "|---|---|---|---|"]
        for sname in ("handi", "even", "even64"):
            for sg, _, _ in SEGS:
                k = (sname, sg)
                if k not in err:
                    continue
                om = own_m.get(k)
                lines.append(f"| {dict(handi='접바둑 실판', even='호선 표본', even64='호선 대표본(64탐색)')[sname]} | {sg} | {stats(err[k])} | "
                             + (f"{100 * om[0] / om[1]:.1f}% ({om[1]}칸)" if om and om[1] else "—") + " |")
        lines.append("")
    # 무리 단위 사활 판정표(단계식) — 정답: b18 소유권으로 본 무리 평균(자기 색 기준) ≥0.5 삶 · ≤-0.5 죽음 · 그 사이 불분명
    tab = {}
    for r in pos:
        b, _ = ce.replay([tuple(m) for m in r["moves"]], r["setup"])
        e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], use_life="staged")
        for col, stones in ce.dragons(b):
            p0 = next(iter(stones))
            stt, stage = e["stages"].get(p0, ("?", "?"))
            o = sum(r["own"][p] * col for p in stones) / len(stones)
            truth = "삶" if o >= 0.5 else "죽음" if o <= -0.5 else "불분명"
            k = (seg(r["n"]), stage)
            t = tab.setdefault(k, {"n": 0, "stones": 0, "ok": 0, "bad": 0, "unk": 0, "und": 0})
            t["n"] += 1
            t["stones"] += len(stones)
            if stt == "미정":
                t["und"] += 1
            elif truth == "불분명":
                t["unk"] += 1
            elif (stt in ("삶", "세키")) == (truth == "삶"):
                t["ok"] += 1
            else:
                t["bad"] += 1
    lines += ["## 무리 단위 사활 판정표(단계식, 정답 = b18 소유권 무리 평균 ±0.5)", "",
              "| 구간 | 단계 | 무리 수(돌) | b18 일치 | 불일치 | b18 불분명 | 미정 |", "|---|---|---|---|---|---|---|"]
    for sg, _, _ in SEGS:
        tot = sum(t["n"] for (g, _), t in tab.items() if g == sg)
        und = sum(t["und"] for (g, _), t in tab.items() if g == sg)
        for (g, stage), t in sorted(tab.items()):
            if g != sg:
                continue
            dec = t["ok"] + t["bad"]
            lines.append(f"| {sg} | {stage} | {t['n']}({t['stones']}) | " + (f"{100 * t['ok'] / dec:.0f}% ({t['ok']}/{dec})" if dec else "—")
                         + f" | {t['bad']} | {t['unk']} | {t['und']} |")
        if tot:
            lines.append(f"| {sg} | **합계** | {tot} | | | | **미정 {100 * und / tot:.1f}%** |")
    lines.append("")
    # d32d 백 대마 — 종국 b18 사석(백) 돌들이 몇 수째 어느 단계에서 '죽음'으로 잡히나
    fin = next((r for r in finals if r["game"].endswith("d32d")), None)
    if fin:
        dead_w = {y * 19 + x for x, y in fin["dead"]}
        lines += ["## d32d 백 대마(종국 b18 사석 38돌) — 수별 코드 판정(단계식)", "", "| 수 | 판 위 해당 돌 | 코드 죽음 | 미정 | 삶 | 주된 단계 | b18 소유권 사석(≥0.5) |", "|---|---|---|---|---|---|---|"]
        first = None
        for r in sorted([r for r in pos if r["game"].endswith("d32d")], key=lambda r: r["n"]):
            b, _ = ce.replay([tuple(m) for m in r["moves"]], r["setup"])
            e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], use_life="staged")
            here = [p for p in dead_w if b[p] == -1]
            if not here:
                continue
            cnt = {"죽음": 0, "미정": 0, "삶": 0}
            stg = {}
            for p in here:
                s_, g_ = e["stages"].get(p, ("?", "?"))
                cnt[s_ if s_ in cnt else "삶"] += 1
                stg[g_] = stg.get(g_, 0) + 1
            b18d = sum(1 for p in here if r["own"][p] >= 0.5)
            main = max(stg, key=stg.get)
            if first is None and cnt["죽음"] >= len(here) / 2:
                first = (r["n"], main)
            if r["n"] % 20 == 0 or r["n"] >= 240 or (first and first[0] == r["n"]):
                lines.append(f"| {r['n']} | {len(here)} | {cnt['죽음']} | {cnt['미정']} | {cnt['삶']} | {main} | {b18d} |")
        lines += ["", f"- 코드가 그 돌들의 과반을 처음 '죽음'으로 잡은 수: **{first[0]}수({first[1]})**" if first else "- 끝까지 과반을 잡지 못함", ""]
    # 종국 사석
    lines += ["## 종국 10판 사석(단계식) — 코드 vs b18 final_status_list dead", "", "| 방 | b18 사석 | 맞음 | 미정(b18 사석) | 놓침 | 헛짚음(코드만 사석) | 코드 집 차 vs b18 |", "|---|---|---|---|---|---|---|"]
    for r in finals:
        e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], use_life="staged")
        bd = {y * 19 + x for x, y in r["dead"]}
        cd, cu = set(e["dead"]), set(e["undecided"])
        lines.append(f"| {r['game'][-4:]} | {len(bd)} | {len(bd & cd)} | {len(bd & cu)} | {len(bd - cd - cu)} | {len(cd - bd)} | {e['lead']:+.1f} vs {r['kata']} |")
    lines.append("")
    # d32d 그래프
    d = sorted([r for r in pos if r["game"].endswith("d32d")], key=lambda r: r["n"])
    pts = []
    for r in d:
        e = ce.evaluate([tuple(m) for m in r["moves"]], r["setup"], r["komi"], use_life="staged")
        b, _ = ce.replay([tuple(m) for m in r["moves"]], r["setup"])
        w_dead_b18 = sum(1 for i in range(361) if b[i] == -1 and r["own"][i] >= 0.5)
        w_dead_code = sum(1 for i in e["dead"] if b[i] == -1)
        w_und = sum(1 for i in e["undecided"] if b[i] == -1)
        pts.append((r["n"], r["lead"], e["lead"], w_dead_b18, w_dead_code, w_und))
    if pts:
        open(os.path.join(outdir, "d32d.svg"), "w", encoding="utf-8").write(svg(pts))
        lines += ["## d32d(작가님 4점 vs v3, B+83.5) — 백 대마 사망 추적", "", "| 수 | b18 집 차 | 코드 집 차 | 백 사석 b18(소유≥0.5) | 백 사석 코드 | 백 미정 코드 |", "|---|---|---|---|---|---|"]
        lines += [f"| {n} | {a:+.1f} | {c:+.1f} | {x} | {y} | {z} |" for n, a, c, x, y, z in pts if n % 20 == 0 or n >= 240]
        lines.append("")
    open(os.path.join(outdir, "TABLE.md"), "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines))


def svg(pts):
    W, Hh, L, R, T, B = 760, 360, 50, 20, 20, 40
    xs = [p[0] for p in pts]
    x0, x1 = min(xs), max(xs)
    ymin = min(min(p[1], p[2]) for p in pts) - 5
    ymax = max(max(p[1], p[2]) for p in pts) + 5
    dmax = max(max(p[3], p[4] + p[5]) for p in pts) + 5
    X = lambda n: L + (n - x0) / max(1, x1 - x0) * (W - L - R)
    Y = lambda v: T + (ymax - v) / (ymax - ymin) * (Hh - T - B)
    D = lambda v: Hh - B - v / dmax * (Hh - T - B) * 0.45
    poly = lambda k, f: " ".join(f"{X(p[0]):.1f},{f(p[k]):.1f}" for p in pts)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{Hh}" font-family="sans-serif" font-size="12">',
           f'<rect width="{W}" height="{Hh}" fill="#fff"/>',
           f'<line x1="{L}" y1="{Y(0):.1f}" x2="{W - R}" y2="{Y(0):.1f}" stroke="#bbb"/>']
    for p in pts:  # 백 사석 막대(아래): 회색 = b18, 주황 = 코드 사석, 연주황 = 코드 미정
        out.append(f'<rect x="{X(p[0]) - 3:.1f}" y="{D(p[3]):.1f}" width="3" height="{Hh - B - D(p[3]):.1f}" fill="#999"/>')
        out.append(f'<rect x="{X(p[0]):.1f}" y="{D(p[4]):.1f}" width="3" height="{Hh - B - D(p[4]):.1f}" fill="#e67e22"/>')
        out.append(f'<rect x="{X(p[0]):.1f}" y="{D(p[4] + p[5]):.1f}" width="3" height="{D(p[4]) - D(p[4] + p[5]):.1f}" fill="#f5c08a"/>')
    out.append(f'<polyline fill="none" stroke="#1f4e9c" stroke-width="2" points="{poly(1, Y)}"/>')
    out.append(f'<polyline fill="none" stroke="#c0392b" stroke-width="2" stroke-dasharray="5 3" points="{poly(2, Y)}"/>')
    for v in range(int(ymin // 20 * 20), int(ymax) + 1, 20):
        out.append(f'<text x="{L - 6}" y="{Y(v) + 4:.1f}" text-anchor="end">{v:+d}</text>')
    for n in range(0, x1 + 1, 50):
        if n >= x0:
            out.append(f'<text x="{X(n):.1f}" y="{Hh - B + 16}" text-anchor="middle">{n}</text>')
    out.append(f'<text x="{L}" y="14">흑 기준 집 차 — 파랑 b18 · 빨강 점선 코드 | 막대: 백 사석 수 회색 b18 · 주황 코드 사석 · 연주황 코드 미정 (x = 수)</text>')
    out.append("</svg>")
    return "\n".join(out)


if __name__ == "__main__":
    main()
