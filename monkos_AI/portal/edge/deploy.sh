#!/bin/bash
# monkos-portal-edge 배포 — SSG 빌드 → Worker 배포 (ch5 배포 규칙 준용)
set -euo pipefail
EDGE="$(cd "$(dirname "$0")" && pwd)"
PORTAL="$(cd "$EDGE/.." && pwd)"

echo "── 1/2 specs SSG 빌드 ──"
"$PORTAL/tools/specs-ssg/build.sh"

echo "── 2/3 Worker 배포 ──"
cd "$EDGE"
npx wrangler deploy

# ─── 3/3 배포 후 스모크 (2026-08-25 신설 — 도구 맵 3요건: 실작동 검증 + 실패 가시화) ───
# 배포 직후 콜로별 버전 전파 스큐가 있어(08-24 실측) 실패 시 재시도한다.
echo "── 3/3 스모크 검증 ──"
M="https://monkos.ai"
smoke() { # $1=설명 $2=검사식 (재시도 3회, 간격 10s)
  for i in 1 2 3; do
    if eval "$2"; then echo "  ✓ $1"; return 0; fi
    [ "$i" -lt 3 ] && sleep 10
  done
  echo "  ✗ 스모크 실패: $1" >&2; return 1
}
FAIL=0
smoke "specs 정적 200" \
  '[ "$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 $M/specs/passport/kr)" = "200" ]' || FAIL=1
smoke "CMS 엣지 캐시 헤더" \
  'curl -s -D- -o /dev/null --max-time 15 $M/blog | grep -qi "x-edge-cache"' || FAIL=1
smoke "sid 발급 (정적 경로)" \
  'curl -s -D- -o /dev/null --max-time 15 $M/specs/passport/kr | grep -qi "set-cookie: monkos_sid"' || FAIL=1
smoke "빌드 신선도 (배포 매니페스트 = 로컬 dist)" \
  '[ -f "$EDGE/../tools/specs-ssg/dist/build-manifest.json" ] && curl -s --max-time 15 $M/build-manifest.json | grep -q "$(grep -o "\"gitRev\": *\"[^\"]*\"" "$EDGE/../tools/specs-ssg/dist/build-manifest.json" | head -1 | sed "s/.*: *\"//;s/\"//")"' || FAIL=1
if [ "$FAIL" -ne 0 ]; then
  echo "❌ 스모크 실패 — 배포는 완료됐으나 실서빙 검증 미통과. 즉시 확인 필요 (무음 강등 금지)" >&2
  exit 1
fi
echo "✅ monkos-portal-edge 배포 + 스모크 4/4 완료"
