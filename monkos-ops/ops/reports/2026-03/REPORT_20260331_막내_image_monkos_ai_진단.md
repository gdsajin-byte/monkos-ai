---
type: report
from: M1/막내1
to: 작가님, M1/쌍아
date: 2026-03-31
subject: image.monkos.ai 전체 정밀 진단 결과
related: ORDER_20260331_M1쌍아_막내_IMAGE_MONKOS_AI_정밀진단.md
---

# image.monkos.ai 정밀 진단 보고서

**[2026-03-31 06:31 KST] M1/막내1 → 작가님, M1/쌍아**

---

## 1. 엔드포인트별 상태 테이블

| 엔드포인트 | 파일:라인 | 사용 모델 | 호출 방식 | HTTP 응답 | 상태 |
|-----------|----------|----------|----------|----------|------|
| `POST /generate` | `backend/server.js:68-205` | `imagen-4.0-ultra-generate-001` / `imagen-4.0-fast-generate-001` | Vertex AI SDK (ADC) | 200 ✅ 이미지 정상 반환 | ✅ 정상 |
| `POST /batch-generate` | `backend/server.js:211-232` | 위와 동일 (내부 /generate 재사용) | Vertex AI SDK (ADC) | 미직접테스트 (로직상 정상 추정) | ✅ 정상 추정 |
| `POST /refine` | `backend/server.js:240-319 (L276)` | `gemini-3-pro-image-preview` | fetch REST API + `GEMINI_API_KEY` query param | 400 — **"API key expired"** | 🔴 장애 (키 만료) |
| `POST /analyze` | `backend/server.js:327-404 (L346)` | `gemini-2.0-flash` | fetch REST API + `GEMINI_API_KEY` header | 400 — 이미지 누락 에러 (키 만료 에러 후속 예상) | 🟡 키 만료로 장애 |
| `POST /translate` | `backend/server.js:412-464 (L432)` | `gemini-2.0-flash` | fetch REST API + `GEMINI_API_KEY` header | 400 — **"API key expired"** 확인 | 🔴 장애 |
| `POST /api/generate` | `functions/api/generate.ts:~100` | `imagen-4.0-generate-001` | fetch REST + `env.GEMINI_API_KEY` | 미도달 (DNS가 Cloud Run 지향) | ⚫ 비활성 경로 |
| `GeminiService.generateBatch` | `services/geminiService.ts:23-41 (L27)` | `imagen-4.0-generate-001` | @google/genai SDK | 프론트엔드 모듈 (서버 미경유) | ⚪ 프론트 전용 |
| `GeminiService.refineImage` | `services/geminiService.ts:46-103 (L55)` | `gemini-3-pro-image-preview` | @google/genai SDK | 프론트엔드 모듈 | ✅ 현역 |
| `GeminiService.analyzeImage` | `services/geminiService.ts:105-138 (L112)` | `gemini-3-pro-preview` (텍스트 버전) | @google/genai SDK | 프론트엔드 모듈 | 🔴 폐기 모델 |

---

## 2. 배포 경로 판정

| 항목 | 결과 |
|------|------|
| DNS (`image.monkos.ai`) | → `ghs.googlehosted.com` → `142.251.24.121` |
| 프로덕션 경로 | **Cloud Run** (`monk-image-engine`) |
| Cloud Run URL | `https://monk-image-engine-4jeplpqpua-uc.a.run.app` |
| 활성 리비전 | `monk-image-engine-00021-c76` (2026-02-28 배포) |
| Cloudflare Pages Functions | **비활성** — DNS가 Cloud Run을 지향하므로 `functions/api/` 경로는 트래픽 미수신 |

**판정: Cloud Run이 유일한 프로덕션 경로.** Cloudflare Pages Functions 코드는 잔존하나 실트래픽 없음.

---

## 3. 폐기 모델 사용처 전수 목록

### ✅ `gemini-3-pro-image-preview` (현역 — 이미지 생성/편집용)

| 파일 | 라인 | 용도 |
|------|------|------|
| `backend/server.js` | 276 | `/refine` 엔드포인트 — I2I/EDIT/UPSCALE |
| `services/geminiService.ts` | 55 | `refineImage()` — 프론트엔드 refine 모듈 |
| `services/geminiService.ts` | 44, 54 | 주석 참조 |

### 🔴 `gemini-3-pro-preview` (폐기 — 텍스트 버전, `-image` 없는 변종)

| 파일 | 라인 | 용도 |
|------|------|------|
| `services/geminiService.ts` | 112 | `analyzeImage()` — 프론트엔드 이미지 분석 |

### ✅ 현역 모델

