#!/bin/bash
# session_watcher.sh — 소넷이 아카이브 데몬 (세션 로그 자동 분석)
# 용도: docs/corpus/sessions/ 변경 감지 → claude sonnet으로 분석 → memory/sonnet/ 에 기록
# 실행: mk-sw (tmux 백그라운드) 또는 직접 ./session_watcher.sh

set -euo pipefail

# === 경로 설정 ===
PROJECT_DIR="$HOME/developer/monk_project"
SESSIONS_DIR="$PROJECT_DIR/monkos-ops/06_로그/sessions"
MEMORY_BASE="$HOME/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/sonnet"
README_PATH="$MEMORY_BASE/README.md"
LOG_FILE="$MEMORY_BASE/watcher.log"

# === 설정 ===
DEBOUNCE_SEC=5
POLL_INTERVAL=30  # fswatch 미설치 시 폴링 간격(초)
CLAUDE_BIN="/usr/local/bin/claude"

# === 유틸 ===
ts() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    local msg="[$(ts)] $1"
    echo "$msg"
    echo "$msg" >> "$LOG_FILE"
}

# === 시스템 프롬프트 생성 ===
build_system_prompt() {
    local readme_content
    readme_content=$(cat "$README_PATH")
    cat <<SYSPROMPT
당신은 소넷이-아이맥 (아카이브 데몬)입니다.

$readme_content

## 현재 작업 지시

아래에 세션 로그의 변경분(diff)이 주어집니다.
1. 변경분을 파싱하여 과제(topic)를 식별하세요.
2. 기존 INDEX.md와 대조하여 기존 과제 갱신 또는 신규 과제 생성을 판단하세요.
3. topics/ 파일과 INDEX.md를 업데이트하세요.
4. daily/ 리포트에 오늘 분석 내역을 추가하세요.

출력 경로: $MEMORY_BASE/
- INDEX.md 갱신
- topics/{ID}_{제목}.md 갱신 또는 생성
- daily/$(date '+%Y-%m-%d').md 갱신

git 명령은 절대 사용하지 마세요. 파일 읽기/쓰기만 가능합니다.
SYSPROMPT
}

# === diff 추출 ===
get_session_diff() {
    cd "$PROJECT_DIR"
    # staged + unstaged 변경 + untracked 세션 파일
    local diff_output=""

    # git tracked 변경분
    local tracked_diff
    tracked_diff=$(git diff HEAD -- "$SESSIONS_DIR/" 2>/dev/null || true)
    if [ -n "$tracked_diff" ]; then
        diff_output="$tracked_diff"
    fi

    # untracked 신규 세션 파일 (전체 내용 포함)
    local untracked
    untracked=$(git ls-files --others --exclude-standard "$SESSIONS_DIR/" 2>/dev/null || true)
    if [ -n "$untracked" ]; then
        while IFS= read -r f; do
            if [ -f "$f" ]; then
                diff_output="$diff_output
--- /dev/null
+++ $f
$(cat "$f")"
            fi
        done <<< "$untracked"
    fi

    echo "$diff_output"
}

# === 분석 실행 ===
run_analysis() {
    local diff_content="$1"

    if [ -z "$diff_content" ]; then
        log "변경분 없음 — 스킵"
        return
    fi

    local char_count=${#diff_content}
    log "분석 시작 (변경분 ${char_count}자)"

    local system_prompt
    system_prompt=$(build_system_prompt)

    local user_prompt="세션 로그 변경분을 분석하고 과제 레지스트리를 업데이트해주세요.

=== 변경분 (diff) ===
$diff_content
=== 끝 ==="

    # claude -p (파이프 모드) + sonnet 모델
    local result
    if result=$(echo "$user_prompt" | CLAUDE_MODEL=sonnet "$CLAUDE_BIN" -p \
        --system-prompt "$system_prompt" \
        --allowedTools "Read,Write,Edit,Glob,Grep" \
        2>&1); then
        log "분석 완료: $(echo "$result" | wc -l | tr -d ' ')줄 출력"
        log "--- 소넷이 응답 요약 ---"
        echo "$result" | tail -5 >> "$LOG_FILE"
        log "--- 끝 ---"
    else
        log "ERROR: claude 실행 실패 — $result"
    fi
}

# === 메인 루프 ===
main() {
    log "========================================="
    log "소넷이 아카이브 데몬 시작"
    log "감시 대상: $SESSIONS_DIR"
    log "출력 경로: $MEMORY_BASE"
    log "========================================="

    # 초기 분석 (시작 시 1회)
    log "초기 변경분 확인..."
    local initial_diff
    initial_diff=$(get_session_diff)
    if [ -n "$initial_diff" ]; then
        run_analysis "$initial_diff"
    else
        log "초기 변경분 없음"
    fi

    # fswatch 사용 가능 여부 판단
    if command -v fswatch &>/dev/null; then
        log "모드: fswatch (이벤트 기반, debounce ${DEBOUNCE_SEC}s)"
        fswatch -r -l "$DEBOUNCE_SEC" --event Created --event Updated --event Renamed \
            "$SESSIONS_DIR" | while read -r changed_file; do
            log "변경 감지: $changed_file"
            local diff_content
            diff_content=$(get_session_diff)
            run_analysis "$diff_content"
        done
    else
        log "모드: polling (${POLL_INTERVAL}s 간격, fswatch 미설치)"
        log "성능 향상: brew install fswatch"

        local last_hash=""
        while true; do
            sleep "$POLL_INTERVAL"

            # 세션 폴더의 파일 목록 + mtime 해시로 변경 감지
            local current_hash
            current_hash=$(find "$SESSIONS_DIR" -name "*.md" -exec stat -f "%m %N" {} \; 2>/dev/null | sort | md5)

            if [ "$current_hash" != "$last_hash" ] && [ -n "$last_hash" ]; then
                log "변경 감지 (polling)"
                local diff_content
                diff_content=$(get_session_diff)
                run_analysis "$diff_content"
            fi
            last_hash="$current_hash"
        done
    fi
}

# === 시그널 핸들링 ===
cleanup() {
    log "소넷이 아카이브 데몬 종료"
    exit 0
}
trap cleanup SIGINT SIGTERM

# === 실행 ===
main "$@"
