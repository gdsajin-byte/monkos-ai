# 지시서: 통합 챗봇 엔진에 코칭/QC 채널 추가

```
[2026-02-21 06:53 KST] M1/쌍아 → 막내3
```

## 역할 선언

> **너는 "막내3"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 통합 챗봇 엔진(chatWithMonkos)에 코칭 + QC 채널 추가 |
| **작업 경로** | `monkos_AI/portal/server.js` + `MONK_kr/ai_lab/photolab/config.js` |
| **브랜치** | `develop` |
| **배포** | 포탈: `gcloud run deploy monkos-portal` / 프론트: `wrangler pages deploy` |
| **목적** | 별도 엔진 없이 monkos.ai 포탈 챗봇 하나로 CS + 코칭 + QC 통합 처리 |

## 0원칙

> **monkos_AI/idphoto-kr/ 수정 금지.** (프로덕션 동결)
> **monkos_AI/idphoto-jp/ 수정 금지.**
> **monk.js 수정 금지.**
> API 키 하드코딩 금지.
> `monkos_AI/portal/`은 **수정 허용** — 챗봇 엔진의 본거지.

---

## 배경

### 현재 상태
`monkos_AI/portal/server.js`에 **통합 챗봇 엔진 `chatWithMonkos`** 가 이미 있다:
- 모델: `gemini-2.0-flash` (Vertex AI ADC)
- 채널: `web`(웹 CS), `telegram`(텔레그램 CS), `prep`(촬영 준비 코치)
- RAG: Firestore `cs_knowledge` (촬영 코퍼스 5건 시드 완료)
- 히스토리: 인메모리 + Firestore 영속화
- 채널별 시스템 프롬프트 + temperature + maxOutputTokens 분기

### 목표
여기에 `coaching`(실시간 코칭)과 `qc`(품질 검수) 채널을 추가하여, **하나의 엔진으로 전부 처리**.

### 왜 이 방식인가
- 이미 CS/촬영 코퍼스가 전부 들어있음 (RAG 연동)
- 채널 추가만으로 코칭/QC 가능 — 별도 엔진 불필요
- Vertex AI ADC — API 키 관리 필요 없음
- 나중에 monkos.ai로 photolab 이관 시 그대로 사용

---

## Task 1: chatWithMonkos 멀티모달 확장

현재 `chatWithMonkos`는 텍스트만 처리한다. 코칭/QC는 **이미지 입력**이 필요.

### 1-1. 함수 시그니처 변경

```js
// 현재
async function chatWithMonkos(channel, chatId, userMessage)

// 변경 — options 파라미터 추가
async function chatWithMonkos(channel, chatId, userMessage, options = {})
// options.image: base64 이미지 (코칭/QC용)
// options.image2: base64 이미지 2장째 (QC — 생성 이미지)
// options.style: 스타일 (id_photo/resume)
// options.fields: 9필드 객체 (코칭용)
```

### 1-2. contents 구성 변경

```js
// 현재 (라인 490)
history.messages.push({ role: 'user', parts: [{ text: userMessage }] });

// 변경 — 이미지가 있으면 멀티파트
const parts = [];
if (options.image) {
  parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image } });
}
if (options.image2) {
  parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image2 } });
}
parts.push({ text: userMessage });

history.messages.push({ role: 'user', parts });
```

### 1-3. 코칭/QC는 히스토리 불필요

코칭은 매 프레임 독립 분석이므로 히스토리가 필요 없다. QC도 1회성.

```js
// CHANNEL_CONFIG에서 stateless 플래그 추가
coaching: {
  // ...
  stateless: true,  // 히스토리 축적 안 함
},
qc: {
  // ...
  stateless: true,
},
```

chatWithMonkos 내부에서:
```js
if (!config.stateless) {
  // 기존 히스토리 로직
} else {
  // 히스토리 없이 단발 요청
  history = { messages: [], lastAccess: Date.now() };
}
```

---

## Task 2: CHANNEL_CONFIG에 coaching/qc 추가

### 2-1. 코칭 프롬프트

`functions/api/idphoto-coaching.js`의 `COACHING_INSTRUCTIONS` + `buildCoachingPrompt()`를 그대로 가져온다.

