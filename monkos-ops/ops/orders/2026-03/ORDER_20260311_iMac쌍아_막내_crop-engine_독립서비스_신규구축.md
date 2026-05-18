---
type: ORDER
date: 2026-03-11
from: iMac/쌍아
to: 막내(any)
priority: P0
status: 대기
---

# 지시서: crop-engine 독립 마이크로서비스 신규 구축

## 목적

증명사진 크롭 엔진을 idphoto-kr/jp에서 분리하여 **독립 Cloud Run 서비스**로 구축한다.
현재 Gemini Flash + 좌표 역산 방식을 **tfjs-node FaceMesh(478 랜드마크) + 가이드 프레임 방식**으로 교체한다.

향후 별도 크롭 앱(`crop.monkos.ai`)으로 독립 서비스 배포 가능한 구조로 설계한다.

## 배경: 현재 구조의 문제

현재 `gcs-save.js`의 `cropToSpec`:
- Gemini Flash(LLM)에 좌표 4개를 물어봄 → 픽셀 정밀도 부족
- 좌표에서 크롭 영역을 역산 → cropH > srcH이면 턱 잘림, 비율 왜곡
- 사진관 워크플로우와 정반대 구조 (사진에서 프레임을 만들어내는 방식)

올바른 구조:
- 고정 규격 프레임(3.5×4.5 등) + 가이드선(정수리/턱 허용범위)이 먼저
- 얼굴 감지 → 사진을 **스케일+위치 조정**하여 프레임에 맞춤
- sharp 순서: resize(스케일 결정) → extract(고정 프레임)

## 파트 1: 프로젝트 세팅

### 1-1. 디렉토리 생성

```
monkos_AI/crop-engine/
├── server.js
├── lib/
│   ├── face-detect.js      ← tfjs-node FaceMesh 모듈
│   └── crop.js             ← 가이드 프레임 기반 크롭 로직
├── specs/
│   └── formats.js          ← 국가별 규격 정의
├── package.json
├── Dockerfile
└── deploy.sh
```

### 1-2. package.json

```json
{
  "name": "@monkos/crop-engine",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "description": "MONKOS 증명사진 크롭 엔진 — 가이드 프레임 기반 정밀 크롭",
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.22.0",
    "@tensorflow-models/face-landmarks-detection": "^1.0.0",
    "sharp": "^0.33.0",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

> ⚠️ `@tensorflow/tfjs-node`은 네이티브 바인딩이므로 Dockerfile에서 빌드 도구 필요.

### 1-3. Dockerfile

```dockerfile
FROM node:20-slim

LABEL maintainer="MONK.KR"
LABEL description="MONKOS Crop Engine — AI 증명사진 정밀 크롭 서비스"

WORKDIR /app

# tfjs-node 네이티브 빌드 + sharp 의존성
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential python3 fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install --omit=dev && \
    npm cache clean --force

COPY server.js ./
COPY lib/ ./lib/
COPY specs/ ./specs/

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

> ⚠️ start-period=60s — tfjs 모델 초기 로딩에 시간 필요

## 파트 2: 얼굴 감지 모듈 (`lib/face-detect.js`)

### 요구사항

1. `@tensorflow-models/face-landmarks-detection`의 MediaPipe FaceMesh 모델 사용
2. runtime은 `'tfjs'` (tfjs-node 백엔드에서 CPU 실행)
3. 서버 기동 시 모델 1회 로드 → 이후 재사용 (웜업)
4. 입력: 이미지 Buffer
5. 출력: 478개 랜드마크 중 필요한 것만 추출

### 핵심 랜드마크

| 용도 | 랜드마크 인덱스 | 설명 |
|------|---------------|------|
| 정수리 추정 | #10 (이마 상단) | + 보정 계수로 정수리 추산 |
| 턱 | #152 | 턱 최하단 |
| 왼쪽 눈 중심 | #159 | 좌눈 |
| 오른쪽 눈 중심 | #386 | 우눈 |
| 코끝 | #1 | 얼굴 중심 참조 |
| 좌측 윤곽 | #234 | 좌우 폭 |
| 우측 윤곽 | #454 | 좌우 폭 |

### API

```javascript
// 서버 기동 시
await initFaceDetector();

// 요청 시
const landmarks = await detectFace(imageBuffer);
// → { crown: {x,y}, chin: {x,y}, leftEye: {x,y}, rightEye: {x,y}, ... }
// 또는 null (감지 실패)
```

> ⚠️ tfjs-node에서 이미지를 텐서로 변환하는 과정 확인 필요. sharp로 raw pixel 추출 → tf.tensor3d()로 변환하는 패턴.

## 파트 3: 가이드 프레임 기반 크롭 (`lib/crop.js`)

### 핵심 로직 — 사진관 방식

