# MONKOS Image Engine Backend

K-뷰티 특화 이미지 생성 백엔드 API 서비스

## 개요

Vertex AI Imagen 4를 기반으로 한 고품질 이미지 생성 백엔드 서비스입니다.

### 주요 기능

- **Vertex AI Imagen 4**: 최신 이미지 생성 모델
- **ADC 인증**: Application Default Credentials 자동 사용
- **GCS 자동 저장**: 생성된 이미지를 Google Cloud Storage에 저장
- **Cloud Run 최적화**: 서버리스 환경에서 효율적 실행
- **배치 생성**: 최대 4장 동시 생성

## 디렉토리 구조

```
backend/
├── server.js          # 메인 API 서버
├── package.json       # Node.js 의존성
├── Dockerfile         # Cloud Run 컨테이너
├── .dockerignore      # Docker 빌드 제외 파일
├── deploy.sh          # 배포 스크립트
└── README.md          # 이 문서
```

## 로컬 개발

### 1. 의존성 설치

```bash
cd apps/monk_imagen4/backend
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```env
PORT=8080
PROJECT_ID=monkos
LOCATION=us-central1
GCS_BUCKET=monk-ai-images
```

### 3. GCP 인증 설정

```bash
# Application Default Credentials 설정
gcloud auth application-default login

# 프로젝트 설정
gcloud config set project monkos
```

### 4. 개발 서버 실행

```bash
npm run dev
```

서버가 `http://localhost:8080`에서 실행됩니다.

## API 엔드포인트

### 1. 헬스 체크

```http
GET /
```

**응답:**
```json
{
  "status": "healthy",
  "message": "MONKOS Image Engine is running",
  "version": "1.0.0",
  "timestamp": "2026-01-28T...",
  "project": "monkos",
  "location": "us-central1"
}
```

### 2. 이미지 생성

```http
POST /generate
Content-Type: application/json
```

**요청 본문:**
```json
{
  "prompt": "A beautiful Korean woman with elegant makeup",
  "negativePrompt": "blurry, low quality",
  "aspectRatio": "1:1",
  "style": "photography",
  "numberOfImages": 1,
  "saveToGcs": true,
  "guidanceScale": 7.0,
  "safetyFilterLevel": "block_some"
}
```

**파라미터:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|-----|-------|-----|
| `prompt` | string | ✅ | - | 이미지 생성 프롬프트 |
| `negativePrompt` | string | ❌ | "" | 부정 프롬프트 |
| `aspectRatio` | string | ❌ | "1:1" | 비율 (1:1, 16:9, 9:16 등) |
| `style` | string | ❌ | "photography" | 스타일 |
| `numberOfImages` | number | ❌ | 1 | 생성할 이미지 수 (1-4) |
| `saveToGcs` | boolean | ❌ | true | GCS 저장 여부 |
| `seed` | number | ❌ | - | 시드 값 (재현성) |
| `guidanceScale` | number | ❌ | 7.0 | 가이던스 스케일 |
| `safetyFilterLevel` | string | ❌ | "block_some" | 안전 필터 레벨 |

**응답:**
```json
{
  "success": true,
  "images": [
    {
      "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
      "gcsUrl": "https://storage.googleapis.com/monk-ai-images/generated/1738051200000_0.jpg",
      "index": 0
    }
  ],
  "metadata": {
    "prompt": "A beautiful Korean woman with elegant makeup",
    "negativePrompt": "blurry, low quality",
    "aspectRatio": "1:1",
    "style": "photography",
    "numberOfImages": 1,
    "duration": "2340ms",
    "timestamp": "2026-01-28T12:00:00.000Z"
  }
}
```

### 3. 배치 생성 (4장)

```http
POST /batch-generate
Content-Type: application/json
```

`/generate`와 동일한 파라미터 사용 (자동으로 `numberOfImages=4` 설정)

## Cloud Run 배포

### 사전 준비

