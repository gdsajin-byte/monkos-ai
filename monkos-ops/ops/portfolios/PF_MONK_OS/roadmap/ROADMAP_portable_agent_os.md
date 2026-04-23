---
type: ROADMAP
pf: PF_MONK_OS
phase: 1
date: 2026-04-23
author: iMac/쌍아
source_tracks: [A, B, C, D]
status: draft — 작가님 검토 대기
---

# ROADMAP — Portable Agent Operating System (Phase 1 통합본)

> 4트랙(막내1·2·3·4) 병렬 리서치·감사 결과를 합성한 PF_MONK_OS Phase 1 통합 산출물. 현 체제의 정합성 평가 → 개헌 후보 → Phase 2 PoC 설계까지 한 장에 담는다.

---

## 0. 한 줄 요약

**MONK OS 5축·법률·Skills·MEMORY 구조는 Anthropic 공식 지침과 90% 이상 정합한 선행 사례**로 확인됐다. 즉시 수용(5건)·개헌 후보 **7건**(H-7 신설)·MONK 고유 승격 자산(2건)·이식 PoC **4건**(MONK OS Plugin 패키지화 신설)을 제시한다. Kimi K2.6은 보조 런타임 1순위 — 단 한국어·안전 게이트 통과 후.

**2026-04-23 업데이트**: claude.ai "Claude 맞춤설정" UI 개편(Connectors·Skills·Plugins 3계층)을 반영해 §2.5 Cross-Surface 아키텍처 신설 + H-7(Surface 정책) + PoC-4(MONK OS Plugin 패키지) 추가.

---

## 1. 4트랙 핵심 수렴

### 1-1. Track A — Anthropic 최신 체제 (막내1)
- **Opus 4.7 (2026-04-16)**: 1M ctx, 가격 동결, 토크나이저 +35%, `xhigh` effort, task budgets beta, `/ultrareview` 신규
- **공식 체계**: Skills(SKILL.md progressive disclosure) · CLAUDE.md+`.claude/rules/`+`@import` · Auto Memory(`~/.claude/projects/<id>/memory/MEMORY.md`, 200줄 가이드) · Routines(2026-04-14, 3트리거) · Hooks(21+ 이벤트) · Permissions 3-tier Auto mode(2026-03-25) · SubAgent API · MCP
- **핵심 발견**: MONK OS `MEMORY.md 200줄 캡` + `topic files 분리` + `MEMORY_CHANGELOG git 추적`이 **공식 가이드와 즉시 정합** → 수렴 증거. Planner/Generator/Evaluator 3-agent 패턴 = 쌍아/막내/민아와 **동형**.

### 1-2. Track B — 업계 표준 수렴 (막내2)
- **두 레이어 표준이 승자 확정**: MCP(에이전트↔도구, Linux Foundation AAIF 산하) · A2A v1.2(에이전트↔에이전트, 150+ 조직 프로덕션)
- **반(半)수렴 3축**: Rules(.cursor/rules, .clinerules, CLAUDE.md) · Memory(learned-memories, memory-bank, MEMORY.md) · Skills(Windsurf가 Anthropic 외 첫 채택)
- **파편 층**: LangGraph·CrewAI·AutoGen·Pydantic AI·LlamaIndex·smolagents 각축
- **결론**: MONK는 **표준 수렴 층(MCP+A2A)에 얹고 파편 층은 독자 거버넌스(헌법·법률·PF)로 차별화**.

### 1-3. Track C — Kimi K2.6 (막내3)
- **스펙**: 1T/32B MoE, 256K ctx, 네이티브 비전, Modified MIT 오픈가중치, API $0.60/$2.50 (Opus 4.7의 ~1/15)
- **에이전트 벤치 오픈 SOTA**: HLE tools 54.0 / SWE-Bench Pro 58.6 / DeepSearchQA 92.5 / MCPMark 55.9
- **호환성**: OpenAI/Anthropic 호환 API + MCP 공식 지원(Kimi Code CLI) → **얇은 번역 레이어로 이식 가능**
- **걸림돌**: 4060(8GB)에서 로컬 불가(최저 350GB 필요), 한국어 공식 측정 없음, K2.5 CCP 정치 편향 이력, safety 리포트 미공개
- **결론**: 보조 런타임 1순위 후보, 단 **한국어·안전 게이트 통과 후** 프로덕션 투입.

