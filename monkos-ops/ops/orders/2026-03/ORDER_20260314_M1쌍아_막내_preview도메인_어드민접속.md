---
type: ORDER
id: ORDER_20260314_M1쌍아_막내_preview도메인_어드민접속
date: 2026-03-14
from: M1/쌍아
to: 막내
priority: P1
status: 대기
---

# 지시서 — preview.monkos.ai 도메인 매핑 + 어드민 접속 확보

**[2026-03-14 22:19 KST] M1/쌍아 → 막내**

---

## 배경

v4-preview URL(`v4-preview---monkos-portal-...a.run.app`)에서 어드민 접속 불가.
- `monkos_session` 쿠키가 `Domain=.monkos.ai`로 설정 → `.a.run.app`에서는 쿠키 미전송
- Kakao OAuth 콜백 URI가 `.a.run.app` 도메인에 미등록
- preview URL은 배포마다 리비전 해시 변경 → 매번 재등록 비현실적

**원칙**: 기존 인증/쿠키 로직 수정 없이 도메인 우회로 해결한다.

---

## Task 1 — Cloud DNS에 preview.monkos.ai 레코드 추가

**목표**: `preview.monkos.ai` → Cloud Run 포털 서비스로 라우팅

### 1-1. 현재 monkos.ai DNS 구조 확인

```bash
gcloud dns record-sets list --zone=[ZONE_NAME] --filter="name:monkos.ai"
```

> monkos.ai의 DNS 존 이름을 확인하여 아래에 사용할 것.

### 1-2. Cloud Run 도메인 매핑 생성

```bash
gcloud beta run domain-mappings create \
  --service monkos-portal \
  --domain preview.monkos.ai \
  --region us-central1
```

이 명령이 출력하는 CNAME 또는 A 레코드를 기록할 것.

### 1-3. DNS 레코드 추가

Cloud Run 도메인 매핑이 요구하는 레코드를 Cloud DNS에 추가:

```bash
# 예시 — 실제 값은 1-2 출력 기준
gcloud dns record-sets create preview.monkos.ai \
  --zone=[ZONE_NAME] \
  --type=CNAME \
  --ttl=300 \
  --rrdatas="ghs.googlehosted.com."
```

### 1-4. SSL 인증서 프로비저닝 대기

Cloud Run 도메인 매핑 시 자동으로 관리형 SSL 인증서가 발급됨.
완료까지 최대 15~20분 소요. 아래 명령으로 상태 확인:

```bash
gcloud beta run domain-mappings describe \
  --domain preview.monkos.ai \
  --region us-central1
```

`CertificateProvisioned: True` 될 때까지 대기.

---

## Task 2 — preview 배포가 이 도메인으로 라우팅되도록 확인

Cloud Run 도메인 매핑은 **서비스의 기본 트래픽(v3)**으로 라우팅됨.
preview(v4)를 이 도메인에서 보려면 **v4를 소량 트래픽으로 전환**하거나,
**deploy.sh preview 모드 후 traffic tag 라우팅**을 확인해야 함.

### 방안 A — v4를 1% 트래픽으로 전환 (권장)

```bash
gcloud run services update-traffic monkos-portal \
  --region us-central1 \
  --to-tags v4-preview=1
```

이후 `preview.monkos.ai`에서 v4가 1% 확률로 노출됨.
→ 어드민 작업용으로는 충분. 일반 사용자는 99% v3.

### 방안 B — 전용 서브도메인이 특정 태그로 라우팅되도록

Cloud Run의 태그 URL(`v4-preview---service.a.run.app`)은 커스텀 도메인 매핑 불가.
별도 서비스 분리가 필요하므로 현 단계에서는 방안 A로 진행.

> ⚠️ 방안 A/B 선택은 작가님 승인 후 결정. 기본은 방안 A.

---

## Task 3 — Kakao OAuth redirect URI 등록 안내

**이 작업은 작가님이 직접 수행하거나 안내에 따라 처리.**

Kakao Developers 콘솔 (`developers.kakao.com`):
1. 앱 설정 → 플랫폼 → Web → 사이트 도메인에 `https://preview.monkos.ai` 추가
2. 카카오 로그인 → Redirect URI에 `https://preview.monkos.ai/auth/kakao/callback` 추가

> 코드의 `auth.js` 20행에서 `req.headers.host` 기반으로 동적 redirect 생성하므로
> 백엔드 코드 수정 불필요. Kakao 콘솔 등록만 하면 동작.

---

## Task 4 — 검증

SSL 발급 + DNS 전파 완료 후:

- [ ] `https://preview.monkos.ai` 접속 → 포털 페이지 정상 로딩
- [ ] `https://preview.monkos.ai/admin/` 접속 → 로그인 화면 노출
- [ ] Kakao 로그인 → 어드민 대시보드 진입
- [ ] 블로그 글 작성 → 저장 → `/blog/{slug}` 접근 가능
- [ ] 쿠키 확인: `monkos_session` 쿠키가 `.monkos.ai` 도메인으로 정상 설정

---

## 완료 조건

- `preview.monkos.ai` SSL 정상 + 포털 로딩 ✅
- 어드민 로그인 + CRUD 동작 확인 ✅
- 콘솔 에러 없음 ✅

---

## 수정 대상 파일

**없음** — 코드 수정 없이 인프라(DNS + 도메인 매핑) + 외부 서비스(Kakao 콘솔) 설정만으로 해결.

## 참고 파일

| 파일 | 경로 | 참고 내용 |
|------|------|----------|
| deploy.sh | `monkos_AI/portal/deploy.sh` | preview 모드 배포 플래그 |
| auth.js | `monkos_AI/portal/lib/auth.js` | 20행: `req.headers.host` 기반 동적 redirect |
| admin-auth.js | `monkos_AI/portal/lib/cms/admin-auth.js` | `monkos_session` 쿠키 + ADMIN_UIDS 검증 |
| CONTEXT | `monkos-ops/works/portal_v4/CONTEXT_PORTAL_V4.md` | v4 전체 맥락 |
