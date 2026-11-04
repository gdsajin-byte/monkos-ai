"""go_kibo 공용 — 경로·급수 코드·AI 판별·SGF 헤더 파서 (표준 라이브러리만)."""
import os
import re

KIBO_DIR = os.path.expanduser(os.environ.get("GO_KIBO_DIR", "~/.monkos/go-board/kibo/tygem/mine"))
ANALYSIS_DIR = os.path.expanduser(os.environ.get("GO_ANALYSIS_DIR", "~/.monkos/go-board/analysis"))

def _me():
    """작가님 대국 아이디 — 레포에 두지 않는다. 환경변수 GO_KIBO_ME 또는 $GO_ANALYSIS_DIR/me.txt."""
    v = os.environ.get("GO_KIBO_ME")
    if v:
        return v.strip()
    p = os.path.join(ANALYSIS_DIR, "me.txt")
    if os.path.exists(p):
        return open(p, encoding="utf-8").read().strip()
    raise SystemExit("❌ go_kibo: 작가님 아이디 미설정 — GO_KIBO_ME 또는 " + p)


ME = _me()

# 타이젬 급수 코드: 18=1단 … 26=9단, 17=1급 … (gib GAMExxxLEVEL과 대조 실측 2026-11-04)
# 27은 AI 계정·특수 계정에서만 관측 → "특수"로 표기.
def rank_label(code):
    if code is None:
        return "?"
    if code >= 27:
        return "특수(27)"
    if code >= 18:
        return f"{code - 17}단"
    return f"{18 - code}급"

AI_NAME = re.compile(r"(?i)^(ai_|katago)")

def is_ai(name):
    return bool(name) and bool(AI_NAME.match(name))

_PROP = re.compile(r"([A-Z]{1,2})\[((?:[^\]\\]|\\.)*)\]")

def sgf_header_and_moves(text):
    """루트 노드 속성 dict, 착수 리스트 [(color, 'pd'|''), ...]"""
    first = text.find(";", 1)
    second = text.find(";", first + 1)
    root = text[first:second if second > 0 else len(text)]
    props = {}
    for k, v in _PROP.findall(root):
        props.setdefault(k, v)
    # 접바둑 AB는 여러 값
    m = re.search(r"AB((?:\[[a-s]{2}\]\s*)+)", root)
    ab = re.findall(r"\[([a-s]{2})\]", m.group(1)) if m else []
    moves = re.findall(r";([BW])\[([a-s]{0,2})\]", text[second:] if second > 0 else "")
    return props, ab, moves