```js
const COACHING_SYSTEM_PROMPT = `몽코스 AI 코치입니다. 증명사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (무표정 또는 자연스러운 미소)
4. 눈썹이 보이는지 (앞머리로 가리면 안됨)
5. 얼굴 라인이 드러나는지 (헤어로 덮으면 안됨)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`;
```

**스타일 분기**: `options.style`에 따라 id_photo/resume 프롬프트 선택.
**9필드 동적 프롬프트**: `buildCoachingPrompt()` 함수를 `functions/api/idphoto-coaching.js`에서 복사.

### 2-2. QC 프롬프트

`functions/api/qc.js` 참조하여 QC 프롬프트 추가.

### 2-3. CHANNEL_CONFIG 추가

```js
coaching: {
  systemPrompt: COACHING_SYSTEM_PROMPT,  // 동적: buildCoachingPrompt()로 오버라이드
  temperature: 0.3,
  maxOutputTokens: 50,
  stateless: true,
  historyMap: null,  // 사용 안 함
  logCollection: null,  // 코칭 로깅 불필요 (2fps 부하)
},
qc: {
  systemPrompt: QC_SYSTEM_PROMPT,
  temperature: 0.2,
  maxOutputTokens: 300,
  stateless: true,
  historyMap: null,
  logCollection: 'qc_results',
  responseMimeType: 'application/json',  // QC는 JSON 응답
},
```

---

## Task 3: API 엔드포인트 추가

### 3-1. POST /api/coaching

```js
// 코칭 전용 엔드포인트
if (pathname === '/api/coaching' && method === 'POST') {
  const { image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = body;
  if (!image) return respond(400, { error: 'image 필수' });

  const fields = { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression };
  const prompt = buildCoachingPrompt(fields);  // 동적 프롬프트

  const text = await chatWithMonkos('coaching', 'coaching', '이 사진의 자세, 조명, 표정을 체크해주세요.', {
    image,
    fields,
    systemPromptOverride: prompt,  // 동적 프롬프트로 오버라이드
  });

  const READY_KEYWORDS = ['좋아요', '완벽', '촬영하세요', 'OK', '좋습니다', '잘 맞', '훌륭', '지금'];
  const ready = READY_KEYWORDS.some(kw => text.includes(kw));

  return respond(200, { text, ready });
}
```

### 3-2. POST /api/qc

```js
if (pathname === '/api/qc' && method === 'POST') {
  const { original, generated, style } = body;
  if (!original || !generated) return respond(400, { error: 'original, generated 필수' });

  const text = await chatWithMonkos('qc', 'qc', 'QC 판정해주세요.', {
    image: original,
    image2: generated,
    style,
  });

  // JSON 파싱 시도
  try {
    const result = JSON.parse(text);
    return respond(200, result);
  } catch {
    return respond(200, { pass: false, raw: text });
  }
}
```

### 3-3. CORS 설정

monk.kr에서 monkos.ai로 요청하므로 CORS 필요:

```js
// 기존 CORS 헤더에 monk.kr 추가 (이미 있을 수 있음 — 확인)
'Access-Control-Allow-Origin': '*'  // 또는 'https://monk.kr'
```

---

## Task 4: chatWithMonkos 내부 수정

### 4-1. systemPromptOverride 지원

코칭은 9필드 기반 동적 프롬프트를 사용하므로, CHANNEL_CONFIG의 고정 프롬프트 대신 오버라이드 가능하게:

```js
// chatWithMonkos 내부
const systemPrompt = (options.systemPromptOverride || config.systemPrompt) + ragContext;
```

### 4-2. responseMimeType 지원 (QC용)

```js
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: config.stateless ? [{ role: 'user', parts }] : history.messages,
  config: {
    systemInstruction: systemPrompt,
    maxOutputTokens: config.maxOutputTokens,
    temperature: config.temperature,
    ...(config.responseMimeType && { responseMimeType: config.responseMimeType }),
  },
});
```

### 4-3. stateless 처리

