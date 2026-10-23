#!/usr/bin/env python3
"""MONK 로컬 바둑판 — KataGo와 클릭으로 두는 웹 바둑판 (해설 봇 MVP 화면 시제품).

표준 라이브러리만 쓴다. 127.0.0.1에만 붙는다(외부 공개 금지).
엔진·모델·대국 기록은 전부 레포 밖 ~/.monkos/katago/ 에 있다.
"""
import json
import os
import re
import subprocess
import sys
import threading
import time
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = int(os.environ.get("GO_BOARD_PORT", "8765"))
KATA_DIR = Path.home() / ".monkos" / "katago"
KATAGO = KATA_DIR / "katago-ocl"
MAIN_MODEL = KATA_DIR / "kata1-b18c384nbt-s9996604416-d4316597426.bin.gz"
HUMAN_MODEL = KATA_DIR / "b18c384nbt-humanv0.bin.gz"
PLAY_CFG = KATA_DIR / "gtp_play.cfg"
HUMAN_CFG = KATA_DIR / "configs" / "gtp_human5k_example.cfg"
HERE = Path(__file__).resolve().parent
# 테스트 모드(run.sh --test): 실사용 포트 금지, 기보는 games/_test/ 로 분리
TEST_MODE = os.environ.get("GO_BOARD_TEST") == "1"
LIVE_PORT = 8765
GAMES_DIR = KATA_DIR / "games" / ("_test" if TEST_MODE else "")
REVIEW_DIR = GAMES_DIR / "reviews"
# 리뷰 파이프라인(막내11 소관) — 호출만, 수정 금지
PILOT_DIR = HERE.parent / "go-commentary-pilot"
REVIEW_PY = PILOT_DIR / "review.py"
WR_RANGE = "0.03,0.97"  # 작가님 결정 전 임시 기본값

SIZE = 19
KOMI = 6.5
COLS = "ABCDEFGHJKLMNOPQRST"  # GTP 좌표 — I 없음
# 공통: 한국 규칙·흑 기준 수치 보고. 최강은 300 visits + 2.5초 상한(응수 3초 목표).
COMMON_OVR = f"rules=korean,reportAnalysisWinratesAs=BLACK,logDir={KATA_DIR / 'gtp_logs'}"
STRONG_OVR = COMMON_OVR + ",maxVisits=300,maxTime=2.5"
HUMAN_OVR = COMMON_OVR + ",humanSLProfile=rank_5k,delayMoveScale=0,delayMoveMax=0"

RANKS = [f"{k}k" for k in range(20, 0, -1)] + [f"{d}d" for d in range(1, 10)]
RANK_KO = {r: (f"{r[:-1]}급" if r.endswith("k") else f"{r[:-1]}단") for r in RANKS}


# ---------------------------------------------------------------- 엔진

