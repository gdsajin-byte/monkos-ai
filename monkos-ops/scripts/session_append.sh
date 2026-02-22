#!/bin/bash
# session_append.sh - 세션 로그에 타임스탬프 자동 삽입
# 
# 사용법:
#   ./scripts/session_append.sh "작업 내용"
#   ./scripts/session_append.sh -q "질문 내용"     # Q번호 자동 증가
#   ./scripts/session_append.sh -a "응답 내용"     # A번호 자동 증가
#   ./scripts/session_append.sh -h "## 섹션 제목"  # 헤더로 추가
#   ./scripts/session_append.sh --init             # 오늘 세션 파일 초기화
#
# 2026-01-19 쌍아 작성

set -e

# 설정
SESSIONS_DIR="docs/corpus/sessions"
TODAY=$(date "+%Y-%m-%d")
YEAR_MONTH=$(date "+%Y-%m")
TIMESTAMP=$(date "+%H:%M")
FILENAME="${TODAY//-/}_session.md"
FILEPATH="${SESSIONS_DIR}/${YEAR_MONTH}/${FILENAME}"

# 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 디렉토리 확인 및 생성
ensure_dir() {
    if [ ! -d "${SESSIONS_DIR}/${YEAR_MONTH}" ]; then
        mkdir -p "${SESSIONS_DIR}/${YEAR_MONTH}"
        echo -e "${BLUE}📁 폴더 생성: ${SESSIONS_DIR}/${YEAR_MONTH}${NC}"
    fi
}

# 함수: Q/A 번호 가져오기
get_next_number() {
    local prefix=$1
    if [ ! -f "$FILEPATH" ]; then
        echo "1"
        return
    fi
    local last_num=$(grep -oE "${prefix}[0-9]+" "$FILEPATH" | tail -1 | grep -oE "[0-9]+")
    if [ -z "$last_num" ]; then
        echo "1"
    else
        echo $((last_num + 1))
    fi
}

# 함수: 세션 파일 초기화
init_session() {
    ensure_dir
    
    if [ -f "$FILEPATH" ]; then
        echo -e "${YELLOW}⚠️  파일 이미 존재: $FILEPATH${NC}"
        read -p "덮어쓰시겠습니까? (y/N): " confirm
        if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
            echo "취소됨"
            exit 0
        fi
    fi
    
    # 위치 선택
    echo "위치를 선택하세요:"
    echo "1) 사무실 (iMac)"
    echo "2) 집 (Mac Mini)"
    echo "3) 원격 (MacBook)"
    read -p "선택 (1-3): " loc_choice
    
    case $loc_choice in
        1) LOCATION="사무실 (iMac)" ;;
        2) LOCATION="집 (Mac Mini)" ;;
        3) LOCATION="원격 (MacBook)" ;;
        *) LOCATION="사무실 (iMac)" ;;
    esac
    
    # 작업 주제
    read -p "오늘 주요 작업: " WORK_TOPIC
    
    cat > "$FILEPATH" << EOF
# Daily Session Log - ${TODAY}

**세션**: ${LOCATION}
**시작**: ${TODAY} ${TIMESTAMP}
**종료**: (진행 중)
**작업**: ${WORK_TOPIC}

---

## [${TIMESTAMP}] 세션 시작

EOF
    
    echo -e "${GREEN}✅ 세션 파일 생성: $FILEPATH${NC}"
}

# 함수: 내용 추가
append_content() {
    local content=$1
    local mode=$2
    
    ensure_dir
    
    if [ ! -f "$FILEPATH" ]; then
        echo -e "${YELLOW}⚠️  세션 파일 없음. --init로 먼저 생성하세요.${NC}"
        exit 1
    fi
    
    case $mode in
        "q")
            local num=$(get_next_number "Q")
            echo -e "\n### Q${num}: ${content}" >> "$FILEPATH"
            echo -e "${GREEN}✅ [${TIMESTAMP}] Q${num} 추가${NC}"
            ;;
        "a")
            local num=$(get_next_number "A")
            echo -e "**A${num}**: ${content}\n" >> "$FILEPATH"
            echo -e "${GREEN}✅ [${TIMESTAMP}] A${num} 추가${NC}"
            ;;
        "h")
            echo -e "\n## [${TIMESTAMP}] ${content}\n" >> "$FILEPATH"
            echo -e "${GREEN}✅ [${TIMESTAMP}] 헤더 추가${NC}"
            ;;
        *)
            echo -e "\n- [${TIMESTAMP}] ${content}" >> "$FILEPATH"
            echo -e "${GREEN}✅ [${TIMESTAMP}] 항목 추가${NC}"
            ;;
    esac
}

# 함수: 현재 시간만 출력 (AI용)
print_timestamp() {
    echo "${TIMESTAMP}"
}

# 함수: 사용법 출력
show_help() {
    echo "세션 로그 자동화 스크립트"
    echo ""
    echo "사용법:"
    echo "  $0 \"내용\"              일반 항목 추가"
    echo "  $0 -q \"질문\"           Q번호 자동 증가"
    echo "  $0 -a \"응답\"           A번호 자동 증가"
    echo "  $0 -h \"섹션 제목\"      타임스탬프 헤더"
    echo "  $0 --init              오늘 세션 초기화"
    echo "  $0 --time              현재 시간만 출력"
    echo "  $0 --file              현재 세션 파일 경로"
    echo ""
    echo "예시:"
    echo "  $0 --init"
    echo "  $0 -h \"Git 상태 점검\""
    echo "  $0 -q \"현재 깃상태보고\""
    echo "  $0 -a \"main 브랜치, 2커밋 ahead\""
}

# 메인
case "${1:-}" in
    --init)
        init_session
        ;;
    --time|-t)
        print_timestamp
        ;;
    --file|-f)
        echo "$FILEPATH"
        ;;
    --help)
        show_help
        ;;
    -q)
        append_content "$2" "q"
        ;;
    -a)
        append_content "$2" "a"
        ;;
    -h)
        append_content "$2" "h"
        ;;
    "")
        show_help
        ;;
    *)
        append_content "$1" "default"
        ;;
esac
