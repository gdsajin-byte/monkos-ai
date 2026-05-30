---
type: order
date: 2026-05-25
from: iMac/쌍아
to: iMac/막내2
status: 대기
subject: CF Workers 통합 챗봇 엔진 구현 — Gemma 4 + D1 RAG + 채널 분기
portfolio: PF_CHATBOT
---

# 지시서: CF Workers 통합 챗봇 엔진 구현 — 챗봇 통합 Phase 2

## 배경

monk.kr(Gemma 3, 5/30 폐기) + monkos.ai(Gemini 2.0, 6/1 EOL) 챗봇을 CF Workers AI(Gemma 4 26B) + D1 단일 엔진으로 통합한다. 막내1이 동시에 D1 스키마/시딩을 구축 중.

## 선행 참조

반드시 먼저 읽을 것:
- `monkos-ops/ops/reports/2026-05/REPORT_20260525_막내2_챗봇통합_아키텍처설계.md` — 본인이 작성한 설계 보고서
- `functions/api/chat.js` — monk.kr 현행 챗봇 (변경 대상)
- `monkos_AI/portal/lib/chat-engine.js` — monkos.ai 현행 엔진 (호출 전환 대상)
- `monkos_AI/portal/lib/prompts.js` — 시스템 프롬프트 전체
- `wrangler.toml` — D1 바인딩 확인

## Task 1: `functions/api/chat.js` 통합 엔진으로 교체

현재 monk.kr 전용 → 전체 채널 대응 통합 엔진으로 확장.

### 1-1. 모델 교체

```
@cf/google/gemma-3-12b-it → @cf/google/gemma-4-26b-a4b-it
```

### 1-2. 채널 분기 + 시스템 프롬프트

요청 body에 `channel` 파라미터 추가. 채널별 설정:

| channel | 시스템 프롬프트 | temp | max_tokens | RAG | 비전 |
|---------|--------------|------|-----------|-----|------|
| `monk` | 몽크사진관 안내 (현행 chat.js 프롬프트 기반) | 0.7 | 300 | ✅ | ❌ |
| `web` | MONKOS AI KR 안내 (prompts.js SYSTEM_PROMPT_KR 기반) | 0.7 | 300 | ✅ | ❌ |
| `telegram` | CS 지원 (prompts.js CS_SYSTEM_PROMPT 기반) | 0.5 | 500 | ✅ | ❌ |
| `kakao` | MONKOS AI KR + 카카오 안내 | 0.7 | 300 | ✅ | ❌ |
| `idphoto-kr` | MONKOS AI KR | 0.7 | 300 | ✅ | ❌ |
| `idphoto-jp` | MONKOS AI JP (prompts.js SYSTEM_PROMPT_JP 기반) | 0.7 | 300 | ✅ | ❌ |
| `line` | MONKOS AI JP | 0.7 | 300 | ✅ | ❌ |
| `prep` | 촬영 준비 코치 (PREP_SYSTEM_PROMPT) | 0.6 | 400 | ✅ | ❌ |
| `coaching` | AI 코칭 (COACHING_INSTRUCTIONS) | 0.3 | 50 | ❌ | ✅ |

- channel 미지정 시 기본값: `monk` (monk.kr에서 호출하므로)
- 프롬프트는 코드 내장 (Git 추적). prompts.js 구조를 Workers로 이식.

### 1-3. 브랜드 구분 프롬프트 규칙

**monk 채널 프롬프트에 추가:**
```
[중요: 브랜드 구분]
당신은 몽크사진관(MONK STUDIO)의 어시스턴트입니다.
몽크사진관은 하남 미사에 위치한 오프라인 사진관입니다.
MONKOS AI는 몽크사진관이 개발한 온라인 AI 서비스입니다.
방문 촬영 질문 → 사진관 안내 (주소, 시간, 예약)
AI 증명사진 질문 → "온라인으로도 가능합니다" + monkos.ai 안내
절대로 몽크사진관을 AI 서비스로, MONKOS AI를 사진관으로 혼동하지 마세요.
```

