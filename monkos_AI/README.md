# MONKOS.AI — AI 서비스 플랫폼

> **monkos.ai** | Evolution of Creative Intelligence

## 개요

MONKOS.AI는 MONK.KR에서 검증된 AI 기술을 **독립 서비스**로 출시하는 플랫폼이다.

| | MONK.kr | MONKOS.AI |
|---|---|---|
| **역할** | 포털 홈페이지 | 완성 앱 서비스 |
| **인프라** | Cloudflare Pages + Workers | GCP Cloud Run (Vertex AI) |
| **배포** | Git push → 자동 | deploy.sh → Cloud Build |
| **과금** | Cloudflare 플랜 | GCP 무료 티어 → 종량제 |

## 개발 프로세스

```
apps/ (공유 앱스)          monkos_AI/ (배포 앱스)
 프로토타입/실험    →→→     정식 상품/강화판
 photo-coach       →→→     idphoto/
 (Gemini Live 검증)        (상품화 + Cloud Run 배포)
```

공유 앱스(`apps/`)에서 기술 검증 → 배포 앱스(`monkos_AI/`)에서 상품 강화 → Cloud Run 배포

## 서비스 목록

| 서비스 | 경로 | 도메인 | Cloud Run 서비스명 | 원본 (apps/) | 상태 |
|--------|------|--------|-------------------|-------------|------|
| AI 증명사진 | `idphoto/` | idphoto.monkos.ai | `monkos-idphoto` | photo-coach | 개발 중 |
| AI 룩북 | `lookbook/` | lookbook.monkos.ai | — | — | 예정 |
| AI 모델 | `model/` | model.monkos.ai | — | — | 예정 |
| 쌍아 챗봇 | `chat/` | chat.monkos.ai | — | — | 예정 |

## 디렉토리 구조

```
monkos_AI/
├── README.md                 ← 본 문서
├── infrastructure/
│   ├── DEPLOY_GUIDE.md       ← Cloud Run 배포 가이드
│   └── SERVICE_MAP.md        ← 서비스 맵 + 상태
│
├── idphoto/                  ← AI 증명사진 (idphoto.monkos.ai)
│   ├── server.js
│   ├── public/index.html
│   ├── Dockerfile
│   ├── deploy.sh
│   ├── package.json
│   └── .gcloudignore
│
└── (향후 확장)
```

## 공유 자원 (루트)

monkos_AI는 monk_project 루트의 자원을 참조한다:

- `apps/` — 실험/프로토타입 (기술 검증 → monkos_AI로 승격)
- `docs/` — 문서, 코퍼스, 세션 로그
- `backend/` — 레거시 백엔드

## GCP 인프라

- **프로젝트**: `monkos`
- **리전**: `us-central1` (Vertex AI Imagen/Gemini Live 필수)
- **서비스 계정**: `monk-image-engine@monkos.iam.gserviceaccount.com`
- **스토리지**: GCS `monk-ai-images`
- **도메인**: *.monkos.ai (Cloudflare DNS → Cloud Run)

## 배포

각 서비스 디렉토리에서:

```bash
cd monkos_AI/idphoto
./deploy.sh              # 프로덕션 배포
./deploy.sh staging      # 스테이징 배포
```

상세: [infrastructure/DEPLOY_GUIDE.md](infrastructure/DEPLOY_GUIDE.md)