| 모델 | 파일 | 상태 |
|------|------|------|
| `imagen-4.0-ultra-generate-001` | `backend/server.js:100` | ✅ 정상 동작 확인 |
| `imagen-4.0-fast-generate-001` | `backend/server.js:101` | ✅ 정상 동작 확인 |
| `imagen-4.0-generate-001` | `services/geminiService.ts:27`, `functions/api/generate.ts:100`, `modules/imagen4-generator/Imagen4Generator.ts:117` | ✅ 현역 |
| `gemini-2.0-flash` | `backend/server.js:346,432` | ✅ 모델 현역 (키 만료로 호출 불가 상태) |
| `imagen-3.0-generate-001` 외 | `modules/imagen3-pro/Imagen3ProSuite.ts` | ✅ 현역 (레거시 모듈) |

---

## 4. API 키 상태

| 항목 | 결과 |
|------|------|
| Secret Manager `GEMINI_API_KEY` 끝4자리 | `HDow` |
| 로컬 `.env.local` `GEMINI_API_KEY` 끝4자리 | `HDow` (일치) |
| 키 유효 여부 | 🔴 **만료** — Google API 응답: `"API key expired. Please renew the API key."` |
| Vertex AI ADC (서비스 계정) | ✅ 정상 — `monk-image-engine@monkos.iam.gserviceaccount.com` |
| 서비스 계정 IAM 역할 | `roles/aiplatform.user`, `roles/datastore.owner`, `roles/datastore.user`, `roles/iam.serviceAccountTokenCreator`, `roles/storage.objectAdmin` |

**핵심: GEMINI_API_KEY(`...HDow`)가 만료됨.** Vertex AI ADC는 정상이므로 `/generate`(Imagen)만 동작하고, Gemini API를 직접 호출하는 `/refine`, `/analyze`, `/translate`는 전부 장애.

---

## 5. 수정 필요사항 요약

### P0 — 즉시 대응 (서비스 장애 중)

| # | 항목 | 영향 범위 | 상세 |
|---|------|----------|------|
| P0-1 | **GEMINI_API_KEY 갱신** | `/refine`, `/analyze`, `/translate` 전체 장애 | 키 `...HDow` 만료. Secret Manager + Cloud Run 재배포 필요 |
| ~~P0-2~~ | ~~`/refine` 모델 교체~~ | — | `gemini-3-pro-image-preview`는 현역. 교체 불필요. **(오보 정정 03-31 07:24)** |

### P1 — 조기 대응 (기능 저하)

| # | 항목 | 영향 범위 | 상세 |
|---|------|----------|------|
| P1-1 | `geminiService.ts` analyzeImage 모델 교체 | 프론트엔드 분석 경로 | `gemini-3-pro-preview` (텍스트 버전, 폐기) (L112) → 현역 모델로 교체 필요 |

### P2 — 정리 (기능 영향 없음)

| # | 항목 | 상세 |
|---|------|------|
| P2-1 | Cloudflare Pages Functions 잔존 코드 정리 | `functions/api/` — DNS가 Cloud Run 지향이므로 dead code |
| P2-2 | 이중 배포 경로 문서 정리 | Cloud Run 단일 경로 확정 반영 |

---

## 6. IMAGE PRO 장애 소견

**작가님 보고 증상: "어제 IMAGE PRO에 문제 발생"**

### 원인 분석

장애 원인: **GEMINI_API_KEY 만료** — Gemini API를 사용하는 모든 엔드포인트(`/refine`, `/analyze`, `/translate`) 호출 불가.

> ⚠️ **정정 (03-31 07:24)**: 초판에서 `gemini-3-pro-image-preview`를 폐기로 오보함. 실제 폐기된 것은 텍스트 버전 `gemini-3-pro-preview`이며, 이미지 버전 `-image-preview`는 현역.

### 영향 범위

- `/generate` (T2I 기본 생성): **정상** — Vertex AI SDK + ADC 사용, GEMINI_API_KEY 무관
- `/refine` (I2I/EDIT/UPSCALE): **장애** — 키 만료 (모델 `gemini-3-pro-image-preview`는 현역)
- `/analyze` (이미지 분석): **장애** — 키 만료 (모델 `gemini-2.0-flash`는 현역)
- `/translate` (번역): **장애** — 키 만료 (모델 `gemini-2.0-flash`는 현역)

---

## 헬스 체크 원문

```
GET /health → 200
{
  "status": "healthy",
  "message": "MONKOS Image Engine is running",
  "version": "2.0.0",
  "timestamp": "2026-03-30T21:30:38.538Z",
  "project": "monkos",
  "location": "us-central1"
}

POST /generate (테스트 프롬프트) → 200 ✅ 이미지 정상 반환 (1.6MB base64)

POST /refine (inputImage 포함) → 400
  "API key expired. Please renew the API key."

POST /analyze (이미지 없이) → 400
  "Image data is required"

POST /translate → 400
  "API key expired. Please renew the API key."
```

---

**진단 완료. 코드 수정 미실행.**
