---
type: order
from: M1/쌍아
to: 막내(any)
date: 2026-04-02 03:46 KST
priority: P0
subject: Studio prod 신규 배포 + studio.monkos.ai 도메인 매핑 + 어드민 링크 전환
tags: [studio, deploy, domain-mapping, portal-admin]
status: open
ref: ORDER_20260402_M1쌍아_막내_Studio_dev_API키갱신+재배포.md
---

# 지시서: Studio prod 배포 + studio.monkos.ai + 어드민 링크 전환

**[2026-04-02 03:46 KST] M1/쌍아 → 막내**

---

## 상황

- 선행 지시서 Phase 1~3 완료 (막내1, e906553)
- **dev 생성 테스트 통과** — 작가님 확인 완료 (API 키 정상 동작)
- `monkos-studio` prod 서비스는 현재 **미존재** → 신규 생성
- 도메인: `studio.monkos.ai` 매핑 필요 (기존 패턴: `idphoto-kr.monkos.ai` 등)
- 어드민 포탈 링크가 dev URL 하드코딩 → prod 도메인으로 전환

---

## 작업 순서

### Phase 1: Studio prod 신규 배포

```bash
cd /Users/developer/monk_project/monkos_AI/studio && bash deploy.sh prod
# PRODUCTION 배포 확인 프롬프트에 y 입력
```

#### 1-1. prod 헬스체크

```bash
# 배포 완료 후 Cloud Run URL 확인
PROD_URL=$(gcloud run services describe monkos-studio --region=us-central1 --project=monkos --format='value(status.url)')
echo "prod URL: ${PROD_URL}"
curl -s ${PROD_URL}/health | jq .
```

**실패 시**: `⏳ 대기` 보고. Phase 2 진행 금지.

### Phase 2: `studio.monkos.ai` 도메인 매핑

#### 2-1. 도메인 매핑 생성

```bash
gcloud beta run domain-mappings create \
  --service=monkos-studio \
  --domain=studio.monkos.ai \
  --region=us-central1 \
  --project=monkos
```

#### 2-2. DNS 레코드 추가

기존 매핑 패턴 확인 후 동일하게 등록:

```bash
# 기존 매핑의 DNS 패턴 참고
gcloud beta run domain-mappings describe \
  --domain=idphoto-kr.monkos.ai \
  --region=us-central1 \
  --project=monkos \
  --format='value(status.resourceRecords)'

# studio 도메인 매핑이 요구하는 레코드 확인
gcloud beta run domain-mappings describe \
  --domain=studio.monkos.ai \
  --region=us-central1 \
  --project=monkos \
  --format='value(status.resourceRecords)'
```

DNS 레코드 추가 (출력값에 따라 타입/값 조정):

```bash
# CNAME 방식인 경우 (기존 패턴 따름)
gcloud dns record-sets create studio.monkos.ai \
  --zone=monkos-ai \
  --type=CNAME \
  --rrdatas=ghs.googlehosted.com. \
  --ttl=300 \
  --project=monkos
```

> DNS zone 이름이 `monkos-ai`가 아닐 경우: `gcloud dns managed-zones list --project=monkos`로 확인 후 조정.

#### 2-3. 매핑 상태 확인

```bash
# ✔ 표시 나올 때까지 확인 (DNS 전파에 수 분 소요)
gcloud beta run domain-mappings list --region=us-central1 --project=monkos | grep studio
```

#### 2-4. studio.monkos.ai 헬스체크

```bash
curl -s https://studio.monkos.ai/health | jq .
```

> DNS 미전파 시: Cloud Run URL로 기능 정상 확인되면 `⏳ DNS 전파 대기` 보고 후 Phase 3 진행 가능.

### Phase 3: 어드민 포탈 Studio 링크 전환

**파일**: `monkos_AI/portal/public/admin/index.html` 126행

**현행**:
```html
<a href="https://monkos-studio-dev-933456016842.us-central1.run.app/" target="_blank" rel="noopener" class="menu-card">
```

**변경**:
```html
<a href="https://studio.monkos.ai/" target="_blank" rel="noopener" class="menu-card">
```

**변경 범위**: href URL만 교체. 나머지 HTML 변경 금지.

### Phase 4: 포탈 재배포

어드민 링크 변경 반영을 위해 포탈도 재배포:

```bash
cd /Users/developer/monk_project/monkos_AI/portal && bash deploy.sh prod
```

### Phase 5: 커밋 + 최종 검증

```bash
# admin/index.html 변경분 커밋
git add monkos_AI/portal/public/admin/index.html
git commit -m "[deploy] Studio prod 배포 + studio.monkos.ai 매핑 + 어드민 링크 전환"
git push origin main
```

최종 검증:
- `studio.monkos.ai/health` 정상
- 어드민 포탈에서 Studio 링크 클릭 → `studio.monkos.ai` 이동 확인

---

## 완료 기준

- [ ] `bash deploy.sh prod` → `monkos-studio` 서비스 신규 생성
- [ ] prod 헬스체크 정상
- [ ] `studio.monkos.ai` 도메인 매핑 생성
- [ ] DNS 레코드 등록
- [ ] `studio.monkos.ai` 접속 확인 (또는 DNS 전파 대기 보고)
- [ ] 어드민 링크 → `studio.monkos.ai` 전환
- [ ] 포탈 재배포
- [ ] 커밋 + 푸시
- [ ] 완료 보고 — prod URL + 도메인 매핑 상태 + 헬스체크 결과

**완료 레벨**: 실행+검증

---

## 규칙

- **브랜치**: main
- **커밋**: `[deploy] Studio prod 배포 + studio.monkos.ai 매핑 + 어드민 링크 전환`
- **금지**: server.js 수정, 키 값 노출, dev 서비스 삭제
- **.env는 커밋 대상 아님**
- **에스컬레이션**: DNS/도메인 매핑 권한 문제 시 `⏳ 대기` 보고
- **완료 보고**: `✅❌💡⏳📁🔀` 형식
- **헌법 제4조 1항 준수**: 키 값 보고서 기재 금지
