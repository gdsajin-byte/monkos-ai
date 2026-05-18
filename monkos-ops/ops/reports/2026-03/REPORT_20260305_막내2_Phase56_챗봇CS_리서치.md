---
type: report
id: REPORT_20260305_막내2_Phase56_챗봇CS_리서치
date: 2026-03-05 16:02 KST
from: 막내2
to: 쌍아
status: completed
task_id: ORDER_20260305_막내2_Phase56_챗봇CS_리서치
result: success
tags: [Phase5, Phase6, 챗봇, 텔레그램, CS, RAG, 리서치]
---

# Phase 5+6 리서치 보고서: 챗봇 & CS 시스템 전수 조사

> **[2026-03-05 16:02 KST] iMac/막내2 → iMac/쌍아**

---

## 1. 챗봇 코드 인벤토리

### 1-1. 핵심 엔진

| 파일 | 위치 | 라인수 | 역할 | AI모델 | 최종수정 | 상태 |
|------|------|--------|------|--------|----------|------|
| `chat-engine.js` | `portal/lib/` | 246 | **통합 챗봇 엔진** — 6채널 분기, 히스토리 관리, RAG 통합, Firestore 로깅 | Gemini 2.0 Flash (`@google/genai` Vertex AI) | 2026-02-27 | ✅ 활성 |
| `rag.js` | `portal/lib/` | 44 | RAG 검색 — Firestore `cs_knowledge` 키워드 매칭, 10분 캐시 | — | 2026-02-27 | ✅ 활성 |
| `prompts.js` | `portal/lib/` | 263 | 시스템 프롬프트 5종 + 동적 빌더 2종 | — | 2026-03-05 | ✅ 활성 |
| `coaching.js` | `portal/lib/` | 94 | API 핸들러 — `/api/chat`, `/api/coaching`, `/api/qc` | Gemini 2.0 Flash (chat-engine 경유) | 2026-02-27 | ✅ 활성 |
| `kakao-chatbot.js` | `portal/lib/` | 46 | 카카오 챗봇 스킬 서버 — `/api/kakao/chatbot` | Gemini 2.0 Flash (chat-engine 경유) | 2026-02-27 | ✅ 활성 |

### 1-2. 채널 구성 (chat-engine.js CHANNEL_CONFIG)

| 채널 | 시스템 프롬프트 | temperature | 히스토리 | Firestore 컬렉션 | 용도 |
|------|----------------|-------------|----------|------------------|------|
| `web` | SYSTEM_PROMPT | 0.7 | ✅ 30분 TTL | `chat_conversations` | 포털(monkos.ai) 웹 챗봇 |
| `telegram` | CS_SYSTEM_PROMPT | 0.5 | ✅ 60분 TTL | `cs_conversations` | 텔레그램 CS봇 |
| `prep` | PREP_SYSTEM_PROMPT | 0.6 | ✅ 30분 TTL | `prep_conversations` | 촬영 준비 코칭 |
| `coaching` | 동적 (buildCoachingPrompt) | 0.3 | ❌ stateless | — (로그 미저장) | 실시간 촬영 코칭 |
| `qc` | 동적 (buildQCInstruction) | 0.2 | ❌ stateless | `qc_results` | AI QC 판정 |
| `kakao` | SYSTEM_PROMPT + 한국어 전용 | 0.7 | ✅ 30분 TTL | `kakao_conversations` | 카카오 챗봇 |

### 1-3. 프론트엔드 UI 위치

| 위치 | 위젯 | 트리거 | API 호출 | 상태 |
|------|------|--------|----------|------|
| `portal/public/index.html` (monkos.ai) | 챗봇 패널 (chat-panel) | 로고 클릭 + FAB 버튼 | `POST /api/chat` | ✅ 활성 |
| `idphoto-kr/public/camera.html` | 코칭 오버레이 (coaching-overlay) | WebSocket 자동 | camera.js → WS → 서버 → Gemini | ✅ 활성 |
| `idphoto-kr/public/*.html` | ❌ 챗봇 위젯 없음 | — | — | 해당없음 |

