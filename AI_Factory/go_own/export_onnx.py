"""형세 소형망 v0 → onnx 변환 + 대조 검증 (CPU 전용).

출처: ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0 §1-4 "onnx(가능하면)" — 작가님 2026-11-08 07:14 승인(4060 venv go-train 안 pip 설치).
막내5 학습 때는 onnx 패키지가 없어 실패했고(COMPLETION_20261107 §5), 이 스크립트로 best.pt 에서 다시 만든다.

하는 일
1. best.pt → OwnNet(train.py 정의 그대로) → onnx(opset 17, 배치 축 동적, 입력 planes [B,8,19,19] → own [B,361] · score [B]).
2. onnx.checker 통과 확인.
3. 대조: 검증 국면(판 단위 분할의 검증 200판) 전체를 onnxruntime CPU 로 돌려
   - torch CPU fp32 출력과의 최대 차이(소유·집 차),
   - TorchScript own_v0_ts.pt 출력과의 최대 차이(앞 2,048국면),
   - 정답(b18) 대비 소유 부호 일치·소유 MAE·집 차 MAE·승자 일치 — COMPLETION §4 '전체' 행과 같은 정의로 재현되는지.
4. 속도: onnxruntime CPU 배치 1 (스레드 1·기본).

사용(4060, CPU만 — CUDA_VISIBLE_DEVICES="" 로 GPU 를 숨긴다):
  C:/Users/smuse73/venvs/go-train/Scripts/python.exe export_onnx.py --ckpt C:/Users/smuse73/go_train/own_v0/run1/best.pt \
      --data C:/Users/smuse73/go_train/own_v0/data --out C:/Users/smuse73/go_train/own_v0/run1/own_v0.onnx
"""
import argparse
import json
import os
import sys
import time

os.environ.setdefault("CUDA_VISIBLE_DEVICES", "")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
import torch

import train  # OwnNet · planes · load


def np_planes(T, idx):
    with torch.no_grad():
        return train.planes(T["board"][idx], T["libs"][idx], T["tomove"][idx]).numpy()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ckpt", required=True)
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ts", default=None, help="TorchScript 대조본(기본: ckpt 폴더의 own_v0_ts.pt)")
    ap.add_argument("--bs", type=int, default=512)
    a = ap.parse_args()
    torch.set_num_threads(max(1, (os.cpu_count() or 2) // 2))

    import onnx
    import onnxruntime as ort

    ck = torch.load(a.ckpt, map_location="cpu")
    args = ck.get("args", {})
    model = train.OwnNet(8, args.get("channels", 96), args.get("blocks", 6))
    model.load_state_dict(ck["model"])
    model = model.float().eval()
    print(f"체크포인트: {a.ckpt} · 에폭 {ck.get('epoch')} · 파라미터 {sum(p.numel() for p in model.parameters()):,}")

    train.export_onnx(model, a.out, None)
    if not os.path.exists(a.out):
        print("❌ onnx 파일이 생기지 않았다")
        sys.exit(1)
    onnx.checker.check_model(onnx.load(a.out))
    print(f"onnx.checker 통과 · {os.path.getsize(a.out):,} 바이트 · onnx {onnx.__version__} · onnxruntime {ort.__version__} · torch {torch.__version__}")

    T, _, vi, vturn, _ = train.load(a.data, "cpu")
    vi = vi.numpy()
    sess = ort.InferenceSession(a.out, providers=["CPUExecutionProvider"])

    O, S, dO, dS = [], [], 0.0, 0.0
    t0 = time.time()
    for s in range(0, len(vi), a.bs):
        idx = torch.from_numpy(vi[s:s + a.bs])
        x = np_planes(T, idx)
        po, ps = sess.run(["own", "score"], {"planes": x})
        with torch.no_grad():
            to, tsc = model(torch.from_numpy(x))
        dO = max(dO, float(np.abs(po - to.numpy()).max()))
        dS = max(dS, float(np.abs(ps - tsc.numpy()).max()))
        O.append(po); S.append(ps)
    O = np.concatenate(O); S = np.concatenate(S)
    print(f"검증 {len(vi):,}국면 onnxruntime CPU {time.time() - t0:.0f}초 · torch fp32 대비 최대 차이 소유 {dO:.2e} · 집 차 {dS:.2e}")

    ts_path = a.ts or os.path.join(os.path.dirname(a.ckpt), "own_v0_ts.pt")
    if os.path.exists(ts_path):
        ts = torch.jit.load(ts_path, map_location="cpu").eval()
        x = np_planes(T, torch.from_numpy(vi[:2048]))
        with torch.no_grad():
            to, tsc = ts(torch.from_numpy(x))
        print(f"TorchScript 대비(앞 2,048국면) 최대 차이 소유 {float(np.abs(O[:2048] - to.numpy()).max()):.2e} · 집 차 {float(np.abs(S[:2048] - tsc.numpy()).max()):.2e}")

    # 정답 대비 — COMPLETION §4 '전체' 행 정의(소유 부호: b18 |own| ≥ 0.5 칸만, 예측 0 은 불일치)
    yo = T["own"][torch.from_numpy(vi)].numpy().astype(np.float32) / 100.0  # int8 ×100 → −1~1
    ys = T["score"][torch.from_numpy(vi)].numpy().astype(np.float32)
    sure = np.abs(yo) >= 0.5  # table.py metrics 와 같은 정의
    sign = float(((np.sign(O) == np.sign(yo)) & (O != 0) & sure).sum() / max(1, sure.sum()))
    mae_o = float(np.abs(O - yo).mean())
    mae_s = float(np.abs(S - ys).mean())
    win = float((np.sign(S) == np.sign(ys)).mean())
    res = {"positions": int(len(vi)), "own_sign": sign, "own_mae": mae_o, "score_mae": mae_s, "winner": win,
           "max_diff_torch_own": dO, "max_diff_torch_score": dS}
    print(f"정답 대비: 소유 부호 일치 {100 * sign:.1f}% · 소유 MAE {mae_o:.3f} · 집 차 MAE {mae_s:.1f} · 승자 일치 {100 * win:.1f}%")

    # 속도 — 배치 1, CPU
    x1 = np_planes(T, torch.from_numpy(vi[:1]))
    for th in (1, 0):
        so = ort.SessionOptions()
        so.intra_op_num_threads = th
        s1 = ort.InferenceSession(a.out, so, providers=["CPUExecutionProvider"])
        for _ in range(20):
            s1.run(None, {"planes": x1})
        t0 = time.time()
        for _ in range(200):
            s1.run(None, {"planes": x1})
        ms = 5 * (time.time() - t0)
        res[f"ms_b1_threads{th}"] = ms
        print(f"onnxruntime CPU 배치1 스레드 {'기본' if th == 0 else th}: {ms:.2f}ms/국면")
    json.dump(res, open(os.path.splitext(a.out)[0] + "_verify.json", "w"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
