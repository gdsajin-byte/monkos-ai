#!/usr/bin/env bash
# pf_frontmatter_backfill.sh — portfolio: frontmatter 소급 보강
# PF_RETRIEVAL Phase 0
set -euo pipefail

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

BASE="$(cd "$(dirname "$0")/.." && pwd)"

DIRS=(
  "$BASE/monkos-ops/ops/orders"
  "$BASE/monkos-ops/ops/reports"
  "$BASE/monkos-ops/ops/proposals"
  "$BASE/monkos-ops/tech/designs"
  "$BASE/monkos-ops/tech/specs"
  "$BASE/monkos-ops/ops/incidents"
)

CODENAMES=(
  PRESENTATION IMAGE_PRO MONK_OS AUTOPILOT RETRIEVAL
  IDPHOTO PROFILES CHATBOT FACTORY CITADEL
  PORTAL STUDIO SPREAD SPECS EVENT
  VTON CROP OPUS MUSE VIDEO
  CDP RND KKU DOCS
)

processed=0
skipped_portfolio=0
skipped_no_fm=0
skipped_no_match=0
multi_match=0
no_status_line=0

for dir in "${DIRS[@]}"; do
  [[ -d "$dir" ]] || continue
  while IFS= read -r -d '' file; do
    fname="$(basename "$file")"

    matches=()
    for code in "${CODENAMES[@]}"; do
      if [[ "$fname" =~ (^|[_+.-])${code}([_+.-]|$) ]]; then
        matches+=("$code")
      fi
    done

    [[ ${#matches[@]} -eq 0 ]] && { ((skipped_no_match++)) || true; continue; }

    if [[ ${#matches[@]} -gt 1 ]]; then
      echo "[MULTI] $fname → ${matches[*]}"
      ((multi_match++)) || true
      continue
    fi

    code="${matches[0]}"

    first_line="$(head -1 "$file")"
    if [[ "$first_line" != "---" ]]; then
      echo "[NO-FM] $fname"
      ((skipped_no_fm++)) || true
      continue
    fi

    fm_end="$(awk 'NR>1 && /^---[[:space:]]*$/{print NR; exit}' "$file")"
    if [[ -z "$fm_end" ]]; then
      echo "[NO-FM-END] $fname"
      ((skipped_no_fm++)) || true
      continue
    fi

    if sed -n "2,$((fm_end-1))p" "$file" | grep -q '^portfolio:'; then
      ((skipped_portfolio++)) || true
      continue
    fi

    status_ln="$(sed -n "2,$((fm_end-1))p" "$file" | grep -n '^status:' | tail -1 | cut -d: -f1 || true)"

    if [[ -n "$status_ln" ]]; then
      insert_after=$((status_ln + 1))
    else
      insert_after=$((fm_end - 1))
      ((no_status_line++)) || true
    fi

    if $DRY_RUN; then
      echo "[ADD] $fname → portfolio: PF_${code} (after line $insert_after)"
    else
      sed -i '' "${insert_after}a\\
portfolio: PF_${code}
" "$file"
      echo "[DONE] $fname → portfolio: PF_${code}"
    fi
    ((processed++)) || true

  done < <(find "$dir" -name '*.md' -print0)
done

echo ""
echo "=== 결과 요약 ==="
echo "처리:                  $processed"
echo "스킵 (portfolio 존재): $skipped_portfolio"
echo "스킵 (frontmatter 없음): $skipped_no_fm"
echo "스킵 (코드네임 불일치): $skipped_no_match"
echo "다중 매칭 (스킵):      $multi_match"
echo "status 행 부재:        $no_status_line"
if $DRY_RUN; then echo -e "\n(dry-run — 파일 미변경)"; fi
