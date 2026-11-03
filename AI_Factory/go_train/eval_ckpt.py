"""최신 익스포트 체크포인트 1개를 .bin.gz로 변환하고 대국 사다리를 돌려 학습 곡선 1행을 남긴다.

사용: python eval_ckpt.py --run b10 [--set quick|full] [--games N]
  quick: 우리 visits 1 vs 사람 급수 흉내(1k·3d·5d, 각 30판) + KataGo b18 visits 1(20판)
  full : quick + 사람 7d + 우리 visits 32 vs (사람 1k·3d 30판, b18 visits 1·8 20판)
산출: go_train/eval/<run>/<익스포트명>/*.jsonl (대국별) + go_train/eval/<run>/curve.jsonl (조건별 요약 1행씩)

사람 급수 흉내 = KataGo 공식 b18c384nbt-humanv0 + humanSLProfile rank_X (예제 cfg 기본 40 visits, 사람 수 표본 추출).
급수 환산은 이 흉내 망의 실제 강도에 기대는 추정이다 — 보고에 명기.
실패 가시화: 변환·대국 실패는 curve 행에 error로 남기고 exit 1.
"""
import argparse, glob, json, os, re, subprocess, sys, time

ROOT = r"C:\Users\smuse73\go_train"
HERE = os.path.dirname(os.path.abspath(__file__))
KATAGO_PY = os.path.join(ROOT, "KataGo", "python")
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)  # 작업 스케줄러 기동 시 콘솔 창 억제(공용 PC)
SETS = {
    # 항목 = (우리 visits, 상대, 판 수). 사람 흉내 망 프로필은 rank_20k~rank_9d.
    # 이력 — 11-03: 초기 체크포인트 대비 18급부터 깔았음 — 11-04 교체.
    # 11-04 작가님: 00:41 첫 평가에서 1k 55%(18k·10k 전승·5k 93%) → 1급 기준점부터 위로.
    # 어떤 단계 60% 초과 시 다음 측정부터 아래 단계를 빼고 한 단계 위(7d·9d)를 더한다 — 수동 갱신.
    # 판 수 30(b18 20)은 06:41 평가가 10:41과 겹치지 않게.
    "quick": [(1, "human:rank_1k", 30), (1, "human:rank_3d", 30), (1, "human:rank_5d", 30), (1, "b18:1", 20)],
}
SETS["full"] = SETS["quick"] + [(1, "human:rank_7d", 30), (32, "human:rank_1k", 30), (32, "human:rank_3d", 30),
                                (32, "b18:1", 20), (32, "b18:8", 20)]


def latest_export(run):
    ds = [d for d in glob.glob(os.path.join(ROOT, "run", run, "export", "*")) if os.path.isfile(os.path.join(d, "model.ckpt"))]
    return max(ds, key=os.path.getmtime) if ds else None


def to_bin(export_dir, out_dir):
    name = os.path.basename(export_dir)
    os.makedirs(out_dir, exist_ok=True)
    dst = os.path.join(out_dir, "model.bin.gz")
    if os.path.exists(dst):
        return dst
    ck = os.path.join(export_dir, "model.ckpt")
    base = [sys.executable, "export_model_pytorch.py", "-checkpoint", ck, "-export-dir", out_dir,
            "-model-name", name, "-filename-prefix", "model"]
    r = subprocess.run(base + ["-use-swa"], cwd=KATAGO_PY, capture_output=True, text=True, creationflags=NO_WINDOW)
    if r.returncode != 0:  # SWA 없는 체크포인트
        r = subprocess.run(base, cwd=KATAGO_PY, capture_output=True, text=True, creationflags=NO_WINDOW)
    if r.returncode != 0:
        raise RuntimeError("export 실패: " + (r.stderr or r.stdout)[-800:])
    import gzip, shutil
    with open(os.path.join(out_dir, "model.bin"), "rb") as fi, gzip.open(dst, "wb") as fo:
        shutil.copyfileobj(fi, fo)
    os.remove(os.path.join(out_dir, "model.bin"))
    return dst


def train_progress(run):
    """train.py 로그에서 마지막 누적 샘플·손실 1줄을 뽑는다(형식 변화 대비 원문 일부 보존)."""
    p = os.path.join(ROOT, "run", run, "stdout.txt")
    if not os.path.exists(p):
        return {}
    lines = open(p, encoding="utf-8", errors="replace").read().splitlines()
    out = {}
    for ln in reversed(lines):
        if "nsamp" in ln and "p0loss" in ln:
            m = {k: v for k, v in re.findall(r"(nsamp|p0loss|vloss|loss|pacc1)\s*=\s*([-\d.e+]+)", ln)}
            out["train_line"] = {k: float(v) for k, v in m.items()}
            break
    for ln in reversed(lines):
        if "VALIDATION" in ln.upper() or "val" in ln.split(" ")[0:3]:
            out["val_line_raw"] = ln[-300:]
            break
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", default="b10")
    ap.add_argument("--set", default="quick", choices=SETS)
    ap.add_argument("--games", type=int, default=None, help="지정 시 모든 상대에 일괄 적용(기본: 세트별 판 수)")
    ap.add_argument("--parallel", type=int, default=4)
    a = ap.parse_args()
    ev = os.path.join(ROOT, "eval", a.run)
    os.makedirs(ev, exist_ok=True)
    curve = os.path.join(ev, "curve.jsonl")
    exp = latest_export(a.run)
    base = {"t": time.strftime("%Y-%m-%d %H:%M:%S"), "run": a.run, "set": a.set, **train_progress(a.run)}
    if not exp:
        with open(curve, "a", encoding="utf-8") as f:
            f.write(json.dumps({**base, "error": "익스포트 없음"}, ensure_ascii=False) + "\n")
        sys.exit(1)
    name = os.path.basename(exp)
    base["export"] = name
    failed = False
    try:
        model = to_bin(exp, os.path.join(ev, name))
    except Exception as ex:
        with open(curve, "a", encoding="utf-8") as f:
            f.write(json.dumps({**base, "error": str(ex)}, ensure_ascii=False) + "\n")
        sys.exit(1)
    for visits, opp, games in SETS[a.set]:
        out = os.path.join(ev, name, f"v{visits}_{opp.replace(':', '_')}.jsonl")
        r = subprocess.run([sys.executable, os.path.join(HERE, "match.py"), "--ours", model, "--ours-visits", str(visits),
                            "--opp", opp, "--games", str(a.games or games), "--parallel", str(a.parallel), "--out", out],
                           capture_output=True, text=True, encoding="utf-8", creationflags=NO_WINDOW)
        try:
            summ = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception:
            summ = {"ours_visits": visits, "opp": opp, "error": (r.stderr or r.stdout)[-500:]}
            failed = True
        with open(curve, "a", encoding="utf-8") as f:
            f.write(json.dumps({**base, **summ}, ensure_ascii=False) + "\n")
        print(json.dumps(summ, ensure_ascii=False), flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
