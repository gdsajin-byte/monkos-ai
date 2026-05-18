---
type: order
from: iMac/쌍아
to: M1/막내
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — M1 origin-works remote 등록 + mk-push/pull 스크립트 확인

**[2026-03-19 12:01 KST] iMac/쌍아 → M1/막내**

## 배경

monkos-works subtree push/pull 누락 방지를 위한 스크립트 체계 정립.
iMac에서 스크립트 작성 + 커밋 완료. M1에서 pull 후 remote만 등록하면 됨.

## Task 1: git pull + origin-works remote 등록

```bash
cd /Users/developer/monk_project
git pull origin main

# remote 등록 (이미 있으면 skip)
git remote get-url origin-works 2>/dev/null || \
  git remote add origin-works https://github.com/gdsajin-byte/monkos-works.git

git remote -v | grep works
```

## Task 2: 스크립트 동작 확인

```bash
# pull 받으면 scripts/mk-push.sh, scripts/mk-pull.sh 가 있어야 함
ls -la scripts/mk-push.sh scripts/mk-pull.sh
chmod +x scripts/mk-push.sh scripts/mk-pull.sh
```

## 완료 조건

- [ ] `git remote -v`에 `origin-works` 확인
- [ ] `scripts/mk-push.sh`, `scripts/mk-pull.sh` 실행 권한 확인

## ⚠️ 준수 조항

- works 관련 파일 삭제 절대 금지 (rsync --delete 금지, git rm 금지)
- 쌓기만 하는 구조
