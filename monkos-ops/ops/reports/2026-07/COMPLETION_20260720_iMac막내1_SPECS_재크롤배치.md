---
type: completion
date: 2026-07-20
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# COMPLETION — specs 헤드 슬러그 재크롤 배치

> **[2026-07-20 18:58 KST]** iMac/막내1 → 작가님
> 지시서: `ORDER_20260720_iMac쌍아_막내_SPECS_재크롤배치.md`

## 결과

✅ **Task 1** — sitemap lastmod `2026-07-17` → `2026-07-20` 갱신 (SPECS_LASTMOD + STATIC_LASTMOD)
✅ **Task 2** — IndexNow 8건 성공 (HTTP 200, 5개 엔진 동시 통지)
❌ **Task 2** — Google Indexing API 8건 실패 (로컬 ADC 스코프 부족, 서버 SA 전용)
✅ **Task 3** — 배포 완료 rev `monkos-portal-00521-lt6`

## IndexNow 요청 내역

| # | URL | 결과 |
|---|-----|------|
| 1 | /en/specs/visa/us | ✅ 200 |
| 2 | /en/specs/passport/us | ✅ 200 |
| 3 | /specs/passport/kr | ✅ 200 |
| 4 | /en/specs/visa/bosnia | ✅ 200 |
| 5 | /en/specs/visa/azerbaijan | ✅ 200 |
| 6 | /en/specs/visa/denmark | ✅ 200 |
| 7 | /en/specs/visa/belgium | ✅ 200 |
| 8 | /en/specs/visa/belarus | ✅ 200 |

## Google Indexing API

로컬 ADC에 `indexing` 스코프 미포함 (ACCESS_TOKEN_SCOPE_INSUFFICIENT). seo.js의 GoogleAuth는 Cloud Run SA 전용. specs는 공식 지원 범위 밖(JobPosting/BroadcastEvent)이므로 IndexNow가 실효 채널.

## lastmod 원인 분석

`render-sitemap.js:14-15`에 `SPECS_LASTMOD`가 수동 상수로 관리됨. 배포마다 자동 갱신되지 않으므로, 콘텐츠 변경 배포 시 수동 갱신 필요. 자동화는 별건.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/render-sitemap.js` | STATIC_LASTMOD + SPECS_LASTMOD → 2026-07-20 |
