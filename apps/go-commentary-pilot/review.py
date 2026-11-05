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
from sheet import svg_board, esc
from verify import check
from teacher import WORKDIR
from concepts import analyze_concepts, load_lexicon

SYSTEM = """너는 바둑 해설가다. 판을 직접 보지 않는다. 주어진 '사실 목록'만 말로 옮긴다.
규칙:
- 사실 목록에 없는 수치·좌표·그룹·수순을 만들지 않는다. 추측·일반론으로 빈칸을 채우지 않는다.
- 모든 문장 끝에 근거 사실 ID를 대괄호로 붙인다. 예: "여기서 6.2집을 잃었어요. [F1]" / 여러 개면 [F1,F3].
- 숫자는 사실에 나온 값 그대로 쓴다(반올림 금지). 좌표도 사실에 나온 표기 그대로.
- 아마 = 급수 아마추어용 3~4문장: 무엇이 문제였는지(또는 왜 좋았는지)와 어디를 뒀어야 했는지.
- 유단 = 유단자용 한 문장: 수순·급함과 큼·그룹 상태 중 핵심 하나.
- 출력은 JSON 하나만: {"아마": ["문장", ...], "유단": ["문장"]}. 코드 블록·설명 금지."""

# 정성 해설 (lexicon v0) — 수치는 기반, 말은 정성어
SYSTEM_Q = """너는 다정하고 생생한 바둑 해설가다. 판을 직접 보지 않는다. 입력은 추임새 레벨, 사실 목록(F#), 발동 개념 목록(C#)이다.
핵심: 몇 집 손해 같은 숫자는 기반일 뿐이고, 해설의 중심은 정성 평가다 — '두터워졌다', '날카롭다', '행마가 가볍다', '급소', 위기십결 같은 말로 왜 좋은지/아쉬운지를 들려준다.
규칙:
- 정성어·모양 이름·위기십결 이름은 '발동 개념 목록'에 있는 것만 쓴다. 목록에 없는 개념 이름(예: 발동 안 된 '두텁다')은 절대 쓰지 않는다.
- 발동 개념은 그 근거를 쉬운 말로 풀어 준다(예: "주변 흑 돌이 단단해져서"). '쉬운 풀이:', '준수', '소유권' 같은 입력 표현을 그대로 옮기지 말고 자연스러운 말로 바꾼다.
- 숫자는 뒷받침으로만: 아마 해설 전체에 숫자 2개 이하, 쓸 때는 사실·개념에 나온 값 그대로. 개념 3~4개를 골라 흐름 있게 엮고, 목록처럼 나열하지 않는다.
- 위기십결이 발동했으면 이름과 쉬운 풀이를 함께 한 번 말한다. 준수면 칭찬, 위반이면 다음에 기억할 교훈으로.
- 기력·급수·단(예: "6단이라면")·확률·퍼센트는 말하지 않는다. 시청자가 먼저 떠올릴 수는 "일감으로는 ~", 그와 다른 좋은 수는 "이런 수가 있습니다"로 대비한다. "찾으셨네요"는 와우일 때만 쓴다.
- 첫 문장은 추임새 레벨에 맞춰 시작한다: 와우 → "와우," 또는 "멋진 수네요," / 외길 → "외길입니다." 한 줄만(칭찬 추임새 없이) / 좋네요 → "좋네요," / 무난 → "무난해요," / 살짝 아쉬움 → "조금 아쉬워요," / 아쉬워요 → "아쉬워요," / 큰 실수 → "여기가 크게 아팠어요,".
- 좌표는 사실에 나온 표기(예: Q16)만 쓴다. 사실·개념에 없는 수순·그룹·영역을 만들지 않는다.
- 모든 문장 끝에 근거 ID를 대괄호로 붙인다. 예: [X2,F1]. ID(F#·X#)는 끝의 대괄호 안에만 쓰고 문장 본문에는 절대 쓰지 않는다(좌표와 헷갈린다).
- 아마 = 급수 아마추어용 3~4문장. 유단 = 유단자용 한 문장(개념 중 핵심 하나를 수순과 연결).
- 출력은 JSON 하나만: {"아마": ["문장", ...], "유단": ["문장"]}. 코드 블록·설명 금지."""


