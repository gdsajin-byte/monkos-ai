---
type: order
from: M1/쌍아
to: 막내(any)
date: 2026-04-02 03:25 KST
priority: P0
subject: Studio — Secret Manager 키 .env 반영 + deploy.sh 개선 + dev/prod 재배포 + 어드민 URL 전환
tags: [studio, api-key, deploy, secret-manager, portal-admin]
status: open
---

# 지시서: Studio API 키 갱신 + dev/prod 재배포 + 어드민 URL 전환

**[2026-04-02 03:25 KST] M1/쌍아 → 막내**

---

## 상황

- 3/30 키 유출 사건 후 Secret Manager v2 키 생성 완료 (3/30 22:20)
- iMac에서 prod 재배포는 완료 (3/31)
- **Studio dev는 3/18 리비전이 돌고 있어 만료된 v1 키를 물고 있음**
- M1 `.env`도 3/12 이후 미갱신 → 구(舊) 키 상태
- `deploy.sh`가 Secret Manager가 아닌 `.env` grep 방식 → 근본 원인

**민아 보고서**: `monkos-ops/ops/reports/REPORT_20260402_M1민아_Studio_API키만료_진단보고.md`

---

## 작업 순서

### Phase 1: .env 키 갱신 (P0)

#### 1-1. Secret Manager 현행 키 확인

```bash
# 버전 목록 확인
gcloud secrets versions list GEMINI_API_KEY --project=monkos

# 최신(v2) 키 값 취득
gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=monkos
```

#### 1-2. .env 갱신

```bash
# 현재 .env의 GEMINI_API_KEY 끝4자리 확인 (전체 노출 금지)
grep GEMINI_API_KEY /Users/developer/monk_project/monkos_AI/.env | rev | cut -c1-4 | rev

# Secret Manager v2 키로 교체
NEW_KEY=$(gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=monkos)
sed -i '' "s/^GEMINI_API_KEY=.*/GEMINI_API_KEY=${NEW_KEY}/" /Users/developer/monk_project/monkos_AI/.env

# 교체 확인 (끝4자리만)
grep GEMINI_API_KEY /Users/developer/monk_project/monkos_AI/.env | rev | cut -c1-4 | rev
```

**검증**: 교체 전후 끝4자리가 달라야 함. 같으면 `⏳ 대기` 보고.

### Phase 2: deploy.sh 개선 — Secret Manager 직접 참조 (P2)

**파일**: `monkos_AI/studio/deploy.sh` 39~44행

**현행** (문제):
```bash
# API Key — .env에서 읽기
if [ -f "${SCRIPT_DIR}/../.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/../.env" | cut -d'=' -f2)
elif [ -f "${SCRIPT_DIR}/.env" ]; then
  GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/.env" | cut -d'=' -f2)
fi
```

**변경안**:
```bash
# API Key — Secret Manager에서 읽기 (fallback: .env)
GEMINI_API_KEY=$(gcloud secrets versions access latest --secret=GEMINI_API_KEY --project=${PROJECT_ID} 2>/dev/null)

if [ -z "$GEMINI_API_KEY" ]; then
  echo -e "${YELLOW}⚠ Secret Manager 접근 실패. .env fallback${NC}"
  if [ -f "${SCRIPT_DIR}/../.env" ]; then
    GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/../.env" | cut -d'=' -f2)
  elif [ -f "${SCRIPT_DIR}/.env" ]; then
    GEMINI_API_KEY=$(grep GEMINI_API_KEY "${SCRIPT_DIR}/.env" | cut -d'=' -f2)
  fi
fi
```

**변경 범위**: deploy.sh 39~44행만 교체. 나머지 코드 변경 금지.

### Phase 3: Studio dev 재배포

```bash
cd /Users/developer/monk_project/monkos_AI/studio && bash deploy.sh dev
```

### Phase 4: dev 검증

#### 4-1. dev 헬스체크
```bash
curl -s https://monkos-studio-dev-933456016842.us-central1.run.app/health | jq .
```

#### 4-2. dev 생성 테스트
- dev URL 접속 → 여권 규격 + 여성 + 성인 조건 → "생성" 클릭
- 에러 없이 이미지 생성되면 성공
- **실패 시**: `⏳ 대기` 보고. Phase 5 진행 금지.

### Phase 5: Studio prod 신규 배포 + `studio.monkos.ai` 도메인 매핑 (dev 검증 통과 후)

> **dev 테스트 정상 확인 후에만 진행.**
> `monkos-studio` prod 서비스는 현재 미존재 → 신규 생성됨.

