#!/usr/bin/env bash
# kata1 공개 학습 데이터(일자별 npz tgz)를 범위 요청 병렬로 받는다.
# 출처: https://katagoarchive.org/kata1/trainingdata/ (단일 연결 ~170KB/s라 분할 필수, 11-03 실측)
# 사용: fetch_data.sh OUTDIR 2026-10-28 [2026-10-29 ...]
# 실패 가시화: 조각 실패·크기 불일치 시 ❌ + exit 1
set -euo pipefail
OUT="$1"; shift
BASE=https://katagoarchive.org/kata1/trainingdata
# 24분할은 3.5파일 만에 CF 429(Too Many Requests) — 11-03 실측. 기본 8.
PARTS=${PARTS:-8}
mkdir -p "$OUT"
for d in "$@"; do
  f="${d}npzs.tgz"; url="$BASE/$f"; dst="$OUT/$f"
  len=$(curl -sfI "$url" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  [[ -n "$len" ]] || { echo "❌ fetch_data: 크기 조회 실패 $url"; exit 1; }
  if [[ -f "$dst" && $(stat -c %s "$dst") == "$len" ]]; then echo "skip $f ($len)"; continue; fi
  tmp="$dst.parts"; mkdir -p "$tmp"
  chunk=$(( (len + PARTS - 1) / PARTS ))
  pids=()
  for ((i=0; i<PARTS; i++)); do
    s=$((i*chunk)); e=$((s+chunk-1)); (( e >= len )) && e=$((len-1))
    p="$tmp/$(printf %03d $i)"
    want=$((e-s+1))
    if [[ -f "$p" && $(stat -c %s "$p") == "$want" ]]; then continue; fi
    ( for try in 1 2 3 4 5; do
        curl -sf --retry 3 -r "$s-$e" -o "$p" "$url" && [[ $(stat -c %s "$p") == "$want" ]] && exit 0
        sleep 5
      done; exit 1 ) &
    pids+=($!)
  done
  for pid in "${pids[@]}"; do wait "$pid" || { echo "❌ fetch_data: 조각 실패 $f"; exit 1; }; done
  cat "$tmp"/* > "$dst"
  got=$(stat -c %s "$dst")
  [[ "$got" == "$len" ]] || { echo "❌ fetch_data: 크기 불일치 $f $got != $len"; exit 1; }
  rm -r "$tmp"
  echo "ok $f $len $(TZ='KST-9' date '+%H:%M')"
done