def load_sgf(path):
    s = open(path, encoding="utf-8").read()
    komi = float(re.search(r"KM\[([^\]]*)\]", s).group(1)) if "KM[" in s else 6.5
    moves = []
    for c, xy in re.findall(r";\s*([BW])\[([a-s]{0,2})\]", s):
        moves.append([c, "pass" if not xy else f"{COLS[ord(xy[0]) - 97]}{N - (ord(xy[1]) - 97)}"])
    meta = {k: (re.search(k + r"\[([^\]]*)\]", s).group(1) if k + "[" in s else "") for k in ("PB", "PW", "DT", "HA")}
    # 치석(접바둑): 루트 노드의 AB/AW → KataGo initialStones
    root = s[s.find(";") + 1:]
    root = root[:root.find(";")] if ";" in root else root
    initial = []
    for c, vals in re.findall(r"A([BW])((?:\s*\[[a-s]{2}\])+)", root):
        for xy in re.findall(r"\[([a-s]{2})\]", vals):
            initial.append([c, f"{COLS[ord(xy[0]) - 97]}{N - (ord(xy[1]) - 97)}"])
    return {"id": os.path.basename(path), "moves": moves, "komi": komi, "rules": "korean", "meta": meta,
            "initial": initial}


def scan(eng, gm):
    q = base_query(gm, "scan")
    q["analyzeTurns"] = list(range(len(gm["moves"]) + 1))
    q["maxVisits"] = analyze.SCAN_VISITS
    rs = sorted(eng.ask(q, len(q["analyzeTurns"])), key=lambda r: r["turnNumber"])
    return [{"lead": r["rootInfo"]["scoreLead"], "winrate": r["rootInfo"]["winrate"],
             "best": r["moveInfos"][0]["move"],
             "gap2": (r["moveInfos"][0]["scoreLead"] - r["moveInfos"][1]["scoreLead"]) if len(r["moveInfos"]) > 1 else 0}
            for r in rs]


def pick(gm, t, color, top, wr_range=None, min_loss=analyze.MIN_LOSS, praise=1):
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
    # 잘 둔 수(칭찬 대상) = 손실 0.5집 이하 · 엔진 1순위 우선 · 차선과의 차이 큰 순.
    # 정밀 분석에서 바뀔 수 있어 praise×2개를 올리고 재판정에서 praise개만 남긴다
    taken = {m["move_index"] for m in picked}
    good = sorted((r for r in cand if r["loss_scan"] <= 0.5 and r["move_index"] not in taken),
                  key=lambda r: (r["move"] != r["best"], -r["gap2"]))[:praise * 2]
    for rank, g in enumerate(good):
        picked.append(dict(g, kind="잘 둔 수", good_rank=rank))
    for k, r in enumerate(picked, 1):
        r["pos_id"] = f"C{k}"  # 임시 — 재판정 후 R 번호를 다시 매긴다
    return picked


def deep_loss(d):
    """정밀 분석 기준 손실 = 최선수 기대 집 − 실제 수 후 기대 집 (둔 쪽 관점)."""
    sign = 1 if d["pos"]["color"] == "B" else -1
    return round(sign * (d["before"]["moveInfos"][0]["scoreLead"] - d["after"]["rootInfo"]["scoreLead"]), 1)


def rejudge(deep, top, min_loss, praise=1, good_loss=0.5):
    """1차 스캔 선발을 정밀 분석으로 재판정: 최선수 = 실제 수이거나 손실 < min_loss인 '실수'는 제외, 상위 top만."""
    keep, dropped, n, n_good = [], [], 0, 0
    order = lambda d: (0, -deep_loss(d)) if "실수" in d["pos"]["kind"] else (1, d["pos"].get("good_rank", 0))
    for d in sorted(deep, key=order):
        p = d["pos"]
        if p["kind"] == "잘 둔 수":
            ok = deep_loss(d) <= good_loss and len(d["before"]["moveInfos"]) > 1
            if ok and n_good < praise:
                n_good += 1
                keep.append(d)
            else:
                dropped.append({"move_number": p["move_number"], "move": p["move"], "kind": "잘 둔 수 후보",
                                "deep_loss": deep_loss(d), "reason": "정밀 손실 초과" if not ok else "후보 중 차순위"})
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
            "actual": pos["move"], "best": alt["move"], "facts": facts, "alt_line": d.get("alt_line", [])}


def teach(model, fx, kind, con=None):
    lines = [f"국면 {fx['pos_id']} ({kind}) — {KO[fx['color']]} {fx['move_number']}수째 {fx['actual']}"]
    if con:
        lines.append(f"추임새 레벨: {con['cheer']}")
    lines.append("사실 목록:")
    lines += [f"[{f['id']}] ({f['type']}) {f['text']}" for f in fx["facts"]]
    if con:
        lines.append("발동 개념 목록 (이것만 정성어로 쓴다):")
        lines += [f"[{c['cid']}] ({LAYER_KO[c['layer']]}) {c['text']}" for c in con["concepts"] if c.get("use", True)] \
            or ["(발동 개념 없음 — 정성어 없이 사실만)"]
    t = time.time()
    r = subprocess.run(["claude", "-p", "--model", model, "--output-format", "json", "--tools", "",
                        "--strict-mcp-config", "--no-session-persistence", "--system-prompt", SYSTEM_Q if con else SYSTEM],
                       input="\n".join(lines), capture_output=True, text=True, cwd=WORKDIR, timeout=300)
    text = json.loads(r.stdout).get("result", "")
    try:
        out = json.loads(text[text.find("{"): text.rfind("}") + 1])
    except ValueError:
        out = None
    return out, round(time.time() - t, 1)


