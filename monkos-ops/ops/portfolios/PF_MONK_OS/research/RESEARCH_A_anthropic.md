---
type: RESEARCH
track: A
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내1
sources: anthropic_official_only
---

# RESEARCH A — Anthropic 최신 체제 (2026-04-23)

## 요약 (최상단 500자)

Anthropic은 2026-04-16 **Opus 4.7**(same price, 1M 컨텍스트, 토크나이저 변경으로 텍스트당 +1.0~1.35× 토큰, `xhigh` effort + task budgets beta) 출시와 함께 운영 표준을 정비했다. (1) **Agent Skills**는 progressive disclosure 기반 공식 포맷(`SKILL.md` + 서포팅 파일, `name`/`description` 필수, cross-surface)으로 굳어졌고 `github.com/anthropics/skills` 레포가 정식 배포처. (2) **CLAUDE.md + `.claude/rules/` + `@import`**가 메모리/지시 계층의 공식 스펙이며 200줄 가이드 유지. (3) **Auto Memory**(`~/.claude/projects/<id>/memory/MEMORY.md`)가 공식화됨 — 우리 MEMORY.md 철학과 직결. (4) **Routines**(2026-04-14)가 `/schedule`을 대체하며 scheduled/API/GitHub 3종 트리거 + 원격 실행. (5) **Hooks·Permissions·Auto mode**(3-tier classifier, 2026-03-25)로 거버넌스 강화. (6) **Agent SDK**는 SubAgent(context isolation, fresh context, tool-restricted)와 MCP를 정식 API로 제공 — 우리의 막내 체계와 1:1 대응. 결론: MONK OS 5축은 이미 Anthropic 표준의 상위 개념이나, **Routines·Hooks·Auto mode·Skills frontmatter** 4개 축은 즉시 수용 검토 필요.

---

## 1. Claude 4.7 모델 스펙 + Changelog

**공식 출시**: 2026-04-16 `Introducing Claude Opus 4.7` 블로그 [N1] + `What's new in Claude 4.7` 문서 [D1]

- **모델 ID**: `claude-opus-4-7` [D1]
- **컨텍스트**: 1M 입력 / 최대 출력 128K. 프리미엄 요금 없음 [D1]
- **가격 (동결)**: Input $5/MTok, Output $25/MTok. Cache read 0.1×, cache write 5m 1.25×, 1h 2× [D2]
- **토크나이저 변경**: 텍스트당 +1.0~1.35× 토큰 (≈+35%). 기존 `max_tokens`에 여유 확보 필요 [D1][N1]
- **비전**: 장변 2,576 px / 3.75 MP 지원 (이전 1,568 px / 1.15 MP) [N1][D1]
- **추론**: Adaptive thinking만 지원. `extended_thinking` budget 형식 폐기. Display: `summarized`/`omitted` (기본 omitted) [D1]
- **`effort` 파라미터**: 신규 레벨 `xhigh` 추가(`high`와 `max` 사이). 코딩·에이전트 권장. Task budgets public beta, 헤더 `task-budgets-2026-03-13` [D1][N1]
- **샘플링**: `temperature`/`top_p`/`top_k` 비기본값 사용 시 400 에러. adaptive thinking과 충돌 [D1]
- **명령 충실도**: 낮은 effort에서 더 문자 그대로 따름 — 과도한 일반화 유도 금지 [D1]
- **도구 사용**: 기본값 감소, effort 상향 시 증가 [D1]
- **메모리**: 파일 기반 메모리 쓰기/사용 강화, scratchpad 에이전트 개선 [D1]
- **응답 길이/진도 보고**: 작업 복잡도 자동 조정. 장기 agentic 추적에서 상태 업데이트 증가 [D1]
- **안전/사이버 세이프가드**: 고위험 사이버보안 요청 자동 탐지·차단. Cyber Verification Program 신설 [N1]
- **신규 CLI 기능**: Claude Code에 `/ultrareview` 슬래시커맨드 [N1]
- **유통**: Claude 제품군 + API + Amazon Bedrock + Google Cloud Vertex AI + Microsoft Foundry [N1]
- **SDK**: Python `anthropic` v0.96.0 (2026-04-16)부터 `claude-opus-4-7` 지원 [G1]
- **폐기 일정**: Sonnet 4 / Opus 4 / Sonnet 3.5 — 2026-06-15 retirement. Haiku 3 — 2026-04-19 retirement [D4]

