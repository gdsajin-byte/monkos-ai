---
type: completion
date: 2026-07-23
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# COMPLETION — Phase 4a 네비 제품 승격 + 히어로 CTA → /specs

**[2026-07-23 15:33 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260723_iMac쌍아_막내_SPECS_Phase4a_네비CTA개편.md`

## 결과

| 항목 | 상태 | 내용 |
|------|------|------|
| A. 히어로 CTA 통일 | ✅ | `idphotoUrl` — kr/jp 외부 도메인 분기 제거 → `${prefix}/specs` 단일 |
| B. 도메인 라벨 제거 | ✅ | `<span class="mk-id-domain">idphoto.monkos.ai</span>` 삭제 |
| C. 네비 제품 승격 | ✅ | ID Photo·Headshot 앞으로, FAQ·Gallery·Board 제거, 순서: 제품→가격→콘텐츠 |
| D. 푸터 정합 확인 | ✅ | 기존 `/specs` + `/headshot` 링크 유지, 네비와 일관 |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/home.js` | CTA 통일 + 도메인 라벨 제거 |
| `monkos_AI/portal/lib/cms/render-shell.js` | 네비 제품 승격 |

## 검증

- jest 21건 전체 통과 (기존 ESM 구문 실패 9건은 무관)
- 하드코딩 외부 도메인 잔존 0 (idphoto-kr/jp URL 제거 확인)
- dev 배포 미실행 — 작가님 확인 후 배포 진행
