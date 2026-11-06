#!/bin/bash
# 목소리 데이터셋 도구 환경 — 홈 아래 격리 가상환경(~/.monkos/voice/venv)에 demucs·torch CPU 설치 (PF_PRESENTATION, ORDER_20261106 목소리데이터셋)
# 시스템 Python 3.13은 Intel Mac용 torch가 없다(마지막 x86_64 맥 휠 2.2.2 = Python ≤3.12) → Homebrew python3.12로 venv. 전역 설치 없음.
set -euo pipefail
V="$HOME/.monkos/voice/venv"
PY="${PY312:-/usr/local/bin/python3.12}"
die() { echo "❌ setup_venv: $*" >&2; exit 1; }
[ -x "$PY" ] || die "python3.12 없음: $PY"
[ -x "$V/bin/python" ] || "$PY" -m venv "$V"
"$V/bin/pip" install -q --upgrade pip
"$V/bin/pip" install -q "torch==2.2.2" "torchaudio==2.2.2" "numpy<2" "demucs==4.0.1" soundfile
"$V/bin/python" -c "import torch, demucs; print('✅ setup_venv: torch', torch.__version__, '· demucs', demucs.__version__)"
