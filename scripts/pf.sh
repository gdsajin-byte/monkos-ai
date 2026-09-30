#!/usr/bin/env bash
# pf — PF 원장 CLI 래퍼. 본체는 scripts/pf.py (표준 라이브러리만).
#   scripts/pf.sh append PF_X "내용" --agent iMac/민아 [--artifact 경로] [--status ✅]
#   scripts/pf.sh query [--status active] [--stale 14]
#   scripts/pf.sh check [--days 3] [--strict]
#   scripts/pf.sh show PF_X [--tail 5]
exec python3 "$(cd "$(dirname "$0")" && pwd)/pf.py" "$@"
