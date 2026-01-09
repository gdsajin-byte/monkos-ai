#!/bin/bash
# MONK 컨텍스트 데이터 업로드 스크립트
# 사용법: ./upload_context.sh <파일경로>

if [ -z "$1" ]; then
    echo "❌ 사용법: ./upload_context.sh <파일경로>"
    echo "예시: ./upload_context.sh ~/context_15mb.txt"
    exit 1
fi

FILE_PATH="$1"
FILE_NAME=$(basename "$FILE_PATH")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
R2_KEY="knowledge-base/master_context_${TIMESTAMP}.txt"

echo "📤 MONK 컨텍스트 업로드 시작..."
echo "파일: $FILE_NAME"
echo "크기: $(du -h "$FILE_PATH" | cut -f1)"
echo ""

# R2에 업로드
npx wrangler r2 object put "monk-chat-logs/$R2_KEY" --file="$FILE_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 업로드 완료!"
    echo "R2 경로: $R2_KEY"
    echo ""
    echo "📋 D1에 메타데이터 등록 중..."
    
    # D1에 메타데이터 등록
    FILE_SIZE=$(stat -f%z "$FILE_PATH" 2>/dev/null || stat -c%s "$FILE_PATH")
    
    npx wrangler d1 execute monk-services-db --remote --command \
        "INSERT INTO processing_queue (r2_key, file_size, status) VALUES ('$R2_KEY', $FILE_SIZE, 'uploaded');"
    
    echo ""
    echo "🐉 용아(Gemini)가 이제 이 데이터를 파싱할 준비가 되었습니다!"
    echo "R2 Key: $R2_KEY"
else
    echo ""
    echo "❌ 업로드 실패!"
    exit 1
fi
