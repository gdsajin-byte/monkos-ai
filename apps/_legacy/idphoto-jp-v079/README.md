# idphoto-jp — 日本 AI 証明写真

> Cloud Run 서비스 | 도메인: **idphoto-jp.monkos.ai**

## 배포

```bash
# dev (자유)
./deploy.sh dev

# prod (작가님/쌍아만)
./deploy.sh prod    # main 브랜치 강제, 확인 프롬프트
```

| 항목 | prod | dev |
|------|------|-----|
| 서비스명 | `monkos-idphoto-jp` | `monkos-idphoto-jp-dev` |
| 메모리 | 2Gi | 512Mi |
| CPU | 2 | 1 |
| 최대 인스턴스 | 10 | 2 |
| 타임아웃 | 300s | 300s |

- **리전**: `us-central1`
- **포트**: 8080
- **서비스 계정**: `monk-image-engine@monkos.iam.gserviceaccount.com`

## 핵심 구조

```
idphoto-jp/
├── server.js           ← Express 서버 (API + SSR)
├── deploy.sh           ← 배포 스크립트 (dev/prod)
├── Dockerfile          ← node:20-slim 2단계 빌드
├── obfuscate.mjs       ← 코드 난독화
├── package.json
└── public/
    ├── index.html      ← 촬영 앱 (/app)
    ├── landing.html    ← 랜딩 페이지 (/)
    ├── privacy.html    ← プライバシーポリシー
    ├── terms.html      ← 利用規約
    ├── refund.html     ← 返金ポリシー
    ├── monkos-icon.svg
    └── og-image.png
```

## 환경변수 (.env → monkos_AI/.env)

| 변수 | 용도 | 인증 방식 |
|------|------|-----------|
| `PROJECT_ID` | GCP 프로젝트 | — |
| `LOCATION` | GCP 리전 | — |
| `GCS_BUCKET` | 이미지 저장 (monk-ai-images) | — |
| `GEMINI_API_KEY` | Imagen I2I 생성 | Google AI Studio API Key |

- **Vertex AI ADC**: Live 코칭 + QC
- **Google AI Studio API Key**: Imagen I2I 생성 전용

## URL 구조

| 경로 | 페이지 |
|------|--------|
| `/` | LP (landing.html) |
| `/app` | 撮影アプリ (index.html) |
| `/health` | ヘルスチェック |

## idphoto-kr과의 관계

- JP가 원본, KR이 복제본 (한국어화)
- UI/코칭/QC/음성 전부 일본어
- 구조·API·배포 스크립트 동일

## 주의사항

- `server.js` 수정 시 에스컬레이션 필수
- `.env` 수정 금지
- I2I 생성 시 `responseModalities` 사용 금지
- 배포 후 `/health` 로 동작 확인 필수
