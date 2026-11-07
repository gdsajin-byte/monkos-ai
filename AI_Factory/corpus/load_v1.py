#!/usr/bin/env python3
"""발화·말투 정본 DB v1 적재 — v0 적재(load_v0.py)를 임시 파일에 만든 뒤 v1 확장을 얹고 교체한다. 새 유료 호출 0.

  python3 AI_Factory/corpus/load_v1.py [--db ~/.monkos/corpus/monk_corpus.db] [--lhw ~/.monkos/go-commentary-yt/lhw/pairs_v0.jsonl]
v1 확장(쌍아 11-07 05:50·15:02 지시):
  ① 판독 9편 정제본 — v0의 Gemini 전사 장면(labeler=gemini_transcript, 분류 없음)을 지우고
     refine/f1_{영상}_in0·out0(LLM 일꾼 판단: keep·drop·화자·라벨·판 의존·용어·Q&A)으로 다시 넣는다. 장면 = scene_dict_v1.jsonl.
  ② 막내2 이현욱 짝(lhw/pairs_v1.jsonl, 없으면 v0 — 한 행 {utterance, go_scene}, scene_id 1:1) → go_scene(kind='lhw_pair') + 미분류 발화.
     move_no = 실제 대국 수 번호, 정확도는 move_no_basis(sgf·empty_start·stones_lower_bound). move_basis엔 파일 판. 파일이 없으면 건너뛰고 meta에 남긴다.
  ③ distill_pair(장면 사실 → 목표 문장) 씨앗: 감수 예문 2(gold) + G836 v2 대본(생성, 검토 대기).
"""
import argparse
import glob
import json
import os
import re
import sqlite3
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
YT = os.path.expanduser("~/.monkos/go-commentary-yt")
CV = os.path.expanduser("~/.monkos/go-board/analysis/commentary_v0")
LABELS = ("Q", "A", "국면", "형세", "수순", "선수대회", "추임새", "기타")
DROPS = ("MUSIC", "AD", "GREET", "SCREEN", "CHAT", "NOISE")
LHW_SEQ0 = 100000  # 같은 영상의 Gemini 정제본 seq(0~)와 겹치지 않게 — 이현욱 짝 문장은 다른 전사(유튜브 자막)다
KST = timezone(timedelta(hours=9))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.path.expanduser("~/.monkos/corpus/monk_corpus.db"))
    ap.add_argument("--lhw", default=None, help="기본: lhw/pairs_v1.jsonl, 없으면 pairs_v0.jsonl(막내2 15:08 — 100편 확대분은 v1)")
    a = ap.parse_args()
    if a.lhw is None:
        v1 = os.path.join(YT, "lhw", "pairs_v1.jsonl")
        a.lhw = v1 if os.path.exists(v1) else os.path.join(YT, "lhw", "pairs_v0.jsonl")
    tmp = a.db + ".v1tmp"
    if os.path.exists(tmp):
        os.remove(tmp)
    r = subprocess.run([sys.executable, os.path.join(HERE, "load_v0.py"), "--db", tmp], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"❌ load_v1: v0 적재 실패\n{r.stderr[-800:]}")
    db = sqlite3.connect(tmp)
    db.executescript(open(os.path.join(HERE, "schema_v1.sql"), encoding="utf-8").read())
    cur = db.cursor()
    stat = Counter()
    cat = {d["id"]: d for d in (json.loads(x) for x in open(os.path.join(YT, "catalog.jsonl"), encoding="utf-8"))}

    def speaker(name, kind, role):
        cur.execute("INSERT OR IGNORE INTO speaker(name,kind,role) VALUES (?,?,?)", (name, kind, role))
        return cur.execute("SELECT id FROM speaker WHERE name=? AND role=?", (name, role)).fetchone()[0]

    def term_id(name):
        row = cur.execute("SELECT id FROM term WHERE term=?", (name,)).fetchone()
        if row:
            return row[0]
        cur.execute("INSERT INTO term(term,src,detect) VALUES (?,?,?)", (name, "labeler(f1)", "—"))
        stat["term_added_f1"] += 1
        return cur.lastrowid

    def names(v):
        try:
            v = json.loads(v.replace("'", '"')) if isinstance(v, str) else v
        except json.JSONDecodeError:
            v = [v]
        return [x for x in (v or []) if x]

    def ensure_source(vid, note):
        c = cat.get(vid, {})
        cur.execute("INSERT OR IGNORE INTO source(id,kind,title,channel,url,date,rights,domain,note) VALUES (?,?,?,?,?,?,?,?,?)",
                    (f"yt:{vid}", "youtube", c.get("title"), c.get("channel"), f"https://www.youtube.com/watch?v={vid}", c.get("date"), "ref_only", "go", note))
        cur.execute("UPDATE source SET title=coalesce(title,?), channel=coalesce(channel,?), date=coalesce(date,?) WHERE id=?",
                    (c.get("title"), c.get("channel"), c.get("date"), f"yt:{vid}"))
        com = (names(c.get("commentator")) or ["(해설)"])[0]
        cas = (names(c.get("caster")) or ["(캐스터)"])[0]
        return com, cas

    # ---- ① 판독 9편 정제본
    cur.execute("DELETE FROM go_scene")
    cur.execute("DELETE FROM utterance WHERE labeler='gemini_transcript'")
    stat["v0_gemini_rows_replaced"] = cur.rowcount
    unk = speaker("(불명)", "role", "불명")
    player = speaker("(선수)", "role", "선수")
    utt = {}
    for fin in sorted(glob.glob(os.path.join(CV, "refine", "f1_*_in0.jsonl"))):
        vid = os.path.basename(fin)[3:-len("_in0.jsonl")]
        fout = fin.replace("_in0", "_out0")
        if not os.path.exists(fout):
            raise SystemExit(f"❌ load_v1: 정제 출력 없음 {fout}")
        com, cas = ensure_source(vid, "판독 9편 — Gemini 전사 장면(15초) 정제본 f1")
        outs = {d["i"]: d for d in (json.loads(x) for x in open(fout, encoding="utf-8") if x.strip())}
        qa = defaultdict(lambda: {"Q": [], "A": []})
        for x in open(fin, encoding="utf-8"):
            u = json.loads(x)
            o = outs.get(u["i"])
            if o is None:
                stat["f1_missing_out"] += 1
            cur.execute("INSERT INTO segment(source_id,seg,t_start,t_end,text,voice_guess) VALUES (?,?,?,?,?,?)",
                        (f"yt:{vid}", u["seg"], u["t"], u.get("t_end"), u["text"] or "", u["speaker_guess"]))
            seg_id = cur.lastrowid
            role = (o or {}).get("role") or "불명"
            sid = {"해설": lambda: speaker(com, "real", "해설"), "캐스터": lambda: speaker(cas, "real", "캐스터"), "선수": lambda: player}.get(role, lambda: unk)()
            keep = None if o is None else int(bool(o.get("keep")))
            label = o.get("label") if keep else None
            drop = o.get("drop") if keep == 0 else None
            label = label if label in LABELS or label is None else "기타"
            drop = drop if drop in DROPS or drop is None else "NOISE"
            bd = None if (o is None or o.get("board_dep") is None) else int(bool(o["board_dep"]))
            cur.execute("INSERT INTO utterance(source_id,seq,segment_id,t_start,speaker_id,text,sfx,keep,drop_code,label,board_dep,note,labeler) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (f"yt:{vid}", u["i"], seg_id, u["t"], sid, u["text"] or "", json.dumps(u.get("sfx") or [], ensure_ascii=False),
                         keep, drop, label, bd, (o or {}).get("note") or None, "claude-writer/context_v1+f1" if o else None))
            uid = cur.lastrowid
            utt[(vid, u["i"])] = uid
            stat["f1_utterance"] += 1
            stat["f1_keep"] += keep == 1
            if keep:
                for kind in ("terms", "concepts"):
                    for t in o.get(kind) or []:
                        if isinstance(t, str) and t.strip():
                            cur.execute("INSERT OR IGNORE INTO utterance_term VALUES (?,?,?)", (uid, term_id(t.strip()), "term" if kind == "terms" else "concept"))
                            stat["f1_utterance_term"] += cur.rowcount
                if o.get("qa") and label in ("Q", "A"):
                    qa[o["qa"]][label].append(uid)
        for k, v in qa.items():
            if v["Q"] and v["A"]:
                cur.execute("INSERT INTO qa_pair(source_id,qa_key,q_utt,a_utt) VALUES (?,?,?,?)", (f"yt:{vid}", k, v["Q"][0], v["A"][0]))
                stat["f1_qa_pair"] += 1
    for x in open(os.path.join(CV, "scene_dict_v1.jsonl"), encoding="utf-8"):
        r_ = json.loads(x)
        cur.execute("INSERT INTO go_scene(source_id,t_start,t_end,move_no,mode,stones,board_moves,board_tags,text_terms,concepts,utt_id,kind,move_basis) "
                    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                    (f"yt:{r_['id']}", r_["t"], r_["t_end"], None, r_["mode"], r_["stones"], json.dumps(r_["board_moves"], ensure_ascii=False),
                     json.dumps(r_["board_tags"], ensure_ascii=False), json.dumps(r_["text_terms"], ensure_ascii=False), json.dumps(r_["concepts"], ensure_ascii=False),
                     utt.get((r_["id"], r_["i"])), "board_read", "판독 프레임 착수 검출(수 번호 없음)"))
        stat["go_scene_board_read"] += 1

    # ---- ② 이현욱 짝(막내2)
    if os.path.exists(a.lhw):
        basis = f"{os.path.relpath(a.lhw, YT)}@{datetime.fromtimestamp(os.path.getmtime(a.lhw), KST):%Y-%m-%d %H:%M}"
        n_by = Counter()
        for x in open(a.lhw, encoding="utf-8"):
            row = json.loads(x)
            if "utterance" not in row or "go_scene" not in row:
                raise SystemExit(f"❌ load_v1: 짝 행 구조가 {{utterance, go_scene}}가 아님 — {a.lhw}")
            u, g = row["utterance"], row["go_scene"]
            vid = u["video_id"]
            com, _ = ensure_source(vid, "이현욱 1인 방송 — 막내2 자막 문장↔판 짝")
            seq = LHW_SEQ0 + n_by[vid]
            n_by[vid] += 1
            note = {k: u[k] for k in ("utt_id", "fixes", "asr", "text_raw") if u.get(k)}
            cur.execute("INSERT INTO utterance(source_id,seq,t_start,speaker_id,text,labeler,note) VALUES (?,?,?,?,?,?,?)",
                        (f"yt:{vid}", seq, u["t_start"], speaker(u.get("commentator") or com, "real", "해설"), u["text"], "lhw_pairs(미분류)",
                         json.dumps(note, ensure_ascii=False)))
            uid = cur.lastrowid
            var = g.get("var") or {}
            cur.execute("INSERT INTO go_scene(source_id,t_start,t_end,move_no,mode,utt_id,kind,scene_key,move_no_basis,last_move,to_play,var_id,var_n,var_base_mv,var_seq,"
                        "events,board_end,region,sgf_path,move_basis) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        (f"yt:{vid}", g.get("t", u["t_start"]), u["t_end"], g.get("move_no"), "참고도" if g.get("var") else "실전", uid, "lhw_pair",
                         g.get("scene_id"), g.get("move_no_basis"), g.get("last_move"), g.get("to_play"), var.get("id"), var.get("n"), var.get("base_move_no"),
                         json.dumps(var.get("seq"), ensure_ascii=False) if var.get("seq") is not None else None,
                         json.dumps(g.get("events") or [], ensure_ascii=False), g.get("board"), g.get("region"), g.get("sgf_path"), basis))
            stat["go_scene_lhw_pair"] += 1
            stat["lhw_basis_" + str(g.get("move_no_basis"))] += 1
        stat["lhw_videos"] = len(n_by)
    else:
        stat["lhw_skipped"] = 1

    # ---- ③ 증류 씨앗
    now = datetime.now(KST).strftime("%Y-%m-%d %H:%M")
    for gid, ref, facts in cur.execute("SELECT id, ref, facts FROM gold").fetchall():
        txt = cur.execute("SELECT text FROM gold WHERE id=?", (gid,)).fetchone()[0]
        cur.execute("INSERT INTO distill_pair(ref,facts,target_kind,gold_id,target_text,review,reviewer,created_at) VALUES (?,?,?,?,?,?,?,?)",
                    (ref, facts or "{}", "gold", gid, txt, "ok", "작가님", now))
        stat["distill_gold"] += 1
    v2p = os.path.join(ROOT, "apps", "go-explainer-e2e", "scripts", "s02_v2.json")
    v2 = json.load(open(v2p, encoding="utf-8"))
    v2_text = " ".join(re.sub(r"<[^>]+>", "", l["text"]) for l in v2["lines"])
    tmpf = tmp + ".v2.txt"
    open(tmpf, "w", encoding="utf-8").write(v2_text + "\n")
    chk = subprocess.run([sys.executable, os.path.join(HERE, "check_overlap.py"), tmpf, "--n", "6", "--db", tmp], capture_output=True, text=True)
    os.remove(tmpf)
    m = re.search(r"경고\s*(\d+)", chk.stdout)
    cur.execute("INSERT INTO distill_pair(ref,facts,target_kind,target_text,generator,context_ver,overlap_warn,review,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                ("G836 37수", json.dumps(v2.get("facts") or {}, ensure_ascii=False), "generated", v2_text, "claude/s02_v2",
                 "COMMENTARY_CONTEXT_v1 + GOLD #1·#2", int(m.group(1)) if m else None, "pending", now))
    stat["distill_generated"] += 1
    stat["v2_overlap_check"] = chk.stdout.strip().splitlines()[-1] if chk.stdout.strip() else chk.stderr[-200:]

    cur.execute("UPDATE meta SET v='v1' WHERE k='schema'")
    cur.executemany("INSERT OR REPLACE INTO meta VALUES (?,?)", [("stat_v1", json.dumps(dict(stat), ensure_ascii=False)), ("built_v1_at", now)])
    db.commit()
    db.close()
    os.replace(tmp, a.db)
    print(json.dumps(dict(stat), ensure_ascii=False))
    print("DB:", a.db, os.path.getsize(a.db), "bytes")


if __name__ == "__main__":
    main()
