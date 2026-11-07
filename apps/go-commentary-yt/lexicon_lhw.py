#!/usr/bin/env python3
"""자막 교정 사전 이현욱 보강(lexicon_lhw) — lexicon_v1 위에 얹는 규칙 (PF_GO, 11-07 막내2, 무료·CPU)
  lexicon_lhw.py   → answers/lexicon_lhw.json(규칙) + answers/lexicon_lhw_eval.json + 표 출력
정답: 정답지 이현욱 10편의 Gemini 장면 대사 — Pro 정답본(pro_{시작}) 있으면 Pro, 없으면 Flash(gemini_full.json scenes.line). 분할: v1과 같은 홀드아웃 3편(jvN·1lN·t0f) / 학습 7편.
v1이 못 잡은 것(11-07 v0 실측): 한 글자 어간(흙→흑), 숫자(100→백), 이현욱 채널 고유 오인식(빈산각·폐착·스승 …).
규칙 종류
  · 어간 치환(v1과 같은 형식): 학습 편 어절 정렬에서 나온 (오인식 어간 → 정답 어간), 출현 2조각↑, 학습 정밀도 ≥ 90%, 정답 어간이 바둑 낱말.
  · 앞말 규칙(PRE): 한 글자·숫자 어간 — 뒤에 조사가 붙은 경우만(흙이·흙은·100이·100을 …). 학습 정밀도로 같은 검사.
평가: 홀드아웃 3편 글자 오류율(CER, 공백·문장부호 뺀 글자 편집거리 / 정답 글자 수) — 원 자막 / v1 / v1+lhw, 과교정 수.
"""
import json, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
sel = json.loads((B / "selection.json").read_text())
LHW = [r["id"] for r in sel if r["commentator"] == "이현욱"]
HOLD = {LHW[i] for i in (2, 5, 8)}  # lexicon_v1과 같은 고정 분할(조회수 순 3·6·9위)
V1 = sorted([(k["from"], k["to"]) for k in json.loads((B / "lexicon_v1.json").read_text())["rules"]], key=lambda x: -len(x[0]))
GO = {"흑", "백", "수순", "패착", "빈삼각", "팻감", "패감", "리드", "밀어", "치중", "묘수", "정수", "승부수", "반집", "대마", "수읽기", "이현욱", "끝내기",
      "단수", "선수", "후수", "따내", "젖혀", "끊어", "이어", "막아", "두텁", "실리", "세력", "형세", "착각", "역전", "사석", "타개", "패싸움", "꽃놀이패",
      "먹여치", "환격", "축", "장문", "호구", "마늘모", "날일자", "눈목자", "한칸", "두칸", "붙임", "젖힘", "끊음", "뻗음", "밀어붙", "삭감", "침입", "공격", "수상전",
      "사활", "집", "덤", "불계", "계가", "승률", "블루스팟", "인공지능", "착점", "응수", "변화", "변화도", "참고도", "실전", "귀", "변", "중앙", "삼삼", "화점", "소목"}
PRE = [("흙", "흑"), ("100", "백")]
# 11-07 v0 짝 표에서 눈으로 본 오인식 후보 — 자동 후보와 똑같이 학습 정밀도 검사를 통과해야 채택
MANUAL = [("빈산각", "빈삼각"), ("빈상각", "빈삼각"), ("폐착", "패착"), ("이원욱", "이현욱"), ("이연욱", "이현욱"), ("니드", "리드"), ("스승", "수순"), ("미러", "밀어")]  # 한 글자·숫자 어간: 조사가 붙을 때만
JOSA = ("이", "은", "을", "의", "도", "돌", "한테", "에게", "이가", "으로", "로", "만", "과", "와", "쪽", "번")


def norm(s):
    return re.sub(r"[^가-힣A-Za-z0-9]", "", s)


def lev(a, b):
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def subs_events(vid):
    f = next((B / "subs").glob(f"{vid}*.json3"), None)
    if not f:
        return []
    return [(e.get("tStartMs", 0) / 1000, "".join(s.get("utf8", "") for s in e.get("segs") or []).strip()) for e in json.loads(f.read_text()).get("events", [])]


