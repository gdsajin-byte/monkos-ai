#!/bin/bash
# SECRET_INVENTORY.md vs GCP Secret Manager 대사 스크립트
# 값은 절대 노출하지 않는다 (헌법 4조 1항)
set -euo pipefail

PROJECT="monkos"
INVENTORY="monkos-ops/ops/SECRET_INVENTORY.md"
cd "$(git rev-parse --show-toplevel)"

if [ ! -f "$INVENTORY" ]; then
  echo "❌ $INVENTORY 파일 없음"
  exit 1
fi

echo "=== 시크릿 인벤토리 감사 ==="
echo ""

SM_LIST=$(gcloud secrets list --project="$PROJECT" --format="value(name)" 2>/dev/null | sort)
SM_COUNT=$(echo "$SM_LIST" | wc -l | tr -d ' ')
echo "📦 SM 실측: ${SM_COUNT}건"

MISSING=()
while IFS= read -r secret; do
  if ! grep -q "$secret" "$INVENTORY" 2>/dev/null; then
    MISSING+=("$secret")
  fi
done <<< "$SM_LIST"

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅ 전 항목 인벤토리 등재 확인"
else
  echo "⚠️ 인벤토리 미등재 ${#MISSING[@]}건:"
  for m in "${MISSING[@]}"; do
    echo "  - $m"
  done
fi

echo ""
echo "=== 감사 완료 ==="
