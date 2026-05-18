---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: iMac/막내1
scope: JP charge 모듈 보정 — buyCreditsJP 시그니처 수정 + 한국어/₩ 전면 일본어/¥ 전환 + 가격뱃지 v3 보정
priority: P0
---

# 지시서: JP charge 모듈 보정

> **[2026-03-09 15:41 KST] iMac/쌍아 → iMac/막내1**
> Round 2 보정 — charge.html + modules/charge.js 현지화 누락 수정

---

## 배경

Round 2에서 shared.js의 `buyCreditsJP(opt)` 시그니처가 변경되었으나, charge.html 인라인 스크립트의 호출부가 구 시그니처 `(price, credits)`를 유지하고 있어 **결제 불가** 상태이다. 또한 modules/charge.js(모달)에 한국어 텍스트와 ₩ 통화가 전면 잔존.

---

## Phase A: charge.html 크리티컬 수정 (1파일)

### A-1. buyCreditsJP 호출부 수정 (2건)

**L205** — 카드 투터치 결제:
```js
// 변경 전
buyCreditsJP(opt.price, opt.credits + opt.bonus);

// 변경 후
buyCreditsJP(opt);
```

**L224** — 스테퍼 결제:
```js
// 변경 전
buyCreditsJP(stepperQty * STEP_PRICE, stepperQty * STEP_UNIT);

// 변경 후
const topupOpt = CHARGE_OPTIONS.find(o => o.key === 'topup_10');
if (topupOpt) buyCreditsJP(topupOpt);
```

### A-2. 가격 산수 뱃지 v3 보정 (L80~87)

```html
<!-- 변경 전 -->
<span ...>リタッチ 1c</span>
...
<span ...>ダウンロード 10c</span>
...
<span ...>11c</span>

<!-- 변경 후 -->
<span ...>リタッチ 10c</span>
...
<span ...>ダウンロード 70c</span>
...
<span ...>80c</span>
```

### A-3. 푸터 사업자 정보 (L111~119)

현재 한국 사업자 정보가 그대로 있음. JP 사이트이므로 tokusho.html 링크로 대체:

```html
<!-- 변경 전: 한국 사업자 번호, 주소 등 -->
<p style="font-size:0.7rem; ...">
  <strong>Business:</strong> MONK STUDIO | ...
  <strong>Reg. No:</strong> 636-15-00574 | ...
  <strong>Address:</strong> B1029, 95 Misagangbyeondong-ro, ...
</p>

<!-- 변경 후 -->
<p style="font-size:0.7rem; color:#8892a8; line-height:1.8; opacity:0.7;">
  <strong style="color:#8892a8; opacity:1;">運営:</strong> MONK STUDIO |
  <strong style="color:#8892a8; opacity:1;">代表:</strong> Shin JeongKyu<br>
  <strong style="color:#8892a8; opacity:1;">Email:</strong> info@monkos.ai |
  <strong style="color:#8892a8; opacity:1;">Telegram:</strong> @monkos_support_bot<br>
  <a href="/tokusho.html" style="color:#a78bfa; text-decoration:none;">特定商取引法に基づく表記 →</a>
</p>
```

---

## Phase B: modules/charge.js 현지화 (1파일)

### B-1. 주석 일본어화 (L1~4, L9)

```js
// 변경 전
* modules/charge.js — 충전 모달 모듈
* v4: 투터치 결제 + 스테퍼 버튼화

// 변경 후
* modules/charge.js — チャージモーダルモジュール
* v4: ツータッチ決済 + ステッパーボタン化
```

```js
// 변경 전
// ─── 소액충전 스테퍼 ───

// 변경 후
// ─── 少額チャージステッパー ───
```

### B-2. STEP_PRICE + locale (L11, L20)

```js
// 변경 전
const STEP_PRICE = 1450; // KRW per 10c

// 변경 후
const STEP_PRICE = 150; // JPY per 10c (¥15 × 10)
```

```js
// 변경 전
function _fmt(n) {
  return n.toLocaleString('ko-KR');
}

// 변경 후
function _fmt(n) {
  return n.toLocaleString('ja-JP');
}
```

### B-3. ₩ → ¥ 전면 교체 (6건)

| 행 | 변경 전 | 변경 후 |
|-----|---------|---------|
| L31 | `₩${_fmt(...)}` | `¥${_fmt(...)}` |
| L32 | `${price} 결제` | `${price} 決済` |
| L57 | `₩' + _fmt(strikePrice)` | `¥' + _fmt(strikePrice)` |
| L58 | `₩' + _fmt(opt.price)` | `¥' + _fmt(opt.price)` |
| L104 | `₩' + _fmt(strikePrice)` | `¥' + _fmt(strikePrice)` |
| L105 | `₩' + _fmt(opt.price)` | `¥' + _fmt(opt.price)` |

### B-4. 모달 HTML 텍스트 일본어화 (L112~142)

| 행 | 변경 전 | 변경 후 |
|-----|---------|---------|
| L79 | `1장 완성` | `1枚分` |
| L81 | `패키지` | `パッケージ` |
| L101 | `총 ` | `合計 ` |
| L122 | `← 이전` | `← 戻る` |
| L123 | `크레딧 충전` | `クレジットチャージ` |
| L132 | `── 또는 소액 충전 ──` | `── または少額チャージ ──` |
| L138 | `₩1,450` | `¥150` |
| L142 | `최소 10c · 최대 100c` | `最小10c · 最大100c` |
| L177 | `₩' + _fmt(opt.price) + ' 결제'` | `¥' + _fmt(opt.price) + ' 決済'` |

### B-5. 기타 한국어 주석 (L149, L152, L155, L183, L200)

`오버레이`, `컨텐츠`, `카드`, `수량 변경`, `확인 해제` 등 → 일본어로 보정

---

## 검증

### grep 검증

| 패턴 | 범위 | 기대 |
|------|------|------|
| `₩` | idphoto-jp/ | **0건** |
| `ko-KR` | idphoto-jp/ | **0건** |
| `1450` | idphoto-jp/public/modules/charge.js | **0건** |
| `リタッチ 1c` | idphoto-jp/public/charge.html | **0건** |
| `ダウンロード 10c` | idphoto-jp/public/charge.html | **0건** |
| `opt\.price.*opt\.credits` | idphoto-jp/ | **0건** (구 시그니처 잔재 없음) |

---

## ⚠️ 준수 조항

- **헌법 7조**: 구 시그니처 `buyCreditsJP(price, credits)` 잔존은 결제 불가를 유발하는 크리티컬 버그. 반드시 수정
- **헌법 10조**: 스테퍼 가변 수량 UI는 LS 고정 variant와 불일치하나, topup_10 연결로 동작 보장. 구조 변경은 후일

---

## 커밋 메시지 (승인 시)

```
[fix] JP charge 모듈 보정 — buyCreditsJP 시그니처 + 한국어→일본어 + v3 가격뱃지

- charge.html: buyCreditsJP(opt) 시그니처 수정 (결제 불가 버그)
- charge.html: 가격뱃지 v3 보정 (リタッチ10c+ダウンロード70c=80c)
- charge.html: 사업자정보 → tokusho.html 링크
- modules/charge.js: ₩→¥, ko-KR→ja-JP, STEP_PRICE 1450→150
- modules/charge.js: 모달 UI 전문 일본어화
```

---

## 수정 대상 파일 (2건)

1. `idphoto-jp/public/charge.html` — buyCreditsJP 시그니처 + 가격뱃지 + 푸터
2. `idphoto-jp/public/modules/charge.js` — 한국어/₩ → 일본어/¥ 전면 전환
