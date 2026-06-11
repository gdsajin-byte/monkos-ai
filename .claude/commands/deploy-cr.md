---
name: CR배포
description: monkos.ai Cloud Run 배포 절차를 수행한다
allowed-tools:
  - Bash(*/deploy.sh *)
---

> 원천: ch5 2조 (monkos.ai 배포) + ch5 3조 (prod 배포 권한)

## deploy.sh 위치

!`find monkos_AI/*/deploy.sh apps/*/backend/deploy.sh -type f 2>/dev/null`

## 인자

`$ARGUMENTS`에서 서비스명과 환경(dev/prod)을 파싱한다.
- 예: `/CR배포 portal prod` → 서비스=portal, 환경=prod
- 인자 없으면 서비스와 환경을 질문한다.

## 절차

1. **deploy.sh 경유 필수** — `gcloud run deploy` 직접 실행 금지.
2. 인자에서 서비스 매핑:

| 서비스명 | deploy.sh 경로 |
|---------|---------------|
| portal | `monkos_AI/portal/deploy.sh` |
| idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` |
| idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` |
| studio | `monkos_AI/studio/deploy.sh` |
| image-engine | `apps/monk_imagen4/backend/deploy.sh` |

3. dev 배포: 막내 허용. 배포 후 동작 확인 필수.
4. prod 배포: **작가님/쌍아만 실행**. 막내는 지시서에 `[특별법]` 명기 시에만.
5. 완료 보고: 배포 결과 + 리비전 번호 + 동작 확인 결과.
