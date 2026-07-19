---
type: completion
date: 2026-07-19
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 완료
---

# COMPLETION: V1 소각 P0 핫픽스 — funnel JS 즉사 + cn-resume 게이트

**[2026-07-19 12:40 KST]** iMac/막내1 → 작가님

## 작업 요약

지시서 `ORDER_20260719_iMac쌍아_막내1_SPECS_V1소각_P0핫픽스.md` 수행 완료.

## 결과

| 항목 | 상태 |
|------|------|
| Task 1. specs-funnel.js:520 T1 null 가드 | ✅ |
| Task 2. cn-resume 퍼널 차단 (isV2Spec 게이트 복원) | ✅ |
| Task 3. jest 녹색 (105/105) + 배포 (rev monkos-portal-00512-qp9) | ✅ |
| Task 4. 라이브 검증 4항 | ✅ |

## 라이브 검증

| URL | 결과 |
|-----|------|
| /specs/visa/kw | 200, V2 퍼널 정상 (file input 존재), T1 미노출 |
| /specs/visa/om | 200, V2 퍼널 정상, T1 미노출 |
| /specs/passport/id | 200, V2 퍼널 정상, T1 미노출 |
| /specs/passport/kr | 200, T1 카드 정상 노출 (대조군) |
| /specs/resume/cn | 404 (퍼널 미진입) |
| funnel JS t1Btn 가드 | 반영 확인 |

## 원인/수정

1. **JS 즉사**: `getElementById('ip-t1-buy').addEventListener(...)` — 유색 페이지에서 T1 마크업이 없으므로 null 참조. `if(t1Btn)` 가드 추가.
2. **cn-resume 개방**: V1 소각 시 `specsDetailFragment`가 `isV2Spec` 체크 없이 직결된 문제. 엔진 비호환 슬러그 진입 차단 위해 `isV2Spec` 가드 복원.

## 변경 파일

- `monkos_AI/portal/public/js/specs-funnel.js` — L520 T1 버튼 null 가드
- `monkos_AI/portal/lib/cms/render-specs.js` — specsDetailFragment에 isV2Spec 가드 복원

## 커밋

- `35f702e5` [fix] V1 소각 P0 — funnel JS T1 null 가드 + cn-resume 퍼널 차단 복원

## 후속

- 민아 재검증 게이트 인계
