---
type: REPORT
date: 2026-03-25
from: iMac/막내1
to: iMac/쌍아
subject: Anthropic 컨텍스트 레이어 공식 문서 리서치
related: governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md
---

# REPORT — Anthropic 컨텍스트 레이어 공식 문서 리서치

**[2026-03-25 14:10 KST] iMac/막내1 → iMac/쌍아**

---

## 1. CLAUDE.md 계층 구조

### 1-1. 로딩 계층 (우선순위 높→낮)

| 계층 | 위치 | 공유 | 제외 가능 |
|------|------|------|----------|
| **Managed Policy** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` | 조직 전체 | ❌ 불가 |
| **Project** | `./CLAUDE.md` 또는 `./.claude/CLAUDE.md` | Git 공유 | ⭕ `claudeMdExcludes` |
| **User** | `~/.claude/CLAUDE.md` | 개인 전용 | ⭕ `claudeMdExcludes` |

> 출처: [Claude Code Memory - 공식 문서](https://code.claude.com/docs/en/memory.md)

### 1-2. 로딩 메커니즘 (2가지 전략)

**상위 디렉토리 (CWD 기준 위):**
- 디렉토리 트리를 타고 올라가며 모든 CLAUDE.md를 **세션 시작 시 전량 로딩**
- 공식 문서: *"CLAUDE.md files in the directory hierarchy above the working directory are loaded in full at launch."*

**하위 디렉토리 (CWD 기준 아래):**
- 세션 시작 시 **로딩하지 않음**
- Claude가 해당 디렉토리의 파일을 읽을 때 **온디맨드 로딩**
- 공식 문서: *"CLAUDE.md files in subdirectories load on demand when Claude reads files in those subdirectories."*

**추가 디렉토리 (`--add-dir`):**
- 기본적으로 CLAUDE.md 미로딩
- `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` 환경변수로 활성화

> 출처: [Claude Code Memory](https://code.claude.com/docs/en/memory.md)

### 1-3. 주입 방식 — 핵심 발견

**CLAUDE.md는 system prompt에 주입되지 않는다.** User message 컨텍스트로 전달된다.

공식 문서 인용:
> *"CLAUDE.md content is delivered as a user message after the system prompt, not as part of the system prompt itself. Claude reads it and tries to follow it, but there's no guarantee of strict compliance, especially for vague or conflicting instructions."*

- `<system-reminder>` XML 태그 형태로 대화 메시지에 부착
- "OVERRIDE any default behavior" 라벨 포함
- **행동 가이드**이지 **강제 집행**이 아님 — 강제 집행은 `settings.json` 역할

> 출처: [Claude Code Memory](https://code.claude.com/docs/en/memory.md), [Claude Code Settings](https://code.claude.com/docs/en/settings.md)

### 1-4. 권장 사항

- **파일당 200줄 이하 유지** — 길수록 컨텍스트 소비 증가, 준수율 하락
- 초과 시 `.claude/rules/` 디렉토리로 분리 (YAML frontmatter `paths:` 필드로 경로별 조건부 로딩)
- `@path` 임포트 문법으로 외부 파일 참조 가능

---

## 2. MEMORY.md 구조

### 2-1. 자동 로딩 조건

- 위치: `~/.claude/projects/<project>/memory/MEMORY.md`
- **첫 200줄**만 매 세션 시작 시 자동 로딩
- 200줄 초과 내용은 디스크에 존재하되 자동 로딩 대상 아님
- Claude Code v2.1.59+ 기본 활성화

> 출처: [Claude Code Memory](https://code.claude.com/docs/en/memory.md#how-it-works)

### 2-2. 200줄 캡 — 공식 설계

| 항목 | CLAUDE.md | MEMORY.md |
|------|-----------|-----------|
| 줄 제한 | 없음 (200줄 권장) | **200줄 강제** (초과분 미로딩) |
| 로딩 방식 | 전량 로딩 | 첫 200줄만 |
| 작성 주체 | 사용자 | Claude (자동) |
| 공유 | Git 공유 가능 | 머신 로컬 |

### 2-3. memory/ 디렉토리 구조

```
~/.claude/projects/<project>/memory/
├── MEMORY.md              # 인덱스 파일 (첫 200줄 자동 로딩)
├── debugging.md           # 토픽 파일 (온디맨드 로딩)
├── api-conventions.md     # 토픽 파일 (온디맨드 로딩)
└── [기타 토픽 파일]
```

- 동일 Git 레포의 모든 worktree가 하나의 memory 디렉토리 공유
- **머신 로컬** — 디바이스 간 동기화 안 됨

### 2-4. Frontmatter 스키마

**Auto memory 파일에는 YAML frontmatter 불필요** — 순수 Markdown

- Frontmatter는 `.claude/rules/` 파일에서 사용 (path-scoping용)
- Auto memory 토픽 파일은 비구조화 Markdown

### 2-5. 메모리 유형

| 유형 | 설명 | 작성 주체 | 로딩 |
|------|------|-----------|------|
| MEMORY.md (인덱스) | 200줄 요약 | Claude 자동 | 세션 시작 |
| 토픽 파일 | 상세 노트 | Claude 자동 | 온디맨드 |
| CLAUDE.md | 명시적 지시 | 사용자 | 세션 시작 (전량) |
| .claude/rules/ | 경로별 규칙 | 사용자 | 조건부 |

**Claude가 자동 저장하는 내용:** 빌드 명령, 디버깅 인사이트, 아키텍처 노트, 코드 스타일, 워크플로우 습관

### 2-6. 메모리 관리

- `/memory` 명령으로 로딩된 파일 확인, 토글, 편집 가능
- `/init` 명령으로 초기 CLAUDE.md 자동 생성
- `autoMemoryEnabled: false` 또는 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`로 비활성화

