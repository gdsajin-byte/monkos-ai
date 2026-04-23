---
type: RESEARCH
track: B
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내2
---

# RESEARCH B — 업계 에이전트 OS 방향성

> **[2026-04-23 12:05 KST] iMac/막내2**
> 상위 PF: [PF_MONK_OS](../README.md)
> 지시서: [ORDER_20260423_PF_MONK_OS_B_industry.md](../../../orders/ORDER_20260423_PF_MONK_OS_B_industry.md)
> 병렬 트랙: A(Anthropic)·C(Kimi)·D — 침범 금지. 중복은 "(X 트랙 소관)" 표기.

---

## 요약 (500자 내)

2026-04 업계는 **표준 수렴(프로토콜) + 파편화(오케스트레이션)**의 이중 구조로 수렴 중이다. MCP는 2025-12 Anthropic이 Linux Foundation 산하 **Agentic AI Foundation(AAIF)**에 기부, Anthropic·Block·OpenAI 공동 거버넌스로 전환됐고, Google A2A도 동일 재단으로 이관돼 **v1.2 / 150+ 조직 프로덕션**. 이 둘이 "에이전트-도구(MCP)·에이전트-에이전트(A2A)" 두 레이어 표준의 사실상 승자다. 반면 오케스트레이션 프레임워크(LangGraph·CrewAI·AutoGen·Pydantic AI)는 각축이고, IDE 에이전트(Cursor·Cline·Windsurf)는 Rules·Memory·Skills 3축에서 유사 패턴으로 수렴 중이다. MONK OS의 생존 전략: **MCP+A2A 표준 얹기 + 독자 거버넌스(헌법/법률/PF)로 상층 차별화**. (공식 문서 교차확인 완료 — §13 URL 참조)

---

## 1. Google ADK / Vertex

| 항목 | 내용 |
|------|------|
| 공식 docs | https://google.github.io/adk-docs |
| 릴리즈 주기 | 약 2주 cadence (공식 표기) |
| 지원 언어 | Python(`google-adk`), TypeScript(`@google/adk`), Go(`google.golang.org/adk`), Java(`com.google.adk`) — 4개 SDK 분리 릴리즈 |
| 코어 개념 | "Agent"가 1급 객체, 멀티에이전트 네이티브 지원 (delegation·supervisor 패턴) |
| Gemini 바인딩 | Gemini 2.5가 1차 파트너 모델이나 LiteLLM 등으로 타 모델 연결 가능 (코드 우선, 모델 종속 최소화 강조) |
| Vertex 바인딩 | Vertex AI Agent Builder + Agent Engine의 공식 런타임 = ADK. Agentspace(사용자용 에이전트 오케스트레이션 레이어)가 상위 |
| 최근 시그널 | 2026 Google Cloud Next에서 **"풀스택 AI agents + A2A + Workspace Studio"** 발표. TypeScript SDK 별도 런치 블로그 존재 |

**MONK OS 관점**: ADK는 Claude Code와 동일하게 "코드 우선·멀티에이전트·SDK 다언어" 철학. MONK의 에이전트 페르소나 체계를 ADK로 포팅하는 것이 이식성의 B 시나리오가 될 수 있다. Vertex 록인 리스크는 Agent Engine 런타임에 한정.

---

## 2. Google A2A (Agent-to-Agent)

| 항목 | 내용 |
|------|------|
| 공식 스펙 | https://github.com/a2aproject/A2A |
| 거버넌스 | **Linux Foundation 산하 Agentic AI Foundation(AAIF)**로 이관 완료 — 2026-04 시점 공식 멀티스테이크홀더 |
| 버전 | **v1.2** (Cryptographic agent card signing = 도메인 검증 가능) |
| 참여 | 150+ 조직 프로덕션 배포 (AAIF 2026-04 status) |
| Transport | JSON-RPC 2.0 over HTTPS / SSE / gRPC |
| 인증 | OAuth 2.0, OpenID Connect Discovery, API keys (OpenAPI 호환) |
| Agent Card | `/.well-known/agent-card.json` — 이름·능력·엔드포인트 선언, 서명 가능 |
| MCP와 관계 | **상보적**. MCP = 에이전트↔도구/데이터, A2A = 에이전트↔에이전트. Google 공식 "Developer's Guide"도 둘을 분리 설명 |

