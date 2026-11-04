#!/usr/bin/env python3
"""register_pairs.py — RAW ↔ 규격 완성 JPG 정합 시험 (P0 게이트 재료). 읽기 전용.

각 표본 고객에 대해 세 정합을 독립으로 잰다(특징점 SIFT + RANSAC 닮음변환, cv2):
  A. spec → RAW        : 출고본이 원본의 어느 상자에서 잘렸나 (본 시험의 답)
  B. spec → master TIF : 규격 상자가 마스터 프레임 안 어디인가
  C. master → RAW      : 마스터 프레임이 원본의 어디인가 → 사이드카 .xmp 크롭과 대조
그리고 "사이드카 예측" = xmp 크롭(마스터 프레임) ∘ B 로 규격 상자를 RAW 위에 예측해 A와 비교한다.

RAW 현상: macOS `sips` (macOS 13 RAW 엔진, CR3/CR2 지원 — 11-04 실측 6000×4000 디코드 2.3s).
  내장 미리보기 JPEG 추출보다 sips를 택한 근거: 별도 파서 없이 전 해상도 디코드가 되고, 미리보기 해상도가
  기종별로 달라 좌표 환산이 흔들리는 문제를 피한다. 정합은 긴 변 PREVIEW_LONG px 축소본에서 하고 원본 px로 환산.

성공 판정(실행 전 고정 — README §정합 성공 기준):
  inlier ≥ 15 · inlier 비율 ≥ 0.20 · inlier 재투영 오차 중앙값 ≤ 6 px(원본 기준) ·
  상자 네 모서리가 원본 프레임 안(여유 3%) · 배율 0.05~2.0
산출(레포 밖): ~/.monkos/photo_judge/register_v0.jsonl (가명 id·수치만). stdout: 요약 표.
⚠️ 표본 이미지 사본·현상본은 ~/.monkos/photo_judge/tmp/ 에만 두고 끝나면 지운다.
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
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_manifest as bm  # noqa: E402

Image.MAX_IMAGE_PIXELS = None
PREVIEW_LONG = 2400
MASTER_LONG = 1400
TMP = os.path.join(bm.HOME, "tmp")
CRIT = {"min_inliers": 15, "min_ratio": 0.20, "max_med_px": 6.0, "frame_margin": 0.03,
        "scale_lo": 0.05, "scale_hi": 2.0}
SPEC_PRIORITY = ["여권", "증명", "민증운전", "운전민증", "민증", "운전", "미국비자", "중국비자", "사원증", "이력서"]


def gray(img):
    return cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if img.ndim == 3 else img


def load_pil(path, long_side=None):
    im = Image.open(path)
    im = im.convert("RGB")
    full = im.size
    if long_side and max(im.size) > long_side:
        s = long_side / max(im.size)
        im = im.resize((round(im.size[0] * s), round(im.size[1] * s)), Image.LANCZOS)
    return np.asarray(im), full


def decode_raw(src, dst):
    r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92",
                        "-Z", str(PREVIEW_LONG), src, "--out", dst],
                       capture_output=True, text=True, timeout=120)
    if r.returncode != 0 or not os.path.exists(dst):
        raise RuntimeError("sips_fail")
    full = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", src],
                          capture_output=True, text=True).stdout.split()
    w = int(full[full.index("pixelWidth:") + 1]); h = int(full[full.index("pixelHeight:") + 1])
    img, _ = load_pil(dst)
    return img, (w, h)


_sift = None


def feats(img):
    global _sift
    if _sift is None:
        _sift = cv2.SIFT_create(nfeatures=12000, contrastThreshold=0.02)
    g = gray(img)
    g = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(g)
    return _sift.detectAndCompute(g, None)


def register(src_img, dst_img, dst_scale_to_full):
    """src → dst 닮음변환. 반환: dict(M(2x3, src px→dst 축소 px), 지표). 오차는 dst 원본 px."""
    k1, d1 = feats(src_img)
    k2, d2 = feats(dst_img)
    out = {"kp_src": len(k1), "kp_dst": len(k2)}
    if d1 is None or d2 is None or len(k1) < 8 or len(k2) < 8:
        out["fail"] = "특징점 부족"
        return out
    m = cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1, d2, k=2)
    good = [a for a, b in (x for x in m if len(x) == 2) if a.distance < 0.8 * b.distance]
    out["matches"] = len(good)
    if len(good) < 8:
        out["fail"] = "매칭 부족"
        return out
    p1 = np.float32([k1[g.queryIdx].pt for g in good])
    p2 = np.float32([k2[g.trainIdx].pt for g in good])
    M, inl = cv2.estimateAffinePartial2D(p1, p2, method=cv2.RANSAC, ransacReprojThreshold=3.0,
                                         maxIters=20000, confidence=0.999)
    if M is None:
        out["fail"] = "RANSAC 해 없음"
        return out
    inl = inl.ravel().astype(bool)
    proj = (np.c_[p1, np.ones(len(p1))] @ M.T)
    res = np.linalg.norm(proj - p2, axis=1)[inl] * dst_scale_to_full
    out.update({"M": M.tolist(), "inliers": int(inl.sum()), "ratio": round(float(inl.mean()), 3),
                "med_px": round(float(np.median(res)), 2) if inl.any() else None,
                "p90_px": round(float(np.percentile(res, 90)), 2) if inl.any() else None,
                "scale": round(float(math.hypot(M[0, 0], M[1, 0])), 4),
                "angle": round(float(math.degrees(math.atan2(M[1, 0], M[0, 0]))), 3)})
    return out


def corners(w, h):
    return np.float32([[0, 0], [w, 0], [w, h], [0, h]])


def apply(M, pts):
    M = np.asarray(M)
    return np.c_[pts, np.ones(len(pts))] @ M.T


def judge(r, dst_full_wh, dst_scale_to_full, src_wh):
    if "fail" in r:
        return False, r["fail"]
    c = apply(r["M"], corners(*src_wh)) * dst_scale_to_full
    W, H = dst_full_wh
    mx, my = W * CRIT["frame_margin"], H * CRIT["frame_margin"]
    r["box_full"] = [round(float(v), 1) for v in c.ravel()]
    if r["inliers"] < CRIT["min_inliers"]:
        return False, "inlier 부족"
    if r["ratio"] < CRIT["min_ratio"]:
        return False, "inlier 비율 낮음"
    if r["med_px"] is None or r["med_px"] > CRIT["max_med_px"]:
        return False, "재투영 오차 큼"
    sc = r["scale"] * dst_scale_to_full
    if not (CRIT["scale_lo"] <= sc <= CRIT["scale_hi"] * 20):
        return False, "배율 비정상"
    if (c[:, 0] < -mx).any() or (c[:, 0] > W + mx).any() or (c[:, 1] < -my).any() or (c[:, 1] > H + my).any():
        return False, "상자 프레임 밖"
    return True, "ok"


def ncc_check(M, src_img, dst_img):
    """dst(축소)를 src 프레임으로 되돌려 그레이 기울기 NCC — 독립 확인용(판정에 미사용)."""
    Mi = cv2.invertAffineTransform(np.asarray(M, dtype=np.float64))
    h, w = src_img.shape[:2]
    back = cv2.warpAffine(gray(dst_img), Mi, (w, h), flags=cv2.INTER_AREA)
    def grad(g):
        g = g.astype(np.float32)
        return cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))
    a, b = grad(gray(src_img)).ravel(), grad(back).ravel()
    a = (a - a.mean()) / (a.std() + 1e-6); b = (b - b.mean()) / (b.std() + 1e-6)
    return round(float((a * b).mean()), 3)


def xmp_rect_candidates(crop, angle, W, H):
    """xmp 크롭 → RAW 원본 px 사각형 후보 2종(축정렬 / 중심 기준 회전). 어느 해석이 맞는지는 데이터로 고른다."""
    l, t, r, b = crop
    ax = np.float32([[l * W, t * H], [r * W, t * H], [r * W, b * H], [l * W, b * H]])
    cx, cy = ax[:, 0].mean(), ax[:, 1].mean()
    out = {"axis": ax}
    # Adobe crs 해석: (Left,Top)·(Right,Bottom) = 회전된 크롭 사각형의 대각 꼭짓점, 변 방향 = CropAngle.
    # (11-04 표본: 이 해석에서 변 길이가 정합 C 실측과 일치) 부호 규약은 데이터로 고른다.
    P1 = np.float64([l * W, t * H]); P2 = np.float64([r * W, b * H]); d = P2 - P1
    for sgn, name in ((1, "diag+"), (-1, "diag-")):
        th = math.radians(sgn * (angle or 0))
        u = np.array([math.cos(th), math.sin(th)]); v = np.array([-math.sin(th), math.cos(th)])
        w, h = d @ u, d @ v
        out[name] = np.float32([P1, P1 + w * u, P2, P1 + h * v])
    return out


def poly_err(p, q):
    """두 사각형(꼭짓점 순서 무관) 꼭짓점 오차 — 순환·반전 배치 중 최소의 (평균, 최대) px."""
    best = None
    for s in range(4):
        for rev in (False, True):
            qq = q[::-1] if rev else q
            qq = np.roll(qq, s, axis=0)
            d = np.linalg.norm(p - qq, axis=1)
            if best is None or d.mean() < best[0]:
                best = (float(d.mean()), float(d.max()))
    return round(float(best[0]), 1), round(float(best[1]), 1)


def pick_samples(man, n, seed):
    rnd = random.Random(seed)
    pool = defaultdict(list)
    for r in man:
        if r["era"] != "hanam" or not r["raw"] or not r["master"]:
            continue
        named = [s for s in r["spec_final"] if s["src"] == "named"]
        xmp = [s for s in r["sidecar"] if s["type"] == "xmp" and s.get("crop") and s.get("for")]
        if not named or not xmp:
            continue
        pur = named[0]["purpose"]
        pool[(r["date"][:4], pur if pur in SPEC_PRIORITY else "기타")].append(r)
    for v in pool.values():
        rnd.shuffle(v)
    keys = sorted(pool)
    out = []
    while len(out) < n and any(pool[k] for k in keys):
        for k in keys:
            if pool[k] and len(out) < n:
                out.append(pool[k].pop())
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--manifest", default=os.path.join(bm.HOME, "manifest_v0.jsonl"))
    ap.add_argument("--pathmap", default=os.path.join(bm.HOME, "pathmap.jsonl"))
    ap.add_argument("--out", default=os.path.join(bm.HOME, "register_v0.jsonl"))
    ap.add_argument("-n", type=int, default=50)
    ap.add_argument("--seed", type=int, default=1104)
    ap.add_argument("--keep-tmp", action="store_true")
    a = ap.parse_args()
    man = [json.loads(l) for l in open(a.manifest, encoding="utf-8")]
    pm = {p["id"]: p["refs"] for p in (json.loads(l) for l in open(a.pathmap, encoding="utf-8"))}
    samples = pick_samples(man, a.n, a.seed)
    os.makedirs(TMP, mode=0o700, exist_ok=True)
    results = []
    t0 = time.time()
    for i, r in enumerate(samples, 1):
        refs = pm[r["id"]]
        path = lambda ref: os.path.join(bm.SHARES[refs[ref].split(":", 1)[0]], refs[ref].split(":", 1)[1])
        spec = next(s for s in r["spec_final"] if s["src"] == "named")
        x = next(s for s in r["sidecar"] if s["type"] == "xmp" and s.get("crop") and s.get("for"))
        rec = {"id": r["id"], "date": r["date"], "purpose": spec["purpose"],
               "n_raw": len(r["raw"]), "xmp_angle": x["angle"], "xmp_orientation": x.get("orientation")}
        work = os.path.join(TMP, f"w{i:02d}")
        os.makedirs(work, exist_ok=True)
        try:
            spec_img, spec_wh = load_pil(path(spec["path_ref"]))
            rec["spec_wh"] = list(spec_wh)
            # 마스터 TIF: 이름 붙은 것 우선(마스터 여럿이면 첫 것)
            master_img, master_wh = load_pil(path(r["master"][0]["path_ref"]), MASTER_LONG)
            m_scale = master_wh[0] / master_img.shape[1]
            raw_ref = x["for"]
            raw_img, raw_wh = decode_raw(path(raw_ref), os.path.join(work, "raw.jpg"))
            r_scale = raw_wh[0] / raw_img.shape[1]
            rec["raw_wh"] = list(raw_wh); rec["master_wh"] = list(master_wh)

            A = register(spec_img, raw_img, r_scale)
            okA, whyA = judge(A, raw_wh, r_scale, spec_wh)
            if okA:
                A["ncc"] = ncc_check(A["M"], spec_img, raw_img)
            B = register(spec_img, master_img, m_scale)
            okB, whyB = judge(B, master_wh, m_scale, spec_wh)
            C = register(master_img, raw_img, r_scale)
            okC, whyC = judge(C, raw_wh, r_scale, (master_img.shape[1], master_img.shape[0]))
            rec.update({"A_ok": okA, "A_why": whyA, "B_ok": okB, "B_why": whyB, "C_ok": okC, "C_why": whyC})
            for k, R in (("A", A), ("B", B), ("C", C)):
                rec[k] = {kk: R.get(kk) for kk in ("inliers", "ratio", "med_px", "p90_px", "scale", "angle",
                                                     "matches", "ncc", "box_full")}
            # 사이드카 대조 1: xmp 크롭 사각형 vs 정합 C(마스터 프레임의 RAW 위치)
            cands = xmp_rect_candidates(x["crop"], x["angle"], *raw_wh)
            if okC:
                C_box = np.float32(C["box_full"]).reshape(4, 2)
                errs = {k: poly_err(C_box, v) for k, v in cands.items()}
                best = min(errs, key=lambda k: errs[k][0])
                rec["xmp_vs_C"] = {"best": best, "mean_px": errs[best][0], "max_px": errs[best][1],
                                   "all": {k: v[0] for k, v in errs.items()}}
            # 사이드카 대조 2: xmp 크롭 ∘ B 로 예측한 규격 상자 vs 정합 A
            if okA and okB:
                # 마스터 원본 px → RAW 원본 px: xmp 사각형(최적 해석)을 마스터 프레임 네 모서리에 대응시키는
                # 변환이 필요하다. 마스터의 방향(회전 0/90/180/270)은 모르므로 4방향을 모두 시험해 최소 오차를 쓴다.
                Bc = apply(B["M"], corners(*spec_wh)) * m_scale  # 규격 상자, 마스터 원본 px
                mw, mh = master_wh
                mc = corners(mw, mh)
                best_e = None
                for kname, rect in cands.items():
                    for s in range(4):
                        for rev in (False, True):
                            q = rect[::-1] if rev else rect
                            q = np.roll(q, s, axis=0).astype(np.float32)
                            T, _ = cv2.estimateAffine2D(mc.astype(np.float32), q)
                            if T is None:
                                continue
                            pred = apply(T, Bc)
                            # 마스터→RAW 대응이 닮음이 아닌 배치(비율 뒤집힘)는 제외
                            sx = math.hypot(T[0, 0], T[1, 0]); sy = math.hypot(T[0, 1], T[1, 1])
                            if abs(sx / sy - 1) > 0.06:
                                continue
                            e = poly_err(np.float32(A["box_full"]).reshape(4, 2), pred)
                            if best_e is None or e[0] < best_e[0]:
                                best_e = (e[0], e[1], kname)
                if best_e:
                    w_box = np.linalg.norm(np.float32(A["box_full"]).reshape(4, 2)[1] -
                                           np.float32(A["box_full"]).reshape(4, 2)[0])
                    rec["xmpB_vs_A"] = {"mean_px": best_e[0], "max_px": best_e[1], "interp": best_e[2],
                                        "mean_pct_of_box_w": round(100 * best_e[0] / max(w_box, 1), 2)}
        except Exception as e:  # 실패는 실패로 기록
            rec["A_ok"] = False
            rec["A_why"] = f"예외:{type(e).__name__}"
        finally:
            if not a.keep_tmp:
                shutil.rmtree(work, ignore_errors=True)
        results.append(rec)
        print(f"[{i:02d}/{len(samples)}] {rec['id'][:10]} {rec['date']} {rec['purpose']:<5} "
              f"A={rec.get('A_ok')}({rec.get('A_why')}) B={rec.get('B_ok')} C={rec.get('C_ok')} "
              f"A_med={rec.get('A', {}).get('med_px')} xmpC={rec.get('xmp_vs_C', {}).get('mean_px')} "
              f"xmpB~A={rec.get('xmpB_vs_A', {}).get('mean_px')} {time.time()-t0:.0f}s", flush=True)
    with open(a.out, "w", encoding="utf-8") as f:
        for rec in results:
            f.write(json.dumps(rec, ensure_ascii=False, default=float) + "\n")
    os.chmod(a.out, 0o600)
    summarize(results)


def q(v, p):
    return round(float(np.percentile(v, p)), 1) if v else None


def summarize(res):
    n = len(res)
    print(f"\n## 정합 요약 (n={n})")
    for k, label in (("A", "A spec→RAW"), ("B", "B spec→master"), ("C", "C master→RAW")):
        ok = [r for r in res if r.get(f"{k}_ok")]
        med = [r[k]["med_px"] for r in ok]
        print(f"- {label}: 성공 {len(ok)}/{n} ({len(ok)/max(n,1):.0%}) · 재투영 오차 중앙값 분포 "
              f"p50 {q(med,50)} / p90 {q(med,90)} / max {q(med,100)} px(원본)")
        why = Counter(r.get(f"{k}_why") for r in res if not r.get(f"{k}_ok"))
        if why:
            print(f"  실패 사유: {dict(why)}")
    xc = [r["xmp_vs_C"]["mean_px"] for r in res if "xmp_vs_C" in r]
    xi = Counter(r["xmp_vs_C"]["best"] for r in res if "xmp_vs_C" in r)
    print(f"- 사이드카 크롭 vs 정합 C(마스터 프레임): n={len(xc)} · 꼭짓점 평균오차 p50 {q(xc,50)} / p90 {q(xc,90)} / max {q(xc,100)} px · 해석 {dict(xi)}")
    xa = [r["xmpB_vs_A"]["mean_px"] for r in res if "xmpB_vs_A" in r]
    xp = [r["xmpB_vs_A"]["mean_pct_of_box_w"] for r in res if "xmpB_vs_A" in r]
    print(f"- 사이드카∘B 예측 vs 정합 A(규격 상자): n={len(xa)} · 평균오차 p50 {q(xa,50)} / p90 {q(xa,90)} / max {q(xa,100)} px · 상자 폭 대비 p50 {q(xp,50)}% / p90 {q(xp,90)}%")
    nc = [r["A"]["ncc"] for r in res if r.get("A_ok") and r["A"].get("ncc") is not None]
    print(f"- A 성공분 기울기 NCC(독립 확인): p10 {q(nc,10)} / p50 {q(nc,50)} / min {q(nc,0)}")


if __name__ == "__main__":
    main()
