#!/bin/bash
# 4060 → iMac: 소유권 수집(own) 결과 회수 (GPU 미사용, 실행 중에도 안전 — 완료 대국 파일만 원자적 기록)
# 행: {id, turnNumber, scoreLead, winrate, visits, own[361]} — own은 ownership×100 정수, 흑 기준(+100=흑 땅), 행 우선(y*19+x)
set -euo pipefail
D="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}/ownership_v1"
mkdir -p "$D"
scp -q -r "4060:C:/Users/smuse73/go_kibo/own/out1" "$D/"
scp -q "4060:C:/Users/smuse73/go_kibo/own/runner_status.json" "$D/" || true
scp -q "4060:C:/Users/smuse73/go_kibo/own/runner.log" "$D/" || true
rm -f "$D"/out1/*.tmp
N=$(ls "$D/out1" | grep -c '\.jsonl$' || true)
E=$(ls "$D/out1" | grep -c '\.error\.jsonl$' || true)
echo "ownership_v1: 완료 ${N}국(오류 ${E}) / 2000 · $(du -sh "$D/out1" | cut -f1)"
tail -3 "$D/runner.log" 2>/dev/null || true
[ "$E" = "0" ] || { echo "❌ pull_own: 오류 대국 ${E}건 — $D/out1/*.error.jsonl"; exit 1; }
