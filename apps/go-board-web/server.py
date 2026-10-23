#!/usr/bin/env python3
"""MONK 로컬 바둑판 — KataGo와 클릭으로 두는 웹 바둑판 (해설 봇 MVP 화면 시제품).

표준 라이브러리만 쓴다. 127.0.0.1에만 붙는다(외부 공개 금지).
엔진·모델·대국 기록은 전부 레포 밖 ~/.monkos/katago/ 에 있다.
"""
import json
import os
import random
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
PILOT_DIR = Path(os.environ.get("GO_BOARD_PILOT_DIR") or HERE.parent / "go-commentary-pilot")  # 환경변수는 미병합 브랜치 시험용
REVIEW_PY = PILOT_DIR / "review.py"
WR_RANGE = "0.03,0.97"  # 작가님 결정 전 임시 기본값

SIZE = 19
KOMI = 6.5
# 외부 사운드팩(레포 밖) — ~/.monkos/go-board-sounds/<팩>/*.mp3|wav. 내부 실험 팩은 출시 전 교체(원장 191)
PACKS_DIR = Path.home() / ".monkos" / "go-board-sounds"
# 외부 스킨팩(레포 밖) — ~/.monkos/go-board-skins/<팩>/ (skin.json 규격: SKINS.md). 내부 실험 팩은 출시 전 교체
SKINS_DIR = Path.home() / ".monkos" / "go-board-skins"
# skin.json 이 없는 팩의 기본 해석 — 256×240 스프라이트의 128px 칸(백 왼쪽·흑 오른쪽)
SKIN_DEFAULT = {"grid": "#3a2c18", "gridWidth": 0.7, "white": [0, 112, 128, 128], "black": [128, 112, 128, 128],
                "stoneScale": 1.0, "shadow": {"dx": 0.8, "dy": 1.2, "blur": 0.8, "opacity": 0.35}}
# 시간 설정 기본값 — 타이젬 표기 '20초 3회'(기본시간 0분)
DEFAULT_TIME = {"main": 0, "byo": 20, "periods": 3}
OWN_THRESHOLD = 0.5  # 계가: 열린 빈 점을 집으로 셀 소유권 기준
HANDICAP_KOMI = 0.5  # 한국 규칙 관행 — 접바둑은 덤 0.5
HANDICAPS = [0] + list(range(2, 10))  # 0 = 호선
# KataGo fixed_handicap 대신 쓰는 배치 — 3점은 한국·일본 관행(우상·좌하·우하, 빈 귀=좌상). 쌍아 결정 10-23
FIXED_SETUP = {3: ["Q16", "D4", "Q4"]}
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

    def sync(self, moves, handicap=0, komi=KOMI):
        """판을 처음부터 다시 맞춘다. 접바둑이면 표준 화점 치석(fixed_handicap)을 놓고 그 좌표를 돌려준다."""
        with self.lock:
            self._cmd("clear_board")
            self._cmd(f"komi {komi}")
            if handicap in FIXED_SETUP:
                setup = FIXED_SETUP[handicap]
                self._cmd("set_free_handicap " + " ".join(setup))
            else:
                setup = self._cmd(f"fixed_handicap {handicap}").split() if handicap else []
            for c, mv in moves:
                self._cmd(f"play {c} {mv}")
            return setup

    def ownership(self):
        """신경망 소유권(8대칭 평균) — [y][x], 백 기준 -1~1. 계가에서 경계가 열린 빈 점 판정에 쓴다.
        'kata-raw-nn all'은 대칭 블록을 빈 줄로 나눠 GTP 응답 경계가 깨지므로 대칭마다 따로 묻는다."""
        acc = [[0.0] * SIZE for _ in range(SIZE)]
        for sym in range(8):
            out = self.cmd(f"kata-raw-nn {sym}").splitlines()
            i = next(k for k, ln in enumerate(out) if ln.strip() == "whiteOwnership")
            for r in range(SIZE):
                for c, v in enumerate(out[i + 1 + r].split()):
                    acc[r][c] += float(v) / 8
        return acc

    def search(self, color, top=3):
        """kata-search_analyze — 두지 않고 후보 상위 N(수·흑 승률·흑 기준 점수·탐색 수)."""
        with self.lock:
            if self.proc is None or self.proc.poll() is not None:
                raise RuntimeError(f"{self.name} 엔진이 꺼져 있음")
            self.proc.stdin.write(f"kata-search_analyze {color}\n")
            self.proc.stdin.flush()
            info = ""
            while True:
                ln = self.proc.stdout.readline()
                if ln == "":
                    raise RuntimeError(f"{self.name} 엔진 응답 끊김")
                ln = ln.strip()
                if ln.startswith("?"):
                    raise RuntimeError(f"{self.name}: 추천수 → {ln[1:].strip()}")
                if "info move" in ln:
                    info = ln
                if re.match(r"^(?:=\s*)?play \S+", ln):
                    while self.proc.stdout.readline().strip() != "":
                        pass
                    break
        out = []
        for m in re.finditer(r"info move (\S+) visits (\d+) .*?winrate (\S+) .*?scoreLead (\S+) .*?order (\d+)", info):
            out.append({"move": m.group(1), "visits": int(m.group(2)), "winrate": float(m.group(3)),
                        "score": float(m.group(4)), "order": int(m.group(5))})
        return sorted(out, key=lambda c: c["order"])[:top]

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


