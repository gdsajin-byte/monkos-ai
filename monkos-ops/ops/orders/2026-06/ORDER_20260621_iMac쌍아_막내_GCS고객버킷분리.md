---
type: order
date: 2026-06-21
from: iMac/쌍아
to: iMac/막내
status: 대기
portfolio: PF_INFRA
subject: GCS 고객 데이터 버킷 분리 — monk-ai-images → monk-customer-photos 신설
---

# GCS 고객 데이터 버킷 분리

> **[2026-06-21 11:16 KST]** iMac/쌍아 → 막내
> 작가님 지시: 고객 서비스 버킷과 자체 에셋 버킷을 분리한다.

## 1. 목적

현재 `monk-ai-images` 버킷 하나에 고객 민감 데이터(증명사진 원본+생성물)와 자체 에셋(블로그, 광고, 학습데이터)이 혼재되어 있다. 고객 사진을 전용 버킷 `monk-customer-photos`로 분리하여:

- 버킷 단위 IAM·감사·보존정책 적용 가능하게
- 어드민 대시보드에서 고객 사진만 모니터링 가능하게
- 향후 법적 요건(보존기간, 삭제요청) 대응 기반 확보

## 2. 스코프

### 변경 대상 (✅ 필수)

| # | 파일 | 라인 | 현재 값 | 변경 내용 |
|---|------|------|---------|----------|
| 1 | `monkos_AI/idphoto-kr/gcs-save.js` | L10 | `GCS_BUCKET \|\| 'monk-ai-images'` | `CUSTOMER_GCS_BUCKET \|\| 'monk-customer-photos'` |
| 2 | `monkos_AI/idphoto-kr/gcs-save.js` | L12 | `storage.bucket(GCS_BUCKET)` | `storage.bucket(CUSTOMER_GCS_BUCKET)` |
| 3 | `monkos_AI/idphoto-kr/deploy.sh` | L44 | `GCS_BUCKET="monk-ai-images"` | `CUSTOMER_GCS_BUCKET="monk-customer-photos"` 추가 |
| 4 | `monkos_AI/idphoto-kr/deploy.sh` | L109 | `--update-env-vars "...GCS_BUCKET=..."` | `CUSTOMER_GCS_BUCKET=${CUSTOMER_GCS_BUCKET}` 추가 |
| 5 | `monkos_AI/idphoto-jp/gcs-save.js` | L10 | `GCS_BUCKET \|\| 'monk-ai-images'` | `CUSTOMER_GCS_BUCKET \|\| 'monk-customer-photos'` |
| 6 | `monkos_AI/idphoto-jp/gcs-save.js` | L12 | `storage.bucket(GCS_BUCKET)` | `storage.bucket(CUSTOMER_GCS_BUCKET)` |
| 7 | `monkos_AI/idphoto-jp/deploy.sh` | L44 | `GCS_BUCKET="monk-ai-images"` | `CUSTOMER_GCS_BUCKET="monk-customer-photos"` 추가 |
| 8 | `monkos_AI/idphoto-jp/deploy.sh` | L109 | `--update-env-vars "...GCS_BUCKET=..."` | `CUSTOMER_GCS_BUCKET=${CUSTOMER_GCS_BUCKET}` 추가 |
| 9 | `monkos_AI/studio/gcs-save.js` | L10 | `GCS_BUCKET \|\| 'monk-ai-images'` | `CUSTOMER_GCS_BUCKET \|\| 'monk-customer-photos'` |
| 10 | `monkos_AI/studio/gcs-save.js` | L12 | `storage.bucket(GCS_BUCKET)` | `storage.bucket(CUSTOMER_GCS_BUCKET)` |
| 11 | `monkos_AI/studio/deploy.sh` | L35 | `GCS_BUCKET="monk-ai-images"` | `CUSTOMER_GCS_BUCKET="monk-customer-photos"` 추가 |
| 12 | `monkos_AI/studio/deploy.sh` | L94 | `--update-env-vars "...GCS_BUCKET=..."` | `CUSTOMER_GCS_BUCKET=${CUSTOMER_GCS_BUCKET}` 추가 |

### 변경 불필요 확인 완료 (❌ 건드리지 말 것)

