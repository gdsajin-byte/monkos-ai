---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내1
status: 대기
pf: PF_MONK_OS
track: A
parallel_with: ["B → 막내2", "C → 막내3", "D → 막내4"]
---

# [지시서] Anthropic 최신 체제 전수 리서치 (PF_MONK_OS / Track A)

> **[2026-04-23 11:55 KST] iMac/쌍아 → iMac/막내1**
> 상위 PF: [PF_MONK_OS](../portfolios/PF_MONK_OS/README.md)
> 목적: Claude 4.7 전환으로 Anthropic이 공식화한 **Skills / Rules / Memory / Routines / Context / Agent SDK** 체계를 전수 파악하여 MONK OS 법률·명령·규정 매핑의 1차 소스로 공급
> **병렬 맥락**: 4기 동시 가동. B(업계)·C(Kimi)·D(MONK감사) 독립 — 본 트랙은 *Anthropic 내부 체계*에만 집중. 타사 비교는 B 트랙 소관.

---

## 배경

- 작가님 원문: "스케쥴스가 루틴스로 바뀐부분, 스킬즈와 룰스 세팅등의 정합성 클로드 파일, 메모리등 적절한 배치와 즉각 로딩 컨텍스트 시스템"
- MONK OS가 `.claude/rules/`, `.claude/skills/`, `CLAUDE.md`, `MEMORY.md`, `governance/laws/`를 운용 중 → Anthropic 공식 표준이 최근 어떻게 정리되었는지 갭 진단 필요
- **리서치는 "공식 소스"에 한정**. 커뮤니티·타사는 B 트랙. 단, Anthropic 공식이 언급한 타사 통합(MCP 등)은 본 트랙 포함.

---

## 조사 범위 (11개 축)

### 1. Claude 4.7 모델 스펙·Changelog
- Opus 4.7 공식 발표·model card
- 1M 컨텍스트 배포 상태, 확장 컨텍스트 API 플래그
- 가격·레이턴시·지원 리전
- 4.6 → 4.7 행동 변화 공식 서술 (reasoning·tool use·memory)

### 2. Skills 시스템
- 공식 문서 URL · 최신 개정일
- Skill 파일 스키마 (frontmatter 필드, 필수·선택)
- 로딩 규칙: 언제 자동, 언제 수동, 중첩 가능 여부
- Skill ↔ SlashCommand 관계
- `anthropics/skills` 레포 존재 시 구조 분석
- Agent SDK에서 Skill 호출 방식

### 3. Rules / CLAUDE.md 시스템
- `CLAUDE.md` 공식 스펙 (검색 순서, 병합 규칙, 최대 크기)
- `.claude/rules/` 공식 지원 여부 (공식? 관용? — 출처 명확히)
- 프로젝트 레벨 vs 사용자 레벨 vs 리포 레벨 우선순위
- `@import` 문법·가시성
- settings.json에서 정의되는 "rules" 개념과의 차이

### 4. Memory 시스템
- 본 세션 시스템 프롬프트가 말하는 `auto memory` 시스템의 공식 위치
- `/memory` 커맨드 공식 여부
- 파일 기반 vs 서버측 메모리 분리
- `MEMORY.md`가 공식인지 관용인지
- Agent SDK Memory API (있다면 엔드포인트·SDK 메서드)

### 5. Routines (구 Schedules) 전환
- Schedules → Routines 공식 발표문·마이그레이션 문서
- 새 Routine 스키마 (cron / natural language / trigger)
- 기존 Schedule 호환성·EoL 일정
- 로컬(Claude Code)과 원격(claude.ai) Routine 분리 여부
- 본 세션 시스템 프롬프트의 `ScheduleWakeup` / `CronCreate` 도구 위상

### 6. Context Editing / Compaction
- 자동 컴팩션 규칙·트리거
- `/compact`·수동 컴팩션 옵션
- 1M 윈도우 프롬프트 캐싱 규칙·5분 TTL 공식 언급
- Context Editing API 또는 SDK 파라미터

