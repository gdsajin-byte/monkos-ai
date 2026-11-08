#!/usr/bin/env python3
"""발화 DB 용어 칸 갱신 — 문장 용어 검출(go_kibo/go_text_terms.py) 결과를 utterance_term에 더한다. 새 유료 호출 0. 멱등.

  python3 AI_Factory/go_kibo/retag_text_terms.py v1        # 먼저: refine/v1_all_t1.jsonl
  python3 AI_Factory/corpus/tag_terms_v1.py [--db ~/.monkos/corpus/monk_corpus.db] [--dry-run]
하는 일:
  - 출처 칸 utterance_term_det(utt_id, term_id, kind, rule, detector) 를 새로 만들어 검출 행을 남긴다(일꾼 꼬리표와 구분 — 되돌리기 = 이 표의 행만 지우면 된다).
  - utterance_term 에는 합집합(INSERT OR IGNORE) — 일꾼 꼬리표 행은 건드리지 않는다.
  - 사전에 없던 표준명(완생·미생·수읽기·타개 등)은 term에 src='go_text_terms v1(보충·감수 대상)' 으로 넣는다.
  - meta에 stat_t1·built_t1_at. 전·후 용어별 빈도 표는 stdout(JSON) — 보고서는 reports/GO_TEXT_TERMS_v1.md.
load_v1.py로 DB를 다시 만들면 이 단계도 다시 돌린다(README). 규칙을 고친 뒤 다시 돌리면 지난 검출분(added=1)을 되돌리고 새로 넣는다.
"""
import argparse
import json
import os
import sqlite3
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "go_kibo"))
from go_text_terms import SUPPLEMENT  # noqa: E402

REFINE = os.path.expanduser("~/.monkos/go-board/analysis/commentary_v0/refine")
DETECTOR = "go_text_terms v1"
KST = timezone(timedelta(hours=9))


def freq(cur):
    return Counter(dict(cur.execute("SELECT t.term, COUNT(*) FROM utterance_term ut JOIN term t ON t.id=ut.term_id GROUP BY t.term").fetchall()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    ap.add_argument("--src", default=os.path.join(REFINE, "v1_all_t1.jsonl"))
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not os.path.exists(a.db):
        raise SystemExit(f"❌ tag_terms_v1: DB 없음 {a.db}")
    if not os.path.exists(a.src):
        raise SystemExit(f"❌ tag_terms_v1: 입력 없음 {a.src} — retag_text_terms.py v1 먼저")
    db = sqlite3.connect(a.db)
    cur = db.cursor()
    cols = [r[1] for r in cur.execute("PRAGMA table_info(utterance_term_det)")]
    if cols and "added" not in cols:  # 11-08 첫 판(빈 표) — 칸 추가 전 판이면 비어 있을 때만 다시 만든다
        if cur.execute("SELECT COUNT(*) FROM utterance_term_det").fetchone()[0]:
            raise SystemExit("❌ tag_terms_v1: 옛 판 utterance_term_det에 행이 있어 되돌릴 근거(added)가 없다 — load_v1.py로 다시 만든 뒤 실행")
        cur.execute("DROP TABLE utterance_term_det")
    cur.execute("CREATE TABLE IF NOT EXISTS utterance_term_det (utt_id INTEGER NOT NULL REFERENCES utterance(id), term_id INTEGER NOT NULL REFERENCES term(id), "
                "kind TEXT NOT NULL CHECK (kind IN ('term','concept')), rule TEXT, detector TEXT NOT NULL, added INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (utt_id, term_id, kind))")
    # 재실행(규칙 개정) — 지난 검출이 utterance_term에 더한 행(added=1)을 먼저 되돌린다. 일꾼 꼬리표 행은 added=0이라 남는다.
    undone = cur.execute("DELETE FROM utterance_term WHERE EXISTS (SELECT 1 FROM utterance_term_det d WHERE d.added=1 AND d.utt_id=utterance_term.utt_id "
                         "AND d.term_id=utterance_term.term_id AND d.kind=utterance_term.kind)").rowcount
    cur.execute("DELETE FROM utterance_term_det")
    before = freq(cur)
    stat = Counter()
    tid = {}

    def term_id(name):
        if name not in tid:
            row = cur.execute("SELECT id FROM term WHERE term=?", (name,)).fetchone()
            if row is None:
                cur.execute("INSERT INTO term(term,src,detect) VALUES (?,?,?)", (name, f"{DETECTOR}({'보충·감수 대상' if name in SUPPLEMENT else 'GO_TERMS 변형'})", "문장 검출"))
                row = (cur.lastrowid,)
                stat["term_added"] += 1
            tid[name] = row[0]
        return tid[name]

    for x in open(a.src, encoding="utf-8"):
        r = json.loads(x)
        if not r.get("det"):
            continue
        u = cur.execute("SELECT id FROM utterance WHERE source_id=? AND seq=?", (f"yt:{r['id']}", r["i"])).fetchone()
        if u is None:
            stat["utt_missing"] += 1
            continue
        for name, kind, rule in r["det"]:
            t = term_id(name)
            # 같은 용어가 일꾼 꼬리표에 (다른 kind로라도) 이미 있으면 새 행을 만들지 않는다(중복 계수 방지)
            have = cur.execute("SELECT 1 FROM utterance_term WHERE utt_id=? AND term_id=?", (u[0], t)).fetchone() is not None
            cur.execute("INSERT OR IGNORE INTO utterance_term_det VALUES (?,?,?,?,?,?)", (u[0], t, kind, rule, DETECTOR, 0 if have else 1))
            stat["det_rows"] += cur.rowcount
            if have:
                stat["already"] += 1
                continue
            cur.execute("INSERT INTO utterance_term VALUES (?,?,?)", (u[0], t, kind))
            stat["utterance_term_added"] += 1
    stat["undone_previous"] = undone
    after = freq(cur)
    diff = {k: [before[k], after[k]] for k in after if after[k] != before[k]}
    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M KST")
    cur.executemany("INSERT OR REPLACE INTO meta VALUES (?,?)", [("stat_t1", json.dumps(dict(stat), ensure_ascii=False)), ("built_t1_at", now)])
    if stat["utt_missing"]:
        print(f"⚠️ tag_terms_v1: DB에 없는 발화 {stat['utt_missing']}행 — load_v1 판과 정제본 판이 다를 수 있음", file=sys.stderr)
    if a.dry_run:
        db.rollback()
        print("(dry-run — 쓰지 않음)")
    else:
        db.commit()
    print(json.dumps({"stat": dict(stat), "total_utterance_term": [sum(before.values()), sum(after.values())],
                      "changed": dict(sorted(diff.items(), key=lambda kv: -(kv[1][1] - kv[1][0])))}, ensure_ascii=False))


if __name__ == "__main__":
    main()
