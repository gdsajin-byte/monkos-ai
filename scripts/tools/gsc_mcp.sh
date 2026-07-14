#!/bin/bash
# GSC MCP 서버 — 인증 우선순위 (2026-07-14 18:18 작가님·쌍아·민아 합의 확정)
#   ① Secret Manager SA 키 (GCP_SA_KEY → ~/.config/monkos-mcp/sa_key.json, 600)
#      — 시크릿 정본 단일화(광역오더 #8: SM = 유일 정본), 에이전트 자율 복원 가능, gcloud 세션 만료 무영향.
#   ② 임퍼소네이션 ADC 폴백 (~/.config/gcloud/adc_impersonated.json, yong-a-orchestrator)
#      — SM 접근 불가·키 파기 상황용. gcloud 로그인 세션 의존(만료 시 작가님 재인증 필요).
#   근거: 관리 루트 단일화 > 무키 이점 (1인 운영 일관성). 상세: 세션로그 2026-07-14 M1/민아 18:2x.
CRED_DIR="$HOME/.config/monkos-mcp"
CRED_FILE="$CRED_DIR/sa_key.json"
ADC_IMP="$HOME/.config/gcloud/adc_impersonated.json"

if [ ! -f "$CRED_FILE" ]; then
  mkdir -p "$CRED_DIR"
  TMP=$(mktemp)
  if gcloud secrets versions access latest --secret=GCP_SA_KEY --project=monkos 2>/dev/null | base64 -d > "$TMP" 2>/dev/null && [ -s "$TMP" ]; then
    mv "$TMP" "$CRED_FILE"
    chmod 600 "$CRED_FILE"
    echo "[gsc_mcp] SA 키 Secret Manager에서 복원 완료." >&2
  else
    rm -f "$TMP"
  fi
fi

if [ -s "$CRED_FILE" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
elif [ -f "$ADC_IMP" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$ADC_IMP"
  echo "[gsc_mcp] SM 키 부재 — 임퍼소네이션 ADC 폴백 사용." >&2
else
  echo "[gsc_mcp] WARN: 인증 수단 없음. gcloud 로그인 또는 SM 접근을 확인하세요." >&2
fi

exec npx -y mcp-server-gsc