**MONK OS 관점**: 에이전트 간 통신 표준으로는 A2A가 사실상 유일한 공개 스펙. MONK의 쌍아·민아·막내·용아·코웍이 에이전트가 디바이스·레포를 넘나드는 통신 계층에서 A2A Agent Card를 채택하면 외부 에이전트(Google ADK·LangGraph·CrewAI)와의 interop이 자동 확보된다.

---

## 3. OpenAI AgentKit / Responses API

| 항목 | 내용 |
|------|------|
| 공식 | https://openai.com/index/introducing-agentkit/ , https://openai.github.io/openai-agents-python/ |
| 구성요소 | **Agent Builder**(비주얼 캔버스) + **Connector Registry**(데이터/툴 연결 중앙관리) + **ChatKit**(채팅 UI 내장) |
| Responses API | Assistants API 대체재. 2026 중반 Assistants deprecation 공지(마이그레이션 가이드 제공 예정) |
| 최근 추가 | **Tool Search** (대규모 tool surface의 runtime 지연 로딩), **Computer use tool**(스크린샷 기반 UI), **WebSocket mode** |
| 모델 | GPT-5.4 + GPT-5.4 mini/nano 지원 |
| MCP 지원 | OpenAI Responses API가 MCP 클라이언트 역할 지원(커뮤니티 확인 다수), **A2A는 비공식** |

**MONK OS 관점**: AgentKit은 Anthropic 생태계와 직접 경쟁. 그러나 **OpenAI도 MCP 기부자**(Block·OpenAI·Anthropic 공동)이므로 MCP 계층만 MONK에 얹으면 OpenAI 모델로의 fallback은 열려 있다. Responses API는 "Assistants의 deprecation 축"이 명확해 2026 내 중대 마이그레이션 — MONK는 직접 의존을 피하고 MCP 레이어만 바라볼 것.

---

## 4. MCP (Model Context Protocol) 현황

| 항목 | 내용 |
|------|------|
| 공식 | https://modelcontextprotocol.io |
| 거버넌스 | **2025-12 Anthropic → Agentic AI Foundation(AAIF, Linux Foundation directed fund) 기부 완료**. Block·OpenAI 공동창립, 기타 지원. 개인(company X) 자격의 Maintainer·Core Maintainer·Lead Maintainer 3계층 Steering Group |
| 스펙 릴리즈 | 직전 공식판 2025-11. 다음 판은 **2026-06 예정**(SEP 1Q 2026 확정 목표) |
| 2026 로드맵 4축 | 거버넌스 성숙 / 엔터프라이즈 어댑션 / 스펙 진화(SEP) / 서버 에코시스템 확장 |
| 핵심 기능 6종 | **Tools · Resources · Prompts · Sampling · Roots · Elicitation** |
| **Elicitation** | 서버가 클라이언트에 구조화된 입력(JSON Schema) 또는 URL 모드(외부 인증)로 HITL 요청 — draft 포함, human-in-the-loop 표준화 |
| 구조화 출력 | Tool 결과를 schema-validated 구조로 반환 (2026 추가) |
| OAuth 강화 | 2026 스펙 OAuth 2.0 flow 정형화 |
| 클라이언트 지원 | Claude Code / Cursor / Cline / VSCode(MCP 정식 지원) / Continue / Windsurf / OpenAI Responses / Google ADK (순차 확대) |

**주의(Simon Willison 반대 의견)**: "MCP를 더 이상 쓰지 않는다. CLI 유틸 + Playwright가 더 효과적" — 그의 "lethal trifecta(private data + untrusted content + external comms)" 위협 모델은 MCP 서버 난립 시의 보안 리스크 지적. 채택 시 sandbox·권한 분리 필수.

---

## 5. 에이전트형 코드 도구 — Rules/Memory/Skills 비교표