LAYER_KO = {"shapes": "모양", "keypoints": "급소·맥", "proverbs": "위기십결", "qualities": "정성"}


def deep_plus(eng, gm, c):
    """정밀 분석 + 정책망 + '그 자리에서 손을 뺐다면(패스)' 소유권 기준선."""
    d = analyze.deep(eng, gm, c, extra={"includePolicy": True})
    d["after"].pop("policy", None)
    q = base_query(gm, c["pos_id"] + "-pass")
    q["moves"] = gm["moves"][:c["move_index"]] + [[c["color"], "pass"]]
    q["analyzeTurns"] = [c["move_index"] + 1]
    q["maxVisits"] = analyze.DEEP_VISITS // 2
    q["includeOwnership"] = True
    (r,) = eng.ask(q, 1)
    d["pass_own"] = r["ownership"]
    # 차선(2순위) 수순 — 잘 둔 수의 참고도용(10-23). 2순위는 탐색이 얕아 pv가 1수뿐이라, 차선을 둔 뒤 국면을 따로 읽는다
    mi = d["before"]["moveInfos"]
    if len(mi) > 1:
        q = base_query(gm, c["pos_id"] + "-alt")
        q["moves"] = gm["moves"][:c["move_index"]] + [[c["color"], mi[1]["move"]]]
        q["analyzeTurns"] = [c["move_index"] + 1]
        q["maxVisits"] = analyze.DEEP_VISITS // 2
        (r,) = eng.ask(q, 1)
        d["alt_line"] = [mi[1]["move"]] + (r["moveInfos"][0]["pv"][:4] if r.get("moveInfos") else [])
    # 사석 활용 판정용(v1.1): 직전 상대 수로 단수에 걸린 자기 소수 돌을 살리는 수가 엔진 후보에 없으면 1회 따로 평가(최대 2수)
    from concepts import atari_saves, gtp_of, load_lexicon
    small = next(e["threshold"]["small"] for e in load_lexicon()["qualities"] if e["id"] == "sacrifice")  # 상수는 lexicon 한 곳
    i = c["move_index"]
    prev = gtp_to_xy(gm["moves"][i - 1][1]) if i > 0 else None
    pts, _ = atari_saves(board_at(gm, i), c["color"], prev, small)
    have = {m["move"] for m in mi}
    d["save_eval"] = {}
    for q in sorted(pts)[:2]:
        mv_q = gtp_of(q)
        if mv_q in have:
            continue
        sq = base_query(gm, c["pos_id"] + "-save")
        sq["moves"] = gm["moves"][:i] + [[c["color"], mv_q]]
        sq["analyzeTurns"] = [i + 1]
        sq["maxVisits"] = analyze.DEEP_VISITS // 2
        (rr,) = eng.ask(sq, 1)
        d["save_eval"][mv_q] = rr["rootInfo"]["scoreLead"]
    return d


NEG = re.compile(r"^.{0,3}(지\s*않|지\s*못|지는\s*않|아니)")


def term_errors(sentence, activated, source, lex):
    """정성어·모양·위기십결 이름이 문장에 있는데 발동 목록에 없으면 오류. 근거 텍스트(사실·개념)에 그대로 있으면 허용."""
    body = re.sub(r"\s*\[[^\]]*\]", "", sentence)
    body = re.sub(r"최선수|차선수|선수순", "＿", body)
    errs = []
    layers = ("shapes", "keypoints", "proverbs", "qualities")
    # 발동 항목의 패턴은 전부 허용 (손빼기 적기/부적기처럼 패턴을 공유하는 쌍)
    allowed = {p for L in layers for e in lex[L] if e["name"] in activated for p in e.get("patterns", [])}
    for layer in layers:
        for e in lex[layer]:
            for pat in e.get("patterns", []):
                k = body.find(pat)
                if k < 0:
                    continue
                if e["name"] in activated or pat in source or pat in allowed:
                    break
                opp = next((x["name"] for L in ("qualities", "shapes") for x in lex[L] if x["id"] == e.get("opposite")), None)
                if opp in activated and NEG.match(body[k + len(pat):]):
                    break
                errs.append(f"미발동 개념 {e['name']}")
                break
    return errs



# ---- 해설식 표기(10-23 작가님 "E4 좌표는 불편 — A·B·수순 번호로"): 실전도·참고도 + 본문 좌표 → 표지
COORD_RE = re.compile(r"(?<![A-Za-z0-9])([A-HJ-T](?:1[0-9]|[1-9]))(?![0-9])")  # 한글 조사가 바로 붙어도 잡는다(\b는 한글을 글자로 봐 놓침)
SEQ_RE = re.compile(r"([흑백]) ([A-HJ-T](?:1[0-9]|[1-9]))(?![0-9])")


