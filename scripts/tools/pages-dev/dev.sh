#!/bin/bash
# monk.kr Pages Functions 로컬 개발 서버 (2026-10-22 민아)
# 왜 복사본인가: `wrangler pages dev`는 출력 폴더의 실경로에서 위로 올라가 루트 wrangler.toml([ai] 바인딩)을 집어
#   원격 프리뷰 세션을 요구하고, --config 경로도 Pages는 지원하지 않는다(실측 08:57·08:58). 그래서 레포 밖 임시 폴더에
#   MONK_kr·functions를 복사하고 이 폴더의 wrangler.toml(AI 제외)·.dev.vars로 기동한다.
# 소스를 고치면 다시 실행한다(복사본이라 자동 반영 없음). 시크릿은 .dev.vars(secret 래퍼로 생성, gitignore).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../.." && pwd)
HERE="$ROOT/scripts/tools/pages-dev"
DEV="${MONK_PAGES_DEV_DIR:-${TMPDIR:-/tmp}/monk-pages-dev}"
mkdir -p "$DEV"
rsync -a --delete --exclude node_modules --exclude '_functions_backup_*' --exclude cloudflare-workers "$ROOT/MONK_kr/" "$DEV/MONK_kr/"
rsync -a --delete "$ROOT/functions/" "$DEV/functions/"
cp "$HERE/wrangler.toml" "$DEV/wrangler.toml"
if [ -f "$HERE/.dev.vars" ]; then cp "$HERE/.dev.vars" "$DEV/.dev.vars"; chmod 600 "$DEV/.dev.vars"; else echo "⚠️ $HERE/.dev.vars 없음 — 시크릿 바인딩 없이 기동 (주문·결제 함수는 500)" >&2; fi
echo "▶ pages dev: $DEV (복사본) · port ${PORT:-8788}"
cd "$DEV" && exec "$ROOT/node_modules/.bin/wrangler" pages dev MONK_kr --port "${PORT:-8788}" "$@"