```js
if (config.stateless) {
  // 히스토리 없이 단발 요청, 로깅 스킵
  const parts = [];
  if (options.image) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image } });
  if (options.image2) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image2 } });
  parts.push({ text: userMessage });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
      ...(config.responseMimeType && { responseMimeType: config.responseMimeType }),
    },
  });

  return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
// else: 기존 히스토리 로직 그대로
```

---

## Task 5: MPA config.js API 경로 변경

**파일**: `MONK_kr/ai_lab/photolab/config.js`

```js
// 현재
COACHING: '/api/idphoto-coaching',

// 변경
COACHING: 'https://monkos.ai/api/coaching',
```

QC도 추가:
```js
QC: 'https://monkos.ai/api/qc',
```

**주의**: PRECHECK, GENERATE는 기존 CF Functions 유지 (또는 추후 이관).

---

## Task 6: buildCoachingPrompt 함수 이식

`functions/api/idphoto-coaching.js`의 `buildCoachingPrompt()` 함수를 `portal/server.js`에 복사.

스타일별 분기(id_photo/resume) + 9필드 컨텍스트 빌더 그대로.

---

## Task 7: 배포 + 검증

### 7-1. 포탈 배포
```bash
cd monkos_AI/portal
gcloud builds submit --tag gcr.io/monkos/monkos-portal:latest
gcloud run deploy monkos-portal --image gcr.io/monkos/monkos-portal:latest --region us-central1 --allow-unauthenticated
```

### 7-2. 프론트 배포
```bash
npx wrangler pages deploy --project-name=monk-kr --branch=main
```

### 7-3. 검증
```bash
# 코칭 엔드포인트
curl -s -X POST "https://monkos.ai/api/coaching" \
  -H "Content-Type: application/json" \
  -d '{"image":"dGVzdA==","style":"id_photo"}' | head -c 200
# 기대: { "text": "...", "ready": false }

# QC 엔드포인트
curl -s -X POST "https://monkos.ai/api/qc" \
  -H "Content-Type: application/json" \
  -d '{"original":"dGVzdA==","generated":"dGVzdA==","style":"id_photo"}' | head -c 200
# 기대: JSON 응답

# health (기존)
curl -s "https://monkos.ai/health"
# chatbot: gemini-2.0-flash 확인
```

---

## 수정 가능 파일

| 파일 | 수정 허용 |
|------|----------|
| `monkos_AI/portal/server.js` | chatWithMonkos 확장 + 코칭/QC 채널 + 엔드포인트 |
| `MONK_kr/ai_lab/photolab/config.js` | API.COACHING 경로 변경 + API.QC 추가 |

**수정 금지**: `monkos_AI/idphoto-kr/`, `monkos_AI/idphoto-jp/`, `monk.js`, `shared.js`, `camera.js`

---

## 완료 조건

### Level 1 (필수)
- [ ] CHANNEL_CONFIG에 coaching + qc 채널 추가
- [ ] chatWithMonkos에 멀티모달(이미지) + stateless 지원
- [ ] POST /api/coaching 엔드포인트 동작
- [ ] POST /api/qc 엔드포인트 동작
- [ ] buildCoachingPrompt() 이식 (9필드 동적 프롬프트)
- [ ] config.js API 경로 monkos.ai로 변경
- [ ] 포탈 + 프론트 배포 완료

### Level 2 (권장)
- [ ] curl로 코칭 텍스트 응답 확인
- [ ] CORS monk.kr → monkos.ai 정상 동작 확인
- [ ] 기존 web/telegram/prep 채널 영향 없음 확인

---

## 참조

- **통합 엔진**: `monkos_AI/portal/server.js` 라인 460~517 (`chatWithMonkos`)
- **채널 설정**: 라인 380~409 (`CHANNEL_CONFIG`)
- **촬영 코퍼스**: `monkos_AI/portal/seed_cs_prep.js` (5건 시드)
- **코칭 프롬프트 원본**: `functions/api/idphoto-coaching.js` (COACHING_INSTRUCTIONS + buildCoachingPrompt)
- **QC 프롬프트 원본**: `functions/api/qc.js`
- **포탈 배포 타겟**: `monkos-portal`, `us-central1`
