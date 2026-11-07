#!/usr/bin/env python3
"""유니 합성 대사 자동 점검 v0.

  python3 check.py [--gen ~/.monkos/uni-caster/gen]

점검 (ORDER_20261107 막내4 §1-4):
  A 형식      — 카드↔대화 짝, 첫·끝 턴 유니, 편당 유니 문장 ≥ 9, act 값
  B 선판단    — 유니 평서문의 판단 말·수 이름·숫자가 같은 대화 앞선 해설자 턴에 없음 (목표 0)
  C 시그니처  — 장면당 ≤ 1, signature_ok 일치, 남발(전체 비율)
  D 호칭·좌표 — 해설자님/해설자께서 외 호칭, 좌표 표기, 대국자 정보
  E 원문 일치 — 실제 방송 발화(정제 v1 전 화자 + 이현욱 짝 + 장면 사전)와 연속 8어절 이상 일치
  F 분포 거리 — 유니 문장 특징 분포 vs 실제 캐스터 분포(총변동거리, 0=같음)
출력: reports/CHECK_v0.md · ~/.monkos/uni-caster/check_v0.json(위반 목록 — 문장 포함)
"""
import argparse
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import features as F  # noqa: E402

D = os.path.expanduser("~/.monkos/uni-caster")
REFINE = os.path.expanduser("~/.monkos/go-board/analysis/commentary_v0/refine")
LHW = os.path.expanduser("~/.monkos/go-commentary-yt/lhw/pairs_v0.jsonl")
SCENE_DICT = os.path.expanduser("~/.monkos/go-board/analysis/commentary_v0/scene_dict_v0.jsonl")
ACTS = {"열기", "질문", "리액션", "되받기", "정리", "넘기기", "모름"}
SIG = {"멋진 수": re.compile(r"멋진 수가 숨어"), "뭐가 뭔지": re.compile(r"뭐가 뭔지 하나도 모르겠")}

# 판단 말 묶음: 유니 평서문에 묶음의 어간이 나오면, 같은 묶음 어간이 앞선 해설자 턴에 있어야 한다
JUDGE = {
    "좋다·나쁘다(수 평가)": r"좋은 수|나쁜 수|좋은 선택|좋지 않은|안 좋은|아쉬운 수|아쉬웠",
    "실수·악수": r"실수|악수|패착|손해수",
    "정수·최선": r"정수|최선|정답|1순위|올바른",
    "묘수·맥점": r"묘수|맥점|급소|요처|고급 행마|명수|호수",
    "손익": r"손해|이득|손실|득을|이익",
    "형세 우열": r"유리|불리|우세|열세|앞서|앞선|뒤지|뒤져|뒤처|이기고 있|밀리고 있|역전",
    "두터움": r"두텁|두터|두껍|두꺼",
    "실리": r"실리",
    "대세": r"대세",
    "완급": r"급한 곳|급한 자리|완급|큰 곳|큰곳|더 큰",
    "응징": r"응징|혼내|노림|노렸",
    "승부": r"승부가 (?:났|갈|끝)|승부처|끝났|결정적|이긴 바둑|(?<!뒤)진 바둑",
}
SHAPES = {
    "붙임": r"붙[이여였임]", "젖힘": r"젖[히혀혔힘]", "끊음": r"끊[어었음고]", "이음": r"이음|이어 (?:두|붙|잇)|잇[고는다]|이은 수",
    "단수": r"단수", "따냄": r"따[내냈냄]|잡[아았]", "빵때림": r"빵때", "호구": r"호구", "빈삼각": r"빈삼각",
    "밀기": r"밀[어었기고]", "뻗음": r"뻗", "막음": r"막[아았음고]", "끼움": r"끼[워웠움]", "껴붙임": r"껴붙",
    "마늘모": r"마늘모", "한칸뜀": r"한칸|한 칸", "두칸뜀": r"두칸|두 칸", "날일자": r"날일자", "눈목자": r"눈목자",
    "협공": r"협공", "걸침": r"걸[쳐쳤침]", "굳힘": r"굳[혀혔힘]", "치중": r"치중", "들여다봄": r"들여다",
    "어깨짚기": r"어깨", "모자": r"모자|씌[워움]", "내려섬": r"내려[서섰섬]", "벌림": r"벌[려렸림]", "밀어올림": r"밀어올",
    "바꿔치기": r"바꿔치기|바꿔", "끼워 이음": r"끼워 이",
}
# 해설자 쪽은 동사 활용형까지 넓게 본다(해설자가 '끊은 수'라 하고 유니가 '끊음'이라 되받으면 통과)
SAID_SHAPES = dict(SHAPES, **{
    "붙임": r"붙[이여였임인]", "젖힘": r"젖[히혀혔힘힌]", "끊음": r"끊[어었음고는은]", "이음": r"이[음었은어]|잇",
    "따냄": r"따[내냈냄낸]|잡[아았은는]", "막음": r"막[아았음고는은]", "밀기": r"밀[어었기고는은]", "끼움": r"끼[워웠움운]",
    "껴붙임": r"껴붙", "걸침": r"걸[쳐쳤침친]", "굳힘": r"굳[혀혔힘힌]", "벌림": r"벌[려렸림린]", "내려섬": r"내려[서섰섬선]",
})
NUM = re.compile(r"([0-9]+(?:\.[0-9]+)?|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|스무|스물\S*|서른\S*|마흔\S*|쉰\S*|예순\S*|일흔\S*|여든\S*|아흔\S*|반)\s*(집|퍼센트|%)")
NUM2 = re.compile(r"([0-9]+)\s*(%|퍼센트)")
HONOR_BAD = re.compile(r"위원님|선생님|작가님|사부님|프로님")
HONOR_OK = re.compile(r"해설자(님|께서)")
COORD = re.compile(r"(?<![A-Za-z])[A-HJ-T](1[0-9]|[1-9])(?![0-9A-Za-z])")
PLAYER = re.compile(r"[0-9]+단|G[0-9]+|[0-9]{4}년")


