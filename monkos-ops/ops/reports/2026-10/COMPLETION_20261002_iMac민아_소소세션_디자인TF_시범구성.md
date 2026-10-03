---
type: completion
date: 2026-10-02
device: iMac
agent: 민아
status: 마감
portfolio: PF_DESIGNLAB
subject: "소소 CLI 세션 정의 + 디자인 TF 시범 구성 — 정의 4장·기동 스크립트·훅 역할 표시"
---

# COMPLETION — 소소 CLI 세션 정의 + 디자인 TF 시범 구성

**[2026-10-02 14:39 KST]** iMac/민아 → 작가님 · iMac/쌍아(사후 추인)

## 지시 출처

- 작가님 14:34 "Cli로 세션열고 소소 세션으로 정의해서 구성해보자" (사람이 입력한 턴, iMac 민아 세션).
- 선행 논의: 13:55 디자인팀 구성안 요청 → 14:26 TF 체제·에이전트 팀 방향 질의 → 민아 14:28 의견(결정 1A 팀 켜기·2A CLI 리드 권고).

## [예외] 범위 초과 사유 (ch1 2조 5항)

- ③ 신규 도구 신설: `scripts/mk-soso.sh`.
- ④ 가드레일 계열 변경: `scripts/hooks/session_start.sh` 역할 표시 1줄(차단·승인 로직은 불변).
- ⑤ 규정 계층 변경: `.claude/agents/` 4장 신설, `.claude/commands/session-start.md` 2곳, `.claude/rules/references.md` 도구 맵 1행.
- 작가님 직접 지시(경로 ③, ②항 준용). 쌍아 사후 추인 대상.

## 헌법·법률 적합성 검토 (헌법 5조 4항)

- **헌법 1조 2항(역할 체계)·법률 ch1 1조(에이전트 정의)에 소소가 없다.** 정식 편입은 헌법 개정(삼권 심사·만장일치)과 ch1 개정이 필요하다. 이번 구성은 **시범**이며 법률·헌법 본문은 건드리지 않았다. 정의 파일과 헌장에 "정식 편입 전"을 명기했다. 정식화는 시범 종료 후 청구안으로 올린다(작가님 결정 #3).
- 전역 환경 불변: 에이전트 팀 플래그는 기동 스크립트가 그 프로세스의 환경변수로만 준다. 사용자 설정·`~/.bash_profile`은 수정하지 않았다(`mk-s`는 소넷 별칭으로 이미 쓰여 별칭을 새로 만들지 않고 레포 스크립트로 둠).
- 권한 모드: 기존 CLI 기동(`mk-c`)과 같은 무승인. 세션 간 메시지의 권한 모드 일치 조건과 10-01 작가님 정리(전원 무승인)에 맞춤.

## 집행

| # | 대상 | 내용 |
|---|---|---|
| 1 | `.claude/agents/soso.md` (신설) | 소소 주 세션 정의 — 하는 일 6, 하지 않는 일, 팀 운용 규칙, 기록 위치, 시범 실측 항목 |
| 2 | `.claude/agents/dsn-scout.md` · `dsn-maker.md` · `dsn-critic.md` (신설) | 팀원 유형 3장. 헌법 제외·모델 명시(Sonnet·Opus·Sonnet)·공통 안전 문구는 reader·writer 서식 준용. maker 쓰기 범위 = `monkos-ops/tech/designs/` 한정, critic은 수정 도구 없음 |
| 3 | `scripts/mk-soso.sh` (신설) | `claude --agent soso --name {디바이스}-소소-MMDD-HHMM --dangerously-skip-permissions [--model]` + `MONK_ROLE=소소` + 에이전트 팀 플래그. `--dry-run` 지원 |
| 4 | `scripts/hooks/session_start.sh` | CLI 표면이고 `MONK_ROLE=소소`일 때만 역할 후보를 소소로 표시. 타 표면·허용값 밖은 무시 |
| 5 | `scripts/hooks/smoke.py` | `ss_title`이 호출 환경의 `MONK_ROLE`을 상속하지 않게 격리 + 검사 4건 추가 |
| 6 | `.claude/commands/session-start.md` | 역할 판별 0번에 소소, 첫 인사에 소소 1줄 |
| 7 | `.claude/rules/references.md` | 도구 맵 1행 등재(미실증 항목 명기) |
| 8 | `monkos-ops/ops/proposals/PROPOSAL_20261002_iMac민아_디자인TF_소소세션_시범편성.md` (신설) | 헌장·프로세스 6단계·결정 대기 3건 |

## 검증

| 항목 | 방법 | 결과 |
|---|---|---|
| 훅 스모크 | `python3 scripts/hooks/smoke.py` | 73/73 PASS (기존 69 + 신규 4: 양성 1 · 음성 3 — 타 표면 무시, 허용값 밖 무시, 헤드리스 미지정) |
| 기동 명령 조립 | `bash scripts/mk-soso.sh --dry-run` (모델 인자 유·무) | 의도한 명령 출력. 음성: 알 수 없는 옵션 → `❌` + rc 1 |
| 훅 문맥 | `MONK_ROLE=소소`·`cli`로 훅 직접 실행 | "실행 표면=cli → 역할 후보 소소", 기존 이름 유지 |
| 정의 로딩 | 헤드리스 실세션 2회(Haiku, 플래그 켬/끔) | 양쪽 다 이름 "소소", 팀원 유형 `dsn-scout`·`dsn-maker`·`dsn-critic` 인식 |
| 팀 기능 존재 | 설치본 2.1.286 실행 파일 문자열 대조 | 플래그·`TeamCreate`·`TeamDelete`·`TeammateIdle` 문자열 존재 |

## 미실증 (정직하게)

- **대화형 세션에서 팀이 실제로 생성되는지.** 헤드리스 자가 보고는 플래그 켬/끔에서 도구 목록 차이를 가려내지 못했다(모델 자가 보고는 능력의 증거가 아니다). 소소 세션의 첫 팀 생성 1회가 판정이다.
- 팀원 세션에서 집행 훅이 도는지, `session_id`가 리드와 같은지(배포 승인 토큰 공유 여부).
- 팀원 세션 이름·역할 표시(`MONK_ROLE` 상속).
- 팀원 모드에서 `omitClaudeMd`가 지켜지는지와 실제 토큰 비용.
- `--name`으로 붙인 이름이 같은 기기 피어 목록에 반영되는지.

## 💡 청구·제안

- 시범 종료 후 정식 편입 청구안(헌법 1조 2항 · ch1 1조 · 4MUSE 대응표) — 민아 작성, 쌍아 심사.
- 훅의 승인 토큰을 세션 ID 단일 키로 두는 구조는 팀원·서브에이전트 구분이 안 된다(10-01 지적 승계). 시범 실측 후 쌍아 설계 건으로 올린다.

## 다음 단계 (작가님 손)

- 터미널에서 `bash scripts/mk-soso.sh` (Fable로 열려면 `bash scripts/mk-soso.sh claude-fable-5-1`) → 첫 턴에 "세션 시작".
- 결정 대기 3건은 헌장 §7.

📁 `.claude/agents/soso.md` · `.claude/agents/dsn-*.md` · `scripts/mk-soso.sh` · `scripts/hooks/session_start.sh` · `scripts/hooks/smoke.py` · `.claude/commands/session-start.md` · `.claude/rules/references.md` · 헌장 PROPOSAL
