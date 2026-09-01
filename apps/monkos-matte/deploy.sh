#!/bin/bash
# MONKOS matte 배포 (ch5 2조 — deploy.sh 경유 정본)
# 사용: ./deploy.sh dev | ./deploy.sh gpu | ./deploy.sh prod
#   dev  — CPU (서울 northeast3, 8vCPU) : 폴백·개발 검증용 (실측 19~23s/장)
#   gpu  — L4 (싱가포르 southeast1)     : 서빙 후보 (L4는 서울·도쿄 미지원, 무존중복 쿼터 신청 불요)
#   prod — 서빙지 확정 후 지정
set -eo pipefail
# ── ⚠️ 좀비 가드 (G6 2026-09-01 민아): 대상 서비스 GCP 미생성 (2026-08-13 실측)
echo "⚠️  이 서비스는 미생성 상태입니다 (references.md §서비스 매핑). 진행하려면 --force-zombie 필요." >&2
case " $* " in *--force-zombie*) ;; *) exit 1;; esac


ENV="${1:-dev}"
PROJECT_ID="monkos"
GPU_FLAGS=""

if [ "$ENV" = "gpu" ]; then
  SERVICE_NAME="monkos-matte-gpu"
  REGION="asia-southeast1"
  MODEL_BUCKET="monkos-models-sg"   # 모델 동일 리전 복제본 (크로스리전 FUSE 이그레스 회피)
  MAX_INSTANCES=1
  CPU=4
  GPU_FLAGS="--gpu 1 --gpu-type nvidia-l4 --no-gpu-zonal-redundancy"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-matte"
  REGION="asia-northeast3"
  MODEL_BUCKET="monkos-models"
  MAX_INSTANCES=3
  CPU=8
else
  SERVICE_NAME="monkos-matte-dev"
  REGION="asia-northeast3"
  MODEL_BUCKET="monkos-models"
  MAX_INSTANCES=1
  CPU=8
fi

# gpu 타겟은 Dockerfile.gpu 사용 — --source 빌드가 ./Dockerfile 고정이라 일시 스왑
if [ "$ENV" = "gpu" ]; then
  cp Dockerfile Dockerfile.cpu.tmp
  cp Dockerfile.gpu Dockerfile
  trap 'mv Dockerfile.cpu.tmp Dockerfile' EXIT
fi

# 모델은 GCS 볼륨 마운트 (이미지에 972MB를 굽지 않음, 콜드스타트 시 FUSE 로드)
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --platform managed \
  --memory 16Gi \
  --cpu "$CPU" \
  $GPU_FLAGS \
  --concurrency 1 \
  --min-instances 0 \
  --max-instances "$MAX_INSTANCES" \
  --timeout 120 \
  --execution-environment gen2 \
  --add-volume name=models,type=cloud-storage,bucket="$MODEL_BUCKET",readonly=true \
  --add-volume-mount volume=models,mount-path=/models \
  --set-env-vars MATTE_BACKEND=onnx,MATTE_ONNX_PATH=/models/birefnet/BiRefNet-portrait.onnx \
  --allow-unauthenticated

echo "배포 완료: $SERVICE_NAME ($ENV)"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)'
