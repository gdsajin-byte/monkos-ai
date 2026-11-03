---
type: order
date: 2026-11-03
from: iMac/쌍아
to: iMac/쌍아-막내8
subject: SessionStart 훅 기기 판별 정본화 — M1·4060 오판(→"웹(원격)/민아") 제거, 기기 식별 파일 우선·미확인은 명시 경고, 스모크·일람표·스킬표 동기화
status: 대기
portfolio: PF_INFRA
---

# ORDER — 세션 시작 훅 기기 판별 정본화

**[2026-11-03 14:07 KST]** iMac/쌍아 → iMac/쌍아-막내8

출처: 작가님 2026-11-03 14:07 iMac 쌍아 세션 사람 턴 "m1 자기 파악등 제대로 돌아가도록 알리고 개선방향을 정리해서 처리해". 범위 승인 = 본 문서 §2~§4. 배포 없음.

## 1. 사실 (쌍아 13:57~14:04 실측)

- `scripts/hooks/session_start.sh` 17~22행이 `hostname` 부분 문자열로 기기를 정한다. 매칭 실패 시 WSL이 아니면 **`웹(원격)`으로 떨어지고 38행이 역할을 `민아`로 덮는다.**
- M1 hostname `Macminiui-Macmini.local` → 어느 패턴에도 안 맞음 → 11-03 13:56·14:03 M1 VSCode 세션이 `웹-민아-1103-xxxx`로 명명되고 스스로 "웹(원격)/민아"로 일했다(세션 로그·헤더 오기 위험).
- 4060 hostname `MONK-4060`, Windows 11 + Git Bash(WSL 아님) → 같은 경로로 `웹(원격)` 오판 예정. 4060은 11-03 Python 3.12.10 설치·`python3.exe` 사본 생성 완료(훅 실행 가능).
- M2 패턴 `*mac-mini*|*Mac-mini*`는 M1 hostname과 겹치지 않음(대소문자·하이픈). 단 hostname은 사용자가 바꿀 수 있는 값이라 패턴만으로는 재발한다.
- 정본 표: `monkos-ops/ops/devices/README.md` 일람표(호스트명 열 = 테일넷 이름). 스킬 `.claude/commands/session-start.md` 22~29행 판별표도 같은 결함.

## 2. 할 일 (개선 방향 — 쌍아 확정)

1. **판별 우선순위**를 다음 순서로:
   1. 환경변수 `MONK_DEVICE` (허용값 `iMac|M1|M2|4060|웹`)
   2. 기기 로컬 파일 `~/.claude/monk-device` 1행(같은 허용값). 레포 밖·기기별 1회 설정
   3. hostname 패턴 — 기존 + **M1 `*Macminiui-Macmini*`·`*macmini-macmini*`**, **4060 `*MONK-4060*`·`*monk-4060*`**, `uname -s`가 `MINGW*|MSYS*|CYGWIN*`이면 4060, WSL `/proc/version` 유지
   4. 웹 컨테이너는 **양성 신호로만** 판정 — 원격 컨테이너가 실제로 주는 환경변수를 공식 문서로 확인해 쓰고(예: `CLAUDE_CODE_REMOTE`), 근거 URL을 주석에 남긴다. 확인 못 하면 이 단계는 생략.
   5. 그 외 = `device="미확인"` + 문맥에 `[HOOK-ERR] 기기 미확인(hostname=…) — ~/.claude/monk-device 설정 필요` 1줄. **역할은 덮지 않는다**(`민아` 강제는 `웹` 판정일 때만). 세션 이름은 `미확인-{역할}-MMDD-HHMM`.
2. **기기 식별 파일 배치**: iMac 로컬, `ssh m1`, `ssh 4060`(Windows: `%USERPROFILE%\.claude\monk-device`, UTF-8·BOM 없음)에 작성. M2는 오프라인이면 미배치로 기록(패턴으로 판별됨).
3. **4060 실행 확인**: `ssh 4060`에서 Git Bash(`C:\Users\smuse73\AppData\Local\Programs\Git\bin\bash.exe`)로 훅을 실행해 `디바이스=4060`·JSON 출력 확인. sshd 세션 PATH는 옛값이라 python3 절대경로 또는 PATH 앞붙임으로 실행 — 훅 코드에 절대경로를 넣지는 않는다.
4. **스모크** `scripts/hooks/smoke.py`: `MONK_DEVICE`·파일·hostname(M1·4060·M2·iMac)·MINGW·미확인 각 1건 이상 + "미확인이면 역할이 민아로 바뀌지 않음" 음성 대조. 기존 전부 통과.
5. **동기화**: `.claude/commands/session-start.md` 판별표를 새 우선순위로 갱신(쌍아 지시에 의한 규정 계층 수정 — 세션 로그에 대상·주체 기록). `monkos-ops/ops/devices/README.md` 일람표에 로컬 hostname 열 또는 비고(M1 `Macminiui-Macmini`, 4060 `MONK-4060`)와 식별 파일 배치 여부. `.claude/rules/references.md` 도구맵 집행 훅 행 끝에 11-03 변경 1문장.

## 3. 산출물·쓰기 범위

- 코드: `scripts/hooks/session_start.sh`, `scripts/hooks/smoke.py`. 다른 훅 수정 금지.
- 문서: 위 §2-5 세 파일. 기기 3대의 `~/.claude/monk-device`.
- COMPLETION: `monkos-ops/ops/reports/2026-11/COMPLETION_20261103_iMac쌍아-막내8_INFRA_세션시작훅_기기판별.md` — diff 요약, 판별 표, 스모크 결과, 4060 실행 출력, 기기별 배치 결과.
- 세션 로그 `2026-11-03_iMac_쌍아-막내8.md`, PF_INFRA 히스토리 1행(`scripts/pf.sh append PF_INFRA --agent "iMac/쌍아-막내8" …`).
- 작업 브랜치(main 기준) 커밋·푸시. 병합은 쌍아.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: 키·토큰 생성·추측·출력 금지. 이번 작업에 시크릿 없음.
- 헌법 4조 2항: 파괴적 명령 금지. 원격 기기에서는 식별 파일 작성·훅 실행만 — 설정 파일·패키지 변경 금지.
- 헌법 3조 1·2항: `date` 실측 헤더, 세션 로그 append-only, 완료 보고 + 원격 SHA 대조.
- 훅 실패 가시화 원칙(references 도구맵): 어떤 분기도 무음 강등 금지.

## 5. 완료 기준

- [ ] M1·4060 hostname이 각각 `M1`·`4060`으로 판별(파일 없이도), 파일·환경변수가 hostname보다 우선
- [ ] 미확인 기기는 `[HOOK-ERR]` + 역할 유지
- [ ] 4060 Git Bash 실행 출력 첨부
- [ ] 스모크 전부 통과(건수 전후 기재)
- [ ] 판별표 3곳 동기화, 브랜치 푸시 + 원격 SHA 대조 + COMPLETION

## 6. 커밋 메시지

```
[fix] 세션 시작 훅 기기 판별 — 식별 파일 우선·M1/4060 패턴·미확인 명시 (PF_INFRA)
```
