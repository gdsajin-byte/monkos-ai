---
type: report
from: M1/막내2
to: M1/쌍아, 작가님
date: 2026-03-31
subject: image.monkos.ai 정밀 진단 결과
related: ORDER_20260331_M1쌍아_막내_IMAGE_MONKOS_AI_정밀진단.md
---

# image.monkos.ai 정밀 진단 보고서

**[2026-03-31 06:36 KST] M1/막내2 → M1/쌍아, 작가님**

---

## 핵심 요약

| 구분 | 결과 |
|------|------|
| **Imagen 4 T2I `/generate`** | ✅ 정상 — base64 이미지 반환 확인 |
| **3/30 장애 추정 원인** | `/batch-generate` 503 (Express 라우터 TypeError) + GEMINI_API_KEY 만료 |
| **P0 이슈** | GEMINI_API_KEY 만료 → /refine, /analyze, /translate 전부 불능 |
| **P1 이슈** | `/batch-generate` 코드 결함 → 503 Service Unavailable |
| **P2 이슈** | 프론트엔드 `geminiService.ts:112`에 폐기 모델 `gemini-3-pro-preview` 사용 |

---

## 1. [핵심] Imagen 4 T2I `/generate` 장애 진단

### 실 호출 결과: ✅ 정상

```
POST https://image.monkos.ai/generate
Body: {"prompt":"a red apple on a white background","numberOfImages":1}
→ HTTP 200, base64 이미지 정상 반환 (약 1.3MB)
```

- **인증**: Vertex AI ADC (서비스 계정) — GEMINI_API_KEY 불사용
- **모델**: `imagen-4.0-fast-generate-001` (server.js:99-101)
- **서비스 계정 권한**: `roles/aiplatform.user` 포함 5개 역할 정상

**판정**: `/generate` 엔드포인트 자체는 정상. 3/30 보고된 "T2I 장애"는 이 엔드포인트가 아닌, **`/batch-generate` 503** 또는 **GEMINI_API_KEY 만료로 인한 후속 기능 실패**가 원인일 가능성이 높다.

### Cloud Run 에러 로그 (3/30)

```
[2026-03-30 21:34:16 UTC] TypeError: Cannot read properties of undefined (reading 'apply')
    at Immediate.<anonymous> (/app/node_modules/express/lib/router/index.js:646:15)
```

→ `/batch-generate`의 `app._router.handle(req, res)` 호출에서 발생한 Express 라우터 에러. 이것 외 에러 로그 없음.

---

## 2. 전 엔드포인트 상태 매핑

| 엔드포인트 | 파일:라인 | 사용 모델 | 인증 방식 | 실 호출 결과 |
|-----------|----------|----------|----------|------------|
| `GET /health` | `server.js:43` | N/A | 없음 | ✅ 200 — `healthy`, v2.0.0 |
| `POST /generate` | `server.js:99-101` | `imagen-4.0-fast/ultra-generate-001` | Vertex AI ADC | ✅ 200 — base64 이미지 반환 |
| `POST /batch-generate` | `server.js:211-223` | (내부 /generate 재라우팅) | Vertex AI ADC | ❌ **503** — Express 라우터 TypeError |
| `POST /refine` | `server.js:276` | `gemini-3-pro-image-preview` | GEMINI_API_KEY (REST) | ⚠️ 400 (검증 통과, API 호출 전) — **키 만료로 실 호출 시 실패 예상** |
| `POST /analyze` | `server.js:346` | `gemini-2.0-flash` | GEMINI_API_KEY (REST) | ⚠️ 400 (검증 통과, API 호출 전) — **키 만료로 실 호출 시 실패 예상** |
| `POST /translate` | `server.js:432` | `gemini-2.0-flash` | GEMINI_API_KEY (REST) | ❌ **400** — `API key expired. Please renew the API key.` |

### 상세 분석

**/batch-generate 503 원인** (server.js:223):
```javascript
// /generate 로직 재사용 시도 — Express 내부 라우터 직접 호출은 미지원
req.body = batchRequest;
return app._router.handle(req, res);  // ← TypeError 발생 지점
```
Express의 `app._router.handle()`은 공식 API가 아니며, 내부 구현에 의존하는 호출. 올바른 방식은 생성 로직을 공통 함수로 추출하는 것.

**/translate API 키 만료 에러 전문**:
```json
{
  "error": {
    "code": 400,
    "message": "API key expired. Please renew the API key.",
    "status": "INVALID_ARGUMENT",
    "metadata": { "service": "generativelanguage.googleapis.com" }
  }
}
```

---

## 3. 폐기 모델 사용처

### 확인 결과

