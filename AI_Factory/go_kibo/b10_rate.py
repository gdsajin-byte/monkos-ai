#!/usr/bin/env python3
"""b10 학습 처리량(샘플/s) 전후 비교 — train.py stdout의 nsamp·time_since_last_print 행에서 계산.

사용: python3 b10_rate.py BEFORE.txt AFTER.txt [--baseline-prints 20]
  BEFORE = 스모크 직전 stdout 사본, AFTER = 스모크 직후 사본.
  기준선 = BEFORE 마지막 N회 출력, 스모크 중 = AFTER에서 BEFORE 이후 늘어난 출력.
"""
import argparse
import re
import statistics

PAT = re.compile(r"nsamp = ([\d.]+),.*time_since_last_print = ([\d.]+)")


def rates(path):
    out, prev = [], None
    for line in open(path, encoding="utf-8", errors="replace"):
        m = PAT.search(line)
        if not m:
            continue
        n, t = float(m.group(1)), float(m.group(2))
        if prev is not None and n > prev and t > 0:
            out.append((n - prev) / t)
        prev = n
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("before")
    ap.add_argument("after")
    ap.add_argument("--baseline-prints", type=int, default=20)
    a = ap.parse_args()
    rb, ra = rates(a.before), rates(a.after)
    if len(ra) < len(rb) or ra[:len(rb)] != rb:
        print("⚠️ AFTER가 BEFORE의 연장이 아니다(로그 교체·재시작?) — 꼬리 비교로 대체")
    base = rb[-a.baseline_prints:]
    during = ra[len(rb):]
    if not base or not during:
        raise SystemExit(f"❌ b10_rate: 측정 표본 부족 (기준선 {len(base)}회, 스모크 중 {len(during)}회)")
    b, d = statistics.median(base), statistics.median(during)
    print(f"기준선 {b:.0f} 샘플/s (n={len(base)}) · 스모크 중 {d:.0f} 샘플/s (n={len(during)}) · 저하 {(1 - d / b) * 100:.1f}%")


if __name__ == "__main__":
    main()