### 7. Agent SDK
- 최신 버전·패키지명·릴리즈 노트 (Python·TS)
- SubAgent 패턴 공식 구현 (spawn, isolation, worktree)
- Tool 정의 스키마 변동
- MCP 클라이언트·서버 구성
- Managed Agents (claude.ai 측) vs 셀프 호스팅 SDK

### 8. Claude Code CLI 최신 변경점
- 슬래시 커맨드 체계 (빌트인 목록, 커스텀 작성법)
- `settings.json` / `settings.local.json` 스키마 변동
- Hooks 시스템 이벤트 목록 (PreToolUse, PostToolUse, UserPromptSubmit, Stop 등)
- Permissions 모델 (allow/deny, MCP 권한)
- IDE 확장(VSCode) 고유 기능

### 9. Anthropic Cookbook / Best Practices
- `anthropic-cookbook` 리포 최근 추가분
- Best practices 공식 페이지 (agent design, prompt caching, tool use, long context)
- 공식 예시 에이전트 코드의 구조적 패턴

### 10. 공식 블로그 / 리서치 (최근 60일)
- Claude 4.7 launch blog
- Agentic misalignment·safety 관련 공지
- Constitutional AI / RLHF 최신 노트
- Prompt caching·batch API 업데이트

### 11. MONK OS 매핑 초안 (막내1 판단)
> 조사 결과 바탕으로 표 1개 작성:

| Anthropic 공식 개념 | 공식 위치 | MONK OS 대응 | 갭 / 제안 |
|---|---|---|---|
| Skills | (URL) | `.claude/skills/` | (예: 네이밍·frontmatter 차이) |
| Rules/CLAUDE.md | (URL) | CLAUDE.md + `.claude/rules/` | |
| Memory | (URL) | MEMORY.md + memory/ | |
| Routines | (URL) | (미구현) | 신설 검토? |
| Hooks | (URL) | (미사용) | |
| SubAgents | (URL) | 막내 체계 | |

---

## 조사 방법

1. **1차 소스만 신뢰**: docs.anthropic.com / anthropic.com/news / github.com/anthropics/* / anthropic.com/engineering
2. 2차 소스(블로그 요약 등)는 1차 URL 찾을 때까지 보조 수단
3. 날짜 명시: 모든 기능·문서에 "조회 일자 2026-04-23" 또는 "문서 상 최종 개정일" 기재
4. 공식 소스에 없으면 `⚠️ 공식 문서 미확인` 표시 — 추측 금지
5. 버전·엔드포인트·파일명은 정확한 문자열 복사

---

## 산출물

**메인**: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_A_anthropic.md`

구조:
```
---
type: RESEARCH
track: A
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내1
---
# RESEARCH A — Anthropic 최신 체제
## 요약 (500자 내, 최상단)
## 1. Claude 4.7 스펙
## 2. Skills
## 3. Rules / CLAUDE.md
## 4. Memory
## 5. Routines
## 6. Context Editing / Compaction
## 7. Agent SDK
## 8. Claude Code CLI
## 9. Cookbook / Best Practices
## 10. Blog / Research
## 11. MONK OS 매핑 초안 (표)
## 12. 출처 URL 전체 목록
```

**요약 500자**는 최상단 필수 — 쌍아 통합본이 이 요약만 인용.

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` KST (헌법 3조 1항)
⚠️ 추정 금지 (헌법 2조 3항) — `⚠️ 공식 문서 미확인` 명시
⚠️ 모든 수치·인용 URL 필수
⚠️ 완료 시 PF README 히스토리 테이블 append (헌법 3조 2항)
⚠️ 세션 로그: `monkos-ops/ops/sessions/2026-04-23_iMac_막내1.md`
⚠️ 설치·배포 작업 없음. 순수 웹 리서치.
⚠️ 타 트랙(B/C/D) 결과 대기 금지 — 독립 진행

---

## 완료 보고 형식

```
✅ Track A 완료 — RESEARCH_A_anthropic.md
📁 [링크](monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_A_anthropic.md)
💡 핵심 발견 3줄
⚠️ 공식 문서 미확인 항목 N건
⏳ 후속 제안 (있다면)
```
