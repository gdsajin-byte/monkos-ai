---
type: order
date: 2026-10-04
from: iMac/쌍아
to: iMac/쌍아-막내2
device: iMac
agent: 쌍아
subject: 컨트롤 룸 PoC — Claude Code 모드로 상황판·TF/PF 발동 버튼·통신 스위치(모의)·승인 버튼(모의)
status: 발행
portfolio: PF_MONK_OS
---

# ORDER — 컨트롤 룸 PoC

> 출처: 작가님 2026-10-04 11:37 "승인 토큰 발행 버튼, 각 TF·PF 발동 스킬, 팀 에이전트 통신 온오프 키 등 한 화면에서 컨트롤 룸" → 쌍아 11:37 단계안(v0 상황판+발동 → 통신 스위치 → 승인은 A+C·2차 신호 후) → 작가님 11:38 "poc 만들어봐"(iMac VSCode 쌍아 세션, 사람 입력 턴). 선행 실측: REPORT_20261004 모드승인버튼(M1 API) · 키주입E10위조(K1~K4).

## 1. 목적

한 CLI 세션 화면에서 MONK 운영을 보고·발동하는 **컨트롤 룸**이 모드로 성립하는지 PoC로 보인다. 운영 반영이 아니라 **작동 시연 + 한계 목록**이 산출물이다.

## 2. 범위

- **허용**: `scripts/tools/_trial/control-room/` 플러그인(모드) 작성 · 기동 스크립트 `scripts/tools/_trial/control-room/mk-control.sh`(`claude --plugin-dir`로 **그 프로세스에만** 로딩) · 읽기 전용 조회(`claude agents --json`, git, 세션 로그·지시서·PF 파일 읽기) · 시연 세션 기동·종료.
- **금지**: 플러그인 설치·마켓 등록 / `.claude/settings*.json`·`scripts/hooks/*` 수정 / 실제 `.claude/approvals/` 읽기 외 접촉 / 다른 세션에 키 주입·메시지 발송(통신 스위치는 **컨트롤 세션 자신**에만 적용) / 배포·외부 발송 / 시연 세션의 MCP 대화 응답은 **"이번만"류 비영속 선택**만(오늘 Esc 거부가 메인 `settings.local.json`에 기록된 사고 재발 금지 — 비영속 선택지가 없으면 `--strict-mcp-config` 등으로 대화 자체를 피하라).
- 시연 세션 cwd는 **메인 체크아웃이 아닌 스크래치 또는 워크트리**. 단 오늘 실증대로 워크트리 세션도 메인 파일에 쓸 수 있으니, 시연 세션에는 쓰기 도구를 주지 않는다(`--disallowedTools`).

## 3. 기능 (4패널)

| 패널 | 내용 | 등급 |
|------|------|------|
| P1 상황판 | 살아 있는 세션(이름·상태·시작) / 오늘 세션 로그 목록 / 수신 확인 안 된 지시서(`status: 발행`인데 대응 COMPLETION·REPORT 없음) / 활성 PF 최근 행 3 / git ahead·behind·미커밋 수 / 승인 토큰 **개수만** | 읽기 전용. 갱신 버튼 + 주기 갱신 가능 여부 실측 |
| P2 발동 버튼 | `/pf-status` · `/health-check` · `/session-checkpoint` · PF 선언(`/pf-declare` + PF 선택 입력) | 버튼 → 프롬프트 삽입 또는 실행. 가능한 방식 실측 |
| P3 통신 스위치(모의) | ON/OFF 토글 → OFF면 **이 세션의** `SendMessage`·`ListAgents` 도구 호출을 `tool.call`에서 deny | 운영 스위치 시연. 전역 적용 아님 |
| P4 승인 버튼(모의) | 누르면 스크래치 `mock_approvals/`에 토큰 + 화면에 **"⚠️ 미보안 — 키 주입으로 위조 가능(K 실증)"** 고정 표기 | 실토큰 발급 금지 |

## 4. 산출물

1. `scripts/tools/_trial/control-room/` — 플러그인 + `mk-control.sh` + README(기동법·패널·한계)
2. 시연 캡처(텍스트 화면 덤프 가능) — 4패널 각 1회 작동
3. `monkos-ops/ops/reports/2026-10/REPORT_20261004_iMac쌍아-막내2_컨트롤룸_PoC.md` — 패널별 작동/불가, 모드 API로 안 되는 것(예: 다른 세션 제어), 운영화 시 필요 결정 목록(제안만), 소요 토큰·응답 지연 체감
4. COMPLETION + 세션 로그 + PF_MONK_OS 1행

## 5. ⚠️ 준수 조항

- **헌법 4조 1·2항**: 시크릿 생성·추측 금지, 파괴적 명령 금지.
- **헌법 3조 1·2항**: `date` 실측, append-only 로그, 완료 보고(✅❌💡⏳📁🔀).
- **ch1 7조**: 설치·전역 설정은 승인 게이트 — 필요하면 중단·보고.
- **도구 3요건(references.md 도구 맵)**: PoC라 등재는 하지 않되, README에 스모크 결과와 실패 시 표시 방식을 적는다.
- **ch1 1조 판단 분리**: 채택 판정은 쌍아·작가님.

## 6. 완료 기준

- [ ] 4패널 각 1회 실작동 기록(불가 시 원인)
- [ ] 메인 체크아웃 `git status` 변경 0(시연 부작용 없음) — 보고서에 출력 첨부
- [ ] 시연 세션·tmux 종료
- [ ] 커밋·푸시(브랜치 가능) 후 origin SHA 회신

## 7. 커밋 메시지

`[research] 컨트롤 룸 PoC — 모드 4패널(상황판·발동·통신 스위치·모의 승인)`
