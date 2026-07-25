#!/usr/bin/env python3
"""matte_loadtest.py — 4060 매팅 서버 동시성/부하 측정기

INCIDENT_20260725(무료 매팅 504) 대응. 동시 N 구간에서 ①요청당 지연 ②잡당 VRAM
③503 발생률을 실측한다. 크로스환경 체커 L2 부하 시험의 원형.

정본: scripts/tools/matte_loadtest.py (실행 사본은 4060 C:\\Users\\smuse73\\matte-server\\)

인증: X-Matte-Secret 값을 **stdin 첫 줄**로만 받는다.
      값을 인자·환경변수·로그에 남기지 않는다 (헌법 4조 1항).

사용:
    scripts/secret.sh get MATTE_SECRET | python matte_loadtest.py --n 4
    echo "$SECRET" | python matte_loadtest.py --n 1 --repeat 3 --size 1200x1600

출력: JSON 1건 (stdout). 그 외 진행 로그는 stderr.
"""
import argparse
import base64
import io
import json
import statistics
import subprocess
import sys
import threading
import time

import requests
from PIL import Image, ImageDraw


def make_image(width, height):
    """합성 인물 유사 이미지 — 세그멘테이션 품질이 아니라 지연·VRAM 측정용."""
    img = Image.new("RGB", (width, height), (210, 215, 225))
    d = ImageDraw.Draw(img)
    cx, cy = width // 2, int(height * 0.42)
    r = int(min(width, height) * 0.18)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(226, 190, 165))          # 얼굴
    d.rectangle([cx - r * 2, cy + r, cx + r * 2, height], fill=(60, 70, 90))    # 상체
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return base64.b64encode(buf.getvalue()).decode()


class VramSampler(threading.Thread):
    """nvidia-smi + /health 동시 폴링.

    ⚠️ nvidia-smi 총량만으로는 잡당 VRAM을 못 본다 — torch 캐싱 할당자가 이미 잡아둔
    풀 안에서 재사용하므로 총량이 상수로 보인다. 잡당 증분은 /health 의
    vram_allocated / vram_reserved / vram_peak 로 읽는다.
    """

    def __init__(self, health_url, interval=0.25):
        super().__init__(daemon=True)
        self.health_url = health_url
        self.interval = interval
        self.samples = []       # (smi_mem, smi_util)
        self.health = []        # (allocated, reserved, peak, inflight)
        self._stop = threading.Event()
        # /health 폴링은 별도 스레드. nvidia-smi 는 Windows에서 1초 이상 걸릴 때가 있어
        # 같은 루프에 두면 짧은 잡의 inflight 구간을 통째로 놓친다.
        self._health_thread = threading.Thread(target=self._poll_health, daemon=True)

    def _poll_health(self):
        while not self._stop.is_set():
            try:
                h = requests.get(self.health_url, timeout=3).json()
                self.health.append((
                    h.get("vram_used_mb"), h.get("vram_reserved_mb"),
                    h.get("vram_peak_allocated_mb"), h.get("inflight"),
                ))
            except Exception:
                pass
            self._stop.wait(0.05)

    def start(self):
        super().start()
        self._health_thread.start()

    def run(self):
        while not self._stop.is_set():
            try:
                out = subprocess.check_output(
                    ["nvidia-smi", "--query-gpu=memory.used,utilization.gpu",
                     "--format=csv,noheader,nounits"],
                    stderr=subprocess.DEVNULL, timeout=5,
                ).decode().strip().splitlines()[0]
                mem, util = [int(x.strip()) for x in out.split(",")]
                self.samples.append((mem, util))
            except Exception:
                pass
            self._stop.wait(self.interval)

    def stop(self):
        self._stop.set()
        self.join(timeout=5)
        self._health_thread.join(timeout=5)
        mems = [m for m, _ in self.samples]
        utils = [u for _, u in self.samples]

        def _max(idx):
            vals = [h[idx] for h in self.health if h[idx] is not None]
            return max(vals) if vals else None

        return {
            "smi_vram_used_mb_min": min(mems) if mems else None,
            "smi_vram_used_mb_max": max(mems) if mems else None,
            "gpu_util_max": max(utils) if utils else None,
            "torch_allocated_mb_max": _max(0),
            "torch_reserved_mb_max": _max(1),
            "torch_peak_allocated_mb": _max(2),
            # ⚠️ inflight_max 는 best-effort 다. 부하 생성기를 4060 로컬에서 돌리면
            #    응답 base64/JSON 처리가 CPU를 물어 폴링 스레드가 굶는다 —
            #    잡이 짧으면 0 으로 나올 수 있다(서버 결함 아님).
            #    포화 신호 확증이 목적이면 별도 프로세스에서 /health 를 폴링할 것.
            "inflight_max": _max(3),
            "samples": len(self.samples),
        }


