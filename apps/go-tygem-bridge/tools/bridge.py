# 타이젬 웹 AI 대국 브리지 — 화면 판 읽기 ↔ 우리 KataGo(GTP) ↔ CDP 클릭
# 상대는 타이젬 '인공지능' 대국(KataGo AI)만. 사람 대국에는 쓰지 않는다.
# 사용: python3 bridge.py [--color b|w] [--max-moves N] [--visits V] [--komi 6.5|0] [--byo 20]
import asyncio, base64, io, subprocess, sys, time, argparse, os
import numpy as np
from PIL import Image
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, click

K = os.path.expanduser("~/.monkos/katago")
COLS = "ABCDEFGHJKLMNOPQRST"
# 08_start.png 실측(DPR 2): 격자 px x 553.5~1885.5, y 663.5~1995.5, 간격 74
X0, Y0, STEP = 553.5, 663.5, 74.0
LOG = os.path.expanduser("~/.monkos/tygem/bridge_%s.log" % time.strftime("%Y%m%d_%H%M%S"))


def log(*a):
    s = time.strftime("%H:%M:%S ") + " ".join(str(x) for x in a)
    print(s, flush=True)
    open(LOG, "a").write(s + "\n")


def calibrate(im):
    """매 캡처마다 판 위치 재측정 — 창 크기·확대가 바뀌어도 좌표가 따라감.
    판(나무색) 사각형을 찾고 격자는 그 안쪽 비율로 계산(10-23 실측: 여백 3.39%, 격자 폭 93.21%) — 돌이 선을 가려도 흔들리지 않음."""
    R, G, B = im[..., 0], im[..., 1], im[..., 2]
    wood = (R > 170) & (G > 120) & (B < 175) & (R - B > 35)
    def run(idx):  # 가장 긴 연속 구간만 — 우측 광고 배너(주황 '관전하기' 막대)가 나무색으로 잡혀도 판과 떨어져 있으면 제외(10-23 원인 실측)
        if len(idx) == 0: return idx
        cuts = np.where(np.diff(idx) > 120)[0] + 1  # 판 안 돌 줄이 만드는 틈(≤약 60px)은 잇고, 판↔배너 틈(약 330px)은 끊는다
        return max(np.split(idx, cuts), key=len)
    cx = run(np.where(wood.mean(axis=0) > 0.15)[0]); ry = run(np.where(wood.mean(axis=1) > 0.15)[0])
    if len(cx) < 100 or len(ry) < 100:
        raise RuntimeError("판(나무색) 영역 미검출")
    w = cx.max() - cx.min(); h = ry.max() - ry.min()
    if abs(w - h) > max(w, h) * 0.03:
        raise RuntimeError(f"판이 정사각형이 아님 {w}×{h} — 가림·잘림 의심")
    return cx.min() + 0.0339 * w, ry.min() + 0.0339 * h, 0.93212 * w / 18, 0.93212 * h / 18

GEOM = {}

class GTP:
    def __init__(s, visits, max_time=0):
        s.p = subprocess.Popen([f"{K}/katago-ocl", "gtp", "-model",
            f"{K}/kata1-b18c384nbt-s9996604416-d4316597426.bin.gz", "-config", f"{K}/gtp_play.cfg",
            "-override-config", f"maxVisits={visits},rules=korean" + (f",maxTime={max_time}" if max_time else "")],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)

    def cmd(s, c):
        s.p.stdin.write(c + "\n"); s.p.stdin.flush()
        out = []
        while True:
            l = s.p.stdout.readline()
            if l.strip() == "" and out:
                break
            if l.strip():
                out.append(l.rstrip())
        r = "\n".join(out)
        if r.startswith("?"):
            raise RuntimeError(f"GTP {c}: {r}")
        return r[1:].strip()

    def board(s):
        # showboard 행은 고정폭: "19 . . O2. …" — 열 i의 돌 글자는 줄 시작에서 3+2i 위치(수순 번호가 공백을 덮음)
        import re
        b = {}
        for l in s.cmd("showboard").splitlines():
            m = re.match(r"^\s*(\d{1,2}) ", l)
            if not m or len(l) < 3:
                continue
            row = int(m.group(1)); l = l.rjust(len(l))
            off = 3 if len(l) > 2 and l[2] == " " else 3
            for i in range(19):
                k = 3 + 2 * i
                ch = l[k] if k < len(l) else "."
                if ch == "X": b[(i, 19 - row)] = "b"
                elif ch == "O": b[(i, 19 - row)] = "w"
        return b


READS = [0]
FULL_EVERY = 15  # 판 위치 재측정 주기(읽기 횟수) — 그 사이는 판 영역만 캡처


