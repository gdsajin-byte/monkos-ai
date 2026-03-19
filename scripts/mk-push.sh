#!/bin/bash
# mk-push: monk_project main + monkos-works subtree 동시 push
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/2] main push ==="
git push origin main

echo ""
echo "=== [2/2] subtree push (monkos-works) ==="
git subtree push --prefix=monkos-ops/works origin-works main

echo ""
echo "✅ main + works 동시 push 완료"
