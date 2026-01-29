# MONK Imagen 4 - Vertex AI Test Project

**GCP 배지 퀘스트를 위한 Vertex AI Imagen 4 테스트 프로젝트**

## 개요

이 프로젝트는 monk.kr 메인 프로젝트와 별개로, Google Cloud Platform의 Vertex AI Imagen 4를 테스트하기 위한 독립 프로젝트입니다.

### 협업 체계

- **쌍아 (Claude Sonnet 4.5)**: 백엔드 코딩
- **용아 (Gemini 3 Pro)**: Vertex AI 검수 및 컨트롤

## 배포 상태

| 항목 | 내용 |
|------|------|
| **Cloud Run 서비스** | https://monk-image-engine-933456016842.us-central1.run.app |
| **프로젝트** | monkos |
| **리전** | us-central1 |
| **상태** | ✅ 배포 완료 (2026-01-29) |

## 프로젝트 구조

```
monk_imagen4/
├── README.md          # 이 파일
└── backend/           # Node.js + Express + Vertex AI Imagen 4 백엔드
    ├── package.json
    ├── server.js      # 메인 API 서버
    ├── Dockerfile     # Cloud Run 컨테이너
    ├── deploy.sh      # 자동 배포 스크립트
    └── README.md      # 백엔드 상세 문서
```

## 주요 기능

### API 엔드포인트

- `GET /` - 헬스 체크
- `POST /generate` - 이미지 생성 (1-4장)
- `POST /batch-generate` - 배치 생성 (4장 고정)

### 기술 스택

- **AI/ML**: Vertex AI Imagen 4
- **백엔드**: Node.js 20 + Express
- **배포**: Google Cloud Run
- **스토리지**: Google Cloud Storage
- **인증**: ADC (Application Default Credentials)

## 빠른 시작

### 헬스 체크

```bash
curl https://monk-image-engine-933456016842.us-central1.run.app/
```

### 이미지 생성 테스트

```bash
curl -X POST https://monk-image-engine-933456016842.us-central1.run.app/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A beautiful Korean woman with elegant makeup",
    "aspectRatio": "1:1",
    "numberOfImages": 1
  }'
```

## 문서

자세한 내용은 [backend/README.md](backend/README.md)를 참조하세요.

## 참고사항

- monk.kr 메인 프로젝트와는 독립적으로 운영
- GCP 배지 퀘스트 학습 및 테스트 목적
- Vertex AI + Claude Code + Gemini 협업 테스트

---

**작성일**: 2026-01-29
**작성자**: 쌍아 (Claude Sonnet 4.5)
