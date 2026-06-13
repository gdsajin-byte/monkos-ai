---
type: report
date: 2026-06-12
from: iMac/막내2
to: iMac/쌍아
status: 완료
subject: "[긴급] idphoto 생성 장애 전수조사 B — 서버 인증+배포 환경+Cloud Run 실측"
portfolio: PF_IDPHOTO
priority: P0
---

# idphoto 생성 장애 전수조사 B — 서버 인증 + 배포 환경 + Cloud Run 실측

> **[2026-06-12 18:16 KST]** iMac/막내2 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내2_긴급_idphoto생성장애_전수조사B.md`

---

## 🚨 원인 특정: 배포 시차 — portal 보안 패치 배포 vs idphoto-kr 미배포

### 장애 인과 체인

```
[1] 5715fd96 (6/10) — portal credits API에 인증 미들웨어 추가 (쿠키 필수)
                      + idphoto-kr에 쿠키 포워딩 추가
[2] portal rev 00286 (6/11 16:52 KST) — 보안 패치 포함 배포 ✅
[3] idphoto-kr rev 00192 (6/9 15:25 KST) — 보안 패치 이전 코드 그대로 ❌
                                           ↑ 쿠키 포워딩 없는 구버전
[4] 사용자 생성 요청
    → idphoto-kr(구) useCredits(userId, 'generate') — 쿠키 미전달
    → portal(신) getAuthenticatedUserId() — 쿠키 없음 → 403 '인증 필요'
    → idphoto-kr → 402 반환 → 생성 실패
