# 지시서: photolab 엔진 서버 생성 (빌드만, 배포 대기)

```
[2026-02-21 05:50 KST] M1/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | photolab 엔진 서버 신규 생성 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/engine/` (신규) |
| **브랜치** | `develop` |
| **배포** | **하지 않는다. 빌드만 하고 대기.** |
| **목적** | MPA photolab의 API 백엔드. photolab과 한 묶음으로 관리 |

## 0원칙

> **monkos_AI/ 수정 금지.**
> **monk.js 수정 금지.**
> API 키 하드코딩 금지.
> photolab 프론트 파일(camera.js, shared.js 등) 수정 금지 — 막내2가 별도 작업 중.

---

## 배경

MPA photolab(monk.kr)의 API 백엔드가 필요하다. CF Pages Functions 배포 문제로 Cloud Run 엔진을 병렬 검토 중 (막내2가 CF Functions 수정 동시 진행).

엔진은 photolab의 일부다. `photolab/engine/`에 만들어서 나중에 monkos.ai로 갈 때 photolab 통째로 이동.

### 참조할 기존 코드 (읽기만)
- `functions/api/idphoto-coaching.js` — 코칭 프롬프트 + 9필드 빌더
- `functions/api/precheck.js` — 사전분석 프롬프트
- `functions/api/idgen.js` — 생성 로직
- `functions/api/qc.js` — QC 프롬프트

---

## Task 1: 구조 생성

```
MONK_kr/ai_lab/photolab/engine/
├── server.js
├── package.json
├── Dockerfile
└── .dockerignore
```

### package.json
```json
{
  "name": "photolab-engine",
  "type": "module",
  "version": "1.0.0",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "express": "^4.18.0",
    "@google/genai": "latest",
    "cors": "^2.8.5"
  }
}
```

### Dockerfile
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

---

## Task 2: server.js — 4개 API + health

### 골격
```js
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Vertex AI ADC
const ai = new GoogleGenAI({ vertexai: true, project: 'monkos', location: 'us-central1' });

// Imagen — API Key 방식 (환경변수)
const imagenAI = process.env.IMAGEN_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.IMAGEN_API_KEY })
  : null;

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`photolab-engine :${PORT}`));
```

### 2-1. POST /api/coaching
- 모델: `gemini-2.5-flash`
- 입력: `{ image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression }`
- 출력: `{ text, ready }`
- 프롬프트: `functions/api/idphoto-coaching.js`의 `COACHING_INSTRUCTIONS` + `buildCoachingPrompt()` 복사
- ready 판정: READY_KEYWORDS 서버사이드
- `temperature: 0.3`, `maxOutputTokens: 50`

### 2-2. POST /api/precheck
- 모델: `gemini-2.5-flash`
- 입력: `{ image }`
- 출력: `{ suitable, score, face_detected, issues, suggestion }`
- 프롬프트: `functions/api/precheck.js`의 `PRECHECK_PROMPT` 복사
- `responseMimeType: 'application/json'`, `temperature: 0.2`

### 2-3. POST /api/generate
- 모델: Imagen (`gemini-3-pro-image-preview`) — `imagenAI` 사용
- 입력/출력: `functions/api/idgen.js` 참조
- IMAGEN_API_KEY 없으면 501 반환

### 2-4. POST /api/qc
- 모델: `gemini-2.5-flash`
- 입력: `{ original, generated, style }`
- 출력: `{ pass, score, issues, suggestion }`
- 프롬프트: `functions/api/qc.js` 참조
- `responseMimeType: 'application/json'`, `temperature: 0.2`

### 2-5. GET /health
```js
app.get('/health', (req, res) => {
  res.json({ service: 'photolab-engine', status: 'ok', model: 'gemini-2.5-flash' });
});
```

---

## Task 3: 로컬 테스트

```bash
cd MONK_kr/ai_lab/photolab/engine
npm install
node server.js
curl http://localhost:8080/health
```

---

## Task 4: 커밋 (배포 안 함)

```bash
git add MONK_kr/ai_lab/photolab/engine/
git commit -m "[feature] photolab/engine — Cloud Run API 서버 초기 구조"
git push origin develop
```

**배포하지 않는다.**

---

## 수정 가능 파일

| 경로 | 허용 |
|------|------|
| `MONK_kr/ai_lab/photolab/engine/*` | 신규 생성 전체 |

**수정 금지**: `monkos_AI/`, `functions/`, `monk.js`, photolab 프론트 파일 전체

---

## 완료 조건

### Level 1 (필수)
- [ ] `photolab/engine/` 생성
- [ ] server.js — 5개 엔드포인트 (coaching, precheck, generate, qc, health)
- [ ] package.json + Dockerfile
- [ ] `npm install` + `node server.js` 기동 확인
- [ ] `/health` 응답 확인
- [ ] Git 커밋

### Level 2 (권장)
- [ ] coaching에 테스트 이미지 → 텍스트 응답 확인
- [ ] 프롬프트가 기존 CF Functions와 일치 확인

### 배포는 하지 않는다

---

## 참조
- 프롬프트 원본: `functions/api/` (coaching, precheck, idgen, qc)
- Vertex AI 프로젝트: `monkos`, 리전: `us-central1`
