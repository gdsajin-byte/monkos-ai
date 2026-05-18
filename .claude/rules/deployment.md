---
description: 배포 관련 파일 접근 시 적용
globs:
  - "**/deploy.sh"
  - "**/Dockerfile"
  - "**/cloudbuild.yaml"
---

# Cloud Run 배포 규칙

> **법률 제5장 2조 준수. 2026-04-08 개정.**

## 브랜치

- 기본 작업 브랜치: **main** (ch6 1조). develop 폐기 상태.
- 지시서에 develop 지정 금지.

## 필수

- Cloud Run 배포는 **반드시 deploy.sh 경유**. `gcloud run deploy` / `gcloud builds submit` 직접 실행 금지.
- 지시서에 배포용 gcloud 명령을 직접 기재 금지. `./deploy.sh {env}` 형태로만 기재.
- 리전 하드코딩 금지. deploy.sh 내 REGION 변수가 정본.

## deploy.sh 위치

| 서비스 | 경로 |
|--------|------|
| monkos-portal | `monkos_AI/portal/deploy.sh` |
| monkos-idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` |
| monkos-idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` |
| monkos-studio | `monkos_AI/studio/deploy.sh` |
| monk-image-engine | `apps/monk_imagen4/backend/deploy.sh` |

## 막내 방어 의무

지시서에 배포용 gcloud 명령이 직접 기재되어 있으면:
1. 실행 전 2조 위반 보고
2. deploy.sh 경유로 전환

## 예외

- **pt.monkos.ai**: deploy.sh 미존재. gcloud 직접 배포 허용하되 지시서에 `[2조 한시적 예외: pt]` 명기. deploy.sh 제작 시 자동 소멸.
- **monk-n8n**: 워크플로우 특수 서비스. 2조 적용 제외.
- **비배포 gcloud**(describe, list, domain-mappings 등): 금지 대상 아님.
