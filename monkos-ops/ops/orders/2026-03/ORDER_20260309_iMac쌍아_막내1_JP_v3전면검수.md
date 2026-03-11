---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: iMac/막내1
scope: JP v3 전면 검수 — 크레딧 단가(1c→10c, 10c→70c), KR 잔재 제거, 표정 프롬프트, 헤더 동전 링크
priority: P0
---

# 지시서: JP v3 전면 검수

> **[2026-03-09 16:46 KST] iMac/쌍아 → iMac/막내1**
> Round 1/2에서 v0.79 크레딧 단가(생성1c/다운10c)가 v3(생성10c/다운70c)로 전환되지 않은 잔재가 전면 잔존. KR 사업자 정보, 프롬프트, locale도 미전환.

---

## 정본 단가 (config.js 기준)

```
generate:     10c
download:     70c
extraCrop:    10c
fullOriginal: 10c
합계(1장):    80c (= 10c + 70c)
JPY_PER_CREDIT: ¥15
single_70 상품: ¥990 (70c + 10c bonus = 80c)
취소선 가격: 80c × ¥15 = ¥1,200
할인액: ¥1,200 - ¥990 = ¥210
```

---

## Phase A: 크레딧 단가 보정 (6파일)

### A-1. index.html

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L627 | `初回ログイン1c無料` | `初回ログイン10c無料` |
| L700 | `リタッチ 1c` | `リタッチ 10c` |
| L702 | `ダウンロード 10c` | `ダウンロード 70c` |
| L704 | `11c` | `80c` |
| L707 | `¥1,595` | `¥1,200` |
| L710 | `+1cボーナス &nbsp; ¥605おトク` | `+10cボーナス &nbsp; ¥210おトク` |
| L727 | `初回ログイン1c進呈` | `初回ログイン10c進呈` |

### A-2. result.html

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L203 | `(1c)` | `(10c)` |
| L273 | `(10c)` | `(70c)` |

### A-3. result.js

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L155 | `リタッチ費用（1c）` | `リタッチ費用（10c）` |
| L187 | `初回ログインで1cプレゼント！` | `初回ログインで10cプレゼント！` |
| L536 | `10c返金完了` | `70c返金完了` |

### A-4. camera.js

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L288 | `初回ログインで1cプレゼント！` | `初回ログインで10cプレゼント！` |

### A-5. credits-policy.html

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L106 | `リタッチ（生成）1c + ダウンロード 10c = 合計 11c` | `リタッチ（生成）10c + ダウンロード 70c = 合計 80c` |
| L136 | `1c 消費` | `10c 消費` |
| L140 | `10c 消費` | `70c 消費` |
| L145 | `消費された1cが自動的に復元` | `消費された10cが自動的に復元` |
| L146 | `消費された10cが自動的に復元` | `消費された70cが自動的に復元` |

### A-6. terms.html

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L57 | `1回あたり1クレジット消費` | `1回あたり10クレジット消費` |
| L58 | `1回あたり10クレジット消費` | `1回あたり70クレジット消費` |

### A-7. refund.html

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L70 | `消費された1クレジットが自動的に復元` | `消費された10クレジットが自動的に復元` |

---

## Phase B: 헤더 동전 클릭 → JP 차지 모달 (1파일)

### B-1. index.html L600

```html
<!-- 변경 전 -->
<div class="header-balance" id="creditBtn" style="display:none;" onclick="location.href='https://monkos.ai/credits?from='+encodeURIComponent(location.href)">

<!-- 변경 후 -->
<div class="header-balance" id="creditBtn" style="display:none;" onclick="location.href='/charge.html?return=index'">
```

> monkos.ai/credits는 KR 포탈 가격표. JP는 `/charge.html`로 이동해야 함.

---

## Phase C: camera.html 크레딧 모달 구 시그니처+구 가격 (1파일)

### C-1. camera.html L128~150

현재 크레딧 부족 모달에 구 buyCreditsJP(price, credits) 직접 호출 4건 + 구 KRW 가격이 하드코딩됨.

```html
<!-- 변경 전 (L128~150) -->
<div class="credit-packages">
    <button class="credit-pkg" onclick="buyCreditsJP(1450, 10)">
        <div class="pkg-credits">10 Cr</div>
        <div class="pkg-price">¥1,450</div>
    </button>
    ... (4건 전부 구 시그니처+구 가격)
</div>

<!-- 변경 후: showChargeModal()로 교체 -->
<button class="credit-modal-btn primary" onclick="showChargeModal()" style="width:100%;padding:14px;background:linear-gradient(135deg,#a78bfa,#818cf8);color:#fff;border:none;border-radius:12px;font-size:0.95rem;font-weight:700;cursor:pointer;margin-top:8px;">チャージする</button>
```

> result.html L162 패턴과 동일하게 `showChargeModal()` 버튼 1개로 대체.
> camera.html의 script 태그에서 `showChargeModal`을 import/window 노출하고 있는지 확인 필수. 없으면 추가.

---

## Phase D: 표정 프롬프트 (1파일)

### D-1. server.js L258

```js
// 변경 전
parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height. Approachable yet professional expression.');

// 변경 후
parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height. Neutral, composed expression.');
```

> 증명사진은 무표정/자연스러운 표정이 기본. "Approachable"은 과한 미소를 유발.

---

## Phase E: index.html KR 사업자 정보 → JP tokusho (1파일)

### E-1. index.html L733~745