def replay(moves, setup=()):
    """치석 + 수순 → (판, 흑이 따낸 수, 백이 따낸 수). 판[y][x] = 'B'/'W'/None."""
    g = [[None] * SIZE for _ in range(SIZE)]
    for mv in setup:
        x, y = to_xy(mv)
        g[y][x] = "B"
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
        self.handicap = 0
        self.time = dict(DEFAULT_TIME)  # None = 무제한
        self.new()

    def new(self, handicap=None, time_ctl="keep", color=None):
        if color in ("B", "W"):
            self.user = color
        elif color == "auto":  # 돌 가림
            self.user = random.choice("BW")
        if time_ctl != "keep":
            self.time = parse_time(time_ctl)
        if handicap is not None:
            if handicap not in HANDICAPS:
                raise RuntimeError("치수는 호선 또는 2~9점입니다.")
            self.handicap = handicap
            if handicap:
                self.user = "B"  # 접바둑은 작가님이 하수(흑)로 시작 — 바꾸려면 '흑백 바꾸기'
        self.setup = []  # 치석 좌표 — _sync 때 엔진이 놓은 자리로 채운다
        self.moves = []
        self.scores = []  # (수 번호, 흑 기준 점수)
        self.score = None
        self.winrate = None
        self.result = None
        self.final_count = None
        self.scoring = None  # 계가 중이면 {"dead": set((x, y)), "kata": KataGo final_score}
        self.message = ""
        self.started = datetime.now()
        self.sgf_path = GAMES_DIR / f"{self.started:%Y%m%d_%H%M%S}_작가님_vs_KataGo.sgf"

    @property
    def komi(self):
        return HANDICAP_KOMI if self.handicap else KOMI

    @property
    def to_move(self):
        first = "W" if self.handicap else "B"  # 접바둑은 백(상수)이 먼저
        if len(self.moves) % 2 == 0:
            return first
        return "B" if first == "W" else "W"

    def engine(self):
        if self.level == "strong":
            return self.strong
        return self.human

    def level_label(self):
        return "KataGo 최강" if self.level == "strong" else f"KataGo 사람형 {RANK_KO[self.level]}"

    def _sync(self):
        e = self.engine()
        self.setup = e.sync(self.moves, self.handicap, self.komi)

    def engine_move(self):
        if self.scoring:  # 계가 중에는 엔진이 두지 않는다
            return
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
            self.start_scoring()
            self.message = "양쪽이 패스했습니다 — 사석을 확인하고 '계가 확정'을 눌러 주세요."

    # ---- 계가(한국 규칙 = 집 계산: 집 + 따낸 돌 + 사석, 백은 덤 더함)

    def start_scoring(self):
        if self.result:
            raise RuntimeError("이미 끝난 대국입니다.")
        if not self.moves:
            raise RuntimeError("아직 둔 수가 없습니다.")
        e = self.engine()
        if e is None or not e.ok:
            raise RuntimeError(e.error if e else self.human_reason)
        dead = set()
        for mv in e.cmd("final_status_list dead").split():
            dead.add(to_xy(mv))
        self.scoring = {"dead": dead, "kata": e.cmd("final_score"), "own": e.ownership()}
        self.message = "계가 중 — KataGo가 고른 사석이 흐리게 보입니다. 돌을 누르면 사석/산 돌이 바뀝니다."

    def toggle_dead(self, x, y):
        if not self.scoring:
            raise RuntimeError("계가 중이 아닙니다.")
        g, _ = replay(self.moves, self.setup)
        if not g[y][x]:
            return
        c = g[y][x]
        group, st = {(x, y)}, [(x, y)]
        while st:  # 같은 색으로 이어진 무리 전체를 함께 바꾼다
            cx, cy = st.pop()
            for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                if 0 <= nx < SIZE and 0 <= ny < SIZE and g[ny][nx] == c and (nx, ny) not in group:
                    group.add((nx, ny))
                    st.append((nx, ny))
        if (x, y) in self.scoring["dead"]:
            self.scoring["dead"] -= group
        else:
            self.scoring["dead"] |= group

    def count(self):
        g, caps = replay(self.moves, self.setup)
        prisoners = dict(caps)
        for x, y in self.scoring["dead"]:
            c = g[y][x]
            if c:
                prisoners["W" if c == "B" else "B"] += 1
                g[y][x] = None
        terr = {"B": [], "W": []}
        seen = set()
        for y0 in range(SIZE):
            for x0 in range(SIZE):
                if g[y0][x0] or (x0, y0) in seen:
                    continue
                region, border, st = [], set(), [(x0, y0)]
                seen.add((x0, y0))
                while st:
                    cx, cy = st.pop()
                    region.append((cx, cy))
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < SIZE and 0 <= ny < SIZE:
                            v = g[ny][nx]
                            if v:
                                border.add(v)
                            elif (nx, ny) not in seen:
                                seen.add((nx, ny))
                                st.append((nx, ny))
                if len(border) == 1:  # 한 색에만 둘러싸인 빈 곳 = 집
                    terr[border.pop()].extend(region)
                else:  # 경계가 아직 안 닫힌 곳 — KataGo 소유권이 확실한 점만 집으로(±0.5 미만은 공배)
                    own = self.scoring["own"]
                    for x, y in region:
                        if own[y][x] >= OWN_THRESHOLD:
                            terr["W"].append((x, y))
                        elif own[y][x] <= -OWN_THRESHOLD:
                            terr["B"].append((x, y))
        b = len(terr["B"]) + prisoners["B"]
        w = len(terr["W"]) + prisoners["W"] + self.komi
        diff = b - w
        res = "0" if diff == 0 else (f"B+{diff:g}" if diff > 0 else f"W+{-diff:g}")
        return {"terrB": len(terr["B"]), "terrW": len(terr["W"]), "prisB": prisoners["B"], "prisW": prisoners["W"],
                "komi": self.komi, "black": b, "white": w, "result": res, "resultKo": result_ko(res),
                "kata": self.scoring["kata"], "kataKo": result_ko(self.scoring["kata"]),
                "dead": sorted(self.scoring["dead"]),
                "terr": [[x, y, "B"] for x, y in terr["B"]] + [[x, y, "W"] for x, y in terr["W"]]}

    def confirm_score(self):
        if not self.scoring:
            raise RuntimeError("계가 중이 아닙니다.")
        c = self.count()
        self.result = c["result"]
        self.final_count = c
        self.scoring = None
        self.message = (f"계가 확정 — 흑 {c['black']:g} · 백 {c['white']:g}(덤 {c['komi']:g} 포함) → {c['resultKo']}"
                        f" (KataGo 판정 {c['kataKo']})")
        self.save()

    def cancel_score(self):
        self.scoring = None
        self.message = "계가를 취소했습니다. 이어서 두세요."

    def play(self, mv):
        if self.result:
            raise RuntimeError("대국이 끝났습니다. '새 판'을 눌러 주세요.")
        if self.scoring:
            raise RuntimeError("계가 중입니다 — '계가 확정' 또는 '계가 취소'를 눌러 주세요.")
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
        if not self.result and not self.scoring:
            self.engine_move()
        self.save()

    def hint(self):
        """현재 국면 KataGo 추천 상위 3 — 늘 최강 엔진으로(급수 상대일 때도)."""
        if self.result or self.scoring:
            raise RuntimeError("대국 중에만 볼 수 있습니다.")
        e = self.strong
        if not e.ok:
            raise RuntimeError(e.error or "최강 엔진이 꺼져 있음")
        e.sync(self.moves, self.handicap, self.komi)
        cands = e.search(self.to_move)
        for c in cands:
            c["xy"] = list(to_xy(c["move"])) if c["move"].lower() != "pass" else None
        return {"color": self.to_move, "moveNo": len(self.moves), "cands": cands}

    def judge(self):
        """AI 판정 — 지금 끝낸다면 KataGo가 보는 결과(대국은 계속)."""
        if not self.moves:
            raise RuntimeError("아직 둔 수가 없습니다.")
        e = self.engine()
        if e is None or not e.ok:
            raise RuntimeError(e.error if e else self.human_reason)
        r = e.cmd("final_score")
        return {"result": r, "resultKo": result_ko(r), "moveNo": len(self.moves)}

    def timeout(self, color):
        """작가님 시계가 다 됨 → 시간패. 엔진은 시간패 없음(시계 표시만, 화면에서 상한)."""
        if self.result or not self.time:
            raise RuntimeError("시간패를 적용할 수 없습니다.")
        if color != self.user:
            raise RuntimeError("KataGo는 시간패가 없습니다.")
        self.scoring = None
        self.result = f"{'W' if color == 'B' else 'B'}+T"
        self.message = "시간이 다 됐습니다 — 시간패."
        self.save()

    def resign(self):
        if self.result:
            raise RuntimeError("이미 끝난 대국입니다.")
        if not self.moves:
            raise RuntimeError("아직 둔 수가 없습니다.")
        self.result = f"{'W' if self.user == 'B' else 'B'}+R"
        self.message = "기권했습니다." + (" '리뷰'로 이번 판을 돌아볼 수 있어요." if REVIEWS.status(self)["ok"] else "")
        self.save()

    def undo(self):
        if self.result:
            raise RuntimeError("끝난 대국은 무를 수 없습니다. '새 판'을 눌러 주세요.")
        self.scoring = None
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
        ab = "".join(f"[{chr(97 + x)}{chr(97 + y)}]" for x, y in map(to_xy, self.setup))
        head = (f"(;GM[1]FF[4]CA[UTF-8]SZ[{SIZE}]KM[{self.komi}]RU[Korean]"
                + (f"HA[{self.handicap}]AB{ab}" if self.handicap else "")
                + (f"TM[{self.time['main'] * 60}]OT[{self.time['periods']}x{self.time['byo']} byo-yomi]" if self.time else "")
                + f"DT[{self.started:%Y-%m-%d}]PB[{pb}]PW[{pw}]"
                f"AP[MONK go-board-web]" + (f"RE[{self.result}]" if self.result else ""))
        self.sgf_path.write_text(head + "".join(nodes) + ")\n", encoding="utf-8")

    def state(self):
        g, caps = replay(self.moves, self.setup)
        last = None
        if self.moves and self.moves[-1][1].lower() != "pass":
            last = list(to_xy(self.moves[-1][1]))
        human_ok = self.human is not None and self.human.ok
        return {
            "board": g, "captures": caps, "last": last, "moveNo": len(self.moves),
            "lastPass": bool(self.moves) and self.moves[-1][1].lower() == "pass",
            "lastColor": self.moves[-1][0] if self.moves else None,
            "toMove": self.to_move, "user": self.user, "level": self.level,
            "handicap": self.handicap, "komi": self.komi, "handicaps": HANDICAPS,
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
            "scoring": self.count() if self.scoring else None,
            "finalCount": getattr(self, "final_count", None) if self.result else None,
            "sounds": custom_sounds(),
            "packs": sound_packs(),
            "skins": skin_packs(),
            "time": self.time,
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

    def handicap_ok(self):
        """파일럿이 KataGo initialStones(치석)를 넘기는지 — 소스 문자열로 판정(막내11과 합의한 표지)."""
        return any("initialStones" in f.read_text(encoding="utf-8", errors="ignore")
                   for f in PILOT_DIR.glob("*.py"))

    def filter_ok(self):
        return "--wr-range" in self.help_text()

    def status(self, game):
        if not REVIEW_PY.exists():
            return {"ok": False, "reason": f"리뷰 준비 중 — {REVIEW_PY.name} 없음"}
        n = sum(1 for c, _ in game.moves if c == game.user)
        base = {"filterOk": self.filter_ok(), "wrRange": WR_RANGE,
                "filterReason": None if self.filter_ok() else "리뷰 엔진에 승률 구간 옵션이 아직 없어 전 구간으로 봅니다",
                "running": self.running}
        if game.handicap and not self.handicap_ok():
            return dict(base, ok=False, reason="접바둑 기보는 리뷰 준비 중 — 리뷰 엔진이 치석을 아직 읽지 못합니다")
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
        if self.filter_ok():  # review.py 기본이 구간 적용이라 끌 때도 명시한다
            args += ["--wr-range", WR_RANGE if wr_filter else "off"]
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
            return self._with_banner(job)
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


    def _with_banner(self, job):
        """실수가 적게 뽑힌 판은 결과 위에 빈 상태 안내를 붙인다(review.py 출력은 건드리지 않음)."""
        page = job["html"].read_text(encoding="utf-8")
        try:
            items = json.loads((job["html"].with_suffix("").parent / (job["html"].stem + "_work") / "items.json")
                               .read_text(encoding="utf-8"))
            n = sum(1 for it in items if "실수" in it.get("kind", ""))
        except (OSError, ValueError):
            return page.encode("utf-8")
        if n >= 3:
            return page.encode("utf-8")
        pct = "~".join(f"{round(float(v) * 100)}" for v in WR_RANGE.split(",")) + "%"
        flt = f"승부가 갈리기 전 구간(승률 {pct})에서 " if job["filter"] else ""
        msg = f"이번 판은 {flt}큰 실수가 {'없었어요.' if n == 0 else f'{n}개뿐이었어요.'}"
        if job["filter"]:
            msg += " 이미 승부가 기운 뒤의 수까지 보려면 바둑판에서 '승률 구간' 체크를 끄고 다시 리뷰해 주세요."
        elif n == 0:
            msg += " 잘 두셨어요!"
        banner = (f"<div style='background:#fff4d6;color:#4a3b10;border:2px solid #e2c36b;border-radius:10px;"
                  f"padding:14px 18px;margin:16px auto;max-width:1000px;font:18px -apple-system,"
                  f"\"Apple SD Gothic Neo\",sans-serif'>{esc(msg)}</div>")
        page = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + banner, page, count=1)
        return page.encode("utf-8")


