# 인프라 전략: CF + GCP 역할 분담 체제

---
type: strategy
from: iMac/쌍아
date: 2026-02-19 11:39 KST
revised: 2026-02-19 12:23 KST
status: 확정 (역할 분담 체제)
tags: [인프라, CF, GCP, Vertex AI, 서버리스, RAG, 챗봇]
---

## 0. 논의 히스토리 — 왜 이 체제인가

### 0-1. 출발점: CF 완전체론 (2/19 11:30)

monk.kr photolab에서 CF Function 프록시가 405를 반환하는 문제(2/18 발견)를 계기로,
**"배포라인이 다른 시스템을 프록시로 엮지 말고 CF Workers에서 Gemini API Key로 직접 호출하자"**는 전략이 수립됨.

근거:
- monk.kr에 이미 CF 풀스택 완성 (OAuth, 결제, 크레딧, D1 전부 동작)
- Cloudflare AutoRAG (오픈 베타) 발견 → 챗봇/RAG도 CF에서 가능
- Gemini API Key 직접 호출 → Cloud Run 컨테이너 불필요
- 비용: CF 무료 티어로 전부 커버 가능

→ **1차 결론: CF 완전 서버리스 전환, Cloud Run 퇴역.**

### 0-2. 반론: Vertex AI ADC 체제의 가치 (2/19 12:07~12:13)

CF 완전체 전략을 검토하면서 **병목 구간**이 드러남:

| 병목 | 원인 | 심각도 |
|------|------|:---:|
| **GCP 토큰 발급** | CF Worker → JWT 서명 → OAuth 교환, 매 요청 ~200ms | 🟡 |
| **Gemini rate limit** | API Key: 분당 60요청 제한 → 대량 트래픽 시 터짐 | 🔴 |
| **I2I 생성 시간** | 5~15초 → CF Workers 30초 제한 내이나 여유 없음 | 🟡 |

**작가님 핵심 지적:**
> "Cloud Run이 좀 구린데도 몽코스에서 GCP로 갔던 이유가 이거야.
> 느리고 구식인데 안정적인 대형 세단 vs CF는 썡썡이인데 매번 GCP가서 허락받고 거절당하고.
> Cloud Run 콜드런도 해결되고 생성 속도도 계속 발전적이라는 피드백이야."

**비유:** Cloud Run = GCP 안에서 면허증 꺼낼 일 없는 대형 세단.
CF Workers = 빠르고 세련되지만 Gemini 부를 때마다 GCP 국경에서 여권 검사.

### 0-3. 최종 결정: 역할 분담 체제 (2/19 12:21)

무리하게 한쪽으로 통일하지 않는다. **각자 잘하는 걸 하게 둔다.**

- **CF**: 엣지 배포, 정적 자산, D1(인증/결제/크레딧), OAuth, 도메인 프록시
- **GCP**: Gemini 네이티브 연동, Vertex AI ADC 자동 인증, 스케일링, SLA

**CF Worker가 Cloud Run을 "프록시"하는 구조가 아니라,
프론트엔드가 각 백엔드를 직접 호출하는 "역할 분담" 구조.**

### 0-4. 향후 개선 가능 지점 (워치리스트)

| 시점 | 조건 | 전환 가능성 |
|------|------|-----------|
| **Vertex AI에서 Imagen I2I 지원 시** | API Key 예외 제거 → Vertex ADC 완전 통일 | 🟢 높음 |
| **CF Workers에서 GCP ADC 네이티브 지원 시** | 토큰 교환 병목 해소 → CF 완전체 재검토 | 🟡 중간 |
| **Llama 4+ 품질이 Gemini Flash 수준 도달 시** | 비AI 호출(챗봇/RAG)을 Workers AI로 전환 | 🟡 중간 |
| **Cloud Run 비용 증가 or 장애 반복 시** | CF 완전체로 재전환 | 🟠 조건부 |
| **트래픽 수만 명/일 도달 시** | Vertex AI 쿼터 증설 신청 (API Key rate limit 회피) | 🟢 예정된 수순 |

**핵심:** 현재 구조는 "정책적 제약 때문에 어쩔 수 없는 타협"이 아니라,
**두 플랫폼의 장점을 의도적으로 조합한 설계**다.
단, 위 조건이 변하면 전략을 재검토한다.

---

## 1. 확정 아키텍처: CF + GCP 역할 분담

