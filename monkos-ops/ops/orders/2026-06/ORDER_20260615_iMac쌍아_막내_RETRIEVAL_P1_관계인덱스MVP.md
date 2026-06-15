---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "PF_RETRIEVAL P1 — 관계 인덱스 MVP (frontmatter→그래프+BM25 검색)"
status: 발행
portfolio: PF_RETRIEVAL
priority: 즉시
---

# 지시서 — RETRIEVAL P1 관계 인덱스 MVP

> **[2026-06-15 13:31 KST] iMac/쌍아 → iMac/막내**
> 작가님 지시: 즉시 처리. 에이전트 온보딩 비용 0 수렴 + 작가님 인지부하 해소.
> 원천: `PROPOSAL_20260614_민아_데이터retrieval_네비게이션DB_최적화로드맵.md` §2-4 P1

---

## 배경

P0(스키마 정돈)에서 활성 PF 21개 대상 문서 41건에 `portfolio:` frontmatter를 소급 삽입했다. 이제 이 메타데이터를 **검색 가능한 인덱스**로 materialize하는 단계다.

**풀려는 문제:**
- 에이전트가 새 세션에서 "PF_SPREAD 관련 문서 전부"를 찾으려면 지금은 grep 반복 (키미 실험: 40분 소진)
- 작가님이 "어제 뭐 했지"를 알려면 쌍아에게 물어야 함
- PF 간 연결이 안 보임 (PF 27개, 조합 351쌍)

**해법:** frontmatter에서 엣지를 추출해 로컬 인덱스 구축 → type/PF/날짜/수발신으로 즉시 검색.

---

## 임무

### 1. frontmatter 파서

`scripts/retrieval/` 디렉토리 생성.

`scripts/retrieval/build_index.js` (또는 .py) 작성:

1. `monkos-ops/` 하위 전체 `.md` 파일을 재귀 스캔
2. YAML frontmatter 파싱 — 추출 필드:
   - `type` (session_log, completion, report, order, proposal, incident, spec, design, petition, portfolio)
   - `date`
   - `device`
   - `agent`
   - `portfolio` (단일 또는 다중)
   - `status`
   - `from` / `to` (수발신)
   - `subject`
3. 파일 경로·파일명에서 추가 추출:
   - 파일명 패턴의 PF 코드네임 (P0에서 확립한 매칭 규칙 준용)
   - 월별 폴더에서 날짜 추론 (frontmatter 없을 경우 fallback)

### 2. SQLite 인덱스 구축

`scripts/retrieval/monk_index.db` (SQLite):

```sql
-- 문서 테이블
CREATE TABLE documents (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  filename TEXT NOT NULL,
  type TEXT,
  date TEXT,
  device TEXT,
  agent TEXT,
  status TEXT,
  subject TEXT,
  from_agent TEXT,
  to_agent TEXT,
  content_preview TEXT  -- 본문 첫 200자 (BM25 검색용)
);

-- PF 귀속 테이블 (다대다)
CREATE TABLE doc_portfolios (
  doc_id INTEGER REFERENCES documents(id),
  portfolio TEXT NOT NULL
);

-- BM25 전문검색 (SQLite FTS5)
CREATE VIRTUAL TABLE documents_fts USING fts5(
  path, filename, subject, content_preview,
  content='documents', content_rowid='id'
);
```

### 3. 검색 CLI

`scripts/retrieval/search.js` (또는 .py):

```bash
# PF로 검색
node scripts/retrieval/search.js --pf PF_SPREAD

# 날짜 범위
node scripts/retrieval/search.js --from 2026-06-14 --to 2026-06-15

# 키워드 (BM25)
node scripts/retrieval/search.js --query "IndexNow sitemap"

# 복합
node scripts/retrieval/search.js --pf PF_IDPHOTO --type order --from 2026-06-01

# PF 간 관계 (공통 문서 수)
node scripts/retrieval/search.js --relations PF_SPREAD
```

출력: 파일 경로 + type + date + subject 한 줄 요약.

### 4. 인덱스 자동 갱신

`scripts/retrieval/build_index.js`를 멱등으로 구현 — 재실행 시 전체 재빌드 (증분은 P3에서).

### 5. 검증

- 인덱스 총 문서 수 보고
- 샘플 쿼리 5건 실행 결과 첨부:
  1. `--pf PF_SPREAD` → 관련 문서 목록
  2. `--pf PF_IDPHOTO --type order` → idphoto 지시서 목록
  3. `--query "IndexNow"` → 오늘 작업 관련 문서
  4. `--from 2026-06-14 --to 2026-06-15` → 어제~오늘 전체 산출물
  5. `--relations PF_OPUS` → 메타 PF와 연결된 하위 PF 문서 수

---

## 스코프 한정

- **대상**: `monkos-ops/` 하위 `.md` 파일. `governance/`, `docs/`는 P1에서 제외 (P2에서 확장)
- **임베딩 없음**: P1은 frontmatter 메타 + BM25 텍스트 검색만. 벡터 검색은 P2
- **MCP 노출 없음**: P1은 CLI만. MCP 서버는 P3
- **sqlite-vec 등 확장 없음**: 표준 SQLite + FTS5만 사용

---

## 산출물

1. `scripts/retrieval/build_index.js` — 인덱서
2. `scripts/retrieval/search.js` — 검색 CLI
3. `scripts/retrieval/monk_index.db` — 인덱스 파일 (.gitignore 등록)
4. COMPLETION 보고서 + 샘플 쿼리 5건 결과
5. PF_RETRIEVAL 히스토리 1행 어펜드
6. 커밋

---

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- monk_index.db는 .gitignore 등록 (재생성 가능, git 추적 불필요)
- monkos-ops/ 원본 파일 수정 금지 (읽기 전용 인덱싱)
- 기존 frontmatter 변경 금지 (P0 결과 보존)
