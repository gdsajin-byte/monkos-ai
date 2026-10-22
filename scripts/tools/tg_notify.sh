#!/bin/bash
# tg_notify.sh — 팀봇 텔레그램 1줄 발송 (+ 인라인 URL 버튼 1개) (2026-10-22 신설)
#
# 배경: 배포 요청 사전 점검 후 작가님 폰에 알림 1줄 + "민아 세션 열기" 링크 버튼.
#       10-21 민아 수동 curl 발송(message_id 450)의 도구화.
#       설계: monkos-ops/tech/designs/2026-10/DESIGN_20261021_KKU_배포요청_앱알림_승인버튼.md §4 1b
#       지시: monkos-ops/ops/orders/2026-10/ORDER_20261022_iMac쌍아_막내_KKU_배포요청_텔레그램발송도구.md
#
# 사용:
#   scripts/tools/tg_notify.sh --text "<본문>" [--button-text "<라벨>" --button-url "<URL>"] [--dry-run]
#
# 규칙:
#   - 봇 토큰 = SM TELEGRAM_TEAM_BOT_TOKEN (scripts/secret.sh 경유). 값은 출력·인자에 노출하지 않는다
#     (curl에는 -K - 로 stdin 설정 전달 → 프로세스 목록에 토큰 미노출). set -x 금지.
#   - chat_id = monkos_AI/portal/deploy.sh 의 TEAM_CHAT_ID= 값(비시크릿 정본)을 읽는다. 사본 금지.
#     TG_CHAT_ID_OVERRIDE 환경변수는 음성 대조군 스모크 전용.
#   - 버튼은 url 버튼만. callback_data 금지(클릭은 사람 턴이 아님, ch1 7조).
#   - getUpdates·deleteWebhook 등 봇 설정 호출 금지(팀봇은 포털 dev 웹훅 사용 중).
#   - 실패 가시화: HTTP≠200 또는 ok≠true → stderr "❌ tg_notify: ..." + exit 1.
set -euo pipefail

die() { echo "❌ tg_notify: $*" >&2; exit 1; }

ROOT=$(git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null) || die "프로젝트 루트 탐지 실패"

TEXT=""; BTN_TEXT=""; BTN_URL=""; DRY=0
while [ $# -gt 0 ]; do
  case "$1" in
    --text)        TEXT="${2:-}"; shift 2 ;;
    --button-text) BTN_TEXT="${2:-}"; shift 2 ;;
    --button-url)  BTN_URL="${2:-}"; shift 2 ;;
    --dry-run)     DRY=1; shift ;;
    -h|--help)     sed -n '2,20p' "$0"; exit 0 ;;
    *) die "알 수 없는 인자: $1" ;;
  esac
done
[ -n "$TEXT" ] || die "--text 필수"
if [ -n "$BTN_TEXT" ] || [ -n "$BTN_URL" ]; then
  [ -n "$BTN_TEXT" ] && [ -n "$BTN_URL" ] || die "--button-text 와 --button-url 은 함께 지정"
  case "$BTN_URL" in https://*) ;; *) die "버튼 URL은 https:// 만 허용" ;; esac
fi

# chat_id — 정본(portal deploy.sh)에서 읽기
if [ -n "${TG_CHAT_ID_OVERRIDE:-}" ]; then
  CHAT_ID="$TG_CHAT_ID_OVERRIDE"; CHAT_SRC="TG_CHAT_ID_OVERRIDE(스모크 전용)"
else
  DEPLOY_SH="$ROOT/monkos_AI/portal/deploy.sh"
  [ -f "$DEPLOY_SH" ] || die "chat_id 정본 부재: $DEPLOY_SH"
  CHAT_ID=$(grep -oE 'TEAM_CHAT_ID=-?[0-9]+' "$DEPLOY_SH" | head -1 | cut -d= -f2 || true)
  [ -n "$CHAT_ID" ] || die "chat_id 읽기 실패 — $DEPLOY_SH 에 TEAM_CHAT_ID=<숫자> 없음"
  CHAT_SRC="monkos_AI/portal/deploy.sh"
fi

# 봇 토큰 — SM (secret.sh 경유, 값 미출력)
TOKEN=$(zsh "$ROOT/scripts/secret.sh" get TELEGRAM_TEAM_BOT_TOKEN 2>/dev/null) || TOKEN=""
TOKEN=$(printf '%s' "$TOKEN" | tr -d '\r\n')
[ -n "$TOKEN" ] || die "봇 토큰 획득 실패 — SM TELEGRAM_TEAM_BOT_TOKEN (gcloud 로그인·권한 확인)"

# 페이로드 (토큰 미포함)
PAYLOAD=$(TG_CHAT="$CHAT_ID" TG_TEXT="$TEXT" TG_BT="$BTN_TEXT" TG_BU="$BTN_URL" python3 -c '
import json, os
p = {"chat_id": os.environ["TG_CHAT"], "text": os.environ["TG_TEXT"], "disable_web_page_preview": True}
if os.environ["TG_BT"]:
    p["reply_markup"] = {"inline_keyboard": [[{"text": os.environ["TG_BT"], "url": os.environ["TG_BU"]}]]}
print(json.dumps(p, ensure_ascii=False))
') || die "페이로드 생성 실패"

if [ "$DRY" = 1 ]; then
  echo "🔎 tg_notify dry-run — 미발송"
  echo "  token: 획득됨 (${#TOKEN}자, 값 비표시)"
  echo "  chat_id 출처: $CHAT_SRC"
  echo "  payload: $PAYLOAD"
  exit 0
fi

TMP=$(mktemp); trap 'rm -f "$TMP"' EXIT
CODE=$(printf 'url = "https://api.telegram.org/bot%s/sendMessage"\n' "$TOKEN" \
  | curl -sS -K - -o "$TMP" -w '%{http_code}' --max-time 20 \
      -H 'Content-Type: application/json' --data-binary "$PAYLOAD" 2>/dev/null) || CODE="${CODE:-000}"
unset TOKEN

RESULT=$(python3 -c '
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print("ERR\t응답 JSON 파싱 불가"); sys.exit()
if d.get("ok") is True:
    print("OK\t%s" % d.get("result", {}).get("message_id"))
else:
    print("ERR\t%s" % d.get("description", "ok!=true"))
' "$TMP")
STATUS=${RESULT%%$'\t'*}; DETAIL=${RESULT#*$'\t'}

if [ "$CODE" != "200" ] || [ "$STATUS" != "OK" ]; then
  die "HTTP $CODE — $DETAIL"
fi
echo "✅ tg_notify: message_id=$DETAIL"
