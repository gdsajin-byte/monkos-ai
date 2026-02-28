---
type: order
date: 2026-03-01
from: M1/쌍아
to: 막내3
priority: P1
scope: Image Pro /generate 엔드포인트 — Vertex AI SDK → Gemini API 직접 호출 전환
context: monk.kr ↔ monkos.ai 완전 분리 Phase 1 블로커 해소
---

# 지시서: Image Pro /generate Gemini API 전환

**[2026-03-01 05:18 KST] M1/쌍아 → 막내3**

## 배경

monk.kr(CF) ↔ monkos.ai(Cloud Run) 완전 분리의 블로커.
`image.monkos.ai`의 `/generate` 엔드포인트만 Vertex AI SDK(`@google-cloud/aiplatform` PredictionServiceClient)를 사용 중이며, `INVALID_ARGUMENT` 에러로 동작하지 않음.

같은 서버의 `/refine`, `/analyze`, `/translate`는 이미 Gemini API 직접 호출(HTTP fetch)로 전환되어 정상 동작 중. `/generate`만 남은 상태.

## 근본 원인

- PredictionServiceClient는 gRPC 프로토콜 사용 → Cloud Run ADC 환경에서 Vertex AI 권한/스코프 불일치
- `imagen-4.0-generate-001` 모델의 파라미터 형식이 SDK enum과 불일치
- CF Workers에서는 동일 기능을 Gemini API Key + HTTP fetch로 정상 동작 중

## 수정 대상

`apps/monk_imagen4/backend/server.js` — `/generate` 엔드포인트 (약 68~195행)

## 수정 방향

Vertex AI SDK 호출을 제거하고, 같은 서버의 `/refine` 패턴(Gemini API HTTP fetch)으로 교체.

### 참조: 현재 동작하는 CF Workers 패턴 (functions/api/generate.js 36~58행)

```js
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `[HIGH-QUALITY IMAGE GENERATION] ... Prompt: ${prompt}` }]
      }],
      generationConfig: { imageConfig: {} },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ],
    })
  }
);
```

### 참조: 같은 서버의 /refine 패턴 (server.js 265~286행)

```js
const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [...] }],
      generationConfig: { ... },
      safetySettings: [...]
    })
  }
);
```

### 수정 요점

1. `PredictionServiceClient` 및 `@google-cloud/aiplatform` import 제거
2. `/generate` 핸들러 내부를 Gemini API fetch로 교체
3. 기존 파라미터(prompt, aspectRatio, negativePrompt 등)를 Gemini API 형식으로 매핑
4. `GEMINI_API_KEY` 환경변수 사용 (서버에 이미 존재 — /refine 등에서 사용 중)
5. 응답 파싱: `candidates[0].content.parts` → base64 이미지 추출
6. GCS 저장 로직이 있다면 그대로 유지

### 주의사항

- **기존 /refine, /analyze, /translate 엔드포인트는 절대 수정하지 말 것** — 정상 동작 중
- `safetySettings` 4개 카테고리 전부 `BLOCK_NONE` (헌법 9조: I2I 정체성 보존)
- `personGeneration` 파라미터는 Gemini API에서는 safetySettings로 대체됨
- `imagen-4.0-generate-001` 모델 참조 제거 → `gemini-3-pro-image-preview` 사용
- 패키지 의존성: `@google-cloud/aiplatform`이 다른 곳에서도 사용되는지 확인 후, 미사용이면 package.json에서 제거

## 수정 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `apps/monk_imagen4/backend/server.js` | /generate 핸들러: Vertex AI → Gemini API fetch |
| `apps/monk_imagen4/backend/server.js` | PredictionServiceClient import 제거 (미사용 시) |
| `apps/monk_imagen4/backend/package.json` | @google-cloud/aiplatform 제거 (미사용 시) |

## 검증 절차

**이 검증을 반드시 실행한 후 완료 보고할 것.**

1. 로컬에서 server.js 실행 후 `/generate` 엔드포인트 테스트
   ```bash
   curl -X POST http://localhost:PORT/generate \
     -H 'Content-Type: application/json' \
     -d '{"prompt": "A professional headshot photo"}'
   ```
2. 응답에 base64 이미지 데이터가 포함되는지 확인
3. `/refine`, `/analyze`, `/translate`이 여전히 정상 동작하는지 확인 (회귀 테스트)
4. Cloud Run 배포 후 `image.monkos.ai/generate` 프로덕션 테스트

## 완료 조건

- [ ] /generate가 Gemini API로 이미지 생성 성공
- [ ] /refine, /analyze, /translate 회귀 없음
- [ ] Vertex AI SDK 의존성 제거 (미사용 확인 후)
- [ ] Cloud Run 배포 완료
- [ ] 프로덕션 엔드포인트 동작 확인

## 이 작업의 의미

이 전환이 완료되면:
- monkos.ai Image Pro의 CF 의존도 = 0
- monk.kr 별도 레포 분리의 블로커 해소
- 완전 분리 Phase 2(monk.kr CF Workers 제거) 진행 가능

**Phase 2는 이 작업 완료 후 별도 지시서로 하달. 절대 선행하지 말 것.**
