---
type: order
date: 2026-08-27
from: iMac/쌍아
to: iMac/막내1
subject: "Vertex Imagen 계열 전면 폐지 대응 — IMAGE PRO T2I + 포털 CMS 이미지생성 Gemini 이미지모델 마이그레이션"
status: 완료
portfolio: PF_IMAGE_PRO
completed: 2026-08-27 16:49 KST (막내1) / 쌍아 검수 합격 17:04 KST
priority: 긴급(프로덕션 장애)
---

# ORDER — IMAGE PRO T2I 모델 마이그레이션 (Imagen 4 폐지 대응)

**[2026-08-27 16:23 KST]** iMac/쌍아 → iMac/막내1

---

## 1. 배경 — 확정된 장애 원인

**IMAGE PRO(`image.monkos.ai`)의 T2I 생성(`POST /generate`)이 500으로 전량 실패 중이다.**

### 1-1. 실측 근거 (2026-08-27 16:14~16:22 KST, 쌍아 직접 실측)

Cloud Run 컨테이너 로그 원문:

```
[Generate] Model: imagen-4.0-fast-generate-001 (fast)
[Generate] Error: Error: 5 NOT_FOUND: Publisher model
`projects/monkos/locations/us-central1/publishers/google/models/imagen-4.0-fast-generate-001`
was not found or your project does not have access to it.
```

- 마지막 성공: **2026-08-17 16:59 KST** (`[Generate] Completed in 11747ms`, HTTP 200)
- 최근 실패: 2026-08-27 15:56~16:09 KST, `POST /generate` **500 × 4건** (작가님 시도분)
- 서비스 리비전 `monk-image-engine-00031-cbh` — **생성일 2026-06-19**, 그 이후 배포 없음
  → **우리 코드 변경 없음. 구글 측 모델 폐지가 원인.**

### 1-2. 모집단 조사 — Imagen 계열 전멸 확인

Vertex 퍼블리셔 모델 카탈로그 전량 페이지네이션(130종) 결과:

```
$ grep -i imagen /tmp/vertex_models.txt
(0건)
```

`:predict` 실호출 probe — **전부 NOT_FOUND**:
`imagen-4.0-fast-generate-001` / `imagen-4.0-generate-001` / `imagen-4.0-ultra-generate-001` /
`imagen-4.0-*-generate-002` / `imagen-3.0-generate-002` / `imagen-5.0-*` / `imagen-4.5-*`
— `us-central1` · `global` 양쪽 모두 동일.

> **대조군 확보 (live-verify 규칙 3항 준수)**: 동일 토큰·동일 프로젝트 경로로 `gemini-2.5-flash:generateContent` 호출 → **200 OK 정상 응답**. 조회 경로 자체는 유효하므로 위 NOT_FOUND는 "권한/경로 문제"가 아니라 **모델 부재**로 확정.

### 1-3. 정상 동작 확인 — 손대지 말 것 (라이브 실측)

| 엔드포인트 | 모델 | 경로 | 실측 결과 |
|---|---|---|---|
| `POST /refine` (I2I·EDIT·UPSCALE) | `gemini-3-pro-image-preview` | generativelanguage + GEMINI_API_KEY | ✅ **200, 실이미지 반환** |
| `POST /analyze` | `gemini-2.5-flash` | generativelanguage + GEMINI_API_KEY | ✅ **200, 정상 분석문 반환** |

→ **I2I 계열은 멀쩡하다. 이번 마이그레이션 대상 아님. 건드리지 말 것.**

### 1-4. 동일 원인 2차 피해 (단건→모집단 승격 결과)

`monkos_AI/portal/lib/cms/ai.js:83` — **포털 CMS 블로그 대표이미지 자동생성**이 동일하게
`imagen-4.0-generate-001` 을 호출한다 (`@google/genai`, `vertexai: true`, `location: us-central1`).
**동일 사유로 이미 고장 상태.** 어드민이 "AI 이미지 생성" 버튼을 누르는 순간 500이 난다.
프론트 무음 실패가 아니라 500 노출이므로 사고 확대 전에 같이 처리한다.

> 나머지 `imagen-*` 히트는 전부 `docs/`(동결 아카이브) · `apps/`(프로토타입) · `monkos-ops/tech/archive/` 로 **프로덕션 무영향**. 별도 조치 불요.

---

## 2. 대체 모델 — 실측 가용성 매트릭스

`projects/monkos` 에서 `:generateContent` **실호출로 이미지 파트 수신까지 확인**한 결과:

