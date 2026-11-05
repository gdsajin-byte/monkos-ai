#!/bin/bash
# ftl.sh — Firebase Test Lab 실기기 테스트 도구(1단계: Google). AWS Device Farm은 계정 생성 뒤 2단계.
# 지시서: monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_GO_실기기테스트_FirebaseTestLab도구.md
# 출처: 작가님 2026-11-06 05:29 "구글쪽부터 도구에 담아놓고 아마존은 계정 만들면 개시"
#
# 사용:
#   ftl.sh models ios|android                         기종 목록 → ~/.monkos/device_lab/catalog_{ios|android}_YYYYMMDD.csv (매번 실측)
#   ftl.sh usage                                      오늘(KST) 쓴 실기기 분(로컬 원장 합계)
#   ftl.sh run ios --models a[:ver],b --ipa PATH [--scenarios 1] [--timeout 3m] [--dry-run]
#                                                     Game Loop 실행(gcloud beta) → 원장 기록 → 결과 위치 출력
#   ftl.sh fetch RESULTS_DIR [OUT]                    결과 버킷 → GameLoopResults(bench·앱 캡처) + FTL 영상 내려받기
#
# 무료 한도 가드(우회 플래그 없음): 오늘 누적 + 이번 예상(기종 수 × 기종당 상한 분) > 25분이면 실행 거부.
#   Blaze 실기기 하루 30분 무료(여유 5분). 넘기려면 작가님 승인 후 아래 LIMIT_MIN 상수를 바꾼다.
# 원장: ~/.monkos/device_lab/usage.jsonl — 실행마다 '상한 분'으로 기록(실과금 ≤ 기록 → 보수적). 시험용 원장 경로는 FTL_LEDGER.
# 실패 가시화: 모든 오류는 '❌ ftl:' + exit≠0.
set -u
PROJECT="monkos-3c6e4"          # Firebase 프로젝트(결제 Blaze) — 다른 프로젝트·결제 설정은 건드리지 않는다
LIMIT_MIN=25                    # 하루 무료 30분 − 여유 5분. 우회 플래그 없음(상수 변경 = 작가님 승인 사항)
MAX_TIMEOUT_MIN=3               # 기종당 상한(지시서 §1)
OVERHEAD_MIN=2                  # 기종당 설치·준비 몫(11-06 실측 runDuration 213~314초 > timeout 180초) — 과금 기준 확인 전까지 보수적으로
DIR="${HOME}/.monkos/device_lab"
LEDGER="${FTL_LEDGER:-${DIR}/usage.jsonl}"
mkdir -p "$DIR"

die() { echo "❌ ftl: $*" >&2; exit 1; }
today() { TZ='Asia/Seoul' date '+%Y-%m-%d'; }

used_today() {  # 오늘 누적 분(정수, 올림)
  [ -f "$LEDGER" ] || { echo 0; return; }
  python3 -I - "$LEDGER" "$(today)" <<'PY'
import json, math, sys
tot = 0.0
for ln in open(sys.argv[1], encoding="utf-8"):
    ln = ln.strip()
    if not ln:
        continue
    try:
        d = json.loads(ln)
    except ValueError:
        continue
    if d.get("date") == sys.argv[2]:
        tot += float(d.get("minutes") or 0)
print(math.ceil(tot))
PY
}

cmd_models() {
  local os="${1:-}"
  case "$os" in ios|android) ;; *) die "models ios|android";; esac
  local out="${DIR}/catalog_${os}_$(TZ='Asia/Seoul' date '+%Y%m%d').csv"
  if [ "$os" = ios ]; then
    gcloud firebase test ios models list --project "$PROJECT" \
      --format="csv(id,name,supportedVersionIds.list(separator=';'),tags.list(separator=';'))" > "$out" 2>"${out}.err" \
      || die "기종 목록 실패 — $(tail -1 "${out}.err")"
  else
    gcloud firebase test android models list --project "$PROJECT" --filter="form=PHYSICAL" \
      --format="csv(id,brand,name,supportedVersionIds.list(separator=';'),tags.list(separator=';'))" > "$out" 2>"${out}.err" \
      || die "기종 목록 실패 — $(tail -1 "${out}.err")"
  fi
  rm -f "${out}.err"
  echo "✅ ftl: $os 기종 $(($(wc -l < "$out") - 1))종 → $out"
}

cmd_usage() {
  echo "오늘($(today)) 실기기 사용 $(used_today)분 / 가드 ${LIMIT_MIN}분 (무료 30분) · 원장 $LEDGER"
}

minutes_of() {  # 3m · 180s · 180 → 분(올림)
  python3 -I -c "
import math,re,sys
v=sys.argv[1].strip(); m=re.fullmatch(r'(\d+)(s|m|h)?',v)
if not m: sys.exit(1)
n=int(m.group(1)); u=m.group(2) or 's'
print(math.ceil(n/60 if u=='s' else n if u=='m' else n*60))" "$1"
}