> **참고**: idphoto-kr 서비스에는 인앱 챗봇 위젯이 없다. 포털(monkos.ai)에만 있다.

### 1-4. 백엔드 API 엔드포인트 (server.js 라우팅)

| 엔드포인트 | 메서드 | 핸들러 | 용도 |
|-----------|--------|--------|------|
| `/api/chat` | POST | `handleWebChat` | 웹 챗봇 (포털) |
| `/api/coaching` | POST | `handleCoaching` | AI 촬영 코칭 (이미지 분석) |
| `/api/qc` | POST | `handleQC` | AI QC 판정 (원본 vs 생성 비교) |
| `/api/kakao/chatbot` | POST | `handleKakaoChatbot` | 카카오 챗봇 스킬서버 |
| `/api/webhook/telegram` | POST | `handleTelegramCSWebhook` | 텔레그램 CS봇 웹훅 |
| `/api/webhook/telegram-event` | POST | `handleTelegramEventWebhook` | 텔레그램 이벤트봇 웹훅 |
| `/api/webhook/telegram-team` | POST | `handleTelegramTeamWebhook` | 텔레그램 팀봇 웹훅 |
| `/api/team/notify` | POST | `handleTeamNotify` | 팀 알림 API (에이전트→그룹) |

---

## 2. 텔레그램 연동 인벤토리

### 2-1. 현행 시스템 (Cloud Run — portal)

| 봇 | 핸들 | 파일 | 라인수 | 역할 | 토큰 환경변수 | 상태 |
|----|------|------|--------|------|-------------|------|
| **CS봇** | `@monkos_support_bot` | `portal/lib/telegram.js` L1-120 | ~120 | Gemini AI 응답 CS, `/start` 환영 | `TELEGRAM_BOT_TOKEN` | ✅ 활성 |
| **이벤트봇** | `@monkos_event_bot` | `portal/lib/telegram.js` L122-241 | ~120 | GATE_ 딥링크(40c), MISSION_ 딥링크(100c), SNS 동의 | `TELEGRAM_EVENT_BOT_TOKEN` | ✅ 활성 |
| **팀봇** | `@monkos_team_bot` | `portal/lib/telegram-team.js` | 132 | /report, /status, /help + 팀 알림 API | `TELEGRAM_TEAM_BOT_TOKEN` | ✅ 활성 |

### 2-2. 웹훅 엔드포인트

| URL | 봇 | 핸들러 |
|-----|-----|--------|
| `POST /api/webhook/telegram` | CS봇 | `handleTelegramCSWebhook` |
| `POST /api/webhook/telegram-event` | 이벤트봇 | `handleTelegramEventWebhook` |
| `POST /api/webhook/telegram-team` | 팀봇 | `handleTelegramTeamWebhook` |
| `POST /api/team/notify` | 팀봇 (알림 전용) | `handleTeamNotify` |

### 2-3. 텔레그램으로 전달되는 이벤트

| 이벤트 | 봇 | 처리 |
|--------|-----|------|
| 사용자 CS 질문 | CS봇 | chatWithMonkos('telegram') → AI 응답 |
| GATE_ 딥링크 시작 | 이벤트봇 | userId↔telegramId 매핑 → 채널 가입 안내 |
| MISSION_ 딥링크 시작 | 이벤트봇 | 이미지 수신 대기 → missionImageReceived 플래그 |
| SNS 동의 확인 요청 | 이벤트봇 | snsConsentSigned 확인 → 동의 안내 |
| /report 팀 보고 | 팀봇 | Firestore team_reports 저장 |
| /status 상태 확인 | 팀봇 | portal/idphoto-kr/idphoto-jp 헬스체크 |
| 에이전트 알림 | 팀봇 | x-team-secret 인증 → 그룹 메시지 전송 |