| 도구 | Rules | Memory | Skills/기타 | 2026 핵심 변화 |
|------|-------|--------|-------------|---------------|
| **Cursor** | `.cursor/rules/*.mdc` (5계층: Global/Project/Team/Nested/Auto-attach), frontmatter 기반 스코프 | `learned-memories.mdc` (프로젝트 학습 저장) | MCP 정식 지원(Prompts·Resources·Elicitation·Dynamic Tools 신규) | **.mdc** 포맷 + 5계층 체계 확립 |
| **Cline** | `.clinerules/*.md` | **Memory Bank** (`memory-bank/` 하위 `projectbrief/productContext/activeContext/systemPatterns/techContext/progress.md` 6종 강제 로드) | MCP 통합(표준 탑재), Memory Bank MCP 서버도 존재 | "매 task 시작 시 전체 Memory Bank 읽기"를 시스템 프롬프트로 강제 |
| **Aider** | `CONVENTIONS.md` (`/read`로 read-only + prompt cache) | 컨벤션 파일이 유일한 지속성 (공식 메모리 없음) | Spring AI의 `AutoMemoryTools`가 Claude Code 철학을 이식 | 별도 메모리 레이어 부재 → MEMORY.md류 관행이 커뮤니티 확산 중 |
| **Continue** | `config.yaml` 내 rules 섹션 | context providers 기반 (terminal, call-stack, codebase outline 등) | Agent mode: 시스템 메시지 기반 tool 호출(provider 무관) | Hub vs Local 이중 설정, "모델 무관" 호환을 슬로건화 |
| **Windsurf/Cascade** | `.windsurfrules` (글로벌/프로젝트) | 세션 간 영구 memories | **`.agents/skills/` 디렉터리 지원(2026-02-12)** — post_cascade_response hook + `rules_applied` 필드 | **Skills 형식을 Anthropic 외 최초 정식 채택 IDE** |
| **Claude Code** (비교 기준) | `CLAUDE.md` + Skills | `MEMORY.md` + typed files (Memory Tool) | **Skills** (`SKILL.md` + 리소스) — 업계 표준 후보 | Agent Skills 포맷이 2026 업계 확산 모멘텀 확보 |

**핵심 수렴 신호**:
- **"Rules(정적 정책) + Memory(세션 간 사실) + Skills(절차적 번들)"** 3축 구조가 업계 공통 뼈대로 굳어지는 중.
- Windsurf가 `.agents/skills/`를 공식 채택한 것이 가장 큰 신호 — Skills 포맷이 MCP·A2A 다음 표준화 후보.

---

## 6. 메이저 에이전트 프레임워크 6종

### 6-1. LangChain / LangGraph
- **v1.0 도달 완료**(LangChain·LangGraph 동시). v0.3 이후 `create_react_agent` → `langgraph-prebuilt`로 이동, ReAct·Supervisor·Swarm 프리빌트 제공
- 2026 벤치마크 **task-success 87%** (category leader)
- 1급 개념: typed state + conditional edges + checkpointing + 명시적 interrupt (HITL)
- `deepagents` (LangGraph 기반 planning + filesystem + subagent 프레임워크) 발표

### 6-2. LlamaIndex
- Workflows 1.0(2025-말) → Agent Workflow + **Agent Client Protocol(ACP) 통합**(filesystem·MCP server·persistent memory)
- 2026-04: Pre-built document agent 템플릿, `llamactl` 원커맨드 배포, "document vibe-coding"
- 비전: "long-horizon agent = employee" (inbox-style, 주 단위 runner)

### 6-3. CrewAI
- **GitHub 30k+ stars**(2026 초), **Flows 일 12M executions**
- Role-based DSL(20 LOC 시작) + Flows(event-driven 제어)
- learn.crewai.com 커뮤니티 10만+ 수료생 — 실무 보급률 높음

### 6-4. Microsoft AutoGen v0.4
- **Actor model 기반 재설계**(2025-초 정식, 2026 stable)
- async + event-driven, 프로세스/언어 분리 런타임
- Core → AgentChat → Studio 3계층. MS 클라우드 제품화 중(Azure AI Agent Service)

### 6-5. Pydantic AI
- **v1.85.1, 16.5k stars**(2026-04-22 기준)
- Type-safe + structured output 자동 validation + reflection/self-correction
- **Durable execution**(장애 후 재개·HITL·장시간 async) — 2026 엔터프라이즈 셀링포인트
- Amazon Bedrock AgentCore와 연동 사례

### 6-6. 기타 관찰
- **deepagents**(LangChain 공식) — "planning tool + filesystem + subagents" 패키지. MONK의 구조와 매우 유사
- **smolagents**(HF) — §7

---

## 7. Hugging Face

| 항목 | 내용 |
|------|------|
| `smolagents` | HF 공식 agent 프레임워크. 경량·code-agent 특화. HF Agents Course의 1차 교재 |
| HF Agents Course | 4주 커리큘럼(smolagents + LlamaIndex + LangGraph 복합). DataCamp/DeepLearning.AI가 파트너 코스 공급 |
| **`ml-intern`** (2026-04) | smolagents 위에 구축된 오픈소스 에이전트, **LLM post-training 워크플로우 자동화** 타겟 — HF가 "에이전트로 에이전트 훈련" 레이어 본격 진입 |
| Transformers Agents | legacy 상태(smolagents로 수렴) |
| HF Hub 트렌딩 | MCP server 레포, smolagents 파생 프로젝트 상위권 유지 |

