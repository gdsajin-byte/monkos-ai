# CF 완전 서버리스 전환 전략

---
type: strategy
from: iMac/쌍아
date: 2026-02-19 11:39 KST
status: 확정 (단계적 실행)
tags: [인프라, CF, 서버리스, RAG, 챗봇, 마이그레이션]
---

## 1. 배경

### 현재 문제
- monk.kr(CF Pages) ↔ monkos.ai(Cloud Run) 배포라인이 달라 프록시 연결 시 405/502 반복
- 같은 챗봇 엔진인데 포털은 RAG 없고, 텔레그램 CS봇만 RAG — 지식 편재
- Cloud Run 컨테이너 유지비, 콜드 스타트 2-5초, GCP+CF 이중 관리

### 핵심 발견
- **monk.kr에 CF 풀스택이 이미 완성되어 있음** — 인증, 결제, 크레딧, 거래원장, D1 전부 동작
- **Cloudflare AutoRAG** (2025 출시, 오픈 베타 무료) — R2+Vectorize+Workers AI 관리형 RAG
- **Gemini API Key 직접 호출** — Cloud Run/Vertex AI ADC 불필요, CF Workers에서 바로 가능

### 전략 결정
**monk.kr에서 CF 완전체 구축 → 검증 → monkos.ai로 이전 → Cloud Run 퇴역**

## 2. 아키텍처

### Before (하이브리드 — 현재)

```
[monk.kr — CF Pages]
├── 정적 파일 서빙
├── CF Workers (인증/결제/크레딧/사진생성)
├── D1 (monk-services-db)
└── ✕ 챗봇 없음, ✕ RAG 없음, ✕ 프록시 장애

[monkos.ai — Cloud Run]
├── server.js 모놀리스 (1,852줄)
├── 챗봇 (포털 + 텔레그램 CS)
├── RAG (Firestore cs_knowledge, 키워드 매칭)
├── 코칭 (Gemini Live WebSocket)
├── 증명사진 (생성/프리체크/QC)
└── Firestore (대화로그, 지식, 사용자)
```

### After (CF 완전 서버리스)

```
[monk.kr — CF 완전체]
├── CF Pages (정적 서빙)
├── CF Workers
│   ├── auth.js        — 카카오/구글 OAuth        ✅ 있음
│   ├── payment.js     — 토스페이먼츠 결제        ✅ 있음
│   ├── tx.js          — 거래원장 API             ✅ 있음
│   ├── visitor.js     — 방문자 관리              ✅ 있음
│   ├── photo.js       — Gemini I2I 생성          ✅ 있음
│   ├── analyze.js     — Gemini Flash 분석        ✅ 있음
│   ├── precheck.js    — 촬영본 사전분석          ⏳ 지시서 발송됨
│   ├── idgen.js       — 증명사진 I2I 생성        ⏳ 지시서 발송됨
│   ├── qc.js          — 원본 vs 생성물 QC        ⏳ 지시서 발송됨
│   ├── chatbot.js     — MONKOS 통합 챗봇         ❌ 신규
│   └── telegram.js    — 텔레그램 웹훅            ✅ 있음 (AI 미연동)
├── D1 (monk-services-db)
│   ├── shared_users                              ✅ 있음
│   ├── shared_credits                            ✅ 있음
│   ├── shared_credit_transactions                ✅ 있음
│   ├── shared_visitors                           ✅ 있음
│   ├── chat_conversations                        ❌ 신규 (Firestore 이관)
│   └── cs_conversations                          ❌ 신규 (Firestore 이관)
├── R2 (지식 문서 저장)                            ❌ 신규
├── Vectorize (벡터 검색)                          ❌ 신규
└── AutoRAG (관리형 RAG 파이프라인)                 ❌ 신규
```

## 3. MONKOS 통합 챗봇 엔진

### 현재: 2개 함수, RAG 편재

```
chatWithGemini()    — 포털 웹  → SYSTEM_PROMPT (고정) → RAG 없음
chatWithGeminiCS()  — 텔레그램 → CS_SYSTEM_PROMPT + RAG (동적)
```

### 전환: 1개 함수, 채널별 설정

```js
// chatbot.js — CF Worker
async function chatWithMonkos(channel, chatId, message) {
  // 1. 채널 설정 lookup
  const config = CHANNEL_CONFIG[channel];

  // 2. RAG 검색 (공통)
  const ragDocs = await searchRAG(message);

  // 3. 시스템 프롬프트 조립
  const systemPrompt = config.systemPrompt + ragContext;

  // 4. Gemini API 호출
  const response = await callGemini({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    contents: history,
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
  });

  // 5. 대화 로깅 (D1)
  await logConversation(chatId, channel, message, response);

  return response;
}
```

### 채널 설정 테이블

