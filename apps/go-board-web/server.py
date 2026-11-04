#!/usr/bin/env python3
"""MONK 로컬 바둑판 — KataGo와 클릭으로 두는 웹 바둑판 (해설 봇 MVP 화면 시제품).

표준 라이브러리만 쓴다. 127.0.0.1에만 붙는다(외부 공개 금지).
엔진·모델·대국 기록은 전부 레포 밖 ~/.monkos/katago/ 에 있다.

단계 ①(10-24, ORDER_20261023 방구조): 서버 1개 = 판 1개(전역 GAME)를 걷어내고 방(Room) 단위로 나눴다.
  /            대기실 (새 대국 · 내 진행 중 대국 · 지난 대국)
  /room/{id}   대국실 (지금 화면)
  /api/rooms   방 목록·생성,  /api/rooms/{id}/state|play|…  방 범위 API
단계 ②-1(11-04, 작가님 "테스트로 누구든 아이디 만들고 입장"): 계정·세션(users.json·sessions.json, 로컬 파일) — 방은 만든 사람 것.
  /api/auth/signup|enter|check|ranks|logout|me · /api/me · /api/presence. 로컬호스트 직접 요청은 쿠키 없이 '작가님'(live_view 호환).
방 상태는 수마다 ~/.monkos/go-board/rooms/{id}.json 에 원자적으로 저장되고 서버 기동 시 전부 복원된다.
엔진은 EngineHub(무상태 경계) 뒤에 있다 — 방이 국면을 넘기면 수·분석만 돌려준다.
"""
import base64
import contextlib
import hashlib
import hmac
import http.cookies
import json
import os
import random
import re
import secrets
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = int(os.environ.get("GO_BOARD_PORT", "8765"))
KATA_DIR = Path.home() / ".monkos" / "katago"
KATAGO = KATA_DIR / "katago-ocl"
MAIN_MODEL = KATA_DIR / "kata1-b18c384nbt-s9996604416-d4316597426.bin.gz"
HUMAN_MODEL = KATA_DIR / "b18c384nbt-humanv0.bin.gz"
# 우리 학습 모델(PF_GO, 4060 b10 학습분) — 교체는 이 세 줄만(파일·기보 태그·화면 표기). 11-05 작가님 "대국 테스트할 수 있게"
MONK_MODEL = KATA_DIR / "monk_b10_s41M.bin.gz"  # 4060 eval b10-s41211392-d12492409 (sha256 2ba167f4…)
# 화면 이름 정본(11-05 07:07 작가님 "몽크봇은 몽코스 고로 네이밍") — 이름은 여기 한 곳. 새 판 레벨 키 = "monkos"
BOT_NAME, BOT_NAME_KO = "MONKOS Go", "몽코스 고"
BOT_STAGE = "b10·4,154만"  # 학습 단계(화면 보조 표기) — 모델 교체 때 MONK_MODEL·MONK_TAG와 함께 바꾼다
MONK_TAG = "MONKOS-Go-b10-s41M"  # 기보 PB/PW·파일명 — 학습 단계 식별자 유지
# 옛 판(레벨 "monk", 11-05 05:3x~07:0x) 표기는 그대로 둔다 — 저장된 방·기보를 새 이름으로 바꾸지 않는다(지시서 §1-4)
LEGACY_MONK = {"label": "MONK 봇 (b10·4,154만)", "name": "MONK 봇", "tag": "MONK-b10-s41M"}
BOT_LEVELS = ("monkos", "monk")  # 같은 엔진 — monk는 옛 판 복원용(새 판 선택지에는 없음)
PLAY_CFG = KATA_DIR / "gtp_play.cfg"
HUMAN_CFG = KATA_DIR / "configs" / "gtp_human5k_example.cfg"
HERE = Path(__file__).resolve().parent
# 테스트 모드(run.sh --test): 실사용 포트 금지, 기보는 games/_test/ 로 분리
TEST_MODE = os.environ.get("GO_BOARD_TEST") == "1"
LIVE_PORT = 8765
GAMES_DIR = KATA_DIR / "games" / ("_test" if TEST_MODE else "")
REVIEW_DIR = GAMES_DIR / "reviews"
# 방 저장소(단계 ① 로컬 — 단계 ⑤에서 Firestore·GCS로 이관, RoomStore 인터페이스만 바꾼다). 테스트는 _test/ 로 분리
ROOMS_DIR = Path.home() / ".monkos" / "go-board" / ("_test" if TEST_MODE else "") / "rooms"
ROOM_ID_RE = r"[A-Za-z0-9_-]{4,64}"
EMPTY_ROOM_TTL = 600  # 빈 방(0수) 정리 기준 초
# 접속 장애(10-24 작가님 "일반적으로는 멈추고 별도 시간으로 접속장애패"): 대국실이 5초마다 ping,
# 마지막 ping 뒤 15초면 '접속 끊김' → 대국 시계 정지 + 접속 장애 시계(내 차례 동안만). 한도 넘기면 접속 장애패
OFFLINE_AFTER = 15
# 10-24 22:04 작가님 "이어두기는 필요없고 제한시간 멈춘 후 5분간 재접속 없으면 접속장애패" — 한도 5분 하나(AI·사람 공통).
# 기존 방은 만들 때 규칙(dcLimit)을 그대로 읽는다. 테스트 인스턴스만 GO_BOARD_DC_LIMIT 로 줄여 시험할 수 있다
DC_LIMIT = 300
if TEST_MODE and os.environ.get("GO_BOARD_DC_LIMIT"):
    DC_LIMIT = int(os.environ["GO_BOARD_DC_LIMIT"])
USER_LAG_GRACE = 2.0  # 서버 시계: 사람 수는 왕복 지연(터널 ~1초)만큼 덜 깎는다 — 화면 시계보다 먼저 시간패가 나지 않게
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
HANDICAP_KOMI = 0.5  # 한국 규칙 관행 — 접바둑은 덤 0.5
HANDICAPS = [0] + list(range(2, 10))  # 0 = 호선
# KataGo fixed_handicap 대신 쓰는 배치 — 3점은 한국·일본 관행(우상·좌하·우하, 빈 귀=좌상). 쌍아 결정 10-23
FIXED_SETUP = {3: ["Q16", "D4", "Q4"]}
COLS = "ABCDEFGHJKLMNOPQRST"  # GTP 좌표 — I 없음
# 공통: 한국 규칙·흑 기준 수치 보고. 최강은 1500 visits + 17초 상한(초읽기 20초 안 — 10-23 타이젬 P9단 대등선 실측, 작가님 지시).
COMMON_OVR = f"rules=korean,reportAnalysisWinratesAs=BLACK,logDir={KATA_DIR / 'gtp_logs'}"
STRONG_VISITS, STRONG_TIME = 1500, 17
STRONG_OVR = COMMON_OVR + f",maxVisits={STRONG_VISITS},maxTime={STRONG_TIME}"
MONK_OVR = STRONG_OVR  # MONK 봇 = 최강과 같은 수읽기(11-05 작가님 "1500수읽기로 동일하게") — 사본 숫자 금지
def bot_sgf(level):
    """기보 PB/PW 상대 이름 — 모델 태그+수읽기(학습 단계별 비교용). 옛 판은 옛 태그."""
    return f"{LEGACY_MONK['tag'] if level == 'monk' else MONK_TAG}({STRONG_VISITS}v)"
# 승률 그래프(기보 감상) — 국면당 짧은 분석. 10-24 실측: 200방문 0.2~1.1초/국면
GRAPH_VISITS, GRAPH_MAX_TIME = 200, 0.8  # 한 걸음 상한 0.8초 = 대국 요청이 기다리는 최대치(양보 +1초 이내)
GRAPH_YIELD_GAP = 0.5  # 대국 요청 뒤 그래프가 비켜 있는 초 — 착수 1번의 검사·응수 사이에 끼지 않게
GRAPH_IDLE = 15  # 마지막 그래프 요청 뒤 이 초가 지나면 = 보는 화면 없음 → 그 수를 마치고 멈춘다(10-25 보는 곳에서만)
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
        self.lock = threading.Lock()  # GTP 명령 1개 단위
        self.job = threading.Lock()  # 국면 맞추기 + 계산 1건 단위(EngineHub 줄 세우기)
        self.key = None  # 엔진이 지금 들고 있는 국면 — 같으면 다시 맞추지 않는다
        self.profile = None  # 급수 엔진에 마지막으로 건 humanSL 프로필
        self.waiting = 0  # 줄에 선 대국 요청 수(EngineHub._job)
        self.last_game = 0.0  # 마지막 대국 요청이 엔진을 놓은 시각
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

    def sync(self, moves, setup=(), komi=KOMI):
        """판을 처음부터 다시 맞춘다 — 치석(setup)은 방이 가진 좌표를 그대로 놓는다(엔진은 국면을 기억하지 않는다)."""
        with self.lock:
            self._cmd("clear_board")
            self._cmd(f"komi {komi}")
            if setup:
                self._cmd("set_free_handicap " + " ".join(setup))
            for c, mv in moves:
                self._cmd(f"play {c} {mv}")

    def handicap_setup(self, handicap):
        """표준 화점 치석 좌표(fixed_handicap). 3점은 FIXED_SETUP 관행 배치."""
        if not handicap:
            return []
        if handicap in FIXED_SETUP:
            return list(FIXED_SETUP[handicap])
        with self.lock:
            self._cmd("clear_board")
            return self._cmd(f"fixed_handicap {handicap}").split()

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
    monk, monk_reason = None, None
    if not MONK_MODEL.exists():
        monk_reason = f"MONK 모델 없음 — {MONK_MODEL.name}을 {KATA_DIR}에 둬야 함"
    elif not KATAGO.exists():
        monk_reason = f"엔진 실행 파일 없음: {KATAGO}"
    else:
        monk = Engine("MONK", [str(KATAGO), "gtp", "-config", str(PLAY_CFG),
                              "-model", str(MONK_MODEL), "-override-config", MONK_OVR])
    return strong, human, human_reason, monk, monk_reason


def level_ok(level):
    return level == "strong" or level in BOT_LEVELS or level in RANKS


class EngineHub:
    """엔진 무상태 경계(단계 ①) — 방이 국면(position)과 설정(level)을 넘기면 수·분석만 돌려준다.
    방 상태는 여기 없다. 지금은 이 iMac의 KataGo GTP 프로세스 2개(최강·급수)이고, 동시 요청은 엔진별
    job 잠금으로 줄 세운다(다른 방 상태 조회는 잠금 밖). 엔진 주소 교체(RunPod·4060)는 이 클래스만 바꾼다.
    position = {"moves": [(색, 수)…], "setup": [치석…], "komi": 덤}"""

    def __init__(self, strong, human, human_reason, monk=None, monk_reason=None):
        self.strong, self.human, self.human_reason = strong, human, human_reason
        self.monk, self.monk_reason = monk, monk_reason  # MONK 봇 — 착수·착수 검사만. 판정·힌트·그래프는 최강
        self.wait_lock = threading.Lock()
        self.waits = []  # 대국 요청이 엔진 줄에서 기다린 초(최근 50) — 그래프 계산 양보 실측용

    @contextlib.contextmanager
    def _job(self, e, record=True):
        """대국 요청(수·검사·판정) — 줄에 섰다고 표시해 두면 그래프 계산(quick)이 다음 수를 미룬다."""
        with self.wait_lock:
            e.waiting += 1
        t0 = time.time()
        e.job.acquire()
        with self.wait_lock:
            e.waiting -= 1
            if record:  # 대국 요청이 기다린 초 — /health engineWaits
                self.waits = (self.waits + [round(time.time() - t0, 3)])[-50:]
        try:
            yield
        finally:
            e.last_game = time.time()
            e.job.release()

    def quick(self, pos, color, rules="korean", visits=None, urgent=False):
        """짧은 분석 1국면 — (흑 승률, 흑 기준 집 차이). 그래프 계산(urgent=False)은 줄에 선 요청이 있으면 먼저 보낸다.
        urgent=True(시험수 평가 — 사람이 기다림)는 대국 요청처럼 줄에 서서 그래프 계산보다 먼저 받는다."""
        e = self._pick("strong")
        if not urgent:  # 줄에 선 요청이 있거나 대국 요청 직후 0.5초(검사→응수 사이)면 비켜 있는다
            while e.waiting or time.time() - e.last_game < GRAPH_YIELD_GAP:
                time.sleep(0.05)
        with (self._job(e, record=False) if urgent else e.job):
            try:
                if rules != "korean":
                    e.cmd(f"kata-set-rules {rules}")
                    e.key = None
                e.cmd(f"kata-set-param maxVisits {visits or GRAPH_VISITS}")
                e.cmd(f"kata-set-param maxTime {GRAPH_MAX_TIME}")
                self._sync(e, pos)
                c = e.search(color, 1)
            finally:  # 대국 설정으로 되돌린다(최강 1500·17초, 한국 규칙)
                e.cmd(f"kata-set-param maxVisits {STRONG_VISITS}")
                e.cmd(f"kata-set-param maxTime {STRONG_TIME}")
                if rules != "korean":
                    e.cmd("kata-set-rules korean")
                    e.key = None
        return (c[0]["winrate"], c[0]["score"]) if c else (None, None)

    def _pick(self, level):
        if level in BOT_LEVELS:
            e, why, name = self.monk, self.monk_reason, BOT_NAME
        else:
            e = self.strong if level == "strong" else self.human
            why, name = self.human_reason, ("최강" if level == "strong" else "급수")
        if e is None or not e.ok:
            raise RuntimeError((e.error if e else why) or f"{name} 엔진이 꺼져 있음")
        return e

    @staticmethod
    def _judge(level):
        """판정·계가 엔진 — MONK 봇 판은 최강이 맡는다(상대 엔진이 해설까지 하면 시험이 섞인다)."""
        return "strong" if level in BOT_LEVELS else level

    @staticmethod
    def _key(pos):
        return (pos["komi"], tuple(pos["setup"]), tuple(tuple(m) for m in pos["moves"]))

    def _sync(self, e, pos):
        key = self._key(pos)
        if e.key == key:
            return key
        e.key = None
        e.sync(pos["moves"], pos["setup"], pos["komi"])
        e.key = key
        return key

    def _profile(self, e, level):
        if level != "strong" and level not in BOT_LEVELS and e.profile != level:
            e.cmd(f"kata-set-param humanSLProfile rank_{level}")
            e.profile = level

    def setup(self, handicap):
        e = self._pick("strong")
        with self._job(e):
            e.key = None
            return e.handicap_setup(handicap)

    def check_level(self, level):
        e = self._pick(level)
        with self._job(e):
            self._profile(e, level)

    def legal(self, pos, level, color, mv):
        """둘 수 있는 자리인지(자충·패) — 엔진에 놓아 본다. 놓이면 엔진 국면도 그만큼 앞선다."""
        e = self._pick(level)
        with self._job(e):
            key = self._sync(e, pos)
            try:
                e.cmd(f"play {color} {mv}")
            except RuntimeError:
                raise RuntimeError("둘 수 없는 자리입니다 (자충·패 등).")
            e.key = (key[0], key[1], key[2] + ((color, mv),))

    def move(self, pos, level, color):
        """engine.move — (수, 흑 기준 점수, 흑 승률)."""
        e = self._pick(level)
        with self._job(e):
            key = self._sync(e, pos)
            self._profile(e, level)
            try:
                mv, score, wr = e.genmove(color)
            except RuntimeError:
                e.key = None
                raise
            e.key = key if mv.lower() == "resign" else (key[0], key[1], key[2] + ((color, mv),))
            return mv, score, wr

    def analyze(self, pos, color, top=3):
        """engine.analyze — 후보 상위 N(늘 최강 엔진)."""
        e = self._pick("strong")
        with self._job(e):
            self._sync(e, pos)
            return e.search(color, top)

    def final_score(self, pos, level):
        e = self._pick(self._judge(level))
        with self._job(e):
            self._sync(e, pos)
            return e.cmd("final_score")

    def scoring(self, pos, level):
        """계가 재료 — 사석·KataGo 판정(11-04: 소유권 추정 폐지)."""
        e = self._pick(self._judge(level))
        with self._job(e):
            self._sync(e, pos)
            dead = {to_xy(mv) for mv in e.cmd("final_status_list dead").split()}
            return {"dead": dead, "kata": e.cmd("final_score")}

    @property
    def human_ok(self):
        return self.human is not None and self.human.ok

    def human_why(self):
        return None if self.human_ok else ((self.human.error if self.human else self.human_reason) or "급수 엔진이 꺼져 있음")

    @property
    def monk_ok(self):
        return self.monk is not None and self.monk.ok

    def monk_why(self):
        return None if self.monk_ok else ((self.monk.error if self.monk else self.monk_reason) or f"{BOT_NAME} 엔진이 꺼져 있음")


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


