---
type: completion
date: 2026-07-15
device: iMac
agent: 막내3
status: dev 완료 (prod는 민아 일괄 배포 — ES 계보 정합 후)
portfolio: PF_SPECS
order: ORDER_20260715_iMac민아_막내3_SPECS_핫픽스_피커CSS_쌍아리뷰3건.md
---

**[2026-07-15 18:18 KST]** iMac/막내3 → 작가님

# COMPLETION: prod 핫픽스 4건 (dev 완료)

## 커밋

| SHA | 내용 |
|-----|------|
| `455a3227` | attire-picker CSS 로드 + 크로스셀 prefix + i18n 폴백 체인 + tokens.css 연결 |

## 수정 내역

1. ✅ attire-picker.css link 추가 → 피커 레이아웃 깨짐 해소
2. ✅ 크로스셀 링크 prefix 적용 (`/headshot` → `${prefix}/headshot`)
3. ✅ SPECS_I18N 폴백 체인: `[lang] || en || ko` (ES 등 신규 언어 안전망)
4. ✅ tokens.css → specs-funnel.css @import 연결

## 배포

- ✅ **dev**: `monkos-portal-dev-00133-7sh` — 정상 서빙
- ⏳ **prod**: 민아 일괄 배포 예정 (막내2 ES 계보 포함 후 검산 통과 시)

## prod 미배포 사유

핫픽스 커밋(455a3227)이 미검증 ES 라우팅 커밋 위에 위치하여 단독 배포 불가 판정(민아). prod는 ES 완료 후 민아가 main HEAD 일괄 배포.
