#!/bin/bash
# Cloudflare MCP 래퍼 — wrangler OAuth 세션 활용
# D1/R2/KV/Workers/Pages 등 Cloudflare 리소스 자연어 관리
# 사전 요구: npx wrangler login (브라우저 OAuth)

# Account ID: 환경변수 우선, 없으면 wrangler에서 동적 취득
ACCOUNT_ID="${CF_ACCOUNT_ID:-$(npx -y wrangler whoami 2>/dev/null | grep -o '[a-f0-9]\{32\}' | head -1)}"

if [ -z "$ACCOUNT_ID" ]; then
  echo "ERROR: Cloudflare Account ID를 취득할 수 없습니다." >&2
  echo "npx wrangler login 실행 후 재시도하세요." >&2
  exit 1
fi

exec npx -y @cloudflare/mcp-server-cloudflare run "$ACCOUNT_ID" "$@"
