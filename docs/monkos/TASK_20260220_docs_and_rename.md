---
type: task
from: 쌍아
to: 막내 1호
date: 2026-02-20 05:19 KST
status: open
priority: high
tags: [docs, infra, rename, 세션마감]
---

# 지시서: 기술명세 작성 + 세션로그 업데이트 + 경로 공백 제거 실행

[2026-02-20 05:19 KST] M1/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

---

## 배경

2/20 야간 세션에서 다음 작업이 완료됨:
- photolab MPA 구조 완성 (랜딩 분리 + QC 제거 + 크레딧 통일)
- CF Pages 자동빌드 OFF → 수동 배포 전환
- Production 수동 배포 성공 (monk.kr 반영)
- 경로 공백(`monk_project /`) 전수조사 완료 (Phase 1~3)

이 작업의 목적:
1. 현 상황을 기술명세로 기록 (막내/후속 에이전트가 컨텍스트 파악 가능하도록)
2. 세션로그 업데이트
3. 커밋+푸시 후 → 프로젝트 경로 공백 제거 mv 실행

---

## Step A: 기술명세 작성

파일: `docs/infrastructure/TECHNICAL_SPEC_20260220.md`

아래 내용을 포함하여 작성:

### A-1. CF Pages 배포 체계 변경
- **이전**: GitHub 웹훅 자동빌드 (push → 자동 deploy)
- **이후**: 자동빌드 OFF, 수동 배포만 (`wrangler pages deploy`)
- 변경 이유: 멀티 에이전트 환경에서 push=배포 통제 불가
- Production 배포 명령:
  ```bash
  cd /tmp && npx wrangler pages deploy /tmp/monk-kr-deploy --project-name monk-kr --branch main --commit-dirty=true
  ```
- symlink: `ln -sfn "/Users/developer/monk_project/MONK_kr" /tmp/monk-kr-deploy`
  (경로 공백 제거 후 기준)
- 환경 매핑: `--branch main` = Production(monk.kr), 미지정 = Preview

### A-2. photolab MPA 현재 상태
- 6페이지 구조: index(랜딩) → prep → camera → result → thankyou → options
- QC 파이프라인 제거됨 (사전분석 → 생성 → 바로 결과)
- 크레딧: 생성 1c(₩1,500) + 다운로드 8c(₩12,000) = 9c(₩13,500)
- 커밋: `b02930b`, `cc628a0`

### A-3. 경로 공백 문제 및 해결
- 문제: `/Users/developer/monk_project /` (후행 공백)
- 영향: wrangler tmp 경로 해석 실패, CLI 도구 파싱 오류
- 해결: mv로 공백 제거 + Claude projects dir rename
- 상세: `TASK_20260220_path_space_removal.md` Phase 1~3 참조

### A-4. CLAUDE.md 체계화 예정
- 현재: 헌법/법률/규정이 CLAUDE.md 한 파일에 혼재
- 과제: 3계층 분리 (경로 공백 해결 직후 착수 예정)

---

## Step B: 세션로그 업데이트

파일: `docs/corpus/sessions/2026-02/20260220_session.md`

기존 세션로그 끝에 아래 내용 append:

```markdown
## 세션 4: 경로 공백 전수조사 + 실행 계획 (05:03~05:19)

### 막내1 전수조사 결과 요약
- 프로젝트 내부: 절대경로 참조 없음 (wrangler.toml 상대경로, .git/config 영향 없음)
- 외부 symlink: `/tmp/monk-kr-deploy` 재생성 필요
- 최대 위험: Claude Code `~/.claude/projects/-Users-developer-monk-project-/` rename 필요
  - MEMORY.md + 세션 히스토리 110+개 보존 위해 디렉토리 rename 필수
- GitHub repo명: `monk_project.git` (공백 없음) → 영향 없음

### 실행 결정
- 기술명세 + 세션로그 커밋/푸시 → 모든 터미널/VSCode 종료 → mv 실행 → 자연 리셋

## TODO (업데이트)
- [x] 막내1: 경로 공백 전수조사
- [ ] 경로 공백 제거 mv 실행
- [ ] 모바일 E2E 테스트
- [ ] CLAUDE.md 헌법/법률/규정 3계층 분리
```

---

## Step C: 커밋 + 푸시

```bash
git add docs/infrastructure/TECHNICAL_SPEC_20260220.md docs/corpus/sessions/2026-02/20260220_session.md docs/monkos/TASK_20260220_docs_and_rename.md
git commit -m "[docs] 0220 기술명세 + 세션로그 업데이트 — 배포체계 변경 + MPA 현황 + 경로공백 계획"
git push origin develop
```

---

## Step D: 프로젝트 경로 공백 제거 실행

**⚠️ Step C 커밋/푸시 완료 후, 바로 실행. 모든 터미널/VSCode 종료는 작가님이 mv 완료 보고 확인 후 직접 수행.**

**흐름: 막내1이 A~D 전부 실행 → 완료 보고 → 작가님이 VSCode/iTerm 전부 종료 후 재오픈 → 새 경로로 진입 → 검증은 작가님 또는 새 막내가 수행**

### D-1. 프로젝트 디렉토리 rename
```bash
mv "/Users/developer/monk_project " "/Users/developer/monk_project"
```

### D-2. Claude Code 프로젝트 디렉토리 rename
```bash
# 현재
# ~/.claude/projects/-Users-developer-monk-project-/

# 새 경로로 Claude Code를 한 번 열어서 인코딩 확인 후 rename
# 또는 직접 rename:
mv ~/.claude/projects/-Users-developer-monk-project- ~/.claude/projects/-Users-developer-monk_project
```

**주의**: Claude Code의 정확한 인코딩 규칙을 모르므로:
1. 먼저 mv (D-1)만 실행
2. `cd /Users/developer/monk_project && claude` 실행하여 Claude Code가 어떤 디렉토리를 생성하는지 확인
3. 생성된 빈 디렉토리 삭제 → 기존 디렉토리를 정확한 이름으로 rename

### D-3. symlink 재생성
```bash
ln -sfn "/Users/developer/monk_project/MONK_kr" /tmp/monk-kr-deploy
```

### D-4. mv 후 즉시 확인 (막내1)
```bash
ls -la /Users/developer/ | grep monk   # 공백 없는 디렉토리 확인
cd /Users/developer/monk_project && git status  # git 정상
```

### D-5. 검증 체크리스트 (작가님 재오픈 후 — 막내1 범위 밖)
1. `cd /Users/developer/monk_project && claude` — Claude Code 진입 + MEMORY.md 로딩
2. `code /Users/developer/monk_project` — VSCode 정상 오픈
3. `cd /Users/developer/monk_project/MONK_kr && npx wrangler pages dev` — wrangler 정상
4. `git push origin develop` — push 정상

---

## 규칙

- **브랜치**: develop
- **커밋**: `[docs]` 접두사
- **금지**: main 푸시, prod 배포, .env 수정
- **에스컬레이션**: mv 실행 중 에러 발생 시 즉시 중단 + 보고
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기

## 완료 기준

**실행+검증** (레벨 3)
- Step A~C: 기술명세 + 세션로그 + 커밋/푸시
- Step D: 작가님 종료 확인 후 mv 실행 → 검증 체크리스트 통과
- 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