#### 5-1. prod 배포

```bash
cd /Users/developer/monk_project/monkos_AI/studio && bash deploy.sh prod
# prod 확인 프롬프트에 y 입력
```

#### 5-2. prod 헬스체크

```bash
# 배포 완료 후 Cloud Run URL로 먼저 확인
gcloud run services describe monkos-studio --region=us-central1 --project=monkos --format='value(status.url)'
# 해당 URL/health 로 헬스체크
curl -s $(gcloud run services describe monkos-studio --region=us-central1 --project=monkos --format='value(status.url)')/health | jq .
```

#### 5-3. 커스텀 도메인 매핑: `studio.monkos.ai`

```bash
# 도메인 매핑 생성
gcloud beta run domain-mappings create \
  --service=monkos-studio \
  --domain=studio.monkos.ai \
  --region=us-central1 \
  --project=monkos

# 매핑 결과 확인 — DNS 레코드 안내가 출력됨
gcloud beta run domain-mappings describe \
  --domain=studio.monkos.ai \
  --region=us-central1 \
  --project=monkos
```

**DNS 레코드 추가가 필요할 경우:**
- 출력된 CNAME 또는 A 레코드를 Cloud DNS에 추가
- 기존 매핑 패턴 참고: `idphoto-kr.monkos.ai`, `image.monkos.ai` 등

```bash
# 예시 — CNAME인 경우 (출력값에 따라 조정)
gcloud dns record-sets create studio.monkos.ai \
  --zone=monkos-ai \
  --type=CNAME \
  --rrdatas=ghs.googlehosted.com. \
  --ttl=300 \
  --project=monkos
```

> DNS 전파에 수 분 소요. 매핑 상태가 ✔ 될 때까지 확인.

#### 5-4. studio.monkos.ai 검증

```bash
# 도메인 매핑 상태 확인 (✔ 나올 때까지)
gcloud beta run domain-mappings list --region=us-central1 --project=monkos | grep studio

# 최종 헬스체크
curl -s https://studio.monkos.ai/health | jq .
```

- studio.monkos.ai 접속 → 여권 규격 생성 테스트
- DNS 미전파 시: Cloud Run URL로 기능 검증 먼저, 도메인은 `⏳ 전파 대기` 보고

### Phase 6: 어드민 포탈 Studio 링크 → `studio.monkos.ai` 전환

**파일**: `monkos_AI/portal/public/admin/index.html` 126행

**현행**:
```html
<a href="https://monkos-studio-dev-933456016842.us-central1.run.app/" target="_blank" rel="noopener" class="menu-card">
```

**변경**:
```html
<a href="https://studio.monkos.ai/" target="_blank" rel="noopener" class="menu-card">
```

**변경 범위**: URL만 교체. 나머지 HTML 변경 금지.

---

## 완료 기준

Phase 1~3: ✅ 막내1 완료 (e906553)

Phase 4~6 (잔여):
- [ ] dev 생성 테스트 정상 (API 400 해소) — 작가님 확인
- [ ] `bash deploy.sh prod` → `monkos-studio` 서비스 신규 생성
- [ ] prod 헬스체크 정상
- [ ] `studio.monkos.ai` 도메인 매핑 + DNS 등록
- [ ] `studio.monkos.ai` 헬스체크 + 생성 테스트 정상
- [ ] 어드민 포탈 Studio 링크 → `studio.monkos.ai` 전환
- [ ] 포탈 재배포 (`bash deploy.sh prod` — portal)
- [ ] 커밋 + 푸시 (admin/index.html)
- [ ] 완료 보고 — prod 서비스 URL + 도메인 매핑 상태 + 생성 테스트 결과

**완료 레벨**: 실행+검증

---

## 규칙

- **브랜치**: main (인프라 핫픽스)
- **커밋**: `[deploy] Studio prod 신규 배포 + studio.monkos.ai 도메인 매핑 + 어드민 링크 전환`
- **금지**: 키 값 전체 노출, server.js 수정
- **.env는 커밋 대상 아님** (.gitignore 확인)
- **Phase 5(prod 배포)는 Phase 4(dev 검증) 통과 후에만 진행**
- **도메인 매핑 실패 시**: `⏳ 대기` 보고 (DNS 설정 문제일 수 있음)
- **에스컬레이션**: Secret Manager/DNS 권한 문제 시 `⏳ 대기` 보고
- **완료 보고**: `✅❌💡⏳📁🔀` 형식
- **헌법 제4조 1항 준수**: 키 값 보고서 기재 금지 (끝4자리 마스킹만)
