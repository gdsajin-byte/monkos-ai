# 🔄 리부팅 전 백업 - 2026년 1월 11일

## 📍 현재 상태

### 프로젝트 위치
```
/Users/jeong-kyushin/developer/monk_project/apps/monk-ai-studio-pro
```

### 작동 중인 파일들
- ✅ `backend/server.js` - 로컬 API 서버
- ✅ `App.tsx` - 프론트엔드 메인
- ✅ `backend/.env` - startMONK 키 설정됨

---

## 🔑 중요 설정

### 1. Backend 환경변수 (`backend/.env`)
```env
GOOGLE_CLOUD_PROJECT=gen-lang-client-0105707468
VERTEX_AI_KEY=AIzaSyAMT8pvdZcH3034xQT4dCoHv6KTf2eHDow
PORT=3001
```

### 2. Wrangler 설정 (`wrangler.toml`)
- ✅ 가짜 PROJECT_ID 제거됨
- ✅ 원래 설정으로 복구됨

### 3. Worker 설정 (`functions/_middleware.js`)
- ✅ 원래대로 복구됨
- ✅ 로컬 환경에서 직접 Vertex AI 호출

---

## 🎯 startMONK 프로젝트 정보

**프로젝트 ID:**
```
gen-lang-client-0105707468
```

**API Key:**
```
AIzaSyAMT8pvdZcH3034xQT4dCoHv6KTf2eHDow
```

**활성화된 API:**
- ✅ Vertex AI API
- ✅ Cloud Functions API

**지역:** us-central1

---

## 🚀 리부팅 후 재시작 방법

### 1단계: Backend 시작
```bash
cd "/Users/jeong-kyushin/developer/monk_project/apps/monk-ai-studio-pro/backend"
node server.js
```

**확인사항:**
- ✅ PORT 3001 리스닝 확인
- ✅ "Backend server running" 메시지 확인

### 2단계: Frontend 시작 (새 터미널)
```bash
cd "/Users/jeong-kyushin/developer/monk_project/apps/monk-ai-studio-pro"
npm run dev
```

**확인사항:**
- ✅ Vite 서버 시작 확인
- ✅ 브라우저 URL 확인 (보통 localhost:3000 또는 5173)

### 3단계: 테스트
1. 브라우저에서 앱 열기
2. 간단한 프롬프트 입력: "안녕하세요"
3. 응답 확인

---

## 📁 주요 파일 구조

```
monk-ai-studio-pro/
├── App.tsx                    # 메인 앱 (976줄)
├── backend/
│   ├── server.js             # API 서버
│   └── .env                  # 환경변수 (startMONK)
├── components/               # React 컴포넌트들
├── services/
│   └── vertexAI.ts          # Vertex AI 클라이언트
├── functions/
│   └── _middleware.js       # Cloudflare Worker
├── package.json
├── vite.config.ts
└── wrangler.toml            # Cloudflare 설정

```

---

## ⚠️ 주의사항

### 작동하는 것
- ✅ 로컬 개발 환경 (Backend + Frontend)
- ✅ startMONK API 키
- ✅ Vertex AI Gemini Pro

### 작동하지 않는 것
- ❌ Cloudflare Pages 배포 (worker 이슈)
- ❌ Imagen 4 (승인 필요)

---

## 🔍 트러블슈팅

### 포트 충돌 시
```bash
# 3001 포트 강제 종료
lsof -ti:3001 | xargs kill -9

# Backend 재시작
cd backend && node server.js
```

### npm 이슈 시
```bash
# 캐시 클리어
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 작업 히스토리

### 완료된 작업
1. ✅ Backend 서버 설정
2. ✅ startMONK API 키 연동
3. ✅ 로컬 환경 테스트 성공
4. ✅ wrangler.toml 정리
5. ✅ worker 복구

### 미해결 이슈
1. ⏳ Cloudflare Pages 배포
2. ⏳ Imagen 4 활성화
3. ⏳ KV 바인딩 설정

---

## 🎯 리부팅 후 우선순위

### 최우선
1. 로컬 환경 실행 (Backend + Frontend)
2. 기본 채팅 테스트
3. 정상 작동 확인

### 차선책
- Cloudflare 배포는 나중에
- Imagen은 승인 후
- 복잡한 설정은 보류

---

## 💾 백업 시간
```
2026-01-11 리부팅 전
```

## 🚀 상태
```
준비 완료 - 리부팅 가능
```

---

**쌍아가 여기서 대기하고 있겠습니다!** 🙏