async def read_screen(c, full=False):
    """10-23 최적화: 전체 PNG(372ms·1.2MB) → 평소엔 판 영역만 JPEG 80(66ms·0.2MB), FULL_EVERY회마다·요청 시 전체 JPEG로 재측정.
    JPEG 80·60 판독은 저장 화면 2장(돌 290·163)에서 PNG와 불일치 0(10-23 실측)."""
    READS[0] += 1
    if full or not GEOM or READS[0] % FULL_EVERY == 0:
        r = await c.send("Page.captureScreenshot", format="jpeg", quality=80)
        im = np.asarray(Image.open(io.BytesIO(base64.b64decode(r["data"]))).convert("RGB")).astype(int)
        try:
            gx0, gy0, sx, sy = calibrate(im)
        except RuntimeError as e:
            if not GEOM:
                raise
            log("⚠️ 판 위치 재측정 실패 — 직전 값 사용:", e)
            gx0, gy0, sx, sy = GEOM["x0"], GEOM["y0"], GEOM["sx"], GEOM["sy"]
        dpr = im.shape[1] / (await c.send("Runtime.evaluate", expression="window.innerWidth", returnByValue=True))["result"]["value"]
        GEOM.update(x0=gx0, y0=gy0, sx=sx, sy=sy, dpr=dpr)
        ox = oy = 0
    else:
        gx0, gy0, sx, sy, dpr = GEOM["x0"], GEOM["y0"], GEOM["sx"], GEOM["sy"], GEOM["dpr"]
        cx, cy = (gx0 - sx) / dpr, (gy0 - sy) / dpr  # 판 바깥 한 칸 여유
        cw, ch = 20 * sx / dpr, 20 * sy / dpr
        r = await c.send("Page.captureScreenshot", format="jpeg", quality=80,
                         clip={"x": cx, "y": cy, "width": cw, "height": ch, "scale": 1})
        im = np.asarray(Image.open(io.BytesIO(base64.b64decode(r["data"]))).convert("RGB")).astype(int)
        ox, oy = cx * dpr, cy * dpr  # 전체 화면 px → 잘라낸 그림 px
        gx0, gy0 = gx0 - ox, gy0 - oy
    off = int(min(sx, sy) * 0.22)
    b = {}
    for i in range(19):
        for j in range(19):
            x, y = int(gx0 + i * sx), int(gy0 + j * sy)
            # 격자선·화점을 피하려고 대각 4점(중심에서 ±16px) 5×5 표본 — 돌 반지름 ≈35px
            p = np.concatenate([im[y + dy - 2:y + dy + 3, x + dx - 2:x + dx + 3].reshape(-1, 3)
                                for dx in (-off, off) for dy in (-off, off)])
            m = p.mean(axis=0); g = m.mean(); sat = m.max() - m.min()
            if g < 75: b[(i, j)] = "b"
            elif g > 205 and sat < 35: b[(i, j)] = "w"
    return b


def gtp_coord(i, j): return f"{COLS[i]}{19 - j}"
def from_gtp(v): return COLS.index(v[0]), 19 - int(v[1:])


