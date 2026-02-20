---
type: task
from: 쌍아
to: 막내 1호
date: 2026-02-20 11:30 KST
status: open
priority: high
tags: [governance, claude-md, constitution, 성문화]
---

# 지시서: CLAUDE.md 헌법 + 인덱스 재구성

[2026-02-20 11:30 KST] iMac/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

---

## 배경

CLAUDE.md를 **헌법 + 인덱스** 구조로 재구성한다.

**현행**: 372줄 (헌법/법률/규정 혼재, 에이전트 컨텍스트 부담)
**목표**: ~100줄 (헌법 핵심 + 에이전트 대응 프로토콜 + 법률/규정 인덱스)

**핵심 원칙**: CLAUDE.md와 MEMORY.md는 기능적·리소스적으로 동일 (둘 다 세션 시작 시 자동 로딩). 따라서 **헌법(불변 원칙)만 CLAUDE.md에 직접 기재**하고, 법률/규정은 **파일 링크 인덱스**로 참조한다.

## 참조 산출물

반드시 아래 4건을 읽고 작업할 것:

1. `docs/infrastructure/MONK_ARTICLES_DRAFT_v1.md` — 헌법 11조 전문 + 법률 7장 27조 + 규정 35항
2. `docs/infrastructure/MONK_GOVERNANCE_DESIGN_v1.md` — 재구성 골격 + 대응 프로토콜 + 매핑표
3. `docs/infrastructure/LAW_AUDIT_SESSION_CHRONICLE.md` — 세션 연대기 (근거 데이터)
4. `docs/infrastructure/LAW_AUDIT_DOCUMENT_ANALYSIS.md` — 문서 해부 (분류 근거)

## 작업 내용

### Step 1: 현행 CLAUDE.md 아카이브

```bash
cp CLAUDE.md docs/corpus/legacy/CLAUDE_md_v1_20260220.md
```

### Step 2: 신규 CLAUDE.md 작성

아래 구조로 **CLAUDE.md를 완전히 새로 작성**한다:

```
# MONK.KR 프로젝트 헌법

## 전문 (Preamble)                          ~15줄
  - 프로젝트 정체성 (이름, 비전, 도메인, 언어, 환경)
  - 문서 위계 설명 (헌법/법률/규정 3계층)
  - 에이전트 대응 프로토콜 ★

## 헌법 — 제1조~제11조                       ~70줄
  제1조: 시계열 정합성 (타임스탬프)
  제2조: 보고 의무 (완료 보고)
  제3조: 프로젝트 정체성
  제4조: 4 MUSE 체계
  제5조: 에이전트 역할 체계
  제6조: 인프라 보호
  제7조: 응답 윤리
  제8조: 파괴적 명령 금지
  제9조: I2I 정체성 보존
  제10조: 프록시 금지
  제11조: 윤리적 운용

## 법률 인덱스                               ~15줄
  | 장 | 제목 | 파일 |
  각 법률 파일 경로 + 1줄 요약

## 규정 참조                                 ~10줄
  MEMORY.md (매 세션 자동 로딩)
  + docs/infrastructure/ 기술문서 목록
```

### 헌법 각 조항 작성 규칙

각 조항은 아래 형태로 **간결하게** 작성:

```markdown
### 제N조: 조항명

- 핵심 내용 (2~4줄)

> 근거: YYYY-MM-DD — "작가님 원문 인용"
> 위반 시: 영향 범위 1줄
```

- 조항 코드표(`MONK_ARTICLES_DRAFT_v1.md`)의 헌법 섹션을 **그대로 활용**하되, 각 조항을 5~7줄로 압축
- `작가님 원문` 인용은 반드시 포함 (근거의 핵심)
- 거버넌스 설계(`MONK_GOVERNANCE_DESIGN_v1.md`)의 전문과 대응 프로토콜 텍스트를 참고

### 에이전트 대응 프로토콜 (전문에 포함)

거버넌스 설계 v1 §1-3의 대응 프로토콜을 **그대로 삽입**:

