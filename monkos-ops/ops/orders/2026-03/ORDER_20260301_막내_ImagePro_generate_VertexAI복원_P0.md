---
type: order
date: 2026-03-01
from: M1/쌍아
to: 막내 (배정 대기)
priority: P0
scope: Image Pro /generate — Gemini API 롤백 → Vertex AI ADC (imagen-4.0-fast/ultra) 복원
context: 3/1 Gemini API 전환이 오진에 의한 설계 오류. Vertex AI ADC가 정상 경로
---

# 지시서: Image Pro /generate Vertex AI ADC 복원

**[2026-03-01 07:06 KST] M1/쌍아 → 막내**

## 배경

3/1 05:18 지시서(ORDER_20260301_막내3_ImagePro_generate_GeminiAPI전환_P1)로 `/generate` 엔드포인트를 Vertex AI SDK → Gemini API로 전환했으나, 이것은 **설계 오류**였다.

### 오진 내용
- INVALID_ARGUMENT 에러의 원인을 "Vertex AI SDK 자체 문제"로 오진
- 실제 원인: 모델 ID가 `imagen-4.0-generate-001`(폐기 모델)로 하드코딩되어 있었음
- 정상 모델: `imagen-4.0-fast` (Standard), `imagen-4.0-ultra` (Premium)
- 이 모델들은 Vertex AI ADC에서 검증 완료된 모델

### 올바른 아키텍처
- Cloud Run에서 Vertex AI를 ADC로 호출하는 것이 **정상 경로**
- Gemini API(HTTP fetch + API Key)는 **우회 경로** — Vertex AI에서 모델이 제거된 경우에만 사용
- 현재 Gemini API를 사용하는 것: Imagen 3 나노바나나(Vertex에서 제거됨) 한 모델뿐
- `/refine`, `/analyze`, `/translate`는 Gemini 모델을 사용하므로 Gemini API가 맞음. `/generate`만 Vertex AI 복원 대상

## 사전 조사 (필수)

**코드 수정 전에 반드시 아래 히스토리를 파악할 것.**

### 1단계: 2/20 커밋 체인 전체 확인

2/20에 Imagen 4 모델 스위칭이 구현된 커밋 체인:

```bash
# 시간순 — 각 커밋의 full diff 확인
git show 8590a08  # generate.js Imagen 4 엔드포인트 복구
git show dd458d6  # :predict 응답구조 대응
git show e4034df  # 배치 4→1 축소
git show d7cf981  # BLOCK_NONE 적용
git show d1b351c  # Cloud Run 프록시 전환
git show 9499029  # block_none + personGeneration 전달
git show faae36b  # model 파라미터 추가 (fast/ultra 스위칭)
```

특히 `faae36b`에서 `model: model || 'fast'`가 추가됨. 이것이 프론트엔드의 Standard/Premium 분기.

### 2단계: Cloud Run server.js 버전별 비교

```bash
git show a644ffc:apps/monk_imagen4/backend/server.js  # 원본
git show 3f18774:apps/monk_imagen4/backend/server.js  # Phase 1 이관
git show aeb74bb:apps/monk_imagen4/backend/server.js  # 프론트 통합
```

**확인 사항**: 각 버전에서 model 파라미터 수신 여부, fast/ultra 분기 존재 여부

### 3단계: 세션 로그

```bash
ls monkos-ops/ops/sessions/*2026-02-20* monkos-ops/ops/sessions/*2026-02-28*
```

2/20~2/28 사이 Image Pro 정상 가동 기록 확인

### 4단계: 프론트엔드 model 값 확인

```bash
# v5 (MONK_kr 롤백 버전)
grep -o '.\{0,80\}model.\{0,80\}' MONK_kr/ai_lab/image_pro/app/assets/index-v5.js | head -10

# v6 (Cloud Run에 복사된 버전)
grep -o '.\{0,80\}model.\{0,80\}' apps/monk_imagen4/backend/public/app/assets/index-v6.js | head -10
```

프론트엔드가 "fast" / "ultra" 중 어떤 값을 보내는지 확인