# ---------------------------------------------------------------- 시계(서버 정본 — 화면은 이 값을 받아 이어서 잰다)

def make_clock(t):
    return {"main": t["main"] * 60.0, "period": float(t["byo"]), "left": t["periods"], "inByo": t["main"] == 0}


def charge_clock(c, t, dt, is_user):
    """dt초를 깎는다. 마지막 초읽기를 넘기면 사람은 0초(화면이 시간패를 알린다), 엔진은 1초에 멈춘다(시간패 없음)."""
    if dt <= 0:
        return
    if not c["inByo"]:
        c["main"] -= dt
        if c["main"] > 0:
            return
        dt, c["main"], c["inByo"], c["period"] = -c["main"], 0.0, True, float(t["byo"])
    c["period"] -= dt
    while c["period"] <= 0:
        if c["left"] <= 1:
            c["left"], c["period"] = 1, (0.0 if is_user else 1.0)
            return
        c["left"] -= 1
        c["period"] += t["byo"]


# ---------------------------------------------------------------- 방 잠금(보유자 추적) — 10-24 첫 수 busy 진단

TEST_SLOW_PING = float(os.environ.get("GO_BOARD_TEST_SLOW_PING") or 0) if TEST_MODE else 0.0
LOCK_WAIT = 5.0  # 엔진이 생각 중이 아닌 보유자(조회·ping·감시 저장 등)면 착수가 이만큼 기다렸다 처리
SLOW_HOLD = 3.0  # 엔진 생각이 아닌데 이보다 오래 잡으면 이벤트로 남긴다
THINK_ACTIONS = ("play", "engine", "undo", "swap", "level", "score", "hint", "judge")  # 엔진이 이 방 국면을 계산하는 동작


class RoomLock:
    """방 잠금 + 지금 누가(동작 이름) 언제부터 잡고 있는지. busy 거부 때 그대로 기록한다."""

    def __init__(self, rid):
        self.rid = rid
        self._lock = threading.Lock()
        self.holder = None  # (동작 이름, 잡은 시각)

    def acquire(self, blocking=True, timeout=-1, name="?"):
        ok = self._lock.acquire(blocking, timeout) if blocking else self._lock.acquire(False)
        if ok:
            self.holder = (name, time.time())
        return ok

    def release(self):
        name, since = self.holder or ("?", time.time())
        held = time.time() - since
        self.holder = None
        self._lock.release()
        if held > SLOW_HOLD and name not in THINK_ACTIONS and EVENTS:
            EVENTS.add(self.rid, action="slow-lock", holder=name, heldMs=round(held * 1000))

    def held_info(self):
        h = self.holder
        return {"holder": h[0], "heldMs": round((time.time() - h[1]) * 1000)} if h else {"holder": None}

    @contextlib.contextmanager
    def hold(self, name):
        self.acquire(name=name)
        try:
            yield
        finally:
            self.release()


# ---------------------------------------------------------------- 계정·세션 (11-04 작가님 — 테스트 아이디 개방, 단계 ②-1)
# 11-04 작가님 — 아이디+희망 급수 가입, 인증 차후: 비밀번호는 없다(테스트 기간엔 아이디만으로 입장). 사람은 없어도 누구든 아이디를
# 만들어 들어올 수 있게 연다(채팅·초청을 위한 사용자 구분 선행). 저장은 로컬 파일 — 단계 ⑤에서 Firestore, 인증은 단계 ③ 이후
# Access/정식 인증으로 바뀐다. 세션 토큰·인수 코드 값은 로그·응답에 내지 않는다.
ADMIN_NICK = "작가님"  # 예약 닉네임 — 기존 사용자(방 전부의 주인). 입장·가입 때 인수 코드가 필요하다
ADMIN_UID = "admin"  # 작가님 계정의 고정 uid — owner 없는 옛 방은 읽을 때 이 uid 소유로 본다(파일은 다시 쓰지 않음)
NICK_RE = re.compile(r"[가-힣A-Za-z0-9_]{2,12}")
SIGNUP_RANKS = RANKS[RANKS.index("18k"):RANKS.index("5d") + 1]  # 희망 급수: 18급~5단(설계서 '초기 설정 최대 5단')
SESSION_TTL = 365 * 24 * 3600  # 쿠키·세션 1년
COOKIE_NAME = "gb_s"
PRESENCE_TTL = 30  # 대기실·대국실에서 이 초 안에 신호가 있으면 접속 중
RATE_MAX, RATE_WINDOW = 30, 60  # 가입·입장·중복 확인: IP별 1분 30회
USERS_FILE = ROOMS_DIR.parent / "users.json"
SESSIONS_FILE = ROOMS_DIR.parent / "sessions.json"
CLAIM_FILE = ROOMS_DIR.parent / "admin_claim.txt"
NICK_RULE = "아이디는 2~12자의 한글·영문·숫자·_ 만 쓸 수 있습니다"
CLAIM_FAIL = "인수 코드가 맞지 않습니다 — 서버의 인수 코드 파일 값을 확인해 주세요"


