# Vertex AI 연동 가이드

**최초 작성**: 2026-01-08
**최종 업데이트**: 2026-02-08 (Gemini Live API, Imagen 3.0 반영)

---

## 현재 Vertex AI 사용 현황

| 서비스 | 모델 | 리전 | 인증 방식 | 용도 |
|--------|------|------|----------|------|
| Gemini Live API | `gemini-2.0-flash-live-preview-04-09` | us-central1 | Vertex AI ADC | 실시간 촬영 코칭 |
| Imagen 3.0 | `gemini-3-pro-image-preview` | - | Google AI Studio API Key | 증명사진 생성 |
| Gemini Flash | `gemini-2.0-flash` | - | Google AI Studio API Key | QC 검증 (원본 vs 생성물) |

---

## 1. Gemini Live API 연동 (핵심)

### 개요

실시간 양방향 스트리밍 API. 카메라 피드를 받아 AI가 즉시 코칭 응답을 생성.

### SDK

```bash
npm install @google/genai
```

### 연결 코드 (Node.js)

```javascript
const { GoogleGenAI, Modality } = require('@google/genai');

// Vertex AI ADC 인증
const ai = new GoogleGenAI({
    vertexai: true,
    project: 'monkos',  // GCP 프로젝트 ID
    location: 'us-central1'  // Live API는 us-central1만 지원
});

// Live 세션 연결 — callbacks 객체 필수
const session = await ai.live.connect({
    model: 'gemini-2.0-flash-live-preview-04-09',
    callbacks: {
        onopen: () => console.log('연결 성공'),
        onmessage: (msg) => { /* 응답 처리 */ },
        onerror: (err) => console.error(err),
        onclose: () => console.log('연결 종료')
    },
    config: {
        responseModalities: [Modality.TEXT],
        systemInstruction: { parts: [{ text: '당신은 증명사진 촬영 AI 코치입니다...' }] }
    }
});
```

### 핵심 주의사항

- **모델**: `gemini-2.0-flash-live-preview-04-09` (Vertex AI 유일 Live 모델)
- **리전**: `us-central1` (asia-northeast1 미지원)
- **callbacks 필수**: `connect()` 시 callbacks 안 주면 SDK 크래시
- **응답 트리거**: `session.sendClientContent({ turnComplete: true })` 필수
- **응답 버퍼링**: 토큰 단위 스트리밍 → turnComplete 시 플러시 필요
- **`sendRealtimeInput`**: 반환값 undefined (로깅 시 주의)

### 이미지 전송

```javascript
// JPEG 프레임을 base64로 전송
session.sendRealtimeInput({
    media: {
        mimeType: 'image/jpeg',
        data: base64Frame  // 768x768 리사이즈 권장
    }
});

// 5프레임마다 응답 요청
session.sendClientContent({ turnComplete: true });
```

---

## 2. Imagen 3.0 연동

### SDK

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview'
});
```

### 증명사진 생성

```javascript
const result = await model.generateContent({
    contents: [{
        role: 'user',
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Photo } },
            { text: '증명사진 규격으로 변환 (35x45mm, 흰색 배경, 정면)' }
        ]
    }],
    safetySettings: [
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' }
        // BLOCK_NONE 필수 (정체성 유지 핵심)
    ]
});
```

### API Key 위치

`apps/imagen3/backend/.env` → `GEMINI_API_KEY`

---

## 3. Gemini QC 연동 (원본 vs 생성물 비교)

```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const result = await model.generateContent({
    contents: [{
        role: 'user',
        parts: [
            { text: '원본 사진:' },
            { inlineData: { mimeType: 'image/jpeg', data: originalBase64 } },
            { text: '생성된 증명사진:' },
            { inlineData: { mimeType: 'image/jpeg', data: generatedBase64 } },
            { text: '유사도를 0~100%로 평가하고 JSON으로 반환' }
        ]
    }]
});
```

---

## 4. GCS 코퍼스 → Vertex AI RAG 연동

### Data Store 설정

| 항목 | 값 |
|------|-----|
| Data source type | Cloud Storage |
| Bucket URI | `gs://monk-project/corpus/*` |
| Data type | Unstructured documents |
| Document parsing | Layout Parser |
| Data Store name | `monk-corpus` |
| 자동 갱신 | Daily 02:00 KST |

### 일상 업데이트

```bash
# 로컬 코퍼스 → GCS 동기화
gsutil -m rsync -r docs/corpus/ gs://monk-project/corpus/
```

---

## 5. 인증 설정

### Vertex AI ADC (Gemini Live)

```bash
# 서비스 계정 키 또는 Application Default Credentials
gcloud auth application-default login
# 프로젝트: monkos
```

### Google AI Studio API Key (Imagen, QC)

```bash
# apps/imagen3/backend/.env
GEMINI_API_KEY=작가님_직접_입력
```

---

## 6. 비용 구조

| 항목 | 비용 | 비고 |
|------|------|------|
| Gemini Live API | 토큰 기반 | 프레임당 ~258 토큰 |
| Imagen 3.0 | 이미지당 과금 | Google AI Studio 무료 티어 활용 |
| GCS 스토리지 | ~$0.10/월 | 5GB 기준 |
| GCP 바우처 | $350K (3월 목표) | 인증 통과 시 |

---

*최초 작성: 2026-01-08*
*업데이트: 2026-02-08 — Gemini Live API, Imagen 3.0, QC 파이프라인 반영*
