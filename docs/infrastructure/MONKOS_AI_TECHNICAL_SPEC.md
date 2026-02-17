# MONKOS AI 기술명세서

**최초 작성:** 2026-02-18
**작성자:** 쌍아 (전략실)
**갱신 의무:** 인프라, 파이프라인, 배포, 장애 발생 시 반드시 갱신

> 이 문서는 CLAUDE.md에서 참조하는 총괄 기술문서다.
> 모든 에이전트(쌍아/막내/소넷이)는 작업 전 이 문서를 참조할 것.

---

## 1. 서비스 구조

### 1-1. 브랜드 관계

```
MONK.kr (포털 — Cloudflare Pages)
├── ai_lab/photolab/     → 증명사진 서비스 (프론트엔드)
├── ai_lab/lookbook/     → 룩북 (대기)
├── ai_lab/image_pro/    → 이미지 프로 (내부 운용)
├── model_agency/        → AI 모델 에이전시 (대기)
├── business/            → 쌍아 챗봇 / 비즈니스 (대기)
└── functions/api/       → CF Pages Function (프록시 + API)

MONKOS.ai (AI 실행 엔진 — GCP Cloud Run)
├── monkos-portal        → 인증/결제/크레딧 관리
├── monkos-idphoto-kr    → 증명사진 KR 백엔드 (00079 동결)
├── monkos-idphoto-jp    → 증명사진 JP 백엔드
└── monk-image-engine    → 이미지 엔진 (내부)
```

**핵심 관계:**
- MONK.kr = 프론트엔드 + 프록시 (Cloudflare)
- MONKOS.ai = 백엔드 + AI 엔진 (GCP)
- 차후 MONK이 상위, MONKOS가 엔진으로 통합 OS 지향

### 1-2. 증명사진 서비스 파이프라인

```
[사용자 모바일 브라우저]
        │
        ▼
[monk.kr/ai_lab/photolab/]  ← CF Pages (정적 사이트)
├── index.html + app.js + monk.js + config.js + app.css
├── WS 직접 연결 → idphoto-kr.monkos.ai (코칭)
└── REST 프록시 → CF Pages Function → idphoto-kr.monkos.ai
        │
        ▼
[idphoto-kr.monkos.ai]  ← Cloud Run (서버)
├── /api/pre-check  → Gemini 3 Flash (사전분석)
├── /api/generate   → Imagen NB3 Pro I2I (증명사진 생성)
├── /api/qc         → Gemini 3 Flash (품질 검증)
├── WebSocket /     → Gemini 2.0 Live (실시간 코칭)
└── 크레딧 차감     → monkos.ai 포탈 API 경유
```

---

## 2. 인프라 스택

### 2-1. 도메인 → 서비스 매핑

| 도메인 | 플랫폼 | 서비스명 | 리전 | 소스 경로 |
|--------|--------|----------|------|-----------|
| monk.kr | Cloudflare Pages | monk-kr | — | `MONK_kr/` |
| monkos.ai | GCP Cloud Run | `monkos-portal` | us-central1 | `monkos_AI/portal/` |
| idphoto-kr.monkos.ai | GCP Cloud Run | `monkos-idphoto-kr` | us-central1 | `monkos_AI/idphoto-kr/` |
| idphoto-jp.monkos.ai | GCP Cloud Run | `monkos-idphoto-jp` | us-central1 | `monkos_AI/idphoto-jp/` |
| image.monkos.ai | GCP Cloud Run | `monk-image-engine` | us-central1 | — |

### 2-2. 데이터베이스

| DB | 용도 | 위치 |
|----|------|------|
| Firestore (`monkos`) | 유저/크레딧 (idphoto) | GCP |
| Cloudflare D1 (`monk-db`) | monk.kr 포털용 | Cloudflare |

**주의:** idphoto 크레딧은 Firestore. D1이 아님.

### 2-3. AI 모델 스택

