---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-04-05
subject: MCP 생태계 종합 리서치 A — 서버·프로토콜·인프라편
status: 대기
priority: high
---

[2026-04-05 11:27 KST] iMac/쌍아 → iMac/막내1

# MCP 생태계 종합 리서치 A — 서버·프로토콜·인프라편

## 1. 배경

MONK OS는 CDP 기반 브라우저 자동화(PF_CDP)를 Phase 2까지 진행 중이다.
MCP(Model Context Protocol)가 에이전트 도구 확장의 핵심 인프라로 자리잡고 있다.
**실험적인 것까지 포함해서 샅샅이 리서치**하라는 작가님 지시.

## 2. 리서치 범위

### A. MCP 프로토콜 자체 (최신 스펙)

- MCP 프로토콜 최신 버전 — 변경점, 신규 기능
- 스트리밍, 인증, 세션 관리 등 최신 스펙 업데이트
- Anthropic 공식 MCP 로드맵 (있다면)
- **Streamable HTTP Transport** (2025-03-26 도입) — SSE 대체, 상태유지/무상태 모두 지원 여부
- **OAuth 2.1** 인증 프레임워크 내장 여부

### B. MCP 서버 생태계 전수 조사

아래 카테고리별로 존재하는 MCP 서버를 **전부** 조사. 이름, 기능, 성숙도, 비용, 우리 적용 가능성을 표로 정리.

| 카테고리 | 조사 대상 예시 |
|----------|--------------|
| **브라우저 자동화** | Playwright MCP, Puppeteer MCP, Browser Use MCP, Stagehand MCP |
| **파일/코드** | Filesystem MCP, Git MCP, GitHub MCP |
| **데이터베이스** | SQLite MCP, PostgreSQL MCP, D1/Cloudflare MCP |
| **클라우드** | GCP MCP, AWS MCP, Cloudflare Workers MCP |
| **커뮤니케이션** | Slack MCP, Telegram MCP, Discord MCP |
| **검색/크롤링** | Brave Search MCP, Firecrawl MCP, Tavily MCP |
| **이미지/미디어** | 이미지 생성·편집 MCP, FFmpeg MCP |
| **모니터링** | Sentry MCP, Datadog MCP |
| **문서/지식** | Notion MCP, Google Drive MCP, Obsidian MCP |
| **기타 실험적** | 신규·알파 단계 포함 전부 |

### C. MCP 서버 개발 도구

- `@modelcontextprotocol/sdk` (공식 TypeScript SDK)
- `mcp` Python SDK
- MCP Inspector (디버깅 도구)
- 커스텀 MCP 서버 만드는 방법 — 우리가 MONKOS 전용 서버를 만들 수 있는지

### D. Claude Code + MCP 통합 현황

- `.mcp.json` 설정 체계 (프로젝트 레벨 vs 유저 레벨)
- Claude Desktop vs Claude Code에서 MCP 차이점
- 동시 MCP 서버 다중 등록 시 동작 (충돌, 우선순위)
- **Remote MCP** — 원격 서버 연결 가능 여부 (4060 GPU 서버 활용 가능성)

## 3. 산출물

```
monkos-ops/ops/reports/REPORT_20260405_iMac막내1_MCP생태계_서버편.md
```

- 카테고리별 MCP 서버 목록 표
- 각 서버: 이름 / 깃헙 URL / 기능 요약 / 성숙도(안정/베타/알파) / 비용 / MONK OS 적용 가능성(상/중/하) + 이유
- 프로토콜 최신 변경점 요약
- 커스텀 MCP 서버 개발 난이도 평가
- 우리가 당장 `.mcp.json`에 추가할 수 있는 서버 TOP 5 추천

## 4. ⚠️ 준수 조항

- 헌법 3조 1항: 타임스탬프 절대 준수 (`date` 매 턴)
- 헌법 4조 1항: API 키/비밀정보 생성·추측 금지
- 법률 ch7: 리서치 전용 — 코드 수정/배포 하지 말 것. 보고서만 납품
- 웹 검색 적극 활용. 공식 문서 + GitHub 레포 + npm 패키지 기준으로 조사
