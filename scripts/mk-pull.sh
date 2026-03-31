#!/bin/bash
# mk-pull: monk_project main + monkos-works submodule 동시 pull
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/2] main pull ==="
git pull origin main

echo ""
echo "=== [2/2] works submodule pull ==="
git submodule update --remote --merge monkos-ops/works

echo ""
echo "✅ main + works 동시 pull 완료"
