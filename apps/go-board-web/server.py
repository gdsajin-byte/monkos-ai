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
GAMES_DIR = KATA_DIR / "games"
HERE = Path(__file__).resolve().parent

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
            "review": {"ok": False, "reason": REVIEW_REASON},
        }


# 리뷰: apps/go-commentary-pilot(막내11 소관)은 OGS games.json 기반 배치라 SGF 1판 입력 인터페이스가 아직 없다.
# 인터페이스가 생기면 여기서 호출만 한다(그쪽 코드 수정 금지).
REVIEW_REASON = "리뷰 준비 중 — 해설 파이프라인에 기보 1판 입력 창구가 아직 없습니다"


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
                else:
                    return self._send(404, '{"error":"없음"}')
            except (RuntimeError, KeyError, ValueError) as e:
                err = str(e)
            st = GAME.state()
            st["error"] = err
            st["elapsed"] = round(time.time() - t0, 2)
        finally:
            GAME.lock.release()
        self._send(200, json.dumps(st, ensure_ascii=False))


def main():
    global GAME
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
