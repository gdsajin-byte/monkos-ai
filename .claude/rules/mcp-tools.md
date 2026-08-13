# MCP 도구 활용 규칙

## 구조·서비스 파악 시 (검색보다 지도 먼저)

- 특정 앱·서비스·어드민이 화제에 오르면 **`monkos-ops/tech/SERVICE_MAP.md`를 먼저 Read** — 명칭 인덱스·존재 이유·상태가 한 장에 있다. 코드 grep·서비스 목록 실측은 그 다음.
- 문서 간 관계 질의는 `monk_relations` 활용 (미사용 습관 교정 — 2026-08-14).

## PF 탐색 시
- `monk-retrieval` MCP의 `monk_search` 도구를 우선 사용하여 관련 PF·문서를 검색한다.
- grep/find로 직접 탐색하기 전에 MCP 검색을 먼저 시도한다.
- ARCHIVE 파일도 인덱싱 대상 — 아카이브 분리된 이력도 검색 가능.
- 축(axis) 필터: `pf` 대신 `axis` 파라미터로 IDPHOTO/OPUS/AUTOPILOT/STYLER/PARTNER 축 전체 검색 가능 (청킹 구현 후).

## SEO/지표 데이터 필요 시
- `google-analytics` MCP로 GA4 데이터 직접 조회 가능.
- `google-search-console` MCP로 GSC 데이터 직접 조회 가능.
- daily_briefing 파일을 Read하는 것보다 MCP 직접 조회가 최신 데이터.
- **GSC 쓰기(사이트맵 제출)는 MCP로 403** — MCP SA(yong-a)는 GSC 전체 사용자(읽기)뿐. 제출·상태는 `scripts/tools/gsc_submit.sh {submit|status|list}` 경유 (소유자 SA 임퍼소네이션). 색인 생성 요청(Request Indexing)은 구글이 API 미제공 — 수동 UI 또는 CDP 자동화 별도.

## 시크릿 확인 시
- `secret check <NAME>` 또는 SECRET_INVENTORY.md를 먼저 확인한다.
- "키가 없다"고 보고하기 전에 SM 실측 필수.
