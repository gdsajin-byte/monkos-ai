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
| **P1 관계 인덱스 MVP** | frontmatter→그래프 엣지 materialize + BM25 + 메타필터 | ✅ 완료 |
| **P1.5 자동 갱신** | mk-push.sh 연동 + 스캔 범위 확장(governance/docs) | ✅ 완료 |
| P2 의미검색 | Vertex AI 임베딩 + 하이브리드(BM25+vector RRF) | ✅ 완료 |
| P3 agentic MCP | MCP 서버 노출 → 전 디바이스 접근 | ✅ 완료 |
| 축B git 위생 | .gitignore·LFS·아카이브 분리 (문서 무관, 바이너리만) | ⚪ 독립 트랙 |

---

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 06/14 | iMac/민아 | 데이터 retrieval 네비게이션 DB 최적화 로드맵 제안 | PROPOSAL_20260614 | ✅ |
| 06/14 | iMac/쌍아 | 제안서 헌법·법률 적합성 검토 — ch4 7조 소급 예외 단서 개정 | ch4 7조 개정 | ✅ |
| 06/14 | iMac/쌍아 | PF_RETRIEVAL 신설 + P0 지시서 발행 | PF·ORDER | 🔵 |
| 06/14 | iMac/막내1 | P0 스키마 정돈 실행 — 41건 portfolio: 소급 삽입 완료 | 스크립트+41건 변경+COMPLETION | ✅ |
| 06/14 | iMac/민아 | P0 감사 — 58 vs 41 편차 정산(민아 상한추정 과대 자인), 막내1 결과 추인 | 감사 결과 | ✅ |
| 06/14 | iMac/쌍아 | 다중매칭 3건 판정(주제>도구 원칙) + 수동 삽입 1건(CITADEL_SEO_CDP) + 판정 원칙 명문화 | 1건 삽입+원칙 명문화 | ✅ |
| 06/15 | iMac/막내2 | P1 관계 인덱스 MVP 구현 — SQLite+FTS5 인덱서+검색CLI (2619문서, 33PF, 446링크) | build_index.js+search.js+COMPLETION | ✅ |
| 06/18 | iMac/막내2 | **P1.5 자동 갱신** — mk-push.sh 리빌드 연동 + governance/docs 스캔 확장 (3206문서, 35PF, 499링크) + .gitignore db-shm/wal 추가 | mk-push.sh+build_index.js | ✅ |
| 06/18 | iMac/쌍아 | **P2 의미검색 설계서** — Vertex AI text-multilingual-embedding-002 + SQLite 하이브리드(BM25+vector RRF). 증분 임베딩 설계 | DESIGN_20260618 | ⏳ 지시서 대기 |
| 06/18 | iMac/막내2 | P1.5 자동 갱신 — mk-push.sh 연동+스캔 범위 확장(governance/docs) (3206문서, 35PF, 499링크) | mk-push.sh·build_index.js 수정+COMPLETION | ✅ |
| 06/20 | iMac/막내1 | **P2 의미검색 구현** — Vertex AI embedding(3232건)+하이브리드 검색(BM25+Vector RRF)+증분 캐시 | embeddings.js·build_index.js·search.js 확장+COMPLETION | ✅ |
| 06/20 | iMac/막내1 | **P3 MCP 서버 구현** — lib.js 모듈화+mcp_server.js 4도구(search/lookup/relations/stats)+.mcp.json 등록 | lib.js·mcp_server.js 신규+search.js 리팩토링+COMPLETION | ✅ |

---

## 다중매칭 판정 원칙

파일명에 2개 이상 PF 코드네임이 포함된 경우의 귀속 판정:

- **주제가 귀속이고, 도구/수단은 귀속이 아니다.** 예: "CITADEL_SEO라이브진단_CDP" → SEO 진단이 주제(CITADEL), CDP는 도구 → `PF_CITADEL`
- 이미 frontmatter에 다중 PF가 명시된 경우(`portfolio: PF_A, PF_B`)는 작성자 의도를 존중하여 그대로 유지한다.
- P0-② 추론 보강 시에도 본 원칙을 적용한다.
