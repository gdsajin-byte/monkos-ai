# IMAGEN 3 I2I Test App

## 🎯 목적
MONKOS 이미지 프로에서 검증된 `gemini-3-pro-image-preview` 모델의 I2I 기능을 
독립적으로 테스트하기 위한 앱입니다.

## 🔧 핵심 기술

| 항목 | 설정 |
|------|------|
| **모델** | `gemini-3-pro-image-preview` |
| **Safety** | `BLOCK_NONE` (최소 제한) |
| **SDK** | `@google/genai` |
| **Identity** | CRITICAL INSTRUCTION 프롬프트 |

## 🚀 실행 방법

### 1. 환경 설정
```bash
cd apps/imagen3
cp backend/.env.example backend/.env
# .env 파일에 GEMINI_API_KEY 입력
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 서버 실행
```bash
# 백엔드만
npm run dev:backend

# 또는 프론트+백엔드 동시
npm run dev
```

### 4. 접속
- Frontend: http://localhost:3002
- Backend: http://localhost:3003

## 📡 API Endpoints

### POST /api/i2i
이미지 변환 (Identity Preservation 적용)

```json
{
  "inputImage": "data:image/png;base64,...",
  "prompt": "추가 지시사항",
  "style": "id_photo | profile | suit | casual",
  "aspectRatio": "3:4",
  "preserveIdentity": true
}
```

### POST /api/t2i
텍스트-이미지 생성 (Imagen 4.0)

```json
{
  "prompt": "생성 프롬프트",
  "aspectRatio": "1:1",
  "numberOfImages": 4
}
```

## 🔑 Identity Preservation 프롬프트

```
CRITICAL INSTRUCTION: Maintain the exact facial features, 
body proportions, skin tone, facial structure, eye shape, 
nose, lips, and overall model identity. Preserve the person's 
unique characteristics completely and precisely.
```

## 📁 폴더 구조

```
imagen3/
├── backend/
│   ├── server.js      # Express 서버
│   └── .env           # API 키 (gitignore)
├── index.html         # 테스트 UI
├── package.json
├── vite.config.ts
└── README.md
```

## ⚠️ 주의사항

- `.env` 파일은 절대 커밋하지 마세요
- GEMINI_API_KEY는 Google AI Studio에서 발급
- MONKOS 로직을 수정하지 마세요 (참조용)

---

© 2026 MONK AI LAB
