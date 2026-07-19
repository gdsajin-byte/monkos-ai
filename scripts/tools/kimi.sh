#!/bin/bash
# Kimi API 대화 모드 (OpenAI 호환) + 턴당 사용량/비용/잔액 표시
# Usage: mk-k (대화 모드) / mk-k "프롬프트" (단발 질의)
# macOS 기본 bash(3.2) 호환: 연관 배열 대신 Python에서 가격/비용 처리

source ~/developer/monk_project/.env
API_KEY="${KIMI_API_KEY}"
API_URL="https://api.moonshot.ai/v1/chat/completions"
BALANCE_URL="https://api.moonshot.ai/v1/users/me/balance"
MODEL="kimi-k3"
SYSTEM="너는 Moonshot AI의 Kimi다. 한국어로 답하라."

if [ -z "$API_KEY" ]; then
  echo "❌ KIMI_API_KEY가 .env에 없습니다"
  exit 1
fi

# Python 헬퍼: API 응답 파싱 + 비용 계산
# stdin: Kimi chat/completions JSON
# stdout: content\n---USAGE---\nJSON {prompt, completion, total, cost, in_price, out_price}
parse_response() {
  python3 -c "
import sys, json
MODEL = '$MODEL'
PRICES = {
  'kimi-k3':              {'in': 3.00, 'out': 15.00},
  'kimi-k2.7-code':       {'in': 0.95, 'out': 4.00},
  'kimi-k2.7-code-highspeed': {'in': 1.90, 'out': 8.00},
  'kimi-k2.6':            {'in': 0.95, 'out': 4.00},
  'kimi-k2.5':            {'in': 0.60, 'out': 3.00},
}
r = json.load(sys.stdin)
if 'error' in r:
    print('ERROR:', r.get('error', {}).get('message', str(r)))
    sys.exit(1)
content = r.get('choices', [{}])[0].get('message', {}).get('content', '')
usage = r.get('usage', {})
prompt = usage.get('prompt_tokens', 0)
completion = usage.get('completion_tokens', 0)
total = usage.get('total_tokens', 0)
p = PRICES.get(MODEL, {'in': 0, 'out': 0})
cost = (prompt * p['in'] + completion * p['out']) / 1_000_000
print(content)
print('---USAGE---')
print(json.dumps({
  'prompt': prompt,
  'completion': completion,
  'total': total,
  'cost': round(cost, 6),
  'in_price': p['in'],
  'out_price': p['out']
}, ensure_ascii=False))
"
}

# 잔액 조회
get_balance() {
  curl -s "$BALANCE_URL" \
    -H "Authorization: Bearer $API_KEY" 2>/dev/null | \
    python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('data',{}).get('available_balance',''))" 2>/dev/null
}

# 사용량/비용/잔액 출력
print_usage() {
  local usage_json="$1"
  local balance="$2"
  local prompt_tokens completion_tokens total_tokens cost in_price out_price
  prompt_tokens=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['prompt'])")
  completion_tokens=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['completion'])")
  total_tokens=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])")
  cost=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['cost'])")
  in_price=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['in_price'])")
  out_price=$(echo "$usage_json" | python3 -c "import sys,json; print(json.load(sys.stdin)['out_price'])")

  echo ""
  echo "📊 사용량 | 입력 ${prompt_tokens} tokens / 출력 ${completion_tokens} tokens / 합계 ${total_tokens} tokens"
  echo "💸 예상 비용 | \$${cost} (Cache Miss 기준, ${MODEL}: in \$${in_price}/1M, out \$${out_price}/1M)"
  if [ -n "$balance" ]; then
    echo "💳 남은 잔액 | \$${balance}"
  fi
}

# 단발 질의 모드
if [ -n "$1" ]; then
  balance=$(get_balance)
  result=$(curl -s "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"$MODEL\",
      \"messages\": [{\"role\": \"system\", \"content\": \"$SYSTEM\"},{\"role\": \"user\", \"content\": \"$1\"}],
      \"stream\": false
    }" | parse_response)
  content=$(echo "$result" | sed -n '1,/^---USAGE---$/p' | sed '$d')
  usage=$(echo "$result" | sed -n '/^---USAGE---$/,$p' | tail -n +2)
  echo "$content"
  print_usage "$usage" "$balance"
  exit 0
fi

# 대화 모드
echo "🌙 Kimi ($MODEL) 대화 모드 — 'q'로 종료"
echo "   매 턴 입력/출력 토큰, 예상 비용, 잔액을 표시합니다."
echo "---"
while true; do
  printf "\n작가님> "
  read -r input
  [ "$input" = "q" ] && echo "종료." && break
  [ -z "$input" ] && continue

  balance=$(get_balance)
  result=$(curl -s "$API_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"$MODEL\",
      \"messages\": [{\"role\": \"system\", \"content\": \"$SYSTEM\"},{\"role\": \"user\", \"content\": \"$input\"}],
      \"stream\": false
    }" | parse_response)
  content=$(echo "$result" | sed -n '1,/^---USAGE---$/p' | sed '$d')
  usage=$(echo "$result" | sed -n '/^---USAGE---$/,$p' | tail -n +2)

  echo ""
  echo "$content"
  print_usage "$usage" "$balance"
done
