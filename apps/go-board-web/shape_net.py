"""형세 보기(칸 소유·사석 표시) — 형세 소형망 v0(onnx) → 실패 시 코드 형세(go_codeeval S1).

출처: 작가님 11-08 10:49 승인(ORDER_20261108 막내7 §1). 표시만 바꾼다 — 집 숫자·형세 막대 수치·계가는 그대로(코드 계가·판정 엔진).
망 규약(AI_Factory/go_own/README.md): 입력 planes [B,8,19,19] = 흑·백·빈칸·흑 차례·활로1·활로2·활로3+·판 안,
칸 번호 = y·19 + x(y=0 위, x=0 A열), 출력 own tanh[361] 흑 기준(+1 흑 땅).
무음 강등 금지: 망을 못 쓰면 이유를 로그 1줄(이유가 바뀔 때만) 남기고 결과에 src="code"·why 를 싣는다.
"""
import os
import sys
import threading
from pathlib import Path

SIZE = 19
N = SIZE * SIZE
MODEL = Path(os.environ.get("GO_OWN_MODEL") or Path.home() / ".monkos" / "go-board" / "models" / "own_v0" / "run1" / "own_v0.onnx")
CODEEVAL_DIR = Path(__file__).resolve().parents[2] / "AI_Factory" / "go_codeeval"
OWN_MIN = 0.3  # 이보다 약한 소유는 칠하지 않는다(중립)
DEAD_MIN = 0.5  # 돌 칸 소유가 상대 쪽으로 이만큼 넘으면 사석 표시

_lock = threading.Lock()
_sess = None
_why_net = None  # 망을 못 쓰는 이유(한 번 실패하면 모델 파일이 바뀔 때까지 재시도 안 함)
_last_log = None
_cache = {}  # (setup, moves) → 결과 — 같은 국면 반복 요청(폴링)을 줄인다


def _log(msg):
    global _last_log
    if msg != _last_log:
        _last_log = msg
        print(f"⚠️ go-board: 형세 보기 — {msg}", file=sys.stderr)


def _session():
    global _sess, _why_net
    if _sess is not None:
        return _sess
    if _why_net:
        return None
    try:
        import numpy  # noqa: F401
        import onnxruntime as ort
        if not MODEL.exists():
            raise FileNotFoundError(f"모델 없음 {MODEL}")
        so = ort.SessionOptions()
        so.intra_op_num_threads = 1  # 대국 엔진과 CPU 를 다투지 않게
        so.inter_op_num_threads = 1
        _sess = ort.InferenceSession(str(MODEL), so, providers=["CPUExecutionProvider"])
        print(f"✅ go-board: 형세 보기 = 형세망 {MODEL.name} (onnxruntime {ort.__version__})", file=sys.stderr)
        return _sess
    except Exception as e:  # 모델 부재·패키지 부재·로드 실패 — 코드 형세로
        _why_net = f"{type(e).__name__}: {e}"
        _log(f"형세망 사용 불가 → 코드 형세로 표시 ({_why_net})")
        return None


def _board(moves, setup):
    """수순 → (판 361 리스트 1/−1/0, 따낸 돌) — go_codeeval.replay 와 같은 규칙"""
    if str(CODEEVAL_DIR) not in sys.path:
        sys.path.insert(0, str(CODEEVAL_DIR))
    import codeeval as ce
    return ce, ce.replay(moves, setup)


def _planes(ce, b, tomove_black, caps=None, cin=8):
    import numpy as np
    bd = np.array(b, dtype=np.int8)
    lib = np.zeros(N, dtype=np.int8)
    seen = set()
    for i in range(N):
        if b[i] and i not in seen:
            stones, libs = ce.block(b, i)
            seen |= stones
            v = min(len(libs), 3)
            for s in stones:
                lib[s] = v
    one = np.ones(N, dtype=np.float32)
    pl = [bd == 1, bd == -1, bd == 0, one * (1 if tomove_black else 0), lib == 1, lib == 2, lib >= 3, one]
    if cin == 9:  # v1 망(own_v1.onnx) — 포로 차 면 = (흑이 딴 돌 − 백이 딴 돌) / 20
        pl.append(one * ((caps[1] - caps[-1]) / 20.0))
    x = np.stack(pl).astype(np.float32)
    return x.reshape(1, cin, SIZE, SIZE)


def evaluate(moves, setup=(), komi=6.5):
    """→ {"src": "net"|"code", "own": [361, 흑 기준 −1..1(소수 둘째 자리)], "dead": [[x, y]...], "why": 강등 사유|None}.
    사석·소유는 표시용. 집 숫자는 이 결과로 세지 않는다."""
    key = (tuple(setup), tuple(tuple(m) for m in moves))
    with _lock:
        if key in _cache:
            return _cache[key]
        ce, (b, caps) = _board(moves, setup)
        tomove_black = moves[-1][0] == "W" if moves else not setup  # 접바둑 시작 = 백 차례
        res = None
        sess = _session()
        if sess is not None:
            try:
                cin = sess.get_inputs()[0].shape[1]  # v0 = 8 · v1 = 9(포로 차 면)
                own = sess.run(["own"], {"planes": _planes(ce, b, tomove_black, caps, cin)})[0][0].tolist()
                dead = [i for i in range(N) if b[i] and own[i] * b[i] < -DEAD_MIN]
                res = {"src": "net", "own": own, "dead": dead, "why": None}
            except Exception as e:  # 런타임 오류 — 이번 국면만 코드 형세로(다음 요청에서 다시 망 시도)
                _log(f"형세망 실행 오류 → 코드 형세로 표시 ({type(e).__name__}: {e})")
                res = None
                why = f"실행 오류 {type(e).__name__}"
        else:
            why = _why_net
        if res is None:
            r = ce.evaluate(moves, setup, komi, use_life="staged")
            res = {"src": "code", "own": [float(v) for v in r["own"]], "dead": list(r["dead"]), "why": why}
        out = {"src": res["src"], "why": res["why"],
               "own": [round(v, 2) if abs(v) >= OWN_MIN else 0 for v in res["own"]],
               "dead": [[p % SIZE, p // SIZE] for p in sorted(res["dead"])]}
        if len(_cache) > 256:
            _cache.clear()
        _cache[key] = out
        return out


if __name__ == "__main__":  # 스모크: python3 -I shape_net.py
    import time
    mv = [("B", "D4"), ("W", "Q16"), ("B", "Q4"), ("W", "D16"), ("B", "C14")]
    t0 = time.time(); r = evaluate(mv); t1 = time.time()
    print(r["src"], r["why"], f"{1000 * (t1 - t0):.1f}ms", "흑칸", sum(v > 0 for v in r["own"]), "백칸", sum(v < 0 for v in r["own"]), "사석", r["dead"])
