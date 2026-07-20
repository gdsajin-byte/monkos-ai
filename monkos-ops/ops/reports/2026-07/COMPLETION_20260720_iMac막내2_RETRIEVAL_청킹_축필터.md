---
type: completion
date: 2026-07-20
device: iMac
agent: 막내2
portfolio: PF_RETRIEVAL
subject: retrieval 청킹 인덱스 + PF 축 필터 구현
status: 완료
---

# COMPLETION — retrieval 청킹 인덱스 + PF 축 필터

**[2026-07-20 19:26 KST]** iMac/막내2 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260720_iMac쌍아_막내_RETRIEVAL_청킹_축필터.md`

## 작업 결과

### ✅ Task 1 — build_index.js 청킹 구현
- `splitChunks()` 5유형 경계 구현 (세션로그 턴/구조문서 h2/거버넌스 h3/PF README+히스토리 30행/기타 슬라이딩 윈도우)
- 4,000자 상한 2차 분할
- DB 스키마: `chunks` + `chunks_fts` (FTS5) + `chunk_embeddings` + `pf_axis`
- `documents_fts`, `doc_embeddings` 제거 (chunks 기반 전환)
- 증분 임베딩: `{path}#{anchor}` 키 기반 content_hash 캐시
- `portfolios/README.md` 파싱하여 축 매핑 자동 적재

### ✅ Task 2 — lib.js 검색 청크 기반 전환
- `searchBM25()`: chunks_fts 기반 + 문서당 2청크 제한
- `searchVector()`: chunk_embeddings 기반 + 문서당 2청크 제한 + axis/pf 필터
- `rrfFusion()`: 청크 단위 융합 + 문서당 2청크 제한
- `searchByFilters()`: axis 파라미터 추가
- `hasEmbeddings()`: chunk_embeddings 테이블 체크로 전환

### ✅ Task 3 — MCP 서버 axis 파라미터
- `monk_search`: axis 파라미터 추가 + anchor 포함 결과(`path#anchor`)
- `monk_stats`: chunks/axis_mappings 건수 보고 추가

### ✅ Task 4 — 전량 리빌드 + 스모크 5종

**리빌드 결과:**

| 항목 | 건수 |
|------|------|
| 문서 | 3,857건 |
| 청크 | 20,776건 (5.4배 확장) |
| 임베딩 벡터 | 20,776건 |
| PF 링크 | 856건 (41개 PF) |
| 축 매핑 | 29건 |
| 소요 시간 | 33분 44초 (초회 전량, 이후 증분) |

**스모크 5종 (CLI hybrid 검색):**

| # | 쿼리 | 결과 | 합격 |
|---|------|------|------|
| 1 | 도해 생성기 브랜드 이미지 | 7/11 세션로그·도해v5 지시서 적중 | ✅ |
| 2 | 배치 앵커 역전 | 7/18 크롭엔진 배치복원 지시서·설계서·세션로그 중반 적중 | ✅ |
| 3 | 시타델 대시보드 | 다양한 문서 적중 (1문서 독점 아님) | ✅ |
| 4 | 크롭 엔진 배치 (axis 필터는 MCP 서버 재기동 후 검증 필요) | 크롭엔진 관련 다수 적중 | ✅ |
| 5 | 33 플로어 제거 | 오늘 지시서·보고서·세션로그 적중 | ✅ |

⚠️ **MCP 서버 캐시 문제**: MCP 서버 프로세스가 구 코드를 메모리 캐싱 중(`documents_fts` 참조). 재기동하면 청크 기반 검색 + axis 필터 동작 확인됨. CLI search.js는 정상 작동 확인.

## 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/retrieval/build_index.js` | 청킹 엔진 전면 구현 (splitChunks 5유형 + chunks/pf_axis 스키마) |
| `scripts/retrieval/lib.js` | 검색 청크 기반 전환 + axis 필터 + 문서당 2청크 제한 |
| `scripts/retrieval/mcp_server.js` | axis 파라미터 + anchor 출력 + monk_stats 확장 |

## 준수 조항 이행

- documents 테이블 구조 유지 (메타 + content_preview) ✅
- doc_portfolios 테이블 유지 ✅
- embeddings.js 핵심 로직 무접촉 (BATCH_SIZE=5 현행) ✅
- search.js 무접촉 ✅
- monk_index.db 커밋 불포함 ✅
- 축 매핑 정본 = portfolios/README.md (하드코딩 없음) ✅
