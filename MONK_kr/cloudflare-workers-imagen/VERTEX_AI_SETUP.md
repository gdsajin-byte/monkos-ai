# Vertex AI 전환 가이드

## 📋 개요

**문제**: 현재 Worker가 Google AI Studio API(무료 티어)를 사용하여 70컷 이후 500 에러 발생
**해결**: Vertex AI Developer Premier 구독($300/년)을 활용하여 quota 제한 해결

---

## 🔍 500 에러 원인 분석

### 현재 상태 (index.js)
```javascript
// Line 84: Google AI Studio API (FREE TIER)
const imagenResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${env.GEMINI_API_KEY}`,
  ...
);
```

**문제점**:
- Google AI Studio API는 무료 티어 (시간당/일일 제한)
- 약 70개 요청 후 500 에러 발생
- Rate Limiting으로 연속 요청 차단

### 해결 방안 (index-vertex.js)
```javascript
// Vertex AI API (PAID SUBSCRIPTION)
const vertexEndpoint = `https://${env.GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${env.GCP_PROJECT_ID}/locations/${env.GCP_LOCATION}/publishers/google/models/imagegeneration@006:predict`;

const imagenResponse = await fetch(vertexEndpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  ...
});
```

**장점**:
- Developer Premier 구독 quota 활용
- 시간당 수천 건 이상 요청 가능
- 안정적인 대량 생성 지원

---

## 🚀 Vertex AI 설정 방법

### 1. GCP Service Account 생성

```bash
# GCP 프로젝트 ID 확인
gcloud config get-value project

# Service Account 생성
gcloud iam service-accounts create monk-imagen-worker \
  --display-name="MONK Imagen Cloudflare Worker"

# Vertex AI 권한 부여
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:monk-imagen-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 키 파일 생성
gcloud iam service-accounts keys create monk-service-account.json \
  --iam-account=monk-imagen-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 2. Service Account JSON을 Base64로 인코딩

**Windows (PowerShell)**:
```powershell
$json = Get-Content monk-service-account.json -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
Write-Host "Base64 인코딩 완료! 클립보드에 복사되었습니다."
```

**Mac/Linux**:
```bash
base64 -i monk-service-account.json | pbcopy
echo "Base64 인코딩 완료! 클립보드에 복사되었습니다."
```

### 3. Cloudflare Dashboard에서 환경 변수 설정

1. Cloudflare Dashboard 접속
2. Workers & Pages → monk-imagen-proxy 선택
3. Settings → Variables → Environment Variables
4. 다음 변수 추가:

| 변수명 | 값 | 예시 |
|--------|-----|------|
| `GCP_PROJECT_ID` | GCP 프로젝트 ID | `monk-kr-production` |
| `GCP_LOCATION` | 리전 | `us-central1` |
| `GCP_SERVICE_ACCOUNT_KEY` | Base64 인코딩된 JSON | `eyJhbGciOiJSUzI1...` |
| `GEMINI_API_KEY` | 기존 Gemini API Key (프롬프트 개선용) | `AIzaSy...` |

**주의**: `GCP_SERVICE_ACCOUNT_KEY`는 **Encrypt** 옵션 활성화!

### 4. Worker 코드 교체

**방법 1: 기존 파일 교체**
```bash
cd MONK_kr/cloudflare-workers-imagen/src
cp index.js index-google-ai-studio.js.bak
cp index-vertex.js index.js
```

**방법 2: wrangler.toml 수정**
```toml
name = "monk-imagen-proxy"
main = "src/index-vertex.js"  # 변경
compatibility_date = "2024-01-01"

[env.production]
vars = { GCP_LOCATION = "us-central1" }
```

### 5. 배포 및 테스트

```bash
# Cloudflare Workers에 배포
wrangler deploy

# 테스트 요청
curl -X POST https://monk-imagen-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "23-year-old Korean female fashion model",
    "aspectRatio": "9:16",
    "style": "realistic"
  }'
```

**성공 응답 확인**:
```json
{
  "imageUrl": "data:image/png;base64,...",
  "api": "vertex-ai",
  "timestamp": "2026-01-25T..."
}
```

---

## 📊 Quota 비교

| API | 시간당 제한 | 일일 제한 | 비용 |
|-----|------------|----------|------|
| **Google AI Studio** (현재) | ~60-100 | ~500-1000 | 무료 |
| **Vertex AI Premier** (전환 후) | 10,000+ | 100,000+ | $300/년 |

**예상 효과**:
- 100컷 생성: 15분 → **에러 없이 완료**
- 500컷 생성: 가능
- 밤샘 대량 생성: 안정적

---

## 🔧 문제 해결

### 인증 오류 (401 Unauthorized)
```
원인: Service Account 권한 부족
해결: roles/aiplatform.user 역할 부여 확인
```

### JWT 생성 실패
```
원인: Service Account JSON 형식 오류
해결: Base64 인코딩 재확인, 공백 제거
```

### 엔드포인트 404
```
원인: GCP_LOCATION 또는 PROJECT_ID 오류
해결: gcloud config get-value project로 확인
```

---

## 🎯 다음 단계

1. ✅ Service Account 생성 및 Base64 인코딩
2. ✅ Cloudflare Dashboard 환경 변수 설정
3. ✅ Worker 코드 교체 (index-vertex.js → index.js)
4. ✅ 배포 및 테스트
5. ⏳ 100컷 재생성 테스트
6. ⏳ i2i 엔드포인트 추가

---

## 📌 임시 해결책 (Vertex AI 전환 전)

Vertex AI 설정이 완료되기 전까지 임시 해결책:

### 1. 배치 크기 축소
```powershell
# scripts/factory/workers/imagen_batch_generator.ps1
param(
    [int]$Count = 50,  # 100 → 50으로 축소
    ...
)
```

### 2. 대기 시간 증가
```powershell
# Line 150 근처
Start-Sleep -Seconds 10  # 3초 → 10초
```

### 3. 자동 재시도 (1시간 후)
```powershell
# 실패 시 1시간 대기 후 재시도
if ($failCount -gt 20) {
    Write-Host "⏳ Rate Limiting 감지, 1시간 후 재시도..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3600
}
```

---

**작성**: 쌍아 (Claude Code CLI)
**날짜**: 2026-01-25
**목적**: 500 에러 해결 및 Vertex AI Developer Premier 구독 활용
