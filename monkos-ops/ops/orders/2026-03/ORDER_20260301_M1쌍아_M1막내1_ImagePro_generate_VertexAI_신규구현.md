---
type: order
date: 2026-03-01
from: M1/쌍아
to: M1/막내1
priority: P0
scope: Image Pro /generate — Vertex AI ADC 신규 구현 (fast/ultra 분기)
context: 막내1 이력 검수 완료. 원본에 model 분기가 없었으므로 복원이 아닌 신규 구현. CF 경유 없이 Cloud Run → Vertex AI 직통
references:
  - monkos-ops/ops/reports/REPORT_20260301_막내_ImagePro_generate_이력검수.md
---

# 지시서: Image Pro /generate Vertex AI ADC 신규 구현

**[2026-03-01 07:58 KST] M1/쌍아 → M1/막내1**

## 목적

Cloud Run server.js의 `/generate` 엔드포인트를 **Vertex AI ADC + model 분기(fast/ultra)** 로 신규 구현한다.
CF Worker 경유 없이, 프론트엔드 → Cloud Run → Vertex AI 직통 구조.

## 사전 작업 (필수)

### A. working tree 원복

현재 미커밋 변경을 전부 제거한다.

```bash
git restore apps/monk_imagen4/backend/server.js
git restore apps/monk_imagen4/backend/package.json
git restore apps/monk_imagen4/backend/Dockerfile
```

### B. Gemini API 오진 커밋 revert

커밋 `1d7e481`을 revert한다. 이 커밋이 Vertex AI SDK를 제거하고 Gemini API로 대체한 오진 커밋이다.

```bash
git revert 1d7e481 --no-edit
```

이렇게 하면 server.js가 `aeb74bb` 시점(프론트 통합 직후, Vertex AI ADC + generate-001 하드코딩)으로 돌아간다.

> **주의**: revert 시 `44e18fe`(세션 로그 커밋)와 충돌할 수 있다. server.js 외 파일은 현행 유지.

### C. revert 결과 확인

revert 후 server.js에 아래가 있어야 한다:
- `const { PredictionServiceClient } = require('@google-cloud/aiplatform');`
- `const predictionClient = new PredictionServiceClient(...)`
- `/generate` 핸들러에서 `predictionClient.predict()` 호출
- 모델 ID: `imagen-4.0-generate-001` (하드코딩 — 이것을 다음 단계에서 교체)

## 신규 구현

revert 완료된 server.js에서 `/generate` 핸들러만 수정한다.

### 1. model 파라미터 수신

```javascript
const {
  prompt,
  model = 'fast',           // ← 신규: 프론트엔드에서 "fast" 또는 "ultra"
  config,                    // ← 신규: { aspectRatio, ... }
  negativePrompt = '',
  aspectRatio,
  numberOfImages = 1,
  saveToGcs = true,
  safetyFilterLevel = 'block_none',
  personGeneration = 'allow_all'
} = req.body;

// config에서도 aspectRatio 수신 (프론트엔드 호환)
const finalAspectRatio = aspectRatio || config?.aspectRatio || '1:1';
```

### 2. model → Vertex AI 모델 ID 매핑

