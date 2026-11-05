"""4060: b10 최종 평가(GO-train-resume 인스턴스)만 멈춘다 — 작가님 17:22 "멈춰 밤에 진행"(쌍아 세션2 전달).
대상 = status.json pid(train_run 감독)와 그 하위 프로세스 중 go_train 경로의 python/pythonw/katago만. 게임·기타 프로세스 무관.
사용: python stop_eval.py [--kill]   (기본은 목록만)
"""
import json, sys, psutil
ST = r"C:\Users\smuse73\go_train\run\b10\status.json"
s = json.load(open(ST, encoding="utf-8"))
root_pid = s.get("pid")
kill = "--kill" in sys.argv
try:
    root = psutil.Process(root_pid)
except psutil.NoSuchProcess:
    print("감독 프로세스 없음", root_pid); sys.exit(0)
procs = [root] + root.children(recursive=True)
targets = []
for p in procs:
    try:
        exe = p.exe() or ""
        cmd = " ".join(p.cmdline())[:160]
    except (psutil.AccessDenied, psutil.NoSuchProcess):
        exe, cmd = "?", "?"
    ok = ("go_train" in exe.lower() or "go-train" in exe.lower() or "go_train" in cmd.lower())
    print(("대상 " if ok else "제외 ") + f"{p.pid} {p.name()} {exe} | {cmd}")
    if ok:
        targets.append(p)
if kill:
    for p in reversed(targets):  # 자식부터
        try:
            p.kill()
        except psutil.NoSuchProcess:
            pass
    gone, alive = psutil.wait_procs(targets, timeout=15)
    print("종료", len(gone), "남음", [p.pid for p in alive])
left = [p.pid for p in psutil.process_iter(["name", "exe"]) if (p.info["name"] or "").lower() == "katago.exe"
        and "go_train" in (p.info["exe"] or "").lower()]
print("go_train katago 남은 수", len(left), left)