```
[monk.kr — Cloudflare 생태계]
├── CF Pages          — 정적 서빙 (Git 연동 자동배포)
├── CF Workers        — 비AI 비즈니스 로직
│   ├── auth.js       — OAuth (구글/카카오/LINE)          ✅ 완성
│   ├── payment.js    — 결제 (KR: 토스페이먼츠)           ✅ 완성
│   ├── tx.js         — 거래원장 API                      ✅ 완성
│   ├── visitor.js    — 방문자 관리                       ✅ 완성
│   ├── telegram.js   — 텔레그램 사진 전송                ✅ 완성
│   └── (향후 Lemon Squeezy Worker — JP+글로벌 결제)
├── D1                — monk-services-db
│   ├── shared_users / shared_credits / shared_credit_transactions
│   └── shared_visitors
└── CF DNS            — 도메인 프록시 (monk.kr)

[monkos.ai — GCP 생태계]
├── Cloud Run         — AI 엔진 전담
│   ├── 증명사진 생성  — Vertex AI ADC (gemini-3-pro-image-preview)
│   │                   ※ I2I만 예외: Google AI Studio API Key
│   ├── 프리체크       — Vertex AI ADC (gemini-2.0-flash)
│   ├── QC 검증        — Vertex AI ADC (gemini-2.0-flash)
│   ├── 챗봇 (포털+텔레그램+준비실) — Vertex AI ADC + RAG
│   └── 코칭           — Vertex AI ADC (REST, MPA 전환 완료)
├── Firestore         — 대화 로그, RAG 지식풀 (cs_knowledge 23건)
└── Cloud DNS         — 도메인 매핑 (monkos.ai, idphoto-kr/jp)

[연결 — 프록시가 아닌 직접 호출]
monk.kr 프론트엔드 → fetch('https://idphoto-kr.monkos.ai/api/...') — 직접
monk.kr 프론트엔드 → CF Workers (/api/auth, /api/payment, /api/tx) — CF 내부
```

### 인증 체계

| 대상 | 인증 방식 | 이유 |
|------|---------|------|
| Gemini Flash (프리체크/QC/챗봇/코칭) | **Vertex AI ADC** | Cloud Run 내부 자동 |
| Gemini 3 Pro (I2I 생성) | **Vertex AI ADC** | Cloud Run 내부 자동 |
| Imagen 3 I2I | **Google AI Studio API Key** | Vertex에서 I2I 미지원 (2026-02-09 확정) |

→ **API Key 예외는 Imagen I2I 한 건뿐. 나머지 전부 Vertex ADC.**

### 결제 체계

| 시장 | PG | 위치 |
|------|-----|------|
| KR | 토스페이먼츠 | CF Worker `payment.js` ✅ 완성 |
| JP + 글로벌 | Lemon Squeezy | Cloud Run (monkos 포털) / 향후 CF Worker |

### OAuth

| 프로바이더 | 위치 | 상태 |
|-----------|------|------|
| Google | CF Worker `auth.js` | ✅ 완성 |
| 카카오 | CF Worker `auth.js` | ✅ 완성 |
| LINE | Cloud Run (monkos 포털) | ✅ 완성 |

---

## 2. MONKOS 통합 챗봇 엔진

### 현재: 2개 함수, RAG 편재 (Cloud Run server.js)

```
chatWithGemini()    — 포털 웹  → SYSTEM_PROMPT (고정) → RAG 없음
chatWithGeminiCS()  — 텔레그램 → CS_SYSTEM_PROMPT + RAG (동적)
```

### 전환: 1개 함수, 채널별 설정, RAG 공유

**위치: Cloud Run (monkos_AI/portal/server.js) — 현행 유지**

```js
async function chatWithMonkos(channel, chatId, message) {
  const config = CHANNEL_CONFIG[channel];     // 채널별 프롬프트/파라미터
  const ragDocs = await searchKnowledge(message);  // 공통 RAG (전 채널)
  const systemPrompt = config.systemPrompt + ragContext;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: history,
    config: {
      systemInstruction: systemPrompt,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  });
  // ...
}
```

### 채널 설정 테이블

| 채널 | key | 시스템 프롬프트 | temp | 토큰 | 용도 |
|------|-----|---------------|------|------|------|
| 포털 웹 | `web` | 안내 도우미 | 0.7 | 300 | 서비스 안내, 사용법 |
| 텔레그램 CS | `telegram` | CS 상담원 | 0.5 | 500 | 고객 상담, 클레임 |
| 준비실 코치 | `prep` | 촬영 코치 | 0.6 | 400 | 촬영 세팅 가이드 |

### RAG 지식풀 (Firestore cs_knowledge — 공통)

| 카테고리 | 문서 수 | 내용 |
|---------|--------|------|
| CS 기본 | 8건 | 크레딧, 결제, 환불, 로그인, URL 등 |
| 법률 | 8건 | 일본 특상법, 한국 소비자보호법, GDPR, AI Act 등 |
| 브랜드 | 7건 | 정체성, 가격 철학, 딥페이크 차단, 개인정보 등 |
| 촬영 코퍼스 | 5건+ | 시나리오별 멘트 (여권/이력서/학생증/아기/컬러) |
| KR/JP 규정 | 2건+ | 여권 규격, 의상 규정, 배경 규정 비교 |

**개선:** 현재 키워드 매칭 → 향후 시맨틱 검색 전환 가능 (Vertex AI Embeddings 또는 AutoRAG)

---

## 3. monk.kr photolab API — 과도기 전략

