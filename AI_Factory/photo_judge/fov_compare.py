#!/usr/bin/env python3
"""fov_compare.py — 여권 화각 산식(포털 prod, 11-04 두상 재배율) vs 사진관 출고본 대조. 읽기 전용.

지시서: monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내7_IDPHOTO_여권화각_출고본대조.md

고객마다:
  1. RAW 현상(sips, 긴 변 2048 = precheck normalizeImage와 같은 상한) → 정합 A(출고 규격 JPG → RAW, register_pairs 그대로)
  2. 정합 각도로 RAW를 90° 단위로 세워 "업로드 원본"을 만든다(손님 사진처럼 바로 선 이미지). A 변환도 같이 돌린다.
  3. fov_formula.mjs(포털 정본 함수 + 로컬 crop-engine·vision-matte)로 랜드마크·머리끝(512 매팅)·산식 프레임을 1회 측정.
  4. 같은 랜드마크·머리끝 값을 두 프레임에 쓴다:
     - 출고 = A의 역변환으로 점을 규격 JPG 좌표에 옮겨 잰다(기울기 포함)
     - 산식 = 산식 프레임(pass·moved는 최종 틀, no_room은 산식이 시도한 최선 틀 = 재배율 + 눈 48%)
  지표: 두상 mm(턱~머리 덩어리 끝) · 거울상 두상 mm · 눈 % (위에서) · 머리 위 여백 mm · 턱 아래 mm (프레임 45mm 기준)

"크게 다름" 기준(실행 전 고정): |Δ두상| ≥ 1.5mm 또는 |Δ눈| ≥ 3.0%p 또는 |Δ머리 위 여백| ≥ 1.5mm.
표본: 하남 시대 · named 규격 용도=여권 · 규격 JPG 비율 35:45(±2%) · 월(YYYY-MM) 층 순환 · 시드 고정. 정합 성공·측정 성공 n건까지 진행.
산출(레포 밖, 600): ~/.monkos/photo_judge/fov_compare_v0.jsonl (가명 id·수치만). 현상본은 tmp/에서 건마다 삭제.
고객 픽셀은 이 기기 밖으로 나가지 않는다 — 측정 서버는 127.0.0.1만(fov_formula.mjs가 원격 주소를 거부).
"""
import argparse
import json
import math
import os
import random
import shutil
import statistics
import subprocess
import sys
import time
from collections import Counter, defaultdict

import cv2
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402
import register_pairs as rp  # noqa: E402

NORM_LONG = 2048  # portal normalizeImage resize 2048 inside
FRAME_HMM = 45.0
SPEC_ASPECT = 35 / 45
BIG = {"head": 1.5, "eye": 3.0, "top": 1.5}
HERE = os.path.dirname(os.path.abspath(__file__))
TMP = os.path.join(bm.HOME, "tmp", "fov")

ROT = {  # cv2 rotate 코드 → (x,y) 점 변환 (원 이미지 W,H)
    None: lambda x, y, W, H: (x, y),
    cv2.ROTATE_90_CLOCKWISE: lambda x, y, W, H: (H - 1 - y, x),
    cv2.ROTATE_90_COUNTERCLOCKWISE: lambda x, y, W, H: (y, W - 1 - x),
    cv2.ROTATE_180: lambda x, y, W, H: (W - 1 - x, H - 1 - y),
}


def decode(src, dst):
    r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92", "-Z", str(NORM_LONG), src, "--out", dst],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not os.path.exists(dst):
        raise RuntimeError("sips_fail")
    full = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", src], capture_output=True, text=True).stdout.split()
    return int(full[full.index("pixelWidth:") + 1]), int(full[full.index("pixelHeight:") + 1])


def upright(M, spec_wh, img):
    """정합 A(spec px → raw 축소 px)로 회전 코드를 골라 이미지를 세우고, 세운 좌표계의 변환을 돌려준다."""
    H, W = img.shape[:2]
    sw, sh = spec_wh
    pts = rp.apply(M, np.float32([[0, 0], [sw, 0], [0, sh], [sw, sh]]))
    best = None
    for code, f in ROT.items():
        q = np.float32([f(x, y, W, H) for x, y in pts])
        M2, _ = cv2.estimateAffinePartial2D(np.float32([[0, 0], [sw, 0], [0, sh], [sw, sh]]), q)
        ang = math.degrees(math.atan2(M2[1, 0], M2[0, 0]))
        if best is None or abs(ang) < abs(best[2]):
            best = (code, M2, ang)
    code, M2, ang = best
    out = img if code is None else cv2.rotate(img, code)
    return out, M2, ang


