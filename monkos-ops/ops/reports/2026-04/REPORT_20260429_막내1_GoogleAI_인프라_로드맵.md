---
type: report
date: 2026-04-29
from: iMac/막내1
to: 작가님, iMac/쌍아
subject: Google AI 인프라 전체 로드맵 리서치
order: ORDER_20260429_막내1_GoogleAI_인프라_로드맵_리서치.md
status: 완료
---

# Google AI 인프라 전체 로드맵 리서치

**[2026-04-29 12:23 KST] iMac/막내1**

---

## 1. Google AI 플랫폼 재편 방향

### 핵심 변화: Vertex AI → Gemini Enterprise Agent Platform

Google Cloud Next 2026 (2026-04-22, 라스베이거스)에서 **Vertex AI**가 **"Gemini Enterprise Agent Platform"**으로 리브랜딩되었다.

| 항목 | 내용 |
|------|------|
| **성격** | 리브랜딩 + 기능 확장. 기존 워크로드는 그대로 동작 |
| **Model Garden** | 200+ 모델 유지. 문서가 새 브랜드 docs로 이전 |
| **Agentspace** | 새 플랫폼에 통합 흡수 |
| **A2A 프로토콜** | v1.0 공식 출시 (에이전트 간 통신 표준) |

### 엔드포인트 영향

- **`aiplatform.googleapis.com` — 유지.** 제거 예정 없음.
- **Vertex AI SDK GenAI 모듈** (`vertexai.generative_models` 등) — 2025-06-24 deprecated → **2026-06-24 제거**
- **마이그레이션 대상**: `@google/genai` SDK (Gen AI SDK)

### MONKOS 영향도: **낮음 (이미 대응 완료)**

우리 코드베이스는 이미 `@google/genai` SDK를 사용 중이며 `vertexai: true` 모드로 Vertex 접근. `@google-cloud/aiplatform` SDK는 `apps/monk_imagen4/backend/server.js`(Imagen 3 PredictionServiceClient)에서만 사용 중 — 이 부분만 향후 전환 대상.

---

## 2. Provisioned Throughput

### 결론: **불필요**

| 항목 | On-Demand | Provisioned Throughput |
|------|-----------|----------------------|
| 과금 | 토큰당 종량제 | 시간당 고정 요금 (예약 용량) |
| 최소 계약 | 없음 | 1개월 또는 1년 (해지 불가) |
| 레이턴시 | best-effort | 보장 |
| 비용 수준 | 낮음 | PTU당 월 수백~수천 USD |

우리 트래픽 (일 50~200건): on-demand로 월 한 자릿수~두 자릿수 USD. Provisioned Throughput 최소 계약 대비 10~100배 과다. **현재 규모에서는 on-demand 유지가 최적.**

---

## 3. 쿼터 $250 제한 및 Billing 상태

### 현재 monkos 프로젝트 Billing

```
projectId: monkos
billingAccountName: billingAccounts/01A4D9-27F508-300352 (MAIN_Acount)
billingEnabled: true
```

추가 확인된 billing 계정:

| ID | 이름 | 상태 |
|----|------|------|
| 01009E-E34A38-EC84CB | monkos | OPEN |
| 01A4D9-27F508-300352 | MAIN_Acount | OPEN (← monkos 프로젝트 연결) |
| 01DDAB-B2EC64-78E658 | 깡통계좌 | OPEN |

### $250 제한의 실체

- Google Cloud 신규 계정 무료 체험 $300 크레딧 (90일) 캡과 별개
- Google AI Studio pay-as-you-go 티어에서 신규 프로젝트에 기본 설정되는 **월간 소비 한도** (하드 차단이 아닌 소프트 버짓)
- monkos는 이미 유료 billing 활성화 상태이므로 기본 $250 캡은 해당 없을 가능성 높음

### 한도 상향 절차

1. Billing > Budgets & Alerts에서 예산 알림 설정/제거
2. Google AI Studio API Key가 GCP 프로젝트에 연결된 경우 — 유료 티어 확인
3. RPM/TPM 쿼터 상향: Cloud Console > IAM & Admin > Quotas > "aiplatform" 필터 > 증가 요청

### RPM/TPM 쿼터 (유료 티어 기준, 근사치)

| 모델 | RPM | TPM | RPD |
|------|-----|-----|-----|
| gemini-2.0-flash | 2,000 | 4M | 10,000+ |
| gemini-2.5-flash | 2,000 | 4M | 10,000+ |
| gemini-3-pro-image-preview | 확인 필요 (이미지 모델 별도 쿼터) | - | - |

우리 트래픽 수준(일 50~200건)에서는 현재 쿼터로 충분.

---

## 4. Gemini 2.0 폐쇄 영향 분석

### 폐쇄 일정

| 이벤트 | 일정 |
|--------|------|
| gemini-2.0-flash EOL | **2026-06-01** (내부 세션 로그 기록 기준) |
| Vertex AI SDK GenAI 모듈 제거 | 2026-06-24 |
| Gemini 2.5 계열 retirement | 2026-10-16 |

### 대체 모델

