#!/bin/bash
# mk-pull: monk_project main pull
# 삭제 금지 — 쌓기만 하는 구조
# works submodule 스텝 제거 (2026-08-13 채널 폐지 — ORDER_20260813 §4-2, 표 외 추가분)

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== main pull ==="
git pull origin main

echo ""
echo "✅ main pull 완료"
