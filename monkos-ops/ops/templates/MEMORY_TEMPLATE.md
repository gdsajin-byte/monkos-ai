# {디바이스명} MEMORY — MONK OS

> CLAUDE.md = 프로젝트 정책 시트 + 상시 리드미 (Git 공유, 즉각 로딩 기록실)
> MEMORY.md = 디바이스 행동강령 + 에이전트 핵심 노트 (로컬, 200줄 캡)
> 도메인 지식은 여기에 쓰지 않는다. 코드/docs를 Read하면 된다.

## 이 디바이스: {디바이스명}
- **{디바이스명}** ({위치})
- 모든 에이전트 접두어: `{디바이스명}/{에이전트}`
- 적용 대상: 수발신 헤더, 지시서, 보고서, 세션 첫 인사, 세션 로그 파일명 전부

## 역할 자동 인식
- 시스템 프롬프트에 `VSCode native extension` → **쌍아**
- 시스템 프롬프트에 `Claude Agent SDK` → **민아**
- 그 외 (CLI) → **막내** (번호는 지시서에서 수신)
- 작가님의 수동 역할 선언 불필요

## 팀 인적 인프라
- **꾸(와이프)**: 맥미니 M2
- 조직 정본: `governance/PERSONNEL_REGISTRY.md` (한송이 2026-05-27 퇴사 — 정본 참조)

## 사업 구조
- **monk.kr**(본진 데스크톱, CF Pages) → **monkos.ai**(모바일 AI 분기, Cloud Run)

## 프로젝트 폴더 위상
| 폴더 | 위상 |
|------|------|
| `MONK_kr/` | 본진 (CF Pages) |
| `monkos_AI/` | 모바일 AI (Cloud Run) |
| `monkos-ops/` | 운영 체계 |
| `governance/` | 법률+역사+철학 |

## 세션 로그 파일명 패턴
- 쌍아: `monkos-ops/ops/sessions/YYYY-MM/YYYY-MM-DD_{디바이스명}_쌍아.md`
- 민아: `monkos-ops/ops/sessions/YYYY-MM/YYYY-MM-DD_{디바이스명}_민아.md`
- 막내: `monkos-ops/ops/sessions/YYYY-MM/YYYY-MM-DD_{디바이스명}_막내N.md`

## 세션 로그 타임스탬프 규칙
- 세션 로그의 이벤트 시각은 대화 내역의 턴별 타임스탬프를 역추적하여 정확한 값 기입
- `~` 추정 표기 금지

## 세션 시작/마감 프로세스
- **시작**: `git fetch --all` → 신규 커밋 확인 → 머지 후 보고
- **마감**: 보고 → 커밋 → push → CHANGELOG 갱신

## 디버깅 교훈
- (디바이스별 경험을 여기에 축적)

## 외장 메모리
- **4MUSE 기원+페르소나**: `memory/user_4muse_origins.md`
- **미결 어젠다**: `memory/project_pending_agenda.md`
