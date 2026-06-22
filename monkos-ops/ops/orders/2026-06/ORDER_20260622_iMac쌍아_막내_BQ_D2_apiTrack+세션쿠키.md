---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기 (D1 완료 후)
portfolio: PF_PORTAL
---

# 지시서: BigQuery 유저 트래킹 D2 — /api/track 엔드포인트 + 익명 세션 쿠키

## 배경
- D1에서 BQ 테이블 + tracking.js 모듈 생성 완료 (선행)
- 클라이언트 이벤트 수신 엔드포인트 + 비가입자 추적용 세션 쿠키 필요

## 작업 항목

### 1. server.js — monkos_sid 쿠키 발급

모든 GET 요청 미들웨어(detectLang 옆)에 추가:

```javascript
import crypto from 'crypto';

// 기존 detectLang/paymentRegion 미들웨어 아래:
if (req.method === 'GET') {
  // ... 기존 lang/region 코드 ...

  // 익명 세션 쿠키 — 없으면 발급
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.monkos_sid) {
    const sid = crypto.randomUUID();
    res.setHeader('Set-Cookie', [
      res.getHeader('Set-Cookie') || [],
      `monkos_sid=${sid};Domain=.monkos.ai;Path=/;Max-Age=63072000;SameSite=Lax`
    ].flat().filter(Boolean));
    req.sessionId = sid;
  } else {
    req.sessionId = cookies.monkos_sid;
  }
}
```

Max-Age=63072000 = 2년.

### 2. server.js — POST /api/track 엔드포인트

```javascript
import { trackEvent } from './lib/tracking.js';

// API 라우팅 영역에 추가:
if (urlPath === '/api/track' && req.method === 'POST') {
  const body = await parseJsonBody(req);
  const events = body.events || [];

  // 화이트리스트 검증
  const ALLOWED_EVENTS = [
    'click_cta', 'upload_image', 'select_style',
    'open_credit_shop', 'start_payment', 'session_end',
  ];

  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.monkos_sid || null;

  // fire-and-forget — 응답을 막지 않음
  for (const evt of events) {
    if (!ALLOWED_EVENTS.includes(evt.event_name)) continue;
    trackEvent({
      eventName: evt.event_name,
      userId: evt.user_id || null,
      sessionId: sessionId,
      pagePath: evt.page_path || null,
      lang: evt.lang || null,
      region: evt.region || null,
      service: evt.service || 'portal',
      referer: req.headers.referer || null,
      userAgent: req.headers['user-agent'] || null,
      ipCountry: req.paymentRegion || null,
      params: evt.params || null,
    }).catch(() => {});
  }

  res.writeHead(204);
  return res.end();
}
```

- 클라이언트 이벤트만 수신 (서버 이벤트는 D3에서 직접 적재)
- event_name 화이트리스트로 오염 방지 (헌법 4조 4항)
- fire-and-forget — BQ 적재 실패해도 204 반환 (유저 UX 영향 없음)

### 3. 클라이언트 비콘 헬퍼

**새 파일**: `monkos_AI/portal/public/js/track.js`

```javascript
(function() {
  window.monkTrack = function(eventName, params) {
    var payload = JSON.stringify({
      events: [{
        event_name: eventName,
        user_id: (typeof currentUser !== 'undefined' && currentUser) ? currentUser.id : null,
        page_path: location.pathname,
        lang: window.__LANG__ || 'ko',
        region: window.__REGION__ || 'kr',
        service: 'portal',
        params: params || {},
      }]
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
    }
  };
})();
```

### 4. 모든 SSR 페이지에 track.js 로드

**render-shell.js layoutShell** — `</body>` 직전에 추가:
```html
<script src="/js/track.js"></script>
```

**render-headshot.js** — 동일하게 `</body>` 직전에 추가.

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- /api/track은 인증 불필요 (익명 포함) — rate-limit 검토 (D7 범위)

## 검증
- [ ] 페이지 접속 시 `monkos_sid` 쿠키 발급 확인 (DevTools)
- [ ] 재접속 시 동일 `monkos_sid` 유지
- [ ] 콘솔에서 `monkTrack('click_cta', {button_id: 'test'})` 호출 → 204 응답
- [ ] BQ에서 `SELECT * FROM monkos.monkos_tracking.events WHERE event_name='click_cta'` 조회

## 대상 파일
1. `monkos_AI/portal/server.js` — monkos_sid 쿠키 + /api/track 엔드포인트
2. `monkos_AI/portal/public/js/track.js` — **신규** (클라 비콘 헬퍼)
3. `monkos_AI/portal/lib/cms/render-shell.js` — track.js 로드 태그
4. `monkos_AI/portal/lib/cms/render-headshot.js` — track.js 로드 태그
