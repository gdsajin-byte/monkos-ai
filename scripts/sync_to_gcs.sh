#!/bin/bash
# MONK 프로젝트 크롤링 데이터 GCS 자동 동기화 스크립트
# 용도: Git 용량 초과 방지, 대용량 이미지 데이터를 GCS로 이관

set -e

# 설정
PROJECT_ID="gen-lang-client-0105707468"
BUCKET_NAME="monk-ai-images"  # 기존 버킷 활용
LOCAL_BASE="/Users/developer/monk_project/_saga"
GCS_BASE="gs://${BUCKET_NAME}/raw_data"  # 하위 폴더 사용

echo "🚀 =========================================="
echo "   MONK 데이터 → GCS 동기화"
echo "=========================================="
echo ""

# GCS 버킷 확인 (기존 monk-ai-images 사용)
echo "📦 1. GCS 버킷 확인..."
echo "   버킷: ${BUCKET_NAME}"
echo "   경로: ${GCS_BASE}"
gsutil ls "gs://${BUCKET_NAME}" > /dev/null 2>&1 && echo "   ✅ 버킷 접근 가능" || echo "   ❌ 버킷 접근 실패"

echo ""
echo "📤 2. K뷰티 이미지 업로드..."
# kbeauty_sources 폴더 동기화 (이미지만)
gsutil -m rsync -r -x ".*\.json$" \
    "${LOCAL_BASE}/kbeauty_sources/" \
    "${GCS_BASE}/kbeauty_sources/"

echo ""
echo "📤 3. 태깅 데이터 업로드..."
# JSON 메타데이터 업로드
gsutil -m rsync -r -x ".*\.jpg$|.*\.jpeg$|.*\.png$" \
    "${LOCAL_BASE}/kbeauty_sources/" \
    "${GCS_BASE}/kbeauty_sources_metadata/"

echo ""
echo "📤 4. BWYA 강의록 업로드..."
# BWYA 문서 업로드 (docx, mp3)
gsutil -m cp -r \
    "${LOCAL_BASE}/BWYA_Academy/강의실(B.W.Y.A)/" \
    "${GCS_BASE}/bwya_academy/" 2>/dev/null || echo "   (일부 파일 스킵)"

echo ""
echo "✅ =========================================="
echo "   동기화 완료!"
echo "=========================================="
echo ""

# 업로드 결과 확인
echo "📊 GCS 버킷 내용:"
gsutil du -sh "${GCS_BASE}/*"

echo ""
echo "💡 다음 단계:"
echo "   1. Git에서 이미지 제거: git rm --cached _saga/kbeauty_sources/**/*.jpg"
echo "   2. .gitignore 적용됨 확인: git status"
echo "   3. 로컬 정리: 필요시 _saga/kbeauty_sources/ 삭제 가능 (GCS에 백업됨)"
echo ""