def fact_seq(fx, fid):
    f = next((x for x in fx["facts"] if x["id"] == fid), None)
    return [("B" if c == "흑" else "W", m) for c, m in SEQ_RE.findall(f["text"])] if f else []


def diagram(gm, fx, numbered, mark_a=None, title="", extra=None):
    """국면(착수 전) 위에 numbered=[(색, 좌표, 번호)] 돌을 번호와 함께 놓고, mark_a 자리에 파란 A."""
    i = fx["move_number"] - 1
    b = board_at(gm, i)
    cell, pad = 20, 22
    size = pad * 2 + cell * (N - 1)
    o = [f'<svg viewBox="0 0 {size} {size}" class="bd" role="img" aria-label="{esc(title)}">',
         f'<rect width="{size}" height="{size}" fill="var(--wood)"/>']
    for k in range(N):
        a = pad + k * cell
        o.append(f'<line x1="{pad}" y1="{a}" x2="{size - pad}" y2="{a}" class="ln"/><line x1="{a}" y1="{pad}" x2="{a}" y2="{size - pad}" class="ln"/>')
        o.append(f'<text x="{a}" y="12" class="lb">{COLS[k]}</text><text x="8" y="{a + 3}" class="lb">{N - k}</text>')
    for x in (3, 9, 15):
        for y in (3, 9, 15):
            o.append(f'<circle cx="{pad + x * cell}" cy="{pad + y * cell}" r="2.5" class="hs"/>')
    for (x, y), c in b.s.items():
        o.append(f'<circle cx="{pad + x * cell}" cy="{pad + y * cell}" r="9.3" class="{"sb" if c == "B" else "sw"}"/>')
    used = set(b.s)
    if mark_a:
        pa = gtp_to_xy(mark_a)
        if pa and pa not in used:
            cx, cy = pad + pa[0] * cell, pad + pa[1] * cell
            o.append(f'<circle cx="{cx}" cy="{cy}" r="8.5" class="ma2"/><text x="{cx}" y="{cy + 4}" class="la">A</text>')
            used.add(pa)
    for m, t in (extra or {}).items():  # 본문에 나온 그 밖의 자리 — B, C…
        p = gtp_to_xy(m)
        if p and p not in used:
            cx, cy = pad + p[0] * cell, pad + p[1] * cell
            o.append(f'<circle cx="{cx}" cy="{cy}" r="8.5" class="mx"/><text x="{cx}" y="{cy + 4}" class="la">{t}</text>')
            used.add(p)
    for c, m, n in numbered:
        p = gtp_to_xy(m)
        if not p or p in used:
            continue  # 따냄 뒤 같은 자리 재착수 등은 생략(번호 겹침 방지)
        used.add(p)
        cx, cy = pad + p[0] * cell, pad + p[1] * cell
        o.append(f'<circle cx="{cx}" cy="{cy}" r="9.3" class="{"sb" if c == "B" else "sw"}"/>'
                 f'<text x="{cx}" y="{cy + 3.5}" class="{"nb" if c == "B" else "nw"}">{n}</text>')
    o.append("</svg>")
    return "".join(o)


def label_map(fx, kind):
    """좌표 → 해설 표지. 우선순위: 실전 수 > A(최선·차선) > 실전도 번호 > 참고도 번호."""
    n0, act = fx["move_number"], fx["actual"]
    lab = {act: "실전 수", fx["best"]: "A"}
    cont = fact_seq(fx, "F5")
    if cont and cont[0][1] == act:
        cont = cont[1:]
    real = [(c, m, n0 + k) for k, (c, m) in enumerate(cont, 1)]
    if kind != "잘 둔 수":
        ref = [(c, m, k) for k, (c, m) in enumerate(fact_seq(fx, "F6"), 1)]
    else:  # 차선 A를 뒀다면 — deep_plus가 남긴 차선 수순(구 리뷰엔 없음)
        opp = "W" if fx["color"] == "B" else "B"
        ref = [((fx["color"], opp)[k % 2], m, k + 1) for k, m in enumerate(fx.get("alt_line") or [])] if len(fx.get("alt_line") or []) > 1 else []
    for c, m, n in real:
        if m == fx["best"] and c != fx["color"] and "_dual" not in lab:
            lab["_dual"] = (m, f"A(실전도 {n})", KO[c])  # 상대가 A 자리에 두는 진행 — 문맥으로 가른다(relabel)
        lab.setdefault(m, f"실전도 {n}")
    if fx.get("co_best") and fx["co_best"] not in lab:
        lab[fx["co_best"]] = "A′"
    for c, m, n in ref:
        lab.setdefault(m, f"참고도 {n}")
    return lab, real, ref


