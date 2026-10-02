#!/bin/bash
# [폐기 2026-10-02] 실행 금지 — launchd 해제·드롭 폴더 제거. GCS ads/ 자산과 manifest.json은 라이브 소비 중이라 존치. 재설계: PROPOSAL_20261002_iMac민아_광고슬롯_재설계.md
# MONKOS Ads Auto-Upload — launchd WatchPaths 트리거
# ~/MONKOS_ADS/ 에 이미지 드롭 → GCS 직행 → 매니페스트 갱신
# 프로젝트 폴더 안 거침, git 무관

export HOME="/Users/jeong-kyushin"
ADS_DIR="/Users/jeong-kyushin/MONKOS_ADS"
GCS_BUCKET="monk-ai-images"
GCS_PREFIX="ads"
GCS_PATH="gs://$GCS_BUCKET/$GCS_PREFIX"
PUBLIC_BASE="https://storage.googleapis.com/$GCS_BUCKET/$GCS_PREFIX"
MAX_SLOTS=6
LOG="/Users/jeong-kyushin/.monkos-ads.log"
GCLOUD="/Users/jeong-kyushin/google-cloud-sdk/bin/gcloud"

# gcloud 경로 자동 탐색
if [ ! -f "$GCLOUD" ]; then
    GCLOUD="/opt/homebrew/bin/gcloud"
fi
if [ ! -f "$GCLOUD" ]; then
    GCLOUD=$(which gcloud 2>/dev/null)
fi

log() {
    echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
    echo "[$(date '+%H:%M:%S')] $1"
}

log "=== Ads sync triggered ==="

# 이미지 파일만 필터
shopt -s nullglob
FILES=("$ADS_DIR"/*.jpg "$ADS_DIR"/*.jpeg "$ADS_DIR"/*.png "$ADS_DIR"/*.webp "$ADS_DIR"/*.JPG "$ADS_DIR"/*.JPEG "$ADS_DIR"/*.PNG "$ADS_DIR"/*.WEBP)
shopt -u nullglob

if [ ${#FILES[@]} -eq 0 ]; then
    log "No images found, skip"
    exit 0
fi

log "Found ${#FILES[@]} image(s)"

# 업로드
UPLOADED=0
for file in "${FILES[@]}"; do
    basename=$(basename "$file")
    ts=$(date '+%Y%m%d_%H%M%S')
    ext="${basename##*.}"
    name="${basename%.*}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    # macOS NFD → NFC 정규화 (한글 자모 분리 방지)
    name=$(python3 -c "import unicodedata,sys; print(unicodedata.normalize('NFC', sys.argv[1]))" "$name")
    gcs_name="${ts}_${name}.${ext_lower}"

    log "UPLOAD: $basename → $gcs_name"
    "$GCLOUD" storage cp "$file" "$GCS_PATH/$gcs_name" --quiet 2>> "$LOG"
    "$GCLOUD" storage objects update "$GCS_PATH/$gcs_name" \
        --add-acl-grant=entity=allUsers,role=READER --quiet 2>> "$LOG"

    # 업로드 성공하면 로컬 파일 삭제 (폴더 비움)
    rm "$file"
    UPLOADED=$((UPLOADED + 1))
done

log "Uploaded $UPLOADED file(s)"

# FIFO — 최신 MAX_SLOTS장만 유지
ALL_FILES=$("$GCLOUD" storage ls "$GCS_PATH/" 2>/dev/null | grep -v manifest | grep -E '\.(jpg|jpeg|png|webp)$' | sort -r)
COUNT=$(echo "$ALL_FILES" | grep -c .)

if [ "$COUNT" -gt "$MAX_SLOTS" ]; then
    DELETE_LIST=$(echo "$ALL_FILES" | tail -n +$((MAX_SLOTS + 1)))
    while IFS= read -r gcs_file; do
        log "DELETE (FIFO): $(basename "$gcs_file")"
        "$GCLOUD" storage rm "$gcs_file" --quiet 2>> "$LOG"
    done <<< "$DELETE_LIST"
fi

# 매니페스트 갱신
CURRENT=$("$GCLOUD" storage ls "$GCS_PATH/" 2>/dev/null | grep -v manifest | grep -E '\.(jpg|jpeg|png|webp)$' | sort -r)
URLS=""
COMMA=""
while IFS= read -r gcs_file; do
    name=$(basename "$gcs_file")
    [ -z "$name" ] && continue
    URLS="${URLS}${COMMA}\"${PUBLIC_BASE}/${name}\""
    COMMA=","
done <<< "$CURRENT"

FINAL_COUNT=$(echo "$CURRENT" | grep -c .)
cat > /tmp/ads_manifest.json << MANIFEST
{
  "images": [$URLS],
  "rotate": 6000,
  "transition": 800,
  "updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "count": $FINAL_COUNT
}
MANIFEST

"$GCLOUD" storage cp /tmp/ads_manifest.json "$GCS_PATH/manifest.json" --quiet 2>> "$LOG"
"$GCLOUD" storage objects update "$GCS_PATH/manifest.json" \
    --add-acl-grant=entity=allUsers,role=READER \
    --cache-control="public, max-age=60" --quiet 2>> "$LOG"

log "DONE: $FINAL_COUNT images in rotation"
log ""
