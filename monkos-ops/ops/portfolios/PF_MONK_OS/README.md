---
type: portfolio
id: PF_MONK_OS
name: "MONK_OS"
subject: "어떤 에이전트에도 이식 가능한 범용 Agent OS로의 진화 로드맵"
created: 2026-04-23
owner: 작가님
leads: "iMac/쌍아(설계·통합), iMac/막내1~4(병렬 리서치·감사), 민아(검증·통합 보조)"
status: active
domain: "governance/infrastructure"
---

# PF_MONK_OS — Portable Agent Operating System

> Claude 4.7 체제 전환(Skills·Rules·Routines·Memory 재편)을 계기로, MONK OS의 현 안정성을 바탕으로 **어떤 LLM/에이전트 런타임에도 이식 가능한 범용 OS 레이어**로 승격하는 로드맵을 설계한다.

---

## 1. 비전

**"작가님의 프로젝트 헌법이 어떤 에이전트 런타임 위에도 입혀질 수 있는 OS가 된다."**

### 왜 이것을 하는가

- Claude 4.7 이후 Anthropic이 **Skills/Rules/Routines/Memory**를 표준 레이어로 끌어올리는 흐름 — 우리의 `.claude/rules/`·`.claude/skills/`·MEMORY.md 체계와의 정합성 재점검 필요
- Google ADK, OpenAI AgentKit, Kimi K2.6 등 **멀티 런타임 시대** 도래 — 단일 벤더 종속 리스크
- 작가님 방침: "AI 본체 없이 가장 똑똑한 에이전트" (memory/project_monkos_endgame.md) — 본 PF가 그 구현 축
- 현 체제(헌법 5축 + 법률 8장 + Skills + MEMORY)가 우연히 잘 굴러가는 게 아니라 **이식 가능한 아키텍처**임을 증명

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| Claude 4.7 표준 정합도 | 미측정 | 갭 리스트 도출 | 법률/스킬 정비 완료 |
| OS 이식성 (target runtime) | Claude Code 1종 | 2종 (Claude+α) 구조 설계 | 3종 런타임 PoC |
| 개헌 청구안 수렴 | 0 | 초안 1건 | 통과 1건 이상 |

### 아키텍처 정본 ⭐

> 본 PF의 핵심 실체. "무엇을 이식할지" = **하네스**(모델 독립 오케스트레이션 골격).

