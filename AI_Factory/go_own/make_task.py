"""4060 에서 실행: 형세 소형망 학습 1회 예약 작업 \\MONK\\GO-own-train 을 만든다(GO-night-run 의 principal·설정을 물려받음).

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 §1-2 (23:05 이후만).
사용: python make_task.py 2026-11-07T23:06:00 [--dry-run]
      python make_task.py 2026-11-08T23:06:00 --v1 [--dry-run]   (11-08 막내7: \MONK\GO-own-train-v1 → night_v1.py, 실행 한도 7시간 30분)
학습 자체가 창(23:05~07:30) 밖 시작을 거부하고, 시간 상한 4시간·마감 07:30 을 스스로 지킨다. 작업 실행 한도는 4시간 30분.
"""
import re
import subprocess
import sys

SRC = r"\MONK\GO-night-run"
DST = r"\MONK\GO-own-train"
ROOT = r"C:\Users\smuse73\go_train\own_v0"
PYW = r"C:\Users\smuse73\venvs\go-train\Scripts\pythonw.exe"
ARGS = (rf'"{ROOT}\train.py" --data C:/Users/smuse73/go_train/own_v0/data --out C:/Users/smuse73/go_train/own_v0/run1 '
        '--hours 4 --deadline 07:30')


def main():
    global DST, ROOT, ARGS
    at = sys.argv[1]
    limit = "PT4H30M"
    if "--v1" in sys.argv:  # v1 야간 1회 — b6c96 → b10c128 학습 + onnx 변환·대조(night_v1.py)
        DST = r"\MONK\GO-own-train-v1"
        ROOT = r"C:\Users\smuse73\go_train\own_v1"
        ARGS = rf'"{ROOT}\night_v1.py"'
        limit = "PT7H30M"
    raw = subprocess.run(["schtasks", "/query", "/tn", SRC, "/xml"], capture_output=True, check=True).stdout
    for enc in ("utf-16", "utf-8", "cp949"):
        try:
            x = raw.decode(enc)
            if "<Task" in x:
                break
        except UnicodeDecodeError:
            continue
    else:
        sys.exit("❌ make_task: 원본 XML 해석 실패")
    def put(tag, val, count=1):
        nonlocal x
        x, k = re.subn(rf"<{tag}>.*?</{tag}>", lambda _m: f"<{tag}>{val}</{tag}>", x, count=count, flags=re.S)
        if not k:
            sys.exit(f"❌ make_task: 원본 XML 에 {tag} 없음")
    put("URI", DST)
    put("StartBoundary", at)
    put("Command", PYW)
    put("Arguments", ARGS.replace("&", "&amp;").replace('"', "&quot;"))
    put("WorkingDirectory", ROOT)
    put("ExecutionTimeLimit", limit, count=0)
    x = re.sub(r'encoding="[^"]+"', lambda _m: 'encoding="UTF-16"', x, count=1)
    path = ROOT + ("\\GO-own-train-v1.xml" if "--v1" in sys.argv else r"\GO-own-train.xml")
    open(path, "w", encoding="utf-16").write(x)
    print(x)
    if "--dry-run" in sys.argv:
        return
    r = subprocess.run(["schtasks", "/create", "/tn", DST, "/xml", path, "/f"], capture_output=True)
    print("create rc", r.returncode, r.stdout.decode("cp949", "replace"), r.stderr.decode("cp949", "replace"))
    q = subprocess.run(["schtasks", "/query", "/tn", DST, "/v", "/fo", "LIST"], capture_output=True).stdout.decode("cp949", "replace")
    print(q)
    sys.exit(r.returncode)


if __name__ == "__main__":
    main()
