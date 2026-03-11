---
type: ORDER
date: 2026-03-10
from: iMac/쌍아
to: 막내 (배정 대기)
priority: P1
scope: monkos_AI/idphoto-jp
related:
  - "어젠다 #18 이미지 보관 P1"
  - "ORDER_20260309 idphoto-kr GCS+크롭+워터마크"
---

# 지시서: idphoto-jp GCS 저장 + 서버 크롭 + 워터마크 + 귀 노출 규정 적용

## 배경

idphoto-kr에 적용 완료된 어젠다 #18(GCS 이미지 보관, 서버단 정밀 크롭, 워터마크, Signed URL, 풀샷 무료화)을 idphoto-jp에 클론한다.

**한일 규격 차이점**: 한국은 귀 노출 규정이 삭제되었으나, 일본은 여전히 귀 노출(耳が見える)이 권장/필수. 이 차이를 QC + 코칭에 반영해야 한다.

## 참조 정본 (KR 완성본)

- `monkos_AI/idphoto-kr/server.js` — detectFace, /api/download, QC 2.0-flash 통일
- `monkos_AI/idphoto-kr/gcs-save.js` — saveImages, addWatermark, cropToSpec(headTop), getSignedUrl
- `monkos_AI/idphoto-kr/Dockerfile` — fontconfig 설치, gcs-save.js COPY
- `monkos_AI/idphoto-kr/public/result.js` — _gcsPath 패턴, doDownload → /api/download
- `monkos_AI/idphoto-kr/public/thankyou.js` — v6 setupOriginalDownload (무료 원본)
- `monkos_AI/idphoto-kr/public/config.js` — fullOriginal 제거

---

## 파트 1: gcs-save.js 신규 생성

### 작업
KR의 `gcs-save.js`를 JP에 복사 후 경로만 변경.

### 변경점
| 항목 | KR | JP |
|------|----|----|
| GCS 경로 | `service/idphoto/kr/{userId}/` | `service/idphoto/jp/{userId}/` |
| SPECS | 동일 (passport: faceRatio 0.75, topMargin 0.12) | 동일 |

### 충돌 체크
- JP에 gcs-save.js 없음 → 신규 파일, 충돌 없음
- `@google-cloud/storage`, `sharp` 의존성 → **package.json에 추가 필수**
- JP package.json에 `@google-cloud/firestore`가 있으나 미사용 — 건드리지 말 것

---

## 파트 2: server.js 수정

### 2-1. import 추가

```javascript
// 기존 import 아래에 추가
import { saveImages, addWatermark, cropToSpec, downloadFromGCS, getSignedUrl } from './gcs-save.js';
```

**충돌 체크**: 기존 import 6줄(express, cors, ws, path, url, GoogleGenAI) 뒤에 추가. 충돌 없음.

### 2-2. GCS_BUCKET 환경변수

```javascript
const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
```

현재 JP server.js에 GCS 관련 없음 → 충돌 없음.

### 2-3. QC 모델 통일

```javascript
// 변경 전 (JP server.js:383)
const PRECHECK_MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];

// 변경 후
const PRECHECK_MODELS = ['gemini-2.0-flash'];
```

### 2-4. 사전분석 프롬프트 — 귀 노출 항목 추가

```javascript
// JP server.js:386-409 PRE_CHECK_INSTRUCTION에 항목 추가
// 기존 7개 체크항목 + 1개 추가:
8. 耳：両耳が見えているか？（髪で完全に隠れていないか）
```

**논리 체크**: 일본 여권 규격에서 귀 가림은 NG 사유. 한국에는 없는 규정이므로 KR에는 미반영.

### 2-5. 코칭 프롬프트 — 귀 노출 안내 추가

```javascript
// JP server.js:113-138 COACHING_INSTRUCTIONS.passport
// 기존 [チェック順序] 항목 5개 → 6개로:
// 기존:
// 4. 眉毛が見える（前髪で隠さない）
// 5. フェイスラインが見える（髪で覆わない）
// 추가:
6. 耳が見える（髪で両耳が隠れないように）
```

### 2-6. detectFace 함수 추가

