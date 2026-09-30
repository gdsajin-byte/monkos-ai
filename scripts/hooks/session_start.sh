#!/usr/bin/env bash
# SessionStart 훅 — E7: 디바이스·시각·git 상태·세션 로그 존재를 하네스가 실측해 주입.
# 원천: DESIGN_20260930_집행코드화_hooks_deny.md §3.2 E7 (ch1 5조·ch3 5조 자동화)
# matcher: startup|resume|compact — 컴팩션 후에도 재주입되어 정합 유지.
# 실패 가시화: 어떤 단계가 실패해도 [HOOK-ERR] 접두로 출력하고 나머지는 계속.
set -u
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || { echo "[HOOK-ERR] session_start: 프로젝트 디렉터리 이동 실패"; exit 1; }

now="$(date '+%Y-%m-%d %H:%M KST')"
today="$(date '+%Y-%m-%d')"
month="$(date '+%Y-%m')"
host="$(hostname 2>/dev/null || echo unknown)"
case "$host" in
  *iMac*)                 device="iMac" ;;
  *MacBook*|*M1*)         device="M1" ;;
  *mac-mini*|*Mac-mini*|*M2*) device="M2" ;;
  *) if grep -qi microsoft /proc/version 2>/dev/null; then device="4060"; else device="웹(원격)"; fi ;;
esac

# stdin JSON에서 session_id 추출 (E10 예비 경로 approve.sh 인자용). 실패해도 계속.
sid="$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("session_id",""))' 2>/dev/null || echo "")"
sync="$(git status -sb 2>/dev/null | head -1 || echo '[HOOK-ERR] git status 실패')"
unpushed="$(git rev-list --count @{u}..HEAD 2>/dev/null || echo '?')"
behind="$(git rev-list --count HEAD..@{u} 2>/dev/null || echo '?')"
dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
logs="$(ls "monkos-ops/ops/sessions/${month}/" 2>/dev/null | grep "^${today}_" | tr '\n' ' ')"
[ -z "$logs" ] && logs="(오늘 세션 로그 없음 — session-start 스킬로 생성)"

cat <<EOF
[MONK SessionStart 훅] ${now} · 디바이스=${device} (hostname ${host})
- git: ${sync} · 미푸시 ${unpushed} · behind ${behind} · 미커밋/미추적 ${dirty}건
- 오늘 세션 로그: ${logs}
- 역할은 작가님 첫 턴 선언 기준 (ch1 5조). 헤더: **[YYYY-MM-DD HH:MM KST]** ${device}/{에이전트} → {수신자}
- 집행 훅 활성 (deny 16 · PreToolUse Bash/Write · 승인 게이트 E10). 배포 승인은 작가님 채팅 '배포 승인'. session_id=${sid:-?}
EOF
exit 0
