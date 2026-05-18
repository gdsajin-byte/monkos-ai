#!/bin/bash
SERVICE_NAME="monkos-crop-engine"
REGION="asia-northeast3"
PROJECT_ID="monkos"

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 60 \
  --allow-unauthenticated