```
고정 프레임 (3.5 × 4.5 비율)
┌──────────────────┐
│    상단 여백       │ ← 정수리 가이드 상한선
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ ← 정수리 가이드 하한선
│                    │
│    [  얼 굴  ]     │ ← 얼굴 높이 = 프레임의 70~80%
│                    │
│  ┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ ← 턱 가이드 상한선
│    하단 여백       │ ← 턱 가이드 하한선
└──────────────────┘
```

### 계산 순서 (현재와 정반대)

1. **프레임 크기 고정**: 출력 픽셀 크기 (예: 413×531)
2. **얼굴 높이 측정**: crown.y ~ chin.y (픽셀)
3. **스케일 결정**: `scale = (frameH × faceRatio) / faceHeight`
   - 이 스케일로 원본을 확대/축소하면 얼굴이 프레임의 faceRatio%를 차지
4. **위치 결정**:
   - 상하: 정수리가 프레임 상단에서 topMargin 위치에 오도록
   - 좌우: 눈 중심이 프레임 수평 중앙에 오도록
5. **sharp 실행**: `resize(스케일 적용) → extract(프레임 크기)`

### API

```javascript
const croppedBuffer = await cropToFrame(imageBuffer, landmarks, {
  format: 'passport',
  country: 'KR'
});
```

## 파트 4: 규격 정의 (`specs/formats.js`)

```javascript
export const SPECS = {
  passport_kr: {
    name: '한국 여권',
    width: 413,        // px (35mm @ 300dpi)
    height: 531,       // px (45mm @ 300dpi)
    faceRatio: 0.75,   // 얼굴이 프레임의 75% (외교부: 71~80%)
    topMargin: 0.10,   // 정수리 위 여백 10%
    bottomMargin: 0.15,// 턱 아래 여백 15%
  },
  passport_jp: {
    name: '日本旅券',
    width: 413,
    height: 531,
    faceRatio: 0.75,
    topMargin: 0.10,
    bottomMargin: 0.15,
  },
  id_kr: {
    name: '한국 반명함',
    width: 354,        // 30mm
    height: 472,       // 40mm
    faceRatio: 0.65,
    topMargin: 0.10,
    bottomMargin: 0.20,
  },
  // 향후 확장: visa_us, visa_cn, passport_us 등
};
```

## 파트 5: 서버 (`server.js`)

### 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/crop` | 이미지 크롭 (핵심 API) |
| GET | `/api/specs` | 지원 규격 목록 |
| GET | `/health` | 헬스체크 |

### POST /api/crop

- **입력**: `{ image: "base64...", format: "passport", country: "KR" }`
- **출력**: `{ success: true, cropped: "base64...", meta: { faceRatio, scale, landmarks } }`
- **에러**: `{ success: false, error: "메시지", fallback: "base64..." }`
  - 얼굴 감지 실패 시 fallback으로 중앙 상단 크롭 제공

### 서버 기동 시

```javascript
// 모델 프리로드 (콜드스타트 최소화)
await initFaceDetector();
console.log('[CropEngine] FaceMesh 모델 로드 완료');
```

## 파트 6: deploy.sh

```bash
#!/bin/bash
SERVICE_NAME="monkos-crop-engine"
REGION="asia-northeast3"
PROJECT_ID="monkos"

gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --timeout 60 \
  --allow-unauthenticated
```

> ⚠️ 메모리 1Gi — tfjs-node 모델 로딩에 필요. 부족하면 2Gi로 상향.
> ⚠️ `--allow-unauthenticated` — 초기 테스트용. 프로덕션 시 IAM 인증 전환 검토.

## 검증 계획

1. 로컬에서 `npm install` → tfjs-node 빌드 성공 확인
2. 테스트 이미지로 `detectFace` → 랜드마크 478개 추출 확인
3. `cropToFrame` → 가이드 프레임 크롭 결과 시각 검증
4. Docker 빌드 → Cloud Run 배포
5. idphoto-kr/jp에서 crop-engine API 호출 연동 (별도 지시서)

## ⚠️ 준수 조항

- **헌법 6조**: `.env`, API 키 절대 생성/추측 금지. 이 서비스에는 API 키 불필요 (이미지만 받아서 크롭)
- **헌법 8조**: 파괴적 명령 금지. 기존 idphoto-kr/jp 코드는 이 지시서에서 수정하지 않음
- **헌법 10조**: 프록시 금지. crop-engine은 독립 서비스이며 기존 서비스의 우회가 아님
- **법률 2장**: 코딩 규칙 준수. ESM(import/export), 에러 핸들링, 로깅

## 참고

- 현재 크롭 코드: `monkos_AI/idphoto-kr/gcs-save.js:90-135`
- 현재 얼굴 감지: `monkos_AI/idphoto-kr/server.js:450-496`
- HivisionIDPhotos (참고 오픈소스): https://github.com/Zeyi-Lin/HivisionIDPhotos
- dpar39/ppp (랜드마크 알고리즘): https://github.com/dpar39/ppp
