#!/bin/bash
# GCS 버킷 마이그레이션 스크립트
# 실행: bash scripts/gcs_migrate.sh
# 
# 기존 버킷 → gs://monk-project/ 신규 구조로 이관
# 서비스 계정: 편집자 권한 사용
#
# 생성: 2026-01-15 08:16

set -e

echo "================================================"
echo "  MONK GCS 버킷 마이그레이션"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 신규 버킷 (없으면 생성)
NEW_BUCKET="gs://monk-project"
LOCATION="asia-northeast3"

# 기존 버킷들
OLD_IMAGES="gs://monk-ai-images"
OLD_SOUL="gs://monk-project-soul"
OLD_SESSION="gs://monk_session_data"

# ============================================
# Step 0: 신규 버킷 존재 확인 또는 생성
# ============================================
echo -e "${YELLOW}[Step 0] 신규 버킷 확인...${NC}"

if gsutil ls -b "$NEW_BUCKET" 2>/dev/null; then
    echo -e "${GREEN}✓ 버킷 존재: $NEW_BUCKET${NC}"
else
    echo "버킷 생성 중: $NEW_BUCKET"
    gsutil mb -l "$LOCATION" "$NEW_BUCKET"
    echo -e "${GREEN}✓ 버킷 생성 완료${NC}"
fi
echo ""

# ============================================
# Step 1: K뷰티 이미지 이동 (soso/sources/kbeauty/)
# ============================================
echo -e "${YELLOW}[Step 1] K뷰티 이미지 이동...${NC}"
echo "From: $OLD_IMAGES/raw_data/kbeauty_sources/"
echo "To:   $NEW_BUCKET/assets/soso/sources/kbeauty/"

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_hair" \
    "$NEW_BUCKET/assets/soso/sources/kbeauty/hair/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_makeup" \
    "$NEW_BUCKET/assets/soso/sources/kbeauty/makeup/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_fashion" \
    "$NEW_BUCKET/assets/soso/sources/kbeauty/fashion/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_model" \
    "$NEW_BUCKET/assets/soso/sources/kbeauty/model/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_lingerie" \
    "$NEW_BUCKET/assets/soso/sources/kbeauty/lingerie/" 2>/dev/null || true

echo -e "${GREEN}✓ K뷰티 이미지 이동 완료${NC}"
echo ""

# ============================================
# Step 2: 배경 이미지 이동 (soso/sources/backgrounds/)
# ============================================
echo -e "${YELLOW}[Step 2] 배경 이미지 이동...${NC}"
echo "From: $OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_*"
echo "To:   $NEW_BUCKET/assets/soso/sources/backgrounds/"

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_cafe" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/cafe/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_interior" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/interior/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_street" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/street/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_studio" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/studio/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_bg_nature" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/nature/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/naver_background" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/" 2>/dev/null || true

# bg_ 프리픽스 폴더들도 이동
gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/bg_cafe" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/cafe/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/bg_interior" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/interior/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/bg_street" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/street/" 2>/dev/null || true

gsutil -m cp -r "$OLD_IMAGES/raw_data/kbeauty_sources/bg_studio" \
    "$NEW_BUCKET/assets/soso/sources/backgrounds/studio/" 2>/dev/null || true

echo -e "${GREEN}✓ 배경 이미지 이동 완료${NC}"
echo ""

# ============================================
# Step 3: 세션 로그 이동 (corpus/sessions/)
# ============================================
echo -e "${YELLOW}[Step 3] 세션 로그 이동...${NC}"
echo "From: $OLD_SOUL/saga/"
echo "To:   $NEW_BUCKET/corpus/sessions/"

gsutil -m cp -r "$OLD_SOUL/saga/session_logs" \
    "$NEW_BUCKET/corpus/sessions/" 2>/dev/null || true

gsutil -m cp -r "$OLD_SOUL/saga/*.md" \
    "$NEW_BUCKET/corpus/sessions/" 2>/dev/null || true

echo -e "${GREEN}✓ 세션 로그 이동 완료${NC}"
echo ""

# ============================================
# Step 4: Gemini 대화 이동 (corpus/gemini/)
# ============================================
echo -e "${YELLOW}[Step 4] Gemini 대화 이동...${NC}"
echo "From: $OLD_SESSION/"
echo "To:   $NEW_BUCKET/corpus/gemini/"

gsutil -m cp -r "$OLD_SESSION/*" \
    "$NEW_BUCKET/corpus/gemini/" 2>/dev/null || true

echo -e "${GREEN}✓ Gemini 대화 이동 완료${NC}"
echo ""

# ============================================
# Step 5: live/, archive/, templates/ 이동
# ============================================
echo -e "${YELLOW}[Step 5] 기타 폴더 이동...${NC}"

gsutil -m cp -r "$OLD_SOUL/live" \
    "$NEW_BUCKET/live/" 2>/dev/null || true

gsutil -m cp -r "$OLD_SOUL/archive" \
    "$NEW_BUCKET/archive/" 2>/dev/null || true

gsutil -m cp -r "$OLD_SOUL/templates" \
    "$NEW_BUCKET/templates/" 2>/dev/null || true

echo -e "${GREEN}✓ 기타 폴더 이동 완료${NC}"
echo ""

# ============================================
# Step 6: 결과 확인
# ============================================
echo -e "${YELLOW}[Step 6] 마이그레이션 결과 확인...${NC}"
echo ""
echo "신규 버킷 구조:"
gsutil ls "$NEW_BUCKET/"
echo ""

echo "용량 확인:"
gsutil du -sh "$NEW_BUCKET/corpus/" 2>/dev/null || echo "corpus/: (empty)"
gsutil du -sh "$NEW_BUCKET/assets/" 2>/dev/null || echo "assets/: (empty)"
gsutil du -sh "$NEW_BUCKET/live/" 2>/dev/null || echo "live/: (empty)"
echo ""

echo "================================================"
echo -e "${GREEN}  마이그레이션 완료!${NC}"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
echo ""
echo "⚠️  기존 버킷 삭제는 수동으로 확인 후 진행하세요:"
echo "    gsutil rm -r $OLD_IMAGES"
echo "    gsutil rm -r $OLD_SOUL"
echo "    gsutil rm -r $OLD_SESSION"
