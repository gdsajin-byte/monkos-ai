#!/bin/bash
# 4060 낮 창(학교 시간) 연쇄 1회 예약 — ① 실수 사전 잔여 → ② 결정 장면 (day_chain.py). GPU 미사용(배치·예약만).
# 사용: schedule_day.sh 2026-11-06T08:30:00 [15:30] [name=full] [task=GO-day-run]
# 밤 창: schedule_day.sh 2026-11-06T23:05:00 07:30 full GO-night-run (쌍아 11-06 09:56 — GO-mistakes-run 사용 안 함은 따로)
# 선행: decisive_scenes.py queries --name {name} (iMac). 다른 GO-* 작업은 건드리지 않는다(이 스크립트는 지정한 1회 작업만 등록).
set -euo pipefail
AT="${1:?시작 YYYY-MM-DDTHH:MM:SS}"
END="${2:-15:30}"
NAME="${3:-full}"
TASK="${4:-GO-day-run}"
HERE="$(cd "$(dirname "$0")" && pwd)"
A="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}"
W="$A/mistakes_v1/tasks"
Q="$A/mistakes_v0/scenes_${NAME}_queries.jsonl"
[ -f "$Q" ] || { echo "❌ schedule_scenes: $Q 없음 — decisive_scenes.py queries --name $NAME 먼저"; exit 1; }
mkdir -p "$W"
ssh 4060 "if not exist C:\Users\smuse73\go_kibo\scenes mkdir C:\Users\smuse73\go_kibo\scenes" >/dev/null
scp -q "$HERE/mistakes_runner.py" "4060:C:/Users/smuse73/go_kibo/mistakes_runner.py"
scp -q "$HERE/day_chain.py" "4060:C:/Users/smuse73/go_kibo/day_chain.py"
scp -q "$Q" "4060:C:/Users/smuse73/go_kibo/scenes/scenes_queries.jsonl"
ssh 4060 "schtasks /query /tn \MONK\GO-train-resume /xml" > "$W/GO-train-resume.base_for_day.xml"
python3 "$HERE/make_task_xml.py" "$W/GO-train-resume.base_for_day.xml" "$W/day" --b10-at "${AT:0:10}T23:00:00" \
  --b10-until "2099-01-01_00:00" --day-at "$AT" --day-end "$END" --day-name "$TASK" | sed -n "/== $TASK/,/Arguments/p"
scp -q "$W/day/$TASK.xml" "4060:C:/Users/smuse73/go_kibo/$TASK.xml"
ssh 4060 "schtasks /create /tn \MONK\\$TASK /xml C:\Users\smuse73\go_kibo\\$TASK.xml /f"
echo "== 실측"
ssh 4060 "schtasks /query /tn \MONK\\$TASK /v /fo LIST" | iconv -f CP949 -t UTF-8 2>/dev/null | grep -E "작업 이름|다음 실행|상태:|실행할 작업|예약된 작업 상태"