### 문제 (2/18 발견)
CF Function 프록시(`idphoto-*.js`)가 405 반환 — CF Pages 빌드 경로 불일치.

### 해결: 2단계 전환

**1단계 (즉시): CF Workers 자체 엔진 — API Key 직접 호출**
- `precheck.js`, `idgen.js`, `qc.js` → Gemini API Key 직접 호출
- 프록시 제거, monk.kr 독립 동작
- 이미 지시서 발송 완료 (`commands/20260218_1850_...`)

**2단계 (안정화 후): Cloud Run 직접 호출로 전환**
- monk.kr 프론트엔드 → `fetch('https://idphoto-kr.monkos.ai/api/...')`
- 1단계 CF Workers는 폴백으로 유지 또는 퇴역
- Vertex ADC 체제로 통일

---

## 4. 비용 구조 (현재 규모)

| 항목 | 플랫폼 | 월 비용 |
|------|--------|--------|
| CF Pages + Workers + D1 | Cloudflare | $0 (무료 티어) |
| Cloud Run (최소 인스턴스 1) | GCP | ~$5-10 |
| Firestore (무료 티어 내) | GCP | $0 |
| Gemini API (Vertex ADC) | GCP | 사용량 비례 |
| **합계** | | **~$5-10 + Gemini 사용분** |

### 수만 명 스케일 시

| 항목 | 일 30,000명 기준 |
|------|-----------------|
| 챗봇 (90K회/일) | ~$12/일 (Gemini Flash) |
| I2I 생성 (3,000회/일) | ~$90/일 (Gemini 3 Pro) |
| 인프라 | ~$50/월 |
| **월 합계** | **~$3,100** |
| **월 매출 (유료 30% 전환)** | **~$270,000** |
| **마진율** | **98%** |

→ Vertex AI 쿼터 증설 신청으로 rate limit 해소. 비용은 문제 안 됨.

---

## 5. 실행 로드맵

### Phase 1: monk.kr 자체 엔진 (이번 주)

- [x] CF Workers 자체 엔진 지시서 발송 (precheck/idgen/qc)
- [x] CF Pages Root directory 원복
- [ ] 막내 투입 → 3개 Worker 구현 (API Key 직접 호출)
- [ ] config.js API 경로 변경
- [ ] 프록시 Workers 삭제 (idphoto-*.js)
- [ ] E2E 테스트 (프리체크 → 생성 → QC)

### Phase 2: 통합 챗봇 + RAG 공유 (다음 주)

- [ ] `chatWithGeminiCS()` → `chatWithMonkos(channel)` 통합
- [ ] `chatWithGemini()`에 RAG 로직 이식 (3줄 추가)
- [ ] 준비실 채널(`prep`) 시스템 프롬프트 추가
- [ ] 촬영 코퍼스 5종 Firestore 시드
- [ ] monk.kr 준비실 → monkos.ai `/api/chat` 직접 호출 연동

### Phase 3: 준비실 키오스크 UI

- [ ] 카드 스키마 9필드 구현 (DESIGN_20260219_prep_room_schema.md)
- [ ] 키오스크 퍼널 UI (스텝별 슬라이드)
- [ ] 사이드 챗봇 패널 (💬 토글)
- [ ] 후면 카메라 분기 (7세 이하)
- [ ] 프롬프트 조립 (`DEFAULTS[locale][purpose][gender]`)

### Phase 4: monk.kr → Cloud Run 직접 호출 전환 (안정화 후)

- [ ] photolab 프론트엔드 API 호출을 monkos.ai 직접으로 변경
- [ ] Phase 1 CF Workers를 폴백 또는 퇴역
- [ ] Vertex ADC 체제 통일 확인

---

## 6. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| Imagen I2I Vertex 미지원 지속 | API Key 예외 유지 | Google 로드맵 모니터링 |
| Cloud Run 콜드 스타트 재발 | 첫 요청 지연 | min-instances=1 유지 |
| CORS 이슈 (monk.kr → monkos.ai) | 크로스 오리진 차단 | Cloud Run CORS 헤더 설정 (이미 적용) |
| Gemini rate limit (대규모) | 동시 요청 실패 | Vertex 쿼터 증설 신청 |
| Firestore 키워드 RAG 한계 | 검색 품질 | 시맨틱 검색 전환 (Vertex Embeddings) |

---

## 7. 핵심 원칙

1. **CF는 배포+비즈니스, GCP는 AI** — 각자 잘하는 걸 한다
2. **RAG 지식풀 공유** — 모든 채널이 같은 지식을 알고, 대화 방식만 다름
3. **Vertex AI ADC 기본, API Key는 불가피한 예외만** — 인증 체계 통일
4. **monk.kr에서 먼저 검증, monkos.ai는 안정된 것만 반영** — 실험장 분리
5. **프록시 금지, 직접 호출** — 배포라인이 다른 시스템을 억지로 엮지 않는다
