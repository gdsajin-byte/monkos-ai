"""학습 일시정지 — 감독 프로세스를 먼저 끊고(실패로 기록하지 않게) train.py를 멈춘 뒤 status.json을 paused로 둔다.

재개는 train_run.py 재기동(checkpoint.ckpt에서 자동 재개). 작업 스케줄러 GO-train-pause가 부른다.
실패 가시화: 대상 프로세스가 없거나 종료 실패면 status.json에 사유를 남기고 exit 1.
"""
import argparse, json, os, subprocess, sys, time

ROOT = r"C:\Users\smuse73\go_train"
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def kill(pid):
    r = subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True, text=True, creationflags=NO_WINDOW)
    return r.returncode == 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--run", default="b10")
    a = ap.parse_args()
    path = os.path.join(ROOT, "run", a.run, "status.json")
    st = json.load(open(path, encoding="utf-8"))
    if st.get("state") != "running":
        st.update(pause_note=f"일시정지 생략 — state={st.get('state')}", updated=time.strftime("%Y-%m-%d %H:%M:%S"))
        json.dump(st, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        sys.exit(1)
    sup_ok = kill(st["pid"])
    tr_ok = kill(st["train_pid"])
    st.update(state="paused" if tr_ok else "pause_failed", supervisor_killed=sup_ok, train_killed=tr_ok,
              paused_at=time.strftime("%Y-%m-%d %H:%M:%S"), updated=time.strftime("%Y-%m-%d %H:%M:%S"))
    json.dump(st, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sys.exit(0 if tr_ok else 1)


if __name__ == "__main__":
    main()