### 2-4. 토큰 관리 방식

`portal/lib/shared/config.js`에서 환경변수로 관리:
```
TELEGRAM_BOT_TOKEN        → CS봇 (@monkos_support_bot)
TELEGRAM_EVENT_BOT_TOKEN  → 이벤트봇 (@monkos_event_bot)
TELEGRAM_TEAM_BOT_TOKEN   → 팀봇 (@monkos_team_bot)
TELEGRAM_CHANNEL_ID       → 채널 ID (가입 검증용)
TEAM_CHAT_ID              → 팀 그룹 채팅 ID
TEAM_NOTIFY_SECRET        → 팀 알림 인증 시크릿
```
> API URL 구성: `https://api.telegram.org/bot${TOKEN}` (TELEGRAM_CS_API, TELEGRAM_EVENT_API, TELEGRAM_TEAM_API)

### 2-5. CF Workers 아카이브 (deprecated)

| 파일 | 위치 | 역할 | 상태 |
|------|------|------|------|
| `telegram.js` | `monkos-ops/tech/archive/functions_cf/api/` | @Monk_yonga_bot — 이미지 전송, 인화 주문 알림 | ❌ deprecated (아카이브) |
| `telegram-webhook.js` | `monkos-ops/tech/archive/functions_cf/api/` | @Monk_yonga_bot — /start, /help, /myid, D1 연동 | ❌ deprecated (아카이브) |

> 이전 CF Workers 시절의 @Monk_yonga_bot 코드. 현행 시스템은 Cloud Run portal로 완전 이전됨.

---

## 3. 고객 응대 진입점 맵

| # | 채널 | 진입점 | 처리 방식 | 상태 |
|---|------|--------|-----------|------|
| 1 | **웹 챗봇** | monkos.ai 포털 (로고 클릭) | `POST /api/chat` → Gemini AI | ✅ 활성 |
| 2 | **텔레그램 CS** | @monkos_support_bot | 웹훅 → chatWithMonkos('telegram') → Gemini AI | ✅ 활성 |
| 3 | **텔레그램 이벤트** | @monkos_event_bot | 웹훅 → GATE/MISSION 딥링크 처리 | ✅ 활성 (CS 아님, 이벤트 전용) |
| 4 | **텔레그램 팀** | @monkos_team_bot | 웹훅 → 내부 팀 전용 | ✅ 활성 (내부용) |
| 5 | **카카오 챗봇** | @monkos 카카오채널 | `POST /api/kakao/chatbot` → Gemini AI | ⚠️ 코드 존재, 채널 설정 미확인 |
| 6 | **이메일** | info@monkos.ai | 수동 처리 (자동화 없음) | ✅ 안내 중 |
| 7 | **실시간 코칭** | idphoto-kr camera.html | WebSocket → camera.js → 서버 → Gemini | ✅ 활성 (CS 아님, 촬영 코칭) |

### 푸터/연락처 표시 현황

| 페이지 | 표시 내용 | 상태 |
|--------|----------|------|
| monkos.ai (portal) index.html | `Email: info@monkos.ai` + `Telegram: @monkos_support_bot` | ✅ |
| idphoto-kr index.html | `Email: info@monkos.ai` + `Telegram: @monkos_support_bot` | ✅ |
| idphoto-kr charge.html | `Email: info@monkos.ai` + `Telegram: @monkos_support_bot` | ✅ |
| idphoto-kr thankyou.html | `🖨️ 인화 서비스·CS → Telegram @monkos_bot` | ⚠️ **@monkos_bot** — CS봇과 핸들 불일치 (하단 참조) |
| portal refund.html | `Email: info@monkos.ai` | ✅ |
| portal privacy.html | `이메일: info@monkos.ai` | ✅ |
| portal terms.html | `info@monkos.ai` | ✅ |
| idphoto-kr refund.html | `Email: info@monkos.ai` | ✅ |
| idphoto-kr privacy.html | `이메일: info@monkos.ai` | ✅ |
| idphoto-jp privacy/terms/tokusho | `info@monkos.ai` | ✅ |