- `gemini-2.0-flash` → **`gemini-2.5-flash`** (이미 `MONK_kr/ai_lab/photolab/engine/server.js`에서 적용 완료)
- `gemini-2.0-flash-live-preview-04-09` → 후속 Live 모델 확인 필요

### 코드 영향 전수 조사

#### A. 프로덕션 서비스 (반드시 마이그레이션)

| 서비스 | 파일 | 용도 | 모델 | 참조 수 |
|--------|------|------|------|---------|
| **idphoto-kr** | `monkos_AI/idphoto-kr/server.js` | precheck, 헬스체크, 로그 | `gemini-2.0-flash` | 4 |
| | | Live 코칭 | `gemini-2.0-flash-live-preview-04-09` | 1 |
| **idphoto-jp** | `monkos_AI/idphoto-jp/server.js` | precheck, 분석, 헬스체크, 로그 | `gemini-2.0-flash` | 5 |
| | | Live 코칭 | `gemini-2.0-flash-live-preview-04-09` | 1 |
| **portal** | `monkos_AI/portal/server.js` | 헬스체크, 로그 | `gemini-2.0-flash` | 2 |
| | `monkos_AI/portal/lib/chat-engine.js` | 챗봇 | `gemini-2.0-flash` | 2 |
| | `monkos_AI/portal/lib/cms/blog.js` | 블로그 생성 | `gemini-2.0-flash` | 1 |
| | `monkos_AI/portal/lib/cms/translate.js` | 번역 | `gemini-2.0-flash` | 2 |
| **studio** | `monkos_AI/studio/server.js` | precheck | `gemini-2.0-flash` | 1 |

**프로덕션 합계: `gemini-2.0-flash` 17건 + `gemini-2.0-flash-live` 2건 = 19건**

#### B. CF Workers (monk.kr)

| 파일 | 용도 | 모델 |
|------|------|------|
| `functions/api/translate.js` | 번역 | `gemini-2.0-flash` |
| `functions/api/analyze.js` | 분석 | `gemini-2.0-flash` |

