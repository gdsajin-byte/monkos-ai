# KOMOJU 결제 연동 전수조사 보고서

> **조사자**: 막내4 | **조사일**: 2026-02-23
> **지시서**: ORDER_20260223_KOMOJU전수조사.md
> **원칙**: 공식 문서 기반 팩트 확인. 추측 배제. 불확실 = "미확인"

---

## A. 개요 및 계약

### A-1. 계정 생성 절차

1. [KOMOJU 공식 사이트](https://en.komoju.com/)에서 **무료 회원가입**
2. 가입 즉시 **Test Mode 사용 가능** — Sandbox 별도 신청 불요
3. 대시보드에서 Test/Live 스위치로 전환
4. Live 전환 시 별도 심사 필요

> 출처: [KOMOJU Help — Test Mode](https://help.komoju.com/hc/en-us/articles/4747518192798-What-Can-I-Do-in-Test-Mode)

### A-2. Live 전환 필요 서류

대시보드 Submission Form에서 제출:

| 법인 유형 | 필요 서류 |
|----------|----------|
| 법인 (Corporation) | 법인등기부등본 (Certificate of Incorporation) |
| 개인사업자 (Sole Proprietor) | 사업자등록증 (Proof of Registration) |
| 일본 법인 | 법인등기부 제출 면제 |

추가 요구사항:
- **특정상거래법 표시** (特定商取引法に基づく表記) 페이지 필수 — 일본 전자상거래 법적 요건
- **Acceptable Use Policy** 동의
- 은행 계좌 정보 (국내/SWIFT/SEPA 택1)

> 출처: [KOMOJU — Overseas Corporation](https://en.komoju.com/help/182-is-contract-available-for-oversea-corporation/) / [Onboarding Process](https://doc.komoju.com/docs/seller-merchant-onboarding)

### A-3. 심사 예상 기간

공식 문서에 **구체적 심사 기간 미공개**. "미확인 — 공식 문의 필요"

- 편의점/PayPay 등 결제수단별 별도 심사가 존재할 가능성 높음
- 일반적으로 일본 결제 게이트웨이 심사: 1~4주 (업계 관행)

### A-4. 한국 사업자 계약 가능 여부

**✅ 가능 확인.**

> "Yes, you can still apply" — 일본 법인/지점 사무소 없이도 신청 가능
> "There is no need to have a branch office in Japan."

- 한국 개인사업자 (636-15-00574) 기준: 사업자등록증 영문 번역본 제출 필요 (추정)
- 구체적 한국 사업자 심사 사례: 미확인 — 공식 문의 필요

> 출처: [KOMOJU — Overseas Corporation](https://en.komoju.com/help/182-is-contract-available-for-oversea-corporation/)

### A-5. 정산 통화 및 정산 주기

| 항목 | 내용 |
|------|------|
| **정산 주기** | 월 1회 (월말 마감 → 익월 1일 정산서) 또는 주 1회 (금요일 정산) |
| **정산 통화** | JPY (일본 은행) / JPY→해외 송금 (해외 은행) |
| **해외 은행 수령** | ✅ 가능 — SWIFT 방식 |
| **해외 송금 수수료** | 2,500엔/건 |
| **한국 은행 수령** | ✅ 가능 (SWIFT 지원 한국 은행) |

> 출처: [Payout Cycle](https://help.komoju.com/hc/en-us/articles/4747518278302-How-to-Check-or-Change-the-Payout-Cycle) / [Foreign Bank](https://help.komoju.com/hc/en-us/articles/4749902800286)

---

## B. 기술 연동

### B-1. API 구조

| 항목 | 내용 |
|------|------|
| **프로토콜** | REST API (HTTPS 필수) |
| **Base URL** | `https://komoju.com/api/v1/` |
| **인증** | HTTP Basic Auth (Secret Key = username, password = 빈값) |
| **응답 형식** | JSON |
| **API 버전** | 커스텀 헤더 `X-KOMOJU-API-VERSION: 2024-07-15` |
| **키 종류** | Secret Key (서버용, 풀 액세스) / Publishable Key (클라이언트용, 토큰·세션만) |

연동 방식 3가지:
1. **Hosted Page** — 결제 페이지로 리다이렉트 (PCI 불요, 권장)
2. **Hosted Fields** — 임베디드 결제 폼 (PCI 불요)
3. **Direct API** — 직접 API 호출 (PCI-DSS 준수 필요)

> 출처: [API Overview](https://doc.komoju.com/docs/authentication) / [Integration Guide](https://doc.komoju.com/docs/hosted-page-integration-guide)

### B-2. Node.js SDK

**공식 Node.js 전용 SDK: 없음.**

- npm에 `@komoju/komoju-react-native` (모바일 전용)만 존재
- GitHub `komoju` 조직에 Node.js 서버 SDK 미발견
- **대안**: REST API 직접 호출 (fetch/axios) — 공식 문서에 Node.js/Express 예제 제공

```javascript
// 공식 문서 Node.js 예제
const session = await fetch('https://komoju.com/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(secretKey + ':')}`
  },
  body: JSON.stringify({
    amount: 1000,
    currency: 'JPY',
    return_url: 'https://your-site.com/return',
    payment_types: ['credit_card', 'konbini', 'paypay']
  })
});
```

> 출처: [KOMOJU GitHub](https://github.com/komoju) / [npm @komoju](https://www.npmjs.com/package/@komoju/komoju-react-native)

### B-3. Google Cloud Run 호환성

**✅ 완전 호환.**

- KOMOJU는 순수 REST API → 실행 환경 무관
- Cloud Run의 HTTPS 아웃바운드 제한 없음
- Hosted Page 방식: 클라이언트 리다이렉트 → 서버 부하 최소
- Webhook 수신: Cloud Run의 공개 URL로 직접 수신 가능

### B-4. Webhook 콜백 구조

| 항목 | 내용 |
|------|------|
| **이벤트** | `payment.captured`, `payment.authorized`, `payment.expired` 등 |
| **서명 검증** | HMAC-SHA256 (`X-Komoju-Signature` 헤더) |
| **Payload** | JSON (payment ID, status, amount, currency, external_order_num, session ID) |
| **설정** | 대시보드에서 이벤트 선택 + Webhook URL + Secret 등록 |

### B-5. Sandbox 환경

| 항목 | 내용 |
|------|------|
| **접근** | 가입 즉시 Test Mode 사용 가능 |
| **테스트 카드** | Visa `4111111111111111`, MC `5555555555554444`, JCB `3530111333300000` 등 |
| **에러 시뮬레이션** | `4123111111111000` (잔액부족), `4123111111111042` (만료) 등 |
| **비카드 테스트** | `Komoju-Scenario` HTTP 헤더로 시뮬레이션 |
| **3D Secure** | 3DS-Aware 테스트 카드 별도 제공 |
| **주의** | Live Mode 테스트 거래는 수수료 부과됨 |

> 출처: [Test Cards](https://doc.komoju.com/docs/test-cards) / [3DS Testing](https://doc.komoju.com/docs/testing-3d-secure-3ds)

### B-6. 기존 토스페이먼츠 코드와의 변환 가능성

| 비교 항목 | 토스페이먼츠 | KOMOJU |
|----------|------------|--------|
| 인증 | Base64 Secret Key (Basic Auth) | Base64 Secret Key (Basic Auth) — **동일 방식** |
| 결제 생성 | `/v1/payments` (confirmPayment) | `/api/v1/sessions` (createSession) |
| 결제 확인 | `paymentKey`로 조회 | `session_id`로 조회 |
| 클라이언트 | TossPayments SDK (위젯) | Hosted Page 리다이렉트 또는 Hosted Fields |
| Webhook | `paymentKey` 기반 | `payment.id` + `session` 기반 |

**평가**: 인증 방식 동일 (Basic Auth), 세션 기반 결제 흐름 유사. **서버 코드 50~60% 재사용 가능** (추정). 클라이언트 위젯은 완전 교체 필요 (토스 SDK → KOMOJU Hosted Page 리다이렉트).

---

## C. 지원 결제수단 (일본)

### C-1. 편의점 결제 (コンビニ決済)

| 항목 | 내용 |
|------|------|
| **수수료** | 2.75% (가맹점) + 190엔 (소비자 부담) |
| **지원 편의점** | 7-Eleven (2만+), FamilyMart (1.6만+), Lawson, MiniStop, Daily Yamazaki, Seicomart |
| **결제 한도** | 최대 300,000엔/건 |
| **결제 기한** | 주문 후 7일 이내 편의점 방문 결제 |
| **결제 방식** | 바코드 지참형 (메일 수령) 또는 결제번호 입력형 (편의점 단말기) |
| **정산** | 결제 완료 → 가맹점에 captured 알림 → 월/주 단위 정산 |
| **제한** | 정보 상품(디지털) 불가 표기 있으나, KOMOJU 공식 가격표에서 digital downloads 수수료 별도 표기 — **미확인, 공식 문의 필요** |

> 출처: [Konbini Payments](https://en.komoju.com/blog/payment-method/konbini/) / [Japan Payment Methods](https://en.komoju.com/payment-methods/japan/)

### C-2. PayPay

| 항목 | 내용 |
|------|------|
| **수수료** | 3.5% (일반) / 9% (디지털 다운로드) |
| **결제 한도** | 1,000,000엔/24시간 |
| **이용자 수** | 약 6,100만명 (일본 스마트폰 유저 2명 중 1명) |
| **연동 방식** | KOMOJU 경유 시 단일 API로 통합 (별도 PayPay 계약 불요) |
| **결제 흐름** | PC: QR코드 표시 → 앱 스캔 / Mobile: PayPay 앱으로 자동 이동 |
| **지역 제한** | 일본 내에서만 이용 가능 |

> 출처: [PayPay — KOMOJU](https://en.komoju.com/blog/payment-method/paypay/) / [Payment Methods](https://en.komoju.com/payment-methods/japan/)

### C-3. 신용카드

| 항목 | 내용 |
|------|------|
| **수수료** | 3.25% (전 브랜드 동일) |
| **지원 브랜드** | Visa, Mastercard, JCB, American Express, Diners Club, Discover |
| **통화** | JPY (JCB/Amex/Diners) / JPY+USD+EUR+14개 통화 (Visa/MC) |
| **3D Secure** | ✅ 지원 (3DS 테스트 카드 별도 제공) |
| **최소 금액** | 1엔 |

### C-4. 기타 일본 로컬 결제수단

| 결제수단 | 수수료 | 한도 | 비고 |
|---------|--------|------|------|
| **LINE Pay** | 미공개 | — | 지원 확인, 수수료 미확인 |
| **Merpay (메루페이)** | 3.5% / 9%(디지털) | 1,000,000엔 | |
| **Rakuten Pay** | 4.4% / 8.4%(디지털) | 9,999,999엔 | 최소 100엔 |
| **au PAY** | 3.5% / 15%(디지털) | — | |
| **d Payment (도코모)** | 3.5% / 15%(디지털) | — | |
| **Apple Pay** | 3.25% | — | |
| **Paidy (BNPL)** | 3.5% / 9%(디지털) | 1,000,000엔 | 후불결제 |
| **Pay-Easy** | 2.75% + 190엔 환불수수료 | 999,999엔 | 은행 ATM 결제 |
| **Bank Transfer** | 1.4% + 300엔 환불수수료 | 무제한 | 직접 송금 |
| **Carrier Billing** | 6.6% / 15%(디지털) | 100,000엔 | docomo/au/SoftBank |

> 출처: [Japan Payment Methods](https://en.komoju.com/payment-methods/japan/) / [Supported Methods](https://doc.komoju.com/page/supported-payment-methods)

---

## D. 수수료 체계

### D-1. 결제수단별 수수료율 종합

| 결제수단 | 일반 | 디지털 다운로드 |
|---------|------|--------------|
| 신용카드 (전 브랜드) | **3.25%** | 3.25% |
| 편의점 | **2.75%** | — |
| PayPay | **3.5%** | 9% |
| Merpay | 3.5% | 9% |
| Rakuten Pay | 4.4% | 8.4% |
| au PAY | 3.5% | 15% |
| d Payment | 3.5% | 15% |
| Apple Pay | 3.25% | 3.25% |
| Paidy | 3.5% | 9% |
| Pay-Easy | 2.75% | — |
| Bank Transfer | 1.4% | — |
| Carrier Billing | 6.6% | 15% |
| WebMoney/BitCash/NetCash | 12% | — |

### D-2. 초기비용 / 월정액

| 항목 | 금액 |
|------|------|
| 초기 설정비 | **무료** |
| 월정액 | **무료** |
| 숨은 수수료 | **없음** |

> "No sign up fees, monthly fees and hidden fees" — 공식 사이트

### D-3. 환율 수수료

- 정산 통화: JPY
- 해외 송금 시 중간 은행 수수료 발생 가능 (KOMOJU 관할 밖)
- KOMOJU 자체 환율 마진: 미확인 — 공식 문의 필요

### D-4. 정산 차감 항목

| 차감 항목 | 금액 |
|----------|------|
| 거래 수수료 | 상기 수수료율 |
| 국내 은행 송금 | 무료 (추정, 일본 은행 기준) |
| 해외 은행 송금 | **2,500엔/건** |
| 환불 수수료 (편의점/Pay-Easy) | 190엔/건 |
| 환불 수수료 (Bank Transfer) | 300엔/건 |

> 출처: [KOMOJU Fees](https://help.komoju.com/hc/en-us/articles/4747472702622) / [Japan Payment Methods](https://en.komoju.com/payment-methods/japan/)

---

## E. 리스크

### E-1. 서비스 안정성

| 항목 | 내용 |
|------|------|
| **SLA** | 99.99% Uptime (공식 주장) |
| **상태 페이지** | [komoju.statuspage.io](https://komoju.statuspage.io/) |
| **장애 이력** | Shopify 연동 간헐적 장애 보고 (해결 중), Hosted Page 접근 장애 (해결됨) |
| **보안** | PCI-DSS 준수, Bug Bounty 프로그램 운영 (YesWeHack) |
| **레퍼런스** | Steam (게임), TikTok (앱), 다수 일본 EC 사이트 |

### E-2. 한국 사업자 실제 운용 사례

**미확인.** 공식 레퍼런스에 한국 사업자 사례 미발견. 공식 문의 필요.

- 해외 사업자(non-Japanese) 계약은 공식 지원
- 한국 사업자 특화 사례/가이드는 부재

### E-3. 계약 해지 조건 및 정산금 동결

**미확인 — 공식 문의 필요.**

- Acceptable Use Policy 위반 시 계약 해지 가능 (일반 조건)
- 정산금 동결 기간/조건: 공식 문서에서 미발견
- 차지백/분쟁 시 처리: 미확인

### E-4. 레몬스퀴지 대비 장단점

별도 비교표 참조 → `docs/rnd_2026/komoju_vs_lemonsqueezy.md`

---

## ⚠️ 블로커 현황

| # | 항목 | 상태 | 설명 |
|---|------|------|------|
| 1 | 한국 사업자 계약 | ✅ 가능 | 일본 법인/지점 불요 |
| 2 | 한국 은행 정산 | ✅ 가능 | SWIFT, 2,500엔/건 |
| 3 | 편의점 결제 | ✅ 지원 | 6대 편의점 체인 |
| 4 | PayPay | ✅ 지원 | 6,100만 유저 |
| 5 | Cloud Run 호환 | ✅ 호환 | REST API, 환경 무관 |
| 6 | **디지털 상품 편의점 결제** | ⚠️ 미확인 | 편의점 블로그에 "정보상품 불가" 언급 vs 가격표에 디지털 수수료 존재 — **공식 문의 필수** |
| 7 | 심사 기간 | ⚠️ 미확인 | 공식 미공개 |
| 8 | 한국 사업자 심사 실제 경험 | ⚠️ 미확인 | 레퍼런스 부재 |

---

## 핵심요약

> KOMOJU는 일본 로컬 결제(편의점/PayPay/LINE Pay 등) 전문 게이트웨이로, 한국 사업자도 계약 가능하며 해외 은행(SWIFT)으로 정산받을 수 있다. 초기비용·월정액 무료, 편의점 2.75%, PayPay 3.5%, 카드 3.25%. Node.js 전용 SDK는 없으나 REST API가 명확하여 Cloud Run 환경에서 즉시 연동 가능. **디지털 상품의 편의점 결제 가능 여부**가 유일한 잠재 블로커이며, 이는 공식 문의로 확인 필요.
