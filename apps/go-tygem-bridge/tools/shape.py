# secret.sh get 출력 "형태"만 점검 — 값은 출력하지 않는다(줄 수·길이·경로 줄 여부만)
import subprocess
REPO = "/Users/jeong-kyushin/developer/monk_project"
for name in ("TYGEM_ID", "TYGEM_PASSWORD"):
    r = subprocess.run([f"{REPO}/scripts/secret.sh", "get", name], capture_output=True, text=True)
    lines = r.stdout.split("\n")
    desc = [("path-like" if l.startswith("/") else ("empty" if not l else "other")) + f":{len(l)}" for l in lines]
    print(name, "rc", r.returncode, "lines", len(lines), desc, "stderr_len", len(r.stderr))
