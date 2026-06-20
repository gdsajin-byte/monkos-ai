---
type: design
date: 2026-06-20
device: iMac
agent: 쌍아
portfolio: PF_RETRIEVAL
status: 설계
---

# DESIGN: PF_RETRIEVAL P3 — MCP 서버 (에이전트 자율 검색)

> **[2026-06-20 10:51 KST]** iMac/쌍아 → 작가님
> P2(하이브리드 검색)를 MCP 서버로 노출하여 전 에이전트가 대화 중 자율 검색 가능하게 한다.
> 이것으로 RAG의 A+G가 완성된다 — 에이전트의 컨텍스트가 A, 응답이 G.

---

## 1. 목표

에이전트(쌍아·막내·민아)가 대화 중에 **도구 호출**로 3200+건의 운영 문서를 검색·조회할 수 있게 한다. 현재는 사람이 `node search.js`를 터미널에서 실행해야 하는데, MCP로 노출하면 에이전트가 스스로 검색 판단을 내린다.

**전/후 비교:**

```
현재:  작가님 "PF_CITADEL 관련 문서 찾아봐" → 에이전트가 Bash로 node search.js 실행
P3:    에이전트가 맥락 판단 → 자동으로 monk_search 도구 호출 → 결과를 컨텍스트에 활용
```

---

## 2. 아키텍처

```
Claude Code (쌍아/막내/민아)
    ↓ MCP stdio
monk-retrieval-server
    ↓ better-sqlite3
monk_index.db (P2에서 빌드된 인덱스)
    ↓ (벡터 검색 시)
Vertex AI Embeddings API
```

### Transport: stdio

- Claude Code의 로컬 MCP는 stdio 기반
- `.claude/settings.json`에 등록 → git 추적 → pull하면 전 디바이스 자동 적용
- 별도 포트·프로세스 관리 불필요

---

## 3. MCP 도구 설계

### 3.1 `monk_search` — 문서 검색

에이전트의 주력 도구. 키워드·의미 검색 + 필터 조합.

```json
{
  "name": "monk_search",
  "description": "MONK 운영 문서 3200+건에서 키워드·의미 하이브리드 검색. PF·유형·날짜 필터 지원.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "검색 쿼리 (자연어)" },
      "mode": { "type": "string", "enum": ["hybrid", "bm25", "vector"], "default": "hybrid" },
      "pf": { "type": "string", "description": "PF 필터 (예: PF_CITADEL)" },
      "type": { "type": "string", "description": "문서 유형 필터 (예: order, session_log, design)" },
      "from": { "type": "string", "description": "시작일 (YYYY-MM-DD)" },
      "to": { "type": "string", "description": "종료일 (YYYY-MM-DD)" },
      "limit": { "type": "number", "default": 10, "description": "결과 수 (최대 20)" }
    },
    "required": ["query"]
  }
}
```

반환: 문서 경로, 유형, 날짜, subject, content_preview (200자)

### 3.2 `monk_lookup` — 문서 상세 조회

검색 결과에서 특정 문서의 전문(全文)을 읽을 때.

```json
{
  "name": "monk_lookup",
  "description": "인덱스에 등록된 문서의 전문을 읽는다. monk_search 결과의 path를 입력.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "문서 상대 경로 (monk_search 결과의 path)" }
    },
    "required": ["path"]
  }
}
```

반환: 문서 전문 (markdown). 프로젝트 루트 기준 상대경로 → 절대경로 변환 후 fs.readFile.

### 3.3 `monk_relations` — PF 관계 맵

```json
{
  "name": "monk_relations",
  "description": "특정 PF와 문서를 공유하는 관련 PF 목록. 프로젝트 간 연결 파악용.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "pf": { "type": "string", "description": "PF명 (예: PF_CITADEL)" }
    },
    "required": ["pf"]
  }
}
```

### 3.4 `monk_stats` — 인덱스 통계

