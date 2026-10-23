"""단판 리뷰 — SGF 1판의 한쪽 수를 분석해 실수 상위 N + 승부처 + 잘 둔 수를 해설 1장으로.

  python3 review.py GAME.sgf OUT.html [--sgf OUT.sgf] [--color B] [--top 5] [--model haiku]

중간 산출물은 OUT.html 옆 {stem}_work/ 에 둔다 (레포 밖 경로 권장 — 개인 대국은 커밋 금지).
파이프라인은 파일럿과 같다: analyze(스캔·정밀) → facts(F1~F9) → 교사 → verify.
"""
import argparse
import html
import json
import os
import re
import subprocess
import time

import analyze
from analyze import Engine, base_query
from board import N, COLS, gtp_to_xy, region
from facts import extract, board_at, KO, CO_BEST
from sheet import svg_board
from verify import check
from teacher import WORKDIR

SYSTEM = """너는 바둑 해설가다. 판을 직접 보지 않는다. 주어진 '사실 목록'만 말로 옮긴다.
규칙:
- 사실 목록에 없는 수치·좌표·그룹·수순을 만들지 않는다. 추측·일반론으로 빈칸을 채우지 않는다.
- 모든 문장 끝에 근거 사실 ID를 대괄호로 붙인다. 예: "여기서 6.2집을 잃었어요. [F1]" / 여러 개면 [F1,F3].
- 숫자는 사실에 나온 값 그대로 쓴다(반올림 금지). 좌표도 사실에 나온 표기 그대로.
- 아마 = 급수 아마추어용 3~4문장: 무엇이 문제였는지(또는 왜 좋았는지)와 어디를 뒀어야 했는지.
- 유단 = 유단자용 한 문장: 수순·급함과 큼·그룹 상태 중 핵심 하나.
- 출력은 JSON 하나만: {"아마": ["문장", ...], "유단": ["문장"]}. 코드 블록·설명 금지."""


def load_sgf(path):
    s = open(path, encoding="utf-8").read()
    komi = float(re.search(r"KM\[([^\]]*)\]", s).group(1)) if "KM[" in s else 6.5
    moves = []
    for c, xy in re.findall(r";\s*([BW])\[([a-s]{0,2})\]", s):
        moves.append([c, "pass" if not xy else f"{COLS[ord(xy[0]) - 97]}{N - (ord(xy[1]) - 97)}"])
    meta = {k: (re.search(k + r"\[([^\]]*)\]", s).group(1) if k + "[" in s else "") for k in ("PB", "PW", "DT")}
    return {"id": os.path.basename(path), "moves": moves, "komi": komi, "rules": "korean", "meta": meta}


def scan(eng, gm):
    q = base_query(gm, "scan")
    q["analyzeTurns"] = list(range(len(gm["moves"]) + 1))
    q["maxVisits"] = analyze.SCAN_VISITS
    rs = sorted(eng.ask(q, len(q["analyzeTurns"])), key=lambda r: r["turnNumber"])
    return [{"lead": r["rootInfo"]["scoreLead"], "winrate": r["rootInfo"]["winrate"],
             "best": r["moveInfos"][0]["move"],
             "gap2": (r["moveInfos"][0]["scoreLead"] - r["moveInfos"][1]["scoreLead"]) if len(r["moveInfos"]) > 1 else 0}
            for r in rs]


