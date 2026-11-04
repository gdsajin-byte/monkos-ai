#!/bin/bash
# 4060 → iMac: 본 실행 결과 회수 + MISTAKES_v1 집계 (GPU 미사용, 실행 중에도 안전 — 완료 대국 파일만 원자적 기록)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
D="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}/mistakes_v1"
mkdir -p "$D"
scp -q -r "4060:C:/Users/smuse73/go_kibo/full/out1" "$D/"
scp -q -r "4060:C:/Users/smuse73/go_kibo/full/out2" "$D/"
scp -q "4060:C:/Users/smuse73/go_kibo/full/runner_status.json" "$D/" || true
scp -q "4060:C:/Users/smuse73/go_kibo/full/runner.log" "$D/" || true
rm -f "$D"/out1/*.tmp "$D"/out2/*.tmp
echo "out1 $(ls "$D/out1" | grep -c '\.jsonl$')국 · out2 $(ls "$D/out2" | grep -c '\.jsonl$')국"
tail -5 "$D/runner.log" 2>/dev/null || true
python3 "$HERE/analyze_mistakes.py" full --dir1 "$D/out1" --dir2 "$D/out2" --report-name "${1:-MISTAKES_v1}" --report