| 모델 | API 경로 | 용도 | 과금 |
|------|----------|------|------|
| Gemini 2.0 Flash Live | Vertex AI ADC | 실시간 코칭 (WS) | Vertex AI |
| Gemini 3 Flash | Vertex AI ADC | QC 판정 + 사전분석 (REST) | Vertex AI |
| Imagen NB3 Pro (gemini-3-pro-image-preview) | Google AI Studio API Key | 증명사진 I2I 생성 | Gemini API |

**Imagen 특성:**
- Nano Banana 3 Pro = 구 Imagen 3 I2I 계승. Vertex 비공개, Studio 전용
- Imagen 4는 T2I 전용 (I2I 미지원) — Google 의도적 라인업 분리
- 공식 단가: ~$0.134/장 (~₩194)
- 1회 정밀 생성 전략 (재생성 시 회차마다 품질 열화)
- IDENTITY_PRESERVATION 90:10 비율 = 세이프가드 우회 최적값

---

## 3. 배포 체계

### 3-1. Cloudflare Pages (monk.kr)

**배포 = Git Push.**

| 브랜치 | 배포 대상 | URL |
|--------|----------|-----|
| `main` | 프로덕션 | `monk.kr` |
| `develop` | 프리뷰 | `*.monk-kr.pages.dev` |

- 빌드 커맨드: 없음 (정적 사이트)
- 루트 디렉토리: `MONK_kr/`
- 빌드 시간: ~1-2분
- **커밋 + 푸시 = 배포** — 막내가 develop 푸시하면 프리뷰 자동 배포
- **main 머지 = 프로덕션 배포** — 쌍아/작가님만 실행

### 3-2. CF Pages Functions (프록시)

`MONK_kr/functions/` 디렉토리의 JS 파일이 서버리스 함수로 자동 배포.

**현재 등록된 프록시 (idphoto):**

| 파일 | 엔드포인트 | 프록시 대상 |
|------|-----------|------------|
| `functions/api/idphoto-precheck.js` | POST `/api/idphoto-precheck` | `idphoto-kr.monkos.ai/api/pre-check` |
| `functions/api/idphoto-generate.js` | POST `/api/idphoto-generate` | `idphoto-kr.monkos.ai/api/generate` |
| `functions/api/idphoto-qc.js` | POST `/api/idphoto-qc` | `idphoto-kr.monkos.ai/api/qc` |

**기존 Functions:**

| 파일 | 용도 |
|------|------|
| `functions/api/photo.js` | Imagen I2I (Image Pro용) |
| `functions/api/generate.js` | Imagen 4 T2I |
| `functions/api/analyze.js` | 이미지 분석 |
| `functions/api/auth.js` | 인증 |
| `functions/api/payment.js` | 결제 |

**CF Pages Function 제약사항 (2/18 E2E 테스트에서 발견):**
1. **정적 자산 우선**: 정적 디렉토리와 겹치는 경로에 Function 배치 불가 (405 반환)
2. **catch-all `[[path]]` 미작동**: POST 요청에서 catch-all 라우팅 작동 안 함
3. **해결책**: 개별 파일로 분리 (`idphoto-precheck.js`, `idphoto-generate.js`, `idphoto-qc.js`)
4. **export 패턴**: `onRequestPost`/`onRequestOptions` (메서드별 export 필수)

### 3-3. GCP Cloud Run (monkos.ai)

**배포 명령:**
```bash
# KR (us-central1 필수!)
cd monkos_AI/idphoto-kr
gcloud builds submit --tag gcr.io/monkos/idphoto-kr:latest
gcloud run deploy monkos-idphoto-kr \
  --image gcr.io/monkos/idphoto-kr:latest \
  --region us-central1 \
  --allow-unauthenticated

# JP
cd monkos_AI/idphoto-jp
gcloud builds submit --tag gcr.io/monkos/idphoto-jp:latest
gcloud run deploy monkos-idphoto-jp \
  --image gcr.io/monkos/idphoto-jp:latest \
  --region us-central1 \
  --allow-unauthenticated
```

