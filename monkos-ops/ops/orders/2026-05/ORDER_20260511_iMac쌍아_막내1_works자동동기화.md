---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-05-11
project: works 자동 동기화
priority: 높음
portfolio: PF_AUTOPILOT
deadline: 금일 내
---

# 지시서: works submodule 자동 동기화 Action

## 배경

- `monkos-ops/works/`는 submodule (`gdsajin-byte/monkos-works`, main 브랜치)
- 한송이(M4)가 works 레포에 push하면, 본진에서 수동으로 `scripts/mk-pull.sh` 실행해야 반영
- 이 수동 단계를 Actions로 자동화한다

## 아키텍처

```
monkos-works 레포 (한송이 push)
  → repository_dispatch 이벤트 발신
  → monk_project 레포의 Action 트리거
  → git submodule update
  → 참조 갱신 커밋 + push
```

단, repository_dispatch는 별도 레포에 Action이 필요하므로, 더 간단한 방법:

```
monk_project 레포 — cron (매시간 또는 6시간)
  → git submodule update --remote monkos-ops/works
  → 변경 있으면 커밋 + push
  → 변경 없으면 skip
```

## 임무

### 1. 워크플로우 — `.github/workflows/sync-works.yml`

```yaml
name: Sync Works Submodule

on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다
  workflow_dispatch:  # 수동 실행

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Update submodule
        run: |
          git submodule update --remote monkos-ops/works

      - name: Check for changes
        id: check
        run: |
          if git diff --quiet; then
            echo "changed=false" >> $GITHUB_OUTPUT
          else
            echo "changed=true" >> $GITHUB_OUTPUT
          fi

      - name: Commit and push
        if: steps.check.outputs.changed == 'true'
        run: |
          git config user.name "monkos-autopilot"
          git config user.email "autopilot@monkos.ai"
          git add monkos-ops/works
          git commit -m "[sync] works submodule 자동 갱신"
          git push
```

### 2. 동작 확인

- `workflow_dispatch`로 수동 실행
- works에 변경이 있으면 커밋 생성 확인
- 변경이 없으면 조용히 skip 확인

## ⚠️ 준수 조항

- **ch6**: 커밋 메시지 `[sync]` 카테고리
- submodule 참조만 갱신. works 내부 파일 수정 금지
- `mk-pull.sh`는 삭제하지 않음 (수동 경로 보존)

## 완료 기준

- [ ] `sync-works.yml` 워크플로우 배치
- [ ] `workflow_dispatch` 수동 실행 → 동작 확인
- [ ] COMPLETION 보고서 → PF_AUTOPILOT 히스토리 1행 어펜드
