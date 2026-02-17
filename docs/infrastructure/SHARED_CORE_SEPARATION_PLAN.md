# MONKOS idphoto 공유 코어 분리 설계서 (B안)

**작성:** 2026-02-17 04:20 KST
**작성자:** 쌍아 (전략실)
**기반:** 코드베이스 역산 분석 + 작가님 피드백

> "한/일 >> 결제/네이티브 언어 외에 다른건 없잖아"

---

## 1. 핵심 원칙

**하나의 코드베이스, 두 개의 배포**

KR/JP는 동일한 애플리케이션의 리전 변형(regional variant)이다.
차이점은 설정(config)으로 주입하고, 로직은 100% 공유한다.

---

## 2. KR/JP 실제 차이점 (코드 역산 결과)

### 2-1. server.js 차이점

| 영역 | KR | JP | 분류 |
|------|----|----|------|
| 로그 메시지 언어 | 한국어 | 일본어 | config: `i18n.log` |
| COACHING_INSTRUCTIONS | 한국어 프롬프트 | 일본어 프롬프트 | config: `prompts.coaching` |
| STYLE_PROMPTS.resume | "Korean job application (이력서)" | "Japanese job application (履歴書), リクルートスーツ" | config: `prompts.style` |
| getOutfitPrompt (adult/resume) | 한국식 정장 | リクルートスーツ (검정무지+레지멘탈) | config: `prompts.outfit` |
| buildQCInstruction | 한국어 QC 프롬프트 | 일본어 QC 프롬프트 | config: `prompts.qc` |
| sharp 이미지 압축 | 있음 (compressImage) | 없음 (raw base64) | **삭제** → 클라이언트 제어로 전환 |
| /health 서비스명 | monkos-idphoto-kr | monkos-idphoto-jp | config: `service.name` |
| /api/info 서비스명 | AI 증명사진, idphoto-kr | AI 証明写真, idphoto-jp | config: `service.info` |
| 서버 시작 배너 | 한국어 | 일본어 | config: `i18n.log` |
| 에러 메시지 | 한국어 | 일본어 | config: `i18n.error` |

### 2-2. index.html (클라이언트) 차이점

| 영역 | KR | JP | 분류 |
|------|----|----|------|
| `<html lang>` | ko | ja | config: `locale` |
| `<title>`, OG Tags | 한국어 | 일본어 | config: `seo` |
| 웹폰트 | Noto Sans KR | Noto Sans JP | config: `font` |
| 로그인 버튼 | 카카오톡으로 시작 | LINEではじめる | config: `auth` |
| 로그인 엔드포인트 | /auth/kakao | /auth/line | config: `auth.endpoint` |
| 결제 SDK | Toss Payments SDK `<script>` | 없음 (Lemon Squeezy JS) | config: `payment` |
| 결제 로직 | TossPayments(), payment.requestPayment() | Lemon Squeezy checkout | config: `payment` |
| 결제 콜백 | ?toss=success/fail → confirm API | Lemon Squeezy webhook | config: `payment` |
| TOSS_CLIENT_KEY | test_ck_xxx | 없음 | config: `payment.key` |
| 모든 UI 텍스트 | 한국어 | 일본어 | config: `i18n.ui` |
| 의상 선택 UI | 기본 스타일 선택만 | + .prep-outfit-chip (リクルート) | config: `ui.outfit` |
| 약관 링크 | /terms, /privacy, /refund | /terms, /privacy, /tokusho | config: `legal` |
| 공유 텍스트 | 한국어 공유 메시지 | 일본어 공유 메시지 | config: `i18n.share` |

### 2-3. 100% 동일한 코어 로직 (변경 불필요)

- 카메라 초기화/스트림 관리
- WebSocket 코칭 프레임 전송 (1fps JPEG)
- Gemini Live 연결/세션 관리
- Imagen I2I 생성 파이프라인
- QC 검증 파이프라인 (모델 폴백)
- 크레딧 API 호출 (Portal 경유)
- 프리체크 (사전분석)
- 다운로드 (캔버스→PNG)
- 페이지 플로우 (Step 0→1→2→3)
- 인앱 브라우저 감지
- 데스크톱 차단
- 헬스체크 구조
- 정적 파일 서빙