#### C. 마이그레이션 스크립트 (일회성, 낮은 우선순위)

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/scripts/migrate_korean_slugs.js` | 슬러그 변환 |
| `monkos_AI/portal/scripts/retranslate_naver_posts.js` | 재번역 |
| `monkos_AI/portal/scripts/retranslate_crosscontamination.js` | 오염 재번역 (2건) |
| `monkos_AI/portal/scripts/migrate_naver_full_content.js` | 네이버 콘텐츠 이관 |

#### D. Apps/프로토타입 (낮은 우선순위)

- `apps/monk_imagen4/backend/server.js` (2건)
- `apps/monk-cam/demo/presentation_server.js`
- `apps/photo-coach/server.js`
- `apps/idphoto-jp-v079/server.js`

#### E. 이미 마이그레이션 완료

- `MONK_kr/ai_lab/photolab/engine/server.js` → **gemini-2.5-flash** ✅

---

## 5. 엔드포인트/SDK 통일 방안

### 현재 이중 인증 구조

```
┌─────────────────────────────────────────────────────┐
│  @google/genai SDK                                   │
│                                                       │
│  ┌──────────────────┐   ┌──────────────────────┐    │
│  │ vertexai: true    │   │ apiKey: GEMINI_API_KEY│    │
│  │ project: monkos   │   │                      │    │
│  │ location: ...     │   │                      │    │
│  ├──────────────────┤   ├──────────────────────┤    │
│  │ ai (ADC)          │   │ imagenAI (API Key)    │    │
│  │                    │   │                      │    │
│  │ • precheck        │   │ • I2I 생성            │    │
│  │ • chatbot         │   │   (gemini-3-pro-      │    │
│  │ • Live coaching   │   │    image-preview)     │    │
│  │ • translate       │   │                      │    │
│  │ • blog gen        │   │                      │    │
│  └──────────────────┘   └──────────────────────┘    │
│                                                       │
│  + REST 직접 호출 (generativelanguage.googleapis.com) │
│    • I2I 생성 (idphoto-kr/jp/studio)                 │
│    • functions/api/* (CF Workers)                     │
└─────────────────────────────────────────────────────┘
```

### 왜 이중 구조인가

지시서의 사전 확인 내용 참조: `gemini-3-pro-image-preview`는 **Vertex AI에서 미지원** (API Key 방식 전용). 이것이 `imagenAI` 클라이언트가 별도로 존재하는 이유.

- 최근 쌍아 실측: `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview` 모두 **Vertex AI ADC 접근 가능** 확인 (`aiplatform.googleapis.com`, `locations/global`)
- 이 실측이 사실이라면 **Vertex ADC 단일 인증으로 통일 가능**

### SA 현재 역할 (monk-image-engine@monkos.iam)

| 역할 | 용도 |
|------|------|
| `roles/aiplatform.user` | Vertex AI API 호출 ✅ |
| `roles/datastore.owner` | Firestore 전체 ✅ |
| `roles/datastore.user` | Firestore 읽기 ✅ |
| `roles/iam.serviceAccountTokenCreator` | 토큰 생성 ✅ |
| `roles/storage.objectAdmin` | GCS 읽기/쓰기 ✅ |

`aiplatform.user` 역할로 Vertex AI 경유 Gemini/Imagen 호출 가능. 추가 역할 불필요.

### 통일 방안

| 단계 | 작업 | 범위 |
|------|------|------|
| 1단계 | `gemini-3-pro-image-preview` Vertex ADC 접근 재검증 | 실측 1회 |
| 2단계 | 검증 성공 시 `imagenAI` (API Key) → `ai` (ADC) 통합 | idphoto-kr/jp, studio |
| 3단계 | REST 직접 호출 → SDK `ai.models.generateContent()` 전환 | I2I 생성 경로 |
| 4단계 | CF Workers `functions/api/*` — API Key 유지 (CF에서 ADC 불가) | 별도 유지 |

**CF Workers 제약**: Cloudflare Workers 환경에서는 GCP ADC(서비스 계정 JSON) 사용 불가. `functions/api/*`는 API Key 방식 유지가 현실적.

### `@google-cloud/aiplatform` SDK 잔여

`apps/monk_imagen4/backend/server.js`에서 `PredictionServiceClient` 사용 중 (Imagen 3 레거시). 이 SDK가 2026-06-24 제거 대상. `@google/genai`로 전환 필요하나 해당 앱은 프로토타입 수준.

---

## 6. 전체 로드맵 초안

### 즉시 (5월)

| # | 작업 | 우선순위 | 난이도 | 비고 |
|---|------|---------|--------|------|
| 1 | `gemini-3-pro-image-preview` Vertex ADC 접근 재검증 | P0 | 낮음 | 쌍아 실측 결과 재현 확인. 통일 가능 여부 결정 |
| 2 | 프로덕션 모델 상수 중앙화 | P1 | 낮음 | 각 서비스의 하드코딩된 모델명을 환경변수/상수 파일로 추출. 향후 교체 1곳 수정으로 해결 |
| 3 | billing 예산 알림 설정 확인 | P2 | 낮음 | $250 소프트캡 해당 여부 확인 + 알림 설정 |

### 6월 전 (Gemini 2.0 EOL 대응) — **최우선**

| # | 작업 | 영향 범위 | 예상 공수 |
|---|------|----------|----------|
| 4 | 프로덕션 `gemini-2.0-flash` → `gemini-2.5-flash` 전환 | 4개 서비스, 17건 | 지시서 1건 (문자열 교체 수준) |
| 5 | `gemini-2.0-flash-live-preview-04-09` 후속 모델 확인 + 전환 | idphoto-kr/jp Live 코칭 | 후속 모델 존재 확인 후 판단 |
| 6 | CF Workers `functions/api/translate.js`, `analyze.js` 모델 전환 | monk.kr | 문자열 교체 |
| 7 | 전환 후 전 서비스 smoke test | 전체 | 배포+검증 1회 |

### 6월 후 (중기 과제)

| # | 작업 | 기한 | 비고 |
|---|------|------|------|
| 8 | Vertex ADC 단일 인증 통일 (5월 #1 검증 성공 시) | 7월 | API Key 의존 제거. 보안 강화 |
| 9 | `@google-cloud/aiplatform` SDK 제거 | 2026-06-24 전 | `apps/monk_imagen4` 프로토타입 대상 |
| 10 | Gemini 2.5 → 3.x 전환 준비 | 2026-10-16 전 | Gemini 2.5 retirement 대비. #2 모델 상수 중앙화 완료 전제 |
| 11 | "Gemini Enterprise Agent Platform" 브랜딩 반영 | 수시 | 내부 문서/로그의 "Vertex AI" 표기 현행화 (급하지 않음) |

### 로드맵 시각화

```
5월                    6월              7월~10월
├── #1 ADC 재검증      ├── #4-7 2.0→2.5  ├── #8 ADC 통일
├── #2 모델상수 중앙화  │   전환+배포       ├── #9 SDK 정리
├── #3 billing 확인    │   ⚡ 6/1 EOL     ├── #10 2.5→3.x 준비
│                      │   ⚡ 6/24 SDK제거 │   ⚡ 10/16 2.5 retire
```

---

## 요약

1. **플랫폼 재편**: Vertex AI → Gemini Enterprise Agent Platform. MONKOS 영향 낮음 (이미 `@google/genai` SDK 사용 중)
2. **Provisioned Throughput**: 불필요 (현재 규모에서 on-demand가 10~100배 저렴)
3. **$250 제한**: 소프트 버짓. monkos는 유료 billing 활성 상태. 현재 쿼터로 충분
4. **Gemini 2.0 폐쇄**: 프로덕션 19건 + CF Workers 2건 마이그레이션 필요. **6월 1일 전 필수 완료**
5. **인증 통일**: Vertex ADC 재검증 → 성공 시 API Key 제거 가능. CF Workers만 API Key 유지
6. **가장 시급한 것**: **#4 gemini-2.0-flash → gemini-2.5-flash 전환** (6/1 EOL까지 약 1개월)