**주의사항:**
- `monkos-idphoto-kr` (us-central1) = 도메인 연결된 서비스 ← 여기 배포
- `idphoto-kr` (asia-northeast1/3) = 도메인 미연결 유령 서비스 ← 배포해도 반영 안 됨
- deploy.sh 경유 배포 원칙 (막내 직접 gcloud 실행 금지)

### 3-4. 롤백

**CF Pages:**
```
Dashboard → Pages → monk-kr → Deployments → 이전 배포 선택 → Rollback
```

**Cloud Run:**
```bash
# 트래픽을 특정 리비전으로 전환
gcloud run services update-traffic monkos-idphoto-kr \
  --region us-central1 \
  --to-revisions=monkos-idphoto-kr-00079-tpk=100
```

---

## 4. idphoto-kr 서버 API

### 4-1. REST API

| 메서드 | 경로 | 기능 | AI 모델 |
|--------|------|------|---------|
| POST | `/api/pre-check` | 촬영 사전분석 (자세/조명/배경) | Gemini 3 Flash |
| POST | `/api/generate` | 증명사진 I2I 생성 | Imagen NB3 Pro |
| POST | `/api/qc` | 품질 검증 (합격/불합격) | Gemini 3 Flash |
| GET | `/health` | 서버 상태 확인 | — |
| GET | `/api/info` | 서비스 정보 | — |

### 4-2. WebSocket

| 경로 | 기능 | AI 모델 |
|------|------|---------|
| `wss://idphoto-kr.monkos.ai/` | 실시간 코칭 | Gemini 2.0 Flash Live |

**메시지 프로토콜:**
- 클라이언트 → 서버: `{ type: 'set-style', style: 'id_photo' | 'resume' }`
- 클라이언트 → 서버: `{ type: 'frame', image: '<base64>' }`
- 서버 → 클라이언트: `{ type: 'ai-coaching', text: '...' }`

### 4-3. 크레딧

| 동작 | 크레딧 |
|------|--------|
| 생성 (generate) | -1 |
| 다운로드 (download) | -10 |

크레딧 관리: 포탈(monkos.ai) API 경유
- GET `/api/credits`
- POST `/api/credits/use`
- POST `/api/credits/refund`
- POST `/api/credits/share-bonus`

---

## 5. monk.kr photolab 클라이언트 (리팩토링 후)

### 5-1. 파일 구조

```
MONK_kr/ai_lab/photolab/
├── index.html    (293줄) — HTML + data-bind 속성
├── monk.js       (660줄) — 프레임워크 코어 (Screen/Store/Pipe/Media/Agent)
├── app.js        (810줄) — 비즈니스 로직
├── config.js      (86줄) — 상수/설정/API 경로
├── app.css       (633줄) — 스타일
└── test.html              — 단위 테스트
```

### 5-2. monk.js 프레임워크 5 모듈

| 모듈 | 역할 | 핵심 API |
|------|------|----------|
| **Screen** | 화면 상태 머신 | `screens.go(name)`, enter/exit 생명주기 |
| **Store** | Proxy 반응형 상태 + DOM 바인딩 | `store.속성 = 값` → data-bind/show/hide/class 자동 갱신 |
| **Pipe** | REST/WS 통신 | `pipe.run(name, data)`, `pipe.connect(name)`, `pipe.sendRaw(name, data)` |
| **Media** | 카메라/캡처/크롭 | `media.start()`, `media.capture()`, `media.crop(spec)` |
| **Agent** | Vision(REST)/Voice(WS) AI 래퍼 | `vision.start(inputFn)`, `vision.onResult(cb)` |

### 5-3. Pipe 경로 매핑