def frame_metrics(F, L, hair_y):
    mm = FRAME_HMM / F["h"]
    return {
        "head": (L["chinY"] - hair_y) * mm, "mirror": (L["chinY"] - L["crownY"]) * mm,
        "eye": (L["eyeY"] - F["y"]) / F["h"] * 100, "top": (hair_y - F["y"]) * mm,
        "chin": (F["y"] + F["h"] - L["chinY"]) * mm,
    }


def shipped_metrics(M2, spec_wh, L, hair_y):
    """출고 프레임 = 규격 JPG 자체. 원본 점을 A 역변환으로 규격 px에 옮긴다(기울기 반영)."""
    Mi = cv2.invertAffineTransform(np.asarray(M2, dtype=np.float64))
    cx = L["eyeCenterX"]
    ys = {k: float(rp.apply(Mi, np.float32([[cx, v]]))[0][1]) for k, v in
          (("eye", L["eyeY"]), ("chin", L["chinY"]), ("crown", L["crownY"]), ("hair", hair_y))}
    sh = spec_wh[1]
    mm = FRAME_HMM / sh
    return {
        "head": (ys["chin"] - ys["hair"]) * mm, "mirror": (ys["chin"] - ys["crown"]) * mm,
        "eye": ys["eye"] / sh * 100, "top": ys["hair"] * mm, "chin": (sh - ys["chin"]) * mm,
    }


def pick(man, seed):
    rnd = random.Random(seed)
    pool = defaultdict(list)
    for r in man:
        if r["era"] != "hanam" or not r["raw"]:
            continue
        sp = [s for s in r["spec_final"] if s["src"] == "named" and s["purpose"] == "여권"]
        if sp:
            pool[r["date"][:7]].append(r)
    for v in pool.values():
        rnd.shuffle(v)
    keys = sorted(pool)
    while any(pool[k] for k in keys):
        for k in keys:
            if pool[k]:
                yield pool[k].pop()


