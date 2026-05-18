#!/bin/bash
# ============================================================
# 철창이 폴더 워처 — 자동 정리 + 입력용 이미지 생성
# 방식: launchd WatchPaths 트리거 → 스캔 → 처리 → 종료
#   (fswatch 파이프 방식에서 전환 — 장시간 파이프 stuck 방지)
# 감시: ~/Desktop/철창이/ 루트
#   MD/TXT → docs/로 이동 (Finder 경유)
#   이미지  → images/로 원본 이동 + _input_ JPEG을 루트에 생성
# 접두사 _input_ = 영문 (한글 NFD 재귀 방지)
# ============================================================

WATCH_DIR="$HOME/Desktop/철창이"
LOG="/tmp/철창이_watcher.log"

mkdir -p "$WATCH_DIR/docs" "$WATCH_DIR/images"

echo "[$(date '+%Y-%m-%d %H:%M')] 워처 실행" >> "$LOG"

finder_move() {
    osascript -e "
        tell application \"Finder\"
            move (POSIX file \"$1\" as alias) to (POSIX file \"$2\" as alias)
        end tell
    " >/dev/null 2>&1
}

# 루트 파일만 스캔 (하위 폴더 무시, _input_ 무시, 디렉토리 무시, .DS_Store 무시)
processed=0
for file in "$WATCH_DIR"/*; do
    [[ ! -f "$file" ]] && continue

    filename=$(basename "$file")
    [[ "$filename" == _input_* ]] && continue
    [[ "$filename" == .DS_Store ]] && continue

    ext="${filename##*.}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    case "$ext_lower" in
        md|txt)
            finder_move "$file" "$WATCH_DIR/docs"
            echo "[$(date '+%H:%M')] 문서 → docs/$filename" >> "$LOG"
            processed=$((processed + 1))
            ;;
        png|jpg|jpeg|heic|webp)
            finder_move "$file" "$WATCH_DIR/images"
            sleep 1
            name_noext="${filename%.*}"
            sips -s format jpeg -s formatOptions 60 "$WATCH_DIR/images/$filename" \
                 --out "$WATCH_DIR/_input_${name_noext}.jpg" 2>/dev/null
            size_kb=$(du -k "$WATCH_DIR/_input_${name_noext}.jpg" 2>/dev/null | cut -f1)
            echo "[$(date '+%H:%M')] 이미지 → images/$filename + _input_ ${size_kb}KB" >> "$LOG"
            processed=$((processed + 1))
            ;;
    esac
done

[[ $processed -eq 0 ]] || echo "[$(date '+%H:%M')] 처리 완료: ${processed}건" >> "$LOG"
