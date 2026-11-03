#!/usr/bin/env bash
# SessionStart 훅 — E7: 디바이스·시각·git 상태·세션 로그 존재를 하네스가 실측해 주입.
# 원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.2 E7 (ch1 5조·ch3 5조 자동화)
# matcher: startup|resume|compact — 컴팩션 후에도 재주입되어 정합 유지.
# 세션 이름 자동 지정 (10-02 ORDER_20261002 세션이름자동화): {디바이스}-{역할}-{MMDD}-{HHMM}.
#   startup·resume에서만, 이름이 이미 있으면(session_title) 덮어쓰지 않는다. 역할은 CLAUDE_CODE_ENTRYPOINT로 판별.
# 출력: JSON(hookSpecificOutput.additionalContext + sessionTitle). JSON 생성 실패 시 평문 + [HOOK-ERR]로 강등(문맥 주입은 유지).
# 실패 가시화: 어떤 단계가 실패해도 [HOOK-ERR] 접두로 출력하고 나머지는 계속.
set -u
# Windows(4060 Git Bash) 파이썬 표준 입출력 기본값은 cp949 → 한글 JSON 출력이 깨지거나 실패해 평문 강등됐다(11-03 실측).
# 이 훅 프로세스 안에서만 UTF-8로 고정한다.
export PYTHONIOENCODING=utf-8
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || { echo "[HOOK-ERR] session_start: 프로젝트 디렉터리 이동 실패"; exit 1; }

now="$(date '+%Y-%m-%d %H:%M KST')"
today="$(date '+%Y-%m-%d')"
month="$(date '+%Y-%m')"
stamp="$(date '+%m%d-%H%M')"
host="$(hostname 2>/dev/null || echo unknown)"
# 기기 판별 (11-03 ORDER_20261103 막내8 정본화 — M1·4060이 hostname 불일치로 "웹(원격)"→역할 민아로 오판된 결함 교정).
# 우선순위: ① 환경변수 MONK_DEVICE ② 기기 로컬 파일 ~/.claude/monk-device 1행 ③ hostname 패턴·uname·WSL
#           ④ 웹 컨테이너 양성 신호 CLAUDE_CODE_REMOTE=true ⑤ 그 외 = 미확인 + [HOOK-ERR] (역할은 덮지 않는다)
# 허용값: iMac|M1|M2|4060|웹. 허용값 밖은 [HOOK-ERR]로 알리고 다음 단계로 넘어간다(무음 강등 금지).
dev_err=""
dev_src=""
norm_dev() {   # 허용값이면 내부 표기로 출력, 아니면 빈 문자열
  case "$1" in
    iMac|M1|M2|4060) printf '%s' "$1" ;;
    웹)              printf '%s' "웹(원격)" ;;
  esac
}
device=""
if [ -n "${MONK_DEVICE:-}" ]; then
  device="$(norm_dev "$MONK_DEVICE")"
  if [ -n "$device" ]; then dev_src="MONK_DEVICE"; else dev_err="${dev_err}[HOOK-ERR] MONK_DEVICE 허용값 밖(${MONK_DEVICE}) — 무시. "; fi
fi
dev_file="${HOME:-}/.claude/monk-device"
if [ -z "$device" ] && [ -f "$dev_file" ]; then
  # 1행만, BOM·CR·앞뒤 공백 제거 (Windows 저장분 대비)
  fval="$(head -n 1 "$dev_file" 2>/dev/null | tr -d '\r' | sed -e $'s/^\xEF\xBB\xBF//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  device="$(norm_dev "$fval")"
  if [ -n "$device" ]; then dev_src="~/.claude/monk-device"; else dev_err="${dev_err}[HOOK-ERR] ~/.claude/monk-device 허용값 밖(${fval:-빈 값}) — 무시. "; fi
fi
if [ -z "$device" ]; then
  case "$host" in
    *iMac*)                                  device="iMac" ;;
    *Macminiui-Macmini*|*macmini-macmini*)   device="M1" ;;   # M1 로컬 hostname·테일넷 이름 (11-03 실측)
    *MacBook*|*M1*)                          device="M1" ;;
    *MONK-4060*|*monk-4060*)                 device="4060" ;; # 4060 Windows hostname·테일넷 이름 (11-03 실측)
    *mac-mini*|*Mac-mini*|*M2*)              device="M2" ;;
  esac
  if [ -z "$device" ]; then
    case "$(uname -s 2>/dev/null)" in
      MINGW*|MSYS*|CYGWIN*) device="4060" ;;                 # Windows Git Bash = 4060 (Windows 기기는 4060뿐)
      *) grep -qi microsoft /proc/version 2>/dev/null && device="4060" ;;
    esac
  fi
  [ -n "$device" ] && dev_src="hostname"
