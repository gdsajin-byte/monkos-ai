---
type: research
date: 2026-05-09
author: iMac/막내1
pf: PF_MONK_OS
subject: Gemini 2.0 디프리케이션 대응 + 3.1 Flash 도입 방안
---

# Gemini 2.0 디프리케이션 대응 + 3.1 Flash 도입 방안

**[2026-05-09 15:58 KST] iMac/막내1**

> 선행 리서치: `REPORT_20260429_막내1_GoogleAI_인프라_로드맵.md` (4/29 전수 조사 기반)
> 본 보고서는 6/1 마감 대비 **현행화 + 구체 실행 방안**에 집중한다.

---

## 1. Gemini 2.0 디프리케이션 타임라인

| 이벤트 | 일정 | 출처 |
|--------|------|------|
| `gemini-2.0-flash` EOL | **2026-06-01** | 내부 세션 로그 + Google AI docs |
| `gemini-2.0-flash-live-preview-04-09` EOL | **2026-06-01** (동일 계열) | [미확인 — 공식 문서 비명시. 2.0 계열 일괄 EOL 추정] |
| Vertex AI SDK GenAI 모듈 제거 | 2026-06-24 | Google Cloud 공식 |
| `gemini-2.5-flash` EOL | 2026-10-16 | Google AI docs (연장됨) |

**잔여 시간: 23일** (5/9 → 6/1)

### 추가 디프리케이션 (웹 리서치 2026-05-09)

| 모델 | 종료일 | 비고 |
|------|--------|------|
| `imagen-3.0-generate-002` | **2026-06-30** | Gemini 이미지 모델로 마이그레이션 |
| Imagen 4.0 패밀리 (generate/ultra/fast) | **2026-06-24** | 동일 |
| Interactions API 레거시 스키마 | **2026-06-06** | `outputs[]` → `steps[]` 교체 |

### 영향 받는 API

- `generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` — **중단 예정**
- `@google/genai` SDK의 `model: 'gemini-2.0-flash'` 파라미터 — 모델명 교체 필요
- Live API (`gemini-2.0-flash-live-preview-04-09`) — 후속 모델 확인 필요

### 영향 받지 않는 것

- `gemini-3-pro-image-preview` — 3.x 계열, 영향 없음
- `gemini-3.1-flash-image-preview` — 3.x 계열, 영향 없음
- `@google/genai` SDK 자체 — 유지 (SDK 버전이 아닌 모델명만 교체)

