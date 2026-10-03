---
type: order
date: 2026-10-03
from: iMac/쌍아
to: iMac/쌍아-막내2
device: iMac
agent: 쌍아
subject: pf.py·훅 Python 3.9 호환 — M2(python3 3.9.6)에서 pf.sh 작동 불가 해소
status: 발행
portfolio: PF_MONK_OS
---

# ORDER — pf 도구·훅 Python 3.9 호환

**[2026-10-03 10:51 KST]** iMac/쌍아 → iMac/쌍아-막내2

> **출처**: M2/쌍아 10-02 세션 로그 18:39~18:50 항목. `pf.py:82`의 `dt.date | None`(PEP 604, 3.10 이상)이 M2 python3 3.9.6에서 `TypeError`를 낸다. 작가님 보고(10-03 10:48)에서 "승인 없이 막내 지시서로 처리"로 고지했다. 도구 장애 수정이라 승인 게이트 대상이 아니다.

## 1. 할 일
1. `scripts/pf.py`와 `scripts/hooks/*.py` 전체에서 3.10 이상 전용 문법을 찾아 3.9 호환으로 고친다.
   - 대상: `X | None` 주석, `match` 문, 괄호 context manager 등
   - 1순위 수단은 파일 머리에 `from __future__ import annotations`를 넣는 것이다. 런타임 평가 위치(`isinstance(x, A | B)` 등)는 `Optional`이나 튜플로 바꾼다.
2. 3.9 실측: iMac에 3.9가 있으면 그것으로(`ls /usr/bin/python3*`, `/Library/Developer/CommandLineTools/usr/bin/python3 --version` 등으로 확인), 없으면 `ssh m2`의 `python3`(3.9.6)로 확인한다. 둘 다 안 되면 `python3 -X importtime`이 아니라 **`ast.parse(..., feature_version=(3,9))`**로 문법 검사를 하고, 그 사실을 명기한다.
3. 회귀: `python3 scripts/hooks/smoke.py`, `python3 scripts/hooks/smoke_pf.py` 전부 PASS. M2에서 `scripts/pf.sh check PF_KKU`(읽기 전용) 1회 성공.
   - **M2에서는 읽기 명령만** 실행하고 파일을 쓰지 않는다.

## 2. 반환
- COMPLETION `monkos-ops/ops/reports/2026-10/COMPLETION_20261003_iMac쌍아-막내2_PF_MONK_OS_py39호환.md` (수정 위치 목록, 3.9 실측 방법·결과, smoke 건수)
- 커밋 `[fix] …` → `git pull --rebase` → 푸시 → 쌍아(`monk-project-72`)에게 1줄 `COMPLETION: {경로} {SHA8}`

## 3. 쓰기 범위
- `scripts/pf.py`, `scripts/hooks/*.py`, COMPLETION, 네 세션 로그만 쓴다.
- 공유 체크아웃에 다른 세션의 미커밋 변경이 있다(`scripts/hooks/session_start.sh`·`smoke.py` — 민아·소소). 워크트리에서 작업하고, 그 파일들은 **수정하지 않는다**(3.10 문법이 있어도 COMPLETION에 위치만 보고).

## ⚠️ 준수 조항
- 헌법 3조 1항 `date` 실측. 헌법 4조 1-2항.
- M2 원격 클론 금지(정본 경로만), M2에서 쓰기 금지.