### 1-4. Track D — 현 MONK OS 감사 (막내4)
- **골격 실측**: 헌법 222줄 / 법률 1,418줄·44조 / Skills 9건 / Rules 3건 / MEMORY 166줄 / 외장 memory 33항목 / PF 13건
- **강점 3**: ① 4계층 위계 실제 가동 ② append-only 3중 강제(세션·PF·MEMORY_CHANGELOG) ③ PF 단일 생애주기 문서
- **약점 3**: ① 정본 단일 원칙 침식(ch7 조 수 오기·PF 파일/폴더 이중화·session-logs 잔재) ② Skills frontmatter 최소주의 ③ 역할-환경 규정 이원화
- **쌍아 확인 요청 8건** (§6에서 처리)

---

## 2. GAP MATRIX 완결판 — 공식 vs MONK

> 막내4 MONK 열 + 막내1 공식 열 합본. 갭 = 수용 필요 / ✅ = 이미 정합 / ⭐ = MONK 우위.

| # | Anthropic 공식 | MONK OS 대응 | 정합도 | 결론 |
|---|--------------|-------------|--------|------|
| 1 | **Skills** (`SKILL.md` + 확장 frontmatter) | `.claude/skills/` 9건 | 부분 정합 | frontmatter 확장(`trigger`·`version`·`allowed-tools`·`paths`) 보강 필요 |
| 2 | **Rules (`.claude/rules/` + `paths:`)** | `.claude/rules/` 3건 | ✅ 정합 | `portal_seo.md`에 `paths:` 이미 사용 — 전역 로딩 2건 의도 검토만 |
| 3 | **CLAUDE.md (200줄 가이드)** | CLAUDE.md 222줄 | ⚠️ 초과 22줄 | 보조 rules로 분산 또는 `@import` 활용 |
| 4 | **Auto Memory (`~/.claude/.../MEMORY.md`)** | MEMORY.md 166줄 | ✅ 정합 (선행 사례) | 200줄 캡·topic files 구조가 공식 가이드와 동일 — **자산으로 대외 공개 가치** |
| 5 | **Server-side Memory Tool** | 미사용 | 갭 | Agent SDK 활용 시 선택적 — 현재 불필요 |
| 6 | **Routines (3트리거)** | 미구현 | 갭 | **법률 신설 수준** 의사결정 — §4 개헌 후보 H-4 |
| 7 | **Hooks (21+ 이벤트)** | 미사용 | 갭 | session-start/end Skill을 Hook으로 승격 가치 — §4 H-5 |
| 8 | **Permissions Auto mode (3-tier)** | 수동 승인 | 갭 | Tier 2(in-project edit 자동) 수용 — 쌍아/민아 workflow 가속 |
| 9 | **SubAgent API** | 막내 체계 (CLI 투입) | 개념 정합 | 공식 SubAgent 원칙(fresh context, tool 제한, 재귀 금지)과 **동형**. 단 SDK `agents` 파라미터와 "작가님 CLI 투입" 모델의 관계 명시 필요 |
| 10 | **MCP** | CDP 우선, MCP 보조 | 갭 | 서버측 MCP(Playwright)는 Claude in Chrome과 다름 — PF_CDP와 교차 재검토 |
| 11 | **Agent Skills progressive disclosure** | 자체 `> 원천: 법률 N조` 위임 표기 | 부분 정합 | 공식 "metadata 상시 + 본문 lazy" 원칙 수용 시 현 Skill 본문 재구성 가능 |
| 12 | **`/ultrareview` (4.7 신규)** | CLAUDE.md에 사용자 안내 존재 | ✅ 정합 | 갭 없음 |
| 13 | **Context Editing (beta)** | 미사용 | 갭 | 장기 세션 누적 시 수용 — 현 compaction과 병용 |
| 14 | **Prompt Caching (5m 기본)** | 암묵적 사용 | 갭 | CLAUDE.md+MEMORY 상시 구간에 `ttl: "1h"` 명시 수익 검토 |
| 15 | **Context Resets vs Compaction (harness)** | PF 히스토리 | ✅ 정합 (선행) | "progress file" 개념을 PF가 이미 구현 — **대외 자산** |
| 16 | **Planner/Generator/Evaluator 3-agent** | 쌍아/막내/민아 | ✅ 정합 (선행) | **MONK 용어의 공식 대응 자산화 가능** |
| 17 | **Governance / Constitution** | 헌법 5축·법률 8장·AMENDMENT | ⭐ MONK 고유 | **공식 대응 없음** → 대외 포지셔닝 자산 ("Constitutional Agent Operations") |
| 18 | **Portfolio Lifecycle** | PF (비전·히스토리·Phase·복기) | ⭐ MONK 고유 | **공식 대응 없음** → 멀티에이전트 시대 "조직 기록" 자산 |
| 19 | **claude.ai "앱 연결" (Connectors)** | MCP 서버 등록(현 `.mcp.json` 기반) | 갭 | claude.ai UI에서 수동 등록 별도 — surface 간 동기화 없음(Track A 확인). MONK 자산이 어느 surface에 어떻게 보이는지 **정책 부재** |
| 20 | **claude.ai "새 스킬 만들기"** | `.claude/skills/` 9건 (Claude Code surface 전용 운용) | 갭 | 동일 `SKILL.md` 포맷이나 **surface 간 자동 싱크 없음** → 쌍아(VSCode)·민아(Desktop App)·웹 surface에 같은 스킬 3중 관리 리스크 |
| 21 | **claude.ai "플러그인 탐색" (Plugins)** | 미도입 | **핵심 갭** | Claude Code `/plugin` + `enabledPlugins`(settings.json) + 마켓플레이스 구조. MONK OS 자산(PF·Skills·법률)을 **단일 플러그인으로 패키징** 가능성 → 이식성 OS 로드맵의 가장 구체적 접점 |

