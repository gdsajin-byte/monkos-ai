#!/bin/bash
# ftl.sh run android 가드 스모크(막내2) — 시험 원장(FTL_LEDGER)·가짜 gcloud(PATH 맨 앞)만 쓴다. FTL 실호출 0을 끝에 검증한다.
# 배경: 11-06 막내8 스모크의 '안드로이드 run 거부' 사례가 run_android 추가 뒤 실제 원장·실실행 경로를 타게 됨(쌍아 09:09) → 격리 스모크로 대체
# 가짜 gcloud: 'models describe X' → X에 '.arm'이 있으면 VIRTUAL, 아니면 PHYSICAL / 그 밖의 호출은 기록만 하고 rc=0
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FTL="$HERE/ftl.sh"
T="$(mktemp -d -t ftl_android_smoke)"
L="$T/ledger.jsonl"; CALLS="$T/gcloud_calls.txt"
REAL="${HOME}/.monkos/device_lab/usage.jsonl"
real_before=$( [ -f "$REAL" ] && shasum "$REAL" | cut -d' ' -f1 || echo none )
mkdir -p "$T/bin"
cat > "$T/bin/gcloud" <<'SH'
#!/bin/bash
echo "$*" >> "$GCLOUD_CALLS"
if [ "$1 $2 $3 $4 $5" = "firebase test android models describe" ]; then
  case "$6" in *.arm*) echo VIRTUAL;; *) echo PHYSICAL;; esac
fi
exit 0
SH
chmod +x "$T/bin/gcloud"
export PATH="$T/bin:$PATH" GCLOUD_CALLS="$CALLS" FTL_LEDGER="$L"
: > "$CALLS"
fail=0
check() {  # 이름 기대rc 명령…
  local name="$1" want="$2"; shift 2
  out="$("$@" 2>&1)"; rc=$?
  if [ "$rc" = "$want" ]; then echo "✅ $name (rc=$rc) — $(echo "$out" | grep -m1 -E '가드|❌|dry-run' | cut -c1-110)"; else echo "❌ $name rc=$rc 기대 $want — $out"; fail=1; fi
}
NOW=$(date +%s)
: > "$L"
check "양성: 가상 1대 × (3+2)분 = 5 ≤ 50" 0 "$FTL" run android --models MediumPhone.arm:34 --apk x.apk --dry-run
printf '{"date":"2000-01-01","ts":%s,"minutes":0,"virtual_minutes":46}\n' "$NOW" > "$L"
check "음성: 가상 오늘 46분 + 5 = 51 > 50" 1 "$FTL" run android --models MediumPhone.arm:34 --apk x.apk --dry-run
check "양성: 가상 46분은 실기기 가드에 안 셈 — 실기기 1대 5분" 0 "$FTL" run android --models a05s:35 --apk x.apk --dry-run
printf '{"date":"2000-01-01","ts":%s,"minutes":18}\n' "$NOW" > "$L"
check "음성: 실기기 오늘 18분 + 2대×5분 = 28 > 25" 1 "$FTL" run android --models a05s:35,a15:34 --apk x.apk --dry-run
check "양성: 실기기 오늘 18분 + 1대×5분 = 23 ≤ 25" 0 "$FTL" run android --models a15:34 --apk x.apk --dry-run
check "음성: 가상·실기기 혼합" 1 "$FTL" run android --models MediumPhone.arm:34,a05s:35 --apk x.apk --dry-run
check "음성: 기종당 5분(상한 3분)" 1 "$FTL" run android --models MediumPhone.arm:34 --apk x.apk --timeout 5m --dry-run
check "음성: APK 없음(실행 전 거부, 원장 미기록)" 1 "$FTL" run android --models MediumPhone.arm:34 --apk /nope.apk
check "음성: 모르는 인자 --force" 1 "$FTL" run android --models MediumPhone.arm:34 --apk x.apk --force
# 태평양 일자: KST 어제·태평양 오늘인 가상 48분이 오늘 합계에 잡혀야 한다(17:00 KST 이후면 두 날짜가 같아 건너뜀)
TSPT=$(python3 -I -c "
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
now=datetime.now(timezone.utc); pt=now.astimezone(ZoneInfo('America/Los_Angeles'))
s=pt.replace(hour=0,minute=1,second=0,microsecond=0)
print(int(s.timestamp()) if s.astimezone(ZoneInfo('Asia/Seoul')).date()!=now.astimezone(ZoneInfo('Asia/Seoul')).date() else 0)")
if [ "$TSPT" != 0 ]; then
  printf '{"date":"2000-01-01","ts":%s,"minutes":0,"virtual_minutes":48}\n' "$TSPT" > "$L"
  check "음성: 가상 KST 어제·태평양 오늘 48분 + 5 = 53 > 50(태평양 기준)" 1 "$FTL" run android --models MediumPhone.arm:34 --apk x.apk --dry-run
else
  echo "⏭ 태평양 사례: 17:00 KST 이후라 건너뜀"
fi
runs=$(grep -c "test android run" "$CALLS")
[ "$runs" = 0 ] && echo "✅ FTL 실호출 0 (가짜 gcloud 기록: describe $(grep -c 'models describe' "$CALLS")회만)" || { echo "❌ FTL 실행 호출 ${runs}회"; fail=1; }
n=$(wc -l < "$L" | tr -d ' ')
[ "$n" = 1 ] && echo "✅ 시험 원장 행 그대로(거부·dry-run 기록 없음)" || { echo "❌ 시험 원장 행 수 $n"; fail=1; }
real_after=$( [ -f "$REAL" ] && shasum "$REAL" | cut -d' ' -f1 || echo none )
[ "$real_before" = "$real_after" ] && echo "✅ 실제 원장 불변" || { echo "❌ 실제 원장이 바뀜"; fail=1; }
rm -f "$T/bin/gcloud" "$L" "$CALLS"; rmdir "$T/bin" "$T" 2>/dev/null
exit $fail