```html
<!-- 변경 전: 한국 사업자번호, 주소 -->
<section class="biz-info" translate="no">
    <div class="biz-info-inner">
      <p>
        <strong>Business:</strong> MONK STUDIO | <strong>CEO:</strong> JeongKyu Shin<br>
        <strong>Reg. No:</strong> 636-15-00574 | <strong>E-Commerce:</strong> 2026-Gyeonggi.Hanam-0389<br>
        <strong>Address:</strong> B1029, 95 Misagangbyeondong-ro, Hanam-si, Gyeonggi-do, South Korea<br>
        <strong>Email:</strong> info@monkos.ai | <strong>Telegram:</strong> @monkos_support_bot<br>
        <strong>Tel:</strong> 031-791-5030<br>
        <strong>Hosting:</strong> Google Cloud Platform (Google LLC)
      </p>
    </div>
</section>

<!-- 변경 후: charge.html 패턴과 동일 -->
<section class="biz-info" translate="no">
    <div class="biz-info-inner">
      <p>
        <strong>運営:</strong> MONK STUDIO | <strong>代表:</strong> Shin JeongKyu<br>
        <strong>Email:</strong> info@monkos.ai | <strong>Telegram:</strong> @monkos_support_bot<br>
        <a href="/tokusho.html" style="color:#a78bfa; text-decoration:none;">特定商取引法に基づく表記 →</a>
      </p>
    </div>
</section>
```

---

## Phase F: monk.js locale (1파일)

### F-1. monk.js L11

```js
// 변경 전
const log = (msg) => console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`);

// 변경 후
const log = (msg) => console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`);
```

---

## Phase G: 한국어 주석 정리 (result.js)

result.js에 `토스 리다이렉트` 등 한국어 주석 잔존. 기능 주석이므로 일본어로 변경:

| 행 | 변경 전 | 변경 후 |
|----|---------|---------|
| L408 | `토스 리다이렉트 대비: 원본을 임시 보관` | `決済リダイレクト対応: 原本を一時保管` |
| L573 | `토스 리다이렉트 복귀 시 원본 복원` | `決済リダイレクト復帰時 原本復元` |
| L584 | `sessionStorage에서 생성 이미지 복원 (토스 리다이렉트 후 복귀용 — 워터마크 버전)` | `sessionStorageから生成画像復元（決済リダイレクト復帰用 — ウォーターマーク版）` |
| L598 | `생성 이미지 존재 시 결과 화면 복원 (토스 충전 후 복귀)` | `生成画像存在時 結果画面復元（チャージ後復帰）` |

> 나머지 한국어 주석 (`원본`, `풀 원본`, `비교컷` 등)도 보이는 대로 일본어로 치환. 단 기능에 영향 없으므로 **누락보다 정확성 우선**.

---

## 검증

### grep 검증 (전수)

| 패턴 | 범위 | 기대 |
|------|------|------|
| `リタッチ 1c` | idphoto-jp/ | **0건** |
| `ダウンロード 10c` | idphoto-jp/ (charge.html 제외) | **0건** |
| `11c` | idphoto-jp/ (CHARGE_OPTIONS 제외) | **0건** |
| `(1c)` | idphoto-jp/ | **0건** |
| `(10c)` | idphoto-jp/ result.html | **0건** (70c로 변경됨) |
| `1クレジット消費` | idphoto-jp/ | **0건** |
| `636-15-00574` | idphoto-jp/ | **0건** |
| `Hanam` | idphoto-jp/ | **0건** |
| `monkos.ai/credits` | idphoto-jp/ | **0건** |
| `buyCreditsJP(1450` | idphoto-jp/ | **0건** |
| `ko-KR` | idphoto-jp/ | **0건** |
| `Approachable` | idphoto-jp/ | **0건** |
| `¥1,450` | idphoto-jp/ | **0건** |
| `¥1,595` | idphoto-jp/ | **0건** |

---

## 수정 대상 파일 (9건)

1. `idphoto-jp/public/index.html` — 크레딧 단가 7건 + 헤더 동전 링크 + 사업자 정보
2. `idphoto-jp/public/result.html` — 버튼 크레딧 표시 2건
3. `idphoto-jp/public/result.js` — 크레딧 단가 3건 + 한국어 주석
4. `idphoto-jp/public/camera.html` — 크레딧 모달 구 시그니처+구 가격 전면 교체
5. `idphoto-jp/public/camera.js` — 크레딧 단가 1건
6. `idphoto-jp/public/credits-policy.html` — 크레딧 단가 5건
7. `idphoto-jp/public/terms.html` — 크레딧 단가 2건
8. `idphoto-jp/public/refund.html` — 크레딧 단가 1건
9. `idphoto-jp/server.js` — 표정 프롬프트 1건
10. `idphoto-jp/public/monk.js` — locale 1건

---

## ⚠️ 준수 조항

- **헌법 7조**: 크레딧 단가 오표기는 결제 오인 유발 크리티컬 — 반드시 전수 수정
- **헌법 10조**: camera.html 구 buyCreditsJP(price, credits) 시그니처는 결제 불가 — showChargeModal()로 교체

---

## 커밋 메시지 (승인 시)

```
[fix] JP v3 전면 검수 — 크레딧 단가(1c→10c,10c→70c) + KR 잔재 + 표정 프롬프트

- 크레딧 단가 v0.79→v3: 생성1c→10c, 다운10c→70c, 합계11c→80c (8파일)
- index.html: 헤더 동전→/charge.html, 사업자정보→tokusho, 가격표 v3
- camera.html: 크레딧 모달 구 시그니처→showChargeModal()
- server.js: 표정 프롬프트 Approachable→Neutral
- monk.js: ko-KR→ja-JP
- result.js: 한국어 주석→일본어
```
