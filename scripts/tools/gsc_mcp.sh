#!/bin/bash
# GSC MCP 서버 — 인증 우선순위 (2026-07-14 수렴: ORDER GSCMCP픽스 × MCP정규화 두 트랙 통합)
#   ① 임퍼소네이션 ADC (~/.config/gcloud/adc_impersonated.json, yong-a-orchestrator)
#      — 개인키 파일 무존재·단기 토큰. M1·iMac 양쪽 실존. 광역오더 #8 "새 키 발급 제로" 정합.
#   ② Secret Manager SA 키 폴백 (GCP_SA_KEY → ~/.config/monkos-mcp/sa_key.json)
#      — ①부재 환경(웹 컨테이너 등)용.
ADC_IMP="$HOME/.config/gcloud/adc_impersonated.json"

if [ -f "$ADC_IMP" ]; then
  export GOOGLE_APPLICATION_CREDENTIALS="$ADC_IMP"
  echo "[gsc_mcp] 임퍼소네이션 ADC 사용 (키 파일 없음)." >&2
else
  CRED_DIR="$HOME/.config/monkos-mcp"
  CRED_FILE="$CRED_DIR/sa_key.json"
  if [ ! -f "$CRED_FILE" ]; then
    mkdir -p "$CRED_DIR"
    TMP=$(mktemp)
    if gcloud secrets versions access latest --secret=GCP_SA_KEY --project=monkos 2>/dev/null | base64 -d > "$TMP" 2>/dev/null && [ -s "$TMP" ]; then
      mv "$TMP" "$CRED_FILE"
      chmod 600 "$CRED_FILE"
      echo "[gsc_mcp] SA 키 GCP Secret Manager에서 복원 완료 (폴백 경로)." >&2
    else
      rm -f "$TMP"
      echo "[gsc_mcp] WARN: SA 키 복원 실패. gcloud 인증 상태를 확인하세요." >&2
    fi
  fi
  export GOOGLE_APPLICATION_CREDENTIALS="$CRED_FILE"
fi

exec npx -y mcp-server-gsc
