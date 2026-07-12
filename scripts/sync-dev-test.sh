#!/bin/bash
# dev T1 테스트 이미지를 로컬 MONKOS_ASSETS/테스트이미지/dev_t1_sync/로 동기화
# 사용: ./scripts/sync-dev-test.sh

DEST=~/Desktop/MONKOS_ASSETS/테스트이미지/dev_t1_sync
SRC=gs://monk-customer-photos/idphoto/specs-visitor

mkdir -p "$DEST"
gsutil -m rsync -r -x '.*(?<!_t1_raw\.png)(?<!_generated\.png)(?<!_original\.jpg)$' "$SRC" "$DEST" 2>/dev/null

echo "동기화 완료: $DEST"
ls -lhrt "$DEST" | tail -20
