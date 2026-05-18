#!/bin/bash
# Google Docs MCP 서버 — Secret Manager에서 인증 정보 주입
export GOOGLE_CLIENT_ID=$(gcloud secrets versions access latest --secret=MCP_GDOCS_CLIENT_ID --project=monkos 2>/dev/null)
export GOOGLE_CLIENT_SECRET=$(gcloud secrets versions access latest --secret=MCP_GDOCS_CLIENT_SECRET --project=monkos 2>/dev/null)
export TOKEN_PATH="$HOME/.config/mcp-google-docs/token.json"
exec npx -y @suncreation/mcp-google-docs
