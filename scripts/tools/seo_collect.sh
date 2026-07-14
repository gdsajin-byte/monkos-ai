#!/bin/bash
# SEO 데이터 수집 통합 래퍼 — SM 키 주입 + seo_collectors.py 실행

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# GCP SA 키 (GA4/GSC용) — ga4_mcp.sh 패턴 준용
CRED_DIR="$HOME/.config/monkos-mcp"
CRED_FILE="$CRED_DIR/sa_key.json"

if [ ! -f "$CRED_FILE" ]; then
  mkdir -p "$CRED_DIR"
  TMP=$(mktemp)
  if gcloud secrets versions access latest --secret=GCP_SA_KEY --project=monkos 2>/dev/null | base64 -d > "$TMP" 2>/dev/null && [ -s "$TMP" ]; then
    mv "$TMP" "$CRED_FILE"
    chmod 600 "$CRED_FILE"
    echo "[seo_collect] SA 키 Secret Manager에서 복원 완료." >&2
  else
    rm -f "$TMP"
    echo "[seo_collect] WARN: SA 키 복원 실패." >&2
  fi
fi

if [ -s "$CRED_FILE" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
  export GCP_SA_KEY=$(base64 < "$CRED_FILE" 2>/dev/null)
fi

export GA4_PROPERTY_ID="521406894"
export GSC_SITE_URL="sc-domain:monkos.ai"

# 네이버 검색광고 키
export NAVER_SEARCHAD_API_KEY=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_API_KEY --project=monkos 2>/dev/null)
export NAVER_SEARCHAD_SECRET_KEY=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_SECRET_KEY --project=monkos 2>/dev/null)
export NAVER_SEARCHAD_CUSTOMER_ID=$(gcloud secrets versions access latest --secret=NAVER_SEARCHAD_CUSTOMER_ID --project=monkos 2>/dev/null)

# 네이버 DataLab 키
export NAVER_DATALAB_CLIENT_ID=$(gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_ID --project=monkos 2>/dev/null)
export NAVER_DATALAB_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_SECRET --project=monkos 2>/dev/null)

# Bing WMT 키
export BING_WMT_API_KEY=$(gcloud secrets versions access latest --secret=BING_WMT_API_KEY --project=monkos 2>/dev/null)

# PageSpeed (GEMINI_API_KEY 겸용)
export PAGESPEED_API_KEY=$(gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=monkos 2>/dev/null)

python3 "$SCRIPT_DIR/seo_collectors.py" "${@:-all}"
