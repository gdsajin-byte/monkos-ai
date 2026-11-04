#!/usr/bin/env python3
"""gundae_register.py — 건대 시대 RAW(CR2/CR3) ↔ `출력용` JPG 정합 소표본 (규칙 신뢰도 확인용). 읽기 전용.

register_pairs.py의 정합 A와 같은 함수·같은 성공 기준을 쓴다. 건대는 사이드카·마스터가 거의 없어 A만 잰다.
RAW가 여럿이면 최대 4장을 시험해 성공한 것 중 inlier 최다를 택한다(어느 컷이 출고됐는지 모르므로).
"""
import argparse
import json
import os
import random
import shutil
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402
import register_pairs as rp  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-n", type=int, default=10)
    ap.add_argument("--seed", type=int, default=523)
    ap.add_argument("--max-raw", type=int, default=4)
    a = ap.parse_args()
    man = [json.loads(l) for l in open(os.path.join(bm.HOME, "manifest_v0.jsonl"), encoding="utf-8")]
    pm = {p["id"]: p["refs"] for p in (json.loads(l) for l in open(os.path.join(bm.HOME, "pathmap.jsonl"), encoding="utf-8"))}
    pool = [r for r in man if r["era"] == "gundae" and r["date"] >= "2023-07" and r["raw"]
            and any(s["src"] == "gundae_print" for s in r["spec_final"])]
    rnd = random.Random(a.seed)
    sample = rnd.sample(pool, min(a.n, len(pool)))
    os.makedirs(rp.TMP, mode=0o700, exist_ok=True)
    out = []
    for i, r in enumerate(sample, 1):
        refs = pm[r["id"]]
        path = lambda ref: os.path.join(bm.SHARES[refs[ref].split(":", 1)[0]], refs[ref].split(":", 1)[1])
        spec = next(s for s in r["spec_final"] if s["src"] == "gundae_print")
        work = os.path.join(rp.TMP, f"g{i:02d}")
        os.makedirs(work, exist_ok=True)
        best = None
        tried = 0
        why = Counter()
        try:
            spec_img, spec_wh = rp.load_pil(path(spec["path_ref"]))
            for raw in r["raw"][: a.max_raw]:
                tried += 1
                try:
                    raw_img, raw_wh = rp.decode_raw(path(raw["path_ref"]), os.path.join(work, "raw.jpg"))
                except Exception:
                    why["현상 실패"] += 1
                    continue
                sc = raw_wh[0] / raw_img.shape[1]
                A = rp.register(spec_img, raw_img, sc)
                ok, w = rp.judge(A, raw_wh, sc, spec_wh)
                why[w] += 1
                if ok and (best is None or A["inliers"] > best["inliers"]):
                    A["ncc"] = rp.ncc_check(A["M"], spec_img, raw_img)
                    best = A
        finally:
            shutil.rmtree(work, ignore_errors=True)
        rec = {"id": r["id"], "date": r["date"], "n_raw": len(r["raw"]), "tried": tried, "ok": bool(best),
               "why": dict(why)}
        if best:
            rec.update({k: best.get(k) for k in ("inliers", "ratio", "med_px", "scale", "angle", "ncc")})
        out.append(rec)
        print(f"[{i:02d}] {r['id'][:10]} {r['date']} raw {len(r['raw'])}(시험 {tried}) ok={rec['ok']} "
              f"med={rec.get('med_px')} inl={rec.get('inliers')} why={dict(why)}", flush=True)
    ok = [o for o in out if o["ok"]]
    print(f"\n건대 정합: 성공 {len(ok)}/{len(out)} · 오차 중앙값 {sorted(o['med_px'] for o in ok)}")
    with open(os.path.join(bm.HOME, "register_gundae_v0.jsonl"), "w", encoding="utf-8") as f:
        for o in out:
            f.write(json.dumps(o, ensure_ascii=False, default=float) + "\n")
    os.chmod(os.path.join(bm.HOME, "register_gundae_v0.jsonl"), 0o600)


if __name__ == "__main__":
    main()
