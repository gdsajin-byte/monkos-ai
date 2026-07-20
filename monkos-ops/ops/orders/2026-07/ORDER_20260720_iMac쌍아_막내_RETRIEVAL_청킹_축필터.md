---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_RETRIEVAL
---

# 지시서: retrieval 청킹 인덱스 + PF 축 필터 구현

> **[2026-07-20 18:43 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 18:35 KST
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260720_retrieval_청킹_축귀속_참조규칙.md`
> 민아 보강 4건 반영

## 배경

현행 인덱서는 문서 1건 = 인덱스 1행. 문서 첫 2,000자만 FTS+임베딩 대상이라 세션 로그 중후반 이력 검색 불가. 문서 → 청크 단위 전환으로 턴/섹션 단위 검색 실현.

## Task 1 — build_index.js 청킹 구현

### 1-A. 청크 분할 함수 `splitChunks(content, type)`

| 문서 유형 (type) | 청크 경계 | anchor 생성 |
|-----------------|----------|-------------|
| `session_log` | `**[YYYY-MM-DD HH:MM KST]**` 패턴 | `#YYYY-MM-DD-HHMM` |
| `order`, `completion`, `report`, `proposal`, `design`, `spec`, `petition` | `## ` (h2) | `#섹션명-kebab` |
| 법률·헌법 (governance/) | `### ` (h3) | `#조항명-kebab` |
| PF README | `## ` (h2) — 히스토리는 30행씩 분할 | `#현재상태`, `#히스토리-1` 등 |
| 기타 | 2,000자 슬라이딩 윈도우 (500자 오버랩) | `#chunk-N` |

**청크 상한**: 유형 무관 4,000자 초과 시 2차 분할 (임베딩 페이로드 방어).

### 1-B. DB 스키마 변경

기존 `documents` 테이블 유지 (문서 메타). 신규 테이블:

```sql
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY,
  doc_id INTEGER REFERENCES documents(id),
  chunk_index INTEGER NOT NULL,
  anchor TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL
);

CREATE VIRTUAL TABLE chunks_fts USING fts5(
  content,
  content='chunks', content_rowid='id'
);

CREATE TABLE chunk_embeddings (
  chunk_id INTEGER PRIMARY KEY REFERENCES chunks(id),
  embedding BLOB NOT NULL,
  content_hash TEXT NOT NULL
);
```

기존 `documents_fts`, `doc_embeddings`는 삭제 (chunks 기반으로 전환).

### 1-C. 축 매핑 테이블

```sql
CREATE TABLE pf_axis (
  portfolio TEXT PRIMARY KEY,
  axis TEXT NOT NULL
);
```

빌드 시 `portfolios/README.md` 인덱스를 파싱하여 `축` 컬럼 값을 `pf_axis`에 적재. **값 복사 금지 — 인덱스가 유일한 정본**.

### 1-D. 증분 임베딩

청크별 `content_hash` 기반. 기존 캐시 로드 → 해시 비교 → 변경분만 재임베딩.
- `loadExistingEmbeddings()`를 chunks 기반으로 전환 (키: `{path}#{anchor}`)

### 1-E. content_preview 유지

`documents.content_preview`는 기존 2,000자 유지 (검색 결과 미리보기용). 검색은 chunks_fts + chunk_embeddings 기반.

## Task 2 — lib.js 검색 청크 기반 전환

### 2-A. searchBM25

`documents_fts` → `chunks_fts` 전환. 반환에 `anchor` 포함.
- 필터(pf, type, date, from, to)는 `documents` 조인으로 승계.
- **문서당 최대 2청크 제한**: 같은 doc_id의 청크가 3개 이상 상위에 오면 상위 2개만 유지, 나머지는 다른 문서에 양보.

### 2-B. searchVector

`doc_embeddings` → `chunk_embeddings` 전환. 동일 문서당 2청크 제한 적용.

### 2-C. rrfFusion

- 기존 최신성 가중 유지 (날짜는 chunks → documents 조인으로 취득)
- 융합 후에도 문서당 2청크 제한 적용
- 반환 형식: `{ path, anchor, type, date, subject, content_preview, rrfScore }`

### 2-D. axis 필터 추가

`searchByFilters`, `searchBM25`에 `axis` 파라미터 추가:
```sql
-- axis 필터 시
d.id IN (
  SELECT doc_id FROM doc_portfolios dp
  JOIN pf_axis pa ON dp.portfolio = pa.portfolio
  WHERE pa.axis = ?
)
```

## Task 3 — MCP 서버 axis 파라미터

`mcp_server.js`의 `monk_search` 도구에 추가:

```js
axis: z.string().optional().describe('PF 축 필터 (IDPHOTO/OPUS/AUTOPILOT/STYLER/PARTNER)'),
```

검색 결과 반환에 `anchor` 필드 추가. 결과 표시: `path#anchor`.

## Task 4 — 전량 리빌드 + 스모크 5종

```bash
cd scripts/retrieval && node build_index.js --embed
```

리빌드 후 보고: 문서 수, 청크 수, 임베딩 수, 축 매핑 수, 소요 시간.

**스모크 5종** (MCP `monk_search`):

| # | 쿼리 | 합격 기준 |
|---|------|----------|
| 1 | `도해 생성기 브랜드 이미지` | 7/11 세션 로그 **턴 단위** 적중 (path#anchor) |
| 2 | `배치 앵커 역전 IDPHOTO` | 7/18 세션 로그 중반 턴 적중 |
| 3 | `시타델 대시보드` | 기존 유지 (다양성 — 1문서 독점 아님) |
| 4 | `크롭 엔진 배치` (axis=IDPHOTO) | IDPHOTO 축 문서만 반환 |
| 5 | `33 플로어 제거` | 오늘 지시서·보고서 적중 |

5종 전량 적중이 합격. 민아 검증.

## ⚠️ 준수 조항

- `documents` 테이블 구조 유지 (메타 + content_preview)
- `doc_portfolios` 테이블 유지 (PF 링크)
- `embeddings.js` 핵심 로직 무접촉 (배치 크기만 현행 유지)
- `search.js` 무접촉 (CLI 도구)
- monk_index.db는 gitignore 대상
- 축 매핑 정본 = portfolios/README.md (하드코딩 금지)

## 완료 기준

- [ ] 청크 분할 함수 구현 (5유형 경계 + 4,000자 상한)
- [ ] DB 스키마 chunks + chunk_embeddings + pf_axis
- [ ] 검색 청크 기반 전환 + 문서당 2청크 제한
- [ ] axis 필터 (build + lib + MCP)
- [ ] 전량 리빌드 완료 (문서·청크·임베딩·축 건수 보고)
- [ ] 스모크 5종 전량 적중
- [ ] COMPLETION 보고서 + 세션 로그 + PF_RETRIEVAL 어펜드 + 커밋 + 푸시