| 파일 | 이유 |
|------|------|
| `monkos_AI/idphoto-kr/server.js` L634 | 경로 검증만 (`service/idphoto/kr/{userId}/`). prefix는 동일하므로 변경 불필요 |
| `monkos_AI/idphoto-jp/server.js` L715 | 동일 (경로 검증만) |
| `monkos_AI/idphoto-jp/server.js` L29 | `GCS_BUCKET` 선언만 있고 사용처 없음 (잔존 코드). 이번 스코프 밖 |
| `monkos_AI/idphoto-kr/public/result.js` | 프론트엔드 — 서버가 반환하는 gcsPath를 그대로 사용. 자동 적응 |
| `monkos_AI/idphoto-jp/public/result.js` | 동일 |
| `monkos_AI/portal/lib/shared/config.js` L75 | 포털 CMS 전용 (블로그 이미지). 기존 `GCS_BUCKET` 유지 |
| `monkos_AI/portal/lib/cms/*.js` | 블로그/OG/AI 이미지. 고객 사진 아님 |
| `monkos_AI/portal/deploy.sh` | 포털 배포. `GCS_BUCKET` 유지 |
| `monkos_AI/image-pro/backend/deploy.sh` | Imagen 테스트 전용. `GCS_BUCKET` 유지 |
| `apps/monk_imagen4/backend/deploy.sh` | Imagen 테스트 전용. `GCS_BUCKET` 유지 |
| `monkos-ops/scripts/ads_sync.py` | 광고 시스템. `GCS_BUCKET` 유지 |
| `monkos-ops/scripts/ads_upload.sh` | 광고 업로드. `GCS_BUCKET` 유지 |
| `MONK_kr/` 전체 | 정적 사이트. GCS 직접 참조 없음 |

### gcs-save.js 주석 변경

3개 파일(kr/jp/studio) 모두 파일 상단 주석의 버킷명을 갱신:
- L3: `* 버킷: monk-ai-images` → `* 버킷: monk-customer-photos (환경변수 CUSTOMER_GCS_BUCKET)`
- jp는 일본어: `* バケット: monk-customer-photos (環境変数 CUSTOMER_GCS_BUCKET)`

## 3. 데이터 흐름 (변경 전 → 후)

```
[변경 전]
고객 촬영 → idphoto-kr/jp/studio → gcs-save.js
  → gs://monk-ai-images/service/idphoto/{kr|jp}/{userId}/{ts}_{type}.{ext}

[변경 후]
고객 촬영 → idphoto-kr/jp/studio → gcs-save.js
  → gs://monk-customer-photos/service/idphoto/{kr|jp}/{userId}/{ts}_{type}.{ext}
                ↑ 버킷만 변경. prefix 구조 동일.
```

- prefix (`service/idphoto/...`)는 변경하지 않는다
- server.js 경로 검증 (`gcsPath.startsWith(...)`)은 prefix만 확인하므로 영향 없음
- Signed URL 발급은 bucket 객체에서 생성하므로 버킷 변경 시 자동 적응

## 4. 인프라 사전 작업 (막내 실행)

### Phase 0: 버킷 생성 + 기존 데이터 이관

```bash
# 1) 버킷 생성 (서울 리전, 표준 스토리지)
gcloud storage buckets create gs://monk-customer-photos \
  --project=monkos \
  --location=asia-northeast3 \
  --default-storage-class=standard \
  --uniform-bucket-level-access

# 2) 기존 고객 데이터 복사 (원본 보존)
gcloud storage cp -r \
  gs://monk-ai-images/service/idphoto/ \
  gs://monk-customer-photos/service/idphoto/

# 3) 복사 검증 — 파일 수 일치 확인
echo "=== 원본 ==="
gcloud storage ls -r gs://monk-ai-images/service/idphoto/ | wc -l
echo "=== 복사본 ==="
gcloud storage ls -r gs://monk-customer-photos/service/idphoto/ | wc -l

# 4) SA 권한 부여 (Cloud Run SA)
gcloud storage buckets add-iam-policy-binding gs://monk-customer-photos \
  --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

⚠️ **원본 삭제는 이번 스코프에 포함하지 않는다.** 코드 변경 + 프로덕션 배포 + 검증 완료 후 별도 지시로 처리.

## 5. 코드 변경 상세

### gcs-save.js 변경 패턴 (3파일 공통)

```javascript
// 변경 전 (L10-12)
const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

