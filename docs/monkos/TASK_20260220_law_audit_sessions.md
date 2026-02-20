---
type: task
from: 쌍아
to: 막내 1호
date: 2026-02-20 05:42 KST
status: open
priority: high
tags: [audit, sessions, law-system, overnight]
---

# 지시서: 세션 로그 전수 조사 — 규칙 결정 연대기 추출

[2026-02-20 05:42 KST] M1/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

---

## 목적

CLAUDE.md 헌법/법률/규정 3계층 분리를 위한 **근거 조사**.
현재 CLAUDE.md 372줄에 온갖 규칙이 혼재되어 있다. 각 규칙이 **언제, 왜, 어떤 맥락에서** 결정되었는지를 세션 로그에서 발굴하여 연대기로 정리하라.

막내 2호가 동시에 **현행 문서 체계 해부**를 진행 중이다. 파일 충돌 없음.

---

## 조사 대상

세션 로그 **40개** 전수:

### 2026-01 (24개)
```
docs/corpus/sessions/2026-01/20260108_session.md
docs/corpus/sessions/2026-01/20260111_session.md
docs/corpus/sessions/2026-01/20260112_day_session.md
docs/corpus/sessions/2026-01/20260112_night_full_session.md
docs/corpus/sessions/2026-01/20260113_session.md
docs/corpus/sessions/2026-01/20260114_session.md
docs/corpus/sessions/2026-01/20260115_session.md
docs/corpus/sessions/2026-01/20260116_session.md
docs/corpus/sessions/2026-01/20260117_session.md
docs/corpus/sessions/2026-01/20260118_gemini.md
docs/corpus/sessions/2026-01/20260118_session.md
docs/corpus/sessions/2026-01/20260119_session.md
docs/corpus/sessions/2026-01/20260121_session.md
docs/corpus/sessions/2026-01/20260122_session.md
docs/corpus/sessions/2026-01/20260123_session.md
docs/corpus/sessions/2026-01/20260124_session.md
docs/corpus/sessions/2026-01/20260125_session.md
docs/corpus/sessions/2026-01/20260126_session.md
docs/corpus/sessions/2026-01/20260127_session.md
docs/corpus/sessions/2026-01/20260128_session.md
docs/corpus/sessions/2026-01/20260129_session.md
docs/corpus/sessions/2026-01/20260130_pwa_session.md
docs/corpus/sessions/2026-01/20260130_session.md
docs/corpus/sessions/2026-01/20260131_session.md
```

### 2026-02 (16개)
```
docs/corpus/sessions/2026-02/20260201_session.md
docs/corpus/sessions/2026-02/20260203_session.md
docs/corpus/sessions/2026-02/20260207_session.md
docs/corpus/sessions/2026-02/20260208_session.md
docs/corpus/sessions/2026-02/20260209_session.md
docs/corpus/sessions/2026-02/20260210_session.md
docs/corpus/sessions/2026-02/20260211_session.md
docs/corpus/sessions/2026-02/20260212_session.md
docs/corpus/sessions/2026-02/20260213_session.md
docs/corpus/sessions/2026-02/20260214_session.md
docs/corpus/sessions/2026-02/20260215_session.md
docs/corpus/sessions/2026-02/20260216_session.md
docs/corpus/sessions/2026-02/20260217_session.md
docs/corpus/sessions/2026-02/20260218_session.md
docs/corpus/sessions/2026-02/20260219_session.md
docs/corpus/sessions/2026-02/20260220_session.md
```

---

## 추출 기준

각 세션에서 아래 유형에 해당하는 내용을 추출:

### A. 절대 규칙 (헌법급)
- "절대 준수", "금지", "필수", "반드시" 등 강제 표현이 붙은 결정
- 보안/인프라 보호 관련 결정
- 에이전트 역할/권한 체계 결정

### B. 운용 규칙 (법률급)
- 코딩 표준/네이밍 결정
- 배포 절차/브랜치 전략 결정
- 세션 로그/문서 구조 결정
- 커밋 규칙, 보고 형식 결정
- MUSE 체계/네이밍 결정