```json
{
  "name": "monk_stats",
  "description": "현재 인덱스 상태 — 문서 수, PF 수, 임베딩 수, 최종 빌드 시각.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 4. 기술 결정

### 4.1 기존 코드 재사용

search.js의 핵심 함수들을 `lib.js`로 분리하여 MCP 서버와 CLI 양쪽에서 공유.

```
scripts/retrieval/
  ├─ lib.js              ← 신규: 검색 로직 모듈 (searchBM25, searchVector, rrfFusion 등)
  ├─ search.js           ← 수정: lib.js import로 전환 (CLI 유지)
  ├─ mcp_server.js       ← 신규: MCP 서버 진입점
  ├─ embeddings.js       ← 기존 유지
  ├─ build_index.js      ← 기존 유지
  ├─ monk_index.db       ← 기존 유지
  └─ package.json        ← @modelcontextprotocol/sdk 추가
```

### 4.2 의존성 추가

```json
{
  "@modelcontextprotocol/sdk": "^1.29.0"
}
```

### 4.3 Claude Code 등록

`.claude/settings.json`에 추가:

```json
{
  "mcpServers": {
    "monk-retrieval": {
      "command": "node",
      "args": ["scripts/retrieval/mcp_server.js"],
      "cwd": "/Users/jeong-kyushin/developer/monk_project"
    }
  }
}
```

⚠️ `cwd`는 디바이스마다 다를 수 있음. 상대경로 또는 `__dirname` 기반으로 DB 경로를 해결하므로, `cwd`는 프로젝트 루트만 맞으면 됨.

### 4.4 전 디바이스 배포

`.claude/settings.json`은 git 추적 대상 → push/pull로 자동 전파. 단 `cwd` 경로가 디바이스별로 다를 수 있으므로:
- M1: `/Users/jeong-kyushin/developer/monk_project`
- iMac: 동일
- M2: `/Users/jeong-kyushin/developer/monk_project` (확인 필요)

→ 프로젝트 `.claude/settings.json`은 `cwd` 없이, `mcp_server.js` 내부에서 `__dirname` 기반으로 DB 경로 해결. command args에 절대경로 대신 상대경로 사용.

---

## 5. 벡터 검색 시 API 호출 관리

`monk_search --mode hybrid` 또는 `--mode vector` 시 쿼리 임베딩을 위해 Vertex AI API를 호출한다. 에이전트가 반복 호출할 수 있으므로:

- 동일 쿼리 캐시: 세션 내 Map에 쿼리→벡터 캐시 (서버 프로세스 수명 동안)
- BM25 폴백: Vertex AI 호출 실패 시 BM25 단독 결과 반환 + 경고 메시지
- 기본 모드: hybrid (임베딩 있을 때), bm25 (없을 때)

---

## 6. 검증 기준

- [ ] Claude Code 재시작 후 `monk_search`, `monk_lookup`, `monk_relations`, `monk_stats` 4개 도구가 도구 목록에 노출
- [ ] 에이전트가 대화 중 "PF_CITADEL 관련 문서 찾아봐" → `monk_search` 자동 호출
- [ ] `monk_search` query="증명사진 품질" → P2와 동일한 hybrid 결과 반환
- [ ] `monk_lookup` path="governance/laws/ch1_agent_system.md" → 전문 반환
- [ ] `monk_relations` pf="PF_CITADEL" → 관련 PF 목록 반환
- [ ] Vertex AI 호출 실패 시 BM25 폴백 정상
- [ ] `search.js` CLI 기존 동작 유지 (리팩토링 후 하위호환)

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| MCP 서버 시작 실패 (의존성·경로) | 중 | 에러 로그 + Claude Code 재시작 안내 |
| 벡터 검색 시 API 지연 (>3초) | 낮 | 타임아웃 5초 + BM25 폴백 |
| monk_lookup으로 대용량 파일 반환 | 중 | 10,000자 제한 + 잘림 경고 |
| 디바이스별 경로 차이 | 중 | __dirname 기반 해결, cwd 불사용 |

---

## 8. 실행 순서

1. `lib.js` 분리 (search.js 핵심 함수 모듈화)
2. `search.js` 리팩토링 (lib.js import)
3. `mcp_server.js` 구현
4. `package.json` 의존성 추가 + npm install
5. `.claude/settings.json`에 mcpServers 등록
6. Claude Code 재시작 → 도구 노출 검증
7. 실제 대화에서 자율 검색 테스트

> 본 설계서는 read-only. 코드 변경은 승인 후 막내 지시서 경유.
