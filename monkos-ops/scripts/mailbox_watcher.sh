#!/bin/bash
# 우체통 워처 — 와이프(kku) 맥미니 M2 ↔ 우리 쪽 파일 자동 전달
# 30초 폴링, sshm2(sshpass) 기반

INTERVAL=30
PROJECT_DIR="$HOME/developer/monk_project"
TEAMS_DIR="$PROJECT_DIR/monkos-ops/05_공유"
KKU_INBOX="$TEAMS_DIR/kku/inbox"
LOG_FILE="$PROJECT_DIR/monkos-ops/06_로그/orchestration/mailbox.log"
REMOTE_HOST="100.93.220.17"
REMOTE_USER="mac"
REMOTE_PASS="1234"

SSH_CMD="sshpass -p '$REMOTE_PASS' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 $REMOTE_USER@$REMOTE_HOST"
SCP_CMD="sshpass -p '$REMOTE_PASS' scp -o StrictHostKeyChecking=no -o ConnectTimeout=5"

log() {
    local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$msg" | tee -a "$LOG_FILE"
}

log "=== 우체통 워처 시작 ==="
log "폴링 간격: ${INTERVAL}초"
log "대상: $REMOTE_USER@$REMOTE_HOST:~/kku/"

while true; do
    # --- 1. 와이프 outbox → 우리 inbox (수거) ---
    REMOTE_FILES=$(eval $SSH_CMD "'ls -1 ~/kku/outbox/ 2>/dev/null'" 2>/dev/null | grep -v '^\.' | grep -v '^$')

    if [ -n "$REMOTE_FILES" ]; then
        while IFS= read -r fname; do
            [ -z "$fname" ] && continue
            log "[수거] 발견: $fname"

            # scp로 복사
            eval $SCP_CMD "$REMOTE_USER@$REMOTE_HOST:\"~/kku/outbox/$fname\"" "\"$KKU_INBOX/$fname\"" 2>/dev/null

            if [ $? -eq 0 ]; then
                # 원본을 .done으로 이동 (삭제 아님)
                eval $SSH_CMD "'mv ~/kku/outbox/\"$fname\" ~/kku/outbox/.done/\"$fname\"'" 2>/dev/null
                log "[수거] 완료: $fname → teams/kku/inbox/"
            else
                log "[수거] 실패: $fname (scp 에러)"
            fi
        done <<< "$REMOTE_FILES"
    fi

    # --- 2. 우리 → 와이프 inbox (전달, .to_kku 접미사) ---
    TO_KKU_FILES=$(ls -1 "$KKU_INBOX"/*.to_kku 2>/dev/null)

    if [ -n "$TO_KKU_FILES" ]; then
        while IFS= read -r filepath; do
            [ -z "$filepath" ] && continue
            fname=$(basename "$filepath")
            # .to_kku 접미사 제거한 이름으로 전달
            dest_name="${fname%.to_kku}"
            log "[전달] 발견: $fname → ~/kku/inbox/$dest_name"

            eval $SCP_CMD "\"$filepath\"" "$REMOTE_USER@$REMOTE_HOST:\"~/kku/inbox/$dest_name\"" 2>/dev/null

            if [ $? -eq 0 ]; then
                # 전달 완료 후 원본 삭제
                rm "$filepath"
                log "[전달] 완료: $dest_name → 와이프 inbox"
            else
                log "[전달] 실패: $fname (scp 에러)"
            fi
        done <<< "$TO_KKU_FILES"
    fi

    sleep $INTERVAL
done
