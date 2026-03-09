---
type: REPORT
date: 2026-03-06
from: M1/막내3
to: M1/쌍아
ref: ORDER_20260306_M1쌍아_막내3_Gemini모델전수조사+마이그레이션분석
---

# 보고서: Gemini/Vertex AI 모델 전수조사 + 마이그레이션 분석

> **[2026-03-06 05:00 KST] M1/막내3 → M1/쌍아**

---

## Phase A: 웹 리서치 — 모델 폐기 일정 + 후속 모델

### A-1. Google 공식 폐기 일정 (2026-03-06 기준)

출처: [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations) / [Vertex AI migration](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/migrate)

#### 우리 사용 모델 영향 요약

| 모델 ID | 우리 사용 여부 | AI Studio 폐기 | Vertex AI 폐기 | 후속 모델 | 상태 |
|---------|-------------|---------------|---------------|----------|------|
| `gemini-3-pro-preview` | **미사용** | 3/9 | 3/26 | `gemini-3.1-pro-preview` | 해당 없음 |
| `gemini-3-pro-image-preview` | **사용 중** (I2I) | **폐기 일정 없음** | — | — | **안전** |
| `gemini-2.0-flash` | **사용 중** (Pre-Check, QC, Portal) | 6/1 | 6/1 | `gemini-2.5-flash` | 여유 있음 |
| `gemini-2.0-flash-lite` | 미사용 | 6/1 | 6/1 | `gemini-2.5-flash-lite` | 해당 없음 |
| `gemini-2.0-flash-live-preview-04-09` | **사용 중** (Live 코칭) | **주의** (아래 상세) | — | `gemini-2.5-flash-native-audio` 계열 | **확인 필요** |
| `gemini-3-flash-preview` | **사용 중** (idphoto-jp QC) | 폐기 일정 없음 | — | — | **안전** |

### A-2. 핵심 질문 답변

#### Q1. `gemini-3-pro-image-preview`는 폐기 대상인가?

**아니오. 폐기 대상이 아닙니다.**

- 공식 deprecations 페이지에서 `gemini-3-pro-image-preview`는 "No shutdown date announced"로 명시
- 폐기 대상인 `gemini-3-pro-preview`(텍스트 모델)와는 **별도 라이프사이클**
- `gemini-3.1-pro-image-preview`는 **존재하지 않음** — 이미지 생성은 별도 트랙
- 현재 이미지 생성 모델 계보: `gemini-2.5-flash-image` → `gemini-3-pro-image-preview` → `gemini-3.1-flash-image-preview` (최신)

> **결론: 3/9 긴급 마이그레이션 불필요. I2I 엔진은 영향 없음.**

#### Q2. `gemini-2.0-flash-live-preview-04-09` (Live 코칭) 상태는?

**주의 필요.**

- 공식 deprecations 페이지에 이 정확한 모델 ID는 미등재
- 그러나 유사 모델 `gemini-2.0-flash-live-001`은 **2025-12-09에 이미 종료됨**
- Live API 계열은 `gemini-2.5-flash-native-audio` 시리즈로 전면 전환 중:
  - `gemini-2.5-flash-native-audio-preview-12-2025` (구)
  - `gemini-live-2.5-flash-native-audio` (GA, 현행)
- **현재 Live 코칭이 정상 작동 중이라면** 이 모델은 아직 살아있는 것이지만, 언제 종료될지 공지 없이 끊길 수 있음

> **결론: Live 코칭 모델은 deprecation 시한폭탄. 마이그레이션 계획 필요.**

#### Q3. 6/1 Flash 폐기 — 가격 영향은?

**3배가 아니라 최대 7.5배 (output 기준).**

| 항목 | gemini-2.0-flash | gemini-2.5-flash (후속) | 배율 |
|------|-----------------|----------------------|------|
| Input (text) | $0.10/1M | $0.15/1M | 1.5x |
| Output (text) | $0.40/1M | $1.50/1M | 3.75x |
| Input (audio) | $0.70/1M | $0.70/1M | 1x |

실제 사용 패턴별 영향:
- **Pre-Check** (idphoto-kr): 이미지 입력 + 짧은 텍스트 출력 → 약 2~3x
- **QC** (idphoto-jp fallback): 이미지 비교 + JSON 출력 → 약 2~3x
- **Portal 챗봇**: 텍스트 입출력 → 약 3~4x

단, `gemini-3-flash-preview`(현재 idphoto-jp QC 1차)는:
- Input: $0.50/1M (5x), Output: $3.00/1M (7.5x)
- 이미 고가 모델을 쓰고 있으므로, 2.0-flash를 3-flash-preview로 올리면 비용 급증

### A-3. AI Studio vs Vertex AI 폐기 일정 차이

| 모델 | AI Studio | Vertex AI | 차이 |
|------|----------|----------|------|
| `gemini-3-pro-preview` | 3/9 | 3/26 | Vertex가 17일 더 유예 |
| `gemini-2.0-flash` | 6/1 | 6/1 | 동일 |
| `gemini-3-pro-image-preview` | 미정 | — | 우리는 AI Studio 경유만 |