def chunks(ids):
    out = []
    for jf in sorted(B.glob("*/flash_*/gemini_full.json")):
        vid = jf.parent.parent.name
        if vid not in ids:
            continue
        j = json.loads(jf.read_text())
        s0, s1 = j["_meta"]["window"]
        ref = " ".join(s.get("line") or "" for s in j["scenes"])
        pf = jf.parent.parent / f"pro_{s0}" / "gemini_full_raw.txt"  # Pro 정답본이 있으면 그쪽(Flash는 요약·누락이 섞인다 — 11-07 jvN 실측)
        if pf.exists():  # Pro 출력은 상한에서 잘려 JSON이 깨져 있다(11-07 실측 6/6) → 끝난 장면만 정규식으로, 비교 창도 그 장면 끝까지
            sc = re.findall(r'"t_end":\s*"(\d+):(\d+)".*?"line":\s*"((?:[^"\\]|\\.)*)"\s*\n?\s*\}', pf.read_text(), re.S)
            if len(sc) >= 5:
                ref = " ".join(x[2] for x in sc)
                s1 = s0 + int(sc[-1][0]) * 60 + int(sc[-1][1])
        hyp = " ".join(x for t, x in subs_events(vid) if s0 <= t < s1 and x)
        if hyp:
            out.append((vid, s0, s1, ref, hyp))
    return out


def align(ref, hyp):
    a, b = ref.split(), hyp.split()
    m = [None] * len(b)
    for op, i1, i2, j1, j2 in SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op in ("equal", "replace") and i2 - i1 == j2 - j1:
            for d in range(j2 - j1):
                m[j1 + d] = a[i1 + d]
    return b, m


def stem_pair(r, h):
    k = 0
    while k < min(len(r), len(h)) - 1 and r[-1 - k] == h[-1 - k]:
        k += 1
    return (r[:len(r) - k], h[:len(h) - k]) if k else (r, h)


def hit(tn, h, pre):
    if not tn.startswith(h):
        return False
    rest = tn[len(h):]
    return (rest in JOSA or rest == "") if pre else len(rest) <= 3


def apply_rules(text, rules):
    """rules: [(오인식, 정답, pre?)] — 어절마다 첫 규칙 하나. 반환 (교정문, 바뀐 어절 수)."""
    out, n = [], 0
    for t in text.split():
        tn = norm(t)
        for h, r, pre in rules:
            if hit(tn, h, pre) and not (pre and h == "100" and tn == "100"):
                out.append(r + tn[len(h):]); n += 1; break
        else:
            out.append(t)
    return " ".join(out), n


def precision(rule, aligned):
    h, rs, pre = rule
    app = ok = bad = 0
    for toks, m in aligned:
        for t, r in zip(toks, m):
            tn = norm(t)
            if not hit(tn, h, pre):
                continue
            app += 1
            if r is None:
                continue
            if norm(r) == tn:
                bad += 1
            elif norm(r).startswith(rs):
                ok += 1
    return app, ok, bad


def cer(ref, hyp):
    a, b = norm(ref), norm(hyp)
    return lev(a, b), len(a)


