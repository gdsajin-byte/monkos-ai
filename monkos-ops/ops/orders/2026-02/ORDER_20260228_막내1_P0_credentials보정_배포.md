---
type: order
id: ORDER_20260228_막내1_P0_credentials보정_배포
date: 2026-02-28 14:50 KST
from: iMac/쌍아
to: 막내1
priority: P0
status: pending
---

# 지시서: gate.js credentials 보정 (1건)

> **[2026-02-28 14:50 KST] iMac/쌍아 → 막내1**
> **긴급도**: P0 — 교차 누락 수정. iOS 수정 커밋(cbea666)에서 신설한 함수에 credentials 누락.
> **엔드라인**: 수정 → 커밋+push → 완료 보고
> **배포는 쌍아가 진행**

---

## 1. 수정 내용 (1건)

### gate.js `_startGoogleLoginSimple()` — credentials 추가

**파일**: `monkos_AI/idphoto-kr/public/modules/gate.js`
**위치**: `_startGoogleLoginSimple()` 함수 내 fetch 호출 (약 526행)

**현재 코드:**
```javascript
const res = await fetch(`${API.PORTAL_URL}/api/auth/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ access_token: tokenResponse.access_token }),
});
```

**수정 코드:**
```javascript
const res = await fetch(`${API.PORTAL_URL}/api/auth/google`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ access_token: tokenResponse.access_token }),
});
```

**근거**: 막내2가 동일 패턴을 index.html과 shared.js에서 수정(154ff65). 이 함수는 cbea666에서 신설되어 교차 누락됨.

---

## 2. 캐시 버전 업데이트

수정이 1건이라도 iOS 캐시 갱신을 위해 버전 업 필요:

| 파일 | 현재 | 변경 |
|------|------|------|
| `public/result.html` | `?v=fix02` | `?v=fix03` |
| `public/camera.html` | `?v=fix02` | `?v=fix03` |
| `public/prep.html` | `?v=fix02` | `?v=fix03` |
| `public/thankyou.html` | `?v=fix02` | `?v=fix03` |

---

## 3. 작업 절차

```
1. git pull origin develop
2. gate.js credentials 추가
3. HTML 4개 캐시 버전 fix02 → fix03
4. 커밋 + push (1커밋)
5. 완료 보고
```

---

## ⚠️ 준수 조항

- **ch7 1조**: main 머지 + 배포 금지 — develop push까지
- **ch7 3조**: 지정된 수정만 수행 — 추가 변경 금지