---

## 2. Skills 시스템

**공식 문서**: `code.claude.com/docs/en/skills` + `platform.claude.com/docs/en/agents-and-tools/agent-skills/overview` [S1][S2]

- **핵심 원리**: **Progressive Disclosure** — metadata(frontmatter)만 상시 로드, `SKILL.md` 본문은 호출 시 로드, supporting files는 필요 시 bash로 읽음 [E4]
- **파일 구조**: `SKILL.md` (필수) + templates/examples/scripts/reference (선택) — 번들 무제한 (context 비용 0 근접) [S1]
- **필수 frontmatter**: `name` (≤64자, 소문자/숫자/하이픈), `description` (권장, ≤1,536자) [S1]
- **선택 frontmatter**: `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context: fork`, `agent`, `hooks`, `paths`(glob), `shell` [S1]
- **로딩 규칙**:
  - Skill **설명(metadata)**은 항상 system prompt에 포함
  - **본문**은 Claude가 해당 skill 판단 시 lazy load
  - **Supporting files**는 본문 명령에 따라 bash로 on-demand 로드
  - 총 스킬 컨텍스트 예산 ~25K 토큰, compaction 후 최근 skill 우선 [S1]
- **호출 방식**: 슬래시 커맨드(`/<skill-name>`) 또는 자동 invocation. `disable-model-invocation: true`로 수동 전용화 가능 [S1]
- **우선순위**: Enterprise > Personal > Project > Plugin (같은 이름 시 상위 덮음) [S1]
- **중첩**: 서브디렉토리 `.claude/skills/`도 자동 발견 (monorepo 지원) [S1]
- **Agent SDK에서의 호출**: API의 `code_execution` 도구 + `skill_id` 지정. 베타 헤더 `skills-2025-10-02`, `code-execution-2025-08-25`, `files-api-2025-04-14` [S2]
- **정식 배포처**: `github.com/anthropics/skills` — Anthropic 공식 skills 레포. `claude-api-skill` 등 포함 [S3]
- **주요 원칙 (엔지니어링 블로그 2025-10-16)** [E4]:
  - Evaluation-first: 대표 태스크 돌려 갭 진단 → 점진적 skill 추가
  - Composability: 스킬은 재사용 자원 (커스텀 에이전트를 새로 만들지 말 것)
  - Security-first: 신뢰된 소스에서만 설치, 번들 코드/외부 연결 감사
- **Cross-surface**: Claude Code / API / claude.ai에서 동일 SKILL 포맷 사용, **단 surface 간 자동 동기화는 없음** (각각 독립 관리) [S2]

---

## 3. Rules / CLAUDE.md 시스템

**공식 문서**: `code.claude.com/docs/en/memory` [M1] + `code.claude.com/docs/en/best-practices` [M2]

- **CLAUDE.md 기본 스펙**:
  - 위치: 프로젝트 루트 또는 `.claude/CLAUDE.md` [M1]
  - 세션 시작 자동 로드 [M1]
  - 권장 분량: ≤200줄 (초과 시 Claude의 규율 준수력 저하) [M1]
- **검색 순서 (walk-up + user + enterprise policy)**:
  1. 프로젝트 루트 `CLAUDE.md`
  2. 상위 디렉토리(git 루트까지) walk-up
  3. `~/.claude/CLAUDE.md` (사용자 레벨)
  4. OS별 Managed Policy 경로 (macOS `/Library/...`, Linux `/etc/...`, Windows `C:\Program Files\...`) [M1]
