# 지시서: idphoto-kr server.js Express 전환 + API 라우트 이식

```
[2026-02-21 19:10 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내2가 public/ 프론트 파일을 동시 작업 중
> - **네 수정 범위**: `monkos_AI/idphoto-kr/server.js`, `monkos_AI/idphoto-kr/package.json`

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | idphoto-kr 서버 Express 전환 + CF Functions API 이식 |
| **수정 파일** | `monkos_AI/idphoto-kr/server.js`, `monkos_AI/idphoto-kr/package.json` |
| **브랜치** | `develop` |
| **긴급도** | 높음 (이관 Phase 1 핵심) |
| **백업 태그** | `pre-migration-kr-20260221` (복원 가능) |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **헌법 제9조**: I2I 정체성 보존 90:10 원칙 (idgen 프롬프트 그대로 이식)
- **헌법 제10조**: 프록시 금지 — 크레딧은 Portal 직접 호출 유지
- **법률 제2장**: 코딩 규칙 준수

## ⚠️ 파일 충돌 방지

- `public/` 디렉토리 내 파일 수정/추가 금지 (막내2 담당)
- `MONK_kr/`, `functions/` 수정 금지

---

## 배경

monk.kr/ai_lab/photolab (CF Pages)을 monkos.ai/idphoto-kr (Cloud Run)으로 이관한다.
현재 server.js는 `http.createServer` + `ws` 직접 구현 (Express 없음).
CF Functions 핵심 3개(precheck/idgen/qc)의 로직을 Express 라우트로 이식한다.

---

## 현재 server.js 구조 (652줄)

| 줄 | 섹션 | 역할 |
|----|------|------|
| 1-11 | 헤더 | import, 상수 |
| 13-21 | import + 상수 | Node 내장, ws, GoogleGenAI |
| 23-26 | 환경변수 | PROJECT_ID, LOCATION, PORTAL_API_URL |
| 28-43 | log() | 구조화 로깅 |
| 45-60 | SDK 초기화 | ai(ADC), imagenAI(API Key) |
| 62-109 | 크레딧 API | useCredits, refundCredits, grantShareBonus |
| 111-141 | 코칭 프롬프트 | COACHING_INSTRUCTIONS (id_photo, resume) |
| 143-183 | Imagen 프롬프트 | IDENTITY_PRESERVATION, STYLE_PROMPTS |
| 185-210 | 의상 프롬프트 | getOutfitPrompt() |
| 212-265 | Gemini Live | connectGeminiLive() — WebSocket 코칭 |
| 267-303 | I2I 생성 | extractBase64(), generatePhoto() |
| 305-364 | 사전분석 | PRE_CHECK_INSTRUCTION, runPreCheck() |
| 366-394 | HTTP 유틸 | MIME_TYPES, parseBody(), jsonResponse() |
| 396-541 | HTTP 서버 | createServer — 라우트 분기, 정적 서빙 |
| 543-626 | WebSocket | WSS — 코칭 핸들링 |
| 628-651 | 서버 시작 | listen |

---

## 작업 내역

### TASK 1: Express + cors 의존성 추가

package.json에 추가:
```json
"express": "^4.21.0",
"cors": "^2.8.5"
```

기존 의존성 유지:
```json
"@google-cloud/firestore": "7.11.6",
"@google/genai": "1.41.0",
"ws": "8.19.0"
```

### TASK 2: server.js를 Express 기반으로 리팩토링

**유지할 것 (그대로 보존):**
- SDK 초기화 (ai, imagenAI) — 줄 45-60
- 크레딧 API 헬퍼 3개 — 줄 62-109
- 코칭 시스템 프롬프트 — 줄 111-141
- Gemini Live 세션 관리 (connectGeminiLive) — 줄 212-265
- WebSocket 핸들러 전체 — 줄 543-626
- log() 함수 — 줄 28-43

**변경할 것:**

#### 2-1. Express 앱 생성 (기존 createServer 교체)

```javascript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 보안 헤더 (기존 줄 398-400 유지)
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  next();
});

// 정적 파일 서빙
app.use(express.static(join(__dirname, 'public')));
```

#### 2-2. 기존 라우트를 Express 라우트로 전환

기존 HTTP 서버 본체(줄 396-541)의 라우트를 Express 라우트로 변환:

```javascript
// 헬스체크 (기존 줄 405-417)
app.get('/health', (req, res) => { ... });

// 서비스 정보 (기존 줄 420-428)
app.get('/api/info', (req, res) => { ... });

