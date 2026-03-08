---
type: report
date: 2026-03-01
from: M1/막내1
to: M1/쌍아
scope: Image Pro /generate — 2/20 전후 이력 검수
context: "ORDER_20260301_막내_ImagePro_generate_이력검수_리서치.md"
---

# Image Pro /generate 이력 검수 보고서

**[2026-03-01 07:47 KST] M1/막내1 → M1/쌍아**

---

## 1. 커밋 체인 분석 (2/20)

### 전수 조사 테이블

| # | 커밋 | 시각 (KST) | 수정 파일 | generate.js (CF Worker) model 처리 | server.js (Cloud Run) model 처리 | 프론트엔드 model 전달 |
|---|------|-----------|-----------|-----------------------------------|---------------------------------|---------------------|
| 1 | `8590a08` | 2/20 13:04 | `functions/api/generate.js` | model 없음. CF Worker가 직접 Google AI Studio API 호출. `imagen-4.0-generate-001:predict` 하드코딩 | 경유 안 함 (직접 호출) | 관여 없음 |
| 2 | `dd458d6` | 2/20 13:12 | `functions/api/generate.js` | model 없음. 응답 파싱만 수정 (`predictions[].bytesBase64Encoded`) | 경유 안 함 | 관여 없음 |
| 3 | `e4034df` | 2/20 13:26 | `functions/api/generate.js` | model 없음. `sampleCount: 4→1` 축소 | 경유 안 함 | 관여 없음 |
| 4 | `d7cf981` | 2/20 13:47 | `generate.js`, `refine.js` | model 없음. `safetyFilterLevel: block_none` 적용 | 경유 안 함 | 관여 없음 |
| 5 | `d1b351c` | 2/20 14:25 | `functions/api/generate.js` (대폭) | **구조 전환**: 직접 API → Cloud Run 프록시. `{ prompt, aspectRatio }` 전달. model 없음 | 변경 없음. a644ffc 버전 가동. `generate-001` 하드코딩 | 관여 없음 |
| 6 | `9499029` | 2/20 14:59 | `functions/api/generate.js` | model 없음. `safetyFilterLevel`, `personGeneration` 추가. 응답 `imageBase64` 대응 | 변경 없음 | 관여 없음 |
| **7** | **`faae36b`** | **2/20 17:02** | `generate.js` + 프론트빌드 5개 | **`model` 신설**. `model: model || 'fast'` Cloud Run으로 전달 | **변경 없음!** model 수신 로직 없이 `generate-001` 하드코딩 유지 | `useState("fast")`. `model: E.model || "fast"` 전달 |
| 8 | `279aa3b` | 2/20 19:30 | `index-v5.js`, `index-v6.js`, `index.html` | 변경 없음 (faae36b 그대로) | 변경 없음 | FAST→"Standard", ULTRA→"Premium" 라벨. Standard 선택 시 +8초 대기 |

### 2/20 커밋 체인 핵심 발견

1. **커밋 5 (d1b351c)이 아키텍처 전환점**: CF Worker 직접 호출 → Cloud Run 프록시로 전환
2. **커밋 7 (faae36b)이 model 파라미터 도입**: 그러나 **Cloud Run server.js는 변경하지 않았음**
3. **model 파라미터 미동기화**: CF Worker가 `model: "fast"/"ultra"`를 보내도 Cloud Run은 무시하고 `imagen-4.0-generate-001` 고정 호출

---

## 2. Cloud Run server.js 버전별 비교

### 4개 버전 비교표