def relabel(text, lab):
    text = re.sub(r"실제 수 ([A-HJ-T](?:1[0-9]|[1-9]))(?![0-9])", lambda m: "실전 수" if lab.get(m.group(1)) == "실전 수" else m.group(0), text)
    text = re.sub(r"(\d+)수 ([A-HJ-T](?:1[0-9]|[1-9]))(?=[는은이가를의,. ]|$)", lambda m: m.group(1) + "수" if m.group(2) in lab else m.group(0), text)
    dual = lab.get("_dual")

    def sub(m):
        if dual and m.group(1) == dual[0] and dual[2] in text[max(0, m.start() - 12):m.start()]:
            return dual[1]
        return lab.get(m.group(1), m.group(1))
    return COORD_RE.sub(sub, text)


def line_frames(gm, fx, steps):
    """steps=[(색, 좌표, 번호)] → 단계별 판 [{s:[[x,y,c]], n:[[x,y,번호]]}] (따냄 반영, 0단계 = 착수 전)."""
    b = board_at(gm, fx["move_number"] - 1).copy()
    nums, out = {}, []
    snap = lambda: {"s": [[x, y, c] for (x, y), c in b.s.items()], "n": [[x, y, n] for (x, y), n in nums.items() if (x, y) in b.s]}
    out.append(snap())
    for c, m, n in steps:
        xy = gtp_to_xy(m)
        if not xy or xy in b.s:
            break
        b.play(c, xy)
        nums[xy] = n
        out.append(snap())
    return out


def interactive(gm, fx, idx, real, ref, extra, label):
    """실전도·참고도 한 판 — A를 누르면 참고도 수순이 한 수씩 펼쳐진다(10-23 작가님)."""
    lines = {"real": line_frames(gm, fx, [(fx["color"], fx["actual"], fx["move_number"])] + real)}
    if ref:
        lines["A"] = line_frames(gm, fx, ref)
    i = fx["move_number"] - 1
    last = gtp_to_xy(gm["moves"][i - 1][1]) if i > 0 else None
    marks = {"A": gtp_to_xy(fx["best"])}
    marks.update({t: gtp_to_xy(m) for m, t in extra.items()})
    if fx.get("co_best"):
        marks["A′"] = gtp_to_xy(fx["co_best"])
    data = {"lines": lines, "marks": {k: v for k, v in marks.items() if v}, "last": last}
    btn_a = f'<button data-line="A">참고도 — A {label} 진행</button>' if ref else ""
    return (f'<figure class="ia" id="ia{idx}"><svg viewBox="0 0 404 404" class="bd" role="img" aria-label="실전도·참고도"></svg>'
            f'<div class="ctl"><button data-line="real" class="on">실전도</button>{btn_a}'
            f'<span class="sp"></span><button data-step="-1" aria-label="한 수 뒤로">◀</button><span class="stepno"></span>'
            f'<button data-step="1" aria-label="한 수 앞으로">▶</button><button data-play aria-label="처음부터 재생">⟲ 재생</button></div>'
            f'<figcaption>{"A를 누르거나 참고도 버튼으로 수순을 펼칩니다 · " if ref else ""}번호 = 수순 · 파란 A {label}'
            f'{" · 녹색 " + "·".join(extra.values()) + " 본문 언급" if extra else ""}</figcaption>'
            f'<script type="application/json" class="iad">{json.dumps(data, ensure_ascii=False)}</script></figure>')

