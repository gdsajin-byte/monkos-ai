#!/bin/bash
# MONKOS matte 배포 (ch5 2조 — deploy.sh 경유 정본)
# 사용: ./deploy.sh dev | ./deploy.sh prod
set -e

ENV="${1:-dev}"
REGION="asia-northeast3"
PROJECT_ID="monkos"

if [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-matte"
  MAX_INSTANCES=3
else
  SERVICE_NAME="monkos-matte-dev"
  MAX_INSTANCES=1
fi

# 모델은 GCS 볼륨 마운트 (이미지에 972MB를 굽지 않음, 콜드스타트 시 FUSE 로드)
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --memory 16Gi \
  --cpu 8 \
  --concurrency 1 \
  --min-instances 0 \
  --max-instances "$MAX_INSTANCES" \
  --timeout 120 \
  --execution-environment gen2 \
  --add-volume name=models,type=cloud-storage,bucket=monkos-models,readonly=true \
  --add-volume-mount volume=models,mount-path=/models \
  --set-env-vars MATTE_BACKEND=onnx,MATTE_ONNX_PATH=/models/birefnet/BiRefNet-portrait.onnx \
  --allow-unauthenticated

echo "배포 완료: $SERVICE_NAME ($ENV)"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)'