**MONK OS 관점**: smolagents는 MCP 네이티브 + code-agent 패턴 — MONK의 막내 패턴(자율 코딩)과 철학 유사. 오픈소스 baseline 선택 시 후보 1순위.

---

## 8. 커뮤니티 시그널

### Simon Willison (simonwillison.net)
- 2026-04-19 **"Headless everything for personal AI"** — Salesforce/Agentforce가 API/MCP/CLI 동시 노출로 "에이전트 친화 백엔드"의 미래를 제시
- **MCP 회의론 천명**: "코딩 에이전트에는 MCP 안 쓴다. CLI + Playwright가 더 효율적"
- **Lethal Trifecta** 위협 모델(2025-06 원류): private data + untrusted content + exfiltration = 필연적 탈취. MCP 서버 난립 시 구조적 취약.

### Hacker News
- **"Agentic Frameworks in 2026: Less Hype, More Autonomy"** (HN 46509130) — 프레임워크 층이 안정화, 차별화는 **harness(시간·메모리·실패 모델링)** 로 이동했다는 대표 담론
- **"Building Effective AI Agents"**(Anthropic 원문 기반, HN 44301809) — 단순 워크플로우가 복잡 agent보다 낫다는 원칙이 여전히 인용됨
- **"Deterministic + Agentic AI Architecture"**(TheHackerNews 2026-04) — 결정론적 레이어 + 에이전트 레이어 분리의 엔터프라이즈 아키텍처 표준화 논의

### r/LocalLLaMA
- 694k member 규모. 2026 월간 "Top Local Models" 쓰레드에서 **Kimi K2.6 / DeepSeek V3.2 / Qwen3.5**가 4/20부로 상위 고정 (C 트랙 소관 — 상세 생략)
- "Dense model이 MoE보다 코딩 에이전트에 일관적" 담론 반복 — MoE 라우팅의 예측불가성 지적

### 개발자 블로그 (추세)
- Agent Skills 도입 가이드 급증, Cursor 5-level 체계 해설이 2026-04 유행
- Pydantic AI가 엔터프라이즈 "structured agent" 진영에서 급부상

---

## 9. GitHub 트렌딩 (2026-04 기준)

| 프로젝트 | 스타(추정) | 한 줄 |
|----------|------------|-------|
| **OpenClaw** | **210k+** | 2026-01-말 바이럴 시작, GitHub 史 최고속 성장. 개인 생산성/웹자동화/스케줄링 범용 에이전트. Kimi K2.6 day-0 지원 (※ "OpenClaw" 외부 기사 반복 등장 — 공식 레포 명칭·라이선스 교차검증 필요 ⚠️ 공식 문서 미확인) |
| **Langflow** | 146k | 비주얼 agent 빌더(플로우 기반) |
| **Dify** | 136k | LLM 앱 플랫폼, 비주얼 오케스트레이션 |
| **Flowise** | 51k | Node-red 스타일 LLM 플로우 |
| **openai-agents-python** | (지속 상승) | OpenAI Agents SDK 공식 |
| **omi** | (바이럴) | 스크린·대화 상시 감지 ambient agent |
| **EvoMap / evolver** | (신규) | "Genome Evolution Protocol(GEP)" — agent 자기진화 실험 |

**경향**: (1) **비주얼 빌더 3강**(Langflow/Dify/Flowise)이 엔터프라이즈/시민개발자 진영 장악, (2) **범용 퍼스널 에이전트(OpenClaw)**가 B2C에서 폭발, (3) 메모리·self-improvement(EvoMap) 실험 레이어가 다음 물결 후보.

---

## 10. 표준 수렴 지도 (1장 요약)