### C. 기술 결정 (규정급)
- 특정 API/모델 선택
- 특정 도구/프레임워크 선택
- 특정 아키텍처 결정 (MPA 분리 등)
- 단가/크레딧 결정

### D. 폐기/변경된 규칙
- 이전에 결정되었으나 이후 변경/폐기된 것
- 변경 이유가 있으면 반드시 기록

---

## 산출물

파일: `docs/infrastructure/LAW_AUDIT_SESSION_CHRONICLE.md`

### 형식

```markdown
# 세션 로그 규칙 연대기 (전수 조사)

[2026-02-20 HH:MM KST] M1/막내1

## 조사 요약
- 조사 대상: 세션 40개
- 추출된 규칙 결정: N건
- 헌법급: N건 / 법률급: N건 / 규정급: N건 / 폐기: N건

---

## 연대기 (시간순)

### 2026-01-08
**세션**: 20260108_session.md
| # | 분류 | 결정 내용 | 작가님 원문 (있으면) | 현재 CLAUDE.md 반영 여부 |
|---|------|----------|---------------------|------------------------|
| 1 | 헌법 | ... | "..." | ✅ 반영 / ❌ 미반영 / 🔄 변경됨 |

### 2026-01-11
...

---

## 폐기/변경 이력

| 원래 규칙 | 결정일 | 변경일 | 변경 내용 | 이유 |
|-----------|--------|--------|----------|------|
| ... | ... | ... | ... | ... |

---

## 미반영 규칙 (세션에서 결정되었으나 CLAUDE.md에 없는 것)

| # | 결정일 | 내용 | 분류 | 비고 |
|---|--------|------|------|------|
| ... | ... | ... | ... | ... |
```

### 핵심 원칙
1. **작가님 직접 발화를 최우선 근거로 인용** — "..." 형태로
2. 쌍아/막내가 제안한 것 vs 작가님이 결정한 것 구분
3. 규칙 간 충돌이 발견되면 반드시 표시
4. CLAUDE.md 현재 내용(372줄)과 대조하여 반영 여부 표시

---

## 참조: CLAUDE.md 현재 주요 섹션 (대조용)

대조를 위해 현재 CLAUDE.md의 대략적 구조:
- 1규칙: 타임스탬프 + 수발신
- 프로젝트 개요
- 4 MUSE 시스템
- AI 페르소나 (에이전트 정의, 관계, 지시서 규칙, alias, 디바이스, 운용환경, 세션저장)
- 응답 규칙
- 2규칙: 완료 보고
- 코딩 규칙
- 인프라 보호 규칙
- 세션 로그 규칙
- 파일/폴더 규칙
- MONKOS Factory 막내 규칙 (배포, 브랜치, 금지, 자유범위, 에스컬레이션, 커밋, 보고, MEMORY)
- 참조 문서

---

## 작업 방법 제안

40개를 효율적으로 처리하기 위해:
1. 각 파일을 순차 읽기
2. 규칙 결정에 해당하는 부분만 추출 (일반 작업 내용은 스킵)
3. 빈 세션(규칙 결정 없음)은 "규칙 결정 없음" 1줄로 기록
4. 대형 세션(2/17, 2/18, 2/19 등)은 꼼꼼하게 — 이 시기에 대규모 결정이 집중됨

---

## 규칙

- **브랜치**: develop
- **커밋**: `[docs] 세션 전수 조사 — 규칙 결정 연대기 추출`
- **금지**: main 푸시, prod 배포, .env 수정, 코드 수정 (조사만)
- **에스컬레이션**: 세션 파일 손상/누락 발견 시 보고
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기

## 완료 기준

**조사+보고** (레벨 1) → 이후 **실행+커밋** (레벨 2)
1. 40개 세션 전수 조사 완료
2. `LAW_AUDIT_SESSION_CHRONICLE.md` 작성
3. 커밋 + 푸시 (develop)
4. 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