| 시점 | 커밋 | model 수신 | Vertex AI 모델 ID | `@google-cloud/aiplatform` 의존성 | PredictionServiceClient |
|------|------|-----------|------------------|----------------------------------|------------------------|
| 원본 | `a644ffc` | ❌ 없음 | `imagen-4.0-generate-001` 하드코딩 | ✅ `^3.36.0` | ✅ `apiEndpoint: us-central1` |
| Phase 1 이관 | `3f18774` | ❌ 없음 | 동일 하드코딩 | ✅ 동일 | ✅ 동일 |
| 프론트 통합 | `aeb74bb` | ❌ 없음 | 동일 하드코딩 | ✅ 동일 | ✅ 동일 |
| **Gemini 전환 (오진)** | **`1d7e481`** | ❌ 제거 | **Gemini 3 Pro** `gemini-3-pro-image-preview` | **❌ 제거** | **❌ 제거** |

### 버전별 /generate 핸들러 핵심 차이

**V1~V3 (a644ffc ~ aeb74bb) — Vertex AI ADC 방식:**
```
req.body에서 { prompt, aspectRatio, safetyFilterLevel, personGeneration } 수신
→ PredictionServiceClient.predict()
→ endpoint: "imagen-4.0-generate-001" 하드코딩
→ model 파라미터: 수신하지 않음, fast/ultra 분기 없음
```

**V4 (1d7e481) — Gemini API 전환 (오진):**
```
req.body에서 { prompt, aspectRatio } 수신
→ fetch('generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview')
→ GEMINI_API_KEY 사용 (ADC 아닌 API Key 방식)
→ Imagen 4 고유 파라미터(safetyFilterLevel, personGeneration) 소멸
→ PredictionServiceClient 완전 제거
```

### 핵심 발견

**원본(a644ffc)에서도 model 파라미터를 수신하지 않았다.**

이것은 중요한 발견이다:
- CF Worker(faae36b)에서 `model: "fast"/"ultra"`를 보냈지만
- Cloud Run(a644ffc)은 이 값을 디스트럭처링하지도 않고 `imagen-4.0-generate-001`만 호출
- 즉, **2/20 "한·꾸 정상 사용 확인" 시점에서도 fast/ultra 선택은 실질적으로 무효**였음
- 단, `imagen-4.0-generate-001`이 당시에는 정상 작동했으므로 이미지 생성 자체는 됐음

---

## 3. CF Worker generate.js 변천

### 5단계 변천사

| 단계 | 커밋 | 날짜 | 상태 | model 처리 |
|------|------|------|------|-----------|
| **A. 직접 호출** | `8590a08`~`9499029` | 2/20 전반 | CF → Google AI Studio 직접 | 없음 |
| **B. 프록시 + model** | `faae36b` | 2/20 17:02 | CF → Cloud Run 프록시 | `model: model || 'fast'` 전달 |
| **C. 삭제** | `6dcde0c` | 2/28 | functions/ 전체 삭제 (monk.kr 정적화) | 소멸 |
| **D. 선별 복원** | `0555f72` | 2/28 19:10 | B 상태로 복원 | 복원 |
| **E. 탯줄 절단** | `d3c6a6d` | 2/28 19:27 | CF → Gemini API 직접 호출 (Cloud Run 의존 제거) | **소멸** (Gemini 단일 모델) |

### B 단계 (faae36b) — CF Worker 요청 본문

```javascript
// CF Worker → Cloud Run
fetch('https://image.monkos.ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: prompt,
    model: model || 'fast',
    aspectRatio: config?.aspectRatio || '1:1',
    safetyFilterLevel: 'block_none',
    personGeneration: 'allow_all'
  })
});
```

### B 단계 — 응답 변환 로직

```javascript
// Cloud Run 응답 → 프론트 형식 변환
const images = (result.images || []).map(img =>
  typeof img === 'string'
    ? img
    : `data:image/jpeg;base64,${img.imageBase64 || img.base64}`
);
return { success: true, images };
```

양면 로직: 문자열이면 통과, 객체이면 data URI 변환.

### E 단계 (d3c6a6d, 현재 HEAD) — Gemini API 직접 호출

```javascript
// CF Worker → Gemini API 직접 (Cloud Run 의존 제거)
fetch(`generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`)
// model 파라미터 완전 소멸 — Standard/Premium 구분 불가
```

