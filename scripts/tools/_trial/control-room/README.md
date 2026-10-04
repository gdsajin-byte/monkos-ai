# control-room — MONK 컨트롤 룸 PoC (시범, 운영 미반영)

> ORDER_20261004 컨트롤룸_PoC. 쌍아 11:41 범위 축소로 **P1 상황판 + P2 발동 버튼만**. P3 통신 스위치·P4 모의 승인 버튼은 제외.
> 결과: `monkos-ops/ops/reports/2026-10/REPORT_20261004_iMac쌍아-막내2_컨트롤룸_PoC.md`

## 기동

```bash
scripts/tools/_trial/control-room/mk-control.sh <레포 루트(워크트리 권장)> [--model ...]
# 세션 안에서: /control
```

- 플러그인을 `$TMPDIR/control-room.XXXXXX/`에 복사해 `--plugin-dir`로 **그 프로세스에만** 로딩(설치·전역 설정 없음, 로딩 시 생기는 `.claude-plugin/types/`가 레포에 남지 않음).
- 시연 안전 기본값: `--strict-mcp-config`(프로젝트 MCP 미로딩 → MCP 활성화 대화가 안 떠 `settings.local.json` 기록 없음), `--disallowedTools Bash Edit Write NotebookEdit Agent`.

## 패널

| 패널 | 내용 | 조작 (패널 포커스 `ctrl+x` → `Tab` 후) |
|------|------|------|
| P1 상황판 | 세션(`claude agents --json`) · 오늘 세션 로그 · 미수신 추정 지시서 · 오늘 PF 행 3 · git · 승인 토큰 **개수** | `r` 갱신, 60초 자동 갱신 |
| P2 발동 | `/pf-status` · `/health-check` · `/session-checkpoint` 삽입(1·3·5)/실행(2·4·6), PF 선택 + 선언(`d`, 삽입) | 단축키 |

## 스모크 (2026-10-04, CLI 2.1.289, Haiku 4.5)

- `claude plugin validate` 통과(경고: author 미기재).
- P1 표시·수동 갱신·60초 자동 갱신 확인. P2 삽입 4종 확인, 실행은 `/pf-status` 1회(모델이 Skill 호출까지 성립, 스킬의 셸 명령은 Bash 차단으로 실패).

## 한계

- `$.prompt.submit`은 `/`로 시작하는 텍스트를 **거부**한다 → "실행"은 "○○ 스킬을 실행하라" 문장을 모델에게 제출하는 우회. 결과는 모델 판단을 거친다.
- 셸을 쓰는 스킬(pf-status·health-check·session-checkpoint)은 시연 기본값(Bash 차단)에서 실패한다. Bash를 열면 그 세션의 모델이 쓰기 가능해진다.
- "미수신 추정 지시서"는 파일명 낱말 대조 휴리스틱 — 오탐 있음(10-01·10-02 심사 지시서가 잡힘).
- "오늘 PF 행 3"은 PF 폴더 순서상 마지막 3행이지 시각순이 아니다.
- 다른 세션 제어 수단 없음(조회만). 패널 높이를 넘으면 스크롤해야 하고, 버튼 단축키는 화면에 표시되지 않는다.

## 실패 가시화

- 조회 실패는 패널에 빨간 `⚠` 줄, 갱신 전체 실패는 토스트. 모듈 로드 실패·훅 예외는 하네스가 대화에 회색 줄로 표시(`--plugin-dir` 감시 세션).
