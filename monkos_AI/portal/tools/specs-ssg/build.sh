#!/bin/bash
# specs SSG 빌드 래퍼 — .env 주입 + 버전 스탬프
set -euo pipefail
PORTAL="$(cd "$(dirname "$0")/../.." && pwd)"

# .env에서 비밀 아닌 설정값만 로드 (PROJECT_ID, GCS_BUCKET — ch4 시크릿 운용 원칙)
set -a
source "$PORTAL/.env"
set +a

# 캐시 버스트 버전: git rev + 날짜 (Cloud Run K_REVISION 대체)
export K_REVISION="ssg-$(git -C "$PORTAL" rev-parse --short HEAD)-$(date +%Y%m%d%H%M)"

# 렌더 분기 env — prod deploy.sh와 동기 필수 (정본: deploy.sh:81. 불일치 시 정적본이 prod와 다른 HTML을 냄)
export PILOT_T1_RETOUCH="1"

node "$PORTAL/tools/specs-ssg/build.mjs"