```
 [ 표준 수렴 층 — 얹히면 이식성 획득 ]
 ┌────────────────────────────────────────────────┐
 │ 에이전트↔에이전트 :  A2A v1.2 (LF/AAIF)         │
 │ 에이전트↔도구/데이터 : MCP (LF/AAIF, 2026-06 차기│
 │ 에이전트↔사람(HITL) : MCP Elicitation (draft)   │
 │ 절차 번들            : Agent Skills (SKILL.md)  │
 │                       Claude Code→Windsurf 확산 │
 └────────────────────────────────────────────────┘
            ▲                       ▲
            │                       │
 [ 반(半)수렴 층 — 패턴은 유사, 포맷 제각각 ]
  ┌──────────────────────────────────────────────┐
  │ Rules : .cursor/rules  .clinerules           │
  │         .windsurfrules  CLAUDE.md           │
  │ Memory: learned-memories.mdc / memory-bank/ │
  │         MEMORY.md / Windsurf persistent     │
  └──────────────────────────────────────────────┘
            ▲
            │
 [ 파편 층 — 독자 설계 가능, 경쟁 지속 ]
   LangGraph (graph+state)  vs  CrewAI (role+flow)
   AutoGen v0.4 (actor)     vs  Pydantic AI (type)
   LlamaIndex Workflows     vs  smolagents (code)
   각 프레임워크의 "에이전트 정의·실행·관찰" DSL
```

**결론**: MONK OS는 **아래 층(파편)에 직접 참전하지 말고**, 위 두 층(표준 수렴 + 반수렴)에만 붙으면 된다. 파편 층은 MONK의 **헌법·법률·PF·세션 로그**라는 독자 DSL로 대체 가능하고, 그것이 차별화 지점이다.

---

## 11. 중국 모델 간단 언급 (C 트랙 소관 — 생태계 컨텍스트만)

- **Kimi K2.6** (2026-04-20 정식): 오픈웨이트 1T/32B active MoE, 256K ctx, **SWE-Bench Pro 58.6 / BrowseComp 83.2**로 오픈 SOTA 달성. **4,000+ tool call · 12시간+ 연속 실행 · 300 parallel sub-agent** 주장 (C 트랙 검증).
- **DeepSeek V3.2**: 가격 대비 GPT-5.4 대비 90% 품질 / 1/50 비용 구도 유지.
- **Qwen3.6-Max-Preview**: agentic coding + real-world reliability 강화.
- **GLM-5 (Z.AI)**: 중국 리더보드 수위.
- 생태계 시사점: **"오픈소스 + 저가 + agent 특화"** 3축에서 중국 모델이 서구 OSS 대비 우위. 서구는 프로토콜·거버넌스·프레임워크 우위. MONK는 **중국 모델을 플러그로 받고 서구 프로토콜로 묶는 중립 포지션**이 최적.

---

## 12. MONK OS 관점 3문항 답

### Q1. MONK OS가 채택해야 할 핵심 표준 프로토콜은?

**A1. MCP + A2A 이중 채택 (모두 LF/AAIF 산하, 2026-06 동시 성숙)**
- **MCP**: 에이전트↔도구/데이터. 이미 Claude Code·Cursor·Cline·Windsurf·VSCode·OpenAI·Google ADK 전체 클라이언트 지원. **MONK의 서비스(몽코스 스튜디오·포털·ID포토)를 MCP 서버로 래핑**하면 외부 에이전트가 즉시 자사 백엔드 호출 가능.
- **A2A**: 에이전트↔에이전트. **쌍아/민아/막내/용아/코웍이가 A2A Agent Card를 발행**하면 외부 에이전트(Google ADK·CrewAI·LangGraph)와 interop. MONK OS의 "멀티에이전트 운영 철학"을 외부에 개방하는 유일한 표준 경로.
- **Responses API·Assistants API는 비채택**: OpenAI 단일 벤더 종속. MCP 레이어만 공유하면 모델 스왑으로 충분.

### Q2. 타사 도구에서 차용할 만한 Rules/Memory 패턴 3건

1. **Cursor 5-level rules 계층 + `.mdc` frontmatter** — MONK의 헌법(Global)/법률(Project)/규정(Nested)/스킬(Auto-attach) 위계와 1:1 매핑. 현재 `.claude/rules/*.md` 평면 구조를 frontmatter 기반 자동 스코프(글롭/파일 패턴)로 업그레이드하면 토큰 절감 + 무관한 규칙 미로딩.
2. **Cline Memory Bank의 "매 task 시작 시 전체 읽기" 강제** — MONK가 이미 MEMORY.md를 매 세션 자동 로드하지만, **활성 컨텍스트(activeContext.md)·시스템 패턴(systemPatterns.md)·진행(progress.md) 분리 파일 구조**를 PF별로 도입하면 "지금 이 PF에서 무슨 상태인지"가 한 번에 복원됨. PF README의 Phase 섹션을 이 구조로 정렬할 가치 있음.
3. **Windsurf assembly pipeline (Rules → Memory → open files → codebase retrieval → recent actions → assemble)** — MONK 세션 시작 프로토콜(§세션 시작 프로세스)이 git fetch + works 확인까지만 정의돼 있음. Windsurf식 **"어떤 순서로 컨텍스트를 조립해 LLM에 투입하는가"** 를 명시 문서화하면 에이전트 간 동작 일관성 확보.

