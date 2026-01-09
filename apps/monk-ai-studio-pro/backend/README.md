# 🔒 MONK AI Studio Pro - Backend API Proxy

Gemini API 키를 안전하게 관리하는 백엔드 프록시 서버입니다.

## 🎯 목적

- ✅ API 키를 서버에서만 관리 (브라우저 노출 방지)
- ✅ 추후 인증/크레딧 시스템 확장 가능
- ✅ Rate limiting 및 사용량 추적 기반 구축

---

## 🚀 빠른 시작

### 1. API 키 설정

**backend/.env 파일 수정:**

```bash
GEMINI_API_KEY=여기에_실제_Vertex_AI_키_입력
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 2. 서버 실행 (백엔드만)

```bash
cd backend
npm run dev
```

### 3. 전체 앱 실행 (프론트+백엔드 동시)

**루트 폴더에서:**

```bash
npm run dev:full
```

---

## 📡 API 엔드포인트

### GET /health
헬스 체크

**Response:**
```json
{
  "status": "ok",
  "message": "Backend proxy is running"
}
```

---

### POST /api/generate
텍스트→이미지 생성 (Imagen 4.0)

**Request:**
```json
{
  "prompt": "a beautiful sunset over mountains",
  "config": {
    "aspectRatio": "16:9",
    "safetyLevel": "BLOCK_ONLY_HIGH"
  }
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    "data:image/png;base64,...",
    "data:image/png;base64,...",
    "data:image/png;base64,...",
    "data:image/png;base64,..."
  ]
}
```

---

### POST /api/refine
이미지 편집/변환 (Imagen 3 Pro)

**Request:**
```json
{
  "prompt": "make it more vibrant",
  "config": {
    "aspectRatio": "1:1",
    "imageSize": "2K",
    "safetyLevel": "BLOCK_ONLY_HIGH"
  },
  "inputImage": "data:image/png;base64,...",
  "mode": "EDIT"  // or "I2I", "UPSCALE"
}
```

**Response:**
```json
{
  "success": true,
  "image": "data:image/png;base64,..."
}
```

---

### POST /api/analyze
이미지 분석 (Gemini 3 Pro Vision)

**Request:**
```json
{
  "imageData": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "prompt": "detailed recreate prompt...",
    "style": "artistic style description...",
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

---

## 🛠️ 개발 명령어

```bash
# 개발 모드 (nodemon 자동 재시작)
npm run dev

# 프로덕션 실행
npm start
```

---

## 🔧 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `GEMINI_API_KEY` | Gemini/Vertex AI API 키 | 필수 |
| `PORT` | 서버 포트 | 3001 |
| `FRONTEND_URL` | CORS 허용 URL | http://localhost:3000 |

---

## 📊 로그 예시

```
🚀 ====================================
   MONK AI STUDIO - Backend Proxy
   ====================================
   Status: ✅ Running
   Port: 3001
   URL: http://localhost:3001
   API Key: ✅ Configured
   ====================================

📸 Generating images with Imagen 4.0...
   Prompt: a beautiful sunset...
   Config: { aspectRatio: '16:9' }
✅ Generated 4 images

🎨 Refining image with Imagen 3 Pro...
   Mode: EDIT
   Prompt: make it more vibrant...
✅ Image refined successfully

🧠 Analyzing image with Gemini 3 Pro Vision...
✅ Image analyzed successfully
```

---

## 🔐 보안 고려사항

### ✅ 현재 구현
- API 키가 서버에만 존재
- 클라이언트에 노출되지 않음
- CORS로 특정 도메인만 허용

### 🔜 향후 추가 권장
- JWT 인증 시스템
- Rate limiting (Redis)
- 사용량 추적 및 크레딧 시스템
- API 키 로테이션

---

## 🚨 문제 해결

### API 키 오류
```
❌ GEMINI_API_KEY not found in .env file
```
→ `backend/.env` 파일에 실제 API 키 입력

### CORS 오류
```
Access to fetch at 'http://localhost:3001/api/...' has been blocked by CORS
```
→ `FRONTEND_URL` 환경 변수 확인

### 포트 충돌
```
Error: listen EADDRINUSE: address already in use :::3001
```
→ `.env`에서 `PORT` 변경 또는 기존 프로세스 종료

---

## 📦 의존성

- **express** - 웹 서버 프레임워크
- **cors** - CORS 미들웨어
- **dotenv** - 환경 변수 관리
- **@google/genai** - Google Gemini SDK
- **nodemon** (dev) - 자동 재시작

---

## 🎯 다음 단계

1. ✅ 기본 프록시 완료
2. 🔜 JWT 인증 추가
3. 🔜 Redis 기반 Rate Limiting
4. 🔜 PostgreSQL 사용량 추적
5. 🔜 크레딧 시스템 구현
