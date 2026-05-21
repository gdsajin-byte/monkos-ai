---
type: completion
date: 2026-05-09
author: iMac/막내3
order: ORDER_20260509_막내6_워크트리정리_바이너리_한글폴더.md
pf: PF_MONK_OS
---

# COMPLETION — 워크트리 잔해 삭제 + 한글 빈 폴더 삭제 + 바이너리 점검

> **[2026-05-09 13:21 KST] iMac/막내3 (재활용)**

---

## 1. 워크트리 잔해 처리

### 스캔 결과

19개 워크트리 + `.claude/worktrees/` 5개 = **24개** 전수 스캔.

**본진 미반영 산출물**: 2건 발견 → 이관 완료

| 파일 | 원위치 (워크트리) | 이관 위치 (본진) |
|------|----------------|----------------|
| `2026-04-08_M1_민아.md` | `monk_project/*/monkos-ops/ops/sessions/2026-04/` | `monkos-ops/ops/sessions/2026-04/` |
| `ORDER_20260330_이의신청_HWP양식_신청대상및요지.md` | `monk_project/*/monkos-ops/ops/orders/2026-03/` | `monkos-ops/ops/orders/2026-03/` |

나머지는 모두 과거 커밋의 복사본 (본진에 이미 존재하는 ORDER/COMPLETION/REPORT).

### 삭제 결과

| 항목 | 수량 | 해방 용량 |
|------|------|----------|
| `monk_project/` 워크트리 | 19개 | ~2.3GB |
| `.claude/worktrees/` | 5개 | — |
| **합계** | **24개** | **~2.3GB** |

`git worktree remove --force`로 개별 삭제. `rm -rf` 미사용. `git worktree list` 정상 (main 1개만 남음).

---

## 2. 한글 빈 폴더 삭제

| 폴더 | 내용물 | 조치 | 상태 |
|------|--------|------|------|
| `monkos-ops/01_전략/` | 비어있음 | 삭제 | ✅ |
| `monkos-ops/02_리서치/` | .DS_Store만 | 삭제 | ✅ |
| `monkos-ops/03_개발/` | .DS_Store만 | 삭제 | ✅ |
| `monkos-ops/06_로그/` | mailbox 워처 로그 2파일 (18줄) | `ops/logs/orchestration/`으로 이관 후 삭제 | ✅ |

이관된 로그: `monkos-ops/ops/logs/orchestration/mailbox.log`, `mailbox_launchd.log`

---

## 3. 바이너리 점검 (72건, 23MB)

### 분류표

| 분류 | 파일 수 | 용량 | 위치 | 판정 제안 |
|------|--------|------|------|----------|
| **R&D PDF** | 18건 | 10MB | `tech/rnd/` (KOITA 4건 + 디딤돌 14건) | ⚠️ GDrive 원본 확인 필요. 있으면 Git 제거 대상 (Git은 바이너리 diff 불가 → 히스토리 비대화) |
| **보고서 스크린샷** | 45건 | 17MB | `ops/reports/2026-04/shots_*` | ✅ 유지 (경쟁사 분석·UX 진단 증빙) |
| **PF 리서치 스크린샷** | 8건 | 2.4MB | `ops/portfolios/PF_MONK_OS/research/assets/` | ✅ 유지 (claude.ai UI 실측 스크린샷) |
| **브랜드 에셋** | 1건 | 미미 | `ops/assets/logo/monkos-icon.svg` | ✅ 유지 (프로덕션 에셋) |

### R&D PDF 상세 (삭제 후보 18건)

| 하위 경로 | 파일 수 | 비고 |
|----------|--------|------|
| `tech/rnd/KOITA_*.pdf` | 4건 | KOITA 연구활동보고서 |
| `tech/rnd/PDF변환 디딤돌 R&D/` | 14건 | 디딤돌 R&D 공고·양식·동의서 |

**판정**: R&D PDF 18건(10MB)은 GDrive에 원본이 있을 가능성 높음. 확인 후 Git에서 제거하면 리포 히스토리 경량화 효과. 단, `git filter-branch` 또는 BFG 없이는 히스토리 내 바이너리는 남으므로, 향후 제거 시 `.gitignore`에 `*.pdf` 추가 + 신규 커밋에서 삭제가 현실적.

**보고서 스크린샷 45건(17MB)**: 경쟁사 분석·UX 진단의 증빙 자료. 보고서와 1:1 대응. 삭제 시 보고서의 시각 맥락 소실 → 유지 권장.

---

## 준수 확인

- ✅ `rm -rf` 미사용 (`git worktree remove --force` + `rmdir` + `rm` 개별)
- ✅ works/ 미접촉
- ✅ 바이너리 미삭제 (분류 + 판정 제안만)
- ✅ 타임스탬프 `date` 실측