```

### 배포 이력 대조 (B-4)

| 서비스 | 현재 rev | 배포 시각 | 5715fd96 포함 |
|--------|---------|----------|--------------|
| **monkos-portal** | 00286 | 2026-06-11 16:52 KST | ✅ 포함 |
| **monkos-idphoto-kr** | 00192 | 2026-06-09 15:25 KST | ❌ **미포함** |

---

## B-1. portal 서버 인증 로직 전수

### handleVerifyCookie (auth.js L790)

`parseCookies(req.headers.cookie)` → `monkos_session` 추출 → `verifyAuthToken(token)` → Firestore 조회 → credits 반환. **정상 동작.**

### verifyAuthToken (config.js L210)

`0d43fde6`에서 timingSafeEqual 전환:
- `Buffer.from(sig, 'hex')` → `Buffer.from(expectedSig, 'hex')` → `timingSafeEqual` 비교
- **인코딩 불일치 없음**: 양쪽 모두 hex→Buffer 변환 후 비교. 정상.

### AUTH_SECRET 로딩 (config.js L27-35)

```
AUTH_SECRET = process.env.AUTH_SECRET || ''
authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET
if (!authSecret) → process.exit(1)
```

- portal Cloud Run 환경변수에 AUTH_SECRET **존재** (plaintext env var)
- LEMONSQUEEZY_WEBHOOK_SECRET도 존재 (폴백 불필요)
- **서버 정상 기동** — AUTH_SECRET이 있으므로 exit(1) 미도달

### 결론 B-1

portal 인증 로직 자체에 결함 없음. timingSafeEqual 전환 정상. AUTH_SECRET 로딩 정상.

---

## B-2. credits.js 인증 미들웨어

### `getAuthenticatedUserId(req)` (credits.js L5-11)

`5715fd96` (C-2)에서 추가:
```js
parseCookies(req.headers.cookie) → monkos_session → verifyAuthToken(token) → userId
```

- handleCreditsGet, handleCreditsUse, handleCreditsRefund **모두** 이 미들웨어 통과 필수
- 쿠키 없으면 → `return null` → 403 `'인증 필요'`

### idphoto-kr→portal 크레딧 호출 경로

**배포된 코드 (rev 00192, 5715fd96 이전)**:
```js
useCredits(userId, 'generate')  // 2인자 — 쿠키 미전달
```

**git 현재 코드 (5715fd96 이후)**:
```js
useCredits(userId, 'generate', req.headers.cookie)  // 3인자 — 쿠키 전달
```

배포된 구버전은 portal에 쿠키를 보내지 않으므로 portal이 403 반환.

### CORS (B-5)

- `ALLOWED_ORIGINS`에 `idphoto-kr.monkos.ai` 포함 ✅
- `Access-Control-Allow-Credentials: true` 설정 ✅
- 5715fd96 전후 CORS 변경 없음

**단, 이번 장애는 CORS 문제가 아님** — idphoto-kr 서버가 직접 portal API를 호출하는 server-to-server 통신이므로 CORS 무관.

---

## B-3. Cloud Run 환경변수 실측

### monkos-portal

| 변수 | 존재 | 주입 방식 |
|------|------|----------|
| AUTH_SECRET | ✅ | plaintext env var |
| LEMONSQUEEZY_WEBHOOK_SECRET | ✅ | plaintext env var |
| CHAT_API_KEY | ✅ | Secret Manager ref |
| NAVER_CLIENT_SECRET | ✅ | Secret Manager ref |
| ADMIN_UIDS | ✅ | Secret Manager ref |
| AGENT_API_KEYS | ✅ | Secret Manager ref |
| (기타 14개) | ✅ | plaintext env var |

### monkos-idphoto-kr

| 변수 | 존재 | 비고 |
|------|------|------|
| PROJECT_ID | ✅ | |
| LOCATION | ✅ | |
| GCS_BUCKET | ✅ | |
| GEMINI_API_KEY | ✅ | plaintext |
| AUTH_SECRET | ❌ **미설정** | 🚨 |
| LEMONSQUEEZY_WEBHOOK_SECRET | ❌ **미설정** | 🚨 |

→ idphoto-kr에 AUTH_SECRET이 없으므로 `localAuthSecret = ''` → `verifySessionToken()` 항상 null 반환.

### 영향 범위

| 엔드포인트 | 영향 | 설명 |
|-----------|------|------|
| `/api/idgen` | ⚠️ 간접 | credits 호출이 portal에서 거절됨 (쿠키 미전달) |
| `/api/credit/use` | 🚨 직접 | 로컬 verifySessionToken 실패 → 항상 403 |
| `/api/credit/refund` | 🚨 직접 | 동일 |

---

## 수정안

### 즉시 (P0)

**idphoto-kr 및 idphoto-jp 재배포** — 현재 git 코드는 이미 쿠키 포워딩 포함:
```bash
cd monkos_AI/idphoto-kr && ./deploy.sh prod
cd monkos_AI/idphoto-jp && ./deploy.sh prod
```

이것만으로 `/api/idgen` 경로 복구 (portal이 쿠키 검증).

### 후속 (P1)

**deploy.sh에 AUTH_SECRET 추가** — `/api/credit/use`, `/api/credit/refund` 로컬 검증용:

idphoto-kr/deploy.sh의 `--update-env-vars`에 추가:
```
AUTH_SECRET=<portal과 동일한 값>
```

또는 `--set-secrets="AUTH_SECRET=AUTH_SECRET:latest"` (Secret Manager 경유 권고).

---

## 교차 감사

> 막내1 보고서(프론트+API)와 교차 예정. 막내1 보고서 대기 중이므로, 서버측 원인만 기술:

- **프론트**: 사용자 브라우저 → idphoto-kr `/api/idgen` POST (monkos_session 쿠키 포함)
- **서버**: idphoto-kr → portal `/api/credits/use` POST (쿠키 미전달)
- **장애점**: portal 403 → idphoto-kr 402 → 프론트 생성 실패

프론트 인증 실패가 있다면 이 서버측 원인과 인과 일치할 것.

---

## 준수 확인

- 4조 1항 — 키·시크릿 값 보고서 미기재 (환경변수 이름+존재 여부만) ✅
- 4조 2항 — 코드 수정 없음 (읽기 전용, 수정안을 보고) ✅

---

**[2026-06-12 18:16 KST] iMac/막내2**