| 모델 | `us-central1` | `global` |
|---|---|---|
| `gemini-3-pro-image` | ❌ NOT_FOUND | ✅ **이미지 반환** |
| `gemini-3.1-flash-image` | ❌ NOT_FOUND | ✅ **이미지 반환** |
| `gemini-3.1-flash-lite-image` | ❌ NOT_FOUND | ✅ **이미지 반환** |
| `gemini-2.5-flash-image` | ✅ | ✅ |
| `gemini-3.1-flash-image-preview` | ❌ | ❌ |

`gemini-3-pro-image` + `imageConfig` 실호출 검증 (global):

```json
{"generationConfig":{"responseModalities":["TEXT","IMAGE"],
 "imageConfig":{"aspectRatio":"3:4","imageSize":"2K"}}}
→ 200, modelVersion "gemini-3-pro-image", part mimeType image/png (6,521,328 B base64)
```

→ **`aspectRatio` · `imageSize` 모두 지원 확인.** 기존 프론트 파라미터를 그대로 살릴 수 있다.

### 채택안 — Vertex `global` + GA 모델

| 기존 (Imagen 4) | 신규 |
|---|---|
| `model: 'fast'` → `imagen-4.0-fast-generate-001` | → **`gemini-3.1-flash-image`** |
| `model: 'ultra'` → `imagen-4.0-ultra-generate-001` | → **`gemini-3-pro-image`** |
| location `us-central1` | → **`global`** |
| `:predict` (PredictionServiceClient/gRPC) | → **`:generateContent` (REST)** |
| ADC(SA) 인증 | → **ADC(SA) 인증 유지** |

**채택 이유**
1. GA 모델이다. 이번 사고가 정확히 "preview/구세대 모델 폐지"로 터졌으므로 `-preview` 접미사 모델을 T2I 정본으로 삼지 않는다.
2. SA(ADC) 인증 유지 → `GEMINI_API_KEY` 의존을 T2I에 새로 만들지 않는다.
3. `gemini-3-pro-image` 는 이미 `/refine` 에서 정체성 유지 성능이 검증된 계열이다.

---

## 3. 산출물

| 파일 | 역할 |
|---|---|
| `monkos_AI/image-pro/backend/server.js` | **Phase A** — `/generate` 핸들러 T2I 경로 교체 |
| `monkos_AI/image-pro/backend/package.json` | **Phase A** — `google-auth-library` 명시 의존 추가 |
| `monkos_AI/portal/lib/shared/config.js` | **Phase B** — `global` 로케이션 genai 클라이언트 추가 |
| `monkos_AI/portal/lib/cms/ai.js` | **Phase B** — 이미지 생성 호출 교체 |
| `apps/monk_imagen4/backend/server.js` | **Phase D** — 비정본 경고 주석 1줄 (기능 변경 없음) |
| `monkos-ops/ops/reports/2026-08/COMPLETION_20260827_iMac막내1_IMAGE_PRO_T2I마이그레이션.md` | 완료 보고 |

> **⚠️ 이중 소스 경고**: `monk-image-engine` 은 `monkos_AI/image-pro/backend/` 와 `apps/monk_imagen4/backend/` 양쪽에서 배포된다.
> **정본은 `monkos_AI/image-pro/backend/` 로 확정**했다 — 근거: ① 최종 커밋 06-19(리비전 00031 생성일과 일치) ② 프로덕션 로그의 `[Generate] Image Size: 1K` 출력이 image-pro 판본에만 존재.
> **`apps/` 판본으로 절대 배포하지 말 것.**

---

## 4. 상세 설계

### Phase A — IMAGE PRO `/generate` (긴급)

**대상**: `monkos_AI/image-pro/backend/server.js`

#### A-1. 상수 정의 (파일 상단, 기존 상수 블록 21~24행 인접)

인프라 상수 분산 정의 금지(ch2 7조) — 인라인 하드코딩하지 말고 상단에 모은다.

```js
// T2I 이미지 모델 (2026-08-27: Vertex Imagen 계열 전면 폐지 대응)
// Imagen 4 → Gemini 이미지 모델. GA 모델은 global 로케이션에만 배치됨.
const IMAGE_LOCATION = process.env.IMAGE_LOCATION || 'global';
const IMAGE_MODELS = { fast: 'gemini-3.1-flash-image', ultra: 'gemini-3-pro-image' };
const IMAGE_API_HOST = IMAGE_LOCATION === 'global'
  ? 'https://aiplatform.googleapis.com'
  : `https://${IMAGE_LOCATION}-aiplatform.googleapis.com`;
