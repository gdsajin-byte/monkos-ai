"""개인 기풍 프로필 v0 — MISTAKES §8 (작가님 vs 같은 기력대 상대). 판정·통계까지만, 해설 문장 없음.

출처: 작가님 11-05 23:43 "평균 200여 수에서 어느 구간이 가장 약했는지 강했는지, 어떤 패턴에서 매번 이기는지 지는지".
입력 = analyze_mistakes.py의 all_rows(작가님+상대 착수, 두는 쪽 기준 손해·승률) + meta(작가님 승패).

① 구간 곡선(20수 단위)  ② 판 흐름 유형(작가님 승률 궤적)  ③ 결정 장면 패턴(판마다 최대 승률 급락 수)  ④ 시대·상대 기력대별 차이
한계: 사석·떡수 판정은 소유권이 필요한 해설 사전 정밀 분석(review.deep_plus) 몫이라 여기선 사분면·단계·손해 크기로만 묶는다.
"""
from collections import Counter, defaultdict

BIN = 20
BIG = 3.0
COLLAPSE = 15.0      # 대마 사망 결판: 한 수 손해(집) ≥
FLIP_WR = 0.4        # 그 수의 승률 손해 ≥
LEAD_WR = 0.7        # 우세 기준 승률
BEHIND_WR = 0.3      # 열세 기준 승률
CLOSE_FROM = 150     # 박빙 끝내기: 이 수순 시점 승률이 열세~우세 사이
QUAD_KO = {"obvious": "당연한 수", "brilliant": "묘수", "missed_brilliant": "놓친 묘수", "blunder_obvious": "착각",
           "ai_sense": "AI식 감각수", "normal": "평범"}


def mean(v):
    return sum(v) / len(v) if v else 0.0


def bin_of(n):
    b = (n - 1) // BIN
    return f"{b * BIN + 1}–{b * BIN + BIN}" if b < 10 else "201+"


def bin_key(lab):
    return 999 if lab == "201+" else int(lab.split("–")[0])


def loss_size(l):
    return "3~5집" if l < 5 else "5~10집" if l < 10 else "10~15집" if l < 15 else "15집+"


def game_flow(rows, result):
    """작가님 승률 궤적 → 유형. rows = 한 판의 착수(작가님·상대)."""
    traj = []
    for x in sorted(rows, key=lambda r: r["move_no"]):
        w = x["wr_before"] if x["who"] == "me" else 1 - x["wr_before"]
        traj.append((x["move_no"], w))
    if not traj:
        return "기타", None
    worst = max(rows, key=lambda r: r["wr_loss"])
    flipped = worst["wr_loss"] >= FLIP_WR and worst["loss"] >= COLLAPSE
    loser_who = "me" if result == "L" else "opp"
    if flipped and worst["who"] == loser_who:
        return "대마 사망 결판", worst
    after50 = [w for n, w in traj if n > 50]
    if result == "W" and after50 and min(after50) <= BEHIND_WR:
        return "역전승", worst
    if result == "L" and after50 and max(after50) >= LEAD_WR:
        return "역전패", worst
    by80 = [w for n, w in traj if n <= 80]
    if by80 and ((result == "W" and by80[-1] >= LEAD_WR and min(after50 or [1]) >= 0.5)
                 or (result == "L" and by80[-1] <= BEHIND_WR and max(after50 or [0]) <= 0.5)):
        return "초반 우세 유지" if result == "W" else "초반 열세 유지", worst
    at150 = [w for n, w in traj if n >= CLOSE_FROM]
    if at150 and BEHIND_WR < at150[0] < LEAD_WR:
        return "박빙 끝내기 결판", worst
    return "기타", worst


