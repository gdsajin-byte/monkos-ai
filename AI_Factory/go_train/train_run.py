"""KataGo train.py를 정해진 시간만 돌리고 멈추는 감독 프로세스.

- 체크포인트·익스포트는 train.py가 1 에포크(기본 100만 샘플)마다 남긴다 → 시간 만료로 끊어도 손실은 마지막 에포크 일부뿐.
- 세션과 무관하게 살아 있도록 PowerShell Start-Process로 분리 기동한다 (README §학습).
- 실패 가시화: train.py가 시간 전에 끝나면 rc와 마지막 로그 20줄을 status.json에 남기고 exit 1.
"""
import argparse, json, os, subprocess, sys, time

ROOT = r"C:\Users\smuse73\go_train"
KATAGO_PY = os.path.join(ROOT, "KataGo", "python")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="b10")
    ap.add_argument("--model-kind", default="b10c128")
    ap.add_argument("--batch-size", type=int, default=256)
    ap.add_argument("--hours", type=float, default=24.0)
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
    t0 = time.time()
    deadline = t0 + a.hours * 3600

    def status(state, **kw):
        with open(status_path, "w", encoding="utf-8") as f:
            json.dump({"state": state, "pid": os.getpid(), "cmd": cmd,
                       "start": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(t0)),
                       "deadline": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(deadline)),
                       "updated": time.strftime("%Y-%m-%d %H:%M:%S"), **kw}, f, ensure_ascii=False, indent=1)

    with open(log_path, "a", encoding="utf-8") as log:
        env = dict(os.environ, TORCHDYNAMO_DISABLE="1", PYTHONIOENCODING="utf-8")
        p = subprocess.Popen(cmd, cwd=KATAGO_PY, stdout=log, stderr=subprocess.STDOUT, env=env)
        status("running", train_pid=p.pid)
        while p.poll() is None and time.time() < deadline:
            time.sleep(30)
        if p.poll() is None:
            p.terminate()
            try:
                p.wait(120)
            except subprocess.TimeoutExpired:
                p.kill()
            status("done_deadline", hours=a.hours)
            return
    with open(log_path, encoding="utf-8", errors="replace") as f:
        tail = f.readlines()[-20:]
    status("failed_early", rc=p.returncode, elapsed_h=round((time.time() - t0) / 3600, 2), tail=tail)
    sys.exit(1)


if __name__ == "__main__":
    main()
