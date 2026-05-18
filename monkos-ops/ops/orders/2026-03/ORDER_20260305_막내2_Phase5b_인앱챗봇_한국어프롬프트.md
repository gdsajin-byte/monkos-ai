---
type: ORDER
date: 2026-03-05
from: iMac/쌍아
to: 막내2 (CLI 배정)
subject: Phase 5b — idphoto-kr 전 페이지 챗봇 확대 + 한국어 전용 프롬프트
priority: HIGH
scope: idphoto-kr/public/(camera.html, result.html, thankyou.html, charge.html), portal/lib/prompts.js, portal/lib/chat-engine.js, portal/lib/coaching.js
---

# Phase 5b: 인앱 챗봇 확대 + 한국어 전용 프롬프트

## 맥락

현재 idphoto-kr 챗봇은 **index.html(랜딩)에만** 존재한다 (로고 클릭 → toggleChat → `/api/chat`). camera/result/thankyou/charge 페이지에는 챗봇이 없다.

또한 idphoto-kr에서 `lang: 'ko'`로 호출하지만, 서버 측 채널은 `web`(일본어 기본 SYSTEM_PROMPT)을 사용한다. 한국 서비스에 한국어 전용 프롬프트가 필요하다.

### 원칙
- **헤더 로고 = 챗봇** — 헤더가 있는 모든 페이지에서 로고 클릭 시 챗봇 열림

---

## 작업 항목

### 1. idphoto-kr 전 페이지 챗봇 위젯 확대

현재 index.html에 있는 챗봇 패널(chat-panel) + toggleChat + sendChat 로직을 다른 페이지에도 적용:

| 페이지 | 현행 | 목표 |
|--------|------|------|
| index.html | ✅ 챗봇 있음 | 유지 |
| camera.html | ❌ 없음 | 챗봇 추가 |
| result.html | ❌ 없음 | 챗봇 추가 |
| thankyou.html | ❌ 없음 | 챗봇 추가 |
| charge.html | ❌ 없음 | 챗봇 추가 |

**구현 방향**: 챗봇 UI + 로직을 **공유 모듈로 추출** (modules/chatbot.js 등)하여 각 페이지에서 import. 중복 코드 방지.

- 챗봇 패널 HTML은 JS에서 동적 생성 (각 HTML에 마크업 복붙 ❌)
- 헤더 로고 클릭 이벤트 바인딩
- `/api/chat` 호출 시 `lang: 'ko'` + 채널 식별자 전달 (아래 2번 참조)
- 챗봇 열림/닫힘 상태는 페이지 이동 시 초기화 (세션 유지 불필요)

### 2. 한국어 전용 채널 + 프롬프트

#### 2-1. prompts.js — SYSTEM_PROMPT_KR 신설

현행 SYSTEM_PROMPT는 일본어 기본이다. idphoto-kr 전용 한국어 프롬프트를 신설:

- 기존 SYSTEM_PROMPT의 **구조와 정책을 그대로** 가져오되, 기본 언어를 한국어로
- 크레딧 시스템, 가격(v3 PRODUCTS 기준), 서비스 플로우를 한국 서비스 기준으로 명시
- "되는 것만 응답" 원칙 유지 (헌법 11조)
- 에스컬레이션: info@monkos.ai + @monkos_support_bot

#### 2-2. chat-engine.js — 채널 추가

CHANNEL_CONFIG에 idphoto-kr 전용 채널 추가:

```javascript
'idphoto-kr': {
  systemPrompt: SYSTEM_PROMPT_KR,
  temperature: 0.7,
  maxOutputTokens: 300,
  historyEnabled: true,
  historyTTL: 30 * 60 * 1000,
  firestoreCollection: 'idphoto_kr_conversations',
}
```

#### 2-3. /api/chat 핸들러 — 채널 분기

현행 coaching.js `handleWebChat`은 항상 `chatWithMonkos('web', ...)` 호출.

요청 body에 `channel` 필드를 추가하여 분기:
- idphoto-kr에서 `{ message, sessionId, lang: 'ko', channel: 'idphoto-kr' }` 전송
- 핸들러에서 `channel || 'web'`으로 분기 (기존 포털은 영향 없음)

### 3. index.html 기존 챗봇 정리

index.html의 인라인 챗봇 코드를 공유 모듈로 이전 후, index.html에서는 모듈 import로 전환. 기존 동작 완전 보존.

---

## 정본 참조

| 파일 | 역할 |
|------|------|
| `idphoto-kr/public/index.html` L669-676, L1069-1113 | 현행 챗봇 UI + API 호출 |
| `portal/lib/prompts.js` L7-64 | SYSTEM_PROMPT (일본어 기본) |
| `portal/lib/chat-engine.js` L113-167 | CHANNEL_CONFIG |
| `portal/lib/coaching.js` L8-29 | handleWebChat |

---

## 산출물

- 코드 수정 + 커밋 + push
- `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase5b_인앱챗봇_한국어프롬프트.md`
  - 공유 모듈 구조 설명
  - SYSTEM_PROMPT_KR 전문 또는 주요 차이점
  - 각 페이지 챗봇 동작 확인 결과

## ⚠️ 준수 조항
- **헌법 1조**: 타임스탬프 시스템 명령 취득
- **헌법 2조**: 완료 보고 형식 준수
- **헌법 11조**: "되는 것만 응답" — 프롬프트에 미출시/미확정 기능 언급 절대 금지
- **기존 index.html 챗봇 동작을 깨뜨리지 마라**
- **포털(monkos.ai) 챗봇에 영향 주지 마라** — 채널 분기는 하위 호환 유지
