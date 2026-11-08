"""4060 야간 1회: 형세망 v1 — b6c96 → b10c128 순서로 학습하고, 각각 onnx 변환·대조(export_onnx.py, CPU)까지.

출처: ORDER_20261108_iMac쌍아_막내7_GO_형세망_막대반영_v1학습 §1-2 (작가님 11-08 10:49 승인 — 일요일 밤 창, 23:05 이후·07:30 전 종료).
예약 작업 \\MONK\\GO-own-train-v1 이 pythonw 로 부른다(make_task.py --v1). 표준 출력이 없으므로 전부 {ROOT}\\night_v1.log 에 남긴다.
  · 학습 자체가 창(23:05~07:30) 밖 시작을 거부하고 시간 상한·마감을 스스로 지킨다(train.py).
  · b6c96 = 시간 상한 1.25시간(v0 30에폭 43분) · b10c128 = 남은 창, 마감 06:50(변환 여유 40분).
  · 한 단계가 실패해도 다음 단계는 돈다(실패는 로그에 ❌ + 종료 코드). 끝에 DONE 파일(요약 JSON).
멈추기: 각 run 폴더에 STOP 파일 → 그 학습만 200스텝 안에 저장 후 종료. 전체 중단 = {ROOT}\\STOP_ALL 파일(다음 단계로 넘어가지 않음).
"""
import datetime as dt
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable.replace("pythonw.exe", "python.exe")
DATA = os.path.join(ROOT, "data").replace("\\", "/")
KST = dt.timezone(dt.timedelta(hours=9))
RUNS = [("b6c96", ["--blocks", "6", "--channels", "96", "--hours", "1.25", "--deadline", "06:50"]),
        ("b10c128", ["--blocks", "10", "--channels", "128", "--hours", "6", "--deadline", "06:50"])]
LOG = os.path.join(ROOT, "night_v1.log")


def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"[{dt.datetime.now(KST):%m-%d %H:%M:%S}] {msg}\n")


def run(cmd, env=None):
    log("실행: " + " ".join(cmd))
    with open(LOG, "a", encoding="utf-8") as f:
        r = subprocess.run(cmd, stdout=f, stderr=subprocess.STDOUT, env=env, cwd=ROOT,
                           creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
    log(f"{'✅' if r.returncode == 0 else '❌'} 종료 코드 {r.returncode}")
    return r.returncode


def main():
    log(f"night_v1 시작 · 파이썬 {PY}")
    out = {}
    for name, extra in RUNS:
        if os.path.exists(os.path.join(ROOT, "STOP_ALL")):
            log("STOP_ALL — 남은 단계 건너뜀")
            break
        rd = os.path.join(ROOT, name).replace("\\", "/")
        rc = run([PY, "-X", "utf8", os.path.join(ROOT, "train.py"), "--v1", "--data", DATA, "--out", rd] + extra)
        out[name] = {"train": rc}
        best = os.path.join(rd, "best.pt")
        if os.path.exists(best):
            env = dict(os.environ, CUDA_VISIBLE_DEVICES="")  # 변환·대조는 CPU 만
            out[name]["export"] = run([PY, "-X", "utf8", os.path.join(ROOT, "export_onnx.py"), "--ckpt", best, "--data", DATA,
                                       "--out", os.path.join(rd, "own_v1.onnx").replace("\\", "/")], env)
        else:
            log(f"❌ {name}: best.pt 없음 — 변환 건너뜀")
    json.dump(out, open(os.path.join(ROOT, "DONE"), "w"))
    log(f"night_v1 끝 · {out}")


if __name__ == "__main__":
    try:
        main()
    except BaseException:
        import traceback
        log("❌ 예외\n" + traceback.format_exc())
        raise
