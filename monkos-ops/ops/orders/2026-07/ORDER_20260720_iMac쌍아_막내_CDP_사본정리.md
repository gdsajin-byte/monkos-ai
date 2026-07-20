---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CDP
---

# 지시서: CDP 사본 이원화 정리 — 정본 단일 원칙 복원

> **[2026-07-20 14:41 KST]** iMac/쌍아 → 막내
> 작가님 승인: 2026-07-20 14:41 KST

## 배경

PF_CDP에 `scripts/tools/`의 CDP 도구 사본(3/27 스냅샷)이 존재 — 헌법 3조 4항(정본 단일 원칙) 위반. 정본은 `scripts/tools/`이며, PF_CDP 사본에만 있는 최신 수정 없음 확인 완료 (민아 사전 검증).

## Task

### Task 1 — 사본 파일 제거

PF_CDP 내 아래 3파일을 `git rm`:

- `monkos-ops/ops/portfolios/PF_CDP/cdp.sh`
- `monkos-ops/ops/portfolios/PF_CDP/cdp_utils.py`
- `monkos-ops/ops/portfolios/PF_CDP/cdp_setup.sh`

### Task 2 — 리다이렉트 노트 작성

`monkos-ops/ops/portfolios/PF_CDP/TOOLS_REDIRECT.md` 생성:

```markdown
# CDP 도구 정본 안내

> 이 디렉토리에 있던 CDP 도구 사본은 정본 단일 원칙(헌법 3조 4항)에 따라 제거됐습니다.

## 정본 위치

| 도구 | 정본 | 인지 경로 |
|------|------|----------|
| cdp.sh | `scripts/tools/cdp.sh` | `.claude/skills/cdp-browser.md` |
| cdp_utils.py | `scripts/tools/cdp_utils.py` | `.claude/skills/cdp-browser.md` |
| cdp_setup.sh | `scripts/tools/cdp_setup.sh` | `.claude/skills/cdp-browser.md` |

정본 최종 갱신: 2026-04-21 (scripts/tools/ 기준)
```

### Task 3 — PF_CDP 히스토리 어펜드

PF_CDP/README.md 히스토리에 1행:

```
| 07/20 | iMac/쌍아 | 사본 이원화 정리 — 3파일 git rm + 리다이렉트 노트. 정본: scripts/tools/ (3조 4항) | TOOLS_REDIRECT.md | ✅ |
```

## ⚠️ 준수 조항

- `scripts/tools/` 정본 파일 무접촉
- PF_CDP/README.md의 기존 히스토리 무수정 (append only)

## 완료 기준

- [ ] 사본 3파일 git rm
- [ ] 리다이렉트 노트 작성
- [ ] PF_CDP 히스토리 1행 어펜드
- [ ] COMPLETION 보고서 + 세션 로그 + 커밋 + 푸시