1. **GCP 프로젝트 설정**
   ```bash
   gcloud config set project monkos
   ```

2. **서비스 계정 생성**
   ```bash
   gcloud iam service-accounts create monk-image-engine \
     --display-name="MONK Image Engine Service Account"
   ```

3. **권한 부여**
   ```bash
   # Vertex AI 사용 권한
   gcloud projects add-iam-policy-binding monkos \
     --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   # Cloud Storage 사용 권한
   gcloud projects add-iam-policy-binding monkos \
     --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

### 배포 실행

```bash
# 프로덕션 배포
./deploy.sh production

# 스테이징 배포
./deploy.sh staging
```

배포 스크립트는 자동으로:
1. 필요한 API 활성화
2. Docker 이미지 빌드 (Cloud Build)
3. Cloud Run에 배포
4. 서비스 URL 출력

### 배포 후 테스트

```bash
# 헬스 체크
curl https://monk-image-engine-xxxx-uc.a.run.app/

# 이미지 생성 테스트
curl -X POST https://monk-image-engine-xxxx-uc.a.run.app/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A beautiful Korean woman with elegant makeup",
    "aspectRatio": "1:1",
    "numberOfImages": 1
  }'
```

## 환경 변수

Cloud Run에서 자동 설정되는 환경 변수:

| 변수 | 값 | 설명 |
|-----|-------|-----|
| `PORT` | 8080 | 서버 포트 |
| `PROJECT_ID` | monkos | GCP 프로젝트 ID |
| `LOCATION` | us-central1 | Vertex AI 리전 |
| `GCS_BUCKET` | monk-ai-images | 이미지 저장 버킷 |

## 모니터링

### 로그 확인

```bash
# 실시간 로그
gcloud run services logs tail monk-image-engine --region us-central1

# 최근 로그
gcloud run services logs read monk-image-engine --region us-central1 --limit 50
```

### 메트릭 확인

Google Cloud Console > Cloud Run > monk-image-engine > 메트릭

## 문제 해결

### 1. 인증 실패

**문제:** `PERMISSION_DENIED` 에러

**해결:**
```bash
# 서비스 계정 권한 재확인
gcloud projects get-iam-policy monkos \
  --flatten="bindings[].members" \
  --filter="bindings.members:monk-image-engine@*"
```

### 2. 이미지 생성 실패

**문제:** `GENERATION_FAILED` 에러

**해결:**
- 프롬프트가 안전 필터에 걸리지 않는지 확인
- `safetyFilterLevel`을 조정 (예: `"block_few"`)
- Vertex AI 할당량 확인

### 3. GCS 저장 실패

**문제:** 이미지가 GCS에 저장되지 않음

**해결:**
```bash
# 버킷 존재 확인
gsutil ls gs://monk-ai-images

# 권한 확인
gsutil iam get gs://monk-ai-images
```

## 보안

- ADC를 사용하여 API 키 노출 방지
- Cloud Run의 서비스 계정으로 최소 권한 원칙 적용
- HTTPS 자동 적용 (Cloud Run 기본 제공)
- 요청 크기 제한 (10MB)

## 성능 최적화

### Cloud Run 설정

- **메모리:** 2Gi (이미지 처리용)
- **CPU:** 2 (병렬 처리)
- **동시성:** 80 (요청당 리소스 공유)
- **타임아웃:** 300초 (긴 생성 시간 대비)
- **최소 인스턴스:** 0 (비용 절감)
- **최대 인스턴스:** 10 (부하 분산)

## 비용 최적화

- Cold start 허용 (최소 인스턴스 0)
- 불필요한 GCS 저장 비활성화 (`saveToGcs: false`)
- 배치 생성으로 요청 수 감소
- 이미지 압축 (JPEG 95% 품질)

## 라이선스

MIT

## 지원

문제가 발생하면 [GitHub Issues](https://github.com/monk-kr/monk_project/issues)에 제보해주세요.