def render(gm, items, out, model, color):
    esc = lambda s: html.escape(s, quote=True)
    secs = []
    for it in items:
        fx, lv, v = it["fx"], it["levels"], it["verify"]
        lab, real, ref = label_map(fx, it["kind"])
        extra = {}
        prose = " ".join([fx["facts"][0]["text"]] + [x for name in ("아마", "유단") for x in (lv or {}).get(name, [])])
        for m in COORD_RE.findall(re.sub(r"\[[^\]]*\]", "", prose)):
            if m not in lab and m not in extra and len(extra) < 6:  # (lab의 "_dual"은 좌표가 아니라 무관)
                extra[m] = "BCDEFG"[len(extra)]
        lab.update(extra)
        body = []
        for name in ("아마", "유단"):
            sents = []
            for s in (lv or {}).get(name, []):
                bad = v.get(s)
                txt = relabel(re.sub(r"\s*\[[^\]]*\]", "", s), lab)
                sents.append(f'<span class="fail" title="검증 탈락: {esc(", ".join(bad))}">{esc(txt)}</span>' if bad else esc(txt))
            body.append(f'<h4>{name}</h4><p>{" ".join(sents) or "(생성 실패)"}</p>')
        label = "차선" if it["kind"] == "잘 둔 수" else "최선"
        co = f" (≈ {fx['co_best']}, 어느 쪽도 최선)" if fx.get("co_best") else ""
        f1 = relabel(fx["facts"][0]["text"], lab)
        con = it.get("con")
        chips = evid = ""
        if con:
            chips = '<p class="chips">' + "".join(
                f'<span class="chip l-{c["layer"]}{"" if c.get("use", True) else " off"}">{esc(c["name"])}{"" if not c["mode"] else (" ✓" if c["mode"] == "follow" else " ✗")}</span>'
                for c in con["concepts"]) + "</p>"
            sg = con["signals"]
            keys = ["loss", "gap2", "prior", "rank", "local_gain", "territory_gain", "influence_gain", "sente", "reply",
                    "prev_dist", "friends", "sphere", "cuts_own", "cuts_opp", "own_near", "opp_near", "my_group", "wr_before"]
            evid = (f'<details><summary>발동 근거 — 개념 {len(con["concepts"])}개 · 신호값 (임계 보정용)</summary>'
                    "<table class=ev><tr><th>개념</th><th>층</th><th>근거</th></tr>" + "".join(
                        f'<tr><td>{esc(c["name"])}{"(" + ("준수" if c["mode"] == "follow" else "위반") + ")" if c["mode"] else ""}{"" if c.get("use", True) else " · 해설 미반영"}</td>'
                        f'<td>{LAYER_KO[c["layer"]]}</td><td>{esc(json.dumps(c["evidence"], ensure_ascii=False))}</td></tr>'
                        for c in con["concepts"]) + "</table><table class=ev><tr><th>신호</th><th>값</th></tr>" + "".join(
                        f"<tr><td>{k}</td><td>{esc(json.dumps(sg.get(k), ensure_ascii=False))}</td></tr>" for k in keys)
                    + "</table></details>")
        tagtxt = it["kind"] + (f" · {con['cheer']}" if con else "")
        secs.append(f'''<section class="k-{"good" if it["kind"] == "잘 둔 수" else "bad"}"><h2><span class="tag">{esc(tagtxt)}</span> {KO[fx["color"]]} {fx["move_number"]}수 · {label} A{esc(relabel(co, lab))}</h2>
<div class="row"><div class="figs">{interactive(gm, fx, len(secs), real, ref, extra, label)}</div>
<div>{chips}<p class="f1">{esc(f1)}</p>{"".join(body)}{evid}<details><summary>근거 사실 {len(fx["facts"])}개</summary><ol>{"".join(f"<li><b>{x['id']}</b> {esc(x['text'])}</li>" for x in fx["facts"])}</ol></details></div></div></section>''')
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
.sb{{fill:#111;stroke:#000}}.sw{{fill:#fafafa;stroke:#555;stroke-width:.8}}.lm{{fill:#e33}}.mx{{fill:#2f8f5b;stroke:#fff;stroke-width:1}}.ma2{{fill:#1d5fe0;stroke:#fff;stroke-width:1}}.la{{font-size:10px;font-weight:700;fill:#fff;text-anchor:middle}}.nb{{font-size:9px;font-weight:700;fill:#fff;text-anchor:middle}}.nw{{font-size:9px;font-weight:700;fill:#111;text-anchor:middle}}.figs{{display:flex;flex-direction:column;gap:10px}}.ctl{{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0 2px}}.ctl button{{font:inherit;font-size:12.5px;padding:3px 9px;border-radius:6px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}}.ctl button.on{{border-color:#1d5fe0;color:#1d5fe0;font-weight:700}}.ctl .sp{{flex:1}}.stepno{{font-size:12px;color:var(--mut);min-width:44px;text-align:center}}.ia svg .hit{{cursor:pointer}}.mb{{fill:none;stroke:#1d5fe0;stroke-width:3}}.ma{{stroke:#e0301d;stroke-width:3;stroke-linecap:round}}
.f1{{font-weight:600;margin:0 0 8px}}h4{{margin:10px 0 2px;font-size:12.5px;color:var(--mut)}}h4+p{{margin:0}}details{{margin-top:10px;font-size:13px;color:var(--mut)}}details ol{{padding-left:18px}}
.fail{{background:var(--badbg);color:var(--bad);text-decoration:underline dotted}}
.chips{{margin:0 0 8px;display:flex;flex-wrap:wrap;gap:6px}}.chip{{font-size:12.5px;padding:2px 9px;border-radius:99px;border:1px solid var(--line)}}
.chip.off{{opacity:.45}}.l-shapes{{border-color:#8a6d3b}}.l-keypoints{{border-color:#2a62c9;font-weight:600}}.l-proverbs{{border-color:#7b3fa0}}.l-qualities{{border-color:var(--good)}}
table.ev{{border-collapse:collapse;width:100%;margin:6px 0;font-size:12px}}table.ev td,table.ev th{{border-bottom:1px solid var(--line);padding:3px 6px;text-align:left;vertical-align:top;word-break:break-all}}
@media (max-width:720px){{.row{{grid-template-columns:1fr}}}}
</style></head><body><main>
<h1>대국 리뷰 — {esc(m.get("PB", ""))}(흑) 대 {esc(m.get("PW", ""))}(백)</h1>
<p class="sub">{esc(m.get("DT", ""))} · {len(gm["moves"])}수 · 덤 {gm["komi"]} · 분석 KataGo b18(OpenCL, 정밀 {analyze.DEEP_VISITS} visits) · 해설 {model} (사실 목록 기반, 검증기 통과) · {KO[color]} 수만 대상 · {esc(m.get("filter", "전 구간"))} · 손실은 KataGo 기대 집 차이</p>
{"".join(secs)}</main><script>
// 실전도·참고도 — 단계별 판 그리기. A(또는 참고도 버튼)를 누르면 참고도 수순이 한 수씩 펼쳐진다
(function(){{const N=19,C=20,P=22,COLS="ABCDEFGHJKLMNOPQRST";
const sv=(t,a)=>{{const e=document.createElementNS("http://www.w3.org/2000/svg",t);for(const k in a)e.setAttribute(k,a[k]);return e}};
document.querySelectorAll("figure.ia").forEach(fig=>{{
 const D=JSON.parse(fig.querySelector(".iad").textContent),svg=fig.querySelector("svg"),no=fig.querySelector(".stepno");
 let line="real",k=Math.min(1,D.lines.real.length-1),timer=null;  // 처음엔 실전 수 한 점 + A(누를 수 있게) — ▶로 이후 진행
 function draw(){{const L=D.lines[line],f=L[k];svg.replaceChildren();
  svg.append(sv("rect",{{width:404,height:404,fill:"var(--wood)"}}));
  for(let i=0;i<N;i++){{const a=P+i*C;svg.append(sv("line",{{x1:P,y1:a,x2:P+18*C,y2:a,class:"ln"}}),sv("line",{{x1:a,y1:P,x2:a,y2:P+18*C,class:"ln"}}));
   const t1=sv("text",{{x:a,y:12,class:"lb"}});t1.textContent=COLS[i];const t2=sv("text",{{x:8,y:a+3,class:"lb"}});t2.textContent=N-i;svg.append(t1,t2)}}
  for(const x of[3,9,15])for(const y of[3,9,15])svg.append(sv("circle",{{cx:P+x*C,cy:P+y*C,r:2.5,class:"hs"}}));
  const occ=new Set(f.s.map(([x,y])=>x+","+y));
  for(const[x,y,c]of f.s)svg.append(sv("circle",{{cx:P+x*C,cy:P+y*C,r:9.3,class:c==="B"?"sb":"sw"}}));
  const col={{}};for(const[x,y,c]of f.s)col[x+","+y]=c;
  for(const[x,y,n]of f.n){{const t=sv("text",{{x:P+x*C,y:P+y*C+3.5,class:col[x+","+y]==="B"?"nb":"nw"}});t.textContent=n;svg.append(t)}}
  if(k===0&&D.last&&occ.has(D.last.join(",")))svg.append(sv("circle",{{cx:P+D.last[0]*C,cy:P+D.last[1]*C,r:3.5,class:"lm"}}));
  for(const m in D.marks){{const[x,y]=D.marks[m];if(occ.has(x+","+y))continue;
   const g=sv("g",{{class:m==="A"&&D.lines.A?"hit":""}});g.append(sv("circle",{{cx:P+x*C,cy:P+y*C,r:8.5,class:m.startsWith("A")?"ma2":"mx"}}));
   const t=sv("text",{{x:P+x*C,y:P+y*C+4,class:"la"}});t.textContent=m;g.append(t);if(m==="A"&&D.lines.A)g.onclick=()=>pick("A",true);svg.append(g)}}
  no.textContent=(line==="A"?"참고도 ":"실전도 ")+k+"/"+(L.length-1);
  fig.querySelectorAll("[data-line]").forEach(b=>b.classList.toggle("on",b.dataset.line===line))}}
 function pick(l,play){{clearInterval(timer);line=l;k=l==="real"?Math.min(1,D.lines.real.length-1):0;draw();run()}}
 function run(){{clearInterval(timer);timer=setInterval(()=>{{if(k>=D.lines[line].length-1)return clearInterval(timer);k++;draw()}},650)}}
 fig.querySelectorAll("[data-line]").forEach(b=>b.onclick=()=>pick(b.dataset.line,b.dataset.line==="A"));
 fig.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{{clearInterval(timer);k=Math.max(0,Math.min(D.lines[line].length-1,k+Number(b.dataset.step)));draw()}});
 fig.querySelector("[data-play]").onclick=()=>{{k=0;draw();run()}};
 draw()}})}})();
</script></body></html>"""
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
        con = it.get("con")
        cc = f" · {con['cheer']} · " + ", ".join(c["name"] for c in con["concepts"]) if con and con["concepts"] else ""
        comment = f"[{it['kind']}{cc}] {it['fx']['facts'][0]['text']}\n\n" + " ".join(
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
    stones = "".join(f"A{c}" + "".join(f"[{to_sgf_xy(p)}]" for cc, p in gm.get("initial", []) if cc == c)
                     for c in ("B", "W") if any(cc == c for cc, _ in gm.get("initial", [])))
    ha = f"HA[{m['HA']}]" if m.get("HA") else ""
    head = (f";GM[1]FF[4]CA[UTF-8]SZ[19]KM[{gm['komi']}]{ha}{stones}PB[{sgf_text(m.get('PB', ''))}]PW[{sgf_text(m.get('PW', ''))}]"
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
    ap.add_argument("--praise", type=int, default=3, help="칭찬할 좋은 수 최대 개수 (기본 3)")
    ap.add_argument("--render-only", action="store_true", help="{out}_work/items.json으로 HTML만 다시 그림(엔진·LLM 미호출) — 표기·그림 보정용")
    ap.add_argument("--reuse", action="store_true", help="{out}_work/의 분석 결과를 재사용(엔진 미기동) — 사전·임계·프롬프트 보정용")
    ap.add_argument("--no-concepts", action="store_true", help="정성 개념(lexicon) 없이 정량 사실만으로 해설 (구 방식)")
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
    if a.render_only:
        render(gm, json.load(open(os.path.join(work, "items.json"))), a.out, a.model, a.color)
        print("→", a.out, "(다시 그림)")
        return
    lex = None if a.no_concepts else load_lexicon()
    cached = os.path.join(work, "deep.json")
    if a.reuse and os.path.exists(cached):
        deep = json.load(open(cached))
        prev = json.load(open(os.path.join(work, "scan.json")))
        t, picked, dropped = prev["scan"], prev["picked"], prev["dropped"]
        print("재사용:", cached, len(deep), "국면", flush=True)
    else:
        eng = Engine()
        try:
            t = scan(eng, gm)
            picked = pick(gm, t, a.color, a.top, wr_range, a.min_loss, a.praise)
            deep = [deep_plus(eng, gm, c) for c in picked]
        finally:
            eng.close()
        deep, dropped = rejudge(deep, a.top, a.min_loss, a.praise, lex["cheers"]["threshold"]["good_loss"] if lex else 0.5)
    for x in dropped:
        print("재판정 제외:", x, flush=True)
    json.dump({"scan": t, "picked": picked, "dropped": dropped}, open(os.path.join(work, "scan.json"), "w"),
              ensure_ascii=False)
    json.dump(deep, open(os.path.join(work, "deep.json"), "w"))
    items = []
    for d in deep:
        kind = d["pos"]["kind"]
        is_best = d["before"]["moveInfos"][0]["move"] == d["pos"]["move"]
        fx = good_facts(d, gm) if kind == "잘 둔 수" and is_best else extract(d, gm)
        con = None
        if lex:
            f3 = next((x["data"] for x in fx["facts"] if x["id"] == "F3"), None)
            con = analyze_concepts(d, gm, lex, f3 if fx["facts"][0]["type"] == "손익" else None)
        levels, secs = teach(a.model, fx, kind, con)
        facts = {x["id"]: x["text"] for x in fx["facts"]}
        if con:
            facts.update({c["cid"]: c["text"] for c in con["concepts"]})
        dd = {x["id"]: x["data"] for x in fx["facts"]}
        sem = {"f3": {r: v for r, v in dd["F3"]["lost"] + dd["F3"]["gained"]}, "f7": dd["F7"]["kind"]}
        header = f"{fx['move_number']} {fx['actual']} {fx['best']}"
        ver = {}
        for s in sum((levels or {}).values(), []):
            hard, _ = check(s, facts, header, sem)
            if con:
                hard += term_errors(s, {c["name"] for c in con["concepts"]}, " ".join(facts.values()), lex)
            if hard:
                ver[s] = hard
        items.append({"fx": fx, "kind": kind, "levels": levels, "verify": ver, "teach_secs": secs, "con": con})
        n = len(sum((levels or {}).values(), []))
        print(fx["pos_id"], kind, fx["move_number"], fx["actual"], "→", fx["best"],
              fx["facts"][0]["text"][:40], f"| {con['cheer'] if con else ''} 개념 {[c['name'] for c in con['concepts']] if con else []}"
              f" | 문장 {n} 탈락 {len(ver)} | {secs}s", flush=True)
    json.dump(items, open(os.path.join(work, "items.json"), "w"), ensure_ascii=False, indent=1)
    render(gm, items, a.out, a.model, a.color)
    print("→", a.out)
    if a.sgf_out:
        export_sgf(gm, items, deep, a.sgf_out, a.model)
        print("→", a.sgf_out)


if __name__ == "__main__":
    main()
