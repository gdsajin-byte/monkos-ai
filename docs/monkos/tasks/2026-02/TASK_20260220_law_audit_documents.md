---
type: task
from: 쌍아
to: 막내 2호
date: 2026-02-20 05:42 KST
status: open
priority: high
tags: [audit, documents, law-system, overnight, architecture]
---

# 지시서: 현행 문서 체계 해부 + 3계층 분리 설계안

[2026-02-20 05:42 KST] M1/쌍아 → 막내 2호

## 역할 선언
> **너는 "막내 2호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내2 → M1/쌍아` 형식

---

## 목적

현재 CLAUDE.md 372줄에 **헌법(불변 원칙) / 법률(운용 규칙) / 규정(기술 상세)** 이 혼재되어 있다.
이를 3계층으로 분리하기 위해 **현행 문서 체계를 해부**하고, **최적의 분리 설계안**을 제시하라.

막내 1호가 동시에 **세션 로그 전수 조사**(규칙 결정 연대기)를 진행 중이다. 파일 충돌 없음.

---

## Phase 1: CLAUDE.md 정밀 해부

파일: `/Users/developer/monk_project/CLAUDE.md` (372줄)

### 작업
1. 전체를 읽고 **모든 항목을 3계층으로 분류**:

| 계층 | 성격 | 변경 빈도 | 예시 |
|------|------|----------|------|
| **헌법** | 불변 원칙. 프로젝트 정체성. 어떤 에이전트든 반드시 준수 | 거의 없음 | 작가님 호칭, 보안 금지, 에이전트 역할 |
| **법률** | 운용 규칙. 현재 유효하나 전략 변경 시 수정 가능 | 월 단위 | 코딩 표준, 배포 절차, 커밋 규칙, 보고 형식 |
| **규정** | 기술 상세. 모델명, API 경로, 구체적 설정값 | 주 단위 | 모델 버전, Cloud Run 서비스명, 크레딧 단가 |

2. 항목별로 아래를 기록:
   - 현재 줄 번호 범위
   - 분류 (헌법/법률/규정)
   - 분류 근거 1줄
   - 다른 문서와 중복 여부

---

## Phase 2: MEMORY.md 분석

파일: `~/.claude/projects/-Users-developer-monk-project/memory/MEMORY.md` (192줄)

### 작업
1. MEMORY.md의 각 섹션을 CLAUDE.md와 대조
2. **중복**: 양쪽에 같은 내용이 있는 항목
3. **충돌**: 양쪽 내용이 다른 항목
4. **MEMORY만**: CLAUDE.md에 없고 MEMORY에만 있는 항목
5. **CLAUDE만**: MEMORY에 없고 CLAUDE에만 있는 항목

산출물: 대조표

---

## Phase 3: docs/ 규칙 관련 문서 식별

비세션 문서 148개 중 **규칙/표준/가이드** 성격의 문서를 식별.

### 핵심 후보 (우선 확인)
```
docs/infrastructure/guides/CODING_STANDARDS.md
docs/infrastructure/guides/DESIGN_SYSTEM.md
docs/infrastructure/deployment/DEPLOYMENT_GUIDE.md
docs/infrastructure/guides/SESSION_LOG_VALUE.md
docs/infrastructure/architecture/3TRACK_SYSTEM_ARCHITECTURE.md
docs/infrastructure/deployment/GCS_BUCKET_STRUCTURE.md
docs/infrastructure/guides/OVERNIGHT_AUTOMATION_RULES.md
docs/infrastructure/guides/VSCODE_WORKSPACE_STANDARD.md
docs/infrastructure/guides/CLAUDE_CODE_COLLABORATION_STRATEGY.md
docs/infrastructure/guides/CLAUDE_CODE_FEATURES.md
docs/infrastructure/guides/CLAUDE_CODE_SETUP_GUIDE.md
docs/infrastructure/architecture/MONKOS_AI_TECHNICAL_SPEC.md
```

### 작업
1. 각 문서를 읽고 CLAUDE.md/MEMORY.md와의 관계 분류:
   - **현행**: 내용이 유효하고 CLAUDE.md가 참조해야 할 것
   - **구식**: 내용이 오래되어 현재와 맞지 않는 것
   - **중복**: CLAUDE.md에 이미 포함된 내용
   - **독립**: 규칙이 아닌 참고 자료 (분리 대상 아님)
