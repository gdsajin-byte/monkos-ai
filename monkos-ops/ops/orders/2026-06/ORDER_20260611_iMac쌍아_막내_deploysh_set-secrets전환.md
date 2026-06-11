---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_MONK_OS
status: 대기
---

# 지시서 — deploy.sh 시크릿 주입 패턴 전환 (`--update-env-vars` → `--set-secrets`)

**[2026-06-11 12:24 KST] iMac/쌍아 → iMac/막내**

---

## 배경

현재 deploy.sh:151에서 `--update-env-vars`로 시크릿(CHAT_API_KEY, NAVER_CLIENT_SECRET, ADMIN_UIDS)을 **평문 전달**하고 있다. 이는 광역오더 #8("시크릿은 GCP 런타임")에 부합하지 않는다. `--set-secrets`로 전환하면 Secret Manager에서 **런타임 직접 주입**되어 deploy 명령에 시크릿 값이 노출되지 않는다.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: 비밀정보 보호 (시크릿 값 노출 금지)
- 광역오더 #8: GCP Secret Manager = 런타임 시크릿 정본
- ch5 2조: Cloud Run 배포는 deploy.sh 경유 필수
- SECRET_INVENTORY.md §0의 분류를 정본으로 따를 것

---

## Task: deploy.sh:151 분리

현재 한 줄에 설정+시크릿이 혼재:
```
--update-env-vars "^::^PROJECT_ID=...::CHAT_API_KEY=${CHAT_API_KEY}::NAVER_CLIENT_SECRET=${NAVER_CLIENT_SECRET}::..." \
```

SECRET_INVENTORY §0 분류에 따라 분리:

### 설정 (--update-env-vars에 잔류)

| 변수명 | 분류 근거 |
|--------|----------|
| PROJECT_ID | 설정 |
| LOCATION (=REGION) | 설정 |
| GCS_BUCKET | 설정 |
| CHAT_WORKERS_URL | 설정 |
| NAVER_CLIENT_ID | 설정 (§0에 명시) |

### 시크릿 (--set-secrets로 전환)

| 변수명 | SM 등록명 | 분류 근거 |
|--------|----------|----------|
| CHAT_API_KEY | CHAT_API_KEY:latest | 시크릿 (§0 24종) |
| NAVER_CLIENT_SECRET | NAVER_CLIENT_SECRET:latest | 시크릿 (§0 24종) |
| ADMIN_UIDS | ADMIN_UIDS:latest | 경계→보수적 시크릿 (§0) |

### 수정 후 형태 (예시)

```bash
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 60 \
  --concurrency 100 \
  --min-instances 1 \
  --max-instances ${MAX_INSTANCES} \
  --update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::CHAT_WORKERS_URL=${CHAT_WORKERS_URL}::NAVER_CLIENT_ID=${NAVER_CLIENT_ID}" \
  --set-secrets="CHAT_API_KEY=CHAT_API_KEY:latest,NAVER_CLIENT_SECRET=NAVER_CLIENT_SECRET:latest,ADMIN_UIDS=ADMIN_UIDS:latest" \
  --service-account ${SERVICE_ACCOUNT} \
  ${DEPLOY_FLAGS}
```

### 주의사항

1. **SM 등록명 확인**: 수정 전 `gcloud secrets list --project=monkos`로 CHAT_API_KEY, NAVER_CLIENT_SECRET, ADMIN_UIDS가 SM에 존재하는지 확인. 없으면 중단 후 보고.
2. **기존 콘솔 설정 시크릿**: TOSS_SECRET_KEY, AUTH_SECRET 등 콘솔에서 직접 설정된 것들은 건드리지 말 것. deploy.sh 경유가 아닌 것은 본 지시서 범위 밖.
3. **.env에서 제거하지 말 것**: 로컬 개발/테스트용으로 .env는 유지. deploy.sh만 전환.
4. **배포 후 검증**: `./deploy.sh prod` → 헬스체크 + 블로그 발행 테스트 (번역 트리거 동작 확인)

---

## 산출물

1. deploy.sh 수정
2. prod 배포 + 헬스체크 검증
3. **보고서**: `monkos-ops/ops/reports/2026-06/COMPLETION_20260611_iMac막내_deploysh_set-secrets전환.md`
4. 세션 로그 어펜드
5. 완료 보고: ✅❌💡⏳📁🔀 형식
