---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_PROFILES
---

# 지시서: 헤드샷 Studio 독립 — 포털 Vertex AI 직접 생성

## 배경
- 헤드샷이 포털 → Studio 프록시 구조로 동작 중. Studio는 R&D 워크벤치라 콜드 스타트(인스턴스 0) + 실험 중 다운 리스크
- 포털은 항시 인스턴스 가동 중이고, `@google/genai` + Vertex AI 클라이언트가 이미 존재 (`config.js:95`)
- 헤드샷은 Studio 프로필스에서 졸업한 프로덕션 상품 — Studio에 계속 의존하면 R&D에 걸리적거림
- 설계서: `DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md` 연관

## 작업 항목

### 1. 포털에 헤드샷 생성 모듈 신설

**새 파일**: `monkos_AI/portal/lib/headshot-generate.js`

Studio `server.js`에서 아래 요소를 이식:

#### 1-a. 상수 (Studio server.js에서 복사)
```javascript
import { ai, log } from './shared/config.js';

const PROFILE_MODEL_MAP = {
  'nano-banana-2':   'gemini-3.1-flash-image-preview',
  'nano-banana-pro': 'gemini-3-pro-image-preview',
};

const PURPOSE_ASPECT_MAP = {
  'linkedin_pro': '1:1',
  'corporate': '3:4',
  'creative': '3:4',
  'professional': '3:4',
  'dating': '3:4',
};
```

#### 1-b. IDENTITY_PRESERVATION_PROFILE 프롬프트 (Studio server.js:213~232 복사)

#### 1-c. buildHeadshotPrompt 함수
헤드샷은 referenceImages(마스터 레퍼런스) 기능을 안 쓴다. 포털의 헤드샷 프록시가 `customPrompt`만 전달하므로, 단순화:

```javascript
function buildHeadshotPrompt(customPrompt) {
  return `${IDENTITY_PRESERVATION_PROFILE}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${customPrompt || 'Generate a professional portrait photo.'}`;
}
```

#### 1-d. extractBase64 헬퍼 (Studio server.js:384~385 복사)

#### 1-e. 생성 함수
```javascript
export async function generateHeadshot({ image, purpose, model, customPrompt, userId }) {
  if (!image) throw new Error('이미지 필수');

  const base64Data = extractBase64(image);
  const byteLength = Math.ceil(base64Data.length * 3 / 4);
  log(`[Headshot] 입력: ${(byteLength/1024).toFixed(1)}KB, 모델: ${model || 'nano-banana-pro'}, 용도: ${purpose || 'linkedin_pro'}`);

  if (byteLength > 7 * 1024 * 1024) {
    throw new Error('이미지가 너무 큽니다 (7MB 이하)');
  }

  const instruction = buildHeadshotPrompt(customPrompt);
  const modelId = PROFILE_MODEL_MAP[model] || PROFILE_MODEL_MAP['nano-banana-pro'];
  const aspectRatio = PURPOSE_ASPECT_MAP[purpose] || '3:4';

  const contentParts = [
    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
    { text: 'Image 1: This is the subject person. Preserve their face and identity.' },
    { text: instruction },
  ];

  const response = await ai.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: contentParts }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imagePart?.inlineData) {
    const cand = response.candidates?.[0];
    const finishReason = cand?.finishReason || 'UNKNOWN';
    const blockReason = response.promptFeedback?.blockReason || null;
    const reason = blockReason || finishReason;
    if (blockReason || finishReason === 'IMAGE_SAFETY' || finishReason === 'SAFETY') {
      throw new Error(`안전 정책상 생성이 거부되었습니다 (사유: ${reason})`);
    }
    throw new Error(`이미지 생성 실패 (사유: ${reason})`);
  }

  return imagePart.inlineData.data;
}
```

### 2. 포털에 GCS 저장 함수 이식

**새 파일**: `monkos_AI/portal/lib/gcs-save.js`

Studio의 `gcs-save.js`에서 `saveImages` 함수를 복사. 포털의 `config.js`에 `CUSTOMER_GCS_BUCKET` 환경변수가 없으면 추가 (기본값 `monk-customer-photos`).

```javascript
import { Storage } from '@google-cloud/storage';

const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
const storage = new Storage();
const bucket = storage.bucket(CUSTOMER_GCS_BUCKET);

function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

export async function saveImages(service, userId, style, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const basePath = `${service}/${userId}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
  const meta = { userId, service, style, createdAt: new Date().toISOString() };

  await Promise.all([
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ]);

  return { originalPath, generatedPath };
}
```

**확인**: 포털의 `package.json`에 `@google-cloud/storage`가 있는지 확인. 없으면 추가.

### 3. portal/server.js — Studio 프록시 제거, 직접 생성으로 교체

**파일**: `monkos_AI/portal/server.js` (142~219행)

**변경 전** (Studio 프록시):
```javascript
const studioUrl = process.env.STUDIO_API_URL || 'https://monkos-studio-...';
const studioRes = await fetch(`${studioUrl}/api/profiles/generate`, { ... });
const studioData = await studioRes.json();
```

**변경 후** (직접 생성):
```javascript
import { generateHeadshot } from './lib/headshot-generate.js';
import { saveImages } from './lib/gcs-save.js';

// /api/headshot/generate 핸들러 내부:
const generatedBase64 = await generateHeadshot({
  image, purpose, model, customPrompt, userId,
});

// GCS 저장
try {
  await saveImages('headshot', userId, purpose || 'linkedin_pro', image, generatedBase64);
  log(`[Headshot] GCS 저장 완료: ${userId}`);
} catch (e) {
  log(`[Headshot] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
}

// 크레딧 환불 로직도 동일하게 유지 — 생성 실패 시 환불
```

**핵심 변경점**:
- `STUDIO_API_URL` 환경변수 + fetch 프록시 코드 제거
- `generateHeadshot()` 직접 호출
- `saveImages()` 직접 호출 (Studio에서 하던 것을 포털이 직접)
- 크레딧 차감/환불 로직은 기존 그대로 유지

### 4. 프롬프트 — 포털 server.js의 styleModifiers 활용

현재 포털 server.js (176~185행)에 `styleModifiers` 객체가 있고, `basePrompt + styleMod`로 `customPrompt`를 조합해서 Studio에 전달한다. 이 로직은 그대로 유지하고, 조합된 `customPrompt`를 `generateHeadshot()`에 넘기면 된다.

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- Studio 코드 수정 없음 — Studio의 `/api/profiles/generate`는 R&D용으로 유지
- `.env` / 시크릿 수정 금지 (헌법 4조 1항)

## 검증
- [ ] 헤드샷 생성 정상 (5개 스타일 중 최소 2개 테스트)
- [ ] GCS `headshot/{userId}/` 경로에 원본+생성 저장
- [ ] Studio 인스턴스가 0인 상태에서도 헤드샷 생성 정상 (Studio 미의존 확인)
- [ ] 크레딧 차감/환불 정상
- [ ] 생성 실패 시 에러 메시지 표시 + 크레딧 환불

## 대상 파일
1. `monkos_AI/portal/lib/headshot-generate.js` — **신규** (Vertex AI 직접 호출)
2. `monkos_AI/portal/lib/gcs-save.js` — **신규** (GCS 저장)
3. `monkos_AI/portal/server.js` — Studio 프록시 → 직접 생성 교체