def parse_time(t):
    """{'unlimited': True} → None, 아니면 {'main': 분, 'byo': 초, 'periods': 회} 범위 검사."""
    if not t or t.get("unlimited"):
        return None
    main, byo, periods = int(t.get("main", 0)), int(t.get("byo", 20)), int(t.get("periods", 3))
    if not (0 <= main <= 60 and 5 <= byo <= 120 and 1 <= periods <= 10):
        raise RuntimeError("시간 설정 범위: 기본시간 0~60분, 초읽기 5~120초, 1~10회")
    return {"main": main, "byo": byo, "periods": periods}


def sound_packs():
    """레포 밖 사운드팩 목록 — {팩 이름: [파일 이름…]}. README.txt 첫 줄은 표식으로 함께 준다."""
    out = {}
    if PACKS_DIR.exists():
        for d in sorted(PACKS_DIR.iterdir()):
            if d.is_dir() and re.fullmatch(r"[A-Za-z0-9_-]+", d.name):
                files = sorted(f.name for f in d.iterdir()
                               if f.suffix in (".mp3", ".wav") and re.fullmatch(r"[A-Za-z0-9_-]+\.(mp3|wav)", f.name))
                note = (d / "README.txt").read_text(encoding="utf-8", errors="ignore").splitlines()[0] \
                    if (d / "README.txt").exists() else ""
                out[d.name] = {"files": files, "note": note}
    return out


