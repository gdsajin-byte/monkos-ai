#!/bin/bash
# mk-push: monk_project main + monkos-works submodule 동시 push
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/3] works submodule push ==="
cd monkos-ops/works
git add -A
if git diff --cached --quiet; then
  echo "works 변경 없음 — skip"
else
  git commit -m "[works] $(date +%Y-%m-%d) 동기화"
  git push origin main
  echo "✅ works push 완료"
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
git push origin main

echo ""
echo "✅ main + works 동시 push 완료"
