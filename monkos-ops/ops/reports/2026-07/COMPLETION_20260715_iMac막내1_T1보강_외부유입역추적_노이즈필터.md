---
type: completion
date: 2026-07-15
device: iMac
agent: 막내1
portfolio: PF_PORTAL
subject: T1 보강 — 외부 유입 경로 역추적 + BQ 타임라인 정적파일 필터
status: 완료
order: ORDER_20260715_iMac쌍아_막내_T1보강_외부유입역추적_노이즈필터.md
---

# COMPLETION — T1 보강: 외부 유입 역추적 + 노이즈 필터

**[2026-07-15 15:43 KST]** iMac/막내1 → 작가님

---

## 결과

✅ 작업1: BQ 외부 referrer 역추적 — userDetail API에서 Firestore 비어있을 시 BQ identity_map → events 첫 외부 referrer 추출
✅ 작업2: server.js 정적 파일 page_view 필터 — .js/.css/.jpg/.png 등 + /js/ /css/ /assets/ 경로 제외
✅ 작업3: 타임라인 BQ 쿼리에 정적 파일 제외 조건 추가
✅ 작업4: dashboard.html 유입경로 컬럼 — 없을 시 "클릭 확인" 안내
✅ 작업5: `/api/admin/dashboard/channels` 신설 + dashboard.html 외부 유입 채널 집계 카드 (7d/30d/90d 탭, 도메인별 비율 바, 펼치기)
✅ dev 배포 (rev 00130) + prod 배포 (rev 00481)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/dashboard.js` | BQ acquisition 역추적 + 타임라인 정적필터 + handleDashboardChannels 추가 |
| `monkos_AI/portal/server.js` | 정적파일 page_view 필터 + channels 라우트 + import |
| `monkos_AI/portal/public/admin/user.html` | 유입경로 카드에 BQ역추적 표시 + 도메인 추출 + (BQ 역추적) 라벨 |
| `monkos_AI/portal/public/admin/dashboard.html` | 외부 유입 채널 카드 + "클릭 확인" 안내 |

## 배포

- dev: `monkos-portal-dev` rev 00130-65b
- prod: `monkos-portal` rev 00481-4zv
