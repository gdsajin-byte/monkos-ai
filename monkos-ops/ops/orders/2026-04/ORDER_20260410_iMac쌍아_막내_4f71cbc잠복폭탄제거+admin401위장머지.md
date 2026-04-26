---
type: order
date: 2026-04-10
from: iMac/쌍아
to: 막내1
subject: 4f71cbc 커밋 잠복 폭탄 제거 + admin/js 401 위장 패턴 머지 (통합)
priority: P0
pf: PF_PORTAL
related-incident: REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md
status: open
---

# 통합 지시서 — 4f71cbc 잠복 폭탄 제거 + admin 401 위장 머지

> **[2026-04-10 16:30 KST] iMac/쌍아 → 막내1**
> 본 지시서는 사고 보고서 [REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md](../../reports/2026-04/REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md)의 후속 액션 #2~#3.

---

## 배경

4/8 `4f71cbc` 커밋이 deploy.sh를 단순화하면서 4가지 실수를 동시에 묻어 들였음. 4/10 새벽 SEO 풀배포가 트리거가 되어 (1) 이미지 뱅크 ~10시간 무력화, (2) 모든 로그인 사용자에게 admin 권한 노출. 즉시 봉인 완료(rev 00224-5m5)했으나 deploy.sh 자체의 폭탄은 그대로 잠복.

본 지시서는 잠복 폭탄을 코드 레벨에서 제거하고, 별건으로 진행 중이던 admin/js 401 위장 패턴 수정(막내1이 이미 코딩 완료)을 함께 머지·배포한다.

---

## 작업 1 — portal/deploy.sh 잠복 폭탄 제거 (P0)

### 핵심 원칙

**비시크릿 운영값은 deploy.sh 자체에 박는다. .env 의존 금지.**

GCS_BUCKET과 ADMIN_UIDS는 모두 시크릿이 아니다:
- `GCS_BUCKET=monk-ai-images`: 코드 폴백(config.js:66) + idphoto deploy.sh 하드코딩과 일치하는 단일 진실값. 환경별 분기 없음
- `ADMIN_UIDS`: Google sub UID 리스트. 외부 노출돼도 무해. 변경 빈도 낮음

→ 이 둘은 PROJECT_ID, REGION, SERVICE_ACCOUNT처럼 deploy.sh L51~53에 하드코딩한다. 작가님 .env 의존 = 4f71cbc 사고의 1차 원인.

### 수정 내용

**파일**: `monkos_AI/portal/deploy.sh`

**1단계 — L51~53 영역에 두 변수 하드코딩 추가**:

현재:
```bash
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"
```

변경:
```bash
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

# === 비시크릿 운영값 (deploy.sh가 정본, .env 의존 금지) ===
# 4f71cbc 사고(2026-04-10) 재발 방지: 폴백값과 .env 누락이 트리거였음
GCS_BUCKET="monk-ai-images"
# admin 화이트리스트 (Google sub UID, 시크릿 아님)
# 추가/제거 시 monkos_AI/portal/scripts/find_admin_uids.js 사용
ADMIN_UIDS="108827115052045057530,115646365617285208759"
```

**2단계 — L142에서 폴백 제거**:

현재:
```bash
  --update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET:-monkos-shared}::ADMIN_UIDS=${ADMIN_UIDS}" \
```

변경:
```bash
  --update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET}::ADMIN_UIDS=${ADMIN_UIDS}" \
```

(폴백 제거. 변수는 이미 L51 영역에서 하드코딩으로 항상 정의됨)

### 효과

- 작가님 .env 의존 0
- 폴백값(`monkos-shared`) 트로이목마 제거
- ADMIN_UIDS 빈값 위험 0
- ADMIN_UIDS 갱신은 git 추적 (deploy.sh diff로 누가 언제 추가했는지 명확)
- 향후 admin 추가 = `find_admin_uids.js` 실행 → deploy.sh L57 1줄 수정 → 커밋 → 배포

---

## 작업 2 — idphoto-jp/idphoto-kr/studio deploy.sh 폴백 정리 (P1)

### 현황

3개 deploy.sh는 라인 상단에 `GCS_BUCKET="monk-ai-images"` 하드코딩이 있어서 L108/93의 `${GCS_BUCKET:-monkos-shared}` 폴백은 **사실상 발동 안 함**. 잠복 폭탄은 아니지만, 잘못된 폴백값이 코드에 남아있는 것 자체가 혼란을 유발.

### 수정

**3파일 모두 동일 패턴** (`monkos_AI/idphoto-jp/deploy.sh` L108, `monkos_AI/idphoto-kr/deploy.sh` L108, `monkos_AI/studio/deploy.sh` L93):

**현재**:
```bash
  --update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET:-monkos-shared}" \
```

**변경**:
```bash
  --update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET}" \
```

(L44/35의 하드코딩 `GCS_BUCKET="monk-ai-images"`는 그대로 유지)

이유: 폴백값을 코드에서 제거. 향후 누군가 L44 하드코딩을 .env 의존으로 바꿀 때 잘못된 폴백이 발동하는 것을 차단.

---