def write_json_atomic_text(path, text):
    """텍스트 파일 원자적 저장, 권한 600 — 인수 코드 파일용."""
    tmp = path.with_name("." + path.name + ".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(text)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def rank_ko(r):
    return RANK_KO.get(r) if r else None


def write_json_atomic(path, obj):
    """임시 파일 → rename(원자적), 권한 600 — 계정·세션 파일용."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name("." + path.name + ".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def read_json(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default
    except (OSError, ValueError) as e:
        print(f"❌ go-board: {path.name} 읽기 실패 — {e}", file=sys.stderr, flush=True)
        return default


class Auth:
    """계정(users.json)·세션(sessions.json, 토큰의 sha256만)·접속 신호(메모리)·가입/입장/확인 횟수 제한(메모리)."""

    def __init__(self):
        self.lock = threading.Lock()
        self.users = read_json(USERS_FILE, {}).get("users", [])
        self.sessions = read_json(SESSIONS_FILE, {})
        self.seen = {}  # uid → (마지막 신호 시각, 'lobby' | 'room')
        self.hits = {}  # ip → 요청 시각들
        if any("pw" in u for u in self.users):  # 비밀번호 폐지 — 단계 ②-1 초판의 해시 필드를 떨군다
            for u in self.users:
                u.pop("pw", None)
            self._save_users()

    # ---- 관리자 인수 코드: 입장·가입 때마다 1회용. 쓰고 나면 새 코드를 파일에 다시 쓴다(값은 로그에 내지 않음, 경로만)
    def write_claim(self):
        CLAIM_FILE.parent.mkdir(parents=True, exist_ok=True)
        write_json_atomic_text(CLAIM_FILE, secrets.token_hex(4) + "\n")
        print(f"✅ go-board: 인수 코드 파일 갱신: {CLAIM_FILE}", flush=True)

    def ensure_claim(self):
        if not CLAIM_FILE.exists():
            self.write_claim()
        else:
            print(f"✅ go-board: 인수 코드 파일: {CLAIM_FILE}", flush=True)

    def _claim_ok(self, claim):
        try:
            code = CLAIM_FILE.read_text(encoding="utf-8").strip()
        except OSError:
            code = ""
        return bool(code) and hmac.compare_digest(str(claim or "").strip().encode(), code.encode())

    def _save_users(self):
        write_json_atomic(USERS_FILE, {"users": self.users})

    def _save_sessions(self):
        write_json_atomic(SESSIONS_FILE, self.sessions)

    def _find(self, nick):
        return next((u for u in self.users if u["nick"].casefold() == nick.casefold()), None)

    def get(self, uid):
        return next((u for u in self.users if u["uid"] == uid), None)

    def nick(self, uid):
        u = self.get(uid)
        return u["nick"] if u else (ADMIN_NICK if uid == ADMIN_UID else "알 수 없음")

    def rank(self, uid):
        u = self.get(uid)
        return u.get("rank") if u else None

    def display_name(self, uid):
        """사람 표기 정본 — "신작가 6단"(닉 + 기력, rank_ko 형식). 기력이 없으면 닉만.
        11-05 07:12 작가님 "대기실에 아이디에 신작가 6단 식으로 기력 표기". 화면의 사람 이름은 전부 이 값을 쓴다
        (대기실 접속자·내 이름·방 목록·대국자 칸). 기보 PB/PW·파일명은 기록이라 닉 그대로(owner_nick)."""
        r = rank_ko(self.rank(uid))
        return f"{self.nick(uid)} {r}" if r else self.nick(uid)

    def rate_ok(self, ip):
        now = time.time()
        with self.lock:
            h = [t for t in self.hits.get(ip, []) if now - t < RATE_WINDOW]
            ok = len(h) < RATE_MAX
            if ok:
                h.append(now)
            self.hits[ip] = h
            if len(self.hits) > 2000:  # 오래된 IP 정리
                self.hits = {k: v for k, v in self.hits.items() if v and now - v[-1] < RATE_WINDOW}
            return ok

    def check(self, nick):
        """아이디 중복 확인 → (상태, 문구). 상태: ok | taken | bad. 작가님은 계정이 없어도 인수 코드로 가입(화면이 claim 표시를 본다)."""
        nick = str(nick or "").strip()
        if not NICK_RE.fullmatch(nick):
            return "bad", NICK_RULE
        with self.lock:
            if self._find(nick):
                return "taken", "이미 있는 아이디입니다"
        return "ok", "사용할 수 있는 아이디입니다"

    def signup(self, nick, rank, claim):
        """(사용자, 오류문구). 희망 급수는 필수(18급~5단)."""
        nick = str(nick or "").strip()
        if not NICK_RE.fullmatch(nick):
            return None, NICK_RULE
        if rank not in SIGNUP_RANKS:
            return None, "희망 급수를 골라 주세요 (18급~5단)"
        with self.lock:
            if self._find(nick):
                return None, "이미 있는 아이디입니다"
            uid = "u-" + secrets.token_hex(6)
            admin = nick.casefold() == ADMIN_NICK.casefold()
            if admin:
                if not self._claim_ok(claim):
                    return None, CLAIM_FAIL
                uid, nick = ADMIN_UID, ADMIN_NICK
            u = {"uid": uid, "nick": nick, "rank": rank, "created": datetime.now().isoformat(timespec="seconds")}
            self.users.append(u)
            self._save_users()
            if admin:
                self.write_claim()  # 쓴 코드는 버리고 새 코드 — 다른 기기에서 다시 입장하려면 새 코드가 필요
        return {"uid": u["uid"], "nick": u["nick"]}, None

    def enter(self, nick, claim):
        """(사용자, 오류문구). 테스트 기간엔 아이디만으로 입장 — 작가님만 인수 코드."""
        nick = str(nick or "").strip()
        with self.lock:
            u = self._find(nick) if NICK_RE.fullmatch(nick) else None
            if not u:
                return None, "없는 아이디입니다 — 먼저 아이디를 만들어 주세요"
            if u["uid"] == ADMIN_UID:
                if not self._claim_ok(claim):
                    return None, CLAIM_FAIL
                self.write_claim()
        return {"uid": u["uid"], "nick": u["nick"]}, None

    def set_rank(self, uid, rank):
        if rank not in SIGNUP_RANKS:
            return "희망 급수를 골라 주세요 (18급~5단)"
        with self.lock:
            u = self.get(uid)
            if not u:
                return "계정이 없습니다"
            u["rank"] = rank
            self._save_users()
        return None

    def new_session(self, uid):
        tok = secrets.token_urlsafe(32)
        now = time.time()
        with self.lock:
            self.sessions = {k: v for k, v in self.sessions.items() if v["exp"] > now}
            self.sessions[hashlib.sha256(tok.encode()).hexdigest()] = {"uid": uid, "exp": now + SESSION_TTL}
            self._save_sessions()
        return tok

    def user_of(self, tok):
        if not tok:
            return None
        with self.lock:
            s = self.sessions.get(hashlib.sha256(tok.encode()).hexdigest())
            if not s or s["exp"] <= time.time():
                return None
            u = next((u for u in self.users if u["uid"] == s["uid"]), None)
        return {"uid": u["uid"], "nick": u["nick"]} if u else None

    def end_session(self, tok):
        if not tok:
            return
        with self.lock:
            if self.sessions.pop(hashlib.sha256(tok.encode()).hexdigest(), None):
                self._save_sessions()

    def is_admin_nick(self, nick):
        return str(nick or "").strip().casefold() == ADMIN_NICK.casefold()

    def touch(self, uid, where):
        self.seen[uid] = (time.time(), where)

    def people(self, me_uid):
        """접속 중(최근 30초 신호) 사람 — 닉네임 + 대기실/대국 중. uid 는 내보내지 않는다."""
        now = time.time()
        out = [{"nick": self.nick(uid), "rank": rank_ko(self.rank(uid)), "display": self.display_name(uid), "state": "대국 중" if w == "room" else "대기실", "me": uid == me_uid}
               for uid, (t, w) in list(self.seen.items()) if now - t <= PRESENCE_TTL]
        return sorted(out, key=lambda p: (not p["me"], p["nick"].casefold()))


AUTH = None  # Auth


def my_stats(uid):
    """마이페이지 AI 대국 전적 — 내 방 중 대국(불러온 SGF 기보 제외, 단계 ① 이전 대국은 포함)의 결과 집계. 끝나지 않은 판은 세지 않는다."""
    total = {"win": 0, "loss": 0, "void": 0}
    by = {}
    for r in ROOMS.listing(uid):
        if r.source == "upload" or not r.result:
            continue
        if r.result == VOID:
            k = "void"
        elif r.result[0] in "BW":
            k = "win" if r.result[0] == r.user else "loss"
        else:
            continue
        total[k] += 1
        if k != "void":
            row = by.setdefault(r.level, {"level": r.level, "label": r.level_label(), "win": 0, "loss": 0})
            row[k] += 1
    rows = sorted(by.values(), key=lambda x: (x["level"] != "strong", RANKS.index(x["level"]) if x["level"] in RANKS else 99))
    return {"total": total, "byLevel": rows}


# ---------------------------------------------------------------- 방(대국 상태)

STATUS_KO = {"waiting": "대기", "playing": "대국", "ended": "종료"}


class Room:
    """방 1개 = 판 1개. 종류는 단계 ①에서 'ai'만(초청·강의는 단계 ③④). 엔진은 ENGINES(무상태)로만 부른다."""

    def __init__(self, rid):
        self.id = rid
        self.kind = "ai"
        self.lock = RoomLock(rid)
        self.thinking = False  # 엔진이 이 방 국면으로 수·검사·분석을 계산하는 중(THINK_ACTIONS) — 이때만 착수를 거부
        self.cache = None  # 마지막 상태 JSON(엔진 생각 중 조회용)
        self.user = "B"
        self.level = "strong"  # 'strong' | 랭크 문자열('5k' 등)
        self.handicap = 0
        self.time = dict(DEFAULT_TIME)  # None = 무제한
        self.setup = []  # 치석 좌표
        self.moves = []
        self.scores = []  # (수 번호, 흑 기준 점수)
        self.score = None
        self.winrate = None
        self.result = None
        self.final_count = None
        self.scoring = None  # 계가 중이면 {"dead": set((x, y)), "kata": KataGo final_score}
        self.message = ""
        self.started = datetime.now()
        self.updated = time.time()
        self.sgf_path = GAMES_DIR / f"{self.started:%Y%m%d_%H%M%S}_작가님_vs_KataGo.sgf"
        self.clock = None  # {"B": {...}, "W": {...}} — time 이 None 이면 None
        self.turn_since = time.time()
        self.reviews = []  # 리뷰 job id (REVIEWS.jobs)
        self.imported = False  # 단계 ① 이전 SGF에서 가져온 지난 대국
        # 접속 장애 — seen: 마지막 ping(잠금 없이 갱신), offline: 끊김 판정, dc_used/dc_mark: 이번 끊김에 쓴 장애 시간
        self.dc_limit = DC_LIMIT
        self.seen = time.time()
        self.offline = False
        self.dc_used = 0.0
        self.dc_mark = None  # 장애 시계가 도는 중이면 그 시작 시각
        self.dc_saved = 0.0
        self.result_reason = None  # 'disconnect' = 접속 장애패
        # 불러온 기보(10-24 기보 감상) — source 'upload' 이면 대국자·덤·규칙을 기보 값 그대로
        self.source = None
        self.orig_name = None
        self.players = None  # {"B": 이름, "W": 이름, "BR": 급단, "WR": 급단}
        self.rules = "korean"
        self.record_date = None
        self.komi_value = None
        self.owner = ADMIN_UID  # 11-04 작가님 — 방 주인(uid). 필드 없는 옛 방은 '작가님' 계정 소유(읽을 때 기본값)

    @property
    def owner_nick(self):
        return AUTH.nick(self.owner) if AUTH else ADMIN_NICK

    @property
    def owner_display(self):
        """화면 표기(닉 + 기력) — Auth.display_name 경유. 기보·파일명은 owner_nick."""
        return AUTH.display_name(self.owner) if AUTH else ADMIN_NICK

    # ---- 만들기·저장

    @classmethod
    def create(cls, level, handicap, time_ctl, color, owner=ADMIN_UID):
        rid = f"{datetime.now():%Y%m%d-%H%M%S}-{secrets.token_hex(2)}"
        r = cls(rid)
        r.owner = owner
        level = "monkos" if level == "monk" else level  # 새 판은 새 이름(옛 화면 캐시가 'monk'를 보내도)
        r.sgf_path = GAMES_DIR / f"{r.started:%Y%m%d_%H%M%S}_{r.owner_nick}_vs_{MONK_TAG if level == 'monkos' else 'KataGo'}.sgf"
        if not level_ok(level):
            raise RuntimeError("알 수 없는 수준")
        if level != "strong":
            ENGINES.check_level(level)
        r.level = level
        r.time = parse_time(time_ctl)
        if handicap not in HANDICAPS:
            raise RuntimeError("치수는 호선 또는 2~9점입니다.")
        r.handicap = handicap
        if handicap:  # 11-04 작가님 — 접바둑 백(상수) 선택 허용, 돌 가림은 접바둑에 무의미해 흑
            r.user = color if color in ("B", "W") else "B"
        elif color in ("B", "W"):
            r.user = color
        elif color == "auto":  # 돌 가림
            r.user = random.choice("BW")
            r.message = f"돌 가림 결과 — {r.owner_nick} {'흑(먼저 둠)' if r.user == 'B' else '백'}"
        r.setup = ENGINES.setup(handicap)
        if r.sgf_path.exists():  # 같은 초에 두 방 — 기보 이름 겹침 방지
            r.sgf_path = r.sgf_path.with_name(f"{r.sgf_path.stem}_{rid[-4:]}.sgf")
        r.clock = {"B": make_clock(r.time), "W": make_clock(r.time)} if r.time else None
        return r

    def to_dict(self):
        sc = None
        if self.scoring:
            sc = {"dead": sorted(self.scoring["dead"]), "kata": self.scoring["kata"]}
        return {"v": 1, "id": self.id, "owner": self.owner, "kind": self.kind, "user": self.user, "level": self.level,
                "handicap": self.handicap, "time": self.time, "setup": self.setup,
                "moves": [list(m) for m in self.moves], "scores": [list(s) for s in self.scores],
                "score": self.score, "winrate": self.winrate, "result": self.result, "finalCount": self.final_count,
                "scoring": sc, "message": self.message, "started": self.started.isoformat(timespec="seconds"),
                "updated": self.updated, "sgf": str(self.sgf_path), "clock": self.clock,
                "reviews": [REVIEWS.dump(j) for j in self.reviews if j in REVIEWS.jobs], "imported": self.imported,
                "dcLimit": self.dc_limit, "offline": self.offline, "dcUsed": round(self.dc_spent(), 2),
                "dcCounting": self.dc_mark is not None, "resultReason": self.result_reason,
                "source": self.source, "origName": self.orig_name, "players": self.players, "rules": self.rules,
                "recordDate": self.record_date, "komiValue": self.komi_value}

    @classmethod
    def from_dict(cls, d):
        r = cls(d["id"])
        r.kind = d.get("kind", "ai")
        r.owner = d.get("owner") or ADMIN_UID  # 11-04 owner 없는 옛 방 = 작가님 계정 소유
        r.user, r.level, r.handicap, r.time = d["user"], d["level"], d["handicap"], d["time"]
        r.setup = list(d.get("setup") or [])
        r.moves = [tuple(m) for m in d.get("moves") or []]
        r.scores = [tuple(s) for s in d.get("scores") or []]
        r.score, r.winrate, r.result = d.get("score"), d.get("winrate"), d.get("result")
        r.final_count = d.get("finalCount")
        sc = d.get("scoring")
        r.scoring = {"dead": {tuple(p) for p in sc["dead"]}, "kata": sc["kata"]} if sc else None
        r.message = d.get("message", "")
        r.started = datetime.fromisoformat(d["started"])
        r.updated = d.get("updated", time.time())
        r.sgf_path = Path(d["sgf"])
        r.clock = d.get("clock")
        r.turn_since = time.time()  # 서버가 꺼져 있던 시간은 깎지 않는다
        r.imported = d.get("imported", False)
        r.dc_limit = d.get("dcLimit", 24 * 3600)  # 기존 방: 만들 때 한도 유지(필드 없던 10-24 이전 방 = 당시 기본 24시간)
        r.result_reason = d.get("resultReason")
        r.source, r.orig_name, r.players = d.get("source"), d.get("origName"), d.get("players")
        if r.players:  # 이미 불러온 기보의 숫자 급단 코드도 표시는 급단으로(K2 — 파일은 다음 저장 때 반영)
            r.players = {**r.players, "BR": tygem_rank(r.players.get("BR")), "WR": tygem_rank(r.players.get("WR"))}
        r.rules, r.record_date, r.komi_value = d.get("rules") or "korean", d.get("recordDate"), d.get("komiValue")
        # 서버가 꺼져 있던 시간은 장애 시계에도 깎지 않는다 — 쓴 만큼만 들고 지금부터 다시 센다
        r.offline, r.dc_used = d.get("offline", False), d.get("dcUsed", 0.0)
        r.dc_mark = time.time() if d.get("dcCounting") else None
        r.seen = time.time()  # 접속해 있던 대국자는 재기동 뒤 OFFLINE_AFTER 안에 ping 이 다시 온다
        for j in d.get("reviews") or []:
            r.reviews.append(REVIEWS.restore(j, r.id))
        return r

    # ---- 판 정보

    @property
    def komi(self):
        if self.komi_value is not None:  # 불러온 기보는 기보의 덤
            return self.komi_value
        return HANDICAP_KOMI if self.handicap else KOMI

    @property
    def to_move(self):
        first = "W" if self.handicap else "B"  # 접바둑은 백(상수)이 먼저
        if len(self.moves) % 2 == 0:
            return first
        return "B" if first == "W" else "W"

    @property
    def eng_color(self):
        return "W" if self.user == "B" else "B"

    @property
    def status(self):
        if self.result or self.imported:
            return "ended"
        return "playing" if self.moves else "waiting"

    def position(self):
        return {"moves": self.moves, "setup": self.setup, "komi": self.komi}

    def opp_short(self):
        """대국 화면·결과 문구의 상대 짧은 이름."""
        return BOT_NAME if self.level == "monkos" else LEGACY_MONK["name"] if self.level == "monk" else "KataGo"

    def opp_name(self):
        """기보·대국자 표기의 상대 이름 — MONK 봇은 모델 태그+수읽기(학습 단계별 비교용)."""
        return bot_sgf(self.level) if self.level in BOT_LEVELS else f"KataGo({self.level_label()})"

    def level_label(self):
        if self.source == "upload":
            p = self.players or {}
            rk = lambda c: f"({p.get(c + 'R')})" if p.get(c + "R") else ""
            return f"흑 {p.get('B', '흑')}{rk('B')} vs 백 {p.get('W', '백')}{rk('W')}"
        if self.level == "monkos":
            return BOT_NAME
        if self.level == "monk":
            return LEGACY_MONK["label"]
        return "KataGo 최강" if self.level == "strong" else f"KataGo {RANK_KO[self.level]}"  # 10-24 표기 단순화(옛 '사람형 N단')

    # ---- 시계: 차례가 바뀔 때마다 둔 쪽을 깎고, 초읽기면 그 회를 처음부터

    def _running(self):
        if self.result or self.scoring or not self.clock:
            return None
        c = self.to_move
        return None if (c == self.user and self.offline) else c  # 접속이 끊긴 대국자의 시계는 멈춘다

    # ---- 접속 장애: 대국 시계 대신 장애 시계(내 차례 동안만). 다시 들어오면 리셋, 한도 넘기면 접속 장애패

    def _ongoing(self):
        # 11-04 원인 수정: 계가 중(scoring)을 '진행 중 아님'으로 보던 탓에 계가 화면에서 떠난 판은 끊김 판정·장애패가 영영 안 났다
        # (2030·df13 실측). 계가 중에도 접속 판정은 돈다 — 시계는 계가 중 정지(_running)라 장애 시계만 흐른다
        return not (self.result or self.imported)

    def dc_spent(self, now=None):
        return self.dc_used + ((now or time.time()) - self.dc_mark if self.dc_mark is not None else 0.0)

    def dc_left(self, now=None):
        return max(0.0, self.dc_limit - self.dc_spent(now))

    def _dc_update(self, now):
        counting = self.offline and self._ongoing() and (self.to_move == self.user or bool(self.scoring))  # 계가 중엔 차례 무관
        if counting and self.dc_mark is None:
            self.dc_mark = max(now, self.turn_since)
        elif not counting and self.dc_mark is not None:
            self.dc_used, self.dc_mark = self.dc_spent(now), None

    def presence(self, now=None):
        """끊김 판정·장애 시계 진행 — room.lock 을 잡고 부른다. 저장할 변화가 있으면 True."""
        now = now or time.time()
        changed = False
        if not self.offline and now - self.seen > OFFLINE_AFTER and self._ongoing():
            off = self.seen + OFFLINE_AFTER  # 끊긴 시각 = 마지막 ping + 15초 — 그때까지만 대국 시계를 깎는다
            c = self._running()
            if c == self.user and off > self.turn_since:
                charge_clock(self.clock[c], self.time, off - self.turn_since, True)
                self.turn_since = off
            self.offline, changed = True, True
            self._dc_update(off)
        self._dc_update(now)
        if self.dc_mark is not None and self.dc_left(now) <= 0:
            self.dc_used, self.dc_mark = float(self.dc_limit), None
            self.scoring = None
            self.result = f"{self.eng_color}+F"
            self.result_reason = "disconnect"
            self.message = f"접속 장애패 — 접속이 끊긴 채 한도({fmt_dur(self.dc_limit)})를 넘겼습니다."
            self.save_sgf()
            changed = True
        if self.dc_mark is not None and now - self.dc_saved > 10:  # 장애 시계 진행을 10초마다 남긴다(재기동 시 오차 ≤10초, 대국자 쪽 유리)
            self.dc_saved, changed = now, True
        return changed

    def heartbeat(self, now=None):
        """대국실 ping·대국자 동작 — 끊겨 있었으면 장애 시계 리셋, 대국 시계는 남은 시간 그대로 재개."""
        now = now or time.time()
        self.presence(now)
        self.seen = now
        if self.offline:
            self.offline = False
            self._dc_update(now)
            self.dc_used = 0.0
            self.turn_since = now  # 안내 문구는 두지 않는다 — 앱 복귀마다 한 줄이 생겨 하단 버튼이 흔들림(모바일 고정 화면)
            return True
        return False

    def dc_state(self, now=None):
        now = now or time.time()
        return {"limit": self.dc_limit, "offline": self.offline, "counting": self.dc_mark is not None,
                "left": round(self.dc_left(now), 1), "reason": self.result_reason}

    def _charge(self, reset):
        """지금 차례인 쪽에 흐른 시간을 깎는다. reset=True 면 방금 둔 것(초읽기 한 회 다시)."""
        now = time.time()
        c = self._running()
        if c:
            dt = now - self.turn_since - (USER_LAG_GRACE if c == self.user else 0)
            charge_clock(self.clock[c], self.time, dt, c == self.user)
            if reset and self.clock[c]["inByo"]:
                self.clock[c]["period"] = float(self.time["byo"])
        self.turn_since = now

    def clock_state(self):
        if not self.clock:
            return None
        c = self._running()
        el = max(0.0, time.time() - self.turn_since - (USER_LAG_GRACE if c == self.user else 0)) if c else 0
        return {"B": self.clock["B"], "W": self.clock["W"], "running": c, "elapsed": round(el, 2)}

    # ---- 대국

    def engine_move(self):
        if self.scoring or self.result:  # 계가 중·종국 뒤에는 엔진이 두지 않는다
            return
        c = self.to_move
        if c == self.user:
            return
        mv, score, wr = ENGINES.move(self.position(), self.level, c)
        self._charge(reset=True)
        if score is not None:
            self.score, self.winrate = score, wr
            self.scores.append((len(self.moves) + 1, round(score, 1)))
        if mv.lower() == "resign":
            self.result = f"{'W' if c == 'B' else 'B'}+R"
            self.message = f"{self.opp_short()}가 돌을 던졌습니다. 이기셨어요!"
        else:
            self.moves.append((c, mv))
            self._check_end()
        self._dc_update(time.time())  # 엔진이 둔 사이 대국자가 끊겼으면 이제부터 장애 시계

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
        sc = ENGINES.scoring(self.position(), self.level)
        self._charge(reset=False)
        self.scoring = sc
        self.message = "계가 중 — 사석은 잡은 쪽 집 표시로 바뀝니다. 돌을 누르면 사석/산 돌이 바뀝니다."

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
        dame = []
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
                # 11-04 작가님 "계가가 정확해야" — 소유권 추정 폐지, 닫힌 집만(한국 규칙). 양색에 닿은 빈 점은 전부 공배
                if len(border) == 1:
                    terr[border.pop()].extend(region)
                else:
                    dame.extend(region)
        b = len(terr["B"]) + prisoners["B"]
        w = len(terr["W"]) + prisoners["W"] + self.komi
        diff = b - w
        res = "0" if diff == 0 else (f"B+{diff:g}" if diff > 0 else f"W+{-diff:g}")
        return {"terrB": len(terr["B"]), "terrW": len(terr["W"]), "prisB": prisoners["B"], "prisW": prisoners["W"],
                "komi": self.komi, "black": b, "white": w, "result": res, "resultKo": result_ko(res),
                "kata": self.scoring["kata"], "kataKo": result_ko(self.scoring["kata"]),
                "dead": sorted(self.scoring["dead"]), "dame": [list(p) for p in sorted(dame)],
                "terr": [[x, y, "B"] for x, y in terr["B"]] + [[x, y, "W"] for x, y in terr["W"]]}

    def confirm_score(self):
        if not self.scoring:
            raise RuntimeError("계가 중이 아닙니다.")
        c = self.count()
        self.result = c["result"]
        self.final_count = c
        self.scoring = None
        self.message = (f"계가 확정 — 흑 {c['black']:g} · 백 {c['white']:g}(덤 {c['komi']:g} 포함) → {c['resultKo']}"
                        + (f" · KataGo 판정({c['kataKo']})과 달랐음" if c["result"] != c["kata"] else ""))  # 10-25 B3 결과 한 줄
        self.save_sgf()

    def cancel_score(self):
        self.scoring = None
        self.turn_since = time.time()  # 계가 동안 멈춘 시계를 다시
        self.message = "계가를 취소했습니다. 이어서 두세요."

    def play(self, mv):
        if self.result:
            raise RuntimeError("대국이 끝났습니다. '대국 신청'으로 새 대국을 시작해 주세요.")
        if self.scoring:
            raise RuntimeError("계가 중입니다 — '계가 확정' 또는 '계가 취소'를 눌러 주세요.")
        if self.to_move != self.user:
            raise RuntimeError("KataGo 차례입니다.")
        ENGINES.legal(self.position(), self.level, self.user, mv)
        self._charge(reset=True)
        self.moves.append((self.user, mv))
        self.message = ""
        self._check_end()
        self.save_sgf()
        if not self.result and not self.scoring:
            self.engine_move()
        self.save_sgf()

    def hint(self):
        """현재 국면 KataGo 추천 상위 3 — 늘 최강 엔진으로(급수 상대일 때도)."""
        if self.result or self.scoring:
            raise RuntimeError("대국 중에만 볼 수 있습니다.")
        cands = ENGINES.analyze(self.position(), self.to_move)
        for c in cands:
            c["xy"] = list(to_xy(c["move"])) if c["move"].lower() != "pass" else None
        return {"color": self.to_move, "moveNo": len(self.moves), "cands": cands}

    def judge(self):
        """AI 판정 — 지금 끝낸다면 KataGo가 보는 결과(대국은 계속)."""
        if not self.moves:
            raise RuntimeError("아직 둔 수가 없습니다.")
        r = ENGINES.final_score(self.position(), self.level)
        return {"result": r, "resultKo": result_ko(r), "moveNo": len(self.moves)}

    def timeout(self, color):
        """작가님 시계가 다 됨 → 시간패. 엔진은 시간패 없음(시계 표시만, 화면에서 상한)."""
        if self.result or not self.time:
            raise RuntimeError("시간패를 적용할 수 없습니다.")
        if color != self.user:
            raise RuntimeError("KataGo는 시간패가 없습니다.")
        self._charge(reset=False)
        self.scoring = None
        self.result = f"{'W' if color == 'B' else 'B'}+T"
        self.message = "시간이 다 됐습니다 — 시간패."
        self.save_sgf()

    def resign(self):
        if self.result:
            raise RuntimeError("이미 끝난 대국입니다.")
        if not self.moves:
            raise RuntimeError("아직 둔 수가 없습니다.")
        self._charge(reset=False)
        self.scoring = None
        self.result = f"{'W' if self.user == 'B' else 'B'}+R"
        self.message = "기권했습니다." + (" '리뷰'로 이번 판을 돌아볼 수 있어요." if REVIEWS.status(self)["ok"] else "")
        self.save_sgf()

    def void_empty(self):
        """11-04 작가님 이어두기 폐지 — 한 수도 안 둔 판을 대기실로 나가면 무효(Void, 승패 없음)로 종결."""
        if self.result or self.imported:
            raise RuntimeError("이미 끝난 대국입니다.")
        if self.moves:
            raise RuntimeError("수를 둔 판은 기권으로 끝냅니다.")
        self.scoring = None
        self.result, self.result_reason = VOID, "void"
        self.message = "무효 종료 — 한 수도 두지 않고 대기실로 나갔습니다."
        self.save_sgf()

    def undo(self):
        if self.result:
            raise RuntimeError("끝난 대국은 무를 수 없습니다. '대국 신청'으로 새 대국을 시작해 주세요.")
        # 내 차례가 될 때까지 되돌리되, 내 수를 최소 1개 무른다
        if not any(c == self.user for c, _ in self.moves):
            raise RuntimeError("무를 수가 없습니다.")
        self._charge(reset=False)
        self.scoring = None
        n0 = len(self.moves)
        while self.moves:
            c, _ = self.moves.pop()
            if c == self.user:
                break
        self.scores = [s for s in self.scores if s[0] <= len(self.moves)]
        k = n0 - len(self.moves)  # 실제로 되돌린 수(10-25 B6 — "한 수"라 했지만 보통 내 수+KataGo 수 2수)
        self.message = "2수(내 수·KataGo 수)를 물렀습니다." if k == 2 else "내 수 1수를 물렀습니다." if k == 1 else f"{k}수를 물렀습니다."
        if self.to_move != self.user:  # 엔진 수만 남은 경우
            self.engine_move()
        self.save_sgf()

    def swap(self):
        if self.result:
            raise RuntimeError("끝난 대국입니다.")
        self._charge(reset=False)
        self.user = self.eng_color
        self.message = f"이제 {'흑' if self.user == 'B' else '백'}을 잡으셨습니다."
        self.engine_move()
        self.save_sgf()

    def set_level(self, level):
        level = "monkos" if level == "monk" else level  # 상대 변경도 새 이름으로
        if not level_ok(level):
            raise RuntimeError("알 수 없는 수준")
        if level != "strong":
            ENGINES.check_level(level)
        self.level = level
        self.message = f"상대: {self.level_label()}"
        self.engine_move()

    def save_sgf(self):
        if not self.moves or self.imported:
            return
        GAMES_DIR.mkdir(parents=True, exist_ok=True)
        self.sgf_path.write_text(self.sgf_text(), encoding="utf-8")

    def sgf_text(self):
        if self.imported and self.sgf_path.exists():
            return self.sgf_path.read_text(encoding="utf-8")
        me, eng = self.owner_nick, self.opp_name()
        pb, pw = (me, eng) if self.user == "B" else (eng, me)
        extra = ""
        if self.source == "upload":  # 불러온 기보 → 보기용 SGF(대국자·급단·날짜·규칙 그대로)
            p = self.players or {}
            pb, pw = p.get("B", "흑"), p.get("W", "백")
            extra = "".join(f"{k}[{v}]" for k, v in (("BR", p.get("BR")), ("WR", p.get("WR"))) if v)
            extra += f"RU[{self.rules}]" + (f"DT[{self.record_date}]" if self.record_date else "")
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
                + (extra if self.source == "upload" else f"DT[{self.started:%Y-%m-%d}]") + f"PB[{pb}]PW[{pw}]"
                f"AP[MONK go-board-web]" + (f"RE[{self.result}]" if self.result and self.result != VOID else "")
                + (f"C[접속 장애패 — {self.owner_nick} 접속이 끊긴 채 {fmt_dur(self.dc_limit)} 초과]" if self.result_reason == "disconnect" else "")
                + (f"C[{self.message}]" if self.result_reason in ("rule-cleanup", "void") else ""))
        return head + "".join(nodes) + ")\n"

    def summary(self):
        """대기실 목록 한 줄."""
        last = REVIEWS.jobs.get(self.reviews[-1]) if self.reviews else None
        win = None
        if self.result and self.result[0] in "BW" and self.source != "upload":
            win = self.result[0] == self.user
        return {"id": self.id, "kind": self.kind, "status": self.status, "statusKo": STATUS_KO[self.status],
                "moveNo": len(self.moves), "toMove": self.to_move, "user": self.user, "level": self.level,
                "levelLabel": self.level_label(), "handicap": self.handicap, "komi": self.komi, "time": self.time,
                "result": self.result, "resultKo": result_ko(self.result) if self.result else None, "win": win,
                "started": self.started.isoformat(timespec="minutes"), "updated": self.updated,
                "imported": self.imported, "sgfUrl": f"/api/rooms/{self.id}/sgf" if self.moves else None,
                "review": REVIEWS.status(self),
                "lastReview": {"id": last["id"], "state": last["state"]} if last else None,
                "dc": self.dc_state(), "resultReason": self.result_reason, "source": self.source,
                "players": self.players, "origName": self.orig_name, "ownerNick": self.owner_nick,
                "ownerDisplay": self.owner_display}

    def state(self):
        g, caps = replay(self.moves, self.setup)
        last = None
        if self.moves and self.moves[-1][1].lower() != "pass":
            last = list(to_xy(self.moves[-1][1]))
        return {
            "room": self.id, "kind": self.kind, "status": self.status, "statusKo": STATUS_KO[self.status],
            "imported": self.imported, "ownerNick": self.owner_nick, "ownerDisplay": self.owner_display,
            "board": g, "captures": caps, "last": last, "moveNo": len(self.moves),
            "lastPass": bool(self.moves) and self.moves[-1][1].lower() == "pass",
            "lastColor": self.moves[-1][0] if self.moves else None,
            "toMove": self.to_move, "user": self.user, "level": self.level,
            "handicap": self.handicap, "komi": self.komi, "handicaps": HANDICAPS,
            "levelLabel": self.level_label(), "oppShort": self.opp_short(), "score": self.score, "winrate": self.winrate,
            "scores": self.scores, "result": self.result,
            # 기보 감상(10-24): 화면이 수순을 직접 재생한다 — 국면 계산은 화면 쪽 1벌
            "moveList": [list(m) for m in self.moves], "setup": self.setup, "source": self.source,
            "players": self.players or ({"B": self.owner_display, "W": self.opp_name()} if self.user == "B"
                                        else {"B": self.opp_name(), "W": self.owner_display}),
            "record": {"date": self.record_date or f"{self.started:%Y-%m-%d}", "rules": self.rules,
                       "origName": self.orig_name},
            "resultKo": result_ko(self.result) if self.result else None,
            "message": self.message, "sgf": str(self.sgf_path) if self.moves else None,
            "sgfUrl": f"/api/rooms/{self.id}/sgf" if self.moves else None,
            "review": REVIEWS.status(self),
            "reviews": [{"id": j, "state": REVIEWS.jobs[j]["state"]} for j in self.reviews if j in REVIEWS.jobs],
            "scoring": self.count() if self.scoring else None,
            "finalCount": self.final_count if self.result else None,
            "time": self.time,
            "clock": self.clock_state(),
            "dc": self.dc_state(),
            **common_state(),
        }


_BUILD = {"key": None, "id": None}


def build_id():
    """화면 판본 = index.html + sw.js 내용 해시(10자). 파일이 바뀌면(수정 시각·크기) 다시 잰다 — 서버 재기동 없이도 바뀐다.
    10-24 작가님 휴대폰: 반영한 화면이 PWA 보관본 때문에 안 닿음 → 화면이 이 값과 자기 판본을 비교해 스스로 바꾼다."""
    files = [HERE / "index.html", HERE / "pwa" / "sw.js"]
    key = tuple((f.stat().st_mtime_ns, f.stat().st_size) for f in files)
    if key != _BUILD["key"]:
        h = hashlib.sha1()
        for f in files:
            h.update(f.read_bytes())
        _BUILD.update(key=key, id=h.hexdigest()[:10])
    return _BUILD["id"]


def common_state():
    """방과 무관한 화면 재료(엔진 상태·수준 목록·소리·스킨) — 대기실도 같은 값을 쓴다."""
    return {"strongOk": ENGINES.strong.ok, "strongError": ENGINES.strong.error,
            "humanOk": ENGINES.human_ok, "humanReason": ENGINES.human_why(),
            "monkOk": ENGINES.monk_ok, "monkReason": ENGINES.monk_why(),
            "bot": {"name": BOT_NAME, "nameKo": BOT_NAME_KO, "stage": BOT_STAGE, "legacy": LEGACY_MONK},
            "ranks": [{"v": r, "label": RANK_KO[r]} for r in RANKS], "handicaps": HANDICAPS,
            "sounds": custom_sounds(), "packs": sound_packs(), "skins": skin_packs(), "testMode": TEST_MODE,
            "build": build_id()}


# ---------------------------------------------------------------- 방 저장소·목록

class EventLog:
    """방별 착수·무르기·거부 이벤트(append-only JSONL, rooms/events/{id}.jsonl) — 10-24 착수 거부 버그 추적.
    정본은 방 파일의 수순이고, 이 기록은 무슨 요청이 언제 와서 어떻게 끝났는지(수락·거부 사유·오류·걸린 ms)만 남긴다."""

    def __init__(self, root):
        self.dir = Path(root) / "events"
        self.lock = threading.Lock()

    def add(self, rid, **ev):
        ev = {"t": datetime.now().isoformat(timespec="milliseconds"), **ev}
        try:
            with self.lock:
                self.dir.mkdir(parents=True, exist_ok=True)
                with open(self.dir / f"{rid}.jsonl", "a", encoding="utf-8") as fh:
                    fh.write(json.dumps(ev, ensure_ascii=False) + "\n")
        except OSError as e:  # 기록 실패가 대국을 막지 않게 — 로그로만
            print(f"❌ go-board: 이벤트 기록 실패 {rid} — {e}", file=sys.stderr, flush=True)


EVENTS = None  # EventLog


class LocalRoomStore:
    """RoomStore 인터페이스(load_all / save / delete) — 단계 ① 로컬 파일. 단계 ⑤에서 Firestore 구현으로 바꾼다.
    저장은 임시 파일 → rename(원자적): 쓰는 도중 꺼져도 직전 판본이 남는다."""

    def __init__(self, root):
        self.root = Path(root)

    def load_all(self):
        out = []
        if not self.root.exists():
            return out
        for f in sorted(self.root.glob("*.json")):
            if f.name.startswith("_"):  # 방이 아닌 관리 파일(_migrations.json) — 10-24
                continue
            try:
                out.append(json.loads(f.read_text(encoding="utf-8")))
            except (OSError, ValueError) as e:
                print(f"❌ go-board: 방 파일 읽기 실패 {f.name} — {e}", file=sys.stderr, flush=True)
        return out

    def save(self, d):
        self.root.mkdir(parents=True, exist_ok=True)
        tmp = self.root / f".{d['id']}.json.tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(d, fh, ensure_ascii=False)
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, self.root / f"{d['id']}.json")

    def delete(self, rid):
        f = self.root / f"{rid}.json"
        if f.exists():
            f.unlink()


def parse_sgf_room(path):
    """단계 ① 이전 기보(SGF)를 '지난 대국' 방으로 — 수순·결과·치수·흑백·상대 수준만 읽는다."""
    t = path.read_text(encoding="utf-8", errors="replace")
    m = re.match(r"(\d{8})_(\d{6})", path.name)
    if not m:
        return None

    def prop(k):
        mm = re.search(rf"(?<![A-Z]){k}\[([^\]]*)\]", t)
        return mm.group(1) if mm else None

    g = lambda v: "pass" if not v else to_gtp(ord(v[0]) - 97, ord(v[1]) - 97)
    moves = [(c, g(v)) for c, v in re.findall(r";([BW])\[([a-s]{0,2})\]", t)]
    if not moves:
        return None
    r = Room(f"{m.group(1)}-{m.group(2)}-sgf")
    r.imported = True
    r.started = datetime.strptime(m.group(1) + m.group(2), "%Y%m%d%H%M%S")
    r.updated = path.stat().st_mtime
    r.sgf_path = path
    r.moves = moves
    r.handicap = int(prop("HA") or 0)
    ab = re.search(r"AB((?:\[[a-s]{2}\])+)", t)
    r.setup = [g(v) for v in re.findall(r"\[([a-s]{2})\]", ab.group(1))] if ab else []
    r.user = "W" if prop("PW") == "작가님" else "B"
    opp = prop("PW" if r.user == "B" else "PB") or ""
    mr = re.search(r"KataGo (?:사람형 )?(\d+[급단])\)?$", opp)  # 옛 표기 '사람형 5급' · 새 표기 '5급' 둘 다
    r.level = "monkos" if opp.startswith(MONK_TAG.split("-b")[0] + "-") else "monk" if opp.startswith("MONK-") else next((k for k, v in RANK_KO.items() if mr and v == mr.group(1)), "strong")
    tm, ot = prop("TM"), re.match(r"(\d+)x(\d+)", prop("OT") or "")
    r.time = {"main": int(float(tm)) // 60, "byo": int(ot.group(2)), "periods": int(ot.group(1))} if tm and ot else None
    r.result = prop("RE")
    r.message = "이전 버전에서 둔 대국(기보에서 가져옴)" + ("" if r.result else " — 끝내지 않은 판")
    for f in sorted(REVIEW_DIR.glob(f"{path.stem}_리뷰_*.html")) if REVIEW_DIR.exists() else []:
        mm = re.fullmatch(rf"{re.escape(path.stem)}_리뷰_(\d{{6}})\.html", f.name)
        if mm:
            stem = f.with_suffix("")
            r.reviews.append(REVIEWS.restore({"id": f"{m.group(1)}_{m.group(2)}_{mm.group(1)}", "html": str(f),
                                              "sgf": str(stem.with_suffix(".sgf")), "log": str(stem.with_suffix(".log")),
                                              "state": "done", "filter": False, "moves": len(moves)}, r.id))
    return r


class Rooms:
    def __init__(self, store):
        self.store = store
        self.rooms = {}
        self.lock = threading.Lock()
        self.focus = {}  # 소유자 uid → 그 사람의 초점 방. 실시간 분석판(live_view --goboard)은 작가님 계정 것을 따라간다 — 마지막으로 열거나 둔 방

    def load(self):
        """저장된 방 전부 복원 + 아직 방이 없는 이전 기보(SGF)를 지난 대국으로 1회 가져온다. 가져온 수를 돌려준다."""
        for d in self.store.load_all():
            try:
                r = Room.from_dict(d)
            except (KeyError, ValueError, TypeError) as e:
                print(f"❌ go-board: 방 복원 실패 {d.get('id')} — {e}", file=sys.stderr, flush=True)
                continue
            r.cache = json.dumps(r.state(), ensure_ascii=False)
            self.rooms[r.id] = r
        known = {str(r.sgf_path) for r in self.rooms.values()}
        n = 0
        for f in sorted(GAMES_DIR.glob("*.sgf")) if GAMES_DIR.exists() else []:
            if str(f) in known:
                continue
            try:
                r = parse_sgf_room(f)
            except (OSError, ValueError) as e:
                print(f"❌ go-board: 기보 가져오기 실패 {f.name} — {e}", file=sys.stderr, flush=True)
                continue
            if r and r.id not in self.rooms:
                self.rooms[r.id] = r
                self.store.save(r.to_dict())
                n += 1
        return n

    def get(self, rid):
        return self.rooms.get(rid)

    def save(self, room):
        room.updated = time.time()
        self.store.save(room.to_dict())

    def add(self, room):
        with self.lock:
            # 한 수도 안 둔 채 10분 넘게 남겨 둔 방은 새 방을 만들 때 걷는다(지울 것이 없는 빈 판 — 막 만든 다른 방은 두고)
            old = time.time() - EMPTY_ROOM_TTL
            for r in list(self.rooms.values()):
                if not r.moves and not r.result and not r.imported and r.updated < old and r.lock.acquire(blocking=False, name="sweep"):
                    try:
                        del self.rooms[r.id]
                        self.store.delete(r.id)
                    finally:
                        r.lock.release()
            self.rooms[room.id] = room
            self.focus[room.owner] = room.id
        self.save(room)

    def listing(self, owner=None):
        """최근 순. owner(uid)를 주면 그 사람 방만 — 11-04 내 방만 보인다."""
        return sorted([r for r in list(self.rooms.values()) if owner is None or r.owner == owner],  # 복사본 — 생성과 겹쳐도 안전
                      key=lambda r: r.updated, reverse=True)

    def set_focus(self, room):
        if room:
            self.focus[room.owner] = room.id

    def focus_room(self, owner=ADMIN_UID):
        """호환 API(/api/state 등)가 가리킬 방 — 그 사람의 초점 방, 없으면 가장 최근 진행 중 방, 없으면 가장 최근 방."""
        r = self.rooms.get(self.focus.get(owner))
        if r and r.owner == owner:
            return r
        rs = self.listing(owner)
        return next((r for r in rs if r.status != "ended"), rs[0] if rs else None)

    def defaults(self, owner=ADMIN_UID):
        """새 대국 창 기본값 — 그 사람이 가장 최근에 만든 방의 설정을 기억한다."""
        last = max((r for r in list(self.rooms.values()) if not r.imported and r.owner == owner), key=lambda r: r.started, default=None)
        return {"level": last.level if last else "strong", "handicap": last.handicap if last else 0,
                "time": last.time if last else dict(DEFAULT_TIME), "user": last.user if last else "B",
                "dcLimit": DC_LIMIT}


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
            return dict(base, ok=False, reason=f"{game.owner_nick} 수가 {MIN_USER_MOVES}수 이상이면 리뷰할 수 있어요")
        return dict(base, ok=True, reason="")

    def start(self, game, wr_filter):
        st = self.status(game)
        if not st["ok"]:
            raise RuntimeError(st["reason"])
        game.save_sgf()
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
               "filter": bool(wr_filter and self.filter_ok()), "moves": len(game.moves), "room": game.id}
        with self.lock:
            self.jobs[jid] = job
            self.running = jid
        game.reviews.append(jid)  # 리뷰는 방에 묶인다 — 지난 대국에서 다시 연다
        threading.Thread(target=self._run, args=(job,), daemon=True).start()
        return jid

    @staticmethod
    def dump(jid):
        j = REVIEWS.jobs[jid]
        return {"id": j["id"], "html": str(j["html"]), "sgf": str(j["sgf"]), "log": str(j["log"]),
                "started": j.get("started"), "state": j["state"], "filter": j["filter"], "moves": j["moves"],
                "secs": j.get("secs"), "error": j.get("error")}

    def restore(self, d, rid):
        """방 파일의 리뷰 기록 → job. 서버가 꺼질 때 돌던 리뷰는 결과 파일이 있으면 완료, 없으면 중단."""
        job = dict(d, html=Path(d["html"]), sgf=Path(d["sgf"]), log=Path(d["log"]), room=rid)
        job.setdefault("started", time.time())
        if job["state"] == "running":
            job["state"] = "done" if job["html"].exists() else "failed"
            if job["state"] == "failed":
                job["error"] = "서버 재시작으로 중단됨 — 다시 만들어 주세요"
        with self.lock:
            self.jobs[job["id"]] = job
        return job["id"]

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
        room = ROOMS.get(job.get("room"))
        if room:  # 리뷰 결과를 방 파일에 남긴다(대국 중이면 그 수가 끝난 뒤)
            with room.lock.hold("review-save"):
                ROOMS.save(room)

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


def fmt_dur(sec):
    """초 → '24시간' · '5분' · '20초' · '1시간 30분'."""
    sec = int(sec)
    h, m, s = sec // 3600, sec % 3600 // 60, sec % 60
    parts = [f"{h}시간"] * bool(h) + [f"{m}분"] * bool(m) + [f"{s}초"] * bool(s)
    return " ".join(parts) or "0초"


VOID = "Void"  # 무효 종료(승패 없음) — 10-24 옛 규칙 빈 방 정리


def result_ko(r):
    if not r or r == "?":
        return "결과 미상"
    if r == "0":
        return "빅"
    if r == VOID:
        return "무효"
    m = re.match(r"([BW])\+(\S+)", r)
    if not m:
        return r
    who = "흑" if m.group(1) == "B" else "백"
    if m.group(2) == "R":
        return f"{who} 불계승"
    if m.group(2) == "F":
        return f"{who} 접속 장애승"
    if m.group(2) == "T":
        return f"{who} 시간승"
    return f"{who} {m.group(2)}집 승"


# ---------------------------------------------------------------- 기보 불러오기(SGF · GIB) — 10-24 기보 감상

UPLOAD_MAX = 1024 * 1024  # 1MB
UPLOADS_DIR = ROOMS_DIR.parent / "uploads"  # 원본·변환 SGF 보관(테스트는 _test/uploads)
# GIB(타이젬) INI 치석 — GTP 표준 고정 배치. 3점 = D4·Q16·D16(빈 귀 우하 — 타이젬 실기보 백 첫 수 Q4로 확인, 10-24)
GTP_HANDICAP = {2: ["D4", "Q16"], 3: ["D4", "Q16", "D16"], 4: ["D4", "Q16", "D16", "Q4"],
                5: ["D4", "Q16", "D16", "Q4", "K10"], 6: ["D4", "Q16", "D16", "Q4", "D10", "Q10"],
                7: ["D4", "Q16", "D16", "Q4", "D10", "Q10", "K10"],
                8: ["D4", "Q16", "D16", "Q4", "D10", "Q10", "K4", "K16"],
                9: ["D4", "Q16", "D16", "Q4", "D10", "Q10", "K4", "K16", "K10"]}
RULES_MAP = {"korean": "korean", "japanese": "japanese", "chinese": "chinese", "aga": "aga",
             "nz": "new-zealand", "new zealand": "new-zealand", "tromp-taylor": "tromp-taylor"}


class ImportError_(RuntimeError):
    """불러오기 실패 — 사유를 화면에 그대로 보인다."""


def decode_text(raw, prefer=None):
    """prefer(CA 등) → UTF-8 → CP949 순. (텍스트, 실제 쓴 인코딩)."""
    tried = []
    for enc in [prefer, "utf-8", "cp949"]:
        if not enc or enc in tried:
            continue
        tried.append(enc)
        try:
            return raw.decode(enc), enc
        except (UnicodeDecodeError, LookupError):
            continue
    raise ImportError_("글자 인코딩을 읽지 못했습니다(UTF-8·CP949 아님)")


def sgf_tree(t):
    """SGF 문자열 → (노드 목록, 자식 트리 목록) 중첩 구조. 노드 = {속성: [값…]}."""
    i, n = 0, len(t)

    def ws():
        nonlocal i
        while i < n and t[i] in " \t\r\n":
            i += 1

    def value():
        nonlocal i
        i += 1  # '['
        out = []
        while i < n and t[i] != "]":
            if t[i] == "\\" and i + 1 < n:
                i += 1
            out.append(t[i])
            i += 1
        if i >= n:
            raise ImportError_("SGF 값이 닫히지 않았습니다(']' 없음)")
        i += 1
        return "".join(out)

    def tree():
        nonlocal i
        ws()
        if i >= n or t[i] != "(":
            raise ImportError_("SGF 형식이 아닙니다('(' 없음)")
        i += 1
        nodes, kids = [], []
        while True:
            ws()
            if i >= n:
                raise ImportError_("SGF가 중간에 끝났습니다(')' 없음)")
            if t[i] == ";":
                i += 1
                node = {}
                while True:
                    ws()
                    m = re.match(r"[A-Za-z]+", t[i:i + 20])
                    if not m:
                        break
                    key = "".join(ch for ch in m.group(0) if ch.isupper())
                    i += len(m.group(0))
                    ws()
                    vals = []
                    while i < n and t[i] == "[":
                        vals.append(value())
                        ws()
                    node.setdefault(key, []).extend(vals)
                nodes.append(node)
            elif t[i] == "(":
                kids.append(tree())
            elif t[i] == ")":
                i += 1
                return nodes, kids
            else:
                raise ImportError_(f"SGF를 읽을 수 없는 글자 '{t[i]}'")

    return tree()


def sgf_point(v):
    if not v or v == "tt":
        return "pass"
    if len(v) != 2 or not all("a" <= ch <= "s" for ch in v):
        raise ImportError_(f"좌표를 읽을 수 없습니다: [{v}]")
    return to_gtp(ord(v[0]) - 97, ord(v[1]) - 97)


def tygem_rank(v):
    """타이젬 SGF 숫자 급단 코드(BR/WR) → 급단 표기(10-25 K2). 숫자가 아니거나 표 밖이면 원문 그대로.
    코드표 = 타이젬 GIB 실기보 21개의 (이름 속 급단, BLV/WLV) 짝 실측: 15K=3·13K=5·12K=6·10K=8·1급=17·2D=19
    → 급 = 18-n(1~17), 아마 단 = n-17(18~26), 프로 = n-26(27~35, 35=P9단 실기보 1건). 아마 3~9단·프로 1~8단은 공식으로 이은 값"""
    s = (v or "").strip()
    if not s.isdigit():
        return v or ""
    n = int(s)
    if 1 <= n <= 17:
        return f"{18 - n}급"
    if 18 <= n <= 26:
        return f"{n - 17}단"
    if 27 <= n <= 35:
        return f"P{n - 26}단"
    return v


def result_from_text(txt):
    """GIB 결과 문구(영·한) → SGF RE 형식."""
    if not txt:
        return None
    s = txt.lower()
    ib, iw = [s.find(k) for k in ("black", "흑")], [s.find(k) for k in ("white", "백")]
    ib, iw = min([x for x in ib if x >= 0], default=-1), min([x for x in iw if x >= 0], default=-1)
    if ib < 0 and iw < 0:
        return None
    who = "B" if iw < 0 or (0 <= ib < iw) else "W"
    if "resign" in s or "불계" in s:
        return f"{who}+R"
    if "time" in s or "시간" in s:
        return f"{who}+T"
    m = re.search(r"(\d+(?:\.\d+)?)", s)
    if m:
        v = float(m.group(1)) + (0.5 if "반" in s else 0)
        return f"{who}+{v:g}"
    return f"{who}+"


def parse_sgf_upload(raw):
    head = raw[:4096].decode("latin-1")
    m = re.search(r"CA\[([^\]]+)\]", head)
    text, enc = decode_text(raw, m.group(1).strip().lower() if m else None)
    nodes, kids = sgf_tree(text[text.find("("):] if "(" in text else text)
    root = nodes[0] if nodes else {}
    variations = len(kids) > 1
    line = list(nodes)
    while kids:  # 메인 라인 = 각 갈래의 첫 자식
        variations = variations or len(kids) > 1
        nodes, kids = kids[0]
        line += nodes
    one = lambda k: (root.get(k) or [None])[0]
    if (one("SZ") or "19").split(":")[0].strip() != "19":
        raise ImportError_(f"19줄 바둑판만 지원합니다(SZ[{one('SZ')}])")
    if any("AW" in nd for nd in line):
        raise ImportError_("흰 돌 배치(AW)가 있는 기보는 아직 지원하지 않습니다")
    setup = [sgf_point(v) for nd in line for v in nd.get("AB", [])]
    moves = []
    for nd in line:
        for c in ("B", "W"):
            for v in nd.get(c, []):
                moves.append((c, sgf_point(v)))
    if not moves and not setup:
        raise ImportError_("수순이 없습니다")
    ru = (one("RU") or "korean").strip().lower()
    return {"moves": moves, "setup": setup, "handicap": int(one("HA") or len(setup) or 0),
            "komi": float(one("KM") or (0.5 if setup else KOMI)), "result": one("RE"),
            "pb": one("PB") or "흑", "pw": one("PW") or "백", "br": tygem_rank(one("BR")), "wr": tygem_rank(one("WR")),
            "dt": one("DT") or "", "rules": RULES_MAP.get(ru, "korean"), "encoding": enc,
            "variations": variations, "format": "SGF"}


def parse_gib_upload(raw):
    text, enc = decode_text(raw)
    if "\\HS" not in text or "\\GS" not in text:
        raise ImportError_("GIB(타이젬) 형식이 아닙니다(\\HS·\\GS 없음)")
    hdr = dict(re.findall(r"\\\[([A-Z]+)=(.*?)\\\]", text))
    split = lambda v: re.match(r"(.*?)\s*\(([^)]*)\)\s*$", v or "")
    name = lambda k: (split(hdr.get(k)).group(1) if split(hdr.get(k)) else (hdr.get(k) or "")).strip()
    rank = lambda k: split(hdr.get(k)).group(2) if split(hdr.get(k)) else ""
    handicap, moves = 0, []
    for ln in text[text.find("\\GS"):].splitlines():
        p = ln.split()
        if not p:
            continue
        if p[0] == "INI" and len(p) >= 4:
            handicap = int(p[3])
        elif p[0] == "STO" and len(p) >= 6:  # STO 0 수번호 색(1흑·2백) x y — 0부터, y는 위에서부터
            x, y = int(p[4]), int(p[5])
            if not (0 <= x < SIZE and 0 <= y < SIZE):
                raise ImportError_(f"좌표가 판 밖입니다: {ln.strip()}")
            moves.append(("B" if p[3] == "1" else "W", to_gtp(x, y)))
        elif p[0] == "SKI":  # 한수쉼
            moves.append(("W" if (moves and moves[-1][0] == "B") or (not moves and handicap > 1) else "B", "pass"))
    if not moves:
        raise ImportError_("GIB에 수순(STO)이 없습니다")
    gongje = hdr.get("GAMEGONGJE") or ""
    dum = (hdr.get("GAMEDUM") or "").strip()
    num = lambda v: v.lstrip("-").isdigit() and int(v) != 0
    # 덤: GONGJE(1/10집, 호선 65=6.5) 우선, 없고 GAMEDUM 이 있으면 그 집수(접바둑 'White Dum(5)' — 해석 미확정, 10-24)
    komi = int(gongje) / 10 if num(gongje.strip()) else (float(dum) if num(dum) else (0.5 if handicap > 1 else KOMI))
    dt = re.sub(r"\s+", "", hdr.get("GAMEDATE", ""))
    md = re.match(r"(\d{4})-(\d{1,2})-(\d{1,2})", dt)
    return {"moves": moves, "setup": GTP_HANDICAP.get(handicap, []), "handicap": handicap if handicap > 1 else 0,
            "komi": komi, "result": result_from_text(hdr.get("GAMERESULT")),
            "pb": name("GAMEBLACKNAME") or "흑", "pw": name("GAMEWHITENAME") or "백",
            "br": rank("GAMEBLACKNAME"), "wr": rank("GAMEWHITENAME"),
            "dt": f"{md.group(1)}-{int(md.group(2)):02d}-{int(md.group(3)):02d}" if md else "",
            "rules": "korean", "encoding": enc, "variations": False, "format": "GIB",
            "event": hdr.get("GAMENAME", "")}


def import_record(name, raw, owner=ADMIN_UID):
    """불러온 파일 → 보기 전용 방(같은 내용이면 기존 방). (방, 새로 만들었는지)."""
    if len(raw) > UPLOAD_MAX:
        raise ImportError_(f"파일이 1MB를 넘습니다({len(raw) // 1024}KB)")
    if not raw.strip():
        raise ImportError_("빈 파일입니다")
    digest = hashlib.sha1(raw).hexdigest()
    tag = "" if owner == ADMIN_UID else "-" + owner[-6:]  # 11-04 같은 파일도 사람마다 자기 방(남의 방과 겹치지 않게)
    rid = f"up-{digest[:12]}{tag}"
    old = ROOMS.get(rid)
    if old:
        return old, False
    is_gib = name.lower().endswith(".gib") or raw.lstrip()[:3] == b"\\HS"
    d = parse_gib_upload(raw) if is_gib else parse_sgf_upload(raw)
    r = Room(rid)
    r.owner = owner
    r.imported, r.source, r.orig_name = True, "upload", name
    r.moves, r.setup, r.handicap = d["moves"], d["setup"], d["handicap"]
    r.komi_value, r.result, r.rules, r.record_date = d["komi"], d["result"], d["rules"], d["dt"]
    r.players = {"B": d["pb"], "W": d["pw"], "BR": d["br"], "WR": d["wr"]}
    r.time, r.clock = None, None
    r.started = datetime.now()
    r.message = (f"불러온 기보({d['format']}, {d['encoding']}) — {name}"
                 + (" · 변화도는 버리고 메인 수순만 읽었습니다" if d["variations"] else ""))
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOADS_DIR / f"{digest[:12]}{'.gib' if is_gib else '.sgf'}").write_bytes(raw)  # 원본 보관
    r.sgf_path = UPLOADS_DIR / f"{digest[:12]}{tag}.view.sgf"
    r.sgf_path.write_text(r.sgf_text(), encoding="utf-8")
    ROOMS.rooms[rid] = r
    ROOMS.save(r)
    return r, True


# ---------------------------------------------------------------- 승률 그래프(국면마다 짧은 분석, 방 옆 파일에 캐시)

class Analyses:
    """방마다 0수~끝 국면을 EngineHub.quick 으로 하나씩 — 대국 요청이 오면 수 단위로 비킨다.
    캐시 rooms/analysis/{id}.json. 화면이 요청하는 동안만 계산(마지막 요청 뒤 GRAPH_IDLE초면 멈춤),
    다시 열면 캐시 다음 수부터. 재기동 때 자동으로 이어 계산하지 않는다(10-25)."""

    def __init__(self):
        self.dir = ROOMS_DIR / "analysis"
        self.lock = threading.Lock()
        self.cache = {}
        self.queue = []
        self.wake = threading.Event()
        self.current = None
        self.stats = {}  # 방 id → {"started": t, "secs": 걸린 초, "points": 계산한 수}
        self.priority = None  # 감상으로 지금 열려 있는 방(10-25 K5) — 줄 맨 앞, 계산 중인 다른 방은 한 수 끝내고 비킨다
        self.asked = {}  # 방 id → 처음 요청 시각(첫 점까지 기다린 초 로그용)
        self.seen = {}  # 방 id → 마지막 그래프 요청 시각(보는 화면이 있는지)

    def watched(self, rid):
        return time.time() - self.seen.get(rid, 0) <= GRAPH_IDLE

    def load(self, rid):
        if rid not in self.cache:
            f = self.dir / f"{rid}.json"
            try:
                self.cache[rid] = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
            except (OSError, ValueError) as e:
                print(f"❌ go-board: 그래프 캐시 읽기 실패 {rid} — {e}", file=sys.stderr, flush=True)
                self.cache[rid] = {}
        return self.cache[rid]

    def _save(self, rid):
        self.dir.mkdir(parents=True, exist_ok=True)
        tmp = self.dir / f".{rid}.json.tmp"
        tmp.write_text(json.dumps(self.cache[rid]), encoding="utf-8")
        os.replace(tmp, self.dir / f"{rid}.json")

    def status(self, room, want=True):
        total = len(room.moves) + 1
        pts = self.load(room.id).get("points", {})
        done = all(str(k) in pts for k in range(total))
        if want and not done:
            with self.lock:  # 화면이 보고 있는 방 = 맨 앞(K5). 이미 계산 중이면 그대로
                self.seen[room.id] = time.time()
                if room.id in self.queue:
                    self.queue.remove(room.id)
                if self.current != room.id:
                    self.queue.insert(0, room.id)
                self.priority = room.id
                if not pts:  # 첫 점까지 기다린 시간만 잰다(화면이 2초마다 다시 물어도 1회)
                    self.asked.setdefault(room.id, time.time())
            self.wake.set()
        st = self.stats.get(room.id, {})
        return {"total": total, "count": sum(1 for k in range(total) if str(k) in pts), "done": done,
                "points": [[int(k), v[0], v[1]] for k, v in sorted(pts.items(), key=lambda kv: int(kv[0]))
                           if int(k) < total],
                "running": self.current == room.id, "queued": room.id in self.queue,
                "secs": st.get("secs"), "visits": GRAPH_VISITS, "firstWait": st.get("firstWait")}

    def loop(self):
        while True:
            self.wake.wait(5)
            self.wake.clear()
            while True:
                with self.lock:
                    self.queue = [q for q in self.queue if self.watched(q)]  # 보는 화면이 끊긴 방은 줄에서 뺀다
                    if self.priority and not self.watched(self.priority):
                        self.priority = None
                    rid = self.queue.pop(0) if self.queue else None
                    self.current = rid
                if not rid:
                    break
                room = ROOMS.get(rid)
                if room:
                    self._run(room)
                with self.lock:
                    self.current = None

    def _run(self, room):
        data = self.load(room.id)
        pts = data.setdefault("points", {})
        data["visits"] = GRAPH_VISITS
        t0, n0 = time.time(), len(pts)
        moves, total = list(room.moves), len(room.moves) + 1
        since_save = 0
        for k in range(total):
            if str(k) in pts:
                continue
            if self.priority and self.priority != room.id and self.watched(self.priority):  # 다른 방이 감상으로 열림 — 진행분 저장하고 그 방 뒤로
                with self.lock:
                    if room.id not in self.queue:
                        self.queue.insert(1 if self.queue and self.queue[0] == self.priority else 0, room.id)
                print(f"⏸ go-board 그래프 {room.id}: {k}수에서 비킴 → {self.priority}", file=sys.stderr, flush=True)
                break
            if not self.watched(room.id):  # 보는 화면 없음 — 진행분 저장하고 멈춤, 다시 열면 이 수부터
                print(f"⏸ go-board 그래프 {room.id}: {k}/{total}수에서 멈춤 — 보는 화면 없음({GRAPH_IDLE}s)",
                      file=sys.stderr, flush=True)
                break
            color = moves[k][0] if k < len(moves) else ("W" if moves and moves[-1][0] == "B" else "B")
            try:
                wr, score = ENGINES.quick({"moves": moves[:k], "setup": room.setup, "komi": room.komi},
                                          color, getattr(room, "rules", "korean"))
            except RuntimeError as e:
                print(f"❌ go-board: 그래프 계산 실패 {room.id} {k}수 — {e}", file=sys.stderr, flush=True)
                break
            pts[str(k)] = [round(wr, 4) if wr is not None else None, round(score, 2) if score is not None else None]
            if room.id in self.asked:  # 요청부터 첫 점까지(K5 대기 시간 로그)
                waited = round(time.time() - self.asked.pop(room.id), 1)
                self.stats.setdefault(room.id, {"secs": 0.0})["firstWait"] = waited
                print(f"✅ go-board 그래프 {room.id}: 첫 점까지 {waited}s", file=sys.stderr, flush=True)
            since_save += 1
            if since_save >= 5:
                self._save(room.id)
                since_save = 0
        self._save(room.id)
        if self.priority == room.id and all(str(k) in pts for k in range(total)):
            self.priority = None
        st = self.stats.setdefault(room.id, {"secs": 0.0})
        st["secs"] = round(st.get("secs", 0.0) + time.time() - t0, 1)
        print(f"✅ go-board 그래프 {room.id}: {len(pts) - n0}국면 {round(time.time() - t0, 1)}s", file=sys.stderr, flush=True)


# ---------------------------------------------------------------- HTTP

ENGINES = None  # EngineHub
ROOMS = None  # Rooms
ANALYSES = None  # Analyses(승률 그래프)
ACTIONS = ("play", "engine", "score", "score/toggle", "score/confirm", "score/cancel", "hint", "judge",
           "timeout", "resign", "void", "undo", "swap", "level", "review", "ping")
# 호환 경로(단계 ① 이전 화면·PWA 보관본·live_view --goboard): /api/state·/api/{동작}은 초점 방을 가리킨다.
# 대국실은 /api/rooms/{id}/… 만 쓴다. 호환 경로는 보관본이 v3로 바뀐 뒤 제거 예정(단계 ②).
LEGACY_ACTIONS = ACTIONS + ("new",)
EMPTY_STATE = {"room": None, "sgf": None, "user": "B", "komi": KOMI, "moveNo": 0, "result": None,
               "message": "진행 중인 방이 없습니다 — 대기실에서 새 대국을 시작해 주세요."}


def act(room, action, body):
    """방 1개에 동작 1개 — 호출 쪽이 room.lock 을 잡고 부른다. (오류, reviewJob, 덧붙일 값)"""
    err, jid, extra = None, None, {}
    try:
        if action == "ping":  # 대국실 화면이 5초마다 — heartbeat 는 호출 쪽에서 이미 했다
            if TEST_SLOW_PING:  # 테스트 인스턴스 전용: 잠금을 잡은 채 머무는 비엔진 보유자 흉내
                time.sleep(TEST_SLOW_PING)
            return None, None, {}
        if action == "play":
            room.play("pass" if body.get("pass") else to_gtp(int(body["x"]), int(body["y"])))
        elif action == "engine":  # 엔진 차례면 둔다(새 방 첫 수 · 복원 뒤 엔진 차례)
            room.engine_move()
            room.save_sgf()
        elif action == "score":
            room.start_scoring()
        elif action == "score/toggle":
            room.toggle_dead(int(body["x"]), int(body["y"]))
        elif action == "score/confirm":
            room.confirm_score()
        elif action == "score/cancel":
            room.cancel_score()
        elif action == "hint":
            extra = {"hint": room.hint()}
        elif action == "judge":
            extra = {"judge": room.judge()}
        elif action == "timeout":
            room.timeout(str(body.get("color")))
        elif action == "resign":
            room.resign()
        elif action == "void":
            room.void_empty()
        elif action == "undo":
            room.undo()
        elif action == "swap":
            room.swap()
        elif action == "level":
            room.set_level(str(body.get("level")))
        elif action == "review":
            jid = REVIEWS.start(room, bool(body.get("wrFilter", True)))
    except (RuntimeError, KeyError, ValueError) as e:
        err = str(e)
    ROOMS.save(room)
    return err, jid, extra


def ev_move(body):
    """이벤트용 좌표 — 착수 요청 본문의 x·y(GTP 좌표 포함) 또는 한수쉼."""
    if body.get("pass"):
        return {"move": "pass"}
    try:
        x, y = int(body["x"]), int(body["y"])
        return {"x": x, "y": y, "move": to_gtp(x, y)}
    except (KeyError, ValueError, TypeError, IndexError):
        return {}


def new_room(body, base=None, owner=ADMIN_UID):
    """대국 신청 → 방 생성. 첫 수가 엔진이면 대국실이 'engine'으로 부른다(화면은 빈 판부터)."""
    d = ROOMS.defaults(owner)
    level = str(body.get("level") or (base.level if base else d["level"]))
    handicap = int(body["handicap"]) if "handicap" in body else (base.handicap if base else d["handicap"])
    t = body.get("time", "keep")
    if t == "keep":
        t = base.time if base else d["time"]
        t = t or {"unlimited": True}
    room = Room.create(level, handicap, t, body.get("color") or (base.user if base else d["user"]), owner)  # 장애 한도는 고정 5분
    room.cache = json.dumps(room.state(), ensure_ascii=False)  # 첫 조회가 엔진 생각과 겹쳐도 빈 판을 준다
    ROOMS.add(room)
    EVENTS.add(room.id, action="create", user=room.user, level=room.level, handicap=room.handicap,
               color=body.get("color"), time=room.time, dcLimit=room.dc_limit)
    return room


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *a):
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8", headers=None):
        data = body if isinstance(body, bytes) else body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def _json(self, obj, code=200, headers=None):
        self._send(code, json.dumps(obj, ensure_ascii=False), headers=headers)

    # ---- 11-04 작가님 — 테스트 아이디: 누가 보낸 요청인가
    def _remote_hdr(self):
        return bool(self.headers.get("CF-Connecting-IP") or self.headers.get("X-Forwarded-For"))

    def _ip(self):
        return (self.headers.get("CF-Connecting-IP") or (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
                or self.client_address[0])

    def _is_local(self):
        """로컬호스트 직접 요청 — 터널(cloudflared)을 거치면 CF-Connecting-IP/X-Forwarded-For 가 붙으므로 로컬이 아니다."""
        return self.client_address[0] in ("127.0.0.1", "::1") and not self._remote_hdr()

    def _https(self):
        return (self.headers.get("X-Forwarded-Proto") or "").lower() == "https" or '"https"' in (self.headers.get("CF-Visitor") or "")

    def _token(self):
        try:
            c = http.cookies.SimpleCookie(self.headers.get("Cookie") or "")
        except http.cookies.CookieError:
            return None
        return c[COOKIE_NAME].value if COOKIE_NAME in c else None

    def _who(self):
        """쿠키 세션의 사용자. 쿠키가 없으면 로컬호스트 요청은 '작가님'(live_view·내부 도구 호환), 그 밖엔 None."""
        u = AUTH.user_of(self._token())
        if u:
            return u
        return {"uid": ADMIN_UID, "nick": ADMIN_NICK, "local": True} if self._is_local() else None

    def _cookie(self, tok):
        base = f"{COOKIE_NAME}={tok}; HttpOnly; SameSite=Lax; Path=/"
        if self._https():
            base += "; Secure"
        return {"Set-Cookie": base + (f"; Max-Age={SESSION_TTL}" if tok else "; Max-Age=0")}

    def _need(self, room=None):
        """로그인(+방 소유) 확인 — 통과하면 사용자, 아니면 401/403 을 이미 보내고 None. 남의 방은 관전도 다음 단계."""
        u = self._user
        if not u:
            self._json({"error": "로그인이 필요합니다", "auth": True}, 401)
            return None
        if room is not None and room.owner != u["uid"]:
            self._json({"error": "다른 사람의 방입니다 — 관전은 다음 단계에서 열립니다.", "forbidden": True}, 403)
            return None
        return u

    def _me(self, rec, u=None):
        """내 정보(응답용) — uid·세션은 내지 않는다. 계정 레코드가 없으면(로컬 호환 '작가님') 닉네임만."""
        if not rec:
            return {"nick": u["nick"] if u else ADMIN_NICK, "rank": None, "rankKo": None, "created": None}
        return {"nick": rec["nick"], "rank": rec.get("rank"), "rankKo": rank_ko(rec.get("rank")), "created": rec.get("created"),
                "display": AUTH.display_name(rec["uid"])}

    def _auth_post(self, path, body):
        """/api/auth/* · /api/presence — 처리했으면 True."""
        if path in ("/api/auth/signup", "/api/auth/enter"):
            if not AUTH.rate_ok(self._ip()):
                self._json({"error": "요청이 너무 많습니다 — 잠시 뒤에 다시 해 주세요"}, 429)
                return True
            if path.endswith("signup"):
                u, err = AUTH.signup(body.get("nick"), body.get("rank"), body.get("claim"))
            else:
                u, err = AUTH.enter(body.get("nick"), body.get("claim"))
            if err:
                self._json({"error": err}, 400)
            else:
                self._json({"ok": True, "me": self._me(AUTH.get(u["uid"]))}, headers=self._cookie(AUTH.new_session(u["uid"])))
            return True
        if path == "/api/me":  # 마이페이지 — 희망 급수 변경
            u = self._need()
            if u:
                err = AUTH.set_rank(u["uid"], body.get("rank"))
                self._json({"error": err} if err else {"ok": True, "me": self._me(AUTH.get(u["uid"]))}, 400 if err else 200)
            return True
        if path == "/api/auth/logout":
            AUTH.end_session(self._token())
            self._json({"ok": True}, headers=self._cookie(""))
            return True
        if path == "/api/presence":  # 대기실이 15초마다 — 접속 중 목록에 오른다
            u = self._need()
            if u:
                AUTH.touch(u["uid"], "lobby")
                self._json({"people": AUTH.people(u["uid"])})
            return True
        return False

    def _state(self, room):
        """방 상태 — 엔진이 그 방에서 생각하는 동안(최대 17초)은 잠금을 기다리지 않고 직전 상태를 준다(10-23)."""
        if room.lock.acquire(timeout=0.3, name="state"):
            try:
                if room.presence():  # 조회는 접속 신호가 아니다(분석판·대기실도 읽는다) — 판정만
                    ROOMS.save(room)
                room.cache = json.dumps(room.state(), ensure_ascii=False)
            finally:
                room.lock.release()
        return room.cache or json.dumps({"error": "상대가 생각 중입니다", "busy": True, "room": room.id}, ensure_ascii=False)

    def do_GET(self):
        path, _, query = self.path.partition("?")
        self._user = self._who()
        if path in ("/sw.js", "/pwa/sw.js"):  # PWA(10-23) — 서비스 워커는 범위를 위해 루트에서도 내보낸다
            self._send(200, (HERE / "pwa" / "sw.js").read_bytes(), "text/javascript; charset=utf-8")
            return
        m = re.fullmatch(r"/pwa/([a-z0-9-]+\.(png|webmanifest))", path)
        if m:
            self._send(200, (HERE / "pwa" / m.group(1)).read_bytes(), "image/png" if m.group(2) == "png" else "application/manifest+json")
            return
        if path in ("/", "/index.html", "/shell") or re.fullmatch(rf"/room/{ROOM_ID_RE}", path):
            # /shell = 서비스 워커가 가로채지 않는 같은 화면 — 앱 자동 갱신이 보관본을 새 판으로 바꿀 때 받는다
            # 대기실·대국실은 같은 화면 파일 — 주소로 갈린다(PWA 보관본 1개). 화면에 자기 판본을 새겨 보낸다
            page = (HERE / "index.html").read_bytes().replace(b"__GO_BUILD__", build_id().encode())
            self._send(200, page, "text/html; charset=utf-8")
        elif path == "/api/version":  # 화면 판본 확인(대기실·대국실·감상 공통, 가벼움)
            self._json({"build": build_id()})
        elif path == "/api/auth/ranks":  # 가입 화면의 희망 급수 목록(로그인 전에도)
            self._json({"ranks": [{"v": r, "label": RANK_KO[r]} for r in SIGNUP_RANKS]})
        elif path == "/api/auth/check":  # 아이디 중복 확인 — 가입·입장과 합쳐 IP별 1분 30회
            if not AUTH.rate_ok(self._ip()):
                return self._json({"error": "요청이 너무 많습니다 — 잠시 뒤에 다시 해 주세요"}, 429)
            nick_q = urllib.parse.parse_qs(query).get("nick", [""])[0]
            st, msg = AUTH.check(nick_q)
            self._json({"status": st, "message": msg, "claim": st != "bad" and AUTH.is_admin_nick(nick_q)})
        elif path in ("/api/auth/me", "/api/me"):
            u = self._need()
            if u:
                me = self._me(AUTH.get(u["uid"]), u)
                me.update({"admin": u["uid"] == ADMIN_UID, "local": bool(u.get("local"))})
                out = {"me": me, "ranks": [{"v": r, "label": RANK_KO[r]} for r in SIGNUP_RANKS]}
                if path == "/api/me":
                    out["stats"] = my_stats(u["uid"])
                self._json(out)
        elif path == "/api/rooms":
            u = self._need()
            if u:  # 내 방만 — 남의 방은 목록에 없다
                self._json({"rooms": [r.summary() for r in ROOMS.listing(u["uid"])], "defaults": ROOMS.defaults(u["uid"]),
                            "me": {"nick": u["nick"], "rankKo": rank_ko(AUTH.rank(u["uid"])), "display": AUTH.display_name(u["uid"])}, "people": AUTH.people(u["uid"]), **common_state()})
        elif m := re.fullmatch(rf"/api/rooms/({ROOM_ID_RE})/analysis", path):
            room = ROOMS.get(m.group(1))
            if not room:
                return self._json({"error": "없는 방입니다", "noRoom": True}, 404)
            if not self._need(room):
                return
            self._json(ANALYSES.status(room))  # 덜 끝났으면 계산 줄에 세운다 — 방 파일은 건드리지 않음
        elif m := re.fullmatch(rf"/api/rooms/({ROOM_ID_RE})/(state|sgf)", path):
            room = ROOMS.get(m.group(1))
            if not room:
                return self._json({"error": "없는 방입니다 — 대기실로 돌아가 주세요.", "noRoom": True}, 404)
            if not self._need(room):  # 11-04 남의 방 state·SGF 는 403(관전은 다음 단계)
                return
            if m.group(2) == "state":
                ROOMS.set_focus(room)  # 실시간 분석판이 지금 보는 방을 따라가게
                self._send(200, self._state(room))
            else:
                if not room.moves:
                    return self._json({"error": "아직 둔 수가 없습니다."}, 404)
                name = room.sgf_path.name
                self._send(200, room.sgf_text().encode("utf-8"), "application/x-go-sgf; charset=utf-8",
                           {"Content-Disposition": f"attachment; filename=\"{room.id}.sgf\"; "
                                                   f"filename*=UTF-8''{urllib.parse.quote(name)}"})
        elif path == "/api/state":  # 호환(초점 방) — live_view --goboard 가 이 주소를 읽는다
            u = self._need()
            if not u:
                return
            room = ROOMS.focus_room(u["uid"])
            self._send(200, self._state(room) if room else json.dumps(EMPTY_STATE, ensure_ascii=False))
        elif re.fullmatch(r"/sounds/(custom/)?[A-Za-z0-9_-]+\.wav", path):
            f = HERE / path.lstrip("/")
            if f.exists():
                self._send(200, f.read_bytes(), "audio/wav")
            else:
                self._send(404, '{"error":"없음"}')
        elif re.fullmatch(r"/pack/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\.(mp3|wav)", path):
            _, _, pack, name = path.split("/")
            f = PACKS_DIR / pack / name
            if f.exists():
                self._send(200, f.read_bytes(), "audio/mpeg" if name.endswith(".mp3") else "audio/wav")
            else:
                self._send(404, '{"error":"없음"}')
        elif re.fullmatch(r"/skin/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)", path):
            _, _, pack, name = path.split("/")
            f = SKINS_DIR / pack / name
            ctype = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}[name.rsplit(".", 1)[1]]
            if f.exists():
                self._send(200, f.read_bytes(), ctype)
            else:
                self._send(404, '{"error":"없음"}')
        elif path.startswith("/review/"):
            if not self._need():
                return
            job = REVIEWS.jobs.get(path.split("/")[2])
            if job and not self._need(ROOMS.get(job.get("room"))):  # 리뷰는 방 주인만
                return
            body = REVIEWS.page(path.split("/")[2])
            if body is None:
                self._send(404, "리뷰 없음", "text/plain; charset=utf-8")
            else:
                self._send(200, body, "text/html; charset=utf-8")
        elif path == "/live" or path.startswith("/live/"):
            # 실시간 분석판(live_view, 127.0.0.1:8770) 중계 — 외부(터널·Access)에서 주소 하나로 쓰게(10-23)
            # ?room= 이 붙으면 그 방을 초점으로 — live_view 는 /api/state(초점 방)를 읽는다(10-24)
            # 11-04 분석판은 작가님 계정 방(live_view 가 읽는 /api/state)만 따라간다 — 다른 계정은 소유자 전용 규칙으로 막는다
            u = self._need()
            if not u:
                return
            if u["uid"] != ADMIN_UID:
                return self._json({"error": "실시간 분석판은 아직 작가님 계정 전용입니다.", "forbidden": True}, 403)
            rid = urllib.parse.parse_qs(query).get("room", [None])[0]
            if rid and ROOMS.get(rid):
                if not self._need(ROOMS.get(rid)):
                    return
                ROOMS.set_focus(ROOMS.get(rid))
            try:
                with urllib.request.urlopen("http://127.0.0.1:8770" + (self.path[5:] or "/"), timeout=15) as r:
                    self._send(r.status, r.read(), r.headers.get("Content-Type", "application/octet-stream"))
            except (urllib.error.URLError, OSError) as e:
                self._send(502, f"분석판(8770) 응답 없음 — {e}", "text/plain; charset=utf-8")
        elif path == "/health":
            self._send(200, json.dumps({"ok": True, "strong": ENGINES.strong.ok, "human": ENGINES.human_ok, "monk": ENGINES.monk_ok,
                                        "rooms": len(ROOMS.rooms),
                                        "engineWaits": ENGINES.waits[-10:], "graph": ANALYSES.current}))
        else:
            self._send(404, '{"error":"없음"}')

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            body = {}
        path = self.path.partition("?")[0]
        self._user = self._who()
        if self._auth_post(path, body):
            return
        if path == "/api/import":  # 기보 불러오기(SGF·GIB) — 본문 {name, b64}
            u = self._need()
            if not u:
                return
            name = str(body.get("name") or "기보")[:120]
            try:
                raw = base64.b64decode(body.get("b64") or "", validate=True)
                room, fresh = import_record(name, raw, u["uid"])
            except ImportError_ as e:
                return self._json({"error": f"❌ 불러오기 실패: {name} — {e}"})
            except (ValueError, TypeError) as e:
                return self._json({"error": f"❌ 불러오기 실패: {name} — 파일을 읽지 못했습니다({e})"})
            return self._json({"id": room.id, "dup": not fresh, "label": room.level_label(), "moves": len(room.moves),
                               "note": room.message, "url": f"/room/{room.id}?review=1"})
        if m := re.fullmatch(rf"/api/rooms/({ROOM_ID_RE})/eval", path):
            # 시험수 국면 승률(감상) — 방 상태·파일 무변경, 잠금 없음. 엔진은 대국 요청에 양보
            room = ROOMS.get(m.group(1))
            if not room:
                return self._json({"error": "없는 방입니다", "noRoom": True}, 404)
            if not self._need(room):
                return
            try:
                mv = [(str(c), str(v)) for c, v in body.get("moves", [])][:SIZE * SIZE * 2]
                for c, v in mv:
                    if c not in "BW" or (v.lower() != "pass" and not re.fullmatch(r"[A-HJ-T](1[0-9]|[1-9])", v)):
                        raise ValueError(f"수 형식 {c} {v}")
                color = "W" if mv and mv[-1][0] == "B" else ("B" if mv else ("W" if room.setup else "B"))
                wr, score = ENGINES.quick({"moves": mv, "setup": room.setup, "komi": room.komi}, color, room.rules, urgent=True)
            except (RuntimeError, ValueError) as e:
                return self._json({"error": str(e)})
            return self._json({"winrate": wr, "score": score, "moveNo": len(mv)})
        if m := re.fullmatch(rf"/api/rooms/({ROOM_ID_RE})/audio", path):
            # 오디오 상태 진단(11-05 복귀 묵음 추적) — 방 이벤트 로그에만 남긴다. 방 상태·파일 무변경, 잠금 없음
            room = ROOMS.get(m.group(1))
            if not room:
                return self._json({"error": "없는 방입니다", "noRoom": True}, 404)
            if not self._need(room):
                return
            evs = body.get("evs") if isinstance(body.get("evs"), list) else []
            n = 0
            for e in evs[:50]:
                if not isinstance(e, dict):
                    continue
                clean = {}
                for k, v in list(e.items())[:20]:
                    if not isinstance(k, str) or len(k) > 24 or k in ("t", "action"):
                        continue
                    clean[k] = v if (v is None or isinstance(v, (bool, int, float))) else str(v)[:200]
                EVENTS.add(room.id, action="audio", **clean)
                n += 1
            return self._json({"ok": True, "n": n})
        if path == "/api/rooms":
            u = self._need()
            if not u:
                return
            try:
                room = new_room(body, owner=u["uid"])
            except (RuntimeError, KeyError, ValueError) as e:
                return self._json({"error": str(e)})
            return self._json({"id": room.id, "url": f"/room/{room.id}"})
        m = re.fullmatch(rf"/api/rooms/({ROOM_ID_RE})/(.+)", path)
        lm = re.fullmatch(r"/api/(.+)", path)
        if m and m.group(2) in ACTIONS:
            room, action = ROOMS.get(m.group(1)), m.group(2)
            if not room:
                return self._json({"error": "없는 방입니다 — 대기실로 돌아가 주세요.", "noRoom": True}, 404)
            u = self._need(room)
            if not u:
                return
        elif lm and lm.group(1) in LEGACY_ACTIONS:  # 호환(초점 방) — 로그인한 사람(로컬호스트=작가님)의 초점 방
            u = self._need()
            if not u:
                return
            room, action = ROOMS.focus_room(u["uid"]), lm.group(1)
            if action == "new":
                try:
                    room = new_room(body, room, u["uid"])
                except (RuntimeError, KeyError, ValueError) as e:
                    return self._json({"error": str(e)})
                action = "engine"
            if not room:
                return self._json(dict(EMPTY_STATE, error=EMPTY_STATE["message"]))
        else:
            return self._send(404, '{"error":"없음"}')
        if room.imported and action not in ("review",):
            EVENTS.add(room.id, action=action, result="rejected", error="보기 전용 기보", **ev_move(body))
            return self._json({"error": "지난 대국(가져온 기보)은 볼 수만 있습니다 — 새 대국을 시작해 주세요."})
        AUTH.touch(u["uid"], "room")  # 대국실 ping·동작 = 대국 중(참여자 목록)
        t0 = time.time()
        # 엔진이 이 방에서 생각 중이면 줄 세우지 않고 버린다 — 대기 클릭이 나중에 착수로 바뀌는 경합 차단(10-23).
        # 그 밖의 보유자(상태 조회·ping·감시 저장 등)는 거부 사유가 아니다 — LOCK_WAIT 까지 기다렸다 처리(10-24 첫 수 busy)
        if not room.lock.acquire(blocking=False, name=action):
            if action == "ping":
                room.seen = time.time()  # 잠금 없이 — 엔진이 이 방에서 생각 중이어도 접속은 살아 있다
                return self._send(200, room.cache or json.dumps({"busy": True, "room": room.id}, ensure_ascii=False))
            info = room.lock.held_info()
            if room.thinking or not room.lock.acquire(timeout=LOCK_WAIT, name=action):
                EVENTS.add(room.id, action=action, result="busy", moveNo=len(room.moves), thinking=room.thinking,
                           waitedMs=round((time.time() - t0) * 1000), **info, **ev_move(body))
                return self._json({"busy": True, "error": "상대가 생각 중입니다", "room": room.id}, 409)
            if info.get("holder"):  # 기다렸다 처리한 경우도 남긴다(누가 막고 있었는지)
                EVENTS.add(room.id, action=action, result="waited", waitedMs=round((time.time() - t0) * 1000), **info)
        try:
            ROOMS.set_focus(room)
            if room.heartbeat() and action == "ping":  # 대국자 동작·ping = 접속해 있음. 재접속은 ping 만으로도 저장
                ROOMS.save(room)
            n0 = len(room.moves)
            room.thinking = action in THINK_ACTIONS
            try:
                err, jid, extra = act(room, action, body)
            finally:
                room.thinking = False
            if action not in ("ping", "hint", "judge"):  # 판·결과를 바꿀 수 있는 요청만
                EVENTS.add(room.id, action=action, result="error" if err else "ok", error=err, moveNo=n0,
                           moveNoAfter=len(room.moves), ms=round((time.time() - t0) * 1000), **ev_move(body),
                           engineReply=room.moves[n0 + 1][1] if action == "play" and not err and len(room.moves) > n0 + 1 else None)
            st = room.state()
            st["error"] = err
            st["elapsed"] = round(time.time() - t0, 2)
            st["reviewJob"] = jid
            st.update(extra)
            room.cache = json.dumps(st, ensure_ascii=False)
        finally:
            room.lock.release()
        self._send(200, room.cache)


# 1회 마이그레이션 — 기동 때 적용, rooms/_migrations.json 에 기록(재기동해도 다시 하지 않음). 방 파일은 지우지 않는다
MIGRATIONS = [{
    "id": "20261024-old-rule-rooms",
    # 출처: 작가님 10-24 22:34 "B" — 옛 24시간 규칙 방을 끝난 판으로(ORDER_20261024 옛규칙방정리)
    "forfeit": ["20261024-105112-9bab"],
    "void": ["20261024-101721-0a1d", "20261024-101731-0967", "20261024-105102-a53c", "20261024-154735-b4f1"],
}, {
    # 11-04 작가님 10:25 "이어서두기는 필요없는 기능이야 삭제 그판은 어떤결과던 그 자체로 종결" — 이어두기 폐지, 떠난 판은 그 자체로 종결.
    # 기동 시점에 결과 없는 진행 중 방 전부(수 있으면 접속 장애패, 0수면 무효)
    "id": "20261104-no-resume-cleanup",
    "all_ongoing": True,
}]


def run_migrations():
    f = ROOMS_DIR / "_migrations.json"
    try:
        done = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    except (OSError, ValueError) as e:
        print(f"❌ go-board: 마이그레이션 기록 읽기 실패 — {e} (이번 기동은 건너뜀)", file=sys.stderr, flush=True)
        return []
    out = []
    for mg in MIGRATIONS:
        if mg["id"] in done:
            continue
        applied = []
        targets = [("forfeit" if r.moves else "void", r.id) for r in ROOMS.listing() if r._ongoing()] if mg.get("all_ongoing") else None
        for kind, rid in (targets if targets is not None else [(k, i) for k in ("forfeit", "void") for i in mg[k]]):
            r = ROOMS.get(rid)
            if not r or r.result or r.imported:  # 없거나 이미 끝난 방은 건드리지 않음
                applied.append({"room": rid, "kind": kind, "skipped": "없음" if not r else "이미 끝남"})
                continue
            with r.lock.hold("migration"):
                r.scoring, r.offline, r.dc_mark = None, False, None
                if kind == "forfeit":
                    r.result, r.result_reason = f"{r.eng_color}+F", "rule-cleanup"
                    r.message = ("접속 장애패 — 11-04 이어두기 폐지 정리(떠난 판은 그 자체로 종결)" if mg.get("all_ongoing")
                                 else "접속 장애패 — 규칙 단일화 정리 10-24(옛 24시간 규칙 방)")
                else:
                    r.result, r.result_reason = VOID, "void"
                    r.message = ("무효 종료 — 11-04 이어두기 폐지 정리(한 수도 두지 않은 판)" if mg.get("all_ongoing")
                                 else "무효 종료 — 빈 방 정리(원인 미상 — 착수 미수신)")
                r.save_sgf()
                r.cache = json.dumps(r.state(), ensure_ascii=False)
                ROOMS.save(r)
            EVENTS.add(rid, action="migration", migration=mg["id"], result=r.result, reason=r.result_reason, moveNo=len(r.moves))
            applied.append({"room": rid, "kind": kind, "result": r.result, "moves": len(r.moves)})
        done[mg["id"]] = {"at": datetime.now().isoformat(timespec="seconds"), "rooms": applied}
        tmp = ROOMS_DIR / "._migrations.json.tmp"
        ROOMS_DIR.mkdir(parents=True, exist_ok=True)
        tmp.write_text(json.dumps(done, ensure_ascii=False, indent=1), encoding="utf-8")
        os.replace(tmp, f)
        out.append(f"{mg['id']}: " + ", ".join(f"{a['room'][-4:]}={a.get('result') or a.get('skipped')}" for a in applied))
    return out


def presence_loop():
    """2초마다 진행 중 방의 접속 판정·장애 시계·장애패 — 화면이 아무도 없어도 판정이 난다. 엔진 생각 중인 방은 건너뛴다."""
    while True:
        time.sleep(2)
        for r in ROOMS.listing():
            if not r._ongoing() or not r.lock.acquire(blocking=False, name="presence"):
                continue
            try:
                if r.presence():
                    r.cache = json.dumps(r.state(), ensure_ascii=False)
                    ROOMS.save(r)
            except Exception as e:  # noqa: BLE001 — 감시가 죽지 않게, 실패는 로그로
                print(f"❌ go-board: 접속 판정 실패 {r.id} — {e}", file=sys.stderr, flush=True)
            finally:
                r.lock.release()


def main():
    global ENGINES, ROOMS
    if TEST_MODE and PORT == LIVE_PORT:
        sys.exit(f"❌ go-board: 테스트 모드는 실사용 포트 {LIVE_PORT}를 쓸 수 없음")
    strong, human, human_reason, monk, monk_reason = build_engines()
    ths = [threading.Thread(target=e.start) for e in (strong, human, monk) if e and not e.error]
    for t in ths:
        t.start()
    for t in ths:
        t.join()
    ENGINES = EngineHub(strong, human, human_reason, monk, monk_reason)
    ROOMS = Rooms(LocalRoomStore(ROOMS_DIR))
    global AUTH, EVENTS
    AUTH = Auth()  # 11-04 작가님 — 테스트 아이디 개방(단계 ②-1)
    AUTH.ensure_claim()
    EVENTS = EventLog(ROOMS_DIR)
    imported = ROOMS.load()
    migrated = run_migrations()
    threading.Thread(target=presence_loop, daemon=True).start()
    global ANALYSES
    ANALYSES = Analyses()
    threading.Thread(target=ANALYSES.loop, daemon=True).start()
    live = sum(1 for r in ROOMS.rooms.values() if r.status != "ended")
    srv = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"✅ go-board: http://{HOST}:{PORT}/  (최강 {'OK' if strong.ok else '실패'}, "
          f"급수 {'OK' if ENGINES.human_ok else '비활성: ' + str(ENGINES.human_why())}, "
          f"MONK {'OK' if ENGINES.monk_ok else '비활성: ' + str(ENGINES.monk_why())}) · "
          f"방 {len(ROOMS.rooms)}개 복원(진행 중 {live}, 이전 기보 가져옴 {imported}) · 저장소 {ROOMS_DIR}",
          flush=True)
    for line in migrated:  # 기동 줄 뒤에(run.sh 는 첫 줄만 보인다)
        print(f"✅ go-board 마이그레이션 {line}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        for e in (strong, human, monk):
            if e and e.ok:
                try:
                    e.cmd("quit")
                except RuntimeError:
                    pass


if __name__ == "__main__":
    main()
