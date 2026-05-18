---
type: report
date: 2026-04-28
author: iMac/민아
subject: 나노바나나2 정체 + monkos.ai 이미지 생성 코드/아키텍처/사용툴 전수 분석
data_source: WebSearch (DeepMind/blog.google/AI for Developers) + Agent(Explore) thorough audit + 4/28 PROPOSAL
related: PROPOSAL_20260428_스튜디오고도화_모델스왑_프로필스.md / PF_STUDIO / PF_PROFILES / governance/philosophy/aphorisms/PHIL_20260301_버텍스우선.md
---

# 나노바나나2 + monkos 이미지 엔진 전수 분석

**[2026-04-28 15:35 KST] iMac/민아 → 작가님**

> 작가님 지시: "나노바나나2 코드와 아키텍쳐 사용툴등 모두 분석"

---

## 0. 결론 한 페이지

| 항목 | 사실 |
|------|------|
| **나노바나나2 정체** | Google **Gemini 3.1 Flash Image** (2026-02-26 출시). nano-banana(2025-08, Gemini 2.5 Flash Image)의 후속. Flash 라인 = 빠르고 저렴 |
| **우리가 이미 쓰는 모델** | `gemini-3-pro-image-preview` (Gemini 3 **Pro** Image, 나노바나나2와 **다른 라인**) — I2I 정본 엔진으로 13곳 일관 사용 |
| **나노바나나2 = 신규 후보** | Pro 라인 대비 빠름·저렴·14 ref images·14 aspect ratios·real-time web search. 도입 시 응답속도/원가 개선 |
| **4/28 PROPOSAL 정합성** | 쌍아의 모델 스왑 아키텍처 제안이 정확히 이 도입을 받는 그릇 — `engines/nanobanana.js` 어댑터로 추가 가능 |
| **위험** | 정체성 보존(90% same)은 우리 절대 원칙. 나노바나나2는 fidelity가 Pro보다 낮을 수 있어 **A/B 검증 필수** |

**한 줄**: 나노바나나2는 우리가 이미 쓰는 Gemini 3 Pro Image의 **빠르고 싼 사촌**. 4/28 쌍아 PROPOSAL의 어댑터 구조로 **추가 모델로 도입 후 A/B 비교 → 정체성 품질 OK면 일부 트래픽 전환** 권고.

---

## 1. 나노바나나2 외부 정보 (WebSearch 종합)

### 1-1. 정확한 정체
- **공식 명칭**: Nano Banana 2 = **Gemini 3.1 Flash Image**
- **출시**: 2026-02-26 (TechCrunch 보도)
- **Google DeepMind 라인업**:
  ```
  nano-banana (1세대) = Gemini 2.5 Flash Image (2025-08)
  nano-banana 2      = Gemini 3.1 Flash Image (2026-02-26)
  ```
- **위치**: Gemini, Search(Google Lens/AI Mode 141개국), Ads에 default 적용 중

### 1-2. 핵심 능력
- **해상도**: 512px ~ 4K
- **레퍼런스 이미지**: 최대 **14장**
- **종횡비**: 14가지
- **실시간 웹 검색** 통합 (피사체 정확도)
- **Subject consistency** 강화 (정체성 보존 라인 — 우리 핵심 요건)
- **속도**: Gemini Flash 라인 = Pro 대비 압도적으로 빠름
- **비용**: Flash 라인 = 토큰당 가격 저렴

### 1-3. 우리가 쓰는 `gemini-3-pro-image-preview`와의 관계
| | nano-banana 2 (Gemini 3.1 Flash Image) | gemini-3-pro-image-preview |
|---|----|----|
| 라인 | **Flash** (빠름·저렴) | **Pro** (큼·디테일) |
| 출시 | 2026-02-26 | (preview 단계, 정확 일자 미공개) |
| 응답속도 | 매우 빠름 | 상대적으로 느림 |
| Fidelity | Subject consistency 강하지만 Pro보다는 낮을 가능성 | 최고 디테일, 고품질 |
| 14 ref images | ✓ | 미확인 |
| Real-time web search | ✓ | ✗ |
| API 엔드포인트 | `gemini-3.1-flash-image` (가칭, 공식 ID 확인 필요) | `gemini-3-pro-image-preview` |

