---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: 막내3
subject: JP 현지화 — 법적 페이지 5건
status: pending
---

# JP 현지화 — 법적 페이지

> **[2026-03-09 12:27 KST] iMac/쌍아 → 막내3**

## 배경

KR 코드가 `idphoto-jp/`에 복사 완료. 법적 페이지는 각국 독립이며 KR 근거법과 JP 근거법이 완전히 다르므로 **전면 재작성**한다. 기존 JP v0.79의 법적 페이지와 KR 페이지를 모두 참조하되, 일본법에 정확히 준거하는 새 버전을 작성한다.

참조: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md`

## 작업 범위

### 1. `terms.html` — 이용약관

| 항목 | KR | JP |
|------|----|----|
| 근거법 | 전자상거래법, 정보통신망법 | **特定商取引法, 消費者契約法, 電気通信事業法** |
| 관할법원 | 서울중앙지방법원 | **東京地方裁判所** |
| SNS 채널 | 카카오톡 | **LINE** |
| 결제수단 | 토스페이먼츠 | **Lemon Squeezy** |
| 사업자 정보 | 몽크사진관 636-15-00574 | JP 사업자 정보 (tokusho 참조) |

### 2. `privacy.html` — 개인정보처리방침

| 항목 | KR | JP |
|------|----|----|
| 근거법 | PIPA (개인정보보호법) | **APPI (個人情報保護法)** |
| 감독기관 | 개인정보보호위원회 | **個人情報保護委員会 (PPC)** |
| 미성년 기준 | 14세 미만 | **업계 가이드라인 (법적 명시 없음)** |
| 데이터 보관 | 90일 자동삭제 (L1) | 동일 (90일) |
| 피해구제 기관 | 한국인터넷진흥원 등 | **삭제** (일본에 해당 없음) |
| 접속로그 근거 | 통신비밀보호법 | **삭제** (일본에 해당 없음) |

### 3. `refund.html` — 환불 정책

| 항목 | KR | JP |
|------|----|----|
| 근거법 | 전자상거래법 제17조 | **特定商取引法に基づく返品特約** |
| 환불 기간 | 7일 | **일본 특상법 기준 (8일 클링오프 또는 별도 특약)** |
| 크레딧 환불 | 미사용분 전액 | 동일 원칙 |

### 4. `credits-policy.html` — 크레딧 정책

- KR 구조를 기반으로 JP 단가 반영
- 생성 1c / 다운로드 10c / 공유보너스 +10c
- 크레딧 유효기간, 환불 규정을 JP 법률에 맞게 조정
- 資金決済法 해당 여부 주의사항 기재 (현재 포인트 분류)

### 5. `tokusho.html` — 特定商取引法に基づく表記 (JP 전용)

기존 `apps/idphoto-jp-v079/public/tokusho.html`을 참조하여 최신화.

필수 기재 항목:
- 販売業者 (판매업자)
- 運営統括責任者 (운영총괄책임자)
- 所在地 (소재지)
- 電話番号 / メールアドレス
- 販売価格 (판매가격)
- 商品代金以外の必要料金 (추가 비용)
- 支払方法 (결제수단)
- 支払時期 (결제시기)
- 商品の引渡時期 (상품 인도시기)
- 返品・キャンセルについて (반품·취소)

## 디자인 가이드

- KR 법적 페이지의 **다크 테마 + 레이아웃 구조 유지** (CSS 클래스 동일)
- 언어만 일본어로, HTML 구조는 KR과 동일하게 유지
- 푸터 링크: terms, privacy, refund, credits-policy, tokusho 5건 상호 연결

## 준수 조항

- **헌법 4조**: 내부 기밀 외부 노출 금지 — 에이전트 호칭, 내부 프로토콜 기재 금지
- **헌법 11조**: 미확정 기능 표현 금지
- 법적 정확성 우선 — 불확실한 조항은 보수적으로 기재하고, 보고서에 검토 필요 사항 별도 명시

## 산출물

- `monkos_AI/idphoto-jp/public/terms.html`
- `monkos_AI/idphoto-jp/public/privacy.html`
- `monkos_AI/idphoto-jp/public/refund.html`
- `monkos_AI/idphoto-jp/public/credits-policy.html`
- `monkos_AI/idphoto-jp/public/tokusho.html`
- 완료 보고서 (법적 검토 필요 사항 별도 섹션)

## 참고 자료

- KR 원본: `monkos_AI/idphoto-kr/public/` (terms, privacy, refund, credits-policy)
- JP v0.79: `apps/idphoto-jp-v079/public/` (terms, privacy, tokusho, credits-policy)
- 법적 분기 보고서: `monkos-ops/ops/reports/2026-03/REPORT_20260308_막내1_KRJP법적정책분기.md`
- 크레딧 법규 보고서: `docs/infrastructure/reports/REPORT_20260308_CREDIT_POLICY_LEGAL.md`
- 프레임워크: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md`
