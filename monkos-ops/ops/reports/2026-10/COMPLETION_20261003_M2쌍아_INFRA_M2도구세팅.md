---
type: completion
date: 2026-10-03
device: M2
agent: 쌍아
order: monkos-ops/ops/orders/2026-10/ORDER_20261003_iMac쌍아_M2쌍아_INFRA_M2도구세팅.md
portfolio: PF_INFRA
status: 완료(조건부 — VSCode 재시작 후 세션 내 python3 확인 남음)
---

# COMPLETION — M2 도구 세팅

**[2026-10-03 11:58 KST]** M2/쌍아 → iMac/쌍아 (꾸님 참조)

- 실행 세션: M2-쌍아-1003-1102 몽크사진관홈페이지 (monk-project-66)
- 승인: 지시 출처 = 작가님 11:32 iMac 세션 원문(지시서 명기). M2 설치 확인 = 꾸님 사람 입력 턴 11:53 "상관없어 2번 하자"
- 중복 방지: 같은 기기 monk-project-aa에 11:53 "이 세션이 수행" 통지 → aa 착수 안 함 회신 수신

## 1. 설치·변경

| 항목 | 이전 | 이후 | 방법 |
|---|---|---|---|
| Python | `/usr/bin/python3` 3.9.6만 | Homebrew **3.13.16** 추가 (3.9 유지, 삭제 없음) | `brew install python@3.13` |
| gitleaks | 없음 | **8.30.1** | `brew install gitleaks` |
| `.git/hooks/pre-commit` | 없음 | `"$(git rev-parse --show-toplevel)/scripts/tools/gitleaks-precommit.sh"` (+x) | 지시서 §2-3 본문 |
| `.git/hooks/pre-push` | 없음 | `"$(git rev-parse --show-toplevel)/scripts/tools/specs_drift.sh" --hook` (+x) | 지시서 §2-3 본문 |
| Claude Code | 2.1.287 | **2.1.288** | `claude update` (npm 전역 설치 경로) |
| gcloud | — | 미설치 (지시서 §2-5) | — |

**PATH 변경 줄** — `~/.zshrc` 끝에 2줄 추가 (`~/.zprofile`·`~/.zshenv`는 원래 없음):
```
# python3 = Homebrew 3.13 (2026-10-03 M2 도구 세팅, ORDER_20261003_iMac쌍아_M2쌍아_INFRA_M2도구세팅)
export PATH="/opt/homebrew/opt/python@3.13/libexec/bin:$PATH"
```
사유: Homebrew python@3.13은 `/opt/homebrew/bin`에 `python3.13`만 링크하고 버전 없는 `python3`은 링크하지 않는다(실측). 그래서 `libexec/bin`을 앞에 둔다. `/opt/homebrew/bin`은 원래 PATH 맨 앞이었다.

> iMac 훅 본문은 직접 대조하지 못함 — M2 `~/.ssh/config`에 iMac 호스트가 없다. 지시서에 적힌 본문으로 설치했다.

## 2. 판정

| 기준 | 결과 |
|---|---|
| `python3 --version` 대화형 셸 (`zsh -ic`) | ✅ 3.13.16 (`/opt/homebrew/opt/python@3.13/libexec/bin/python3`) |
| `python3 --version` Claude Code 세션 Bash 도구 | ⏳ **3.9.6** — 이 세션은 변경 전 셸 환경 스냅샷으로 떠 있다. VSCode를 완전히 종료하고 다시 열면 새 세션에서 3.13이 잡혀야 한다. 훅이 부르는 `python3`도 같다 (현재 3.9로 동작 — 11e22cbc 호환 수정 덕분에 고장은 없음) |
| `python3 scripts/hooks/smoke.py` (3.13) | ✅ 110/110 PASS |
| `python3 scripts/hooks/smoke_pf.py` (3.13) | ✅ 17/17 PASS |
| `scripts/pf.sh check` | ✅ rc 0 |
| `gitleaks version` | ✅ 8.30.1 |
| pre-commit 동작 (커밋 없이 스크립트 직접 실행) | ✅ "no leaks found" / "[gitleaks] No secrets detected." rc 0 |
| `claude --version` ≥ 2.1.288 | ✅ 2.1.288 |
| `scripts/pf.sh append PF_KKU` 실사용 1회 | ✅ rc 0 — PF_KKU 184행 등재 (§3) |

## 3. pf.sh 실사용

PF_KKU 히스토리 184행에 10-03 꾸 배포 세션 지정(P5) 1행을 `scripts/pf.sh append`로 등재 — rc 0, 열·날짜 형식 자동. 10-02 수동 어펜드 [예외]의 원인(M2 pf.sh 미작동) 해소.

## 4. 남은 일

- ⏳ VSCode 완전 종료 → 재시작 후 새 세션에서 `python3 --version` 3.13 확인 (꾸님 PC 작업 — 다음 M2 세션 시작 시 확인)
- 💡 M2 → iMac ssh 호스트 미등록. 훅 본문 대조나 원격 실측이 필요하면 iMac 쌍아가 판단