- **병합**: 상위→하위 append. 같은 계층에서 `CLAUDE.local.md`가 `CLAUDE.md` 뒤에 추가 [M1]
- **`.claude/rules/` 공식 지원**: ✅ 토픽별 파일 분산(`code-style.md`, `testing.md` 등) + 각 파일 frontmatter `paths: ["*.ts"]` glob으로 경로 스코핑 [M1]
- **우선순위**: Project (`.claude/rules/`, 프로젝트 `CLAUDE.md`) > User (`~/.claude/`) > Managed Policy [M1]
- **`@import` 문법**: `@path/to/file.md` — 상대 경로는 import하는 파일 기준 / 최대 5 hop 재귀 / 마크다운 주석(`<!-- -->`)은 context에서 제거 [M1]
- **`settings.json`의 역할 구분**: 구조화 설정(permissions, hooks, env) 전용. `CLAUDE.md`는 자연어 지시. `.claude/rules/`는 경로별 지시 분산 — **세 계층은 상호 보완, 치환 관계가 아니다** [M1][P1]

---

## 4. Memory 시스템

**공식 문서**: `code.claude.com/docs/en/memory` [M1] + `platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool` [M3]

- **Auto Memory 공식 위치**: `~/.claude/projects/<project_id>/memory/MEMORY.md` (프로젝트별 격리) — git 레포 기준, 모든 worktree 공유 [M1]
- **`/memory` 커맨드**: ✅ 공식. CLAUDE.md + rules + auto memory 파일 목록 조회 + auto memory 토글 [M1]
- **파일 기반 vs 서버측**:
  - **Local-first 설계**: 머신 로컬 파일 기반, cloud sync 없음 [M1]
  - **Server-side Memory Tool** (별개): `platform.claude.com` Agent SDK의 공식 Memory Tool. 서버측 compaction + prompt caching과 조합 [M3]
- **`MEMORY.md` 공식 여부**: ✅ **공식** (관용 아님). 첫 200줄/25KB만 세션 시작 시 자동 로드. 이후는 topic files로 분리 [M1]
- **운용 흐름**:
  - 세션 시작: `MEMORY.md` 첫 200줄 자동 로드
  - Claude 필요 시 추가 파일 읽음
  - "Writing memory" / "Recalled memory" 표시 = Claude가 능동적으로 메모리 갱신 중 [M1]
- **MONK OS 현 체계와 일치점**: 디바이스 MEMORY.md 200줄 캡, topic files 분리, MEMORY_CHANGELOG git 추적 — 공식 가이드와 정합 [확인]

---

## 5. Routines (구 Schedules) 전환

**공식 발표**: 2026-04-14 `claude.com/blog/introducing-routines-in-claude-code` [N3] + docs `code.claude.com/docs/en/routines` [R1]

- **발표문 명시**: "If you're using `/schedule` in the CLI, those tasks are now scheduled routines" — `/schedule` 작업은 Routines로 마이그레이션됨 [N3]
- **Routine 3종 트리거** (중복 가능) [N3]:
  - **Scheduled**: cron 또는 자연어 (`hourly`, `nightly`, `weekly`)
  - **API**: 각 routine 고유 엔드포인트 + auth token. `POST` → session URL 반환
  - **Webhook (GitHub)**: PR/Release 등 이벤트. 필터(author/title/body/branch/labels/draft/merged)
- **로컬 vs 원격 분리**:
  - 로컬(Desktop/CLI `/schedule`): 머신에서 실행
  - 원격 Routines: Anthropic cloud — 세션 닫혀도 실행 [N3]
- **일일 사용 상한**: Pro 5 / Max 15 / Team·Enterprise 25 (추가 구매 가능) [N3]
- **ScheduleWakeup / CronCreate 도구의 공식 위상**: ⚠️ 공식 문서 미확인. 본 세션 시스템 프롬프트 주입 도구이나, Routines의 `/fire` API가 정식 경로로 명시됨 [N3][R1]
- **MONK OS 영향**: 현재 미구현. 도입 시 "법률 신설" 수준 의사결정 — 헌법 5조 2항 절차 필요

---

## 6. Context Editing / Compaction / Prompt Caching

**공식 문서**: `platform.claude.com/docs/en/build-with-claude/prompt-caching` [D5] + `.../context-editing` [D6] + `claude.com/blog/using-claude-code-session-management-and-1m-context` [N4]

### 6-1. 자동 컴팩션 (Claude Code)

- **트리거**: 컨텍스트 윈도우 근접 시 자동. 대화 요약으로 히스토리 교체 [N4]
- **수동**: `/compact` (명시 컴팩션), `/clear` (완전 초기화), `/rewind` (이전 지점 복귀) [N4]
- **Subagent 격리**: 서브에이전트는 독립 컨텍스트. 부모 대화 미영향. 30일 자동 정리 [E3]

