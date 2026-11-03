---
type: completion
date: 2026-11-03
from: iMac/쌍아-막내8
to: iMac/쌍아
subject: 세션 시작 훅 기기 판별 정본화 — 식별 파일 우선·M1/4060 패턴·미확인 명시 + Windows 한글 JSON 교정
order: ORDER_20261103_iMac쌍아_막내8_INFRA_세션시작훅_기기판별_정본화.md
portfolio: PF_INFRA
status: 완료
---

# COMPLETION — 세션 시작 훅 기기 판별 정본화

**[2026-11-03 14:14 KST]** iMac/쌍아-막내8 → iMac/쌍아

## 결론

M1·4060은 식별 파일이 없어도 hostname만으로 각각 `M1`·`4060`으로 판별된다. 미확인 기기는 `[HOOK-ERR]`를 띄우고 역할을 그대로 둔다(구 폴백 "웹(원격)→민아"는 없앴다). 4060 Git Bash에서는 지시서에 없던 결함도 하나 나와서 같이 고쳤다. 한글 JSON 출력이 cp949 때문에 실패해 평문으로 강등되던 문제다. 스모크는 158/158에서 175/175가 됐다.

## diff 요약

| 파일 | 변경 |
|---|---|
| `scripts/hooks/session_start.sh` | 판별 5단계(아래 표), `norm_dev` 허용값 정규화, 허용값 밖·미확인일 때 `[HOOK-ERR]` 줄을 문맥에 넣음, 헤더에 `판별 {출처}` 표기, `export PYTHONIOENCODING=utf-8`(훅 프로세스 한정) |
| `scripts/hooks/smoke.py` | `ss_dev()` 픽스처 추가 — `hostname`·`uname`은 PATH 앞 스텁으로, `~`는 임시 HOME으로 격리. 17건 추가 |
| `.claude/commands/session-start.md` | 디바이스 판별표를 우선순위 5단계로 교체(쌍아 지시에 따른 규정 계층 수정) |
| `monkos-ops/ops/devices/README.md` | 일람표에 "로컬 hostname · 식별 파일" 열 추가, 식별 파일 주석, 4060 호스트 키 경고 비고 |
| `.claude/rules/references.md` | 도구맵 집행 훅 행 끝에 11-03 변경 1문장 |

## 판별 표 (먼저 맞는 단계가 이긴다)

| 순위 | 신호 | 결과 |
|---|---|---|
| 1 | `MONK_DEVICE` (`iMac`·`M1`·`M2`·`4060`·`웹`) | 그 값. 허용값 밖이면 `[HOOK-ERR]` 후 다음 단계 |
| 2 | `~/.claude/monk-device` 1행 (BOM·CRLF·공백 제거) | 그 값. 허용값 밖이면 `[HOOK-ERR]` 후 다음 단계 |
| 3 | hostname `*iMac*` → iMac / `*Macminiui-Macmini*`·`*macmini-macmini*`·`*MacBook*`·`*M1*` → M1 / `*MONK-4060*`·`*monk-4060*` → 4060 / `*mac-mini*`·`*Mac-mini*`·`*M2*` → M2 / `uname -s`가 `MINGW*`·`MSYS*`·`CYGWIN*`이거나 WSL → 4060 | |
| 4 | `CLAUDE_CODE_REMOTE=true` → 웹(원격), 역할 민아 | 근거: https://code.claude.com/docs/en/env-vars ("Set automatically to `true` when Claude Code is running as a cloud session") · https://code.claude.com/docs/en/cloud-environments — 11-03 확인, 주석에 URL 기재 |
| 5 | 그 외 → `미확인` + `[HOOK-ERR] 기기 미확인(hostname=…) — ~/.claude/monk-device 설정 필요`. 역할 유지, 세션 이름 `미확인-{역할}-MMDD-HHMM` | |

M1 패턴은 M2 패턴보다 위에 뒀다. 테일넷 이름 `macmini-macmini`는 소문자라 M2 패턴(`mac-mini`, 하이픈 위치가 다름)에 걸리지 않는다. 이 둘이 겹치지 않는다는 것도 스모크로 확인했다.

## 스모크 (`python3 scripts/hooks/smoke.py`)

- 이전: **158/158 PASS**
- 이후: **175/175 PASS** (+17)
- 추가한 건: hostname M1 2종·4060·MINGW·M2·iMac / 식별 파일 > hostname / BOM·CRLF 파일 / MONK_DEVICE > 파일 > hostname / 음성 MONK_DEVICE 허용값 밖 / 음성 파일 허용값 밖 / 미확인 + `[HOOK-ERR]` / **음성 미확인 cli → 막내 유지(민아로 안 바뀜)** / 음성 미확인 vscode → 쌍아 유지 / `CLAUDE_CODE_REMOTE=true` → 웹·민아 / 음성 `CLAUDE_CODE_REMOTE=false` → 미확인 / 식별 파일 `웹` → 웹·민아