| 채널 | key | 시스템 프롬프트 | temp | 토큰 | 용도 |
|------|-----|---------------|------|------|------|
| 포털 웹 | `web` | 안내 도우미 | 0.7 | 300 | 서비스 안내, 사용법 |
| 텔레그램 CS | `telegram` | CS 상담원 | 0.5 | 500 | 고객 상담, 클레임 |
| 준비실 코치 | `prep` | 촬영 코치 | 0.6 | 400 | 촬영 세팅 가이드 |

### RAG 지식풀 (공통 — R2 원본)

| 카테고리 | 문서 수 | 내용 |
|---------|--------|------|
| CS 기본 | 8건 | 크레딧, 결제, 환불, 로그인, URL 등 |
| 법률 | 8건 | 일본 특상법, 한국 소비자보호법, GDPR, AI Act 등 |
| 브랜드 | 7건 | 정체성, 가격 철학, 딥페이크 차단, 개인정보 등 |
| 촬영 코퍼스 | 5건+ | 시나리오별 멘트 (여권/이력서/학생증/아기/컬러) |
| KR/JP 규정 | 2건+ | 여권 규격, 의상 규정, 배경 규정 비교 |

## 4. 비용 비교

### Cloud Run (현재)

| 항목 | 월 비용 |
|------|--------|
| Cloud Run (최소 인스턴스 1) | ~$5-10 |
| Firestore (무료 티어 내) | $0 |
| Gemini API (ADC) | 사용량 비례 |
| **합계** | **~$5-10+** |

### CF 서버리스 (전환 후)

| 항목 | 월 비용 |
|------|--------|
| CF Workers (무료 100K req/day) | $0 |
| D1 (무료 5M read/day) | $0 |
| R2 (무료 10GB) | $0 |
| Vectorize (무료 5M 벡터) | $0 |
| Workers AI (무료 10K neurons/day) | $0 |
| Gemini API (API Key) | 사용량 비례 (동일) |
| **합계** | **$0 + Gemini 사용분** |

현재 트래픽 규모에서 **CF 무료 티어로 전부 커버 가능**.

## 5. 실행 로드맵

### Phase 1: monk.kr 자체 엔진 (이번 주)

- [x] CF Workers 자체 엔진 지시서 발송 (precheck/idgen/qc)
- [x] CF Pages Root directory 원복
- [ ] 막내 투입 → 3개 Worker 구현 + E2E 테스트
- [ ] config.js API 경로 변경
- [ ] 프록시 Workers 삭제 (idphoto-*.js)

### Phase 2: 통합 챗봇 + RAG (다음 주)

- [ ] chatbot.js CF Worker 구현 (채널 분기형)
- [ ] R2 버킷 생성 + 지식 문서 업로드 (MD)
- [ ] AutoRAG 또는 Vectorize + Workers AI 임베딩 설정
- [ ] 준비실 사이드 챗봇 UI 연동
- [ ] 텔레그램 웹훅 → chatbot.js 연결

### Phase 3: 준비실 키오스크 (다다음 주)

- [ ] 카드 스키마 9필드 구현 (DESIGN_20260219_prep_room_schema.md 기반)
- [ ] 키오스크 퍼널 UI (스텝별 슬라이드)
- [ ] 사이드 챗봇 패널 (💬 토글)
- [ ] 후면 카메라 분기 (7세 이하)
- [ ] 프롬프트 조립 (`DEFAULTS[locale][purpose][gender]` 테이블)

### Phase 4: monkos.ai 이관 (검증 완료 후)

- [ ] monk.kr Workers → monkos.ai 복제
- [ ] D1 인스턴스 분리 또는 공유 결정
- [ ] Firestore 데이터 → D1 마이그레이션
- [ ] 텔레그램 웹훅 URL 변경
- [ ] Cloud Run 퇴역

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| AutoRAG 베타 불안정 | RAG 검색 품질 | 수동 Vectorize+임베딩 폴백 구현 |
| CF Workers 실행 시간 제한 (30초) | 대용량 이미지 생성 | Gemini I2I는 보통 10초 내 → 여유 |
| D1 동시 쓰기 제한 | 대량 트래픽 시 | 현재 규모에서 해당 없음 |
| Live 코칭 WS | CF Workers에서 장기 WS 불가 | REST 전환 완료 (MPA), 추후 Durable Objects |

## 7. 핵심 원칙

1. **monk.kr에서 먼저 완성, monkos.ai는 복제** — 실험장과 프로덕션 분리
2. **RAG 지식풀 공유** — 모든 채널이 같은 지식을 알고, 대화 방식만 다름
3. **서버리스 순수주의** — 컨테이너 없음, 요청 단위 과금, 콜드 스타트 없음
4. **점진적 이관** — Cloud Run을 한 번에 끄지 않고, 기능 단위로 전환 후 퇴역