→ **별개 모델**. 4/28 쌍아 PROPOSAL이 두 모델을 **별도 어댑터로 분리한 것이 정합**.

---

## 2. 우리 코드베이스 — 모델별 사용 매트릭스

### 2-1. 모델 × 위치 × 용도

| 모델 | 호출 방식 | 용도 | 위치 | 인증 |
|------|---------|------|------|------|
| **gemini-3-pro-image-preview** | REST API | I2I (증명사진 정본) | studio/server.js, idphoto-kr/jp/server.js, [functions/api/refine.js](functions/api/refine.js), [monkos-ops/tech/archive/functions_cf/api/photo.js](monkos-ops/tech/archive/functions_cf/api/photo.js), monk_imagen4/backend | API Key (GEMINI_API_KEY) |
| **Imagen 4 ultra/fast** | Vertex AI SDK | T2I | [apps/monk_imagen4/backend/server.js:99-101](apps/monk_imagen4/backend/server.js) | ADC (Vertex AI) |
| **Imagen 3.0** (generate/capability-001/002) | REST API | T2I/I2I/Edit/Upscale | apps/monk_imagen4/modules/imagen3-pro/Imagen3ProSuite.ts | API Key |
| **gemini-2.0-flash** | REST API | 텍스트 분석/번역/precheck | functions/api/analyze.js, idphoto-*/precheck | API Key |
| **gemini-2.0-flash-live-preview-04-09** | Vertex AI SDK (Live WS) | 실시간 코칭 | idphoto-kr/jp 라이브 채널 | ADC |
| **gemini-2.5-flash** | REST API/SDK | coaching/precheck/QC | photolab/engine/server.js, MONK_kr AI Lab | API Key/ADC 혼합 |

### 2-2. 호출 패턴 분류

```
T2I (Text-to-Image):
  ├─ Imagen 4 ultra/fast  → apps/monk_imagen4/backend/server.js (Vertex AI)
  └─ Imagen 3.0           → modules/imagen3-pro (Suite, 레거시 유지)

I2I (Image-to-Image, 증명사진 정본):
  └─ gemini-3-pro-image-preview → 13곳 일관 사용
     • REST endpoint: generativelanguage.googleapis.com/v1beta/models/...:generateContent?key={apiKey}
     • base64 입력 + IDENTITY_PRESERVATION 프롬프트
     • safetySettings: BLOCK_NONE × 4 (정체성 보존 의도)
     • responseModalities 미사용 (photo.js 정본 패턴)

Edit (Inpaint):  Imagen 3 capability-001:editImage (modules/imagen3-pro만)
Upscale:         Imagen 3 capability-002:upscaleImage (modules/imagen3-pro만)
Vision/Analysis: gemini-2.0-flash (functions/api/analyze.js, JSON 출력)
Live Coaching:   gemini-2.0-flash-live (WebSocket, idphoto Live 채널)
```

---

## 3. 아키텍처 — Wrapper 계층 다이어그램

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│ • monk_imagen4 React App (Imagen4UI.tsx, Imagen3ProUI.tsx)  │
│ • idphoto-kr/jp Web UI (Vanilla)                             │
│ • studio Web UI (3컬럼 SPA, 4/28 PROPOSAL의 변경 대상)        │
└───────────────────┬──────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────────┐  ┌───────▼────────────┐
│ ModuleLoader.ts    │  │ geminiService.ts   │
│ (EngineInterface)  │  │ (고레벨 추상화)    │
│ • Imagen4Generator │  │ • I2I 래퍼         │
│ • Imagen3ProSuite  │  │ • photo.js 패턴    │
└───────┬────────────┘  └───────┬────────────┘
        │                       │
        │   Backend API Layer   │
