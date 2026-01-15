#!/bin/bash
# ============================================
# D1 → GCS 방문자 데이터 동기화
# 실행: ./scripts/sync_visitors_to_gcs.sh
# 권장: 크론탭 등록 (매일 00:00)
# ============================================

set -e

# 설정
PROJECT_DIR="/Users/developer/monk_project "
WRANGLER_DIR="$PROJECT_DIR/MONK_kr"
GCS_BUCKET="gs://monk-project/visitor_data/visitors"
DATE=$(date +%Y-%m-%d)
MONTH=$(date +%Y-%m)
TEMP_FILE="/tmp/visitors_${DATE}.json"

echo "🔄 MONK Visitor Data Sync - $DATE"
echo "=================================="

# 1. D1에서 데이터 추출
echo "📥 Extracting from D1..."
cd "$WRANGLER_DIR"

# wrangler d1 execute로 데이터 조회
npx wrangler d1 execute monk-services-db --command="SELECT * FROM shared_visitors WHERE DATE(created_at) = '$DATE' OR DATE(last_visit) = '$DATE'" --json > "$TEMP_FILE" 2>/dev/null || {
    echo "⚠️ No data or D1 query failed"
    # 전체 데이터 백업 시도
    npx wrangler d1 execute monk-services-db --command="SELECT * FROM shared_visitors" --json > "$TEMP_FILE" 2>/dev/null || {
        echo "❌ D1 connection failed"
        exit 1
    }
}

# 2. 데이터 확인
RECORD_COUNT=$(cat "$TEMP_FILE" | jq 'if type == "array" then length else 0 end' 2>/dev/null || echo "0")
echo "📊 Records: $RECORD_COUNT"

if [ "$RECORD_COUNT" == "0" ]; then
    echo "ℹ️ No new visitors today"
    rm -f "$TEMP_FILE"
    exit 0
fi

# 3. GCS 업로드
echo "☁️ Uploading to GCS..."
gsutil cp "$TEMP_FILE" "${GCS_BUCKET}/${MONTH}/${DATE}.json"

# 4. 정리
rm -f "$TEMP_FILE"

echo "✅ Sync completed: ${GCS_BUCKET}/${MONTH}/${DATE}.json"
echo "   Records synced: $RECORD_COUNT"

# 5. 월별 집계 (선택)
if [ "$(date +%d)" == "01" ]; then
    echo "📈 Creating monthly summary..."
    LAST_MONTH=$(date -v-1d +%Y-%m)
    npx wrangler d1 execute monk-services-db --command="
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN gender = 'M' THEN 1 END) as male,
            COUNT(CASE WHEN gender = 'F' THEN 1 END) as female,
            age_group,
            COUNT(*) as count
        FROM shared_visitors 
        WHERE strftime('%Y-%m', created_at) = '$LAST_MONTH'
        GROUP BY age_group
    " --json > "/tmp/visitors_summary_${LAST_MONTH}.json" 2>/dev/null
    
    gsutil cp "/tmp/visitors_summary_${LAST_MONTH}.json" "${GCS_BUCKET}/../analytics/monthly/${LAST_MONTH}_summary.json"
    rm -f "/tmp/visitors_summary_${LAST_MONTH}.json"
    echo "✅ Monthly summary uploaded"
fi

echo "🎉 Done!"
