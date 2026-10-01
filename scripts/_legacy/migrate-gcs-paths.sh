#!/bin/bash
# GCS 경로 마이그레이션: service/idphoto/kr/ → idphoto/ & headshot/
BUCKET="monk-customer-photos"

# 1. 유저별 증명사진 폴더 이동
# service/idphoto/kr/{userId}/ → idphoto/{userId}/ (studio-profiles 제외)
gsutil -m rsync -r -x "studio-profiles/" "gs://${BUCKET}/service/idphoto/kr/" "gs://${BUCKET}/idphoto/"

# 2. studio-profiles → headshot/_unmapped/
gsutil -m cp -r "gs://${BUCKET}/service/idphoto/kr/studio-profiles/*" "gs://${BUCKET}/headshot/_unmapped/"

# 3. 검증 후 원본 삭제는 별도 승인 필요 — 여기서는 복사만
echo "마이그레이션 완료. 원본(service/idphoto/kr/) 삭제는 작가님 승인 후 진행."