def load_gen(gdir):
    out = []
    for f in sorted(glob.glob(os.path.join(gdir, "part*.jsonl"))):
        for i, line in enumerate(open(f, encoding="utf-8")):
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                out.append({"_bad": f"{os.path.basename(f)}:{i + 1}"})
    return out


def real_corpus():
    texts = []
    for f in glob.glob(os.path.join(REFINE, "v1_*_in*.jsonl")) + glob.glob(os.path.join(REFINE, "pilot_*_in*.jsonl")):
        for line in open(f, encoding="utf-8"):
            texts.append(json.loads(line).get("text", ""))
    for p in (LHW, SCENE_DICT):
        if os.path.exists(p):
            for line in open(p, encoding="utf-8"):
                texts.append(json.loads(line).get("text", ""))
    return texts


def norm_words(s):
    return re.sub(r"[^\w\s]", " ", s).split()


def shingles(texts, k=8):
    sh = set()
    for t in texts:
        w = norm_words(re.sub(r"\[[^\]]*\]|>>", " ", t))
        for i in range(len(w) - k + 1):
            sh.add(" ".join(w[i:i + k]))
    return sh


def judge_violations(dlg):
    """유니 평서문 선판단. 반환: [(턴 번호, 문장, 사유)]"""
    out, said = [], ""
    for ti, t in enumerate(dlg.get("turns", [])):
        if t.get("spk") == "해설자":
            said += " " + t.get("text", "")
            continue
        for s in F.sentences(t.get("text", "")):
            if F.is_question(s) or s.rstrip().endswith("?"):
                continue
            if any(r.search(s) for r in SIG.values()):
                continue  # 시그니처는 C에서
            for name, pat in JUDGE.items():
                if re.search(pat, s) and not re.search(pat, said):
                    out.append((ti, s, f"판단:{name}"))
            for name, pat in SHAPES.items():
                if re.search(pat, s) and not re.search(SAID_SHAPES.get(name, pat), said):
                    out.append((ti, s, f"수 이름:{name}"))
            for m in NUM.finditer(s):
                if m.group(1) not in said:
                    out.append((ti, s, f"숫자:{m.group(0)}"))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gen", default=os.path.join(D, "gen"))
    a = ap.parse_args()
    cards = {json.loads(x)["scene_id"]: json.loads(x) for x in open(os.path.join(D, "scene_cards_v0.jsonl"), encoding="utf-8")}
    for f in glob.glob(os.path.join(D, "batches", "part*.jsonl")):  # 묶음의 signature_use(v1) 덧씌움
        for x in open(f, encoding="utf-8"):
            b = json.loads(x)
            if b["scene_id"] in cards and "signature_use" in b:
                cards[b["scene_id"]]["signature_use"] = b["signature_use"]
    gen = load_gen(a.gen)
    bad = [g["_bad"] for g in gen if "_bad" in g]
    gen = [g for g in gen if "_bad" not in g]
    got = Counter(g.get("scene_id") for g in gen)
    missing = sorted(set(cards) - set(got))
    dup = sorted(k for k, v in got.items() if v > 1)

    form, judge, sig_bad, honor, coord, player, longm = [], [], [], [], [], [], []
    sig_use = Counter()
    uni_texts, uni_sents, n_turn_uni, n_turn_com = [], 0, 0, 0
    acts = Counter()
    real = real_corpus()
    sh = shingles(real)
    per_type = defaultdict(lambda: [0, 0])  # 유형 → [편, 유니 문장]
    for g in gen:
        sid = g.get("scene_id")
        c = cards.get(sid, {})
        turns = g.get("turns") or []
        if not turns or turns[0].get("spk") != "유니" or turns[-1].get("spk") != "유니":
            form.append((sid, "첫·끝 턴 유니 아님"))
        ns = 0
        sig_here = Counter()
        for t in turns:
            spk, txt = t.get("spk"), t.get("text", "")
            if spk not in ("유니", "해설자"):
                form.append((sid, f"spk 값 {spk}"))
            if COORD.search(txt):
                coord.append((sid, spk, txt))
            if PLAYER.search(txt):
                player.append((sid, spk, txt))
            if spk != "유니":
                n_turn_com += 1
                continue
            n_turn_uni += 1
            acts[t.get("act")] += 1
            if t.get("act") not in ACTS:
                form.append((sid, f"act 값 {t.get('act')}"))
            uni_texts.append(txt)
            ss = F.sentences(txt)
            ns += len(ss)
            if HONOR_BAD.search(txt):
                honor.append((sid, txt))
            for s in ss:
                w = norm_words(s)
                for i in range(len(w) - 7):
                    if " ".join(w[i:i + 8]) in sh:
                        longm.append((sid, s))
                        break
            for k, r in SIG.items():
                if r.search(txt):
                    sig_here[k] += 1
        uni_sents += ns
        per_type[c.get("type", "?")][0] += 1
        per_type[c.get("type", "?")][1] += ns
        if ns < 9:
            form.append((sid, f"유니 문장 {ns} < 9"))
        for k, v in sig_here.items():
            sig_use[k] += v
            if v > 1:
                sig_bad.append((sid, f"{k} {v}회"))
            if c.get("signature_ok") != k:
                sig_bad.append((sid, f"{k} — 이 장면 허용 {c.get('signature_ok')}"))
            elif c.get("signature_use") is False:
                sig_bad.append((sid, f"{k} — 이 장면 signature_use false(v1 1/3 축소)"))
        for ti, s, why in judge_violations(g):
            judge.append((sid, ti, s, why))

    prof = json.load(open(os.path.join(HERE, "data", "caster_profile_v0.json"), encoding="utf-8"))["scene"]
    up = F.profile(uni_texts)
    dist = {k: round(F.tv_distance(up[k], prof[k]), 3) for k in ("length", "ending", "head", "qtype")}
    sig_scenes = sum(1 for g in gen if any(r.search(t.get("text", "")) for t in g.get("turns", []) if t.get("spk") == "유니" for r in SIG.values()))
    res = {
        "dialogs": len(gen), "cards": len(cards), "missing": missing, "dup": dup, "bad_json": bad,
        "uni_turns": n_turn_uni, "com_turns": n_turn_com, "uni_sentences": uni_sents, "acts": dict(acts),
        "per_type": {k: v for k, v in per_type.items()},
        "judge_violation_sentences": len({(x[0], x[2]) for x in judge}), "judge": judge,
        "sig_use": dict(sig_use), "sig_scenes": sig_scenes, "sig_bad": sig_bad,
        "honor": honor, "coord": coord, "player": player, "long_match": longm, "form": form,
        "dist": dist, "uni_profile": up, "real_shingles": len(sh), "real_texts": len(real),
    }
    json.dump(res, open(os.path.join(D, "check_v0.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    def tbl(c, ref=None):
        t = sum(c.values()) or 1
        rt = sum(ref.values()) or 1 if ref else 1
        keys = sorted(set(c) | set(ref or {}), key=lambda k: -(c.get(k, 0)))
        return "\n".join(f"| {k} | {c.get(k, 0) / t:.1%} | {(ref or {}).get(k, 0) / rt:.1%} |" for k in keys)

    jcount = Counter(x[3].split(":")[0] for x in judge)
    jtop = Counter(x[3] for x in judge).most_common(10)
    md = f"""---
type: research
date: 2026-11-07
portfolio: PF_PRESENTATION
source: apps/uni-caster/check.py
---

# 유니 합성 대사 v0 — 자동 점검

> 입력 = 장면 카드 {len(cards)} · 대화 {len(gen)}편 (레포 밖 `~/.monkos/uni-caster/gen/`). 위반 문장 목록 = 레포 밖 `check_v0.json`.

## 1. 규모

| 항목 | 값 |
|---|---|
| 대화 | {len(gen)} (누락 {len(missing)} · 중복 {len(dup)} · JSON 오류 {len(bad)}) |
| 유니 턴 / 문장 | {n_turn_uni} / **{uni_sents}** |
| 해설자 턴 | {n_turn_com} |
| 유형별(편 · 유니 문장) | {' · '.join(f"{k} {v[0]}·{v[1]}" for k, v in per_type.items())} |
| 유니 act | {' · '.join(f"{k} {v}" for k, v in acts.most_common())} |

## 2. 점검 결과

| 점검 | 결과 | 목표 |
|---|---|---|
| A 형식 위반 | {len(form)} | 0 |
| **B 유니 선판단 문장** | **{res['judge_violation_sentences']}** (유형: {dict(jcount)}) | 0 |
| C 시그니처 | 사용 {sig_scenes}편 ({dict(sig_use)}) · 규칙 위반 {len(sig_bad)} | 장면당 ≤1, 허용 장면만 |
| D 호칭 위반 / 좌표 / 대국자 정보 | {len(honor)} / {len(coord)} / {len(player)} | 0 |
| E 실제 방송과 연속 8어절+ 일치 | {len(longm)} (대조 발화 {len(real)} · 8어절 조각 {len(sh)}) | 0 |

B 상위 사유: {', '.join(f'{k} {v}' for k, v in jtop) or '없음'}

## 3. 분포 거리 (유니 vs 실제 캐스터, 총변동거리 0~1)

| 특징 | 거리 |
|---|---|
{chr(10).join(f'| {k} | {v} |' for k, v in dist.items())}

### 길이 (유니 | 실제)

| 구간 | 유니 | 실제 |
|---|---|---|
{tbl(up['length'], prof['length'])}

### 어미

| 어미 | 유니 | 실제 |
|---|---|---|
{tbl(up['ending'], prof['ending'])}

### 질문 유형

| 유형 | 유니 | 실제 |
|---|---|---|
{tbl(up['qtype'], prof['qtype'])}

## 4. 점검기 한계

- B는 어휘 규칙이다: 판단 말 묶음·수 이름·숫자가 앞선 해설자 턴에 있으면 통과 — 뜻이 바뀐 되받기("해설자께서 손해라 하셨는데 사실은 이득")는 못 잡는다. 감수 표본에서 사람이 본다.
- 실제 캐스터 분포는 자동 자막 기준이라 문장 부호가 불완전 — '명사·생략 끝'과 긴 문장이 실제 쪽에 과대. 거리는 방향 참고용.
- E는 같은 8어절 조각 일치만 본다(띄어쓰기·조사 차이는 다른 조각).
"""
    open(os.path.join(HERE, "reports", "CHECK_v0.md"), "w", encoding="utf-8").write(md)
    print(json.dumps({k: res[k] for k in ("dialogs", "uni_sentences", "judge_violation_sentences", "sig_use", "sig_scenes", "dist")}, ensure_ascii=False))
    print("form", len(form), "sig_bad", len(sig_bad), "honor", len(honor), "coord", len(coord), "player", len(player), "long", len(longm))
    print("B top", jtop)


if __name__ == "__main__":
    main()
