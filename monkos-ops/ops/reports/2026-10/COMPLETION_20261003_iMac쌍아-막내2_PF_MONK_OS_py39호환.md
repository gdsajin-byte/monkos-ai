---
type: completion
date: 2026-10-03
device: iMac
agent: 쌍아-막내2
status: 마감
portfolio: PF_MONK_OS
subject: "pf.py·훅 Python 3.9 호환 (ORDER_20261003 py39호환)"
---

# COMPLETION — pf 도구·훅 Python 3.9 호환

**[2026-10-03 10:53 KST]** iMac/쌍아-막내2 → iMac/쌍아

> 지시서: [ORDER_20261003_iMac쌍아_쌍아-막내2_PF_MONK_OS_py39호환.md](../../orders/2026-10/ORDER_20261003_iMac쌍아_쌍아-막내2_PF_MONK_OS_py39호환.md)

✅ **결론**: 3.10 전용 문법은 런타임 평가되는 `X | None` 주석 4곳(3파일)뿐이었다. 세 파일 머리에 `from __future__ import annotations` 추가로 해소. 3.9 실측 smoke 106/106·17/17 PASS, M2 3.9.6 실행 성공.

## 1. 수정 위치

| 파일 | 수정 | 원인 위치 |
|---|---|---|
| `scripts/pf.py` | 14행 `from __future__ import annotations` | 84 `-> dt.date \| None`, 113 `date: str \| None` |
| `scripts/hooks/_common.py` | 8행 동일 | 48 `extra: dict \| None` |
| `scripts/hooks/guard_bash.py` | 9행 동일 | 204·222 `-> str \| None` |

- `match`·괄호 context manager·`isinstance(x, A | B)`·`zip(strict=)` 등: 전수 grep 0건. `ast.parse(feature_version=(3,9))` 전 9파일 통과(수정 전에도 통과 — 문제는 문법이 아니라 정의 시점 주석 평가).
- `smoke.py`(민아·소소 미커밋 변경 대상)는 3.10 문법 0건이라 보고할 위치 없음. 미수정.

## 2. 3.9 실측

- **iMac** `/usr/bin/python3` = 3.9.6 (CLT). smoke 두 본은 하위 실행을 `sys.executable`로 하므로 3.9로 돌리면 훅·pf 전 경로가 3.9로 실행된다.
  - 대조군(수정 전 `HEAD:scripts/pf.py`를 3.9로 `check`): `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'` 재현
  - 수정 후 3.9: `smoke.py` **106/106 PASS**, `smoke_pf.py` **17/17 PASS**, `pf.py check` rc 0
  - 3.13(기본 python3) 회귀: 106/106 · 17/17 PASS
- **M2** `ssh m2` python3 3.9.6, 정본 경로 `~/monk_project`(f7851335).
  - 현행 `scripts/pf.sh check` → 동일 `TypeError` (수정 전 상태 확인)
  - 수정본을 **표준입력으로 전달**(`python3 - check < scripts/pf.py`, `CLAUDE_PROJECT_DIR=~/monk_project`) → 정상 출력, `show PF_KKU` 정상(히스토리 52행). M2 `git status --porcelain` 0건 — 쓰기 없음.

## 3. 지시서 대비 차이

- 💡 지시서의 `pf.sh check PF_KKU`는 CLI상 성립하지 않는다 — `check`는 PF 인자를 받지 않는다(`--days`·`--strict`만, 수정 전후 동일). `check`(전체) + `show PF_KKU`로 대체 실측.
- 💡 M2 체크아웃은 이 커밋을 pull해야 `pf.sh`가 실제로 고쳐진다. M2 쓰기 금지라 pull은 하지 않았다 — M2/쌍아가 다음 세션 시작 동기화에서 반영.

## 4. 커밋
- 📁 커밋 SHA는 쌍아 통지 1줄에 기재.