class Engine:
    """GTP 프로세스 1개 상주. 명령은 락으로 직렬화."""

    def __init__(self, name, args):
        self.name = name
        self.args = args
        self.proc = None
        self.lock = threading.Lock()
        self.error = None

    def start(self):
        try:
            self.proc = subprocess.Popen(
                self.args, cwd=KATA_DIR, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL, text=True, bufsize=1)
            self.cmd("name")
        except Exception as e:  # noqa: BLE001 — 이유를 화면에 그대로 보인다
            self.error = f"{self.name} 엔진 기동 실패: {e}"
            self.proc = None
            print(f"❌ go-board: {self.error}", file=sys.stderr)

    @property
    def ok(self):
        return self.proc is not None and self.proc.poll() is None

    def cmd(self, line):
        """응답 본문(= 뒤)을 돌려준다. 실패(?)는 RuntimeError."""
        with self.lock:
            return self._cmd(line)

    def _cmd(self, line):
        if self.proc is None or self.proc.poll() is not None:
            raise RuntimeError(f"{self.name} 엔진이 꺼져 있음")
        self.proc.stdin.write(line + "\n")
        self.proc.stdin.flush()
        out = []
        while True:
            ln = self.proc.stdout.readline()
            if ln == "":
                raise RuntimeError(f"{self.name} 엔진 응답 끊김")
            ln = ln.rstrip("\n")
            if ln == "" and out:
                break
            if ln == "" and not out:
                continue
            out.append(ln)
        head = out[0]
        if head.startswith("?"):
            raise RuntimeError(f"{self.name}: {line} → {head[1:].strip()}")
        return "\n".join([head[1:].strip()] + out[1:]).strip()

    def sync(self, moves):
        with self.lock:
            self._cmd("clear_board")
            self._cmd(f"komi {KOMI}")
            for c, mv in moves:
                self._cmd(f"play {c} {mv}")

    def genmove(self, color):
        """kata-genmove_analyze — (수, 흑 기준 점수, 흑 승률)."""
        with self.lock:
            if self.proc is None or self.proc.poll() is not None:
                raise RuntimeError(f"{self.name} 엔진이 꺼져 있음")
            self.proc.stdin.write(f"kata-genmove_analyze {color} interval 1000\n")
            self.proc.stdin.flush()
            score = wr = None
            move = None
            while True:
                ln = self.proc.stdout.readline()
                if ln == "":
                    raise RuntimeError(f"{self.name} 엔진 응답 끊김")
                ln = ln.strip()
                if ln.startswith("?"):
                    raise RuntimeError(f"{self.name}: genmove → {ln[1:].strip()}")
                if "info move" in ln:
                    m = re.search(r"info move \S+ .*?winrate (\S+) .*?scoreLead (\S+)", ln)
                    if m:
                        wr, score = float(m.group(1)), float(m.group(2))
                m = re.match(r"^(?:=\s*)?play (\S+)", ln)
                if m:
                    move = m.group(1)
                    # 응답 블록 끝 빈 줄까지 소비
                    while self.proc.stdout.readline().strip() != "":
                        pass
                    return move, score, wr


def build_engines():
    strong = Engine("최강", [str(KATAGO), "gtp", "-config", str(PLAY_CFG),
                            "-model", str(MAIN_MODEL), "-override-config", STRONG_OVR])
    human = None
    human_reason = None
    if not KATAGO.exists():
        strong.error = f"엔진 실행 파일 없음: {KATAGO}"
    if not HUMAN_MODEL.exists():
        human_reason = f"human 모델 없음 — {HUMAN_MODEL.name}을 {KATA_DIR}에 받아야 함"
    elif not HUMAN_CFG.exists():
        human_reason = f"human 설정 없음 — {HUMAN_CFG}"
    else:
        human = Engine("급수", [str(KATAGO), "gtp", "-config", str(HUMAN_CFG),
                               "-model", str(MAIN_MODEL), "-human-model", str(HUMAN_MODEL),
                               "-override-config", HUMAN_OVR])
    return strong, human, human_reason


# ---------------------------------------------------------------- 판 규칙(따낸 돌·표시용)

def to_xy(mv):
    return COLS.index(mv[0].upper()), SIZE - int(mv[1:])


def to_gtp(x, y):
    return f"{COLS[x]}{SIZE - y}"


def replay(moves):
    """수순 → (판, 흑이 따낸 수, 백이 따낸 수). 판[y][x] = 'B'/'W'/None."""
    g = [[None] * SIZE for _ in range(SIZE)]
    caps = {"B": 0, "W": 0}

    def group(x, y):
        c = g[y][x]
        st, seen, libs = [(x, y)], {(x, y)}, 0
        while st:
            cx, cy = st.pop()
            for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= nx < SIZE and 0 <= ny < SIZE:
                    v = g[ny][nx]
                    if v is None:
                        libs += 1
                    elif v == c and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        st.append((nx, ny))
        return seen, libs

    for c, mv in moves:
        if mv.lower() == "pass":
            continue
        x, y = to_xy(mv)
        g[y][x] = c
        o = "W" if c == "B" else "B"
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < SIZE and 0 <= ny < SIZE and g[ny][nx] == o:
                s, libs = group(nx, ny)
                if libs == 0:
                    for sx, sy in s:
                        g[sy][sx] = None
                    caps[c] += len(s)
    return g, caps