class Formula:
    def __init__(self):
        self.p = subprocess.Popen(["node", os.path.join(HERE, "fov_formula.mjs")], stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def __call__(self, path):
        self.p.stdin.write(json.dumps({"path": path}) + "\n")
        self.p.stdin.flush()
        return json.loads(self.p.stdout.readline())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default=os.path.join(bm.HOME, "manifest_v0.jsonl"))
    ap.add_argument("--pathmap", default=os.path.join(bm.HOME, "pathmap.jsonl"))
    ap.add_argument("--out", default=os.path.join(bm.HOME, "fov_compare_v0.jsonl"))
    ap.add_argument("-n", type=int, default=200)
    ap.add_argument("--seed", type=int, default=1104)
    ap.add_argument("--max-try", type=int, default=400)
    a = ap.parse_args()
    if os.path.realpath(a.out).startswith(os.path.realpath(os.path.join(HERE, "..", ".."))):
        sys.exit("❌ fov_compare: 산출은 레포 밖에만")
    man = [json.loads(l) for l in open(a.manifest, encoding="utf-8")]
    pm = {p["id"]: p["refs"] for p in (json.loads(l) for l in open(a.pathmap, encoding="utf-8"))}
    os.makedirs(TMP, mode=0o700, exist_ok=True)
    formula = Formula()
    res, tried, t0 = [], 0, time.time()
    fails = Counter()
    fo = open(a.out, "w", encoding="utf-8")
    os.chmod(a.out, 0o600)
    for r in pick(man, a.seed):
        ok_n = sum(1 for x in res if x.get("ok"))
        if ok_n >= a.n or tried >= a.max_try:
            break
        tried += 1
        refs = pm[r["id"]]
        path = lambda ref: os.path.join(bm.SHARES[refs[ref].split(":", 1)[0]], refs[ref].split(":", 1)[1])
        spec = next(s for s in r["spec_final"] if s["src"] == "named" and s["purpose"] == "여권")
        rec = {"id": r["id"], "date": r["date"], "ok": False}
        work = os.path.join(TMP, f"w{tried:03d}")
        os.makedirs(work, exist_ok=True)
        try:
            spec_img, spec_wh = rp.load_pil(path(spec["path_ref"]))
            rec["spec_wh"] = list(spec_wh)
            if abs(spec_wh[0] / spec_wh[1] - SPEC_ASPECT) > 0.02:
                rec["why"] = "규격 비율 불일치"
                raise StopIteration
            xr = [s["for"] for s in r["sidecar"] if s.get("type") == "xmp" and s.get("for")]
            raws = list(dict.fromkeys(xr + [x["path_ref"] for x in r["raw"]]))[:3]
            A = None
            for ref in raws:
                dst = os.path.join(work, "raw.jpg")
                full_wh = decode(path(ref), dst)
                raw_img, _ = rp.load_pil(dst)
                sc = full_wh[0] / raw_img.shape[1]
                A = rp.register(spec_img, raw_img, sc)
                okA, why = rp.judge(A, full_wh, sc, spec_wh)
                rec.update({"A_why": why, "A_med_px": A.get("med_px"), "A_inliers": A.get("inliers"), "n_raw_tried": raws.index(ref) + 1})
                if okA:
                    break
            if not okA:
                rec["why"] = f"정합 실패:{why}"
                raise StopIteration
            img, M2, tilt = upright(A["M"], spec_wh, raw_img)
            rec["tilt_deg"] = round(tilt, 2)
            norm = os.path.join(work, "norm.jpg")
            cv2.imwrite(norm, cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
            f = formula(norm)
            rec["status"] = f.get("status")
            if f.get("status") != "ok":
                rec["why"] = f"산식 측정 불가:{f.get('status')}"
                raise StopIteration
            L = f["lines"]
            hair_y = f["crown"]["hairTopRatio"] * f["H"]
            ship = shipped_metrics(M2, spec_wh, L, hair_y)
            F = f["frame"] if f["verdict"] != "no_room" else f["attempt"]
            form = frame_metrics(F, L, hair_y)
            ship_h = spec_wh[1] * math.hypot(M2[0][0], M2[1][0])  # 출고 틀 높이(원본 px)
            c_ship = rp.apply(np.asarray(M2), np.float32([[spec_wh[0] / 2, spec_wh[1] / 2]]))[0]
            rec.update({
                "ok": True, "verdict": f["verdict"], "headGuard": f["headGuard"], "topTouched": bool(f.get("topTouched")),
                "fov0": f["fov0"]["verdict"], "fov1": f["fov1"]["rawVerdict"], "fov1_cause": f["fov1"]["cause"],
                "slackMm": f["slackMm"], "marginTargetMm": f["marginTargetMm"],
                "hairRawGapPx": round((f["crown"]["hairTopRatio"] - (f["crown"]["hairTopRawRatio"] or f["crown"]["hairTopRatio"])) * f["H"], 1),
                "ship": {k: round(v, 2) for k, v in ship.items()}, "form": {k: round(v, 2) for k, v in form.items()},
                "scale_form_over_ship": round(F["h"] / ship_h, 4),  # >1 = 산식 틀이 큼(얼굴이 작게 나옴)
                "center_dx_mm": round((F["x"] + F["w"] / 2 - c_ship[0]) * FRAME_HMM / ship_h, 2),
                "center_dy_mm": round((F["y"] + F["h"] / 2 - c_ship[1]) * FRAME_HMM / ship_h, 2),
            })
            d = {k: rec["form"][k] - rec["ship"][k] for k in ("head", "eye", "top")}
            rec["big"] = [k for k in d if abs(d[k]) >= BIG[k]]
        except StopIteration:
            pass
        except Exception as e:
            rec["why"] = f"예외:{type(e).__name__}"
        finally:
            shutil.rmtree(work, ignore_errors=True)
        if not rec["ok"]:
            fails[rec.get("why", "?").split(":")[0] + ":" + rec.get("why", "?").split(":")[-1]] += 1
        res.append(rec)
        fo.write(json.dumps(rec, ensure_ascii=False) + "\n"); fo.flush()
        print(f"[{tried:03d}] ok={sum(1 for x in res if x.get('ok'))} {rec['id'][:10]} {rec['date']} "
              f"{rec.get('verdict', rec.get('why'))} {time.time()-t0:.0f}s", flush=True)
    fo.close()
    formula.p.stdin.close()
    print(f"\n시도 {tried} · 성공 {sum(1 for x in res if x.get('ok'))} · 제외 사유 {dict(fails)}")


if __name__ == "__main__":
    main()
