# 지시서: CF Workers 자체 엔진 구현 (precheck/idgen/qc)

[2026-02-19 13:29 KST] iMac/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `iMac/막내1 → iMac/쌍아` 형식

---

## Context

monk.kr photolab에서 CF Function 프록시(`idphoto-*.js`)가 405를 반환하는 문제(2/18 발견).
**원인:** CF Pages 빌드 경로 불일치로 프록시가 Cloud Run까지 도달 못함.
**해결:** monk.kr에 자체 백엔드 엔진을 CF Workers로 구축. monkos Cloud Run 의존 완전 제거.

이미 동작 중인 `photo.js`(Gemini API Key 직접 호출)가 패턴 검증 완료.
같은 패턴으로 3개 Worker를 자체 구현.

```
[Before — 프록시 의존 (broken)]
app.js → /api/idphoto-generate → CF Function(프록시) → idphoto-kr.monkos.ai → Gemini API
                                       ↑ 405 (경로 불일치)

[After — 자체 엔진 (독립)]
app.js → /api/precheck → precheck.js (CF Worker) → Gemini Flash API (직접)
app.js → /api/idgen    → idgen.js    (CF Worker) → Gemini Pro API (직접)
app.js → /api/qc       → qc.js      (CF Worker) → Gemini Flash API (직접)
```

---

## 파일 목록

### 신규 생성 (3개)

| 파일 | 경로 | 엔드포인트 |
|------|------|-----------|
| `precheck.js` | `MONK_kr/functions/api/precheck.js` | POST `/api/precheck` |
| `idgen.js` | `MONK_kr/functions/api/idgen.js` | POST `/api/idgen` |
| `qc.js` | `MONK_kr/functions/api/qc.js` | POST `/api/qc` |

### 수정 (1개)

| 파일 | 변경 |
|------|------|
| `MONK_kr/ai_lab/photolab/config.js` | API 경로 3개 변경 |

### 삭제 (3개)

| 파일 | 이유 |
|------|------|
| `MONK_kr/functions/api/idphoto-generate.js` | 프록시 → 자체 엔진 대체 |
| `MONK_kr/functions/api/idphoto-precheck.js` | 프록시 → 자체 엔진 대체 |
| `MONK_kr/functions/api/idphoto-qc.js` | 프록시 → 자체 엔진 대체 |

---

## 1. precheck.js — 촬영본 사전분석

**템플릿:** `MONK_kr/functions/api/analyze.js` (API 호출 패턴)

**요청:** `{ "image": "<순수 base64, data: prefix 없음>" }`

**응답:**
```json
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "한줄 한국어 조언"
}
```

**프롬프트:**
```
이 사진이 증명사진 원본으로 적합한지 분석해 주세요.

[체크 항목]
1. 얼굴 감지: 얼굴이 1개 명확하게 보이는가?
2. 정면성: 정면을 보고 있는가? (좌우 기울기, 고개 숙임/들림)
3. 조명: 얼굴에 심한 그림자나 역광이 없는가?
4. 선명도: 흔들림 없이 선명한가?
5. 얼굴 크기: 프레임 대비 얼굴이 충분히 큰가? (최소 20%)
6. 표정: 무표정 또는 자연스러운 미소인가?
7. 눈: 눈을 감지 않았는가?

[응답 형식 — JSON만 출력]
{ "suitable": true, "score": 85, "face_detected": true, "issues": [], "suggestion": "한줄 조언" }
suitable: 70 이상이면 true. issues: 문제 목록 배열.
```

