---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기 (D2 완료 후)
portfolio: PF_PORTAL
---

# 지시서: BigQuery 유저 트래킹 D3 — 서버단 이벤트 적재

## 배경
- D2에서 /api/track + monkos_sid + tracking.js 완료 (선행)
- 서버에서 발생하는 핵심 전환 이벤트를 BQ에 직접 적재

## 작업 항목

### 1. page_view — createServer 핸들러

**파일**: `monkos_AI/portal/server.js`

모든 SSR GET 렌더 요청에서 page_view 적재. 라우팅 매칭 후, 렌더 함수 호출 직전 또는 직후에 fire-and-forget:

```javascript
import { trackEvent, linkIdentity } from './lib/tracking.js';

// SSR 렌더 시 (예: renderHome 호출 부근)
// 공통 헬퍼:
function trackPageView(req) {
  trackEvent({
    eventName: 'page_view',
    userId: req.userId || null,
    sessionId: req.sessionId,
    pagePath: req.url.split('?')[0],
    lang: req.lang,
    region: req.paymentRegion,
    service: 'portal',
    referer: req.headers.referer || null,
    userAgent: req.headers['user-agent'] || null,
    ipCountry: req.paymentRegion,
  }).catch(() => {});
}
```

**삽입점**: API 엔드포인트(`/api/*`)는 제외. SSR 페이지 렌더(홈, headshot, blog, specs, faq, pricing, board, gallery, guide 등)에만 삽입. 가장 간단한 방법은 라우팅 분기 직전에 SSR 경로인지 판별 후 일괄 호출.

### 2. auth_login / auth_signup — 인증 핸들러

로그인/가입 성공 시점에 적재. 각 auth 핸들러(Google, Kakao, LINE) 콜백에서:

```javascript
// 로그인 성공 시
trackEvent({
  eventName: isNewUser ? 'auth_signup' : 'auth_login',
  userId: userId,
  sessionId: req.sessionId,
  pagePath: '/auth/callback',
  lang: req.lang,
  region: req.paymentRegion,
  service: 'portal',
  params: { provider: 'google' }, // or 'kakao', 'line'
}).catch(() => {});

// 가입 시 identity 매핑
if (isNewUser || true) {  // 로그인마다 매핑 (중복 허용, 조인 키)
  linkIdentity(req.sessionId, userId).catch(() => {});
}
```

**삽입점 파일**: auth 관련 핸들러가 있는 파일을 확인하여 적용.
- Google: `handleGoogleRedirectCallback`
- Kakao: `handleKakaoCallback`  
- LINE: `handleLineCallback`

### 3. credit_charge — 결제 확인

`handleTossConfirm` (payments.js) 성공 시:
```javascript
trackEvent({
  eventName: 'credit_charge',
  userId: userId,
  sessionId: null, // 서버단이라 쿠키 접근 필요 시 req에서 추출
  service: 'portal',
  params: { amount: credits, provider: 'toss', order_id: orderId, price: amount },
}).catch(() => {});
```

LemonSqueezy 웹훅 성공 시도 동일 패턴.

### 4. credit_use — 크레딧 사용

`handleCreditsUse` (credits.js) 성공 시:
```javascript
trackEvent({
  eventName: 'credit_use',
  userId: userId,
  service: 'portal',
  params: { amount: cost, use_type: type }, // type: 'generate' or 'download'
}).catch(() => {});
```

### 5. api_generate — AI 생성 요청

헤드샷 `/api/headshot/generate` 성공 시 (server.js):
```javascript
trackEvent({
  eventName: 'api_generate',
  userId: userId,
  sessionId: req.sessionId,
  service: 'headshot',
  params: { style: purpose, model: model },
}).catch(() => {});
```

## ⚠️ 준수 조항
- 모든 trackEvent 호출은 **fire-and-forget** — catch로 무시. BQ 장애가 서비스에 영향 주면 안 됨
- email 원문 BQ 적재 금지 — userId만 (헌법 4조)
- 배포: `deploy.sh` 경유 (ch5 2조)

## 검증
- [ ] 페이지 접속 → BQ events에 page_view 행 확인
- [ ] 로그인 → auth_login 행 + identity_map 행 확인
- [ ] 헤드샷 생성 → api_generate 행 확인
- [ ] 기존 서비스 동작 regression 없음 (BQ 장애 시에도 정상)

## 대상 파일
1. `monkos_AI/portal/server.js` — page_view + api_generate 적재
2. `monkos_AI/portal/lib/payments.js` — credit_charge 적재
3. `monkos_AI/portal/lib/credits.js` — credit_use 적재
4. auth 핸들러 파일(들) — auth_login/signup + linkIdentity
