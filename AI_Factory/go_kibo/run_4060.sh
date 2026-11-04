#!/bin/bash
# iMac에서 실행: 질의 전송 → 4060 KataGo analysis → 응답 회수 → 손해 집계 (+ b10 처리량 전후)
# 사용: AI_Factory/go_kibo/run_4060.sh smoke10 [visits=64]
# ⚠️ GPU 사용 — 4060 시간 규칙(23시 이후·학교 시간) 안에서만. 예약 작업(GO-*)은 건드리지 않는다.
set -euo pipefail
NAME="${1:?이름 필요 (queries_NAME.jsonl)}"
VIS="${2:-64}"
HERE="$(cd "$(dirname "$0")" && pwd)"
A="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}/mistakes_v0"
R='C:\Users\smuse73\go_kibo'
B10='C:/Users/smuse73/go_train/run/b10/stdout.txt'

[ -f "$A/queries_$NAME.jsonl" ] || { echo "❌ run_4060: $A/queries_$NAME.jsonl 없음"; exit 1; }
ssh 4060 "if not exist $R mkdir $R" >/dev/null
scp -q "$HERE/katago_analysis.cfg" "4060:C:/Users/smuse73/go_kibo/katago_analysis.cfg"
scp -q "$A/queries_$NAME.jsonl" "4060:C:/Users/smuse73/go_kibo/queries_$NAME.jsonl"
scp -q "4060:$B10" "$A/b10_stdout_before_$NAME.txt" || echo "⚠️ b10 stdout 사본 실패(학습 미가동?)"

echo "[$(date '+%H:%M:%S')] 엔진 시작 — $NAME visits $VIS"
T0=$(date +%s)
RC=0
ssh 4060 "cd /d $R && C:\Users\smuse73\go_train\engine\katago.exe analysis -config katago_analysis.cfg -model C:\Users\smuse73\go_train\nets\b18.bin.gz < queries_$NAME.jsonl > responses_$NAME.jsonl 2> stderr_$NAME.txt" || RC=$?
T1=$(date +%s)
echo "[$(date '+%H:%M:%S')] 엔진 종료 rc=$RC · $((T1 - T0))초"

scp -q "4060:C:/Users/smuse73/go_kibo/responses_$NAME.jsonl" "$A/responses_$NAME.jsonl"
scp -q "4060:C:/Users/smuse73/go_kibo/stderr_$NAME.txt" "$A/stderr_$NAME.txt"
scp -q "4060:$B10" "$A/b10_stdout_after_$NAME.txt" || true
tail -3 "$A/stderr_$NAME.txt" || true

if [ -f "$A/b10_stdout_before_$NAME.txt" ] && [ -f "$A/b10_stdout_after_$NAME.txt" ]; then
  python3 "$HERE/b10_rate.py" "$A/b10_stdout_before_$NAME.txt" "$A/b10_stdout_after_$NAME.txt" | tee "$A/b10_rate_$NAME.txt" || true
fi
python3 "$HERE/analyze_mistakes.py" "$NAME" --elapsed "$((T1 - T0))" --visits "$VIS" --report
