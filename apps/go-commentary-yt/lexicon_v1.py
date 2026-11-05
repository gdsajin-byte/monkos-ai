#!/usr/bin/env python3
"""자막 교정 사전 v1 — 학습 21편으로 규칙을 만들고 홀드아웃 9편(해설자별 3편)에서 교정 전후 오류율·과교정을 잰다 (PF_GO, 11-06 04:55 쌍아 권장안, 무료·CPU)
  lexicon_v1.py   → answers/lexicon_v1.json(규칙) + answers/lexicon_v1_eval.json + 표 출력
규칙 = 어간 치환(오인식 어간 → 정답 어간, 조사·어미는 그대로). 채택 조건 3가지:
  ① 정답 어간이 바둑 용어·귀/변 이름·사람 이름(해설·캐스터·목록 제목에 나온 한글 이름)·고유명 중 하나 — 말투 쌍(어미·감탄사) 제외
  ② 학습 편에서 이 규칙이 걸리는 자리의 정밀도 ≥ 90% (맞는 말을 바꾸는 규칙 제외)
  ③ 오인식 어간 2글자↑, 학습 편 출현 2조각↑
과교정 = 규칙이 바꾼 자리 중 원래 자막이 이미 정답과 같았던 경우(어절 정렬 기준).
"""
import json, re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

B = Path.home() / ".monkos" / "go-commentary-yt" / "answers"
CAT = Path.home() / ".monkos" / "go-commentary-yt" / "catalog.jsonl"
HERE = Path(__file__).resolve().parent
sel = json.loads((B / "selection.json").read_text())
HOLD = set()
for w in ("목진석", "이현욱", "송태곤"):
    rs = [r for r in sel if r["commentator"] == w]
    HOLD |= {rs[i]["id"] for i in (2, 5, 8)}  # 조회수 순 3·6·9위 — 고정 분할

src = (HERE.parent / "go-commentary-pilot" / "lexicon.yaml").read_text(encoding="utf-8")
TERMS = set(t.strip() for t in re.findall(r'(?:name|ko|term)\s*:\s*"?([가-힣][가-힣 ]{0,8})', src)) | {
    "대세점", "쌍립", "삼삼", "걸침", "협공", "정석", "사활", "끝내기", "포석", "행마", "수상전", "형세", "대마", "어깨짚음", "입구자", "덤", "반집", "불계",
    "두텁", "두터움", "팻감", "날일자", "눈목자", "호구", "빵따냄", "먹여치", "환격", "축", "장문", "단수", "꼬부림", "젖힘", "뻗음", "붙임", "끊음", "이음"}
TERMS = {t.replace(" ", "") for t in TERMS if t}
PLACES = {f"{a}{b}귀" for a in "좌우" for b in "상하"} | {"상변", "하변", "좌변", "우변", "중앙", "화점", "천원"}
rows = [json.loads(l) for l in CAT.read_text(encoding="utf-8").splitlines() if l.strip()]
NAMES = {n for r in rows for n in (r.get("commentator") or []) + (r.get("caster") or [])}
tc = Counter(t for r in rows for t in re.findall(r"[가-힣]{3,4}", r.get("title") or ""))
NAMES |= {t for t, n in tc.items() if n >= 3 and t[-1] not in "전배국기회컵대리그결승강"}  # 제목에 3번↑ 나온 3~4글자 = 대부분 기사 이름


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
        ev = subs_events(vid)
        hyp = " ".join(x for t, x in ev if s0 <= t < s1 and x)
        if hyp:
            out.append((vid, s0, " ".join(s.get("line") or "" for s in j["scenes"]), hyp))
    return out


def stem_pair(r, h):
    k = 0
    while k < min(len(r), len(h)) - 1 and r[-1 - k] == h[-1 - k]:
        k += 1
    return (r[:len(r) - k], h[:len(h) - k]) if k else (r, h)


def domain(stem):
    return any(t in stem for t in TERMS | PLACES) or any(n in stem or stem in n for n in NAMES if len(n) >= 3 and len(stem) >= 2)


def align(ref, hyp):
    """원 자막 어절마다 정렬된 정답 어절(1:1 치환·같음만, 나머지는 None)."""
    a, b = ref.split(), hyp.split()
    m = [None] * len(b)
    for op, i1, i2, j1, j2 in SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if op in ("equal", "replace") and i2 - i1 == j2 - j1:
            for d in range(j2 - j1):
                m[j1 + d] = a[i1 + d]
    return b, m


def apply(tokens, rules):
    out, hits = [], []
    for i, t in enumerate(tokens):
        n = norm(t)
        for h, r in rules:
            if n.startswith(h) and len(n) - len(h) <= 3:
                out.append(r + n[len(h):]); hits.append(i); break
        else:
            out.append(t)
    return out, hits


train = chunks({r["id"] for r in sel} - HOLD)
hold = chunks(HOLD)
# 1) 후보: 학습 편 어절 치환 → 어간 쌍
cand, cand_chunks = Counter(), defaultdict(set)
for vid, s0, ref, hyp in train:
    toks, m = align(ref, hyp)
    for t, r in zip(toks, m):
        if r is None:
            continue
        rn, hn = norm(r), norm(t)
        if rn and hn and rn != hn and SequenceMatcher(None, rn, hn).ratio() >= 0.34:
            rs, hs = stem_pair(rn, hn)
            if len(hs) >= 2 and rs and rs != hs and not (rs.startswith(hs) or hs.startswith(rs)):  # 한쪽이 다른 쪽 앞부분 = 조사·어미 차이(말투) 제외
                cand[(hs, rs)] += 1; cand_chunks[(hs, rs)].add(f"{vid}:{s0}")
