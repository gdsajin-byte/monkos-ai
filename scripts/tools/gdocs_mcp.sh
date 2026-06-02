#!/bin/bash
# Google Docs MCP 서버 — Secret Manager에서 인증 정보 주입
export GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret=MCP_GDOCS_CLIENT_ID --project=monkos 2>/dev/null)
export GOOGLE_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=MCP_GDOCS_CLIENT_SECRET --project=monkos 2>/dev/null)
export TOKEN_PATH="$HOME/.config/mcp-google-docs/token.json"

# token.json이 없으면 GCP Secret Manager에서 복원 (디바이스 간 토큰 중앙화)
# 정본 토큰은 iMac에서 1회 인증 → MCP_GDOCS_TOKEN으로 등록됨. 타 디바이스는 무인증 복원.
if [ ! -f "$TOKEN_PATH" ]; then
  mkdir -p "$(dirname "$TOKEN_PATH")"
  TMP=$(mktemp)
  if gcloud secrets versions access latest --secret=MCP_GDOCS_TOKEN --project=monkos > "$TMP" 2>/dev/null && [ -s "$TMP" ]; then
    mv "$TMP" "$TOKEN_PATH"
    chmod 600 "$TOKEN_PATH"
    echo "[gdocs_mcp] token.json GCP Secret Manager에서 복원 완료." >&2
  else
    rm -f "$TMP"
    echo "[gdocs_mcp] WARN: token.json 부재 + GCP 복원 실패. gdocs MCP 1회 인증이 필요합니다." >&2
  fi
fi

exec npx -y @suncreation/mcp-google-docs