## 작업 3 — admin/js 401 위장 패턴 머지 (Layer 2)

### 현황

막내1이 이미 코딩 완료. **본 지시서로 단지 커밋 + 배포 통합 처리**.

### 변경 내용 (참고, 막내1 작업분 그대로)

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/public/admin/js/blog-image.js` | +35/-10. import authFetch + 5건 전환 |
| `monkos_AI/portal/public/admin/js/blog-editor.js` | +14/-12. import authFetch + 4건 전환 |
| `monkos_AI/portal/public/admin/js/blog-research.js` | +3/-2. import authFetch + 1건 전환 |

총 10건 `/api/admin/*` fetch → `authFetch()` 전환. node --check 통과.

### 검증 체크리스트
- [ ] 로그인 상태: 이미지 업로드/삭제/조회 정상
- [ ] 미로그인 상태: `/admin/`로 자동 리다이렉트 (위장 메시지 없음)
- [ ] blog-editor.js 저장/발행 정상
- [ ] blog-research.js 네이버 검색 정상

---

## 작업 4 — find_admin_uids.js 보존 (P2)

`monkos_AI/portal/scripts/find_admin_uids.js` 헤더 주석 추가 완료(쌍아). **삭제 금지**. git 추적 대상에 포함 (커밋에 포함).

향후 admin 추가 시 재사용:
```bash
cd monkos_AI/portal && node scripts/find_admin_uids.js
```

---

## 커밋 구조 (단일 커밋 권장)

```
[fix] 4f71cbc 잠복 폭탄 제거 + admin/js 401 위장 패턴 통합 수정

사고 대응: REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고

- portal/deploy.sh: GCS_BUCKET/ADMIN_UIDS 빈값 가드 추가, monkos-shared 폴백 제거
- idphoto-jp/kr/studio/deploy.sh: monkos-shared 폴백 정리 (3파일)
- admin/js 4파일: 10건 fetch → authFetch 전환 (401 위장 차단)
- find_admin_uids.js: admin 등록용 UID 조회 도구 보존
```

---

## 작업 순서

1. **작업 1** (portal/deploy.sh L51 영역 GCS_BUCKET+ADMIN_UIDS 하드코딩, L142 폴백 제거) — 막내1
2. **작업 2** (idphoto/studio 3파일 폴백 정리) — 막내1
3. **작업 3** (admin/js 4파일 401 위장 머지) — 막내1, 코딩 완료분 git add
4. **작업 4** (find_admin_uids.js git add)
5. **검증**: `node --check` 3개 admin/js 파일 + `bash -n` 4개 deploy.sh
6. **단일 커밋 + main push**
7. **작가님 승인** → `cd monkos_AI/portal && ./deploy.sh prod` 배포
8. **배포 후 검증**:
   - admin 새로고침 → 이미지 뱅크 정상
   - 미로그인 시 `/admin/` 리다이렉트 동작
   - rev 번호 보고

---

## 준수 조항

⚠️ **헌법 4조 1항**: `.env`, `secrets/`, `deploy.sh` 수정 시 작가님 승인. 본 지시서가 사전 승인 역할을 하나, 작업 1-2(.env)는 막내가 절대 만지지 말 것
⚠️ **헌법 4조 2항**: 파괴적 명령 금지. `git push --force`, `git reset --hard` 금지
⚠️ **법률 5장 2조**: 배포는 deploy.sh 경유. `gcloud run deploy` 직접 호출 금지
⚠️ **법률 5장 2조 한시 예외**: 본 사고의 1차 복구(rev 00223-llj, 00224-5m5)는 deploy.sh 우회. 본 지시서로 정상화

---

## 배포 후 검증 명령 (작가님 또는 막내)

```bash
# 1. 새 리비전 환경변수 확인
gcloud run services describe monkos-portal --region=us-central1 \
  --format="yaml(spec.template.spec.containers[0].env)" \
  | grep -A1 "GCS_BUCKET\|ADMIN_UIDS"

# 기대 결과:
#   GCS_BUCKET    value: monk-ai-images
#   ADMIN_UIDS    value: 108827115052045057530,115646365617285208759

# 2. admin 페이지 직접 확인
# https://monkos.ai/admin/blog-edit.html 접속 → 이미지 뱅크 정상 표시
```

---

## 완료 보고 형식

```
✅ 작업 1: portal/deploy.sh 가드+폴백제거
✅ 작업 2: idphoto/studio 3파일 폴백 정리
✅ 작업 3: admin/js 4파일 401 위장 머지 (10건)
✅ 작업 4: find_admin_uids.js 보존
✅ 검증: node --check + bash -n 통과
✅ 배포: rev XXXXX-XXX
✅ 사후 검증: GCS_BUCKET, ADMIN_UIDS 정상
📁 커밋: {해시}
🔀 브랜치: main
```

---

## 8. 미해결 (별도 어젠다)

- **시크릿 매니저 마운트** (P1): AUTH_SECRET, KAKAO, TOSS, LINE, LEMONSQUEEZY, TELEGRAM 등 20여개. 본 지시서 범위 외. MEMORY의 "보안 관리 체계화" 어젠다와 통합 필요
