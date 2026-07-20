---
type: completion
date: 2026-07-20
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# COMPLETION — specs 국가 축약형 슬러그 301

> **[2026-07-20 19:27 KST]** iMac/막내1 → 작가님
> 지시서: `ORDER_20260720_iMac쌍아_막내_SPECS_국가축약_301.md`

## 결과

✅ **Task 1** — COUNTRY_SLUG_TO_ISO 축약형 40건 추가 (15→55 매핑)
✅ **Task 2** — prod 라이브 301 5/5 확인
✅ **Task 2** — jest 105/105 전량 녹색
✅ **Task 3** — 배포 완료 rev `monkos-portal-00523-s7x`

## prod 301 실측

| URL | HTTP | Location |
|-----|------|----------|
| /en/specs/visa/bosnia | 301 | /en/specs/visa/ba |
| /en/specs/visa/azerbaijan | 301 | /en/specs/visa/az |
| /en/specs/visa/denmark | 301 | /en/specs/visa/dk |
| /en/specs/visa/belgium | 301 | /en/specs/visa/be |
| /en/specs/visa/belarus | 301 | /en/specs/visa/by |

## 추가 매핑 40건

GSC 실측 5건 + 검색 빈발 축약형 35건: bosnia, azerbaijan, denmark, belgium, belarus, brazil, mexico, france, italy, netherlands, portugal, sweden, norway, finland, poland, russia, turkey, egypt, nigeria, kenya, philippines, malaysia, pakistan, bangladesh, colombia, argentina, chile, peru, morocco, tunisia, kuwait, oman, qatar, bahrain, jordan, lebanon, cambodia, myanmar, laos, nepal + 하이픈 복합 5건(sri-lanka, new-zealand, south-africa, saudi-arabia, united-arab-emirates)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/render-specs.js` | COUNTRY_SLUG_TO_ISO 40건 추가 |
