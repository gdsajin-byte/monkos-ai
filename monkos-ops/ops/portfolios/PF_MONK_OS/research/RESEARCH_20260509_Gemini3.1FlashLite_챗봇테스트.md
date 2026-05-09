---
type: research
date: 2026-05-09
author: iMac/막내1
pf: PF_MONK_OS
subject: Gemini 3.1 Flash-Lite 챗봇 품질 테스트 — 4개 모델 비교
---

# Gemini 챗봇 품질 비교 테스트

**[2026-05-09 16:21 KST] iMac/막내1**

---

## 1. 테스트 환경

| 항목 | 값 |
|------|-----|
| 시스템 프롬프트 | `monkos_AI/portal/lib/prompts.js` SYSTEM_PROMPT_KR 기반 |
| 채널 설정 | web 채널: temperature 0.7, maxOutputTokens 300 |
| SDK | `@google/genai` (Python `google-genai`) |
| 인증 | API Key (Google AI Studio) |

## 2. 테스트 모델

| 모델 | API 명칭 | 상태 | 비고 |
|------|---------|------|------|
| **2.0 Flash** | `gemini-2.0-flash` | 현행 (6/1 EOL) | 기준선 |
| **2.5 Flash** | `gemini-2.5-flash` | 안정 (10/16 EOL) | 중간 대안 |
| **3 Flash** | `gemini-3-flash-preview` | Preview | 고성능 대안 |
| **3.1 Flash-Lite** | `gemini-3.1-flash-lite` | 정식 | 비용 절약 대안 |

> ⚠️ **`gemini-3-flash`(non-preview)는 API Key 방식에서 미지원** (404 NOT_FOUND). `gemini-3-flash-preview`로만 접근 가능.

## 3. 핵심 발견: Thinking 기능 호환성 문제

**2.5-flash / 3-flash-preview에서 thinking 기능이 기본 활성화**, `maxOutputTokens` 300을 사고(思考) 토큰에 소비하여 **실제 응답이 10~26자로 절삭**되는 현상 발견.

| 모델 | thinking 기본값 | 300토큰 시 응답 | thinking OFF 시 응답 |
|------|----------------|----------------|---------------------|
| 2.0-flash | 없음 | ✅ 정상 (100~200자) | — |
| 2.5-flash | **활성** | ❌ 절삭 (11~26자) | ✅ 정상 (115~171자) |
| 3-flash-preview | **활성** | ❌ 절삭 (10~42자) | ✅ 정상 (158~238자) |
| 3.1-flash-lite | 없음 | ✅ 정상 (100~200자) | — |

**전환 시 필수 조치**: thinking 활성 모델로 교체 시 `thinkingConfig: { thinkingBudget: 0 }` 명시, 또는 `maxOutputTokens`를 1024+로 상향.

---

## 4. 시나리오별 응답 비교 (thinking OFF 기준)

### 시나리오 1: "증명사진 가격이 얼마예요?"

| 모델 | 시간 | 길이 | 가격 정확 | 품질 |
|------|------|------|----------|------|
| 2.0-flash | 1.47s | 75자 | ✅ 80c, ₩9,900 | 이모지 사용, 친근 |
| 2.5-flash | 1.36s | 115자 | ✅ 80c, ₩9,900 | 정확, 간결 |
| 3-flash | 1.61s | 172자 | ✅ 80c, ₩9,900 | URL 제시, 적극적 |
| 3.1-flash-lite | 1.32s | 147자 | ✅ 80c, ₩9,900 | 상세, 신규가입 안내 포함 |

### 시나리오 2: "여권사진 규격이 어떻게 되나요?"

| 모델 | 시간 | 규격 정확 | specs 링크 | 품질 |
|------|------|----------|-----------|------|
| 2.0-flash | 1.23s | ❌ 구체 수치 없음 (링크만) | ✅ | 회피형 |
| 2.5-flash | 1.51s | ✅ 3.5x4.5cm, 얼굴 2.5~3.5cm | ✅ | 정확 |
| 3-flash | 1.92s | ✅ 3.5x4.5cm, 정수리~턱 3.2~3.6cm | ✅ | 가장 정확 |
| 3.1-flash-lite | 2.07s | ✅ 3.5x4.5cm, 정수리~턱 3.2~3.6cm | ✅ | 정확 |

### 시나리오 3: "AI로 만들면 실물과 다르지 않나요?"

| 모델 | 시간 | 정체성 90% 언급 | 기술명 비공개 | 신뢰감 |
|------|------|----------------|-------------|--------|
| 2.0-flash | 1.24s | ✅ | ✅ | 이모지 과다 |
| 2.5-flash | 1.33s | ❌ 미언급 | ✅ | 간결, 신뢰 |
| 3-flash | 1.53s | ❌ 미언급 | ✅ | 코칭+보정 설명 |
| 3.1-flash-lite | 1.25s | ✅ 90% 언급 | ✅ | 프로페셔널 |

### 시나리오 4: "일본 취업 비자 사진 규격 알려주세요"

