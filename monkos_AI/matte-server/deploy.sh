#!/bin/bash
# 4060 매팅 서버 배포 — 레포 정본을 4060에 반영한다.
#
# Cloud Run이 아니라 사무실 GPU 박스(4060, Windows + NSSM)가 배포 대상이다.
# 정본은 이 디렉토리이며, 4060의 파일은 실행 사본이다. 반대 방향으로 고치지 말 것.
#
# 사용: ./deploy.sh          (배포)
#       ./deploy.sh --check  (배포 없이 원격 상태만 확인)
set -euo pipefail
# ── 미커밋 게이트 (G4 2026-09-01 민아) — 커밋 안 된 코드의 무음 탑승 방지
_DDIR="$(cd "$(dirname "$0")" && pwd)"
_DIRTY="$(git -C "$_DDIR" status --porcelain -- . 2>/dev/null | head -5)"
if [ -n "$_DIRTY" ]; then
  echo "⚠️  이 서비스 디렉토리에 미커밋 변경 존재 — 커밋 안 된 코드가 배포에 실릴 수 있습니다:" >&2
  echo "$_DIRTY" >&2
  case " $* " in *" --yes "*|*" -y "*) echo "   (--yes: 경고 후 진행)";; *)
    { read -r -p "   계속하시겠습니까? [y/N] " _DGA </dev/tty; } 2>/dev/null || _DGA=n
    case "$_DGA" in y|Y) ;; *) echo "   중단 — 커밋 후 재시도하세요." >&2; exit 1;; esac;;
  esac
fi


HOST="4060"
REMOTE_DIR="C:/Users/smuse73/matte-server"
REMOTE_DIR_WIN="C:\\Users\\smuse73\\matte-server"
SERVICE="birefnet-matte"
HEALTH="http://localhost:8000/health"
SRC="$(cd "$(dirname "$0")" && pwd)/server.py"

remote_health() { ssh "$HOST" "curl -s -m 10 $HEALTH"; }

if [ "${1:-}" = "--check" ]; then
  echo "▶ 원격 상태"
  ssh "$HOST" "powershell -NoProfile -Command \"(Get-Service $SERVICE).Status\""
  remote_health; echo
  exit 0
fi

echo "▶ [1/5] 문법 검사"
python3 -c "import ast,sys; ast.parse(open('$SRC').read())" && echo "  OK"

echo "▶ [2/5] 원격 백업"
STAMP=$(date +%Y%m%d_%H%M)
ssh "$HOST" "copy $REMOTE_DIR_WIN\\server.py $REMOTE_DIR_WIN\\server.py.bak_$STAMP" >/dev/null
echo "  server.py.bak_$STAMP"

echo "▶ [3/5] 전송"
scp -q "$SRC" "$HOST:$REMOTE_DIR/server.py"
echo "  OK"

echo "▶ [4/5] 서비스 재기동 (모델 로딩 약 20초)"
ssh "$HOST" "nssm restart $SERVICE" >/dev/null 2>&1 || true
sleep 22

echo "▶ [5/5] 헬스 확인"
BODY=$(remote_health)
echo "$BODY"
echo "$BODY" | grep -q '"model":"loaded"' || { echo "❌ 모델 미로딩 — 롤백: ssh $HOST \"copy $REMOTE_DIR_WIN\\server.py.bak_$STAMP $REMOTE_DIR_WIN\\server.py\" && ssh $HOST \"nssm restart $SERVICE\""; exit 1; }
echo "✅ 배포 완료"
