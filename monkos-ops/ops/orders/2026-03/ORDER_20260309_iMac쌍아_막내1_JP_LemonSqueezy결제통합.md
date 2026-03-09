---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: iMac/막내1
scope: JP Lemon Squeezy 결제 통합 — Toss 전면 제거 + config v3 보정 + Portal VARIANT_CREDITS 갱신
priority: P0
---

# 지시서: JP Lemon Squeezy 결제 통합

> **[2026-03-09 15:20 KST] iMac/쌍아 → iMac/막내1**
> Round 2 — 결제 파이프라인 전환

---

## 배경

Round 1에서 idphoto-jp 프론트엔드 현지화가 완료되었으나, 결제 시스템이 KR의 TossPayments 코드를 그대로 가져온 상태이다. 또한 config.js의 CREDIT_COST와 CHARGE_OPTIONS이 v0.79 기준 잘못된 값으로 설정되어 있다.

**포탈(monkos.ai)에 이미 Lemon Squeezy 인프라가 완비**되어 있다:
- `portal/lib/payments.js` → `handleCheckout()` (체크아웃 URL 생성) + `handleLemonSqueezyWebhook()` (HMAC 검증 + 크레딧 지급)
- `portal/server.js` → `/api/checkout`, `/api/webhooks/lemonsqueezy` 라우트 존재
- CORS → `idphoto-jp.monkos.ai` 이미 허용

따라서 idphoto-jp 서버에 결제 엔드포인트를 추가하지 않는다. **프론트엔드에서 포탈 API를 호출**하는 구조.

---

## Phase A: Portal config 갱신 (1파일)

### A-1. `portal/lib/shared/config.js`

**VARIANT_CREDITS** — 구 3상품 제거, v3 JP 5상품 매핑:

```js
// 변경 전
export const VARIANT_CREDITS = {
  '1297524': 10,
  '1297532': 30,
  '1297531': 50,
};

// 변경 후
export const VARIANT_CREDITS = {
  // JP v3 상품 (Lemon Squeezy Variant ID → 총 크레딧)
  '1382355': 10,    // topup_10: ¥150, 10c+0
  '1382367': 80,    // single_70: ¥990, 70c+10
  '1382348': 130,   // package_100: ¥1,490, 100c+30
  '1382362': 420,   // package_300: ¥3,990, 300c+120
  '1382436': 750,   // package_500: ¥5,990, 500c+250
};
```

**LEMONSQUEEZY_STORE_ID** — `290457` → 작가님이 제공할 JP Store ID로 교체:
- 대시보드에서 Store ID 확인 필요 — 이 값은 커밋 전 작가님에게 확인할 것
- 확인 전까지 `290457` 유지 (기존값이 JP 스토어일 수 있음)

> ⚠️ PRODUCTS, TOSS_AMOUNT_CREDITS 등 KR 전용 상수는 변경하지 않는다. KR 결제가 깨진다.

---

## Phase B: idphoto-jp config.js 보정 (1파일)

### B-1. `idphoto-jp/public/config.js`

**1) CREDIT_COST 보정** — KR v3과 동일:

```js
// 변경 전
export const CREDIT_COST = {
  generate: 1,
  download: 10,
  extraCrop: 1,
  fullOriginal: 1,
};

// 변경 후
export const CREDIT_COST = {
  generate: 10,
  download: 70,
  extraCrop: 10,
  fullOriginal: 10,
};
```

**2) TOSS_CLIENT_KEY 삭제:**

```js
// 삭제
export const TOSS_CLIENT_KEY = 'test_ck_6bJXmgo28eBJk12vvDAW3LAnGKWx';
```

**3) CHARGE_OPTIONS v3 교체** — variant ID 포함:

```js
// 변경 전
export const CHARGE_OPTIONS = [
  { key: 'single_10', label: '10 クレジット', price: 1500, credits: 10, bonus: 0 },
  { key: 'package_30', label: '30 クレジット', price: 3800, credits: 30, bonus: 5, best: true },
  { key: 'package_50', label: '50 クレジット', price: 6000, credits: 50, bonus: 10 },
  { key: 'package_100', label: '100 クレジット', price: 10000, credits: 100, bonus: 30 },
];

export const JPY_PER_CREDIT = 150;

// 변경 후
export const CHARGE_OPTIONS = [
  { key: 'single_70', variantId: '1382367', label: '1枚分 (70+10ボーナス)', price: 990, credits: 70, bonus: 10 },
  { key: 'package_100', variantId: '1382348', label: '100クレジット+30ボーナス', price: 1490, credits: 100, bonus: 30, best: true },
  { key: 'package_300', variantId: '1382362', label: '300クレジット+120ボーナス', price: 3990, credits: 300, bonus: 120 },
  { key: 'package_500', variantId: '1382436', label: '500クレジット+250ボーナス', price: 5990, credits: 500, bonus: 250 },
  { key: 'topup_10', variantId: '1382355', label: '10クレジット', price: 150, credits: 10, bonus: 0 },
];

export const JPY_PER_CREDIT = 15;
```

