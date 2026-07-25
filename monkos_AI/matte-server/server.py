import base64
import io
import json
import os
import statistics
import threading
import time
import logging
from collections import deque
from contextlib import asynccontextmanager

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from PIL import Image
from torchvision import transforms
from transformers import AutoModelForImageSegmentation
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("matte-server")

model = None
device = None
transform = None

# --- 동시성 가드 (2026-07-25, INCIDENT_20260725 대응) ---------------------
# 무제한 동시 진입 → VRAM 스래싱으로 16건이 14분 소요된 사건의 구조적 차단.
# 원칙: 느린 수락(대기)을 빠른 거절(503)로 바꾼다. 대기열을 만들지 않는다.
MAX_CONCURRENT = int(os.environ.get("MATTE_MAX_CONCURRENT", "1"))
_slots = threading.Semaphore(MAX_CONCURRENT)
_state_lock = threading.Lock()
_inflight_started = {}            # req_seq -> perf_counter 시작 시각
_req_seq = 0
_recent_ms = deque(maxlen=5)      # 최근 처리시간(ms, 총 핸들러 기준)
_last_done_at = None              # 마지막 완료 시각 (time.time)
_last_done_perf = None            # 마지막 완료 시각 (perf_counter — 샘플러 쿨다운 판정용)
_rejected_503 = 0                 # 포화 거절 누적


def _acquire_slot():
    """비대기 획득. 성공 시 요청 일련번호, 실패 시 None."""
    global _req_seq
    if not _slots.acquire(blocking=False):
        return None
    with _state_lock:
        _req_seq += 1
        seq = _req_seq
        _inflight_started[seq] = time.perf_counter()
    return seq


def _release_slot(seq, elapsed_ms=None):
    global _last_done_at, _last_done_perf
    with _state_lock:
        _inflight_started.pop(seq, None)
        _last_done_perf = time.perf_counter()   # 성패 무관 — GPU를 만졌으면 쿨다운 대상
        if elapsed_ms is not None:
            _recent_ms.append(round(elapsed_ms, 1))
            _last_done_at = time.time()
    _slots.release()


def _saturation_snapshot():
    """포화 신호. /health 노출용 — 무음 강등 방지(탐지 목적)."""
    now = time.perf_counter()
    with _state_lock:
        starts = list(_inflight_started.values())
        recent = list(_recent_ms)
        last_done = _last_done_at
        rejected = _rejected_503
    oldest = round(max((now - s for s in starts), default=0.0), 1)
    return {
        "inflight": len(starts),
        "max_concurrent": MAX_CONCURRENT,
        "oldest_inflight_sec": oldest,
        "recent_matte_ms": recent,
        "last_matte_ms": recent[-1] if recent else None,
        "last_completed_age_sec": round(time.time() - last_done, 1) if last_done else None,
        "rejected_503_total": rejected,
    }


# --- GPU 외부 점유 감지 (2026-07-25, 작가님 지시) --------------------------
# 이 서버가 놀고 있는데(inflight=0) GPU 사용률이 높으면 = 남이 GPU를 쓰고 있다.
# 07-25 20:16 실사고: Roblox가 GPU를 점유해 단독 추론이 909ms→144,749ms(160배).
# /health 200·inflight 0이라 라우터가 "건강"으로 오판한 구간을 이 신호가 메운다.
#
# 판정은 「창 최대값」으로 한다 — 실측(30초·150샘플·3초창 10개): 최대 기준 임계 20%는
# 10/10 정확, 평균 기준은 4/10만 검출(게임 부하는 3초 내내 조용한 구간이 실재).
# 비용 비대칭도 같은 방향이다: 「한가」오판 = 4060 전송 후 25초 낭비(유저 피해),
# 「점유」오판 = RunPod 직행 0.4초(경미). 그러므로 점유 쪽으로 편향한다.
OCC_INTERVAL_MS = int(os.environ.get("MATTE_OCCUPANCY_INTERVAL_MS", "250"))
OCC_WINDOW_SEC = float(os.environ.get("MATTE_OCCUPANCY_WINDOW_SEC", "10"))
OCC_BUSY_PCT = int(os.environ.get("MATTE_FOREIGN_BUSY_PCT", "20"))
# ⚠️ inflight 플래그는 GPU 사용률보다 먼저 떨어진다. NVML utilization은 직전 구간의
# 평균이라 본질적으로 후행하고, 커널 종료·메모리 해제도 즉시가 아니다. 그래서 잡이 끝난
# 직후 샘플은 inflight=0인데 사용률이 여전히 높다 → 자기 추론을 외부 점유로 오분류한다.
# (07-25 실측: 자체 잡 2회만 돌렸는데 foreign_util_max=100 관측. 방치하면 라우터가
#  4060을 영구히 회피하는 무음 실패가 된다.) 완료 후 쿨다운 동안의 표본을 배제한다.
OCC_SELF_COOLDOWN_SEC = float(os.environ.get("MATTE_OCCUPANCY_SELF_COOLDOWN_SEC", "2.0"))
# 활성 판정 임계 — 실측 기준: 정적 점유 sd 0.8~1.5 / dmean 0.1~0.3,
# 활성 점유 sd 15.6~19.1 / dmean 1.6~2.4. 한 자릿수 대 두 자릿수라 여유가 크다.
OCC_ACTIVE_SD = float(os.environ.get("MATTE_FOREIGN_ACTIVE_SD", "5"))
OCC_ACTIVE_DMEAN = float(os.environ.get("MATTE_FOREIGN_ACTIVE_DMEAN", "1.0"))
# 포화 상한 (작가님 지적) — 정적이어도 사용률이 꽉 차 있으면 우리 몫이 남지 않는다.
# 초기값은 보수적 추정이며 jobs.jsonl 축적 후 실측으로 조정할 대상이다.
OCC_SATURATED_PCT = int(os.environ.get("MATTE_FOREIGN_SATURATED_PCT", "90"))