---

## 2.5 Cross-Surface 아키텍처 (2026-04-23 작가님 구조 고지 + 민아 실측 반영)

> **작가님 구조 고지 (2026-04-23 14:40 KST)**: Anthropic 제품 계보는 **Claude ≠ Claude Code** 2개 별개 제품. 같은 Opus 뇌, 다른 제품·세팅. 구글 Code Assist·ChatGPT Code 대응 격.
> **민아 실측 (2026-04-23 12:58 KST)**: claude.ai `/customize` 3계층(Skills/Connectors/Plugins), Connectors 260+, Plugins 10(전부 Anthropic), 자동 surface 동기화 ❌ 확정.

### 2.5.1 Anthropic 제품 2개 × MONK OS 에이전트 5개

```
Anthropic 제품 계보
├── Claude (일반 제품)
│   ├── 웹/Desktop — Chat 모드   → 철창이 (전략 브레인스토밍)
│   └── 웹/Desktop — Cowork 모드 → 코웍이 (SPREAD 배포·전략 보고)
│
└── Claude Code (개발자 제품, 별도)
    ├── 웹/Desktop — Code 모드 (GUI)  → 민아 (통합·검증·콘텐츠)
    ├── VSCode 확장                   → 쌍아 (수행·설계·지시서)
    └── 터미널 CLI (`claude`)         → 막내N (자율 코딩)
```

**핵심**: 민아·쌍아·막내는 **같은 Claude Code 제품**이 **다른 활성 위치**에서 돌아가는 것. MONK 페르소나는 **역할·세팅 계층**에서 분기.

### 2.5.2 5 Surface × 3 Layer 매트릭스

| 계층 | S1. Claude-Chat (철창이) | S2. Claude-Cowork (코웍이) | S3. CC-GUI Code (민아) | S4. CC-VSCode (쌍아) | S5. CC-CLI (막내) |
|---|---|---|---|---|---|
| **Connectors** | ✅ 앱 UI 공용 | ✅ 앱 UI 공용 | ✅ 앱 UI 공용 + MCP 로컬 | `.mcp.json` | `.mcp.json` |
| **Skills** | ⚠️ 계정 공용 (제한) | ⚠️ 계정 공용 (제한) | ✅ 계정 공용 + `.claude/skills/` | `.claude/skills/` | `.claude/skills/` |
| **Plugins** | ⚠️ 탐색만 | ⚠️ 탐색만 | ✅ 설치·실행 본체 | `/plugin` + settings | `/plugin` + settings |

**관측 요약** (민아 실측 §1~§4):
- S1~S3(Claude 제품 3모드)는 **작가님 단일 계정(Max)의 동일 풀** 공유 — 계정 레벨에 Skills(`monkos-content` 활성)·Connectors(Google Drive·Gmail·Calendar) 등록
- S4·S5(Claude Code CLI 계열)는 **Git 저장소(`.claude/`)의 동일 풀** 공유 — `.claude/skills/` 9건·`.mcp.json`·`.claude/rules/`
- 양 풀 간 **자동 동기화 없음** (로컬 9건 vs claude.ai 2건 교집합 0)