┌───────▼───────────────────────▼────────────┐
│ A) monk_imagen4/backend/server.js          │
│    (Vertex AI Imagen 4 전용)               │
│    /generate /batch-generate /refine       │
│                                            │
│ B) functions/api/*.js                      │
│    (Cloudflare Workers)                    │
│    /refine /generate /analyze /precheck    │
│                                            │
│ C) monkos_AI/{studio,idphoto-kr,idphoto-jp,│
│    portal}/server.js                       │
│    (Cloud Run Express)                     │
│    /api/idgen /api/precheck /api/coaching  │
└────────────────────┬───────────────────────┘
                     │
┌────────────────────▼───────────────────────┐
│ Google AI / Vertex AI APIs                 │
│ • generativelanguage.googleapis.com        │
│   - gemini-3-pro-image-preview ⭐ (정본)   │
│   - imagen-3.0-generate-001               │
│ • aiplatform.googleapis.com (Vertex)       │
│   - PredictionServiceClient.predict()      │
│   - imagen-4.0-ultra/fast                  │
│   - gemini-2.0-flash-live (WS)             │
└────────────────────────────────────────────┘
```

### 3-1. 사용 도구 / SDK / 라이브러리

| 도구 | 용도 | 위치 |
|------|-----|------|
| **@google-cloud/aiplatform** | Vertex AI PredictionServiceClient (Imagen 4) | apps/monk_imagen4/backend |
| **@google/genai** | Generative AI SDK (NPM) | studio, idphoto, photolab, portal |
| **fetch (REST 직접)** | gemini-3-pro-image-preview, imagen-3.0 (Vertex AI 미지원) | refine.js, photo.js, idphoto-*, studio |
| **WebSocket** | gemini-2.0-flash-live-preview Live 코칭 | idphoto-kr/jp |
| **Cloudflare Workers** | functions/api/* (정본은 루트 functions/) | functions/ |
| **Express (Node)** | monkos_AI/* server.js, monk_imagen4/backend | Cloud Run |

### 3-2. 인증 분포 (이중 인증 구조)
```
Vertex AI ADC (프로덕션 Cloud Run)
  ├─ Imagen 4 ultra/fast   (T2I, 고품질)
  ├─ gemini-2.0-flash-live (Live WS, idphoto 코칭)
  └─ gemini-2.5-flash      (분석, photolab)

Google AI Studio API Key (GEMINI_API_KEY 환경변수)
  ├─ gemini-3-pro-image-preview ⭐ (Vertex AI 미지원이라 어쩔 수 없이 API Key)
  ├─ imagen-3.0-generate-001
  ├─ gemini-2.0-flash (텍스트)
  └─ gemini-2.5-flash (일부 위치)
```

→ 메모리 격언 `governance/philosophy/aphorisms/PHIL_20260301_버텍스우선.md` 원칙: **Vertex AI 우선, 단 미지원 모델은 API Key 허용**. 현재 정합.

---

## 4. 4/28 PROPOSAL과 나노바나나2 도입의 정합성

### 4-1. 쌍아 PROPOSAL이 만드는 그릇
```
engines/
├── base.js           ← EngineAdapter 인터페이스 (generate, parseResponse, transformPrompt)
├── gemini-3-pro.js   ← 현재 정본 (gemini-3-pro-image-preview)
├── imagen-4.js       ← Imagen 4 (Vertex AI)
├── nanobanana.js     ← 나노바나나2 (gemini-3.1-flash-image) ⭐
└── flux.js           ← Flux (Replicate, 외부)
```

### 4-2. 나노바나나2 도입 시 변경 범위
| 단계 | 작업 | 파일 |
|------|------|------|
| 1 | 어댑터 추가 | `engines/nanobanana.js` (신규, ~150줄 추정) |
| 2 | 모델 ID 등록 | `engines/registry.js` (Phase A 산출물) |
| 3 | 프론트 드롭다운 | `studio/web/app.js` model 옵션 추가 |
| 4 | A/B 비교 UI | Phase B 작업 (같은 입력 → 다중 모델 결과 나란히) |
| 5 | 프롬프트 변환 | `transformPrompt` — 14 ref images 포맷 차이 흡수 |
| 6 | 검증 통과 시 | 일부 트래픽 → 나노바나나2로 전환 (광고 부스터처럼) |

### 4-3. 도입 후 비용/속도 시뮬레이션 (개략)

가정 (실측 필요): nano-banana-2가 Pro 대비 응답속도 3-5배, 토큰 가격 1/3
- 현재 idphoto-jp/kr 라이브 매출의 인프라 비용: 이미지 생성당 약 $0.05~0.10 추정 (Pro)
- 나노바나나2 전환 시: $0.015~0.035 추정 (Flash)
- 응답시간: 30초 → 6~10초 추정 → **사용자 만족도/이탈률 직접 영향**

### 4-4. 위험 — 정체성 보존(우리 절대 원칙)
- 헌법 제1조 3항 + photo.js 패턴: "원본 정체성 보존이 최우선 원칙"
- 나노바나나2는 subject consistency 강화됐다고 광고하지만 **Pro보다 낮을 수 있음**
- → **Phase B의 A/B 비교 필수**. 같은 입력 100건 정도로 정체성 점수 비교 후 결정

---

## 5. 발견된 위험·중복 패턴

| 패턴 | 위치 | 평가 |
|------|------|------|
| BLOCK_NONE × 4 일괄 적용 | 13곳 | 🟢 의도적 정체성 보존, photo.js 정본 |
| IDENTITY_PRESERVATION 프롬프트 4곳 중복 | studio, photolab/engine, photo.js, idphoto-* | 🟡 공통 라이브러리화 권장 |
| `gemini-3-pro-image-preview` 호출 URL 4곳 분산 | refine.js, studio, photo.js, idphoto-* | 🟡 모델 스왑 시 4곳 동시 수정 — **PROPOSAL 어댑터 구조가 정확히 해결하는 문제** |
| Imagen3ProSuite 레거시 미사용 | modules/imagen3-pro | 🟢 보존 OK, 활성 호출 없음 |
| responseModalities 위반 | (없음) | 🟢 모든 곳에서 photo.js 패턴 준수 |
| Vertex AI ADC vs API Key 이중 운영 | 전체 | 🟢 모델 지원 한계로 불가피, 정상 |

---

## 6. 권고

### 🔴 P0 (의사결정 필요)
- **나노바나나2 도입을 PROPOSAL Phase B의 첫 추가 모델로 확정**
- 작가님 비즈니스 (소액 결제, 거래량 많음, 응답속도가 만족도 직결) 컨텍스트와 정합
- LS 수수료 12.7% + 인프라 비용 줄이면 마진 가시화

### 🟡 P1
- **A/B 비교 평가 기준 사전 정의**: 정체성 보존 점수(face match), 응답시간, 비용, 사용자 만족도 (refund 비율)
- **fallback 자동 전환**: 나노바나나2 응답 안 오거나 정체성 점수 임계 아래 → Pro로 자동 fallback (`base.js`에 fallback 인터페이스 추가)
- **IDENTITY_PRESERVATION 공통 라이브러리화** (rrops 정도 — `prompts/common.js`로 통합)

### 🟢 P2
- **모델 비용·속도 모니터링 대시보드**: 모델별 호출 카운트/평균 응답시간/비용을 GA4/내부 로그에서 집계
- 향후 Imagen 5 / Gemini 4 출시 시 같은 어댑터 구조로 즉시 추가

---

## 7. 다음 단계

| 트랙 | 산출물 |
|------|--------|
| **N1** (지시 시) | 나노바나나2 어댑터 코드 초안 (engines/nanobanana.js) |
| **N2** (지시 시) | A/B 비교 평가 프로토콜 설계 (테스트 케이스 100건 + 평가 지표) |
| **N3** (지시 시) | IDENTITY_PRESERVATION 공통 라이브러리화 PR |
| **N4** | 나노바나나2 정확한 model ID 확인 (Google AI Studio API에서 model list 호출) — 현재 추정 `gemini-3.1-flash-image` |

---

## 부록 — 데이터 출처

```
WebSearch: "nano banana 2 Gemini image model 2026 release Google" → 10건 (DeepMind/blog.google/TechCrunch/Wikipedia)
Agent(Explore) thorough audit: monk_imagen4 / monkos_AI / MONK_kr / functions / monkos-ops/tech 전수
Read: PROPOSAL_20260428_스튜디오고도화_모델스왑_프로필스.md
Bash grep: 나노바나나/gemini/imagen 키워드 사전 스캔
```

Sources (외부):
- [Nano Banana 2: Google's latest AI image generation model (blog.google)](https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/)
- [Gemini Image – Nano Banana — Google DeepMind](https://deepmind.google/models/gemini-image/)
- [Build with Nano Banana 2 (Google Developers)](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/)
- [Nano Banana image generation - Google AI for Developers](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google launches Nano Banana 2 model with faster image generation (TechCrunch, 2026-02-26)](https://techcrunch.com/2026/02/26/google-launches-nano-banana-2-model-with-faster-image-generation/)

— iMac/민아
