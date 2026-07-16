#!/bin/bash
# GA4 MCP 서버 — Secret Manager에서 SA 키 주입 (iMac 경로 종속 해소)
CRED_DIR="$HOME/.config/monkos-mcp"
CRED_FILE="$CRED_DIR/sa_key.json"

if [ ! -f "$CRED_FILE" ]; then
  mkdir -p "$CRED_DIR"
  TMP=$(mktemp)
  RAW=$(gcloud secrets versions access latest --secret=GCP_SA_KEY --project=monkos 2>/dev/null)
  case "$RAW" in
    \{*) printf '%s' "$RAW" > "$TMP" ;;                              # SM 정본 plain JSON (2026-07-16 실측)
    ?*)  printf '%s' "$RAW" | base64 -d > "$TMP" 2>/dev/null ;;      # base64 저장분 하위호환
  esac
  unset RAW
  if [ -s "$TMP" ]; then
    mv "$TMP" "$CRED_FILE"
    chmod 600 "$CRED_FILE"
    echo "[ga4_mcp] SA 키 GCP Secret Manager에서 복원 완료." >&2
  else
    rm -f "$TMP"
    echo "[ga4_mcp] WARN: SA 키 복원 실패. gcloud 인증 상태를 확인하세요." >&2
  fi
fi

export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
exec uvx analytics-mcp
