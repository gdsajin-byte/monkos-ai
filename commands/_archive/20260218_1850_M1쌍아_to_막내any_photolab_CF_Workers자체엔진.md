**상태**: 대기

# 지시서: photolab 자체 백엔드 구축 (CF Workers)

[2026-02-18 18:50 KST] M1/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → M1/쌍아` 형식

---

## Context

monk.kr photolab이 monkos Cloud Run을 CF Function 프록시로 당겨쓰는 구조 → **CF Pages 빌드 경로 문제로 프록시 3개 405 응답**. 배포라인이 다른 두 시스템을 억지로 엮은 게 근본 원인.

**해결: monk.kr에 자체 백엔드 엔진을 CF Workers로 구축. monkos Cloud Run 의존 제거.**

`photo.js`(동작 중, Gemini API Key 직접 호출)가 패턴 검증 완료. 같은 패턴으로 3개 Worker 자체 구현.

---

## 아키텍처

```
[After — 자체 엔진 (독립)]
app.js → /api/precheck → precheck.js (CF Worker) → Gemini Flash API (직접)
app.js → /api/idgen    → idgen.js    (CF Worker) → Gemini Pro API (직접)
app.js → /api/qc       → qc.js      (CF Worker) → Gemini Flash API (직접)
app.js → wss://idphoto-kr.monkos.ai  (코칭 WS — 직접 연결, 변경 없음)
```

모든 Worker가 `env.GEMINI_API_KEY`(CF Pages Secrets에 이미 설정됨)로 Gemini API 직접 호출.

---

## 파일 목록

### 신규 생성 (3개)

| 파일 | 엔드포인트 | 역할 |
|------|-----------|------|
| `MONK_kr/functions/api/precheck.js` | POST `/api/precheck` | 촬영본 적합성 사전분석 |
| `MONK_kr/functions/api/idgen.js` | POST `/api/idgen` | 증명사진 I2I 생성 |
| `MONK_kr/functions/api/qc.js` | POST `/api/qc` | 원본 vs 생성물 QC 검증 |

> **파일명에 하이픈(`-`) 사용 금지.** 기존 동작 Workers 모두 하이픈 없는 이름.

### 수정 (1개)

| 파일 | 변경 |
|------|------|
| `MONK_kr/ai_lab/photolab/config.js` | API 경로: `/api/precheck`, `/api/idgen`, `/api/qc` |

### 삭제 (3개)

| 파일 | 이유 |
|------|------|
| `MONK_kr/functions/api/idphoto-generate.js` | 프록시 → 자체 엔진 대체 |
| `MONK_kr/functions/api/idphoto-precheck.js` | 프록시 → 자체 엔진 대체 |
| `MONK_kr/functions/api/idphoto-qc.js` | 프록시 → 자체 엔진 대체 |

---

## 공통 Worker 패턴

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

## 1. precheck.js — 사전분석

**템플릿:** `MONK_kr/functions/api/analyze.js`

**요청:** `{ "image": "<순수 base64>" }`
**응답:** `{ "suitable": true, "score": 85, "face_detected": true, "issues": [], "suggestion": "한줄 조언" }`

**모델:** `gemini-2.0-flash`
**API:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

```json
{
  "contents": [{"parts": [
    { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } },
    { "text": "<PRE_CHECK_INSTRUCTION>" }
  ]}],
  "generationConfig": { "responseMimeType": "application/json", "temperature": 0.2 }
}
```

**PRE_CHECK_INSTRUCTION** — `monkos_AI/idphoto-kr/server.js` 400-423행 전문 복사:

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

suitable: 70 이상이면 true. issues: 빈 배열이면 문제 없음.
```

**폴백:** API 실패 시 `{ suitable: true, score: 0, note: "분석 실패: ..." }` (생성 진행 허용)

---

## 2. idgen.js — 증명사진 I2I 생성

**템플릿:** `MONK_kr/functions/api/photo.js`

**요청:**
```json
{ "image": "<순수 base64>", "style": "id_photo|resume", "gender": "male|female", "age": "child|teen|adult", "userId": "<optional>" }
```

**응답:** `{ "image": "data:image/png;base64,..." }`
**에러 402:** `{ "error": "...", "credits": 0, "required": 1 }`

**모델:** `gemini-3-pro-image-preview`
**API:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`

```json
{
  "contents": [{"parts": [
    { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } },
    { "text": "<IDENTITY_PRESERVATION + STYLE + OUTFIT>" }
  ]}],
  "generationConfig": { "responseModalities": ["TEXT","IMAGE"], "imageConfig": { "aspectRatio": "3:4" } },
  "safetySettings": [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
  ]
}
```

**프롬프트 조합:** `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${STYLE_PROMPTS[style]}\n\n${getOutfitPrompt(gender, age, style)}`

**IDENTITY_PRESERVATION** — server.js 145-184행 전문 복사.
**STYLE_PROMPTS** — server.js 186-189행 복사.
**getOutfitPrompt** — server.js 192-211행 복사.

**이미지 추출:**
```js
const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
if (!part?.inlineData) throw new Error('이미지 생성 실패');
return `data:image/png;base64,${part.inlineData.data}`;
```

**이미지 크기:** 2MB 초과 시 400 반환.

---

## 3. qc.js — QC 검증

**템플릿:** `MONK_kr/functions/api/analyze.js`

**요청:**
```json
{ "original": "<순수 base64>", "generated": "<순수 base64>", "gender": "male|female", "age": "child|teen|adult" }
```

**응답:**
```json
{ "same_person": true, "similarity": 85, "identity": "PASS", "gender_match": true, "age_match": true, "over_retouched": false, "quality": "GOOD", "face_box": [180,220,650,780], "face_ratio": 0.35, "face_center_x": 500, "head_top_margin": 80, "note": "코멘트" }
```

**모델:** `gemini-2.0-flash`
**이미지 2장** 동시 전송:

```json
{
  "contents": [{"parts": [
    { "inlineData": { "mimeType": "image/jpeg", "data": "<original>" } },
    { "inlineData": { "mimeType": "image/png", "data": "<generated>" } },
    { "text": "<buildQCInstruction(gender, age)>" }
  ]}],
  "generationConfig": { "responseMimeType": "application/json", "temperature": 0.3 }
}
```

**buildQCInstruction** — server.js 214-259행 전문 복사.
**JSON 파싱 실패 시:** `{ identity: 'ERROR', note: 'QC 분석 실패' }` 반환.

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

---

## 참고 파일 (읽기 전용)

| 파일 | 용도 |
|------|------|
| `MONK_kr/functions/api/photo.js` | 생성 Worker 템플릿 (153줄) |
| `MONK_kr/functions/api/analyze.js` | 분석 Worker 템플릿 |
| `monkos_AI/idphoto-kr/server.js` | 프롬프트 원본 (765줄, 수정 금지) |

## 주의사항

- `monkos_AI/idphoto-kr/` 수정 금지 (0원칙)
- 파일명 하이픈 금지
- `env.GEMINI_API_KEY` 하드코딩 절대 금지
- 에러 메시지 한국어
- 작업 브랜치: `develop`
- 커밋 → push → 완료 보고 필수
