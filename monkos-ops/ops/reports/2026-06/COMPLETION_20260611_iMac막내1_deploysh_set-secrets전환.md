---
type: completion
date: 2026-06-11
device: iMac
agent: 막내1
portfolio: PF_MONK_OS
status: 완료
---

# COMPLETION — deploy.sh --set-secrets 전환

**[2026-06-11 12:39 KST] iMac/막내1 → 작가님**

> 근거 지시서: `ORDER_20260611_iMac쌍아_막내_deploysh_set-secrets전환.md`

---

## 수정 내역

### Before (deploy.sh:151)
```bash
--update-env-vars "^::^PROJECT_ID=...::ADMIN_UIDS=${ADMIN_UIDS}::CHAT_API_KEY=${CHAT_API_KEY}::NAVER_CLIENT_SECRET=${NAVER_CLIENT_SECRET}::..." \
```

### After (deploy.sh:151-152)
```bash
--update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::CHAT_WORKERS_URL=${CHAT_WORKERS_URL}::NAVER_CLIENT_ID=${NAVER_CLIENT_ID}" \
--set-secrets="CHAT_API_KEY=CHAT_API_KEY:latest,NAVER_CLIENT_SECRET=NAVER_CLIENT_SECRET:latest,ADMIN_UIDS=ADMIN_UIDS:latest" \
```

### 추가 작업
- SA에 `roles/secretmanager.secretAccessor` 부여 (배포 시 SM 접근 권한 필요)
- 기존 env-var → secret 타입 전환을 위해 1회성 `--remove-env-vars` 사용 후 제거

---

## 배포 결과

| 항목 | 결과 |
|------|------|
| 배포 리비전 | `monkos-portal-00281-m4x` |
| 헬스체크 | ✅ `{"status":"healthy"}` |
| llms.txt | ✅ 200, 258줄 |
| SM 권한 | ✅ `monk-image-engine` SA에 secretAccessor 부여 |

---

## 분류 정본 (SECRET_INVENTORY §0 기반)

| 변수 | 경로 | 비고 |
|------|------|------|
| PROJECT_ID | `--update-env-vars` | 설정 |
| LOCATION | `--update-env-vars` | 설정 |
| GCS_BUCKET | `--update-env-vars` | 설정 |
| CHAT_WORKERS_URL | `--update-env-vars` | 설정 |
| NAVER_CLIENT_ID | `--update-env-vars` | 설정 (§0) |
| CHAT_API_KEY | `--set-secrets` | 시크릿 (§0 24종) |
| NAVER_CLIENT_SECRET | `--set-secrets` | 시크릿 (§0 24종) |
| ADMIN_UIDS | `--set-secrets` | 경계→보수적 시크릿 |

---

## 커밋

(다음 커밋에 포함)