```javascript
const modelId = model === 'ultra'
  ? 'imagen-4.0-ultra-generate-001'
  : 'imagen-4.0-fast-generate-001';

const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelId}`;
```

**매핑 규칙:**
| 프론트엔드 값 | UI 라벨 | Vertex AI 모델 ID |
|-------------|---------|------------------|
| `"fast"` (기본값) | Standard | `imagen-4.0-fast-generate-001` |
| `"ultra"` | Premium | `imagen-4.0-ultra-generate-001` |

### 3. Vertex AI 호출 파라미터

기존 `instances`/`parameters` 구조는 원본 server.js를 따르되, 아래를 반영:

- `safetyFilterLevel: 'block_none'` — 헌법 9조 (I2I 정체성 보존)
- `personGeneration: 'allow_all'` — K-뷰티 인물 생성 필수
- `numberOfImages` → `sampleCount`로 매핑 (Vertex AI 파라미터명)

### 4. 응답 형식 — 프론트엔드 계약 준수

프론트엔드(v6)가 기대하는 형식으로 반환한다. CF Worker가 하던 변환을 내재화:

```javascript
res.json({
  success: true,
  images: results.map(r => r.gcsUrl || `data:image/jpeg;base64,${r.imageBase64}`),
  metadata: {
    prompt,
    model: modelId,
    aspectRatio: finalAspectRatio,
    numberOfImages,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  }
});
```

**핵심**: `images` 배열은 **문자열 배열**이어야 한다. 객체 배열이면 프론트에서 이미지 깨짐.

### 5. 로깅

```javascript
console.log(`[Generate] Model: ${modelId} (${model})`);
```

## 수정 범위

| 파일 | 수정 내용 |
|------|----------|
| `apps/monk_imagen4/backend/server.js` | `/generate` 핸들러: model 수신 + 매핑 + 응답 형식 |

## ⚠️ 금지 사항

- **/refine, /analyze, /translate 절대 수정 금지** — Gemini API가 맞는 엔드포인트
- **package.json 변경 금지** — revert로 `@google-cloud/aiplatform` 복원되면 그대로 유지
- **Dockerfile 변경 금지** — revert로 원복되면 그대로
- **프론트엔드 수정 금지** — v6 그대로. model: "fast"/"ultra" 전송 이미 구현돼 있음

## 검증 절차

### 1단계: 로컬 확인
```bash
cd apps/monk_imagen4/backend
node -e "const s = require('./server.js'); console.log('import OK')" 2>/dev/null || echo "import 확인"
grep -n 'imagen-4.0' server.js  # fast-generate-001, ultra-generate-001 확인
grep -n 'PredictionServiceClient' server.js  # 존재 확인
grep -n 'model' server.js | head -10  # model 수신·매핑 확인
```

### 2단계: 배포 + API 단위 테스트
```bash
# 배포 (deploy.sh 사용)
./deploy.sh

# health check
curl -s https://image.monkos.ai/health | python3 -m json.tool

# /generate fast 테스트
curl -s -X POST https://image.monkos.ai/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A Korean woman portrait, studio lighting","model":"fast","numberOfImages":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:', d.get('success'), 'images:', len(d.get('images',[])), 'model:', d.get('metadata',{}).get('model','?'))"

# /generate ultra 테스트
curl -s -X POST https://image.monkos.ai/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"A Korean woman portrait, studio lighting","model":"ultra","numberOfImages":1}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('success:', d.get('success'), 'images:', len(d.get('images',[])), 'model:', d.get('metadata',{}).get('model','?'))"
```

### 3단계: 회귀 테스트
```bash
# /refine 회귀 — 변경 안 했으므로 동작해야 함
curl -s https://image.monkos.ai/health

# /analyze, /translate도 health 수준에서 확인
```

### 4단계: 프론트 E2E (작가님 수동)
- image.monkos.ai 접속 → 로그인
- Standard 선택 → 프롬프트 입력 → 이미지 생성 확인
- Premium 선택 → 프롬프트 입력 → 이미지 생성 확인

## 완료 조건

- [ ] working tree 원복 완료
- [ ] `1d7e481` revert 커밋 생성
- [ ] `/generate`에 model 파라미터 수신 + fast/ultra 매핑 구현
- [ ] `imagen-4.0-fast-generate-001` 호출 성공 (API 단위)
- [ ] `imagen-4.0-ultra-generate-001` 호출 성공 (API 단위)
- [ ] 응답 `images`가 문자열 배열 (깨짐 없음)
- [ ] `/refine`, `/analyze`, `/translate` 회귀 없음
- [ ] Cloud Run 배포 완료
- [ ] 커밋+push 승인 요청
