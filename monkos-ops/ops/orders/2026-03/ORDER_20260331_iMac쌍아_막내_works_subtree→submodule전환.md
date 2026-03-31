---
type: order
from: iMac/쌍아
to: 막내
date: 2026-03-31
priority: 🟠 P1
subject: works 연동 방식 전환 — git subtree → git submodule
related: MEMORY.md (works subtree 운용 규정)
---

# 지시서: works subtree → submodule 전환

**[2026-03-31 19:17 KST] iMac/쌍아 → 막내**

---

## 배경

현행 `git subtree push`는 본진 전체 커밋(현재 1,441건)을 매번 전수 스캔하여 works 변경을 추출한다. 커밋이 쌓일수록 시간이 기하급수적으로 증가하여 현재 10분 타임아웃에도 실패하는 상태. 팀원 works 레포 동기화가 불가능해졌다.

**작가님 결정**: subtree → submodule 전환 (2026-03-31)

---

## 현행 구조

```
monk_project (본진)
├── monkos-ops/works/          ← subtree (origin-works remote)
│   └── (파일이 본진에 복사되어 있음)
├── scripts/mk-push.sh         ← git subtree push 명령
└── scripts/mk-pull.sh         ← git subtree pull 명령

origin-works = git@github.com:gdsajin-byte/monkos-works.git
```

## 목표 구조

```
monk_project (본진)
├── monkos-ops/works/          ← submodule (같은 레포, 포인터만)
│   └── .git (독립 레포)
├── .gitmodules                 ← submodule 설정
├── scripts/mk-push.sh         ← submodule push 명령
└── scripts/mk-pull.sh         ← submodule pull 명령

팀원 디바이스: ~/Desktop/works/ ← 변경 없음 (같은 레포 clone)
```

---

## 작업 순서

### ⚠️ 전제: subtree push 완료 확인

작업 시작 전 works 레포가 최신인지 확인:

```bash
# works 레포 최신 커밋 확인
git ls-remote origin-works main | head -1
```

미완료 시 이 지시서 실행 보류 → 쌍아에게 보고.

---

### 작업 1: subtree 제거

```bash
cd $(git rev-parse --show-toplevel)

# 1-1. 현재 works 내용 백업 (안전장치)
cp -r monkos-ops/works /tmp/works-backup-$(date +%Y%m%d)

# 1-2. subtree로 관리되던 works 폴더 삭제 (git에서만)
git rm -r monkos-ops/works

# 1-3. origin-works 리모트 제거
git remote remove origin-works
```

**주의**: `git rm -r`은 git 추적에서만 제거. `/tmp/` 백업이 있으므로 안전.

---

### 작업 2: submodule 추가

```bash
# 2-1. 같은 레포를 submodule로 등록
git submodule add git@github.com:gdsajin-byte/monkos-works.git monkos-ops/works

# 2-2. submodule 초기화 + 체크아웃
git submodule update --init --recursive

# 2-3. submodule이 main 브랜치를 추적하도록 설정
cd monkos-ops/works
git checkout main
cd ../..

# 2-4. .gitmodules에 branch 설정 추가
git config -f .gitmodules submodule.monkos-ops/works.branch main
```

---

### 작업 3: mk-push.sh 수정

```bash
#!/bin/bash
# mk-push: monk_project main + monkos-works submodule 동시 push
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/3] works submodule push ==="
cd monkos-ops/works
git add -A
if git diff --cached --quiet; then
  echo "works 변경 없음 — skip"
else
  git commit -m "[works] $(date +%Y-%m-%d) 동기화"
  git push origin main
  echo "✅ works push 완료"
fi
cd ../..

echo ""
echo "=== [2/3] submodule 참조 갱신 ==="
git add monkos-ops/works
if ! git diff --cached --quiet; then
  git commit -m "[sync] works submodule 참조 갱신"
fi

echo ""
echo "=== [3/3] main push ==="
git push origin main

echo ""
echo "✅ main + works 동시 push 완료"
```

---

### 작업 4: mk-pull.sh 수정

```bash
#!/bin/bash
# mk-pull: monk_project main + monkos-works submodule 동시 pull
# 삭제 금지 — 쌓기만 하는 구조

set -e

cd "$(git rev-parse --show-toplevel)"

echo "=== [1/2] main pull ==="
git pull origin main

echo ""
echo "=== [2/2] works submodule pull ==="
git submodule update --remote --merge monkos-ops/works

echo ""
echo "✅ main + works 동시 pull 완료"
```

---

### 작업 5: 커밋 + push

```bash
git add .gitmodules monkos-ops/works scripts/mk-push.sh scripts/mk-pull.sh
git commit -m "[infra] works 연동 subtree→submodule 전환 — push 성능 해소"
git push origin main
```

---

### 작업 6: 검증

```bash
# 6-1. submodule 상태 확인
git submodule status

# 6-2. works 폴더 내용 확인 (파일 존재)
ls monkos-ops/works/

# 6-3. mk-push.sh 테스트 (dry run)
cd monkos-ops/works && git status && cd ../..

# 6-4. mk-pull.sh 테스트
bash scripts/mk-pull.sh
```

---

## 영향 범위

| 대상 | 영향 |
|------|------|
| **본진 (monk_project)** | subtree → submodule. mk-push/pull 스크립트 변경 |
| **팀원 (~/Desktop/works/)** | **변경 없음** — 같은 레포 clone |
| **M1** | 다음 pull 시 `git submodule update --init` 1회 필요 |
| **MEMORY.md** | works subtree 운용 규정 → submodule로 갱신 필요 |

---

## ⚠️ 준수 조항

- 헌법 제4조 2항: `monkos-ops/works/` 내 파일 삭제 금지 — git rm은 subtree 연동 해제 목적이며, submodule로 즉시 재연결
- `/tmp/` 백업 필수 — 전환 중 데이터 유실 방지
- 전환 완료 후 `/tmp/works-backup-*` 삭제는 검증 후 작가님 승인

## 완료 기준

- [ ] subtree 제거 (git rm + remote remove)
- [ ] submodule 추가 + main 브랜치 추적
- [ ] mk-push.sh 수정
- [ ] mk-pull.sh 수정
- [ ] 커밋 + push
- [ ] submodule 상태 검증
- [ ] 완료 보고 (`✅❌💡⏳📁🔀`)
