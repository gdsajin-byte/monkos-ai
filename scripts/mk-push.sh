#!/bin/bash
# mk-push: monk_project main + monkos-works submodule 동시 push
# 삭제 금지 — 쌓기만 하는 구조
# works 실패해도 본진은 반드시 push (2026-04-08 개선)

cd "$(git rev-parse --show-toplevel)"

WORKS_OK=true

echo "=== [1/3] works submodule push ==="
cd monkos-ops/works
git add -A
if git diff --cached --quiet; then
  echo "works 변경 없음 — skip"
else
  git commit -m "[works] $(date +%Y-%m-%d) 동기화"
  if git push origin main 2>&1; then
    echo "✅ works push 완료"
  else
    echo "⚠️ works push 실패 — 본진은 계속 진행"
    WORKS_OK=false
  fi
fi
cd ../..

echo ""
echo "=== [2/3] submodule 참조 갱신 ==="
git add monkos-ops/works
if ! git diff --cached --quiet; then
  git commit -m "[sync] works submodule 참조 갱신"
fi

echo ""
echo "=== [3/3] main push ==="
if git push origin main 2>&1; then
  echo "✅ main push 완료"
else
  echo "❌ main push 실패 — git pull 후 재시도"
  git pull --no-rebase origin main && git push origin main
fi

echo ""
if [ "$WORKS_OK" = true ]; then
  echo "✅ main + works 동시 push 완료"
else
  echo "⚠️ main push 완료, works는 수동 확인 필요 (충돌 가능)"
fi
