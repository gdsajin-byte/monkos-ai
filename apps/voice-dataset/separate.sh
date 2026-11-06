#!/bin/bash
# 배경음 분리 — demucs htdemucs(CPU, MIT)로 보컬만 → ~/.monkos/voice/misa/vocals/{ID}.wav (+ 배경 no_vocals는 demucs_tmp에 남김) (PF_PRESENTATION, ORDER_20261106 2항)
# 8765 바둑 대국과 같은 iMac을 쓰므로 nice 19 + 스레드 제한(기본 3, VS_THREADS로 변경). 이미 분리된 편은 건너뛴다.
# iMac PATH에 ffmpeg가 없어 demucs가 webm을 못 읽는다(11-06 실측) → imageio 번들 ffmpeg로 44.1kHz 스테레오 wav를 먼저 만든다.
set -euo pipefail
M="$HOME/.monkos/voice/misa"
V="$HOME/.monkos/voice/venv/bin/python"
T="${VS_THREADS:-3}"
FF="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"
mkdir -p "$M/vocals" "$M/demucs_tmp" "$M/wav44"
export OMP_NUM_THREADS="$T" MKL_NUM_THREADS="$T"
# venv(Homebrew 3.12)는 CA 묶음이 없어 모델 가중치 받기가 SSL 검증 실패(11-06 실측) → 시스템 python3의 certifi 묶음을 쓴다
export SSL_CERT_FILE="${SSL_CERT_FILE:-$(python3 -c 'import certifi; print(certifi.where())')}"
for f in "$M"/raw/*; do
  id="$(basename "${f%.*}")"
  [ -f "$M/vocals/$id.wav" ] && continue
  w="$M/wav44/$id.wav"
  [ -f "$w" ] || "$FF" -loglevel error -y -i "$f" -ac 2 -ar 44100 "$w"
  nice -n 19 "$V" -m demucs -n htdemucs --two-stems vocals -j 1 -o "$M/demucs_tmp" "$w" >"$M/demucs_tmp/$id.log" 2>&1 \
    || { echo "❌ separate: $id 실패 — $(grep -v '%|' "$M/demucs_tmp/$id.log" | tail -2 | tr '\n' ' ')" >&2; exit 1; }
  cp "$M/demucs_tmp/htdemucs/$id/vocals.wav" "$M/vocals/$id.wav"
  echo "$(date '+%H:%M:%S') $id 보컬 분리"
done
echo "✅ separate: $(ls "$M/vocals" | wc -l | tr -d ' ')편 → $M/vocals"