---

## 4. Knowledge Base 맵

### 4-1. Firestore 컬렉션: `cs_knowledge`

| 시드 파일 | 위치 | 문서 수 | 내용 | 최종수정 | v3 반영 여부 |
|----------|------|---------|------|----------|-------------|
| `seed_cs_knowledge.js` | `portal/` | 10건 | 크레딧 시스템, 구매, 환불, 사진품질, 로그인, URL, 탈퇴, 사진형식, 결제수단, 서비스플로우 | 2026-03-05 | ⚠️ 일부 미반영 |
| `seed_cs_brand_story.js` | `portal/` | 7건 | 브랜드 소개, 가격 철학, 딥페이크 방지, 정체성 보존, 데이터 보호, 고객 소통, 실시간 촬영 이유 | 2026-03-04 | ✅ |
| `seed_cs_legal.js` | `portal/` | 8건 | 일본 환불/개인정보, 한국 전자상거래/개인정보/초상권, GDPR, EU AI Act, 미국 FTC, 컴플레인 대응 | 2026-02-19 | ✅ (법률 기반, v3 무관) |
| `seed_cs_prep.js` | `portal/` | 5건 | 여권/이력서/학생증/영유아/의상컬러 촬영 가이드 | 2026-03-04 | ✅ |
| **합계** | | **30건** | | | |

### 4-2. RAG 동작 방식

```
사용자 메시지 → searchCsKnowledge(query)
  → Firestore cs_knowledge 전건 로드 (10분 캐시)
  → 키워드 매칭 스코어링 (keyword=10, title=5, content=2)
  → 상위 3건 반환
  → chat-engine에서 시스템 프롬프트에 [참고 지식]으로 주입
```

### 4-3. v3 미반영 사항 (seed_cs_knowledge.js)

| 문서 ID | 문제 | 상세 |
|---------|------|------|
| `credit_purchase` | **"비회원 직결제 ₩9,900" 언급** | Phase 3에서 비회원 결제 경로 소멸. KB 데이터에 잔존 |
| `credit_system` | 가격 정보 확인 필요 | v3 PRODUCTS와 대조 필요 (topup_10: ₩1,450 등) |
| `payment_methods` | "현장 결제(추후 지원)" 표현 | 현행 미제공 기능 언급 여부 확인 필요 |

### 4-4. 프롬프트 구조 (prompts.js)

| 프롬프트 | 채널 | 언어 | 핵심 정책 |
|---------|------|------|----------|
| `SYSTEM_PROMPT` | web, kakao | **일본어** 기본 + 다국어 | 3단계 응답(짧은 안내 → 상세 → 에스컬레이션), 크레딧 시스템 명시, 미출시 기능 절대 언급 금지 |
| `CS_SYSTEM_PROMPT` | telegram | **일본어** 기본 + 다국어 | 문화 민감도(일본 경어, 한국 존댓말), 에스컬레이션 정책, 환불 조건 |
| `PREP_SYSTEM_PROMPT` | prep | 다국어 | 촬영 준비 코치, 옵션별 의상/자세/조명 안내 |
| `COACHING_INSTRUCTIONS` | coaching | 한국어 | 15자 이내 실시간 코칭, 촬영OK/재촬영 판정 |
| `buildQCInstruction()` | qc | 영어 (JSON) | 원본↔생성 비교, identity/quality/background 점수, JSON 출력 |

---

## 5. 배포 구조도

