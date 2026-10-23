"""OGS 공개 API 저속 조회 (로그인 없음, 요청 간 2초).

  python3 ogs.py probe ID [ID ...]   # 게임 메타 요약
  python3 ogs.py fetch ID [ID ...]   # data/games/{ID}.json 저장
"""
import json
import math
import os
import sys
import time
import subprocess

UA = "monkos-research-pilot/0.1 (low-rate, no login)"
HERE = os.path.dirname(os.path.abspath(__file__))
GAMES = os.path.join(HERE, "data", "games")


def get(url):
    # 시스템 curl 경유 (python.org 배포판은 CA 번들 미설치)
    out = subprocess.run(["curl", "-sf", "--max-time", "20", "-A", UA, url],
                         capture_output=True, check=True).stdout
    return json.loads(out)


def rating_to_rank(r):
    """OGS Glicko → 급수 표기 (OGS 공식 변환식 근사: rank = ln(r/525)·23.15, 30=1단 경계)."""
    v = math.log(r / 525) * 23.15
    return f"{30 - v:.0f}k" if v < 30 else f"{v - 29:.0f}d"


def summary(g):
    hr = g.get("historical_ratings", {})
    out = {"id": g["id"], "width": g.get("width"), "handicap": g.get("handicap"),
           "komi": g.get("komi"), "rules": g.get("rules"), "ranked": g.get("ranked"),
           "ended": g.get("ended"), "outcome": g.get("outcome"),
           "moves": len(g.get("gamedata", {}).get("moves", []))}
    for c in ("black", "white"):
        r = hr.get(c, {}).get("ratings", {}).get("overall", {}).get("rating")
        out[c] = rating_to_rank(r) if r else None
        out[c + "_bot"] = g.get("players", {}).get(c, {}).get("ui_class", "")
    return out


def main():
    cmd, ids = sys.argv[1], sys.argv[2:]
    os.makedirs(GAMES, exist_ok=True)
    for i in ids:
        try:
            g = get(f"https://online-go.com/api/v1/games/{i}")
        except Exception as e:
            print(i, "ERR", e)
            time.sleep(2)
            continue
        print(json.dumps(summary(g), ensure_ascii=False))
        if cmd == "fetch":
            with open(os.path.join(GAMES, f"{i}.json"), "w") as f:
                json.dump(g, f)
        time.sleep(2)


if __name__ == "__main__":
    main()