def pick(gm, t, color, top, wr_range=None, min_loss=analyze.MIN_LOSS):
    """wr_range=(lo, hi): 실수·승부처 후보를 둔 쪽의 착수 전 승률이 이 구간 안인 수로 제한 (None = 전 구간)."""
    sign = 1 if color == "B" else -1
    rows = []
    for i, (c, mv) in enumerate(gm["moves"]):
        if c != color or mv == "pass":
            continue
        wr_b = t[i]["winrate"] if color == "B" else 1 - t[i]["winrate"]
        wr_a = t[i + 1]["winrate"] if color == "B" else 1 - t[i + 1]["winrate"]
        rows.append({"game": gm["id"], "move_index": i, "move_number": i + 1, "color": c, "move": mv,
                     "best": t[i]["best"], "loss_scan": round(sign * (t[i]["lead"] - t[i + 1]["lead"]), 2),
                     "wr_before": round(wr_b, 3), "wr_drop": round(wr_b - wr_a, 3),
                     "gap2": round(sign * t[i]["gap2"], 2)})
    cand = rows if wr_range is None else [r for r in rows if wr_range[0] <= r["wr_before"] <= wr_range[1]]
    mistakes = []
    for r in sorted(cand, key=lambda r: -r["loss_scan"]):
        if r["loss_scan"] < min_loss:
            break
        if r["move"] != r["best"] and all(abs(r["move_index"] - m["move_index"]) >= 4 for m in mistakes):
            mistakes.append(dict(r, kind="실수"))
        if len(mistakes) == top * 2:  # 정밀 분석 재판정으로 탈락할 몫까지 여유 선발
            break
    # 승부처 = 승률 하락이 가장 큰 수. 실수 상위와 겹치면 그 국면에 표시만 한다
    picked = mistakes[:]
    if cand:
        turn = max(cand, key=lambda r: r["wr_drop"])
        hit = next((m for m in picked if m["move_index"] == turn["move_index"]), None)
        if hit:
            hit["kind"] = "실수 · 승부처"
        else:
            picked.append(dict(turn, kind="승부처"))
    # 잘 둔 수 = 엔진 1순위와 일치 + 차선과의 차이가 가장 큰 수 (유일한 수에 가까울수록 가치).
    # 정밀 분석에서 1순위가 바뀔 수 있어 후보 3개를 올리고 재판정에서 첫 통과 1개만 남긴다
    taken = {m["move_index"] for m in picked}
    good = sorted((r for r in cand if r["move"] == r["best"] and r["move_index"] not in taken),
                  key=lambda r: -r["gap2"])[:3]
    for rank, g in enumerate(good):
        picked.append(dict(g, kind="잘 둔 수", good_rank=rank))
    for k, r in enumerate(picked, 1):
        r["pos_id"] = f"C{k}"  # 임시 — 재판정 후 R 번호를 다시 매긴다
    return picked


def deep_loss(d):
    """정밀 분석 기준 손실 = 최선수 기대 집 − 실제 수 후 기대 집 (둔 쪽 관점)."""
    sign = 1 if d["pos"]["color"] == "B" else -1
    return round(sign * (d["before"]["moveInfos"][0]["scoreLead"] - d["after"]["rootInfo"]["scoreLead"]), 1)


def rejudge(deep, top, min_loss):
    """1차 스캔 선발을 정밀 분석으로 재판정: 최선수 = 실제 수이거나 손실 < min_loss인 '실수'는 제외, 상위 top만."""
    keep, dropped, n, good_done = [], [], 0, False
    order = lambda d: (0, -deep_loss(d)) if "실수" in d["pos"]["kind"] else (1, d["pos"].get("good_rank", 0))
    for d in sorted(deep, key=order):
        p = d["pos"]
        if p["kind"] == "잘 둔 수":
            ok = d["before"]["moveInfos"][0]["move"] == p["move"] and len(d["before"]["moveInfos"]) > 1
            if ok and not good_done:
                good_done = True
                keep.append(d)
            else:
                dropped.append({"move_number": p["move_number"], "move": p["move"], "kind": "잘 둔 수 후보",
                                "reason": "정밀 분석 1순위 아님" if not ok else "후보 중 차순위"})
            continue
        if "실수" in p["kind"]:
            same = d["before"]["moveInfos"][0]["move"] == p["move"]
            loss = deep_loss(d)
            if same or loss < min_loss or n >= top:
                if "승부처" in p["kind"]:  # 승부처는 승률 기준이라 남기되 실수 표기만 뗀다
                    p["kind"] = "승부처"
                    keep.append(d)
                else:
                    dropped.append({"move_number": p["move_number"], "move": p["move"], "deep_loss": loss,
                                    "reason": "최선수와 같음" if same else ("손실 미달" if loss < min_loss else "상위 밖")})
                continue
            n += 1
        keep.append(d)
    keep.sort(key=lambda d: d["pos"]["move_index"])
    for k, d in enumerate(keep, 1):
        d["pos"]["pos_id"] = f"R{k}"
    return keep, dropped


