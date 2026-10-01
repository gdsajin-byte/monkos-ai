#!/bin/bash
# cheolchang_watcher.sh — ~/Desktop/철창이/ 폴더 감시 → 프로젝트 inbox 자동 수거
#
# 방식: launchd WatchPaths (기존 ads-sync과 동일 패턴)
# 트리거: ~/Desktop/철창이/ 폴더에 파일 변경 감지 시 launchd가 실행
#
# ⚠️ DEST_DIR은 어젠다 #8 경로 확정 후 수정 (현재 플레이스홀더)

# === 설정 ===
SOURCE_DIR="$HOME/Desktop/철창이"
DEST_DIR="${CHEOLCHANG_INBOX:-__PENDING_AGENDA_8__}"  # 어젠다 #8 확정 후 실제 경로로 교체
LOG_FILE="$HOME/.monkos-cheolchang.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S KST')] $1" >> "$LOG_FILE"
}

# === 경로 확정 여부 체크 ===
if [ "$DEST_DIR" = "__PENDING_AGENDA_8__" ]; then
    log "⏸️ DEST_DIR 미확정 (어젠다 #8 대기). 수거 건너뜀."
    log "   환경변수 CHEOLCHANG_INBOX 설정 또는 스크립트 내 DEST_DIR 직접 수정 필요."
    exit 0
fi

# === DEST_DIR 존재 확인 ===
if [ ! -d "$DEST_DIR" ]; then
    log "❌ DEST_DIR 없음: $DEST_DIR — 폴더 생성 필요"
    exit 1
fi

# === 소스 폴더 확인 ===
if [ ! -d "$SOURCE_DIR" ]; then
    log "❌ SOURCE_DIR 없음: $SOURCE_DIR"
    exit 1
fi

# === .md 파일 수거 ===
count=0
for file in "$SOURCE_DIR"/*.md; do
    [ -f "$file" ] || continue

    filename=$(basename "$file")

    # 이미 수거된 파일 스킵 (동일 파일명 존재 시)
    if [ -f "$DEST_DIR/$filename" ]; then
        log "⏭️ 이미 존재: $filename — 스킵"
        continue
    fi

    # 복사 (원본 유지)
    cp "$file" "$DEST_DIR/$filename"
    if [ $? -eq 0 ]; then
        log "✅ 수거 완료: $filename → $DEST_DIR/"
        count=$((count + 1))
    else
        log "❌ 수거 실패: $filename"
    fi
done

if [ $count -eq 0 ]; then
    log "ℹ️ 신규 .md 파일 없음"
else
    log "📦 총 ${count}건 수거 완료"
fi