# ---------------------------------------------------------------- 대국 상태

class Game:
    def __init__(self, strong, human, human_reason):
        self.strong, self.human, self.human_reason = strong, human, human_reason
        self.lock = threading.Lock()
        self.user = "B"
        self.level = "strong"  # 'strong' | 랭크 문자열('5k' 등)
        self.new()

    def new(self):
        self.moves = []
        self.scores = []  # (수 번호, 흑 기준 점수)
        self.score = None
        self.winrate = None
        self.result = None
        self.message = ""
        self.started = datetime.now()
        self.sgf_path = GAMES_DIR / f"{self.started:%Y%m%d_%H%M%S}_작가님_vs_KataGo.sgf"

    @property
    def to_move(self):
        return "B" if len(self.moves) % 2 == 0 else "W"

    def engine(self):
        if self.level == "strong":
            return self.strong
        return self.human

    def level_label(self):
        return "KataGo 최강" if self.level == "strong" else f"KataGo 사람형 {RANK_KO[self.level]}"

    def _sync(self):
        e = self.engine()
        e.sync(self.moves)

    def engine_move(self):
        e = self.engine()
        if e is None or not e.ok:
            raise RuntimeError(e.error if e else self.human_reason)
        c = self.to_move
        mv, score, wr = e.genmove(c)
        if score is not None:
            self.score, self.winrate = score, wr
            self.scores.append((len(self.moves) + 1, round(score, 1)))
        if mv.lower() == "resign":
            self.result = f"{'W' if c == 'B' else 'B'}+R"
            self.message = "KataGo가 돌을 던졌습니다. 이기셨어요!"
        else:
            self.moves.append((c, mv))
            self._check_end()

    def _check_end(self):
        if len(self.moves) >= 2 and all(m.lower() == "pass" for _, m in self.moves[-2:]):
            try:
                self.result = self.engine().cmd("final_score")
            except RuntimeError as e:
                self.result = "?"
                self.message = str(e)
            else:
                self.message = f"대국 종료 — {result_ko(self.result)}"

    def play(self, mv):
        if self.result:
            raise RuntimeError("대국이 끝났습니다. '새 판'을 눌러 주세요.")
        if self.to_move != self.user:
            raise RuntimeError("KataGo 차례입니다.")
        e = self.engine()
        if e is None or not e.ok:
            raise RuntimeError(e.error if e else self.human_reason)
        try:
            e.cmd(f"play {self.user} {mv}")
        except RuntimeError:
            raise RuntimeError("둘 수 없는 자리입니다 (자충·패 등).")
        self.moves.append((self.user, mv))
        self.message = ""
        self._check_end()
        if not self.result:
            self.engine_move()
        self.save()

    def undo(self):
        if self.result:
            self.result = None
        # 내 차례가 될 때까지 되돌리되, 내 수를 최소 1개 무른다
        if not any(c == self.user for c, _ in self.moves):
            raise RuntimeError("무를 수가 없습니다.")
        while self.moves:
            c, _ = self.moves.pop()
            if c == self.user:
                break
        self.scores = [s for s in self.scores if s[0] <= len(self.moves)]
        self.message = "한 수 물렀습니다."
        self._sync()
        if self.to_move != self.user:  # 엔진 수만 남은 경우
            self.engine_move()
        self.save()

    def swap(self):
        self.user = "W" if self.user == "B" else "B"
        self.message = f"이제 {'흑' if self.user == 'B' else '백'}을 잡으셨습니다."
        if not self.result and self.to_move != self.user:
            self._sync()
            self.engine_move()
        self.save()

    def set_level(self, level):
        if level != "strong" and level not in RANKS:
            raise RuntimeError("알 수 없는 수준")
        if level != "strong":
            if self.human is None or not self.human.ok:
                raise RuntimeError(self.human.error if self.human else self.human_reason)
            self.human.cmd(f"kata-set-param humanSLProfile rank_{level}")
        self.level = level
        self._sync()
        self.message = f"상대: {self.level_label()}"
        if not self.result and self.to_move != self.user:
            self.engine_move()

    def save(self):
        if not self.moves:
            return
        GAMES_DIR.mkdir(parents=True, exist_ok=True)
        me, eng = "작가님", f"KataGo({self.level_label()})"
        pb, pw = (me, eng) if self.user == "B" else (eng, me)
        nodes = []
        for c, mv in self.moves:
            if mv.lower() == "pass":
                nodes.append(f";{c}[]")
            else:
                x, y = to_xy(mv)
                nodes.append(f";{c}[{chr(97 + x)}{chr(97 + y)}]")
        head = (f"(;GM[1]FF[4]CA[UTF-8]SZ[{SIZE}]KM[{KOMI}]RU[Korean]"
                f"DT[{self.started:%Y-%m-%d}]PB[{pb}]PW[{pw}]"
                f"AP[MONK go-board-web]" + (f"RE[{self.result}]" if self.result else ""))
        self.sgf_path.write_text(head + "".join(nodes) + ")\n", encoding="utf-8")

    def state(self):
        g, caps = replay(self.moves)
        last = None
        if self.moves and self.moves[-1][1].lower() != "pass":
            last = list(to_xy(self.moves[-1][1]))
        human_ok = self.human is not None and self.human.ok
        return {
            "board": g, "captures": caps, "last": last, "moveNo": len(self.moves),
            "lastPass": bool(self.moves) and self.moves[-1][1].lower() == "pass",
            "lastColor": self.moves[-1][0] if self.moves else None,
            "toMove": self.to_move, "user": self.user, "level": self.level,
            "levelLabel": self.level_label(), "score": self.score, "winrate": self.winrate,
            "scores": self.scores, "result": self.result,
            "resultKo": result_ko(self.result) if self.result else None,
            "message": self.message, "sgf": str(self.sgf_path) if self.moves else None,
            "strongOk": self.strong.ok, "strongError": self.strong.error,
            "humanOk": human_ok,
            "humanReason": None if human_ok else (self.human.error if self.human else self.human_reason)
                           or "급수 엔진이 꺼져 있음",
            "ranks": [{"v": r, "label": RANK_KO[r]} for r in RANKS],
            "review": REVIEWS.status(self),
            "testMode": TEST_MODE,
        }


