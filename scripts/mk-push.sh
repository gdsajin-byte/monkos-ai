#!/bin/bash
# mk-push: monk_project main push
# 삭제 금지 — 쌓기만 하는 구조
# works submodule 스텝 제거 (2026-08-13 채널 폐지 — ORDER_20260813 §4-2)

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/2] retrieval 인덱스 리빌드 ==="
if (cd scripts/retrieval && node build_index.js --embed); then
  echo "✅ 인덱스 빌드 완료"
else
  echo "⚠️ 인덱스 빌드 실패 — push는 계속하되 retrieval MCP 데이터가 구버전입니다"
fi
echo ""

echo "=== [2/2] main push ==="
if git push origin main 2>&1; then
  echo "✅ main push 완료"
else
  echo "❌ main push 실패 — git pull 후 재시도"
  git pull --no-rebase origin main && git push origin main
fi

echo ""
echo "✅ main push 완료"
