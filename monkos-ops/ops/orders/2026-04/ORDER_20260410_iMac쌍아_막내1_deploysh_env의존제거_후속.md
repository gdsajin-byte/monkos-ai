---
type: order
date: 2026-04-10 17:00 KST
from: iMac/쌍아
to: 막내1
subject: portal/deploy.sh .env 의존 제거 — 비시크릿값 직접 하드코딩 (500c2e1 후속)
priority: P0
pf: PF_PORTAL
related-order: ORDER_20260410_iMac쌍아_막내_4f71cbc잠복폭탄제거+admin401위장머지.md
related-commit: 500c2e1
status: open
---

# 후속 지시서 — deploy.sh .env 의존 제거

> **[2026-04-10 17:00 KST] iMac/쌍아 → 막내1**
> 작업 잘 끝냈습니다. 그런데 작가님 피드백으로 방향 보정이 들어왔습니다.

---

## 배경

500c2e1 커밋의 portal/deploy.sh 변경은 "가드 + .env 의존" 패턴으로 작성되었습니다(쌍아의 v1 지시서대로). 그러나 작가님 지적:

> "근데 이걸 왜 굳이 수동으로 해야하는거니"

작가님 .env 수동 갱신 자체가 4f71cbc 사고의 1차 원인이었습니다. **비시크릿 운영값까지 .env에 의존하는 패턴이 문제의 본질**입니다.

GCS_BUCKET, ADMIN_UIDS는 둘 다 시크릿이 아니므로, PROJECT_ID/REGION/SERVICE_ACCOUNT처럼 deploy.sh 자체가 정본을 가져야 합니다.

---

## 작업

### 단일 파일: `monkos_AI/portal/deploy.sh`

#### 1단계 — L51~53 영역에 두 변수 하드코딩 추가

**현재 L51~53**:
```bash
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"
```

**변경 후**:
```bash
PROJECT_ID="monkos"
REGION="us-central1"
SERVICE_ACCOUNT="monk-image-engine@${PROJECT_ID}.iam.gserviceaccount.com"

# === 비시크릿 운영값 (deploy.sh가 정본, .env 의존 금지) ===
# 4f71cbc 사고(2026-04-10) 재발 방지: 폴백값과 .env 누락이 트리거였음
# - GCS_BUCKET: 코드 폴백(config.js:66) + idphoto deploy.sh와 일치하는 단일 진실값
# - ADMIN_UIDS: Google sub UID 리스트, 시크릿 아님 (외부 노출 무해)
#   추가/제거 시 monkos_AI/portal/scripts/find_admin_uids.js 사용
GCS_BUCKET="monk-ai-images"
ADMIN_UIDS="108827115052045057530,115646365617285208759"
```

#### 2단계 — 가드 블록 제거 (L121~131 부근, 500c2e1에서 추가된 14줄)

**현재** (`echo -e "${BLUE}========================================${NC}"` 다음):
```bash
# === 환경변수 가드 (4f71cbc 사고 재발 방지, 2026-04-10) ===
if [ -z "$GCS_BUCKET" ]; then
  echo -e "${RED}🚨 GCS_BUCKET 미설정. .env 또는 환경변수 확인 후 재시도.${NC}"
  echo -e "${RED}   참고: 진짜 버킷명은 monk-ai-images (config.js:66 폴백과 일치)${NC}"
  exit 1
fi
if [ -z "$ADMIN_UIDS" ]; then
  echo -e "${RED}🚨 ADMIN_UIDS 미설정. 빈값 배포 시 모든 로그인 사용자가 admin 권한 획득.${NC}"
  echo -e "${RED}   .env에 ADMIN_UIDS=uid1,uid2,uid3 추가 후 재시도.${NC}"
  exit 1
fi

```

**변경 후**: 위 14줄 전부 삭제. 가드 블록 자체가 불필요 (변수가 항상 deploy.sh L57~58에서 정의됨).

#### 3단계 — L142(현재 L150~152) `--update-env-vars` 라인 그대로 유지

500c2e1에서 이미 `${GCS_BUCKET:-monkos-shared}` → `${GCS_BUCKET}`로 폴백 제거 완료. **추가 변경 불필요**.

---

## 검증

```bash
bash -n monkos_AI/portal/deploy.sh   # 문법 통과
grep -n "GCS_BUCKET\|ADMIN_UIDS" monkos_AI/portal/deploy.sh
# 기대 출력:
#   L57: GCS_BUCKET="monk-ai-images"
#   L58: ADMIN_UIDS="108827115052045057530,115646365617285208759"
#   L142(또는 그 부근): --update-env-vars "...GCS_BUCKET=${GCS_BUCKET}...ADMIN_UIDS=${ADMIN_UIDS}..."
# 가드 블록(if [ -z ...) 라인 0건 — 전부 삭제됨
```

---

## 커밋

**500c2e1 위에 후속 단일 커밋** (amend 금지):

```
[refactor] portal/deploy.sh .env 의존 제거 — 비시크릿값 직접 하드코딩

500c2e1 후속. 작가님 피드백 반영:
- GCS_BUCKET, ADMIN_UIDS는 시크릿이 아니므로 deploy.sh가 정본
- L57~58에 직접 하드코딩, .env 의존 0
- 가드 블록 제거 (변수 항상 정의되므로 불필요)
- ADMIN_UIDS 변경 = git diff로 추적, 누가 언제 추가했는지 명확

원인: 4f71cbc 사고의 1차 원인이 작가님 .env 누락이었음.
비시크릿값까지 .env에 의존하는 패턴 자체를 제거.
```

---

## 그 후 작업

1. main push
2. 작가님 승인 → `cd monkos_AI/portal && ./deploy.sh prod`
3. 배포 후 검증:
   - rev 번호 보고
   - `gcloud run services describe monkos-portal --region=us-central1 --format="yaml(spec.template.spec.containers[0].env)" | grep -A1 "GCS_BUCKET\|ADMIN_UIDS"`
   - 기대: GCS_BUCKET=monk-ai-images, ADMIN_UIDS=108827115052045057530,115646365617285208759
   - admin 페이지 이미지 뱅크 정상 표시
   - 미로그인 시 `/admin/` 리다이렉트 동작 (Layer 2 검증)

---

## 준수 조항

⚠️ **헌법 4조 1항**: deploy.sh 수정 — 본 지시서가 사전 승인
⚠️ **헌법 4조 2항**: `git push --force`, `git commit --amend` 금지. 500c2e1 위에 신규 커밋

---

## 완료 보고 형식

```
✅ deploy.sh L57~58 GCS_BUCKET/ADMIN_UIDS 하드코딩 추가
✅ 가드 블록 14줄 제거
✅ bash -n 문법 통과
📁 커밋: {해시}
🔀 push: 완료
⏳ 배포 승인 대기
```
