# 막내 지시서: Cloud Run 정리 + dev 배포라인 구축

**발행:** 2026-02-16 19:20 KST (쌍아)
**대상:** 막내 (mk-c)
**우선순위:** 즉시 실행

---

## 배경

프로덕션 직접 수정으로 카메라 먹통 사고 발생 (0216 세션).
서비스 임박 → production/dev 배포라인 분리 필수.
유령 Cloud Run 서비스도 잔존 중.

---

## PHASE 1: 유령 Cloud Run 서비스 삭제

도메인 매핑 없는 죽은 서비스 4개 삭제.

```bash
gcloud run services delete idphoto-kr --region=asia-northeast1 --project=monkos --quiet
gcloud run services delete idphoto-kr --region=asia-northeast3 --project=monkos --quiet
gcloud run services delete idphoto-jp --region=asia-northeast1 --project=monkos --quiet
gcloud run services delete monkos-portal --region=asia-northeast1 --project=monkos --quiet
```

**삭제 후 확인:**
```bash
gcloud run services list --project=monkos --format="table(SERVICE,REGION)"
```

**기대 결과 (4개만 남아야 함):**
| 서비스 | 리전 |
|--------|------|
| monkos-portal | us-central1 |
| monkos-idphoto-kr | us-central1 |
| monkos-idphoto-jp | us-central1 |
| monk-image-engine | us-central1 |

---

## PHASE 2: develop 브랜치 생성

```bash
cd "/Users/developer/monk_project "
git checkout -b develop
git push -u origin develop
```

---

## PHASE 3: deploy.sh 개선 (3개 파일 동일 패턴)

대상 파일:
- `monkos_AI/idphoto-kr/deploy.sh`
- `monkos_AI/idphoto-jp/deploy.sh`
- `monkos_AI/portal/deploy.sh`

### 3-1. 인자 없이 실행 시 거부

기존: `ENV=${1:-production}` (인자 없으면 바로 production 배포 — 위험)

변경:
```bash
ENV=${1:-""}

if [ -z "$ENV" ]; then
  echo -e "${RED}사용법: ./deploy.sh [dev|prod]${NC}"
  echo -e "  dev   → dev 서비스에 배포 (테스트)"
  echo -e "  prod  → production 서비스에 배포 (실서비스)"
  exit 1
fi
```

### 3-2. 환경 이름 통일

기존 `staging` / `production` → `dev` / `prod` 로 변경 (짧고 직관적)

### 3-3. 브랜치 안전장치

```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$ENV" = "prod" ]; then
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}production 배포는 main 브랜치에서만 가능합니다 (현재: ${CURRENT_BRANCH})${NC}"
    exit 1
  fi
  echo -e "${YELLOW}⚠ PRODUCTION 배포입니다. 계속하시겠습니까? (y/N)${NC}"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "취소됨"
    exit 0
  fi
fi
```

### 3-4. 서비스명 + 리소스 분기

**idphoto-kr/deploy.sh:**
```bash
if [ "$ENV" = "dev" ]; then
  SERVICE_NAME="monkos-idphoto-kr-dev"
  MEMORY="512Mi"
  CPU="1"
  MAX_INSTANCES="2"
elif [ "$ENV" = "prod" ]; then
  SERVICE_NAME="monkos-idphoto-kr"
  MEMORY="2Gi"
  CPU="2"
  MAX_INSTANCES="10"
fi
```

**idphoto-jp/deploy.sh:** 동일 패턴 (`monkos-idphoto-jp-dev` / `monkos-idphoto-jp`)
**portal/deploy.sh:** 동일 패턴 (`monkos-portal-dev` / `monkos-portal`, portal은 기존 512Mi/1CPU 유지)

### 3-5. gcloud run deploy에 변수 적용

기존 하드코딩된 리소스값을 변수로 교체:
```bash
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory ${MEMORY} \
  --cpu ${CPU} \
  --timeout 300 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances ${MAX_INSTANCES} \
  ...
```

### 3-6. subtree push 블록 제거

3개 deploy.sh 모두에 있는 `[0/4] subtree push` 블록 삭제.
`monkos-ai` 리모트 미설정 상태에서 매번 에러 → 스킵 되고 있음. 죽은 코드.
단계 넘버링도 `[1/3]`, `[2/3]`, `[3/3]`으로 조정.

---

## PHASE 4: portal CORS 화이트리스트 확장

파일: `monkos_AI/portal/server.js`

`ALLOWED_ORIGINS` 배열에 dev Cloud Run 자동 URL 패턴 추가:

```javascript
const ALLOWED_ORIGINS = [
  // production
  'https://monkos.ai',
  'https://idphoto-jp.monkos.ai',
  'https://idphoto-kr.monkos.ai',
  // Cloud Run 직접 URL (production)
  'https://monkos-idphoto-jp-933456016842.us-central1.run.app',
  'https://monkos-idphoto-kr-933456016842.us-central1.run.app',
  // Cloud Run 직접 URL (dev)
  'https://monkos-idphoto-jp-dev-933456016842.us-central1.run.app',
  'https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app',
  'https://monkos-portal-dev-933456016842.us-central1.run.app',
  // localhost
  'http://localhost:8080',
  'http://localhost:3000',
];
```

**주의:** dev Cloud Run URL의 프로젝트 번호(`933456016842`)는 기존 production URL에서 확인 가능. 동일 GCP 프로젝트이므로 동일 번호.

---

## PHASE 5: 완료 확인

```bash
# 1. Cloud Run 서비스 목록 (유령 삭제 확인)
gcloud run services list --project=monkos --format="table(SERVICE,REGION)"

# 2. deploy.sh 동작 테스트 (실제 배포 X, 문법만)
bash -n monkos_AI/idphoto-kr/deploy.sh
bash -n monkos_AI/idphoto-jp/deploy.sh
bash -n monkos_AI/portal/deploy.sh

# 3. 인자 없이 실행 → 거부되는지 확인
cd "/Users/developer/monk_project /monkos_AI/idphoto-kr" && ./deploy.sh

# 4. git 브랜치 확인
git branch -a
```

---

## 금지 사항

- `git push --force` 금지
- production 서비스 (`monkos-idphoto-kr`, `monkos-idphoto-jp`, `monkos-portal`, `monk-image-engine`) 절대 삭제 금지
- .env 파일 수정 금지
- API 키 하드코딩 금지

---

## 완료 보고

작업 완료 후 반드시 아래 형식으로 보고:

```
## 완료 보고 [막내] [HH:MM KST]

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {다음 단계}
```
