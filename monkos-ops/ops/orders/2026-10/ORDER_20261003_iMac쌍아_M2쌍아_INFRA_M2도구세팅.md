---
type: order
date: 2026-10-03
from: iMac/쌍아
to: M2/쌍아
device: iMac
agent: 쌍아
subject: M2 개발 도구를 iMac 기준에 맞게 세팅 — Python 3.10+, gitleaks, git 훅 2종, Claude Code 갱신
status: 발행
portfolio: PF_INFRA
---

# ORDER — M2 도구 세팅

**[2026-10-03 11:33 KST]** iMac/쌍아 → M2/쌍아 (꾸님 참조)

> **출처**: 작가님 원문(iMac VSCode 쌍아 세션 11:32, 사람이 입력한 턴) "우리쪽 규칙을 바꾸기보다 m2도 필요한 도구들 세팅하라고 지시해". 이것이 패키지·CLI 설치의 승인 범위다(ch1 7조 2항 예시 "패키지·CLI 설치"). 범위는 아래 §2 목록으로 한정한다. 경로 ① 직접 전달이고, 이 파일은 출처 명기이며 승인을 새로 만들지 않는다.
> **꾸님께**: 꾸님 컴퓨터(M2)에 개발 도구를 추가 설치하는 작업입니다. 사진관 작업 파일은 건드리지 않습니다.

## 1. 왜
10-02에 M2에서 `scripts/pf.sh`가 실패했다. M2 기본 `python3`이 3.9.6이라 생긴 문제다. 이번에는 iMac 쪽 코드를 3.9에 맞춰 고쳤지만(11e22cbc), 작가님 방침은 **규칙·코드를 낮추지 말고 M2를 맞추는 것**이다. 실측(iMac 쌍아 11:32, `ssh m2` 읽기 전용) 결과 M2에는 다음이 없거나 뒤처져 있다.

| 도구 | iMac | M2 | 영향 |
|---|---|---|---|
| python3 | 3.13.7 | **3.9.6** (3.10+ 없음) | `pf.sh`, 집행 훅(`.claude/settings.json`이 `python3`을 호출) |
| gitleaks | 있음 | **없음** | 커밋 시 시크릿 검사 미작동 |
| `.git/hooks/pre-commit`·`pre-push` | 설치 | **없음** | gitleaks·specs 드리프트 경고 미작동 |
| claude | 2.1.288 | 2.1.287 | 경미 |
| node / gh / git / jq / brew | 있음 | 있음 | 유지 |

## 2. 할 일 (이 목록만 — 승인 범위)
1. **Python 3.13** (`brew install python@3.13`). Claude Code 세션의 비대화형 셸과 훅이 부르는 `python3`이 3.13으로 해석되는지 확인한다. 기본 `/usr/bin/python3`(3.9)를 지우지 않는다. PATH 우선순위(`/opt/homebrew/bin` 선행)로 맞춘다. 셸 설정 파일을 고치면 바꾼 줄을 보고에 그대로 적는다.
2. **gitleaks** (`brew install gitleaks`).
3. **git 훅 2종**을 `~/monk_project/.git/hooks/`에 iMac과 같은 내용으로 설치한다.
   - `pre-commit`: `"$(git rev-parse --show-toplevel)/scripts/tools/gitleaks-precommit.sh"` 호출 (iMac 본문 그대로, 실행 권한 포함)
   - `pre-push`: `"$(git rev-parse --show-toplevel)/scripts/tools/specs_drift.sh" --hook`
4. **Claude Code 갱신** (`claude update` 또는 설치 방식에 맞는 갱신 명령).
5. **설치하지 않는 것**: gcloud. M2는 Secret Manager 접근이 필요 없는 표면이다. 시크릿·결제·인출 경로는 열지 않는다. 그 밖에 이 목록에 없는 도구가 필요해 보이면 설치하지 말고 보고한다.

## 3. 판정 기준
- `python3 --version` → 3.13.x. 대화형 셸과 Claude Code 세션 안 Bash 도구 양쪽에서 확인한다.
- `git pull` 후(11e22cbc 이상) `python3 scripts/hooks/smoke.py` 전부 PASS, `python3 scripts/hooks/smoke_pf.py` 17/17, `scripts/pf.sh check` rc 0.
- `gitleaks version` 출력. pre-commit 동작은 **커밋하지 않고** 확인한다(`scripts/tools/gitleaks-precommit.sh` 직접 실행 → "No secrets detected" 계열 출력).
- `claude --version` ≥ 2.1.288.
- `scripts/pf.sh`로 PF_KKU에 1행을 append해 실사용을 1회 확인한다(10-02 수동 어펜드 예외의 해소).

## 4. 반환
- COMPLETION `monkos-ops/ops/reports/2026-10/COMPLETION_20261003_M2쌍아_INFRA_M2도구세팅.md`. 설치한 것과 버전, PATH 변경 줄, 판정 결과를 적는다.
- 커밋·푸시 후 iMac 쌍아(`monk-project-72`)에게 1줄로 알린다.
- `references.md` 도구 맵 수정은 하지 않는다. 등재가 필요하면 iMac 쌍아가 한다.

## ⚠️ 준수 조항
- 헌법 4조 2항: 파괴적 명령 금지(기존 Python 삭제·`rm -rf` 금지). 헌법 4조 1항: 시크릿 접촉 금지.
- 헌법 3조 1항: `date` 실측.
- 정본 경로 `~/monk_project`만 쓴다(새 클론 금지).
