---
type: task
from: 쌍아
to: 막내 1호
date: 2026-02-20 05:32 KST
status: open
priority: high
tags: [infra, cleanup, symlink, docs, memory]
---

# 지시서: mv 후 잔여 정리 (symlink + 유령dir + 기술명세 + 파일정리 + MEMORY)

[2026-02-20 05:32 KST] M1/쌍아 → 막내 1호

## 역할 선언
> **너는 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

---

## 배경

2/20 야간, 프로젝트 경로 공백 제거 mv 완료 + VSCode/Claude 리셋 완료.
새 경로 `/Users/developer/monk_project/`에서 Claude Code 정상 진입, MEMORY.md 로딩 확인됨.

**그러나 mv 후 잔여 작업 6건이 남아있다.**

---

## Step 1: symlink 재생성 (최우선)

현재 상태:
```
/tmp/monk-kr-deploy → /Users/developer/monk_project/MONK_kr  (구 경로, 공백 포함 → 깨져있음)
```

실행:
```bash
ln -sfn "/Users/developer/monk_project/MONK_kr" /tmp/monk-kr-deploy
```

검증:
```bash
readlink /tmp/monk-kr-deploy   # /Users/developer/monk_project/MONK_kr 출력 확인
ls /tmp/monk-kr-deploy/        # MONK_kr 파일 목록 출력 확인
```

**이유**: 이 symlink이 monk.kr Production 배포 경로. 깨져있으면 배포 불가.

---

## Step 2: 구 Claude projects 디렉토리 삭제

현재 상태:
```
~/.claude/projects/-Users-developer-monk-project-/   ← 구 (유령, 2파일만)
~/.claude/projects/-Users-developer-monk-project/    ← 신 (110+ 세션, MEMORY.md 보존)
```

구 디렉토리의 2개 jsonl은 mv 후 리셋 과정에서 생긴 임시 파일. 삭제 안전함.

실행:
```bash
rm -rf ~/.claude/projects/-Users-developer-monk-project-/
```

검증:
```bash
ls ~/.claude/projects/ | grep monk
# -Users-developer-monk-project  만 남아야 함
```

---

## Step 3: 기술명세 작성

파일: `docs/infrastructure/TECHNICAL_SPEC_20260220.md`

이전 지시서(TASK_20260220_docs_and_rename.md) Step A가 미실행 상태.
아래 내용을 포함하여 작성:

### 3-1. CF Pages 배포 체계 변경
- **이전**: GitHub 웹훅 자동빌드 (push → 자동 deploy)
- **이후**: 자동빌드 OFF, 수동 배포만 (`wrangler pages deploy`)
- 변경 이유: 멀티 에이전트 환경에서 push=배포 통제 불가
- Production 배포 명령:
  ```bash
  cd /tmp && npx wrangler pages deploy /tmp/monk-kr-deploy --project-name monk-kr --branch main --commit-dirty=true
  ```
- symlink: `ln -sfn "/Users/developer/monk_project/MONK_kr" /tmp/monk-kr-deploy`
- 환경 매핑: `--branch main` = Production(monk.kr), 미지정 = Preview

### 3-2. photolab MPA 현재 상태
- 6페이지 구조: index(랜딩) → prep → camera → result → thankyou → options
- QC 파이프라인 제거됨 (사전분석 → 생성 → 바로 결과)
- 크레딧: 생성 1c(₩1,500) + 다운로드 8c(₩12,000) = 9c(₩13,500)
- 관련 커밋: `b02930b`, `cc628a0`

### 3-3. 경로 공백 제거 완료
- 문제: `/Users/developer/monk_project/` (후행 공백)
- 해결: mv → `/Users/developer/monk_project/`
- 기능성 파일 수정: `scripts/sync_visitors_to_gcs.sh`, `scripts/sync_to_gcs.sh`, `package-lock.json`
- Claude projects dir: 자연 생성 확인 → 구 dir 삭제
- symlink 재생성 완료
- 관련 커밋: `2fc1afb`, `dd71a75`