def good_facts(d, gm):
    """잘 둔 수: 실제 수 = 최선수이므로 대조 상대는 엔진 차선."""
    pos, before, after = d["pos"], d["before"], d["after"]
    color, sign = pos["color"], (1 if pos["color"] == "B" else -1)
    best, alt = before["moveInfos"][0], before["moveInfos"][1]
    gap = round(sign * (best["scoreLead"] - alt["scoreLead"]), 1)
    pa, pb = gtp_to_xy(pos["move"]), gtp_to_xy(alt["move"])
    facts = [{"id": "F1", "type": "일치", "text": f"{KO[color]} {pos['move_number']}수 {pos['move']}는 KataGo 1순위 수와 같다. "
              f"차선 {alt['move']}였다면 약 {gap}집 덜 얻었다.", "data": {"gap": gap}},
             {"id": "F2", "type": "착점", "text": f"실제 수 {pos['move']}는 {region(pa)}, 차선 {alt['move']}는 {region(pb)}에 있다.", "data": {}}]
    by = {}
    for y in range(N):
        for x in range(N):
            dv = sign * (best["ownership"][y * N + x] - alt["ownership"][y * N + x])
            by[region((x, y))] = by.get(region((x, y)), 0) + dv
    won = sorted(((r, v) for r, v in by.items() if v >= 1.0), key=lambda t: -t[1])[:2]
    gave = sorted(((r, v) for r, v in by.items() if v <= -1.0), key=lambda t: t[1])[:1]
    txt = ("차선과 비교해 영역별로 이 수가 더 얻은 곳은 " + ", ".join(f"{r}에서 약 {v:.1f}집" for r, v in won) + "이다."
           if won else "차선과의 차이가 한 영역에 몰려 있지 않다.")
    if gave:
        txt += f" 대신 {gave[0][0]}에서는 약 {-gave[0][1]:.1f}집을 내줬다."
    txt += f" 9개 영역을 모두 더한 순이득은 약 {sum(by.values()):.1f}집이다(근사치 — 총 차이는 F1이 정본)."
    facts.append({"id": "F3", "type": "이득 위치", "text": txt + " (소유권 기대값 차이의 집 환산 근사)",
                  "data": {"lost": [], "gained": []}})
    if gap < CO_BEST:
        facts.append({"id": "F10", "type": "공동 최선", "text": f"차선 {alt['move']}와의 기대 집 차이는 {gap}집으로 사실상 같은 수다 — "
                      f"이 수는 '유일한 수'가 아니라 좋은 수 중 하나다.", "data": {}})
    pv = before["moveInfos"][0]["pv"][:5]
    c, seq = color, []
    for m in pv:
        seq.append(f"{KO[c]} {m}")
        c = "W" if c == "B" else "B"
    facts.append({"id": "F5", "type": "이후 수순", "text": f"KataGo 예상 수순: {' → '.join(seq)}.", "data": {}})
    wa = after["rootInfo"]["winrate"] if color == "B" else 1 - after["rootInfo"]["winrate"]
    facts.append({"id": "F8", "type": "승률", "text": f"이 수 뒤 {KO[color]} 승률은 {wa * 100:.0f}%다.", "data": {}})
    facts.append({"id": "F7", "type": "급함 vs 큼", "text": "해당 없음(실수가 아닌 수).", "data": {"kind": "해당 없음"}})
    return {"pos_id": pos["pos_id"], "game": pos["game"], "move_number": pos["move_number"], "color": color,
            "actual": pos["move"], "best": alt["move"], "facts": facts}


