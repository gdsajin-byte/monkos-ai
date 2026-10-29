#!/bin/bash
# Google Ads API 래퍼 — credits.sh 패턴 준용
# 사용: ./scripts/ads.sh <command> [args]
# 에이전트 읽기 전용. 쓰기 API(입찰·예산)는 작가님 승인 게이트.

set -euo pipefail

PROJECT="monkos"
# Google Ads API 버전 정본 = scripts/ads_api_version (collect_keywords.js와 공유). 환경변수로 임시 재정의 가능
ADS_API_VERSION="${ADS_API_VERSION:-$(cat "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ads_api_version" 2>/dev/null || echo v24)}"
ADS_BASE="https://googleads.googleapis.com/${ADS_API_VERSION}"

# SM에서 시크릿 로드
load_secrets() {
  DEV_TOKEN=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_DEV_TOKEN --project="$PROJECT")
  CLIENT_ID=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_ID --project="$PROJECT")
  CLIENT_SECRET=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_SECRET --project="$PROJECT")
  REFRESH_TOKEN=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_REFRESH_TOKEN --project="$PROJECT")
  CUSTOMER_ID=$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CUSTOMER_ID --project="$PROJECT")
  # 클라이언트 CID (MCC 산하 광고 계정) — 환경변수 우선, SM 폴백, 없으면 빈값
  ADS_CLIENT_CID="${ADS_CLIENT_CID:-$(gcloud secrets versions access latest --secret=GOOGLE_ADS_CLIENT_CID --project="$PROJECT" 2>/dev/null || echo "")}"
}

# MCC = CUSTOMER_ID (login-customer-id 헤더용)
# 쿼리 대상 = ADS_CLIENT_CID (메트릭 조회) 또는 CUSTOMER_ID (키워드 플래너)
get_query_cid() {
  if [ -n "${ADS_CLIENT_CID:-}" ]; then
    echo "$ADS_CLIENT_CID"
  else
    echo "$CUSTOMER_ID"
  fi
}

# Access Token 발급 (Refresh Token → Access Token)
get_access_token() {
  ACCESS_TOKEN=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "refresh_token=${REFRESH_TOKEN}" \
    -d "grant_type=refresh_token" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

  if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ Access Token 발급 실패"
    exit 1
  fi
}

# Google Ads API 호출 (GAQL)
# $1=query, $2=target CID (생략 시 클라이언트 CID)
ads_query() {
  local query="$1"
  local target_cid="${2:-$(get_query_cid)}"
  # 독립 계정(MCC 미연결)은 login-customer-id를 자기 자신으로
  local login_cid="$CUSTOMER_ID"
  if [ "$target_cid" = "$ADS_CLIENT_CID" ] && [ "$ADS_CLIENT_CID" != "$CUSTOMER_ID" ]; then
    login_cid="$target_cid"
  fi
  curl -s -X POST "${ADS_BASE}/customers/${target_cid}/googleAds:searchStream" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "developer-token: ${DEV_TOKEN}" \
    -H "login-customer-id: ${login_cid}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"${query}\"}"
}

# 키워드 아이디어 조회
keyword_ideas() {
  local keywords="$1"
  local lang="${2:-1004}"    # 1004=한국어
  local country="${3:-2410}" # 2410=한국

  # 키워드를 JSON 배열로 변환
  local kw_json=$(echo "$keywords" | tr ',' '\n' | python3 -c "
import sys,json
kws = [w.strip() for w in sys.stdin if w.strip()]
print(json.dumps(kws))
")

  curl -s -X POST "${ADS_BASE}/customers/${CUSTOMER_ID}:generateKeywordIdeas" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "developer-token: ${DEV_TOKEN}" \
    -H "login-customer-id: ${CUSTOMER_ID}" \
    -H "Content-Type: application/json" \
    -d "{
      \"keywordSeed\": {\"keywords\": ${kw_json}},
      \"language\": \"languageConstants/${lang}\",
      \"geoTargetConstants\": [\"geoTargetConstants/${country}\"],
      \"keywordPlanNetwork\": \"GOOGLE_SEARCH\"
    }"
}