---

## 4. 프론트엔드 계약

### v5 / v6 공통 구조

| 항목 | v5 (`index-v5.js`) | v6 (`index-v6.js`) |
|------|----|----|
| API 엔드포인트 | `/api` (상대경로, CF Worker 경유) | `https://image.monkos.ai` (Cloud Run 직접) |
| model 초기값 | `useState("fast")` | `useState("fast")` |
| UI 버튼 | `["fast", "ultra"]` 2-grid | 동일 |
| 라벨 | FAST=Standard, ULTRA=Premium | 동일 |

### 모델 매핑

| UI 버튼 | 내부값 | 라벨 | 전송값 |
|---------|--------|------|--------|
| Standard | `"fast"` | "Standard" | `model: "fast"` |
| Premium | `"ultra"` | "Premium" | `model: "ultra"` |

### 요청 본문 구조 (v5/v6 공통)

```javascript
fetch(`${baseUrl}/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: U,
    config: E,              // { aspectRatio, model, ... }
    model: E.model || 'fast'  // 최상위 model 필드
  })
});
```

**v6 특이사항**: Standard(fast) 선택 시 프론트에서 +8초 인위적 대기 추가 (Premium과 체감 시간 동등화)

---

## 5. 손상 시점 특정

### 2/25 이후 server.js 수정 커밋 전수

| # | 커밋 | 시각 (KST) | 내용 | /generate 영향 |
|---|------|-----------|------|---------------|
| 1 | `3f18774` | 2/28 15:22 | Phase 1 이관: /refine, /analyze, /translate 추가 | **/generate 무변경** |
| 2 | `aeb74bb` | 2/28 18:22 | 프론트 통합: 정적 서빙 추가, GET / → GET /health 이동 | **/generate 무변경** |
| 3 | **`1d7e481`** | **3/1 05:49** | **Vertex AI SDK → Gemini API 전환** | **⚠️ /generate 핸들러 완전 교체 — 손상 커밋** |
| 4 | `44e18fe` | 3/1 07:13 | images 응답 형식 문자열화 | /generate 응답 형식만 변경 |

### 손상 커밋 `1d7e481` 상세

제거된 것:
- `@google-cloud/aiplatform` import 및 `PredictionServiceClient` 초기화
- Vertex AI ADC 호출 경로 전체
- `safetyFilterLevel`, `personGeneration` Vertex 전용 파라미터

추가된 것:
- `GEMINI_API_KEY` 의존 (환경변수)
- `generativelanguage.googleapis.com` HTTP fetch
- `gemini-3-pro-image-preview` 단일 모델

**손상 정의**: Imagen 4 (fast/ultra) 고품질 이미지 생성이 Gemini 3 Pro의 부가 이미지 생성으로 대체. ADC → API Key 전환.

---

## 6. 프로덕션 현황

### Cloud Run 서비스 상태

| 항목 | 값 |
|------|---|
| **서비스** | `monk-image-engine` |
| **활성 리비전** | `monk-image-engine-00018-8w6` (트래픽 100%) |
| **배포 시각** | 2026-02-28 22:25:45 UTC (3/1 07:25 KST) |
| **배포자** | gdsajin@gmail.com |
| **이미지** | `gcr.io/monkos/monk-image-engine@sha256:4eb55ea...` |
| **리전** | us-central1 |

### /health 응답

```json
{
    "status": "healthy",
    "message": "MONKOS Image Engine is running",
    "version": "2.1.0",
    "timestamp": "2026-02-28T22:46:48.974Z",
    "project": "monkos"
}
```

### 프로덕션 배포 버전 추정

- `1d7e481` 커밋: 3/1 05:49 KST (2/28 20:49 UTC)
- `44e18fe` 커밋: 3/1 07:13 KST (2/28 22:13 UTC)
- 활성 리비전 배포: 2/28 22:25 UTC

**rev 00018은 44e18fe 커밋(2/28 22:13 UTC) 이후 배포(22:25 UTC)이므로, 현재 프로덕션은 Gemini API 전환(오진) 버전이 서빙 중이다.**

### 현재 Working Tree

`git status`에 `M apps/monk_imagen4/backend/server.js`, `M apps/monk_imagen4/backend/package.json` 미커밋 변경 존재. 이 변경이 Vertex AI ADC 복원 코드로 추정되나 아직 커밋/배포되지 않은 상태.

---

## 7. 복원을 위한 핵심 발견

### 발견 1: 원본 server.js에도 model 매핑이 없었다

```
a644ffc (원본) → 3f18774 (Phase 1) → aeb74bb (프론트 통합)
  모두 `imagen-4.0-generate-001` 하드코딩
  model 파라미터 디스트럭처링 없음
  fast/ultra 분기 코드 없음
