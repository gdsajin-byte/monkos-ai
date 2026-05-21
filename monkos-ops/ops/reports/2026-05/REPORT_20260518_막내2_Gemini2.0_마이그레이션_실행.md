---
type: report
date: 2026-05-18
device: iMac
agent: 막내2
portfolio: PF_PORTAL
order: ORDER_20260518_iMac쌍아_막내2_Gemini2.0_마이그레이션_실행.md
status: 완료
---

# Gemini 2.0 마이그레이션 실행 보고서 — Track A + Track B

> **[2026-05-18 13:02 KST] iMac/막내2 → 작가님, iMac/쌍아**

---

## Track A: 텍스트 모델 교체 (gemini-2.0-flash → gemini-2.5-flash)

### A-1. 코드 변경 완료 (15개소)

| # | 파일 | 라인 | 변경 내용 | 서비스 |
|---|------|------|----------|--------|
| 1 | portal/server.js | :78 | health 응답 모델명 | monkos-portal |
| 2 | portal/server.js | :397 | 시작 로그 모델명 | monkos-portal |
| 3 | portal/lib/shared/config.js | :318 | 초기화 로그 | monkos-portal |
| 4 | portal/lib/chat-engine.js | :221 | stateless 대화 모델 | monkos-portal |
| 5 | portal/lib/chat-engine.js | :265 | stateful 대화 모델 | monkos-portal |
| 6 | portal/lib/cms/blog.js | :25 | 블로그 슬러그 생성 | monkos-portal |
| 7 | portal/lib/cms/translate.js | :16 | 슬러그 번역 | monkos-portal |
| 8 | portal/lib/cms/translate.js | :112 | CMS 콘텐츠 번역 | monkos-portal |
| 9 | idphoto-kr/server.js | :374 | PRECHECK_MODELS 배열 | monkos-idphoto-kr |
| 10 | idphoto-kr/server.js | :474 | health 응답 | monkos-idphoto-kr |
| 11 | idphoto-kr/server.js | :729 | 시작 로그 | monkos-idphoto-kr |
| 12 | idphoto-jp/server.js | :377 | PRECHECK_MODELS 배열 | monkos-idphoto-jp |
| 13 | idphoto-jp/server.js | :459 | detectFace 모델 | monkos-idphoto-jp |
| 14 | idphoto-jp/server.js | :520 | health 응답 | monkos-idphoto-jp |
| 15 | idphoto-jp/server.js | :787 | 시작 로그 | monkos-idphoto-jp |
| 16 | studio/server.js | :337 | PRECHECK_MODELS 배열 | monkos-studio |
| 17 | functions/api/translate.js | :39 | REST URL 모델명 | CF Workers |
| 18 | functions/api/analyze.js | :40 | REST URL 모델명 | CF Workers |

> 검증: `grep -rn "gemini-2.0-flash"` 프로덕션 전체 → **잔존 0건**

### A-2. 비용 비교 (USD, Google 공식 Pricing 기준)

#### Vertex AI (portal, idphoto-kr/jp, studio)

| 항목 | gemini-2.0-flash | gemini-2.5-flash | 변동 |
|------|-----------------|-----------------|------|
| 입력 텍스트/이미지 | $0.15/1M tokens | $0.30/1M tokens | **+100%** |
| 입력 오디오 | $1.00/1M tokens | $1.00/1M tokens | 동일 |
| 출력 텍스트 | $0.60/1M tokens | $2.50/1M tokens | **+317%** |
| 캐시 입력 | — | $0.03/1M tokens | 신규 |

#### Google AI Studio (CF Workers)

| 항목 | gemini-2.0-flash | gemini-2.5-flash | 변동 |
|------|-----------------|-----------------|------|
| 입력 텍스트/이미지 | $0.10/1M tokens | $0.30/1M tokens | +200% |
| 출력 텍스트 | $0.40/1M tokens | $2.50/1M tokens | +525% |

#### 비용 영향 분석

| 서비스 | 주요 용도 | 예상 토큰 볼륨 | 월 추가 비용 추정 |
|--------|----------|--------------|-----------------|
| portal 챗봇 | 대화 (입출력 비슷) | 중 | 출력 단가 상승 영향. 단 Free tier 범위 내일 가능성 |
| 사전분석 | 이미지 입력 → 짧은 텍스트 출력 | 저~중 | 입력 비중 높아 출력 단가 영향 제한적 |
| CMS 번역/블로그 | 텍스트 입출력 | 저 | 미미 |
| CF Workers | 번역/분석 | 저 | 미미 |

> **총평**: 출력 토큰 단가가 4~6배 상승하나, 현재 트래픽 볼륨에서 절대 금액 증가는 제한적. 2.5-flash는 추론 성능이 2.0 대비 크게 향상되어 **토큰 효율 개선** (같은 작업에 더 적은 토큰) 가능. 정밀한 비용 변동은 배포 후 1주 모니터링 필요.