---

## 2-4. 이미지 파이프라인 확정 스펙

> 결정: 서버 sharp 제거, 클라이언트에서 출력 제한. (2026-02-17 작가님 확정)

### 배경
- KR의 `sharp` (서버 이미지 압축)는 iPhone Pro Max 용량과다 실패의 우회책이었음
- 근본 원인: Safari가 `ideal` constraint를 무시하고 고해상도 스트림 반환
- 서버에서 다운사이즈하지 말고, 클라이언트가 처음부터 적정 사이즈로 출력

### 확정 스펙

| 항목 | 기존 (KR) | 기존 (JP) | **확정** |
|------|----------|----------|---------|
| getUserMedia width | ideal: 720 | ideal: 720 | **ideal: 1024, max: 1280** |
| getUserMedia height | ideal: 960 | ideal: 960 | **ideal: 1365, max: 1708** |
| 코칭 프레임 (WS) | 512px, JPEG 60% | 512px, JPEG 60% | **512px, JPEG 60%** (변경 없음) |
| 최종 캡처 MAX_SIZE | 720px | 720px | **1024px** |
| 최종 캡처 JPEG 품질 | 0.8 | 0.8 | **0.85** |
| 서버 sharp 압축 | 720px JPEG 70% | 없음 | **삭제 (양쪽 모두)** |
| 서버 입력 검증 | 없음 | 없음 | **base64 > 2MB 거부** |
| sharp 의존성 | 있음 | 없음 | **삭제 (package.json에서 제거)** |

### 근거
- **Imagen I2I**: 장당 고정 과금 (~₩192), 입력 크기 무관
- **Gemini QC/사전분석**: 이미지 토큰 258개 고정 (해상도 무관, 내부 리사이즈)
- **API 비용 증가: 0** — 네트워크 전송만 300KB→500KB (4G에서 0.1초 미만)
- **화질**: 1024px JPEG 85%가 Imagen I2I 입력으로 최적 (디테일↑ 아티팩트↓)
- **Safari 대응**: `max` constraint로 4K 스트림 원천 차단 (ideal 무시해도 max는 준수)
- **빌드 경량화**: sharp 네이티브 C++ 바인딩 제거 → Docker 빌드 속도↑ 이미지 크기↓

### 클라이언트 코드 변경 (index.html)

```js
// 카메라 초기화
const MAX_CAPTURE_SIZE = 1024;  // 720 → 1024
cameraStream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'user',
    width: { ideal: 1024, max: 1280 },   // ideal+max 이중 제어
    height: { ideal: 1365, max: 1708 },
  }
});

// 최종 캡처
capturedImageData = canvas.toDataURL('image/jpeg', 0.85);  // 0.8 → 0.85
```

### 서버 코드 변경 (server.js)

```js
// sharp 관련 전부 삭제
// import sharp from 'sharp';          ← 삭제
// async function compressImage() {}   ← 삭제

// 대신 입력 사이즈 검증만
function validateImageSize(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const sizeBytes = Math.ceil(raw.length * 3 / 4);
  if (sizeBytes > 2 * 1024 * 1024) throw new Error('이미지 크기 초과 (2MB)');
  return raw;
}
```

---

## 3. 목표 디렉토리 구조

