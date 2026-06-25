---
type: completion
date: 2026-06-25
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — Specs v2 kr-passport UI 정비 5건

**[2026-06-25 14:39 KST]** iMac/막내1 → 작가님

## 지시서
- `ORDER_20260625_iMac쌍아_막내_SPECSv2_UI정비.md`

## 작업 결과

| # | 항목 | 상태 |
|---|------|------|
| 1 | 해시태그(v2-tags) 위치 H1 아래로 이동 | ✅ |
| 2 | "그룹 A" 배지 삭제 | ✅ |
| 3 | 상세규정/반려사유 → 아코디언 전환 (기본 접힘) | ✅ |
| 4 | "같은 사진으로 제출 가능한 서류" 사이즈 필터 추가 | ✅ |
| 5 | 하단 CTA → 크로스셀 카드 교체 (헤드샷/프로필/규격전체) | ✅ |

## 변경 파일
- `monkos_AI/portal/lib/cms/render-specs.js` — `specsDetailV2Fragment` 함수 (V2 전용, V1 미영향)

## 배포
- 커밋: `b8f309f5` `[fix] specs v2 kr-passport UI 정비 5건`
- revision: `monkos-portal-00377-feh` (prod, 100% 트래픽)
- deploy.sh prod 경유

## 영향 범위
- V2_SLUGS = `kr-passport` 만 적용. 기존 V1 페이지 영향 없음.
