#!/usr/bin/env bash
# SessionStart 훅 — E7: 디바이스·시각·git 상태·세션 로그 존재를 하네스가 실측해 주입.
# 원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.2 E7 (ch1 5조·ch3 5조 자동화)
# matcher: startup|resume|compact — 컴팩션 후에도 재주입되어 정합 유지.
# 세션 이름 자동 지정 (10-02 ORDER_20261002 세션이름자동화): {디바이스}-{역할}-{MMDD}-{HHMM}.
#   startup·resume에서만, 이름이 이미 있으면(session_title) 덮어쓰지 않는다. 역할은 CLAUDE_CODE_ENTRYPOINT로 판별.
# 출력: JSON(hookSpecificOutput.additionalContext + sessionTitle). JSON 생성 실패 시 평문 + [HOOK-ERR]로 강등(문맥 주입은 유지).
# 실패 가시화: 어떤 단계가 실패해도 [HOOK-ERR] 접두로 출력하고 나머지는 계속.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || { echo "[HOOK-ERR] session_start: 프로젝트 디렉터리 이동 실패"; exit 1; }

now="$(date '+%Y-%m-%d %H:%M KST')"
today="$(date '+%Y-%m-%d')"
month="$(date '+%Y-%m')"
stamp="$(date '+%m%d-%H%M')"
host="$(hostname 2>/dev/null || echo unknown)"
case "$host" in
  *iMac*)                 device="iMac" ;;
  *MacBook*|*M1*)         device="M1" ;;
  *mac-mini*|*Mac-mini*|*M2*) device="M2" ;;
  *) if grep -qi microsoft /proc/version 2>/dev/null; then device="4060"; else device="웹(원격)"; fi ;;
esac

# 역할 (ch1 5조 판별표의 실행 표면 대응). 헤드리스·SDK·미지 표면은 이름을 붙이지 않는다.
entry="${CLAUDE_CODE_ENTRYPOINT:-}"
case "$entry" in
  claude-vscode)  role="쌍아" ;;
  claude-desktop) role="민아" ;;
  cli)            role="막내" ;;
  *)              role="" ;;
esac
[ "$device" = "웹(원격)" ] && [ -n "$role" ] && role="민아"   # 웹(원격 컨테이너)=웹 민아
name_device="${device%%(*}"                                     # 이름엔 괄호를 쓰지 않는다: 웹(원격) → 웹

# stdin JSON에서 session_id·source·session_title 추출. 실패해도 계속.
input="$(cat 2>/dev/null || echo '{}')"
field() { printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('$1') or '')" 2>/dev/null || echo ""; }
sid="$(field session_id)"
src="$(field source)"
cur_title="$(field session_title)"

title=""
if [ -n "$cur_title" ]; then
  title_line="세션 이름: ${cur_title} (기존 이름 유지)"
elif [ -z "$role" ]; then
  title_line="세션 이름: 자동 지정 안 함 (실행 표면 ${entry:-미상} — 역할 미판별)"
elif [ "$src" = "startup" ] || [ "$src" = "resume" ]; then
  title="${name_device}-${role}-${stamp}"
  title_line="세션 이름: ${title} (자동 지정)"
else
  title_line="세션 이름: 변경 없음 (source=${src:-미상})"
fi

sync="$(git status -sb 2>/dev/null | head -1 || echo '[HOOK-ERR] git status 실패')"
unpushed="$(git rev-list --count @{u}..HEAD 2>/dev/null || echo '?')"
behind="$(git rev-list --count HEAD..@{u} 2>/dev/null || echo '?')"
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
logs="$(ls "monkos-ops/ops/sessions/${month}/" 2>/dev/null | grep "^${today}_" | tr '\n' ' ')"
[ -z "$logs" ] && logs="(오늘 세션 로그 없음 — session-start 스킬로 생성)"

ctx="$(cat <<EOF
[MONK SessionStart 훅] ${now} · 디바이스=${device} (hostname ${host}) · 실행 표면=${entry:-미상}${role:+ → 역할 후보 ${role}}
- ${title_line}
- git: ${sync} · 미푸시 ${unpushed} · behind ${behind} · 미커밋/미추적 ${dirty}건
- 오늘 세션 로그: ${logs}
- 역할은 작가님 첫 턴 선언 기준 (ch1 5조). 헤더: **[YYYY-MM-DD HH:MM KST]** ${device}/{에이전트} → {수신자}
- 같은 기기·역할의 옛 세션이 살아 있으면 세션 간 메시지가 그쪽으로 갈 수 있다 — session-start 스킬 절차 4에서 피어 목록으로 확인.
- 집행 훅 활성 (deny 16 · PreToolUse Bash/Write · 승인 게이트 E10). 배포 승인은 작가님 채팅 '배포 승인'. session_id=${sid:-?}
EOF
)"

if ! CTX="$ctx" TITLE="$title" python3 -c '
import json, os
out = {"hookEventName": "SessionStart", "additionalContext": os.environ["CTX"]}
if os.environ.get("TITLE"):
    out["sessionTitle"] = os.environ["TITLE"]
print(json.dumps({"hookSpecificOutput": out}, ensure_ascii=False))
' 2>/dev/null; then
  echo "[HOOK-ERR] session_start: JSON 출력 생성 실패 — 세션 이름 미지정, 평문 문맥으로 강등"
  printf '%s\n' "$ctx"
fi
exit 0
