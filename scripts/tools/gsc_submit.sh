#!/bin/bash
# GSC 사이트맵 제출/상태 CLI — 소유자 SA 임퍼소네이션 경유 (2026-07-24 신설)
#
# 배경: GSC MCP(yong-a-orchestrator SA)는 GSC '전체 사용자'라 읽기 전용 —
#       sitemaps.submit은 소유자 전용 API. 소유자 SA(monk-image-engine, 2026-06-07 등록)를
#       임퍼소네이션해 쓰기만 이 도구로 수행한다. (수동 UI 배제 — 2026-07-24 작가님 지시)
# 권한: 호출자(gdsajin ADC)에 monk-image-engine tokenCreator 부여됨 (2026-07-24, SECRET_INVENTORY SA 섹션).
#
# 사용:
#   scripts/tools/gsc_submit.sh submit <sitemap-url>     # 제출 (기본 사이트: sc-domain:monkos.ai)
#   scripts/tools/gsc_submit.sh status <sitemap-url>     # 제출 상태·에러·색인 수
#   scripts/tools/gsc_submit.sh list                     # 등록 사이트맵 목록
set -euo pipefail

SITE="sc-domain:monkos.ai"
SA="monk-image-engine@monkos.iam.gserviceaccount.com"
API="https://www.googleapis.com/webmasters/v3/sites"
CMD="${1:-}"; URL="${2:-}"

die() { echo "[gsc_submit] 실패: $*" >&2; exit 1; }

TOKEN=$(gcloud auth print-access-token \
  --impersonate-service-account="$SA" \
  --scopes=https://www.googleapis.com/auth/webmasters 2>/dev/null) \
  || die "임퍼소네이션 토큰 발급 불가 — gcloud 로그인 상태와 $SA tokenCreator 권한을 확인하라"

enc() { python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$1"; }
SITE_ENC=$(enc "$SITE")

case "$CMD" in
  submit)
    [ -n "$URL" ] || die "사이트맵 URL 필요"
    CODE=$(curl -s -X PUT -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}" \
      "$API/$SITE_ENC/sitemaps/$(enc "$URL")")
    [ "$CODE" = "204" ] || die "제출 HTTP $CODE (204 아님)"
    echo "[gsc_submit] 제출 완료(204): $URL"
    curl -s -H "Authorization: Bearer $TOKEN" "$API/$SITE_ENC/sitemaps/$(enc "$URL")" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print('  lastSubmitted:', d.get('lastSubmitted'), '| isPending:', d.get('isPending'))"
    ;;
  status)
    [ -n "$URL" ] || die "사이트맵 URL 필요"
    curl -s -H "Authorization: Bearer $TOKEN" "$API/$SITE_ENC/sitemaps/$(enc "$URL")" | python3 -m json.tool
    ;;
  list)
    curl -s -H "Authorization: Bearer $TOKEN" "$API/$SITE_ENC/sitemaps" \
      | python3 -c "import json,sys; [print(s['path'], '|', s.get('lastSubmitted','-'), '| pending:', s.get('isPending')) for s in json.load(sys.stdin).get('sitemap',[])]"
    ;;
  *)
    die "사용법: gsc_submit.sh {submit|status|list} [sitemap-url]"
    ;;
esac
