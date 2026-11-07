"""형세 소형망 v0 학습 — 판 → 361칸 소유권(tanh) + 집 차이(회귀). 4060 venv go-train(torch cu128), 23:05 이후만.

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 §1-2.
입력: prep.py 의 own_v0.npz + split.json (game < n_val = 검증 200판, 나머지 = 학습 1,800판 — 판 단위 분할)
입력면 8: 흑 · 백 · 빈칸 · 흑 차례(전면 1) · 활로 1 · 활로 2 · 활로 3+ · 판 안(전면 1)
망: 줄기 3×3 → 잔차 블록 B개(3×3 두 번, BN·ReLU) → 소유권 머리(1×1 → tanh, 361) · 집 차 머리(전역 평균+최대 → FC → 1, 단위 20집)
증강: 배치마다 8대칭 중 하나(입력·소유권 같이 변환, 집 차는 불변).
안전장치: 시작 시각이 23:05~07:30 밖이면 거부(--force-window 없음). 시간 상한 --hours(기본 4) · 마감 --deadline(기본 07:30) 중 이른 쪽에서 멈춤.
체크포인트 매 에폭: {out}/ckpt_e{NN}.pt + last.pt + best.pt(검증 손실). 끝나면 검증 예측 val_pred.npz · onnx(onnx 패키지 있을 때) · TorchScript.
멈추기: {out}/STOP 파일을 만들면 200스텝 안에 그 에폭을 끝내고 저장한다.

사용(4060 Git Bash):
  /c/Users/smuse73/venvs/go-train/Scripts/python.exe train.py --data C:/Users/smuse73/go_train/own_v0/data --out C:/Users/smuse73/go_train/own_v0/run1
  --predict-only {ckpt}  : 학습 없이 검증 예측·onnx만
"""
import argparse
import datetime as dt
import json
import math
import os
import sys
import time

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

KST = dt.timezone(dt.timedelta(hours=9))


def now():
    return dt.datetime.now(KST)


def log(msg, fh=None):
    line = f"[{now():%m-%d %H:%M:%S}] {msg}"
    print(line, flush=True)
    if fh:
        fh.write(line + "\n")
        fh.flush()


class Block(nn.Module):
    def __init__(self, c):
        super().__init__()
        self.c1 = nn.Conv2d(c, c, 3, padding=1, bias=False)
        self.b1 = nn.BatchNorm2d(c)
        self.c2 = nn.Conv2d(c, c, 3, padding=1, bias=False)
        self.b2 = nn.BatchNorm2d(c)

    def forward(self, x):
        y = F.relu(self.b1(self.c1(x)))
        y = self.b2(self.c2(y))
        return F.relu(x + y)


class OwnNet(nn.Module):
    def __init__(self, cin=8, c=96, blocks=6):
        super().__init__()
        self.stem = nn.Sequential(nn.Conv2d(cin, c, 3, padding=1, bias=False), nn.BatchNorm2d(c), nn.ReLU())
        self.body = nn.Sequential(*[Block(c) for _ in range(blocks)])
        self.own = nn.Sequential(nn.Conv2d(c, 32, 1, bias=False), nn.BatchNorm2d(32), nn.ReLU(), nn.Conv2d(32, 1, 1))
        self.score = nn.Sequential(nn.Linear(2 * c, 64), nn.ReLU(), nn.Linear(64, 1))

    def forward(self, x):
        h = self.body(self.stem(x))
        own = torch.tanh(self.own(h)).flatten(1)  # [B,361] 흑 기준 −1~1
        g = torch.cat([h.mean((2, 3)), h.amax((2, 3))], 1)
        score = self.score(g).squeeze(1) * 20.0  # 흑 기준 집 차
        return own, score


def planes(board, libs, tomove):
    """board/libs int8 [B,361] · tomove int8 [B] (GPU) → float [B,8,19,19]"""
    b = board.view(-1, 1, 19, 19)
    lb = libs.view(-1, 1, 19, 19)
    ones = torch.ones_like(b, dtype=torch.float32)
    x = torch.cat([(b == 1).float(), (b == -1).float(), (b == 0).float(), ones * (tomove.view(-1, 1, 1, 1) == 1).float(),
                   (lb == 1).float(), (lb == 2).float(), (lb >= 3).float(), ones], 1)
    return x


def sym(x, k):
    """8대칭: k&4 = 전치, k&1 = 상하, k&2 = 좌우 (마지막 두 축)"""
    if k & 4:
        x = x.transpose(-1, -2)
    if k & 1:
        x = x.flip(-2)
    if k & 2:
        x = x.flip(-1)
    return x


def load(data_dir, dev):
    d = np.load(os.path.join(data_dir, "own_v0.npz"))
    split = json.load(open(os.path.join(data_dir, "split.json")))
    nval = split["n_val"]
    g = d["game"]
    vi = np.nonzero(g < nval)[0]
    ti = np.nonzero(g >= nval)[0]
    T = {k: torch.from_numpy(d[k]).to(dev) for k in ("board", "libs", "tomove", "own", "score")}
    return T, torch.from_numpy(ti).to(dev), torch.from_numpy(vi).to(dev), d["turn"][vi], split