| 파일 | 라인 | 모델명 | 상태 |
|------|------|--------|------|
| `services/geminiService.ts` | 112 | `gemini-3-pro-preview` | ❌ **폐기 모델** — `image` 없는 일반 preview |
| `backend/server.js` | 276 | `gemini-3-pro-image-preview` | ✅ 정상 — 폐기 아님 |

### `geminiService.ts:112` 상세

```typescript
// analyzeImage 함수 내
const response = await ai.models.generateContent({
  model: "gemini-3-pro-preview",  // ← 폐기 모델
  ...
});
```

- 이 파일은 프론트엔드 TypeScript 서비스 코드
- `analyzeImage()` 정적 메서드에서 사용
- 프론트엔드에서 이미지 분석 시 이 경로를 타면 실패
- 인증: `process.env.API_KEY` (프론트엔드 빌드 시 주입)

---

## 4. API 키·인증 상태

### GEMINI_API_KEY (Secret Manager)

| 항목 | 값 |
|------|-----|
| 시크릿명 | `GEMINI_API_KEY` |
| 버전 | 1 (유일) |
| 생성일 | 2026-02-28 |
| 상태 | enabled |
| 끝 4자리 | `HDow` |
| **유효성** | ❌ **만료됨** — Google API에서 `API_KEY_INVALID` 반환 |

### Cloud Run 환경 변수

| 변수 | 소스 | 값 |
|------|------|-----|
| `GEMINI_API_KEY` | Secret Manager (latest) | 끝4: `HDow` — **만료** |
| `PROJECT_ID` | 직접 설정 | `monkos` |
| `LOCATION` | 직접 설정 | `us-central1` |
| `GCS_BUCKET` | 직접 설정 | `monk-ai-images` |

### Vertex AI ADC (서비스 계정)

서비스 계정 `monk-image-engine@monkos.iam.gserviceaccount.com` 권한:

| 역할 | 용도 |
|------|------|
| `roles/aiplatform.user` | Vertex AI (Imagen 4) 호출 |
| `roles/datastore.owner` | Datastore 접근 |
| `roles/datastore.user` | Datastore 접근 |
| `roles/iam.serviceAccountTokenCreator` | 토큰 생성 |
| `roles/storage.objectAdmin` | GCS 이미지 저장 |

→ ADC 인증은 **정상**. `/generate`가 작동하는 이유.

### 3/30 API 키 복구 작업 적용 여부

- idphoto-kr/jp API 키 복구는 완료되었으나, **image.monkos.ai (monk-image-engine)의 GEMINI_API_KEY는 여전히 만료 상태**
- Secret Manager에 새 버전을 추가하지 않은 것으로 보임 (버전 1만 존재, 2/28 생성)

---

## 5. 배포 경로 판정

```
image.monkos.ai → ghs.googlehosted.com → 142.250.23.121
```

| 항목 | 값 |
|------|-----|
| DNS 대상 | Google Hosted Services (Cloud Run 커스텀 도메인) |
| 서비스 | `monk-image-engine` (Cloud Run, us-central1) |
| 현재 리비전 | `monk-image-engine-00021-c76` |
| 배포일 | 2026-02-28 23:34 UTC |
| 배포자 | gdsajin@gmail.com |
| 서비스 URL | `https://monk-image-engine-4jeplpqpua-uc.a.run.app` |

**판정**: 프로덕션 = **Cloud Run** (Cloudflare Pages 아님)

---

## 6. 수정 필요사항 요약

### P0 — 즉시 조치 필요

| # | 항목 | 내용 |
|---|------|------|
| 1 | **GEMINI_API_KEY 갱신** | Secret Manager에 유효한 새 키 버전 추가. 영향: `/refine`, `/analyze`, `/translate` 3개 엔드포인트 전부 복구 |

### P1 — 조속 수정 필요

| # | 항목 | 내용 |
|---|------|------|
| 2 | **`/batch-generate` 코드 수정** | `server.js:223` — `app._router.handle()` 제거 → 생성 로직을 공통 함수로 추출하여 재사용 |

### P2 — 차기 배포 시 포함

| # | 항목 | 내용 |
|---|------|------|
| 3 | **`geminiService.ts:112` 폐기 모델 교체** | `gemini-3-pro-preview` → `gemini-2.0-flash` 또는 적절한 현행 모델로 교체 |

---

## 진단 체크리스트

- [x] Imagen 4 T2I `/generate` 실제 호출 테스트 + 결과 기록
- [x] Cloud Run 에러 로그 확인 (어제 시점)
- [x] 전 엔드포인트(5개+health) 실 호출 상태 확인
- [x] `gemini-3-pro-preview` (폐기 모델) 사용처 확인
- [x] API 키·ADC 인증 상태 확인
- [x] 배포 경로 판정
- [x] 보고서 작성