def skin_packs():
    """레포 밖 스킨팩 — {팩: {boards, stones, spec, note}}. skin.json 이 있으면 그 값을 기본값 위에 덮는다."""
    out = {}
    if not SKINS_DIR.exists():
        return out
    for d in sorted(SKINS_DIR.iterdir()):
        if not (d.is_dir() and re.fullmatch(r"[A-Za-z0-9_-]+", d.name)):
            continue
        names = sorted((f.name for f in d.iterdir() if re.fullmatch(r"[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)", f.name)),
                       key=lambda n: (re.sub(r"\d+", "", n), int((re.findall(r"\d+", n) or ["0"])[-1])))
        spec = dict(SKIN_DEFAULT)
        if (d / "skin.json").exists():
            try:
                spec.update(json.loads((d / "skin.json").read_text(encoding="utf-8")))
            except ValueError as e:
                print(f"❌ go-board: {d.name}/skin.json 해석 실패 — {e}", file=sys.stderr)
        boards = [n for n in names if n.endswith((".jpg", ".jpeg", ".webp")) or "board" in n]
        stones = [n for n in names if n.endswith(".png") and "stone" in n]
        # 기본 선택: skin.json 의 board/stones, 없으면 en* (현재 적용 스킨), 그다음 첫 파일
        spec.setdefault("board", next((n for n in boards if n.startswith("en")), boards[0] if boards else None))
        spec.setdefault("stones", next((n for n in stones if n.startswith("en")), stones[0] if stones else None))
        note = (d / "README.txt").read_text(encoding="utf-8", errors="ignore").splitlines()[0] \
            if (d / "README.txt").exists() else ""
        out[d.name] = {"boards": boards, "stones": stones, "spec": spec, "note": note}
    return out


