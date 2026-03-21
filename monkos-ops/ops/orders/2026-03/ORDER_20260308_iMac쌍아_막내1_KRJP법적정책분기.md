---
type: order
date: 2026-03-08
from: iMac/쌍아
to: 막내1
priority: P1
category: legal / policy / research
---

# 지시서: KR/JP 법적·정책 분기 전수 파악

**[2026-03-08 18:32 KST] iMac/쌍아 → 막내1**

## 배경

- KR은 향후 크레딧 폐지 → 직접결제로 전환 예정, JP는 크레딧 시스템 유지
- **JP는 현행 v0.79를 아카이브하고, KR 코드를 클론하여 현지화할 예정**
- 따라서 비교 기준 = **KR 코드 기반에서 JP로 내릴 때 뭘 바꿔야 하는가**
- 현행 JP(v0.79) 코드는 참고용일 뿐, 새 JP는 KR 코드 복제본

## 조사 범위

### 1. KR 정책 페이지를 JP로 클론할 때 분기 항목

**KR 정책 페이지를 전부 읽고**, JP로 현지화 시 변경이 필요한 항목을 조항 단위로 정리:

| KR 파일 | JP 클론 시 변경 포인트 |
|---------|----------------------|
| `idphoto-kr/public/terms.html` | 크레딧 조항 유지(JP는 크레딧 시스템), 결제→Lemon Squeezy, 관할법원→東京地裁, 법적 근거→特定商取引法 |
| `idphoto-kr/public/privacy.html` | PIPA→APPI, 보관기간, 제3자 제공, 개인정보보호위원회→個人情報保護委員会 |
| `idphoto-kr/public/refund.html` | JP에서는 tokusho.html로 전환? 또는 refund.html 유지? 환불 근거 법률 변경 |
| `idphoto-kr/public/credits-policy.html` | JP는 크레딧 유지이므로 대부분 유지, 법적 근거·사업자 정보·결제 수단만 변경 |

### 2. 법체계 분기 필수 항목

KR 코드를 JP로 내릴 때 **반드시 법적으로 변경해야 하는** 항목:

- **결제 법체계**: 전자상거래법(KR) → 特定商取引法(JP)
- **개인정보**: PIPA(KR) → APPI(JP) — 수집항목, 보관기간, 제3자 제공 차이
- **환불 규정**: 디지털 콘텐츠 청약철회 제한 근거 (양국 차이)
- **크레딧 규정**: KR은 직접결제 전환 예정이므로 크레딧 조항 삭제. JP는 크레딧 유지이므로 선불포인트 관련 JP 법규 적용
- **미성년자 보호**: 양국 미성년자 결제 제한 규정 차이
- **사업자 표시 의무**: 통신판매업(KR) vs 特定商取引法に基づく表記(JP)
- **데이터 보관**: 거래장부 5년(KR) vs JP 기준 (동일 여부 확인)
- **sct 표기**: KR tokusho.html 불필요 / JP 필수 — 양국 필수 법적 고지 페이지 목록

### 3. KR 직접결제 전환 시 약관 변경 명세

현행 KR 약관에서 크레딧 관련 조항을 걷어내고 직접결제로 전환할 때:
- 삭제해야 할 조항 (크레딧 관련 전체)
- 신설해야 할 조항 (직접결제, 단건 구매)
- 수정해야 할 조항 (환불 기준 변경 등)
- refund.html 변경 범위
- credits-policy.html → 폐지 or 결제정책 페이지로 전환

## 필수 읽기 파일

```
monkos_AI/idphoto-kr/public/terms.html
monkos_AI/idphoto-kr/public/privacy.html
monkos_AI/idphoto-kr/public/refund.html
monkos_AI/idphoto-kr/public/credits-policy.html
docs/infrastructure/reports/REPORT_20260308_CREDIT_POLICY_LEGAL.md
docs/infrastructure/reports/REPORT_20260308_DATA_RETENTION_LEGAL_TERMS.md
```

> **현행 JP(v0.79) 파일은 참고용으로만 읽을 것.** 새 JP는 KR 클론 기반.
> `monkos_AI/idphoto-jp/public/tokusho.html` — JP 특정상거래법 표기 참고

## ⚠️ 준수 조항

- **헌법 제4조**: 내부 기술 스택 노출 금지. 보고서에서 Firestore, GCS 등 구체 기술명 사용 가능 (내부 문서)
- **헌법 제11조**: "되는 것만 응답" — 법적 판단이 불확실한 부분은 "법률 자문 필요"로 명시

## 산출물

`docs/infrastructure/reports/REPORT_20260308_KRJP_LEGAL_POLICY_DIVERGENCE.md`

## 보고 형식

```
✅ [막내1] KR/JP 법적·정책 분기 보고서 완료
📁 파일 목록
💡 특이사항 (법률 자문이 필요한 항목)
```