_occ_lock = threading.Lock()
_occ_samples = deque()            # (mono, util_pct, inflight_at_sample)
_occ_last_at = None               # 마지막 성공 샘플 시각 (perf_counter)
_occ_status = "starting"          # ok | starting | 실패 사유 — 무음 0 금지
_nvml_handle = None
_self_pid = os.getpid()


def _occupancy_sampler():
    """상시 저비용 샘플러. pynvml 실측 0.015ms/회 → 250ms 간격 duty ≈ 0.006%."""
    global _occ_last_at, _occ_status, _nvml_handle
    try:
        import pynvml
        pynvml.nvmlInit()
        _nvml_handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        _occ_status = "ok"
        logger.info(f"GPU 점유 샘플러 시작 (간격 {OCC_INTERVAL_MS}ms, 창 {OCC_WINDOW_SEC}s, 임계 {OCC_BUSY_PCT}%)")
    except Exception as e:
        # 무음 강등 금지 — 사유를 그대로 노출한다.
        _occ_status = f"unavailable: {type(e).__name__}: {e}"
        logger.error(f"GPU 점유 샘플러 기동 실패 → 외부 점유 판정 불가: {_occ_status}")
        return

    while True:
        try:
            util = pynvml.nvmlDeviceGetUtilizationRates(_nvml_handle).gpu
            now = time.perf_counter()
            with _state_lock:
                inflight = len(_inflight_started)
                last_done = _last_done_perf
            # 우리 흔적: 진행 중이거나, 방금 끝나 사용률이 아직 안 내려간 구간.
            ours = inflight > 0 or (last_done is not None and now - last_done < OCC_SELF_COOLDOWN_SEC)
            with _occ_lock:
                _occ_samples.append((now, util, 1 if ours else 0))
                cutoff = now - OCC_WINDOW_SEC
                while _occ_samples and _occ_samples[0][0] < cutoff:
                    _occ_samples.popleft()
                _occ_last_at = now
                _occ_status = "ok"
        except Exception as e:
            with _occ_lock:
                _occ_status = f"error: {type(e).__name__}: {e}"
        time.sleep(OCC_INTERVAL_MS / 1000.0)