def custom_sounds():
    """sounds/custom/ 에 넣은 작가님 녹음 — stone*.wav = 착수, capture*.wav = 따냄. 있으면 기본음 대신 쓴다."""
    d = HERE / "sounds" / "custom"
    names = sorted(f.stem for f in d.glob("*.wav") if re.fullmatch(r"[A-Za-z0-9_-]+", f.stem)) if d.exists() else []
    return {"stone": [f"custom/{n}" for n in names if n.lower().startswith("stone")],
            "capture": [f"custom/{n}" for n in names if n.lower().startswith("capture")]}


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
    if m.group(2) == "R":
        return f"{who} 불계승"
    if m.group(2) == "T":
        return f"{who} 시간승"
    return f"{who} {m.group(2)}집 승"


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
        if self.path.split("?")[0] in ("/", "/index.html"):
            self._send(200, (HERE / "index.html").read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/api/state":
            with GAME.lock:
                self._send(200, json.dumps(GAME.state(), ensure_ascii=False))
        elif re.fullmatch(r"/sounds/(custom/)?[A-Za-z0-9_-]+\.wav", self.path):
            f = HERE / self.path.lstrip("/")
            if f.exists():
                self._send(200, f.read_bytes(), "audio/wav")
            else:
                self._send(404, '{"error":"없음"}')
        elif re.fullmatch(r"/pack/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\.(mp3|wav)", self.path):
            _, _, pack, name = self.path.split("/")
            f = PACKS_DIR / pack / name
            if f.exists():
                self._send(200, f.read_bytes(), "audio/mpeg" if name.endswith(".mp3") else "audio/wav")
            else:
                self._send(404, '{"error":"없음"}')
        elif re.fullmatch(r"/skin/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)", self.path):
            _, _, pack, name = self.path.split("/")
            f = SKINS_DIR / pack / name
            ctype = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}[name.rsplit(".", 1)[1]]
            if f.exists():
                self._send(200, f.read_bytes(), ctype)
            else:
                self._send(404, '{"error":"없음"}')
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
            extra = {}
            try:
                p = self.path
                if p == "/api/play":
                    if body.get("pass"):
                        GAME.play("pass")
                    else:
                        GAME.play(to_gtp(int(body["x"]), int(body["y"])))
                elif p == "/api/new":
                    GAME.new(int(body["handicap"]) if "handicap" in body else None, body.get("time", "keep"),
                             body.get("color"))
                    GAME._sync()
                    if GAME.to_move != GAME.user:
                        GAME.engine_move()
                        GAME.save()
                elif p == "/api/score":
                    GAME.start_scoring()
                elif p == "/api/score/toggle":
                    GAME.toggle_dead(int(body["x"]), int(body["y"]))
                elif p == "/api/score/confirm":
                    GAME.confirm_score()
                elif p == "/api/score/cancel":
                    GAME.cancel_score()
                elif p == "/api/hint":
                    extra = {"hint": GAME.hint()}
                elif p == "/api/judge":
                    extra = {"judge": GAME.judge()}
                elif p == "/api/timeout":
                    GAME.timeout(str(body.get("color")))
                elif p == "/api/resign":
                    GAME.resign()
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
            st.update(extra)
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
