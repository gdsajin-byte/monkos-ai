#!/bin/bash
# 분리가 끝난 편부터 받아쓰기(분리와 겹쳐 진행) — nice 19·2스레드(8765 대국 보호). 분리 완료(14편) + 받아쓰기 14편이면 끝 (PF_PRESENTATION, ORDER_20261106 3항)
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
M="$HOME/.monkos/voice/misa"
N="$(python3 -c "import json;print(len(json.load(open('$M/targets.json'))))")"
while :; do
  VS_THREADS="${VS_THREADS:-2}" nice -n 19 python3 "$HERE/build_dataset.py" transcribe || { echo "❌ transcribe_follow: 받아쓰기 실패" >&2; exit 1; }
  done_asr=$(ls "$M/asr" 2>/dev/null | wc -l | tr -d ' ')
  [ "$done_asr" -ge "$N" ] && { echo "✅ transcribe_follow: $done_asr편"; exit 0; }
  grep -q "❌" "$M/separate.log" 2>/dev/null && { echo "❌ transcribe_follow: 분리 실패로 중단" >&2; exit 1; }
  sleep 60
done
