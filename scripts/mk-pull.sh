#!/bin/bash
# mk-pull: monk_project main + monkos-works subtree 동시 pull
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/2] main pull ==="
git pull origin main

echo ""
echo "=== [2/2] subtree pull (monkos-works) ==="
git subtree pull --prefix=monkos-ops/works origin-works main --squash

echo ""
echo "✅ main + works 동시 pull 완료"
