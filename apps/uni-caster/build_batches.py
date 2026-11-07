#!/usr/bin/env python3
"""장면 카드 → 일꾼 묶음(카드 + 수 번호 한국어 읽기). 생성기 v0의 입력 단.

  python3 build_batches.py [--parts 5]

입력: ~/.monkos/uni-caster/scene_cards_v0.jsonl
출력: ~/.monkos/uni-caster/batches/part{k}.jsonl  (일꾼이 읽는 카드, 좌표 칸은 유지 — 해설자 사실용. 대사엔 좌표 금지)
일꾼 출력 자리: ~/.monkos/uni-caster/gen/part{k}.jsonl
"""
import argparse
import json
import os

D = os.path.expanduser("~/.monkos/uni-caster")
UNITS = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"]
TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"]
SINO = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"]


def ordinal(n):
    """수 번호 읽기: 1~99 고유어 서수, 100+ 한자어 + '번째'."""
    if n < 100:
        t, u = divmod(n, 10)
        if n == 1:
            return "첫 번째"
        w = TENS[t] + (UNITS[u] if u else "")
        if t == 2 and u == 0:
            w = "스무"
        return w + " 번째"
    h, r = divmod(n, 100)
    t, u = divmod(r, 10)
    w = (SINO[h] if h > 1 else "") + "백" + ((SINO[t] if t > 1 else "") + "십" if t else "") + SINO[u]
    return w + " 번째"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parts", type=int, default=5)
    ap.add_argument("--sig-ratio", type=float, default=1.0, help="시그니처 허용 장면 중 실제로 쓰게 할 비율 (v0=1.0, v1=0.33)")
    a = ap.parse_args()
    cards = [json.loads(x) for x in open(os.path.join(D, "scene_cards_v0.jsonl"), encoding="utf-8")]
    # v1: 시그니처는 허용 장면의 일부만 — 종류별로 같은 비율, 시드 고정
    import random
    rnd = random.Random(20261107)
    use = set()
    for kind in ("멋진 수", "뭐가 뭔지"):
        el = [c["scene_id"] for c in cards if c.get("signature_ok") == kind]
        rnd.shuffle(el)
        use |= set(el[: round(len(el) * a.sig_ratio)])
    os.makedirs(os.path.join(D, "batches"), exist_ok=True)
    os.makedirs(os.path.join(D, "gen"), exist_ok=True)
    for k in range(a.parts):
        with open(os.path.join(D, "batches", f"part{k}.jsonl"), "w", encoding="utf-8") as f:
            for c in cards[k::a.parts]:
                c = dict(c, move_no_ko=ordinal(c["move_no"]), signature_use=c["scene_id"] in use)
                f.write(json.dumps(c, ensure_ascii=False) + "\n")
    print(len(cards), "cards →", a.parts, "parts · signature_use", len(use))


if __name__ == "__main__":
    main()
