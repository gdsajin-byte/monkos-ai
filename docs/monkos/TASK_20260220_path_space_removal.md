---
type: task
from: 쌍아
to: 막내 1호
date: 2026-02-20 05:03 KST
status: open
priority: high
tags: [infra, path, root-cause, 전수조사]
---

# 지시서: 프로젝트 경로 공백 근본 제거

[2026-02-20 05:03 KST] M1/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

---

## 배경

프로젝트 루트 경로에 **후행 공백(trailing space)** 존재:
```
현재: /Users/developer/monk_project /    ← 끝에 공백 1칸
목표: /Users/developer/monk_project/     ← 공백 제거
```

이 공백이 반복적으로 문제를 일으키고 있음:
- wrangler pages deploy 시 tmp 경로 해석 실패 (functionsWorker 빌드 에러)
- 각종 CLI 도구에서 경로 파싱 오류
- 과거에도 여러 번 충돌 발생

## 작업 내용

### Phase 1: 전수조사 (코드 수정 전)

아래 항목을 **전부** 조사하여 보고서를 작성하라.

#### 1-1. 현재 경로 참조 전수 스캔
```bash
# 프로젝트 내부에서 절대 경로 참조하는 곳
grep -r "monk_project " . --include="*.js" --include="*.json" --include="*.toml" --include="*.yaml" --include="*.yml" --include="*.sh" --include="*.md" -l

# 숨김 파일 포함
grep -r "monk_project " .git/config .gitmodules 2>/dev/null

# wrangler 설정
cat wrangler.toml
```

#### 1-2. 외부 참조 조사
```bash
# symlink 확인 (프로젝트를 가리키는 외부 심링크)
find /tmp -lname "*monk_project*" 2>/dev/null
find /Users -maxdepth 3 -lname "*monk_project*" 2>/dev/null

# Claude Code 프로젝트 설정
ls ~/.claude/projects/ | grep monk
cat ~/.claude/projects/*/settings.json 2>/dev/null

# VSCode workspace 설정
find /Users -name "*.code-workspace" -maxdepth 4 2>/dev/null
```

#### 1-3. Git 설정 확인
```bash
git remote -v
git config --local --list
cat .git/config
```

#### 1-4. 프로세스 의존 확인
```bash
# 현재 이 경로를 사용 중인 프로세스
lsof +D "/Users/developer/monk_project " 2>/dev/null | head -20

# tmux 세션에서 해당 경로 사용 여부
tmux list-sessions 2>/dev/null
```

#### 1-5. 공백 없는 동명 디렉토리 존재 확인
```bash
# "monk_project" (공백 없음)가 이미 존재하는지
ls -la /Users/developer/ | cat -A | grep monk
```

### Phase 2: 영향도 분석 보고

전수조사 결과를 아래 표로 정리:

| 참조 위치 | 파일/설정 | 현재 값 | 수정 필요 | 위험도 |
|-----------|----------|---------|----------|--------|
| (예시) .git/config | core.worktree | /Users/developer/monk_project / | Yes | Low |
| ... | ... | ... | ... | ... |

### Phase 3: 실행 계획 수립

조사 결과를 바탕으로 **안전한 이름 변경 절차**를 설계하라:

1. 사전 조건 (닫아야 할 프로세스, 백업 등)
2. 실행 순서 (mv → 참조 수정 → 검증)
3. 롤백 방법
4. 검증 체크리스트

**Phase 3까지는 조사+계획만. 실행하지 마라.**

---

## 규칙

- **브랜치**: develop
- **커밋**: 이 작업은 코드 수정 없음 (조사 보고만)
- **금지**: main 푸시, prod 배포, .env 수정, 실제 mv 실행
- **에스컬레이션**: 예상 외 의존성 발견 시 즉시 보고
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기

## 완료 기준

**조사+보고** (레벨 1)
- Phase 1~3 결과를 이 파일에 append 하거나 별도 보고서로 작성
- 코드 수정/mv 실행 절대 금지 — 보고 후 작가님 승인 대기
- 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
