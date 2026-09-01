#!/bin/bash

# ── ⚠️ 좀비 가드 (G6 2026-09-01 민아): 대상 서비스 GCP 미생성 (2026-08-13 실측)
echo "⚠️  이 서비스는 미생성 상태입니다 (references.md §서비스 매핑). 진행하려면 --force-zombie 필요." >&2
case " $* " in *--force-zombie*) ;; *) exit 1;; esac
SERVICE_NAME="monkos-crop-engine"
REGION="asia-northeast3"
PROJECT_ID="monkos"

# SCRFD 모델 확보 — *.onnx는 gitignore 정책이라 정본은 GCS (2026-07-08)
# 새 클론에서도 배포 재현되도록 미존재 시 자동 인출
mkdir -p models
for m in det_10g.onnx 2d106det.onnx 6drepnet_mobilenetv3s.onnx; do
  if [ ! -f "models/$m" ]; then
    echo "[deploy] models/$m 미존재 → GCS 정본 인출"
    gsutil cp "gs://monkos-models/insightface/$m" "models/$m" || { echo "[deploy] 모델 인출 실패 — 중단"; exit 1; }
  fi
done

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 3 \
  --timeout 60 \
  --allow-unauthenticated