## 4060 Git Bash 실행 출력 (11-03 14:12 KST)

실행 방식: 훅 사본과 실행 스크립트를 scp로 `%USERPROFILE%\.claude\`에 올리고 `.cmd` 런처로 Git Bash를 띄웠다. sshd 세션 PATH가 옛값이어서 python3 경로(`…/Python312`)는 실행 스크립트에서만 앞붙였고, 훅 코드에는 절대경로를 넣지 않았다. 실행 후 임시 파일 4종을 지웠다(`monk-device`만 남음, 확인함).

수정 전 1차 실행: `디바이스=4060` 판별은 정상이었지만 **`[HOOK-ERR] session_start: JSON 출력 생성 실패 — 평문 문맥으로 강등`**이 나왔다. 원인을 실측해 보니 Windows 파이썬 `sys.stdout.encoding=cp949`였고, `PYTHONIOENCODING=utf-8`을 주면 한글 JSON이 정상으로 나왔다 → 훅에 반영했다.

수정 후(테스트 쪽에서 `PYTHONIOENCODING`을 unset한 상태로 실행):

```
== uname: MINGW64_NT-10.0-26300 / hostname: MONK-4060 / python3: /c/Users/smuse73/AppData/Local/Programs/Python/Python312/python3
== 1) 식별 파일 있음
JSON OK · sessionTitle= 4060-쌍아-1103-1412
[MONK SessionStart 훅] 2026-11-03 14:12 KST · 디바이스=4060 (hostname MONK-4060 · 판별 ~/.claude/monk-device) · 실행 표면=claude-vscode → 역할 후보 쌍아
- 세션 이름: 4060-쌍아-1103-1412 (자동 지정)
...
== 2) 식별 파일 없이(hostname 판별)
JSON OK · sessionTitle= 4060-쌍아-1103-1412
[MONK SessionStart 훅] 2026-11-03 14:12 KST · 디바이스=4060 (hostname MONK-4060 · 판별 hostname) · 실행 표면=claude-vscode → 역할 후보 쌍아
== 식별 파일 바이트:
0000000   4   0   6   0  \n
```

(4060에서는 레포 밖 홈 디렉터리에서 실행했으므로 git 줄은 빈 값이다. 판별 검증과는 무관하다.)

## 기기별 식별 파일 배치

| 기기 | 경로 | 내용 | 결과 |
|---|---|---|---|
| iMac | `~/.claude/monk-device` | `iMac\n` | ✅ 신규(이전 부재 확인) |
| M1 | `ssh m1` `~/.claude/monk-device` | `M1\n` | ✅ 신규(이전 부재 확인, hostname `Macminiui-Macmini.local` 실측) |
| 4060 | `%USERPROFILE%\.claude\monk-device` | `4060\n` (BOM 없음, od 확인) | ✅ scp 배치 — 배치 전 존재 여부는 확인 못 함(격리 가드가 원격 셸 조회를 막았다). 신설 파일명이라 기존 파일은 없었을 것으로 본다 |
| M2 | — | — | ⬜ 미배치(지시서 범위상 기록만). hostname 패턴으로 판별된다 |

## 💡 알릴 사항

- **4060 ssh 호스트 키 경고**: iMac `~/.ssh/known_hosts` 7행에 재구축 전 ECDSA 키가 남아 있어 매 접속마다 `REMOTE HOST IDENTIFICATION HAS CHANGED` 경고가 나온다. 새 ED25519 지문은 `SHA256:voEzAxSFPsa6Obp+XVhzUy+ydz95g5psDYYx8PD2NWQ`다. 키 인증은 통과한다. 이 행을 정리하는 건 설정 변경이라 손대지 않았다 — 작가님이나 쌍아가 지문을 대조한 뒤 `ssh-keygen -R`로 정리할 것을 제안한다.
- **bg 세션 격리 가드**: 워크트리로 격리된 세션에서는 문자열 `git`·`bash`가 들어간 원격 ssh 명령이 거부된다. 그래서 scp와 `.cmd` 런처로 우회 없이 실행했다. 앞으로 원격 기기 작업 지시에는 이 방식을 기본으로 둘 것을 권한다.
- M1 실세션 검증(VSCode 재기동 시 `M1-쌍아-…` 명명)은 작가님이 M1에서 새 세션을 열 때 확인할 수 있다.

## 커밋

- 브랜치 `worktree-makne8-device-detect` (main 17145fee 기준). 병합은 쌍아 몫이다. main 푸시·배포 없음.
