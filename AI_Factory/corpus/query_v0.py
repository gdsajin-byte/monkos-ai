#!/usr/bin/env python3
"""발화·말투 정본 DB v0 질의 예시 8 — 결과 표를 출력(레포 보고서에는 건수·짧은 요지만, 원문 인용은 레포 밖 결과 파일).

  python3 AI_Factory/corpus/query_v0.py [--db …] [--out ~/.monkos/corpus/query_v0_result.md]
벡터 검색: sqlite-vec 없이 같은 DB의 BLOB을 numpy로 전수 코사인(새 임베딩 호출 0 — 질의도 DB 안의 벡터로).
"""
import argparse
import json
import os
import sqlite3

import numpy as np

Q = [
    ("Q1 껴붙임 + 손해 5집↑ — 감수 예문·장면", """
SELECT g.ref, json_extract(g.facts,'$.loss') AS loss, substr(g.text,1,60) AS text
FROM gold g WHERE g.facts LIKE '%껴붙임%' AND json_extract(g.facts,'$.loss') >= 5
UNION ALL
SELECT '방송 국면 해설 '||u.source_id, NULL, substr(u.text,1,60) FROM utterance u
JOIN utterance_term ut ON ut.utt_id=u.id JOIN term t ON t.id=ut.term_id
WHERE t.term IN ('껴붙이다','껴붙임','끼워붙이다') AND u.label='국면' AND u.keep=1"""),
    ("Q2 목진석 Q&A 쌍(앞 10)", """
SELECT q.source_id, round(q.t_start) AS t, substr(q.text,1,50) AS 질문, substr(a.text,1,60) AS 대답
FROM qa_pair p JOIN utterance q ON q.id=p.q_utt JOIN utterance a ON a.id=p.a_utt JOIN speaker s ON s.id=a.speaker_id
WHERE s.name='목진석' ORDER BY q.source_id, q.t_start LIMIT 10"""),
    ("Q3 판 의존 아닌 국면 해설 — 해설자별 수", """
SELECT s.name, sum(u.board_dep=0) AS 판독없이_서는_문장, count(*) AS 국면_전체
FROM utterance u JOIN speaker s ON s.id=u.speaker_id
WHERE u.label='국면' AND u.keep=1 AND u.board_dep IS NOT NULL GROUP BY s.name ORDER BY 2 DESC"""),
    ("Q4 작가님 감수 예문", "SELECT g.id, g.ref, g.reviewer, g.reviewed_at, substr(g.text,1,80) FROM gold g"),
    ("Q5 해설자별 추임새 상위(style_feature)", """
SELECT s.name, s.role, f.value, f.note FROM style_feature f JOIN speaker s ON s.id=f.speaker_id
WHERE f.feature='filler' ORDER BY s.name, f.id"""),
    ("Q6 유사 장면 벡터 검색 — '바꿔치기'가 든 해설 구간과 가장 가까운 구간 5", None),
    ("Q7 권리 등급별 출처·행 수(출처 추적용 — 정정 05:24: 금지 필터 아님, 선은 출력 검사 check_overlap.py)", """
SELECT s.rights, count(DISTINCT s.id) AS 출처, (SELECT count(*) FROM utterance u WHERE u.source_id IN (SELECT id FROM source WHERE rights=s.rights)) AS 발화,
       (SELECT count(*) FROM gold g WHERE g.source_id IN (SELECT id FROM source WHERE rights=s.rights)) AS 감수예문
FROM source s GROUP BY s.rights"""),
    ("Q8 캐릭터 말투 확장 자리 시험 행", """
SELECT s.name, f.feature, f.value, f.source_id FROM style_feature f JOIN speaker s ON s.id=f.speaker_id WHERE s.kind='character'"""),
]


def vec_search(db, k=5):
    row = db.execute("""SELECT g.id, g.text FROM segment g JOIN embedding e ON e.owner_kind='segment' AND e.owner_id=g.id
                        WHERE g.text LIKE '%바꿔치기%' ORDER BY g.id LIMIT 1""").fetchone()
    if not row:
        return ["(바꿔치기 구간 없음)"], []
    qid, qtext = row
    ids, vecs = [], []
    for oid, blob in db.execute("SELECT owner_id, vec FROM embedding WHERE owner_kind='segment'"):
        ids.append(oid)
        vecs.append(np.frombuffer(blob, dtype="<f4"))
    M = np.vstack(vecs)
    M = M / np.linalg.norm(M, axis=1, keepdims=True)
    q = M[ids.index(qid)]
    sc = M @ q
    order = np.argsort(-sc)[1:k + 1]
    out = []
    for j in order:
        sid, t, txt = db.execute("SELECT source_id, t_start, text FROM segment WHERE id=?", (ids[j],)).fetchone()
        out.append((round(float(sc[j]), 3), sid, round(t), txt[:70]))
    return [f"질의 구간 #{qid}: {qtext[:70]}", f"전수 코사인 {len(ids)}개"], out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    ap.add_argument("--out", default=os.path.expanduser("~/.monkos/corpus/query_v0_result.md"))
    a = ap.parse_args()
    db = sqlite3.connect(a.db)
    L = ["# 발화 DB v0 질의 예시 8 결과 (레포 밖 — 방송 원문 인용 포함)\n"]
    summary = []
    for title, sql in Q:
        L.append(f"## {title}\n")
        if sql is None:
            head, rows = vec_search(db)
            L += [f"- {h}" for h in head]
        else:
            L.append("```sql" + sql + "\n```")
            cur = db.execute(sql)
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
            L.append("| " + " | ".join(cols) + " |")
            L.append("|" + "---|" * len(cols))
        for r in rows:
            L.append("| " + " | ".join(str(x).replace("|", "/").replace("\n", " ") for x in r) + " |")
        L.append("")
        summary.append((title, len(rows)))
    open(a.out, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(json.dumps(summary, ensure_ascii=False))
    print("결과:", a.out)


if __name__ == "__main__":
    main()
