"""봇 기권 기준표 보정 — 실수 사전(사람 대국 수별 집 차·승률)에서 구간 × 집 차 × 흔들림별 뒤집힘을 센다.

출처: 쌍아 09:54 ← 작가님 09:54 "승률은 증감폭이 더 중요. 100·150·200수 이상 기준이 달라야. 100집 차도 대마 전투로 뒤집힐 수 있으니"
- 사건 = (대국, 두는 쪽)마다 그 구간에서 처음으로 조건을 채운 차례(그 쪽 착수 직전)
  조건: 최근 WINDOW 착수 동안 내내 L집 이상 뒤짐 + 그 사이 집 차 흔들림 ≤ SL + 승률 흔들림 ≤ SW
- 뒤집힘 = 그 쪽이 결국 이긴 판(불계·계가·시간승 모두 — 봇이 던졌으면 놓쳤을 승리). 결과 미상('?')은 뺀다
- 칸 채택: 표본 MIN_N 이상인 흔들림 조합 중 가장 엄격한 조합에서, 그 이상 모든 L에서 뒤집힘 0이 되는 경계 L
  표본이 모자라거나 경계가 없으면 칸 = 기권 안 함(null). 접바둑은 입력에 없으면 전부 null
입력(레포 밖, 읽기만): moves_full.jsonl(1줄 = 1착수, 두는 쪽 기준 lead_before·wr_before·result) · sample_2000.jsonl(result_type)
출력: 집계값만(대국 id·아이디 없음) — resign_table.json + 분포표 출력
사용: python3 -I tools/resign_calib.py <mistakes_v0 폴더> <출력 json>
"""
import collections
import json
import os
import sys

WINDOW = 10  # 서버 BOT_RESIGN_STREAK 와 같아야 한다
SEGMENTS = (("~150", 0, 150), ("151~200", 151, 200), ("201~", 201, 10 ** 6))
LEADS = list(range(10, 205, 5))
SWING_LEAD = (3, 5, 8, 10, 15, 20, 30)
SWING_WR = (0.01, 0.02, 0.05, 0.10, 1.0)
MIN_N = 30


def seg_of(n):
    return next(name for name, lo, hi in SEGMENTS if lo <= n <= hi)


def main(src, out):
    rtype = {}
    for ln in open(os.path.join(src, "sample_2000.jsonl"), encoding="utf-8"):
        d = json.loads(ln)
        rtype[d["id"]] = d.get("result_type")
    turns = collections.defaultdict(list)  # (id, who) → [(move_no, lead, wr, result)]
    for ln in open(os.path.join(src, "moves_full.jsonl"), encoding="utf-8"):
        d = json.loads(ln)
        if d.get("lead_before") is None or d.get("wr_before") is None:
            continue
        turns[(d["id"], d["who"])].append((d["move_no"], d["lead_before"], d["wr_before"], d["result"]))
    games = {k[0] for k in turns}
    # 사건 후보: 차례마다 (구간, 최소 뒤짐, 집 흔들림, 승률 흔들림)
    feats = []  # (구간, behind_min, swing_lead, swing_wr, 이겼나)
    for (gid, who), ts in turns.items():
        if rtype.get(gid) in (None, "?"):
            continue
        ts.sort()
        won = ts[0][3] == "W"
        for i in range(WINDOW - 1, len(ts)):
            w = ts[i - WINDOW + 1:i + 1]
            if w[-1][0] - w[0][0] != 2 * (WINDOW - 1):  # 빠진 차례가 있으면 연속이 아니다
                continue
            leads, wrs = [x[1] for x in w], [x[2] for x in w]
            feats.append((gid, who, seg_of(w[-1][0]), -max(leads), max(leads) - min(leads), max(wrs) - min(wrs), won))
    print(f"대국 {len(games)} · (대국,쪽) {len(turns)} · 연속 {WINDOW}착수 창 {len(feats)}")

    def side_max(seg, SL, SW):
        """(대국,쪽) → 흔들림 조건을 채운 창들 중 가장 크게 뒤진 값(L 이하면 그 L에서 사건)"""
        m = {}
        for gid, who, s_, bmin, sl, sw, won in feats:
            if s_ == seg and sl <= SL and sw <= SW and bmin > m.get((gid, who), (-1e9, won))[0]:
                m[(gid, who)] = (bmin, won)
        return list(m.values())

    table, dist = {}, {}
    for seg, _, _ in SEGMENTS:
        best = None
        for SL in SWING_LEAD:
            for SW in SWING_WR:
                sm = side_max(seg, SL, SW)
                rows = [(L, sum(b >= L for b, _ in sm), sum(b >= L and w for b, w in sm)) for L in LEADS]
                dist[f"{seg}|SL{SL}|SW{SW}"] = rows
                # 경계: 이 L 이상 모든 L에서 뒤집힘 0 이고 표본 ≥ MIN_N
                bound = None
                for j, (L, n, f) in enumerate(rows):
                    if n >= MIN_N and all(ff == 0 for _, _, ff in rows[j:]):
                        bound = (L, n)
                        break
                if bound and (best is None or (SL, SW) < (best["swingLead"], best["swingWr"])):
                    best = {"lead": bound[0], "swingLead": SL, "swingWr": SW, "n": bound[1], "flips": 0}
        table[f"even|{seg}"] = best
        table[f"handi|{seg}"] = None  # 접바둑 평가 데이터 없음 → 기권 안 함
        print(seg, "→", best)
    json.dump({"v": 1, "window": WINDOW, "minN": MIN_N, "segments": [[n, lo, hi] for n, lo, hi in SEGMENTS],
               "source": f"실수 사전 1단계(64탐색) {len(games)}국 · 사람 대국·호선", "cells": table},
              open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(dist, open(out.replace(".json", "_dist.json"), "w", encoding="utf-8"), ensure_ascii=False)
    # 엄격 조합(SL 5·SW 0.02 / SL 10·SW 0.05)의 구간별 분포 요약
    for SL, SW in ((5, 0.02), (10, 0.05), (30, 1.0)):
        print(f"\n흔들림 집≤{SL}·승률≤{SW}: L별 (사건, 뒤집힘)")
        for seg, _, _ in SEGMENTS:
            rows = dist[f"{seg}|SL{SL}|SW{SW}"]
            print(" ", seg, " ".join(f"{L}:{n}/{f}" for L, n, f in rows if L in (10, 20, 30, 40, 50, 60, 80, 100, 120, 150, 200)))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
