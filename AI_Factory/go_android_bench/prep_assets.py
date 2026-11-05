#!/usr/bin/env python3
"""APK assets 준비 — 모델·GTP 설정·벤치 수순·라이선스 고지 → ~/.monkos/go_android/assets (레포 밖, PF_GO ORDER_20261106 2단계)
  prep_assets.py [모델경로]     (기본 ~/.monkos/katago/monk_b10_s83M.bin.gz)
벤치 = iOS 벤치(go_ios_bench/mkbench.py)와 같은 표본 대국 1국 수순: 빈 판·100수·200수 × (1500 visits, 2초 자동).
설정 = KataGo gtp_example.cfg 그대로 + 실행 시 -override-config(스레드·visits·규칙)로 바꾼다.
"""
import json, os, shutil, sys
from pathlib import Path

H = Path.home()
SRC = H / ".monkos/katago/src/KataGo-1.18.2"
EIG = H / ".monkos/go_android/toolchain/eigen-3.4.0"
OUT = H / ".monkos/go_android/assets"
model = Path(sys.argv[1]) if len(sys.argv) > 1 else H / ".monkos/katago/monk_b10_s83M.bin.gz"
(OUT / "licenses").mkdir(parents=True, exist_ok=True)
shutil.copy(model, OUT / "model_bin_gz.dat")  # aapt가 .gz 애셋 이름을 바꿔 넣으므로(11-06 실측 assets/model.bin) 중립 이름으로 — 앱이 기기에서 model.bin.gz로 복사
shutil.copy(SRC / "cpp/configs/gtp_example.cfg", OUT / "gtp.cfg")
shutil.copy(SRC / "LICENSE", OUT / "licenses/KataGo_LICENSE.txt")
shutil.copy(EIG / "COPYING.MPL2", OUT / "licenses/Eigen_COPYING.MPL2.txt")
(OUT / "licenses/NOTICE.txt").write_text(
    "This app runs KataGo (https://github.com/lightvector/KataGo, MIT License — see KataGo_LICENSE.txt)\n"
    "built with the Eigen C++ template library (https://eigen.tuxfamily.org, MPL2 — see Eigen_COPYING.MPL2.txt; source unmodified, "
    "available at https://gitlab.com/libeigen/eigen/-/archive/3.4.0/eigen-3.4.0.tar.gz).\n")
qs = [json.loads(x) for x in open(H / ".monkos/go-board/analysis/mistakes_v0/queries_smoke10.jsonl")]
g = next(q for q in qs if len(q["moves"]) >= 250)  # iOS 벤치와 같은 대국(수순만)
bench = {"moves": g["moves"][:200], "positions": [0, 100, 200], "visits": 1500, "auto_seconds": 2.0, "komi": 6.5, "rules": "korean",
         "model": model.name}
(OUT / "bench.json").write_text(json.dumps(bench))
print(f"✅ prep_assets: {OUT} · 모델 {model.name} {model.stat().st_size / 1e6:.1f}MB · 수순 {len(bench['moves'])}")
