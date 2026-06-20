---
type: order
date: 2026-06-20
from: iMac/쌍아
to: 막내
device: iMac
agent: 쌍아
portfolio: PF_RETRIEVAL
status: 발행
---

# 지시서: PF_RETRIEVAL P3 — MCP 서버 구현 (에이전트 자율 검색)

> **[2026-06-20 11:01 KST]** iMac/쌍아 → 막내
> 설계서: `monkos-ops/tech/designs/2026-06/DESIGN_20260620_RETRIEVAL_P3_MCP서버.md`

---

## 목표

P2에서 구현한 하이브리드 검색을 MCP 서버로 노출하여, 에이전트가 대화 중 도구 호출로 운영 문서를 자율 검색할 수 있게 한다.

---

## 작업 범위

### 1. `lib.js` 신규 — 검색 로직 모듈화

기존 `search.js`에서 핵심 함수를 분리하여 MCP 서버와 CLI가 공유할 모듈을 만든다.

**분리 대상 함수:**
- `openDB()` — DB 연결
- `hasEmbeddings(db)` — 임베딩 테이블 존재 여부
- `searchBM25(db, query, args)` — BM25 검색
- `searchVector(db, query, limit)` — 벡터 검색
- `rrfFusion(bm25Results, vectorResults, k)` — RRF 결합
- `cosineSimilarity(a, b)` — 코사인 유사도
- `searchByFilters(db, args)` — 필터 검색
- `searchRelations(db, pfName)` — PF 관계 맵

```js
// lib.js exports
module.exports = {
  openDB, hasEmbeddings,
  searchBM25, searchVector, rrfFusion, cosineSimilarity,
  searchByFilters, searchRelations
};
```

### 2. `search.js` 리팩토링

`lib.js`에서 import하여 기존 CLI 동작을 유지한다. 함수 정의를 제거하고 `require('./lib')`로 전환.

⚠️ **기존 CLI 동작 100% 유지 필수** — 사용법, 출력 형식, --mode, --query, --pf 등 모든 인터페이스 동일.

### 3. `mcp_server.js` 신규 — MCP 서버 진입점

`@modelcontextprotocol/sdk`를 사용하여 stdio transport 기반 MCP 서버를 구현한다.

**4개 도구 등록:**

#### 3.1 `monk_search`
```
입력: query(필수), mode, pf, type, from, to, limit
동작: lib.js의 searchBM25/searchVector/rrfFusion 호출
반환: JSON 배열 — [{path, type, date, subject, content_preview(200자)}]
```
- mode 기본값: 임베딩 있으면 "hybrid", 없으면 "bm25"
- limit 기본값: 10, 최대 20
- content_preview: documents 테이블의 content_preview를 200자로 잘라서 포함

#### 3.2 `monk_lookup`
```
입력: path(필수)
동작: 프로젝트 루트 + path로 파일 읽기 (fs.readFileSync)
반환: 문서 전문 텍스트 (10,000자 제한, 초과 시 잘림 + "[...truncated]" 경고)
```
- 프로젝트 루트: `path.resolve(__dirname, '../..')`
- 파일 미존재 시 에러 메시지 반환 (throw 아님)

#### 3.3 `monk_relations`
```
입력: pf(필수)
동작: lib.js의 searchRelations 호출
반환: JSON 배열 — [{portfolio, shared_docs}]
```

#### 3.4 `monk_stats`
```
입력: 없음
동작: documents/doc_portfolios/doc_embeddings 테이블 COUNT + DB 파일 mtime
반환: JSON — {documents, pf_links, unique_pfs, embeddings, db_updated}
```

**벡터 검색 시 캐시:**
- 서버 프로세스 수명 동안 쿼리→벡터 Map 캐시
- 동일 쿼리 재호출 시 Vertex AI API 생략

**에러 핸들링:**
- Vertex AI 호출 실패 → BM25 폴백 + 경고 메시지 포함
- DB 없음 → "인덱스 없음. build_index.js를 먼저 실행하세요." 반환

**MCP 서버 구현 패턴:**
```js
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const server = new McpServer({
  name: 'monk-retrieval',
  version: '1.0.0',
});

// server.tool(name, schema, handler) 패턴으로 4개 등록
// ...

const transport = new StdioServerTransport();
server.connect(transport);
```

### 4. `package.json` 의존성 추가

```json
"@modelcontextprotocol/sdk": "^1.29.0"
```

`npm install` 실행.

### 5. `.claude/settings.json` MCP 서버 등록

기존 settings.json에 `mcpServers` 키를 추가한다. **기존 hooks/permissions는 절대 변경하지 않는다.**

```json
{
  "mcpServers": {
    "monk-retrieval": {
      "command": "node",
      "args": ["scripts/retrieval/mcp_server.js"]
    }
  }
}
```

⚠️ `cwd`는 넣지 않는다. `mcp_server.js` 내부에서 `__dirname` 기반으로 DB 경로를 해결한다.

---

## 검증 기준

- [ ] `node search.js --query "증명사진 품질"` — 리팩토링 전과 동일한 결과 (하위호환)
- [ ] `node search.js --mode bm25 --query "헌법"` — 기존 CLI 정상
- [ ] `node mcp_server.js` 직접 실행 시 stdin/stdout MCP 프로토콜 응답
- [ ] monk_search query="증명사진 품질" → content_preview 포함 결과 반환
- [ ] monk_lookup path="governance/laws/ch1_agent_system.md" → 전문 반환
- [ ] monk_lookup path="없는파일.md" → 에러 메시지 (crash 아님)
- [ ] monk_relations pf="PF_CITADEL" → 관련 PF 목록
- [ ] monk_stats → 문서 수, PF 수, 임베딩 수, DB 갱신 시각

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키 생성/추측 금지. Vertex AI는 기존 ADC 인증.
- **ch2 코딩 규칙**: 순수 JS, camelCase, 한국어 출력.
- **.claude/settings.json 수정 시**: 기존 hooks·permissions 블록 절대 변경 금지. mcpServers 키만 추가.
- **lib.js 분리 시**: search.js의 기존 출력 형식·CLI 인터페이스 100% 유지.

---

## 산출물

1. `scripts/retrieval/lib.js` (신규)
2. `scripts/retrieval/search.js` (리팩토링)
3. `scripts/retrieval/mcp_server.js` (신규)
4. `scripts/retrieval/package.json` (의존성 추가)
5. `.claude/settings.json` (mcpServers 추가)
6. COMPLETION 보고서 → `monkos-ops/ops/reports/2026-06/`
