#!/usr/bin/env bash
# gitleaks pre-commit hook — staged 파일에서 시크릿 탐지 시 커밋 차단

set -euo pipefail

if ! command -v gitleaks &>/dev/null; then
  echo "[gitleaks] ERROR: gitleaks not found. Install: brew install gitleaks"
  exit 1
fi

echo "[gitleaks] Scanning staged changes..."

if gitleaks protect --staged --no-banner --exit-code 1 2>&1; then
  echo "[gitleaks] No secrets detected."
  exit 0
else
  echo ""
  echo "[gitleaks] ⛔ SECRET DETECTED — commit blocked."
  echo "[gitleaks] Fix the above findings before committing."
  exit 1
fi