def main():
    train, hold = chunks(set(LHW) - HOLD), chunks(HOLD)
    v1r = [(h, r, False) for h, r in V1]
    train_v1 = [(vid, s0, s1, ref, apply_rules(hyp, v1r)[0]) for vid, s0, s1, ref, hyp in train]
    aligned = [align(ref, hyp) for *_, ref, hyp in train_v1]
    cand, cch = Counter(), defaultdict(set)
    for (vid, s0, *_), (toks, m) in zip(train_v1, aligned):
        for t, r in zip(toks, m):
            if r is None:
                continue
            rn, hn = norm(r), norm(t)
            if rn and hn and rn != hn and SequenceMatcher(None, rn, hn).ratio() >= 0.34:
                rs, hs = stem_pair(rn, hn)
                if len(hs) >= 2 and rs and rs != hs and not (rs.startswith(hs) or hs.startswith(rs)) and any(g in rs for g in GO):
                    cand[(hs, rs)] += 1; cch[(hs, rs)].add(f"{vid}:{s0}")
    keep, drop = [], []
    for (hs, rs), n in cand.most_common():
        if len(cch[(hs, rs)]) < 2:
            continue
        app, ok, bad = precision((hs, rs, False), aligned)
        rec = {"from": hs, "to": rs, "pre": False, "n": n, "chunks": len(cch[(hs, rs)]), "applicable": app, "ok": ok, "bad": bad,
               "precision": round(ok / max(1, ok + bad), 3)}
        (keep if ok + bad and rec["precision"] >= 0.9 else drop).append(rec)
    for h, r in MANUAL:
        if any(k["from"] == h for k in keep):
            continue
        app, ok, bad = precision((h, r, False), aligned)
        rec = {"from": h, "to": r, "pre": False, "manual": True, "applicable": app, "ok": ok, "bad": bad, "precision": round(ok / max(1, ok + bad), 3)}
        (keep if ok + bad and rec["precision"] >= 0.9 else drop).append(rec)
    for h, r in PRE:
        app, ok, bad = precision((h, r, True), aligned)
        rec = {"from": h, "to": r, "pre": True, "applicable": app, "ok": ok, "bad": bad, "precision": round(ok / max(1, ok + bad), 3)}
        (keep if ok + bad and rec["precision"] >= 0.9 else drop).append(rec)
    lr = [(k["from"], k["to"], k["pre"]) for k in keep]
    both = sorted(v1r + lr, key=lambda x: -len(x[0]))
    ev = []
    for vid, s0, s1, ref, hyp in hold:
        e0, nref = cer(ref, hyp)
        h1, n1 = apply_rules(hyp, v1r)
        h2, n2 = apply_rules(hyp, both)
        # 과교정: 규칙이 바꾼 어절 중 정렬된 정답이 원 자막과 같던 것
        toks, m = align(ref, hyp)
        over = sum(1 for t, r in zip(toks, m) if r is not None and norm(r) == norm(t) and apply_rules(t, both)[1])
        ev.append({"id": vid, "s0": s0, "ref_chars": nref, "cer_raw": round(e0 / nref, 4), "cer_v1": round(cer(ref, h1)[0] / nref, 4),
                   "cer_v1_lhw": round(cer(ref, h2)[0] / nref, 4), "fix_v1": n1, "fix_v1_lhw": n2, "overcorrect": over})
    tot = lambda k: round(sum(e[k] * e["ref_chars"] for e in ev) / sum(e["ref_chars"] for e in ev), 4)
    summ = {"hold_ids": sorted(HOLD), "chunks_train": len(train), "chunks_hold": len(hold), "rules": len(keep),
            "cer_raw": tot("cer_raw"), "cer_v1": tot("cer_v1"), "cer_v1_lhw": tot("cer_v1_lhw"), "overcorrect": sum(e["overcorrect"] for e in ev)}
    (B / "lexicon_lhw.json").write_text(json.dumps({"rules": keep, "dropped": drop[:80], "base": "lexicon_v1"}, ensure_ascii=False, indent=1))
    (B / "lexicon_lhw_eval.json").write_text(json.dumps({"summary": summ, "chunks": ev}, ensure_ascii=False, indent=1))
    print(json.dumps(summ, ensure_ascii=False))
    for k in keep:
        print("채택", k["from"], "→", k["to"], "pre" if k["pre"] else "", f"정밀 {k['precision']} ({k['ok']}/{k['ok'] + k['bad']}) 적용 {k['applicable']}")
    for k in drop[:15]:
        print("탈락", k["from"], "→", k["to"], f"정밀 {k['precision']} ({k['ok']}/{k['ok'] + k['bad']}) 적용 {k['applicable']}")


if __name__ == "__main__":
    main()