cmd_run() {
  local os="${1:-}"; shift || true
  [ "$os" = ios ] || die "run 은 지금 ios(Game Loop)만 — 안드로이드는 빌드 경로 조사 단계"
  local models="" ipa="" scen="1" tmo="3m" dry=0
  while [ $# -gt 0 ]; do
    case "$1" in
      --models) models="$2"; shift 2;;
      --ipa) ipa="$2"; shift 2;;
      --scenarios) scen="$2"; shift 2;;
      --timeout) tmo="$2"; shift 2;;
      --dry-run) dry=1; shift;;
      *) die "모르는 인자: $1";;
    esac
  done
  [ -n "$models" ] || die "--models 필요(예: iphonese3,iphone8,iphone11pro)"
  local per; per=$(minutes_of "$tmo") || die "--timeout 형식(예: 3m, 180s)"
  [ "$per" -le "$MAX_TIMEOUT_MIN" ] || die "--timeout 기종당 ${MAX_TIMEOUT_MIN}분 이하(지금 ${per}분)"
  local n; n=$(echo "$models" | tr ',' '\n' | grep -c .)
  local expect=$((n * (per + OVERHEAD_MIN))) used; used=$(used_today)
  if [ $((used + expect)) -gt "$LIMIT_MIN" ]; then
    die "무료 한도 초과 예상 — 오늘 ${used}분 + 예상 ${expect}분 > ${LIMIT_MIN}분 (유료 0)"
  fi
  echo "가드 통과: 오늘 ${used}분 + 예상 ${expect}분(${n}대 × (${per}분 + 준비 ${OVERHEAD_MIN}분)) ≤ ${LIMIT_MIN}분"
  [ "$dry" = 1 ] || [ -f "$ipa" ] || die "IPA 없음: ${ipa:-'(미지정)'}"
  local devs=() m model ver
  for m in $(echo "$models" | tr ',' ' '); do
    model="${m%%:*}"; ver=""; [ "$m" != "$model" ] && ver="${m#*:}"
    devs+=(--device "model=${model}${ver:+,version=${ver}}")
  done
  local rdir="ftl/$(TZ='Asia/Seoul' date '+%Y%m%d_%H%M%S')"
  local cmd=(gcloud beta firebase test ios run --project "$PROJECT" --type game-loop --app "$ipa" "${devs[@]}"
             --scenario-numbers "$scen" --timeout "$tmo" --results-dir "$rdir" --record-video --format json)  # FTL 자체 녹화도 회수
  if [ "$dry" = 1 ]; then echo "(dry-run) ${cmd[*]}"; return 0; fi
  # 원장 먼저(상한 분) — 실행 중 끊겨도 기록은 남는다(보수적)
  printf '{"date":"%s","at":"%s","os":"ios","models":"%s","minutes":%s,"resultsDir":"%s","basis":"upper-bound"}\n' \
    "$(today)" "$(TZ='Asia/Seoul' date '+%H:%M:%S')" "$models" "$expect" "$rdir" >> "$LEDGER"
  local log="${DIR}/run_${rdir#ftl/}.log"
  "${cmd[@]}" > "$log" 2>&1
  local rc=$?
  grep -E "Test results|outcome|Passed|Failed|Inconclusive|gs://" "$log" | tail -12
  [ $rc -eq 0 ] || die "실행 실패(rc=$rc) — 로그 $log"
  echo "✅ ftl: 완료 · 결과 디렉터리 $rdir · 로그 $log · 회수: ftl.sh fetch $rdir"
}

cmd_fetch() {
  local rdir="${1:-}" out="${2:-}"
  [ -n "$rdir" ] || die "fetch RESULTS_DIR [OUT]"
  out="${out:-${DIR}/results/${rdir#ftl/}}"
  local log="${DIR}/run_${rdir#ftl/}.log" bucket
  # gcloud 는 결과 위치를 콘솔 링크(storage/browser/<버킷>/…) 또는 gs://<버킷> 으로 출력한다 — 둘 다 읽는다
  bucket=$(grep -ho "gs://[^/ ]*" "$log" 2>/dev/null | head -1)
  [ -n "$bucket" ] || bucket=$(grep -ho "storage/browser/[^/ ]*" "$log" 2>/dev/null | head -1 | sed 's#storage/browser/#gs://#')
  [ -n "$bucket" ] || die "결과 버킷을 실행 로그에서 찾지 못함(run_${rdir#ftl/}.log)"
  mkdir -p "$out"
  # 기기별 폴더 구조를 살려 받는다: GameLoopResults(bench_*.json·screen_*.png 앱 자체 캡처) + FTL 영상(video.mp4)·스크린샷
  gcloud storage cp -r "${bucket}/${rdir}" "$out/" 2>"${out}/fetch.err" \
    || die "내려받기 실패 — $(tail -1 "${out}/fetch.err")"
  local nj nv np
  nj=$(find "$out" -name "bench_*.json" | wc -l | tr -d ' ')  # 버킷에서는 기기별 CustomResults/ 아래(11-06 실측)
  np=$(find "$out" -name "screen_*.png" | wc -l | tr -d ' ')
  nv=$(find "$out" -name "*.mp4" | wc -l | tr -d ' ')
  local ndev nc; ndev=$(find "$out" -maxdepth 3 -type d -name "*-*-*-portrait" | wc -l | tr -d ' ')
  nc=$(find "$out" -path "*CrashLogs*" -name "*.ips" | wc -l | tr -d ' ')
  [ "$nj" -gt 0 ] || die "bench_*.json 0개 — 앱이 측정을 끝내지 못했거나 Game Loop 진입 실패(기기 ${ndev} · 크래시 로그 ${nc} · 영상 ${nv})"
  [ "$nj" -ge "$ndev" ] || echo "⚠️ ftl: 기기 ${ndev}대 중 측정 ${nj}대 — 나머지는 CrashLogs(${nc}개)·영상 확인"
  echo "✅ ftl: $out — bench ${nj}개 · 앱 캡처 ${np}장 · FTL 영상 ${nv}개"
}

case "${1:-}" in
  models) shift; cmd_models "$@";;
  usage) cmd_usage;;
  run) shift; cmd_run "$@";;
  fetch) shift; cmd_fetch "$@";;
  *) sed -n '2,16p' "$0"; exit 2;;
esac