### 3-4. CLAUDE.md 체계화 예정
- 현재: 헌법/법률/규정이 CLAUDE.md 한 파일에 혼재
- 과제: 3계층 분리 (다음 세션 착수 예정)

---

## Step 4: 루트 방치 파일 정리

현재 상태: 루트에 `20260216_session.md` 방치 중 (규칙: 루트에 임시 .md 파일 방치 금지)

실행:
```bash
# 내용 확인 후 적절한 위치로 이동
mv 20260216_session.md docs/corpus/sessions/2026-02/
```

이미 `docs/corpus/sessions/2026-02/20260216_session.md`가 있으면 내용 비교 후 판단:
- 동일하면 루트 것 삭제
- 다르면 루트 것의 내용을 기존 파일에 append 또는 별도 이름으로 보존

---

## Step 5: MEMORY.md 정리 (200줄 이하)

현재 223줄 → **200줄 초과 경고 발생 중** (하단 23줄 잘림)

정리 방침:
1. 하단의 **"지시서 작성 규칙"** 상세 (190~219줄) → `~/.claude/projects/-Users-developer-monk-project/memory/task_rules.md`로 분리
2. MEMORY.md에는 해당 섹션 1줄 링크만 남김: `- 상세: task_rules.md 참조`
3. **"프로젝트 구조"** 섹션 (221~223줄)은 MEMORY.md에 유지 (짧으므로)
4. 정리 후 200줄 이하 확인

---

## Step 6: 세션로그 업데이트 + 커밋

### 6-1. 세션로그 append
파일: `docs/corpus/sessions/2026-02/20260220_session.md`

기존 끝(`---세션 기록 시점: 05:25 KST`)을 삭제하고 아래로 교체:

```markdown
### mv 완료 검증 (05:26~05:31)

작가님이 VSCode/iTerm 전부 종료 → mv 실행 → 새 경로로 재오픈.

| 항목 | 결과 |
|------|------|
| Claude Code 진입 | ✅ MEMORY.md 로딩 확인 |
| git status | ✅ develop 브랜치 정상 |
| 경로 확인 | ✅ `/Users/developer/monk_project/` (공백 없음) |

## 세션 5: mv 후 잔여 정리 (05:32~)

[2026-02-20 05:32 KST] M1/막내1

### 작업 내용
- symlink 재생성 (`/tmp/monk-kr-deploy`)
- 구 Claude projects dir 삭제
- 기술명세 작성 (`TECHNICAL_SPEC_20260220.md`)
- 루트 방치 파일 정리 (`20260216_session.md`)
- MEMORY.md 200줄 이하 정리

## TODO (업데이트)
- [x] 경로 공백 제거 mv 실행
- [x] mv 후 잔여 정리 (symlink, 유령dir, 기술명세, 파일정리, MEMORY)
- [ ] 모바일 E2E 테스트
- [ ] CLAUDE.md 헌법/법률/규정 3계층 분리
- [ ] 랜딩 페이지 디자인 2차 이터레이션
```

### 6-2. 커밋 + 푸시

```bash
git add docs/infrastructure/TECHNICAL_SPEC_20260220.md \
        docs/corpus/sessions/2026-02/20260220_session.md \
        docs/monkos/TASK_20260220_docs_and_rename.md \
        docs/monkos/TASK_20260220_post_mv_cleanup.md \
        monkos_AI/idphoto-kr/.gitignore
# 20260216_session.md 이동분도 add

git commit -m "[docs] mv 후 정리 완료 — symlink재생성 + 기술명세 + MEMORY정리 + 파일정리"
git push origin develop
```

---

## 규칙

- **브랜치**: develop
- **커밋**: `[docs]` 접두사
- **금지**: main 푸시, prod 배포, .env 수정
- **에스컬레이션**: 예상치 못한 파일 발견 시 `⏳ 대기` 보고
- **MEMORY.md 확인 의무**: 작업 전 반드시 읽기
- **실행 순서**: Step 1 → 2 → 3 → 4 → 5 → 6 (순차)

## 완료 기준

**실행+커밋** (레벨 2)
- Step 1~5: 전부 실행 완료
- Step 6: 세션로그 + 커밋 + 푸시
- 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)
