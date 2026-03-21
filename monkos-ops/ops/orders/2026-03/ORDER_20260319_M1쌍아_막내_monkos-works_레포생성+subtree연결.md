---
type: order
from: M1/쌍아
to: M1/막내
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — monkos-works 레포 생성 + subtree 연결

**[2026-03-19 06:02 KST] M1/쌍아 → M1/막내**

## 배경

`~/Desktop/works/`를 독립 git 레포(`monkos-works`)로 전환.
각 팀원(코웍이/한/꾸)이 `~/Desktop/works/`를 clone해서 산출물을 push하고,
`monk_project/monkos-ops/works/`는 subtree로 연결해 쌍아/막내가 양방향 동기화.

```
monkos-works (GitHub private)
    ↑↓ clone/push/pull
~/Desktop/works/       ← 팀원 (코웍이/한/꾸)

    ↑↓ git subtree pull/push
monk_project/monkos-ops/works/  ← 쌍아/막내
```

---

## 사전 확인

```bash
gh auth status   # GitHub CLI 인증 상태 확인
# → 미인증이면 작업 중단 후 보고
```

---

## Task 1: monkos-works GitHub 레포 생성

```bash
# 1. monkos-ops/works/ → ~/Desktop/works/ 최신화 (--delete 없이)
#    monkos-ops/works/ 가 더 완전한 버전이므로 역방향 동기화
rsync -av --exclude='.DS_Store' --exclude='.git' \
  /Users/developer/monk_project/monkos-ops/works/ \
  ~/Desktop/works/

# 2. git 초기화
cd ~/Desktop/works/
git init -b main
git add .
git commit -m "[init] monkos-works — 팀원 소통 채널 초기화"

# 3. GitHub 레포 생성 + push
gh repo create gdsajin-byte/monkos-works --private --source=. --remote=origin --push
```

---

## Task 2: monk_project에 subtree 연결

```bash
cd /Users/developer/monk_project

# 1. remote 등록
git remote add origin-works https://github.com/gdsajin-byte/monkos-works.git

# 2. 기존 monkos-ops/works/ 제거 (subtree로 교체 준비)
git rm -r monkos-ops/works/
git commit -m "[ops] monkos-ops/works subtree 전환 준비 — 기존 파일 제거"

# 3. subtree add (--squash: 히스토리 압축)
git subtree add --prefix=monkos-ops/works origin-works main --squash

# 4. push
git push
```

---

## 완료 조건

- [ ] `gh auth status` 인증 확인
- [ ] https://github.com/gdsajin-byte/monkos-works 레포 생성 확인
- [ ] `git subtree add` 후 `monkos-ops/works/` 파일 정상 복구 확인
- [ ] `git remote -v` 에 `origin-works` 등록 확인
- [ ] `git push` 완료

## 주의

- rsync 는 `--delete` 없이 실행 (규정)
- Task 2 step 2~3 사이 일시적으로 `monkos-ops/works/` 파일 없음 — 정상
- `git rm -r` 전 Task 1 push 완료 확인 필수
