#!/usr/bin/env python3
"""유니 캐스터 — 말투 특징 추출(실제 캐스터 발화·합성 대사 공용). 표준 라이브러리만.

특징 4종 (ORDER_20261107 막내4 §1-1):
  어미   — 문장 끝 어절의 종결 어미 계열
  추임새 — 문장 첫머리 감탄·진행 표지(자·아·네·와·오·음·어) + 단독 반응 발화
  질문   — 질문 문장의 유형(왜·어떻게·확인·감탄 되묻기·의견 청하기·기타)
  길이   — 문장 어절 수 구간
분포만 다룬다. 실존 캐스터 이름·영상별 표는 이 모듈 밖(레포 밖 내부 분석)에서만.
"""
import re
from collections import Counter

_TRIM = re.compile(r"[\s\"'“”‘’…·~\-]+$")

ENDINGS = [  # (이름, 정규식) — 앞에서부터 먼저 맞는 것
    ("-네요", r"네요$"),
    ("-군요", r"군요$"),
    ("-죠", r"(죠|지요)$"),
    ("-거든요", r"거든요$"),
    ("-는데요", r"[는은ㄴ]?데요$"),
    ("-나요/-가요", r"(나요|가요)$"),
    ("-까요", r"까요$"),
    ("-세요", r"(세요|셔요)$"),
    ("-습니다/-ㅂ니다", r"(니다|니까)$"),
    ("-어요/-아요", r"[어아여워와해돼봐줘]요$|요$"),
    ("-다(평서 반말·인용)", r"다$"),
    ("명사·생략 끝", r""),
]
_END_RE = [(n, re.compile(p)) for n, p in ENDINGS]

FILLER_HEADS = ["자", "아", "네", "와", "오", "음", "어", "그럼", "그러니까", "아하"]
REACTION_ONLY = re.compile(r"^(네|음|아|오|와|어|예|그렇죠|그렇군요|맞습니다|아하|으와|우와)[.,!?~… ]*$")

Q_TYPES = [
    ("왜", re.compile(r"왜|어째서|무슨 이유|이유가")),
    ("어떻게", re.compile(r"어떻게|어떤|어디|어느|뭐가|무엇|무슨|몇")),
    ("의견 청하기", re.compile(r"(보세요|보십니까|생각하세요|어떨까요|어떠세요|예상하세요|보시나요)")),
    ("감탄 되묻기", re.compile(r"^(아|와|오|어)[,.!\s].*|(이런|그런) 수가|라고요\?|이요\?$")),
    ("확인", re.compile(r"(건가요|는 건가요|인가요|거죠|군요\?|거네요|맞나요|겠네요\?|는 거예요|나요|죠\?|요\?)")),
]

LEN_BINS = [(1, 2, "1–2어절"), (3, 5, "3–5어절"), (6, 10, "6–10어절"), (11, 20, "11–20어절"), (21, 10 ** 6, "21어절+")]


def sentences(text):
    text = re.sub(r">>", " ", text or "")
    text = re.sub(r"\[[^\]]*\]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.?!])\s+", text)
    return [p.strip() for p in parts if p.strip()]


def ending(s):
    w = _TRIM.sub("", re.sub(r"[.?!]+$", "", s)).split()
    last = w[-1] if w else ""
    for n, r in _END_RE:
        if r.pattern and r.search(last):
            return n
    return "명사·생략 끝"


def head(s):
    w = s.split()
    if not w:
        return None
    first = re.sub(r"[,.!?~…]+$", "", w[0])
    for f in FILLER_HEADS:
        if first == f:
            return f
    return None


def is_question(s):
    s2 = s.rstrip()
    return s2.endswith("?") or bool(re.search(r"(나요|까요|가요|세요|니까)[.?]?$", s2)) and not s2.endswith(".")


def qtype(s):
    for n, r in Q_TYPES:
        if r.search(s):
            return n
    return "기타"


def length_bin(s):
    n = len(s.split())
    for a, b, name in LEN_BINS:
        if a <= n <= b:
            return name
    return LEN_BINS[-1][2]


def profile(utterances):
    """utterances: 발화 문자열 목록 → 분포 dict(비율)."""
    end, hd, qt, ln = Counter(), Counter(), Counter(), Counter()
    n_s = n_q = n_react = 0
    for u in utterances:
        ss = sentences(u)
        if ss and len(ss) == 1 and REACTION_ONLY.match(ss[0]):
            n_react += 1
        for s in ss:
            if REACTION_ONLY.match(s):  # 단독 맞장구 문장은 분포에서 빼고 따로 센다
                hd["(단독 맞장구)"] += 1
                continue
            n_s += 1
            end[ending(s)] += 1
            h = head(s)
            hd[h or "(없음)"] += 1
            ln[length_bin(s)] += 1
            if is_question(s):
                n_q += 1
                qt[qtype(s)] += 1
    return {
        "utterances": len(utterances), "sentences": n_s, "questions": n_q, "reaction_only": n_react,
        "ending": dict(end), "head": dict(hd), "qtype": dict(qt), "length": dict(ln),
    }


def ratios(c):
    t = sum(c.values()) or 1
    return {k: v / t for k, v in c.items()}


def tv_distance(p, q):
    """두 분포(개수 dict)의 총변동거리 0~1."""
    a, b = ratios(p), ratios(q)
    return 0.5 * sum(abs(a.get(k, 0) - b.get(k, 0)) for k in set(a) | set(b))
