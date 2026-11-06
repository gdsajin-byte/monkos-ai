#!/bin/bash
# ftl.sh 가드 스모크 — 시험 원장(FTL_LEDGER)만 쓴다. gcloud 실행 없음(dry-run·사전 거부 경로만). 기대와 다르면 exit 1
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FTL="$HERE/ftl.sh"
L="$(mktemp -t ftl_smoke)"
D="$(TZ=Asia/Seoul date +%Y-%m-%d)"
fail=0
check() {  # 이름 기대rc 명령…
  local name="$1" want="$2"; shift 2
  out="$("$@" 2>&1)"; rc=$?
  if [ "$rc" = "$want" ]; then echo "✅ $name (rc=$rc) — $(echo "$out" | head -1)"; else echo "❌ $name rc=$rc 기대 $want — $out"; fail=1; fi
}
: > "$L"
check "양성: 빈 원장 3대×(3+2)분=15분" 0 env FTL_LEDGER="$L" "$FTL" run ios --models iphonese3,iphone8,iphone11pro --ipa x.ipa --dry-run
printf '{"date":"%s","minutes":18}\n{"date":"2020-01-01","minutes":30}\n' "$D" > "$L"
check "음성: 오늘 18분 + 15분 = 33 > 25" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphonese3,iphone8,iphone11pro --ipa x.ipa --dry-run
check "음성: 오늘 18분 + 2대×5분 = 28 > 25(준비 2분 반영)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphonese3,iphone8 --ipa x.ipa --dry-run
check "음성: 기종당 5분(상한 3분)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa x.ipa --timeout 5m --dry-run
# (11-06 삭제) 안드로이드 run 거부 사례 — 막내2 run_android 추가 뒤 실제 원장·실실행 경로가 됨(시험 원장 아님). 안드로이드 검증은 막내2 스모크로
check "양성: 오늘 18분 + 1대×5분 = 23 ≤ 25(다른 날 30분은 제외)" 0 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa x.ipa --dry-run
check "음성: IPA 없음(실행 전 거부, 원장 미기록)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa /nope.ipa
check "음성: 우회 시도 --force(인자 없음)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa x.ipa --force
# 태평양 일자 사례(11-06 — 일일 할당량은 태평양 자정 초기화): KST 어제·태평양 오늘인 20분이 오늘 합계에 잡혀야 한다
PTL="$(mktemp -t ftl_smoke_pt)"
TSPT=$(python3 -I -c "
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
now=datetime.now(timezone.utc); pt=now.astimezone(ZoneInfo('America/Los_Angeles'))
start=pt.replace(hour=0,minute=1,second=0,microsecond=0)
print(int(start.timestamp()) if start.astimezone(ZoneInfo('Asia/Seoul')).date()!=now.astimezone(ZoneInfo('Asia/Seoul')).date() else 0)")
if [ "$TSPT" != 0 ]; then
  printf '{"date":"2000-01-01","ts":%s,"minutes":22}\n' "$TSPT" > "$PTL"
  check "음성: KST 어제·태평양 오늘 22분 + 1대×5분 = 27 > 25(태평양 기준)" 1 env FTL_LEDGER="$PTL" "$FTL" run ios --models iphone8 --ipa x.ipa --dry-run
else
  echo "⏭ 태평양 사례: 17:00 KST 이후라 KST·태평양 날짜가 같아 건너뜀"
fi
rm -f "$PTL"
n=$(wc -l < "$L" | tr -d ' ')
[ "$n" = 2 ] && echo "✅ 원장 행 수 그대로 2(거부·dry-run은 기록 없음)" || { echo "❌ 원장 행 수 $n"; fail=1; }
rm -f "$L"
exit $fail
