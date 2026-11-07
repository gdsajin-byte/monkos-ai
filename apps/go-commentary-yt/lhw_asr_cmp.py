#!/usr/bin/env python3
"""이현욱 영상 받아쓰기 대조 — 유튜브 자동 자막 vs whisper, 교정 사전 전후 (PF_GO, 11-07 막내2, 무료·CPU)
  lhw_asr_cmp.py  → lhw/_asr/cmp.json + 표 출력
정답: lexicon_lhw.chunks(정답지 Pro 대본, 잘린 JSON은 끝난 장면까지 — 비교 창도 그 끝까지). whisper 결과 lhw/_asr/{ID}_{시작}.json 있는 창만.
글자 오류율(CER) = 공백·문장부호 뺀 글자 편집거리 / 정답 글자 수. 교정 = lexicon_v1 + lexicon_lhw.
창 품질: 자동 자막 CER > 20%인 창은 '정답 누락 창'(Pro 대본이 말을 건너뜀 — 11-07 실측 25~70%)으로 따로 표기, 판정은 깨끗한 창으로.
"""
import json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import lexicon_lhw as LX  # noqa: E402

A = Path.home() / ".monkos" / "go-commentary-yt" / "lhw" / "_asr"
RULES = sorted([(h, r, False) for h, r in LX.V1] + [(k["from"], k["to"], k["pre"]) for k in json.loads((LX.B / "lexicon_lhw.json").read_text())["rules"]],
               key=lambda x: -len(x[0]))


def main():
    rows = []
    for vid, s0, s1, ref, hyp in LX.chunks(set(LX.LHW)):
        f = A / f"{vid}_{s0}.json"
        if not f.exists():
            continue
        wh = " ".join(x["text"] for x in json.loads(f.read_text()) if s0 <= x["start"] < s1)
        r = {"id": vid, "s0": s0, "s1": s1, "ref_chars": len(LX.norm(ref))}
        for name, h in (("auto", hyp), ("whisper", wh)):
            e, n = LX.cer(ref, h)
            ec, _ = LX.cer(ref, LX.apply_rules(h, RULES)[0])
            r[f"cer_{name}"], r[f"cer_{name}_lex"] = round(e / n, 4), round(ec / n, 4)
        r["clean"] = r["cer_auto"] <= 0.20
        rows.append(r)
    clean = [r for r in rows if r["clean"]]
    tot = lambda k, rs: round(sum(r[k] * r["ref_chars"] for r in rs) / max(1, sum(r["ref_chars"] for r in rs)), 4)
    summ = {k: tot(k, clean) for k in ("cer_auto", "cer_auto_lex", "cer_whisper", "cer_whisper_lex")}
    summ["clean_windows"], summ["all_windows"] = len(clean), len(rows)
    summ["pick"] = "auto" if summ["cer_auto_lex"] <= summ["cer_whisper_lex"] else "whisper"
    (A / "cmp.json").write_text(json.dumps({"summary": summ, "windows": rows}, ensure_ascii=False, indent=1))
    for r in rows:
        print(r)
    print("깨끗한 창 합계", summ)


if __name__ == "__main__":
    main()
