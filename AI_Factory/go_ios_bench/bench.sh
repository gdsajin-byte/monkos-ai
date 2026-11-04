#!/bin/bash
# M1: 설치된 ai.monkos.go.bench에 벤치 GTP 입력을 넣고 실행 → 로그 회수. 사용: bench.sh b10|b18 [대기초]
set -uo pipefail
TAG="${1:?b10|b18}"
WAIT="${2:-240}"
DEV=3AE3A741-9156-5734-A7CE-92D0A6A3DFEE
BID=ai.monkos.go.bench
R=~/developer/_ext/katago-ios
OUT=$R/results/$TAG
mkdir -p "$OUT"
MODEL="${3:-}"  # 지정 시 앱 Documents/default_model.bin.gz로 복사(번들 모델보다 우선)
if [ -n "$MODEL" ]; then
  xcrun devicectl device copy to --device $DEV --domain-type appDataContainer --domain-identifier $BID --source "$MODEL" --destination Documents/default_model.bin.gz 2>&1 | tail -1
fi
xcrun devicectl device copy to --device $DEV --domain-type appDataContainer --domain-identifier $BID \
  --source "$R/bench_cmds.txt" --destination Documents/bench_cmds.txt 2>&1 | tail -1
date '+launch %H:%M:%S'
xcrun devicectl device process launch --device $DEV --terminate-existing $BID 2>&1 | tail -1
sleep "$WAIT"
date '+collect %H:%M:%S'
xcrun devicectl device copy from --device $DEV --domain-type appDataContainer --domain-identifier $BID \
  --source Documents/gtp_logs --destination "$OUT/gtp_logs" 2>&1 | tail -1
ls -la "$OUT/gtp_logs" | tail -3