# --- 명령어 라우터 ---

CMD="${1:-help}"
shift 2>/dev/null || true

case "$CMD" in
  accounts)
    echo "=== MCC 산하 클라이언트 계정 목록 ==="
    load_secrets
    get_access_token
    RESULT=$(curl -s -X GET "${ADS_BASE}/customers:listAccessibleCustomers" \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "developer-token: ${DEV_TOKEN}")
    echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
names = data.get('resourceNames', [])
if not names:
    print('접근 가능한 계정 없음')
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f'접근 가능한 계정: {len(names)}건')
    for n in names:
        cid = n.replace('customers/', '')
        print(f'  {cid}')
" 2>/dev/null || echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    ;;

  test)
    echo "=== Google Ads API 연결 테스트 ==="
    load_secrets
    echo "✅ 시크릿 로드 완료"
    get_access_token
    echo "✅ Access Token 발급 완료"

    echo ""
    echo "계정 정보 조회..."
    RESULT=$(ads_query "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1" "$CUSTOMER_ID")
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    ;;

  keywords)
    # 사용: ./scripts/ads.sh keywords "증명사진,여권사진" [lang_id] [country_id]
    KEYWORDS="${1:-증명사진}"
    LANG_ID="${2:-1004}"
    COUNTRY_ID="${3:-2410}"

    load_secrets
    get_access_token

    echo "=== 키워드 아이디어: ${KEYWORDS} ==="
    RESULT=$(keyword_ideas "$KEYWORDS" "$LANG_ID" "$COUNTRY_ID")
    echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('results', [])
if not results:
    print('결과 없음')
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f'총 {len(results)}건')
    print(f'{\"키워드\":<30} {\"월검색량\":>10} {\"경쟁도\":>8} {\"CPC(저)\":>10} {\"CPC(고)\":>10}')
    print('-' * 75)
    for r in results[:30]:
        m = r.get('keywordIdeaMetrics', {})
        kw = r.get('text', '?')
        vol = m.get('avgMonthlySearches', '?')
        comp = m.get('competition', '?')
        lo = m.get('lowTopOfPageBidMicros', 0)
        hi = m.get('highTopOfPageBidMicros', 0)
        lo_won = int(lo) // 1000000 if lo else 0
        hi_won = int(hi) // 1000000 if hi else 0
        print(f'{kw:<30} {str(vol):>10} {comp:>8} {lo_won:>8}원 {hi_won:>8}원')
" 2>/dev/null || echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    ;;

  campaigns)
    load_secrets
    get_access_token
    echo "=== 캠페인 목록 ==="
    RESULT=$(ads_query "SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign ORDER BY campaign.id")
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    ;;

  search-terms)
    load_secrets
    get_access_token
    echo "=== 검색어 보고서 (30일) ==="
    RESULT=$(ads_query "SELECT search_term_view.search_term, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.impressions DESC LIMIT 50")
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
    ;;

  help|*)
    echo "사용법: ./scripts/ads.sh <command>"
    echo ""
    echo "  accounts      MCC 산하 클라이언트 계정 목록"
    echo "  test          연결 테스트 (계정 정보 조회)"
    echo "  keywords      키워드 아이디어 조회 (MCC 레벨)"
    echo "                예: ./scripts/ads.sh keywords \"증명사진,여권사진\""
    echo "                예: ./scripts/ads.sh keywords \"passport photo\" 1000 2840  (영어, 미국)"
    echo "  campaigns     캠페인 목록 (클라이언트 CID)"
    echo "  search-terms  검색어 보고서 30일 (클라이언트 CID)"
    echo ""
    echo "읽기 전용. 쓰기 API는 미구현 (작가님 승인 게이트 필요)."
    ;;
esac