> 출처: [Claude Code Memory](https://code.claude.com/docs/en/memory.md)

---

## 3. System Prompt 계층

### 3-1. System Prompt 구성 요소

Claude Code의 시스템 프롬프트는 **단일 문자열이 아닌 110+ 조건부 모듈의 동적 조합**:

1. **Core system prompt** — "You are Claude Code, Anthropic's official CLI for Claude"
2. **Tool definitions** — 18개 빌트인 도구 (Write, Edit, Read, Bash, Glob, Grep 등)
3. **Sub-agent prompts** — Explore, Plan, Task 등 전문 에이전트 지시
4. **System reminders** — `<system-reminder>` 태그 (~40개)
5. **Behavioral guidelines** — 작업 실행, 도구 사용 정책, 메모리 관리

> 출처: [Piebald AI - Claude Code System Prompts](https://github.com/Piebald-AI/claude-code-system-prompts)

### 3-2. 컨텍스트 주입 순서 (상→하)

| 순서 | 레이어 | 지속성 |
|------|--------|--------|
| 1 | **System prompt base** — 코어 지시, 도구 정의, 역할 | 항상 유지 |
| 2 | **Managed CLAUDE.md** — 조직 전체 정책 | 항상 유지 |
| 3 | **Project CLAUDE.md** — 팀 공유 지시 | 항상 유지 |
| 4 | **Directory rules** — `.claude/rules/*.md` | 조건부 |
| 5 | **User CLAUDE.md** — 개인 선호 | 항상 유지 |
| 6 | **Auto Memory** — MEMORY.md 첫 200줄 | 항상 유지 |
| 7 | **Session injections** — `--append-system-prompt`, 출력 스타일 | 세션 한정 |
| 8 | **Imported files** — `@path` 참조 | 요청 시 |
| 9 | **Conversation history** — 사용자 메시지, 이전 턴 | 컴팩팅 대상 |
| 10 | **Tool results** — Bash 출력, 파일 읽기 결과 | 컴팩팅 대상 |
| 11 | **System-reminder tags** — 런타임 주입 XML 태그 | 메시지별 |

### 3-3. 충돌 시 우선순위 (높→낮)

1. **CLI 플래그** — `--append-system-prompt`, `--system-prompt`
2. **System-reminder 태그** — "OVERRIDE any default behavior" 라벨
3. **Project CLAUDE.md** — 구체적 프로젝트 규칙
4. **Directory rules** — 경로 스코프 규칙
5. **User CLAUDE.md** — 개인 선호
6. **Auto memory** — 머신 로컬 학습
7. **Built-in system prompt** — Anthropic 기본 지시

**핵심 구분:**
- `settings.json` permissions = **강제 집행** (클라이언트가 차단)
- `CLAUDE.md` = **행동 가이드** (Claude가 읽고 따르려 하지만 보장 없음)

> 출처: [Claude Code Memory](https://code.claude.com/docs/en/memory.md), [Claude Code Settings](https://code.claude.com/docs/en/settings.md)

---

## 4. 컨텍스트 윈도우 관리

### 4-1. 자동 컴팩팅 메커니즘

**트리거 조건:**
- 컨텍스트 용량 **~95%** 도달 시 자동 발동 (잔여 ~25%)
- `/compact` 명령으로 수동 발동 가능

**압축 전략 (3단계):**
1. **1단계:** Tool output 트리밍 (긴 결과물 축약)
2. **2단계:** 오래된 메시지 요약 (초기 대화 턴 압축)
3. **3단계:** 필요 시 추가 요약

**압축 특성:**
- 즉시적이고 **비가역적(lossy)** — 오래된 교환은 요약으로 대체
- `/compact focus on [주제]` 로 특정 영역 집중 보존 가능
- `/context` 명령으로 현재 사용량 확인

> 출처: [Claude Code: How Claude Code Works](https://code.claude.com/docs/en/how-claude-code-works.md)

### 4-2. CLAUDE.md / MEMORY.md의 컴팩팅 내성

**CLAUDE.md — 컴팩팅에서 완전 보호:**
- `/compact` 후 디스크에서 다시 읽어 **fresh re-injection**
- 컴팩팅/요약 대상에 포함되지 않음
- 공식 문서: *"After /compact, Claude re-reads your CLAUDE.md from disk and re-injects it fresh"*

**MEMORY.md — 보호:**
- MEMORY.md 첫 200줄은 세션 시작 시 로딩 후 유지
- 컴팩팅 이후에도 memory 파일 읽기/쓰기 지속

**대화 내역 — 컴팩팅 대상:**
- 사용자 메시지, 도구 결과 등은 요약 대상
- 초기 대화의 상세 지시는 손실 가능

### 4-3. 컨텍스트 윈도우 크기

- Opus 4.6: **200K 토큰** 컨텍스트
- 실효 윈도우는 system prompt + CLAUDE.md + MEMORY.md + MCP + 대화 내역이 공유하므로 실질적으로 더 작음
- 공식 문서: *"Claude's context window holds your conversation history, file contents, command outputs, CLAUDE.md, auto memory, loaded skills, and system instructions."*

### 4-4. 장기 세션 관리 권장

- **CLAUDE.md에 영구 규칙 배치** — 대화 내역 의존 금지
- 70% 용량 시점에서 **수동 `/compact`** 권장 (95% 자동보다 안전)
- `PostCompact` 훅으로 컴팩팅 후 주요 컨텍스트 재주입 가능
- `PreCompact` 훅으로 컴팩팅 전 중요 정보 저장 가능

> 출처: [Anthropic API - Compaction](https://platform.claude.com/docs/en/build-with-claude/compaction), [Claude Code Memory](https://code.claude.com/docs/en/memory.md)

---

## 5. settings.json / .claude/ 디렉토리

### 5-1. settings.json 계층 (5단계)

| 순위 | 스코프 | 위치 | 공유 |
|------|--------|------|------|
| 1 (최고) | **Managed** | `/Library/Application Support/ClaudeCode/` | 조직 IT |
| 2 | **CLI 인수** | `--append-system-prompt` 등 | 세션 한정 |
| 3 | **Local Project** | `.claude/settings.local.json` | ❌ gitignored |
| 4 | **Shared Project** | `.claude/settings.json` | ⭕ Git |
| 5 (최저) | **User** | `~/.claude/settings.json` | ❌ 개인 |

**우선순위:** Managed > CLI > Local > Shared > User

> 출처: [Claude Code Settings](https://code.claude.com/docs/en/settings.md#configuration-scopes)

### 5-2. .claude/ 디렉토리 구조

**프로젝트 레벨:**
```
.claude/
├── settings.json           # 팀 공유 설정 (Git 커밋)
├── settings.local.json     # 개인 오버라이드 (gitignored)
├── CLAUDE.md               # 프로젝트 지시 (./CLAUDE.md와 동등)
├── rules/                  # 경로별 규칙 파일
│   ├── code-style.md
│   ├── testing.md
│   └── security.md
├── agents/                 # 커스텀 서브에이전트
├── hooks/                  # 훅 스크립트
├── launch.json             # VSCode 연동 (자동 생성)
├── worktrees/              # Worktree 상태 추적
└── .mcp.json               # MCP 서버 설정
```

**사용자 레벨:**
```
~/.claude/
├── settings.json           # 전역 개인 설정
├── CLAUDE.md               # 전역 개인 지시
├── rules/                  # 전역 개인 규칙
├── agents/                 # 전역 서브에이전트
├── keybindings.json        # 키보드 단축키
└── projects/               # 프로젝트별 auto memory
    └── <project-id>/
        └── memory/
            ├── MEMORY.md
            └── [토픽 파일들]
```

### 5-3. Hooks 시스템

**22개 이벤트 지원:**

| 라이프사이클 | 이벤트 |
|-------------|--------|
| 세션 | `SessionStart`, `SessionEnd` |
| 지시 | `InstructionsLoaded` |
| 프롬프트 | `UserPromptSubmit` |
| 도구 | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` |
| 서브에이전트 | `SubagentStart`, `SubagentStop` |
| 완료 | `Stop`, `StopFailure`, `TaskCompleted` |
| 컴팩팅 | `PreCompact`, `PostCompact` |
| 설정 | `ConfigChange` |
| Worktree | `WorktreeCreate`, `WorktreeRemove` |
| MCP | `Elicitation`, `ElicitationResult` |
| 기타 | `Notification`, `TeammateIdle` |

**훅 유형 4가지:**

| 유형 | 설명 |
|------|------|
| `command` | 셸 스크립트 실행 |
| `http` | HTTP POST 엔드포인트 |
| `prompt` | Claude 단일턴 평가 |
| `agent` | 서브에이전트 검증 |

**훅 설정 위치:** `settings.json`의 `hooks` 키

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/validate.sh"
          }
        ]
      }
    ]
  }
}
```

> 출처: [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide.md), [Hooks Reference](https://code.claude.com/docs/en/hooks.md)

### 5-4. settings.json vs CLAUDE.md 역할 분담

| 관점 | settings.json | CLAUDE.md |
|------|--------------|-----------|
| **성격** | 기술적 제어 (강제) | 행동 가이드 (권고) |
| **집행** | 클라이언트가 차단 | Claude가 읽고 따름 (보장 없음) |
| **용도** | 권한, 샌드박스, 환경변수, 훅, 모델 | 코딩 표준, 워크플로우, 아키텍처, 컨벤션 |
| **변경** | JSON 편집 | Markdown 편집 |

---

## 6. 5축 재편을 위한 핵심 시사점

### 6-1. Anthropic 설계 철학과 MONK 헌법 매핑

| Anthropic 레이어 | MONK 대응 | 현행 |
|-----------------|-----------|------|
| Managed Policy CLAUDE.md | **헌법** (불변 원칙) | CLAUDE.md 내 제1-7조 |
| Project CLAUDE.md | **법률** (운용 규칙) | 법률 인덱스 ch1-ch8 |
| .claude/rules/ | **규정** (기술 상세) | MEMORY.md + ops/tech/ |
| settings.json | **권한/집행** | 미분리 |
| Auto Memory (MEMORY.md) | **디바이스 행동강령** | MEMORY.md |

### 6-2. 구조적 발견

1. **CLAUDE.md는 강제 집행이 아닌 행동 가이드** — 헌법 위반 방지를 위한 기술적 강제는 `settings.json` `permissions.deny`로 분리 필요
2. **200줄 권장** — 현재 CLAUDE.md가 200줄을 초과할 경우 `.claude/rules/`로 분리 권장
3. **컴팩팅 내성** — CLAUDE.md/MEMORY.md는 보호되지만 대화 내 지시는 손실됨 → 영구 규칙은 반드시 파일에
4. **계층 정렬** — Managed > Project > User > Auto Memory 순서가 헌법 > 법률 > 규정 위계와 자연스럽게 매핑

---

## 출처 목록

| # | 문서 | URL |
|---|------|-----|
| 1 | Claude Code Memory (공식) | https://code.claude.com/docs/en/memory.md |
| 2 | Claude Code Settings (공식) | https://code.claude.com/docs/en/settings.md |
| 3 | Claude Code Hooks Guide (공식) | https://code.claude.com/docs/en/hooks-guide.md |
| 4 | Claude Code Hooks Reference (공식) | https://code.claude.com/docs/en/hooks.md |
| 5 | Claude Code How It Works (공식) | https://code.claude.com/docs/en/how-claude-code-works.md |
| 6 | Claude Code Best Practices (공식) | https://code.claude.com/docs/en/best-practices.md |
| 7 | Claude Code Sub-agents (공식) | https://code.claude.com/docs/en/sub-agents.md |
| 8 | Anthropic API Compaction (공식) | https://platform.claude.com/docs/en/build-with-claude/compaction |
| 9 | Anthropic Prompting Best Practices | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| 10 | Claude Code System Prompts (Piebald AI) | https://github.com/Piebald-AI/claude-code-system-prompts |
| 11 | GitHub anthropics/claude-code | https://github.com/anthropics/claude-code |
| 12 | Claude Code Permissions (공식) | https://code.claude.com/docs/en/permissions.md |
