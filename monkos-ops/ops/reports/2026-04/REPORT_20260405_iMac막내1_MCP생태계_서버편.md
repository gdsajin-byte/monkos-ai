---
type: report
from: iMac/막내1
to: iMac/쌍아
date: 2026-04-05
subject: MCP 생태계 종합 리서치 A — 서버·프로토콜·인프라편
order: ORDER_20260405_iMac쌍아_막내1_MCP생태계_리서치A_서버편
status: 완료
---

**[2026-04-05 11:44 KST] iMac/막내1 → iMac/쌍아**

# MCP 생태계 종합 리서치 A — 서버·프로토콜·인프라편

---

## 목차

1. [MCP 프로토콜 최신 스펙](#1-mcp-프로토콜-최신-스펙)
2. [MCP 서버 생태계 전수 조사](#2-mcp-서버-생태계-전수-조사)
3. [MCP 서버 개발 도구](#3-mcp-서버-개발-도구)
4. [Claude Code + MCP 통합 현황](#4-claude-code--mcp-통합-현황)
5. [MONK OS 적용 TOP 5 추천](#5-monk-os-적용-top-5-추천)

---

## 1. MCP 프로토콜 최신 스펙

### 1.1 버전 이력

MCP는 날짜 기반 버전(`YYYY-MM-DD`)을 사용하며, 비호환 변경 시에만 버전이 올라간다. **현재 최신: 2025-11-25**.

| 버전 | 상태 | 핵심 변경 |
|------|------|----------|
| **2024-11-05** | Final | 최초 공개. HTTP+SSE 트랜스포트, JSON-RPC 2.0, 기본 tools/resources/prompts/sampling |
| **2025-03-26** | Final | **Streamable HTTP** 도입 (HTTP+SSE 대체). `Mcp-Session-Id` 세션 관리 |
| **2025-06-18** | Final | 구조화된 툴 출력, OAuth 2.0 리소스서버(RFC 9728), Elicitation, Resource Links, JSON-RPC 배칭 제거 |
| **2025-11-25** | **Current** | Tasks(실험적), Client ID Metadata Documents(SEP-991), Sampling에 tool calling 추가, URL모드 Elicitation, 아이콘 메타데이터, Extensions 프레임워크, SSE 폴링 |

2025년 11월 시점: 등록 서버 ~2,000개(9월 대비 407% 성장), 메인테이너 58명, Discord 기여자 2,900+.

### 1.2 Streamable HTTP Transport

2025-03-26 도입. 구(舊) HTTP+SSE를 대체하는 **단일 엔드포인트** 방식.

**동작 구조:**
- 서버가 단일 MCP 엔드포인트 노출 (예: `https://example.com/mcp`), POST+GET 지원
- **클라이언트→서버**: 모든 JSON-RPC 메시지를 POST로 전송. `Accept: application/json, text/event-stream`
- **서버 응답**: `application/json`(단순 응답) 또는 `text/event-stream`(SSE 스트림으로 응답 + 서버 주도 메시지) 중 택 1
- **서버→클라이언트(비요청)**: 클라이언트가 GET으로 SSE 스트림을 열어 서버 주도 메시지 수신

**상태유지/무상태 모두 지원:**
- **Stateful**: 서버가 `Mcp-Session-Id` 발급 → 클라이언트가 후속 요청에 포함. 세션 종료는 HTTP DELETE
- **Stateless**: `Mcp-Session-Id` 미발급 시 단순 req/res HTTP 서비스로 동작

**재접속/복원**: 서버가 SSE 이벤트 ID 할당 → 연결 끊기면 클라이언트가 `Last-Event-ID`로 재연결, 누락 메시지 재전송 가능

**보안**: `Origin` 헤더 검증 필수(DNS 리바인딩 방지), 로컬 서버는 localhost만 바인딩, `MCP-Protocol-Version` 헤더 필수

### 1.3 OAuth 2.1 인증

MCP 스펙에 **내장**. HTTP 트랜스포트용. STDIO는 환경변수 기반 인증 사용.

**역할 분리:**
- MCP Server = OAuth 2.1 **Resource Server** (토큰 검증)
- MCP Client = OAuth 2.1 **Client** (토큰 획득/제출)
- Authorization Server = 토큰 발급 (MCP 서버와 동일 호스트 가능)

**디스커버리 흐름:**
1. 미인증 요청 → 서버가 401 + `WWW-Authenticate` (resource_metadata URL 포함)
2. Protected Resource Metadata (RFC 9728) 페치 → `authorization_servers` 확인
3. OAuth AS Metadata (RFC 8414) 또는 OIDC Discovery로 인증서버 정보 취득

**클라이언트 등록 (우선순위순):**
1. Pre-registration (기존 크레덴셜)
2. **Client ID Metadata Documents** (SEP-991, 2025-11-25 신규) — `client_id`가 HTTPS URL → 인증서버가 온디맨드 페치
3. Dynamic Client Registration (RFC 7591, 레거시 폴백)

**필수 보안**: PKCE(S256) 필수, Resource Indicators(RFC 8707) 필수, HTTPS 필수, 토큰 패스쓰루 금지

### 1.4 세션 관리

1. 클라이언트 → `initialize` 요청 (프로토콜 버전, capabilities, 클라이언트 정보)
2. 서버 → 응답 (프로토콜 버전, capabilities, 서버 정보, 선택적 `Mcp-Session-Id`)
3. 클라이언트 → `initialized` 알림
4. 이후 모든 요청에 `Mcp-Session-Id` + `MCP-Protocol-Version` 헤더 포함

세션 종료: 서버가 언제든 종료 가능(404 반환), 클라이언트는 HTTP DELETE로 명시 종료

### 1.5 프로토콜 Capabilities 전체 목록

**서버 Capabilities:**

| Capability | 설명 |
|-----------|------|
| `tools` | 호출 가능 함수. `listChanged` 알림, 도구 어노테이션(읽기전용/파괴적 등), 구조화된 출력 |
| `resources` | 읽기 가능 데이터(파일, DB 스키마 등). `subscribe`(변경 알림), `listChanged` |
| `prompts` | 템플릿 메시지/워크플로. `listChanged` |
| `logging` | 구조화된 로그 메시지, 심각도 레벨 |
| `completions` | 리소스 URI/프롬프트 인자 자동완성 |
| `tasks` | **(실험적, 2025-11-25)** 장기 실행 작업의 상태머신. list, cancel, requests.tools.call |
| `experimental` | 비표준 실험적 기능 |

**클라이언트 Capabilities:**

| Capability | 설명 |
|-----------|------|
| `sampling` | 서버 주도 LLM 호출. 2025-11-25부터 tools+toolChoice 파라미터 지원 |
| `roots` | 서버가 클라이언트의 파일시스템/URI 경계 조회 |
| `elicitation` | 서버가 사용자에게 추가 정보 요청. form 모드 + url 모드(2025-11-25 신규) |
| `tasks` | 태스크 기반 클라이언트 요청. list, cancel, sampling, elicitation |

### 1.6 거버넌스 & 산업 채택

- **2025-12-09**: Anthropic이 MCP를 **Linux Foundation 산하 Agentic AI Foundation(AAIF)**에 기증. 공동 설립: Anthropic, Block, **OpenAI**
- 지원 기업: Google, Microsoft, AWS, Cloudflare, Bloomberg
- **OpenAI** 2025년 3월 MCP 채택 (ChatGPT Desktop 통합)
- **Google DeepMind** 2025년 4월 Gemini MCP 지원 확인
- 2025년 12월 기준: 10,000+ 공개 MCP 서버, ~97M 인스톨

### 1.7 2026 로드맵

4개 우선순위 영역 (마일스톤 기반이 아닌 영역 기반):

1. **Transport Evolution & Scalability**: Streamable HTTP의 수평 스케일링(상태 미보유), `.well-known` 메타데이터로 서버 디스커버리 (Server Cards)
2. **Agent Communication**: Tasks 프리미티브 실전 개선, 재시도 시멘틱, 만료 정책. **에이전트 간 통신**(Q3 2026 목표) — 계층적 에이전트 아키텍처
3. **Governance Maturation**: 컨트리뷰터 래더, Working Group 위임 모델
4. **Enterprise Readiness**: 감사 추적/관측성, SSO 통합 인증(Q2 2026, Okta/Azure AD), 게이트웨이/프록시 패턴, 설정 이식성

**후순위**: Triggers, 이벤트 기반 업데이트, 스트리밍 결과 타입, **MCP Registry**(큐레이션 서버 디렉토리, Q4 2026)

---

## 2. MCP 서버 생태계 전수 조사

> 2026년 4월 기준 PulseMCP 13,000+, Smithery 6,000+, 공식 Registry 수천 개 인덱싱. 프로덕션 급은 약 50~100개.

### 2.1 브라우저 자동화

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Playwright MCP** (Microsoft) | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | 접근성 스냅샷 기반 브라우저 제어. 클릭/입력/네비게이션/스크린샷/JS실행. 30k+ ⭐ | **안정** | 무료 | **상** | 현재 PF_CDP Phase 2에서 활용 중. 가장 성숙 |
| **Puppeteer MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer) | 레퍼런스 구현. 스크린샷/네비/클릭/입력/JS | **Deprecated** | 무료 | 하 | MCP팀이 Playwright 이관 권장 |
| **Browserbase/Stagehand** | [browserbase/mcp-server-browserbase](https://github.com/browserbase/mcp-server-browserbase) | 클라우드 브라우저+봇 회피. 자연어 명령 | **베타** | 프리미엄 | 중 | 봇 회피 필요 시 유용 |
| **Chrome DevTools MCP** (Google) | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) | 구글 공식 Chrome DevTools 접근 | **베타** | 무료 | 중 | 디버깅 워크플로에 강점 |
| **Chrome MCP (Extension)** | [hangwin/mcp-chrome](https://github.com/hangwin/mcp-chrome) | 크롬 확장 기반. 로그인 세션 활용 가능. 11k+ ⭐ | **베타** | 무료 | 중 | 인증된 세션 활용 시 유용 |
| **BB Browser** | [epiral/bb-browser](https://github.com/epiral/bb-browser) | CLI+MCP. 로그인 상태 유지 브라우저 제어 | **베타** | 무료 | 하 | 인증 브라우징 특화 |
| **Browser MCP** | [BrowserMCP/mcp](https://github.com/BrowserMCP/mcp) | AI 앱의 브라우저 제어. 6.2k+ ⭐ | **베타** | 무료 | 하 | 커뮤니티 대안 |

### 2.2 파일 / 코드 / 버전관리

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Filesystem MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) | 파일 읽기/쓰기/생성/디렉토리 관리. 허용 경로 설정 | **안정** | 무료 | 중 | Claude Code 자체 도구와 중복. 외부 에이전트 연동 시 유용 |
| **GitHub MCP** (공식) | [github/github-mcp-server](https://github.com/github/github-mcp-server) | GitHub 전체: 레포/이슈/PR/코드검색/Actions. 28k+ ⭐ | **안정** | 무료 | **상** | PR/이슈 자동화에 필수급 |
| **GitLab MCP** (공식) | [gitlab.com docs](https://docs.gitlab.com/user/gitlab_duo/model_context_protocol/mcp_server/) | GitLab 프로젝트/MR/파이프라인/파일. OAuth 2.1 | **베타** | 무료 | 하 | GitLab 미사용 |
| **Git MCP** | [idosal/git-mcp](https://github.com/idosal/git-mcp) | 원격 MCP — GitHub 프로젝트를 클론 없이 정확 컨텍스트 제공. 7.8k+ ⭐ | **안정** | 무료 | 중 | 외부 레포 조사 시 유용 |
| **Desktop Commander** | [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) | 터미널/파일시스템/diff편집/프로세스관리. 5.8k+ ⭐ | **안정** | 무료 | 중 | Claude Code와 기능 중복 많음 |
| **Figma MCP** (공식) | [figma/mcp-server-guide](https://github.com/figma/mcp-server-guide) | Figma Dev Mode MCP. 디자인→코드 | **베타** | 무료(Figma 구독) | **상** | 디자인 시스템 연동 시 혁신적 |
| **Figma Context MCP** | [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP) | 커뮤니티 Figma MCP. 14k+ ⭐ | **안정** | 무료 | 상 | 공식보다 먼저 나와 커뮤니티 지지 높음 |

### 2.3 데이터베이스

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **PostgreSQL MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/postgres) | 스키마 조사, 읽기전용 SQL | **안정** | 무료 | 중 | 현재 D1 기반이나 향후 PG 전환 시 |
| **SQLite MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite) | 테이블 CRUD, BI 분석 메모 생성 | **안정** | 무료 | 중 | 로컬 분석 용도 |
| **MCP Toolbox for DB** (Google) | [googleapis/genai-toolbox](https://github.com/googleapis/genai-toolbox) | PostgreSQL/MySQL/Spanner/AlloyDB/Cloud SQL/Firestore 통합. 13k+ ⭐ | **안정** | 무료 | **상** | GCP 사용 시 원스톱. MONK은 GCP 기반 |
| **Neon MCP** | neon.tech 공식 | 서버리스 Postgres, 브랜치 기반 마이그레이션. OAuth. 원격 서버 | **안정** | 프리미엄 | 중 | 서버리스 PG 전환 시 |
| **Supabase MCP** | supabase.com 공식 | 테이블/실시간/Edge Functions/스토리지. OAuth+멀티프로젝트 | **안정** | 프리미엄 | 중 | Supabase 도입 시 |
| **Cloudflare D1** | Cloudflare MCP 통합 | 서버리스 SQLite. 통합 CF MCP 서버로 접근 | **안정** | 프리미엄 | **상** | 현재 D1 사용 중 |
| **Redis MCP** | 공식 | 캐시/키밸류 관리 + Redis Cloud API | **베타** | 프리미엄 | 하 | 현재 미사용 |
| **ClickHouse MCP** | clickhouse.com 공식 | OLAP DB. 리스트/인스펙트/쿼리. 100ms 이하 | **안정** | 프리미엄 | 하 | 분석 워크로드 특화 |

### 2.4 클라우드

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **AWS MCP** (66개 서버) | [awslabs/mcp](https://github.com/awslabs/mcp) | S3/Lambda/DynamoDB/EKS/CloudWatch/CDK 등 66개. Apache 2.0. 8.6k+ ⭐ | **안정** | 무료 | 하 | AWS 미사용 |
| **Azure MCP** (공식) | [microsoft/mcp](https://github.com/microsoft/mcp) | AKS/Container Apps/Cosmos DB/AI Foundry. VS 2026 내장 | **안정(GA)** | 무료 | 하 | Azure 미사용 |
| **Google Cloud MCP** | google.dev 공식 | BigQuery/Maps/Spanner/AlloyDB/Cloud SQL/Firestore. 관리형 원격 서버 | **안정** | 무료 | **상** | MONK은 GCP 기반. BigQuery MCP 특히 우수 |
| **Cloudflare MCP** | [cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare) | Workers/KV/R2/D1/Pages. 3.5k+ ⭐ | **안정** | 무료 | **상** | CF Pages + Workers + D1 모두 사용 중 |
| **Vercel MCP** | vercel.com | Next.js 생태계. OAuth. Fluid Compute | **베타** | 프리미엄 | 하 | Vercel 미사용 |

### 2.5 커뮤니케이션

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Slack MCP** (공식) | [slack.dev](https://docs.slack.dev/ai/slack-mcp-server/) | 채널 메시지/스레드/파일/리액션/프레즌스 | **안정** | 무료 | 하 | Slack 미사용 |
| **Telegram MCP** | [kfastov/telegram-mcp-server](https://github.com/kfastov/telegram-mcp-server) | 메시지/이미지/파일 송수신. Bot API | **베타** | 무료 | **상** | 텔레그램이 MONK 신경계 |
| **Discord MCP** | 커뮤니티 | 메시지 읽기/쓰기/리액션 | **베타** | 무료 | 하 | Discord 미사용 |
| **WhatsApp MCP** | [lharries/whatsapp-mcp](https://github.com/lharries/whatsapp-mcp) | WhatsApp 통합. 5.4k+ ⭐ | **베타** | 무료 | 하 | WhatsApp 미사용 |
| **Gmail/Google Workspace** | [taylorwilsdon/google_workspace_mcp](https://github.com/taylorwilsdon/google_workspace_mcp) | Gmail/Calendar/Docs/Sheets/Slides/Chat/Drive 등 100+ 도구. OAuth 2.1 | **안정** | 무료 | **상** | GDrive 2TB 활용 중 |
| **Claude Code Channels** | Claude Code v2.1.80+ 내장 | Telegram/Discord 봇을 Claude Code 세션에 브리지. 리서치 프리뷰 (2026-03) | **알파** | 무료 | **상** | 텔레그램→Claude Code 직접 연결 가능성 |

### 2.6 검색 / 크롤링

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Brave Search MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search) | 웹+로컬 검색. 최저 레이턴시(669ms) | **안정** | 무료(API키) | 중 | Claude Code 자체 WebSearch와 중복 |
| **Firecrawl MCP** | [firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server) | 웹 스크래핑/크롤링/검색. 83% 정확도. 5.9k+ ⭐ | **안정** | 프리미엄 | **상** | 콘텐츠 수집 자동화 핵심 |
| **Exa MCP** | [exa-labs/exa-mcp-server](https://github.com/exa-labs/exa-mcp-server) | 뉴럴/시맨틱 웹 검색. 4.1k+ ⭐ | **안정** | 프리미엄 | 중 | 시맨틱 검색 강점 |
| **Tavily MCP** | tavily.com | AI 최적화 검색 API. 리서치급 결과 | **안정** | 프리미엄 | 중 | AI 에이전트 특화 |
| **Fetch MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/fetch) | URL→마크다운 변환. robots.txt 준수 | **안정** | 무료 | 중 | 단순하지만 필수 |

### 2.7 이미지 / 미디어

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **FFmpeg MCP** | [misbahsy/video-audio-mcp](https://github.com/misbahsy/video-audio-mcp) | 40+ FFmpeg 도구. 변환/압축/트림/워터마크/자막 | **베타** | 무료 | **상** | 미디어 처리 파이프라인 핵심 |
| **MCP Image (Gemini)** | [shinpr/mcp-image](https://github.com/shinpr/mcp-image) | Gemini 기반 이미지 생성/편집. 프롬프트 최적화 | **베타** | 무료(API비용) | **상** | MONKOS AI 이미지 서비스와 시너지 |
| **Stable Diffusion WebUI MCP** | 커뮤니티 | AUTOMATIC1111/ComfyUI 연결. 로컬 GPU 이미지 생성 | **베타** | 무료 | **상** | 4060 GPU 서버 활용 가능 |
| **AntV Chart MCP** | [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart) | 25+ 차트 타입. 데이터 시각화. 3.9k+ ⭐ | **안정** | 무료 | 중 | 리포트/분석 시각화 |
| **DALL-E Image MCP** | 커뮤니티 | OpenAI DALL-E 이미지 생성 | **베타** | 유료(API) | 중 | 이미지 대안 |
| **Fal.ai Video Generator** | 커뮤니티 | 텍스트/이미지→비디오 생성 | **알파** | 유료 | 중 | 향후 비디오 콘텐츠 |

### 2.8 모니터링

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Sentry MCP** | [getsentry/sentry-mcp](https://github.com/getsentry/sentry-mcp) | Sentry 이슈/에러/프로젝트 조회. 원격 서버(mcp.sentry.dev). OAuth | **안정** | 무료(Sentry플랜) | **상** | 에러 모니터링 자동화 |
| **Datadog MCP** | [Datadog docs](https://docs.datadoghq.com/bits_ai/mcp_server/) | 16+ 핵심 도구 + APM/에러/보안/LLM 관측성. GA 2026-03 | **안정(GA)** | 유료 | 하 | Datadog 미사용 |
| **Grafana MCP** | 커뮤니티 | 대시보드 쿼리, 메트릭 탐색 | **알파** | 무료 | 하 | 초기 단계 |

### 2.9 문서 / 지식

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Notion MCP** (공식) | [makenotion/notion-mcp-server](https://github.com/makenotion/notion-mcp-server) | 워크스페이스 검색/문서 생성/DB 관리. 4.1k+ ⭐ | **안정** | 무료(Notion플랜) | 하 | Notion 미사용 |
| **Google Drive MCP** | Google Workspace MCP 통합 | Docs/Sheets/Slides 접근. Drive 검색 | **안정** | 무료 | **상** | GDrive 2TB 활용 중 |
| **Memory MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/memory) | 지식 그래프 기반 영속 메모리. 엔티티/관계 | **안정** | 무료 | 중 | MONK OS MEMORY.md 체계와 비교 검토 가치 |
| **Sequential Thinking** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) | 단계별 문제 분해. Smithery 최다 사용(5,550+) | **안정** | 무료 | 중 | 복잡한 설계 작업 시 유용 |
| **Linear MCP** | 커뮤니티 | 이슈/사이클/프로젝트 업데이트 | **베타** | 무료 | 하 | Linear 미사용 |
| **Obsidian MCP** | 커뮤니티 | 볼트 접근, 태그 검색, 인덱싱 | **베타** | 무료 | 하 | Obsidian 미사용 |

### 2.10 자동화 / 워크플로

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Zapier MCP** | zapier.com 공식 | 8,000+ 앱 연동. 인증/레이트리밋/파라미터 매핑 | **안정** | 프리미엄 | 중 | 비기술 자동화 시 |
| **n8n MCP** | [n8n.io](https://n8n.io/) | 셀프호스팅. 데이터 미유출. 기존 워크플로 트리거 | **안정** | 무료(셀프)/유료(클라우드) | **상** | 셀프호스팅+데이터 주권. 4060 서버에 배치 가능 |

### 2.11 상거래 / 결제

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Stripe MCP** (공식) | stripe.com 공식 | 23 도구. 결제/고객/재무. OAuth. 원격 서버 | **안정** | 무료(Stripe수수료) | 중 | 결제 시스템 도입 시 |
| **Shopify MCP** (공식) | shopify.dev | 상품/장바구니/주문/매장 정보 | **안정** | 무료(Shopify플랜) | 하 | Shopify 미사용 |

### 2.12 위치 / 지도

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Google Maps MCP** | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/google-maps) | 지오코딩/장소검색/경로안내 | **안정** | 무료(API키) | 중 | 위치 기반 서비스 시 |

### 2.13 기타 / 실험적

| 서버 | GitHub | 기능 | 성숙도 | 비용 | MONK 적용성 | 이유 |
|------|--------|------|--------|------|------------|------|
| **Home Assistant MCP** | [homeassistant-ai/ha-mcp](https://github.com/homeassistant-ai/ha-mcp) | 스마트홈 디바이스 제어/상태/자동화 | **안정** | 무료 | 하 | HA 미사용 |
| **GhidraMCP** | [LaurieWired/GhidraMCP](https://github.com/LaurieWired/GhidraMCP) | 리버스 엔지니어링. 디컴파일/분석. 8.1k+ ⭐ | **안정** | 무료 | 하 | RE 미필요 |
| **Appium MCP** (공식) | [appium/appium-mcp](https://github.com/appium/appium-mcp) | 모바일 자동화. iOS+Android. 자연어 엘리먼트 탐지 | **베타** | 무료 | 중 | 모바일 테스트 자동화 시 |
| **PAL MCP Server** | [BeehiveInnovations/pal-mcp-server](https://github.com/BeehiveInnovations/pal-mcp-server) | Claude+Gemini+OpenAI+Ollama 멀티모델 오케스트레이션. 11.3k+ ⭐ | **베타** | 무료 | **상** | 멀티모델 전략과 직결 |
| **Docker MCP Toolkit** | Docker Desktop 내장 | 200+ MCP 서버를 Docker 컨테이너로 구동 | **안정** | 무료 | 중 | MCP 서버 관리 편의 |
| **Kubernetes MCP** | 커뮤니티 | K8s+OpenShift 클러스터 관리 | **베타** | 무료 | 하 | K8s 미사용 |
| **Deep Research MCP** | [u14app/deep-research](https://github.com/u14app/deep-research) | 멀티LLM 딥 리서치. SSE API. 4.5k+ ⭐ | **베타** | 무료 | 중 | 리서치 자동화 |

### 2.14 프레임워크 / 메타도구

| 도구 | GitHub | 기능 | 성숙도 |
|------|--------|------|--------|
| **FastMCP** | [PrefectHQ/fastmcp](https://github.com/PrefectHQ/fastmcp) | Python MCP 서버/클라이언트 빌드. 24k+ ⭐ | **안정** |
| **MCP Inspector** | [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | MCP 서버 시각적 테스트. 9.3k+ ⭐ | **안정** |
| **MCP Registry** | [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io/) | 공식 커뮤니티 레지스트리. 6.6k+ ⭐ | **안정** |
| **Smithery CLI** | [smithery-ai/cli](https://github.com/smithery-ai/cli) | MCP 서버 탐색/설치/관리. 6,000+ 인덱싱 | **안정** |
| **MCPO** | [open-webui/mcpo](https://github.com/open-webui/mcpo) | MCP→OpenAPI 프록시. 4.1k+ ⭐ | **베타** |
| **Composio** | composio.dev | 600+ 도구 통합 (MCP/Function Calling) | **안정** |

---

## 3. MCP 서버 개발 도구

### 3.1 TypeScript SDK (`@modelcontextprotocol/sdk`)

**패키지**: `@modelcontextprotocol/sdk` (npm)
**레포**: `github.com/modelcontextprotocol/typescript-sdk`

**핵심 API:**
- **`McpServer`** (고수준, 권장) — `.tool()`, `.resource()`, `.prompt()` 등록 메서드
- **`Server`** (저수준) — `server.setRequestHandler()`로 직접 핸들러 등록
- **`StdioServerTransport`** — 로컬 stdio 통신
- **`SSEServerTransport`** — 원격 SSE 통신
- **`StreamableHTTPServerTransport`** — 최신 HTTP 스트리밍
- **Zod 스키마** — 도구 입력 파라미터 검증

**최소 서버 예제:**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.tool(
  "greet", "사용자 인사",
  { name: z.string().describe("이름") },
  async ({ name }) => ({
    content: [{ type: "text", text: `안녕하세요, ${name}!` }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 3.2 Python SDK (`mcp`)

**패키지**: `mcp` (PyPI)
**레포**: `github.com/modelcontextprotocol/python-sdk`

**핵심 API:**
- **`FastMCP`** — 데코레이터 기반 고수준 서버 클래스
- **`@mcp.tool()`** — 도구 등록 데코레이터
- **`@mcp.resource()`** — 리소스 등록
- **`@mcp.prompt()`** — 프롬프트 템플릿 등록
- Python 타입 힌트 → JSON Schema 자동 변환. Pydantic 모델 지원

**최소 서버 예제:**
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server")

@mcp.tool()
def greet(name: str) -> str:
    """사용자 인사"""
    return f"안녕하세요, {name}!"

if __name__ == "__main__":
    mcp.run()  # 기본 stdio
```

**내장 CLI:**
```bash
mcp dev my_server.py          # Inspector 연결 개발 모드
mcp install my_server.py      # Claude Desktop에 설치
mcp run my_server.py          # 서버 직접 실행
```

### 3.3 기타 SDK

| 언어 | 패키지/레포 | 상태 |
|------|-----------|------|
| **Kotlin/Java** | `modelcontextprotocol/kotlin-sdk` | 공식. JetBrains 협업 |
| **C#/.NET** | `modelcontextprotocol/csharp-sdk` | 공식. Microsoft 기여. NuGet: `ModelContextProtocol` |
| **Go** | `mark3labs/mcp-go` (커뮤니티) + 공식화 진행 | 커뮤니티 주도, 폭넓게 채택 |
| **Rust** | `mcp-rust-sdk` (커뮤니티) | 커뮤니티. 직접 구현도 용이 (JSON-RPC 2.0) |
| **Swift** | 커뮤니티 구현 존재 | Apple 생태계용 |

> MCP는 **JSON-RPC 2.0** over stdio/HTTP이므로 어떤 언어로든 직접 구현 가능. SDK는 편의 제공.

### 3.4 MCP Inspector

**용도**: MCP 서버 디버깅/테스트 웹 UI
**레포**: `modelcontextprotocol/inspector`

```bash
# npx로 즉시 실행
npx @modelcontextprotocol/inspector node my-server.js
# 또는 Python SDK 내장
mcp dev my_server.py
```

기능: 도구/리소스/프롬프트 목록 조회, 파라미터 입력 후 호출, raw JSON-RPC 메시지 표시

### 3.5 커스텀 MCP 서버 개발 난이도 평가

| 항목 | 평가 |
|------|------|
| **최소 서버 구현** | ~20-30줄. **매우 쉬움** |
| **프로토콜 이해** | initialize → tools/list → tools/call → 결과 반환. 단순 |
| **멀티 도구 번들링** | 하나의 서버에 도구/리소스/프롬프트 무제한 등록 가능 |
| **원격 호스팅** | SSE 또는 Streamable HTTP 트랜스포트 사용. 완전 지원 |
| **Cloud Run 배포** | 자연스러운 적합성 — HTTP 서비스 컨테이너화 |
| **CF Workers 배포** | `@cloudflare/agents`의 `McpAgent` 클래스로 퍼스트클래스 지원 |
| **Lambda/서버리스** | Streamable HTTP(무상태 모드)로 가능. SSE는 커넥션 유지 문제 |

### 3.6 원격 MCP 서버 + 인증

- **`mcp-remote`** (npm): 원격 HTTP/SSE MCP 서버를 로컬 stdio로 브리지. Claude Desktop처럼 stdio만 지원하는 클라이언트용
- **`mcp-proxy`**: 트랜스포트 간 브리지 (stdio↔SSE)
- **OAuth 2.1**: 스펙 내장. 브라우저 기반 인증 플로우

```json
{
  "mcpServers": {
    "my-remote": {
      "command": "npx",
      "args": ["mcp-remote", "https://my-server.example.com/mcp"]
    }
  }
}
```

---

## 4. Claude Code + MCP 통합 현황

### 4.1 `.mcp.json` 설정 체계

**3개 스코프:**

| 스코프 | 저장 위치 | 공유 | CLI 플래그 |
|--------|----------|------|-----------|
| **Local** (기본) | `~/.claude.json` (프로젝트 경로 키 하위) | 비공개, 현 프로젝트 전용 | `--scope local` |
| **Project** | 프로젝트 루트 `.mcp.json` | Git 커밋, 팀 공유 | `--scope project` |
| **User** | `~/.claude.json` (글로벌 섹션) | 비공개, 전 프로젝트 | `--scope user` |

**⚠️ 주의**: `~/.claude/mcp.json`은 Claude Code가 **인식하지 않음** (iMac에서 확인 완료). Local 스코프는 `~/.claude.json`에 저장됨.

**`.mcp.json` 형식 (Project 스코프):**
```json
{
  "mcpServers": {
    "server-name": {
      "command": "/path/to/server",
      "args": ["arg1", "arg2"],
      "env": { "API_KEY": "${API_KEY}" }
    }
  }
}
```

**HTTP/원격 서버:**
```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": { "Authorization": "Bearer ${API_KEY}" }
    }
  }
}
```

환경변수 확장 지원: `${VAR}`, `${VAR:-default}`

**스코프 우선순위**: local > project > user. 동명 서버 시 상위 스코프가 우선.

### 4.2 Claude Desktop vs Claude Code 차이

| 항목 | Claude Desktop | Claude Code |
|------|---------------|-------------|
| **설정 파일** | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.claude.json` + `.mcp.json` |
| **설정 방법** | JSON 수동 편집 또는 확장 GUI 설치 | CLI(`claude mcp add`) 또는 `.mcp.json` |
| **트랜스포트** | stdio(로컬), Custom Connectors(원격) | stdio, SSE(deprecated), **HTTP(권장)** |
| **확장 번들** | `.mcpb` 파일 원클릭 설치, 내장 Node.js 런타임 | 해당 없음 |
| **OAuth** | Custom Connectors UI | 네이티브: `/mcp` 명령 → 브라우저 인증 |
| **팀 공유** | 미지원 (개인 설정) | `.mcp.json` Git 커밋 = 팀 전체 |
| **엔터프라이즈** | 없음 | `managed-mcp.json` (IT 잠금 + 허용/차단 정책) |

**VSCode 확장 주의**: SSE 트랜스포트 미지원 (에러 반환). stdio와 HTTP만 동작.

### 4.3 다중 MCP 서버 동시 사용

- **동시 등록/실행 완전 지원**. 현재 이 세션: Playwright(project) + Gmail/Calendar(Claude.ai 커넥터) 동시 가동 중
- **도구 네임스페이스**: `mcp__<서버명>__<도구명>` 패턴. 예: `mcp__playwright__browser_click`
- **이름 충돌**: 서버명 접두사로 자동 방지. 동명 서버 시 숫자 접미사 추가(`server_1`)
- **Tool Search**: 다수 MCP 서버 시 전체 스키마를 로드하지 않고 이름만 로드. 필요 시 `ToolSearch`로 온디맨드 페치 (현 세션에서 작동 중)

### 4.4 Remote MCP

| 트랜스포트 | 상태 | 용도 |
|-----------|------|------|
| **stdio** | 안정, 로컬 기본 | 로컬 프로세스 통신 |
| **HTTP (Streamable HTTP)** | **원격 권장** | 클라우드 서비스 |
| **SSE** | Deprecated | 레거시 원격. 신규 사용 비권장 |

**원격 서버 연결:**
```bash
# HTTP 직접 연결 (권장)
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# 인증 헤더 포함
claude mcp add --transport http secure-api https://api.example.com/mcp \
  --header "Authorization: Bearer your-token"

# OAuth 2.0 (네이티브)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
# Claude Code 내에서: /mcp → 브라우저 인증
```

**4060 GPU 서버 연결 가능성:**
```bash
# GPU 서버에 MCP 서버 노출 후
claude mcp add --transport http gpu-server http://192.168.x.x:8080/mcp
# 또는 Tailscale/SSH 터널 경유
```

`headersHelper`: `.mcp.json`에서 셸 명령으로 동적 헤더 생성 (Kerberos, 순환 토큰, 내부 SSO 대응)

### 4.5 Claude Code MCP CLI 전체 명령

| 명령 | 용도 |
|------|------|
| `claude mcp add <name> <command\|url> [args...]` | MCP 서버 추가 |
| `claude mcp add-json <name> '<json>'` | JSON 설정으로 서버 추가 |
| `claude mcp add-from-claude-desktop` | Claude Desktop에서 서버 가져오기 |
| `claude mcp list` | 전체 서버 목록 + 헬스체크 |
| `claude mcp get <name>` | 특정 서버 상세 |
| `claude mcp remove <name>` | 서버 제거 |
| `claude mcp reset-project-choices` | `.mcp.json` 서버 신뢰 승인 초기화 |
| `claude mcp serve` | Claude Code 자체를 MCP 서버로 노출 |

**핵심 플래그:**
- `-t, --transport <type>`: stdio(기본), sse, http
- `-s, --scope <scope>`: local(기본), project, user
- `-e, --env <KEY=value>`: 환경변수 설정 (반복 가능)
- `-H, --header <header>`: HTTP 헤더 설정 (반복 가능)

**환경변수:**

| 변수 | 용도 |
|------|------|
| `MCP_TIMEOUT` | 시작 타임아웃 ms (예: `MCP_TIMEOUT=10000 claude`) |
| `MAX_MCP_OUTPUT_TOKENS` | 최대 도구 출력 토큰 (기본 25,000) |
| `ENABLE_TOOL_SEARCH` | `true/false/auto/auto:N` — 지연 도구 로딩 |
| `ENABLE_CLAUDEAI_MCP_SERVERS` | `false`로 Claude.ai 커넥터 서버 비활성화 |

**인세션 명령:**
- `/mcp` — 전체 MCP 서버 상태 확인, OAuth 인증 관리
- `@server:protocol://resource` — MCP 리소스 인라인 참조

### 4.6 현재 iMac MCP 상태

| 소스 | 서버 | 상태 |
|------|------|------|
| Project `.mcp.json` | Playwright MCP (`scripts/tools/playwright_mcp.sh`) | ✅ 활성 |
| Claude.ai 커넥터 | Gmail, Google Calendar | ✅ 활성 |
| `~/.claude/mcp.json` | chrome-devtools (정의됨) | ❌ Claude Code 미인식 |
| Claude Desktop | mcp-server-git | ✅ Desktop 전용 |

---

## 5. MONK OS 적용 TOP 5 추천

> 현재 `.mcp.json`에 즉시 추가 가능한 서버 우선, MONK 인프라(GCP+CF+텔레그램+GDrive)와의 시너지 기준 선정.

### 🥇 1위: Cloudflare MCP Server

```bash
claude mcp add --transport http cloudflare https://mcp.cloudflare.com/sse
```

| 항목 | 내용 |
|------|------|
| **기능** | Workers, KV, R2, D1, Pages — CF 전체 리소스 관리 |
| **적용 이유** | MONK.KR(CF Pages) + Functions(CF Workers) + D1 = CF 올인. 배포/설정/DB를 에이전트가 직접 조작 가능 |
| **난이도** | OAuth 인증 필요 → `claude mcp add --transport http` + `/mcp`에서 인증 |
| **성숙도** | 안정 (3.5k+ ⭐, 공식) |

### 🥈 2위: Telegram MCP Server

```bash
claude mcp add telegram npx @mcp/telegram-bot -- --token ${TELEGRAM_BOT_TOKEN}
```

| 항목 | 내용 |
|------|------|
| **기능** | 메시지 송수신, 이미지/파일, 그룹/채널 관리 |
| **적용 이유** | 텔레그램 = MONK 신경계. 에이전트가 직접 텔레그램 메시지 읽기/쓰기 → 팀 소통 자동화 |
| **난이도** | Bot Token만 있으면 즉시 가동 |
| **고려사항** | Claude Code Channels (알파)와 시너지 — 텔레그램→Claude Code 직접 브리지 가능성 |

### 🥉 3위: Google Workspace MCP (Gmail/Drive/Sheets)

```bash
claude mcp add --transport http google-workspace https://mcp.google.com/workspace
```

| 항목 | 내용 |
|------|------|
| **기능** | Gmail, Calendar, Docs, Sheets, Slides, Drive — 100+ 도구 |
| **적용 이유** | GDrive 2TB = MONK 창고. 에이전트가 직접 Sheets 읽기/쓰기, Drive 검색, Docs 생성 → 팀원 산출물 자동 수집 |
| **난이도** | OAuth 2.1 인증 필요 |
| **현황** | Gmail/Calendar는 이미 Claude.ai 커넥터로 활성. Drive/Sheets/Docs 추가가 핵심 |

### 4위: Firecrawl MCP Server

```bash
claude mcp add firecrawl npx -y firecrawl-mcp --api-key ${FIRECRAWL_API_KEY}
```

| 항목 | 내용 |
|------|------|
| **기능** | 웹 스크래핑/크롤링/검색. 페이지→마크다운 변환 |
| **적용 이유** | 콘텐츠 리서치 자동화. SEO 분석, 경쟁사 모니터링, 트렌드 수집 → 콘텐츠 전략에 직결 |
| **난이도** | API 키 필요 (무료 티어 존재) |
| **성숙도** | 안정 (5.9k+ ⭐) |

### 5위: FFmpeg MCP Server

```bash
claude mcp add ffmpeg npx @mcp/ffmpeg-tools
```

| 항목 | 내용 |
|------|------|
| **기능** | 40+ FFmpeg 도구. 비디오/오디오 변환/압축/트림/워터마크/자막 |
| **적용 이유** | 사진관 콘텐츠 → 릴스/유튜브 파이프라인. 이미지→비디오 변환, 워터마크, 자막 자동화 |
| **난이도** | FFmpeg 로컬 설치 필요 (brew install ffmpeg) |
| **4060 활용** | GPU 인코딩(NVENC) 가능 시 원격 MCP로 4060에서 처리 |

---

### 향후 주시 대상 (즉시 도입은 아니지만 로드맵 시야)

| 서버 | 이유 |
|------|------|
| **Google Cloud MCP** (BigQuery, Cloud SQL) | GCP 인프라 직접 관리. 매출/분석 데이터 접근 |
| **Sentry MCP** | 프로덕션 에러 모니터링 자동화 |
| **n8n MCP** | 4060 서버에 셀프호스팅 → 비기술 자동화 허브 |
| **PAL MCP** | Gemini+Ollama 등 멀티모델 오케스트레이션 |
| **Stable Diffusion WebUI MCP** | 4060 GPU로 로컬 이미지 생성 → API 비용 절감 |

---

## 출처

### 프로토콜 스펙
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)
- [MCP Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Tasks](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks)
- [1주년 스펙 릴리스](https://blog.modelcontextprotocol.io/posts/2025-11-25-first-mcp-anniversary/)
- [2026 로드맵](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)
- [AAIF 기증](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)

### 서버 생태계
- [공식 MCP Servers](https://github.com/modelcontextprotocol/servers)
- [공식 MCP Registry](https://registry.modelcontextprotocol.io/)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Smithery.ai](https://smithery.ai/)
- [PulseMCP](https://www.pulsemcp.com/servers)
- [AWS MCP (66서버)](https://github.com/awslabs/mcp)

### Claude Code 통합
- [Claude Code MCP 문서](https://code.claude.com/docs/en/mcp)
- [Remote MCP in Claude Code](https://claude.com/blog/claude-code-remote-mcp)
- [MCP 연결 가이드](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)

### SDK
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