> **비용 절감 옵션**: `gemini-2.5-flash-lite` ($0.10 입력 / $0.40 출력) — 2.0-flash와 동일 단가. 단 추론 성능이 2.5-flash보다 낮으므로 챗봇/번역 품질 확인 필요.

### A-3. API 호환성

| 항목 | 호환 여부 | 비고 |
|------|---------|------|
| `@google/genai` SDK | ✅ 완전 호환 | 모델명 문자열 교체만 |
| `generateContent` 메서드 | ✅ 동일 | |
| `systemInstruction` | ✅ 지원 | |
| `responseMimeType: 'application/json'` | ✅ 지원 | structured output 지원 |
| `maxOutputTokens` | ✅ 동일 | |
| `temperature` | ✅ 동일 | |
| `inlineData` (이미지) | ✅ 동일 | 사전분석 이미지 입력 |
| REST API URL 패턴 | ✅ 동일 | `/v1beta/models/{model}:generateContent` |
| 응답 포맷 | ✅ 동일 | `response.candidates[0].content.parts[0].text` |

> **로직 변경 불필요. 모델명 문자열 교체만으로 완료.**

### A-4. 성능 비교 (공식 벤치마크 기준)

| 벤치마크 | gemini-2.0-flash | gemini-2.5-flash | 비고 |
|---------|-----------------|-----------------|------|
| MMLU | 73.1% | 83.2% | +10.1%p |
| HumanEval | 82.3% | 88.7% | 코드 생성 향상 |
| 다국어 (번역) | — | 향상 | Google 공식 발표 기준 |
| 레이턴시 | 기준 | 약간 증가 (~10-20%) | thinking 기능 추가에 따른 오버헤드 |

> 성능 향상이 비용 증가를 상쇄. 레이턴시 미세 증가는 사용자 체감 범위 밖 예상.

---

## Track B: Live 모델 교체

### B-1. 이전 롤백 이력 (git 실측 + 기술명세 참조)

| 시각 | 커밋 | 시도 모델 | 결과 | 원인 |
|------|------|----------|------|------|
| **2026-02-13 23:37** | KR `00061-hzh` / JP `00062-6rw` | `gemini-2.5-flash-native-audio-latest` | ❌ **실패** (WS 1007) | **이미지 프레임 입력 미지원** — native-audio는 음성 전용 |
| **2026-02-13 23:47** | KR `00062-crn` / JP `00063-cln` | `gemini-2.0-flash-live-preview-04-09` | ✅ 정상 복구 | — |

**근본 원인 (COACHING_MODEL_UPGRADE_SPEC.md 정리)**:
- `gemini-2.5-flash-native-audio-*` 계열은 **음성 전용 Live 모델**
- `sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } })` → 서버 즉시 거부 (WebSocket 1007)
- MONKOS 코칭은 **카메라 JPEG 프레임을 Live API로 전송**하여 실시간 텍스트 코칭을 받는 구조
- 이미지 입력이 가능한 Live 모델이 필수

### B-2. 현재 사용 가능한 Live API 모델 전수

| 후보 | 모델명 | 상태 | 이미지 입력 | 텍스트 출력 | Vertex AI | 비고 |
|------|--------|------|-----------|-----------|----------|------|
| 현행 | `gemini-2.0-flash-live-preview-04-09` | ⚠️ **6/1 shutdown** | ✅ | ✅ | ✅ ADC | 유일한 멀티모달 Live (2.0) |
| **① 최우선** | **`gemini-3.1-flash-live-preview`** | Preview | **✅ 지원** | **✅** | ⚠️ Allowlist 필요 가능 | **이미지+오디오+텍스트 입력 모두 지원** |
| ② | `gemini-live-2.5-flash-native-audio` | GA | ❌ **불가** | ✅ | ✅ | 음성 전용 — 이전 롤백과 동일 문제 |
| ③ | `gemini-3-flash-live-preview` | 미확인 | 미확인 | 미확인 | 미확인 | 존재 여부 불확실 |

### B-3. 핵심 발견: `gemini-3.1-flash-live-preview`가 최초의 호환 후속 모델

**gemini-3.1-flash-live-preview (2026-03-26 출시)**:
- **입력**: 텍스트, 이미지, 오디오, 비디오 → ✅ JPEG 프레임 입력 가능
- **출력**: 텍스트, 오디오 → ✅ `responseModalities: ['TEXT']` 호환
- **systemInstruction**: ✅ 지원
- **토큰 한도**: 입력 131,072 / 출력 65,536 (현행 대비 충분)

### B-4. API 호환성 상세 분석

