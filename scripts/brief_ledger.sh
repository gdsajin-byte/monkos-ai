#!/usr/bin/env bash
# brief_ledger — 브리핑 해소 원장 CLI 래퍼. 본체는 scripts/brief_ledger.py (표준 라이브러리만).
#   scripts/brief_ledger.sh open --id 160 --axis secret --severity 🔴 --title "..." --owner 쌍아 --by iMac/쌍아
#   scripts/brief_ledger.sh resolve --id 160 --evidence "prod rev ... 6f9a2ee5" --by iMac/쌍아-막내6
#   scripts/brief_ledger.sh list --open [--axis live]
#   scripts/brief_ledger.sh show --id 160
# 원장 경로 대체(스모크): --ledger PATH (서브커맨드 앞) 또는 BRIEF_LEDGER=PATH
exec python3 "$(cd "$(dirname "$0")" && pwd)/brief_ledger.py" "$@"
