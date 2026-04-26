---
type: order
date: 2026-04-11
from: iMac/민아
to: 막내
subject: IMAGE PRO /api/upload 404 긴급 수정 — backend 라우트 이식
priority: P0
pf: PF_PHOTOPRO
---

# IMAGE PRO /api/upload 404 긴급 수정 지시서

> **[2026-04-11 14:42 KST] iMac/민아 → 막내**
> 현장 보고: 꾸 (몽크사진관 M2) — "이미지 생성 에러가 계속 뜬다"
> 실제 원인: 생성(`/generate`)은 정상. **저장(`/api/upload`) 엔드포인트 404**.

---

## 1. 증상

- `image.monkos.ai` 에서 Imagen4 Generator로 이미지 생성 후 "Deploy" 단계에서 실패
- 사용자 시각: "이미지 생성이 안 된다"
- 실제: 생성은 성공. **생성된 이미지를 GCS에 업로드하는 단계에서 404**

## 2. 민아 직접 진단 (CDP + gcloud logging)

### 2-1. 도메인 매핑 확인

```
image.monkos.ai → monk-image-engine (us-central1)
```

### 2-2. Cloud Run 로그 (최근 2시간)

`/generate` 호출은 정상 완료:
```
2026-04-11T05:40:53Z  [Generate] Completed in 10685ms
2026-04-11T05:40:47Z  [Generate] Completed in 12949ms
```

`/api/upload` 호출은 전부 **404**:
```
2026-04-11T05:38:33Z  WARNING 404 POST https://image.monkos.ai/api/upload
2026-04-11T05:38:14Z  WARNING 404 POST https://image.monkos.ai/api/upload
2026-04-11T05:37:43Z  WARNING 404 POST https://image.monkos.ai/api/upload
(최근 2시간 12건+ 동일 에러, 꾸 재시도 양상)
```

### 2-3. 백엔드 라우트 확인

`apps/monk_imagen4/backend/server.js` 등록 라우트:
- `GET /health`
- `POST /generate`
- `POST /batch-generate`
- `POST /refine`
- `POST /analyze`
- `POST /translate`
- `GET *` (정적 파일 catch-all)

→ **`POST /api/upload` 라우트가 존재하지 않음**. 프론트 `Imagen4UI.tsx` L116에서 호출하는 엔드포인트가 백엔드에 이식되지 않았음.

### 2-4. 원본 코드 존재 확인

`apps/monk_imagen4/functions/api/upload.ts` — **Cloudflare Pages Functions 원본** 존재. R2 + D1 기반이므로 그대로 못 쓰고, GCS로 포팅 필요.

### 2-5. 기존 GCS 인프라 확인

`backend/server.js`에 이미:
- `const { Storage } = require('@google-cloud/storage');`
- `const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';`
- `const bucket = storage.bucket(GCS_BUCKET);`
- `/generate` 내부에서 이미 GCS 저장 로직 사용 중 (L148~170)

→ **업로드 라우트만 신규 추가하면 됨**. 새 인프라 불필요.

---

## 3. 수정 작업

### 3-1. 대상 파일

`apps/monk_imagen4/backend/server.js`

### 3-2. 신규 라우트 구현

L473 `app.get('*', ...)` **앞에** `/api/upload` 라우트 삽입.

```js
// POST /api/upload — Imagen4 Generator의 Deploy 기능용
// 프론트에서 생성된 이미지를 FormData로 받아 GCS에 저장 + 메타데이터 응답
app.post('/api/upload', async (req, res) => {
  try {
    // multipart/form-data 파싱 — multer 미들웨어 사용
    // 이미 server.js에 multer가 설정되어 있으면 그대로 사용, 없으면 추가 필요
    // 파싱 후: req.file (이미지), req.body.metadata (JSON 문자열)

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    let metadata = {};
    try {
      metadata = JSON.parse(req.body.metadata || '{}');
    } catch (e) {
      return res.status(400).json({ error: 'Invalid metadata JSON' });
    }

    // 파일명 생성 (원본 Cloudflare 로직과 동일 규칙)
    const timestamp = Date.now();
    const imageId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const moduleFolder = metadata.projectId || 'default';
    const filename = `${moduleFolder}/${imageId}.png`;

    // GCS 업로드
    const file = bucket.file(filename);
    await file.save(req.file.buffer, {
      contentType: 'image/png',
      metadata: {
        metadata: {
          prompt: metadata.prompt || '',
          model: metadata.model || '',
          mode: metadata.mode || '',
          aspectRatio: metadata.aspectRatio || '',
          imageSize: metadata.imageSize || '',
          safetyLevel: metadata.safetyLevel || '',
          comment: metadata.comment || '',
          tags: metadata.tags ? JSON.stringify(metadata.tags) : '',
        }
      }
    });

    const imageUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${filename}`;
    console.log(`[Upload] Saved to GCS: ${imageUrl}`);

    res.json({
      success: true,
      imageId,
      imageUrl,
      metadata: {
        timestamp,
        projectId: metadata.projectId || 'IMAGEN4',
      }
    });
  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});
