# MCP 도구 활용 규칙

## 구조·서비스 파악 시 (검색보다 지도 먼저)

- 특정 앱·서비스·어드민이 화제에 오르면 **`monkos-ops/tech/SERVICE_MAP.md`를 먼저 Read** — 명칭 인덱스·존재 이유·상태가 한 장에 있다. 코드 grep·서비스 목록 실측은 그 다음.
- 문서 간 관계 질의는 `monk_relations` 활용 (미사용 습관 교정 — 2026-08-14).

## 과거 기록·PF 탐색 시 (2026-09-27 개정 — 작가님 지시)
- **기록 탐색은 서브에이전트 `record-explorer`에게 맡기고 결론만 받는다** (`.claude/agents/record-explorer.md`). 세션 로그·보고·심사·PF 히스토리·앱 변천사 질문이 대상. 메인 세션이 기록을 직접 읽어 컨텍스트를 채우지 않는다.
- 정확 문자열(파일명·식별자·커밋)은 grep이 1순위다. `monk_search`는 의미·이력 검색용(표현이 다르거나 "언제·왜" 질문).
- 근거: 9월 세션로그 59건 중 monk_search 사용 1건, 기지 정답 6문항 top5 적중 4/6(09-27 실측). "검색 먼저" 규칙은 지켜지지 않았고, 비대화 해법은 검색 방식이 아니라 읽는 주체의 분리.
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