# 2) 채택: 도메인 + 학습 정밀도
keep, drop = [], []
aligned_train = [align(ref, hyp) for _, _, ref, hyp in train]
for (hs, rs), n in cand.most_common():
    if len(cand_chunks[(hs, rs)]) < 2:
        continue
    app = ok = bad = 0
    for toks, m in aligned_train:
        for t, r in zip(toks, m):
            tn = norm(t)
            if tn.startswith(hs) and len(tn) - len(hs) <= 3:
                app += 1
                if r is None:
                    continue  # 정렬 불명 — 판정 제외
                if norm(r) == tn:
                    bad += 1  # 원래 맞는 말을 바꾸게 됨
                elif norm(r) == rs + tn[len(hs):] or norm(r).startswith(rs):
                    ok += 1
                else:
                    bad += 1
    prec = ok / (ok + bad) if ok + bad else 0
    row = {"from": hs, "to": rs, "n": n, "chunks": len(cand_chunks[(hs, rs)]), "applicable": app, "precision": round(prec, 3), "domain": domain(rs)}
    # 2글자 오인식 어간은 이름 앞부분과 겹치기 쉽다(홀드아웃 실측: 김민→김은이 '김민서'를, 이재→이지가 '이재성'을 망침) — 학습 적용 20회↑만
    short_ok = len(hs) >= 3 or app >= 20
    (keep if row["domain"] and prec >= 0.9 and short_ok else drop).append(row)
rules = sorted([(k["from"], k["to"]) for k in keep], key=lambda x: -len(x[0]))
# 3) 홀드아웃 평가
WORDS = sorted({t for _, t in rules} | PLACES | {t for t in TERMS if len(t) >= 2})
ev = {"dom_n": 0, "dom_b": 0, "dom_a": 0, "chunks": [], "fix": 0, "over": 0, "unclear": 0, "ref_err": 0, "ref_err_ex": [], "tokens": 0, "over_ex": [], "fix_ex": []}
ref_chars = before = after = 0
for vid, s0, ref, hyp in hold:
    toks, m = align(ref, hyp)
    new, hits = apply(toks, rules)
    ev["tokens"] += len(toks)
    for i in hits:
        r = m[i]
        if r is None:
            ev["unclear"] += 1
        elif norm(r) == norm(toks[i]) and any(norm(new[i]).startswith(pl) for pl in PLACES) and not any(norm(r).startswith(pl) for pl in PLACES):
            ev["ref_err"] += 1  # 정답본(Flash)이 '좌하기'처럼 귀 이름을 틀리게 적은 자리 — 교정이 맞다
            ev["ref_err_ex"].append({"id": vid, "s0": s0, "자막": toks[i], "교정": new[i], "정답본": r})
        elif norm(r) == norm(toks[i]):
            ev["over"] += 1
            ev["over_ex"].append({"id": vid, "s0": s0, "자막(맞음)": toks[i], "바꾼 것": new[i], "정답": r})
        elif norm(r) == norm(new[i]):
            ev["fix"] += 1
            ev["fix_ex"].append({"id": vid, "자막": toks[i], "교정": new[i], "정답": r})
        else:
            ev["unclear"] += 1
    a, b0, b1 = norm(ref), norm(hyp), norm(" ".join(new))
    for w in WORDS:
        c = a.count(w)
        if c:
            ev["dom_n"] += c; ev["dom_b"] += min(c, b0.count(w)); ev["dom_a"] += min(c, b1.count(w))
    e0, e1 = lev(a, b0), lev(a, b1)
    ref_chars += len(a); before += e0; after += e1
    ev["chunks"].append({"id": vid, "s0": s0, "cer_before": round(e0 / len(a), 4), "cer_after": round(e1 / len(a), 4), "changed": len(hits)})
applied = ev["fix"] + ev["over"] + ev["unclear"] + ev["ref_err"]
summ = {"train_videos": 30 - len(HOLD), "hold_videos": len(HOLD), "hold_ids": sorted(HOLD), "train_chunks": len(train), "hold_chunks": len(hold),
        "rules": len(rules), "cer_before": before / ref_chars, "cer_after": after / ref_chars, "applied": applied, "fix": ev["fix"], "over": ev["over"],
        "unclear": ev["unclear"], "ref_err": ev["ref_err"], "over_rate_applied": ev["over"] / applied if applied else 0, "over_rate_tokens": ev["over"] / max(1, ev["tokens"]), "tokens": ev["tokens"], "domain_recall_before": ev["dom_b"] / max(1, ev["dom_n"]), "domain_recall_after": ev["dom_a"] / max(1, ev["dom_n"]), "domain_n": ev["dom_n"]}
(B / "lexicon_v1.json").write_text(json.dumps({"rules": keep, "dropped": drop[:200], "names_n": len(NAMES)}, ensure_ascii=False, indent=1))
(B / "lexicon_v1_eval.json").write_text(json.dumps({"summary": summ, **ev}, ensure_ascii=False, indent=1))
print(json.dumps(summ, ensure_ascii=False, indent=1))
print("채택 규칙:", ", ".join(f"{k['from']}→{k['to']}({k['precision']:.0%}/{k['applicable']})" for k in keep[:60]))
print("탈락 상위(도메인인데 정밀도 미달):", ", ".join(f"{k['from']}→{k['to']}({k['precision']:.0%})" for k in drop if k["domain"])[:600])
print("과교정 예:", ev["over_ex"][:8])
print("정답본 오류 예:", ev["ref_err_ex"][:5])
print("교정 예:", ev["fix_ex"][:10])