**API 호출:**
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
헤더: x-goog-api-key: env.GEMINI_API_KEY
```
Body: `contents` 안에 `inlineData` (이미지) + `text` (프롬프트), `generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }`

---

## 2. idgen.js — 증명사진 I2I 생성

**템플릿:** `MONK_kr/functions/api/photo.js` (I2I 생성 패턴)

**요청:**
```json
{
  "image": "<순수 base64>",
  "style": "id_photo" | "resume",
  "gender": "male" | "female",
  "age": "child" | "teen" | "adult"
}
```

**응답:** `{ "image": "data:image/png;base64,..." }`

**구현 포인트:**

1. **IDENTITY_PRESERVATION 프롬프트** — `photo.js` L6~L24 그대로 복사
2. **STYLE_PROMPTS** — `monkos_AI/idphoto-kr/server.js` L186~189에서 복사 (`id_photo`, `resume`)
3. **getOutfitPrompt(gender, age, style)** — `monkos_AI/idphoto-kr/server.js` L192~211에서 복사
4. **모델:** `gemini-3-pro-image-preview` (photo.js와 동일)
5. **안전설정:** `BLOCK_NONE` 4종 (photo.js L97~102 동일)
6. **API 호출:** `?key=${apiKey}` 파라미터 방식 (photo.js L80 동일)
7. **이미지 크기 검증:** base64 디코드 후 2MB 상한 체크

**프롬프트 조립:**
```js
const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
const outfitPrompt = getOutfitPrompt(gender, age, style);
const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${outfitPrompt}`;
```

**photo.js와 차이점:**
- `image` 필드 (순수 base64, data URL 아님)
- `gender`, `age` 추가 → outfit 프롬프트 생성
- 응답: `{ image: "data:..." }` (photo.js는 `{ success, image, metadata }`)

---

## 3. qc.js — QC 검증

**템플릿:** `MONK_kr/functions/api/analyze.js` (JSON 응답 패턴)

**요청:**
```json
{
  "original": "<순수 base64>",
  "generated": "<순수 base64>",
  "gender": "male" | "female",
  "age": "child" | "teen" | "adult"
}
```

**응답:**
```json
{
  "same_person": true, "similarity": 85, "identity": "PASS",
  "gender_match": true, "age_match": true, "over_retouched": false,
  "quality": "GOOD", "face_box": [180, 220, 650, 780],
  "face_ratio": 0.35, "face_center_x": 500, "head_top_margin": 80,
  "note": "한줄 코멘트"
}
```

**구현:**
- 이미지 2장(original + generated)을 `contents.parts`에 `inlineData` 2개로 전송
- **buildQCInstruction(gender, age)** — `monkos_AI/idphoto-kr/server.js` L214~260에서 **전문 복사**
- 모델: `gemini-2.0-flash`, 헤더: `x-goog-api-key`
- `responseMimeType: 'application/json'`, `temperature: 0.3`
- JSON 파싱 실패 시 `{ identity: 'ERROR', note: 'QC 분석 실패' }` 반환

---

## 4. config.js 수정

```js
// Before
PRECHECK: '/api/idphoto-precheck',
GENERATE: '/api/idphoto-generate',
QC: '/api/idphoto-qc',

// After
PRECHECK: '/api/precheck',
GENERATE: '/api/idgen',
QC: '/api/qc',
```

COACHING, CREDIT_USE 등 나머지는 변경하지 않음.

---

## 공통 Worker 패턴

모든 Worker는 이 구조를 따른다 (photo.js/analyze.js 패턴):

```js
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'API 키 미설정' }), { status: 500, headers: CORS });
    const body = await request.json();
    // ... 로직
    return new Response(JSON.stringify(result), { headers: CORS });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: CORS });
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
```

---

## 참고 파일 (읽기 전용 — 수정 금지)

| 파일 | 용도 |
|------|------|
| `MONK_kr/functions/api/photo.js` | I2I 생성 Worker 템플릿 |
| `MONK_kr/functions/api/analyze.js` | 분석 Worker 템플릿 |
| `monkos_AI/idphoto-kr/server.js` | 프롬프트 원본 (복사만, 수정 금지) |
| `MONK_kr/ai_lab/photolab/app.js` | 프론트엔드 (요청/응답 형식 확인) |

---

## 주의사항

- `monkos_AI/idphoto-kr/` 수정 금지 (0원칙)
- `MONK_kr/functions/api/` 파일명에 하이픈(`-`) 사용 금지
- `env.GEMINI_API_KEY`는 CF Pages Secrets에 이미 설정됨 — 하드코딩 금지
- 에러 메시지는 한국어
- 커밋 접두사: `[feature]`
- 커밋 후 push origin develop
