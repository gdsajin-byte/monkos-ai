#!/bin/bash
# iMac → 4060: 실수 사전 본 실행 파일 배치 (GPU 미사용). 예약은 schedule_full.sh.
# 배치: C:\Users\smuse73\go_kibo\{mistakes_runner.py, katago_analysis.cfg} + full\{queries_full.jsonl, meta_full.jsonl}
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
A="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}/mistakes_v0"
[ -f "$A/queries_full.jsonl" ] || { echo "❌ deploy_full: queries_full.jsonl 없음 — sample_mistakes.py queries full 먼저"; exit 1; }
ssh 4060 "if not exist C:\Users\smuse73\go_kibo\full mkdir C:\Users\smuse73\go_kibo\full" >/dev/null
scp -q "$HERE/mistakes_runner.py" "4060:C:/Users/smuse73/go_kibo/mistakes_runner.py"
scp -q "$HERE/katago_analysis.cfg" "4060:C:/Users/smuse73/go_kibo/katago_analysis.cfg"
scp -q "$A/queries_full.jsonl" "4060:C:/Users/smuse73/go_kibo/full/queries_full.jsonl"
scp -q "$A/queries_full.meta.jsonl" "4060:C:/Users/smuse73/go_kibo/full/meta_full.jsonl"
ssh 4060 "dir C:\Users\smuse73\go_kibo C:\Users\smuse73\go_kibo\full" 2>/dev/null | grep -E "\.py|\.cfg|\.jsonl" || { echo "❌ deploy_full: 배치 확인 실패"; exit 1; }
echo "✅ deploy_full: 배치 완료"