**web/telegram/kakao 등 채널 프롬프트에 추가:**
```
[중요: 브랜드 구분]
당신은 MONKOS AI의 어시스턴트입니다.
MONKOS AI는 몽크사진관(MONK STUDIO)이 개발한 온라인 AI 증명사진 플랫폼입니다.
직접 촬영 질문 → "하남 미사에 사진관도 운영하고 있습니다" + monk.kr 안내
절대로 MONKOS AI를 사진관으로, 몽크사진관을 AI 서비스로 혼동하지 마세요.
```

### 1-4. D1 RAG 쿼리

막내1이 생성하는 D1 테이블 `rag_knowledge` + `rag_knowledge_fts` 사용.

```javascript
async function searchRAG(env, query, locale) {
  const results = await env.DB.prepare(`
    SELECT rk.id, rk.title, rk.content, rank
    FROM rag_knowledge_fts fts
    JOIN rag_knowledge rk ON fts.rowid = rk.rowid
    WHERE rag_knowledge_fts MATCH ?
      AND rk.is_active = 1
      AND rk.locale IN (?, 'multi')
    ORDER BY rank
    LIMIT 3
  `).bind(query, locale).all();
  return results.results || [];
}
```

규격 질문 감지 시 기존 D1 `documents` + `countries` 테이블 직접 쿼리:

```javascript
async function searchSpecs(env, countryQuery, typeQuery) {
  return await env.DB.prepare(`
    SELECT d.*, c.ko AS country_ko, c.en AS country_en, c.ja AS country_ja
    FROM documents d
    JOIN countries c ON d.country_id = c.id
    WHERE (c.ko LIKE ? OR c.en LIKE ? OR c.ja LIKE ?)
      AND (d.ko LIKE ? OR d.en LIKE ? OR d.type LIKE ?)
    LIMIT 5
  `).bind(
    `%${countryQuery}%`, `%${countryQuery}%`, `%${countryQuery}%`,
    `%${typeQuery}%`, `%${typeQuery}%`, `%${typeQuery}%`
  ).all();
}
```

### 1-5. D1 대화 로그

```javascript
async function logMessage(env, sessionId, channel, role, message) {
  await env.DB.prepare(`
    INSERT INTO chat_logs (session_id, channel, role, message)
    VALUES (?, ?, ?, ?)
  `).bind(sessionId, channel, role, message).run();
}

async function getHistory(env, sessionId, limit = 20) {
  const results = await env.DB.prepare(`
    SELECT role, message FROM chat_logs
    WHERE session_id = ?
    ORDER BY id DESC LIMIT ?
  `).bind(sessionId, limit).all();
  return (results.results || []).reverse();
}
```

### 1-6. CORS + 인증

```javascript
const ALLOWED_ORIGINS = [
  'https://monk.kr',
  'https://monkos.ai',
  'https://idphoto-kr.monkos.ai',
  'https://idphoto-jp.monkos.ai',
];

// monkos.ai(Cloud Run)에서 호출 시 API Key 검증
if (origin이 ALLOWED_ORIGINS 외부) {
  X-Chat-API-Key 헤더 검증 → env.CHAT_API_KEY와 비교
}
```

API Key는 `wrangler secret put CHAT_API_KEY`로 설정. 값은 작가님께 확인 필요 — placeholder 생성 금지 (헌법 4조 1항).

### 1-7. API 인터페이스

```
POST /api/chat

Request:
{
  "channel": "monk" | "web" | "telegram" | "kakao" | "idphoto-kr" | "idphoto-jp" | "line" | "prep" | "coaching",
  "sessionId": "string",
  "messages": [{ "role": "user", "content": "string" }],
  "image": "base64 (coaching 전용, optional)"
}

Response:
{
  "success": true,
  "response": "string"
}
```

