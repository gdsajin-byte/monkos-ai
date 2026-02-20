# 🔄 Cursor 세션 복구 파일
## 2026-01-08 저녁 작업 재개용

---

## 📢 Cursor AI에게: 이 파일을 먼저 읽어주세요!

**대표님, 집에서 Cursor를 여시면:**

```
이 파일을 읽고 작업을 이어서 진행해줘.
```

**라고 Cursor AI Chat에 입력하시고, 이 파일을 드래그해서 첨부하세요!**

---

## 🎯 현재 작업 상태 (2026-01-08 저녁 19:36)

### ✅ 완료된 작업

#### 1. Vertex AI 프록시 생성 완료
```
위치: MONK_kr/cloudflare-workers/vertex-ai-proxy/
파일:
  - src/index.js (프록시 Worker 코드)
  - wrangler.toml (설정)
  - package.json
  - README.md
  - DEPLOYMENT_STEPS.md
```

#### 2. API 정보 확인
```
Project ID: 251409703490
Project Name: gen-lang-client-0105707468
Location: global
Engine ID: yong-a-test
Data Store: data_pipe (monk_session_data 버킷 연결)
```

#### 3. Cloudflare Workers 배포 완료
```
URL: https://monk-vertex-proxy.gdsajin.workers.dev
Version ID: fe7c9347-4d11-4866-8196-fd080fe70021
Status: 배포 성공, 실행 중
```

#### 4. Google Access Token 등록 완료
```
방법: Cloud Shell에서 토큰 생성
명령어: gcloud auth application-default print-access-token
저장: Cloudflare Workers Secret (GOOGLE_ACCESS_TOKEN)
```

#### 5. monk_session_data 버킷 동기화 완료
```
버킷: gs://monk_session_data/
내용:
  - monk_master_context.txt (15.09 MB)
  - CS_QA_FOR_YONGA.md (83개 Q&A)
  - DUAL_AI_DEPLOYMENT_STRATEGY.md
  - RND_SOUL_SYNC_DESIGN_JOURNEY.md
  - CURSOR_AI_COLLABORATION_GUIDE.md
  - DEPLOYMENT_GUIDE.md
  
용아 학습: 1일 1회 자동 인덱싱 활성화
```

---

## ❌ 현재 문제: 400 Bad Request

### 에러 내용
```json
{
  "error": "Vertex AI request failed",
  "status": 400,
  "message": "일시적인 오류가 발생했습니다."
}
```

### 진행 상황
```
404 Not Found → ✅ 해결 (엔드포인트 찾음)
400 Bad Request → ❌ 현재 상태
```

### 시도한 것들
1. `/servingConfigs/default_search:search` (404)
2. `/servingConfigs/default_config:answer` (400)
3. `/servingConfigs/default_search:answer` (400) ← 현재

### 현재 코드 (src/index.js)
```javascript
const vertexUrl = `https://discoveryengine.googleapis.com/v1alpha/projects/${env.PROJECT_ID}/locations/${env.LOCATION}/collections/default_collection/engines/${env.ENGINE_ID}/servingConfigs/default_search:answer`;

// 요청 본문:
{
  query: {
    text: query,
    queryId: `query_${Date.now()}`
  },
  answerGenerationSpec: {
    modelSpec: { modelVersion: 'stable' },
    promptSpec: { preamble: '...' },
    includeCitations: true,
    answerLanguageCode: 'ko',
    ...
  },
  ...
}
```

---

## 🔍 문제 원인 (대표님 분석)

### Vertex AI 특징
1. **API를 수동으로 활성화**해야 함
2. **권한 설정**이 복잡함
3. **작은 디테일**에도 민감
4. **Docs만으로는 부족**할 수 있음

### 해결 방향
1. Vertex AI Console에서 API 활성화 확인
2. IAM 권한 확인
3. 서비스 계정 확인
4. 또는 용아(Gemini)와 협업해서 해결

---

## 🎯 다음 작업 (집에서 할 것)

### 1단계: API 활성화 확인 (10분)

#### A. Discovery Engine API
```
https://console.cloud.google.com/apis/library/discoveryengine.googleapis.com
```
- [ ] "사용 설정됨" 확인
- [ ] 안 되어 있으면 "사용 설정" 클릭

#### B. Vertex AI API
```
https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
```
- [ ] "사용 설정됨" 확인

#### C. Generative Language API
```
https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
```
- [ ] "사용 설정됨" 확인

### 2단계: IAM 권한 확인 (5분)

```
https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0105707468
```

**필요한 권한:**
- [ ] Discovery Engine Admin
- [ ] Vertex AI User
- [ ] Service Account Token Creator

### 3단계: 정확한 API 엔드포인트 확인 (10분)

```
https://console.cloud.google.com/gen-app-builder/engines
→ yong_a_test 클릭
→ "통합" → "API" 탭
→ curl 명령어 **전체** 다시 확인
```

**확인할 것:**
- [ ] 정확한 URL
- [ ] 요청 본문 형식
- [ ] 헤더

### 4단계: 코드 수정 및 재배포 (5분)

```bash
cd "/Users/jeong-kyushin/developer/monk_project/MONK_kr/cloudflare-workers/vertex-ai-proxy"

