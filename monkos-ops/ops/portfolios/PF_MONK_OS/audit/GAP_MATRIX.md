---
type: GAP_MATRIX
track: D
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내4
scope: MONK OS 측 현황만 충실히 작성. Anthropic 공식 개념 열은 Track A 결과와 Phase 1에서 쌍아가 합본.
---

# GAP MATRIX — Anthropic 공식 개념 ↔ MONK OS 대응표 (MONK 열)

> 외부 표준 대조 금지 원칙하에 본 문서는 **MONK OS 측 현황**만 기록한다.
> Anthropic 공식 개념 열의 정의·인용은 Track A(막내1)의 `RESEARCH_A_anthropic.md` 도착 이후 Phase 1에서 쌍아가 병합한다.
> 공식 개념 열은 현재 **빈칸**으로 두고 플레이스홀더만 배치한다.

---

## 매트릭스

| # | 공식 개념 (Anthropic/Claude 4.7) | 공식 정의·인용 (Track A 채움) | MONK OS 대응 자산 | 물리 경로 | 현 운용 방식 | 초기 갭 플래그 (막내4 판단) |
|---|--------------------------------|-------------------------------|-------------------|----------|-------------|----------------------------|
| 1 | **Skills** | _(Phase 1 채움)_ | `.claude/skills/` 9건 | `.claude/skills/*.md` | frontmatter `name`+`description` 2필드. 본문 `> 원천: 법률 N조` 위임 표기. 세션 중 수동 호출 | 공식 스키마에 `trigger`·`allowed-tools`·`version` 등 있을 경우 **확장 필드 전면 부재** |
| 2 | **Rules (Project Rules)** | _(Phase 1 채움)_ | `.claude/rules/` 3건 | `cdp-browser.md` / `deployment.md` / `portal_seo.md` | `portal_seo.md`만 `paths:` frontmatter로 경로 자동 로딩. 2건은 경로 필드 없음(상시 포함 의도로 추정) | 공식 포맷이 `paths` 이외 다른 트리거(언어·파일 타입)도 지원하면 미활용 |
| 3 | **Memory (상시)** | _(Phase 1 채움)_ | `CLAUDE.md` + `MEMORY.md` | 리포 루트 / 외장 `~/.claude/projects/.../memory/MEMORY.md` | CLAUDE.md=전역 상시, MEMORY.md=디바이스별 상시(200줄 캡) | 공식 Memory tool이 자동 write/search를 지원하면 현 수동 append 방식 대비 자동화 갭 |
| 4 | **Memory (장기)** | _(Phase 1 채움)_ | 외장 `memory/*.md` 33 항목 | `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/` | `feedback_*` 14 / `project_*` 13 / `user_*` 3 / 기타 3. MEMORY.md에 포인터로 인덱싱 | 공식 Memory tool의 네임스페이스·검색 API 대비 수동 파일 방식. 동기화 프로토콜(MEMORY_CHANGELOG)은 프로젝트 고유 |
| 5 | **Routines (정기 작업)** | _(Phase 1 채움)_ | 미도입 (명시적 Routines 자산 없음) | — | 세션 시작/마감은 수동 Skill 호출. `scripts/mk-push.sh`·`mk-pull.sh`가 준(準) 루틴 | 공식 Routines가 트리거·스케줄을 제공하면 현 수동 절차 **전면 이식 대상** |
| 6 | **Subagents** | _(Phase 1 채움)_ | 막내N (병렬 CLI 세션) | iTerm `mk-c` 풀 권한 세션 | 작가님이 CLI에서 수동 투입. 쌍아가 Agent tool로 spawn 금지(헌법 위반 기록) | 공식 Subagent API가 spawn·관제를 제공하면 현 "작가님 수동 투입" 패턴과 **직접 충돌** — 헌법 재해석 필요 |
| 7 | **Hooks / Event triggers** | _(Phase 1 채움)_ | 미도입 | — | 세션 시작 시 `git fetch` 등 수동 Skill | 공식 훅 기반 자동화가 있으면 전환 가치 큼 |
| 8 | **Tools / MCP** | _(Phase 1 채움)_ | MCP 다수 연결 (Gmail·Calendar·Drive·Docs·GSC·GA·Cloudflare·Playwright·google-docs 등) | 본 세션 ToolSearch 가용 목록 | 에이전트별 권한 차등(민아=풀 퍼미션, 막내=제한적) | 공식 MCP 권한 모델 대비 MONK 자체 권한표(ch1 민아 권한) 이원화 |
| 9 | **Agent SDK / Session** | _(Phase 1 채움)_ | 쌍아(VSCode extension) + 민아(Desktop App) + 막내(iTerm) | — | "VSCode extension → 쌍아, worktree → 민아" 자동 판별 키워드 (ch1 5조 + MEMORY.md) | 공식 Session 개념 도입 시 판별 로직 재정의 필요 |
| 10 | **Prompt / Task spec** | _(Phase 1 채움)_ | ORDER (지시서) | `monkos-ops/ops/orders/ORDER_YYYYMMDD_*.md` | YAML frontmatter + 역할 선언 + 준수 조항 + 완료 보고 형식. 쌍아가 발행 | 공식 Task 포맷 도입 시 번역 레이어 필요. ORDER는 MONK 고유 통치 프로토콜 포함 |
| 11 | **Governance / Constitution** | _(Phase 1 채움)_ | 헌법 5축 + 법률 8장 + Skills + MEMORY | `CLAUDE.md` / `governance/laws/*.md` / `.claude/skills/*.md` | 4계층 위계, 개정 절차 정규화, append 보존 | **공식 대응 없음** — MONK 고유 통치 레이어 |
| 12 | **Portfolio lifecycle** | _(Phase 1 채움)_ | PF 13건 | `monkos-ops/ops/portfolios/PF_*` | 비전·히스토리(append)·Phase·성과·복기·문서인덱스·리스크 단일 문서 | **공식 대응 없음** — MONK 고유 자산 |

---

## 범례

- **공식 개념**: Claude 4.7 / Claude Code / Agent SDK 공식 용어. Track A가 정식 문서 인용으로 확정.
- **MONK OS 대응 자산**: 해당 개념에 1:1 혹은 부분 대응하는 현 MONK 자산.
- **물리 경로**: 리포 내 실제 위치.
- **현 운용 방식**: 막내4가 전수 감사로 확인한 실제 동작.
- **초기 갭 플래그**: 막내4 판단. Track A 결과와 대조 전 단순 관찰 — 결론 아님.

---

## Phase 1 병합 가이드 (쌍아용)

1. **Track A `RESEARCH_A_anthropic.md` 도착** → 공식 개념 열 채움.
2. **#11·#12 (MONK 고유)**: 공식 대응이 없다고 확정되면 "MONK OS 외부 이식 시 추가 레이어로 선언" — 로드맵 **포팅 가치** 축 설계의 근거.
3. **#5·#7 (Routines / Hooks)**: MONK가 미도입 = 이식 확장 포인트.
4. **#6 (Subagents)**: 헌법 5조(메타) 재해석 필요 영역 — 개헌 청구 후보로 승격 여부 검토.
5. **#1·#2 (Skills / Rules)**: 확장 필드 갭 목록화 → Phase 2에서 일괄 보정 지시서 발행 근거.

---

> 본 매트릭스는 2026-04-23 11:44~KST 기준 MONK 측 스냅샷. Track A 도착 시 공식 열 합본 + 신규 개념 행 추가.
