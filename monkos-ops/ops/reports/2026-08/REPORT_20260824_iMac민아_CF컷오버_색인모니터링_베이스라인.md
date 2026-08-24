---
type: report
date: 2026-08-24
device: iMac
agent: 민아
subject: "CF 컷오버 색인 모니터링 — D+0 베이스라인 + 체크 절차"
status: 모니터링 중 (D+7 = 2026-08-31 종료 판단)
portfolio: PF_SPECS
---

# CF 컷오버 색인 모니터링 — D+0 베이스라인

**[2026-08-24 15:40 KST]** iMac/민아 → 작가님

> 컷오버 시각: 2026-08-24 15:06 KST (apex 프록시 ON)

## D+0 베이스라인 (전량 정상)

| 지표 | 값 | 판정 |
|---|---|---|
| 사이트맵 상태 | specs 6언어 × 429 URL, **에러 0·경고 0** | ✅ |
| 사이트맵 최종 다운로드 | ja: 08-24 13:52 KST (컷오버 직전) — **다음 다운로드가 첫 CF 경유** | 관찰점 |
| 대표 URL 색인 | `/specs/passport/kr` = Submitted and indexed, 최종 크롤 08-19, fetch SUCCESSFUL | ✅ |
| Googlebot UA 실측 | CF 경유 200 / 0.52s / canonical 무변 (챌린지 없음 — security low·bot fight off) | ✅ |
| 검색 성과 (직전 7일) | 임프레션 507~797/일 (평균 ~620), 클릭 4~15/일, 평균 순위 8.6~9.8 | 기준선 |

## 체크 스케줄 + 명령

**D+3 (08-27) / D+7 (08-31)** 세션에서 실행:

```bash
# ① Googlebot 관점 fetch (200 + canonical 확인)
curl -s -o /dev/null -w "%{http_code} %{time_starttransfer}s\n" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" https://monkos.ai/specs/passport/kr
```
- ② GSC MCP `list_sitemaps` — lastDownloaded가 **08-24 15:06 이후**로 전진 + 에러 0 유지
- ③ GSC MCP `index_inspect` (`/specs/passport/kr`) — lastCrawlTime 컷오버 이후 전진 + pageFetchState SUCCESSFUL + coverageState 유지
- ④ GSC MCP `search_analytics` (page contains specs, date 차원) — 임프레션이 기준선 대비 **-30% 이상 지속 하락 시 경보**

## 경보 조건 → 대응

| 증상 | 대응 |
|---|---|
| pageFetchState 실패 / 크롤 에러 급증 | CF에서 Googlebot 차단 의심 → 즉시 프록시 토글 OFF 롤백 |
| 사이트맵 다운로드 에러 | 정적 사이트맵 응답 검증 (`curl /sitemap-specs-*.xml`) → 엣지 재배포 |
| 임프레션 -30%↓ 지속 | 색인 제외 사유 index_inspect 전수 → 원인별 대응 |

> 참고: 사이트맵 API의 indexed=0 표기는 GSC API가 색인 수를 더 이상 반환하지 않는 알려진 표기이며 이상 아님.
