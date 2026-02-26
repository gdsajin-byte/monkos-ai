#!/bin/bash

# ============================================
# 체크포인트 로깅 스크립트
# ============================================
#
# 용도: 야간 작업 진행 상황 자동 로깅
#
# 사용법:
#   source scripts/log_checkpoint.sh
#   log_start "Phase 1: Firebase 셋업"
#   log_success "Firebase CLI 설치 완료"
#   log_end "Phase 1 완료"
#
# ============================================

LOG_FILE="checkpoint.log"

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

# 타임스탬프 생성 함수
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# START 로그
log_start() {
    local message="$1"
    echo "[$(get_timestamp)] START - $message" >> "$LOG_FILE"
    echo "[START] $message"
}

# SUCCESS 로그
log_success() {
    local message="$1"
    echo "[$(get_timestamp)] SUCCESS - $message" >> "$LOG_FILE"
    echo "[✓] $message"
}

# SKIP 로그
log_skip() {
    local message="$1"
    local reason="${2:-No reason provided}"
    echo "[$(get_timestamp)] SKIP - $message (Reason: $reason)" >> "$LOG_FILE"
    echo "[⊘] SKIP: $message ($reason)"
}

# ERROR 로그
log_error() {
    local message="$1"
    local error="${2:-Unknown error}"
    echo "[$(get_timestamp)] ERROR - $message (Error: $error)" >> "$LOG_FILE"
    echo "[✗] ERROR: $message ($error)"
}

# END 로그
log_end() {
    local message="$1"
    echo "[$(get_timestamp)] END - $message" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
    echo "[END] $message"
    echo "---"
}

# 세션 시작
log_session_start() {
    local session_name="$1"
    echo "" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "SESSION: $session_name" >> "$LOG_FILE"
    echo "START TIME: $(get_timestamp)" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "========================================"
    echo "SESSION: $session_name"
    echo "START TIME: $(get_timestamp)"
    echo "========================================"
}

# 세션 종료
log_session_end() {
    local session_name="$1"
    local summary="${2:-Completed}"
    echo "" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "SESSION END: $session_name" >> "$LOG_FILE"
    echo "END TIME: $(get_timestamp)" >> "$LOG_FILE"
    echo "SUMMARY: $summary" >> "$LOG_FILE"
    echo "========================================" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"

    echo "========================================"
    echo "SESSION END: $session_name"
    echo "SUMMARY: $summary"
    echo "========================================"
}

# 로그 파일 보기
view_log() {
    if [ -f "$LOG_FILE" ]; then
        cat "$LOG_FILE"
    else
        echo "No checkpoint log found."
    fi
}

# 로그 파일 초기화
reset_log() {
    > "$LOG_FILE"
    echo "Checkpoint log reset."
}

# Help
show_help() {
    echo "Checkpoint Logging System"
    echo ""
    echo "Functions:"
    echo "  log_session_start <name>     - Start a new session"
    echo "  log_session_end <name>       - End the current session"
    echo "  log_start <message>          - Log task start"
    echo "  log_success <message>        - Log success"
    echo "  log_skip <message> [reason]  - Log skipped task"
    echo "  log_error <message> [error]  - Log error"
    echo "  log_end <message>            - Log phase end"
    echo "  view_log                     - View log file"
    echo "  reset_log                    - Clear log file"
    echo ""
    echo "Example:"
    echo "  source scripts/log_checkpoint.sh"
    echo "  log_session_start 'MONKOS App Mission'"
    echo "  log_start 'Phase 1: Firebase Setup'"
    echo "  log_success 'Firebase CLI installed'"
    echo "  log_skip 'Firebase init' 'Timeout'"
    echo "  log_end 'Phase 1 complete'"
    echo "  log_session_end 'MONKOS App Mission' '3/4 tasks completed'"
}

# 스크립트가 직접 실행되면 help 표시
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    show_help
fi