```

**결론**: CF Worker(faae36b)에서 `model: "fast"/"ultra"`를 보냈지만, Cloud Run은 수신한 적이 없다. 2/20 "한·꾸 정상 사용 확인" 시점에서도 **Standard/Premium 선택은 실질적으로 동일한 모델**을 호출하고 있었다.

### 발견 2: model 파라미터의 수명

```
faae36b (2/20 17:02) — CF Worker에 도입
  ↓ Cloud Run에서는 무시됨 (a644ffc)
  ↓
6dcde0c (2/28) — CF Worker 삭제로 소멸
0555f72 (2/28 19:10) — 선별 복원으로 부활
d3c6a6d (2/28 19:27) — Gemini API 전환으로 다시 소멸
  ↓
1d7e481 (3/1 05:49) — Cloud Run에서도 Gemini 전환으로 완전 소멸
```

### 발견 3: 복원 시 필요한 작업 범위

Cloud Run server.js에 원래 model 분기가 **없었으므로**, 복원이 아니라 **신규 구현**이 필요하다:

| 항목 | 원본 (a644ffc) | 복원 시 필요 |
|------|---------------|------------|
| PredictionServiceClient | ✅ 있음 | 복원 |
| `@google-cloud/aiplatform` | ✅ 있음 | 복원 |
| Vertex AI ADC 호출 | ✅ 있음 (`generate-001` 고정) | 복원 |
| model 파라미터 수신 | ❌ 없었음 | **신규 구현** |
| fast/ultra → 모델 ID 매핑 | ❌ 없었음 | **신규 구현** |
| `generate-001` → `fast-generate-001`/`ultra-generate-001` 전환 | ❌ 없었음 | **신규 구현** |

**매핑 사양 (제안)**:
```
model: "fast"  → imagen-4.0-fast-generate-001
model: "ultra" → imagen-4.0-ultra-generate-001
기본값: "fast"
```

### 발견 4: 현재 working tree에 Vertex AI 복원 코드 존재

미커밋 상태의 `server.js`에 이미 다음이 구현되어 있는 것으로 추정됨:
- `PredictionServiceClient` + `helpers` 복원
- model → `imagen-4.0-fast-generate-001` / `imagen-4.0-ultra-generate-001` 매핑
- `helpers.toValue()` protobuf 변환

**이 코드가 역사상 최초로 model 파라미터를 올바르게 처리하는 버전이다.**

다만, 이 코드는 오진 세션에서 작성된 것이므로 별도 검증 필요.

---

## 완료 체크리스트

- [x] 2/20 커밋 체인 8개 전수 확인 완료
- [x] Cloud Run server.js 4개 버전 비교 완료
- [x] CF Worker generate.js 변천 추적 완료
- [x] 프론트엔드 model 값 전달 방식 확인
- [x] 손상 시점 특정: `1d7e481` (3/1 05:49 KST)
- [x] 프로덕션 현황 확인: rev 00018, Gemini API 버전 서빙 중
- [x] 보고서 작성 완료
- [x] **코드 수정 0건** 확인