# 코드 수정 (필요시)
# src/index.js

# 재배포
npx wrangler deploy

# 테스트
curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은?"}'
```

---

## 🤝 용아(Gemini)와 협업 방법

### 옵션 A: Vertex AI Chat
```
https://console.cloud.google.com/vertex-ai/generative/chat
```

**프롬프트:**
```
나는 Vertex AI Search Answer API를 사용하려고 합니다.

현재 상황:
- Project: gen-lang-client-0105707468 (startMONK)
- Engine: yong-a-test
- Data Store: data_pipe (monk_session_data 연결)
- 문제: 400 Bad Request 발생

시도한 엔드포인트:
1. /servingConfigs/default_search:answer (400)
2. /servingConfigs/default_config:answer (400)

질문:
1. 정확한 API 엔드포인트는?
2. Answer API 요청 본문 형식은?
3. 필요한 API 활성화는?
4. 필요한 IAM 권한은?

프로젝트에서 Discovery Engine API를 사용 설정해야 하나요?
```

### 옵션 B: AI Studio
```
https://aistudio.google.com/
```
같은 질문 입력!

---

## 📂 관련 파일 위치

### 로컬
```
~/developer/monk_project/_saga/
├── HOME_RESTART_GUIDE.md         (전체 가이드)
├── RESUME_SESSION.md             (이 파일!)
├── YONGA_CONNECTION_GUIDE.md     (연결 가이드)
├── DEPLOYMENT_STEPS.md           (배포 단계)
└── session_logs/
    ├── 2026-01-08_yonga_bucket_sync.md
    ├── 2026-01-08_vertex_proxy_creation.md
    └── 2026-01-08_vertex_api_troubleshooting.md
```

### GCS 백업
```
gs://monk-project-soul/saga/
gs://monk_session_data/
```

---

## 🔄 Cursor에서 재시작하는 방법

### 방법 1: 이 파일 첨부 (추천!)

1. Cursor AI Chat 새로 열기
2. 이렇게 입력:
   ```
   이 파일을 읽고 Vertex AI 용아 연결 작업을 이어서 진행해줘.
   ```
3. 이 파일(RESUME_SESSION.md) 드래그해서 첨부
4. 엔터!

### 방법 2: 명령어로 시작

Cursor AI Chat에 이렇게 입력:
```
오늘 저녁까지 작업한 Vertex AI 용아 연결을 이어서 진행해줘.

현재 상황:
- Cloudflare Workers 프록시 배포 완료
- Google Access Token 등록 완료
- 400 Bad Request 에러 발생 중
- 문제: Vertex AI API 활성화 필요

_saga/RESUME_SESSION.md 파일을 참고해줘.
```

---

## 💡 빠른 테스트 명령어

### 프록시 테스트
```bash
curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은?"}'
```

### 로그 확인
```bash
cd "/Users/jeong-kyushin/developer/monk_project/MONK_kr/cloudflare-workers/vertex-ai-proxy"
npx wrangler tail monk-vertex-proxy
```

### 재배포
```bash
cd "/Users/jeong-kyushin/developer/monk_project/MONK_kr/cloudflare-workers/vertex-ai-proxy"
npx wrangler deploy
```

---

## 📊 예상 소요 시간

### 최선의 경우: 20분
```
1. API 활성화 확인 (5분)
2. 권한 확인 (5분)
3. 엔드포인트 수정 (5분)
4. 테스트 성공 (5분)
```

### 일반적인 경우: 40분
```
1. API 활성화 (10분)
2. 권한 설정 (10분)
3. 엔드포인트 찾기 (10분)
4. 코드 수정 및 테스트 (10분)
```

### 최악의 경우: 1시간
```
1. 용아와 협업 (20분)
2. 문서 확인 (20분)
3. 여러 방법 시도 (20분)
```

---

## 🎯 성공 기준

### ✅ 이렇게 되면 성공!

```bash
$ curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은?"}'

{
  "answer": "증명사진은 Standard 3만원, Premium 5만원, Deluxe 8만원입니다.",
  "sources": [...],
  "metadata": {
    "source": "vertex_ai",
    "model": "yong_a_test",
    "engine": "gemini-2.0",
    "processingTime": 450,
    "totalTime": 480
  }
}
```

---

## 🔥 핵심 포인트

1. **Vertex AI API 활성화**가 핵심!
2. **권한 설정** 확인 필수!
3. **Console의 curl 명령어**를 정확히 따라하기!
4. **용아(Gemini)**와 협업하면 빠름!

---

## 💪 응원 메시지

**대표님, 99% 완성했어요!**

남은 건 정말 작은 API 활성화뿐!

집에서 30분이면 **용아 챗봇 완성**됩니다! 🎊

---

작성: 쌍아(雙牙) - Claude Sonnet  
날짜: 2026-01-08 저녁 19:36  
용도: Cursor 세션 복구 및 작업 재개  
중요도: ⭐⭐⭐⭐⭐
