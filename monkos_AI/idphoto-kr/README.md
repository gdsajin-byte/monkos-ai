# idphoto-kr — 한국 AI 증명사진

> Cloud Run 서비스 | 도메인: **idphoto-kr.monkos.ai**

## 배포

```bash
# dev (자유)
./deploy.sh dev

# prod (작가님/쌍아만)
./deploy.sh prod    # main 브랜치 강제, 확인 프롬프트
```

| 항목 | prod | dev |
|------|------|-----|
| 서비스명 | `monkos-idphoto-kr` | `monkos-idphoto-kr-dev` |
| 메모리 | 2Gi | 512Mi |
| CPU | 2 | 1 |
| 최대 인스턴스 | 10 | 2 |
| 타임아웃 | 300s | 300s |

- **리전**: `us-central1`
- **포트**: 8080
- **서비스 계정**: `monk-image-engine@monkos.iam.gserviceaccount.com`

## 핵심 구조

```
idphoto-kr/
├── server.js           ← Express 서버 (API + SSR)
├── deploy.sh           ← 배포 스크립트 (dev/prod)
├── Dockerfile          ← node:20-slim 2단계 빌드
├── obfuscate.mjs       ← 코드 난독화
├── package.json
├── .env                ← 환경변수 (Git 추적 안 됨)
└── public/
    ├── index.html      ← 촬영 앱 (/app)
    ├── landing.html    ← 랜딩 페이지 (/)
    ├── privacy.html    ← 개인정보처리방침
    ├── terms.html      ← 이용약관
    ├── refund.html     ← 환불 정책
    ├── monkos-icon.svg
    └── og-image.png
```

## 환경변수 (.env)

| 변수 | 용도 | 인증 방식 |
|------|------|-----------|
| `PROJECT_ID` | GCP 프로젝트 | — |
| `LOCATION` | GCP 리전 | — |
| `GCS_BUCKET` | 이미지 저장 (monk-ai-images) | — |
| `GEMINI_API_KEY` | Imagen I2I 생성 | Google AI Studio API Key |

- **Vertex AI ADC**: Live 코칭 + QC (API Key 불필요)
- **Google AI Studio API Key**: Imagen I2I 생성 전용

## URL 구조

| 경로 | 페이지 |
|------|--------|
| `/` | 랜딩 페이지 (landing.html) |
| `/app` | 촬영 앱 (index.html) |
| `/health` | 헬스체크 |

## 주의사항

- `server.js` 수정 시 에스컬레이션 필수 (법률 제7장 4조)
- `.env` 수정 금지 (법률 제7장 3조)
- I2I 생성 시 `responseModalities` 사용 금지 (에러 발생)
- 배포 후 `/health` 로 동작 확인 필수