```

> `LOCATION`(us-central1)은 GCS·기존 상수와 얽혀 있으므로 **건드리지 말고**, 이미지 전용 상수를 새로 둔다.

#### A-2. 인증 — ADC 액세스 토큰

`@google-cloud/aiplatform` 의 gRPC 클라이언트는 `:generateContent` 에 쓸 수 없다. REST + ADC 토큰으로 간다.

```js
const { GoogleAuth } = require('google-auth-library');
const googleAuth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
```

토큰은 요청 시 획득한다(라이브러리가 캐시·갱신을 처리한다).

#### A-3. `/generate` 핸들러 교체 — 68~232행 구간

**보존할 것 (그대로 둔다)**
- 요청 파라미터 파싱(72~90행), `CRITICAL INSTRUCTION:` 정제 로직(92~100행), 필수값 검증(102~108행)
- GCS 저장 블록의 **동작**(167~190행) 및 응답 JSON **형태**(202~213행) — 프론트 계약 유지

**교체할 것**

1. **모델 매핑** (111~113행)
```js
const modelId = IMAGE_MODELS[model] || IMAGE_MODELS.fast;
```

2. **`:predict` 호출 블록 전체** (119~156행) → `:generateContent` REST 호출로 교체

```js
// negativePrompt: Gemini 이미지 모델에는 전용 필드가 없다 → 프롬프트에 병합
const finalPrompt = negativePrompt
  ? `${cleanedPrompt}\n\nAvoid: ${negativePrompt}`
  : cleanedPrompt;

const url = `${IMAGE_API_HOST}/v1/projects/${PROJECT_ID}/locations/${IMAGE_LOCATION}`
          + `/publishers/google/models/${modelId}:generateContent`;

const body = {
  contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
  generationConfig: {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: {
      aspectRatio: finalAspectRatio,
      imageSize: finalImageSize,     // '1K' | '2K' | '4K'
    },
  },
  // /refine(293~313행)의 검증된 BLOCK_NONE 패턴 준수
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
  ],
};
```

3. **N장 생성**: Gemini 이미지 모델은 **1콜 1이미지**다. `sampleCount` 가 없다.
   `numberOfImages` 만큼 **병렬 호출**하고, `Math.min(numberOfImages, 4)` 로 상한을 건다.

4. **타임아웃 유지**: 기존 gRPC 타임아웃(ultra 120s / fast 60s)을 `AbortController` 로 재현한다.
   Cloud Run 서비스 타임아웃이 300s이므로 여유는 있다.

5. **⚠️ mimeType 하드코딩 제거 (필수)**
   기존 코드는 `image/jpeg` 를 **세 군데에 하드코딩**했다(GCS `contentType` 177행, 파일 확장자 170행, 응답 data URL 204행).
   **Gemini 이미지 모델은 `image/png` 를 반환한다.** 실측 확인됨.
   응답 파트의 `inlineData.mimeType` 을 **실제로 읽어서** 셋 모두에 반영할 것. 하드코딩 잔존 시 GCS 메타데이터·다운로드 확장자가 전부 틀어진다.

```js
const parts = json.candidates?.[0]?.content?.parts || [];
const imagePart = parts.find(p => p.inlineData);
if (!imagePart) throw new Error('No image in response. The model might have declined the request.');
const mimeType  = imagePart.inlineData.mimeType || 'image/png';
const ext       = mimeType.split('/')[1] || 'png';
const imageBytes = imagePart.inlineData.data;
```

6. **미지원 파라미터 처리**: `seed` · `guidanceScale` · `safetyFilterLevel` · `personGeneration` · `outputCompression` 은 Gemini 이미지 모델에 **없다**.
   - **req.body 수신은 그대로 유지**한다 (프론트 400 방지).
   - API 요청 body에는 **넣지 않는다** (넣으면 400).
   - 값이 들어온 경우 `console.log('[Generate] Ignored params: ...')` 로 **가시화**한다. 무음 무시 금지.

7. **에러 처리**: `!response.ok` 시 응답 본문을 로그에 남기고 500 반환. **무음 폴백·강등 출고 금지** (`feedback_paid_failure_no_degraded_delivery`).

8. **정리**: `helpers` / `PredictionServiceClient` 가 `/generate` 외에서 쓰이지 않으면 import를 제거한다. 다른 참조가 있으면 그대로 둔다 — **확인 후 판단할 것.**

#### A-4. `package.json`

```json
"google-auth-library": "^9.15.0"
```
현재 `@google-cloud/aiplatform` 의 전이 의존으로만 존재한다. 직접 `require` 하므로 명시 의존으로 승격한다.
설치 후 `npm ls google-auth-library` 로 해석 확인.

#### A-5. 배포

```bash
cd monkos_AI/image-pro/backend && ./deploy.sh
```
`gcloud run deploy` 직접 실행 금지 (ch5 2조).
`--set-env-vars` 에 `IMAGE_LOCATION` 을 추가할 필요는 없다 — 코드 기본값 `global` 로 동작한다.

---

### Phase B — 포털 CMS 이미지 생성

**B-1. `monkos_AI/portal/lib/shared/config.js`** (120~123행 인접)

기존 `ai` 클라이언트는 **그대로 둔다** (텍스트 모델이 us-central1에서 정상 동작 중). 이미지 전용 클라이언트를 추가한다.

```js
// 이미지 생성 전용 — Gemini 이미지 GA 모델은 global 로케이션 배치 (2026-08-27 Imagen 폐지 대응)
export const aiImage = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});
export const CMS_IMAGE_MODEL = 'gemini-3.1-flash-image';
```

**B-2. `monkos_AI/portal/lib/cms/ai.js` 81~92행**

`ai.models.generateImages()` 는 Imagen 전용 API다. Gemini 이미지 모델에는 쓸 수 없다.

```js
import { ai, aiImage, CMS_IMAGE_MODEL, ... } from '../shared/config.js';

