#!/bin/bash
# GCR 레거시 이미지 삭제 스크립트
# [2026-02-28] 작가님 승인 완료. 아카이브 완료 후 실행.
# 아카이브: monkos-ops/tech/archive/gcr_legacy/

set -e

echo "========================================="
echo "GCR 레거시 이미지 삭제 스크립트"
echo "========================================="
echo ""

# ---- A. 레거시 레포 전체 삭제 ----
echo "[1/5] idphoto-kr 구 레포 삭제 (42개)..."
gcloud container images list-tags gcr.io/monkos/idphoto-kr --format="get(digest)" | \
  while read digest; do
    echo "  삭제: $digest"
    gcloud container images delete "gcr.io/monkos/idphoto-kr@$digest" --quiet --force-delete-tags
  done
echo "  → idphoto-kr 구 레포 완료"
echo ""

echo "[2/5] portal 구 레포 삭제 (3개)..."
gcloud container images list-tags gcr.io/monkos/portal --format="get(digest)" | \
  while read digest; do
    echo "  삭제: $digest"
    gcloud container images delete "gcr.io/monkos/portal@$digest" --quiet --force-delete-tags
  done
echo "  → portal 구 레포 완료"
echo ""

# ---- B. 운영 레포 구 이미지 정리 (최근 10개 보존) ----
echo "[3/5] monkos-idphoto-kr 구 이미지 정리 (최근 10개 보존)..."
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    echo "  삭제: $digest"
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-kr@$digest" --quiet --force-delete-tags
  done
echo "  → monkos-idphoto-kr 완료"
echo ""

echo "[3/5] monkos-portal 구 이미지 정리..."
gcloud container images list-tags gcr.io/monkos/monkos-portal \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    echo "  삭제: $digest"
    gcloud container images delete "gcr.io/monkos/monkos-portal@$digest" --quiet --force-delete-tags
  done
echo "  → monkos-portal 완료"
echo ""

echo "[3/5] monkos-idphoto-jp 구 이미지 정리..."
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-jp \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    echo "  삭제: $digest"
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-jp@$digest" --quiet --force-delete-tags
  done
echo "  → monkos-idphoto-jp 완료"
echo ""

# ---- C. dev 레포 (최근 5개 보존) ----
echo "[4/5] dev 레포 구 이미지 정리 (최근 5개 보존)..."
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr-dev \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +6 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-kr-dev@$digest" --quiet --force-delete-tags
  done

gcloud container images list-tags gcr.io/monkos/monkos-portal-dev \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +6 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-portal-dev@$digest" --quiet --force-delete-tags
  done
echo "  → dev 레포 완료"
echo ""

# ---- D. 검증 ----
echo "[5/5] 삭제 결과 검증..."
echo ""
echo "=== 레거시 레포 ==="
echo "idphoto-kr:"
gcloud container images list-tags gcr.io/monkos/idphoto-kr 2>&1 || echo "  (레포 비어있음 또는 삭제됨)"
echo "portal:"
gcloud container images list-tags gcr.io/monkos/portal 2>&1 || echo "  (레포 비어있음 또는 삭제됨)"
echo ""
echo "=== 운영 레포 남은 이미지 ==="
echo "monkos-idphoto-kr: $(gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr --format='table(digest)' 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')개"
echo "monkos-portal: $(gcloud container images list-tags gcr.io/monkos/monkos-portal --format='table(digest)' 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')개"
echo "monkos-idphoto-jp: $(gcloud container images list-tags gcr.io/monkos/monkos-idphoto-jp --format='table(digest)' 2>/dev/null | tail -n +2 | wc -l | tr -d ' ')개"
echo ""
echo "========================================="
echo "GCR 정리 완료"
echo "========================================="
