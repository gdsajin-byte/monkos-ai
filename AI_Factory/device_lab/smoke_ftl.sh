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
check "음성: 안드로이드 run(조사 단계)" 1 "$FTL" run android --models a05s
check "양성: 오늘 18분 + 1대×5분 = 23 ≤ 25(다른 날 30분은 제외)" 0 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa x.ipa --dry-run
check "음성: IPA 없음(실행 전 거부, 원장 미기록)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa /nope.ipa
check "음성: 우회 시도 --force(인자 없음)" 1 env FTL_LEDGER="$L" "$FTL" run ios --models iphone8 --ipa x.ipa --force
n=$(wc -l < "$L" | tr -d ' ')
[ "$n" = 2 ] && echo "✅ 원장 행 수 그대로 2(거부·dry-run은 기록 없음)" || { echo "❌ 원장 행 수 $n"; fail=1; }
rm -f "$L"
exit $fail
