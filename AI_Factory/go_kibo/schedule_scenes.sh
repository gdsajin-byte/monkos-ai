#!/bin/bash
# 결정 장면 정밀 분석 — 4060 낮 창(학교 시간) 1회 예약. GPU 미사용(배치·예약만).
# 사용: schedule_scenes.sh 2026-11-06T08:30:00 [14:00] [name=full]
# 선행: decisive_scenes.py queries --name {name} (iMac). GO-train-resume·GO-mistakes-run은 건드리지 않는다(이 스크립트는 GO-scenes-run만 등록).
set -euo pipefail
AT="${1:?시작 YYYY-MM-DDTHH:MM:SS}"
END="${2:-14:00}"
NAME="${3:-full}"
HERE="$(cd "$(dirname "$0")" && pwd)"
A="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}"
W="$A/mistakes_v1/tasks"
Q="$A/mistakes_v0/scenes_${NAME}_queries.jsonl"
[ -f "$Q" ] || { echo "❌ schedule_scenes: $Q 없음 — decisive_scenes.py queries --name $NAME 먼저"; exit 1; }
mkdir -p "$W"
ssh 4060 "if not exist C:\Users\smuse73\go_kibo\scenes mkdir C:\Users\smuse73\go_kibo\scenes" >/dev/null
scp -q "$HERE/mistakes_runner.py" "4060:C:/Users/smuse73/go_kibo/mistakes_runner.py"
scp -q "$Q" "4060:C:/Users/smuse73/go_kibo/scenes/scenes_queries.jsonl"
ssh 4060 "schtasks /query /tn \MONK\GO-train-resume /xml" > "$W/GO-train-resume.base_for_scenes.xml"
python3 "$HERE/make_task_xml.py" "$W/GO-train-resume.base_for_scenes.xml" "$W/scenes" --b10-at "${AT:0:10}T23:00:00" \
  --b10-until "2099-01-01_00:00" --scenes-at "$AT" --scenes-end "$END" | sed -n '/GO-scenes-run/,/Arguments/p'
scp -q "$W/scenes/GO-scenes-run.xml" "4060:C:/Users/smuse73/go_kibo/GO-scenes-run.xml"
ssh 4060 "schtasks /create /tn \MONK\GO-scenes-run /xml C:\Users\smuse73\go_kibo\GO-scenes-run.xml /f"
echo "== 실측"
ssh 4060 "schtasks /query /tn \MONK\GO-scenes-run /v /fo LIST" | iconv -f CP949 -t UTF-8 2>/dev/null | grep -E "작업 이름|다음 실행|상태:|실행할 작업|예약된 작업 상태"