- **[하네스 아키텍처](architecture/HARNESS_ARCHITECTURE.md)** (2026-06-10 정립) — 정찰병 원리(탐색→코드 정착) · v2 운영모델 · 강제력 스펙트럼 · 자판기/판단/게이트 계층 · 로컬 기축(비대칭 벽) · 모델 배치 계층(스냅샷) · 블로그 하네스 첫 적용 · 3PF 위계
- 한 문장: **에이전트로 탐색하고, 패턴이 잡히면 코드로 정착시킨다. 모델은 부품, 하네스는 골격.**

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** 신규 항목은 하단에 추가.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 2026-04-23 | iMac/쌍아 | PF_MONK_OS 창설, 4트랙 리서치 설계 | README.md (본 문서) | ✅ |
| 2026-04-23 | iMac/쌍아 | Track C(Kimi K2.6) 지시서 초안 (→ 이후 막내3으로 재배정) | ORDER_…_C_kimi_k26.md | 🔀 |
| 2026-04-23 | iMac/쌍아 | 막내 4기 병렬 지시서 4종 정교화 발행 (A/B/C/D) | ORDER_…_A/B/C/D_*.md | ⏳ |
| 2026-04-23 | iMac/막내2 | Track B — 업계 방향성 리서치 완료 (12축 + 표준 수렴 지도 + 3문항 답) | [RESEARCH_B_industry.md](research/RESEARCH_B_industry.md) | ✅ |
| 2026-04-23 | iMac/막내3 | Track C — Kimi K2.6 총체 리서치 완료 (10축 + 출처 34종 + 확인필요 8건) | [RESEARCH_C_kimi_k26.md](research/RESEARCH_C_kimi_k26.md) | ✅ |
| 2026-04-23 | iMac/막내4 | Track D — 현 MONK OS 체제 감사 완료 (12축 전수, 강점 3·약점 3·개헌 후보 3, 쌍아 확인 요청 8건) | [AUDIT_current_monk_os.md](audit/AUDIT_current_monk_os.md) + [GAP_MATRIX.md](audit/GAP_MATRIX.md) | ✅ |
| 2026-04-23 | iMac/막내1 | Track A — Anthropic 최신 체제 11축 + MONK OS 매핑 완료 | [RESEARCH_A_anthropic.md](research/RESEARCH_A_anthropic.md) | ✅ |
| 2026-04-23 | 작가님 | IAM·SA 전수 재조정·분기 재설계 결정 → [PF_SECURITY](../PF_SECURITY/README.md) 신설. Phase 0 완료가 착수 트리거 (= **지금 충족**) | PF_SECURITY/README.md + DECISION_Google_Ads_MCP_답신 | ✅ |
| 2026-04-23 | iMac/쌍아 | Phase 1 통합 로드맵 초안 작성 (4트랙 합성 + 개헌 후보 6건 + PoC 3건 + 지시서 큐 9건) | [ROADMAP_portable_agent_os.md](roadmap/ROADMAP_portable_agent_os.md) | ✅ |
| 2026-04-23 | iMac/쌍아 | claude.ai UI 개편 로드맵 전면 반영 (§2.5 Cross-Surface 매트릭스 + H-7 + PoC-4 신설) → H-7 선행 실측 지시서 발행 | ORDER_…_H7_claudeai_UI실측.md | ⏳→✅ |
| 2026-04-23 | iMac/민아 | H-7 선행 실측 완료 — Connectors 260+ / Plugins 10(Anthropic) / Skills 마켓 / 자동 동기화 ❌ / PoC-4 정본 스펙 확정 / 후속 지시서 5건 제안 | [RESEARCH_SURFACE_claudeai_UI.md](research/RESEARCH_SURFACE_claudeai_UI.md) | ✅ |
| 2026-05-09 | iMac/쌍아 | **문서체계 총정리 세션 — PF·어젠다·세션로그·memory 전면 정비** | 아래 상세 | ✅ |
| 2026-05-09 | iMac/막내1 | 리서치: 현행 헌법 vs PF 정합성 진단 (6대 갭 식별) | [RESEARCH_20260509_막내1_헌법PF정합성진단.md](research/RESEARCH_20260509_막내1_헌법PF정합성진단.md) | ✅ |
| 2026-05-09 | iMac/막내2 | 리서치: Claude Code 최신 정책 시사점 (4계층 정합 확인, CLAUDE.md 200줄 권장) | [RESEARCH_20260509_막내2_클로드정책_시사점.md](research/RESEARCH_20260509_막내2_클로드정책_시사점.md) | ✅ |
| 2026-05-09 | iMac/막내3 | 리서치: PF 체계 개정안 설계 (4축 — 정본통일/카테고리열/환류규율/인덱스) | [RESEARCH_20260509_막내3_PF체계_개정안.md](research/RESEARCH_20260509_막내3_PF체계_개정안.md) | ✅ |
| 2026-05-09 | iMac/막내1 | memory/ 외장 22개+sonnet/ 정본 이관 및 삭제. MEMORY.md만 잔류 | COMPLETION_20260509_막내1 | ✅ |
| 2026-05-09 | iMac/막내2 | 문서체계 전수스캔 51폴더 (활성16/반활성14/비활성6/레거시14/정본충돌1) | [AUDIT_20260509_문서체계_전수스캔.md](audit/AUDIT_20260509_문서체계_전수스캔.md) | ✅ |
| 2026-05-09 | iMac/막내3 | PF 인덱스 7→16 전수등록 + YAML 4건 수정 + 히스토리 열 2건 보정 | COMPLETION_20260509_막내3 | ✅ |
| 2026-05-09 | iMac/막내4 | 어젠다 README 현행화 (3/26→5/9, 신규 4건 #33~#36) | COMPLETION_20260509_막내4 | ✅ |
| 2026-05-09 | iMac/막내5 | 세션로그·보고서·지시서 262건 월별 폴더 일괄 이동 (git mv) | COMPLETION_20260509_막내5 | ✅ |
| 2026-05-09 | iMac/막내3 | 워크트리 잔해 24개 삭제 (2.3GB 해방) + 한글 빈 폴더 4개 삭제 + 바이너리 72건 판정 | COMPLETION_20260509_막내3_워크트리정리 | ✅ |
| 2026-05-09 | iMac/막내1 | iMac 로컬 폴더 전수 파악 + 정리 로드맵 설계 (22GB 해방 가능) | [AUDIT_20260509_iMac로컬_정리로드맵.md](audit/AUDIT_20260509_iMac로컬_정리로드맵.md) | ✅ |
| 2026-05-09 | iMac/막내1 | 로컬 P0 삭제 16건 + 산재 파일 정위치 14건 + 본진 이관 1건. 루트 파일 0건 달성 | COMPLETION_20260509_막내1_로컬정리실행 | ✅ |
| 2026-05-09 | iMac/쌍아 | CLAUDE.md 경량화 222→198줄 (디바이스맵→ch1참조, 규정참조→rules 이관) | 커밋 9dd4d0e | ✅ |
| 2026-05-09 | iMac/쌍아 | monkos-chat Git 추적 해제 (.gitignore + git rm --cached) | 커밋 473583d | ✅ |
| 2026-05-09 | iMac/쌍아 | rules 4개 신설 (session-log, pf-ops, git-safety, makne-guard) + deployment frontmatter 보강 | — | ✅ |
| 2026-05-13 | iMac/쌍아 | **디바이스 인프라 정비 세션** — 전 디바이스 Claude Code 설정 전수 수집·정본화 | 아래 상세 | ✅ |
| 2026-05-13 | iMac/막내1 | 디바이스 설정 전수 수집 (iMac/M1 완료, 4060 SSH키 미등록, M2 offline) | `monkos-ops/ops/devices/` 폴더 구조 + 4개 프로필 | ✅ |
| 2026-05-13 | iMac/쌍아 | M1 SSH 호스트 등록 + SSH 키 등록 (비밀번호 없이 접속 가능) | `~/.ssh/config` m1 추가 | ✅ |
| 2026-05-13 | iMac/쌍아 | M1 Tailscale VNC 화면 공유 연결 확인 (ping 8ms, P2P 직결) | — | ✅ |
| 2026-05-13 | iMac/쌍아 | M1 Claude Code CLI 설치 (2.1.140) + model → opus-4-6[1m] 통일 | M1 `~/.claude/settings.json` | ✅ |
| 2026-05-13 | iMac/쌍아 | 4060 설정값 전수 수집 (sshpass 경유) + DEVICE_PROFILE 갱신 | `devices/w4060/DEVICE_PROFILE.md` | ✅ |
| 2026-05-13 | iMac/쌍아 | 4060 CLI 업데이트 (2.1.52→2.1.140) + model → opus-4-6[1m] 통일 | 4060 `settings.json` | ✅ |
| 2026-05-13 | iMac/쌍아 | 디바이스 맵 현행화 — 운용 디바이스 3맥+iPhone, M2/M4 팀원용 보류 | `devices/README.md` | ✅ |
| 2026-05-14 | iMac/막내1 | VSCode 전수조사 (1.108~1.120, 13버전) + MONK 도입 인사이트 13건 도출 | `reports/2026-05/REPORT_20260514_막내_VSCode전수조사.md` | ✅ |
| 2026-05-14 | iMac/막내1 | VSCode 셋업 실행 — 스니펫 6종 + 터미널 설정 2건 + 구버전 확장 2건 정리 | `.vscode/monk.code-snippets` + settings.json 보강 | ✅ |
| 2026-05-20 | iMac/막내1 | 운영 대시보드 기획 — 데이터 소스 16컬렉션 전수 파악, 방안 A~D 비교, 추천: 하이브리드(D), KPI 19개 정의, 4Phase 로드맵 | `reports/2026-05/REPORT_20260520_막내1_운영대시보드_기획.md` | ✅ |
| 2026-05-20 | iMac/쌍아 | **CLI↔웹 에이전트 협업 패턴 발견** — IDPASS 200국 데이터 검증에서 CLI 막내(대량 초벌·B/C등급) vs 웹 철창이(1건씩 공식소스 A등급 검증) 분업이 자연 발생. 동일 Opus 4.6이지만 운용 방식(배치 vs 대화형 심층)이 품질 결정. **인사이트: 루틴스로 공식 규정 변경 감시 → 자동 보고 → 막내 반영 파이프라인 구성 가능** | 본 히스토리 | ✅ |
| 2026-06-08 | iMac/민아 | **MONK OS 구조 자기인식 정립** — 작가님과의 설계 대화에서 PF/Skills/거버넌스 3축 관계·PF의 업계 정체(Agent-Native Project Aggregate)·세션→자산 결정화 사다리·"살아있는 시스템" 운용원리를 명문화. 범용 OS 이식의 이론적 토대(비전 §1 "이식 가능한 아키텍처임을 증명"에 직결) | [세션로그](../../sessions/2026-06-08_iMac_민아.md), 복기 교훈 2 | ✅ |
| 2026-06-10 | iMac/민아 | **하네스 아키텍처 정립 — PF draft→active 승격** | 작가님 ↔ 민아 설계 대화에서 비전의 "실체"(하네스=모델 독립 골격) 도출. 정찰병 원리·v2 운영모델·강제력 스펙트럼·자판기/판단/게이트 계층·로컬 기축(비대칭 벽)·모델 배치 2계층 스냅샷·블로그 하네스 첫 적용 명문화. 4060 실측(PF_FACTORY) 연계 + 3PF 위계 확정 | [HARNESS_ARCHITECTURE.md](architecture/HARNESS_ARCHITECTURE.md) | ✅ |
| 2026-06-10 | iMac/막내2 | **아키텍처·코드 품질 전수 조사** — Fable 5 보고 검증: 데드코드 5건 확인+1건 오탐+2건 신규발견, 라이브 6서비스 품질점검(84% 중복·테스트 제로·의존성 불일치), CI/CD 현황(자동배포 없음·보안게이트만 활성). 총 ~147MB 절감 가능 | [REPORT_20260610_iMac막내2_아키텍처전수조사.md](../../reports/2026-06/REPORT_20260610_iMac막내2_아키텍처전수조사.md) | ✅ |
| 2026-06-10 | iMac/막내4 | **거버넌스·문서 체계 전수 조사** — Fable 5 보고 검증: MEMORY.md 부재=오탐 확정, ch1·ch2·ch8 rules 미반영=실재, 정본 이중화 1건→9건 확대 발견, skills 조항오참조 2건, PF 500줄 초과 2건(CROP 692/SPREAD 513), 세션로그 폴더 위반 10건(최근 회귀), 미완료 지시서 303건 적체. 문서:코드 비율 5.54:1 | [REPORT_20260610_iMac막내4_거버넌스전수조사.md](../../reports/2026-06/REPORT_20260610_iMac막내4_거버넌스전수조사.md) | ✅ |
| 2026-06-10 | iMac/막내2 | **ch1 위성 에이전트 신설 영향평가 B조** — 데몬·팀원 경계(충돌 없음), ch3·ch4 정합(세션 마감 해석 단서 1건 보정 권고), ch5·ch6(적용 외/형식적 긴장만), secret-scan PR 커버 확인. **찬성(조건부)**, 보정 3건 권고 | [REPORT_20260610_iMac막내2_ch1개정_영향평가B.md](../../reports/2026-06/REPORT_20260610_iMac막내2_ch1개정_영향평가B.md) | ✅ |
| 2026-06-10 | iMac/막내1 | **ch1 위성 에이전트 신설 영향평가 A조** — 쌍아 전권(설계·지시서·governance) 충돌 없음, 민아(로컬) 역할 분화 자연 성립(라이브 vs 정적), 서브에이전트 vs 막내 체계 우회 없음(ch1 2조 3항 선례 일치), ch7 5조 MEMORY 의무 vs 위성 부재 양립 가능, 판별 테이블 배타성 확인. **승인 권고**, 보정 4건(지시서 발행 항목 누락·ch7 위성 단서·ch7 적용 범위·판별 우선순위 명시) | [REPORT_20260610_iMac막내1_ch1개정_영향평가A.md](../../reports/2026-06/REPORT_20260610_iMac막내1_ch1개정_영향평가A.md) | ✅ |
| 2026-06-10 | iMac/막내2 | **삼권 분석 행정** — rules 9개·skills 14개 전수 점검. rules 이관 2건(cdp-browser 125줄→skills, portal_seo 72줄→skills), 삭제 1건(references 21줄), 유지 6건. skills 조항오참조 3건(구 7조 잔재: makne-finish 2건, session-end 1건). paths→globs 변환 필요 2건. 시나리오 A 채택 권고. 항상 로딩 368줄 변동 없음 | [REPORT_20260610_iMac막내2_삼권분석_행정.md](../../reports/2026-06/REPORT_20260610_iMac막내2_삼권분석_행정.md) | ✅ |
| 2026-06-10 | iMac/막내1 | **삼권 분석 입법** — 4계층(CLAUDE.md/rules/laws/skills) 전 33파일·2,985줄 전수 감사. 헌법↔rules 중복 64줄(15%) 식별(references.md 100%중복, git-safety 61%중복). laws↔rules 불일치 0건. rules 미반영 3장(ch1·ch2·ch8) 확인. 재배치 매트릭스 45조 전건 판정. rules 재편안: 삭제 1+축소 3(−53줄), 신설 3(+65줄), 커버리지 63%→100%. CLAUDE.md 보정 3건(ch7 조수, 5조 물리위치, deployment 중복) | [REPORT_20260610_iMac막내1_삼권분석_입법.md](../../reports/2026-06/REPORT_20260610_iMac막내1_삼권분석_입법.md) | ✅ |
| 2026-06-10 | iMac/막내3 | **삼권 분석 사법** — 헌법·법률 전 33 위반조항 집행 수단 전수 감사. 자동 2건(6%)/수동-에이전트 14건(42%)/없음 14건(42%). CI 집행 권고 8건(C1~C8): 즉시 3건(내부호칭grep·PF줄수·폴더위반), 중기 3건(정본이중화·YAML검증·rules↔laws정합). rules→skills 이관 시 3파일(git-safety·deployment·data-access) 이관금지 판정. 위성 PR 게이트 4건 권고 | [REPORT_20260610_iMac막내3_삼권분석_사법.md](../../reports/2026-06/REPORT_20260610_iMac막내3_삼권분석_사법.md) | ✅ |
| 2026-06-10 | iMac/막내3 | **CI 즉시 3건 구현** — governance-check.yml 신설(C7 내부호칭 grep warning + C3 폴더위반 error 차단), weekly-dashboard.yml C2 PF 500줄 초과 검사 추가. 로컬 검증: C7=19건, C3=10건(기존위반분), C2=PF_CROP 692줄+PF_SPREAD 514줄 감지 | `governance-check.yml` 신설, `weekly-dashboard.yml` 수정 | ✅ |
| 2026-06-10 | iMac/막내1 | **ch1 법률 개정 + CLAUDE.md 보정** — 웹 민아(위성 에이전트) 신설: 1조 정의 테이블+권한표, 2조 6항(위성 산출물 검증 절차), 4조 디바이스 약칭, 5조 판별 테이블(최우선 매칭), 위성 관측 한계 고지 의무 신설항. CLAUDE.md ch7 조수 5→6 보정. PETITION_20260610 전항 반영 완료 | `ch1_agent_system.md`, `CLAUDE.md` | ✅ |
| 2026-06-10 | iMac/막내2 | **rules 정리 + skills 보정 실행** — Task 1~6 전건 완료. 삭제 3건(references, cdp-browser, portal_seo), skills 이관 2건(cdp-browser 통합, portal-context), 헌법 복붙 제거 4건, 조항번호 보정 3건, paths→globs 2건, **rules 3건 신설(agent-system·coding·branding)** — ch1 개정 반영 웹 민아 포함. rules 9→9개(삭제3+신설3), skills 14→15개 | rules 9개+skills 3개 변경, 커밋 e75a47f4+본건 | ✅ |
| 2026-06-11 | iMac/막내2 | **rules/session-log.md 보강 + 스킬 15종 commands/ 이동** — session-log.md 32줄→53줄(파일명 10종+정본 위치 통합+수발신 헤더+PF 귀속 규칙, globs 3→8종). `.claude/skills/*.md` 15종→`.claude/commands/` 이동(내용 무변경, skills/ 디렉토리 유지). 웹민아 실측 기반 컨텍스트 로딩 정합 개선 | [COMPLETION](../../reports/2026-06/COMPLETION_20260611_iMac막내2_rules보강+스킬형식전환.md) | ✅ |
| 2026-06-11 | iMac/막내3 | **문서 배치 정합성 검수** — ch4 3조·4조 기준 전수 스캔. 총 32건 위반 식별 (즉시 15건/다음정비 17건). sessions/ 루트 직접 배치 11건, 정본 위치 이탈 5건, 파일명 패턴 위반 14건, 이중화 2건. PR #52 검증: 정상 11건, 주의 3건 | [REPORT](../../reports/2026-06/REPORT_20260611_iMac막내3_문서배치_정합성검수.md) | ✅ |
| 2026-06-11 | iMac/막내3 | **문서 배치 정비 실행 32건** — git mv 27건(sessions 루트→월별 11건, 정본 이동 3건, 리네임 5+5+2건, 리네임+이동 2건) + git rm 1건(이중화 해소). 28건 성공, 3건 보류(에이전트 번호 판별 불가 2건, works 원본 유지 1건) | [COMPLETION](../../reports/2026-06/COMPLETION_20260611_iMac막내3_문서배치_정비실행.md) | ✅ |
| 2026-06-12 | iMac/막내3 | **꾸 역할 확장 삼권심사 사법** — specs-data.json 규격/텍스트 혼재 리스크 중간(PR리뷰로 완화), PF 충돌 낮음(편집 범위 분리), 보안 누락 3건(monkos-ops·.claude·시크릿), 4조 충돌 제한적. **찬성(조건부)** — 파일 범위 명시+PR 리뷰 필수 | [REPORT](../../reports/2026-06/REPORT_20260612_iMac막내3_꾸역할확장_삼권심사_사법.md) | ✅ |
| 2026-06-17 | iMac/쌍아 | **Phase 2 부서제(DIVISION) 설계서 기안** — 6개 부서(MKT·CNT·SEC·ENG·RND·BIZ) 편제, 활성 PF 22개 배치, 3단계 진화(부서장→임원→이사회), 양축 분리(외향/내향). 하네스 상품화 코어 모듈로 위치. 작가님 전략 대화에서 도출: "인간 관리체계로 수렴" + "기능·품질 우선, 효율화는 패턴 잡힌 후 자율 제안" + "내부 호칭→일반 직함 치환 = 상품화" | [설계서](../../../tech/designs/2026-06/DESIGN_20260617_부서제_에이전트체계_DIVISION.md) | ✅ |
| 2026-06-18 | iMac/민아 | **IRGEN(딸깍 IR 생성로직) 엔진 편입** — Phase 2 DIVISION의 BIZ/임원급(2-C) 산출 역량. 디딤돌 탈락 8지적=전부 "오독" 분석 → 오독방어 게이트 6종 + Evidence DB(4Tier 위계·스키마·소스 카탈로그) + 생성 9섹션. 첫 시범출력 IR_PROFILES_v1(→PF_PROFILES). 작가님 승인: 신규 PF 미신설(PF 남발 경계), MONK_OS 메타 귀속 | [PROPOSAL_IRGEN](../../proposals/PROPOSAL_20260618_iMac민아_IRGEN_딸깍IR생성로직.md) | ⏳ |
| 2026-07-16 | iMac/쌍아 | **[어젠다] 메모리 파일 거버넌스 + 디바이스 간 정합성** — Anthropic 멀티파일 메모리(5월~) 도입 후 디바이스별 로컬 분산·에이전트 자율 생성·작성자 추적 불가 문제 식별. 심링크 방식 기각(작가님), 방향: 룰스·스킬·헌법에서 정본 제시 → 메모리는 보조 기억 위상으로 교정. 구체 방안 미확정 — 스킬/URL 정본화 설계 완료 후 재검토 | 본 히스토리 (설계서 미착수) | ⏳ |
| 2026-07-16 | iMac/쌍아 | **SPECS URL 정본화 + 인프라 상수 통일 설계서 기안** — 3회 URL 체계 변경(3/26→5/26→6/14) 원점 추적, specsUrl 빌더 단일화 + COUNTRY_SLUG_TO_ISO 자동 확장 + specs-context 스킬 신설 + ch2 인프라 상수 분산 금지 조항. 민아 교차 토의 대기 | [DESIGN_20260716](../../../tech/designs/2026-07/DESIGN_20260716_SPECS_URL정본화_인프라상수통일.md) | ⏳ |
| 2026-07-16 | iMac/막내1 | **하네스 교정 방향 전수 감사** — 헌법 5조 20항 + 법률 46조항 + 스킬 20개 + 메모리 40개 = 126항목 교차 감사. P0 6건(커밋형식 불일치·에스컬 횟수·portal-context 구식·references.md 미존재·메모리 구식 2건), P1 7건(ch2 7조 신설·시크릿 법률 편입·경로③ 보정·specs-context 신설 등), P2 7건. 전체 정상률 84% | [COMPLETION](../../reports/2026-07/COMPLETION_20260716_iMac막내1_MONKOS_하네스교정감사.md) | ✅ |
| 2026-09-30 | iMac/민아 | **기능부 편성 설계서 기안(4MUSE 하네스)** — 작가님 구상(디자인 소소·운영실행 쌍아·마케팅기획 민아·총괄 용아)을 Phase 2-C 총괄 + 대화형 주 세션 4부로 설계. DIVISION 6부는 4부 산하 루틴으로 흡수 매핑. `--agent` 정의 파일 4개 기반 2주 시범(10-01~14) → 실측 근거 개헌. 작가님 결정 4건 대기 | [DESIGN_20260930](../../../tech/designs/2026-09/DESIGN_20260930_기능부편성_4MUSE하네스.md) | ⏳ |
| 2026-09-30 | iMac/민아 | **하네스 vs 업계 표준 거리·방향 보고** — 12축 매트릭스(앞섬 3·동등 3·뒤짐 5·독자 1). 판정: 업계가 우리 구조로 수렴, 갭은 집행 코드화·런타임 기능 미사용·자기 평가 부재. 발견: rules `globs:` 키 오기로 조건부 로딩 무효(전량 로딩). 결정 5건 대기(D4 = Phase 1 "묶음 A/B/C" 본 보고로 대체 종결 제안) | [REPORT_20260930](../../reports/2026-09/REPORT_20260930_iMac민아_하네스_업계표준_거리와방향.md) | ⏳ |
| 2026-09-30 | iMac/민아 | **D2 집행 + D1 집행코드화 설계** — rules `globs:`→`paths:` 교정(작가님 승인, 상시 로딩 12→5). 집행 코드화 설계서: 14조항 4층(deny·PreToolUse·git hook·CI) 배치, P0 5·P1 5·P2 4, E10 승인 논스 훅(ch1 7조 예고분) 포함. **작가님 15:09 승인** — E10은 채팅 승인 문구→세션 바인딩 토큰(터미널은 예비). 구현 지시서는 쌍아 | [DESIGN_집행코드화](../../../tech/designs/2026-09/DESIGN_20260930_집행코드화_hooks_deny.md) | ✅ 설계 / ⏳ 구현 |
| 2026-09-30 | iMac/민아 | **집행 코드화 P0·P1 구현 [예외·추인 대기]** — deny 16 통일 + 훅 3이벤트(guard_bash·guard_write·prompt_submit·session_start) + E10 채팅 승인→세션 토큰 + approve.sh 예비. 스모크 59/59, 실세션 bypass 차단 실측. GAP_MATRIX 7행(Hooks) 부분→**해소**, ch1 7조 "논스 훅 전까지 한계" 해소 조건 충족(법률 개정 후속) | [COMPLETION](../../reports/2026-09/COMPLETION_20260930_iMac민아_집행코드화_훅_P0P1.md) | ✅ |
| 2026-09-30 | iMac/민아 | **DESIGN** PF 수기 노트 → 원장(ledger) 체계 — 마크다운 정본 유지 + 쓰기 자동화·파생 뷰·교차 링크 검사·구조화 질의 4단 | [DESIGN_20260930_PF원장화_pf_ledger](../../../tech/designs/2026-09/DESIGN_20260930_PF원장화_pf_ledger.md) | ⏳ |
| 2026-09-30 | iMac/민아 | **PF 원장 1단계 구현** — pf.sh append/query/check/show + PostToolUse 자동 링크 훅 + Stop 경고 훅 + CI C15 + pf-ops 규칙. 스모크 17/17. 실레포 check 5/5, 활성 PF 30일+ 정체 20건 첫 가시화. 자동 링크 훅이 본 설계서 Write에 라이브로 걸려 수동 중복을 pf.py가 거부(dogfood 실증) [예외·추인 대기] | [pf](../../../../scripts/pf.py) | ✅ |
| 2026-09-30 | iMac/민아 | **COMPLETION** PF 원장화 1단계 — pf.sh CLI + 자동 링크 훅 + Stop 경고 + CI C15 | [COMPLETION_20260930_iMac민아_PF원장화_1단계](../../reports/2026-09/COMPLETION_20260930_iMac민아_PF원장화_1단계.md) | ✅ |
| 2026-10-01 | iMac/민아 | **REPORT** 도구 전수조사 143건 — 등재·업데이트·레거시·중복 분류와 처분안 | [REPORT_20261001_iMac민아_도구전수조사_분류](../../reports/2026-10/REPORT_20261001_iMac민아_도구전수조사_분류.md) | 📁 |
| 2026-10-01 | iMac/민아 | **COMPLETION** 도구 전수조사 처분 집행 — 레거시 21 이동 · 이중 소스 2쌍 해소 · 도구 맵 범위 규칙 · 등재 20 | [COMPLETION_20261001_iMac민아_도구전수조사_처분집행](../../reports/2026-10/COMPLETION_20261001_iMac민아_도구전수조사_처분집행.md) | ✅ |
| 2026-10-01 | iMac/민아 | **세션 간 통로 실측 + 승인 게이트 공백 실측** — 세션 간 메시지: 권한 모드 상이 시 수신 측 무음 보류→약 5분 만료(민아→쌍아 1차), 모드 일치(bypass) 시 무보류 직접 수신(쌍아→민아) · 세션 재시작 시 이름 변경. E10 승인 토큰: 문구 조합만으로 발급(민아 세션 3회·당일 전체 6회, 사용 0), 서브에이전트가 부모 세션 ID 공유, MCP 도구 대상 훅·deny 0건. 턴 출처(human/peer/system)는 세션 기록에 기존재. GitHub 필수 검토자는 비공개 레포 불가(문서 확인) → 세분화 토큰 대안. 설계·집행은 쌍아 훅 보강 묶음 대기. 근거: 세션로그 2026-10-01_iMac_민아 12:23~13:01 | — | ✅ |
| 2026-10-01 | iMac/민아 | **PROPOSAL** 서브에이전트 설계 최적안 — 얇은 일꾼, 두꺼운 지시서 (시작 적재 72k → 5k 실측) | [PROPOSAL_20261001_iMac민아_서브에이전트설계_최적안](../../proposals/PROPOSAL_20261001_iMac민아_서브에이전트설계_최적안.md) | ⏳ |
| 2026-10-01 | iMac/쌍아 | **REPORT** 민아 09-30~10-01 경로③ [예외] 실행 5건(+미신고 1) 사후 추인 | [REVIEW_20261001_iMac쌍아_민아_0930-1001_사후추인](../../reports/2026-10/REVIEW_20261001_iMac쌍아_민아_0930-1001_사후추인.md) | 📁 |
| 2026-10-01 | iMac/쌍아 | **ORDER** 서브에이전트 정의 2장(reader·writer) 신설 + record-explorer 경량화 + 운용 규범 5줄 | [ORDER_20261001_iMac쌍아_쌍아-막내1_서브에이전트정의_리드라이트](../../orders/2026-10/ORDER_20261001_iMac쌍아_쌍아-막내1_서브에이전트정의_리드라이트.md) | ⏳ |
| 2026-10-01 | iMac/쌍아-막내1 | 서브에이전트 정의 2장(reader·writer) 신설 + record-explorer 헌법 제외 + agent-system 운용 규범 — 시작 적재 5.4k/5.2k/4.9k, 모델 sonnet-5-5, 훅 차단 실측 | [COMPLETION_20261001_iMac쌍아-막내1_서브에이전트정의](../../reports/2026-10/COMPLETION_20261001_iMac쌍아-막내1_서브에이전트정의.md) | ✅ |
| 2026-10-01 | iMac/민아 | **REPORT** 서브에이전트 정의 2장(reader·writer) 집행 감사 + 통신 체계 시험 ①~⑦ 결과 | [REVIEW_20261001_iMac민아_서브에이전트정의_감사](../../reports/2026-10/REVIEW_20261001_iMac민아_서브에이전트정의_감사.md) | 📁 |
| 2026-10-01 | iMac/민아 | **REPORT** 10-01 새 편제 논의 — 작가님 결정·실측·정정·미결 정리 (통신·보안·서브에이전트) | [REPORT_20261001_iMac민아_새편제_결정실측_정리](../../reports/2026-10/REPORT_20261001_iMac민아_새편제_결정실측_정리.md) | 📁 |
| 2026-10-01 | iMac/민아 | **PROPOSAL** 10-01 새 편제 청구안 준비 — 민아 의견(한 줄 인덱스·절차 자동화) + 쌍아 논의 쟁점 + 삼권 심사식 합의 절차 | [PROPOSAL_20261001_iMac민아_청구안준비_민아의견_합의절차](../../proposals/PROPOSAL_20261001_iMac민아_청구안준비_민아의견_합의절차.md) | ⏳ |
| 2026-10-01 | iMac/쌍아 | **ORDER** 청구안 준비 삼권 심사 — 입법 심사역(쌍아-막내2) | [ORDER_20261001_iMac쌍아_쌍아-막내2_청구안준비_입법심사](../../orders/2026-10/ORDER_20261001_iMac쌍아_쌍아-막내2_청구안준비_입법심사.md) | ✅ |
| 2026-10-01 | iMac/쌍아 | **ORDER** 청구안 준비 삼권 심사 — 행정 심사역(쌍아-막내3) | [ORDER_20261001_iMac쌍아_쌍아-막내3_청구안준비_행정심사](../../orders/2026-10/ORDER_20261001_iMac쌍아_쌍아-막내3_청구안준비_행정심사.md) | ✅ |
| 2026-10-01 | iMac/쌍아 | **ORDER** 청구안 준비 삼권 심사 — 사법 심사역(쌍아-막내4) | [ORDER_20261001_iMac쌍아_쌍아-막내4_청구안준비_사법심사](../../orders/2026-10/ORDER_20261001_iMac쌍아_쌍아-막내4_청구안준비_사법심사.md) | ✅ |
| 2026-10-01 | iMac/쌍아-막내2 | **REVIEW** 청구안 준비 삼권 심사 — 입법 심사(목적 적합성) 의견서 | [REVIEW_20261001_iMac쌍아-막내2_청구안준비_입법심사](../../reports/2026-10/REVIEW_20261001_iMac쌍아-막내2_청구안준비_입법심사.md) | 📁 |
| 2026-10-01 | iMac/쌍아-막내3 | **REVIEW** 청구안 준비 삼권 심사 — 행정 심사 의견서 (운영 표면·집행 순서·비용·위성·P1 연계) | [REVIEW_20261001_iMac쌍아-막내3_청구안준비_행정심사](../../reports/2026-10/REVIEW_20261001_iMac쌍아-막내3_청구안준비_행정심사.md) | 📁 |
| 2026-10-01 | iMac/쌍아-막내4 | **REVIEW** 청구안 준비 삼권 심사 — 사법 심사 의견서 (실패 시나리오·대안 조문·원칙 7건 표결) | [REVIEW_20261001_iMac쌍아-막내4_청구안준비_사법심사](../../reports/2026-10/REVIEW_20261001_iMac쌍아-막내4_청구안준비_사법심사.md) | 📁 |
| 2026-10-01 | iMac/민아 | **REPORT** 원격 편제 청구안 — 작가님 심사 요청 (5인 조율 최종안, 발효 묶음 A·B·C + 결정 항목) | [REPORT_20261001_iMac민아_원격편제청구안_심사요청](../../reports/2026-10/REPORT_20261001_iMac민아_원격편제청구안_심사요청.md) | 📁 |
| 2026-10-01 | iMac/민아 | **REPORT** 원격 편제 개정 집행(09ae2c30) 실물 대조 — 묶음 A·B 반영 확인, 잔존 불일치 2건 | [REVIEW_20261001_iMac민아_원격편제_집행대조](../../reports/2026-10/REVIEW_20261001_iMac민아_원격편제_집행대조.md) | 📁 |
| 2026-10-01 | iMac/민아 | **ORDER** M2 Remote Control 개통(iMac↔M2 세션 간 통신) + 10-01 헌법 개정 수신·위성 헌법 동기화 + 미푸시 커밋 정리 | [ORDER_20261001_iMac민아_M2쌍아_원격통신개통_헌법개정수신](../../orders/2026-10/ORDER_20261001_iMac민아_M2쌍아_원격통신개통_헌법개정수신.md) | ⏳ |
| 2026-10-01 | iMac/쌍아 | **[개헌] 집행** 원격 편제 정식화 — 헌법 1조 2항(꾸 현장 책임자·경로①④) + ch1·ch3 개정, 5인 만장일치 + 작가님 승인. 묶음 C 조건부·⑥b 차회 | [PETITION_20261001_쌍아민아_원격편제_서브에이전트_위임기록](../../../../governance/constitution/petitions/PETITION_20261001_쌍아민아_원격편제_서브에이전트_위임기록.md) | ✅ |
| 2026-10-01 | iMac/민아 | **COMPLETION** 기기 간 발신 승인 설정(isolatePeerMachines) 제거 — 웹 원격에서 버튼 병목 해소 | [COMPLETION_20261001_iMac민아_기기간발신승인설정_제거](../../reports/2026-10/COMPLETION_20261001_iMac민아_기기간발신승인설정_제거.md) | ✅ |
| 2026-10-02 | iMac/민아 | **COMPLETION** 꾸 우체통 워처(mailbox_watcher.sh) 폐기 — 프로세스만 살아 있고 전달 기능은 07-13 이후 0 | [COMPLETION_20261002_iMac민아_우체통워처_폐기](../../reports/2026-10/COMPLETION_20261002_iMac민아_우체통워처_폐기.md) | ✅ |
| 2026-10-02 | iMac/민아 | **COMPLETION** 광고 드롭 업로더(ads-sync·ads_upload.sh) 폐기 — 아이디어는 제안서로 존치, GCS 자산은 라이브 소비 중이라 존치 | [COMPLETION_20261002_iMac민아_광고업로더_폐기](../../reports/2026-10/COMPLETION_20261002_iMac민아_광고업로더_폐기.md) | ✅ |
| 2026-10-02 | ?/? | **ORDER** 세션 이름 자동 지정(기기-역할-날짜-시각) + 새 세션 원격 자동 연결 + 옛 인스턴스 보고 — 세션 간 통신이 새 대화에 승계되지 않는 문제 해소 | [ORDER_20261002_iMac민아_iMac쌍아_세션이름자동화_원격자동연결](../../orders/2026-10/ORDER_20261002_iMac민아_iMac쌍아_세션이름자동화_원격자동연결.md) | ⏳ |
| 2026-10-02 | ?/? | **ORDER** M2 새 대화가 원격 연결에 자동으로 붙도록 설정 이관(로컬 → 사용자 설정) + VSCode 초기 권한 모드 + 옛 대화 정리 | [ORDER_20261002_iMac민아_M2쌍아_원격자동연결_설정이관](../../orders/2026-10/ORDER_20261002_iMac민아_M2쌍아_원격자동연결_설정이관.md) | ⏳ |
| 2026-10-02 | iMac/쌍아 | **COMPLETION** SessionStart 훅 세션 이름 자동 지정 + 세션 시작 절차 옛 인스턴스 보고 (ORDER_20261002 §A·§C·§D) | [COMPLETION_20261002_iMac쌍아_세션이름자동화](../../reports/2026-10/COMPLETION_20261002_iMac쌍아_세션이름자동화.md) | ✅ |
| 2026-10-02 | iMac/민아 | 세션 시작 절차 4에 이름 자가 교정 추가 — 데스크톱 표면은 앱 제목이 훅 이름을 덮으므로 set_session_title(self)로 교정, 같은 기기 피어 목록 반영 실측. 작가님 12:57 직접 지시, 쌍아 추인 대상 (세션 로그 2026-10-02_iMac_민아 세션 2) | — | ✅ |
| 2026-10-03 | iMac/쌍아 | **ORDER** pf.py·훅 Python 3.9 호환 — M2(python3 3.9.6)에서 pf.sh 작동 불가 해소 | [ORDER_20261003_iMac쌍아_쌍아-막내2_PF_MONK_OS_py39호환](../../orders/2026-10/ORDER_20261003_iMac쌍아_쌍아-막내2_PF_MONK_OS_py39호환.md) | ⏳ |
| 2026-10-03 | iMac/쌍아-막내2 | **COMPLETION** pf.py·훅 Python 3.9 호환 — __future__ annotations 3파일, 3.9 smoke 106/106·17/17 | [COMPLETION_20261003_iMac쌍아-막내2_PF_MONK_OS_py39호환](../../reports/2026-10/COMPLETION_20261003_iMac쌍아-막내2_PF_MONK_OS_py39호환.md) | ✅ |
| 2026-10-04 | iMac/쌍아 | **ORDER** Claude Code 모드(mods)로 배포 승인 버튼 시범 — 실측만, 운영 반영 없음 | [ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_모드승인버튼_시범실측](../../orders/2026-10/ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_모드승인버튼_시범실측.md) | ⏳ |
| 2026-10-04 | iMac/쌍아-막내2 | **REPORT** 모드 승인 버튼 시범 실측 M1~M6 — 버튼·클릭 토큰 양성, 모델 tmux 키 주입으로 정식 토큰 발급(가설 기각) → 결론 후보 '보조 가능/단독 대체 불가' | [REPORT_20261004_iMac쌍아-막내2_모드승인버튼_실측](../../reports/2026-10/REPORT_20261004_iMac쌍아-막내2_모드승인버튼_실측.md) | ✅ |
| 2026-10-04 | iMac/쌍아 | **ORDER** 컨트롤 룸 PoC — Claude Code 모드로 상황판·TF/PF 발동 버튼·통신 스위치(모의)·승인 버튼(모의) | [ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_컨트롤룸_PoC](../../orders/2026-10/ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_컨트롤룸_PoC.md) | ⏳ |
| 2026-10-04 | iMac/쌍아-막내2 | **COMPLETION** 컨트롤 룸 PoC P1·P2 — 상황판 60초 자동 갱신 작동, 발동은 삽입만 직접·실행은 모델 경유(prompt.submit '/' 거부), P3·P4 제외(분류기 중단) | [COMPLETION_20261004_iMac쌍아-막내2_MONK_OS_컨트롤룸_PoC](../../reports/2026-10/COMPLETION_20261004_iMac쌍아-막내2_MONK_OS_컨트롤룸_PoC.md) | ✅ |
| 2026-10-04 | iMac/쌍아-막내2 | **REPORT** 컨트롤 룸 PoC 본문 — 패널별 결과·모드 API 한계 4·운영화 결정 5 | [REPORT_20261004_iMac쌍아-막내2_컨트롤룸_PoC](../../reports/2026-10/REPORT_20261004_iMac쌍아-막내2_컨트롤룸_PoC.md) | ✅ |
| 2026-10-04 | iMac/쌍아 | **DESIGN** 지휘 원장(누가 누구에게 무엇을 시켰나) + 지휘소 화면 — 0단계 의미 검증부터 | [DESIGN_20261004_iMac쌍아_지휘원장_지휘소](../../../tech/designs/2026-10/DESIGN_20261004_iMac쌍아_지휘원장_지휘소.md) | ⏳ |
| 2026-10-04 | iMac/쌍아 | **ORDER** 지휘 원장 0단계 — 기존 기록으로 원장 재구성 + 시험 질문 5개 답안 (읽기 전용) | [ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_지휘원장_0단계](../../orders/2026-10/ORDER_20261004_iMac쌍아_쌍아-막내2_MONK_OS_지휘원장_0단계.md) | ⏳ |
| 2026-10-04 | iMac/쌍아-막내2 | **COMPLETION** 지휘 원장 0단계 — 지시서+세션 로그로 원장 414건, 연결 ack 15/22·complete 0/22, 질문 5 답안(jsonl 제외: 12:22 분류기 중단) | [COMPLETION_20261004_iMac쌍아-막내2_MONK_OS_지휘원장_0단계](../../reports/2026-10/COMPLETION_20261004_iMac쌍아-막내2_MONK_OS_지휘원장_0단계.md) | ✅ |
| 2026-10-04 | iMac/쌍아-막내2 | **REPORT** 지휘 원장 0단계 본문 — 소스별 건수·연결률·질문 5 답안·놓친 유형 6 | [REPORT_20261004_iMac쌍아-막내2_지휘원장_0단계](../../reports/2026-10/REPORT_20261004_iMac쌍아-막내2_지휘원장_0단계.md) | ✅ |
| 2026-10-03 | iMac/민아 | 세션 시작 절차 4단계 '옛 세션 비활성화' 신설(RC off→아카이브, 앱 자동·VSCode/CLI 보고, kill 금지, M2 동일) — 작가님 10-03 12:41 A안 승인, 민아 옛 세션 3건 아카이브 실증(피어 53→47), 쌍아 사후 추인 청구 | [session-start](../../../../.claude/commands/session-start.md) | 완료 |
| 2026-10-05 | iMac/민아 | 프로젝트 MCP 6종 꺼짐 원인 확정(10-04 시험 세션 Esc 거부 영속 + 6종 영구 승인 부재)·재발 차단 — settings.json enabledMcpjsonServers 명시, mcp list 전 Pending 6 → 후 Connected 6 | — | ✅ |
| 2026-10-05 | iMac/쌍아 | **REPORT** 민아 10-03~10-05 규정 계층 변경 2건(+로컬 복원 1) 사후 추인 | [REVIEW_20261005_iMac쌍아_민아_1003-1005_사후추인](../../reports/2026-10/REVIEW_20261005_iMac쌍아_민아_1003-1005_사후추인.md) | 📁 |
| 2026-10-22 | iMac/쌍아 | **ORDER** 백그라운드 세션 승인 대기 → 텔레그램 알림(Notification 훅+tg_notify) — 10-22 막내3 17분 무신호 정지 대응 | [ORDER_20261022_iMac쌍아_막내_MONK_OS_백그라운드승인대기_텔레그램알림](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_MONK_OS_백그라운드승인대기_텔레그램알림.md) | ⏳ |
| 2026-10-22 | iMac/쌍아-막내5 | bg 세션 승인 대기 텔레그램 알림 — Notification 훅 notify_blocked.py 신설(스모크 118/118, 실발송 455) | [COMPLETION_20261022_막내5_190000](../../reports/2026-10/COMPLETION_20261022_막내5_190000.md) | ✅ |
| 2026-10-25 | iMac/쌍아 | **ORDER** active PF 전수 상태 점검표 — PF마다 마지막 실제 활동·현재 상태·제안 상태(active/paused/completed)·근거 (읽기 전용, 상태 변경 없음) | [ORDER_20261025_iMac쌍아_막내18_MONK_OS_PF상태점검표](../../orders/2026-10/ORDER_20261025_iMac쌍아_막내18_MONK_OS_PF상태점검표.md) | ⏳ |
| 2026-10-25 | iMac/쌍아-막내18 | **REPORT** REPORT_20261025_iMac쌍아-막내18_MONK_OS_PF상태점검표 | [REPORT_20261025_iMac쌍아-막내18_MONK_OS_PF상태점검표](../../reports/2026-10/REPORT_20261025_iMac쌍아-막내18_MONK_OS_PF상태점검표.md) | 📁 |
| 2026-10-25 | iMac/쌍아 | **세션 마감 PF 체크 보강** — '문서 없는 사건 대조'(배포·결정이 PF에 없으면 보충)·'귀속 확인' 추가(작가님 10-25 13:38 승인). 시각 헤더 대조 훅 E11(10-24, 막내16)과 함께 기록 공백 보정 | `.claude/commands/session-end.md (f5beea18)` | ✅ |
| 2026-10-28 | ?/? | **ORDER** 피할 것'의 실체 전수조사 — 헌법·법률·규정·훅에 흩어진 금지·승인·게이트를 한 장으로, 사고 근거와 실제 비용을 붙여서 | [ORDER_20261028_iMac쌍아_막내1_MONK_OS_피할것_실체_전수조사](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내1_MONK_OS_피할것_실체_전수조사.md) | ⏳ |
| 2026-10-28 | iMac/쌍아-막내1 | **피할 것 실체 전수조사** — 원천 ~460건→82행 합본, 🔴 11개 압축(실사고 근거는 크레딧·유료실패·환각지시·공유자원 4개뿐). 중복 최다=시크릿 ~15곳, 문서 간 불일치 8건(에러 횟수 3/5, ch7 main push 내부 충돌, PF 갱신 주체 등). 비용 최대=ch5 1조 3항+E10. 교정 메모리 12건 중 7건이 10-23 이후 — 대상은 조문 위반이 아닌 확대 해석 | [REPORT_20261028_iMac막내1_피할것_실체_전수조사](../../reports/2026-10/REPORT_20261028_iMac막내1_피할것_실체_전수조사.md) | ✅ |
| 2026-10-28 | iMac/쌍아-막내1 | 피할 것 전수조사 COMPLETION (REPORT 동일 건의 완료 기록) | [COMPLETION_20261028_iMac쌍아-막내1_MONK_OS_피할것_실체_전수조사](../../reports/2026-10/COMPLETION_20261028_iMac쌍아-막내1_MONK_OS_피할것_실체_전수조사.md) | ✅ |
| 2026-10-28 | iMac/쌍아 | **청구안 초안: 피할 것 7 + 정방향 우선** — 전수조사(460건→실체 75→피할 것 7) 기반 헌법 2조 3항·4조 머리·1항·4항·5조 4항 개정안 + 법률 불일치 8건·중복 정본화. 작가님 방향 확인 대기 | [PETITION_20261028_쌍아_피할것7_정방향우선](../../../../governance/constitution/petitions/PETITION_20261028_쌍아_피할것7_정방향우선.md) | ⏳ |
| 2026-10-28 | ?/? | **ORDER** 삼권심사 — PETITION_20261028 헌법은 방향·명시 기준만(K1~K5) | [ORDER_20261028_iMac쌍아_막내123_MONK_OS_헌법청구_삼권심사](../../orders/2026-10/ORDER_20261028_iMac쌍아_막내123_MONK_OS_헌법청구_삼권심사.md) | ⏳ |
| 2026-10-28 | iMac/쌍아-막내2 | 헌법청구(K1~K5) 사법 심사 — 조건부 찬성, 실패 시나리오 5건(되는 것만 근거 공백·한정어 대가성 후기·규정 사진 보정·이관 시차·승인 게이트 해석), 동시 발효 조건 4개 | [REVIEW_20261028_iMac쌍아-막내2_헌법청구_사법심사](../../reports/2026-10/REVIEW_20261028_iMac쌍아-막내2_헌법청구_사법심사.md) | ✅ |

---

## 3. Phase 현황

### Phase 0 — 리서치 & 감사 ✅ 완료 (2026-04-23)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| Track A — Anthropic 최신 체제 (4.7, Skills/Rules/Routines/Memory/Agent SDK) | ✅ | iMac/막내1 | [RESEARCH_A_anthropic.md](research/RESEARCH_A_anthropic.md) |
| Track B — 업계 방향성 (Google ADK, OpenAI AgentKit, MCP, 커뮤니티) | ✅ | iMac/막내2 | [RESEARCH_B_industry.md](research/RESEARCH_B_industry.md) |
| Track C — Kimi K2.6 보고서 | ✅ | iMac/막내3 | [RESEARCH_C_kimi_k26.md](research/RESEARCH_C_kimi_k26.md) |
| Track D — 현 MONK OS 체제 감사 + 갭 분석 | ✅ | iMac/막내4 | [AUDIT_current_monk_os.md](audit/AUDIT_current_monk_os.md) + [GAP_MATRIX.md](audit/GAP_MATRIX.md) |

### Phase 1 — 통합 보고 & 개헌 청구안 ⏳ 작가님 검토 대기 (2026-04-23)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 4트랙 통합 리포트 + 범용 OS 로드맵 초안 | ✅ draft | iMac/쌍아 | [ROADMAP_portable_agent_os.md](roadmap/ROADMAP_portable_agent_os.md) — 개헌 후보 6건·PoC 3건·지시서 큐 9건 |
| 작가님 검토·묶음 A/B/C 결정 | ⏳ | 작가님 | — |
| 개헌 청구안 개별 기안 (H-3 삼권 심사 등) | 대기 | iMac/쌍아 + 작가님 | amendments/ |

### Phase 2 — 부서제 조직 레이어 (DIVISION) ⏳ 설계 완료, 구현 착수 (2026-06-17)

> **하네스의 조직 확장**. 개인 에이전트 체계 → 부서별 전문 루틴 에이전트 → 임원급 통괄 → 이사회급 다축 견제. 내부 호칭(쌍아/민아/막내)을 일반 직함(Chief Architect/QA Director/Engineer)으로 치환하면 그대로 **하네스 상품의 조직 모듈**이 된다.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 부서 편제 설계 (6개 부서 × PF 배치) | ✅ | iMac/쌍아 | [DESIGN_20260617_부서제_에이전트체계_DIVISION.md](../../../tech/designs/2026-06/DESIGN_20260617_부서제_에이전트체계_DIVISION.md) |
| MKT·SEC 선행 루틴 프롬프트 설계 + 가동 | ⏳ | iMac/쌍아 | Week 1 목표 |
| CNT·ENG·RND·BIZ 루틴 설계 + 가동 | — | iMac/쌍아 | Week 2 목표 |
| 웹민아 E2E 역할 재조정 (겹침 제거) | — | iMac/쌍아 | Week 2 |
| Phase 2-A 안정화 (2주 가동 후 품질 평가) | — | 민아 | 성공 기준 4개 충족 시 Phase 2-B |
| Phase 2-B 자기 진화 (부서장 효율화 자율 제안) | — | 부서장들 | 패턴 안정 후 |
| Phase 2-C 임원급 통괄 에이전트 | — | 설계 필요 | Phase 2-B 안정 후 |

**3단계 진화 경로**:
- 2-A: 부서장 → 전략기획실(쌍아/민아) → 작가님
- 2-B: 부서장이 토큰 절감·코드화 자율 제안 → 승인 후 점진적 효율화
- 2-C: 임원급 통괄 → 주요 사안만 에스컬레이션 → 이사회급 다축 견제

**상품화 함의**: 내부 호칭을 일반 직함으로 치환한 구조 = MONK OS 하네스의 "조직 운영 모듈". 헌법·법률·PF·세션 로그·지시서·부서제 루틴 전체가 이식 가능한 패키지.

### Phase 3 — 런타임 추상화 PoC (Phase 1·2 안정 후)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 비(非)Claude 런타임에 MONK OS 이식 실험 | — | — | 대상 런타임 Phase 1 결론 의존 |

---

## 4. 성과

> 측정값은 Phase 1 이후 기록.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| — | — | — | — |
---

## 5. 복기

> 리서치·설계 과정에서 나온 교훈을 이 섹션에 append.

### 교훈 1: 같은 모델, 다른 품질 — 운용 방식이 결정한다 (2026-05-20)

**현상**: IDPASS 200국 전수조사에서 막내(CLI) 4명이 B/C등급으로 채운 데이터를 철창이(Chat)가 공식 소스로 A등급 검증. 브라질 "head 42mm"은 2차 소스 추정값이었고, gov.br/pf 공식에서는 "현장 촬영 원칙"이라는 전혀 다른 사실 확인.

**원인**: 동일 Opus 4.6이지만 — 막내는 지시서 범위 내 대량 배치(넓고 얕게), 철창이는 작가님과 핑퐁하며 의심→검증→확정(좁고 깊게). 모델 차이가 아니라 운용 구조 차이.

**활용**: CLI 로컬팀(초벌 수집) → 웹 에이전트(공식 소스 심층 검증) → 루틴스(정기 변경 감시) 3단 파이프라인. IDPASS뿐 아니라 모든 외부 데이터 의존 PF에 적용 가능.

### 교훈 2: MONK OS의 구조적 정체 — 왜 이식 가능한가 (2026-06-08)

> 작가님과의 설계 대화에서 도출. 본 PF 비전("현 체제가 우연이 아니라 이식 가능한 아키텍처임을 증명")의 이론적 토대.

**① 3축 좌표계** — MONK OS는 세 직교축으로 구성된다:
- **PF**(상태·생애축, 명사) × **Ops/세션로그·지시서·보고**(시간축) × **거버넌스/헌법·법률**(규범축, 위에서 통제)
- **Skills**(절차·동사, 무상태)는 PF(상태)를 읽고 갱신하는 메서드 — PF와 경쟁이 아니라 **직교 보완**. `pf-declare`·`pf-status`가 그 결선의 씨앗.
- 어떤 작업이든 `(PF 좌표 × Ops 시각)`으로 위치가 찍히고, 거버넌스가 평면 전체를 규율. 초기 strategy/infra/tech 폴더가 죽은 이유 = 각자 좌표계를 가지려다 충돌(정규화 실패).

**② PF의 업계 정체 = Agent-Native Project Aggregate** — 단일 표준 용어가 없는 emerging pattern. 네 패턴의 융합:
- DDD **bounded context/aggregate**(구조) + event sourcing **append-only log**(역사) + agent **long-term memory**(용도) + ADR·post-mortem·OKR·risk register를 **프로젝트 1단위로 응집**.
- 결정적 차이: 기존 문서는 사람이 일차 독자, PF는 **AI 에이전트가 일차 독자**. = "프로젝트를 일급 객체(데이터 구조)로 승격."

**③ 세션→자산 결정화 사다리** — 세션(휘발) → 세션로그 → PF 히스토리 → 복기/원칙(법). 경험→기억→지혜→법으로 *승화*. 이것이 "방치가 아닌 자산화"의 메커니즘. 대부분 에이전트 체계는 세션이 증발하거나 벡터DB에 던져질 뿐 승화가 없음 — MONK는 승화가 일어남.

**④ 운용 원리 = 살아있는 시스템** — 분류축을 *주제*(도서관·방치·죽음)에서 *생애*(흐름·갱신·생존)로. 핵심 규칙 **"중복은 허용하되 누락은 금지"**(누락=비가역/중복=가역의 비대칭, DNA 유전자 복제·Git commit과 동형). **"효율은 쌓아가며 응축하는 것이지 쌓기 전에 가두는 것이 아니다."** 자기수정 루프가 도는 한 살아있음 — 단 현재 그 동력원(응축·개정 트리거)은 작가님의 의식적 순찰. **다음 진화 = 생명력의 자율화**(누락 금지를 사람 아닌 시스템이 보증).

**이식 함의**: ①~④는 전부 파일+규범 기반(벤더 독립적)이므로 어떤 LLM 런타임에도 입혀진다. 현 안정성이 우연이 아니라 *아키텍처*임의 직접 증거.

---

## 6. 관련 문서 인덱스

### 리서치 (research/)

| 파일 | 트랙 | 주체 | 상태 |
|------|------|------|------|
| RESEARCH_A_anthropic.md | A | iMac/막내1 | ✅ 2026-04-23 |
| RESEARCH_B_industry.md | B | iMac/막내2 | ✅ |
| RESEARCH_C_kimi_k26.md | C | iMac/막내3 | ✅ |

### 감사 (audit/)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| [AUDIT_current_monk_os.md](audit/AUDIT_current_monk_os.md) | iMac/막내4 | 헌법 5축·법률 8장·Skills·Rules·MEMORY 현황 진단 | ✅ |
| [GAP_MATRIX.md](audit/GAP_MATRIX.md) | iMac/막내4 | Anthropic 공식 개념 vs MONK OS 대응 표 (MONK 열만 먼저 작성) | ✅ |

### 로드맵 (roadmap/)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| ROADMAP_portable_agent_os.md | iMac/쌍아 | Phase 0→1→2 통합 로드맵 | 대기 |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| [ORDER_…_A_anthropic.md](../../orders/ORDER_20260423_PF_MONK_OS_A_anthropic.md) | iMac/막내1 | Track A — Anthropic 최신 체제 11축 | 대기 |
| [ORDER_…_B_industry.md](../../orders/ORDER_20260423_PF_MONK_OS_B_industry.md) | iMac/막내2 | Track B — 업계 방향성 12축 | 대기 |
| [ORDER_…_C_kimi_k26.md](../../orders/ORDER_20260423_PF_MONK_OS_C_kimi_k26.md) | iMac/막내3 | Track C — Kimi K2.6 10축 | 대기 |
| [ORDER_…_D_audit.md](../../orders/ORDER_20260423_PF_MONK_OS_D_audit.md) | iMac/막내4 | Track D — 현 MONK OS 체제 감사 12축 + GAP 매트릭스 | ✅ 완료 |
| [ORDER_20260423_민아_H7_claudeai_UI실측.md](../../orders/ORDER_20260423_PF_MONK_OS_H7_claudeai_UI실측.md) | iMac/민아 | H-7 선행 — Connectors·Skills·Plugins 실측 | ✅ 완료 |
| [ORDER_20260423_막내1_claudeai_비용추적.md](../../orders/ORDER_20260423_막내1_claudeai_비용추적.md) | iMac/막내1 (재활용) | claude.ai $6.74 overage 기인 추적 | ✅ 완료 |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 리서치 결과가 현 체제와 충돌 → 무리한 개편 유혹 | 中 | "현 안정성 > 이론적 완전성" 원칙 고수. 작가님 승인 없는 개편 금지 |
| 4트랙 결과물 볼륨 과다 → 작가님 검토 피로 | 高 | 쌍아 통합본 1장 + 트랙별 상세 파일 링크 (간결 보고 원칙) |
| Claude 4.7 스펙이 또 바뀜 → 리서치 노후화 | 中 | PF 히스토리 append-only로 시점 명시, 재실행 가능한 구조 |
| Kimi K2.6 관련 정보가 중국어·공식 문서 미비 | 中 | 막내4에게 복수 소스(공식/깃헙/HF/중문 블로그/영문 요약) 교차 검증 지시 |
| ~~Anthropic 빌링 회귀 버그~~ | ~~외부·이미 발생~~ | **쌍아 오진단(2026-04-23 15:40 작가님 정정)** — 막내1 v1 보고의 빌링 회귀 결론은 **지난 $50 순삭 건(별건·종결)의 패턴**. 이번 $6.74는 별개 맥락. v2 지시서 재발행 → [ORDER_…_v2_맥락정밀.md](../../orders/ORDER_20260423_막내1_claudeai_비용추적_v2_맥락정밀.md) |