// 변경 후 (L10-12)
const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
const storage = new Storage();
const bucket = storage.bucket(CUSTOMER_GCS_BUCKET);
```

나머지 코드(saveImages, downloadFromGCS, getSignedUrl, addWatermark)는 `bucket` 변수를 참조하므로 **추가 변경 없음**.

### deploy.sh 변경 패턴

```bash
# 변경 전
GCS_BUCKET="monk-ai-images"
# ...
--update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET}" \

# 변경 후 (GCS_BUCKET 유지 + CUSTOMER_GCS_BUCKET 추가)
GCS_BUCKET="monk-ai-images"
CUSTOMER_GCS_BUCKET="monk-customer-photos"
# ...
--update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET},CUSTOMER_GCS_BUCKET=${CUSTOMER_GCS_BUCKET}" \
```

⚠️ `GCS_BUCKET`은 **삭제하지 않는다**. idphoto-kr/jp 서비스 내부에서 향후 블로그/에셋 참조가 필요할 수 있음. 현재 server.js에서 직접 사용하지 않더라도 환경변수로 유지.

## 6. 실행 순서

| Phase | 작업 | 선행 조건 |
|-------|------|----------|
| 0 | GCS 버킷 생성 + 데이터 복사 + SA 권한 | 없음 |
| 1 | 코드 변경 (gcs-save.js 3파일 + deploy.sh 3파일) | Phase 0 완료 |
| 2 | 로컬 테스트 (dev 환경에서 증명사진 생성+다운로드) | Phase 1 완료 |
| 3 | 프로덕션 배포 (deploy.sh 경유, 3서비스) | Phase 2 검증 통과 |
| 4 | 프로덕션 검증 (실 서비스 증명사진 생성+다운로드+Signed URL) | Phase 3 완료 |
| 5 | 보고 | Phase 4 완료 |

## 7. 테스트 체크리스트

### Phase 2 로컬 테스트
- [ ] idphoto-kr: 사진 업로드 → GCS에 `monk-customer-photos/service/idphoto/kr/` 저장 확인
- [ ] idphoto-kr: 다운로드 → Signed URL 정상 발급 확인
- [ ] idphoto-jp: 동일 테스트
- [ ] studio: 동일 테스트
- [ ] `monk-ai-images/blog/`, `monk-ai-images/ads/` 등 기존 에셋 경로 영향 없음 확인

### Phase 4 프로덕션 검증
- [ ] monkos.ai → 증명사진 서비스 → 사진 촬영 → 생성 완료
- [ ] 결과 화면 → 다운로드 정상
- [ ] GCS 콘솔에서 `monk-customer-photos` 버킷에 파일 생성 확인
- [ ] `monk-ai-images/service/idphoto/`에 **신규 파일이 쌓이지 않음** 확인

## 8. 롤백 계획

코드 변경 전 `monk-ai-images`에 기존 데이터가 그대로 남아있으므로:
1. deploy.sh에서 `CUSTOMER_GCS_BUCKET`을 `monk-ai-images`로 변경
2. 재배포
3. 즉시 원복

## 9. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 프로젝트 ID 생성/추측 금지. `monk-customer-photos`는 작가님 승인 버킷명.
- **헌법 4조 2항**: `rm -rf`, `git push --force` 금지. 기존 데이터 삭제 금지 (복사만 수행).
- **ch5 2조**: 프로덕션 배포는 deploy.sh 경유 필수. `gcloud run deploy` 직접 실행 금지.
- **ch4 10조**: Firestore 직접 접근 금지 (본 작업에 해당 없으나 명시).

## 10. 보고 형식

```
✅ Phase 0: 버킷 생성 + 데이터 복사 (파일 수 일치: X/X)
✅ Phase 1: 코드 변경 (gcs-save.js 3파일 + deploy.sh 3파일)
✅ Phase 2: 로컬 테스트 통과 (kr/jp/studio 각 업로드+다운로드)
✅ Phase 3: 프로덕션 배포 (deploy.sh 경유, 3서비스)
✅ Phase 4: 프로덕션 검증 (실 서비스 정상)
📁 커밋: [해시] [feat] GCS 고객 데이터 버킷 분리
```
