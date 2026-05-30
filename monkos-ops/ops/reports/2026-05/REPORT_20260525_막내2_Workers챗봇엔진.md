---
type: completion
date: 2026-05-25
device: iMac
agent: 막내2
subject: CF Workers 통합 챗봇 엔진 구현 완료
---

# 완료 보고: CF Workers 통합 챗봇 엔진

> **[2026-05-25 14:08 KST] iMac/막내2 → 작가님**
> 지시서: `ORDER_20260525_iMac쌍아_막내2_Workers챗봇엔진_구현.md`

---

## ✅ Task 1: `functions/api/chat.js` 통합 엔진 구현

### 변경 파일
- `functions/api/chat.js` — 전면 재작성 (110줄 → 284줄)
- `functions/api/_lib/prompts.js` — 신규 생성 (시스템 프롬프트 9채널 + 코칭 빌더)

### 구현 내용
| 항목 | 상태 |
|------|------|
| Gemma 3 → Gemma 4 26B 모델 교체 | ✅ |
| 9채널 분기 (monk/web/telegram/kakao/idphoto-kr/idphoto-jp/line/prep/coaching) | ✅ |
| 채널별 시스템 프롬프트 이식 (prompts.js → _lib/prompts.js) | ✅ |
| 브랜드 구분 프롬프트 (monk vs MONKOS) | ✅ |
| D1 FTS5 RAG 검색 + 키워드 폴백 | ✅ |
| D1 규격 검색 (countries + documents 테이블) | ✅ |
| D1 대화 로그 (chat_logs 테이블) | ✅ |
| D1 히스토리 복원 | ✅ |
| CORS (monk.kr, monkos.ai, idphoto-*.monkos.ai) | ✅ |
| API Key 인증 (X-Chat-API-Key 헤더) | ✅ |
| 코칭 채널 비전 입력 (data URI 형식) | ✅ |
| monk.kr 프론트 호환 (messages 배열 → response 필드) | ✅ |

### API 인터페이스

**monk.kr 호환 (기존):**
```
POST /api/chat
{ "messages": [{ "role": "user", "content": "..." }] }
→ { "success": true, "response": "..." }
```

**통합 API (Cloud Run 등 외부 호출):**
```
POST /api/chat
Headers: X-Chat-API-Key: {key}
{ "channel": "web", "sessionId": "...", "message": "..." }
→ { "success": true, "response": "...", "reply": "...", "sessionId": "..." }
```

## ✅ Task 2: monkos.ai 호출 전환

### 변경 파일
- `monkos_AI/portal/lib/chat-engine.js` — Workers 호출로 전환 (284줄 → 91줄)
- `monkos_AI/portal/lib/coaching.js` — prompts.js 의존 제거, Workers 경유로 전환

### 변경 사항
- Vertex AI (Gemini 2.0/2.5 Flash) 호출 → Workers HTTPS fetch
- Firestore RAG 읽기 (`loadCsKnowledge`, `searchCsKnowledge`) 제거
- `rag.js` import 제거
- `prompts.js` import 제거 (coaching.js)
- 인메모리 히스토리 (Map) 제거 → D1 히스토리로 전환
- Firestore 대화 로깅 제거 → D1 chat_logs로 전환
- `logCsConversation` 유지 (텔레그램 CS 전용 — telegram.js에서 사용)

## ✅ Task 3: coaching 채널 비전 호환성

- Workers AI Gemma 4는 `image` 파라미터로 비전 입력 지원 (data URI 형식)
- Gemini `inlineData` → Workers AI `image` 변환 구현 완료
- `buildCoachingPrompt` 함수를 Workers 측 `_lib/prompts.js`에 이식
- READY_KEYWORDS 판정 로직도 Workers 측에서 처리 (`ready` 필드 반환)

## ✅ Task 4: wrangler.toml 확인

```toml
[ai]
binding = "AI"      # → env.AI ✅

[[d1_databases]]
binding = "DB"       # → env.DB ✅
database_name = "monk-db"
```

## ⏳ 배포 전 필요 사항

### 1. D1 마이그레이션 실행 (막내1 담당)
```bash
wrangler d1 execute monk-db --file=migrations/chatbot_schema.sql
```
`rag_knowledge`, `rag_knowledge_fts`, `chat_logs` 테이블이 D1에 존재해야 함.

### 2. API Key 설정 (작가님 필요)
```bash
# CF Pages secret
wrangler pages secret put CHAT_API_KEY

# Cloud Run 환경변수
CHAT_WORKERS_URL=https://monk.kr/api/chat
CHAT_API_KEY=(동일 값)
```

### 3. 배포 순서
1. **monk.kr (CF Pages)** 먼저 배포 → Workers 엔진 활성화
2. **monkos.ai (Cloud Run)** 이후 배포 → Workers 호출 전환
   - deploy.sh 경유 필수 (ch5 2조)

## ❌ 미완료
- 배포 실행: API Key 설정 + D1 마이그레이션 선행 필요
- `rag.js` 파일 삭제: chat-engine.js에서 import 제거 완료. 파일 자체는 다른 곳에서 참조하지 않으나, 삭제는 작가님 승인 후.

## 💡 참고
- `prompts.js` (monkos_AI/portal/lib/)는 삭제하지 않음 — coaching.js 외 다른 파일에서 import 가능성 있으므로 보존
- Workers 측 `_lib/prompts.js`가 정본. 프롬프트 변경 시 이 파일만 수정
- 향후 `prompts.js` (Cloud Run) 정리는 별도 지시서로

## 📁 산출물
| 파일 | 변경 |
|------|------|
| `functions/api/chat.js` | 전면 재작성 |
| `functions/api/_lib/prompts.js` | 신규 |
| `monkos_AI/portal/lib/chat-engine.js` | Workers 호출 전환 |
| `monkos_AI/portal/lib/coaching.js` | prompts.js 의존 제거 |
