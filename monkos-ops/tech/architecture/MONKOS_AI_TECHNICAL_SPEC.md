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

### 3-2. CF Pages Functions (자체 엔진)

루트 `functions/` 디렉토리의 JS 파일이 서버리스 함수로 자동 배포.

> **정본: 루트 `functions/`** (실제 디렉토리, 2/20 정상화)
> wrangler는 CWD의 `functions/`를 참조. `MONK_kr/functions/`는 제거됨.

**증명사진 자체 엔진 (2/19 구축 — Cloud Run 프록시 제거):**

| 파일 | 엔드포인트 | 모델 | 역할 |
|------|-----------|------|------|
| `functions/api/precheck.js` | POST `/api/precheck` | Gemini 2.0 Flash | 촬영본 사전분석 |
| `functions/api/idgen.js` | POST `/api/idgen` | Gemini 3 Pro Image Preview | I2I 증명사진 생성 |
| `functions/api/qc.js` | POST `/api/qc` | Gemini 2.0 Flash | 원본 vs 생성물 QC |

**기존 Functions:**

| 파일 | 용도 |
|------|------|
| `functions/api/photo.js` | Imagen I2I (Image Pro용) |
| `functions/api/generate.js` | Imagen 4 T2I |
| `functions/api/analyze.js` | 이미지 분석 |
| `functions/api/auth.js` | 인증 |
| `functions/api/payment.js` | 결제 |
| `functions/api/idphoto-coaching.js` | 코칭 프록시 (WS → Cloud Run) |
| `functions/api/idphoto-credit-use.js` | 크레딧 차감 |

**CF Pages Function 주의사항:**
1. **export 패턴**: `onRequestPost`/`onRequestOptions` (메서드별 export 필수)
2. **functions/ 경로**: wrangler는 CWD 기준 `functions/` 참조. 루트 `functions/api/`에 직접 추가
3. **API Key**: `env.GEMINI_API_KEY` (CF Pages Secrets에 설정)
4. **idgen 주의**: `responseModalities` 사용 금지 (photo.js 패턴 준수), mimeType은 `'image/jpeg'`

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

### 6-3. 2/18~19 CF Pages Function 405 — 근본 원인 해소

**증상:** 신규 추가한 Functions(precheck/idgen/qc) 전부 405, 기존 photo.js만 동작

**시도 (2/18):**
1. `functions/api/idphoto/[[path]].js` → 405
2. 개별 파일로 분리 (`idphoto-precheck.js` 등) → 405
3. 프록시 제거 → 자체 엔진 구축 → 405 (동일)

**근본 원인 (2/19 발견):**
- 루트 `functions/api/` (11파일)와 `MONK_kr/functions/api/` (16파일) 이중 구조
- `wrangler pages deploy MONK_kr/`는 정적 파일만 `MONK_kr/`에서 가져오고, Functions는 CWD(프로젝트 루트)의 `functions/`를 참조
- 신규 파일은 `MONK_kr/functions/api/`에만 존재 → 배포에 포함되지 않음

**해결 (2/19 symlink → 2/20 최종 정상화):**
- 2/19: symlink 시도 → wrangler가 symlink 미추적 + /tmp 우회 배포 시 Functions 전멸
- 2/20: 루트 `functions/`를 실제 디렉토리로 확정, `MONK_kr/functions/` 제거
- **정본: 루트 `functions/`** (실제 디렉토리)

**교훈:** symlink도 우회책이었다. 정본을 wrangler가 직접 참조하는 위치(루트)에 두는 것이 근원 해결

### 6-4. 2/19 idgen 생성 실패 — responseModalities

**증상:** "The string did not match the expected pattern"
**원인:** idgen.js에 `responseModalities: ['TEXT', 'IMAGE']` 포함 — photo.js(동작)에는 없음
**해결:** responseModalities 제거 + mimeType `'image/jpeg'`로 변경

### 6-5. 2/19 장애 A — monk.kr photo.js 불능

**원인:** `234c914` (CF Workers 자체 엔진 구현) → Functions 번들 전체 깨짐
- 신규 Functions 파일(idgen.js, precheck.js, qc.js)이 빌드/런타임을 깨뜨려 photo.js 포함 전체 Functions 불능
- CF Pages 자동배포가 main 머지 시 프로덕션 직격
- **롤백 대상:** `fe2ad97`

### 6-6. 2/19 장애 B — idphoto-kr 카메라 비활성 (79 망령 3차)

**원인:** `27a91eb` (토스 SDK 스캐폴딩) + `3a83eec` (OAuth 이동) → index.html 수정 → 카메라 초기화 로직 사이드이펙트
- 1차: 2/16 — 4연속 실패
- 2차: 2/17 — 8연속 실패
- 3차: 2/19 — 토스 SDK + OAuth 수정 → 카메라 깨짐
- **영향:** dev 배포만 (prod는 별도 deploy.sh prod 필요)
- **근본 원인:** 쌍아 0원칙 위반 지시서 — monkos_AI/idphoto-kr/ 수정 금지였으나 수정 지시

### CF Pages 자동배포 주의사항

- monk.kr (CF Pages) 자동배포 OFF (2/20). 수동 `wrangler pages deploy`만 허용
- 루트 `functions/api/` 파일 추가/삭제 시 Functions 번들 전체 영향
- 신규 Functions 파일은 반드시 Preview 배포에서 검증 후 Production 배포

---

## 7. 프로덕션 현황 (2026-02-19 기준)

### Cloud Run
- **idphoto-kr:** 00079-tpk (100% 트래픽, 프로덕션 동결)
- **monkos-portal:** 00073-rdm (chatWithMonkos 통합 엔진, RAG 전 채널 공유)

### Cloudflare Pages (monk.kr)
- **photolab:** prod 배포 완료 (E2E 테스트 통과)
- **자체 엔진:** precheck/idgen/qc — Gemini API 직접 호출 (Cloud Run 프록시 제거)
- **정본:** 루트 `functions/` (실제 디렉토리, 이중 구조 제거 완료 2/20)
- **wrangler:** 4.66.0

---

## 8. 미해결 과제

| 과제 | 우선순위 | 상태 |
|------|---------|------|
| 준비실 키오스크 퍼널 UI | 높음 | 설계서 완료, 구현 대기 |
| monkos.ai 챗봇 RAG 테스트 | 중간 | prod 배포 완료, 테스트 대기 |
| creditUse 프록시 (다운로드 크레딧) | 중간 | 미착수 |
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