## 수정 방향

사전 조사 결과를 바탕으로 아래를 수행:

### A. `@google-cloud/aiplatform` 의존성 복원

```bash
cd apps/monk_imagen4/backend
npm install @google-cloud/aiplatform
```

### B. server.js /generate 핸들러 복원

1. `PredictionServiceClient` import 복원
2. `predictionClient` 초기화 복원 (ADC 자동 사용)
3. `/generate` 핸들러에서:
   - 요청 body에서 `model` 파라미터 수신
   - model 값에 따른 Vertex AI 모델 매핑:
     - `"fast"` (또는 기본값) → `imagen-4.0-fast`
     - `"ultra"` → `imagen-4.0-ultra`
   - Vertex AI PredictionServiceClient로 호출
   - `safetyFilterLevel: 'block_none'`, `personGeneration: 'allow_all'` 필수 (헌법 9조)
4. 응답 형식: 프론트엔드 호환을 위해 `images` 배열을 **문자열** 형태로 반환
   - GCS URL이 있으면 GCS URL, 없으면 `data:image/jpeg;base64,{base64data}`
   - CF Worker가 하던 변환 레이어를 server.js에 내재화

### C. Gemini API 코드 제거 (/generate에서만)

- `/generate`의 Gemini API fetch 코드 제거
- **주의: /refine, /analyze, /translate는 절대 수정하지 말 것** — Gemini 모델 사용이 맞음

## 참조: 2/20 시점 CF Worker가 Cloud Run에 보내던 요청

```js
// faae36b — functions/api/generate.js (2/20 17:02)
const engineResponse = await fetch('https://image.monkos.ai/generate', {
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

## 참조: CF Worker의 응답 변환 (프론트엔드 계약)

```js
// CF Worker가 하던 변환 — 이것을 server.js에 내재화해야 함
const images = (result.images || []).map(img =>
  typeof img === 'string' ? img : `data:image/jpeg;base64,${img.imageBase64 || img.base64}`
);
```

## 수정 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `apps/monk_imagen4/backend/server.js` | /generate: Gemini API → Vertex AI ADC (fast/ultra) |
| `apps/monk_imagen4/backend/package.json` | @google-cloud/aiplatform 의존성 복원 |

## 주의사항

- **/refine, /analyze, /translate 절대 수정 금지** — Gemini API가 맞는 엔드포인트
- `safetySettings` BLOCK_NONE 필수 (헌법 9조: I2I 정체성 보존)
- `personGeneration: 'allow_all'` 필수 (K-뷰티 인물 생성)
- 프론트엔드는 v6 (`index-v6.js`) — model 파라미터 전송 확인 후 매핑
- Cloud Run 서비스 계정 `monk-image-engine@monkos.iam.gserviceaccount.com` 이미 구성됨
- deploy.sh에 `aiplatform.googleapis.com` API 활성화 이미 포함

## 검증 절차

1. 사전 조사(1~4단계) 결과를 완료 보고에 포함할 것
2. 로컬 테스트: `curl -X POST http://localhost:PORT/generate -H 'Content-Type: application/json' -d '{"prompt":"A Korean woman portrait","model":"fast"}'`
3. `model: "ultra"` 로도 테스트
4. `/refine`, `/analyze`, `/translate` 회귀 테스트
5. Cloud Run 배포 후 `image.monkos.ai/generate` 프로덕션 테스트

## 완료 조건

- [ ] 사전 조사 완료 (2/20 히스토리 전체 파악)
- [ ] /generate가 Vertex AI ADC로 imagen-4.0-fast 호출 성공
- [ ] /generate가 model:"ultra"로 imagen-4.0-ultra 호출 성공
- [ ] 응답 형식이 프론트엔드 호환 (문자열 배열)
- [ ] /refine, /analyze, /translate 회귀 없음
- [ ] @google-cloud/aiplatform 의존성 복원
- [ ] Cloud Run 배포 완료
- [ ] 프로덕션 E2E 검증 (프론트에서 이미지 표시까지)