### 6-2. Prompt Caching 스펙

| 항목 | 사양 |
|------|------|
| 활성화 | `cache_control: {type: "ephemeral"}` 블록 단위 [D5] |
| TTL 기본값 | **5분** (2026-03-06부터 기본값 1h → 5m 변경) [D5] |
| TTL 확장 | `{type: "ephemeral", ttl: "1h"}` 명시 시 1시간 [D5] |
| 가격 (input 대비) | Write 5m: **1.25×**, Write 1h: **2×**, Read: **0.1×** [D5] |
| 손익분기 | Read 1회로 5m 투자 회수, 2회로 1h 투자 회수 [D5] |
| 워크스페이스 격리 | 2026-02-05부터 workspace-level (조직 내 다중 워크스페이스 캐시 분리) [D5] |
| 1M 윈도우 | 900K 토큰 요청도 standard rate 적용. 캐싱 hit 시 0.9M × 0.1× 계산 [D5] |

### 6-3. Context Editing API (베타)

- **헤더**: `context-management-2025-06-27` [D6]
- **기능**: Tool result clearing (`clear_tool_uses_20250919`), Thinking block clearing [D6]
- **작동**: 임계값 초과 시 가장 오래된 tool results를 시간순 제거, placeholder로 교체 [D6]
- **목적**: 에이전트 워크플로우에서 누적된 file contents / search results 정리 [D6]
- **주의**: Compaction(대화 요약)과 Context Editing(tool result 제거)은 용도 분리

---

## 7. Agent SDK

**공식 문서**: `platform.claude.com/docs/en/agent-sdk/*` + `anthropic.com/engineering/building-agents-with-the-claude-agent-sdk` [E2]

- **명칭 변경**: 구 "Claude Code SDK" → 2025년 말 "**Claude Agent SDK**" 공식 개명 [E2]
- **패키지** [G1]:
  - Python: `anthropic` v0.96.0 (2026-04-16) — `claude-opus-4-7` 지원
  - TypeScript: `@anthropic-ai/sdk` (구 `@anthropic-ai/claude-agent-sdk`) ≥0.2.71
  - SDK v0.92.0 (2026-04-08)부터 Claude Managed Agents 지원

### 7-1. SubAgent 패턴

- **정의 방식 3종** [ASDK1]:
  1. Programmatic via `agents` parameter (권장)
  2. Filesystem `.claude/agents/` (마크다운)
  3. Built-in `general-purpose` 자동 호출
- **Context Isolation**: 서브에이전트는 **독립 fresh context**. 부모 대화 히스토리 미상속. Agent tool prompt로만 정보 전달 [ASDK1]
- **Parallelization**: 복수 서브에이전트 동시 실행 지원 (예: style/security/test 3병렬) [ASDK1]
- **Tool 제한**: `tools` 지정 (생략 시 전체 상속) / `disallowedTools`로 제외 [ASDK1]
- **재귀 금지**: 서브에이전트는 서브에이전트를 spawn 불가 (`Agent` tool 미포함) [ASDK1]
- **Resumption**: 서브에이전트 session ID + agent ID로 재개, 전체 히스토리 유지 [ASDK1]

### 7-2. AgentDefinition 구성 필드

```python
AgentDefinition(
    description="...",   # 필수: 언제 사용할지
    prompt="...",        # 필수: 역할 + 행동
    tools=["Read"],      # 선택: 도구 제한
    model="opus",        # 선택: 모델 override
    skills=[...],        # 선택: 스킬 목록
    memory="project",    # 선택: 메모리 소스
    maxTurns=5,          # 선택: 턴 상한
    effort="high",       # 선택: 추론 강도
)
```
[ASDK1]

### 7-3. MCP 클라이언트/서버

- **Server Config**: `.mcp.json` 또는 `settingSources`로 동적 등록 [MCP1]
- **Built-in**: Playwright MCP(브라우저), DB/API MCP 선택 [MCP1]
- **Client**: SDK `query()` 호출 시 MCP 도구 자동 로드 [MCP1]