const imgResponse = await aiImage.models.generateContent({
  model: CMS_IMAGE_MODEL,
  contents: [{ role: 'user', parts: [{ text: generatedPrompt }] }],
  config: { responseModalities: ['TEXT', 'IMAGE'] },
});
const imageBytes = imgResponse.candidates?.[0]?.content?.parts
  ?.find(p => p.inlineData)?.inlineData?.data;
if (!imageBytes) { /* 기존 500 응답 유지 */ }
```

- 이후 `sharp(imageBuffer).jpeg({ quality: 85 })` 는 **그대로 둔다**. sharp가 PNG 입력을 자동 판별하므로 JPEG 변환 결과·GCS 경로·`contentType`은 변동 없다.
- 103행 GCS 메타데이터 `model: 'imagen-4-fast'` → `model: CMS_IMAGE_MODEL` 로 교체. (표기 정합)
- `handleAiThumbnail`(118행 이하)에도 이미지 생성 호출이 있는지 **확인**하고, 있으면 동일하게 처리한다.

**B-3. 배포**

```bash
cd monkos_AI/portal && ./deploy.sh prod
```
> **엣지 재배포 불요**: `ai.js`·`config.js` 는 specs 정적 자산(specs-data·렌더러·i18n·components)이 아니다.
> 다만 `config.js` 는 **공용 정본**이다. `aiImage` 는 신규 export이므로 기존 소비처 영향은 없어야 하나, `grep -rn "from '.*shared/config.js'"` 로 **소비처 확인 게이트**를 1회 돌릴 것 (`feedback_verify_consumer_check`).

---

### Phase C — 검증 (live-verify 규칙 준수)

배포 후 **반드시** 아래를 실측하고 결과를 완료 보고에 수치로 기재한다.

1. **T2I fast**
```bash
curl -s -X POST https://image.monkos.ai/generate -H "Content-Type: application/json" \
  -d '{"prompt":"a red apple on a white table","model":"fast","aspectRatio":"1:1","imageSize":"1K"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('success'),d.get('metadata',{}).get('model'),len(d.get('images',[''])[0]))"
