# MONKOS.AI 서비스 맵

## 프로덕션 서비스

| 서비스 | Cloud Run 서비스명 | 도메인 | 상태 | 기술 스택 |
|--------|-------------------|--------|------|-----------|
| Imagen 4 API | `monk-image-engine` | image.monkos.ai | 프로덕션 | Vertex AI Imagen 4.0 (T2I) |

## 개발 중 서비스

| 서비스 | Cloud Run 서비스명 | 도메인 | 상태 | 기술 스택 |
|--------|-------------------|--------|------|-----------|
| AI 証明写真 (JP) | `monkos-idphoto-jp` | idphoto-jp.monkos.ai | 개발 중 | Gemini Live + Imagen 3.0 + QC |

## 예정 서비스

| 서비스 | Cloud Run 서비스명 | 도메인 | 기술 스택 |
|--------|-------------------|--------|-----------|
| AI 룩북 | `monkos-lookbook` | lookbook.monkos.ai | Imagen + 스타일 합성 |
| AI 모델 | `monkos-model` | model.monkos.ai | Imagen + 가상 모델 |
| 쌍아 챗봇 | `monkos-chat` | chat.monkos.ai | Gemini + 텔레봇 |

## 공통 인프라

| 항목 | 값 |
|------|-----|
| GCP 프로젝트 | `monkos` |
| 리전 | `us-central1` |
| 서비스 계정 | `monk-image-engine@monkos.iam.gserviceaccount.com` |
| GCS 버킷 | `monk-ai-images` |
| 컨테이너 레지스트리 | `gcr.io/monkos/` |

## 서비스 상태 코드

- 개발 중: 로컬 개발 단계
- 스테이징: Cloud Run 스테이징 배포
- 프로덕션: 정식 서비스 운영
- 예정: 미착수
