---
type: task
from: M1/쌍아
to: 막내2
date: 2026-03-13 21:49 KST
status: open
priority: high
tags: [포털v4, Wave0, deploy.sh, 블루그린, 배포]
---

# Wave 0-B: deploy.sh 개선 — --to-latest 적용 + 블루/그린 준비

## 배경

포털 v4 전면 전환을 위해 블루/그린 배포가 필요하다. 현재 deploy.sh에 두 가지 미결이 있다:
1. `--to-latest` 미적용 → 매 배포 시 트래픽이 이전 리비전에 고착되는 위험
2. 블루/그린 배포 옵션 없음 → v4 검증 후 전환 불가

## 대상 파일

- `monkos_AI/portal/deploy.sh` (130줄)

## 작업 내용

### 1. 기본 배포에 `--to-latest` 추가

현재 `gcloud run deploy` 명령에 `--to-latest` 플래그가 없다.
이 플래그가 없으면 트래픽이 자동으로 최신 리비전으로 전환되지 않을 수 있다.

```bash
# 기존 (99행~)
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  ...

# 수정: --to-latest 추가
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --to-latest \
  ...
```

### 2. 블루/그린 배포 모드 추가

`./deploy.sh preview` 명령을 신설한다.

```bash
# 사용법 확장:
#   ./deploy.sh dev      → dev 서비스에 배포 (기존)
#   ./deploy.sh prod     → prod 서비스에 배포 (기존, --to-latest)
#   ./deploy.sh preview  → prod 이미지 빌드 → 트래픽 0%로 배포 → 태그 URL 반환
```

preview 모드의 동작:
1. prod와 동일한 이미지 빌드 (`gcr.io/monkos/monkos-portal`)
2. `--no-traffic` 플래그로 배포 → 새 리비전에 트래픽 0%
3. `--tag v4-preview` 태그 부여 → `https://v4-preview---monkos-portal-xxxxx.run.app`으로 접근 가능
4. 검증 후 트래픽 전환은 별도 명령:
   ```bash
   gcloud run services update-traffic monkos-portal \
     --region us-central1 \
     --to-latest
   ```

### 3. 롤백 가이드 출력

preview → prod 전환 후 문제 발생 시 롤백 명령을 배포 완료 메시지에 표시:

```bash
echo -e "${YELLOW}롤백 명령:${NC}"
echo -e "  gcloud run services update-traffic ${SERVICE_NAME} \\"
echo -e "    --region ${REGION} \\"
echo -e "    --to-revisions REVISION_NAME=100"
```

### 4. 환경변수 누락 점검

최근 추가된 환경변수가 deploy.sh에 포함되어 있는지 확인:
- `LINE_MESSAGING_CHANNEL_SECRET` — 있음 ✅
- `LINE_MESSAGING_ACCESS_TOKEN` — 있음 ✅
- `GCS_BUCKET` — 있음 ✅
- `ADMIN_UIDS` — 있음 ✅

누락 발견 시 추가.

## 최종 deploy.sh 구조

```
./deploy.sh          → 사용법 출력
./deploy.sh dev      → dev 서비스 배포 (--to-latest)
./deploy.sh prod     → prod 서비스 배포 (--to-latest, main 브랜치 강제)
./deploy.sh preview  → prod 이미지 → 트래픽 0% 배포 (--no-traffic --tag v4-preview)
```

## 규칙

- 브랜치: main
- 커밋: `[feat] deploy.sh 블루/그린 배포 준비 — --to-latest + preview 모드`
- 금지: 실제 배포 실행 금지 (스크립트 수정만), .env 수정 금지
- prod 배포 안전장치(main 브랜치 체크, y/N 확인)는 반드시 유지
- preview 모드에도 main 브랜치 체크 적용

## 완료 기준

**실행+보고** — deploy.sh 수정 완료 → 커밋 → 결과 보고 후 대기 (push는 쌍아 검토 후).
