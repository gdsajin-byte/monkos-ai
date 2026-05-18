---
type: REPORT
date: 2026-03-05
from: iMac/막내2
to: iMac/쌍아
ref: ORDER_20260305_막내2_Phase5b_인앱챗봇_한국어프롬프트
status: completed
---

# Phase 5b 완료 보고 — 인앱 챗봇 전 페이지 확장 + 한국어 프롬프트

**[2026-03-05 17:55 KST] iMac/막내2 → iMac/쌍아**

## 1. 산출물 요약

### 서버 (portal/)

| 파일 | 변경 |
|------|------|
| `portal/lib/prompts.js` | `SYSTEM_PROMPT_KR` 신규 — 한국어 전용 시스템 프롬프트 (v3 과금체계, 헌법 11조 "되는 것만 응답") |
| `portal/lib/chat-engine.js` | `idphoto-kr` 채널 추가 (SYSTEM_PROMPT_KR, temp 0.7, maxTokens 300, logCollection `idphoto_kr_conversations`) |
| `portal/lib/coaching.js` | `handleWebChat` — `channel` 필드 수신 + 라우팅 (`channel \|\| 'web'` 역호환) |

### 클라이언트 (idphoto-kr/public/)

| 파일 | 변경 |
|------|------|
| `modules/chatbot.js` | **신규 공유 모듈** — 동적 CSS/DOM 주입, `/api/chat` (channel: 'idphoto-kr'), 헤더 패턴 2종 바인딩 |
| `index.html` | 인라인 챗봇 CSS(77줄)/HTML(15줄)/JS(58줄) 제거 → 모듈 import 전환 (150줄 감축) |
| `camera.js` | `initChatbot()` 통합 |
| `result.js` | `initChatbot()` 통합 |
| `thankyou.js` | `initChatbot()` 통합 |
| `charge.html` | `initChatbot()` 통합 (인라인 모듈 스크립트) |

## 2. 설계 결정

### 헤더 바인딩 분기
- `index.html`: `#logoChatTrigger` (로고 클릭 → 챗봇)
- 나머지 4페이지: `#header h1` (브랜드명 클릭 → 챗봇)
- chatbot.js가 `getElementById('logoChatTrigger')` 우선 탐색 → fallback `#header h1`

### logoBubble "?" 배지
- index.html 전용 UX: 챗봇 열리면 `?` 배지 숨김
- chatbot.js `toggleChat()`에 `logoBubble.classList.add('hide')` 추가 (다른 페이지에선 무영향)

### 채널 라우팅 역호환
- 기존 portal 챗봇 (`/api/chat`, channel 미전송) → `channel || 'web'` → 기존 동작 보존
- idphoto-kr 챗봇 → `channel: 'idphoto-kr'` → 한국어 프롬프트 + 별도 로그 컬렉션

## 3. 검증

- index.html: 인라인 챗봇 관련 코드 0건 (grep 확인)
- `onclick="toggleChat()"` 제거 → addEventListener 전환 완료
- 모듈 import + `initChatbot()` 호출 확인 (5개 페이지 전체)

## 4. 헌법/법률 준수

- 헌법 11조: SYSTEM_PROMPT_KR에 "미출시·미확정 기능 절대 미언급" 명시
- 헌법 4조: 채널명 `idphoto-kr` (내부 기술명), 외부 표시명 "MONKOS AI"
- 법률 2장: ES 모듈 패턴, 동적 DOM 주입 (기존 아키텍처 준수)

---

✅ Phase 5b 전 항목 완료
📁 수정 파일 8개 (서버 3 + 클라이언트 5)