### 7-4. Managed Agents (claude.ai) vs 셀프 호스팅

- **Managed**: Anthropic 호스팅. API key 기반. 노력 수준 자동 관리 [N1][E1]
- **Self-host**: Python/TS 앱 내 `query()`. tool/MCP/subagent 전체 제어권 [E2]
- **공통**: Messages API 기반. breaking changes 동일 [E2]

### 7-5. Managed Agents 아키텍처 — "Decoupling the brain from the hands" [E1]

- **Brain**: Claude 모델 + harness (의사결정)
- **Hands**: sandboxes + tools (실행)
- **Session**: 모든 이벤트의 durable log
- **원칙**: Stateless harness, 세션 로그 기반 복구, 자격증명 격리, 세션 = 외부 컨텍스트 오브젝트

---

## 8. Claude Code CLI 최신 변경점

**공식 문서**: `code.claude.com/docs/en/{hooks,permissions,vs-code,settings}` [H1][P1][V1][SET1]

### 8-1. 슬래시 커맨드

- **빌트인 (확인 범위)**: `/help`, `/model`, `/compact`, `/clear`, `/rewind`, `/continue`, `/resume`, `/rename`, `/init`, `/memory`, `/permissions`, `/sandbox`, `/hooks`, `/web-setup`, `/schedule`, `/plugin`, `/add-dir`, `/debug`, `/simplify`, `/batch`, `/loop`, `/review`, `/security-review`, `/ultrareview`(4.7 신규), `/claude-api`
- **커스텀**: `.claude/skills/` 또는 `.claude/commands/`에 `SKILL.md`. `disable-model-invocation: true`로 수동 전용 [S1]

### 8-2. settings.json 주요 필드 (2026-04-23 기준) [SET1]

- `permissions`, `hooks`, `env`, `defaultMode`, `effortLevel`, `model`, `sandbox`
- `autoMemoryEnabled`, `autoMemoryDirectory`
- `enabledPlugins`, `extraKnownMarketplaces`
- `claudeMdExcludes`, `disableAllHooks`
- JSON Schema: `https://json.schemastore.org/claude-code-settings.json`

### 8-3. Hooks 이벤트 (공식 목록) [H1]

- **Session**: `SessionStart`, `SessionEnd`
- **Turn**: `UserPromptSubmit`, `Stop`, `StopFailure`
- **Tool**: `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`
- **File**: `FileChanged`, `CwdChanged`
- **기타**: `InstructionsLoaded`, `ToolResultContentAvailable`, `CompactionApplied`, `Notification`
- **Handler 타입**: `command`(shell), `http`(POST JSON), `prompt`(LLM 평가), `agent`(서브에이전트)

### 8-4. Permissions 모델 [P1]

- **문법**: `Tool`(모든 사용) / `Tool(specifier)`(세부) / wildcard `*`
- **평가 순서**: deny → ask → allow (첫 일치 승리)
- **Bash**: process wrapper 제거(`timeout`, `xargs`, `devbox`, `docker`) / glob 확장(`Bash(npm *)` → `npm install`, `npm test` 매칭)
- **Read/Edit**: gitignore 형식. `//`(absolute), `~/`(home), `/`(project root), `./`(cwd)
- **MCP**: `mcp__server_name` 또는 `mcp__server_name__tool_name`
- **Agent**: `Agent(Explore)`, `Agent(my-custom-agent)`

### 8-5. Auto mode (2026-03-25 공식화) [E5]

- **3-tier 분류**:
  - Tier 1: 내장 safe tool (read/search/navigate) → 자동 허용
  - Tier 2: 프로젝트 내부 파일 edit → classifier bypass (VCS로 검토 가능)
  - Tier 3: 나머지 (shell, 외부 서비스, 프로젝트 밖 FS) → transcript classifier
- **설계 규칙**: 비가역 파괴 / 보안 저하 / trust boundary 교차 / shared infra 검토 우회 = 차단
- **지표**: FPR 0.4%, FNR 17% (공식 공개값)
- **Deny-and-continue**: 차단 시 가이던스 반환, 연속 3회 또는 총 20회 후 에스컬레이션

### 8-6. VS Code 확장 [V1]

