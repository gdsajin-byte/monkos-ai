---
type: order
id: ORDER_20260323_M1쌍아_막내_pricing_SSR전환
date: 2026-03-23 06:21 KST
from: M1/쌍아
to: 막내(any)
priority: P1
status: pending
origin: 작가님 직접 지적 (2026-03-23 06:03 KST)
related: ORDER_20260323_M1쌍아_막내_포털홈_i18n전면보강
depends_on: 홈 i18n 보강 완료 후 실행 (푸터 변경 공유)
---

# 가격 페이지 SSR 전환 — 리전별 통화·가격 대응

**[2026-03-23 06:21 KST] M1/쌍아 → 막내(any)**

---

## 1. 현상

`pricing.html`이 정적 HTML로 한국어·KRW만 하드코딩. JA/EN 선택해도 한국어 고정.
가격은 리전별(KR/JP/EN)로 다르므로 클라이언트 i18n만으로는 불충분 → SSR 전환 필요.

## 2. 가격 데이터 (작가님 확정)

### 서비스별 크레딧 소모 (공통)

| 서비스 | 크레딧 |
|--------|--------|
| AI 리터칭 (생성) | 10c |
| 고화질 다운로드 | 70c |
| **1장 완성** | **80c** |
| 무료 크롭앱 | 0c |

### 크레딧 팩 가격 (리전별)

| 팩 | 보너스 | KR (₩) | JP (¥) | EN ($) |
|----|--------|--------|--------|--------|
| 70c | +10c | ₩9,900 | ¥990 | $6.90 |
| 100c | +30c | ₩12,900 | ¥1,490 | $9.90 |
| 300c | +120c | ₩34,900 | ¥3,990 | $26.90 |
| 500c | +250c | ₩49,900 | ¥5,990 | $39.90 |

### 크레딧 단가

| | KR | JP | EN |
|---|---|---|---|
| 1c | ₩145 | ¥15 | $0.10 |
| 10c = | ₩1,450 | ¥150 | $1.00 |

### 뱃지

| | KR | JP | EN |
|---|---|---|---|
| 70c | 추천 | おすすめ | Recommended |
| 500c | BEST | BEST | BEST |

> **데이터 출처**: `idphoto-kr/public/config.js` (KR), `idphoto-jp/public/config.js` (JP)
> **EN 가격**: JP 기준 달러 환산, .90 라운딩 (작가님 확정)

## 3. 수정 범위

### 3-1. `monkos_AI/portal/lib/cms/render.js` — renderPricing 함수 추가

기존 `renderFaq`, `renderBlog` 패턴을 따름:

