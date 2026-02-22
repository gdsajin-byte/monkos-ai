---
type: task
from: M1/쌍아
to: 막내(any)
date: 2026-02-17 12:33 KST
status: pending
tags: [docs, restructure, ops]
---

# 막내 지시서: docs/ 전체 구조 재편

## 배경

docs/ 하위 150+ 파일이 중구난방. infrastructure/ 40개 파일에 아키텍처/마케팅/GPU/결제/브랜드가 혼재.
CLAUDE.md를 경량 인덱스로 전환하기 위해 먼저 docs/ 구조를 정돈한다.

## 목표 구조

```
docs/
├── ops/              ← 상위 거버넌스 (모든 축에 적용되는 운영 규칙)
│   ├── README.md     ← 운영 규칙 인덱스
│   ├── coding.md     ← 코딩 표준 (현 CODING_STANDARDS.md)
│   ├── deploy.md     ← 배포 가이드 (현 DEPLOYMENT_GUIDE.md)
│   ├── design.md     ← 디자인 시스템 (현 DESIGN_SYSTEM.md)
│   ├── security.md   ← 보안 감사 (현 SECURITY_AUDIT_REPORT.md)
│   └── sessions.md   ← 세션 로그 규칙 (현 SESSION_LOG_VALUE.md)
│
├── history/          ← 축 1: 히스토리 (언제, 어떤 맥락에서)
│   ├── README.md     ← 타임라인 인덱스
│   ├── sessions/     ← 세션 로그 (현 corpus/sessions/ 그대로 이동)
│   ├── legacy/       ← monk.kr 시절 (현 corpus/legacy/ 그대로 보존)
│   ├── incidents/    ← 장애/롤백 기록 (현 monkos/INCIDENT_*)
│   └── changelog.md  ← 프로젝트 작업 이력 (현 PROJECT_WORK_HISTORY.md)
│
├── project/          ← 축 2: 프로젝트 (지금, 무엇을 어떻게)
│   ├── README.md     ← 활성 문서 인덱스
│   ├── arch/         ← 아키텍처, 기술 스펙
│   │   └── (ARCHITECTURE_FLOWCHART, SHARED_CORE_SEPARATION_PLAN,
│   │       MONK_PHOTO_STUDIO_ARCHITECTURE, QC_CONSULTANT_ARCHITECTURE 등)
│   ├── infra/        ← GCP, Vertex, GCS, GPU 설정
│   │   └── (GCS_BUCKET_STRUCTURE, VERTEX_*, GPU_*, GCP_COST_ANALYSIS 등)
│   └── tasks/        ← 지시서, 스프린트, 작업 큐 (현 monkos/TASK_*, SPRINT_*)
│
├── philosophy/       ← 축 3: 철학 (왜, 어디로)
│   ├── README.md     ← 사상 인덱스
│   ├── brand/        ← BWYA, 키워드 사전, 원형
│   │   └── (KEYWORD_LEXICON, BWYA_*, COIN_ECONOMY_STRATEGY 등)
│   ├── strategy/     ← 마케팅, 서비스 비전, 경쟁사 분석
│   │   └── (현 corpus/claude_sessions/strategy/, marketing/ 통합)
│   └── gemini/       ← 용아 대화 (현 corpus/gemini/ 이동)
│
├── rnd/              ← 독립: R&D (KOITA, 디딤돌)
│   ├── README.md     ← R&D 인덱스
│   └── (현 rnd_2026/ 내용 그대로 + corpus 내 KOITA PDF 통합)
│
└── README.md         ← 전체 인덱스 (CLAUDE.md가 참조하는 마스터 목차)
```

## 작업 순서

### PHASE 1: 전수 조사 + 분류표 작성 (코드 수정 없음)

docs/ 전체 파일을 읽고 아래 테이블 작성:

```markdown
| 현재 경로 | 파일명 | 작성일 | 목표 위치 | 분류 | 비고 |
|-----------|--------|--------|-----------|------|------|
| infrastructure/ | CODING_STANDARDS.md | 2026-01-?? | ops/coding.md | ops | 리네임 |
| infrastructure/ | BWYA_ACADEMY_INDEX.md | 2026-01-?? | philosophy/brand/ | philosophy | 이동 |
| ... | ... | ... | ... | ... | ... |
```