- 공식 확장 ID: `anthropic.claude-code`
- 실시간 diff + accept/reject, extended thinking 시각화, auto-accept mode, @-mention files, workspace 인식, 멀티탭 대화

---

## 9. Anthropic Cookbook / Best Practices

### 9-1. `github.com/anthropics/anthropic-cookbook` [G2]

- 주요 카테고리: `capabilities/`, `tool_use/`, `multimodal/`, `third_party/`, `coding/`, `extended_thinking/`, `finetuning/`, `images/`, `managed_agents/`, `patterns/agents/`, `skills/`, `tool_evaluation/`, `observability/`, `misc/`, `claude_agent_sdk/`
- 핵심 레시피: Vision 시작, 이미지 추출, Tool-use(customer service/SQL/calculator), 서브에이전트, PDF, prompt caching, 콘텐츠 모더레이션, Pinecone/Voyage AI/Wikipedia 통합
- 메타: 41.3k stars, MIT, 95.7% Jupyter Notebook / 4.3% Python
- ⚠️ 공식 문서 미확인: 최근 60일 신규 파일 단위 커밋 세부 리스트 (페이지 메타에 날짜 미노출)

### 9-2. Best Practices 공식 페이지 (engineering.anthropic.com)

| 문서 | 날짜 | 핵심 |
|------|------|------|
| Claude Code auto mode: a safer way to skip permissions [E5] | 2026-03-25 | 3-tier classifier, FPR/FNR 공개, deny-and-continue |
| Harness design for long-running application development [E6] | 2026-03-24 | Context Resets(vs Compaction), 구조화 파일 핸드오프, Planner/Generator/Evaluator 3-agent |
| Scaling Managed Agents: Decoupling the brain from the hands [E1] | 2026 (정확일 미표기) | Brain/Hands/Session 3분할, stateless harness, durable session log |
| Quantifying infrastructure noise in agentic coding evals [E7] | 2026 (정확일 미표기) | infra 구성이 벤치마크 결과를 상위 모델 간 격차만큼 흔듦 |
| Equipping agents for the real world with Agent Skills [E4] | 2025-10-16 | progressive disclosure, evaluation-first, composability, security-first |
| Effective context engineering for AI agents [E8] | 2025-09-29 | Compaction / Structured note-taking / Multi-agent / Just-in-time context / 하이브리드 |
| Building agents with the Claude Agent SDK [E2] | 2025 (정확일 미표기) | SDK 패턴 공식 가이드 |
| Best Practices for Claude Code [E9] | 지속 갱신 | CLAUDE.md 200줄 가이드, rules 분산 |

### 9-3. Resource Hub (resources.anthropic.com) [E10][E11]

- **Building Effective AI Agents** (공식 핸드북)
- **The Complete Guide to Building Skills for Claude** (PDF)
- **2026 Agentic Coding Trends Report** (PDF, Q1 2026)

---

## 10. 공식 블로그 / 리서치 (최근 60일, 2026-02-23 ~ 2026-04-23)

### News (anthropic.com/news) 실확인분

| 제목 | 날짜 | URL | 요약 |
|------|------|-----|------|
| Introducing Claude Opus 4.7 | **2026-04-16** | /news/claude-opus-4-7 | Opus 4.7 공개 — 1M 컨텍스트·동일 가격·토크나이저 변경·`xhigh` effort·cyber safeguards [N1] |
| Introducing Claude Design by Anthropic Labs | **2026-04-17** | /news/claude-design-anthropic-labs | 시각 협업 제품 (design/prototype/slides/one-pager) [N2] |
| Claude is a space to think | **2026-02-04** | /news/claude-is-a-space-to-think | Claude의 비광고 원칙 선언 [N5] |

### Engineering (anthropic.com/engineering) 최근 2026 분

| 제목 | 날짜 | URL | 요약 |
|------|------|-----|------|
| Claude Code auto mode: a safer way to skip permissions | **2026-03-25** | /engineering/claude-code-auto-mode | 3-tier classifier 구조 [E5] |
| Harness design for long-running application development | **2026-03-24** | /engineering/harness-design-long-running-apps | Context Resets / 파일 핸드오프 / 3-agent 아키텍처 [E6] |
| Scaling Managed Agents: Decoupling the brain from the hands | 2026 | /engineering/managed-agents | Brain/Hands/Session 분할 [E1] |
| Quantifying infrastructure noise in agentic coding evals | 2026 | /engineering/infrastructure-noise | infra 노이즈 정량화 [E7] |

