---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내2
subject: 개헌 시행 ② — Skills 8건 생성
priority: 최고
related:
  - governance/constitution/AMENDMENT_20260325_5축재편_개헌청구안.md
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_막내3_헌법5축_3차_Skills계층설계.md
---

# 지시서 — 개헌 시행 ② Skills 8건 생성

**[2026-03-25 15:00 KST] iMac/쌍아 → 막내2**

---

## 배경

헌법 5축 재편의 4계층 문서 위계에서 "명령" 계층을 `.claude/skills/`로 구현한다. 막내3 3차 보고서의 Skills 설계안을 기반으로 8건을 생성한다.

**핵심 원칙**: 법률 원문은 병행 유지한다. Skills는 법률의 실행형 조항을 **재구성**한 것이므로, 법률 삭제는 하지 않는다.

---

## 실행

### 디렉토리 생성

```bash
mkdir -p .claude/skills
```

### 8 Skills 파일 생성

각 Skill 파일은 아래 구조를 따른다:

```markdown
---
name: {스킬명}
description: {1줄 설명 — Claude가 트리거 매칭에 사용}
---

> 원천: {법률 조항}

{절차 본문}
```

### Skill 상세 — 반드시 해당 법률 원문을 Read하여 절차를 정확히 반영

| # | 파일 | name | description | 원천 법률 |
|---|------|------|-------------|----------|
| 1 | `session-start.md` | 세션시작 | 세션 시작 시 역할 판별, git 동기화, 보고를 수행한다 | ch1 5조 + ch3 5조 + ch7 5조 |
| 2 | `session-end.md` | 세션마감 | 세션 마감 시 로그 완료, 커밋, 푸시, CHANGELOG 갱신을 수행한다 | ch3 3조 + ch3 1조 |
| 3 | `order-write.md` | 지시서발행 | 지시서 작성 시 역할 선언, YAML, 엔드라인, 링크 제시 절차를 수행한다 | ch1 3조 |
| 4 | `deploy-cf.md` | CF배포 | monk.kr CF Pages 배포 절차를 수행한다 | ch5 1조 |
| 5 | `deploy-cr.md` | CR배포 | monkos.ai Cloud Run 배포 절차를 수행한다 | ch5 2조 + 3조 |
| 6 | `makne-finish.md` | 막내마무리 | 막내 작업 완료 시 보고 파일 생성, 커밋, 푸시 절차를 수행한다 | ch7 1조 |
| 7 | `escalation.md` | 에스컬레이션 | 에러 반복, 모호한 지시, 충돌 등 7가지 상황별 대응 절차를 수행한다 | ch7 4조 |
| 8 | `registry-add.md` | 레지스트리편입 | 에이전트, 디바이스, 서비스 등 6종 편입 절차를 수행한다 | ch4 6조 |

### 작성 규칙

1. **법률 원문을 반드시 Read**한 뒤 절차를 작성. 추측 금지.
2. 각 절차 단계에 번호를 매기고, 에이전트가 순서대로 실행 가능하게 작성.
3. `> 원천: ch7 1조` 형태로 출처를 명시하여 법률과의 추적성 확보.
4. MEMORY.md에 있는 관련 절차(세션 시작/마감 프로세스, 지시서 운용 원칙 등)도 참조하되, **MEMORY.md는 수정하지 않는다** (MEMORY.md 정리는 별도).

---

## 검증

- [ ] `.claude/skills/` 에 8개 파일 존재
- [ ] 각 파일에 YAML frontmatter (name, description) 존재
- [ ] 각 파일에 `> 원천:` 법률 참조 존재
- [ ] 절차가 번호 매겨진 실행 가능한 순서인지

## 산출물

- `.claude/skills/` 디렉토리 + 8개 마크다운 파일

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키/비밀정보 절대 생성 금지
- 헌법 1조 1항: 타임스탬프 `date` 명령 취득
- 헌법 1조 2항: 완료 보고 필수
- **법률 원문을 수정/삭제하지 말 것** — 병행 유지 원칙
- **커밋하지 말 것** — 3건 지시서 전부 완료 후 쌍아가 통합 커밋 지시