### A-4. 이미지 생성 모델 로드맵

현재 Google의 이미지 생성 모델 2트랙:

**트랙 1: Gemini 네이티브 이미지 생성**
- `gemini-2.5-flash-image` → `gemini-3-pro-image-preview` → `gemini-3.1-flash-image-preview` (최신)
- 텍스트+이미지 혼합 입출력, I2I 가능, 프롬프트 기반 편집

**트랙 2: Imagen 전용 모델**
- `imagen-3.0-generate-002` (종료) → `imagen-4.0-generate-001` / `imagen-4.0-ultra-generate-001`
- T2I 전용, Vertex AI ADC 인증

**우리 위치**: 트랙 1 (`gemini-3-pro-image-preview`) — AI Studio API Key 인증

---

## Phase B: 코드베이스 전수조사 — 현재 모델 사용 현황

### B-1. 전체 모델 사용 맵

| 모델 ID | 서비스 | 파일:라인 | 용도 | 인증 경로 | 폐기 일정 |
|---------|--------|----------|------|----------|----------|
| `gemini-3-pro-image-preview` | idphoto-kr | server.js:568 | Imagen I2I 생성 | AI Studio API Key | **없음 (안전)** |
| `gemini-3-pro-image-preview` | idphoto-jp | server.js:326 | Imagen I2I 生成 | AI Studio API Key | **없음 (안전)** |
| `gemini-2.0-flash` | idphoto-kr | server.js:430 | Pre-Check (사전분석) | Vertex AI ADC | 6/1 |
| `gemini-2.0-flash` | idphoto-jp | server.js:352 (QC_MODELS[1]) | QC Fallback | Vertex AI ADC | 6/1 |
| `gemini-2.0-flash` | portal | chat-engine.js:193,237 | 챗봇 (Web/Kakao/Telegram) | Vertex AI ADC | 6/1 |
| `gemini-2.0-flash` | portal | server.js:64,182 | 헬스체크 로그 | Vertex AI ADC | 6/1 |
| `gemini-2.0-flash-live-preview-04-09` | idphoto-kr | server.js:361 | Live 코칭 (WebSocket) | Vertex AI ADC | **미정 (위험)** |
| `gemini-2.0-flash-live-preview-04-09` | idphoto-jp | server.js:282 | Live コーチング (WS) | Vertex AI ADC | **미정 (위험)** |
| `gemini-3-flash-preview` | idphoto-jp | server.js:352 (QC_MODELS[0]) | QC 1차 검증 | Vertex AI ADC | **없음 (안전)** |

### B-2. 인증 경로 정리

| 인증 방식 | 사용 모델 | 서비스 | 환경변수 |
|---------|---------|--------|--------|
| Google AI Studio API Key | `gemini-3-pro-image-preview` | idphoto-kr, idphoto-jp | `GEMINI_API_KEY` (.env) |
| Vertex AI ADC | `gemini-2.0-flash`, `gemini-3-flash-preview`, `gemini-2.0-flash-live-*` | 전체 | 서비스 계정 (Cloud Run) |

### B-3. 미사용/레거시 모델 잔존

- `imagen-4.0-generate-001`: **코드에서 발견되지 않음** (3/1 사건에서 제거 완료)
- `imagen-3.0-*`: 없음
- 백업 파일 (`_backup_79/`, `.backup`): 현재 코드와 동일한 모델만 참조
- SERVICE_MAP.md에 `Imagen 4 API | monk-image-engine` 문서 참조 있으나 monkos_AI 내 해당 코드 없음

---

## Phase C: 마이그레이션 영향 분석

### C-1. 모델별 마이그레이션 매핑

#### 1. `gemini-3-pro-image-preview` (I2I 엔진) — 조치 불필요

| 항목 | 내용 |
|------|------|
| 현재 모델 | `gemini-3-pro-image-preview` |
| 폐기 일정 | **없음** |
| 후속 모델 | `gemini-3.1-flash-image-preview` (존재하나 마이그레이션 불필요) |
| 마이그레이션 난이도 | — |
| 조치 | **모니터링만. 현행 유지.** |

#### 2. `gemini-2.0-flash-live-preview-04-09` (Live 코칭) — 우선순위 1

| 항목 | 내용 |
|------|------|
| 현재 모델 | `gemini-2.0-flash-live-preview-04-09` |
| 폐기 일정 | **미정 — 유사 모델 이미 종료 (2025-12-09)** |
| 후속 모델 | `gemini-live-2.5-flash-native-audio` (GA) |
| API 호환성 | **구조 변경 가능성 높음** — 2.0 Live → 2.5 native-audio는 API 변경 수반 |
| 품질 변동 | 네이티브 오디오 품질 향상 예상 |
| 마이그레이션 난이도 | **중~상** — WebSocket 핸드셰이크, 오디오 스트리밍 파라미터 변경 가능 |
| 영향 범위 | idphoto-kr (server.js:361), idphoto-jp (server.js:282) |
| 테스트 필요 | 실시간 코칭 품질, 한국어/일본어 음성 인식, 레이턴시 |