async def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--color", default="b")
    ap.add_argument("--max-moves", type=int, default=400); ap.add_argument("--visits", type=int, default=300); ap.add_argument("--resume-log"); ap.add_argument("--komi", type=float, default=6.5)  # 호선 6.5 · 정선 0
    ap.add_argument("--byo", type=float, default=0)  # 자체 초읽기(초) — 타이젬 AI 대국실은 시간 설정이 없어(무제한) 우리 쪽에서 지킨다. 화면 판독·클릭 여유 3초를 뺀 값을 엔진 생각 상한으로
    a = ap.parse_args()
    me, op = a.color, ("w" if a.color == "b" else "b")
    g = GTP(a.visits, max(1.0, a.byo - 3) if a.byo else 0); g.cmd("boardsize 19"); g.cmd("clear_board"); g.cmd(f"komi {a.komi}")
    c, _ = await connect()
    scr = await read_screen(c); moves = []
    if a.resume_log:
        import re as _re
        for l in open(a.resume_log):
            m = _re.search(r"#\d+ (?:우리|상대) ([BW]) ([A-T]\d{1,2})", l)
            if m:
                g.cmd(f"play {m.group(1).lower()} {m.group(2)}"); moves.append((m.group(1).lower(), m.group(2)))
        e = g.board(); new = [p for p, col in scr.items() if e.get(p) != col]
        gone = [p for p in e if p not in scr]
        log(f"로그 이어 두기 — {len(moves)}수 재생, 화면 추가 {len(new)}·누락 {len(gone)}")
        if len(new) == 1 and not gone and scr[new[0]] == ("w" if moves[-1][0] == "b" else "b"):
            col = scr[new[0]]; mv = gtp_coord(*new[0]); g.cmd(f"play {col} {mv}"); moves.append((col, mv)); log("화면 추가 수 반영:", col.upper(), mv)
        elif new or gone:
            log("❌ 로그 재생 판과 화면 불일치 — 중단", [gtp_coord(*p) for p in new + gone][:6]); return
        turn = "w" if moves[-1][0] == "b" else "b"
    elif scr:
        # 이어 두기: 화면 판을 엔진에 그대로 복원(초반·따냄 없는 국면 전제), 수순은 순서 불명이라 SGF엔 AB/AW 대신 기록만
        for (i, j), col in scr.items():
            g.cmd(f"play {col} {gtp_coord(i, j)}")
        nb = sum(1 for v in scr.values() if v == "b"); nw = len(scr) - nb
        turn = "b" if nb == nw else "w"
        log(f"이어 두기 — 화면 흑 {nb}·백 {nw}, 다음 {turn.upper()} · 복원 돌: " + ",".join(f"{col.upper()} {gtp_coord(i, j)}" for (i, j), col in scr.items()))  # live_view --pre에 그대로 쓴다(1수만 복원일 때 수순 확정)
        e = g.board(); diff = [p for p in set(scr) | set(e) if scr.get(p) != e.get(p)]
        if diff: log("❌ 복원 불일치", diff[:6], "— 중단"); return
    else:
        turn = "b"
    log("시작 — 나:", me, "로그:", LOG)
    while len(moves) < a.max_moves:
        if turn == me:
            mv = g.cmd(f"genmove {me}")
            moves.append((me, mv)); log(f"#{len(moves)} 우리 {me.upper()} {mv}")
            if mv.lower() in ("pass", "resign"):
                log("⏸ 우리 엔진이", mv, "— 화면 조작은 하지 않고 중단(작가님 판단)"); break
            i, j = from_gtp(mv)
            await read_screen(c, full=True)  # 클릭 직전 격자 재측정(전체 화면)
            gm = GEOM
            await click(c, (gm["x0"] + i * gm["sx"]) / gm["dpr"], (gm["y0"] + j * gm["sy"]) / gm["dpr"])
            ok = False
            for _ in range(25):  # 0.2초 간격 확인(최대 5초) — 고정 0.5초 대기 제거
                await asyncio.sleep(0.2)
                if (await read_screen(c)).get((i, j)) == me: ok = True; break
            if not ok:
                log("❌ 착점이 화면에 안 보임 — 중단"); break
        else:
            exp = g.board(); t0 = time.time(); got = None
            while time.time() - t0 < 120:
                await asyncio.sleep(0.3)  # 상대 수 확인 간격 1.0 → 0.3초(판 영역 캡처라 가볍다)
                s = await read_screen(c)
                new = [p for p, col in s.items() if col == op and exp.get(p) != op]
                if len(new) == 1: got = new[0]; break
                if len(new) > 1: log("❌ 상대 새 돌이 여러 개로 읽힘(종국 사석 표시 가능):", len(new), "점 — 중단"); got = "STOP"; break
            if got == "STOP": break
            if not got:
                log("⏸ 120초간 상대 착점 없음(패스·종국·계가 신청 가능성) — 중단"); break
            mv = gtp_coord(*got); g.cmd(f"play {op} {mv}"); moves.append((op, mv))
            log(f"#{len(moves)} 상대 {op.upper()} {mv}")
            # 따냄 반영 후 화면·엔진 판 일치 확인
            await asyncio.sleep(0.5)  # 따냄 애니메이션 여유 0.8 → 0.5초
            s = await read_screen(c); e = g.board()
            diff = [p for p in set(s) | set(e) if s.get(p) != e.get(p)]
            if diff:
                log("⚠️ 판 불일치", [(gtp_coord(*p), s.get(p), e.get(p)) for p in diff][:6])
                if len(diff) > 2: log("❌ 불일치 과다 — 중단"); break
        turn = op if turn == me else me
    sgf = "(;GM[1]FF[4]SZ[19]KM[%g]PB[%s]PW[%s]" % (a.komi, ("MONK-KataGo %dv%s" % (a.visits, " byo%gs" % a.byo if a.byo else "") if me == "b" else "Tygem KataGo"),
          ("MONK-KataGo %dv%s" % (a.visits, " byo%gs" % a.byo if a.byo else "") if me == "w" else "Tygem KataGo"))
    for col, mv in moves:
        if mv.lower() in ("pass", "resign"): continue
        i, j = from_gtp(mv); sgf += ";%s[%s%s]" % (col.upper(), "abcdefghijklmnopqrs"[i], "abcdefghijklmnopqrs"[j])
    p = os.path.expanduser("~/.monkos/katago/games/%s_tygem_ai.sgf" % time.strftime("%Y%m%d_%H%M%S"))
    open(p, "w").write(sgf + ")"); log("기보 저장:", p, "수:", len(moves))

asyncio.run(main())
