# 🔧 Vertex AI API 문제 해결 중
## 2026-01-08 오후 세션

---

## 진행 상황

### ✅ 완료
1. Vertex AI 프록시 생성
2. API 정보 확인 (Project ID, Engine ID)
3. Cloudflare Workers 배포
4. Access Token 등록

### ❌ 현재 문제
- 404 → 400으로 진행 (엔드포인트는 찾음)
- 400 Bad Request: 요청 형식 문제

### 🔍 시도한 것들
1. `/servingConfigs/default_search:search` (404)
2. `/servingConfigs/default_config:answer` (400)
3. `/servingConfigs/default_search:answer` (400)

---

## 다음 단계

### 옵션 A: Console curl 명령어 정확히 복사
- Google Cloud Console API 페이지의 curl 명령어를 그대로 사용
- 요청 본문 형식 정확히 따라하기

### 옵션 B: 다른 API 사용
- Vertex AI Conversation API
- 또는 Direct LLM API (Gemini)

### 옵션 C: 임시 우회
- 일단 Llama 버전으로 서비스 유지
- Vertex AI 연결은 별도 시간에 완성

---

작성: 쌍아(雙牙)  
날짜: 2026-01-08  
상태: 진행 중
