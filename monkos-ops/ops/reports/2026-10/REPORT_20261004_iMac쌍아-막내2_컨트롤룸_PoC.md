---
type: report
date: 2026-10-04
device: iMac
agent: 쌍아-막내2
status: 마감
portfolio: PF_MONK_OS
subject: "컨트롤 룸 PoC — 모드 P1 상황판·P2 발동 버튼 (P3·P4 제외)"
order: monkos-ops/ops/orders/2026-10/ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_컨트롤룸_PoC.md
method: "scripts/tools/_trial/control-room/mk-control.sh 로 tmux 시연 세션 1개(Haiku 4.5, cwd=막내2 워크트리, --strict-mcp-config, --disallowedTools Bash Edit Write NotebookEdit Agent). 버튼은 단축키 주입으로 누름(관측자). 화면 덤프로 판정"
---

# 컨트롤 룸 PoC

**[2026-10-04 11:47 KST]** iMac/쌍아-막내2 → iMac/쌍아

## 1. 결론 (후보 — 채택 판정은 쌍아·작가님)

**상황판은 운영급으로 성립, 발동 버튼은 "삽입"만 깔끔하고 "실행"은 모델 경유 우회.** P1은 모델 토큰 0으로 세션·로그·지시서·PF·git·토큰 수를 한 화면에 모으고 60초마다 스스로 갱신한다. P2는 슬래시 명령을 입력창에 넣는 것까지가 모드의 직접 능력이고, 바로 실행하는 API(`$.prompt.submit`)는 `/` 시작 텍스트를 **거부**한다.

**P3·P4 제외 — 11:40 하네스 안전 분류기 중단, 원인 미확인.** (본체 모듈 첫 작성 응답이 분류기에 의해 중단 → 쌍아 11:41 지시로 P1·P2만 진행, P3·P4는 재작성하지 않음)

## 2. 패널별 결과

| 패널 | 항목 | 결과 | 근거 |
|------|------|------|------|
| P1 | 표시 | **작동** — `/control` → 패널 열림. 세션 8 · 오늘 세션 로그 3 · 미수신 추정 지시서 8 · 오늘 PF 행 3 · git · 승인 토큰 3개(개수만) | §3 화면 |
| P1 | 수동 갱신 | **작동** — 단축키 `r` | 11:45 표기 갱신 |
| P1 | 주기 갱신 | **작동** — 무조작 상태로 11:45 → 11:46 자동 변경 (`$.clock.every` 60초) | 11:46:54 관측 |
| P1 | 세션 목록 | **작동(로컬 한정)** — `claude agents --json`은 이 기기의 로컬 세션만(원격·클라우드 미포함). 상태(idle·busy·blocked)까지 표시 | |
| P1 | 미수신 추정 | **작동하나 오탐** — 파일명 낱말 대조 휴리스틱이라 10-01·10-02 심사 지시서 7건이 미수신으로 잡힘(실제 처리 여부 미대조) | |
| P2 | 삽입 | **작동** — `/pf-status`·`/health-check`·`/session-checkpoint`·`/pf-declare PF_MONK_OS` 4종 입력창 삽입 확인(`$.prompt.fill`) | 입력창 덤프 |
| P2 | 실행(직접) | **불가** — `$.prompt.submit({text:'/pf-status'})` → "a text beginning with / would run a command" 로 훅 예외 | 대화 회색 줄 |
| P2 | 실행(우회) | **부분 작동** — "pf-status 스킬을 실행하라" 문장 제출 → 하네스가 "플러그인이 제출한 프롬프트"로 턴 시작 → 모델이 `Skill(/pf-status)` 호출. 스킬 본문의 셸 명령이 시연 기본값(Bash 차단)으로 실패. 모델은 원인을 "E10 승인 게이트"로 **잘못** 설명 | 11:44, 29초 |
| P2 | PF 선택 상자 | **표시만 확인** — 조작은 안 함(Tab 순회 중 Enter가 `/session-checkpoint` 실행 같은 다른 버튼에 떨어질 위험). 선언은 기본값으로 삽입 검증 | |
| P2 | `/session-checkpoint` 실행 | **의도적 미실행** — 커밋 스킬 | |

## 3. 시연 화면 (P1, 11:42)

