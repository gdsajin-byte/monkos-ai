---
type: report
date: 2026-06-12
from: iMac/막내1
to: iMac/쌍아
status: 완료
subject: "[긴급] idphoto 생성 장애 전수조사 A — 프론트+크레딧API 인증 체인 분석"
portfolio: PF_IDPHOTO
priority: P0
---

# [긴급] idphoto 생성 장애 전수조사 A

> **[2026-06-12 18:13 KST]** iMac/막내1 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내1_긴급_idphoto생성장애_전수조사A.md`
> 감사 방식: 읽기 전용 (코드 수정 금지)

---

## 근본 원인 (ROOT CAUSE)

### 🚨 인증 서명 키 불일치 — portal의 authSecret 전환으로 기존 세션 토큰 전부 무효화

**코드 경로**:

portal `config.js`:
```javascript
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET;
```

**환경 실측** (gcloud run services describe, 읽기 전용):

| 서비스 | AUTH_SECRET | LEMONSQUEEZY_WEBHOOK_SECRET | 실제 authSecret |
|--------|------------|---------------------------|----------------|
| **portal** | ✅ 설정됨 (값 상이) | ✅ 설정됨 | **AUTH_SECRET** (우선) |
| **idphoto-kr** | ❌ 미설정 | ❌ 미설정 | **''** (빈 문자열) |

**장애 메커니즘**:

```
[Before 6/10]
  portal authSecret = LEMONSQUEEZY_WEBHOOK_SECRET (AUTH_SECRET 미설정)
  토큰 서명 = HMAC(LEMONSQUEEZY_WEBHOOK_SECRET, userId:expires)
  → verify-cookie 정상

[After 6/10 — C-3 패치 + AUTH_SECRET 추가]
  portal authSecret = AUTH_SECRET (AUTH_SECRET이 설정되어 우선)
  기존 토큰 서명 = HMAC(LEMONSQUEEZY_WEBHOOK_SECRET, ...) ← 다른 키로 서명됨
  → verifyAuthToken 실패 → verify-cookie 401 → store.user.credits = 0
```

**증상 재현 경로**:

1. `sharedInit()` → `initCredits()` → portal `verify-cookie` 호출
2. portal이 `verifyAuthToken(token)` 실행 → 토큰이 구 키(LEMONSQUEEZY_WEBHOOK_SECRET)로 서명됨 → AUTH_SECRET으로 검증 시도 → **실패** → `result = null`
3. `initCredits()` 응답: 401 또는 user 없음 → `store.user.credits = 0`
4. result.js 220행: `store.user.credits(0) < CREDIT_COST.generate(10)` = **true** → `showChargeModal()` → 충전 페이지 이동

**이것이 "Cr 390인데 충전 페이지로 간다"의 원인**: Firestore에는 390이 있지만, 세션 인증 실패로 프론트에 전달되지 못함.

---

## 부차 원인 (SECONDARY)

### idphoto-kr `/api/credit/use`, `/api/credit/refund` — AUTH_SECRET 미주입

5715fd96 패치가 이 두 엔드포인트에 로컬 토큰 검증을 추가:
```javascript
const localAuthSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET; // = '' (둘 다 미설정)
// verifySessionToken → !localAuthSecret → null → 403
```

idphoto-kr `deploy.sh`(line 109)는 `PROJECT_ID`, `LOCATION`, `GCS_BUCKET` 3개만 주입. AUTH_SECRET, LEMONSQUEEZY_WEBHOOK_SECRET **미주입**.

**영향**: `/api/credit/use` (다운로드 크레딧), `/api/credit/refund` 직접 호출 시 무조건 403. 단, generate 플로우는 `/api/idgen` 경유 (로컬 auth 없음)이므로 이 버그는 generate와 무관.

---

## 수정안

### 즉시 조치 (P0 — 서비스 복구)

**Option 1 (가장 빠른 복구)**: portal에서 AUTH_SECRET 제거
```bash
gcloud run services update monkos-portal --region=us-central1 \
  --remove-env-vars AUTH_SECRET
```
- 효과: `authSecret`이 LEMONSQUEEZY_WEBHOOK_SECRET으로 폴백 → 기존 토큰 검증 복구
- 리스크: 낮음 (서명 키가 원래 값으로 복귀)
- 부작용: 신규 로그인 사용자 토큰도 LEMONSQUEEZY_WEBHOOK_SECRET으로 서명됨 (정상)

**Option 2 (정리된 복구)**: AUTH_SECRET 값을 LEMONSQUEEZY_WEBHOOK_SECRET과 동일하게 설정
```bash
# 값을 Secret Manager에서 조회 후 동일 값으로 AUTH_SECRET 교체
gcloud run services update monkos-portal --region=us-central1 \
  --update-env-vars "AUTH_SECRET=<LEMONSQUEEZY_WEBHOOK_SECRET 동일값>"
```
- 효과: 동일 — 기존 토큰 검증 복구
- 장점: AUTH_SECRET 환경변수 유지

### 후속 조치 (P1 — idphoto-kr 엔드포인트 복구)

idphoto-kr `deploy.sh`에 인증 시크릿 추가:
```bash
# deploy.sh line 109 수정
--update-env-vars "PROJECT_ID=${PROJECT_ID},LOCATION=${REGION},GCS_BUCKET=${GCS_BUCKET}" \
--set-secrets="AUTH_SECRET=LEMONSQUEEZY_WEBHOOK_SECRET:latest"
```

또는 `/api/credit/use`, `/api/credit/refund`의 로컬 auth 제거 (포워딩만으로 충분):
```javascript
// 로컬 verifySessionToken 삭제 → portal이 인증 처리
const result = await useCredits(req.body.userId, req.body.type, req.headers.cookie);
```

---

## A-1~A-4 상세 분석

### A-1. 프론트 크레딧 로딩 추적

- `initCredits()` → portal `verify-cookie` (CORS OK: `Allow-Credentials: true`, origin 허용 목록 포함)
- 쿠키: `Domain=.monkos.ai; HttpOnly; SameSite=Lax` → 서브도메인 전달 ✅
- **실패 지점**: portal `verifyAuthToken(token)` — AUTH_SECRET 불일치로 null 반환
- `store.user.credits = 0` 설정 → 220행 클라이언트 체크 실패

### A-2. C-2 영향 (쿠키 포워딩 추가)

- idphoto-kr `/api/idgen` → `useCredits(userId, 'generate', req.headers.cookie)` → portal
- 쿠키 포워딩 자체는 정상 (명시적 `Cookie` 헤더 설정)
- **문제는 C-2가 아닌 C-3 + AUTH_SECRET 추가의 조합**

### A-3. C-3 영향 (폴백 제거)

- C-3 이전: `authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret'`
- C-3 이후: `authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET` + `process.exit(1)`
- AUTH_SECRET 추가 시점에 따라 서명 키 전환 발생 → **근본 원인**

### A-4. 6/10 이전 정상 확인

- 6/10 이전: portal AUTH_SECRET 미설정 → `authSecret = LEMONSQUEEZY_WEBHOOK_SECRET`
- 6/10~6/11: 보안 패치 배포 + AUTH_SECRET 환경변수 추가
- 6/11~: `authSecret = AUTH_SECRET` (다른 값) → 기존 토큰 무효화

---

## 교차 감사 대기 항목

- 막내2: portal deploy.sh `--set-secrets` 전환이 AUTH_SECRET 주입 시점에 미친 영향
- 막내2: AUTH_SECRET 추가 시점 특정 (Cloud Run revision 이력)

---

**감사 완료**
**[2026-06-12 18:13 KST] iMac/막내1**
