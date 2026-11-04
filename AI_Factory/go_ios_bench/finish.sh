#!/bin/bash
# b18 마지막 계산까지 기다린 뒤(최대 3분) 로그 회수 → 앱 기본 모델을 MONK 봇(b10)으로 되돌림
DEV=3AE3A741-9156-5734-A7CE-92D0A6A3DFEE
BID=ai.monkos.go.bench
R=~/developer/_ext/katago-ios
for i in $(seq 1 18); do
  D=$R/results/b18r/poll_$i
  xcrun devicectl device copy from --device $DEV --domain-type appDataContainer --domain-identifier $BID \
    --source Documents/gtp_logs --destination "$D" >/dev/null 2>&1
  N=$(cat "$D"/20261105-064416-*.log 2>/dev/null | grep -c "Time taken")
  echo "$(date +%H:%M:%S) genmoves=$N"
  [ "$N" -ge 23 ] && break
  sleep 10
done
xcrun devicectl device copy to --device $DEV --domain-type appDataContainer --domain-identifier $BID \
  --source $R/models/monk_b10_s41M.bin.gz --destination Documents/default_model.bin.gz 2>&1 | tail -1
echo "restored b10 to Documents/default_model.bin.gz"