### Claude.com Blog

| 제목 | 날짜 | URL | 요약 |
|------|------|-----|------|
| Introducing Routines in Claude Code | **2026-04-14** | /blog/introducing-routines-in-claude-code | Routines 공식 출시 — 3트리거·원격 실행 [N3] |

### ⚠️ 공식 문서 미확인 (최근 60일 내 추가 기대했으나 확인 실패)

- Agentic misalignment / safety 전용 신규 공지 (2026-02 이후 news에서 미발견)
- Constitutional AI / RLHF 최신 research note (anthropic.com/research 크롤 미수행 — 후속 조사 필요)
- Prompt caching 가격·TTL **재개정** 공지 (2026-03-06 기본 TTL 1h→5m 변경 확인 외 추가 공지 미확인)

---

## 11. MONK OS 매핑 초안 (Track A 판단)

| Anthropic 공식 개념 | 공식 위치 | MONK OS 대응 | 갭 / 제안 |
|---|---|---|---|
| **Opus 4.7 모델** | [D1][N1] | 본 세션 프롬프트가 `claude-opus-4-7`로 식별 | 토크나이저 +35% 영향 → 지시서·세션 로그 토큰 예산 재검토. `effort` 정책 명시 없음 → **법률 ch2에 effort 기준 신설 제안** |
| **Agent Skills** | [S1][S2][S3] | `.claude/skills/` 운용 중 | 현 스킬 파일에 `name`/`description` frontmatter 점검 필요. `disable-model-invocation` 미사용 → 유저 invocable 의도대로 분리 제안 |
| **CLAUDE.md + `.claude/rules/`** | [M1] | 프로젝트 CLAUDE.md + `.claude/rules/cdp-browser.md`·`deployment.md` | 공식 스펙과 일치. `@import` 미사용 → 헌법→법률 링크를 `@` 임포트화 검토 (200줄 캡 준수 강화) |
| **Auto Memory / MEMORY.md** | [M1] | `~/.claude/projects/.../memory/MEMORY.md` | 200줄 캡·topic file 분리 **이미 공식 가이드와 정합**. Anthropic 설계자 의도와 작가님 설계가 수렴 — 선행 사례 ✅ |
| **Server-side Memory Tool** | [M3] | 미사용 (MONK OS는 로컬 파일) | Agent SDK 활용 시 선택적. 현재는 갭 없음 |
| **Routines (구 Schedules)** | [N3][R1] | 미구현 | `/schedule` 역시 미사용 → 즉시 갭은 아니나, **코웍이 배포 실행·정기 감사 자동화에 수용 검토 가치**. 법률 신설 수준 의사결정 |
| **Hooks (21+ 이벤트)** | [H1] | 미사용 | `SessionStart`·`UserPromptSubmit`·`PreToolUse` 정도는 **즉시 수용 가치** (세션 로그 자동 헤더, deploy.sh 경유 강제 등) |
| **Permissions 3-tier Auto mode** | [P1][E5] | 수동 승인 기반 | Tier 2(in-project edit 자동) 수용 시 쌍아·민아 workflow 가속. 단 deny 카테고리("trust boundary 교차")는 법률 제4장 2항과 정합 — 적용 시 ch5(배포)·ch7(막내)에 반영 |
| **Agent SDK SubAgent** | [ASDK1][E2] | 쌍아·민아·막내·용아 체계 | 공식 SubAgent 원칙과 **개념적으로 일치** — fresh context, tool 제한, 재귀 금지. 단 MONK의 "작가님 CLI 투입" 모델은 SDK `agents` 파라미터보다 느슨함. 개념 정합성 논의 필요 (Phase 1 통합 보고 사안) |
| **MCP** | [MCP1] | `.claude/rules/cdp-browser.md` — CDP 선택, MCP 회피 (Claude in Chrome 한 세션 점유 회피 목적) | 동기는 명확하나 **서버측 MCP(Playwright)는 Claude in Chrome과 다름** — 검토 여지. PF_CDP와 교차 검토 필요 |
| **`/ultrareview` (4.7 신규)** | [N1] | CLAUDE.md에 사용자 안내 이미 존재 | 갭 없음 (본 CLAUDE.md가 이미 `/ultrareview` 안내 포함) |
| **Context Editing (beta)** | [D6] | 미사용 | 장기 세션에서 tool result 누적 문제 발생 시 수용. 현 컴팩팅 체계와 병용 가능 |
| **Prompt Caching TTL 5m 기본** | [D5] | 암묵적 사용 (cache_control 명시 없음) | 긴 세션에서 `ttl: "1h"` 명시 수익 검토 — 특히 CLAUDE.md + MEMORY.md 상시 로드 구간 |
| **Best Practices: Context Resets vs Compaction** | [E6] | 현재 compaction 일원화 | 세션 교체 후 "progress file" 개념 수용 가치 — **PF 히스토리가 이미 유사 역할 수행** ✅ |
| **Best Practices: 3-agent (Planner/Generator/Evaluator)** | [E6] | 쌍아(설계)·막내(실행)·민아(검증) = 사실상 동형 | 이미 선행 구현. MONK 용어로 번역하면 공식 자산화 가능 |

