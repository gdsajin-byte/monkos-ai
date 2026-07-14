---
name: seo-query
description: SEO 데이터 즉시 조회 — GA4/GSC MCP로 최근 7일 성과 테이블 보고
user_invocable: true
---

# /seo-query — SEO 데이터 즉시 조회

이 스킬이 호출되면 아래 순서로 실행한다:

1. `google-analytics` MCP로 최근 7일 GA4 데이터 조회:
   - 세션, 사용자, 신규 사용자, 페이지뷰
   - 디바이스별 분리 (desktop/mobile/tablet)

2. `google-search-console` MCP로 최근 7일 GSC 데이터 조회:
   - 총 클릭, 노출, CTR, 평균 순위
   - 상위 10 검색어

3. 결과를 마크다운 테이블로 정리하여 보고한다.

MCP 서버 연결 실패 시: 최신 브리핑 파일(`monkos-ops/ops/briefings/`)을 Read하여 대체한다.
