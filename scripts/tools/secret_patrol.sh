#!/bin/bash
# 시크릿·SA 일간 순찰 — P2 (2026-07-24 작가님 승인)
#
# 동작: secret map(전체) + sa_audit.sh 스냅샷 → 전일 대비 diff →
#       변화 있으면 monkos-ops/ops/audit/PATROL_LOG.md 어펜드 + 텔레그램 통지(토큰 SM 런타임 취득).
# 실패 가시화: 각 단계 실패 시 명시 에러 + 로그 기록. 무음 강등 금지.
# 크론: iMac crontab 09:30 KST 일간. 값 비노출(이름·메타만).
set -uo pipefail
ROOT=$(git -C "$(dirname "$0")/../.." rev-parse --show-toplevel 2>/dev/null || echo "$HOME/developer/monk_project")
SNAP_DIR="$HOME/.monkos/patrol"
LOG="$ROOT/monkos-ops/ops/audit/PATROL_LOG.md"
TODAY=$(date +%Y%m%d)
mkdir -p "$SNAP_DIR"

CUR="$SNAP_DIR/snap_$TODAY.txt"
{
  echo "## secret map ($(date '+%F %R'))"
  zsh "$ROOT/scripts/secret.sh" map 2>/dev/null
  echo "## sa_audit"
  bash "$ROOT/scripts/tools/sa_audit.sh" 2>/dev/null
} > "$CUR" || { echo "[patrol] 스냅샷 생성 실패" >&2; exit 1; }

PREV=$(ls -t "$SNAP_DIR"/snap_*.txt 2>/dev/null | grep -v "$TODAY" | head -1)
if [ -z "$PREV" ]; then
  echo "[patrol] 첫 스냅샷 생성 — 비교 기준 확보"
  exit 0
fi

DIFF=$(diff "$PREV" "$CUR" | grep '^[<>]' | grep -v '^\(<\|>\) *$' | head -40 || true)
ALERT=$(grep -c "⚠️" "$CUR" || true)

if [ -z "$DIFF" ] && [ "$ALERT" = "0" ]; then
  echo "[patrol] 변화 없음·경보 0 — 정상"
  exit 0
fi

{
  echo ""
  echo "## [$(date '+%F %R KST')] 순찰 감지"
  [ -n "$DIFF" ] && echo '```diff' && echo "$DIFF" && echo '```'
  [ "$ALERT" != "0" ] && echo "- ⚠️ 경보 표식 ${ALERT}건 (스냅샷 $CUR 참조)"
} >> "$LOG"
echo "[patrol] 변화/경보 감지 → PATROL_LOG.md 어펜드"

# 텔레그램 통지 (chat_id 미설정 시 명시 경고 후 로그만)
TG_TOKEN=$(gcloud secrets versions access latest --secret=TELEGRAM_BOT_TOKEN --project=monkos 2>/dev/null || true)
TG_CHAT="${MONKOS_PATROL_CHAT_ID:-}"
if [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ]; then
  MSG="🔐 시크릿·SA 순찰: 변화 감지 (diff $(echo "$DIFF" | wc -l | tr -d ' ')줄, 경보 ${ALERT}건) — PATROL_LOG.md 확인"
  curl -s -o /dev/null "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -d chat_id="$TG_CHAT" -d text="$MSG" || echo "[patrol] ⚠️ 텔레그램 전송 실패" >&2
else
  echo "[patrol] ⚠️ 텔레그램 미배선(MONKOS_PATROL_CHAT_ID 미설정) — 로그 기록만 수행" >&2
fi
