#!/bin/bash
# monkos-portal-edge 배포 — SSG 빌드 → Worker 배포 (ch5 배포 규칙 준용)
set -euo pipefail
EDGE="$(cd "$(dirname "$0")" && pwd)"
PORTAL="$(cd "$EDGE/.." && pwd)"

echo "── 1/2 specs SSG 빌드 ──"
"$PORTAL/tools/specs-ssg/build.sh"

echo "── 2/2 Worker 배포 ──"
cd "$EDGE"
npx wrangler deploy

echo "✅ monkos-portal-edge 배포 완료"
