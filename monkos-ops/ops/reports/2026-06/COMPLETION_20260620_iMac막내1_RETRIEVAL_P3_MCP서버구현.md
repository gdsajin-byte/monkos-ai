---
type: completion
date: 2026-06-20
device: iMac
agent: 막내1
portfolio: PF_RETRIEVAL
status: 완료
---

# COMPLETION: PF_RETRIEVAL P3 — MCP 서버 구현 (에이전트 자율 검색)

> **[2026-06-20 11:05 KST]** iMac/막내1 → 작가님

## 지시서

`ORDER_20260620_iMac쌍아_막내_RETRIEVAL_P3_MCP서버구현.md`

## 산출물

| # | 파일 | 상태 |
|---|------|------|
| 1 | `scripts/retrieval/lib.js` | ✅ 신규 — 검색 로직 모듈화 (8개 함수 + 쿼리 벡터 캐시) |
| 2 | `scripts/retrieval/search.js` | ✅ 리팩토링 — lib.js import, CLI 동작 100% 유지 |
| 3 | `scripts/retrieval/mcp_server.js` | ✅ 신규 — MCP 서버 4개 도구 |
| 4 | `scripts/retrieval/package.json` | ✅ @modelcontextprotocol/sdk 추가 |
| 5 | `.mcp.json` | ✅ monk-retrieval 서버 등록 |
| 6 | COMPLETION 보고서 | ✅ 본 문서 |

## 검증 결과

| 항목 | 결과 |
|------|------|
| `search.js --query "증명사진 품질"` 리팩토링 후 하위호환 | ✅ P2와 동일 결과 |
| `search.js --mode bm25 --query "헌법"` CLI 정상 | ✅ |
| MCP 서버 stdio 프로토콜 응답 | ✅ initialize + tools/list 정상 |
| 4개 도구 노출 (monk_search, monk_lookup, monk_relations, monk_stats) | ✅ |
| `.mcp.json` monk-retrieval 등록 | ✅ |

## MCP 도구 상세

| 도구 | 설명 |
|------|------|
| `monk_search` | 하이브리드 검색 (query, mode, pf, type, from, to, limit) |
| `monk_lookup` | 문서 전문 읽기 (path, 10,000자 제한) |
| `monk_relations` | PF 관계 맵 (pf) |
| `monk_stats` | 인덱스 통계 (문서 수, PF 수, 임베딩 수, DB 갱신 시각) |

## 기술 상세

- **lib.js 분리**: search.js의 8개 핵심 함수를 모듈로 분리. 쿼리 벡터 캐시 (프로세스 수명 동안 유지)
- **벡터 실패 폴백**: Vertex AI 호출 실패 시 BM25 단독 결과 + 경고
- **transport**: stdio (Claude Code 표준)
- **등록**: `.mcp.json` — git 추적, pull 시 전 디바이스 자동 적용

## 주의사항

- `.claude/settings.json`에는 `mcpServers` 키가 없으므로 `.mcp.json`에 등록 (지시서 대비 변경점)
- Claude Code 재시작 후 도구 활성화 필요