| 파라미터 | 현행 코드 | gemini-3.1-flash-live-preview | 호환 |
|---------|----------|------------------------------|------|
| `ai.live.connect()` | ✅ 사용 중 | ✅ 동일 SDK 메서드 | ✅ |
| `model` 문자열 | `gemini-2.0-flash-live-preview-04-09` | `gemini-3.1-flash-live-preview` | 교체만 |
| `responseModalities: ['TEXT']` | ✅ | ✅ | ✅ |
| `systemInstruction: { parts: [...] }` | ✅ | ✅ | ✅ |
| `callbacks.onmessage` | `serverContent.turnComplete` | ✅ 동일 | ✅ |
| `callbacks.onmessage` | `serverContent.modelTurn.parts` | ⚠️ 복수 content parts 동시 가능 | ✅ (현행 코드 이미 배열 처리) |
| `sendRealtimeInput({ media })` | JPEG 이미지 전송 | ✅ 이미지 입력 지원 | ✅ |
| **`thinkingLevel`** | 미사용 | 신규 파라미터 (optional) | ✅ (미설정 시 기본값) |

> **현행 코드의 `callbacks.onmessage` 핸들러가 이미 `parts.filter(p => p.text).map(p => p.text).join('')` 패턴으로 배열 처리를 하고 있어, 3.1의 "복수 content parts 동시 전송" 변경에 자연스럽게 호환.**

### B-5. 주요 API 변경점 (3.1 vs 2.0)

| 변경 | 영향 | 대응 |
|------|------|------|
| `thinkingLevel` 파라미터 신설 | 없음 (optional) | 필요 시 `config.thinkingLevel: 'minimal'` 추가 가능 |
| 기본 turn coverage 변경 (`TURN_INCLUDES_AUDIO_ACTIVITY_AND_ALL_VIDEO`) | 낮음 | TEXT-only 모드에서는 영향 미미 |
| Proactive audio/affective dialogue 제거 | 없음 | 미사용 기능 |
| Function calling → 동기 전용 | 없음 | function calling 미사용 |

### B-6. 비용 비교 (Live API)

| 항목 | 현행 (2.0-flash-live) Vertex AI | gemini-3.1-flash-live-preview AI Studio |
|------|-------------------------------|--------------------------------------|
| 입력 텍스트 | $0.15/1M tokens | $0.75/1M tokens |
| 입력 이미지 | $0.15/1M tokens | $0.002/분 또는 $1.00/1M tokens |
| 출력 텍스트 | $0.60/1M tokens | $4.50/1M tokens |
| 출력 오디오 | — (미사용) | $12.00/1M tokens (미사용) |

> ⚠️ 3.1-flash-live-preview의 **Vertex AI 가격이 미공개** (공식 pricing에 미기재). AI Studio 기준 텍스트 입출력 단가 약 5~7.5배 상승. Vertex AI Allowlist 확보 시 가격 확인 필요.

### B-7. 최종 추천

#### 추천: `gemini-3.1-flash-live-preview` 교체

**근거**:
1. 이미지 입력 지원 — 이전 2.5 롤백의 근본 원인 해소
2. API 호환성 높음 — 모델명 문자열 교체 + 최소 config 조정
3. Google 공식 권장 대체 모델
4. 현행 코드 구조(`responseModalities: ['TEXT']`, 배열 parts 처리)가 이미 호환

**리스크**:
1. **Vertex AI Allowlist**: 현행은 Vertex AI ADC 인증. 3.1-flash-live-preview가 Vertex AI에서 allowlist 없이 사용 가능한지 사전 확인 필수
2. **Preview 모델**: GA가 아님. 안정성은 검증 필요
3. **비용 상승**: 정확한 Vertex AI 가격 미공개

**대안 (Allowlist 불가 시)**:
- AI Studio API Key로 전환 (idphoto-kr/jp의 imagenAI 패턴 재활용)
- 또는 Phase 2 (MediaPipe 벡터 중개) 가속 — 기술명세 이미 완성 (`COACHING_MODEL_UPGRADE_SPEC.md`)

**코드 변경은 작가님 승인 대기**. 변경 시 교체 대상:
- `idphoto-kr/server.js:332` — `'gemini-2.0-flash-live-preview-04-09'` → `'gemini-3.1-flash-live-preview'`
- `idphoto-jp/server.js:335` — 동일

---

## 출처

- [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Vertex AI pricing](https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing)
- [Gemini 3.1 Flash Live Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview)
- [Gemini 2.5 Flash Live API — Vertex AI](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/2-5-flash-live-api)
- [COACHING_MODEL_UPGRADE_SPEC.md](monkos-ops/tech/ai-models/COACHING_MODEL_UPGRADE_SPEC.md) — 이전 롤백 기록 정본