**4) 주석 보정:**
```js
// 삭제: "// TossPayments (Round 2でLemon Squeezyに移行予定 — 現状維持)"
// 변경: "// ─── チャージ商品 ..." 주석의 내용 보정
```

---

## Phase C: shared.js 결제 로직 전환 (1파일)

### C-1. `idphoto-jp/public/shared.js`

**1) import 정리** — TOSS_CLIENT_KEY 제거:

```js
// 변경 전
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  ...
} from './config.js';

// 변경 후
import {
  API, CREDIT_COST, PHOTO_SPECS, TX, t,
  ...
} from './config.js';
```

**2) re-export 정리** — TOSS_CLIENT_KEY 제거:

```js
// 변경 전
export {
  Monk, API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  ...
};

// 변경 후
export {
  Monk, API, CREDIT_COST, PHOTO_SPECS, TX, t,
  ...
};
```

**3) buyCreditsJP() 전면 재작성:**

```js
// ─── 決済 (Lemon Squeezy Overlay — Portal API 経由) ───
export async function buyCreditsJP(opt) {
  // opt = CHARGE_OPTIONS 요소: { key, variantId, price, credits, bonus }
  if (!store.user.id) {
    import('./modules/gate.js').then(m => {
      m.GateModule.showLoginRequired('クレジットチャージにはログインが必要です\n初回ログインで10cプレゼント！', () => {
        buyCreditsJP(opt);
      });
    });
    return;
  }

  closeCreditModal();

  try {
    // Portal에 체크아웃 URL 요청
    const res = await fetch(`${API.PORTAL_URL}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        variantId: opt.variantId,
        userId: store.user.id,
        email: store.user.email || undefined,
      }),
    });

    const data = await res.json();
    if (!data.url) {
      alert('決済の準備に失敗しました。しばらくしてからお試しください。');
      return;
    }

    // Lemon.js Overlay로 결제 화면 표시
    if (window.LemonSqueezy) {
      window.LemonSqueezy.Url.Open(data.url);
    } else {
      // Lemon.js 미로드 시 새 탭으로 폴백
      window.open(data.url, '_blank');
    }
  } catch (err) {
    Monk.log('決済エラー: ' + err.message);
    alert('決済エラーが発生しました。もう一度お試しください。');
  }
}
```

> ⚠️ 기존 buyCreditsJP(amount, credits) 시그니처 → buyCreditsJP(opt)로 변경됨.
> charge.js에서 호출부도 반드시 수정 필요 (Phase D 참조).

**4) Toss 관련 함수 전면 삭제:**
- `_showTossLoading()` (L175~181) — 삭제
- `_hideTossLoading()` (L183~186) — 삭제
- `initFromTossResult()` (L188~229) — 삭제

**5) Lemon.js 이벤트 핸들러 추가** (삭제된 Toss 함수 자리에):

```js
// ─── Lemon Squeezy イベントハンドラ ───
export function initLemonSqueezy() {
  if (window.LemonSqueezy) {
    window.LemonSqueezy.Setup({
      eventHandler: (event) => {
        if (event.event === 'Checkout.Success') {
          Monk.log('Lemon決済完了 — クレジット更新中...');
          // Webhook에서 크레딧 지급 완료 후 Firestore 반영 → 클라이언트 갱신
          setTimeout(() => fetchLatestCredits(), 2000);
          setTimeout(() => {
            fetchLatestCredits();
            alert(`決済が完了しました！\nクレジットが追加されました。`);
          }, 4000);
        }
      },
    });
  }
}
```

**6) sharedInit() 수정:**
```js
// 변경 전 (L408)
await initFromTossResult();

// 변경 후
initLemonSqueezy();
```

**7) creditModalDesc 보정** — v3 크레딧 단가 반영:
```js
// 변경 전 (L118~120)
store.creditModalDesc = action === 'download'
    ? '写真のダウンロードには10クレジットが必要です。'
    : 'リタッチには1クレジットが必要です。';

// 변경 후
store.creditModalDesc = action === 'download'
    ? '写真のダウンロードには70クレジットが必要です。'
    : 'リタッチには10クレジットが必要です。';
```

**8) window 공개 — buyCreditsJP 유지** (시그니처 변경이지만 export명 동일)

---

## Phase D: modules/charge.js 호출부 수정 (1파일)

### D-1. `idphoto-jp/public/modules/charge.js`

**1) import 정리** — TOSS_CLIENT_KEY 제거:
```js
// 변경 전
import { store, Monk, TOSS_CLIENT_KEY, closeCreditModal, buyCreditsJP, CHARGE_OPTIONS, JPY_PER_CREDIT } from '../shared.js';

