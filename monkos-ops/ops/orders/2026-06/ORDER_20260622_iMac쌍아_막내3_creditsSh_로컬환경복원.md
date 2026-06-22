---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내3
status: 대기
portfolio: PF_INFRA
---

# 지시서: credits.sh 로컬 환경 복원 (iMac)

## 배경
- `scripts/credits.sh`가 iMac에서 실행 불가 — `AUTH_SECRET 또는 LEMONSQUEEZY_WEBHOOK_SECRET 미설정` 에러
- credits.sh는 포털의 `lib/shared/config.js`를 import하는데, 이 모듈이 `AUTH_SECRET` 환경변수를 요구
- iMac에 포털 `.env` 파일이 없어서 환경변수 미로드
- 운영 도구 고장 상태 — 크레딧 조회/변경이 로컬에서 불가
- 오늘 세션에서 Firestore 직접 조회가 필요했으나 credits.sh 불가로 node -e 우회함

## 작업 항목

### 1. 포털 .env 파일 생성

**파일**: `monkos_AI/portal/.env` (신규, git 미추적)

GCP Secret Manager에서 필요 시크릿만 복원:

```bash
# AUTH_SECRET 복원
echo "AUTH_SECRET=$(gcloud secrets versions access latest --secret=AUTH_SECRET --project=monkos)" >> monkos_AI/portal/.env

# LEMONSQUEEZY_WEBHOOK_SECRET 복원 (AUTH_SECRET 폴백용)
echo "LEMONSQUEEZY_WEBHOOK_SECRET=$(gcloud secrets versions access latest --secret=LEMONSQUEEZY_WEBHOOK_SECRET --project=monkos)" >> monkos_AI/portal/.env

# PROJECT_ID (비시크릿)
echo "PROJECT_ID=monkos" >> monkos_AI/portal/.env
```

### 2. credits.sh 동작 확인

```bash
scripts/credits.sh signups 7
```

정상 출력 시 환경 복원 완료.

### 3. .env git 미추적 확인

`monkos_AI/portal/.gitignore`에 `.env`가 있는지 확인. 없으면 추가:

```
.env
```

## ⚠️ 준수 조항
- 시크릿 값 생성/추측 금지 (헌법 4조 1항) — Secret Manager에서 **복원**만
- .env 파일 git 커밋 절대 금지
- SECRET_INVENTORY.md 참조하여 변수명 정확히 확인

## 검증
- [ ] `scripts/credits.sh signups 7` — 정상 출력 (최근 7일 가입자 집계)
- [ ] `scripts/credits.sh query <테스트이메일>` — 크레딧 조회 정상
- [ ] `.env` 파일이 git status에 안 잡히는지 확인

## 대상 파일
1. `monkos_AI/portal/.env` — 신규 (git 미추적)
2. `monkos_AI/portal/.gitignore` — .env 항목 확인/추가