---

## 12. 출처 URL 전체 목록

### Docs (docs.anthropic.com / platform.claude.com / code.claude.com)

- [D1] https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- [D2] https://platform.claude.com/docs/en/about-claude/pricing
- [D4] https://platform.claude.com/docs/en/about-claude/model-deprecations
- [D5] https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- [D6] https://platform.claude.com/docs/en/build-with-claude/context-editing
- [M1] https://code.claude.com/docs/en/memory
- [M2] https://code.claude.com/docs/en/best-practices
- [M3] https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
- [S1] https://code.claude.com/docs/en/skills
- [S2] https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- [R1] https://code.claude.com/docs/en/routines
- [H1] https://code.claude.com/docs/en/hooks
- [P1] https://code.claude.com/docs/en/permissions
- [V1] https://code.claude.com/docs/en/vs-code
- [SET1] https://code.claude.com/docs/en/settings
- [ASDK1] https://platform.claude.com/docs/en/agent-sdk/subagents
- [MCP1] https://platform.claude.com/docs/en/agent-sdk/mcp
- [BIT1] https://platform.claude.com/docs/en/agents-and-tools/tool-use/built-in-tools

### News (anthropic.com/news)

- [N1] https://www.anthropic.com/news/claude-opus-4-7 (2026-04-16)
- [N2] https://www.anthropic.com/news/claude-design-anthropic-labs (2026-04-17)
- [N3] https://claude.com/blog/introducing-routines-in-claude-code (2026-04-14)
- [N4] https://claude.com/blog/using-claude-code-session-management-and-1m-context
- [N5] https://www.anthropic.com/news/claude-is-a-space-to-think (2026-02-04)

### Engineering (anthropic.com/engineering)

- [E1] https://www.anthropic.com/engineering/managed-agents
- [E2] https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
- [E3] https://code.claude.com/docs/en/how-claude-code-works
- [E4] https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills (2025-10-16)
- [E5] https://www.anthropic.com/engineering/claude-code-auto-mode (2026-03-25)
- [E6] https://www.anthropic.com/engineering/harness-design-long-running-apps (2026-03-24)
- [E7] https://www.anthropic.com/engineering/infrastructure-noise
- [E8] https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents (2025-09-29)
- [E9] https://www.anthropic.com/engineering/claude-code-best-practices
- [E10] https://resources.anthropic.com/building-effective-ai-agents
- [E11] https://resources.anthropic.com/2026-agentic-coding-trends-report

### GitHub

- [G1] https://github.com/anthropics/anthropic-sdk-python/releases
- [G2] https://github.com/anthropics/anthropic-cookbook
- [S3] https://github.com/anthropics/skills

---

**조회일**: 2026-04-23
**작성자**: iMac/막내1
**검수 상태**: Anthropic 공식 1차 소스 기반. ⚠️ 미확인 항목은 본문에 명시.