// 변경 후
import { store, Monk, closeCreditModal, buyCreditsJP, CHARGE_OPTIONS, JPY_PER_CREDIT } from '../shared.js';
```

**2) buyCreditsJP 호출부 수정:**
- 기존: `buyCreditsJP(opt.price, opt.credits + opt.bonus)` (amount, credits 두 인자)
- 변경: `buyCreditsJP(opt)` (CHARGE_OPTIONS 요소 객체 전달)
- charge.js 내 buyCreditsJP 호출 패턴을 전수 검색하여 모두 수정

---

## Phase E: HTML Toss SDK → Lemon.js 교체 (5파일)

5개 파일에서 Toss SDK 스크립트를 Lemon.js로 교체:

| 파일 | 행 |
|------|-----|
| `charge.html` | L37 |
| `prep.html` | L37 |
| `camera.html` | L58 |
| `result.html` | L103 |
| `thankyou.html` | L37 |

```html
<!-- 삭제 -->
<script src="https://js.tosspayments.com/v1/payment"></script>

<!-- 추가 -->
<script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>
```

> 전체 5파일에 Lemon.js가 필요한 이유: 어느 페이지에서든 충전 모달을 열 수 있으므로.

---

## Phase F: result.js import 정리 (1파일)

### F-1. `idphoto-jp/public/result.js`

```js
// 변경 전 (L10)
buyCreditsJP, TOSS_CLIENT_KEY, API, fetchLatestCredits, closeCreditModal,

// 변경 후
buyCreditsJP, API, fetchLatestCredits, closeCreditModal,
```

---

## 검증

### grep 검증 (커밋 전 필수)

| 패턴 | 기대 결과 |
|------|----------|
| `TOSS_CLIENT_KEY` (idphoto-jp/) | **0건** |
| `tosspayments\.com` (idphoto-jp/) | **0건** |
| `TossPayments(` (idphoto-jp/) | **0건** |
| `initFromTossResult` (idphoto-jp/) | **0건** |
| `_showTossLoading\|_hideTossLoading` (idphoto-jp/) | **0건** |
| `generate: 1[^0]` (idphoto-jp/public/config.js) | **0건** |
| `download: 10[^c]` (idphoto-jp/public/config.js) | **0건** (10이 아닌 70이어야 함) |
| `lemon\.js` (idphoto-jp/) | **5건** (HTML 5파일) |
| `variantId` (idphoto-jp/public/config.js) | **5건** |

### 기능 검증 (로컬)

1. `node server.js` → charge 모달 열기 → 5개 상품 표시 확인
2. 상품 클릭 → Portal /api/checkout 호출 확인 (DevTools Network)
3. Lemon.js overlay 표시 확인 (테스트 모드)
4. 크레딧 모달 텍스트: "70クレジット" / "10クレジット" 확인

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키·시크릿 하드코딩 금지. variant ID는 공개값이므로 config.js에 포함 가능. Lemon Squeezy API Key/Webhook Secret은 Portal 환경변수(Cloud Run)에만 존재 — 건드리지 않는다
- **헌법 7조**: 에러 묵과 금지. Toss 잔재가 남아있으면 결제 불가이므로 grep 검증 필수
- **헌법 10조**: 프록시 금지. idphoto-jp → Portal API 직접 호출 구조 (포탈 중앙화, 프록시 아님)

---

## 커밋 메시지 (승인 시)

```
[feat] JP Lemon Squeezy 결제 통합 — Toss 전면 제거 + config v3 보정

- Portal VARIANT_CREDITS: JP v3 5상품 매핑 (1382355~1382436)
- config.js: CREDIT_COST v3 보정 (generate 10, download 70)
- config.js: CHARGE_OPTIONS v3 JPY (¥990~¥5,990) + variantId
- shared.js: buyCreditsJP() → Portal /api/checkout + Lemon.js overlay
- shared.js: Toss 함수 전면 삭제 (initFromTossResult 등)
- HTML 5파일: Toss SDK → Lemon.js CDN
- modules/charge.js, result.js: TOSS_CLIENT_KEY import 제거
```

---

## 수정 대상 파일 목록 (10건)

**Portal (1건):**
1. `portal/lib/shared/config.js` — VARIANT_CREDITS v3 매핑

**idphoto-jp (9건):**
2. `idphoto-jp/public/config.js` — CREDIT_COST + CHARGE_OPTIONS + TOSS 삭제
3. `idphoto-jp/public/shared.js` — buyCreditsJP 재작성 + Toss 함수 삭제 + Lemon.js 초기화
4. `idphoto-jp/public/modules/charge.js` — import + 호출부 수정
5. `idphoto-jp/public/result.js` — TOSS_CLIENT_KEY import 제거
6. `idphoto-jp/public/charge.html` — SDK 교체
7. `idphoto-jp/public/prep.html` — SDK 교체
8. `idphoto-jp/public/camera.html` — SDK 교체
9. `idphoto-jp/public/result.html` — SDK 교체
10. `idphoto-jp/public/thankyou.html` — SDK 교체
