#!/usr/bin/env python3
"""이현욱 영상 대화록 ↔ 판 국면 짝 맞춤 (PF_GO, 11-07 막내2)
  lhw_pair.py 폴더 [영상id]  → 폴더/pairs.jsonl (문장 1행) + 폴더/pairs.md (사람이 읽는 표)
자막: 유튜브 공개 자동 자막(json3) → 낱말 시각으로 문장 끊기(sentences: 종결 어미·1.6초 쉼·70자) → 교정 사전 lexicon_v1 + lexicon_lhw(이현욱 보강).
짝: 문장 [시작, 끝] 동안의 판 — 시작 시각 국면(실제 몇 수째 · 변화도 몇 수째) + 그 사이 사건 + 끝 시각 판 361자.
행 = {"utterance": 발화, "go_scene": 판 장면} (막내1 발화 DB의 utterance·go_scene에 맞춘 두 묶음, 1:1 — scene_id로 잇는다)
  utterance: utt_id, video_id, commentator, source, t_start, t_end, text(교정), text_raw(자동 자막), fixes[[원, 교정]], asr, scene_id
  go_scene : scene_id, video_id, t, move_no(실제 수 번호 — 이 문장 시작 때 판에 놓인 마지막 실전 수), move_no_basis(sgf|empty_start|stones_lower_bound),
             last_move("흑Q16"), to_play(b|w), var{id, n(몇 수째), base_move_no, seq[...]}|null,
             events[{t, kind 실전|변화도|무르기|이동, s, n(변화도 번호) 또는 move_no(실전), n_low?}], board(361자 .bw, 19행 위→아래·A→T), region
수 번호: lhw_sgf.py align 결과(sgf_align.json ok)면 기보 offset + 영상 수 / 영상이 빈 판에서 시작하면 그대로(정확) / 중반 시작이면 첫 국면 돌 수 + 영상 수(따낸 돌만큼 실제보다 작다 — 하한).
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import correct_bot  # noqa: E402  correct(lexicon_v1) 재사용
from lexicon_lhw import apply_rules  # noqa: E402

LHW_RULES = [(k["from"], k["to"], k["pre"]) for k in json.loads((Path.home() / ".monkos" / "go-commentary-yt" / "answers" / "lexicon_lhw.json").read_text())["rules"]]


def correct(text):
    """lexicon_v1 → lexicon_lhw(이현욱 보강) 차례로. fixes = [[원 어절, 교정 어절]]."""
    t1, fixes = correct_bot.correct(text)
    out = []
    for w in t1.split():
        w2, n = apply_rules(w, LHW_RULES)
        if n:
            fixes.append([w, w2])
        out.append(w2)
    return " ".join(out), fixes
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


def offset_of(d, ev):
    """→ (offset, basis). 실제 수 번호 = offset + 영상 수 번호."""
    sa = d / "sgf_align.json"
    if sa.exists():
        j = json.loads(sa.read_text())
        if j.get("ok"):
            return j["offset"], "sgf"
    if ev.get("start_stones", 0) == 0:
        return 0, "empty_start"
    n_pre = sum(1 for m in ev["main"] if m["how"] == "prepend")
    return ev["start_stones"] - n_pre, "stones_lower_bound"


def run(d, vid=None):
    d = Path(d); vid = vid or d.name
    ev = json.loads((d / "events.json").read_text())
    st = {s["t"]: s for s in json.loads((d / "states.json").read_text())}
    tl = {x["t"]: x for x in ev["timeline"]}
    T = sorted(tl)
    main = {m["no"]: m for m in ev["main"]}
    V = {v["id"]: v for v in ev["vars"]}
    off, basis = offset_of(d, ev)
    evs = []  # 시간순 사건
    for m in ev["main"]:
        if m["t"] is not None:
            evs.append({"t": m["t"], "kind": "실전", "s": m["s"], "move_no": off + m["no"]})
    for v in ev["vars"]:
        for s in v["steps"]:
            for nb in s["back"]:
                evs.append({"t": s["t"], "kind": "무르기", "n": nb, "var": v["id"]})
            for a in s["add"]:
                evs.append({"t": s["t"], "kind": "변화도", "s": a["s"], "n": a["n"], "var": v["id"]} | ({"n_low": True} if a.get("n_low") else {}))
    for x in ev["navs"]:
        if x.get("branch_drop"):
            continue
        evs.append({"t": x["t"], "kind": "이동", "s": f"{off + x['from_mv']}→{off + x['to_mv']}수"})
    evs.sort(key=lambda e: e["t"])

    def at(t):
        k = max((x for x in T if x <= t), default=T[0])
        return tl[k]

    def var_seq(vid_, t):
        path = []
        for s in V[vid_]["steps"]:
            if s["t"] > t:
                break
            del path[len(path) - len(s["back"]):]
            path += [a["s"] for a in s["add"]]
        return path

    segs = sentences(next(d.glob("*.json3")))
    rows = []
    for i, sg in enumerate(segs):
        a, b = sg["t_start"], sg["t_end"]
        txt, fixes = correct(sg["text"])
        x = at(a)
        mv = x["mv"]
        last = main[mv]["s"] if mv in main else None
        sid = f"{vid}:{i:04d}"
        var = None
        if x.get("var"):
            var = {"id": x["var"], "n": x.get("vn"), "base_move_no": off + V[x["var"]]["base_mv"], "seq": var_seq(x["var"], a)}
        e_in = [e for e in evs if a - 0.5 <= e["t"] <= b + 0.5]
        ks = [kof(e["s"][1:]) for e in e_in if e["kind"] in ("실전", "변화도")]
        tb = max((t for t in st if t <= b and st[t]["vis"]), default=None)
        utt = {"utt_id": sid, "video_id": vid, "commentator": "이현욱", "source": "lhw_personal", "t_start": round(a, 2), "t_end": round(b, 2),
               "text": txt, "text_raw": sg["text"], "fixes": fixes, "asr": "youtube_auto+lexicon_v1+lexicon_lhw", "scene_id": sid}
        scn = {"scene_id": sid, "video_id": vid, "t": round(a, 2), "move_no": off + mv, "move_no_basis": basis, "last_move": last,
               "to_play": ("w" if last[0] == "흑" else "b") if last else None, "var": var,
               "events": [{k: v for k, v in e.items() if k != "var"} for e in e_in],
               "board": st[tb]["g"].lower() if tb is not None else None, "region": region(ks) if ks else None}
        rows.append({"utterance": utt, "go_scene": scn})
    with open(d / "pairs.jsonl", "w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    # 사람이 읽는 표
    L = [f"# {vid} 대화록 ↔ 판 국면 짝 (문장 {len(rows)}, 수 번호 기준 {basis}{'' if basis != 'stones_lower_bound' else ' — 하한'})", "",
         "| 시각 | 문장(교정) | 국면 | 놓인 돌(그 문장 동안) |", "|---|---|---|---|"]
    for r in rows:
        u, g_ = r["utterance"], r["go_scene"]
        g = f"{g_['move_no']}수({g_['last_move'] or '-'})" + (f" · 변화도 {g_['var']['id']}의 {g_['var']['n']}수째" if g_["var"] else "")
        es = " ".join((f"{e['n']}.{e['s']}" if e["kind"] == "변화도" else f"[{e['move_no']}수]{e['s']}" if e["kind"] == "실전" else
                       f"(무르기{e['n']})" if e["kind"] == "무르기" else f"(이동 {e['s']})") for e in g_["events"])
        L.append(f"| {mmss(u['t_start'])} | {u['text'].replace('|', '/')} | {g} | {es} |")
    (d / "pairs.md").write_text("\n".join(L) + "\n")
    print(f"{d.name}: 문장 {len(rows)} · 사건 있는 문장 {sum(1 for r in rows if r['go_scene']['events'])} · 변화도 중 {sum(1 for r in rows if r['go_scene']['var'])} · 교정 {sum(len(r['utterance']['fixes']) for r in rows)} · 수 번호 {basis}(+{off})")
    return rows


if __name__ == "__main__":
    run(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
