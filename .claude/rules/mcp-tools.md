# MCP 도구 활용 규칙

## PF 탐색 시
- `monk-retrieval` MCP의 `monk_search` 도구를 우선 사용하여 관련 PF·문서를 검색한다.
- grep/find로 직접 탐색하기 전에 MCP 검색을 먼저 시도한다.
- ARCHIVE 파일도 인덱싱 대상 — 아카이브 분리된 이력도 검색 가능.
- 축(axis) 필터: `pf` 대신 `axis` 파라미터로 IDPHOTO/OPUS/AUTOPILOT/STYLER/PARTNER 축 전체 검색 가능 (청킹 구현 후).

## SEO/지표 데이터 필요 시
- `google-analytics` MCP로 GA4 데이터 직접 조회 가능.
- `google-search-console` MCP로 GSC 데이터 직접 조회 가능.
- daily_briefing 파일을 Read하는 것보다 MCP 직접 조회가 최신 데이터.

## 시크릿 확인 시
- `secret check <NAME>` 또는 SECRET_INVENTORY.md를 먼저 확인한다.
- "키가 없다"고 보고하기 전에 SM 실측 필수.
