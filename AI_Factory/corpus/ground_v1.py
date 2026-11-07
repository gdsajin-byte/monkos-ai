#!/usr/bin/env python3
"""G836 대본(기본 v3 — 표기 관례 반영) 근거 대조 v1 — 정제본 근거. 대본 줄마다 가까운 해설을 찾되, 정제·분류 판단(남김·해설 화자·국면/형세/수순)을 통과한 발화만 근거로 든다.

  python3 AI_Factory/corpus/ground_v1.py [--db …] [--k 3]
v0(05:05, g836_v2_compare.md)과 다른 점: v0는 원 자막 구간(해설 목소리 추정) 벡터 상위를 그대로 근거로 들었다 — 캐스터 말·잡담·판 지시어 조각이 섞였다.
v1은 같은 구간 벡터로 찾고(구간 → 그 안 발화), 발화 판단으로 거른다. 판 의존(board_dep) 발화는 '판 없이 서는가' 칸에 표시.
질의 임베딩: embed_commentary.js embedq(Vertex text-multilingual-embedding-002, 12줄 약 0.5천 자 ≈ $0.00001).
출력(레포 밖, 방송 원문 인용): ~/.monkos/corpus/g836_v2_ground_v1.md · 표준 출력엔 건수만.
"""
import argparse
import json
import os
import re
import sqlite3
import subprocess
from collections import Counter

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
MAIN = os.path.expanduser("~/developer/monk_project")  # node_modules는 본 체크아웃(scripts/retrieval)
OKL = ("국면", "형세", "수순")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    ap.add_argument("--k", type=int, default=3)
    ap.add_argument("--script", default=os.path.join(ROOT, "apps", "go-explainer-e2e", "scripts", "s02_v3.json"))
    ap.add_argument("--out", default=os.path.expanduser("~/.monkos/corpus/g836_v3_ground_v1.md"))
    a = ap.parse_args()
    v2 = json.load(open(a.script, encoding="utf-8"))
    qs = [re.sub(r"<[^>]+>", "", l["text"]).strip() for l in v2["lines"]]
    qf, vf = a.out + ".q.json", a.out + ".q.f32"
    json.dump(qs, open(qf, "w", encoding="utf-8"), ensure_ascii=False)
    env = dict(os.environ, NODE_PATH=os.path.join(MAIN, "scripts", "retrieval", "node_modules"))
    r = subprocess.run(["node", os.path.join(ROOT, "AI_Factory", "go_kibo", "embed_commentary.js"), "embedq", qf, vf], capture_output=True, text=True, env=env)
    if r.returncode != 0:
        raise SystemExit(f"❌ ground_v1: 질의 임베딩 실패 {r.stderr[-400:]}")
    cost = json.loads(r.stdout.strip().splitlines()[-1])
    Q = np.frombuffer(open(vf, "rb").read(), dtype="<f4").reshape(len(qs), -1)
    os.remove(qf)
    os.remove(vf)
    db = sqlite3.connect(a.db)
    ids, vecs = [], []
    for oid, blob in db.execute("SELECT owner_id, vec FROM embedding WHERE owner_kind='segment'"):
        ids.append(oid)
        vecs.append(np.frombuffer(blob, dtype="<f4"))
    if not ids:
        raise SystemExit("❌ ground_v1: 구간 벡터 0행 — DB 확인")
    M = np.vstack(vecs)
    M = M / np.linalg.norm(M, axis=1, keepdims=True)
    Q = Q / np.linalg.norm(Q, axis=1, keepdims=True)
    S = Q @ M.T
    L = [f"# G836 대본 {os.path.basename(a.script)} 근거 대조 v1 — 정제본 근거 (레포 밖 — 방송 원문 인용, 외부 공개·커밋 금지)\n",
         f"> 질의 = 대본 {len(qs)}줄 · 후보 = 30편 해설 구간 벡터 {len(ids):,} → 구간 안 발화 중 **남김·해설 화자·{'/'.join(OKL)}**만 · 상위 {a.k} · 질의 임베딩 ${cost['usd']}\n"]
    stat = Counter()
    for n, q in enumerate(qs):
        order = np.argsort(-S[n])
        got, raw_top, rejected = [], None, Counter()
        for j in order[:400]:
            rows = db.execute("""SELECT u.id, u.text, u.label, u.board_dep, u.keep, u.drop_code, s.name, s.role, u.source_id, u.t_start
                                 FROM utterance u JOIN speaker s ON s.id=u.speaker_id WHERE u.segment_id=? ORDER BY u.seq""", (ids[j],)).fetchall()
            if raw_top is None and rows:
                raw_top = (round(float(S[n, j]), 3), rows)
            for u in rows:
                why = ("버림 " + str(u[5])) if u[4] == 0 else ("화자 " + u[7]) if u[7] != "해설" else ("라벨 " + str(u[2])) if u[2] not in OKL else ("짧음" if len(u[1]) < 15 else None)
                if why:
                    rejected[why.split(" ")[0]] += 1
                    continue
                got.append((round(float(S[n, j]), 3), u))
            if len(got) >= a.k:
                break
        got = got[:a.k]
        stat["lines"] += 1
        stat["grounded"] += bool(got)
        stat["standalone_top"] += bool(got and not got[0][1][3])
        top_raw_ok = raw_top and any(g[1][0] == raw_top[1][0][0] for g in got)
        stat["raw_top_rejected"] += not top_raw_ok
        L += [f"## {n + 1}. {q}\n", "| 유사도 | 해설자 | 라벨 | 판 없이 섬 | 발화(정제본) |", "|---|---|---|---|---|"]
        L += [f"| {s} | {u[6]} | {u[2]} | {'예' if not u[3] else '아니오(판 의존)'} | {u[1][:110]} ({u[8][3:7]}… {int(u[9] or 0)}초) |" for s, u in got]
        if raw_top and not top_raw_ok:
            rr = raw_top[1][0]
            L.append(f"\n- v0 방식 최상위 구간({raw_top[0]})은 정제 판단으로 빠짐: {rr[7]} · {rr[2] or rr[5]} — {rr[1][:70]}")
        if rejected:
            L.append("- 걸러낸 발화: " + " · ".join(f"{k} {v}" for k, v in rejected.most_common()))
        L.append("")
    open(a.out, "w", encoding="utf-8").write("\n".join(L) + "\n")
    print(json.dumps({**stat, "cost_usd": cost["usd"], "out": a.out}, ensure_ascii=False))


if __name__ == "__main__":
    main()
