---
type: REPORT
date: 2026-03-25
from: iMac/막내1
to: iMac/쌍아
subject: 위성 환경 CLAUDE.md 구성 설계 리서치
related:
  - governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_막내1_Anthropic컨텍스트_공식문서리서치.md
---

# REPORT — 위성 환경 CLAUDE.md 구성 설계 리서치

**[2026-03-25 15:33 KST] iMac/막내1 → iMac/쌍아**

---

## A. 위성 레포의 CLAUDE.md 상속 구조

### A-1. 선택지 비교

| 선택지 | 방식 | 장점 | 단점 | Anthropic 공식 지원 |
|--------|------|------|------|-------------------|
| **(a)** 축약본 복사 | 위성 레포 CLAUDE.md에 헌법 핵심 복사 | 독립적, 오프라인 작동 | 본진 개헌 시 수동 동기화 필요. 정본 이원화 위험 | ✅ 표준 사용법 |
| **(b)** 참조 링크만 | `@~/developer/monk_project/CLAUDE.md` 임포트 | 정본 단일 유지 | 절대 경로 디바이스 종속. 첫 로딩 시 승인 필요. 최대 5홉 재귀 제한 | ✅ `@path` 임포트 공식 지원 |
| **(c)** User 레벨 | `~/.claude/CLAUDE.md`에 헌법 핵심 | 전 레포 자동 적용. 설정 불필요 | 디바이스별 별도 배치 필요. 팀원 디바이스 통제 어려움 | ✅ 공식 지원 |
| **(d)** Managed Policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` | 전 레포 강제 적용. 제외 불가 | IT/MDM 배포 필요. 팀원 디바이스 접근 필요 | ✅ 공식 지원 |
| **(e)** symlink rules | `.claude/rules/shared` → 공유 규칙 디렉토리 symlink | Git 추적 가능. 선택적 적용 | symlink 관리 필요 | ✅ 공식 권장 |
| **(f)** --add-dir + 환경변수 | `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | 파일 수정 없이 동적 | 매 실행 시 환경변수/플래그 필요 | ✅ 공식 지원 |

### A-2. 권장안

**MONK 환경에 최적인 조합: (c) User 레벨 + (e) symlink rules**

이유:
1. **User 레벨 `~/.claude/CLAUDE.md`**: 각 디바이스(iMac/M1/M2/M4)에 헌법 핵심 3항(타임스탬프, 파괴적 명령 금지, 수발신 헤더)을 배치. 어떤 레포를 열든 자동 적용.
2. **symlink `.claude/rules/`**: 위성 레포에서 본진 `governance/laws/` 또는 공유 규칙 디렉토리를 symlink. 법률 수준 규칙이 필요한 레포에만 선택 적용.
3. **(d) Managed Policy는 보류**: M4(한송이)는 SSH 미접속이므로 MDM 배포 불가. 향후 Anthropic Admin Console이 나오면 재검토.

### A-3. 위성 레포에 반드시 전달해야 하는 항목

| 헌법 | 항목 | 전달 필요 이유 |
|------|------|--------------|
| 3조(적립) 1항 | 타임스탬프 절대 준수 | 모든 에이전트 활동의 시계열 근간 |
| 4조(구속·윤리) 1항 | 비밀정보 보호 | 어떤 레포에서든 API 키 생성 금지 |
| 4조(구속·윤리) 2항 | 파괴적 명령 금지 | 위성 레포에서도 rm -rf/force push 금지 |
| 2조(통신) 2항 | 수발신 헤더 | 모든 커뮤니케이션의 식별 체계 |
| 1조(정체성) 1항 | 프로젝트 선언 | 작가님 호칭, 브랜드 통일 |
| 4조(구속·윤리) 3항 | 내부 기밀 보호 | 위성 레포에서도 내부 호칭 유출 금지 |

### A-4. 위성 레포에 전달 불필요한 항목

| 헌법 | 항목 | 불필요 이유 |
|------|------|-----------|
| 5조(메타) 1항 | 4계층 문서 위계 | 본진 전용 체계 |
| 3조(적립) 3항 | 문서 규격 (YAML, 네이밍) | 위성 레포는 자체 네이밍 사용 |
| 3조(적립) 4항 | 정본 단일 원칙 | monkos-ops/ 정본은 본진 개념 |
| 법률 인덱스 전체 | ch1~ch8 참조 테이블 | 위성 레포에서 직접 참조 불가 |
| 규정 참조 전체 | CODING_STANDARDS 등 | 본진 경로 의존 |

