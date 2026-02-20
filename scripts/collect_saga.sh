#!/bin/bash

# ================================
# MONK.KR Saga Collector
# 세션 대화 로그를 자동으로 수집하여 학습 데이터로 변환
# ================================

set -e

# 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 설정
TIMESTAMP=$(date +"%Y-%m-%d_%H%M%S")
SESSION_DATE=$(date +"%Y-%m-%d")
SAGA_DIR="/Users/jeong-kyushin/developer/monk_project/docs/saga"
SESSION_LOG="$SAGA_DIR/session_logs/${SESSION_DATE}_session.md"

# 디렉토리 생성
mkdir -p "$SAGA_DIR/session_logs"

echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   📝 Saga Collector                   ║
║   대화를 지식으로...                   ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"

# 세션 로그 생성
echo -e "${BLUE}📝 오늘의 세션 로그를 작성합니다...${NC}"

cat > "$SESSION_LOG" << EOF
# MONK.KR 작업 세션 로그
**날짜**: $SESSION_DATE  
**타임스탬프**: $TIMESTAMP  
**작업자**: 신정규 대표  
**협업 AI**: 용아(龍牙) & 쌍아(雙牙)

---

## 🎯 오늘의 주요 작업

### 완료된 작업
- [ ] (여기에 오늘 완료한 작업을 나열하세요)

### 논의된 전략
- [ ] (여기에 논의된 주요 전략을 요약하세요)

### 기술적 결정
- [ ] (여기에 내린 기술적 결정들을 기록하세요)

---

## 💡 학습된 인사이트

### 성공 패턴
(무엇이 잘 작동했나요?)

### 실패 및 개선점
(무엇을 다르게 해야 할까요?)

### 미래 액션 아이템
(다음에 무엇을 해야 하나요?)

---

## 🔗 관련 파일
- \`SOUL_ARCHITECTURE.md\`
- \`monk_master_context.txt\`

---

**자동 생성**: Saga Collector v1.0
EOF

echo -e "${GREEN}✅ 세션 로그 생성 완료: $SESSION_LOG${NC}"
echo -e "${BLUE}📝 이제 로그를 편집하여 오늘의 작업을 기록하세요.${NC}"

# Cursor로 파일 열기
if command -v cursor &> /dev/null; then
    cursor "$SESSION_LOG"
elif command -v code &> /dev/null; then
    code "$SESSION_LOG"
else
    echo -e "${BLUE}💡 다음 파일을 수동으로 편집하세요: $SESSION_LOG${NC}"
fi

# monk_master_context.txt에 간단한 참조 추가
MASTER_CONTEXT="/Users/jeong-kyushin/developer/monk_project/monk_master_context.txt"
if [ -f "$MASTER_CONTEXT" ]; then
    echo "" >> "$MASTER_CONTEXT"
    echo "---" >> "$MASTER_CONTEXT"
    echo "## 세션 로그 추가: $SESSION_DATE" >> "$MASTER_CONTEXT"
    echo "자세한 내용: docs/saga/session_logs/${SESSION_DATE}_session.md" >> "$MASTER_CONTEXT"
    echo "타임스탬프: $TIMESTAMP" >> "$MASTER_CONTEXT"
    echo -e "${GREEN}✅ Master Context 업데이트 완료${NC}"
fi

echo -e "${PURPLE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   ✅ 완료!                            ║
║   퇴근 전 soul_sync.sh를 실행하세요   ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"