def profile_section(all_rows, meta, gidx):
    L = ["## 8. 개인 기풍 프로필 v0 — 작가님 vs 같은 기력대 상대 (판정·통계만)\n",
         "작가님 23:43 요청. 해설 문장은 아직 붙이지 않는다. 대국은 G번호·수순만(아이디 없음).\n"]
    me = [x for x in all_rows if x["who"] == "me"]
    opp = [x for x in all_rows if x["who"] == "opp"]

    # ① 구간 곡선
    L.append(f"### 8-1. 구간 곡선 ({BIN}수 단위)\n")
    L.append("| 구간 | 작가님 착수 | 손해 | 큰 실수율 | 1순위 일치 | 상대 착수 | 손해 | 큰 실수율 | 1순위 일치 |\n|---|---|---|---|---|---|---|---|---|")
    bins = sorted({bin_of(x["move_no"]) for x in all_rows}, key=bin_key)
    mine_loss = {}
    for b in bins:
        cells = []
        for rs in ([x for x in me if bin_of(x["move_no"]) == b], [x for x in opp if bin_of(x["move_no"]) == b]):
            cl = [max(0, x["loss"]) for x in rs]
            cells += [str(len(rs)), f"{mean(cl):.2f}", f"{(sum(v >= BIG for v in cl) / len(rs) * 100) if rs else 0:.1f}%",
                      f"{(sum(x['is_best'] for x in rs) / len(rs) * 100) if rs else 0:.1f}%"]
        mine_loss[b] = (mean([max(0, x["loss"]) for x in me if bin_of(x["move_no"]) == b]),
                        len([x for x in me if bin_of(x["move_no"]) == b]))
        L.append(f"| {b} | " + " | ".join(cells) + " |")
    ok = {b: v for b, (v, n) in mine_loss.items() if n >= 20}
    if ok:
        L.append(f"\n- 작가님 가장 약한 구간(평균 손해 최대, 착수 20↑): **{max(ok, key=ok.get)}수** ({max(ok.values()):.2f}집) · "
                 f"가장 강한 구간: **{min(ok, key=ok.get)}수** ({min(ok.values()):.2f}집)\n")

    # ② 판 흐름 유형
    games = defaultdict(list)
    for x in all_rows:
        games[x["id"]].append(x)
    flows = {}
    for gid, rs in games.items():
        res = meta[gid]["result"]
        flows[gid] = (res,) + game_flow(rs, res)
    L.append("### 8-2. 판 흐름 유형 (작가님 승률 궤적)\n")
    L.append(f"분류 순서: 대마 사망 결판(진 쪽이 한 수에 {COLLAPSE:g}집↑·승률 {FLIP_WR * 100:.0f}%p↑ 손해) → 역전승/역전패(51수 이후 "
             f"{BEHIND_WR * 100:.0f}% 이하/{LEAD_WR * 100:.0f}% 이상을 거침) → 초반 우세·열세 유지(80수 시점 {LEAD_WR * 100:.0f}%/{BEHIND_WR * 100:.0f}% 넘고 이후 뒤집히지 않음) "
             f"→ 박빙 끝내기 결판({CLOSE_FROM}수 시점 {BEHIND_WR * 100:.0f}~{LEAD_WR * 100:.0f}%) → 기타.\n")
    L.append("| 유형 | 판 | 작가님 승 | 승률 | 대표 판(결정 수) |\n|---|---|---|---|---|")
    ft = defaultdict(list)
    for gid, (res, typ, worst) in flows.items():
        ft[typ].append((gid, res, worst))
    for typ in ("초반 우세 유지", "초반 열세 유지", "역전승", "역전패", "박빙 끝내기 결판", "대마 사망 결판", "기타"):
        g = ft.get(typ, [])
        if not g:
            continue
        w = sum(r == "W" for _, r, _ in g)
        ex = ", ".join(f"{gidx[gid]}({wst['move_no']}수)" for gid, _, wst in g[:3] if wst)
        L.append(f"| {typ} | {len(g)} | {w} | {w / len(g) * 100:.0f}% | {ex} |")

    # ③ 결정 장면 패턴
    L.append("\n### 8-3. 결정 장면 — 매번 지는/이기는 패턴\n")
    L.append("판마다 '진 쪽'의 승률 손해 최대 수를 결정 장면으로 본다. 패턴 = 단계 · 사분면 · 손해 크기. "
             "진 판 = 작가님의 결정 실수, 이긴 판 = 상대의 결정 실수(작가님이 잡아낸 장면).\n")
    lose_p, win_p = Counter(), Counter()
    lose_ex, win_ex = defaultdict(list), defaultdict(list)
    for gid, rs in games.items():
        res = meta[gid]["result"]
        who = "me" if res == "L" else "opp"
        cand = [x for x in rs if x["who"] == who]
        if not cand:
            continue
        d = max(cand, key=lambda x: x["wr_loss"])
        if max(0, d["loss"]) < BIG:
            continue
        key = f"{d['phase']} · {QUAD_KO.get(d.get('quad'), d.get('quad'))} · {loss_size(d['loss'])}"
        (lose_p if res == "L" else win_p)[key] += 1
        (lose_ex if res == "L" else win_ex)[key].append(f"{gidx[gid]}({d['move_no']}수 {d['move']})")
    for title, cnt, ex in (("매번 지는 패턴 (작가님 결정 실수) 상위 5", lose_p, lose_ex), ("매번 이기는 패턴 (상대 결정 실수) 상위 5", win_p, win_ex)):
        L.append(f"**{title}**\n")
        L.append("| 패턴 | 판 | 대표 판 |\n|---|---|---|")
        for k, v in cnt.most_common(5):
            L.append(f"| {k} | {v} | {', '.join(ex[k][:3])} |")
        L.append("")

    # ④ 시대·상대 기력대별
    L.append("### 8-4. 시대·상대 기력대별 차이 (작가님)\n")
    L.append("| 묶음 | 판 | 가장 약한 구간 | 가장 강한 구간 | 흐름 상위 2 | 지는 패턴 1위 |\n|---|---|---|---|---|---|")
    groups = defaultdict(list)
    for gid in games:
        groups[("시대", meta[gid]["era"])].append(gid)
        rk = next((x["rank_label"] for x in games[gid] if x["who"] == "opp"), "?")
        groups[("상대", rk)].append(gid)
    for (kind, lab) in sorted(groups):
        gids = groups[(kind, lab)]
        rs = [x for g in gids for x in games[g] if x["who"] == "me"]
        bl = defaultdict(list)
        for x in rs:
            bl[bin_of(x["move_no"])].append(max(0, x["loss"]))
        okb = {b: mean(v) for b, v in bl.items() if len(v) >= 10}
        weak = f"{max(okb, key=okb.get)} ({max(okb.values()):.2f})" if okb else "—"
        strong = f"{min(okb, key=okb.get)} ({min(okb.values()):.2f})" if okb else "—"
        fc = Counter(flows[g][1] for g in gids).most_common(2)
        lp = Counter()
        for g in gids:
            if meta[g]["result"] != "L":
                continue
            cand = [x for x in games[g] if x["who"] == "me"]
            if cand:
                d = max(cand, key=lambda x: x["wr_loss"])
                if max(0, d["loss"]) >= BIG:
                    lp[f"{d['phase']}·{QUAD_KO.get(d.get('quad'), d.get('quad'))}"] += 1
        top = lp.most_common(1)
        L.append(f"| {kind} {lab} | {len(gids)} | {weak} | {strong} | {', '.join(f'{k} {v}' for k, v in fc)} | "
                 f"{(top[0][0] + ' ' + str(top[0][1])) if top else '—'} |")
    L.append("\n- 사석 활용·떡수 이음 여부는 소유권이 필요해 여기서는 묶지 않았다. 결정 장면만 해설 사전 정밀 분석(iMac 리뷰 엔진, 국면당 약 9초)으로 "
             "다시 보면 '이어서 진 판/버려서 이긴 판'을 가를 수 있다(2,000국이면 약 5시간 — 별도 판단).\n")
    return L