def teach(model, fx, kind):
    lines = [f"국면 {fx['pos_id']} ({kind}) — {KO[fx['color']]} {fx['move_number']}수째 {fx['actual']}", "사실 목록:"]
    lines += [f"[{f['id']}] ({f['type']}) {f['text']}" for f in fx["facts"]]
    t = time.time()
    r = subprocess.run(["claude", "-p", "--model", model, "--output-format", "json", "--tools", "",
                        "--strict-mcp-config", "--no-session-persistence", "--system-prompt", SYSTEM],
                       input="\n".join(lines), capture_output=True, text=True, cwd=WORKDIR, timeout=300)
    text = json.loads(r.stdout).get("result", "")
    try:
        out = json.loads(text[text.find("{"): text.rfind("}") + 1])
    except ValueError:
        out = None
    return out, round(time.time() - t, 1)


def render(gm, items, out, model, color):
    esc = lambda s: html.escape(s, quote=True)
    secs = []
    for it in items:
        fx, lv, v = it["fx"], it["levels"], it["verify"]
        body = []
        for name in ("아마", "유단"):
            sents = []
            for s in (lv or {}).get(name, []):
                bad = v.get(s)
                sents.append(f'<span class="fail" title="검증 탈락: {esc(", ".join(bad))}">{esc(re.sub(r"\s*\[[^\]]*\]", "", s))}</span>'
                             if bad else esc(re.sub(r"\s*\[[^\]]*\]", "", s)))
            body.append(f'<h4>{name}</h4><p>{" ".join(sents) or "(생성 실패)"}</p>')
        label = "차선" if it["kind"] == "잘 둔 수" else "최선"
        co = f" (≈ {fx['co_best']}, 어느 쪽도 최선)" if fx.get("co_best") else ""
        f1 = fx["facts"][0]["text"]
        secs.append(f'''<section class="k-{"good" if it["kind"] == "잘 둔 수" else "bad"}"><h2><span class="tag">{esc(it["kind"])}</span> {KO[fx["color"]]} {fx["move_number"]}수 {fx["actual"]} · {label} {fx["best"]}{esc(co)}</h2>
<div class="row"><figure>{svg_board(gm, fx)}<figcaption>✕ 실제 수 {fx["actual"]} · 파란 원 {label}수 {fx["best"]} · 작은 점 직전 수</figcaption></figure>
<div><p class="f1">{esc(f1)}</p>{"".join(body)}<details><summary>근거 사실 {len(fx["facts"])}개</summary><ol>{"".join(f"<li><b>{x['id']}</b> {esc(x['text'])}</li>" for x in fx["facts"])}</ol></details></div></div></section>''')
    m = gm["meta"]
    page = f"""<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>대국 리뷰</title><style>
:root{{--bg:#f7f5f0;--fg:#1d1b18;--mut:#6b655c;--card:#fff;--line:#e3ddd2;--wood:#e2bd7a;--grid:#5a4320;--bad:#c23b2b;--good:#1f7a4d;--badbg:#fbe6e2}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#161513;--fg:#ece7de;--mut:#a39c90;--card:#201e1b;--line:#38342e;--wood:#b8935a;--grid:#3b2b12;--bad:#ff8a7a;--good:#6fd39f;--badbg:#3a1f1b}}}}
:root[data-theme="dark"]{{--bg:#161513;--fg:#ece7de;--mut:#a39c90;--card:#201e1b;--line:#38342e;--wood:#b8935a;--grid:#3b2b12;--bad:#ff8a7a;--good:#6fd39f;--badbg:#3a1f1b}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.65 -apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}}
main{{max-width:1040px;margin:0 auto;padding:24px 16px 60px}}h1{{font-size:22px;margin:0 0 4px}}.sub{{color:var(--mut);margin:0 0 20px;font-size:14px}}
section{{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--bad);border-radius:10px;padding:16px;margin:0 0 18px}}section.k-good{{border-left-color:var(--good)}}
h2{{font-size:17px;margin:0 0 12px}}.tag{{font-size:12px;padding:2px 8px;border-radius:99px;background:var(--badbg);color:var(--bad);margin-right:6px;vertical-align:2px}}.k-good .tag{{color:var(--good);background:transparent;border:1px solid var(--good)}}
.row{{display:grid;grid-template-columns:minmax(220px,360px) 1fr;gap:18px}}figure{{margin:0}}figcaption{{font-size:12px;color:var(--mut)}}
.bd{{width:100%;height:auto;display:block;border-radius:4px}}.ln{{stroke:var(--grid);stroke-width:.8}}.lb{{font-size:8px;fill:var(--grid);text-anchor:middle}}.hs{{fill:var(--grid)}}
.sb{{fill:#111;stroke:#000}}.sw{{fill:#fafafa;stroke:#555;stroke-width:.8}}.lm{{fill:#e33}}.mb{{fill:none;stroke:#1d5fe0;stroke-width:3}}.ma{{stroke:#e0301d;stroke-width:3;stroke-linecap:round}}
.f1{{font-weight:600;margin:0 0 8px}}h4{{margin:10px 0 2px;font-size:12.5px;color:var(--mut)}}h4+p{{margin:0}}details{{margin-top:10px;font-size:13px;color:var(--mut)}}details ol{{padding-left:18px}}
.fail{{background:var(--badbg);color:var(--bad);text-decoration:underline dotted}}
@media (max-width:720px){{.row{{grid-template-columns:1fr}}}}
</style></head><body><main>
<h1>대국 리뷰 — {esc(m.get("PB", ""))}(흑) 대 {esc(m.get("PW", ""))}(백)</h1>
<p class="sub">{esc(m.get("DT", ""))} · {len(gm["moves"])}수 · 덤 {gm["komi"]} · 분석 KataGo b18(OpenCL, 정밀 {analyze.DEEP_VISITS} visits) · 해설 {model} (사실 목록 기반, 검증기 통과) · {KO[color]} 수만 대상 · {esc(m.get("filter", "전 구간"))} · 손실은 KataGo 기대 집 차이</p>
{"".join(secs)}</main></body></html>"""
    open(out, "w").write(page)


