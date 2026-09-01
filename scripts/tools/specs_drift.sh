#!/bin/bash
# specs_drift.sh — specs 소스 ↔ 엣지 배포본 드리프트 감지 (G1, 2026-09-01 민아)
# 용법: specs_drift.sh            현황 판정 (드리프트 시 exit 1 + 경고)
#       specs_drift.sh --record   배포 직후 현행 소스 해시 기록 (edge/deploy.sh가 호출)
#       specs_drift.sh --hook     pre-push용 — 경고만 하고 항상 exit 0 (푸시 비차단)
#       specs_drift.sh --install-hook  .git/hooks/pre-push 설치
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
PORTAL="$ROOT/monkos_AI/portal"
HASH_FILE="$PORTAL/edge/.specs-deploy-hash"
calc() {
  { shasum "$PORTAL/lib/cms/specs-data.json" "$PORTAL/lib/cms/specs-i18n.js" "$PORTAL/lib/cms/render-specs.js" 2>/dev/null
    find "$PORTAL/lib/cms/components" "$PORTAL/tools/specs-ssg" -type f \( -name "*.js" -o -name "*.mjs" -o -name "*.json" \) -exec shasum {} + 2>/dev/null
  } | awk '{print $1}' | sort | shasum | awk '{print $1}'
}
case "${1:-}" in
  --record)
    calc > "$HASH_FILE"; echo "✓ specs 배포 해시 기록: $(cat "$HASH_FILE" | head -c 12)…" ;;
  --install-hook)
    HOOK="$ROOT/.git/hooks/pre-push"
    grep -q specs_drift "$HOOK" 2>/dev/null || { echo -e "#!/bin/bash\n\"\$(git rev-parse --show-toplevel)/scripts/tools/specs_drift.sh\" --hook" >> "$HOOK"; chmod +x "$HOOK"; }
    echo "✓ pre-push 훅 설치 완료 (경고 전용·비차단)" ;;
  --hook|"")
    if [ ! -f "$HASH_FILE" ]; then echo "⚠️  [specs_drift] 배포 해시 기록 없음 — 최초 배포 후 --record 필요" >&2; [ "${1:-}" = "--hook" ] && exit 0 || exit 1; fi
    CUR="$(calc)"; REC="$(cat "$HASH_FILE")"
    if [ "$CUR" = "$REC" ]; then echo "✓ [specs_drift] 엣지 배포본 = 현행 소스 (드리프트 없음)"
    else
      echo "⚠️  [specs_drift] 무음 구본 경보 — specs 소스가 마지막 엣지 배포 이후 변경됨. 'monkos_AI/portal/edge/deploy.sh' 재배포 필요" >&2
      [ "${1:-}" = "--hook" ] && exit 0 || exit 1
    fi ;;
  *) echo "용법: specs_drift.sh [--record|--hook|--install-hook]"; exit 2 ;;
esac