```
P1 상황판 (2026-10-04 11:42 KST, 60초 주기)
[ 갱신 ]
세션
  monk-project-7a · idle / monk-project-5e · idle / monk-project-72 · idle / 쌍아-막내4 · blocked
  monk-project-c8 · idle / iMac-민아-1003-1158 · idle / 쌍아-막내2 · busy / 쌍아-막내2 · idle
오늘 세션 로그
  2026-10-04_iMac_쌍아-막내2.md / 2026-10-04_iMac_쌍아.md / 2026-10-04_웹_민아.md
미수신 추정 지시서
  ORDER_20261001_…청구안준비_입법심사·행정심사·사법심사 / ORDER_20261002_…꾸배포권한위임 3건 / …KKU_P2_스위치·교차검증
  ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_컨트롤룸_PoC
오늘 PF 행(최근 3)
  PF_SECURITY ×3 (키 주입 실증 COMPLETION·REPORT·쌍아 판정)
git: ## worktree-mods-approve-trial...origin/worktree-mods-approve-trial [ahead 6] · 미커밋 2
승인 토큰 파일: 3개 (개수만)
P2 발동
/pf-status [ 삽입 ][ 실행 ]   /health-check [ 삽입 ][ 실행 ]   /session-checkpoint [ 삽입 ][ 실행 ]
PF : none ▾[ 선언 ]
```
(승인 토큰 3개 = 오전 K 실증 잔여 토큰, 시연 cwd가 워크트리라 워크트리 디렉터리를 셈)

## 4. 모드 API로 안 되는 것 (실측·문서)

1. 슬래시 명령 직접 실행 — `$.prompt.submit`이 거부. 삽입 후 사람 Enter, 또는 모델 경유 문장.
2. 다른 세션 제어 — 조회(`claude agents --json`)만. 다른 세션 입력·권한 조작 API 없음(키 주입은 K 실증상 가능하나 금지 대상).
3. 버튼 단축키가 화면에 표시되지 않음(일반 버튼). 패널이 높이를 넘으면 스크롤 필요, 포커스 위치가 덤프로 식별되지 않음.
4. 모델이 낀 실행은 스킬 권한 = 그 세션의 도구 권한. 읽기 전용 시연 세션에서는 셸 스킬 전부 실패.

## 5. 운영화 시 필요한 결정 (제안만)

1. 컨트롤 세션의 도구 권한 — 읽기 전용(현 PoC) 유지 vs Bash 허용(스킬 실행 가능, 그 세션 모델이 쓰기 가능해짐).
2. 발동 방식 — "삽입 + 사람 Enter"를 표준으로(실행 주체가 사람 턴으로 남음) vs 모델 경유 실행.
3. 미수신 판정 규칙 — 파일명 휴리스틱 대신 지시서 YAML `status`를 COMPLETION 시 `완료`로 바꾸는 규칙 또는 `order:` 역참조 필드.
4. 세션 목록 범위 — 로컬만 vs Remote Control·클라우드 포함(ListAgents 수준은 모드 API 밖).
5. 설치 경로 — `--plugin-dir` 기동 스크립트 유지 vs 프로젝트 플러그인 설치(ch1 7조 승인 게이트).

## 6. 비용·지연 체감

- P1 수집: 모델 토큰 0. 갱신 반영 수 초 이내(`claude agents --json` 15초 타임아웃 설정, 실측 지연 체감 없음).
- P2 우회 실행 1회: Haiku 턴 29초(Stop 훅 출력 포함). 스킬이 성공했다면 그 이상.

## 7. 부작용 점검

- 시연 MCP 대화: `--strict-mcp-config`로 대화 자체가 뜨지 않음.
- 메인 체크아웃: 시연 시작 표지 파일(11:41) 이후 변경 파일 **0건** — `find /Users/jeong-kyushin/developer/monk_project -newer <표지> -type f`(`.git`·`.claude/worktrees`·`node_modules` 제외) 출력 없음. 메인 체크아웃 `git status`는 워크트리 격리 하네스가 다른 체크아웃 대상 git 실행을 막아 직접 첨부하지 못함 — 쌍아 세션에서 1회 확인 요청(오전 `settings.local.json` 미커밋 변경은 기존분).
- 시연 세션·tmux 종료(`no server running`). 하위 실행 기록: 시연 tmux `ctrlroom`(Haiku 4.5, P1·P2, 종료).