fi
# 웹 컨테이너는 양성 신호로만 판정 — 클라우드 세션 VM은 CLAUDE_CODE_REMOTE=true를 싣고 로컬에선 true가 아니다.
# 근거: https://code.claude.com/docs/en/env-vars (CLAUDE_CODE_REMOTE) · https://code.claude.com/docs/en/cloud-environments (11-03 확인)
if [ -z "$device" ] && [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  device="웹(원격)"; dev_src="CLAUDE_CODE_REMOTE"
fi
if [ -z "$device" ]; then
  device="미확인"
  dev_err="${dev_err}[HOOK-ERR] 기기 미확인(hostname=${host}) — ~/.claude/monk-device 설정 필요 (허용값 iMac|M1|M2|4060|웹)"
fi
dev_line=""
[ -n "$dev_err" ] && dev_line="- ${dev_err}
"

# 역할 (ch1 5조 판별표의 실행 표면 대응). 헤드리스·SDK·미지 표면은 이름을 붙이지 않는다.
entry="${CLAUDE_CODE_ENTRYPOINT:-}"
case "$entry" in
  claude-vscode)  role="쌍아" ;;
  claude-desktop) role="민아" ;;
  cli)            role="막내" ;;
  *)              role="" ;;
esac
# CLI 표면 한정 역할 재정의 (10-02 디자인 TF 시범): scripts/mk-soso.sh가 MONK_ROLE=소소로 기동. 허용값 밖·타 표면은 무시.
# 10-22 허용값 민아 추가 (ORDER_20261022 iMac민아 헤드리스브리핑): scripts/mk-mina-brief.sh가 MONK_ROLE=민아로 기동.
#   헤드리스(claude -p = sdk-cli)도 대상(쌍아 10-22 판단). MONK_ROLE 미설정 sdk-cli는 기존대로 역할 없음.
if [ "$entry" = "cli" ] || [ "$entry" = "sdk-cli" ]; then
  case "${MONK_ROLE:-}" in 소소|민아) role="$MONK_ROLE" ;; esac
fi
[ "$device" = "웹(원격)" ] && [ -n "$role" ] && role="민아"   # 웹(원격 컨테이너)=웹 민아
name_device="${device%%(*}"                                     # 이름엔 괄호를 쓰지 않는다: 웹(원격) → 웹

# stdin JSON에서 session_id·source·session_title 추출. 실패해도 계속.
input="$(cat 2>/dev/null || echo '{}')"
field() { printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('$1') or '')" 2>/dev/null || echo ""; }
sid="$(field session_id)"
src="$(field source)"
cur_title="$(field session_title)"
# resume은 재개 시각이 아니라 시작 시각으로 명명한다 — 대화 기록 첫 줄의 timestamp(UTC) → 로컬 MMDD-HHMM. 실패 시 현재 시각.
if [ "$src" = "resume" ]; then
  tpath="$(field transcript_path)"
  tstamp="$(TP="$tpath" python3 -c '
import json, os, datetime
with open(os.environ["TP"], encoding="utf-8") as f:
    for line in f:
        ts = json.loads(line).get("timestamp")
        if ts:
            d = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone()
            print(d.strftime("%m%d-%H%M")); break
' 2>/dev/null || echo "")"
  [ -n "$tstamp" ] && stamp="$tstamp"
fi

title=""
if [ -n "$cur_title" ]; then
  title_line="세션 이름: ${cur_title} (기존 이름 유지)"
elif [ "$entry" = "sdk-cli" ]; then
  title_line="세션 이름: 자동 지정 안 함 (헤드리스 — 이름은 기동 래퍼의 --name)"
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
[MONK SessionStart 훅] ${now} · 디바이스=${device} (hostname ${host}${dev_src:+ · 판별 ${dev_src}}) · 실행 표면=${entry:-미상}${role:+ → 역할 후보 ${role}}
${dev_line}- ${title_line}
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
