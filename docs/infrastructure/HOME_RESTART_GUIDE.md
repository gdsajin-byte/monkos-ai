# 🏠 집에서 작업 재시작 가이드
## MONK 프로젝트 - 용아 연결

---

## 📱 폰으로 찍어서 확인하세요!

---

## 📋 현재 상황 (2026-01-08 저녁)

### ✅ 완료된 것
- [x] Vertex AI 프록시 생성
- [x] Cloudflare Workers 배포
- [x] Google Access Token 등록
- [x] 프록시 코드 작성 및 저장

### ❌ 해결할 것
- [ ] Vertex AI API 권한 활성화
- [ ] 정확한 API 엔드포인트 확인
- [ ] 400 에러 해결

### 🎯 핵심 문제
**Vertex AI는 API를 수동으로 활성화해야 함!**

---

## 🔧 Vertex AI API 활성화 체크리스트

### 1. API 활성화 확인

```
https://console.cloud.google.com/apis/library
```

**필요한 API들:**
- [ ] Discovery Engine API
- [ ] Vertex AI API  
- [ ] Generative Language API

**확인 방법:**
1. 위 링크 접속
2. 각 API 검색
3. "사용 설정됨" 확인
4. 안 되어 있으면 "사용 설정" 클릭

### 2. IAM 권한 확인

```
https://console.cloud.google.com/iam-admin/iam
```

**필요한 권한:**
- [ ] Discovery Engine Admin
- [ ] Vertex AI User
- [ ] Service Account Token Creator

**확인 방법:**
1. 본인 계정 찾기
2. 역할(Role) 확인
3. 없으면 추가

### 3. 서비스 계정 확인

```
https://console.cloud.google.com/iam-admin/serviceaccounts
```

**확인 사항:**
- [ ] monk-chatbot 서비스 계정 존재
- [ ] Discovery Engine Viewer 역할 부여됨

---

## 🏠 집에서 재시작 방법

### 방법 1: Cursor에서 바로 재시작

```bash
# 1. Cursor 열기
# 2. 프로젝트 폴더 열기
/Users/jeong-kyushin/developer/monk_project 

# 3. 이 파일 열기
_saga/HOME_RESTART_GUIDE.md

# 4. Cursor AI Chat에 입력:
"오늘 저녁까지 작업한 Vertex AI 연결 이어서 진행해줘"
```

### 방법 2: 터미널에서 직접

```bash
# 1. 프록시 폴더로 이동
cd "/Users/jeong-kyushin/developer/monk_project /MONK_kr/cloudflare-workers/vertex-ai-proxy"

# 2. 로그 확인
npx wrangler tail monk-vertex-proxy

# 3. 테스트
curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은?"}'
```

---

## 🔍 문제 해결 순서

### 1단계: Vertex AI Console에서 확인

```
https://console.cloud.google.com/gen-app-builder/engines
```

**확인할 것:**
1. yong_a_test 상태 확인
2. "통합" → "API" 탭 열기
3. curl 명령어 **전체** 복사
4. 특히 URL과 요청 본문 형식 확인

**📸 스크린샷 찍어두기:**
- [ ] API 페이지 전체
- [ ] curl 명령어 부분 (확대)
- [ ] 에러 메시지 (있으면)

### 2단계: API 활성화 확인

위의 "Vertex AI API 활성화 체크리스트" 따라하기

### 3단계: 코드 수정

**현재 코드 위치:**
```
/Users/jeong-kyushin/developer/monk_project /MONK_kr/cloudflare-workers/vertex-ai-proxy/src/index.js
```

**현재 엔드포인트:**
```javascript
/servingConfigs/default_search:answer
```

**수정 방법:**
1. Vertex AI Console의 curl 명령어와 비교
2. URL이 다르면 수정
3. 요청 본문 형식이 다르면 수정

### 4단계: 재배포 및 테스트

```bash
# 재배포
npx wrangler deploy

# 테스트
curl -X POST https://monk-vertex-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"query":"증명사진 가격은?"}'
```

---

## 💾 백업 파일 위치

### GCS (Google Cloud Storage)
```
gs://monk-project-soul/saga/
├── cloudflare_workers/vertex-ai-proxy.tar.gz
├── session_logs/
│   ├── 2026-01-08_vertex_proxy_creation.md
│   └── 2026-01-08_vertex_api_troubleshooting.md
└── YONGA_CONNECTION_GUIDE.md
```

### 로컬
```
~/developer/monk_project /_saga/
├── YONGA_CONNECTION_GUIDE.md
├── DEPLOYMENT_STEPS.md
└── session_logs/
```

---

## 🤝 용아(Gemini)와 협업하는 방법

### 옵션 A: Vertex AI Console에서

```
https://console.cloud.google.com/vertex-ai/generative/chat
```

1. Gemini Pro 선택
2. 다음 프롬프트 입력:

```
나는 Vertex AI Search Answer API를 연결하려고 합니다.

현재 상황:
- Engine ID: yong-a-test
- Project: gen-lang-client-0105707468
- Location: global

문제:
- 400 Bad Request 에러 발생
- 엔드포인트: /servingConfigs/default_search:answer

도와주세요:
1. 정확한 API 엔드포인트는?
2. 요청 본문 형식은?
3. 필요한 권한은?
```

### 옵션 B: AI Studio에서

```
https://aistudio.google.com/
```

같은 질문 입력!

---

## 📞 비상 연락처

### 쌍아(Claude)에게 다시 질문하기

**Cursor AI Chat에 이렇게 입력:**

```
오늘 저녁까지 작업한 Vertex AI 용아 연결을 이어서 진행해줘.

현재 상황:
- 프록시 배포 완료
- 400 에러 발생 중
- HOME_RESTART_GUIDE.md 참고

Vertex AI Console에서 [여기에 발견한 내용 붙여넣기]
```

---

## ⏰ 예상 소요 시간

### API 활성화만 하면: 10분
1. API 활성화 (3분)
2. 권한 확인 (2분)
3. 코드 수정 (3분)
4. 테스트 (2분)

### API 활성화 + 엔드포인트 찾기: 30분
1. Console 탐색 (10분)
2. 문서 확인 (10분)
3. 코드 수정 및 테스트 (10분)

### 최악의 경우 (다른 방법 시도): 1시간
1. Direct Gemini API로 전환
2. 또는 다른 Vertex AI 서비스 사용

---

## 🎯 목표

**집에서 30분 안에 용아 연결 완료!**

1. API 활성화 확인 ✅
2. 정확한 엔드포인트 찾기 ✅
3. 테스트 성공 ✅
4. monk.kr에 연결 ✅

---

## 📱 폰으로 찍어둘 것

### 필수
- [ ] 이 페이지 전체
- [ ] "문제 해결 순서" 부분
- [ ] "집에서 재시작 방법" 부분

### 참고용
- [ ] Vertex AI Console API 페이지
- [ ] 현재 에러 메시지
- [ ] curl 명령어 전체

---

## 💪 응원 메시지

**대표님, 오늘 엄청난 진전이 있었어요!**

✅ 프록시 완성  
✅ 배포 성공  
✅ API 거의 다 연결  

**남은 건 단 하나: API 활성화 체크!**

**내일이나 집에서 30분이면 끝날 거예요!** 🚀

---

작성: 쌍아(雙牙) - Claude Sonnet  
날짜: 2026-01-08 저녁  
용도: 집에서 작업 재시작