def fire(url, secret, payload, timeout, results, idx, barrier):
    barrier.wait()
    t0 = time.perf_counter()
    status, err = None, None
    try:
        r = requests.post(url, json=payload, headers={"X-Matte-Secret": secret}, timeout=timeout)
        status = r.status_code
    except Exception as e:
        err = type(e).__name__
    results[idx] = {
        "status": status,
        "latency_ms": round((time.perf_counter() - t0) * 1000, 1),
        "error": err,
    }


def run_round(url, secret, payload, n, timeout, health_url):
    sampler = VramSampler(health_url)
    sampler.start()
    time.sleep(0.6)  # 기준선 확보
    results = [None] * n
    barrier = threading.Barrier(n)
    threads = [
        threading.Thread(target=fire, args=(url, secret, payload, timeout, results, i, barrier))
        for i in range(n)
    ]
    t0 = time.perf_counter()
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    wall_ms = round((time.perf_counter() - t0) * 1000, 1)
    vram = sampler.stop()

    lat_ok = [r["latency_ms"] for r in results if r["status"] == 200]
    codes = {}
    for r in results:
        key = str(r["status"]) if r["status"] else f"ERR_{r['error']}"
        codes[key] = codes.get(key, 0) + 1
    return {
        "n": n,
        "wall_ms": wall_ms,
        "codes": codes,
        "http_503_rate": round(codes.get("503", 0) / n, 3),
        "ok_latency_ms": {
            "min": min(lat_ok) if lat_ok else None,
            "median": round(statistics.median(lat_ok), 1) if lat_ok else None,
            "max": max(lat_ok) if lat_ok else None,
        },
        "all_latency_ms": sorted(r["latency_ms"] for r in results),
        "vram": vram,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:8000/api/matte")
    p.add_argument("--health-url", default="http://localhost:8000/health")
    p.add_argument("--n", type=int, action="append", required=True,
                   help="동시 요청 수. 여러 번 주면 순차 구간 측정 (--n 1 --n 2 --n 4)")
    p.add_argument("--repeat", type=int, default=1, help="각 N 반복 횟수")
    p.add_argument("--size", default="1200x1600", help="합성 이미지 크기 WxH")
    p.add_argument("--timeout", type=float, default=90.0)
    p.add_argument("--cooldown", type=float, default=3.0, help="라운드 간 휴지(초)")
    p.add_argument("--label", default="")
    args = p.parse_args()

    secret = sys.stdin.readline().strip()
    if not secret:
        print("stdin으로 X-Matte-Secret 값을 주십시오 (secret.sh get MATTE_SECRET | ...)", file=sys.stderr)
        return 2

    w, h = (int(x) for x in args.size.lower().split("x"))
    payload = {"image": make_image(w, h), "bgColor": "#FFFFFF"}

    try:
        health_before = requests.get(args.health_url, timeout=10).json()
    except Exception as e:
        health_before = {"error": type(e).__name__}

    rounds = []
    for n in args.n:
        for i in range(args.repeat):
            print(f"[loadtest] N={n} round {i+1}/{args.repeat} ...", file=sys.stderr)
            rounds.append(run_round(args.url, secret, payload, n, args.timeout, args.health_url))
            time.sleep(args.cooldown)

    try:
        health_after = requests.get(args.health_url, timeout=10).json()
    except Exception as e:
        health_after = {"error": type(e).__name__}

    print(json.dumps({
        "label": args.label,
        "image_size": f"{w}x{h}",
        "health_before": health_before,
        "rounds": rounds,
        "health_after": health_after,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
