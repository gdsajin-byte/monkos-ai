#!/bin/bash

# 설정
SERVICE_NAME="monk-image-engine"
REGION="us-central1"
PROJECT_ID="monkos" # 또는 startMONK (작가님 확인 필요)
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🚀 Deploying ${SERVICE_NAME} to Cloud Run (Project: ${PROJECT_ID})..."

# 1. 빌드 및 푸시 (Google Container Registry 또는 Artifact Registry)
# gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME} .

# 2. Cloud Run 배포
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --platform managed \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --service-account ${SERVICE_ACCOUNT} \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},BUCKET_NAME=monk-ai-images

echo "✅ Deployment complete!"
