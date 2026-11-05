#!/usr/bin/env python3
"""판 상태열 → 판 그리기 사건(놓기 순서·몇 수 앞·지우는 시점·실전 복귀·표시) → Flash 장면 board_draw 채우기 (PF_GO, 11-06 B안 2항, 무료)
  board_events.py ID 시작초      (answers/{ID}/frames_{시작초}/board_states.json 필요)
  → answers/{ID}/board_events_{시작초}.json + answers/{ID}/flash_*/scenes_board.json(장면 행 + board_draw_local)
판정(표시 방식 무관 — 바둑TV 빨간 세모·개인 채널 번호 돌 모두): 점마다 같은 색 돌이 '있는 구간'을 뽑고,
  구간 시작 = 창 시작 이후 · 끝 = 창 끝 이전 · 길이 < 10분 → 변화도 돌(해설자가 놓고 지운 돌). 창 끝까지 남는 돌 = 실전.
  시간이 겹치는(간격 ≤ 4초) 변화도 돌 묶음 = 사건 1건. 사건 끝 시점의 판 = 실전 판이면 '실전 복귀'.
  표시 = 실전 돌 위 대문자(빨간 세모·숫자)가 2개↑인 프레임 구간(착수 표시 1개는 제외).
"""
import json, re, sys
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
COL = "ABCDEFGHJKLMNOPQRST"
STEP = 2
MAXVAR = 600
GAP = 4


def coord(k):
    return f"{COL[k % 19]}{19 - k // 19}"