**출처**: [Google AI Deprecations](https://ai.google.dev/gemini-api/docs/deprecations), [Vertex AI Model Versions](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/model-versions)

---

## 2. 후속 모델 정보

### 대체 모델 매핑 (웹 리서치 기반 확정)

| 현행 모델 | 대체 옵션 A (품질↑) | 대체 옵션 B (비용↓) | 비고 |
|-----------|-------------------|-------------------|------|
| `gemini-2.0-flash` | **`gemini-3-flash`** | **`gemini-3.1-flash-lite`** | A 권장. B는 예산 민감 시 |
| `gemini-2.0-flash-001` | `gemini-3-flash` | `gemini-3.1-flash-lite` | 동일 |
| `gemini-2.0-flash-live` | **`gemini-live-2.5-flash-native-audio`** | — | Live API 검증 필수 |

> **참고**: `gemini-2.5-flash`도 유효하나 **2026-10-16 EOL**이므로 2번 교체 불가피. `gemini-3-flash`로 직행이 효율적.

### 2026 현행 모델 라인업 (웹 리서치 확인)

| 모델 | 티어 | 컨텍스트 | 입력 $/1M | 출력 $/1M |
|------|------|---------|-----------|----------|
| `gemini-3.1-pro` | Frontier | 1M | $2.00 | $12.00 |
| **`gemini-3-flash`** | Workhorse | 1M | **$0.50** | **$3.00** |
| `gemini-3.1-flash-lite` | Budget | 1M | $0.25 | $1.50 |
| `gemini-2.0-flash` (EOL 6/1) | Legacy | 1M | $0.10 | $0.40 |
| `gemini-3-pro-image-preview` | Image | — | 영향 없음 | — |
| `gemini-3.1-flash-image-preview` | Image | 1M | 영향 없음 | — |

> `gemini-3.1-flash` (non-lite) 단독 모델은 없음. 3.x Flash 티어는 `gemini-3-flash`.
> Gemini 4 모델은 미발표.

### 가격 변동 분석

| | 2.0 Flash (현행) | 3-Flash (권장) | 3.1 Flash-Lite (절약) |
|---|-----------|---------|----------------|
| 입력/1M | $0.10 | $0.50 (**5x**) | $0.25 (2.5x) |
| 출력/1M | $0.40 | $3.00 (**7.5x**) | $1.50 (3.75x) |
| 월 예상 (우리 트래픽) | ~$2-5 | **~$10-25** | ~$5-12 |

> 절대 금액은 우리 트래픽(일 50~200건) 기준으로 여전히 낮음. 다만 **단가 기준 5~7배 상승**은 사실.
> `gemini-3.1-flash-lite`는 2.5x Flash 대비 TTFT 2.5배 빠르고 출력 속도 45% 향상.

**전략 결정**: `gemini-3-flash` 직행 권장 (2.5-flash 경유 시 10/16에 재교체 필요).

**출처**: [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing), [Gemini Models](https://ai.google.dev/gemini-api/docs/models), [DeepMind Model Cards](https://deepmind.google/models/)

---

## 3. 현행 MONK OS Gemini 의존성 전수

### A. 프로덕션 서비스 (6/1 전 필수 마이그레이션)

| 서비스 | 파일 | 모델 | 용도 | 참조 수 | 전환 난이도 |
|--------|------|------|------|---------|-----------|
| **idphoto-kr** | `server.js` | `gemini-2.0-flash` | precheck, 헬스체크 | 4 | ⭐ 낮음 |
| | | `gemini-2.0-flash-live-preview-04-09` | Live 코칭 | 1 | ⭐⭐ 중간 |
| | | `gemini-3-pro-image-preview` | I2I 생성 | — | 영향 없음 |
| **idphoto-jp** | `server.js` | `gemini-2.0-flash` | precheck, 분석, 헬스체크 | 5 | ⭐ 낮음 |
| | | `gemini-2.0-flash-live-preview-04-09` | Live 코칭 | 1 | ⭐⭐ 중간 |
| | | `gemini-3-pro-image-preview` | I2I 생성 | — | 영향 없음 |
| **portal** | `chat-engine.js` | `gemini-2.0-flash` | 챗봇 | 2 | ⭐ 낮음 |
| | `blog.js` | `gemini-2.0-flash` | 블로그 생성 | 1 | ⭐ 낮음 |
| | `translate.js` | `gemini-2.0-flash` | 번역 | 2 | ⭐ 낮음 |
| | `server.js` | `gemini-2.0-flash` | 헬스체크/로그 | 2 | ⭐ 낮음 |
| **studio** | `server.js` | `gemini-2.0-flash` | precheck | 1 | ⭐ 낮음 |
| | | `gemini-3.1-flash-image-preview` | NB2 이미지 | — | 영향 없음 |
| | | `gemini-3-pro-image-preview` | NB Pro 이미지 | — | 영향 없음 |

**프로덕션 합계**: `gemini-2.0-flash` **17건** + `gemini-2.0-flash-live` **2건** = **19건 마이그레이션 필요**

### B. CF Workers (monk.kr)

| 파일 | 모델 | 용도 |
|------|------|------|
| `functions/api/analyze.js` | `gemini-2.0-flash` | 분석 |
| `functions/api/translate.js` | `gemini-2.0-flash` | 번역 |
| `functions/api/generate.js` | `gemini-3-pro-image-preview` | 이미지 — 영향 없음 |
| `functions/api/refine.js` | `gemini-3-pro-image-preview` | 정제 — 영향 없음 |

**CF Workers**: 2건 마이그레이션 필요

### C. 스크립트/PoC (낮은 우선순위)

| 파일 | 모델 | 비고 |
|------|------|------|
| `portal/scripts/migrate_korean_slugs.js` | `gemini-2.0-flash` | 일회성 |
| `portal/scripts/retranslate_*.js` (3건) | `gemini-2.0-flash` | 일회성 |
| `portal/scripts/migrate_naver_full_content.js` | `gemini-2.0-flash` | 일회성 |
| `apps/MonkosChat/functions/index.js` | `gemini-2.0-flash-001` | PoC |
| `apps/monk-cam/demo/presentation_server.js` | `gemini-2.0-flash-live` | 데모 |
| `apps/photo-coach/server.js` | `gemini-2.0-flash` + `live` | PoC |
| `apps/monk_imagen4/backend/server.js` | `gemini-2.0-flash` | PoC |
| `apps/idphoto-jp-v079/server.js` | `gemini-2.0-flash` + `live` | 레거시 |

### D. 이미 완료

| 파일 | 모델 | 상태 |
|------|------|------|
| `MONK_kr/ai_lab/photolab/engine/server.js` | `gemini-2.5-flash` | ✅ 완료 (4/29) |

---

## 4. 도입방안 종합

### 전환 전략: 1회 직행 (2.5 경유 불필요)

| 대상 | 작업 | 시기 |
|------|------|------|
| `gemini-2.0-flash` 17건 + CF 2건 | 모델명 **`gemini-3-flash`** 로 교체 | **5월 4주차** |
| `gemini-2.0-flash-live` 2건 | `gemini-live-2.5-flash-native-audio` 전환 + Live API 검증 | **5월 4주차** |

> 2.5-flash 경유하면 10/16에 재교체 → 1회 직행이 효율적.

### 코드 변경 범위

**변경은 극히 단순** — 대부분 모델명 문자열 교체:

```javascript
// Before
model: 'gemini-2.0-flash'
// After
model: 'gemini-3-flash'
```

**예외**: Live API (idphoto-kr/jp 코칭)
- `gemini-2.0-flash-live-preview-04-09` → `gemini-live-2.5-flash-native-audio`
- Live API 연결 파라미터, 오디오 포맷 등 변경 가능성 → **별도 검증 필수**

### 모델명 중앙화 제안

현재 19건이 각 파일에 하드코딩. 향후 모델 교체 시 동일 작업 반복. 중앙 상수 파일 도입 제안:

```javascript
// monkos_AI/shared/models.js (신규)
export const MODELS = {
  TEXT_FAST: 'gemini-2.5-flash',
  IMAGE_PRO: 'gemini-3-pro-image-preview',
  IMAGE_FLASH: 'gemini-3.1-flash-image-preview',
  LIVE_COACHING: 'gemini-live-2.5-flash-native-audio',
};
```

### 테스트 계획

| 서비스 | 검증 항목 | 방법 |
|--------|----------|------|
| idphoto-kr/jp | 증명사진 precheck 정상 응답 | curl /health + 실제 사진 업로드 |
| | Live 코칭 연결 | 웹소켓 연결 + 음성 응답 확인 |
| portal | 챗봇 응답 품질 | 테스트 질문 5건 |
| | 번역 품질 | KO→JA/EN 비교 |
| | 블로그 생성 | 테스트 주제 1건 |
| studio | precheck | curl /health |
| CF Workers | 분석/번역 | curl 테스트 |

### 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 2.5-flash 응답 품질 차이 | 낮음 | 2.0 → 2.5는 상위 호환 |
| Live API 파라미터 변경 | 중간 | 검증 세션 별도 배정 |
| 가격 변동 | 낮음 | 2.5-flash 가격 ≈ 2.0-flash |
| CF Workers API Key 만료 | 낮음 | 별도 키 관리 (Secret Manager) |
| 6/1 마감 miss | 낮음 | 19건 모두 문자열 교체 수준. 1일 작업량 |

### 비용 영향

| 항목 | 2.0-flash | 3-flash | 변화 |
|------|-----------|---------|------|
| 입력 /1M | $0.10 | $0.50 | 5x |
| 출력 /1M | $0.40 | $3.00 | 7.5x |
| 예상 월 비용 | ~$2-5 | ~$10-25 | +$8~20 |

> 단가 상승은 크지만 우리 트래픽(일 50~200건) 절대 금액은 여전히 낮음. 비용이 민감해지면 `gemini-3.1-flash-lite` ($0.25/$1.50) 전환 검토.

---

## 5. 실행 타임라인

| 주차 | 작업 | 담당 |
|------|------|------|
| **5/12~16** | 모델명 중앙화 상수 파일 설계 + 교체 지시서 발행 | 쌍아 |
| **5/19~23** | 프로덕션 4서비스 `gemini-2.0-flash` → `gemini-3-flash` 교체 (19건) | 막내 (1일 작업) |
| | CF Workers 2건 모델명 교체 | 막내 (동시) |
| | Live API `gemini-2.0-flash-live` → `gemini-live-2.5-flash-native-audio` 전환 검증 | 막내 (별도 지시서) |
| **5/26~30** | 전 서비스 배포 + 검증 (증명사진 품질, 챗봇, 번역, Live 코칭) | 막내 + 민아 |
| **6/1** | `gemini-2.0-flash` EOL — 전환 완료 상태 | — |
| **6/6** | Interactions API 레거시 스키마 제거 — 코드 영향 확인 | 추가 점검 |
| **6/24** | Vertex AI SDK GenAI 모듈 제거 — 우리 코드 영향 없음 (`@google/genai` 사용 중) | — |
| **6/30** | Imagen 3.0 EOL — 우리 코드 영향 없음 (이미 `gemini-3-pro-image-preview` 사용) | — |

---

**본 보고서는 조사+설계이다. 코드 변경은 실행하지 않았다.**

---

*끝.*
