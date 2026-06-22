---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내2
status: 대기
portfolio: PF_INFRA
---

# 지시서: geoip-lite 결제 국가 판별 도입 (P1-c)

## 배경
- 현재 결제 국가 판별이 클라이언트 타임존 기반 (`i18n.js detectRegion()`) — 이미 P1-a에서 폐기됨
- `credits.js`의 `region` 변수가 토스(KR) vs LINE Shop(글로벌) 분기에 사용됨
- 서버단에서 IP 기반 국가 판별로 전환 필요
- 설계서: `DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md` §2 축B 참조

## 작업 항목

### 1. geoip-lite 설치

```bash
cd monkos_AI/portal && npm install geoip-lite
```

### 2. server.js — 결제 국가 판별 함수 추가

**파일**: `monkos_AI/portal/server.js`

```javascript
import geoip from 'geoip-lite';

function detectPaymentRegion(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const geo = geoip.lookup(ip);
  return (geo?.country === 'KR') ? 'kr' : 'global';
}
```

GET 요청 미들웨어(detectLang 옆)에 추가:

```javascript
if (req.method === 'GET') {
  req.lang = detectLang(req);
  req.paymentRegion = detectPaymentRegion(req);
  // ... 기존 쿠키 세팅
}
```

### 3. SSR에 `__REGION__` 주입 — IP 기반으로 전환

현재 `__REGION__`이 lang 기반(`lang === 'ko' ? 'kr' : 'global'`)으로 주입되고 있음.
이것을 `req.paymentRegion` 기반으로 변경:

**render-shell.js layoutShell**:
```javascript
// 변경 전
window.__REGION__='${region}';
// 변경 후
window.__REGION__='${paymentRegion || region}';
```

layoutShell에 `paymentRegion` 파라미터 추가 또는, server.js에서 렌더 함수 호출 전에 `res.locals.paymentRegion = req.paymentRegion`으로 전달.

### 4. credits.js — 서버 주입값 우선 사용 확인

P1-a에서 이미 `var region = window.__REGION__ || ...`으로 변경됨. `__REGION__`이 IP 기반으로 바뀌면 자동 적용.

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- geoip-lite MaxMind DB는 패키지에 내장 (외부 API 호출 없음)
- 로컬 개발 시 localhost IP → null → 'global' 폴백 (정상)

## 검증
- [ ] 한국 IP 접속 → `__REGION__='kr'` → 충전 모달에 토스 상품 표시
- [ ] 해외 IP (VPN 등) 접속 → `__REGION__='global'` → LINE Shop 상품 표시
- [ ] 기존 한국 사용자 결제 흐름 regression 없음

## 대상 파일
1. `monkos_AI/portal/package.json` — geoip-lite 추가
2. `monkos_AI/portal/server.js` — detectPaymentRegion + 미들웨어
3. `monkos_AI/portal/lib/cms/render-shell.js` — `__REGION__` IP 기반 전환