def _occupancy_snapshot():
    """외부 점유 신호. 판정 불가일 때 False가 아니라 None을 준다(보수적 소비 유도)."""
    now = time.perf_counter()
    with _occ_lock:
        samples = list(_occ_samples)
        last_at = _occ_last_at
        status = _occ_status

    age = round(now - last_at, 2) if last_at is not None else None
    # 우리가 안 쓰던 순간(+완료 쿨다운 경과)의 표본만이 '외부' 점유의 증거가 된다.
    foreign = [u for _, u, ours in samples if ours == 0]
    fresh = status == "ok" and age is not None and age <= max(2.0, OCC_INTERVAL_MS / 250.0)

    if not fresh or not foreign:
        busy = None                       # 알 수 없음 — 소비자는 보수적으로 다뤄야 한다
    else:
        busy = max(foreign) >= OCC_BUSY_PCT

    procs = None
    if _nvml_handle is not None and status == "ok":
        try:
            import pynvml
            procs = len([p for p in pynvml.nvmlDeviceGetComputeRunningProcesses(_nvml_handle)
                         if p.pid != _self_pid])
        except Exception:
            procs = None

    # 활성도 축 (작가님 지적, 07-25 21:50) — 점유율만으로는 부족하다.
    # 실측: 정적 점유(트레이 대기 게임)는 55~57%를 유지하면서 표준편차 1.1·연속차분 0.2로
    # 거의 계단 함수다. 반면 활성 게임은 같은 3초 창에서 범위 44~78로 요동친다.
    # 그리고 정적 55% 하에서 우리 잡은 1,184~1,563ms — 기준선 1,054ms 대비 1.1~1.5배로
    # 사실상 무해했다(활성기 144,749ms=160배와 대조). 즉 **피해야 할 것은 점유가 아니라 활성**이다.
    sd = dmean = None
    if len(foreign) >= 2:
        sd = round(statistics.pstdev(foreign), 1)
        dmean = round(statistics.mean(
            [abs(foreign[i] - foreign[i - 1]) for i in range(1, len(foreign))]), 2)
    active = None
    if fresh and sd is not None:
        active = sd >= OCC_ACTIVE_SD or dmean >= OCC_ACTIVE_DMEAN

    return {
        "sampler_status": status,
        "sampler_age_sec": age,           # 신선도 도장 — 소비자가 묻지 않고 낡은 광고를 버린다
        "gpu_util_now": samples[-1][1] if samples else None,
        "foreign_util_max": max(foreign) if foreign else None,
        "foreign_util_sd": sd,            # 활성도 — 정적 점유는 1 내외, 활성은 두 자릿수
        "foreign_util_dmean": dmean,      # 연속차분 평균 — 흔들림 강도
        "foreign_active": active,         # True(활성 경합)/False(정적 점유)/None(판정불가)
        "foreign_saturated": (max(foreign) >= OCC_SATURATED_PCT) if (fresh and foreign) else None,
        "foreign_saturated_pct": OCC_SATURATED_PCT,
        "foreign_samples": len(foreign),
        "foreign_busy": busy,             # True/False/None — 점유 여부(활성 여부와 별개)
        "foreign_busy_pct": OCC_BUSY_PCT,
        "foreign_active_sd": OCC_ACTIVE_SD,
        "foreign_procs": procs,
        "window_sec": OCC_WINDOW_SEC,
    }