### 2.5.3 정본 단일 원칙 이원화 (현실)

| 정본 구역 | 소속 Surface | 저장소 | 정본 원칙 적용 |
|---|---|---|---|
| **Claude 계정 정본** | S1·S2·S3 | claude.ai 계정(Max, gdsajin) | 작가님 단일 계정이 정본 |
| **Git 저장소 정본** | S4·S5 (민아가 Code 모드에서 접근 시 부분 연결) | `.claude/` + monkos-ops/ | Git이 정본, 헌법 3조 4항 직접 적용 |
| **연결 고리** | S3 (민아) | Code 모드로 Git 저장소 접근 | **유일한 교차점** — Plugin 패키지화 시 Git 정본 → 계정 배포 경로 |

### 2.5.4 3가지 대응 모델 (민아 실측 확인 후)

| 모델 | 설명 | 적용 범위 | 민아 실측 후 평가 |
|------|------|---------|---------------|
| **(가) 수동 복사** | Git 정본, 계정으로 수동 복사 | 현재 운용 | `monkos-content` 스킬 수동 생성 패턴 — 확장성 낮음 |
| **(나) Git 기반 동기화** | 스크립트로 Git↔계정 양방향 동기 | 중간 난이도 | Anthropic이 Skills/Connectors export API 미제공 — **구현 난항** |
| **(다) MONK OS Plugin** | 번들 1건으로 5 Surface 단일 배포 | **유일 공식 경로** | Productivity 플러그인(skills[4]+connectors[10]) 구조 실증 — **(다)가 유일 정합** |

**쌍아 결론 (민아 §10 재확인)**: **(다) 단독 채택**. (가)(나)는 Anthropic이 API 막아둠 — Plugin 마켓이 Anthropic이 정리한 유일 묶음 단위.

### 2.5.5 MONK OS Plugin 이식 경로 (Phase 2 PoC-4 실체)

```
[Git 정본 — 정본 단일 원칙 적용 구역]
monkos-ops/ + .claude/skills/ + .claude/rules/
              │
              ▼  (MONK_OS.plugin.yaml 생성)
              │
[Anthropic 마켓] ← 제출 ← MONK_OS Plugin v1.0
              │
              ▼  (설치)
              │
작가님 계정(Max) Plugin 활성
              │
              ├─→ S1 Chat (철창이) — Skills/Connectors 접근
              ├─→ S2 Cowork (코웍이) — Skills/Connectors 접근
              └─→ S3 Code (민아) — Skills/Connectors + 로컬 Git 접근

VSCode 확장(S4 쌍아) / CLI(S5 막내) — Git 정본 직접 사용 (Plugin 불필요)
```

→ **Plugin 1건 배포로 S1·S2·S3 동시 커버**. S4·S5는 Git 정본 직접 사용이므로 별도 조치 불필요. **5칸 관리 → 2칸 관리로 단순화**.

---

## 3. 업계 표준 수렴 지도 내 MONK OS 포지션