```
┌─────────────────────────────────────────────────────────┐
│                    Cloud Run (monkos.ai)                 │
│                    portal/server.js                      │
│                                                         │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ /api/chat   │  │ /api/coaching │  │ /api/qc      │  │
│  │ (웹 챗봇)   │  │ (촬영 코칭)   │  │ (AI QC)      │  │
│  └──────┬──────┘  └──────┬────────┘  └──────┬───────┘  │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          ▼                              │
│              ┌─────────────────────┐                    │
│              │  chat-engine.js     │                    │
│              │  chatWithMonkos()   │                    │
│              │  Gemini 2.0 Flash   │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │     rag.js          │                    │
│              │  cs_knowledge 검색   │                    │
│              └──────────┬──────────┘                    │
│                         │                               │
│              ┌──────────▼──────────┐                    │
│              │     Firestore       │                    │
│              │  cs_knowledge (30건)│                    │
│              │  chat_conversations │                    │
│              │  cs_conversations   │                    │
│              │  prep_conversations │                    │
│              │  kakao_conversations│                    │
│              │  qc_results         │                    │
│              └─────────────────────┘                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Telegram Webhooks                     │  │
│  │  /api/webhook/telegram      → CS봇 (AI 응답)      │  │
│  │  /api/webhook/telegram-event→ 이벤트봇 (GATE/MISSION)│ │
│  │  /api/webhook/telegram-team → 팀봇 (내부 운영)     │  │
│  │  /api/team/notify           → 팀 알림 API         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────┐                                       │
│  │/api/kakao/   │                                       │
│  │chatbot       │  → 카카오 챗봇 스킬서버              │
│  └──────────────┘                                       │
│                                                         │
│  정적 파일: portal/public/index.html (웹 챗봇 UI)       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           Cloud Run (idphoto-kr.monkos.ai)              │
│                                                         │
│  camera.js → WebSocket → 서버 → /api/coaching           │
│  (실시간 코칭 — 프론트에서 monkos.ai로 API 호출)         │
│                                                         │
│  ❌ 인앱 챗봇 위젯 없음                                 │
│  ❌ CS 관련 자체 코드 없음                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           CF Workers (functions/) — 해당 없음            │
│                                                         │
│  챗봇/CS 관련 코드 없음 (전부 Cloud Run으로 이전됨)       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           아카이브 (deprecated)                          │
│                                                         │
│  monkos-ops/tech/archive/functions_cf/api/              │
│    telegram.js        — @Monk_yonga_bot 이미지 전송     │
│    telegram-webhook.js — @Monk_yonga_bot /start 처리    │
│  → 현행 시스템과 무관. 참고용 보존                       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 발견사항 및 개선 제안

### 🔴 즉시 수정 필요

| # | 항목 | 상세 |
|---|------|------|
| 1 | **thankyou.html CS 링크 불일치** | `@monkos_bot`으로 링크 → 실제 CS봇은 `@monkos_support_bot`. 사용자가 잘못된 봇으로 유도됨 |
| 2 | **seed_cs_knowledge.js "비회원 직결제" 잔존** | Phase 3에서 비회원 결제 경로 소멸했으나 KB 데이터에 "비회원 직결제 ₩9,900" 여전히 존재. 챗봇이 없는 기능을 안내할 위험 |

### 🟡 Phase 5+6 설계 시 고려사항

| # | 항목 | 상세 |
|---|------|------|
| 3 | **idphoto-kr에 인앱 챗봇 없음** | 포털(monkos.ai)에만 웹 챗봇 존재. idphoto-kr 사용자(한국 주 고객)는 촬영 중 CS 접근 불가. Phase 5에서 인앱 챗봇 위젯 추가 검토 |
| 4 | **RAG 키워드 매칭 한계** | 현행 RAG는 Firestore 전건 로드 + 키워드 스코어링. 시맨틱 검색 미지원. 30건 규모에서는 충분하나, KB 확대 시 벡터 검색 고려 |
| 5 | **프롬프트 일본어 기본** | SYSTEM_PROMPT, CS_SYSTEM_PROMPT 모두 일본어 기본. 한국 서비스(idphoto-kr) 전용 프롬프트 분기 검토 |
| 6 | **카카오 챗봇 활성화 상태 불명** | 코드는 완비(`kakao-chatbot.js` + `kakao` 채널 in chat-engine). KAKAO_CHANNEL_ID 환경변수 설정 여부 및 카카오 챗봇 스킬서버 등록 상태 확인 필요 |
| 7 | **텔레그램 CS→이메일 에스컬레이션 수동** | CS봇이 "info@monkos.ai로 문의" 안내하지만, 실제 이메일 수신→티켓 자동화 없음. Phase 6에서 자동 연동 검토 |
| 8 | **3봇 통합 가능성** | CS봇과 이벤트봇이 별도 토큰/핸들. Phase 6에서 1봇으로 통합하면 사용자 경험 단순화 (하나의 봇에서 CS + 이벤트 + 채널 가입 모두 처리) |
| 9 | **코칭 WebSocket vs REST** | camera.js는 WebSocket으로 코칭 서버 연결, coaching.js는 REST API(`/api/coaching`). 두 경로가 공존. 아키텍처 통일 검토 |
| 10 | **대화 히스토리 인메모리** | chat-engine.js의 히스토리가 `Map` 기반 인메모리. Cloud Run 인스턴스 재시작 시 소실. 대화 중 컨텍스트 단절 가능 |

### 🟢 잘 설계된 부분

| # | 항목 |
|---|------|
| 1 | **통합 chat-engine** — 6채널 분기가 단일 엔진으로 관리. 새 채널 추가 시 CHANNEL_CONFIG만 확장하면 됨 |
| 2 | **법률 KB 완비** — 일본/한국/EU/미국 법률 + 컴플레인 대응 가이드까지 시드 완료 |
| 3 | **봇별 역할 분리** — CS/이벤트/팀 봇이 명확히 분리, 보안(TEAM_NOTIFY_SECRET) 적용 |
| 4 | **3단계 응답 정책** — 짧은 안내 → 상세 설명 → 에스컬레이션 체계 |
| 5 | **헌법 11조 준수** — "되는 것만 응답" 원칙이 프롬프트에 반영 ("未実装・未確定の表現を絶対にしない") |

---

### Firestore 컬렉션 전체 맵 (챗봇/CS 관련)

| 컬렉션 | 용도 | 쓰기 주체 | 읽기 주체 |
|--------|------|----------|----------|
| `cs_knowledge` | RAG 지식 베이스 | seed 스크립트 (수동) | rag.js (챗봇 응답 시) |
| `chat_conversations` | 웹 챗봇 대화 로그 | chat-engine.js | — (분석용) |
| `cs_conversations` | 텔레그램 CS 대화 로그 | chat-engine.js | — (분석용) |
| `prep_conversations` | 촬영 준비 대화 로그 | chat-engine.js | — (분석용) |
| `kakao_conversations` | 카카오 챗봇 대화 로그 | chat-engine.js | — (분석용) |
| `qc_results` | QC 판정 결과 | chat-engine.js | — (분석용) |
| `team_reports` | 팀 보고서 | telegram-team.js | — (내부용) |
| `telegramGateCodes` | GATE/MISSION 딥링크 코드 | events.js | telegram.js |

---

✅ 챗봇 코드 인벤토리 완료 — 핵심 엔진 5개 파일 + 시드 4개 파일 (총 2,107줄)
✅ 텔레그램 연동 인벤토리 완료 — 현행 3봇 + deprecated 1봇 식별
✅ 고객 응대 진입점 7개 채널 맵핑 완료
✅ Knowledge Base 30건 전수 파악 + v3 미반영 2건 식별
✅ 배포 구조도 작성 — Cloud Run 단일 서비스, CF Workers 해당 없음
✅ 발견사항 10건 + 즉시 수정 2건 제시
📁 `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase56_챗봇CS_리서치.md`