```
monkos_AI/
└── idphoto/                          ← 공유 코어 (NEW)
    ├── server.js                     ← 코어 서버 (리전 설정 로딩)
    ├── package.json                  ← 단일 의존성 (sharp 없음, 경량)
    ├── Dockerfile                    ← 단일 빌드 파일
    ├── obfuscate.mjs                 ← 난독화 (외부 JS 대응 확장)
    │
    ├── config/                       ← 리전별 설정
    │   ├── kr.js                     ← 한국 설정
    │   └── jp.js                     ← 일본 설정
    │
    ├── core/                         ← 공유 모듈
    │   ├── ai.js                     ← AI 클라이언트 초기화 (ADC + API Key)
    │   ├── coaching.js               ← Gemini Live 코칭
    │   ├── imagen.js                 ← Imagen I2I 생성 (클라이언트 전처리 의존)
    │   ├── qc.js                     ← QC 검증 (3 Flash → 2.0 폴백)
    │   ├── pre_check.js              ← 사전분석
    │   ├── credit.js                 ← 크레딧 API 헬퍼
    │   └── logger.js                 ← 구조화 로깅
    │
    ├── public/                       ← 공유 정적 자산
    │   ├── shared/                   ← 공유 JS/CSS
    │   │   ├── styles.css            ← 공유 CSS (796줄)
    │   │   ├── app.js                ← 코어 로직 (카메라, 페이지플로우, WS)
    │   │   ├── auth.js               ← 인증/크레딧 UI 로직
    │   │   ├── generate.js           ← 생성/QC/다운로드 로직
    │   │   └── utils.js              ← 유틸 (인앱감지, 디바이스체크)
    │   │
    │   ├── kr/                       ← 한국 전용
    │   │   ├── index.html            ← KR 엔트리 (공유 JS/CSS 임포트)
    │   │   ├── i18n.js               ← 한국어 UI 텍스트
    │   │   ├── payment.js            ← 토스 결제 로직
    │   │   ├── terms.html
    │   │   ├── privacy.html
    │   │   └── refund.html
    │   │
    │   ├── jp/                       ← 일본 전용
    │   │   ├── index.html            ← JP 엔트리 (공유 JS/CSS 임포트)
    │   │   ├── i18n.js               ← 일본어 UI 텍스트
    │   │   ├── payment.js            ← Lemon Squeezy 결제 로직
    │   │   ├── terms.html
    │   │   ├── privacy.html
    │   │   └── tokusho.html
    │   │
    │   ├── monkos-icon.svg           ← 공유 자산
    │   └── og-image.png              ← 공유 자산
    │
    ├── deploy-kr.sh                  ← KR 배포 스크립트
    └── deploy-jp.sh                  ← JP 배포 스크립트
```

---

## 4. 서버 코어 설계

### 4-1. config/kr.js — 리전 설정 예시

```js
export default {
  region: 'kr',
  locale: 'ko',
  service: {
    name: 'monkos-idphoto-kr',
    domain: 'idphoto-kr.monkos.ai',
    displayName: 'MONKOS AI 증명사진',
  },

  // 프론트엔드 라우팅
  publicDir: 'kr',          // public/kr/index.html
  sharedDir: 'shared',      // public/shared/*.js

  // AI 프롬프트
  prompts: {
    coaching: {
      id_photo: `몽코스 AI 코치입니다. 여권/증명사진 촬영을 도와드립니다...`,
      resume: `몽코스 AI 코치입니다. 이력서 사진 촬영을 도와드립니다...`,
    },
    style: {
      id_photo: 'Professional passport/ID photo...',
      resume: 'Professional resume photo for Korean job application (이력서)...',
    },
    outfit: {
      // 한국 비즈니스 정장 기준
      adult_resume_female: 'a clean white blouse with regular collar under dark navy or black business jacket...',
      adult_resume_male: 'a dark navy or black formal business suit with white dress shirt and solid-color subtle tie...',
    },
    qc: {
      genderText: { male: '남성', female: '여성' },
      ageText: { child: '유아~12세', teen: '13~18세', adult: '19세 이상' },
      // QC 프롬프트 템플릿 (한국어)
    },
  },

  // 에러 메시지
  i18n: {
    error: {
      imageRequired: '이미지 필요',
      loginRequired: '로그인 필요',
      generateFailed: '이미지 생성 실패: 응답에 이미지 없음',
      originalGeneratedRequired: '원본/생성물 필요',
    },
    log: {
      serverStart: 'MONKOS AI 증명사진 (KR) — 서버 시작',
      // ...기타 로그 메시지
    },
  },
};
```

### 4-2. server.js — 코어 서버