### Q3. MONK OS가 경쟁적 차별화로 유지해야 할 독자 영역 3건

1. **삼권 분립 + 만장일치 개정 거버넌스** — 업계 어느 프레임워크도 "거버넌스 DNA"를 에이전트 운영 체계에 내장하지 않음. MONK의 헌법 5조·법률 8장·AMENDMENT 절차는 **"장기 운영 시 원칙 드리프트 방지"**라는 실무 문제를 푸는 고유 자산. 대외 공개 시 "Constitutional Agent Operations(CAO)"류 포지셔닝 가능.
2. **분산 세션 로그 + PF 포트폴리오 생애주기** — CrewAI·LangGraph의 "실행 trace"와 다름. MONK의 **세션 로그(append-only, 타임스탬프 절대) + PF(기안→완성 추적) + ORDER(지시서 정본)**는 AI+사람 혼합 조직의 **운영 기록 구조**. 업계에는 "실행 tracing"은 있지만 "조직 기록"은 부재.
3. **에이전트 페르소나 + 역할 이원화(커맨더/실행자)** — CrewAI의 role-DSL은 동등 평면. MONK는 **쌍아(설계·지시서, 코딩 원칙 금지) ↔ 막내(실행)**의 비대칭 + 4MUSE 페르소나 세계관. "AI 조직 문화"의 언어는 업계 부재 — 이는 MONK의 UX·브랜딩 차별화(몽코스 3D 아바타 로드맵과 직결).

---

## 13. 출처 URL 전체 (조회일자 2026-04-23)