#### 3. `gemini-2.0-flash` (Pre-Check, QC, Portal) — 우선순위 2

| 항목 | 내용 |
|------|------|
| 현재 모델 | `gemini-2.0-flash` |
| 폐기 일정 | **6/1** (약 3개월 유예) |
| 후속 모델 | `gemini-2.5-flash` |
| API 호환성 | **높음** — 모델 ID 교체로 대부분 해결 |
| 품질 변동 | 향상 예상 (2.5는 thinking 지원) |
| 가격 변동 | Input 1.5x, Output 3.75x |
| 마이그레이션 난이도 | **하** — 모델 ID 한 줄 교체 |
| 영향 범위 | idphoto-kr (Pre-Check), idphoto-jp (QC Fallback), portal (챗봇 전체) |
| 테스트 필요 | Pre-Check 정확도, QC 판정 품질, 챗봇 응답 품질 |

#### 4. `gemini-3-flash-preview` (idphoto-jp QC 1차) — 조치 불필요

| 항목 | 내용 |
|------|------|
| 현재 모델 | `gemini-3-flash-preview` |
| 폐기 일정 | **없음** |
| 후속 모델 | GA 출시 시 `gemini-3-flash` 전환 가능 |
| 조치 | **현행 유지.** GA 출시 모니터링. |

### C-2. 마이그레이션 우선순위 제안

| 순위 | 모델 | 긴급도 | 이유 |
|------|------|--------|------|
| **1** | `gemini-2.0-flash-live-preview-04-09` | **긴급** | 유사 모델 이미 종료. 공지 없이 끊길 수 있음 |
| **2** | `gemini-2.0-flash` | 6/1 마감 | 3개월 유예 있으나 영향 범위 넓음 (3개 서비스) |
| **3** | `gemini-3-flash-preview` | 여유 | GA 전환 시 자연스럽게 진행 |
| — | `gemini-3-pro-image-preview` | 해당 없음 | 폐기 일정 없음 |

### C-3. 리스크 평가

#### 최대 리스크: Live 코칭 모델 (`gemini-2.0-flash-live-preview-04-09`)

- 동일 시리즈 `gemini-2.0-flash-live-001`이 2025-12-09에 이미 종료
- 04-09 variant는 deprecation 목록에 없으나, 이는 "관리 밖 모델"일 가능성
- **시나리오**: 어느 날 갑자기 Live 코칭이 작동 중단 → 사용자 경험 즉시 영향
- **완화**: 후속 모델 `gemini-live-2.5-flash-native-audio` 마이그레이션 우선 착수

#### 중간 리스크: 2.0 Flash 가격 변동

- 6/1 이후 `gemini-2.5-flash`로 전환 시 비용 약 2~4x 상승
- Pre-Check + QC + Portal 합산 시 월간 API 비용 유의미 증가
- **완화**: 5월 중 전환 + 비용 모니터링 체계 마련

#### 안심: I2I 엔진

- `gemini-3-pro-image-preview` 폐기 일정 없음
- 서비스 핵심 기능(증명사진 I2I)은 영향 없음

### C-4. 가격 영향 산출

| 서비스 | 현재 모델 | 후속 모델 | Input 변동 | Output 변동 |
|--------|---------|---------|-----------|------------|
| idphoto-kr Pre-Check | 2.0-flash $0.10 | 2.5-flash $0.15 | +50% | +275% |
| idphoto-jp QC (fallback) | 2.0-flash $0.10 | 2.5-flash $0.15 | +50% | +275% |
| Portal 챗봇 (전체) | 2.0-flash $0.10 | 2.5-flash $0.15 | +50% | +275% |
| idphoto-kr/jp Live | 2.0-flash-live | 2.5-flash-native-audio | 별도 확인 필요 | 별도 확인 필요 |
| idphoto-kr/jp I2I | 3-pro-image $120/1M img | 변경 없음 | — | — |

---

## 결론: 긴급 조치 필요 여부

### 3/9 긴급 — **해당 없음**
- `gemini-3-pro-preview` 폐기는 우리에게 영향 없음 (미사용)
- `gemini-3-pro-image-preview`는 **별도 모델이며 폐기 일정 없음**

### 즉시 검토 필요 — Live 코칭 모델
- `gemini-2.0-flash-live-preview-04-09`는 언제든 종료될 수 있는 상태
- `gemini-live-2.5-flash-native-audio`(GA)로의 마이그레이션 설계 필요
- 해당 마이그레이션은 API 구조 변경 수반 가능 → 쌍아 설계 권장

### 6/1 이전 — Flash 모델 전환
- `gemini-2.0-flash` → `gemini-2.5-flash` 전환 (3개 서비스)
- 모델 ID 교체 수준이나 비용 증가 검토 필요

### 조치 불필요
- `gemini-3-pro-image-preview` (I2I) — 안전
- `gemini-3-flash-preview` (QC) — 안전

---

**[2026-03-06 05:00 KST] M1/막내3 보고 완료**