# ---------------------------------------------------------------- 리뷰 (review.py 호출)

MIN_USER_MOVES = 5


class Reviews:
    """review.py를 별도 프로세스로 1건씩 돌린다. 대국 락은 잡지 않는다(분석 중에도 둘 수 있음)."""

    def __init__(self):
        self.lock = threading.Lock()
        self.jobs = {}
        self.running = None
        self._help = None

    def help_text(self):
        if self._help is None and REVIEW_PY.exists():
            r = subprocess.run([sys.executable, str(REVIEW_PY), "--help"], cwd=PILOT_DIR,
                               capture_output=True, text=True, timeout=60)
            self._help = r.stdout if r.returncode == 0 else ""
        return self._help or ""

    def filter_ok(self):
        return "--wr-range" in self.help_text()

    def status(self, game):
        if not REVIEW_PY.exists():
            return {"ok": False, "reason": f"리뷰 준비 중 — {REVIEW_PY.name} 없음"}
        n = sum(1 for c, _ in game.moves if c == game.user)
        base = {"filterOk": self.filter_ok(), "wrRange": WR_RANGE,
                "filterReason": None if self.filter_ok() else "리뷰 엔진에 승률 구간 옵션이 아직 없어 전 구간으로 봅니다",
                "running": self.running}
        if self.running:
            return dict(base, ok=False, reason="리뷰 만드는 중 — 새 탭에서 진행 상황을 볼 수 있어요")
        if n < MIN_USER_MOVES:
            return dict(base, ok=False, reason=f"작가님 수가 {MIN_USER_MOVES}수 이상이면 리뷰할 수 있어요")
        return dict(base, ok=True, reason="")

    def start(self, game, wr_filter):
        st = self.status(game)
        if not st["ok"]:
            raise RuntimeError(st["reason"])
        game.save()
        REVIEW_DIR.mkdir(parents=True, exist_ok=True)
        jid = datetime.now().strftime("%Y%m%d_%H%M%S")
        stem = REVIEW_DIR / f"{game.sgf_path.stem}_리뷰_{jid[-6:]}"
        src = stem.with_suffix(".input.sgf")
        src.write_bytes(game.sgf_path.read_bytes())  # 진행 중 판이 바뀌어도 리뷰 입력은 고정
        args = [sys.executable, str(REVIEW_PY), str(src), str(stem.with_suffix(".html")),
                "--sgf", str(stem.with_suffix(".sgf")), "--color", game.user]
        if wr_filter and self.filter_ok():
            args += ["--wr-range", WR_RANGE]
        job = {"id": jid, "args": args, "html": stem.with_suffix(".html"), "sgf": stem.with_suffix(".sgf"),
               "log": stem.with_suffix(".log"), "started": time.time(), "state": "running",
               "filter": bool(wr_filter and self.filter_ok()), "moves": len(game.moves)}
        with self.lock:
            self.jobs[jid] = job
            self.running = jid
        threading.Thread(target=self._run, args=(job,), daemon=True).start()
        return jid

    def _run(self, job):
        try:
            with open(job["log"], "w", encoding="utf-8") as lf:
                rc = subprocess.run(job["args"], cwd=PILOT_DIR, stdout=lf, stderr=subprocess.STDOUT,
                                    timeout=1800).returncode
            job["state"] = "done" if rc == 0 and job["html"].exists() else "failed"
            if job["state"] == "failed":
                job["error"] = f"review.py 종료 코드 {rc}"
        except Exception as e:  # noqa: BLE001 — 실패는 리뷰 탭에 그대로 보인다
            job["state"], job["error"] = "failed", str(e)
        job["secs"] = round(time.time() - job["started"])
        with self.lock:
            self.running = None
        print(f"{'✅' if job['state'] == 'done' else '❌'} go-board 리뷰 {job['id']}: {job['state']} "
              f"{job['secs']}s {job.get('error', '')}", file=sys.stderr, flush=True)

    def page(self, jid):
        job = self.jobs.get(jid)
        if not job:
            return None
        if job["state"] == "done":
            return job["html"].read_bytes()
        tail = ""
        if job["log"].exists():
            lines = job["log"].read_text(encoding="utf-8", errors="replace").strip().splitlines()
            tail = "\n".join(lines[-6:])
        el = round(time.time() - job["started"])
        head = ("리뷰를 만들고 있어요" if job["state"] == "running" else "리뷰 만들기에 실패했어요")
        refresh = '<meta http-equiv="refresh" content="3">' if job["state"] == "running" else ""
        err = f"<p style='color:#b4462b'>{esc(job.get('error', ''))}</p>" if job["state"] == "failed" else ""
        flt = f"승률 {WR_RANGE.replace(',', '~')} 구간 실수만" if job["filter"] else "전 구간"
        return (f"<!doctype html><html lang='ko'><head><meta charset='utf-8'>{refresh}<title>대국 리뷰</title>"
                f"<style>body{{font:20px -apple-system,'Apple SD Gothic Neo',sans-serif;background:#f4efe6;"
                f"color:#2b2620;max-width:760px;margin:40px auto;padding:0 16px}}pre{{font-size:14px;"
                f"white-space:pre-wrap;color:#6f655a}}</style></head><body><h1>{head}</h1>"
                f"<p>{job['moves']}수 대국 · {flt} · {el}초 경과 (보통 몇 분 걸려요 — 이 탭은 3초마다 새로 고칩니다)</p>"
                f"{err}<pre>{esc(tail)}</pre><p style='font-size:15px;color:#6f655a'>결과 저장 위치: "
                f"{esc(str(job['html']))}<br>해설 기보: {esc(str(job['sgf']))}</p></body></html>").encode("utf-8")


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


