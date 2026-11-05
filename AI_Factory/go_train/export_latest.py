"""최신 익스포트 체크포인트 1개를 .bin.gz로만 변환한다(대국 평가 없음) — v3처럼 --final-eval 없이 끝난 학습용.

사용(4060, go-train venv): python export_latest.py --run b10
출력: C:\\Users\\smuse73\\go_train\\eval\\{run}\\{export 이름}\\model.bin.gz (eval_ckpt.to_bin과 같은 위치·방식) + 학습 줄 nsamp·sha256
상태 판정은 status.json이 아니라 stdout 학습 줄 nsamp(train_run.last_nsamp 수정본과 같은 정규식)와 export 폴더로 한다(11-05 쌍아 판정).
"""
import argparse, hashlib, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
# 4060 레포 사본 밖(go_kibo 등)에 두고 실행할 때 — eval_ckpt가 있는 go_train 폴더
sys.path.insert(0, os.environ.get("GO_TRAIN_DIR", r"C:\Users\smuse73\developer\monk_project\AI_Factory\go_train"))
from eval_ckpt import ROOT, latest_export, to_bin  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", default="b10")
    a = ap.parse_args()
    exp = latest_export(a.run)
    if not exp:
        raise SystemExit("❌ export_latest: 익스포트 체크포인트 없음")
    name = os.path.basename(exp)
    out_dir = os.path.join(ROOT, "eval", a.run, name)
    os.makedirs(out_dir, exist_ok=True)
    model = to_bin(exp, out_dir)
    h = hashlib.sha256(open(model, "rb").read()).hexdigest()
    log = os.path.join(ROOT, "run", a.run, "stdout.txt")
    with open(log, encoding="utf-8", errors="replace") as f:
        m = re.findall(r"nsamp = ([0-9.]+), pslr_batch", f.read()[-200000:])
    print(f"export={name}\nmodel={model}\nbytes={os.path.getsize(model)}\nsha256={h}\ntrain_nsamp={int(float(m[-1])) if m else None}")


if __name__ == "__main__":
    main()
