---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내2
status: 긴급
portfolio: PF_PROFILES
---

# 긴급 지시서: 헤드샷 Vertex AI 리전 핫픽스

## 장애 현황
- 포털 00320 배포 후 헤드샷 생성 실패 (500)
- 원인: `headshot-generate.js`가 포털 공용 `ai` 클라이언트(location: `us-central1`) 사용 → `gemini-3-pro-image-preview` 모델이 `us-central1`에 없음
- Studio는 `location: 'global'`로 정상 동작하고 있었음
- 크레딧 환불은 정상 작동 중 (유저 피해 없음)

## 수정

**파일**: `monkos_AI/portal/lib/headshot-generate.js`

포털 공용 `ai`를 import하지 말고, `location: 'global'`로 이미지 생성 전용 클라이언트를 별도 생성:

```javascript
// 변경 전
import { ai, log } from './shared/config.js';

// 변경 후
import { GoogleGenAI } from '@google/genai';
import { log } from './shared/config.js';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';

const imageAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: 'global',
});
```

그리고 `generateHeadshot` 함수 내부의 `ai.models.generateContent` → `imageAI.models.generateContent`로 변경.

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)

## 검증
- [ ] 헤드샷 생성 정상 (최소 1개 스타일)
- [ ] GCS `headshot/{userId}/` 저장 확인

## 대상 파일
1. `monkos_AI/portal/lib/headshot-generate.js` — ai → imageAI(global) 교체