```js
// Pricing — 리전별 가격 데이터
const PRICING_DATA = {
  ko: {
    currency: '₩', currencyPrefix: true,
    title: '가격 안내', subtitle: 'MONKOS AI 서비스 이용 크레딧 가격표',
    svcHeader: ['서비스', '소모 크레딧', '비고'],
    services: [
      { name: 'AI 리터칭 (생성)', credit: '10c', note: '셀카 1장 → AI 보정' },
      { name: '고화질 다운로드', credit: '70c', note: '인화/제출용 원본' },
      { name: 'AI 증명사진 1장 완성', credit: '80c', note: '리터칭 + 다운로드', bold: true },
      { name: '무료 크롭앱', credit: '0c', note: '규격 크롭 · 배경 제거', link: '/crop' },
    ],
    packTitle: '크레딧 팩',
    packs: [
      { credits: 70, bonus: 10, price: '₩9,900', unit: '1c ≈ ₩124', badge: '추천' },
      { credits: 100, bonus: 30, price: '₩12,900', unit: '1c ≈ ₩99' },
      { credits: 300, bonus: 120, price: '₩34,900', unit: '1c ≈ ₩83', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '₩49,900', unit: '1c ≈ ₩67' },
    ],
    cta: '크레딧 충전하기',
    infoTitle: '안내',
    infoItems: [
      '첫 회원가입 시 10c 보너스 증정 (AI 리터칭 1회 체험)',
      '충전한 크레딧은 MONKOS 전 서비스에서 사용 가능',
      '부가세 포함 가격',
    ],
    refundNote: '환불 정책은 <a href="/refund">여기</a>를 확인하세요',
  },
  ja: {
    currency: '¥', currencyPrefix: true,
    title: '料金案内', subtitle: 'MONKOS AIサービス利用クレジット価格表',
    svcHeader: ['サービス', '消費クレジット', '備考'],
    services: [
      { name: 'AIリタッチ（生成）', credit: '10c', note: 'セルフィー1枚 → AI補正' },
      { name: '高画質ダウンロード', credit: '70c', note: '印刷/提出用原本' },
      { name: 'AI証明写真 1枚完成', credit: '80c', note: 'リタッチ + ダウンロード', bold: true },
      { name: '無料クロップアプリ', credit: '0c', note: '規格クロップ・背景除去', link: '/crop' },
    ],
    packTitle: 'クレジットパック',
    packs: [
      { credits: 70, bonus: 10, price: '¥990', unit: '1c ≈ ¥12', badge: 'おすすめ' },
      { credits: 100, bonus: 30, price: '¥1,490', unit: '1c ≈ ¥11' },
      { credits: 300, bonus: 120, price: '¥3,990', unit: '1c ≈ ¥10', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '¥5,990', unit: '1c ≈ ¥8' },
    ],
    cta: 'クレジットをチャージ',
    infoTitle: 'ご案内',
    infoItems: [
      '初回登録時 10cボーナス進呈（AIリタッチ1回体験）',
      'チャージしたクレジットはMONKOS全サービスで使用可能',
      '税込価格',
    ],
    refundNote: '返金ポリシーは<a href="/refund">こちら</a>をご確認ください',
  },
  en: {
    currency: '$', currencyPrefix: true,
    title: 'Pricing', subtitle: 'MONKOS AI service credit pricing',
    svcHeader: ['Service', 'Credits', 'Note'],
    services: [
      { name: 'AI Retouch (Generate)', credit: '10c', note: '1 selfie → AI enhancement' },
      { name: 'HD Download', credit: '70c', note: 'Print/submission quality' },
      { name: 'AI ID Photo (Complete)', credit: '80c', note: 'Retouch + Download', bold: true },
      { name: 'Free Crop App', credit: '0c', note: 'Spec crop & BG removal', link: '/crop' },
    ],
    packTitle: 'Credit Packs',
    packs: [
      { credits: 70, bonus: 10, price: '$6.90', unit: '1c ≈ $0.09', badge: 'Recommended' },
      { credits: 100, bonus: 30, price: '$9.90', unit: '1c ≈ $0.08' },
      { credits: 300, bonus: 120, price: '$26.90', unit: '1c ≈ $0.06', badge: 'BEST', badgeBest: true },
      { credits: 500, bonus: 250, price: '$39.90', unit: '1c ≈ $0.05' },
    ],
    cta: 'Buy Credits',
    infoTitle: 'Info',
    infoItems: [
      '+10c bonus on first sign-up (1 free AI retouch)',
      'Credits can be used across all MONKOS services',
      'Prices include tax',
    ],
    refundNote: 'See our <a href="/refund">refund policy</a> for details',
  },
};
```

`renderPricing(req, res, forceLang)` 함수:
- `pricing.html`을 템플릿으로 읽기
- `PRICING_DATA[lang]`으로 텍스트·가격 교체
- 또는 `pricing.html`을 레이아웃으로만 유지하고 본문을 동적 생성

> 구현 방식은 기존 `renderFaq` 패턴 참조. HTML 구조(CSS 클래스)는 현재 pricing.html 그대로 유지.

### 3-2. `monkos_AI/portal/server.js` — 라우트 추가

```js
// 기존 pricing 정적 서빙을 SSR로 교체
if (urlPath === '/pricing' && req.method === 'GET') return renderPricing(req, res);
if (urlPath === '/ja/pricing' && req.method === 'GET') return renderPricing(req, res, 'ja');
if (urlPath === '/en/pricing' && req.method === 'GET') return renderPricing(req, res, 'en');
```

### 3-3. `monkos_AI/portal/public/pricing.html` — 템플릿화

- 하드코딩된 한국어 텍스트를 SSR 교체 가능한 구조로 변경
- 또는 render.js에서 전체 HTML 생성 (pricing.html은 레이아웃+CSS만 유지)
- **푸터**: 홈 i18n 보강 지시서에서 확정된 영문 통일 푸터 적용

### 3-4. 네비게이션 언어 링크

pricing 페이지 헤더 nav에서 언어 전환 시 `/ja/pricing`, `/en/pricing`로 이동하도록:
- i18n.js 로드 or 네비게이션 링크에 lang prefix 반영

## 4. 수정 제외

- 크레딧 충전 플로우 (Shopify/Lemonsqueezy 결제) — 기존 그대로
- 크레딧 정책 페이지 (`credits-policy.html`) — 이번 범위 외

## 5. 완료 조건

- [ ] `/pricing` → KR 가격 (₩9,900 등) 한국어 표시
- [ ] `/ja/pricing` → JP 가격 (¥990 등) 일본어 표시
- [ ] `/en/pricing` → EN 가격 ($6.90 등) 영어 표시
- [ ] 홈에서 언어 토글 후 Pricing 네비 클릭 시 해당 언어 pricing 진입
- [ ] CSS 레이아웃 기존과 동일 유지

## 6. 커밋

```
[feat] pricing SSR 전환 — KR/JP/EN 리전별 통화·가격 다국어 대응
```
