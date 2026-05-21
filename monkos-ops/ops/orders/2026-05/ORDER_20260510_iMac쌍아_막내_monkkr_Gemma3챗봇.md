---
type: order
date: 2026-05-10
from: iMac/쌍아
to: iMac/막내
subject: monk.kr 챗봇 Workers AI(Gemma 3 12B) 전환 — 외부 프록시 제거, CF 완전 내재화
status: 대기
portfolio: PF_CHATBOT
---

# 지시서: monk.kr 챗봇 Workers AI(Gemma 3 12B) 전환

> **[2026-05-10 14:14 KST]** iMac/쌍아 → iMac/막내

---

## 배경

monk.kr(CF Pages)에 이미 챗봇 UI가 있다. 현재는 외부 Workers 프록시(`monk-gemini-proxy.gdsajin.workers.dev`)를 경유해 Gemini 2.0 Flash를 호출하는 구조.

Workers AI 전 모델 실측에서 **Gemma 3 12B가 Gemini를 능가**(가중총점 4.55 vs 4.40, 가드레일 만점, 비용 -94%)했다. monk.kr이 CF Pages이므로 **Workers AI를 직접 바인딩**하면 외부 프록시 없이 CF 내에서 완결된다.

```
현재:  monk.kr → 외부 Workers 프록시 → Gemini API (외부)
변경:  monk.kr → functions/api/chat.js → Workers AI Gemma 3 12B (CF 내부)
```

### 선행 참조

| 문서 | 핵심 |
|------|------|
| `REPORT_20260510_막내_WorkersAI_전모델실측.md` | Gemma 3 12B 실측 결과 |
| `MONK_kr/index.html` 327~442행 | 현행 챗봇 JS 로직 |
| `functions/api/translate.js` | 기존 CF Pages Function 패턴 참조 |
| `wrangler.toml` | Pages 설정 |
| `monkos_AI/portal/lib/prompts.js` | SYSTEM_PROMPT_KR (시스템 프롬프트) |

---

## 지시 사항

### 1단계: Workers AI 바인딩 설정

`wrangler.toml`에 AI 바인딩 추가:

```toml
name = "monk-kr"
pages_build_output_dir = "MONK_kr"
compatibility_date = "2026-01-02"

[ai]
binding = "AI"
```

### 2단계: chat.js Pages Function 생성

`functions/api/chat.js` 신규 생성. 기존 `translate.js` 패턴 준용.

**핵심 요구사항**:

1. **시스템 프롬프트**: `prompts.js`의 SYSTEM_PROMPT_KR 핵심을 내장 (monk.kr용 경량 버전)
2. **모델**: `@cf/google/gemma-3-12b-it`
3. **파라미터**: temperature 0.7, max_tokens 300
4. **대화 히스토리**: 프론트엔드에서 messages 배열로 전달받아 멀티턴 지원
5. **CORS**: 기존 translate.js 패턴 동일
6. **에러 처리**: AI 바인딩 없을 때 친절한 에러

```javascript
// functions/api/chat.js — 구조 가이드
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // env.AI — wrangler.toml [ai] 바인딩
  // 시스템 프롬프트 내장
  // messages 배열 수신 → AI.run() 호출 → 응답 반환
}
```

**시스템 프롬프트 (monk.kr용 경량 버전)**:

prompts.js의 SYSTEM_PROMPT_KR에서 핵심만 추출:
- MONKOS AI 증명사진 서비스 안내 역할
- 가격/크레딧 체계 (PRICING.KR 데이터)
- "되는 것만 응답" 원칙
- 범위 밖 질문 거절
- 한국어 응답 필수
- 3문 이내 간결 응답

### 3단계: 프론트엔드 수정

`MONK_kr/index.html` 수정:

1. `GEMINI_API_URL` → `/api/chat` (로컬 Pages Function)
2. `sendLLMMessage()` — body 구조를 messages 배열로 변경
3. `checkLLMConnection()` — `/api/chat`에 OPTIONS 또는 GET health check
4. 히스토리 관리 — 대화 내역을 messages 배열로 유지 (최대 10턴)

```javascript
// 변경 핵심
const CHAT_API = '/api/chat';  // 외부 프록시 → 로컬 function

async function sendLLMMessage() {
  // messages 배열 구성
  const messages = [
    // 히스토리 (최근 10턴)
    ...chatHistory,
    { role: "user", content: message }
  ];
  
  const response = await fetch(CHAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  
  const data = await response.json();
  // 응답 표시 + 히스토리 추가
}
```

### 4단계: 로컬 테스트

```bash
# wrangler로 로컬 테스트 (AI 바인딩 포함)
npx wrangler pages dev MONK_kr --ai
```

T01~T12 중 핵심 5개(T01, T06, T07, T09, T10) 수동 검증.

### 5단계: 배포

```bash
# wrangler로 배포 (기존 monk-kr 프로젝트)
npx wrangler pages deploy MONK_kr
```

배포 후 monk.kr에서 챗봇 열어 동일 5개 시나리오 검증.

---

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `functions/api/chat.js` | Workers AI 챗봇 API (신규) |
| 2 | `MONK_kr/index.html` | 챗봇 JS 로직 수정 (기존) |
| 3 | `wrangler.toml` | AI 바인딩 추가 (기존) |

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키·토큰 하드코딩 금지. Workers AI는 바인딩으로 접근 (env.AI).
- **헌법 4조 2항**: 기존 코드 백업 없이 덮어쓰기 금지 — 현행 Gemini 로직은 주석 처리하여 보존. 필요 시 `CHAT_BACKEND` 환경변수로 gemini/workersai 분기.
- **헌법 5조 4항**: 기존 translate.js, generate.js 등 다른 functions 건드리지 말 것.
- **배포 규칙**: monk.kr은 CF Pages 배포이므로 `wrangler pages deploy` 사용. deploy.sh 대상 아님.
- **PF 히스토리**: 완료 시 PF_CHATBOT 히스토리 1행 어펜드.
- **완료 보고**: `✅❌💡⏳📁🔀` 형식.

---

## 예상 소요

- chat.js 작성: 20분
- index.html 수정: 15분
- 로컬 테스트: 15분
- 배포 + 검증: 10분
- **총 1시간 내외**
