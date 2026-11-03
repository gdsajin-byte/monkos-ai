"""KataGo train.py 감독 프로세스 — 학습량(샘플) 목표까지, 정해진 시각 전까지만 돌린다.

- train.py는 traindir의 checkpoint.ckpt에서 자동 재개한다(저장은 .tmp→rename 원자적) → 중단·재개 안전,
  손실은 마지막 에포크(100만 샘플) 일부뿐.
- 세션과 무관하게 살아 있도록 PowerShell Start-Process 또는 작업 스케줄러로 분리 기동한다.
- --until: 이 시각에 멈춘다(4060 공용 — 하교 후 시간대 회피, 작가님 11-03 21:08). 재개는 작업 스케줄러가 다시 기동.
- --final-eval: 목표 도달 또는 --until 만료로 끝나면 eval_ckpt.py --set full 실행.
- 실패 가시화: train.py가 목표 전에 비정상 종료하면 rc와 마지막 로그 20줄을 status.json에 남기고 exit 1.
"""
import argparse, json, os, re, subprocess, sys, time

ROOT = r"C:\Users\smuse73\go_train"
KATAGO_PY = os.path.join(ROOT, "KataGo", "python")
HERE = os.path.dirname(os.path.abspath(__file__))
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def last_nsamp(log_path):
    try:
        with open(log_path, encoding="utf-8", errors="replace") as f:
            m = re.findall(r"nsamp = ([0-9.]+)", f.read()[-200000:])
        return int(float(m[-1])) if m else None
    except OSError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="b10")
    ap.add_argument("--model-kind", default="b10c128")
    ap.add_argument("--batch-size", type=int, default=256)
    ap.add_argument("--hours", type=float, default=None, help="시작부터 N시간 뒤 멈춤 (--until과 택일)")
    ap.add_argument("--until", default=None, help="'YYYY-MM-DD HH:MM'(또는 _ 구분) 이 시각에 멈춤")
    ap.add_argument("--max-samples", type=int, default=None, help="누적 학습 샘플 목표 (train.py -max-training-samples)")
    ap.add_argument("--final-eval", action="store_true")
    a = ap.parse_args()

    run = os.path.join(ROOT, "run", a.name)
    os.makedirs(run, exist_ok=True)
    status_path = os.path.join(run, "status.json")
    log_path = os.path.join(run, "stdout.txt")
    cmd = [sys.executable, "train.py",
           "-traindir", os.path.join(run, "train"),
           "-datadir", os.path.join(ROOT, "data", "shuffled"),
           "-exportdir", os.path.join(run, "export"),
           "-exportprefix", a.name,
           "-pos-len", "19", "-batch-size", str(a.batch_size),
           "-model-kind", a.model_kind,
           "-no-compile"]
    if a.max_samples:
        cmd += ["-max-training-samples", str(a.max_samples)]
    t0 = time.time()
    if a.until:
        deadline = time.mktime(time.strptime(a.until.replace("_", " "), "%Y-%m-%d %H:%M"))  # 작업 스케줄러 인자용 _ 허용
    else:
        deadline = t0 + (a.hours if a.hours is not None else 24.0) * 3600

    def status(state, **kw):
        with open(status_path, "w", encoding="utf-8") as f:
            json.dump({"state": state, "pid": os.getpid(), "cmd": cmd,
                       "start": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t0)),
                       "deadline": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(deadline)),
                       "max_samples": a.max_samples, "nsamp": last_nsamp(log_path),
                       "updated": time.strftime("%Y-%m-%d %H:%M:%S"), **kw}, f, ensure_ascii=False, indent=1)

    def final_eval():
        if a.final_eval:
            status("final_eval", train_end=time.strftime("%Y-%m-%d %H:%M:%S"))
            r = subprocess.run([sys.executable, os.path.join(HERE, "eval_ckpt.py"), "--run", a.name, "--set", "full"],
                               creationflags=NO_WINDOW)
            status("done", final_eval_rc=r.returncode)

    if time.time() >= deadline:
        status("skipped_past_deadline")
        return
    with open(log_path, "a", encoding="utf-8") as log:
        env = dict(os.environ, TORCHDYNAMO_DISABLE="1", PYTHONIOENCODING="utf-8")
        p = subprocess.Popen(cmd, cwd=KATAGO_PY, stdout=log, stderr=subprocess.STDOUT, env=env, creationflags=NO_WINDOW)
        status("running", train_pid=p.pid)
        while p.poll() is None and time.time() < deadline:
            time.sleep(30)
            status("running", train_pid=p.pid)
        if p.poll() is None:
            p.terminate()
            try:
                p.wait(120)
            except subprocess.TimeoutExpired:
                p.kill()
            status("done_deadline")
            final_eval()
            return
    n = last_nsamp(log_path)
    if p.returncode == 0 and a.max_samples and n is not None and n >= a.max_samples - 2_000_000:
        status("done_target")
        final_eval()
        return
    with open(log_path, encoding="utf-8", errors="replace") as f:
        tail = f.readlines()[-20:]
    status("failed_early", rc=p.returncode, elapsed_h=round((time.time() - t0) / 3600, 2), tail=tail)
    sys.exit(1)


if __name__ == "__main__":
    main()