// 사전분석 (기존 줄 433-444)
app.post('/api/pre-check', async (req, res) => { ... });

// I2I 생성 (기존 줄 447-489)
app.post('/api/generate', async (req, res) => { ... });

// 크레딧 차감 (기존 줄 492-503)
app.post('/api/credit/use', async (req, res) => { ... });

// 공유 보너스 (기존 줄 506-517)
app.post('/api/credit/share-bonus', async (req, res) => { ... });
```

응답 패턴 변환:
- `jsonResponse(res, 200, data)` → `res.json(data)`
- `jsonResponse(res, 500, { error })` → `res.status(500).json({ error })`

#### 2-3. MPA 페이지 라우트 추가

```javascript
// MPA 페이지 서빙
app.get('/prep', (req, res) => res.sendFile(join(__dirname, 'public/prep.html')));
app.get('/camera', (req, res) => res.sendFile(join(__dirname, 'public/camera.html')));
app.get('/result', (req, res) => res.sendFile(join(__dirname, 'public/result.html')));
app.get('/thankyou', (req, res) => res.sendFile(join(__dirname, 'public/thankyou.html')));

// 랜딩 (기존)
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/landing.html')));

// /app (기존 SPA → 향후 삭제 대상, 호환 유지)
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
```

#### 2-4. WebSocket 서버를 Express HTTP 서버에 바인딩

```javascript
const httpServer = app.listen(PORT, () => { ... });
const wss = new WebSocketServer({ server: httpServer });
// ... 기존 WSS 핸들러 그대로 유지
```

### TASK 3: CF Functions 핵심 API 이식 — precheck

**원본**: `functions/api/precheck.js`

기존 server.js에 이미 `runPreCheck()` 함수(줄 305-364)가 있다.
하지만 CF Functions의 precheck.js와 프롬프트/응답 형식이 다를 수 있으므로 **CF 버전의 프롬프트를 정본으로** 사용한다.

새 라우트 추가:
```javascript
// photolab MPA용 precheck (CF Functions 정본 프롬프트)
app.post('/api/precheck', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: '이미지가 필요합니다' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    // CF precheck.js의 프롬프트 (7항목 체크)
    const PRECHECK_PROMPT = `Analyze this photo for ID/passport photo suitability.
Check: 1) Face detected 2) Front-facing 3) Even lighting 4) Sharp focus 5) Face size >20% of frame 6) Neutral/slight smile expression 7) Eyes open

Respond in JSON:
{
  "suitable": boolean,
  "score": 0-100,
  "face_detected": boolean,
  "issues": ["issue1", "issue2"],
  "suggestion": "한국어로 개선 제안"
}

Score 70+ = suitable. Be strict about front-facing and lighting.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/png', data: base64Data } },
        { text: PRECHECK_PROMPT },
      ]}],
      config: { responseMimeType: 'application/json', temperature: 0.2 },
    });

    const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    log(`precheck 오류: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});
```

**주의**: 기존 `/api/pre-check`(하이픈)과 새 `/api/precheck`(연결) 둘 다 유지. 기존 SPA는 하이픈, 새 MPA는 연결 사용.

### TASK 4: CF Functions 핵심 API 이식 — idgen

**원본**: `functions/api/idgen.js`

idgen.js의 9필드 동적 프롬프트 빌더(`buildPrompt`)와 상수 테이블 전체를 server.js로 이식한다.

이식할 코드 (idgen.js에서 복사):
- `IDENTITY_PRESERVATION` (줄 12-30) — 기존 server.js 줄 143에도 있지만 CF 버전이 더 상세. **CF 버전을 정본으로 교체**
- `BG_PROMPTS` (줄 33-40)
- `CLOTHING_PROMPTS` (줄 43-49)
- `CLOTHING_COLOR_PROMPTS` (줄 51-59)
- `TIE_PROMPTS` (줄 61-68)
- `EXPRESSION_PROMPTS` (줄 71-76)
- `HAIR_PROMPTS` (줄 79-84)
- `PURPOSE_PROMPTS` (줄 87-93)
- `buildPrompt(body)` (줄 96-154) — 순수 함수, 그대로 이식

새 라우트:
```javascript
app.post('/api/idgen', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API 키 미설정' });

    const body = req.body;
    const { image, userId } = body;
    if (!image) return res.status(400).json({ error: '이미지가 필요합니다' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    if (byteLength > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '이미지가 너무 큽니다 (2MB 이하)' });
    }

    // 크레딧 차감 (userId 있을 때만)
    if (userId) {
      const creditResult = await useCredits(userId, 'generate');
      if (!creditResult.ok) return res.status(402).json({ error: '크레딧 부족' });
    }

    const instruction = buildPrompt(body);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '', 'X-Real-IP': '' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: instruction },
          ]}],
          generationConfig: { imageConfig: { aspectRatio: '3:4' } },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let detail = '';
      try { detail = JSON.parse(errorText)?.error?.message || errorText.substring(0, 200); } catch { detail = errorText.substring(0, 200); }

      // 생성 실패 시 크레딧 환불
      if (userId) await refundCredits(userId, 'generate');
      throw new Error(`API ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) {
      if (userId) await refundCredits(userId, 'generate');
      throw new Error('이미지 생성 실패: 응답에 이미지가 없습니다');
    }

    res.json({ image: `data:image/png;base64,${imagePart.inlineData.data}` });
  } catch (err) {
    log(`idgen 오류: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});