```

### 3-3. multer 미들웨어 확인

- `server.js` 상단에 `const multer = require('multer');` 및 `const upload = multer({ storage: multer.memoryStorage() });`가 이미 있는지 확인
- 없으면 `package.json`에 `multer` 의존성 확인 후 추가
- 라우트 핸들러에 `upload.single('image')` 미들웨어 연결:
  ```js
  app.post('/api/upload', upload.single('image'), async (req, res) => { ... });
  ```

### 3-4. 메타데이터 저장 전략 (D1 대체)

**원본 Cloudflare Pages 코드**는 D1에 메타데이터 INSERT했으나, 현재 Cloud Run에는 D1 없음. 3가지 옵션:

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **A (권장)** | GCS customMetadata로만 저장 | 구현 최소, 즉시 해결 | 쿼리 불가, 단순 조회만 |
| B | Firestore 컬렉션 신설 (`imagen4_images`) | 쿼리/필터 가능 | 스키마 설계 필요, 구현 시간 증가 |
| C | 메타데이터 `.json` 파일을 GCS에 나란히 저장 | 쿼리 가능 (gsutil ls) | 파일 수 2배 |

**긴급 복구는 옵션 A**로 진행. 꾸의 작업 복구가 최우선.

### 3-5. 테스트

1. 로컬 테스트 (옵션, 생략 가능)
2. deploy.sh 경유 prod 배포: `apps/monk_imagen4/backend/deploy.sh`
3. 배포 후 CDP 또는 직접 curl로 `/api/upload` 엔드포인트 응답 확인
4. image.monkos.ai 관리자 로그인 → Imagen4 Generator → 이미지 생성 + Deploy 클릭 → 성공 여부 확인
5. Cloud Run 로그에 `[Upload] Saved to GCS: ...` 출력 확인

---

## 4. 작업 순서

1. server.js에 라우트 추가
2. multer 의존성 확인 + 필요 시 package.json 업데이트
3. `apps/monk_imagen4/backend/deploy.sh prod` 경유 배포
4. 실서비스 테스트 (꾸에게 "다시 시도해보세요" 전달)
5. 로그 확인

## 5. 준수 조항

⚠️ 법률 5장 2조 — 배포는 **반드시 `./deploy.sh prod` 경유**. `gcloud run deploy` 직접 호출 금지.
⚠️ 헌법 4조 1항 — `.env`, `secrets/`, `deploy.sh` 수정 전 작가님 승인 필수. 본 작업은 **server.js만** 수정하면 되므로 승인 불필요하나, deploy.sh 수정이 필요하게 되면 중단하고 보고.
⚠️ **쌍아가 v2 경유로 전수 스캔 필수화**한 원칙 준수: 본 작업 중에도 유사 누락 엔드포인트 없는지 확인 (`/api/*` 패턴 전수).

## 6. 참고 파일

- `apps/monk_imagen4/backend/server.js` — 수정 대상
- `apps/monk_imagen4/backend/deploy.sh` — 배포 스크립트
- `apps/monk_imagen4/functions/api/upload.ts` — 원본 Cloudflare Pages 코드 (참조)
- `apps/monk_imagen4/modules/imagen4-generator/Imagen4UI.tsx` L116 — 프론트 호출부
- `apps/monk_imagen4/services/storageService.ts` L11 — `apiEndpoint = '/api/upload'`

---

**⏳ 상태: 막내 즉시 투입 대기**
**연락**: 꾸에게 "잠시 후 다시 시도하도록" 안내 (작업 완료 시점 공유)