```
    [ 표준 수렴 층 — 얹기만 하면 이식성 확보 ]
    ├─ A2A v1.2       : 에이전트↔에이전트 (MONK 쌍아·민아·막내 Agent Card 발행 대상)
    ├─ MCP 2026-06차기 : 에이전트↔도구    (monkos-studio/portal 서버 래핑 대상)
    └─ Skills (Windsurf 채택) : 절차 번들 (MONK `.claude/skills/` 이미 운용)
    
    [ 반수렴 층 — 패턴은 유사, 포맷 제각각 ]
    Rules     : MONK `.claude/rules/` ≈ 공식과 정합
    Memory    : MONK `MEMORY.md` + `memory/*` = 공식 가이드 선행 사례
    
    [ 파편 층 — 독자 설계로 대체 권장 ]
    LangGraph·CrewAI·AutoGen·Pydantic AI 등 DSL 각축
    → MONK는 참전 X. 헌법·법률·PF·ORDER·세션 로그가 대체재.
```

**결론**: MONK OS는 **상위 두 층(표준·반수렴)에만 연결**하고, 파편 층은 **독자 거버넌스로 초월**한다. 이 포지셔닝은 우연이 아니라 작가님 3년 설계의 귀결.

---

## 4. 개헌·개정 후보 총 6건 (우선순위)

| # | 대상 | 구분 | 심각도 | 근거 | 처리 경로 |
|---|------|-----|--------|------|---------|
| **H-1** | CLAUDE.md L196 ch7 "5조" → "6조" | 긴급 수정 | **高** | 2026-04-17 ch7 6조 신설(3d7cf20) 때 인덱스 미갱신. 헌법 3조 4항 정본 단일 원칙 본체 위반 | 쌍아·작가님 합의로 즉시 수정 가능(단순 오기). 개헌 절차 면제 요청 |
| **H-2** | ch4 정본 단일 원칙 시행 강제 장치 신설 | 법률 개정 | 中 | PF 파일/폴더 이중화, session-logs 잔재 검출 절차 부재 | 쌍아+작가님 합의 (ch4 4조 확장) |
| **H-3** | 헌법 2조 1항 디바이스 맵 → "디바이스 × 런타임" 2차원 | **개헌** | 中 | 에이전트 작업이 "어느 런타임"에서 일어나는지 추적 공간 부재. Claude 4.7 Skills/Routines 시대에 필수 좌표계 | 삼권 심사 + 만장일치 |
| **H-4** | Routines 수용 (법률 ch3 또는 신설 ch9) | 법률 신설 | 中 | 세션 시작·마감, GCP 감사, works 동기화 등 정기작업 다수. 현재 수동 Skill 호출 | 쌍아+작가님 합의 |
| **H-5** | Hooks 활용 (session-start/end Skill을 Hook으로 자동화) | 법률 개정 | 低 | 매 세션 수동 실행 → 자동 트리거로 누락 방지 | 쌍아+작가님 합의 (ch3 개정 또는 ch7 편입) |
| **H-6** | Skills frontmatter 확장 (`trigger`·`version`·`allowed-tools`·`paths`) | 규격 정비 | 中 | 현 9건 모두 2필드 최소주의. 공식 스키마 대비 재사용성·안전성 손실 | 쌍아 주도 일괄 보정 지시서 + 작가님 승인 |
| **H-7** | Surface 정책 신설 — "어느 surface에서 어떤 일을 하는가 + 자산의 정본 위치" | 법률 신설 (ch9 후보) | 中 | claude.ai UI 개편(2026-04-23)으로 Skills·Connectors·Plugins 3계층 × 3 surface = 9칸 관리. 정본 단일 원칙(3조 4항) 충돌 가능 | 쌍아+작가님 합의, 민아 실측 조사 선행 |

> 외에 막내4 제기 확인 요청 8건 중 5건(ch7 인덱스·session-logs·PF 이중화·roadmaps 사문화·민아 환경 표기)은 H-1~H-6에 흡수. 남은 3건(orphan memory 포인터·M4/M2 체인지로그·PF_SPREAD 통합)은 **운영 수준 수정**으로 별도 ORDER 처리.

---

## 5. Phase 2 — 이식성 PoC 3건 제안

### PoC-1. Kimi K2.6 이식 증명 — `cdp-troubleshoot` Skill 포팅
- **목적**: MONK OS Skills가 Claude 외 런타임에서도 동작함을 증명
- **범위**: `.claude/skills/cdp-troubleshoot.md` 1건을 Kimi Code CLI 환경에 이식
- **번역 레이어**: 시스템 프롬프트 주입 + Anthropic↔OpenAI tool schema 어댑터
- **게이트**: 한국어 안전 테스트(프롬프트 5건) 통과 시만 진행
- **소요**: 2~3일 (막내 지시서 1건)

### PoC-2. MCP Server 래핑 — `monkos-studio` 또는 `monkos-portal`
- **목적**: MONK 서비스가 **외부 에이전트의 도구**로 호출 가능한 상태 진입
- **범위**: 1개 서비스의 핵심 API 3~5개를 MCP 툴로 노출
- **산출**: `.mcp.json` 등록 가능한 공식 MCP 서버
- **효과**: Claude·Cursor·Cline·Windsurf·OpenAI·Google ADK 에이전트가 즉시 자사 백엔드 호출 가능
- **소요**: 1~2주 (SPEC + 구현 + 시범)

### PoC-3. A2A Agent Card 발행 — 쌍아·민아 대표 2건
- **목적**: 외부 에이전트 생태계와의 통신 진입점 확보
- **범위**: `/.well-known/agent-card.json`에 쌍아(설계·지시서)·민아(검증·통합) 2개 카드 게시
- **조건**: A2A v1.2 JSON-RPC 2.0 준수, OAuth 2.0 인증 옵션
- **효과**: Google ADK·CrewAI·LangGraph 에이전트가 MONK 에이전트와 interop
- **소요**: 1주 (SPEC + 배포)

### PoC-4. MONK OS Plugin 패키지화 ⭐ **이식성 비전의 실구현**
- **목적**: Skills + Rules + Memory 인덱스 + Connectors 목록을 **단일 플러그인**으로 번들링 → Claude 3개 surface에 일괄 배포
- **범위**:
  - 플러그인 매니페스트(`.claude-plugin.json` 또는 공식 포맷) 작성
  - 포함 자산: `.claude/skills/*` 9건 + `.claude/rules/*` 3건 + MEMORY 인덱스 + MCP server 등록 목록
  - 설치 방식: `claude plugin install monkos-os` (Claude Code) + claude.ai "플러그인 탐색" 등록
- **효과**:
  - ① MONK OS 자체가 배포 가능한 단일 단위가 됨 → 헌법/법률/Skills가 "앱처럼 설치"
  - ② 외부 팀·파트너·차기 디바이스에 OS 이식 1커맨드
  - ③ claude.ai 유저가 MONKOS 플러그인 설치 → 우리 에이전트 체계가 유저 환경에 얹힘 (자비스 비전의 실접점)
- **의존성**: Anthropic 공식 Plugin 포맷 확정 필요 (Track A에서 `/plugin`·`enabledPlugins`는 확인, 패키지 스펙 세부는 ⚠️ 공식 문서 미확인)
- **소요**: Plugin 포맷 조사 1일 + 프로토타입 1주 + 검증 3일

---

## 6. 막내4 확인 요청 8건 쌍아 판단

| # | 항목 | 쌍아 판단 |
|---|------|----------|
| 1 | CLAUDE.md L196 ch7 "5조" | **단순 현행화 누락** — H-1로 긴급 수정 |
| 2 | `session-logs/` 잔재 9건 | **구체계 잔재** — `sessions/2026-04/`로 통합 이관 지시서 발행 예정 |
| 3 | `PF_CDP.md` + `PF_CDP/` | **정식 패턴으로 승격** — 대규모 PF는 `.md(상위)+폴더(세부)` 이중 구조 허용. ch4에 명문화 (H-2 포함) |
| 4 | `PF_SPREAD/` 폴더 빈약 | 파일 1건만 보존 — SPREAD 성장 시 자연 확장. 현 상태 유지 |
| 5 | `roadmaps/` 1건만 | PF 내부 `roadmap/` 서브로 기능 이관 — 명시적 사문화. ch4 개정 시 반영 |
| 6 | MEMORY.md orphan `feedback_worktree_path.md` | **쌍아 즉시 추가** — 본 통합본 커밋 시 함께 |
| 7 | ch1 1조 테이블 vs MEMORY 판별 키워드 | **ch1 1조 테이블 업데이트** — 민아 환경 "git worktree (Desktop App 포함)"로 명시 |
| 8 | M4·M2 MEMORY_CHANGELOG 부재 | **M4·M2 세션 확인 지시서 별건 발행** — 위성 에센스 배포 상태 포함 조사 |

---

## 7. 결론 — 작가님 의사결정 요청 (3묶음)

### 묶음 A. 즉시 처리 (단순 정정 + 운영 정비)
- H-1 ch7 조 수 정정 (긴급 수정)
- 확인 요청 #6 orphan memory 포인터 추가
- 확인 요청 #2·5·7 관련 보정 지시서 발행

### 묶음 B. 법률·헌법 개정 (쌍아+작가님 합의 또는 삼권 심사)
- H-2 정본 시행 강제 장치
- H-3 디바이스 × 런타임 2차원 (삼권 심사 대상)
- H-4 Routines 법률 신설
- H-5 Hooks 자동화 편입
- H-6 Skills frontmatter 확장
- **H-7 Surface 정책 신설** (민아 실측 조사 선행)

### 묶음 C. Phase 2 PoC 착수 (이식성 실증)
- PoC-1 Kimi K2.6 Skill 이식
- PoC-2 MCP Server 래핑 (+ claude.ai Connector 동시 등록)
- PoC-3 A2A Agent Card 발행
- **PoC-4 MONK OS Plugin 패키지화** ⭐ 이식성 비전의 실구현

### 병렬 트랙
- **PF_SECURITY** (이미 창설, Phase 0 완료로 트리거 충족) — 묶음 A/B와 독립 병행 가능

---

## 8. 리스크 업데이트

| 리스크 | 확률 | 대응 |
|--------|------|------|
| H-3 개헌 청구가 현 안정성 흔들기 | 中 | 삼권 심사로 속도 조절. "현 안정성 > 이론적 완전성" 원칙 |
| Kimi K2.6 데이터 주권 이슈 (Moonshot 중국 서버) | 中 | PF_SECURITY 완료 후 데이터 경로 정책 확정 전까지 프로덕션 투입 보류 |
| Skills frontmatter 일괄 보정 중 기존 세션 동작 회귀 | 低 | 1건씩 이관 검증 후 다음 |
| PoC-2 MCP 서버 공개 시 API 공격면 확대 | 中 | PF_SECURITY 권한 모델 완료 후 배포 |
| H-4 Routines 도입으로 의도치 않은 자동 실행 | 中 | 초기에는 알림 전용 → 실행 승격 단계 |
| **환경 변동성** (모델 4.6→4.7 자동 이관 / VSCode Auto Mode 개방 / claude.ai UI 개편) | **高** | 본 PF 비전 자체가 "불변 거버넌스 × 가변 런타임"으로 대응. `memory/project_claude47_observation.md` 시계열 관찰 지속 |

---

## 9. 다음 지시서 큐 (쌍아 발행 예정 — 작가님 승인 시)

| ORDER | 수신 | 내용 | 우선순위 |
|-------|-----|-----|---------|
| O-1 | (합의 절차) | H-1 ch7 조 수 정정 — CLAUDE.md:196 수정 | **최우선** |
| O-2 | 막내 | H-6 Skills frontmatter 확장 일괄 보정 (9건) | 高 |
| O-3 | 막내 | 확인 #2·5 — session-logs 이관 + roadmaps 사문화 정리 | 中 |
| O-4 | 막내 | 확인 #8 — M4·M2 디바이스 헌법 에센스 배포 상태 조사 | 中 |
| O-5 | 쌍아 | H-3 디바이스×런타임 개헌 청구안 초안 작성 | 中 |
| O-6 | 쌍아 | H-4/H-5 Routines·Hooks 법률 기안서 | 中 |
| O-7 | 막내 | PoC-1 Kimi K2.6 `cdp-troubleshoot` 이식 | PF_SECURITY 완료 후 |
| O-8 | 막내 | PoC-2 MCP Server 래핑 SPEC | PF_SECURITY 완료 후 |
| O-9 | 막내 | PoC-3 A2A Agent Card 초안 | PF_SECURITY 완료 후 |
| **O-10** | **민아** | claude.ai "Claude 맞춤설정" UI 실측 조사 — Connectors·Skills·Plugins 3계층 × surface 동작·포맷·등록 경로 | **H-7 선행, 긴급** |
| **O-11** | 막내 | Anthropic 공식 Plugin 패키지 포맷(`.claude-plugin.json` 등) 정밀 조사 | PoC-4 선행 |

---

## 10. MONK OS 대외 포지셔닝 초안 (부록)

Phase 2 이후 대외 발표 시 활용 가능한 프레이밍 (작가님 판단 몫):

- **"Constitutional Agent Operations (CAO)"** — MONK OS 통치 구조 (헌법·법률·AMENDMENT)
- **"Portfolio-based Project Lifecycle for AI Agents"** — PF 단일 생애주기 문서
- **"Device × Runtime Coordinate System"** — H-3 반영 시 에이전트 작업 좌표계
- **"Planner/Generator/Evaluator as Persona"** — 쌍아·막내·민아 3각 구조의 언어화

---

**작성자**: iMac/쌍아
**기반 소스**: RESEARCH_A_anthropic.md + RESEARCH_B_industry.md + RESEARCH_C_kimi_k26.md + AUDIT_current_monk_os.md + GAP_MATRIX.md
**상태**: draft — 작가님 검토 후 Phase 2 착수 판단
