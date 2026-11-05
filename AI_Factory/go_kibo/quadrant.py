"""사분면 정의 정본 — 필연성(1·2순위 집 차) × 발견 난도(신경망 직감 prior). 형세봇 설계 §2-4.

쓰는 곳(사본 금지 — 여기만 고친다):
  - AI_Factory/go_kibo/analyze_mistakes.py   실수 사전 사분면 라벨
  - apps/go-commentary-pilot/concepts.py     해설 추임새 '와우'·'외길'·급소 난도 조건

판정 이력: 11-05 21:35 쌍아 — 필연성은 부호값 max(0, 1순위 − 2순위)(두는 쪽 기준), AI식 감각수 하한 2집.
"""

QUAD_GAP = 6.0        # 외길: 1·2순위 scoreLead 차(집) ≥
QUAD_EASY = 0.7       # 쉽게 찾음: 1순위 수의 직감(prior) ≥
QUAD_HARD = 0.3       # 어려움(못 찾음): prior <
QUAD_SENSE_MIN = 2.0  # AI식 감각수 하한: 1·2순위 차 ≥ (0집대는 평범)

QUAD_KO = {"obvious": "당연한 수", "brilliant": "묘수", "missed_brilliant": "놓친 묘수", "blunder_obvious": "착각",
           "ai_sense": "AI식 감각수", "normal": "평범"}


def necessity_gap(signed_gap):
    """1·2순위 차(두는 쪽 부호값) → 필연성. 2순위가 더 높으면 '대안 동등' 0."""
    return None if signed_gap is None else max(0.0, signed_gap)


def quad_of(gap, prior_best, is_best, gap_t=None, easy=None, hard=None, sense_min=None):
    """gap = 필연성(necessity_gap 결과), prior_best = 1순위 수 직감, is_best = 둔 수가 1순위인가."""
    gap_t = QUAD_GAP if gap_t is None else gap_t
    easy = QUAD_EASY if easy is None else easy
    hard = QUAD_HARD if hard is None else hard
    sense_min = QUAD_SENSE_MIN if sense_min is None else sense_min
    if gap is None or prior_best is None:
        return "normal"
    if gap >= gap_t:
        if prior_best >= easy:
            return "obvious" if is_best else "blunder_obvious"
        if prior_best < hard:
            return "brilliant" if is_best else "missed_brilliant"
        return "normal"
    return "ai_sense" if (prior_best < hard and gap >= sense_min) else "normal"


# 국면 단계(수순 기준) — 실수 사전 보고서와 해설 사전의 단계별 이름(phase_names)이 같이 쓴다
PHASE_OPENING_MAX = 50
PHASE_MIDDLE_MAX = 150


def phase_of(move_no):
    return "포석" if move_no <= PHASE_OPENING_MAX else "중반" if move_no <= PHASE_MIDDLE_MAX else "끝내기"
