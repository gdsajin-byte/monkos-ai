---
type: ORDER
date: 2026-03-06
from: M1/쌍아
to: 막내2
scope: OAuth 리다이렉트 2건 수정 + 로그인 프로바이더 아이콘 + 포털 크레딧 💎→Cr 전환
prerequisite: 막내2 OAuth 전수조사 보고서 기반
ref: 2026-03-06 09:50 KST 작가님 지시
---

# 지시서: OAuth 수정 + 포털 크레딧 디자인 전환

> **[2026-03-06 09:50 KST] M1/쌍아 → 막내2**

---

## 배경

1. OAuth 리다이렉트 버그 2건 (전수조사에서 특정)
2. LINE 로그인인데 구글 로고 표시되는 프로바이더 아이콘 버그
3. 포털에 💎 다이아몬드 크레딧 표기가 v3 Cr 코인으로 미전환

---

## Phase A: OAuth 리다이렉트 수정

### BUG 1 — postMessage targetOrigin 불일치 (P1)

**파일:** `idphoto-kr/public/modules/gate.js`

현행: `redirect_app=idphoto-kr` (짧은 이름)
→ auth.js에서 ALLOWED_POPUP_ORIGINS 매칭 실패 → `https://monkos.ai`로 폴백

**수정:** `redirect_app`을 full origin URL로 변경

```
redirect_app=https://idphoto-kr.monkos.ai
```

Kakao, LINE 둘 다 동일하게 수정.

**파일:** `portal/lib/auth.js`

targetOrigin 매핑 로직에서 `redirect_app`이 full URL일 때 `ALLOWED_POPUP_ORIGINS`에서 정확히 매칭되도록 확인. 필요 시 매핑 로직 보정.

### BUG 2 — non-popup 폴백 포털 이동 (P0)

**파일:** `portal/lib/auth.js`
- Kakao: L154 부근
- LINE: L328 부근

현행 (non-popup 분기):
```javascript
location.href = '/';
```

수정:
```javascript
location.href = redirectApp || '/';
```

`redirectApp`은 state에서 디코딩한 값. full origin URL이면 해당 앱으로 복귀, 없으면 포털 루트 폴백.

> state 파라미터에 `redirectApp`이 이미 인코딩되어 있는지 확인. 안 되어 있으면 non-popup 폴백 시에도 `redirect_app` 쿼리 파라미터를 전달하도록 gate.js 수정.

---

## Phase B: 로그인 프로바이더 아이콘

### 현황

포털 헤더에서 로그인 후 프로바이더 아이콘이 실제 로그인 수단과 무관하게 구글 로고로 표시됨.

### 수정

**파일:** `portal/public/index.html` (또는 관련 JS)

로그인 시 사용자 정보에 `provider` 필드가 포함되어 있는지 확인:
- `auth.js`에서 Firestore에 저장하는 사용자 데이터에 `provider: 'google' | 'kakao' | 'line'` 필드 존재 여부
- 프론트에서 `provider` 기반으로 아이콘 분기

프로바이더별 아이콘:
- Google: 구글 G 로고 (현행)
- Kakao: 카카오 말풍선 또는 K
- LINE: LINE 로고 (초록)

> provider 필드가 Firestore에 없으면 auth.js에서 저장 시 추가 필요.

---

## Phase C: 포털 크레딧 💎 → Cr 전환

### 현황

`portal/public/index.html`에 💎 다이아몬드 아이콘 다수 잔존:
- L1204: `<span class="credit-diamond">💎</span>`
- L1377: `💎 <span id="shopTitle">Credit Shop</span>`
- L1709~1715: KR 상품 `💎 10 크레딧`, `💎 30 크레딧`, `💎 50 크레딧`
- L1726~1732: Global 상품 `💎 10 Credits`, `💎 30 Credits`, `💎 50 Credits`
- L226: `.credit-diamond` CSS

### 수정

1. 모든 `💎` → `Cr` 텍스트 또는 Cr 코인 아이콘으로 교체
2. `.credit-diamond` CSS 클래스 → `.credit-badge` 또는 적절한 v3 클래스로 변경
3. 상품 가격도 v3 기준으로 갱신:

| 상품 | 현행 (포털) | v3 정가 |
|------|-----------|---------|
| 단건 | 💎 10 크레딧 ₩12,900 | 70c(+10 bonus) ₩9,900 |
| 패키지1 | 💎 30 크레딧 ₩29,900 | 100c(+30 bonus) ₩12,900 |
| 패키지2 | - | 300c(+120 bonus) ₩34,900 |
| 패키지3 | 💎 50 크레딧 ₩45,900 | 500c(+250 bonus) ₩49,900 |
| 소액 | - | 10c ₩1,450 |

> idphoto-kr의 `modules/charge.js` CHARGE_OPTIONS와 `portal/lib/shared/config.js` PRODUCTS를 참조하여 정확한 v3 상품으로 동기화.

4. Global(USD) 상품도 현행 레몬스퀴지 설정과 동기화 확인

---

## 검증 (완료 조건)

| # | 항목 |
|---|------|
| 1 | idphoto-kr에서 LINE 로그인 → idphoto-kr로 복귀 (포털 아님) |
| 2 | idphoto-kr에서 Kakao 로그인 → idphoto-kr로 복귀 |
| 3 | postMessage 정상 전달 (팝업 모드) |
| 4 | 팝업 차단 시에도 원래 앱으로 복귀 (non-popup 폴백) |
| 5 | 로그인 후 프로바이더에 맞는 아이콘 표시 (LINE=초록, Kakao=노랑, Google=G) |
| 6 | 포털에 💎 0건 (전수 grep 확인) |
| 7 | 포털 상품 목록 v3 가격 일치 |

---

## 수정 파일 목록 (예상)

| # | 파일 | Phase |
|---|------|-------|
| 1 | `idphoto-kr/public/modules/gate.js` | A (redirect_app full URL) |
| 2 | `portal/lib/auth.js` | A (non-popup 폴백 + targetOrigin) |
| 3 | `portal/public/index.html` | B (프로바이더 아이콘) + C (💎→Cr + v3 가격) |
