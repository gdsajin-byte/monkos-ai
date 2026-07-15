---
type: completion
date: 2026-07-15
device: iMac
agent: 막내3
status: dev 완료 (prod는 민아 일괄 배포)
portfolio: PF_SPECS
order: ORDER_20260715_iMac민아_막내3_SPECS_글로벌크레딧결제개방.md
---

**[2026-07-15 18:18 KST]** iMac/막내3 → 작가님

# COMPLETION: 글로벌 크레딧 결제 개방

## 커밋

| SHA | 내용 |
|-----|------|
| `2df24485` | 글로벌 크레딧 결제 개방 — ja/en/es 크레딧 카드 노출 + 시장별 가격 표기 |

## 작업 내역

| # | 내용 | 상태 |
|---|------|------|
| A | `lang === 'ko'` 분기 해제 → 전 언어 크레딧 버튼 렌더 | ✅ |
| A | 시장별 가격: kr `10c (₩1,500)` / global·jp `10c ($1)` | ✅ config 정본 참조 |
| A | creditTopupGlobal: `40c $3.90` (글로벌 스토어 variant 정본) | ✅ |
| B | creditTitle·creditDesc·creditTopupGlobal ja/en/es 사전 추가 | ✅ |
| C | 충전 동선: /credits.html 공용 경로 유지 | ✅ 로그인+10c 부여 공용 |

## 가격 숫자 하드코딩 증빙

- `₩1,500` / `$1`: config.js:142 topup_10 정본 (`10c = $1 = ₩1,500`)
- `$3.90`: config.js:122 글로벌 variant 1909373 정본 (`topup_40: $3.90`)
- 신규 가격 숫자 하드코딩: **0건**

## 배포

- ⏳ **dev**: 배포 진행 중
- ⏳ **prod**: 민아 일괄 배포 (ES 계보 포함 후)

## 민아 검증 인계

- ja/en/es: Phase 2 결제 카드에 크레딧 버튼 노출 확인 (시장별 `$1` 표기)
- ko: 기존 크레딧 카드 `₩1,500` 표기 + 토스 동선 무변화
- 크레딧 부족 → /credits.html 리다이렉트 → 로그인 → 10c 부여 → returnUrl 복귀
