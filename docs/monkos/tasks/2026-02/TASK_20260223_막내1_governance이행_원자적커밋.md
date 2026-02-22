---
type: task
id: TASK_20260223_막내1_governance이행
from: 쌍아
to: 막내1
date: 2026-02-23 00:10 KST
priority: P0
status: pending
tags: [constitutional-amendment, governance, migration, atomic-commit]
depends_on: null
blocks: [TASK_20260223_막내2, TASK_20260223_막내3]
---

# 지시서: governance/ 물리 이행 — 원자적 단일 커밋

> **근거**: 2026-02-22 PM3 세션 — 헌법 개정안 만장일치 통과 (5/5)
> **성격**: 헌법 개정 이행. 본 작업은 **다른 막내보다 먼저 완료**되어야 한다.
> **핵심 원칙**: 모든 파일 이동 + 경로 갱신을 **단일 커밋**으로 실행 (법적 공백 방지)

---

## 1. 작업 개요

만장일치 통과된 헌법 개정 4건을 물리적으로 이행한다:

| 개정 | 이행 내용 |
|------|----------|
| 개정1 | governance/ 디렉토리 트리 신설 |
| 개정2 | 제12조(개정 청구권) CLAUDE.md에 삽입 |
| 개정3 | 제13조(문서 규격 준수) CLAUDE.md에 삽입 |
| 개정4 | 법률 인덱스 경로 변경 (docs/infrastructure/laws/ → governance/laws/) |

---

## 2. 실행 단계 (순서 엄수)

### S1. governance/ 디렉토리 트리 생성

```bash
mkdir -p governance/laws
mkdir -p governance/constitution/petitions
mkdir -p governance/history
mkdir -p governance/philosophy
```

각 디렉토리에 README.md 생성 (최소한):

```markdown
# [디렉토리명]
> governance/ 하위. 2026-02-23 헌법 개정에 의해 신설.
```

### S2. 법률 파일 이동 (8건)

```bash
git mv docs/infrastructure/laws/ch1_agent_system.md governance/laws/
git mv docs/infrastructure/laws/ch2_coding.md governance/laws/
git mv docs/infrastructure/laws/ch3_session_log.md governance/laws/
git mv docs/infrastructure/laws/ch4_docs_structure.md governance/laws/
git mv docs/infrastructure/laws/ch5_deployment.md governance/laws/
git mv docs/infrastructure/laws/ch6_git.md governance/laws/
git mv docs/infrastructure/laws/ch7_makne_code.md governance/laws/
git mv docs/infrastructure/laws/ch8_branding.md governance/laws/
```

### S3. 개정 절차 문서 이동 (1건)

```bash
git mv docs/infrastructure/constitution/amendment.md governance/constitution/
```

### S4. 청구서 이동 (2건)

```bash
git mv monkos-ops/03_개발/tasks/PETITION_20260222_막내5_법률개정청구_3건.md governance/constitution/petitions/
git mv monkos-ops/03_개발/tasks/PETITION_20260222_막내6_법체계자동집행기반.md governance/constitution/petitions/
```

### S5. 철학 문서 이동

```bash
git mv monkos-ops/01_전략/philosophy/PHILOSOPHY.md governance/philosophy/
git mv monkos-ops/01_전략/philosophy/README.md governance/philosophy/README_legacy.md
```

※ `monkos-ops/01_전략/philosophy/indexes/` 하위 파일이 있다면 함께 이동

### S6. CLAUDE.md 갱신 — 법률 인덱스 경로 (8건)

**현행** (CLAUDE.md 법률 인덱스 테이블):
```
| 제1장 | 에이전트 체계 | [ch1_agent_system.md](docs/infrastructure/laws/ch1_agent_system.md) | 4조 |
```

**변경**:
```
| 제1장 | 에이전트 체계 | [ch1_agent_system.md](governance/laws/ch1_agent_system.md) | 4조 |
```

전 8장 동일 패턴으로 변경:
- `docs/infrastructure/laws/ch1_agent_system.md` → `governance/laws/ch1_agent_system.md`
- `docs/infrastructure/laws/ch2_coding.md` → `governance/laws/ch2_coding.md`
- `docs/infrastructure/laws/ch3_session_log.md` → `governance/laws/ch3_session_log.md`
- `docs/infrastructure/laws/ch4_docs_structure.md` → `governance/laws/ch4_docs_structure.md`
- `docs/infrastructure/laws/ch5_deployment.md` → `governance/laws/ch5_deployment.md`
- `docs/infrastructure/laws/ch6_git.md` → `governance/laws/ch6_git.md`
- `docs/infrastructure/laws/ch7_makne_code.md` → `governance/laws/ch7_makne_code.md`
- `docs/infrastructure/laws/ch8_branding.md` → `governance/laws/ch8_branding.md`

### S7. CLAUDE.md 갱신 — 제12조·제13조 신설

CLAUDE.md의 `### 제11조: 윤리적 운용` 블록 **이후**에 삽입:

```markdown
### 제12조: 개정 청구권
- 모든 구성원(작가님·에이전트·팀원)은 법률·헌법의 개정을 청구할 수 있다
- 법률 개정: 쌍아+작가님 합의로 의결
- 헌법 개정: 삼권 심사 + 전원 만장일치로 의결
- 절차 상세: governance/constitution/amendment.md

### 제13조: 문서 규격 준수
- 모든 공식 문서는 법률 제4장이 정한 파일 네이밍 규칙과 YAML frontmatter를 준수한다
- 본 조항은 발효일 이후 신규 생성 문서부터 적용한다
- 긴급 장애 대응(INCIDENT) 시: 최소 필드(type, date)만으로 허용. 24시간 내 보정
- 네이밍 패턴, YAML 필수 필드, 배치 경로의 상세: 법률 제4장
```

**주의**: 헌법 서두의 "제1조~제11조" 표기를 "제1조~제13조"로 갱신할 것.

### S8. 리다이렉트 노트 생성

`docs/infrastructure/laws/README.md`:
```markdown
# ⚠️ 법률 이동 안내

법률 정본이 `governance/laws/`로 이동되었습니다.
이동일: 2026-02-23
근거: 헌법 개정안 만장일치 통과 (2026-02-22)

## 새 경로
- governance/laws/ch1_agent_system.md
- governance/laws/ch2_coding.md
- governance/laws/ch3_session_log.md
- governance/laws/ch4_docs_structure.md
- governance/laws/ch5_deployment.md
- governance/laws/ch6_git.md
- governance/laws/ch7_makne_code.md
- governance/laws/ch8_branding.md
```

`docs/infrastructure/constitution/README.md`:
```markdown
# ⚠️ 개정 절차 이동 안내

amendment.md가 `governance/constitution/`으로 이동되었습니다.
이동일: 2026-02-23
근거: 헌법 개정안 만장일치 통과 (2026-02-22)
```

### S9. MIGRATION_LOG.md 생성

프로젝트 루트 `governance/MIGRATION_LOG.md`:

```markdown
---
type: migration-log
date: 2026-02-23
author: 막내1
---

# Governance Migration Log

## 2026-02-23: 헌법 개정 이행

**근거**: 2026-02-22 PM3 세션 — 만장일치 통과 (5/5)

### 이동된 파일
| 원래 경로 | 새 경로 |
|----------|---------|
| docs/infrastructure/laws/ch1~ch8 (8건) | governance/laws/ |
| docs/infrastructure/constitution/amendment.md | governance/constitution/ |
| monkos-ops/03_개발/tasks/PETITION_*.md (2건) | governance/constitution/petitions/ |
| monkos-ops/01_전략/philosophy/PHILOSOPHY.md | governance/philosophy/ |

### CLAUDE.md 변경
- 법률 인덱스 경로 8건 갱신
- 제12조(개정 청구권) 신설
- 제13조(문서 규격 준수) 신설

### 코드(런타임) 영향: 0건
```

### S10. 단일 커밋 + push

```bash
git add -A
git commit -m "[개헌] governance/ 신설 — 헌법 개정 이행

- governance/ 디렉토리 트리 신설 (laws, constitution, history, philosophy)
- 법률 ch1~ch8 이동: docs/infrastructure/laws/ → governance/laws/
- amendment.md 이동: docs/infrastructure/constitution/ → governance/constitution/
- PETITION 2건 이동 → governance/constitution/petitions/
- PHILOSOPHY.md 이동 → governance/philosophy/
- CLAUDE.md: 제12조(개정 청구권), 제13조(문서 규격 준수) 신설
- CLAUDE.md: 법률 인덱스 경로 8건 갱신
- 리다이렉트 노트 + MIGRATION_LOG.md 생성

근거: 2026-02-22 만장일치 통과 (5/5)
Co-Authored-By: 쌍아"
git push origin develop
```

---

## 3. 검증 체크리스트

실행 완료 후 반드시 확인:

- [ ] `governance/laws/` 에 ch1~ch8 8개 파일 존재
- [ ] `governance/constitution/amendment.md` 존재
- [ ] `governance/constitution/petitions/` 에 PETITION 2건 존재
- [ ] `governance/philosophy/PHILOSOPHY.md` 존재
- [ ] CLAUDE.md 법률 인덱스 8건 전부 `governance/laws/` 경로
- [ ] CLAUDE.md 제12조·제13조 존재
- [ ] `docs/infrastructure/laws/README.md` 리다이렉트 노트 존재
- [ ] `docs/infrastructure/constitution/README.md` 리다이렉트 노트 존재
- [ ] `governance/MIGRATION_LOG.md` 존재
- [ ] git log 확인 — 단일 커밋인지 확인
- [ ] git push 성공 확인

---

## 4. 금지사항

- **다중 커밋 금지**: 반드시 단일 커밋. 중간 상태에서 커밋하면 법적 공백 발생
- **docs/ 원천 파일 삭제 금지**: git mv는 이동이지 삭제가 아님. 하지만 docs/ 내 다른 파일은 건드리지 말 것
- **monkos-ops/ 부서 재편 금지**: 본 작업 범위 밖. 번호 폴더(01_전략~06_로그) 구조는 유지
- **규정 파일 이동 금지**: CODING_STANDARDS.md, DESIGN_SYSTEM.md 등은 현 위치 유지 (후속 법률 개정 대상)

---

## 5. 완료 조건

- 검증 체크리스트 전항 통과
- 완료 보고 형식: 헌법 제2조 준수
- **이 작업이 완료되어야 막내2·막내3 작업 시작 가능**
