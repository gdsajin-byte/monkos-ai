#!/usr/bin/env python3
"""발화·말투 정본 DB v0 1차 적재 — 새로 만든다(임시 파일에 적재 후 교체). 새 유료 호출 0(임베딩은 기존 벡터 재사용).

  python3 AI_Factory/corpus/load_v0.py [--db ~/.monkos/corpus/monk_corpus.db]
입력(레포 밖):
  ~/.monkos/go-commentary-yt/answers/corrected.jsonl · catalog.jsonl     (유튜브 해설 30편 구간)
  ~/.monkos/go-board/analysis/commentary_v0/refine/v1_{영상}_in*.jsonl · _out*.jsonl  (발화 쪼개기 + LLM 정제·분류)
  ~/.monkos/go-board/analysis/commentary_v0/terms/terms_v0.jsonl           (용어 사전 v0)
  ~/.monkos/go-board/analysis/commentary_v0/emb/{vectors.f32, meta.jsonl}   (해설 구간 임베딩 15,101)
  ~/.monkos/go-board/analysis/commentary_v0/scene_dict_v0.jsonl             (판독 9편 장면 사전)
  AI_Factory/go_kibo/reports/COMMENTARY_GOLD_v0.md                           (감수 예문 — 레포)
"""
import argparse
import glob
import json
import os
import re
import sqlite3
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
YT = os.path.expanduser("~/.monkos/go-commentary-yt")
CV = os.path.expanduser("~/.monkos/go-board/analysis/commentary_v0")
MODEL = "text-multilingual-embedding-002"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.db), exist_ok=True)
    tmp = a.db + ".tmp"
    if os.path.exists(tmp):
        os.remove(tmp)
    db = sqlite3.connect(tmp)
    db.executescript(open(os.path.join(HERE, "schema_v0.sql"), encoding="utf-8").read())
    cur = db.cursor()
    stat = Counter()

    # ---- 출처
    cat = {}
    for x in open(os.path.join(YT, "catalog.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        cat[d["id"]] = d
    segs_by = defaultdict(list)
    for x in open(os.path.join(YT, "answers", "corrected.jsonl"), encoding="utf-8"):
        d = json.loads(x)
        segs_by[d["id"]].append(d)

    def add_source(sid, kind, rights, title=None, channel=None, url=None, date=None, domain="go", note=None):
        cur.execute("INSERT OR IGNORE INTO source VALUES (?,?,?,?,?,?,?,?,?)", (sid, kind, title, channel, url, date, rights, domain, note))
        stat["source"] += cur.rowcount

    for vid in segs_by:
        c = cat.get(vid, {})
        add_source(f"yt:{vid}", "youtube", "ref_only", c.get("title"), c.get("channel"), f"https://www.youtube.com/watch?v={vid}", c.get("date"),
                   note="해설 대화록 30편 — 참고·말투 학습 전용")
    add_source("kba:dict", "document", "ref_only", "한국기원 바둑용어사전", "한국기원", "https://www.baduk.or.kr/story/keyword.asp", "2026-11-07")
    add_source("gold:20261107", "review", "author_reviewed", "해설 감수 예문 v0", note="AI_Factory/go_kibo/reports/COMMENTARY_GOLD_v0.md")
    add_source("gen:style_test", "generated", "own_generated", "캐릭터 말투 확장 자리 시험", domain="character")

    # ---- 화자
    spk = {}

    def speaker(name, kind, role, note=None):
        k = (name, role)
        if k not in spk:
            cur.execute("INSERT OR IGNORE INTO speaker(name,kind,role,note) VALUES (?,?,?,?)", (name, kind, role, note))
            spk[k] = cur.execute("SELECT id FROM speaker WHERE name=? AND role=?", k).fetchone()[0]
        return spk[k]

    speaker("작가님", "real", "작가님")
    speaker("유니", "character", "캐릭터", "MONK 모델스 — 말투·목소리 확장 자리")
    speaker("다인", "character", "캐릭터", "MONK 모델스 — 말투·목소리 확장 자리")
    unk = speaker("(불명)", "role", "불명")
    player = speaker("(선수)", "role", "선수")

    # ---- 구간 + 발화 + 라벨
    seg_id = {}
    for vid, segs in segs_by.items():
        segs.sort(key=lambda d: d["t_start"])  # refine_split.py와 같은 정렬
        for i, d in enumerate(segs):
            cur.execute("INSERT INTO segment(source_id,seg,t_start,t_end,text,voice_guess) VALUES (?,?,?,?,?,?)",
                        (f"yt:{vid}", i, d["t_start"], d["t_end"], d["text"], d["speaker"]))
            seg_id[(vid, i)] = cur.lastrowid
            stat["segment"] += 1
    term_id = {}

    def term(name, **kw):
        if name not in term_id:
            cur.execute("INSERT OR IGNORE INTO term(term,title,cat,def,src,kba_no,detect,det_tag) VALUES (?,?,?,?,?,?,?,?)",
                        (name, kw.get("title"), kw.get("cat"), kw.get("def"), kw.get("src"), kw.get("kba_no"), kw.get("detect"), kw.get("det_tag")))
            term_id[name] = cur.execute("SELECT id FROM term WHERE term=?", (name,)).fetchone()[0]
            stat["term"] += 1
        return term_id[name]

    for x in open(os.path.join(CV, "terms", "terms_v0.jsonl"), encoding="utf-8"):
        r = json.loads(x)
        if r["cat"] in range(1, 9):
            term(r["term"], title=r["title"], cat=r["cat"], def_=None, src=r["src"], kba_no=r["kba_no"], detect=r["detect"], det_tag=r.get("det_tag"))
            cur.execute("UPDATE term SET def=? WHERE term=?", (r["def"], r["term"]))
    stat["term_kba"] = stat["term"]

    utt_key = {}
    missing_out = []
    for vid, segs in segs_by.items():
        com = segs[0].get("commentator") or "(해설)"
        cas = (segs[0].get("caster") or ["(캐스터)"])[0]
        ins, outs = {}, {}
        for f in glob.glob(os.path.join(CV, "refine", f"v1_{vid}_in*.jsonl")):
            for x in open(f, encoding="utf-8"):
                d = json.loads(x)
                ins[d["i"]] = d
        for f in glob.glob(os.path.join(CV, "refine", f"v1_{vid}_out*.jsonl")):
            for x in open(f, encoding="utf-8"):
                x = x.strip()
                if x:
                    try:
                        d = json.loads(x)
                        outs[d["i"]] = d
                    except json.JSONDecodeError:
                        stat["bad_json"] += 1
        if not ins:
            missing_out.append(vid)
            continue
        qa = defaultdict(lambda: {"Q": [], "A": []})
        for i in sorted(ins):
            u, o = ins[i], outs.get(i)
            role = (o or {}).get("role") or "불명"
            sid = {"해설": lambda: speaker(com, "real", "해설"), "캐스터": lambda: speaker(cas, "real", "캐스터"),
                   "선수": lambda: player}.get(role, lambda: unk)()
            keep = None if o is None else (1 if o.get("keep") else 0)
            bd = None if (o is None or o.get("board_dep") is None) else int(bool(o["board_dep"]))
            label = (o or {}).get("label") if keep else None
            drop = (o or {}).get("drop") if keep == 0 else None
            if drop not in (None, "MUSIC", "AD", "GREET", "SCREEN", "CHAT", "NOISE"):
                drop = "NOISE"
            if label not in (None, "Q", "A", "국면", "형세", "수순", "선수대회", "추임새", "기타"):
                label = "기타"
            cur.execute("INSERT INTO utterance(source_id,seq,segment_id,t_start,speaker_id,text,sfx,keep,drop_code,label,board_dep,note,labeler) "
                        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (f"yt:{vid}", i, seg_id.get((vid, u["seg"])), u["t"], sid, u["text"], json.dumps(u.get("sfx") or [], ensure_ascii=False),
                         keep, drop, label, bd, (o or {}).get("note") or None, "claude-writer/context_v1" if o else None))
            uid = cur.lastrowid
            utt_key[(vid, i)] = uid
            stat["utterance"] += 1
            stat["utterance_labeled"] += o is not None
            if o and keep:
                for kind in ("terms", "concepts"):
                    for t in o.get(kind) or []:
                        if not isinstance(t, str) or not t.strip():
                            continue
                        tid = term(t.strip(), src="labeler(v1)", detect="—")
                        cur.execute("INSERT OR IGNORE INTO utterance_term VALUES (?,?,?)", (uid, tid, "term" if kind == "terms" else "concept"))
                        stat["utterance_term"] += cur.rowcount
                if o.get("qa") and label in ("Q", "A"):
                    qa[o["qa"]][label].append(uid)
        for k, v in qa.items():
            if v["Q"] and v["A"]:
                cur.execute("INSERT INTO qa_pair(source_id,qa_key,q_utt,a_utt) VALUES (?,?,?,?)", (f"yt:{vid}", k, v["Q"][0], v["A"][0]))
                stat["qa_pair"] += 1
    stat["term_added_by_labeler"] = stat["term"] - stat["term_kba"]

    # ---- 임베딩(구간 단위 재사용)
    meta = [json.loads(x) for x in open(os.path.join(CV, "emb", "meta.jsonl"), encoding="utf-8")]
    raw = open(os.path.join(CV, "emb", "vectors.f32"), "rb").read()
    dim = len(raw) // 4 // len(meta)
    by_t = {}
    for vid, segs in segs_by.items():
        for i, d in enumerate(segs):
            by_t[(vid, round(d["t_start"], 2))] = seg_id[(vid, i)]
    for n, m in enumerate(meta):
        sid = by_t.get((m["id"], round(m["t"], 2)))
        if sid is None:
            stat["emb_unmatched"] += 1
            continue
        cur.execute("INSERT OR IGNORE INTO embedding(owner_kind,owner_id,model,dim,vec) VALUES (?,?,?,?,?)",
                    ("segment", sid, MODEL, dim, raw[n * dim * 4:(n + 1) * dim * 4]))
        stat["embedding"] += cur.rowcount

    # ---- 바둑 장면(판독 9편)
    for x in open(os.path.join(CV, "scene_dict_v0.jsonl"), encoding="utf-8"):
        r = json.loads(x)
        sid = f"yt:{r['id']}"
        add_source(sid, "youtube", "ref_only", url=f"https://www.youtube.com/watch?v={r['id']}", note="판독 9편 — Gemini 전사 장면(15초)")
        seq = int(r["t"] * 10)
        cur.execute("INSERT OR IGNORE INTO utterance(source_id,seq,t_start,speaker_id,text,labeler) VALUES (?,?,?,?,?,?)",
                    (sid, seq, r["t"], speaker("(해설)", "role", "해설"), r["text"], "gemini_transcript"))
        uid = cur.execute("SELECT id FROM utterance WHERE source_id=? AND seq=?", (sid, seq)).fetchone()[0]
        cur.execute("INSERT INTO go_scene(source_id,t_start,t_end,move_no,mode,stones,board_moves,board_tags,text_terms,concepts,utt_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                    (sid, r["t"], r["t_end"], r.get("move_no") if isinstance(r.get("move_no"), int) else None, r["mode"], r["stones"],
                     json.dumps(r["board_moves"], ensure_ascii=False), json.dumps(r["board_tags"], ensure_ascii=False),
                     json.dumps(r["text_terms"], ensure_ascii=False), json.dumps(r["concepts"], ensure_ascii=False), uid))
        stat["go_scene"] += 1

    # ---- 감수 예문(레포 문서에서 원문 인용 블록 추출)
    md = open(os.path.join(ROOT, "AI_Factory", "go_kibo", "reports", "COMMENTARY_GOLD_v0.md"), encoding="utf-8").read()
    facts = {1: {"game": "G836", "move_no": 37, "real": "B2", "best": "F4", "loss": 9.27, "wr_before": 0.673, "wr_after": 0.055, "terms": ["끼워잇기", "밀어올림", "바꿔치기"]},
             2: {"game": "G836", "move_no": 37, "line": "정해도", "step": 5, "move": "F6", "loss": 9.27, "terms": ["껴붙임"], "kba_no": 135}}
    for n, blk in enumerate(re.findall(r"\*\*작가님 원문[^\n]*\*\*\n\n> (.+?)\n", md), 1):
        cur.execute("INSERT INTO gold(source_id,ref,facts,text,units,reviewer,reviewed_at) VALUES (?,?,?,?,?,?,?)",
                    ("gold:20261107", "G836 37수" + (" 정해도 5수 F6" if n == 2 else ""), json.dumps(facts.get(n, {}), ensure_ascii=False), blk.strip(),
                     None, "작가님", "2026-11-07 04:32" if n == 1 else "2026-11-07 04:48"))
        stat["gold"] += 1

    # ---- 말투 확장 자리: 해설자별 추임새 상위(데이터에서) + 캐릭터 시험 행
    rows = cur.execute("SELECT s.id, s.name, u.text FROM utterance u JOIN speaker s ON s.id=u.speaker_id WHERE u.label='추임새' AND u.keep=1").fetchall()
    fill = defaultdict(Counter)
    for sid_, name, t in rows:
        fill[sid_][re.sub(r"[.!?,~ ]+$", "", t.strip())[:12]] += 1
    for sid_, c in fill.items():
        for w, n in c.most_common(5):
            cur.execute("INSERT INTO style_feature(speaker_id,feature,value,note) VALUES (?,?,?,?)", (sid_, "filler", w, f"추임새 발화 {n}회"))
            stat["style_feature"] += 1
    for name in ("유니", "다인"):
        cur.execute("INSERT INTO style_feature(speaker_id,feature,value,source_id,note) VALUES (?,?,?,?,?)",
                    (spk[(name, "캐릭터")], "persona_note", "시험 행 — 말투·목소리 데이터가 들어올 자리(어미·추임새·말 빠르기·voice_file)", "gen:style_test", "v0 빈 자리 시험"))
        stat["style_feature"] += 1
    cur.execute("INSERT INTO style_feature(speaker_id,feature,value,source_id,note) VALUES (?,?,?,?,?)",
                (spk[("유니", "캐릭터")], "voice_file", "ElevenLabs voice 'MONKOS Uni host'(10-25, 계정 저장)", "gen:style_test", "tts.py VOICES['uni']"))
    stat["style_feature"] += 1

    cur.executemany("INSERT INTO meta VALUES (?,?)", [("schema", "v0"), ("built_by", "iMac/쌍아-막내1"), ("embedding_model", MODEL),
                                                       ("stat", json.dumps(dict(stat), ensure_ascii=False)), ("videos_without_utterances", json.dumps(missing_out))])
    db.commit()
    db.close()
    os.replace(tmp, a.db)
    print(json.dumps(dict(stat), ensure_ascii=False))
    print("발화 없는 영상:", missing_out)
    print("DB:", a.db, os.path.getsize(a.db), "bytes")


if __name__ == "__main__":
    main()