| 모델 | 시간 | 규격 정확 | URL 제시 | 품질 |
|------|------|----------|---------|------|
| 2.0-flash | 1.31s | ✅ 3.5x4.5cm | ✅ JP앱 | 간결 |
| 2.5-flash | 1.36s | ✅ 4.5x3.5cm | ⚠️ 미존재 URL | URL 생성 주의 |
| 3-flash | 1.80s | ✅ 35x45mm | ✅ specs + KR앱 | 가장 상세 |
| 3.1-flash-lite | 1.34s | ✅ 3.5x4.5cm | ✅ specs + JP앱 | 정확 |

### 시나리오 5: "메이크업이나 보정은 어디까지 되나요?"

| 모델 | 시간 | 미출시 기능 | 과장 없음 | 품질 |
|------|------|-----------|----------|------|
| 2.0-flash | 1.42s | ✅ | ✅ | 구체적 (피부톤, 잡티, 윤곽) |
| 2.5-flash | 1.43s | ✅ | ✅ | "과도한 보정 아닌 자연" |
| 3-flash | 1.90s | ✅ | ⚠️ "비대칭 교정" 과장 | 메이크업 보정 범위 과대 |
| 3.1-flash-lite | 1.25s | ✅ | ✅ | 톤 보정+리터칭 안내 |

---

## 5. 평가 점수 매트릭스

| 기준 (가중치) | 2.0-flash | 2.5-flash | 3-flash | 3.1-flash-lite |
|--------------|-----------|-----------|---------|----------------|
| 정확도 (30%) | 3.5 | 4.0 | 4.5 | **4.5** |
| 한국어 자연스러움 (25%) | **4.5** | 4.0 | 4.0 | **4.5** |
| 응답 길이 적정성 (15%) | **5.0** | 4.0 | 3.5 | 4.0 |
| 응답 속도 (15%) | **5.0** | 4.5 | 3.5 | **5.0** |
| 헌법 준수 (15%) | **5.0** | 4.5 | 4.0 | **5.0** |
| **가중 총점** | **4.35** | **4.10** | **3.95** | **4.55** |

---

## 6. 비용 비교

| 모델 | 입력 $/1M | 출력 $/1M | 월 예상 (우리 트래픽) |
|------|-----------|----------|---------------------|
| 2.0-flash (현행) | $0.10 | $0.40 | ~$2-5 |
| 2.5-flash | $0.15 | $0.60 | ~$3-7 |
| 3-flash-preview | $0.50 | $3.00 | ~$10-25 |
| **3.1-flash-lite** | **$0.25** | **$1.50** | **~$5-12** |

---

## 7. 최종 추천

### ✅ 추천: `gemini-3.1-flash-lite`

| 항목 | 근거 |
|------|------|
| **품질** | 4개 모델 중 최고점 (4.55/5.0). 정확도와 자연스러움 모두 우수 |
| **비용** | 현행 대비 2.5x (월 ~$5-12). 3-flash 대비 절반 |
| **속도** | 2.0-flash와 동등 (1.25~2.07s). TTFT 체감 차이 없음 |
| **호환성** | thinking 기능 없음 → 현행 코드(`maxOutputTokens: 300`) **그대로 동작** |
| **안정성** | 정식 모델 (GA). preview 아님 |
| **한국어** | 2.0-flash 수준의 자연스러운 존댓말. 번역체 없음 |

### ⚠️ 전환 시 주의사항

1. **모델명 교체만으로 동작** — `gemini-2.0-flash` → `gemini-3.1-flash-lite`
2. **`maxOutputTokens: 300` 유지 가능** — thinking 없으므로 절삭 문제 없음
3. **2.5-flash/3-flash 사용 시**: 반드시 `thinkingConfig: { thinkingBudget: 0 }` 추가 또는 `maxOutputTokens` 1024+ 상향 필요
4. **URL 생성 주의**: 2.5-flash가 미존재 URL(`/specs/jp-visa`) 생성한 사례 확인. 3.1-flash-lite는 시스템 프롬프트 내 URL만 사용하여 안전

---

## 8. API 가용 모델 전체 목록 (2026-05-09 실측)

| 모델명 | 표시명 | 비고 |
|--------|--------|------|
| `gemini-2.0-flash` | Gemini 2.0 Flash | 6/1 EOL |
| `gemini-2.5-flash` | Gemini 2.5 Flash | 10/16 EOL. thinking 기본 ON |
| `gemini-2.5-flash-lite` | Gemini 2.5 Flash-Lite | — |
| `gemini-3-flash-preview` | Gemini 3 Flash Preview | thinking 기본 ON. `gemini-3-flash` 없음 |
| `gemini-3.1-flash-lite` | Gemini 3.1 Flash Lite | ✅ **추천** |
| `gemini-3.1-flash-lite-preview` | Gemini 3.1 Flash Lite Preview | lite의 preview 버전 |
| `gemini-3.1-flash-image-preview` | Nano Banana 2 | 이미지 생성 전용 |
| `gemini-3-pro-image-preview` | — | 이미지 Pro |
| `gemini-3.1-pro-preview` | Gemini 3.1 Pro Preview | — |
| `gemini-3.1-flash-live-preview` | Gemini 3.1 Flash Live Preview | Live API 전용 |

---

**본 테스트에서 코드 변경은 수행하지 않았다. /tmp 테스트 스크립트는 삭제 완료.**

---

*끝.*
