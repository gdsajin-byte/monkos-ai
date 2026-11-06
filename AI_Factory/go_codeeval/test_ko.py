"""패 시험 — ① 진행 중 패(흑 E3 가 D3 백 1점을 따냄 → 패) ② 패 없는 같은 판(대조군) ③ 형세 문구"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import codeeval as ce  # noqa: E402
from lifestage import active_ko  # noqa: E402

KO = [("B", "D4"), ("W", "E4"), ("B", "C3"), ("W", "D3"), ("B", "D2"), ("W", "F3"), ("B", "Q16"), ("W", "E2"), ("B", "E3")]
r = active_ko(KO)
print("① 진행 중 패:", r and (f"{ce.COLS[r[0] % 19]}{19 - r[0] // 19}", f"{ce.COLS[r[1] % 19]}{19 - r[1] // 19}"), "← 기대 (D3, E3)")
print("② 대조군(마지막 수 Q4, 따냄 없음):", active_ko(KO[:-1] + [("B", "Q4")]), "← 기대 None")
e = ce.evaluate(KO, komi=6.5, use_life="staged")
print("③ 형세:", e["text"], "· 패", [(k["kind"], k["where"], k["swing"]) for k in e["ko"]])
assert r and r[0] == ce.idx("D3") and r[1] == ce.idx("E3")
assert active_ko(KO[:-1] + [("B", "Q4")]) is None
print("PASS")
