"""G10(id 160894228) 17수 장면 — 최강(b18, 1500v) 분석: 후보 상위·F3/D5 각각의 형세·예상 진행(PV). 상대 정보 미사용
사용: python3 -I scene_g10.py <server.py 폴더> <out.json>"""
import json
import re
import sys
sys.path.insert(0, sys.argv[1])
import server as S  # noqa: E402

q = next(json.loads(l) for l in open("/Users/jeong-kyushin/.monkos/go-board/analysis/mistakes_v0/queries_smoke10.jsonl") if json.loads(l)["id"] == "160894228")
moves = [tuple(m) for m in q["moves"]]
pre = moves[:16]  # 17수 직전, 흑 차례
strong, _, _ = S.build_engines()
strong.start()


def raw_search(e, color):
    """kata-search_analyze — 모든 info 줄(후보별 move·visits·winrate·scoreLead·pv)"""
    with e.lock:
        e.proc.stdin.write(f"kata-search_analyze {color}\n")
        e.proc.stdin.flush()
        info = ""
        while True:
            ln = e.proc.stdout.readline().strip()
            if "info move" in ln:
                info = ln
            if re.match(r"^(?:=\s*)?play \S+", ln):
                while e.proc.stdout.readline().strip() != "":
                    pass
                break
    out = []
    for blk in info.split("info move ")[1:]:
        m = re.match(r"(\S+) visits (\d+) .*?winrate (\S+) .*?scoreLead (\S+) .*?order (\d+) pv (.*)", blk.strip())
        if m:
            out.append({"move": m.group(1), "visits": int(m.group(2)), "winrate": float(m.group(3)),
                        "scoreLead": float(m.group(4)), "order": int(m.group(5)), "pv": m.group(6).split()[:12]})
    return sorted(out, key=lambda c: c["order"])


res = {"id": "G10", "moveNo": 17, "color": "B", "played": moves[16][1], "nextReal": moves[16:24]}
strong.sync(pre)
res["candidates"] = raw_search(strong, "B")[:6]
for mv in ("F3", "D5"):
    strong.sync(pre + [("B", mv)])
    c = raw_search(strong, "W")
    res[mv] = {"blackLeadAfter": round(c[0]["scoreLead"], 1), "whiteBest": c[0]["move"], "pv": c[0]["pv"], "blackWinrate": round(c[0]["winrate"], 3)}
res["lossD5vsF3"] = round(res["F3"]["blackLeadAfter"] - res["D5"]["blackLeadAfter"], 1)
json.dump(res, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
print(json.dumps({k: res[k] for k in ("played", "lossD5vsF3")}, ensure_ascii=False))
print("후보", [(c["move"], round(c["scoreLead"], 1), c["visits"]) for c in res["candidates"]])
for mv in ("F3", "D5"):
    print(mv, res[mv])
strong.stop()