KR server.js의 `FACE_DETECT_PROMPT` + `detectFace()` 그대로 이식.
- 프롬프트 언어는 **한국어 유지** (Gemini 내부 처리용, 사용자 노출 아님)
- `headTop` 필드명, `Number()` 강제 변환 포함

**배치 위치**: `runPreCheck()` 함수 뒤 (약 line 447 이후)

### 2-7. /api/idgen 수정 — GCS 저장 + 워터마크 반환

현재 JP `/api/idgen`(line 515-595)은 생성 이미지를 base64로 직접 반환.

변경:
1. 생성 성공 후 → `saveImages(userId, originalImage, generatedImage)` 호출
2. 생성 이미지에 `addWatermark()` 적용
3. 응답에 `gcsPath` 추가, `image`는 워터마크본으로 교체

```javascript
// 현재 (line 590)
res.json({ success: true, image: `data:image/png;base64,${imageData}` });

// 변경 후
const genBuffer = Buffer.from(imageData, 'base64');
const watermarked = await addWatermark(genBuffer);
const { generatedPath } = await saveImages(userId || 'anonymous', base64Input, imageData);
res.json({
  success: true,
  image: `data:image/png;base64,${watermarked.toString('base64')}`,
  gcsPath: generatedPath,
});
```

**충돌 체크**:
- `saveImages`는 fire-and-forget이 아닌 await — 생성 응답 시간 +1~2초
- KR에서는 비동기(`Promise.all`)로 GCS 저장과 응답을 분리했으나, JP도 동일 패턴 적용 권장
- `base64Input`은 line 526의 `data` 변수 → 변수명 확인 필수

### 2-8. /api/download 엔드포인트 신규 추가

KR server.js의 `/api/download` 핸들러 이식:
- GCS에서 다운로드 → detectFace → cropToSpec → Signed URL
- 크레딧 70c 차감 (기존 `/api/credit/use` 호출)
- 응답: `{ success, cropped, originalUrl, credits }`

**배치 위치**: `/api/credit/share-bonus` (line 622-631) 뒤

**충돌 체크**:
- JP는 크레딧 차감을 Portal API(`useCredits`)로 위임 → KR 패턴과 동일하게 Portal API 호출
- JP의 `useCredits(userId, 'download')` 함수가 이미 존재 (line 62-84)
- 리펀드: `refundCredits(userId, 'download')` 도 존재 (line 86-97)

### 2-9. health 엔드포인트 로그 수정

```javascript
// line 476
preCheck: 'active (gemini-2.0-flash)',
```

기동 로그도 동일 수정.

---

## 파트 3: Dockerfile 수정

### 변경점

```dockerfile
# 1. fontconfig 설치 추가 (워터마크 SVG 텍스트 렌더링용)
RUN apt-get update && \
    apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

# 2. gcs-save.js COPY 추가
COPY server.js gcs-save.js ./
```

**충돌 체크**: 현재 JP Dockerfile은 `COPY server.js ./`만 있음. `gcs-save.js` 추가.

---

## 파트 4: package.json 의존성 추가

```json
{
  "@google-cloud/storage": "^7.15.0",
  "sharp": "^0.33.0"
}
```

**충돌 체크**:
- `sharp`는 native 바이너리 → node:20-slim에서 빌드 가능 (KR에서 검증 완료)
- `@google-cloud/storage`는 `@google-cloud/firestore`와 공존 가능 (같은 인증 체계)

---

## 파트 5: 클라이언트 — result.js

### 변경 요약
JP의 result.js를 KR 패턴으로 전환:

| 항목 | 현재 (JP) | 변경 후 |
|------|-----------|---------|
| 이미지 저장 | `_fullOriginal` (sessionStorage `_mo_p`) | `_gcsPath` (sessionStorage `monkos_gcsPath`) |
| 다운로드 | 클라이언트 crop → creditUse | POST `/api/download` (서버 crop) |
| 크롭 | `media.crop()` (클라이언트) | 서버 cropToSpec (응답으로 수신) |
| 원본 접근 | `_mo_p` base64 전체 저장 | `monkos_originalUrl` Signed URL |