```
2. **T2I ultra** — 위와 동일, `"model":"ultra"`, `"aspectRatio":"3:4"`, `"imageSize":"2K"`
3. **회귀 확인 (필수)** — `/refine` (mode `I2I`) · `/analyze` 각 1회. **이번에 손대지 않았으므로 배포 전과 동일하게 200이어야 한다.** 200이 아니면 즉시 보고하고 진행 중단.
4. **포털** — 어드민 AI 이미지 생성 1회 실행 후 GCS URL 반환·이미지 열람 확인.
5. **판정 방법 명기**: CDN 캐시 계층을 지나는 표면을 판정할 때는 **URL당 2회 히트**(1차 버림·2차 판정). `/generate` 는 POST API이므로 캐시 대상이 아니나, 포털 화면 판정 시에는 2회 히트 규칙을 적용한다.
6. `[Generate] Ignored params` 로그가 의도대로 찍히는지 Cloud Run 로그에서 1회 확인.

> **0건·성공 1건은 증명이 아니다.** 실패 시에는 응답 본문 원문을 그대로 보고에 옮길 것. "안 되는 것 같다"는 보고 금지.

---

### Phase D — 이중 소스 방어 (기능 변경 없음)

`apps/monk_imagen4/backend/server.js` 최상단에 주석 1줄 추가:

```js
// ⚠️ 비정본 — monk-image-engine 정본 소스는 monkos_AI/image-pro/backend/ 이다. 이 판본으로 배포 금지. (2026-08-27)
```

코드 로직 변경 금지. 이 판본의 Imagen 호출은 **고치지 않는다** (배포되지 않으므로 무해하고, 고치면 정본 오인을 부른다).

---

## 5. ⚠️ 준수 조항

- **헌법 4조 1항** — API 키·시크릿 **절대 생성/추측 금지**. `GEMINI_API_KEY` 는 Secret Manager 정본이며 이번 작업에서 **값을 열람할 필요가 전혀 없다**. Phase A는 ADC(SA) 인증만 쓴다.
- **헌법 4조 2항** — `rm -rf`, `git reset --hard`, `git push --force`, `git clean -f` 금지.
- **헌법 3조 1항** — 매 턴 `date` 로 KST 취득. 추정 타임스탬프 금지.
- **헌법 3조 2항** — 세션 로그 어펜드 + **COMPLETION 보고서 파일 생성** (터미널 출력만으로는 미완료).
- **법률 ch5 2조** — Cloud Run 배포는 **`deploy.sh` 경유 필수**. `gcloud run deploy` / `gcloud builds submit` 직접 실행 금지.
- **법률 ch2 7조** — 모델 ID·로케이션·호스트를 핸들러 안에 흩어 놓지 말 것. 파일 상단 상수 정본 경유.
- **`rules/live-verify.md`** — "배포됐다 = 반영됐다"로 판정 금지. Phase C 실측 없이 완료 보고 금지. 판정 방법을 보고에 함께 기재.
- **`rules/pf-ops.md`** — `PF_IMAGE_PRO` 히스토리 1행 어펜드.
- **롤백 단위 = 커밋 단위** — **Phase A(image-pro)와 Phase B(portal)는 반드시 별도 커밋**. 한쪽만 되돌릴 수 있어야 한다.
- **범위 밖 작업 금지** — `/refine`·`/analyze` 는 **정상 동작 확인됨**. 손대지 말 것. 개선 아이디어가 생기면 보고 후 대기.
- **에러 3회 반복 시** `/에스컬레이션`.

---

## 6. 완료 기준

- [ ] Phase A — `server.js` T2I 경로 `:generateContent` 교체 완료
- [ ] Phase A — mimeType 하드코딩 3개소(GCS contentType·파일 확장자·응답 data URL) 전부 동적화
- [ ] Phase A — 미지원 파라미터 무음 무시 아님(`Ignored params` 로그) 확인
- [ ] Phase A — `package.json` 에 `google-auth-library` 명시 추가 + `npm ls` 해석 확인
- [ ] Phase A — `deploy.sh` 경유 배포, 신규 리비전명 기록
- [ ] Phase B — `config.js` `aiImage` 추가 + 소비처 확인 게이트 1회
- [ ] Phase B — `ai.js` `generateContent` 교체 + `handleAiThumbnail` 동일 패턴 여부 확인
- [ ] Phase B — `deploy.sh prod` 경유 배포, 신규 리비전명 기록
- [ ] Phase C — T2I fast/ultra 각 1회 성공 (응답 크기·modelVersion 기재)
- [ ] Phase C — `/refine`·`/analyze` 회귀 200 확인
- [ ] Phase C — 포털 어드민 이미지 생성 1회 성공
- [ ] Phase D — 비정본 경고 주석 추가
- [ ] `PF_IMAGE_PRO` 히스토리 1행 어펜드
- [ ] COMPLETION 보고서 파일 생성
- [ ] 세션 로그 어펜드 → 커밋(A/B 분리) → 푸시

---

## 7. 커밋 메시지

Phase A:
```
[fix] IMAGE PRO T2I 모델 마이그레이션 — Imagen 4 폐지 대응 (gemini-3-pro-image/3.1-flash-image, global)
```

Phase B:
```
[fix] 포털 CMS 이미지생성 Imagen 4 폐지 대응 — gemini-3.1-flash-image 전환
```

Phase D(A에 동봉 가능):
```
[docs] apps/monk_imagen4 비정본 경고 주석 — monk-image-engine 정본 경로 명시
```
