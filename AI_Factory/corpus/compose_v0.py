#!/usr/bin/env python3
"""코드 조립형 해설 대본 v0 — LLM 없이: 장면 사실(엔진·판 검출기) + 발화 DB에서 고른 프로 해설 문장 + 틀 문장 → 대본.
작가님 05:01 "잘 정리되면 그 자체로 임베딩하여 코드와 TTS만으로도 즉시 해설이 가능할 수 있지" — 그 가능성을 G836 한 장면으로 1회 시험.

  python3 AI_Factory/corpus/compose_v0.py [--db …] [--out ~/.monkos/corpus/compose_g836.md]
고르는 규칙(새 호출 0, 임베딩 질의도 안 함 — SQL만):
  해설 발화(label 국면·형세, keep, board_dep=0) 중 장면 꼬리표(용어·개념)가 겹치는 것, 짧고(25~110자) 판 지시어 없는 것 우선.
출력 = 조립 대본 + v2(LLM 대본) + 감수 예문과 나란히 + check_overlap(원문 연속 일치) 결과. 레포 밖(방송 원문 인용 포함).
"""
import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

# 장면 사실 — 엔진(400v)·검출기(go_terms.py) 값(DIAGRAMS_v0·s02_v2.json facts와 같은 값)
SCENE = {
    "move_no": 37, "color": "흑", "pre_tags": ["끼움", "끼워잇기"], "real": "귀쪽 막기(B2)",
    "fail_tags": ["끊음", "단수", "따냄"], "ok_tags": ["밀어올림", "두점머리 젖힘", "이음", "껴붙임"],
    "loss": 9.3, "wr_before": 67, "wr_after": 5,
    "want": {"terms": ["끼우다", "밀다", "껴붙이다", "막다"], "concepts": ["바꿔치기", "두텁다", "실리", "대세"]},
}
DEIXIS = re.compile(r"여기|이쪽|요기|이렇게|이런 데|이거|저기")


def pick(db, kind, names, label=("국면", "형세"), n=1, exclude=()):
    q = f"""SELECT u.id, u.text, s.name FROM utterance u JOIN utterance_term ut ON ut.utt_id=u.id JOIN term t ON t.id=ut.term_id
            JOIN speaker s ON s.id=u.speaker_id
            WHERE u.keep=1 AND u.board_dep=0 AND u.label IN ({','.join('?' * len(label))}) AND ut.kind=? AND t.term IN ({','.join('?' * len(names))})
              AND length(u.text) BETWEEN 25 AND 110 AND s.role='해설'
            ORDER BY length(u.text) LIMIT 50"""
    rows = [r for r in db.execute(q, (*label, kind, *names)).fetchall() if not DEIXIS.search(r[1]) and r[0] not in exclude]
    return rows[:n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    ap.add_argument("--out", default=os.path.expanduser("~/.monkos/corpus/compose_g836.md"))
    a = ap.parse_args()
    db = sqlite3.connect(a.db)
    s = SCENE
    used = set()
    p_bak = pick(db, "concept", ["바꿔치기"], n=1)
    p_sil = pick(db, "concept", ["실리"], n=1, exclude={r[0] for r in p_bak})
    p_du = pick(db, "concept", ["두텁다"], n=1, exclude={r[0] for r in p_bak + p_sil})
    p_term = pick(db, "term", ["밀다", "껴붙이다"], n=1, exclude={r[0] for r in p_bak + p_sil + p_du})
    lines = [
        ("틀", f"{s['move_no']}번째 수, {s['color']} 차례입니다. 백이 끼워서 이은 장면입니다."),
        ("DB", p_bak[0][1] if p_bak else "(바꿔치기 문장 없음)"),
        ("틀", f"실전에서 흑은 {s['real']}를 선택했습니다."),
        ("DB", p_sil[0][1] if p_sil else "(실리 문장 없음)"),
        ("틀", f"이 수로 집으로 약 {round(s['loss'])}집, 승률은 {s['wr_before']}%에서 {s['wr_after']}%로 떨어졌습니다."),
        ("틀", "정수는 변쪽을 밀어올리는 수, 이어서 껴붙임입니다."),
        ("DB", p_term[0][1] if p_term else "(밀기·껴붙임 문장 없음)"),
        ("DB", p_du[0][1] if p_du else "(두터움 문장 없음)"),
    ]
    sources = {"바꿔치기": p_bak, "실리": p_sil, "두텁다": p_du, "밀다·껴붙이다": p_term}
    script = " ".join(t for _, t in lines)
    tmp = os.path.join(os.path.dirname(a.out), "compose_g836.txt")
    open(tmp, "w", encoding="utf-8").write("\n".join(t for _, t in lines) + "\n")
    chk = subprocess.run([sys.executable, os.path.join(HERE, "check_overlap.py"), tmp, "--n", "6", "--db", a.db], capture_output=True, text=True)
    v2 = json.load(open(os.path.join(ROOT, "apps", "go-explainer-e2e", "scripts", "s02_v2.json"), encoding="utf-8"))
    v2_text = [re.sub(r"<[^>]+>", "", l["text"]) for l in v2["lines"]]
    gold = [r[0] for r in db.execute("SELECT text FROM gold ORDER BY id")]
    L = ["# G836 37수 — 코드 조립형 대본 vs LLM 대본(v2) 비교 (레포 밖, 방송 원문 인용 포함)\n",
         "## A. 코드 조립형(LLM 없음 — 틀 문장 + 발화 DB SQL 선택)\n"] + [f"- [{k}] {t}" for k, t in lines] + [
         "\n**DB 문장 출처**: " + " · ".join(f"{k}=#{r[0][0]}({r[0][2]})" for k, r in sources.items() if r),
         f"\n**원문 연속 일치 검사(n=6)**:\n```\n{chk.stdout.strip()}\n```",
         "\n## B. LLM 대본 v2(s02_v2.json — 감수 1·2 반영)\n"] + [f"- {t}" for t in v2_text] + [
         "\n## C. 작가님 감수 예문(정답지)\n"] + [f"> {g}\n" for g in gold]
    open(a.out, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(chk.stdout.strip().splitlines()[-1] if chk.stdout.strip() else chk.stderr[-300:])
    print("조립 대본:", len(script), "자 · 결과:", a.out)


if __name__ == "__main__":
    main()
