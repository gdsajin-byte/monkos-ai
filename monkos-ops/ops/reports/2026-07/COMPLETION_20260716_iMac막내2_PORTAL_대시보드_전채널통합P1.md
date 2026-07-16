---
type: completion
date: 2026-07-16
device: iMac
agent: 막내2
status: 완료
portfolio: PF_PORTAL
---

# COMPLETION: 대시보드 전 채널 수집 통합 Phase 1

**[2026-07-16 17:49 KST]** iMac/막내2 → 작가님

## 결과

✅ **작업 1: GSC API** (`/api/admin/dashboard/gsc`) — GoogleAuth ADC, searchAnalytics.query 키워드+페이지 반환, 1시간 캐시
✅ **작업 2: Naver API** (`/api/admin/dashboard/naver`) — SearchAd HMAC-SHA256 인증 + DataLab 트렌드. 6시간 캐시. 키 미설정 시 graceful null
✅ **작업 3: Bing API** (`/api/admin/dashboard/bing`) — GetQueryStats + GetLinkCounts. 6시간 캐시. 키 미설정 시 graceful null
✅ **작업 4: PageSpeed API** (`/api/admin/dashboard/performance`) — 3 URL × 2 전략(mobile/desktop). score/LCP/CLS/TTFB. 24시간 캐시
✅ **작업 5: 봇 필터** — channels BQ 쿼리에 `user_agent NOT REGEXP_CONTAINS(bot|crawler|spider|...)` 추가
✅ **작업 6: citadel UI** — 검색순위(GSC)·네이버·Bing·성능 4개 데이터 테이블 + JS fetch/render
✅ **기존 8개 API 무접촉** — 신규 추가만
✅ **dev 배포** — rev `monkos-portal-dev-00142-smf`, 100% 트래픽

## 변경 파일

| 파일 | 변경 |
|------|------|
| `lib/cms/seo-dashboard.js` | **신설** — 4 API 핸들러 + memCache 유틸 |
| `server.js` | seo-dashboard import + 4 라우트 추가 |
| `lib/cms/dashboard.js` | channels BQ 쿼리 봇 필터 1줄 추가 |
| `public/admin/citadel.html` | 4개 섹션(GSC·Naver·Bing·PageSpeed) + JS fetch/render + 버전 v0.2 |

## 검증

- dev health 200
- /admin/citadel 페이지에 5개 새 섹션 키워드 확인
- 기존 8 API 라우트 무변경 (diff 확인)

## 비고

- GSC: Cloud Run SA에 webmasters.readonly 스코프 부여 필요 (미부여 시 401 반환, UI에 에러 표시)
- Naver SearchAd/DataLab, Bing WMT: 환경변수 미설정 시 graceful null 반환 — UI에 "키 미설정" 표시
- PageSpeed: 공개 API — 키 없이 호출 가능하나 쿼터 제한 있음