REVIEWS = Reviews()


def result_ko(r):
    if not r or r == "?":
        return "결과 미상"
    if r == "0":
        return "빅"
    m = re.match(r"([BW])\+(\S+)", r)
    if not m:
        return r
    who = "흑" if m.group(1) == "B" else "백"
    return f"{who} 불계승" if m.group(2) == "R" else f"{who} {m.group(2)}집 승"


# ---------------------------------------------------------------- HTTP

GAME = None


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *a):
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/api/state":
            with GAME.lock:
                self._send(200, json.dumps(GAME.state(), ensure_ascii=False))
        elif self.path.startswith("/review/"):
            body = REVIEWS.page(self.path.split("/")[2])
            if body is None:
                self._send(404, "리뷰 없음", "text/plain; charset=utf-8")
            else:
                self._send(200, body, "text/html; charset=utf-8")
        elif self.path == "/health":
            self._send(200, json.dumps({"ok": True, "strong": GAME.strong.ok,
                                        "human": bool(GAME.human and GAME.human.ok)}))
        else:
            self._send(404, '{"error":"없음"}')

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            body = {}
        t0 = time.time()
        # 엔진 생각 중 들어온 요청은 줄 세우지 않고 버린다 — 대기 클릭이 나중에 착수로 바뀌는 경합 차단
        if not GAME.lock.acquire(blocking=False):
            return self._send(409, json.dumps({"busy": True, "error": "상대가 생각 중입니다"}, ensure_ascii=False))
        try:
            err = None
            jid = None
            try:
                p = self.path
                if p == "/api/play":
                    if body.get("pass"):
                        GAME.play("pass")
                    else:
                        GAME.play(to_gtp(int(body["x"]), int(body["y"])))
                elif p == "/api/new":
                    GAME.new()
                    GAME._sync()
                    if GAME.to_move != GAME.user:
                        GAME.engine_move()
                        GAME.save()
                elif p == "/api/undo":
                    GAME.undo()
                elif p == "/api/swap":
                    GAME.swap()
                elif p == "/api/level":
                    GAME.set_level(str(body.get("level")))
                elif p == "/api/review":
                    jid = REVIEWS.start(GAME, bool(body.get("wrFilter", True)))
                else:
                    return self._send(404, '{"error":"없음"}')
            except (RuntimeError, KeyError, ValueError) as e:
                err = str(e)
            st = GAME.state()
            st["error"] = err
            st["elapsed"] = round(time.time() - t0, 2)
            st["reviewJob"] = jid
        finally:
            GAME.lock.release()
        self._send(200, json.dumps(st, ensure_ascii=False))


def main():
    global GAME
    if TEST_MODE and PORT == LIVE_PORT:
        sys.exit(f"❌ go-board: 테스트 모드는 실사용 포트 {LIVE_PORT}를 쓸 수 없음")
    strong, human, human_reason = build_engines()
    ths = [threading.Thread(target=e.start) for e in (strong, human) if e and not e.error]
    for t in ths:
        t.start()
    for t in ths:
        t.join()
    GAME = Game(strong, human, human_reason)
    if strong.ok:
        GAME._sync()
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"✅ go-board: http://{HOST}:{PORT}/  (최강 {'OK' if strong.ok else '실패'}, "
          f"급수 {'OK' if human and human.ok else '비활성: ' + str(GAME.state()['humanReason'])})",
          flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        for e in (strong, human):
            if e and e.ok:
                try:
                    e.cmd("quit")
                except RuntimeError:
                    pass


if __name__ == "__main__":
    main()
