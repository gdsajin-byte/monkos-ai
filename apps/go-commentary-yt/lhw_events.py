#!/usr/bin/env python3
"""이현욱TV 판독 상태열(states.json) → 실전 수순 · 변화도(번호 돌) · 실전 앞뒤 이동 · 초마다 국면 (PF_GO, 11-07 막내2)
  lhw_events.py 폴더  → 폴더/events.json {main:[실전 수], vars:[변화도], navs:[이동], timeline:[초마다 국면]}
판정 규칙(이현욱 화면 실측 11-07):
  · 실전 수 = 숫자 없는 돌 1개(+따낸 돌 제거)가 놓이고 마지막 수 세모가 그 돌로 옮겨 간다. 1초에 2수↑ 넘어가면 색 교대 + 세모 = 마지막.
  · 변화도 = 숫자가 쓰인 돌. 번호는 놓인 순서대로 1,2,3…(같은 초에 여러 개면 색 교대로 순서) · 가장 큰 번호가 사라지면 한 수 무르기 · 아닌 것이 사라지면 따냄.
  · 실전 판(앞서 본 국면)으로 돌아오면 변화도 끝. 앞서 본 실전 국면으로 바로 바뀌면 '이동'(되짚기·앞으로 감기).
  · 영상 첫 국면 이전으로 되돌아가면 실전 수를 앞에 붙인다(번호는 끝에서 다시 매김).
"""
import json, sys
from pathlib import Path

COL = "ABCDEFGHJKLMNOPQRST"
import os
DBG = [int(x) for x in os.environ.get("LHW_DBG", "").split(",") if x]


def co(k):
    return f"{COL[k % 19]}{19 - k // 19}"


def nm(c):
    return "흑" if c == "b" else "백"


def nbrs(k):
    i, j = k % 19, k // 19
    return [x for x, ok in ((k - 1, i > 0), (k + 1, i < 18), (k - 19, j > 0), (k + 19, j < 18)) if ok]


def replay(base, moves):
    """기준 국면(361자) 위에 (점, 색) 수순을 바둑 규칙으로 놓는다 — 활로 0인 상대 무리 따냄."""
    b = list(base)
    for k, c in moves:
        b[k] = c
        o = "w" if c == "b" else "b"
        for n0 in nbrs(k):
            if b[n0] != o:
                continue
            grp, stack, lib = {n0}, [n0], False
            while stack and not lib:
                x = stack.pop()
                for y in nbrs(x):
                    if b[y] == ".":
                        lib = True; break
                    if b[y] == o and y not in grp:
                        grp.add(y); stack.append(y)
            if not lib:
                for x in grp:
                    b[x] = "."
    return "".join(b)


