# MONKOS Chat App 배포 가이드

> monkos.ai 챗봇 서비스 전체 구축 과정

## 개요

**프로젝트:** MONKOS Chat (Gemini 2.0 Flash 기반 AI 챗봇)
**배포일:** 2026-01-29 ~ 2026-01-30
**라이브 URL:** https://monkos.ai

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│  사용자                                                          │
│    │                                                             │
│    ▼                                                             │
│  [monkos.ai] ── Cloudflare Pages ── [Expo Web App]              │
│                                           │                      │
│                                           ▼                      │
│                                    [Firebase Auth]               │
│                                   (Anonymous Login)              │
│                                           │                      │
│                                           ▼                      │
│                              [Cloud Functions - chat]            │
│                              (monkos-3c6e4 프로젝트)              │
│                                           │                      │
│                                           ▼                      │
│                                [Vertex AI - monkos]              │
│                               (Gemini 2.0 Flash)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Firebase 프로젝트 셋업

### 1.1 프로젝트 구조 생성

```bash
# 디렉토리 생성
mkdir -p apps/MonkosChat/{functions,public}
mkdir -p apps/MonkosChatApp/src/{screens,components,services,config}
```

### 1.2 Firebase 설정 파일

**apps/MonkosChat/firebase.json:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "hosting": {
    "public": "public",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

**apps/MonkosChat/.firebaserc:**
```json
{
  "projects": {
    "default": "monkos-3c6e4"
  }
}
```

### 1.3 Cloud Functions (Vertex AI 연동)

**apps/MonkosChat/functions/index.js:**
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/vertexai');

admin.initializeApp();

// Vertex AI 클라이언트
const vertexAI = new VertexAI({
  project: 'monkos',
  location: 'us-central1',
});
const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });

// 채팅 API
exports.chat = functions.https.onRequest(async (req, res) => {
  // CORS 헤더
  res.set('Access-Control-Allow-Origin', '*');

  const { message, chatHistory } = req.body;

  // Vertex AI 호출
  const result = await model.generateContent({
    contents: chatHistory,
    systemInstruction: { parts: [{ text: "당신은 MONKOS AI입니다..." }] }
  });

  res.json({ response: result.response.candidates[0].content.parts[0].text });
});
```

### 1.4 Firebase CLI 배포

```bash
cd apps/MonkosChat

# Functions 배포
firebase deploy --only functions

# Firestore Rules 배포
firebase deploy --only firestore:rules

# Hosting 배포
firebase deploy --only hosting
```

---

## Phase 2: Expo 프론트엔드

### 2.1 프로젝트 생성

```bash
cd apps
npx create-expo-app MonkosChatApp --template blank
cd MonkosChatApp
npm install @react-navigation/native @react-navigation/stack
npm install firebase
```

### 2.2 주요 파일

**src/screens/ChatScreen.js:** 채팅 인터페이스
**src/components/ChatBubble.js:** 메시지 버블
**src/services/vertexAI.js:** Cloud Functions 호출
**src/config/firebase.js:** Firebase 설정

### 2.3 Web Export

```bash
# Expo web export
npx expo export --platform web

# 출력: dist/ 디렉토리
```

---

## Phase 3: Cloudflare Pages 배포

### 3.1 별도 레포 생성

```bash
# monkos-ai 레포 생성 (GitHub)
# apps/MonkosChatApp 내용을 복사
```

### 3.2 Cloudflare Pages 설정

1. Cloudflare Dashboard → Pages → Create Project
2. Git 연결: `gdsajin-byte/monkos-ai`
3. Build 설정:
   - Build command: `npx expo export --platform web`
   - Output directory: `dist`
4. Deploy

### 3.3 커스텀 도메인

1. Cloudflare Pages → Custom domains
2. `monkos.ai` 추가
3. DNS 자동 설정됨

**결과:**
- Preview: https://monkos-ai.pages.dev
- Production: https://monkos.ai

---

## Phase 4: Firebase 권한 설정

### 4.1 Firebase Auth 도메인 추가

Firebase Console → Authentication → Settings → Authorized domains

추가된 도메인:
- `monkos.ai`
- `monkos-ai.pages.dev`

### 4.2 Vertex AI 권한

Cloud Functions 서비스 계정에 Vertex AI 권한 부여:

```bash
gcloud projects add-iam-policy-binding monkos \
  --member="serviceAccount:monkos-3c6e4@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

---

## Phase 5: 버그 수정

### 5.1 chatHistory 포맷 호환성

**문제:** 프론트엔드와 백엔드의 chatHistory 포맷 불일치

**수정 (functions/index.js):**
```javascript
// 프론트엔드 포맷: { role, text }
// Vertex AI 포맷: { role, parts: [{ text }] }

const formattedHistory = chatHistory.map(msg => ({
  role: msg.role,
  parts: msg.parts || [{ text: msg.text || msg.content }]
}));
```

---

## 최종 파일 구조

```
apps/
├── MonkosChat/              # Firebase 백엔드
│   ├── functions/
│   │   ├── index.js         # Cloud Functions (Vertex AI)
│   │   ├── package.json
│   │   └── .env             # 환경변수
│   ├── public/
│   │   └── index.html       # 임시 랜딩페이지
│   ├── firebase.json
│   ├── .firebaserc
│   ├── firestore.rules
│   └── storage.rules
│
└── MonkosChatApp/           # Expo 프론트엔드
    ├── App.js
    ├── src/
    │   ├── screens/
    │   │   ├── HomeScreen.js
    │   │   └── ChatScreen.js
    │   ├── components/
    │   │   └── ChatBubble.js
    │   ├── services/
    │   │   ├── vertexAI.js
    │   │   ├── chatService.js
    │   │   └── authService.js
    │   └── config/
    │       └── firebase.js
    ├── dist/                # Web export 결과
    └── .env
```

---

## 라이브 서비스 URL

| 서비스 | URL | 용도 |
|--------|-----|------|
| Production | https://monkos.ai | 사용자 접속 |
| Preview | https://monkos-ai.pages.dev | 테스트 |
| Firebase Hosting | https://monkos-3c6e4.web.app | 레거시 |
| Cloud Functions | us-central1 | API 백엔드 |
| Firestore | (default) | 채팅 기록 |

---

## 트러블슈팅

### CORS 에러

```javascript
// functions/index.js
res.set('Access-Control-Allow-Origin', '*');
res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.set('Access-Control-Allow-Headers', 'Content-Type');

if (req.method === 'OPTIONS') {
  return res.status(204).send('');
}
```

### Vertex AI 권한 에러

```bash
# 서비스 계정에 권한 부여
gcloud projects add-iam-policy-binding monkos \
  --member="serviceAccount:monkos-3c6e4@appspot.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Firebase Auth 도메인 에러

Firebase Console에서 Authorized domains에 배포 도메인 추가 필요

---

## 관련 문서

- [세션 로그 20260129](../corpus/sessions/2026-01/20260129_session.md)
- [세션 로그 20260130](../corpus/sessions/2026-01/20260130_session.md)
- [3-Track 시스템 아키텍처](./3TRACK_SYSTEM_ARCHITECTURE.md)

---

*작성: 2026-01-30*
*담당: 쌍아 (Claude Code CLI, Opus 4.5)*
