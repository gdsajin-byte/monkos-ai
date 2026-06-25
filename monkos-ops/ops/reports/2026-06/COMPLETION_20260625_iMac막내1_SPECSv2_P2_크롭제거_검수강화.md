---
type: completion
date: 2026-06-25
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — Specs v2 P2 크롭 Phase 제거 + 검수 강화

**[2026-06-25 18:00 KST]** iMac/막내1 → 작가님

## 지시서
- `ORDER_20260625_iMac쌍아_막내_SPECSv2_P2_크롭제거_검수강화.md`

## 작업 결과

| # | 항목 | 상태 |
|---|------|------|
| 1 | 크롭 Phase 전량 제거 (CSS 93줄 + HTML 46줄 + JS ~500줄 + FaceMesh CDN) | ✅ |
| 2 | 동선 재연결: 업로드 → 바로 AI 검수 → 결제 → 생성 → 완성 | ✅ |
| 3 | precheck 프롬프트 ITEM 8 "사진 적합성" 추가 | ✅ |
| 4 | warnMsg 필드 신설 + 검수 결과 UI에 경고 메시지 표시 | ✅ |
| 5 | `/api/idphoto/align` 엔드포인트 삭제 (P1.5) | ✅ |

## 변경 파일
- `monkos_AI/portal/lib/cms/render-specs.js` — P1/P1.5 크롭 로직 전량 삭제 (-762줄)
- `monkos_AI/portal/server.js` — align 엔드포인트 삭제 + precheck ITEM 8 추가

## 동선 변경
```
[P1]  업로드 → 크롭(FaceMesh) → AI 검수 → 결제 → 생성 → 결과
[P2]  업로드 → AI 검수(무료) → 결제 → AI 리터칭 → 완성
```

## 배포
- 커밋: `302f2f67` `[refactor] specs v2 P2 — 크롭 Phase 제거 + 검수 ITEM 8 사진적합성 추가`
- revision: `monkos-portal-00370-qcd` (prod, 100% 트래픽)
- deploy.sh prod 경유