```

**핵심 차이 vs 기존 /api/generate:**
- 기존: 2필드 (style, gender) + `STYLE_PROMPTS` 단순 프롬프트
- 새 idgen: **9필드** (purpose, gender, age, clothing, clothingColor, tie, hair, background, expression) + `buildPrompt()` 정밀 프롬프트
- 기존 `/api/generate`는 호환 유지하되, 새 `/api/idgen`이 정본

### TASK 5: CF Functions 핵심 API 이식 — qc

**원본**: `functions/api/qc.js`

새 라우트:
```javascript
app.post('/api/qc', async (req, res) => {
  try {
    const { original, generated, gender, age } = req.body;
    if (!original || !generated) {
      return res.status(400).json({ error: '원본과 생성 이미지 모두 필요합니다' });
    }

    const origBase64 = original.includes(',') ? original.split(',')[1] : original;
    const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;

    const instruction = buildQCInstruction(gender, age);

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [
        { inlineData: { mimeType: 'image/png', data: origBase64 } },
        { inlineData: { mimeType: 'image/png', data: genBase64 } },
        { text: instruction },
      ]}],
      config: { responseMimeType: 'application/json', temperature: 0.3 },
    });

    const text = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    log(`qc 오류: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});
```

`buildQCInstruction(gender, age)` 함수도 qc.js 줄 12-58에서 그대로 이식.

### TASK 6: 기존 `http.createServer` 블록 제거

줄 396-541의 `createServer` 블록을 Express 앱으로 완전 교체.
줄 366-394의 `MIME_TYPES`, `parseBody()`, `jsonResponse()` 유틸도 제거 (Express가 대체).

### TASK 7: 서버 시작 코드 변경

```javascript
// 기존 (줄 628-651)
httpServer.listen(PORT, ...);

// 변경
const httpServer = app.listen(PORT, () => {
  log(`idphoto-kr 서버 시작 — Express + WebSocket`);
  log(`포트: ${PORT}, ADC: ${PROJECT_ID}/${LOCATION}`);
  log(`MPA 라우트: /, /prep, /camera, /result, /thankyou`);
});

const wss = new WebSocketServer({ server: httpServer });
// ... 기존 WSS 핸들러 그대로 연결
```

---

## 금지 사항

- `public/` 내 파일 추가/수정/삭제 금지 (막내2 담당)
- `MONK_kr/`, `functions/` 수정 금지
- API 키, 시크릿 하드코딩 금지
- 기존 WebSocket 코칭 로직 변경 금지 (그대로 유지)
- `responseModalities` 사용 금지 (MEMORY.md 교훈)

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | `develop` 브랜치에 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | `main` 머지 + 배포 | **금지** — 작가님 별도 지시 시에만 |

### 커밋 메시지 형식

```
[migration] idphoto-kr server.js Express 전환 + CF API 이식 (precheck/idgen/qc)

지시서: TASK_20260221_막내1_server_migration.md
```

---

## 완료 조건

1. server.js가 Express 기반으로 동작
2. 기존 라우트 전부 유지 (/health, /api/info, /api/pre-check, /api/generate, /api/credit/*)
3. 새 라우트 추가 (/api/precheck, /api/idgen, /api/qc)
4. MPA 라우트 추가 (/prep, /camera, /result, /thankyou)
5. `express.static`으로 public/ 정적 서빙
6. WebSocket 코칭 핸들러 정상 유지
7. package.json에 express, cors 추가
8. develop 커밋 + push 완료
9. 완료 보고 발신