```js
// config.js
API.PRECHECK = '/api/idphoto-precheck'   // → CF Function → idphoto-kr/api/pre-check
API.GENERATE = '/api/idphoto-generate'   // → CF Function → idphoto-kr/api/generate
API.QC       = '/api/idphoto-qc'         // → CF Function → idphoto-kr/api/qc
```

**WS 코칭:** 프록시 불가 (WebSocket). 직접 연결:
```
wss://idphoto-kr.monkos.ai/
```

---

## 6. 장애 이력

### 6-1. 2/16 카메라 충돌 4연속 (INCIDENT_20260216)

**원인:** develop 코드를 prod에 직접 배포 + 배포 통제 부재
**결과:** 00080~00082 전부 카메라 실패, 00079로 롤백
**교훈:**
- 막내/소넷이 prod 배포 금지 규칙 CLAUDE.md에 추가
- deploy.sh 경유 필수
- 00079 프로덕션 동결 결정

**상세:** `docs/monkos/INCIDENT_20260216_deployment.md`

### 6-2. 2/17 핀 고정 배포 실패 (00086)

**원인:** 의존성 핀 고정 후에도 카메라 오류 재발 → 코드 자체가 원인 확정
**결과:** 00079로 재롤백
**교훈:**
- 모놀리스(2,437줄) 사이드 이펙트 추적 불가
- Plan B 전환 결정 (monk.js 프레임워크 분해)

### 6-3. 2/18 CF Pages Function 라우팅 실패

**원인:** catch-all `[[path]].js` 패턴이 POST에서 작동 안 함
**시도:**
1. `functions/ai_lab/photolab/api/[[path]].js` → 405 (정적자산 우선)
2. `functions/api/idphoto/[[path]].js` → 405
3. onRequest → onRequestPost 분리 → 405
**해결:** 개별 파일(`idphoto-precheck.js` 등)로 전환

---

## 7. 프로덕션 현황 (2026-02-18 기준)

### Cloud Run (idphoto-kr)
- **활성 리비전:** 00079-tpk (100% 트래픽)
- **상태:** 안정 (카메라/코칭/생성/다운로드 정상)
- **알려진 이슈:** QC 결과 미표시 (서버 로그 미확보, 리팩토링에서 해결 예정)

### Cloudflare Pages (monk.kr)
- **photolab:** develop 브랜치에 7커밋 대기 중 (main 미머지)
- **미반영 변경:** OAuth 제거, 검은화면 수정, WS 재연결 수정, API 프록시 3개
- **미완료:** creditUse 프록시, E2E 통합 테스트

---

## 8. 미해결 과제

| 과제 | 우선순위 | 상태 |
|------|---------|------|
| main 머지 → monk.kr 프로덕션 배포 | 높음 | develop 대기 |
| 모바일 E2E 재테스트 (프록시 동작 확인) | 높음 | main 배포 후 |
| creditUse 프록시 (다운로드 크레딧) | 중간 | 미착수 |
| QC 결과 미표시 원인 | 중간 | 서버 로그 미확보 |
| KR/JP 공유 코어 분리 | 낮음 (장기) | 설계서 작성 완료 |
| AI 에이전트 2분할 (vision/voice) | 낮음 (장기) | 설계서 작성 완료 |

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| `MONK_PHOTO_STUDIO_ARCHITECTURE.md` | 몽크사진관 서비스 전략 + 4카드 구조 |
| `SHARED_CORE_SEPARATION_PLAN.md` | KR/JP 공유 코어 분리 설계 |
| `DEPLOYMENT_GUIDE.md` | 배포 가이드 (CF Pages + Cloud Run) |
| `INCIDENT_20260216_deployment.md` | 2/16 배포 사고 상세 |
| `ARCHITECTURE_FLOWCHART.md` | 00079 모놀리스 플로우차트 |
| `3TRACK_SYSTEM_ARCHITECTURE.md` | 전체 시스템 아키텍처 (3트랙) |

---

*최초 작성: 2026-02-18 (쌍아)*