```js
/**
 * MONKOS AI 증명사진 — 공유 코어 서버
 * 리전 설정: REGION 환경변수로 결정 (kr | jp)
 */
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REGION = process.env.REGION || 'kr';

// 리전 설정 로드
const config = (await import(`./config/${REGION}.js`)).default;

// 코어 모듈 로드
import { initAI } from './core/ai.js';
import { connectGeminiLive } from './core/coaching.js';
import { generatePhoto } from './core/imagen.js';
import { runQC } from './core/qc.js';
import { runPreCheck } from './core/pre_check.js';
import { useCredits, refundCredits, grantShareBonus } from './core/credit.js';
import { log } from './core/logger.js';

const { ai, imagenAI } = initAI();

// ... 코어 로직 (100% 공유, config에서 문자열 참조)
```

### 4-3. 핵심 — 분기 포인트는 config 참조만

```js
// BEFORE (KR server.js에 하드코딩)
if (!body.image) return jsonResponse(res, 400, { error: '이미지 필요' });

// AFTER (config 참조)
if (!body.image) return jsonResponse(res, 400, { error: config.i18n.error.imageRequired });
```

```js
// BEFORE (JP server.js에 하드코딩)
const genderText = gender === 'male' ? '男性' : '女性';

// AFTER (config 참조)
const genderText = config.prompts.qc.genderText[gender];
```

---

## 5. 클라이언트 분리 설계

### 5-1. 현재 모놀리스 → 모듈 분리 매핑

```
현재 index.html (2,437줄)
├── Lines 57-853   (CSS 796줄)     → public/shared/styles.css
├── Lines 854      (Toss SDK)      → public/kr/index.html (KR만)
├── Lines 856-1160 (HTML 304줄)    → public/{kr,jp}/index.html (i18n 차이만)
└── Lines 1161-2435 (JS 1,274줄)   → 아래 분리
    ├── 유틸 (10 함수)              → public/shared/utils.js
    ├── 인증/크레딧 (13 함수)        → public/shared/auth.js
    ├── 프로필/UI (4 함수)           → public/shared/app.js
    ├── 카메라/WS (12 함수)          → public/shared/app.js
    ├── 생성/QC (11 함수)            → public/shared/generate.js
    ├── 다운로드 (9 함수)             → public/shared/generate.js
    ├── 결제 (Toss/Lemon)           → public/{kr,jp}/payment.js
    └── 로그인 (Kakao/LINE)          → public/{kr,jp}/i18n.js
```

### 5-2. i18n 구조

```js
// public/kr/i18n.js
export default {
  locale: 'ko',
  font: 'Noto Sans KR',

  auth: {
    loginButton: '카카오톡으로 시작',
    loginEndpoint: '/auth/kakao',
    loginIcon: 'kakao',
  },

  ui: {
    title: 'AI 증명사진',
    subtitle: 'AI 코치가 실시간으로 촬영을 가이드합니다',
    prepTitle: '촬영 준비',
    styleLabel: '사진 스타일',
    genderLabel: '성별',
    ageLabel: '연령대',
    // ... 모든 UI 문자열
    styles: {
      id_photo: '여권/증명사진',
      resume: '이력서 사진',
    },
    genders: {
      male: '남성',
      female: '여성',
    },
    ages: {
      child: '유아 (~12)',
      teen: '청소년 (13~18)',
      adult: '성인 (19+)',
    },
    // 공유 메시지
    share: {
      title: 'MONKOS AI 증명사진',
      text: 'AI가 찍어주는 증명사진! 지금 무료 체험하세요',
    },
  },

  credit: {
    title: '크레딧 충전',
    desc: '더 많은 사진을 생성하고 다운로드하세요',
    generateCost: '생성 1크레딧',
    downloadCost: '다운로드 10크레딧',
    packages: [
      { id: 'basic', name: '베이직', credits: 50, price: '₩3,900', popular: false },
      { id: 'standard', name: '스탠다드', credits: 150, price: '₩9,900', popular: true },
      { id: 'premium', name: '프리미엄', credits: 500, price: '₩24,900', popular: false },
    ],
  },

  legal: {
    terms: { label: '이용약관', href: '/terms' },
    privacy: { label: '개인정보처리방침', href: '/privacy' },
    refund: { label: '환불정책', href: '/refund' },
  },
};
```

### 5-3. payment.js 분리

