---
type: order
date: 2026-03-07
from: iMac/쌍아
to: iMac/막내4
status: 발행
---

# 지시서: Portal API fetch timeout + sessionStorage 잔류 수정

**[2026-03-07 17:28 KST] iMac/쌍아 → iMac/막내4**

## 배경

1. **fetch 무한 대기**: monkos.ai 도메인 장애 시 `shared.js`의 Portal API fetch가 timeout 없이 무한 대기 → sharedInit() 멈춤 → 페이지 전체 블랙 화면
2. **sessionStorage 잔류**: thankyou → 홈 → 재촬영 시, 이전 `generated` 데이터가 sessionStorage에 남아있어 옛 결과물을 다시 표시

## 작업 내용

### Phase 1: fetchWithTimeout 유틸 함수 추가

`shared.js` 상단(import 직후)에 timeout 래핑 함수 추가:

```javascript
// ─── fetch timeout 래퍼 ───
function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}
```

### Phase 2: Portal API fetch 4곳 교체

`fetch(` → `fetchWithTimeout(` 으로 변경. **대상만 교체, 나머지 로직/try-catch 건드리지 말 것.**

| 라인 | 함수 | URL 패턴 | timeout |
|------|------|---------|---------|
| ~201 | `initFromTossResult()` | `/api/payments/toss/confirm` | 15000 (결제는 넉넉하게) |
| ~230 | `initFromUrlToken()` | `/api/auth/verify?token=` | 5000 (기본값) |
| ~247 | `initCredits()` | `/api/auth/verify-cookie` | 5000 (기본값) |
| ~275 | `fetchLatestCredits()` | `/api/credits?userId=` | 5000 (기본값) |

**교체 예시 (initCredits):**
```javascript
// Before
const res = await fetch(`${API.PORTAL_URL}/api/auth/verify-cookie`, {
  credentials: 'include',
});

// After
const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/auth/verify-cookie`, {
  credentials: 'include',
});
```

**Toss 결제 확인은 15초:**
```javascript
const res = await fetchWithTimeout(`${API.PORTAL_URL}/api/payments/toss/confirm`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId: store.user.id }),
}, 15000);
```

### Phase 3: sessionStorage 잔류 이미지 클리어

`camera.js` — init() 함수에서 **스탠바이 화면 표시 직전**에 이전 결과물 제거:

```javascript
// ── 이전 결과물 제거 (재촬영 시 옛 generated 잔류 방지) ──
saveSessionData('generated', null);
saveSessionData('cropped', null);
```

위치: `renderSelectionSummary()` 호출 후, `document.querySelector('#standby-screen')?.classList.add('active')` 직전.

### Phase 4: 검증

- `shared.js` 문법 에러 없는지 확인
- `camera.js` 문법 에러 없는지 확인
- 기존 try/catch 블록이 AbortError도 잡는지 확인 (기존 catch(e) 구조면 자동으로 잡힘)

## ⚠️ 준수 조항

- **헌법 6조**: API 키, 환경변수 건드리지 말 것
- **헌법 8조**: 기존 코드 삭제 금지. fetch → fetchWithTimeout 교체 + sessionStorage 클리어 추가만
- **법률 2장**: 지정된 수정 범위 외 코드 변경 금지

## 산출물

- `monkos_AI/idphoto-kr/public/shared.js` (수정 — fetchWithTimeout 추가 + fetch 4곳 교체)
- `monkos_AI/idphoto-kr/public/camera.js` (수정 — init()에 sessionStorage 클리어 2줄 추가)

## 커밋

```
[fix] fetch timeout 방어코드 + sessionStorage 잔류 이미지 클리어
```