### 핵심 변경 (line 참조)

1. **line 16**: `let _fullOriginal = null;` → `let _gcsPath = null;`
2. **line 253**: `_fullOriginal = genResult.image;` → `_gcsPath = genResult.gcsPath || null;`
3. **line 367**: `_mo_p` sessionStorage 저장 → `monkos_gcsPath` 저장
4. **line 453-503**: `doDownload()` 전체 재작성 — KR 패턴 (`/api/download` POST)
5. **line 533**: 토스 리다이렉트 복원 → Lemon Squeezy 리다이렉트 복원 (gcsPath 기준)

### 충돌 체크
- JP는 Lemon Squeezy 결제 → 리다이렉트 후 result.html 복귀 로직이 Toss와 다름
- `sessionStorage.getItem('monkos_pending_action')` 패턴은 동일
- `_mo_p` 키 제거 시 thankyou.js와 동기화 필수

---

## 파트 6: 클라이언트 — thankyou.js

### 변경 요약
JP thankyou.js의 fullshot 10c 과금 제거 → KR v6 패턴 적용.

| 항목 | 현재 (JP) | 변경 후 |
|------|-----------|---------|
| 풀샷 | `setupFullshot()` — 10c 과금 + `_mo_p` | `setupOriginalDownload()` — 무료 + Signed URL |
| import | CREDIT_COST, showChargeModal, fetchLatestCredits | 제거 |

### 핵심 변경
1. `setupFullshot()`, `downloadFullOriginal()`, `triggerDownload()` 삭제
2. `setupOriginalDownload()` 신규 (KR thankyou.js:109-129 참조)
3. `downloadOriginal()` 신규 (KR thankyou.js:92-106 참조)
4. import에서 `CREDIT_COST`, `showChargeModal`, `fetchLatestCredits` 제거
5. `monkos_fullshot_purchased` sessionStorage 키 사용 제거

### 충돌 체크
- `setupSnsEvent()`는 양쪽 동일 패턴 → 건드리지 말 것
- `setupCompare()`도 동일 → 건드리지 말 것
- 일본어 UI 텍스트 유지: `showToast('オリジナルダウンロード完了')` 등

---

## 파트 7: 클라이언트 — config.js

```javascript
// 변경 전
export const CREDIT_COST = {
  generate: 10,
  download: 70,
  extraCrop: 10,
  fullOriginal: 10,
};

// 변경 후
export const CREDIT_COST = {
  generate: 10,
  download: 70,
  extraCrop: 10,
};
```

---

## ⚠️ 준수 조항

- **헌법 6조 (인프라 보호)**: `.env`, API Key, GCS 버킷명 하드코딩 금지. 환경변수 사용.
- **헌법 9조 (I2I 정체성 보존)**: cropToSpec은 이미지 변환이 아닌 프레이밍만 수행. 정체성 영향 없음.
- **헌법 10조 (프록시 금지)**: KR 서비스를 JP 프록시로 사용하지 않음. 각각 독립 gcs-save.js.
- **법률 2장 (코딩 규칙)**: KR 코드 복사 시 일본어 UI/로그 텍스트 유지. 한국어 혼입 금지.

---

## 검증 체크리스트

- [ ] `npm install` 성공 (sharp native 빌드)
- [ ] 로컬 `node server.js` 기동 성공
- [ ] `/health` 엔드포인트 — `preCheck: 'active (gemini-2.0-flash)'` 확인
- [ ] 생성 → 워터마크 표시 확인
- [ ] 다운로드 → thankyou 전환 정상
- [ ] 크롭 결과 — 여권 규격 (머리 71~80%) 확인
- [ ] 원본 다운로드 — Signed URL 정상
- [ ] 코칭 중 귀 가림 시 경고 출력 확인
- [ ] 사전분석 — 귀 가림 감지 확인
- [ ] Lemon Squeezy 결제 → 복귀 → 자동 다운로드 흐름 정상

---

## 배포

main 머지 후 `deploy.sh prod` — 배포 전 작가님 승인 필수.