```js
// public/kr/payment.js — 토스 결제
export function getPaymentSDK() {
  return 'https://js.tosspayments.com/v2/standard';
}

export async function requestPayment(userId, packageId, amount) {
  const TOSS_CLIENT_KEY = '...';  // 환경에서 주입
  const tossPayments = TossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey: userId });
  await payment.requestPayment({
    method: 'CARD',
    amount: { value: amount, currency: 'KRW' },
    orderId: `monk_${Date.now()}`,
    orderName: `MONKOS 크레딧 ${packageId}`,
    successUrl: `${window.location.origin}/app?toss=success`,
    failUrl: `${window.location.origin}/app?toss=fail`,
  });
}

export async function handlePaymentCallback(params) {
  // Toss success/fail 처리
}
```

```js
// public/jp/payment.js — Lemon Squeezy 결제
export function getPaymentSDK() {
  return null;  // Lemon Squeezy는 외부 SDK 불필요
}

export async function requestPayment(userId, packageId, amount) {
  // Lemon Squeezy checkout URL로 리다이렉트
  window.open(`https://monkos.lemonsqueezy.com/checkout/...`, '_blank');
}

export async function handlePaymentCallback(params) {
  // Lemon Squeezy webhook 처리
}
```

### 5-4. index.html — 리전 엔트리포인트

```html
<!-- public/kr/index.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AI 증명사진 | MONKOS</title>
    <!-- KR SEO/OG Tags -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="/shared/styles.css">
</head>
<body>
    <!-- HTML 마크업 (i18n.js에서 텍스트 주입) -->
    <div id="app"></div>

    <!-- 결제 SDK (KR: Toss) -->
    <script src="https://js.tosspayments.com/v2/standard"></script>

    <!-- 공유 코어 -->
    <script type="module">
        import i18n from './i18n.js';
        import * as payment from './payment.js';
        import { initApp } from '/shared/app.js';

        initApp({ i18n, payment, region: 'kr' });
    </script>
</body>
</html>
```

---

## 6. 서버 정적 파일 라우팅 변경

```js
// 현재: /app → public/index.html
// 변경: /app → public/{REGION}/index.html, /shared/* → public/shared/*

if (urlPath === '/app') {
  filePath = `/${REGION}/index.html`;
} else if (urlPath.startsWith('/shared/')) {
  filePath = urlPath;  // /shared/* 그대로
} else {
  filePath = `/${REGION}${urlPath}`;  // /terms → /kr/terms.html
}
```

---

## 7. 난독화 전략 업데이트

### 현재 문제
`obfuscate.mjs`는 인라인 `<script>` 블록만 처리 → 외부 `.js` 파일은 미처리

### 해결: obfuscate.mjs 확장

```js
// obfuscate.mjs v2 — HTML 인라인 + 외부 JS 파일 모두 처리
const JS_DIRS = ['./public/shared', `./public/${REGION}`];

for (const dir of JS_DIRS) {
  const jsFiles = readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const file of jsFiles) {
    const code = readFileSync(join(dir, file), 'utf8');
    if (code.trim().length < 100) continue;
    const result = JavaScriptObfuscator.obfuscate(code, options);
    writeFileSync(join(dir, file), result.getObfuscatedCode());
    console.log(`[obfuscate] ${join(dir, file)}: done`);
  }
}
// + 기존 HTML 인라인 처리 유지
```

---

## 8. Dockerfile 변경

```dockerfile
# 빌드 ARG로 리전 결정
ARG REGION=kr

# Stage 1: 난독화
FROM node:20-slim AS builder
ARG REGION
WORKDIR /build
COPY public/ ./public/
COPY obfuscate.mjs ./
RUN npm install javascript-obfuscator && \
    REGION=${REGION} node obfuscate.mjs

# Stage 2: 런타임
FROM node:20-slim
ARG REGION
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force
COPY server.js ./
COPY config/ ./config/
COPY core/ ./core/
COPY --from=builder /build/public ./public/
ENV NODE_ENV=production PORT=8080 REGION=${REGION}
EXPOSE 8080
CMD ["node", "server.js"]
```

---

## 9. 배포 스크립트

```bash
#!/bin/bash
# deploy-kr.sh
REGION=kr
SERVICE=monkos-idphoto-kr
IMAGE=gcr.io/monkos/idphoto-kr:latest