def region(ks):
    xs = [k % 19 for k in ks]; ys = [k // 19 for k in ks]
    cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
    h = "좌" if cx < 6.5 else ("우" if cx > 11.5 else "")
    v = "상" if cy < 6.5 else ("하" if cy > 11.5 else "")
    if h and v:
        return f"{h}{v}귀"
    if v:
        return f"{v}변"
    if h:
        return f"{h}변"
    return "중앙"


def mmss(t):
    return f"{int(t) // 60:02d}:{int(t) % 60:02d}"


def occluded(states):
    """사람·팔이 판을 가린 프레임: (흑 수 − 백 수)가 앞뒤 60초 중앙값보다 5↑ 많다(어두운 옷 = 흑으로 읽힘, 변화도는 흑백이 번갈아 늘어난다). 11-06 ZmmV 실물 자석판."""
    d = [(s["grid"].lower().count("b") - s["grid"].lower().count("w")) if s["grid"] else None for s in states]
    out = set()
    for i, v in enumerate(d):
        if v is None:
            continue
        nb = sorted(x for x in d[max(0, i - 15):i + 16] if x is not None)
        if v - nb[len(nb) // 2] >= 5:
            out.add(i)
    return out


def smooth(states):
    """점마다 앞뒤 1프레임 다수결(커서·깜빡임 제거). 판 안 보이거나 가린 프레임은 뺀다."""
    occ = occluded(states)
    vis = [s for i, s in enumerate(states) if s["grid"] and i not in occ]
    out = []
    for i, s in enumerate(vis):
        g = []
        for k in range(361):
            win = [vis[j]["grid"][k] for j in (i - 1, i, i + 1) if 0 <= j < len(vis)]
            low = [c.lower() for c in win]
            best = max(set(low), key=low.count)
            cur = s["grid"][k]
            g.append(cur if cur.lower() == best else best)
        out.append({"t": s["t"], "grid": "".join(g)})
    return out


def intervals(st):
    """(점, 색) → [(시작, 끝)] — 끝은 마지막으로 보인 프레임 시각."""
    iv, open_ = {}, {}
    for s in st:
        for k, ch in enumerate(s["grid"]):
            c = ch.lower()
            for col in "bw":
                key = (k, col)
                if c == col:
                    open_.setdefault(key, [s["t"], s["t"]])[1] = s["t"]
                elif key in open_:
                    iv.setdefault(key, []).append(tuple(open_.pop(key)))
    for key, v in open_.items():
        iv.setdefault(key, []).append(tuple(v))
    return iv


def events(vid, s0):
    raw = json.loads((B / vid / f"frames_{s0}" / "board_states.json").read_text())
    st = smooth(raw)
    if not st:
        return {"id": vid, "s0": s0, "events": [], "marks": [], "visible": 0}
    t_first, t_last = st[0]["t"], st[-1]["t"]
    iv = intervals(st)
    var = []
    span_all = max(STEP, t_last - t_first)
    for (k, col), spans in iv.items():
        # 깜빡임 이음: 같은 점·색이 6초 이하로 끊겼다 이어지면 한 구간(입체 그림자·커서로 실전 돌이 잠깐 안 읽히는 경우, 11-06 G4·H2 실측)
        merged = []
        for a, b in sorted(spans):
            if merged and a - merged[-1][1] <= 6:
                merged[-1][1] = b
            else:
                merged.append([a, b])
        iv[(k, col)] = [tuple(x) for x in merged]
        if sum(b - a + STEP for a, b in merged) / span_all > 0.4:
            continue  # 창의 40%↑ 있는 돌 = 실전
        for a, b in merged:
            if a > t_first and b < t_last and b - a < MAXVAR and b - a >= STEP:
                var.append({"k": k, "c": col, "a": a, "b": b + STEP})
    var.sort(key=lambda v: (v["a"], v["k"]))
    # 사건 = 판 위에 변화도 돌이 하나라도 있는 연속 구간(빈 판으로 돌아온 틈이 GAP 이하면 이어 본다)
    on = sorted({s["t"] for s in st if any(v["a"] <= s["t"] < v["b"] for v in var)})
    runs = []
    for t in on:
        if runs and t - runs[-1][1] <= GAP + STEP:
            runs[-1][1] = t
        else:
            runs.append([t, t])
    eps = [{"start": a, "end": b + STEP, "stones": [v for v in var if a <= v["a"] <= b]} for a, b in runs]
    eps = [e for e in eps if e["stones"]]
    by_t = {s["t"]: s["grid"] for s in st}
    real_at = lambda t: {(k, c) for (k, c), spans in iv.items() for a, b in spans if a <= t <= b and not any(
        x["k"] == k and x["c"] == c and x["a"] <= t < x["b"] for x in var)}
    out = []
    for e in eps:
        seq = sorted(e["stones"], key=lambda v: (v["a"], v["k"]))
        steps, cur = [], None
        for v in seq:
            if cur is None or v["a"] != cur:
                steps.append([]); cur = v["a"]
            steps[-1].append(v)
        after = min((t for t in by_t if t >= e["end"]), default=None)
        back = None
        if after is not None:
            now = {(k, ch.lower()) for k, ch in enumerate(by_t[after]) if ch != "."}
            back = now == real_at(after)
        erase_mid = sorted({v["b"] for v in seq if v["b"] < e["end"] - GAP})
        out.append({"start": e["start"] + s0, "end": e["end"] + s0, "n": len(seq), "region": region([v["k"] for v in seq]),
                    "regions": sorted({region([v["k"]]) for v in seq}),
                    "seq": [[f"{'흑' if v['c'] == 'b' else '백'}{coord(v['k'])}" for v in stp] for stp in steps],
                    "erase_mid": [t + s0 for t in erase_mid], "back_to_real": back})
    marks, run = [], None
    for s in st:
        n = sum(1 for k, ch in enumerate(s["grid"]) if ch in "BW" and not any(x["k"] == k and x["a"] <= s["t"] < x["b"] for x in var))
        if 2 <= n <= 12:  # 13↑ = 광택 반사·숫자판 전체 등 표시가 아닌 것(11-06 자석판 실측)
            ks = [k for k, ch in enumerate(s["grid"]) if ch in "BW"]
            if run and s["t"] - run["end"] <= GAP:
                run["end"] = s["t"] + STEP; run["ks"] |= set(ks)
            else:
                run = {"start": s["t"], "end": s["t"] + STEP, "ks": set(ks)}; marks.append(run)
    marks = [{"start": m["start"] + s0, "end": m["end"] + s0, "n": len(m["ks"]), "region": region(list(m["ks"])),
              "pts": [coord(k) for k in sorted(m["ks"])], "regions": sorted({region([k]) for k in m["ks"]})} for m in marks if m["end"] - m["start"] >= 2 * STEP]
    res = {"id": vid, "s0": s0, "visible": len(st), "frames": len(raw), "occluded": len(occluded(raw)), "events": out, "marks": marks}
    (B / vid / f"board_events_{s0}.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
    return res


def secs(m, base):
    p = [int(x) for x in str(m).split(":")]
    t = p[0] * 3600 + p[1] * 60 + p[2] if len(p) == 3 else p[0] * 60 + p[1]
    return t


def scene_times(j):
    """Flash·Pro 장면 시각 기준 보정: 첫 장면이 창 시작보다 1분↑ 앞이면 조각 기준(00:00 시작) → 창 시작을 더한다."""
    s0 = j["_meta"]["window"][0]
    ts = [secs(s["t_start"], 0) for s in j["scenes"]]
    off = s0 if ts and ts[0] < s0 - 60 else 0
    return [(secs(s["t_start"], 0) + off, secs(s.get("t_end") or s["t_start"], 0) + off) for s in j["scenes"]]


def describe(ev, mk, a, b):
    parts = []
    for e in ev:
        if e["end"] <= a or e["start"] >= b:
            continue
        placed = [x for x in e["seq"]]
        s = f"{e['region']} 변화도 {e['n']}수({'→'.join('·'.join(stp) for stp in placed)}) {mmss(e['start'])} 놓기 시작"
        if e["erase_mid"]:
            s += f", 중간 지움 {','.join(mmss(t) for t in e['erase_mid'][:3])}"
        s += f", {mmss(e['end'])} 지움" + (" → 실전 복귀" if e["back_to_real"] else (" (복귀 불명)" if e["back_to_real"] is None else " → 실전과 다름"))
        parts.append(s)
    for m in mk:
        if m["end"] <= a or m["start"] >= b:
            continue
        parts.append(f"{m['region']} 실전 돌 {m['n']}개 표시({','.join(m['pts'][:6])})")
    return " / ".join(parts) or None


def fill(vid, s0, res):
    for jf in sorted((B / vid).glob("flash_*/gemini_full.json")):
        j = json.loads(jf.read_text())
        w0, w1 = j["_meta"]["window"]
        if w1 <= s0 or w0 >= s0 + 1200:
            continue
        rows = []
        for s, (a, b) in zip(j["scenes"], scene_times(j)):
            rows.append({**s, "t_abs": [a, b], "board_draw_local": describe(res["events"], res["marks"], a, max(b, a + 1))})
        (jf.parent / "scenes_board.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1))
        print(f"  {jf.parent.name}: 장면 {len(rows)} · board_draw 채움 {sum(1 for r in rows if r['board_draw_local'])}")


if __name__ == "__main__":
    vid, s0 = sys.argv[1], int(sys.argv[2])
    r = events(vid, s0)
    print(f"{vid} {s0}: 판 보임 {r['visible']}/{r.get('frames')} · 변화도 사건 {len(r['events'])} · 표시 구간 {len(r['marks'])}")
    for e in r["events"][:8]:
        print("  ", mmss(e["start"]), "~", mmss(e["end"]), e["region"], e["n"], "수", e["seq"][:6], "복귀" if e["back_to_real"] else e["back_to_real"])
    fill(vid, s0, r)