- 모든 .md, .pdf 파일 대상
- 작성일은 파일 내용 또는 git log에서 추출
- 중복 파일 식별 (같은 내용의 다른 이름)
- 레거시 파일은 삭제 아닌 '보존' 표기

**PHASE 1 완료 후 보고** → 쌍아/작가님 검토 → PHASE 2 승인

### PHASE 2: 폴더 생성 + 파일 이동

- `git mv`로 이동 (히스토리 보존)
- 폴더명: 영문 소문자, 언더스코어 없음 (kebab 아닌 flat)
- 파일명: 기존 유지 (리네임은 최소화)
- 중복 파일: 원본만 이동, 복본은 삭제

### PHASE 3: README.md 생성

각 디렉토리에 README.md 작성:

```markdown
---
type: index
updated: 2026-02-17
maintainer: 쌍아
---

# {디렉토리명}

> 1줄 설명

## 문서 목록

| 파일 | 설명 | 최종 수정 | 상태 |
|------|------|-----------|------|
| coding.md | 코딩 표준 | 2026-02-17 | 활성 |

## 관계도

​```mermaid
graph TD
    A[ops] --> B[coding.md]
    A --> C[deploy.md]
​```
```

- YAML 프론트매터 필수
- Mermaid 다이어그램으로 관계 시각화 (VSCode 프리뷰용)
- 각 파일의 1줄 설명 + 상태 (활성/레거시/폐기 예정)

### PHASE 4: docs/README.md (마스터 인덱스) 작성

전체 구조를 한눈에 보여주는 마스터 인덱스:

```markdown
---
type: master-index
updated: 2026-02-17
---

# MONK.KR 문서 체계

​```mermaid
mindmap
  root((docs))
    ops
      coding
      deploy
      design
      security
    history
      sessions
      legacy
      incidents
    project
      arch
      infra
      tasks
    philosophy
      brand
      strategy
      gemini
    rnd
​```

## 디렉토리별 바로가기

| 디렉토리 | README | 설명 |
|----------|--------|------|
| ops/ | [README](ops/README.md) | 운영 규칙 (모든 축에 적용) |
| history/ | [README](history/README.md) | 히스토리 |
| ... | ... | ... |
```

## 문서 포맷 규칙 (신규 문서부터 적용)

### YAML 프론트매터 (필수)

```yaml
---
type: report | task | spec | session | index
from: {디바이스}/{에이전트}
to: {수신자}
date: YYYY-MM-DD HH:MM KST
status: active | legacy | deprecated
tags: [태그1, 태그2]
---
```

### Mermaid 다이어그램 (권장)

설계서, 아키텍처, 보고서에는 Mermaid 다이어그램 포함:
- `mindmap` — 구조 개요
- `graph TD/LR` — 플로우차트, 의존성
- `sequenceDiagram` — API 흐름, 에이전트 간 통신
- `gantt` — 스프린트/타임라인

### 파일명 규칙

- 영문 대문자 + 언더스코어: `CODING_STANDARDS.md` (기존 유지)
- 날짜 접두사 가능: `20260217_session.md`
- 한글 파일명 금지 (GCS/RAG 호환성)
- 예외: rnd/ 하위 한글 파일은 기존 유지 (외부 제출용)

## 제약

- **레거시 삭제 금지** — 보존 + 분류만
- **파일 내용 수정 금지** — 이동 + README 생성만 (PHASE 2~3)
- **PHASE 1은 조사 전용** — 분류표 보고 후 이동 승인 대기
- CLAUDE.md 수정 금지 — 쌍아가 별도 진행
- `git mv` 사용 (히스토리 보존)

## 커밋 메시지

```
[docs] PHASE 1: docs/ 전수 조사 및 분류표 작성
[docs] PHASE 2: docs/ 구조 재편 (폴더 생성 + 파일 이동)
[docs] PHASE 3: 각 디렉토리 README.md 생성
[docs] PHASE 4: docs/README.md 마스터 인덱스 작성
```

## 완료 보고

PHASE별 완료 보고 (2규칙 준수). PHASE 1 보고에는 반드시 분류표 전문 포함.
