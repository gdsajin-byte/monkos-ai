#!/usr/bin/env python3
"""4060 낮 창(학교 시간) 연쇄 — ① 실수 사전 남은 국(1단계+2단계) → ② 결정 장면 정밀 분석. 각 단계 앞에 하교 가드.

쌍아 확정 11-06 06:12(작가님 "ㅇㅇ"): 1순위 실수 사전 잔여, 2순위 결정 장면. 마감 15:30(작가님 10:02 "너덧 시쯤 하교" → 쌍아 보수 15:30, 구 14:00).
각 단계는 mistakes_runner.py가 창 판정·잠금·대국 단위 체크포인트·창 끝 엔진 중단을 한다. 이 스크립트는 순서와 가드만 맡는다.
  python day_chain.py --start 08:30 --end 15:30
상태: C:\\Users\\smuse73\\go_kibo\\day_chain.log
"""
import argparse
import datetime as dt
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RUNNER = os.path.join(HERE, "mistakes_runner.py")
LOG = os.path.join(HERE, "day_chain.log")
NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


def log(msg):
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"{dt.datetime.now():%Y-%m-%d %H:%M:%S} {msg}\n")


def in_window(start, end, now=None):
    """창 안인가 — 같은 날 창(08:30~15:30)과 밤 창(23:05~07:30) 모두. 러너 window()와 같은 규칙."""
    now = now or dt.datetime.now()
    sh, sm = map(int, start.split(":"))
    eh, em = map(int, end.split(":"))
    s = now.replace(hour=sh, minute=sm, second=0, microsecond=0)
    if (eh, em) > (sh, sm):
        return s <= now < s.replace(hour=eh, minute=em)
    if now < s:
        s -= dt.timedelta(days=1)
    return s <= now < (s + dt.timedelta(days=1)).replace(hour=eh, minute=em)


def state_of(root):
    try:
        return json.load(open(os.path.join(root, "runner_status.json"), encoding="utf-8")).get("state")
    except (OSError, ValueError):
        return None


def run(root, extra, a):
    cmd = [sys.executable, RUNNER, "--root", root, "--no-b10-wait", "--window-start", a.start, "--window-end", a.end] + extra + a.runner_arg
    log("시작: " + " ".join(cmd[2:]))
    r = subprocess.run(cmd, creationflags=NO_WINDOW)
    st = state_of(root)
    log(f"끝: rc {r.returncode} · state {st}")
    return st


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", default="08:30")
    ap.add_argument("--end", default="15:30")
    ap.add_argument("--runner-arg", action="append", default=[], help="시험용: 러너에 그대로 넘길 인자(여러 번, 예: --runner-arg=--dry-run)")
    a = ap.parse_args()
    full, scenes = os.path.join(HERE, "full"), os.path.join(HERE, "scenes")
    if not in_window(a.start, a.end):
        log(f"창 가드: {a.start}~{a.end} 밖 — 시작하지 않음")
        return
    st = run(full, [], a)  # ① 실수 사전 잔여(1단계 → 2단계 400v)
    if st != "all_done":
        log(f"① 미완(state {st}) — ② 결정 장면은 다음 창으로")
        return
    if not in_window(a.start, a.end):
        log(f"창 가드: {a.start}~{a.end} 밖 — ② 시작하지 않음")
        return
    if not os.path.exists(os.path.join(scenes, "scenes_queries.jsonl")):
        log("② 결정 장면 질의 없음 — 건너뜀")
        return
    run(scenes, ["--queries", "scenes_queries.jsonl", "--stage1-only"], a)  # ② 결정 장면


if __name__ == "__main__":
    main()
