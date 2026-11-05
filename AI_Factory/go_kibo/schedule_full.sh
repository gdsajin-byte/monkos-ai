#!/bin/bash
# 4060 예약 설정 (GPU 미사용): GO-train-resume 트리거·--until 변경 + GO-mistakes-run 신설(매일 23:05).
# 사용: schedule_full.sh 2026-11-05T23:00:00 2026-11-06_07:30
# 기존 XML을 내보내 principal·설정을 물려받는다. 설정 전후 XML은 레포 밖에 보관.
set -euo pipefail
AT="${1:?b10 시작 YYYY-MM-DDTHH:MM:SS}"
UNTIL="${2:?b10 --until YYYY-MM-DD_HH:MM}"
EXTRA="${3:-}"   # --no-final-eval 등 make_task_xml 추가 인자
HERE="$(cd "$(dirname "$0")" && pwd)"
W="${GO_ANALYSIS_DIR:-$HOME/.monkos/go-board/analysis}/mistakes_v1/tasks"
mkdir -p "$W"
ssh 4060 "schtasks /query /tn \MONK\GO-train-resume /xml" > "$W/GO-train-resume.before.xml"
python3 "$HERE/make_task_xml.py" "$W/GO-train-resume.before.xml" "$W" --b10-at "$AT" --b10-until "$UNTIL" $EXTRA
scp -q "$W/GO-train-resume.xml" "4060:C:/Users/smuse73/go_kibo/GO-train-resume.xml"
scp -q "$W/GO-mistakes-run.xml" "4060:C:/Users/smuse73/go_kibo/GO-mistakes-run.xml"
ssh 4060 "schtasks /create /tn \MONK\GO-train-resume /xml C:\Users\smuse73\go_kibo\GO-train-resume.xml /f"
ssh 4060 "schtasks /create /tn \MONK\GO-mistakes-run /xml C:\Users\smuse73\go_kibo\GO-mistakes-run.xml /f"
echo "== 실측"
ssh 4060 "schtasks /query /tn \MONK\GO-train-resume /v /fo LIST"
ssh 4060 "schtasks /query /tn \MONK\GO-mistakes-run /v /fo LIST"