def losses(model, T, idx, k=0):
    x = sym(planes(T["board"][idx], T["libs"][idx], T["tomove"][idx]), k)
    y = sym(T["own"][idx].float().view(-1, 1, 19, 19) / 100.0, k).flatten(1)
    s = T["score"][idx]
    with torch.autocast(x.device.type, dtype=torch.bfloat16, enabled=x.is_cuda):
        po, ps = model(x)
    lo = F.mse_loss(po.float(), y)
    ls = F.huber_loss(ps.float() / 20.0, s / 20.0, delta=1.0)
    return lo, ls


@torch.no_grad()
def evaluate(model, T, vi, bs=2048):
    model.eval()
    so = ss = n = 0.0
    for i in range(0, len(vi), bs):
        idx = vi[i:i + bs]
        lo, ls = losses(model, T, idx)
        so += lo.item() * len(idx); ss += ls.item() * len(idx); n += len(idx)
    model.train()
    return so / n, ss / n


@torch.no_grad()
def predict(model, T, vi, bs=2048):
    model.eval()
    O, S = [], []
    for i in range(0, len(vi), bs):
        idx = vi[i:i + bs]
        x = planes(T["board"][idx], T["libs"][idx], T["tomove"][idx])
        po, ps = model(x)
        O.append(po.float().cpu().numpy()); S.append(ps.float().cpu().numpy())
    return np.concatenate(O), np.concatenate(S)


def export_onnx(model, path, fh):
    model = model.float().eval().cpu()
    x = torch.zeros(1, 8, 19, 19)
    try:
        torch.onnx.export(model, (x,), path, input_names=["planes"], output_names=["own", "score"],
                          dynamic_axes={"planes": {0: "b"}, "own": {0: "b"}, "score": {0: "b"}}, opset_version=17, dynamo=False)
        log(f"onnx 저장: {path} ({os.path.getsize(path)} 바이트)", fh)
    except Exception as e:  # 패키지 설치는 하지 않는다 — 실패를 명시하고 넘어간다
        log(f"⚠️ onnx 실패(설치 없이 넘어감): {type(e).__name__}: {e}", fh)