gcloud builds submit --tag $IMAGE --build-arg REGION=$REGION
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region us-central1 \
  --set-env-vars REGION=$REGION \
  --allow-unauthenticated
```

```bash
#!/bin/bash
# deploy-jp.sh
REGION=jp
SERVICE=monkos-idphoto-jp
IMAGE=gcr.io/monkos/idphoto-jp:latest

gcloud builds submit --tag $IMAGE --build-arg REGION=$REGION
gcloud run deploy $SERVICE \
  --image $IMAGE \
  --region us-central1 \
  --set-env-vars REGION=$REGION \
  --allow-unauthenticated
```

---

## 10. 마이그레이션 로드맵

### Phase 1: 서버 분리 (안전, 낮은 위험)
1. `core/` 모듈 생성 (ai, coaching, imagen, qc, pre_check, credit, logger)
2. `config/kr.js`, `config/jp.js` 생성
3. `server.js` → 코어 + config 참조로 리팩토링
4. KR에서 sharp 제거 + 입력 사이즈 검증 추가 (양쪽 통일)
5. 클라이언트 카메라 스펙 변경 (1024px, max constraint, JPEG 85%)
6. dev 배포 → 기존 대비 동작 검증

### Phase 2: 클라이언트 분리 (높은 위험 — 카메라 크래시 주의)
1. CSS 추출 → `shared/styles.css`
2. JS 추출 (utils → auth → app → generate 순서)
3. i18n.js 생성 (KR/JP 텍스트 분리)
4. payment.js 분리 (Toss/Lemon Squeezy)
5. index.html → 경량 엔트리포인트
6. **각 단계마다 dev 배포 + 카메라 테스트**

### Phase 3: 빌드/배포 통합
1. obfuscate.mjs v2 (외부 JS 대응)
2. Dockerfile 통합 (REGION ARG)
3. deploy-kr.sh, deploy-jp.sh 작성
4. 기존 `idphoto-kr/`, `idphoto-jp/` 디렉토리 → `idphoto/`로 통합
5. prod 배포 + 모니터링

---

## 11. 위험 요소 & 대응

| 위험 | 영향 | 대응 |
|------|------|------|
| 카메라 크래시 (기존 이슈) | 서비스 중단 | Phase 2 각 단계 dev 테스트, 크래시 시 즉시 롤백 |
| 난독화 깨짐 | 코드 노출 | obfuscate.mjs v2 사전 테스트 |
| ES Module 호환성 | 구형 브라우저 불가 | 타겟 브라우저 확인 (Safari 15+, Chrome 80+) |
| 정적 파일 경로 변경 | 404 에러 | 서버 라우팅 테스트 커버리지 |
| 기존 서비스 중단 없이 전환 | 유저 영향 | 기존 idphoto-kr/jp 유지 → 신규 idphoto로 점진 전환 |

---

## 12. 최종 파일 카운트 비교

### 현재
```
idphoto-kr/: server.js (765줄) + public/index.html (2,437줄) = 3,202줄
idphoto-jp/: server.js (752줄) + public/index.html (2,349줄) = 3,101줄
총합: 6,303줄 (중복 ~70% = ~4,400줄 낭비)
```

### 변경 후
```
idphoto/:
  server.js (~120줄, 설정 로드 + 라우팅)
  config/kr.js (~100줄)
  config/jp.js (~100줄)
  core/ (~500줄, 6 모듈)
  public/shared/ (~1,200줄, CSS+JS 4파일)
  public/kr/ (~200줄, index.html + i18n + payment)
  public/jp/ (~200줄, index.html + i18n + payment)
총합: ~2,420줄 (중복 0%)
```

**코드 62% 감소, 중복 100% 제거**

---

## 부록: 데드 코드 정리 (Phase 1에서 함께 처리)

| 함수/변수 | 파일 | 상태 |
|-----------|------|------|
| `regenerate()` | index.html | 미사용 (UI에서 호출 없음) |
| `goToPurchase()` | index.html | 미사용 |
| `disableShareButtons()` | index.html | 미사용 |
| `downloadCompleted` 변수 | index.html | 미사용 |