기존 monk.kr 프론트(`MONK_kr/index.html`)와의 호환 유지. 현행은 `messages` 배열로 보내고 있으므로 동일 인터페이스.

## Task 2: monkos.ai 호출 전환

`monkos_AI/portal/lib/chat-engine.js`의 `chatWithMonkos()` 함수를 수정.

### 변경 전:
```javascript
const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    ...
});
```

### 변경 후:
```javascript
const CHAT_WORKERS_URL = process.env.CHAT_WORKERS_URL;
const CHAT_API_KEY = process.env.CHAT_API_KEY;

const response = await fetch(CHAT_WORKERS_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Chat-API-Key': CHAT_API_KEY,
  },
  body: JSON.stringify({
    channel,
    sessionId: chatId,
    messages: history.messages,
  }),
});
const data = await response.json();
return data.response;
```

- Firestore RAG 읽기 로직 제거 (`loadCsKnowledge`, `searchCsKnowledge` 호출 제거)
- Firestore 대화 로깅 → Workers 엔진이 D1로 처리하므로 Cloud Run 측 로깅 제거
- `lib/rag.js` 임포트 제거

### 환경변수 추가 (Cloud Run)

```
CHAT_WORKERS_URL=https://monk-kr.{account}.workers.dev/api/chat
CHAT_API_KEY=(작가님 설정)
```

**⚠️ 환경변수 값은 작가님께 확인 후 설정. 추측/생성 금지.**

## Task 3: coaching 채널 호환성 확인

현행 coaching 채널은 이미지를 `inlineData`로 전달:
```javascript
parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image } });
```

Gemma 4 26B가 Workers AI에서 비전 입력을 지원하는지 확인:
- 지원 O → 동일 구조로 구현
- 지원 X → coaching 채널만 Gemini 유지 (예외 처리) + 보고

## Task 4: wrangler.toml 확인 + 배포

- D1 바인딩 `DB = monk-db` 확인
- AI 바인딩 확인
- `wrangler pages deploy` 또는 `wrangler deploy` 실행
- **배포는 deploy.sh 경유 필수 (ch5 2조)**. deploy.sh가 없는 CF Pages는 wrangler 직접 허용.

## 산출물

1. `functions/api/chat.js` — 통합 챗봇 엔진 (Gemma 4 + D1 RAG + 채널 분기)
2. `monkos_AI/portal/lib/chat-engine.js` — Workers 호출로 전환
3. 배포 완료 확인
4. 완료 보고서: `monkos-ops/ops/reports/2026-05/REPORT_20260525_막내2_Workers챗봇엔진.md`

## ⚠️ 준수 조항
- 헌법 4조 1항: API Key, 비밀번호 생성/추측 금지. placeholder 금지. 모르면 질문.
- 헌법 4조 2항: `git push --force`, `rm -rf` 금지.
- 헌법 4조 3항: 시스템 프롬프트에 내부 기술명 노출 금지. "MONKOS AI"로만 표현.
- ch5 2조: Cloud Run 배포는 deploy.sh 경유 필수.
- ch7 3조: 지시서 범위 밖 작업 금지.
- 헌법 3조 2항: 완료 시 세션 로그 어펜드 + 커밋.

## 참조 파일
- `functions/api/chat.js` — 현행 monk.kr 챗봇
- `monkos_AI/portal/lib/chat-engine.js` — 현행 monkos.ai 엔진
- `monkos_AI/portal/lib/prompts.js` — 시스템 프롬프트 7종
- `monkos_AI/portal/lib/rag.js` — 현행 RAG (D1 전환으로 제거 대상)
- `wrangler.toml` — D1/AI 바인딩
- `MONK_kr/index.html` — monk.kr 프론트 (API 호환 확인)
- `monkos_AI/portal/public/js/chat.js` — monkos.ai 프론트 (API 호환 확인)
