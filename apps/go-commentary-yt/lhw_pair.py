#!/usr/bin/env python3
"""이현욱 영상 대화록 ↔ 판 국면 짝 맞춤 (PF_GO, 11-07 막내2)
  lhw_pair.py 폴더 [영상id]  → 폴더/pairs.jsonl (문장 1행) + 폴더/pairs.md (사람이 읽는 표)
자막: 유튜브 공개 자동 자막(json3, 폴더/subs.ko.json3) → 낱말 시각으로 문장 끊기(sentences: 종결 어미·1.6초 쉼·70자) → 교정 사전 lexicon_v1(correct_bot.correct).
짝: 문장 [시작, 끝] 동안의 판 — 시작 시각 국면(실전 몇 수째 · 변화도 몇 수째) + 그 사이 사건(실전 착수·변화도 놓기/무르기·실전 앞뒤 이동) + 끝 시각 판 361자.
행 칸(막내1 해설 장면 사전 v0과 합칠 수 있게 — 문장·시각·국면·사건):
  id, commentator, source, t_start, t_end, text, text_auto, fixes,
  pos {mv: 실전 수 번호(영상 첫 국면 다음 수 = 1), last: 직전 실전 수, var: 변화도 id 또는 null, var_n: 변화도 몇 수째, var_base_mv},
  events [{t, kind: 실전|변화도|무르기|이동, s, n?, n_low?(이 돌의 번호 추론이 모호 — 돌·자리는 맞고 번호만 틀릴 수 있다)}], board_end (361자 .bw, 19행 위→아래·A→T), region (사건 돌이 모인 귀·변)
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import correct_bot  # noqa: E402  segments·correct 재사용
from board_events import region  # noqa: E402

COL = "ABCDEFGHJKLMNOPQRST"


def kof(s):
    return (19 - int(s[1:])) * 19 + COL.index(s[0])


def mmss(t):
    return f"{int(t) // 60:02d}:{int(t) % 60:02d}"


END = ("요", "다", "죠", "니다", "까", "네", "군요", "거든요")


def sentences(f, gap=1.6, maxlen=70, minlen=14):
    """자동 자막 낱말 시각(tOffsetMs) → 문장: 종결 어미(요·다·죠·까…)에서 끊고(10자↑), 1.6초↑ 쉼·70자에서도 끊는다.
    자동 자막엔 마침표가 없어 correct_bot.segments(1.2초 쉼)로는 한 구간이 ~20초가 된다(11-07 실측 56구간)."""
    ws = []
    for e in json.loads(Path(f).read_text()).get("events", []):
        for sg in e.get("segs") or []:
            w = sg.get("utf8", "").strip()
            if w:
                ws.append(((e.get("tStartMs", 0) + sg.get("tOffsetMs", 0)) / 1000, w))
    ws.sort(key=lambda x: x[0])
    out, cur = [], None
    for i, (t, w) in enumerate(ws):
        if cur is None:
            cur = {"t_start": t, "t_end": t, "text": w}
        else:
            cur["text"] += " " + w; cur["t_end"] = t
        nxt = ws[i + 1][0] if i + 1 < len(ws) else None
        n = len(cur["text"].replace(" ", ""))
        if nxt is None or nxt - t >= gap or n >= maxlen or (n >= minlen and w.endswith(END)):
            cur["t_end"] = min(nxt, t + 1.0) if nxt else t + 1.0  # 마지막 낱말 끝 ≈ 다음 낱말 시작(최대 1초)
            out.append(cur); cur = None
    return out


def run(d, vid=None):
    d = Path(d); vid = vid or d.name
    ev = json.loads((d / "events.json").read_text())
    st = {s["t"]: s for s in json.loads((d / "states.json").read_text())}
    tl = {x["t"]: x for x in ev["timeline"]}
    T = sorted(tl)
    main = {m["no"]: m for m in ev["main"]}
    V = {v["id"]: v for v in ev["vars"]}
    evs = []  # 시간순 사건
    for m in ev["main"]:
        if m["t"] is not None:
            evs.append({"t": m["t"], "kind": "실전", "s": m["s"], "n": m["no"]})
    for v in ev["vars"]:
        for s in v["steps"]:
            for nb in s["back"]:
                evs.append({"t": s["t"], "kind": "무르기", "n": nb, "var": v["id"]})
            for a in s["add"]:
                evs.append({"t": s["t"], "kind": "변화도", "s": a["s"], "n": a["n"], "var": v["id"]} | ({"n_low": True} if a.get("n_low") else {}))
    for x in ev["navs"]:
        if x.get("branch_drop"):
            continue
        evs.append({"t": x["t"], "kind": "이동", "s": f"{x['from_mv']}→{x['to_mv']}수"})
    evs.sort(key=lambda e: e["t"])

    def at(t):
        k = max((x for x in T if x <= t), default=T[0])
        return tl[k]

    segs = sentences(next(d.glob("*.json3")))
    rows = []
    for sg in segs:
        a, b = sg["t_start"], sg["t_end"]
        txt, fixes = correct_bot.correct(sg["text"])
        x = at(a)
        mv = x["mv"]
        pos = {"mv": mv, "last": main[mv]["s"] if mv in main else None, "var": x.get("var"), "var_n": x.get("vn") if x.get("var") else None,
               "var_base_mv": V[x["var"]]["base_mv"] if x.get("var") else None}
        e_in = [e for e in evs if a - 0.5 <= e["t"] <= b + 0.5]
        ks = [kof(e["s"][1:]) for e in e_in if e["kind"] in ("실전", "변화도")]
        tb = max((t for t in st if t <= b and st[t]["vis"]), default=None)
        rows.append({"id": vid, "commentator": "이현욱", "source": "lhw_personal", "t_start": round(a, 2), "t_end": round(b, 2),
                     "text": txt, "text_auto": sg["text"], "fixes": fixes, "pos": pos,
                     "events": [{k: v for k, v in e.items() if k != "var"} | ({"var": e["var"]} if "var" in e else {}) for e in e_in],
                     "board_end": st[tb]["g"].lower() if tb is not None else None, "region": region(ks) if ks else None})
    with open(d / "pairs.jsonl", "w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    # 사람이 읽는 표
    L = [f"# {vid} 대화록 ↔ 판 국면 짝 (문장 {len(rows)})", "", "| 시각 | 문장(교정) | 국면 | 놓인 돌(그 문장 동안) |", "|---|---|---|---|"]
    for r in rows:
        p = r["pos"]
        g = f"실전 {p['mv']}수({p['last'] or '-'})" + (f" · 변화도 {p['var']}의 {p['var_n']}수째" if p["var"] else "")
        es = " ".join((f"{e['n']}.{e['s']}" if e["kind"] == "변화도" else f"[실전{e['n']}]{e['s']}" if e["kind"] == "실전" else
                       f"(무르기{e['n']})" if e["kind"] == "무르기" else f"(이동 {e['s']})") for e in r["events"])
        L.append(f"| {mmss(r['t_start'])} | {r['text'].replace('|', '/')} | {g} | {es} |")
    (d / "pairs.md").write_text("\n".join(L) + "\n")
    n_ev = sum(1 for r in rows if r["events"])
    print(f"{d.name}: 문장 {len(rows)} · 사건 있는 문장 {n_ev} · 변화도 중 문장 {sum(1 for r in rows if r['pos']['var'])} · 교정 {sum(len(r['fixes']) for r in rows)}")
    return rows


if __name__ == "__main__":
    run(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
