---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내1
subject: Anthropic 컨텍스트 레이어 공식 문서 리서치
priority: 높음
related: governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md
---

# 지시서 — Anthropic 컨텍스트 레이어 공식 문서 리서치

**[2026-03-25 14:06 KST] iMac/쌍아 → 막내1**

---

## 배경

헌법 5축 재편(7조→5조 위상 정렬) 개헌 청구안이 초안 완료 상태다. 작가님이 **Anthropic의 컨텍스트 구조를 정밀 조사한 뒤 5축을 확정**하라고 지시하셨다. CLAUDE.md / MEMORY.md 등 Anthropic이 설계한 컨텍스트 레이어의 공식 구조를 파악해야 한다.

## 조사 범위

1. **CLAUDE.md 계층 구조**
   - 프로젝트 루트 CLAUDE.md / 하위 디렉토리 CLAUDE.md / 사용자 홈 CLAUDE.md 의 로딩 순서와 우선순위
   - 각 계층에 담아야 할 내용의 권장 범위 (Anthropic 공식 가이드 기준)

2. **MEMORY.md 구조**
   - 자동 로딩 조건, 200줄 캡 제한, 인덱스 역할
   - memory/ 디렉토리 내 개별 파일의 frontmatter 스키마 (name, description, type)
   - memory type 5종 (user, feedback, project, reference + 기타)의 설계 의도

3. **system prompt 계층**
   - Claude Code가 주입하는 system prompt의 구조 (tool definitions, system-reminder, claudeMd 등)
   - CLAUDE.md와 system prompt의 관계 — 어디서 합쳐지고 어떤 순서로 주입되는가

4. **컨텍스트 윈도우 관리**
   - 자동 컴팩팅(압축) 메커니즘 — 트리거 조건, 보존 우선순위
   - 긴 세션에서 CLAUDE.md / MEMORY.md가 컴팩팅 대상인지 여부

5. **settings.json / .claude/ 디렉토리**
   - 프로젝트별 설정, 권한, hooks 등의 구조
   - CLAUDE.md와의 역할 분담

## 조사 방법

- **Anthropic 공식 문서** 우선 (docs.anthropic.com, Claude Code 공식 가이드)
- GitHub anthropics/claude-code 레포 README, 이슈, 릴리즈 노트
- 공식 블로그 포스트

## 산출물

- `monkos-ops/ops/reports/2026-03/REPORT_20260325_막내1_Anthropic컨텍스트_공식문서리서치.md`
- YAML frontmatter 준수
- 각 항목별 **출처 URL 필수**

## ⚠️ 준수 조항

- 헌법 1조 1항: 타임스탬프 `date` 명령 취득
- 헌법 1조 2항: 세션 로그 자체 기록, 완료 보고 필수
- 헌법 4조 1항: API 키/비밀정보 절대 생성 금지
