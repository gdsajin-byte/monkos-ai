---
type: ORDER
date: 2026-03-25
from: iMac/쌍아
to: 막내1
subject: 개헌 시행 ⑤ — works CLAUDE.md 배포 (에센스 통합 + M4/M2 에이전트 할당 강화)
priority: 최고
related:
  - monkos-ops/ops/reports/2026-03/REPORT_20260325_막내2_위성환경_실행설계안.md
  - monkos-ops/ops/templates/CONSTITUTION_ESSENCE.md
---

# 지시서 — 개헌 시행 ⑤ works CLAUDE.md 배포

**[2026-03-25 17:44 KST] iMac/쌍아 → 막내1**

---

## 배경

5축 개헌 발효 완료. 위성 환경(works 레포)에 헌법 에센스를 반영한 CLAUDE.md를 배포한다. M4(한송이)와 M2(꾸)는 works가 주 레포이므로, 이 CLAUDE.md가 그들의 유일한 헌법 접점이다.

**핵심 원칙 (작가님 지시)**:
- 에센스가 압축 헌법으로 뼈대
- 나머지 상세는 코웍이 자체 지침으로 커버
- M4/M2의 에이전트 할당을 명확히 전달하는 것이 핵심

---

## 작업 1: works/CLAUDE.md 교체

### 입력

1. 막내2 보고서 §B-1의 works CLAUDE.md 개정안 코드블록: `REPORT_20260325_막내2_위성환경_실행설계안.md`
2. 헌법 에센스 정본: `monkos-ops/ops/templates/CONSTITUTION_ESSENCE.md`
3. 현행 works CLAUDE.md: `monkos-ops/works/CLAUDE.md` (126행)

### 실행

1. 막내2 보고서의 §B-1 코드블록을 기반으로 `monkos-ops/works/CLAUDE.md`를 교체
2. **에센스 부분**: 정본(`templates/CONSTITUTION_ESSENCE.md`)의 내용을 그대로 삽입 — 보고서 코드블록과 정본이 다르면 정본 우선
3. **M4/M2 에이전트 할당 강화** — 다음 내용이 명확히 포함되어야 함:

```markdown
## 디바이스별 에이전트 할당

| 디바이스 | 소유 | 주 에이전트 | 역할 |
|---------|------|-----------|------|
| **M4** (MacBook Pro) | 한송이 | 코웍이, 민아 | SNS·마케팅, 콘텐츠 제작 |
| **M2** (Mac Mini) | 꾸 | 코웍이 | 몽크사진관 운영 |
| **iMac/M1** (본진) | 작가님 | 쌍아, 민아, 막내 | 설계·코딩·지휘 (works는 subtree로 수신) |

- M4/M2에서 열리는 에이전트는 이 CLAUDE.md를 자동 로딩한다.
- 코웍이: 주로 M4/M2에서 가동. 자체 지침(Project Instructions)에 상세 역할 정의.
- 민아: Desktop Claude Code. 본진 CLAUDE.md도 함께 읽을 수 있음.
```

4. **기존 운용 규칙 보존**: 파일명 규칙, 삭제 금지, ops only push, 폴더 트리 — 현행 works CLAUDE.md의 운용 규칙 중 유효한 것은 유지

---

## 작업 2: 기존 M4/M2 전용 지침 파일 보존

- `monkos-ops/works/han/CLAUDE_COWORK_M4.md` — **삭제하지 않는다**. 레거시로 유지.
- `monkos-ops/works/config/COWORK_GLOBAL_INSTRUCTION_M2.md` — **삭제하지 않는다**. 레거시로 유지.
- 새 works CLAUDE.md가 이들의 역할을 통합 흡수하지만, 기존 파일은 참고용으로 잔류.

---

## 검증

- [ ] `monkos-ops/works/CLAUDE.md`에 에센스 9개 조항 포함
- [ ] 에센스의 조번호가 5축 체계(제1조~제5조)와 일치
- [ ] M4/M2 에이전트 할당 테이블 포함
- [ ] 기존 운용 규칙(삭제 금지, ops only push, 파일명 규칙) 유지
- [ ] 기존 `han/CLAUDE_COWORK_M4.md`, `config/COWORK_GLOBAL_INSTRUCTION_M2.md` 미삭제

## ⚠️ 준수 조항

- 헌법 3조(적립) 1항: 타임스탬프 `date` 명령 취득
- 헌법 3조(적립) 2항: 완료 보고 필수
- 헌법 4조(구속·윤리) 2항: 파괴적 명령 금지 — 기존 파일 삭제 금지
- **커밋 포함** — 이 건은 단독 커밋 가능. 커밋 메시지: `[개헌] works CLAUDE.md 배포 — 5축 에센스 통합 + M4/M2 에이전트 할당`