### Google ADK / A2A
- [Agent Development Kit (ADK) 공식 문서](https://google.github.io/adk-docs)
- [google/adk-python GitHub](https://github.com/google/adk-python)
- [ADK TypeScript 소개 (Google Developers Blog)](https://developers.googleblog.com/introducing-agent-development-kit-for-typescript-build-ai-agents-with-the-power-of-a-code-first-approach/)
- [Vertex AI Agent Builder × ADK](https://docs.cloud.google.com/agent-builder/agent-development-kit/overview)
- [Google Cloud Next 2026 Agentic AI 분석 (TNW)](https://thenextweb.com/news/google-cloud-next-ai-agents-agentic-era)
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A)
- [Agent2Agent Protocol 공식 발표](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)
- [A2A getting an upgrade (Google Cloud)](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade)
- [A2A Protocol Guide 2026 (RapidClaw)](https://rapidclaw.dev/blog/a2a-protocol-complete-guide-2026)
- [A2A 150+ Orgs Analysis (Stellagent)](https://stellagent.ai/insights/a2a-protocol-google-agent-to-agent)
- [Developer's Guide to AI Agent Protocols (Google)](https://developers.googleblog.com/developers-guide-to-ai-agent-protocols/)
- [Agent2Agent agent development (Vertex docs)](https://docs.cloud.google.com/agent-builder/agent-engine/develop/a2a)

### OpenAI
- [Introducing AgentKit](https://openai.com/index/introducing-agentkit/)
- [OpenAI Agents SDK (Python 공식)](https://openai.github.io/openai-agents-python/)
- [OpenAI API Changelog](https://developers.openai.com/api/docs/changelog)
- [OpenAI Agents SDK Guide](https://developers.openai.com/api/docs/guides/agents)
- [AgentKit 2026 Build Guide (Kanerika)](https://kanerika.com/blogs/openai-agentkit/)
- [openai-agents Python PyPI](https://pypi.org/project/openai-agents/)

### MCP
- [Model Context Protocol 공식](https://modelcontextprotocol.io)
- [MCP Governance & Stewardship](https://modelcontextprotocol.io/community/governance)
- [2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/)
- [Expanding MCP Maintainer Team (2026-04-08)](https://blog.modelcontextprotocol.io/posts/2026-04-08-maintainer-update/)
- [MCP Wikipedia](https://en.wikipedia.org/wiki/Model_Context_Protocol)
- [MCP Elicitation 스펙 draft](https://modelcontextprotocol.io/specification/draft/client/elicitation)
- [MCP Features Guide (WorkOS)](https://workos.com/blog/mcp-features-guide)
- [MCP Elicitation in VSCode (Den Delimarsky)](https://den.dev/blog/vscode-mcp-elicitations-stop-guessing/)
- [A Year of MCP Review (Pento)](https://www.pento.ai/blog/a-year-of-mcp-2025-review)
- [2026 Enterprise MCP (CData)](https://www.cdata.com/blog/2026-year-enterprise-ready-mcp-adoption)

### IDE 에이전트
- [Cursor Rules 공식 문서](https://cursor.com/docs/rules)
- [Cursor Rules 2026 5-level (Medium)](https://medium.com/@vibecodingdirectory/how-to-structure-cursor-rules-in-2026-the-5-level-system-cursor-rules-eaf0df16e8e7)
- [Cursor Release Notes](https://releasebot.io/updates/cursor)
- [Cursor Memory Bank (Lullabot)](https://www.lullabot.com/articles/supercharge-your-ai-coding-cursor-rules-and-memory-banks)
- [Cline Memory Bank 공식](https://docs.cline.bot/features/memory-bank)
- [Cline Memory Bank 블로그](https://cline.bot/blog/memory-bank-how-to-make-cline-an-ai-agent-that-never-forgets)
- [cline/prompts memory-bank rule](https://github.com/cline/prompts/blob/main/.clinerules/memory-bank.md)
- [Aider Conventions 공식](https://aider.chat/docs/usage/conventions.html)
- [Aider-AI/conventions GitHub](https://github.com/Aider-AI/conventions)
- [Windsurf Cascade 공식](https://docs.windsurf.com/windsurf/cascade/cascade)
- [Windsurf Editor Changelog](https://windsurf.com/changelog)
- [Windsurf Context Management (IcebergLakehouse)](https://iceberglakehouse.com/posts/2026-03-context-windsurf/)
- [Continue.dev Agent Quick Start](https://docs.continue.dev/ide-extensions/agent/quick-start)
- [Continue Context Providers](https://docs.continue.dev/customize/deep-dives/custom-providers)
- [Continue config.yaml Reference](https://docs.continue.dev/reference)

### 프레임워크
- [LangGraph 0.3 Release](https://blog.langchain.com/langgraph-0-3-release-prebuilt-agents/)
- [LangChain × LangGraph v1.0 Milestones](https://blog.langchain.com/langchain-langgraph-1dot0/)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents)
- [LangChain 2026 Relevance (BSWen)](https://docs.bswen.com/blog/2026-04-16-langchain-relevant-2026/)
- [LlamaIndex Agent Workflows](https://www.llamaindex.ai/workflows)
- [LlamaIndex Workflows 1.0 발표](https://www.llamaindex.ai/blog/announcing-workflows-1-0-a-lightweight-framework-for-agentic-systems)
- [LlamaIndex Newsletter 2026-01-06](https://www.llamaindex.ai/blog/llamaindex-newsletter-2026-01-06)
- [llama-index-workflows PyPI](https://pypi.org/project/llama-index-workflows/)
- [CrewAI 공식](https://crewai.com/)
- [crewAIInc/crewAI GitHub](https://github.com/crewaiinc/crewai)
- [CrewAI Review 2026 (VisionStack)](https://visionstack.visionsparksolutions.com/reviews/crewai/)
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/)
- [microsoft/autogen GitHub](https://github.com/microsoft/autogen)
- [AutoGen 공식 docs](https://microsoft.github.io/autogen/stable//index.html)
- [Pydantic AI 공식](https://ai.pydantic.dev/)
- [pydantic/pydantic-ai GitHub](https://github.com/pydantic/pydantic-ai)
- [Pydantic AI 2026 비교 (DecisionCrafters)](https://www.decisioncrafters.com/pydantic-ai-type-safe-ai-agent-framework-with-16-5k-github-stars/)
- [Python AI Agent Library Comparison 2026](https://jangwook.net/en/blog/en/python-ai-agent-library-comparison-2026/)

### Hugging Face
- [HF Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction)
- [smolagents Introduction (HF)](https://huggingface.co/learn/agents-course/unit2/smolagents/introduction)
- [agents-course HF 조직](https://huggingface.co/agents-course)
- [HF ml-intern 2026-04 릴리즈 (MarkTechPost)](https://www.marktechpost.com/2026/04/21/hugging-face-releases-ml-intern-an-open-source-ai-agent-that-automates-the-llm-post-training-workflow/)

### GitHub 트렌딩 & 커뮤니티
- [Top AI GitHub Repositories in 2026 (ByteByteGo)](https://blog.bytebytego.com/p/top-ai-github-repositories-in-2026)
- [Top 20 AI Agents GitHub Repos 2026 (Fungies)](https://fungies.io/top-github-repositories-ai-agent-frameworks-2026/)
- [awesome-ai-agents-2026](https://github.com/caramaschiHG/awesome-ai-agents-2026)
- [AI Open Source Trends 2026-04-19 (agents-radar)](https://github.com/duanyytop/agents-radar/issues/652)
- [Agentic Shift April 2026 (Epsilla)](https://www.epsilla.com/blogs/ai-agents-ecosystem-update-april-2026)
- [HN — Agentic Frameworks 2026](https://news.ycombinator.com/item?id=46509130)
- [HN — Building Effective AI Agents](https://news.ycombinator.com/item?id=44301809)
- [Deterministic + Agentic AI (TheHackerNews)](https://thehackernews.com/2026/04/deterministic-agentic-ai-architecture.html)

### Simon Willison
- [Headless everything for personal AI (2026-04-19)](https://simonwillison.net/2026/Apr/19/headless-everything/)
- [Simon Willison MCP 태그](https://simonwillison.net/tags/model-context-protocol/)
- [The Lethal Trifecta (2025-06)](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)
- [Supabase MCP 유출 사건](https://simonwillison.net/2025/Jul/6/supabase-mcp-lethal-trifecta/)
- [Code Execution with MCP (2025-11)](https://simonwillison.net/2025/Nov/4/code-execution-with-mcp/)

### 중국 모델 (C 트랙 상세)
- [Kimi K2.6 공식 테크 블로그](https://www.kimi.com/blog/kimi-k2-6)
- [AINews — Kimi K2.6 (Latent Space)](https://www.latent.space/p/ainews-moonshot-kimi-k26-the-worlds)
- [Best Chinese LLMs 2026 (BenchLM)](https://benchlm.ai/blog/posts/best-chinese-llm)
- [Best AI Models April 2026 (BuildFastWithAI)](https://www.buildfastwithai.com/blogs/best-ai-models-april-2026)
- [Founder's Open-Model Stack (Agent Native)](https://agentnativedev.medium.com/founders-open-model-stack-ocr-code-reasoning-write-images-0029969ef069)

---

## ⚠️ 공식 문서 미확인 항목

1. **OpenClaw 210k+ stars** — 외부 기사 다수 등장이나 공식 GitHub 레포 URL·라이선스·오너 미확인. 후속 조사 시 레포 식별 후 재검증 필요.
2. **A2A v1.2 cryptographic signing** — 외부 분석 기사(Stellagent)에서 상세 기술. 공식 spec repo에서 버전 태그 및 CHANGELOG 직접 확인은 미실시.
3. **MCP 클라이언트 지원 매트릭스** — Claude Code/Cursor/Cline/VSCode/Continue/Windsurf/OpenAI/Google ADK 지원은 공식+커뮤니티 다수 자료에서 확인되나 각 클라이언트별 지원 기능(Prompts/Resources/Elicitation 등) 공식 매트릭스는 벤더 개별 문서 확인 필요.
4. **CrewAI Flows 일 12M executions** — 회사 공식 사이트 주장. 독립 검증 미실시.
5. **Kimi K2.6 4000+ tool call · 12시간 런** — C 트랙 상세 검증 범위. 본 문서는 Moonshot·Latent Space 보도 인용.

---

## 후속 제안

- **INTEGRATION_PLAN**: 본 리서치 기반으로 MONK OS의 **MCP Server 래핑 범위**(portal·studio·idphoto-kr/jp) + **A2A Agent Card 발행 스펙**을 설계하는 후속 지시서 기안 권장.
- **Rules 포맷 업그레이드**: `.claude/rules/*.md` → Cursor `.mdc` frontmatter 스타일 자동 스코프로 마이그레이션 실험. 토큰 절감 + 정책 적용 명확도 확인.
- **Skills 체계 도입**: Windsurf `.agents/skills/` 채택이 Anthropic 외 첫 공식 사례 — MONK 스킬 자산을 Windsurf·VSCode MCP 양쪽으로 포팅 가능한 공통 포맷으로 정리.