2. 나머지 136개는 파일명으로 1차 분류, 의심되는 것만 열어서 확인

---

## Phase 4: 3계층 분리 설계안

Phase 1~3 결과를 종합하여 **구체적 설계안** 제시.

### 설계 시 고려사항

1. **Claude Code 로딩 구조**:
   - CLAUDE.md: 매 세션 시작 시 시스템 프롬프트로 주입 (전문)
   - MEMORY.md: 매 세션 시작 시 시스템 프롬프트로 주입 (200줄 제한)
   - 기타 .md: 에이전트가 필요시 수동 읽기

2. **핵심 제약**: CLAUDE.md가 너무 길면 → 토큰 낭비 + 에이전트 혼란
   - 현재 372줄 — 이미 긴 편
   - 불변 원칙(헌법)만 CLAUDE.md에 남기면 대폭 축소 가능

3. **에이전트 다양성**: 쌍아(VSCode), 막내(iTerm), 소넷이(데몬), 철창이(웹) — 전부 CLAUDE.md를 읽음
   - 헌법은 전원 필수
   - 법률은 역할에 따라 필요한 것만
   - 규정은 해당 작업 시에만

4. **멀티 에이전트 충돌 방지**:
   - 여러 막내가 동시 작업 시 같은 규칙을 보고 있어야 함
   - 규칙이 여러 파일에 흩어지면 "어디를 봐야 하지?" 혼란

5. **유지보수성**:
   - 기술 규정(모델명, 크레딧 단가 등)은 자주 바뀜 → 별도 파일이 편함
   - 운용 규칙은 가끔 바뀜 → 중간 계층
   - 불변 원칙은 안 바뀜 → CLAUDE.md에 고정

### 설계안 형식

```markdown
## 제안: 3계층 파일 구조

### 계층 1: 헌법 (CLAUDE.md — 프로젝트 루트)
- 대상: [항목 리스트]
- 예상 줄 수: ~N줄
- 로딩: 매 세션 자동 (시스템 프롬프트)

### 계층 2: 법률 (파일명/경로 제안)
- 대상: [항목 리스트]
- 예상 줄 수: ~N줄
- 로딩: CLAUDE.md에서 참조 경로 명시, 에이전트가 필요시 읽기
- 또는: .claude/ 내 배치 방안

### 계층 3: 규정 (파일명/경로 제안)
- 대상: [항목 리스트]
- 예상 줄 수: ~N줄
- 로딩: 해당 작업 시에만

### MEMORY.md 역할 재정의
- 현재: CLAUDE.md와 상당 부분 중복
- 제안: [역할 재정의]

### 마이그레이션 계획
- Step 1: ...
- Step 2: ...
```

---

## 산출물

파일: `docs/infrastructure/audit/LAW_AUDIT_DOCUMENT_ANALYSIS.md`

### 포함 내용
1. **CLAUDE.md 해부표** — 줄 번호별 3계층 분류
2. **MEMORY.md 대조표** — 중복/충돌/고유 식별
3. **docs/ 규칙 문서 감사** — 현행/구식/중복/독립 분류
4. **3계층 분리 설계안** — 구체적 파일 구조 + 마이그레이션 계획
5. **대안 비교** — 2~3개 설계안의 장단점 비교 (최종 판단은 작가님)

---

## 주의사항

1. **코드 수정 없음** — 순수 조사 + 설계안 작성만
2. **CLAUDE.md 수정 금지** — 현행 분석만. 실제 분리는 작가님 승인 후
3. 막내 1호 산출물(`LAW_AUDIT_SESSION_CHRONICLE.md`)과 합쳐서 최종 판단할 예정
   - 1호 완료 전에 2호가 먼저 끝나도 OK — 각자 독립 산출물

---

## 규칙

- **브랜치**: develop
- **커밋**: `[docs] 현행 문서 체계 해부 — 3계층 분리 설계안`
- **금지**: main 푸시, prod 배포, .env 수정, 코드 수정 (조사만)
- **에스컬레이션**: CLAUDE.md와 실제 운용 간 심각한 괴리 발견 시 별도 표시
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기

## 완료 기준

**조사+보고** (레벨 1) → 이후 **실행+커밋** (레벨 2)
1. Phase 1~4 전수 조사 완료
2. `LAW_AUDIT_DOCUMENT_ANALYSIS.md` 작성
3. 커밋 + 푸시 (develop)
4. 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