def to_sgf_xy(m):
    p = gtp_to_xy(m)
    return "" if p is None else chr(97 + p[0]) + chr(97 + p[1])


def sgf_text(s):
    return s.replace("\\", "\\\\").replace("]", "\\]")


def export_sgf(gm, items, deep, out, model):
    """원본 수순 + 대상 수에 C[] 해설(아마) + 최선수(잘 둔 수는 차선) 변화도."""
    by_idx = {}
    for it, d in zip(items, deep):
        i = d["pos"]["move_index"]
        mi = d["before"]["moveInfos"]
        alt = mi[1] if it["kind"] == "잘 둔 수" else mi[0]
        tag = re.compile(r"\s*\[[^\]]*\]")
        comment = f"[{it['kind']}] {it['fx']['facts'][0]['text']}\n\n" + " ".join(
            tag.sub("", s) for s in (it["levels"] or {}).get("아마", []))
        yudan = " ".join(tag.sub("", s) for s in (it["levels"] or {}).get("유단", []))
        if yudan:
            comment += f"\n\n유단: {yudan}"
        label = "KataGo 차선" if it["kind"] == "잘 둔 수" else "KataGo 최선수"
        by_idx[i] = {"comment": comment, "pv": alt["pv"][:8], "label": f"{label} {alt['move']} 이후 예상 수순"}
    moves = gm["moves"]

    def node(c, m, extra=""):
        return f";{c}[{to_sgf_xy(m)}]{extra}"

    def line(i):
        out_ = []
        while i < len(moves):
            c, m = moves[i]
            if i in by_idx:
                b = by_idx[i]
                main_ = node(c, m, f"C[{sgf_text(b['comment'])}]") + line(i + 1)
                var, cc = [], c
                for k, pm in enumerate(b["pv"]):
                    var.append(node(cc, pm, f"C[{sgf_text(b['label'])}]" if k == 0 else ""))
                    cc = "W" if cc == "B" else "B"
                out_.append(f"({main_})({''.join(var)})")
                return "".join(out_)
            out_.append(node(c, m))
            i += 1
        return "".join(out_)

    m = gm["meta"]
    head = (f";GM[1]FF[4]CA[UTF-8]SZ[19]KM[{gm['komi']}]PB[{sgf_text(m.get('PB', ''))}]PW[{sgf_text(m.get('PW', ''))}]"
            f"DT[{m.get('DT', '')}]GC[{sgf_text(f'KataGo b18 분석 + {model} 해설 (사실 목록 기반, 검증기 통과). 해설은 해당 수 코멘트, 최선수는 변화도.')}]")
    open(out, "w", encoding="utf-8").write(f"({head}{line(0)})\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("game", help="입력 SGF")
    ap.add_argument("out")
    ap.add_argument("--color", default="B")
    ap.add_argument("--top", type=int, default=5)
    ap.add_argument("--model", default="haiku")
    ap.add_argument("--sgf", dest="sgf_out", help="해설 코멘트 + 최선수 변화도 SGF 출력 경로")
    ap.add_argument("--min-loss", type=float, default=analyze.MIN_LOSS, help="실수로 볼 최소 손실(집, 기본 2.0)")
    ap.add_argument("--wr-range", default="0.03,0.97",
                    help="실수·승부처를 둔 쪽 착수 전 승률이 이 구간인 수로 제한 (기본 0.03,0.97 = 승부가 살아 있는 구간, off = 전 구간)")
    a = ap.parse_args()
    work = os.path.splitext(a.out)[0] + "_work"
    os.makedirs(work, exist_ok=True)
    os.makedirs(WORKDIR, exist_ok=True)
    wr_range = None
    if a.wr_range and a.wr_range.lower() != "off":
        lo, hi = (float(x) for x in a.wr_range.split(","))
        if not 0 <= lo < hi <= 1:
            ap.error("--wr-range는 0 ≤ lo < hi ≤ 1")
        wr_range = (lo, hi)
    gm = load_sgf(a.game)
    gm["meta"]["filter"] = f"착수 전 승률 {lo * 100:g}~{hi * 100:g}% 구간 실수만" if wr_range else "전 구간"
    eng = Engine()
    try:
        t = scan(eng, gm)
        picked = pick(gm, t, a.color, a.top, wr_range, a.min_loss)
        deep = [analyze.deep(eng, gm, c) for c in picked]
    finally:
        eng.close()
    deep, dropped = rejudge(deep, a.top, a.min_loss)
    for x in dropped:
        print("재판정 제외:", x, flush=True)
    json.dump({"scan": t, "picked": picked, "dropped": dropped}, open(os.path.join(work, "scan.json"), "w"),
              ensure_ascii=False)
    json.dump(deep, open(os.path.join(work, "deep.json"), "w"))
    items = []
    for d in deep:
        kind = d["pos"]["kind"]
        fx = good_facts(d, gm) if kind == "잘 둔 수" else extract(d, gm)
        levels, secs = teach(a.model, fx, kind)
        facts = {x["id"]: x["text"] for x in fx["facts"]}
        dd = {x["id"]: x["data"] for x in fx["facts"]}
        sem = {"f3": {r: v for r, v in dd["F3"]["lost"] + dd["F3"]["gained"]}, "f7": dd["F7"]["kind"]}
        header = f"{fx['move_number']} {fx['actual']} {fx['best']}"
        ver = {}
        for s in sum((levels or {}).values(), []):
            hard, _ = check(s, facts, header, sem)
            if hard:
                ver[s] = hard
        items.append({"fx": fx, "kind": kind, "levels": levels, "verify": ver, "teach_secs": secs})
        n = len(sum((levels or {}).values(), []))
        print(fx["pos_id"], kind, fx["move_number"], fx["actual"], "→", fx["best"],
              fx["facts"][0]["text"][:50], f"| 문장 {n} 탈락 {len(ver)} | {secs}s", flush=True)
    json.dump(items, open(os.path.join(work, "items.json"), "w"), ensure_ascii=False, indent=1)
    render(gm, items, a.out, a.model, a.color)
    print("→", a.out)
    if a.sgf_out:
        export_sgf(gm, items, deep, a.sgf_out, a.model)
        print("→", a.sgf_out)


if __name__ == "__main__":
    main()
