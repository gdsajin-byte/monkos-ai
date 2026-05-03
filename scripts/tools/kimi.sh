#!/bin/bash
# Kimi API 대화 모드 (OpenAI 호환)
# Usage: mk-k (대화 모드) / mk-k "프롬프트" (단발 질의)

source ~/developer/monk_project/.env
API_KEY="${KIMI_API_KEY}"
API_URL="https://api.moonshot.ai/v1/chat/completions"
MODEL="kimi-k2.6"
SYSTEM="너는 Moonshot AI의 Kimi다. 한국어로 답하라."

if [ -z "$API_KEY" ]; then
  echo "❌ KIMI_API_KEY가 .env에 없습니다"
  exit 1
fi

if [ -n "$1" ]; then
  # 단발 질의 모드
  curl -s "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"$MODEL\",
      \"messages\": [{\"role\": \"system\", \"content\": \"$SYSTEM\"},{\"role\": \"user\", \"content\": \"$1\"}],
      \"stream\": false
    }" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('choices',[{}])[0].get('message',{}).get('content','') if 'choices' in r else r)"
else
  # 대화 모드
  echo "🌙 Kimi ($MODEL) 대화 모드 — 'q'로 종료"
  echo "---"
  while true; do
    printf "\n작가님> "
    read -r input
    [ "$input" = "q" ] && echo "종료." && break
    [ -z "$input" ] && continue
    
    response=$(curl -s "$API_URL" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{\"role\": \"system\", \"content\": \"$SYSTEM\"},{\"role\": \"user\", \"content\": \"$input\"}],
        \"stream\": false
      }" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('choices',[{}])[0].get('message',{}).get('content','') if 'choices' in r else r)")
    
    echo ""
    echo "$response"
  done
fi