def in_window(t):
    hm = t.hour * 60 + t.minute
    return hm >= 23 * 60 + 5 or hm < 7 * 60 + 30


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--blocks", type=int, default=6)
    ap.add_argument("--channels", type=int, default=96)
    ap.add_argument("--epochs", type=int, default=30)
    ap.add_argument("--bs", type=int, default=512)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--wd", type=float, default=1e-4)
    ap.add_argument("--score-w", type=float, default=0.25)
    ap.add_argument("--hours", type=float, default=4.0)
    ap.add_argument("--deadline", default="07:30")
    ap.add_argument("--predict-only")
    ap.add_argument("--smoke-steps", type=int, default=0, help="창 밖 CPU 스모크 — 지정 스텝만 돌리고 저장 없이 끝(GPU 미사용)")
    ap.add_argument("--cpu-test", type=int, default=0, help="창 밖 CPU 전 구간 시험 — 학습·검증 국면을 앞 N개로 줄여 끝까지(GPU 미사용)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    fh = open(os.path.join(a.out, "train.log"), "a", encoding="utf-8")
    start = now()
    smoke = a.smoke_steps > 0
    cpu = smoke or a.cpu_test > 0
    if not cpu and not in_window(start):
        log(f"❌ 거부: 4060 GPU 창(23:05~07:30) 밖 — 지금 {start:%H:%M}", fh)
        sys.exit(2)
    dev = "cpu" if cpu else "cuda"
    if not cpu:
        assert torch.cuda.is_available(), "CUDA 없음"
        torch.backends.cudnn.benchmark = True
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
    dh, dm = map(int, a.deadline.split(":"))
    dl = start.replace(hour=dh, minute=dm, second=0, microsecond=0)
    if dl <= start:
        dl += dt.timedelta(days=1)
    stop_at = min(dl, start + dt.timedelta(hours=a.hours))
    T, ti, vi, vturn, split = load(a.data, dev)
    if a.cpu_test:
        ti, vi, vturn = ti[:a.cpu_test], vi[:a.cpu_test], vturn[:a.cpu_test]
    model = OwnNet(8, a.channels, a.blocks).to(dev)
    if not cpu:
        model = model.to(memory_format=torch.channels_last)
    nparam = sum(p.numel() for p in model.parameters())
    log(f"시작 · 학습 국면 {len(ti)} · 검증 국면 {len(vi)} · 망 b{a.blocks}c{a.channels} {nparam:,} 파라미터 · 멈춤 {stop_at:%m-%d %H:%M} · 장치 {dev}", fh)

    if a.predict_only:
        model.load_state_dict(torch.load(a.predict_only, map_location=dev)["model"])
    else:
        opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=a.wd)
        steps_per = len(ti) // a.bs
        # 학습률: 에폭 1 = 앞 3% 선형 예열 후 최대값 유지 → 에폭 1 시간으로 남은 시간에 들어갈 에폭 수 E 를 정하고 2..E 코사인 감쇠
        n_ep = a.epochs
        warm = max(1, int(0.03 * steps_per))
        best = math.inf
        hist = []
        g = torch.Generator(device=dev).manual_seed(0)
        step = 0
        stop = False
        ep = 0
        while ep < n_ep:
            ep += 1
            t0 = time.time()
            perm = ti[torch.randperm(len(ti), device=dev, generator=g)]
            so = ss = 0.0
            for i in range(steps_per):
                idx = perm[i * a.bs:(i + 1) * a.bs]
                lo, ls = losses(model, T, idx, k=int(torch.randint(8, (1,)).item()))
                loss = lo + a.score_w * ls
                opt.zero_grad(set_to_none=True)
                loss.backward()
                opt.step()
                step += 1
                if ep == 1:
                    lr = a.lr * min(1.0, step / warm)
                else:
                    f = ((ep - 2) * steps_per + i + 1) / max(1, (n_ep - 1) * steps_per)
                    lr = a.lr * (0.02 + 0.98 * 0.5 * (1 + math.cos(math.pi * min(1.0, f))))
                for pg in opt.param_groups:
                    pg["lr"] = lr
                so += lo.item() if i % 50 == 0 else 0
                if smoke and step >= a.smoke_steps:
                    log(f"스모크 {step}스텝 · 소유 손실 {lo.item():.4f} · 집 손실 {ls.item():.4f} · {time.time() - t0:.1f}초", fh)
                    return
                if i % 200 == 0 and (now() >= stop_at or os.path.exists(os.path.join(a.out, "STOP"))):
                    stop = True
                    log("멈춤 신호(시간 상한 또는 STOP 파일)", fh)
                    break
            vo, vs = evaluate(model, T, vi)
            el = time.time() - t0
            ck = {"model": model.state_dict(), "epoch": ep, "args": vars(a), "val_own_mse": vo, "val_score_huber": vs, "params": nparam}
            torch.save(ck, os.path.join(a.out, f"ckpt_e{ep:02d}.pt"))
            torch.save(ck, os.path.join(a.out, "last.pt"))
            v = vo + a.score_w * vs
            if v < best:
                best = v
                torch.save(ck, os.path.join(a.out, "best.pt"))
            if ep == 1:
                left = (stop_at - now()).total_seconds()
                n_ep = max(2, min(a.epochs, 1 + int(0.92 * left / (el * 1.05))))
                log(f"에폭 1 = {el:.0f}초 → 총 에폭 {n_ep}로 확정(남은 {left / 60:.0f}분)", fh)
            hist.append({"epoch": ep, "val_own_mse": vo, "val_score_huber": vs, "sec": el, "partial": stop, "lr": lr})
            log(f"에폭 {ep}{' (중단)' if stop else ''} · 검증 소유 MSE {vo:.4f} · 집 Huber {vs:.4f} · {el:.0f}초 · {(i + 1) * a.bs / el:.0f} 국면/초", fh)
            json.dump(hist, open(os.path.join(a.out, "history.json"), "w"))
            if stop or now() + dt.timedelta(seconds=el * 1.1) >= stop_at:
                log(f"시간 상한 도달 — 에폭 {ep}에서 멈춤", fh)
                break
        model.load_state_dict(torch.load(os.path.join(a.out, "best.pt"), map_location=dev)["model"])
    po, ps = predict(model, T, vi)
    np.savez_compressed(os.path.join(a.out, "val_pred.npz"), own=po.astype(np.float16), score=ps, turn=vturn)
    log(f"검증 예측 저장: {len(ps)} 국면", fh)
    # 속도(배치 1, GPU) — 형세 막대 용도 참고값
    model.eval()
    x = planes(T["board"][vi[:1]], T["libs"][vi[:1]], T["tomove"][vi[:1]])
    sync = torch.cuda.synchronize if not cpu else (lambda: None)
    with torch.no_grad():
        for _ in range(10):
            model(x)
        sync()
        t0 = time.time()
        for _ in range(100):
            model(x)
        sync()
    log(f"추론 배치1 {dev} {10 * (time.time() - t0):.2f}ms/국면", fh)
    export_onnx(model, os.path.join(a.out, "own_v0.onnx"), fh)
    try:  # onnx 패키지가 없을 때의 이식용 사본 — TorchScript(외부 패키지 불필요)
        torch.jit.trace(model.float().eval().cpu(), torch.zeros(1, 8, 19, 19)).save(os.path.join(a.out, "own_v0_ts.pt"))
        log("TorchScript 저장: own_v0_ts.pt", fh)
    except Exception as e:
        log(f"⚠️ TorchScript 실패: {type(e).__name__}: {e}", fh)
    log(f"끝 · 총 {(now() - start).total_seconds() / 60:.1f}분", fh)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except BaseException:  # pythonw 예약 실행 — 표준 출력이 없으므로 예외를 로그 파일에 남긴다(무음 실패 금지)
        import traceback
        out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "."
        with open(os.path.join(out, "train.log"), "a", encoding="utf-8") as f:
            f.write(f"[{now():%m-%d %H:%M:%S}] ❌ 예외\n{traceback.format_exc()}\n")
        raise
