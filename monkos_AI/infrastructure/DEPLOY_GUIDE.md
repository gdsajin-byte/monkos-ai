# MONKOS.AI Cloud Run 배포 가이드

## GCP 설정

| 항목 | 값 |
|------|-----|
| 프로젝트 ID | `monkos` |
| 리전 | `us-central1` |
| 서비스 계정 | `monk-image-engine@monkos.iam.gserviceaccount.com` |
| GCS 버킷 | `monk-ai-images` |
| 도메인 | monkos.ai (Cloudflare DNS) |

## 사전 요구사항

```bash
# gcloud CLI 설치 및 인증
gcloud auth login
gcloud config set project monkos

# 필요 API 활성화
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage-api.googleapis.com
```

## 배포 방법

### 각 서비스 디렉토리에서 deploy.sh 실행

```bash
# 프로덕션
./deploy.sh

# 스테이징
./deploy.sh staging
```

### deploy.sh 표준 동작

1. GCP 프로젝트 설정
2. Docker 이미지 빌드 (Cloud Build)
3. Cloud Run 배포
4. URL 출력 + 헬스 체크

## 인증

### Vertex AI ADC (Application Default Credentials)
- Gemini Live, Imagen I2I, QC 전부 **ADC 단일 인증**
- API Key 불필요 — 서비스 계정 권한만으로 동작
- 서비스 계정에 `Vertex AI User` 역할 필요

```bash
# 서비스 계정 권한 확인/추가
gcloud projects add-iam-policy-binding monkos \
  --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 환경변수 (Cloud Run 자동 설정)
- `PROJECT_ID` — GCP 프로젝트 ID
- `LOCATION` — 리전
- `GCS_BUCKET` — 이미지 저장소

### Secret Manager (향후 서비스 확장용)
- `LINE_CHANNEL_SECRET` — LINE Messaging API (챗봇/알림용)

```bash
# LINE 시크릿 등록
echo -n "CHANNEL_SECRET" | gcloud secrets create line-channel-secret --data-file=-

# Cloud Run에 시크릿 마운트
gcloud run services update SERVICE_NAME \
  --set-secrets="LINE_CHANNEL_SECRET=line-channel-secret:latest"
```

## 도메인 매핑

### Cloudflare DNS → Cloud Run

1. Cloud Run 서비스 URL 확인: `gcloud run services describe SERVICE --format='value(status.url)'`
2. Cloudflare DNS에 CNAME 레코드 추가
3. 또는 Cloud Run 도메인 매핑: `gcloud run domain-mappings create --service=SERVICE --domain=idphoto-jp.monkos.ai`

### 서비스별 서브도메인 구조

| 서비스 | 도메인 |
|--------|--------|
| Imagen 4 API | image.monkos.ai |
| AI 証明写真 (JP) | idphoto-jp.monkos.ai |
| AI 룩북 | lookbook.monkos.ai |
| AI 모델 | model.monkos.ai |
| 쌍아 챗봇 | chat.monkos.ai |

## Cloud Run 리소스 설정 (표준)

| 항목 | 값 |
|------|-----|
| 메모리 | 2Gi |
| CPU | 2 |
| 타임아웃 | 300초 |
| 동시성 | 80 |
| 최소 인스턴스 | 0 (제로 스케일) |
| 최대 인스턴스 | 10 |
| 인증 | 미인증 허용 (공개 서비스) |

## 로컬 개발

```bash
cd monkos_AI/idphoto-jp
npm install
node server.js
# → http://localhost:8080
```

카메라 접근은 HTTPS 또는 localhost에서만 가능.
모바일 테스트: Tailscale IP + 자체서명 인증서 사용.
