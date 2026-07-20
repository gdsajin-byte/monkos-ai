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
| P4 원격 접근 | 검색 API 배포(Cloud Run/Functions) → 웹민아·외부 접근 | ⚪ 대기 |
| P5 자가 진화 | 사용 피드백 루프 → 관계 가중치 갱신·portfolio 자동 추론 | ⚪ 대기 (P3 운용 실적 선행) |
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
| 06/21 | iMac/쌍아 | PF_STYLER·PF_INFRA 신설 → 인덱스 리빌드 (3252문서, 37PF, 523링크) | build_index.js 실행 | ✅ |
| 07/14 | M1/막내3 | **M1 DB 리빌드 + MCP 정규화** — 3,623문서/41PF/710링크. .mcp.json 래퍼 전환. rules/mcp-tools.md + skills 3개 신설. mk-push.sh 실패 가시화 | 36e3e959 | ✅ |
| 07/14 | M1/쌍아 | **P3 운용 실적 첫 건** — PF 필터·관계맵·BM25 전부 작동 확인. "MCP impersonation" 검색으로 4월 SA 임퍼소네이션 지시서(ORDER_20260405) 발굴 = 사문화가 아니었으면 오늘 논의 3개월 이력을 즉시 찾았을 실증. 한국어 BM25는 형태소 미지원으로 실패 → 벡터 임베딩 리빌드 필요 | CLI 실측 | ✅ |
| 07/14 | M1/쌍아 | **🔴 전면 사문화 판정** — 6/21 이후 MCP 도구 호출 0건(전 디바이스), M1 monk_index.db 미존재(빌드 안 됨), GA4/GSC MCP도 사문화(크리덴셜 iMac 경로 하드코딩으로 M1 불가). mk-push.sh 리빌드 실패도 `\|\| echo`로 무시되어 인지 안 됨. 원인: ①DB가 .gitignore→디바이스 전파 불가 ②.mcp.json 크리덴셜 iMac 종속 ③에이전트 습관적 미사용(grep/Read 우회). **긴급 어젠다: 크리덴셜 정규화 + M1 DB 빌드 + rules/skills 강제 경로 필요** | — | 🔴 긴급 |
| 07/20 | iMac/민아 | **🔴 근본 원인 확정 — 임베딩 자기파괴 구조** — iMac 실측: 인덱스 신선(3,813건·7/19)하나 임베딩 0건·doc_embeddings 테이블 부재. 진범: mk-push.sh:12가 `--embed` 없이 리빌드 → build_index.js:99가 DB 통삭제 → 6/20 P2 임베딩 3,232건이 직후 첫 푸시에서 전량 소실, 이후 매 푸시 BM25 전용. 한국어 다어절 0건("시타델 대시보드" 등)+MCP 무음 강등으로 34일 미인지. 판정: 습관적 미사용은 원인 아닌 결과(품질→신뢰→습관 붕괴 연쇄). 처방 4종(P0 --embed 전환+무음강등금지 / P1 전량 리임베딩 / P2 한국어 BM25 보강 / P3 품질 복원 후 강제 경로) 쌍아 지시서 대기 | REPORT_20260720_iMac민아_RETRIEVAL_사문화_근본원인진단 | 🔴 긴급 |

---

## 다중매칭 판정 원칙

파일명에 2개 이상 PF 코드네임이 포함된 경우의 귀속 판정:

- **주제가 귀속이고, 도구/수단은 귀속이 아니다.** 예: "CITADEL_SEO라이브진단_CDP" → SEO 진단이 주제(CITADEL), CDP는 도구 → `PF_CITADEL`
- 이미 frontmatter에 다중 PF가 명시된 경우(`portfolio: PF_A, PF_B`)는 작성자 의도를 존중하여 그대로 유지한다.
- P0-② 추론 보강 시에도 본 원칙을 적용한다.
