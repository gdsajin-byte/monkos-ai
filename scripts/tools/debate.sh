#!/bin/bash
# MONK 에이전트 토론 엔진 — POC v1
#
# 사용법:
#   터미널1 (쌍아):  ./scripts/tools/debate.sh "내일 투두 우선순위" 쌍아 민아 3
#   터미널2 (민아):  ./scripts/tools/debate.sh "내일 투두 우선순위" 민아 쌍아 3
#
#   인자: $1=주제, $2=내 이름, $3=상대 이름, $4=라운드 수 (기본 3)
#
# 토론 룰:
#   - 라운드마다 각자 1회 발언
#   - 상대 발언을 읽고 반론/보충
#   - 근거 없는 동의 금지
#   - 마지막 라운드에서 합의점/미결 정리
#
# 토론 파일: /tmp/debate/room_{주제해시}.md

TOPIC="$1"
MY_NAME="$2"
OPPONENT="$3"
MAX_ROUNDS="${4:-3}"

if [ -z "$TOPIC" ] || [ -z "$MY_NAME" ] || [ -z "$OPPONENT" ]; then
  echo "사용법: debate.sh <주제> <내이름> <상대이름> [라운드수]"
  exit 1
fi

ROOM_HASH=$(echo "$TOPIC" | md5 -q 2>/dev/null || echo "$TOPIC" | md5sum | cut -d' ' -f1)
ROOM_FILE="/tmp/debate/room_${ROOM_HASH}.md"

# 방 초기화 (첫 진입자만)
if [ ! -f "$ROOM_FILE" ]; then
  cat > "$ROOM_FILE" << INIT
---
topic: "${TOPIC}"
participants: [${MY_NAME}, ${OPPONENT}]
max_rounds: ${MAX_ROUNDS}
created: $(date '+%Y-%m-%d %H:%M KST')
status: waiting
---

# 토론: ${TOPIC}

## 룰
- 라운드마다 각자 1회 발언
- 상대 발언을 인용 후 반론/보충 (근거 필수)
- 근거 없는 동의 금지
- 최종 라운드: 합의점 + 미결 사항 정리

---

INIT
  echo "토론방 생성: $ROOM_FILE"
  echo "주제: $TOPIC"
  echo "참여자: $MY_NAME vs $OPPONENT"
  echo "라운드: $MAX_ROUNDS"
  echo ""
  echo "상대방도 같은 명령으로 참여해야 합니다."
else
  echo "토론방 참여: $ROOM_FILE"
fi

echo ""
echo "=== 토론 프로토콜 ==="
echo ""
echo "이 에이전트의 이름: $MY_NAME"
echo "상대: $OPPONENT"
echo "라운드: $MAX_ROUNDS"
echo ""
echo "토론 파일을 읽고, 자기 턴이면 발언을 append하세요."
echo ""
echo "발언 형식:"
echo "## [Round N] ${MY_NAME}"
echo "(발언 내용)"
echo ""
echo "턴 판별: 파일의 마지막 ## 헤더가 상대 이름이면 내 턴."
echo "         마지막 ## 헤더가 내 이름이면 상대 턴 (대기)."
echo "         ## 헤더가 없으면 (첫 발언) 알파벳순 먼저."
echo ""
echo "토론 파일 경로: $ROOM_FILE"
echo ""
echo "에이전트에게 아래 프롬프트를 전달하세요:"
echo "========================================"
echo ""
cat << PROMPT
토론에 참여합니다.

토론 파일: $ROOM_FILE
내 이름: $MY_NAME
상대: $OPPONENT
주제: $TOPIC
총 라운드: $MAX_ROUNDS

프로토콜:
1. 토론 파일을 읽어서 현재 상태를 파악
2. 마지막 발언이 상대 것이면 → 내 턴. 반론/보충을 작성하여 파일에 append
3. 마지막 발언이 내 것이면 → 상대 턴. 10초 대기 후 다시 확인
4. 발언이 없으면 → 이름 알파벳순으로 먼저 발언 (${MY_NAME} vs ${OPPONENT})
5. 발언 형식: "## [Round N] ${MY_NAME}" + 본문 (2~5문장)
6. 상대 주장을 인용한 뒤 반론. 근거 없는 동의 금지
7. 최종 라운드: 합의점 + 미결 사항 정리
8. 총 ${MAX_ROUNDS} 라운드 후 종료

시작하세요.
PROMPT
echo ""
echo "========================================"
