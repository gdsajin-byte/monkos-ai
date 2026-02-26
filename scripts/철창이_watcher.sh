#!/bin/bash
# ============================================================
# 철창이 폴더 워처 — 자동 정리 + 입력용 이미지 생성
# 감시: ~/Desktop/철창이/ 루트
#   MD/TXT → docs/로 이동 (Finder 경유)
#   이미지  → images/로 원본 이동 + _input_ JPEG을 루트에 생성
# 접두사 _input_ = 영문 (한글 NFD 재귀 방지)
# ============================================================

WATCH_DIR="$HOME/Desktop/철창이"
WATCH_DEPTH=$(echo "$WATCH_DIR" | awk -F'/' '{print NF}')

mkdir -p "$WATCH_DIR/docs" "$WATCH_DIR/images"

echo $$ > /tmp/철창이_watcher.pid
echo "[철창이 워처] 시작 — 감시: $WATCH_DIR"

finder_move() {
    osascript -e "
        tell application \"Finder\"
            move (POSIX file \"$1\" as alias) to (POSIX file \"$2\" as alias)
        end tell
    " >/dev/null 2>&1
}

/usr/local/bin/fswatch -0 --event Created --event MovedTo "$WATCH_DIR" | while IFS= read -r -d '' file; do
    # depth 비교로 하위 폴더 무시
    file_depth=$(dirname "$file" | awk -F'/' '{print NF}')
    [[ "$file_depth" -ne "$WATCH_DEPTH" ]] && continue
    [[ -d "$file" ]] && continue

    filename=$(basename "$file")

    # _input_ 접두사 무시 — 영문이라 NFD 무관
    [[ "$filename" == _input_* ]] && continue

    ext="${filename##*.}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    sleep 2
    [[ ! -f "$file" ]] && continue

    file_dir=$(dirname "$file")

    case "$ext_lower" in
        md|txt)
            finder_move "$file" "$file_dir/docs"
            echo "[$(date '+%H:%M')] 문서 → docs/$filename"
            ;;
        png|jpg|jpeg|heic|webp)
            finder_move "$file" "$file_dir/images"
            sleep 1
            name_noext="${filename%.*}"
            sips -s format jpeg -s formatOptions 60 "$file_dir/images/$filename" \
                 --out "$file_dir/_input_${name_noext}.jpg" 2>/dev/null
            size_kb=$(du -k "$file_dir/_input_${name_noext}.jpg" 2>/dev/null | cut -f1)
            echo "[$(date '+%H:%M')] 이미지 → images/$filename + _input_ ${size_kb}KB"
            ;;
    esac
done
