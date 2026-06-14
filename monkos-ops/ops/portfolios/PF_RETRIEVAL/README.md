---
type: portfolio
id: PF_RETRIEVAL
name: "RETRIEVAL"
subject: "관계 retrieval(네비게이션 DB) + 스토리지 최적화 — 1인 운영 지속가능성 인프라"
owner: 작가님
leads: "쌍아(설계), 막내(실행), 민아(진단·검증)"
status: active
created: 2026-06-14
---

# PF_RETRIEVAL — 관계 retrieval + 스토리지 최적화

> **메타 PF 성격** — 특정 서비스가 아닌 전체 문서 인프라 대상.
> 발단: 민아 진단 — 문서 누적 위험의 본질은 절대량이 아니라 관계 차수 폭증(O(n²)).
> 제안서: `PROPOSAL_20260614_민아_데이터retrieval_네비게이션DB_최적화로드맵.md`

---

## Phase 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| **P0 스키마 정돈** | `portfolio:` frontmatter 소급 보강 (활성 PF 21개 우선) | ✅ 완료 |
| P1 관계 인덱스 MVP | frontmatter→그래프 엣지 materialize + BM25 + 메타필터 | ⚪ 대기 |
| P2 의미검색 | 임베딩 + 하이브리드(BM25+vector) | ⚪ 대기 |
| P3 agentic MCP | MCP 서버 노출 → 전 디바이스 접근 | ⚪ 대기 |
| 축B git 위생 | .gitignore·LFS·아카이브 분리 (문서 무관, 바이너리만) | ⚪ 독립 트랙 |

---

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 06/14 | iMac/민아 | 데이터 retrieval 네비게이션 DB 최적화 로드맵 제안 | PROPOSAL_20260614 | ✅ |
| 06/14 | iMac/쌍아 | 제안서 헌법·법률 적합성 검토 — ch4 7조 소급 예외 단서 개정 | ch4 7조 개정 | ✅ |
| 06/14 | iMac/쌍아 | PF_RETRIEVAL 신설 + P0 지시서 발행 | PF·ORDER | 🔵 |
| 06/14 | iMac/막내1 | P0 스키마 정돈 실행 — 41건 portfolio: 소급 삽입 완료 | 스크립트+41건 변경+COMPLETION | ✅ |