# --- 잡별 텔레메트리 (2026-07-25, 작가님 지시) ------------------------------
# "활성도와 라이브 점유율에 따른 속도변화 그래프를 잡으면 패턴함수가 나온다."
# 잡 시작 시점의 GPU 상태(예측변수) + 실제 소요(결과변수)를 1줄씩 append.
# 임계값(OCC_BUSY_PCT·OCC_ACTIVE_SD·OCC_SATURATED_PCT)은 이 데이터로 사후 조정한다.
# 상태는 반드시 **잡 시작 시점**에 찍는다 — 종료 시점은 우리 자신의 부하로 오염된다.
JOBLOG_PATH = os.environ.get(
    "MATTE_JOBLOG", os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs", "jobs.jsonl"))
_joblog_lock = threading.Lock()


def _joblog(record):
    """append-only JSONL. 실패해도 서비스에 영향 주지 않되 조용히 삼키지 않는다."""
    try:
        os.makedirs(os.path.dirname(JOBLOG_PATH), exist_ok=True)
        line = json.dumps(record, ensure_ascii=False)
        with _joblog_lock:
            with open(JOBLOG_PATH, "a", encoding="utf-8") as f:
                f.write(line + "\n")
    except Exception as e:
        logger.warning(f"joblog 기록 실패({type(e).__name__}: {e}) — 측정 손실")


def load_model():
    global model, device, transform
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available - GPU required")
    device = torch.device("cuda")
    vram_total = torch.cuda.get_device_properties(0).total_memory
    logger.info(f"GPU: {torch.cuda.get_device_name(0)}, VRAM: {vram_total / 1024**3:.1f}GB")

    model = AutoModelForImageSegmentation.from_pretrained(
        "ZhengPeng7/BiRefNet", trust_remote_code=True
    )
    model.float().to(device).eval()
    torch.set_float32_matmul_precision("high")

    transform = transforms.Compose([
        transforms.Resize((1024, 1024)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    logger.info(f"BiRefNet model loaded (max_concurrent={MAX_CONCURRENT})")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    threading.Thread(target=_occupancy_sampler, name="gpu-occupancy", daemon=True).start()
    yield


app = FastAPI(title="BiRefNet Matte Server", lifespan=lifespan)

MATTE_SECRET = os.environ.get("MATTE_SECRET", "")


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    if MATTE_SECRET and request.headers.get("X-Matte-Secret") != MATTE_SECRET:
        return JSONResponse(status_code=403, content={"error": "Forbidden"})
    return await call_next(request)


@app.get("/health")
def health():
    cuda = torch.cuda.is_available()
    gpu_name = torch.cuda.get_device_name(0) if cuda else "N/A"
    vram_used = torch.cuda.memory_allocated(0) / 1024**2 if cuda else 0
    vram_total = torch.cuda.get_device_properties(0).total_memory / 1024**2 if cuda else 0
    body = {
        "status": "ok",
        "gpu": gpu_name,
        "vram_used_mb": round(vram_used, 1),
        "vram_total_mb": round(vram_total, 1),
        # nvidia-smi 총량은 torch 캐싱 할당자 때문에 잡당 증분을 못 보여준다.
        # 잡당 VRAM 실측은 아래 두 값으로 한다 (peak는 단조 증가, 라운드 전후 차이로 읽는다).
        "vram_reserved_mb": round(torch.cuda.memory_reserved(0) / 1024**2, 1) if cuda else 0,
        "vram_peak_allocated_mb": round(torch.cuda.max_memory_allocated(0) / 1024**2, 1) if cuda else 0,
        "model": "loaded" if model is not None else "unloaded",
    }
    body.update(_saturation_snapshot())
    body.update(_occupancy_snapshot())
    return body


def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return (255, 255, 255)
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


class MatteRequest(BaseModel):
    image: str
    bgColor: str = Field(default="#FFFFFF")


def run_matte(img):
    orig_w, orig_h = img.size
    t0 = time.perf_counter()

    input_tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        preds = model(input_tensor)[-1].sigmoid()
    mask = preds[0].squeeze()
    mask = torch.nn.functional.interpolate(
        mask.unsqueeze(0).unsqueeze(0), size=(orig_h, orig_w), mode="bilinear", align_corners=False
    ).squeeze()

    elapsed_ms = (time.perf_counter() - t0) * 1000
    return mask.cpu().numpy(), elapsed_ms


@app.post("/matte")
@app.post("/api/matte")
def matte(req: MatteRequest):
    global _rejected_503
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # 포화 시 대기 없이 즉시 거절 — 클라이언트가 밀리초 안에 다음 엔드포인트로 간다.
    seq = _acquire_slot()
    if seq is None:
        with _state_lock:
            _rejected_503 += 1
            rejected = _rejected_503
        logger.info(f"Matte 503 busy (max_concurrent={MAX_CONCURRENT}, rejected_total={rejected})")
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "Matte server busy", "maxConcurrent": MAX_CONCURRENT},
            headers={"Retry-After": "1"},
        )

    t_start = time.perf_counter()
    occ_at_start = _occupancy_snapshot()   # 예측변수는 반드시 시작 시점 — 종료 시점은 자기 부하로 오염된다
    try:
        try:
            img_bytes = base64.b64decode(req.image)
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image")

        try:
            mask_np, elapsed_ms = run_matte(img)
        except torch.cuda.OutOfMemoryError:
            torch.cuda.empty_cache()
            return JSONResponse(status_code=507, content={"success": False, "error": "GPU VRAM insufficient"})

        bg_rgb = hex_to_rgb(req.bgColor)
        img_np = np.array(img)
        mask_3d = mask_np[:, :, np.newaxis]
        bg = np.full_like(img_np, bg_rgb, dtype=np.uint8)
        composited = (img_np * mask_3d + bg * (1 - mask_3d)).astype(np.uint8)

        buf = io.BytesIO()
        Image.fromarray(composited).save(buf, format="JPEG", quality=95)
        result_b64 = base64.b64encode(buf.getvalue()).decode()

        total_ms = (time.perf_counter() - t_start) * 1000
        logger.info(
            f"Matte {img.size[0]}x{img.size[1]} bg={req.bgColor} in {elapsed_ms:.0f}ms (total {total_ms:.0f}ms)"
        )
        _joblog({
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "w": img.size[0], "h": img.size[1],          # 크기는 소요의 교란변수 — 반드시 같이 남긴다
            "px": img.size[0] * img.size[1],
            "infer_ms": round(elapsed_ms, 1),
            "total_ms": round(total_ms, 1),
            # 예측변수 (잡 시작 시점 GPU 상태)
            "util_now": occ_at_start.get("gpu_util_now"),
            "f_max": occ_at_start.get("foreign_util_max"),
            "f_sd": occ_at_start.get("foreign_util_sd"),
            "f_dmean": occ_at_start.get("foreign_util_dmean"),
            "f_active": occ_at_start.get("foreign_active"),
            "f_busy": occ_at_start.get("foreign_busy"),
            "f_sat": occ_at_start.get("foreign_saturated"),
            "f_procs": occ_at_start.get("foreign_procs"),
            "f_samples": occ_at_start.get("foreign_samples"),
            "sampler": occ_at_start.get("sampler_status"),
        })
        return {
            "success": True,
            "image": result_b64,
            "meta": {"elapsedSec": round(elapsed_ms / 1000, 3)},
        }
    finally:
        _release_slot(seq, (time.perf_counter() - t_start) * 1000)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