> 출처: [Claude Code Memory - Choose where to put CLAUDE.md files](https://code.claude.com/docs/en/memory.md), [Share rules across projects with symlinks](https://code.claude.com/docs/en/memory.md#share-rules-across-projects-with-symlinks)

---

## B. M4/M2 디바이스 MEMORY.md 초기 템플릿

### B-1. MEMORY.md 특성 재확인

| 특성 | 상태 |
|------|------|
| 머신 로컬 | ✅ 확인 — 디바이스 간 자동 동기화 없음 |
| 경로 | `~/.claude/projects/<project>/memory/MEMORY.md` |
| 200줄 캡 | ✅ 확인 — 첫 200줄만 세션 시작 시 로딩 |
| 수동 편집 | ✅ 가능 — plain Markdown, 자유 편집 |
| 동기화 방법 | 수동 (rsync, git, 클라우드 동기화) |
| `autoMemoryDirectory` | v2.1.74+ 커스텀 경로 지정 가능 (User settings에서만) |

> 출처: [Claude Code Memory - Storage Location](https://code.claude.com/docs/en/memory.md#storage-location), [GitHub Issue #25739](https://github.com/anthropics/claude-code/issues/25739)

### B-2. 전 디바이스 공통 항목

| 항목 | 내용 |
|------|------|
| 역할 자동 인식 | VSCode → 쌍아, Desktop Claude Code → 민아, CLI → 막내 |
| 팀 인적 인프라 | 한송이(M4), 꾸(M2) 기본 정보 |
| 사업 구조 | monk.kr(본진) → monkos.ai(모바일) |
| 프로젝트 폴더 위상 | 8개 폴더 테이블 |
| 운영 철학 | 에이전트 아웃풋 구조, 텔레그램=신경계 |
| 디버깅 교훈 (공통) | Credential 혼동, CF functions 정본 등 |
| 세션 로그 규칙 | 타임스탬프 역추적, 즉시 어펜딩 |
| works subtree 규칙 | 삭제 금지, 동기화 스크립트 |

### B-3. 디바이스별 차이 항목

| 항목 | iMac | M1 | M2 | M4 |
|------|------|----|----|-----|
| 디바이스 명 | iMac (사무실) | M1 (집) | M2 (몽크사진관) | M4 (사무실) |
| 에이전트 접두어 | `iMac/쌍아`, `iMac/막내N` | `M1/쌍아`, `M1/막내N` | `M2/막내N` | `M4/민아` |
| 쌍아 본분 | ✅ 해당 | ✅ 해당 | ❌ 꾸 전용 | ❌ 한 전용 |
| 지시서 운용 | ✅ 전체 | ✅ 전체 | 제한적 | 제한적 |
| 우체통 시스템 | 발신 | 발신 | ~/kku/ 수신 | 해당 없음 |
| 리소스 운용 | Opus 쿼터 | Opus 쿼터 | Sonnet 쿼터 | Sonnet 쿼터 |

### B-4. MEMORY.md 초기 템플릿

```markdown
# {디바이스명} MEMORY — MONK OS

> CLAUDE.md = 프로젝트 정책 시트 (Git 공유)
> MEMORY.md = 디바이스 행동강령 + 에이전트 핵심 노트 (로컬, 200줄 캡)

## 이 디바이스: {디바이스명}
- **{디바이스명}** ({위치} {용도})
- 모든 에이전트 접두어: `{디바이스명}/{에이전트}`
- 적용 대상: 수발신 헤더, 지시서, 보고서, 세션 첫 인사, 세션 로그 파일명

## 역할 자동 인식
- 시스템 프롬프트에 `VSCode native extension` → **쌍아**
- 시스템 프롬프트에 `Claude Agent SDK` (데스크톱 Claude Code) → **민아**
- 그 외 (CLI 터미널) → **막내** (번호는 지시서에서 수신)

## 팀 인적 인프라
- **한송이**: M4 — SNS 운영/마케팅
- **꾸(와이프)**: 맥미니 M2
- 조직 정본: `governance/PERSONNEL_REGISTRY.md`

## 사업 구조
- **monk.kr**(본진 데스크톱, CF Pages) → **monkos.ai**(모바일 AI, Cloud Run)

## 프로젝트 폴더 위상
| 폴더 | 위상 |
|------|------|
| `MONK_kr/` | 본진 (CF Pages) |
| `monkos_AI/` | 모바일 AI (Cloud Run) |
| `monkos-ops/` | 운영 체계 |
| `governance/` | 법률+역사+철학 |

## 운영 철학
- 작가님=AI대화, 팀원=텔레그램+GDrive, AI에이전트=뒷단자동화
- 텔레그램=신경계, GDrive=창고(2TB)

## 세션 로그 규칙
- 타임스탬프: 대화 내역 턴별 타임스탬프 역추적하여 정확한 값 기입
- 즉시 어펜딩: 지시서 발행/실행 완료/보고 리뷰 시점마다 바로 어펜드

## 세션 로그 파일명 패턴
- `monkos-ops/ops/sessions/2026-MM-DD_{디바이스}_에이전트.md`

## works subtree 규칙
- 삭제 절대 금지: `--delete`, `git rm` works 내 금지
- 동기화 스크립트: `scripts/mk-push.sh` / `scripts/mk-pull.sh`

## 디버깅 교훈
- (디바이스별 실전 교훈 누적)

## 외장 메모리 (필요 시 Read)
- 4MUSE 페르소나: `memory/user_4muse_origins.md`
- 미결 어젠다: `memory/project_pending_agenda.md`
```

### B-5. 템플릿 보관 위치

**권장: `monkos-ops/ops/templates/MEMORY_TEMPLATE.md`**

이유:
- 운영 체계(ops) 소속 — 디바이스 설정은 운영 업무
- 정본 단일 원칙 준수 — monkos-ops/에 배치
- 팀원이 신규 디바이스 설정 시 참조 가능

---

## C. 코웍이/철창이 자체 지침 설계

### C-1. Claude Desktop vs Claude Code 핵심 차이

| 기능 | Claude Desktop (Chat) | Claude Code (CLI/Desktop IDE) |
|------|----------------------|------------------------------|
| CLAUDE.md 자동 로딩 | ❌ 미지원 | ✅ 자동 |
| .claude/ 디렉토리 | ❌ 미지원 | ✅ 전체 지원 |
| MEMORY.md | ❌ (프로젝트별 자체 메모리만) | ✅ 200줄 자동 로딩 |
| settings.json 권한 | ❌ 미지원 | ✅ 전체 지원 |
| hooks/skills | ❌ 미지원 | ✅ 전체 지원 |
| 지시 입력 | **수동 Project Instructions UI** | **자동 파일 기반** |

> 출처: [Claude Code Desktop Documentation](https://code.claude.com/docs/en/desktop)

### C-2. 코웍이/철창이 자체 지침 권장 구성

**코웍이와 철창이는 Claude Desktop Chat 환경이므로 Project Instructions UI에 수동 입력해야 한다.**

**반드시 포함할 항목:**

| 헌법 | 항목 | 코웍이 | 철창이 | 이유 |
|------|------|--------|--------|------|
| 1조(정체성) 1항 | 프로젝트 선언 + 작가님 호칭 | ✅ | ✅ | 브랜드 통일 |
| 2조(통신) 2항 | 수발신 헤더 형식 | ✅ | ✅ | 커뮤니케이션 식별 |
| 3조(적립) 1항 | 타임스탬프 절대 준수 | ✅ | ✅ | 시계열 정합성 |
| 3조(적립) 2항 | 완료 보고 형식 | ✅ | ✅ | 보고 체계 |
| 4조(구속·윤리) 1항 | 비밀정보 보호 | ✅ | ✅ | 보안 |
| 4조(구속·윤리) 3항 | 내부 기밀 보호 | ✅ | ✅ | 외부 유출 금지 |
| 4조(구속·윤리) 4항 | 윤리적 운용 | ✅ | ✅ | 법적 리스크 |
| 코웍이 역할 정의 | 배포실행+전략보고 | ✅ | ❌ | 역할 특정 |
| 철창이 역할 정의 | 전략기획 | ❌ | ✅ | 역할 특정 |

**포함 불필요한 항목:**

| 항목 | 이유 |
|------|------|
| 막내 행동 강령 (ch7) | 코웍이/철창이는 막내가 아님 |
| 세션 자동 인식 (ch1 5조) | Claude Desktop에 해당 없음 |
| Skills/rules 체계 | Claude Desktop 미지원 |
| 법률 인덱스 전체 | 직접 파일 참조 불가 |
| 정본 단일 원칙 | 본진 코드 레포 개념 |
| 4계층 문서 위계 | 본진 전용 |

### C-3. 자체 지침 갱신 절차

**권장 절차:**

1. 본진 헌법 개정 발생 시 → 쌍아가 코웍이/철창이 자체 지침 갱신 필요 여부 판단
2. 갱신 필요 시 → 쌍아가 갱신 내용을 works/에 `SPEC_YYYYMMDD_자체지침갱신.md`로 발행
3. 작가님이 Claude Desktop Project Instructions UI에서 수동 반영
4. 갱신 완료 후 작가님 확인 보고

**정본 관리:** 코웍이/철창이 자체 지침의 정본은 `monkos-ops/ops/templates/`에 보관. UI에 입력된 것은 사본.

---

## D. 민아 Desktop Claude Code 특수성

### D-1. 민아 환경 확인 사항

민아는 **Claude Code Desktop (IDE 탭)**을 사용한다. 이는 Claude Desktop Chat과 **다른 제품**이다.

| 항목 | Claude Code Desktop (민아) | Claude Desktop Chat (코웍이/철창이) |
|------|--------------------------|----------------------------------|
| CLAUDE.md 자동 로딩 | ✅ CLI와 동일 | ❌ 미지원 |
| .claude/ 디렉토리 | ✅ 전체 지원 | ❌ 미지원 |
| settings.json | ✅ 전체 지원 | ❌ 미지원 |
| hooks/skills | ✅ 전체 지원 | ❌ 미지원 |
| MEMORY.md | ✅ 동일 메커니즘 | 자체 메모리 (다른 체계) |

> 출처: [Claude Code Desktop Documentation](https://code.claude.com/docs/en/desktop)

### D-2. 세션 단절 현상 분석

**공식 문서 기반 분석:**

Claude Code Desktop은 CLI와 같은 엔진을 사용한다. 세션 단절 가능 원인:

| 가능성 | 설명 | 확인 방법 |
|--------|------|----------|
| **워크트리 기반 세션 격리** | Claude Code Desktop은 자동으로 worktree를 생성하여 병렬 작업을 격리한다. 세션마다 다른 worktree가 할당될 수 있음 | `.claude/worktrees/` 디렉토리 확인 |
| **대화 비영속** | Claude Code는 세션 종료 시 대화 내역을 보존하지 않는 것이 기본 설계. `/resume` 또는 `--resume` 플래그가 있어야 재접속 가능 | 민아 환경에서 resume 기능 확인 |
| **컨텍스트 초기화** | 새 세션 시작 시 CLAUDE.md/MEMORY.md는 재로딩되지만 이전 대화는 없음 | 이것은 **Anthropic 설계**임 |

**결론:** 세션 종료 후 과거 대화 접근 불가는 **Anthropic의 의도된 설계**일 가능성이 높다. Claude Code는 대화 기반이 아닌 작업 기반 도구로 설계되었다. 영속 정보는 MEMORY.md와 파일 시스템에 남겨야 한다.

### D-3. 민아 memory 경로

**공식 메커니즘:**
- 경로: `~/.claude/projects/<project-path-hash>/memory/MEMORY.md`
- `<project-path-hash>`는 **git 레포의 절대 경로**에서 파생
- 같은 git 레포의 모든 worktree는 **동일한 memory 디렉토리** 공유
- 따라서 워크트리명이 바뀌어도 memory는 고정 (같은 레포면)

**확인 방법:** 민아 환경에서 `/memory` 명령 실행 → 실제 경로 표시

### D-4. 민아의 CLAUDE.md/settings 접근

**공식 확인:**
- Claude Code Desktop은 CLI와 **동일한 .claude/ 디렉토리**를 사용
- `./CLAUDE.md`, `.claude/settings.json`, `.claude/rules/`, `.claude/skills/` 모두 CLI와 동일하게 작동
- MCP 설정만 차이: Chat은 `claude_desktop_config.json`, Code는 `.claude.json` 또는 `.mcp.json`

**결론:** 민아는 본진 CLAUDE.md를 자동으로 읽으며, settings.json deny 규칙도 적용된다. 코웍이/철창이와 달리 별도 자체 지침이 불필요하다.

---

## 종합 권장안

| 환경 | 헌법 전달 방식 | 정비 우선순위 |
|------|--------------|-------------|
| **본진 (monk_project)** | CLAUDE.md 직접 (완료) | — |
| **위성 레포 (monk-han, monkos-works)** | User 레벨 `~/.claude/CLAUDE.md` + symlink rules | 높음 |
| **M4/M2 디바이스** | MEMORY.md 템플릿 배포 + User 레벨 CLAUDE.md | 높음 |
| **코웍이/철창이** | Project Instructions UI 수동 입력 (정본은 ops/templates/) | 중간 |
| **민아 (Desktop Claude Code)** | 본진 CLAUDE.md 자동 적용 (추가 작업 불필요) | 낮음 (확인만) |

---

## 출처

| # | 문서 | URL |
|---|------|-----|
| 1 | Claude Code Memory (공식) | https://code.claude.com/docs/en/memory.md |
| 2 | Claude Code Settings (공식) | https://code.claude.com/docs/en/settings.md |
| 3 | Claude Code Desktop (공식) | https://code.claude.com/docs/en/desktop |
| 4 | Claude Desktop Chat Memory | https://support.claude.com/en/articles/11817273 |
| 5 | Portable Memory Issue #25739 | https://github.com/anthropics/claude-code/issues/25739 |
| 6 | autoMemoryDirectory Issue #28276 | https://github.com/anthropics/claude-code/issues/28276 |
| 7 | Claude Code Documentation Map | https://code.claude.com/docs/en/claude_code_docs_map.md |