```markdown
## 에이전트 대응 프로토콜

### 헌법 충돌 시
1. "헌법 제N조 [조항명]과 충돌합니다" — 조항 인용
2. 영향받는 하위 법률 목록 제시
3. "진행하시겠습니까?" — 작가님 승인 대기
4. 승인 시 세션 로그에 [개헌] 기록

### 법률 충돌 시
1. "법률 제N장 M조에 따르면..." — 조항 인용
2. "예외로 진행하시겠습니까?"
3. 승인 시 세션 로그에 [예외] 기록

### 규정 변경 시
1. "현재값: X → 변경값: Y" 보고
2. 에이전트 자율 진행 가능
3. 완료 보고 또는 MEMORY.md 갱신
```

### 법률 인덱스 (CLAUDE.md 하단)

막내 2호가 생성할 법률 파일들의 경로를 인덱스로 기재:

```markdown
## 법률 인덱스

> 법률 상세는 별도 파일 참조. 작가님 승인 시 개정 가능.

| 장 | 제목 | 파일 | 조 수 |
|----|------|------|------|
| 제1장 | 에이전트 체계 | [laws/ch1_agent_system.md](docs/infrastructure/laws/ch1_agent_system.md) | 4조 |
| 제2장 | 코딩 규칙 | [laws/ch2_coding.md](docs/infrastructure/laws/ch2_coding.md) | 5조 |
| 제3장 | 세션 로그 | [laws/ch3_session_log.md](docs/infrastructure/laws/ch3_session_log.md) | 3조 |
| 제4장 | 문서/폴더 구조 | [laws/ch4_docs_structure.md](docs/infrastructure/laws/ch4_docs_structure.md) | 2조 |
| 제5장 | 배포 규칙 | [laws/ch5_deployment.md](docs/infrastructure/laws/ch5_deployment.md) | 4조 |
| 제6장 | 브랜치/커밋 | [laws/ch6_git.md](docs/infrastructure/laws/ch6_git.md) | 4조 |
| 제7장 | 막내 행동 강령 | [laws/ch7_makne_code.md](docs/infrastructure/laws/ch7_makne_code.md) | 5조 |
| 제8장 | 브랜딩/마케팅 | [laws/ch8_branding.md](docs/infrastructure/laws/ch8_branding.md) | 3조 |
```

### Step 3: MEMORY.md 정리

CLAUDE.md에서 제거되는 규정급 항목을 MEMORY.md로 이동:
- CLI alias 표 (mk, mk-c 등) — 이미 MEMORY.md에 있으면 확인만
- 디바이스 약칭 표 — 이미 있으면 확인만
- 운용 환경 구조 — `OPERATIONS_OVERVIEW_20260220.md`에 이미 있으므로 링크만

**MEMORY.md 200줄 제한 준수** — 초과 시 별도 파일로 분리 후 인덱스.

### Step 4: 커밋

```bash
git add CLAUDE.md docs/corpus/legacy/CLAUDE_md_v1_20260220.md
git commit -m "[refactor] CLAUDE.md 헌법 + 인덱스 재구성 — 372줄 → ~100줄"
```

MEMORY.md 수정분도 있으면 별도 커밋 또는 동일 커밋에 포함.

---

## 규칙

- **브랜치**: develop
- **수정 파일**: CLAUDE.md, MEMORY.md (2파일만)
- **생성 파일**: docs/corpus/legacy/CLAUDE_md_v1_20260220.md (아카이브)
- **금지**: docs/infrastructure/laws/ 하위 파일 수정 (막내 2호 영역)
- **에스컬레이션**: 헌법 조항 수 변경 필요 시 즉시 보고

## 완료 기준

**실행 + 커밋** (레벨 2)
- CLAUDE.md가 ~100줄로 재구성되어 있을 것
- 헌법 11조 전문이 조항 번호와 함께 기재되어 있을 것
- 에이전트 대응 프로토콜이 전문에 포함되어 있을 것
- 법률 인덱스가 8장 파일 경로와 함께 기재되어 있을 것
- 현행 CLAUDE.md가 legacy에 아카이브되어 있을 것
- 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
