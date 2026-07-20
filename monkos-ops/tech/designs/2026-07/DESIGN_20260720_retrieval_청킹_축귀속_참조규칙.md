---
type: design
date: 2026-07-20
device: iMac
agent: 쌍아
subject: retrieval 청킹 인덱스 + PF 축 귀속 + 아카이브 참조 규칙
status: 설계
---

# 설계서: retrieval 청킹 + PF 축 귀속 + 참조 규칙

> **[2026-07-20 18:27 KST]** iMac/쌍아
> 민아 설계 입력 4건 반영

## 1. 현황과 문제

### 현재 구조
- `build_index.js`: 문서 1건 = 인덱스 1행. `content_preview` = 문서 첫 2,000자
- `lib.js`: BM25(FTS5) + 벡터(cosine) → RRF 융합 + 최신성 가중
- 3,833건 문서, 3,833건 임베딩

### 문제 3가지
1. **절단 손실**: 세션 로그(수백~수천 줄)의 중후반 이력이 인덱스 밖. 7/11 도해 작업(15번째 턴)이 "도해 생성기"로 검색 안 된 원인
2. **축 필터 부재**: PF 31개가 평면. "인프라 도구 PF만 보여줘"가 불가
3. **아카이브 참조 미인지**: 에이전트가 README만 읽고 ARCHIVE가 전량임을 모름

## 2. 설계 — 3건 한 묶음

### 2-A. 청킹 인덱스 (O1)

**핵심 변경**: 문서 단위 → 청크 단위 인덱싱

**청크 경계 규칙** (우리 문서 체계가 이미 규격화):

| 문서 유형 | 청크 경계 | 예시 |
|----------|----------|------|
| 세션 로그 | `**[YYYY-MM-DD HH:MM KST]**` 턴 단위 | 각 턴이 1청크 |
| 보고서·제안서·설계서 | `## ` (h2) 섹션 단위 | 각 섹션이 1청크 |
| PF README | `## ` 섹션 + 히스토리는 행 30개씩 | Phase 현황/히스토리 분리 |
| 법률·헌법 | `### ` (h3) 조항 단위 | 각 조가 1청크 |
| 기타 | 2,000자 슬라이딩 윈도우 (500자 오버랩) | 폴백 |

**DB 스키마 변경**:

```sql
-- 기존 documents 테이블 유지 (문서 메타)
-- 신규: chunks 테이블
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY,
  doc_id INTEGER REFERENCES documents(id),
  chunk_index INTEGER NOT NULL,  -- 문서 내 순서
  anchor TEXT,                    -- #턴타임스탬프 또는 #섹션명
  content TEXT NOT NULL,          -- 청크 원문 (FTS+임베딩 대상)
  content_hash TEXT NOT NULL
);

-- FTS를 chunks 기반으로 전환
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  content,
  content='chunks', content_rowid='id'
);

-- 임베딩도 chunks 기반
CREATE TABLE chunk_embeddings (
  chunk_id INTEGER PRIMARY KEY REFERENCES chunks(id),
  embedding BLOB NOT NULL,
  content_hash TEXT NOT NULL
);
```

**검색 반환 형식**: `path#anchor` — 에이전트가 파일의 특정 지점을 바로 Read 가능

**증분 임베딩**: 청크별 content_hash 기반. append-only 문서에서 기존 청크 해시 불변 → 신규 청크만 임베딩. 우리 구조의 공짜 이점.

**예상 규모**: 3,833문서 → ~15,000~25,000 청크. 임베딩 비용 1회성 소액, 이후 증분만.

### 2-B. PF 축 귀속 필터

**정본**: `portfolios/README.md` 인덱스에 `축` 컬럼 추가 (값 복사 금지 — 인덱서가 이 표를 파싱)

```markdown
| PF | ... | 축 |
|---|---|---|
| PF_CROP | ... | IDPHOTO |
| PF_CDP | ... | AUTOPILOT |
```

**인덱서 변경**: `build_index.js`가 빌드 시 `portfolios/README.md`를 파싱하여 PF→축 매핑 테이블 생성

```sql
CREATE TABLE pf_axis (
  portfolio TEXT PRIMARY KEY,
  axis TEXT NOT NULL  -- IDPHOTO | OPUS | AUTOPILOT | STYLER | PARTNER
);
```

**MCP 검색 필터 확장**: `monk_search`에 `axis` 파라미터 추가

```
monk_search("크롭 배치", axis: "IDPHOTO")  -- IDPHOTO 축 PF 문서만
```

### 2-C. 아카이브 참조 규칙

**ch7 (막내 강령) 추가 1줄**:
> PF 히스토리 = README 히스토리 + ARCHIVE_HISTORY.md + ARCHIVE_PHASES.md 합본이 전량. 막힘 시 ARCHIVE를 먼저 Read.

**mcp-tools.md 추가 1줄**:
> monk_search는 ARCHIVE 파일도 인덱싱. 축 필터: `axis` 파라미터로 IDPHOTO/OPUS/AUTOPILOT/STYLER/PARTNER 지정 가능.

## 3. 구현 순서

| 단계 | 작업 | 파일 | 담당 |
|------|------|------|------|
| 1 | portfolios/README.md에 축 컬럼 추가 | 인덱스 1파일 | 쌍아 직접 |
| 2 | ch7 + mcp-tools.md 규칙 추가 | rules 2파일 | 쌍아 직접 |
| 3 | build_index.js 청킹 구현 | retrieval 1파일 | 막내 |
| 4 | lib.js 검색 청크 기반 전환 + axis 필터 | retrieval 1파일 | 막내 |
| 5 | MCP 서버 axis 파라미터 추가 | retrieval 1파일 | 막내 |
| 6 | 전량 리빌드 + 스모크 5종 | — | 막내 |

단계 1-2는 독립, 3-5는 순차, 6은 최종.

## 4. 검증 게이트 (도구 3요건 스모크)

| # | 쿼리 | 합격 기준 |
|---|------|----------|
| 1 | `도해 생성기 브랜드 이미지` | 7/11 세션 로그 **턴 단위** 적중 (path#anchor) |
| 2 | `배치 앵커 역전 IDPASS` | 7/18 세션 로그 중반 턴 적중 |
| 3 | `시타델 대시보드` | 기존 유지 |
| 4 | `크롭 엔진 배치` axis=IDPHOTO | IDPHOTO 축 문서만 반환 |
| 5 | `33 플로어 제거` | 오늘 지시서·보고서 적중 |

5종 전량 적중이 합격. 민아 검증.

## 5. O3 동승 판단

한국어 trigram 토크나이저(O3) — 청킹이 들어가면 각 청크가 짧아져서 BM25의 한국어 매칭이 개선됩니다(긴 문서에서 희석되던 키워드가 청크 안에서 밀도 상승). O3는 청킹 후 실측하여 여전히 필요하면 후속으로. 이번 미동승.
