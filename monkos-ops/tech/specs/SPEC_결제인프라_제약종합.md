---
type: spec
date: 2026-04-28
subject: 결제 인프라 제약 종합 — LS·Stripe·KOMOJU·싱가포르 법인 경로
service: idphoto-kr
origin: memory/project_payment_gateway_constraints.md + project_global_payment_escape_route.md
---

# 결제 인프라 제약 종합

## 1. 현재 결제 게이트웨이

Lemon Squeezy가 현재 유일한 글로벌 결제수단. Stripe는 한국 개인사업자에 안 열림.

### LS × Stripe 통합 (2026-04-28 갱신)

- **Stripe가 2024년 LS를 인수**. LS는 Stripe 자회사로 "Managed Payments" 라인 통합 중
- 작가님은 Stripe 직접 사용자 아님. LS = MoR(공식 판매자), 작가님 = connected account
- 수수료: LS 5% + $0.50 (Stripe 수수료 추가 X)
- 환불·세무: LS가 MoR로 책임
- PayPay 옵션 가능성: Stripe Japan이 PayPay 통합 발표(2025). LS에도 도입 가능성. 작가님 LS support에 문의 중

### 각 PG 비교

| PG | 상태 | 비고 |
|---|---|---|
| **Lemon Squeezy** | ✅ 운용 중 | 카드 + PayPal + Apple Pay 내장 |
| **토스페이먼츠** | ✅ 한국 전용 | 국내 결제 정상 작동 |
| **Stripe** | ❌ 한국 미개설 | 싱가포르 법인 후 가맹 가능 |
| **KOMOJU** | ❌ 신뢰 불가 | 과거 배신 이력 (갑작스런 등재 차단) |

## 2. 글로벌 결제 탈출 경로

한국 금융규제(외환거래법·지급결제업 허가·자금세탁방지법 3중)로 Stripe 한국 미개설·토스 독과점 구조.

### 싱가포르 법인이 최적해

- VC 선호 / 법인세 17% / 정치 안정
- Stripe·PayPal·Airwallex 전부 가맹 가능
- 최소 자본금 S$1 / 외국인 100% 지분
- 홍콩 대비: 정치 안정성 프리미엄, VC 신뢰도

### 로드맵

- 기존 "2027 일본 법인화" → **"2026 Q3~Q4 싱가포르 법인 검토 + 2027 상반기 설립"** 후보
- 일본 현지 결제(PayPay/コンビニ) 반드시 필요 시에만 일본 법인 병행

### 블로그 소재

- "한국 소상공인의 글로벌 결제 탈옥기" 시리즈 잠재력
- 프레미아 티엔씨 2026-05-11 웨비나 "글로벌 결제 막힌 한국 쇼핑몰, 홍콩 법인으로 해결하는 방법"