def run(d):
    st = [s for s in json.loads((Path(d) / "states.json").read_text()) if s["vis"]]
    # 새 판 화면(2024↑ 일부 영상, 11-07 iaoh·Pg7·5BNg 실측): 마지막 수 = 세모가 아니라 돌 위 작은 고리 → 판독기는 '번호 돌'로 읽는다.
    #   세모가 거의 없는 영상(판 보인 프레임의 20% 미만)이면 고리 방식: 번호 돌이 딱 1개인 프레임은 그 돌을 마지막 수로 본다.
    ring = sum(s["mk"] >= 0 for s in st) < 0.2 * len(st)
    if ring:
        # 고리 vs 숫자 '1'(변화도 첫 수): 고리는 가운데가 비어 돌 색, '1'은 가운데를 획이 지난다(11-07 iaoh t=198·5BNg t=370 — 1을 고리로 읽어 번호가 하나씩 밀림)
        import numpy as np
        from PIL import Image
        c = json.loads((Path(d) / "calib.json").read_text())

        def hollow(t, k):
            if "ho" in s:  # 스트리밍 판독(lhw_stream)은 프레임을 남기지 않고 판독 때 가운데 빔 여부를 적어 둔다
                return k in s["ho"]
            f = Path(d) / "frames1" / f"f_{t + 1:05d}.jpg"
            x, y = int(round(c["x0"] + (k % 19) * c["sx"])), int(round(c["y0"] + (k // 19) * c["sy"]))
            g = np.asarray(Image.open(f).convert("L").crop((x - 2, y - 2, x + 3, y + 3))).astype(int)
            return g.min() > 170 if s["g"][k] == "W" else g.max() < 110

        for s in st:
            ks = [k for k, ch in enumerate(s["g"]) if ch in "BW"]
            if len(ks) == 1 and hollow(s["t"], ks[0]):
                g = list(s["g"]); g[ks[0]] = g[ks[0]].lower()
                s["g"], s["mk"] = "".join(g), ks[0]
    P = [st[0]["g"].lower()]          # 실전 국면열
    M = []                            # M[i]: P[i] → P[i+1] 실전 수 {id,c,k,cap,t}
    p = 0
    uid = [0]
    navs, vars_, tl = [], [], []
    var = None

    def new_move(c, k, cap, t, how):
        uid[0] += 1
        return {"id": uid[0], "c": c, "k": k, "cap": cap, "t": t, "how": how}

    def close_var(t, back):
        nonlocal var
        if var:
            if var["seq"]:
                var["end"] = t; var["back_to_real"] = back
                vars_.append(var)
            else:  # 돌 없는 순간 흔들림(커서·깜빡임) — 변화도 아님
                for x in tl:
                    if x["var"] == var["id"]:
                        x["var"] = None; x.pop("vn", None)
            var = None

    for s in st:
        t, S, mk = s["t"], s["g"].lower(), s["mk"]
        num = {k for k, ch in enumerate(s["g"]) if ch in "BW"}
        cur = P[p]
        if S == cur:
            close_var(t, True)
            tl.append({"t": t, "p": p, "var": None}); continue
        if S in P:
            q = len(P) - 1 - P[::-1].index(S)
            close_var(t, True)
            navs.append({"t": t, "from": p, "to": q})
            p = q
            tl.append({"t": t, "p": p, "var": None}); continue
        add = [k for k in range(361) if S[k] != "." and cur[k] != S[k]]
        rem = [k for k in range(361) if S[k] == "." and cur[k] != "."]
        if DBG and DBG[0] <= t <= DBG[1]:
            print("DBG", t, "p", p, "var", var and var["id"], "mk", co(mk) if mk >= 0 else "-", "add", [S[k] + co(k) + ("#" if k in num else "") for k in add], "rem", [co(k) for k in rem])
        # 영상 첫 국면 이전으로 되돌림: p == 0, 돌이 빠지기만(+그 돌이 따냈던 돌 복귀)
        if p == 0 and var is None and not num and len(rem) == 1 and all(S[k] != cur[rem[0]] for k in add) and len(add) <= 4:
            k = rem[0]
            P.insert(0, S); M.insert(0, new_move(cur[k], k, add, None, "prepend"))
            navs.append({"t": t, "from": 1, "to": 0})
            for x in navs: x["from"] += 1 if x is not navs[-1] else 0
            tl = [dict(x, p=x["p"] + 1) for x in tl]
            p = 0
            tl.append({"t": t, "p": p, "var": None}); continue
        # 실전 수: 변화도 밖이거나, 번호 돌이 다 사라지고 세모가 새 돌에 옮겨 간 경우(변화도에서 곧장 다음 실전 수 — 11-07 K9mM t=665)
        main_ok = (var is None and (mk in add or mk < 0) or var is not None and not num and mk in add) and add and not (num & set(add)) and len(add) <= 8
        if main_ok:
            cols = {S[k] for k in add}
            caps_ok = all(cur[k] != "." and any(cur[k] != S[a] for a in add) for k in rem)
            if caps_ok and (len(add) == 1 or len(cols) == 2):
                close_var(t, False)
                # 순서: 마지막 = 세모, 나머지는 색 교대(직전 실전 수 반대색부터)
                last_c = M[p - 1]["c"] if p > 0 and M[p - 1]["c"] else ("w" if S[add[0]] == "b" else "b")
                rest = [k for k in add if k != mk]
                order, want = [], ("w" if last_c == "b" else "b")
                while rest:
                    pick = next((k for k in rest if S[k] == want), rest[0])
                    order.append(pick); rest.remove(pick); want = "w" if S[pick] == "b" else "b"
                if mk in add:
                    order.append(mk)
                if p < len(P) - 1:  # 되짚던 실전에서 다른 수 → 실전 갈래가 바뀐 것(뒷부분 버림, 기록은 남김)
                    navs.append({"t": t, "from": p, "to": p, "branch_drop": len(P) - 1 - p})
                    del P[p + 1:]; del M[p:]
                pos = cur
                for i, k in enumerate(order):
                    nxt = list(pos); nxt[k] = S[k]
                    cap = [r for r in rem if i == len(order) - 1 or False]
                    if i == len(order) - 1:
                        for r in rem: nxt[r] = "."
                    pos = "".join(nxt)
                    M.append(new_move(S[k], k, [co(r) for r in cap], t, "step" if len(order) == 1 else f"jump{len(order)}"))
                    P.append(pos)
                if P[-1] != S:  # 따냄 분배가 어긋난 경우 마지막 국면은 화면 그대로
                    P[-1] = S
                p = len(P) - 1
                tl.append({"t": t, "p": p, "var": None}); continue
        # 변화도 — 해설 프로그램을 그대로 흉내: 기준 실전 국면 + 수순(path)을 바둑 규칙(따냄)으로 다시 놓아 본 판이 화면과 같아지도록
        #   매 초: 끝에서 b수 무르기(b=0…) → 화면에 새로 생긴 돌을 색 교대로 이어 놓기 → 화면과 다른 점 수가 가장 적은 b (같으면 작은 b)
        if var is None:
            var = {"id": (vars_[-1]["id"] if vars_ else 0) + 1, "start": t, "base": p, "steps": [], "path": [], "seq": {}, "maxn": 0}
        path = var["path"]
        best = None
        for bk in range(len(path) + 1):
            pp = path[:len(path) - bk]
            bd = replay(cur, pp)
            newk = [k for k in range(361) if S[k] != "." and bd[k] != S[k]]
            if len(newk) > 12:
                continue
            last_c = pp[-1][1] if pp else (M[p - 1]["c"] if p > 0 and M[p - 1]["c"] else None)
            want = ("w" if last_c == "b" else "b") if last_c else None
            order, rest = [], list(newk)
            while rest:
                pick = next((k for k in rest if want is None or S[k] == want), rest[0])
                order.append(pick); rest.remove(pick); want = "w" if S[pick] == "b" else "b"
            cand = pp + [(k, S[k]) for k in order]
            bd2 = replay(cur, cand)
            miss = sum(1 for k in range(361) if bd2[k] != S[k])
            if best is None or miss < best[0]:
                best = (miss, bk, cand, order)
            if miss == 0:
                break
        if best and (best[1] or best[3]):
            miss, bk, cand, order = best
            back = list(range(len(path), len(path) - bk, -1))
            add_rec = []
            for i, (k, c) in enumerate(cand[len(path) - bk:]):
                n = len(path) - bk + i + 1
                var["seq"][n] = f"{nm(c)}{co(k)}"
                var["maxn"] = max(var["maxn"], n)
                add_rec.append({"n": n, "s": f"{nm(c)}{co(k)}", "num": k in num})
            var["path"] = cand
            # 번호 확신 낮음(이 걸음에 놓인 돌만): 화면과 다른 점이 남음 · 1초에 3수↑(그 사이 놓였다 따내진 수가 있으면 번호가 밀린다 — 11-07 K9mM t=1131)
            #   · 1초에 같은 색 2수(색 교대로 순서를 못 가린다 — 11-07 ZWk t=364). 흑백 2수는 색 교대로 가려진다(1편 육안 56/56).
            amb = miss > 0 or len(add_rec) >= 3 or (len(add_rec) == 2 and add_rec[0]["s"][0] == add_rec[1]["s"][0])
            for a_ in add_rec:
                a_["n_low"] = amb
            var["steps"].append({"t": t, "add": add_rec, "back": back, "miss": miss, "amb": amb})
            var["amb"] = var.get("amb", False) or amb
        tl.append({"t": t, "p": p, "var": var["id"], "vn": len(var["path"])})
    close_var(st[-1]["t"] + 1, False)
    # 실전 수 번호: 영상 첫 국면 다음 수 = 1 (앞에 붙인 수는 0, -1 …)
    n_pre = sum(1 for m in M if m["how"] == "prepend")
    main = []
    for i, m in enumerate(M):
        main.append({"no": i + 1 - n_pre, "s": f"{nm(m['c'])}{co(m['k'])}", "t": m["t"], "cap": m["cap"], "how": m["how"]})
    no = lambda pidx: pidx - n_pre  # 국면 p = 실전 no번 수까지 놓인 판
    for x in tl:
        x["mv"] = no(x["p"])
    for v in vars_:
        v["base_mv"] = no(v["base"])
        v["final"] = [v["seq"][n] for n in sorted(v["seq"])]
        v["n_steps_back"] = sum(len(s["back"]) for s in v["steps"])
        v["path"] = [f"{nm(c)}{co(k)}" for k, c in v["path"]]
    for x in navs:
        x["from_mv"], x["to_mv"] = no(x["from"]), no(x["to"])
    out = {"style": "ring" if ring else "triangle", "main": main, "vars": vars_, "navs": navs, "timeline": tl, "start_stones": sum(c != "." for c in P[n_pre])}
    (Path(d) / "events.json").write_text(json.dumps(out, ensure_ascii=False))
    print(f"{d}: 실전 수 {len(main)}(앞 {n_pre}) · 변화도 {len(vars_)} · 이동 {len(navs)}")
    return out


if __name__ == "__main__":
    o = run(sys.argv[1])
    if "-v" in sys.argv:
        for m in o["main"]:
            print("실전", m["no"], m["s"], m["t"], m["how"], m["cap"])
        for v in o["vars"]:
            print(f"변화도 {v['id']} {v['start']}~{v['end']} 기준 실전 {v['base_mv']}수 · {len(v['final'])}수 · 무르기 {v['n_steps_back']} · 복귀 {v['back_to_real']} :: {' '.join(f'{i+1}.{s}' for i, s in enumerate(v['final']))}")
        for n in o["navs"]:
            print("이동", n)
