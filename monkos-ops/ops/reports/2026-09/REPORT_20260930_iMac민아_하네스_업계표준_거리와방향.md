---
type: report
date: 2026-09-30
device: iMac
agent: 민아
status: 마감
portfolio: PF_MONK_OS
subject: "현 MONK 하네스 vs 2026 하반기 업계 표준 — 거리 매트릭스와 방향 판정"
method: "웹 리서치 위임(출처 URL 65콜) + 기록 탐색 위임(GAP_MATRIX·ROADMAP·07-16 감사 대조) + 로컬 실측(CLI 2.1.282, settings, rules frontmatter)"
---

# 하네스 거리·방향 보고 — MONK OS vs 업계 표준 (2026-09-30)

**[2026-09-30 14:48 KST]** iMac/민아 → 작가님

## 0. 결론 (1줄)

**철학과 구조는 업계가 우리 쪽으로 왔고, 뒤진 건 전부 배관이다.** 헌법·핸드오프 파일·검증자 분리·기록 사다리는 2026년 업계 담론이 그대로 따라온 형태인데, 우리는 그 규칙을 **산문으로만** 집행하고 런타임이 이미 주는 기능(조건부 로딩·훅·서브에이전트·워크플로·에이전트 메모리)을 거의 안 쓴다.

## 1. 결정 항목 (닫힌 대안)

| # | 항목 | A (권고) | B |
|---|------|------|------|
| D1 | **집행 코드화** — 헌법 4조(시크릿·파괴 명령), ch4 10조(Firestore 직접 접근), ch5 2조(`gcloud run deploy` 직접)가 전부 산문. deny 6건·hook 1건뿐 | PreToolUse 훅 + deny 확장을 **단독 지시서**로 이번 주 (막내 1일) | 부서제 시범(10-01~14)에 묶음 — 2주 지연 |
| D2 | **rules 조건부 로딩 무효** — 9파일이 `globs:`(Cursor 키)를 씀. Claude Code 키는 `paths:`. 결과: 12 rules 매 세션 전량 로딩(오늘 세션에서 실측 확인) | `globs:`→`paths:` 9건 1줄 교정, 작가님 승인 1회로 민아 즉시 실행(`.claude/` 변경 — 쌍아 사후 추인) | 쌍아 지시서 경유 |
| D3 | **AGENTS.md 부재** — 60k+ OSS 표준, Astra(Codex)·Gemini CLI 호환 키. CLAUDE.md 직접 읽기는 Claude 전용 | `AGENTS.md` 1파일 = CLAUDE.md 포인터 + 헌법 에센스 링크 (10줄) | 미도입 — Astra 편입 시 헌법 미적용 |
| D4 | **PF_MONK_OS Phase 1** — 04-23 "묶음 A/B/C 결정" 5개월 ⏳. ROADMAP은 Opus 4.7 시점 스냅샷 | 본 보고로 **대체 종결**. 살아있는 항목(H-3 런타임 축·H-5 Hooks·PoC A2A)은 기능부 설계서로 이관 | 04-23 로드맵 재검토 세션 |
| D5 | **하네스 자기 평가 지표 부재** — 업계는 동일 모델 다른 하네스 68→88% 같은 수치로 판정. 우리는 "정상률 84%" 감사 1회뿐 | 기능부 시범 Week 2 측정 4종을 **상시 지표**로 승격(월 1회) | 시범 한정 |

D2는 승인만 주시면 이 세션에서 끝납니다. D1이 가장 큰 거리이고 가장 싸게 닫힙니다.

## 2. 거리 매트릭스

판정: ⬆ 앞섬 / ＝ 동등 / ⬇ 뒤짐 / ◆ 독자(업계 대응물 없음)

| 축 | 업계 표준 (2026-09, 출처 §5) | MONK 현행 (실측) | 판정 |
|----|------|------|------|
| **지시 파일** | AGENTS.md 60k+ 레포·주요 OSS 63% 보유. 계층 로딩(글로벌→레포→중첩) | CLAUDE.md 206줄 헌법 5축 + rules 12 + 법률 8장. 위성용 에센스 | ＝ 내용 ⬇ 호환(AGENTS.md 없음) |
| **집행** | 공개 CLAUDE.md 201레포 분석: 산문 보안 규칙 중 **4.4~16%만** 내장 제어(deny·hook)와 매칭. "산문은 요청, 차단은 코드" | hook 1(헤더 리마인더), deny 6(rm·force·reset·clean). 4조·10조·2조·7조 전부 산문. ch1 7조 자체가 "조문 집행이라 방어력 부분적" 자인 | **⬇ 최대 거리** |
| **조건부 로딩** | rules `paths:` glob 지연 로딩, 1,000패턴 한도 | `globs:` 9파일 → 키 불일치로 **전량 상시 로딩** | ⬇ (1줄 교정) |
| **역할 분리** | Anthropic 03-24: Planner/Generator/Evaluator, 평가자 분리 > 자기비평. marmelab 09-24: 2~4역할 제너럴리스트 우세, 4단계 초과 핸드오프 거의 실패 | 쌍아(설계)/막내(실행)/민아(검증) 동형. 자기 감사 금지(06-14)는 산문. 09-30 기능부 설계 = 4부 + 실행·검수 노드 2종 | ＝ 설계 ⬇ 집행 |
| **컨텍스트 연속성** | 컴팩션 대신 **리셋 + 구조화 핸드오프 파일**(03-24). 파일 기반 메모리 공통 | 세션 로그 688 · PF 35 · ORDER 1,180 · COMPLETION 832 = 핸드오프 파일 체계 1월부터 가동 | **⬆** (비용은 서류) |
| **메모리** | agent-memory 스코프 3종(`.claude/agent-memory/<name>/` 권장), MEMORY.md 200줄·25KB 캡, Managed Agents Memory·Dreams | 디바이스 MEMORY 200줄 + 외장 80파일. 에이전트별 분리 없음, 거버넌스 07-16 "미확정" | ＝ 형식 ⬇ 분리 |
| **오케스트레이션** | Claude Workflow(JS `agent()/pipeline()`, 동시 16), Codex subagents GA(TOML), ADK 2.0 YAML 그래프, Gemini CLI subagents | subagent 1(record-explorer 09-27). Workflow 미사용. 막내 병렬 라우팅 = 작가님 손 | ⬇ |
| **무인 실행** | Routines(research preview, 1h 최소), Managed Agents 스케줄, Codex cloud | GH Actions 10 · launchd 4 · 웹민아 E2E 데일리 | ＝ (자체 구현) |
| **검증·평가** | evals 지침, Kiro 속성 테스트로 스펙 정합 측정, ultrareview, "Reality Is the Final Verifier" | live-verify 2회 히트·smoke_assert·governance-check CI·specs_drift. 하네스 자체 평가 지표 없음 | ＝ 운영 ⬇ 하네스 평가 |
| **스펙 주도** | Spec Kit 139k★ constitution→specify→plan→tasks→implement. Kiro 3종 스펙 정본 | 헌법→법률→PF→ORDER→COMPLETION. `memory/constitution.md`와 동형이 1월부터 | ⬆ |
| **상호운용** | MCP 2026-07-28(무상태·Tasks·MRTR·DCR 폐기), A2A 1.0(150+ 조직, AAIF), AGENTS.md | 자체 MCP(monk-retrieval 4종). MCP 클라이언트 소비 6서버. A2A PoC 미착수 | ⬇ (저비용) |
| **거버넌스** | 없음. 프레임워크 어디에도 개정 절차·삼권 심사·append-only 내장 없음 | 삼권 심사·만장일치·청구권·append-only 3중·결정화 사다리(세션→PF→법) | **◆ 독자** |

## 3. 방향 판정

**업계가 우리 쪽으로 이동했다.** "Harness engineering" 용어 자체가 2026-02에 생겼고(OpenAI 02-11: 인간은 레포 구조·CI·린터·AGENTS.md 즉 환경을 설계), Anthropic 03-24 하네스 설계(평가자 분리·핸드오프 파일), Spec Kit의 constitution 파일, AGENTS.md 표준화, marmelab의 "2~4역할·4단계 이하" 실증은 우리가 1~3월에 헌법·지시서·세션 로그로 세운 것과 같은 결론이다. 04-23 RESEARCH_A가 MEMORY 200줄 캡과 Planner/Generator/Evaluator 동형을 "선행 사례"로 평가한 것이 5개월 뒤 업계 수치로 확인됐다.

**우리가 뒤진 곳은 세 가지이고 전부 같은 성격이다** — 규칙은 있는데 런타임에 꽂혀 있지 않다.
1. 집행이 산문 (D1). 09-29 촬영 장애 4개월 미탐지, 08-13 0건≠부재 3회, 07-25 공유자원 사고 3회 — 전부 "규칙은 있었다"가 공통이다.
2. 런타임 기능 미사용 — `paths:` 키 오기(D2), hooks 33종 중 1종, Workflow·agent-memory·`--agent` 0. 기능부 설계서(09-30)가 이 셋을 한꺼번에 채운다.
3. 자기 평가 부재 (D5) — 업계는 하네스를 수치로 비교한다. 우리는 하네스 변경 효과를 감으로 판정해 왔다.

**앞선 곳은 유지하되 서류 비용을 줄인다.** 핸드오프 파일 체계는 표준이 됐지만 ORDER 1,180건·COMPLETION 832건은 사람이 라우팅한 흔적이다. 부서 내부 위임은 세션 로그로, 문서는 경계 통과 시만 (09-30 14:40 논의).

**04-23 로드맵과의 차이** — 그때는 "어떤 런타임에도 이식"이 목표였다. 지금 판정은 다르다. AGENTS.md 1파일이면 Codex·Gemini CLI가 같은 헌법을 읽고, MCP·A2A는 표준이 안정화됐다. 이식은 로드맵이 아니라 **호환 파일 1개 + 프로토콜 소비**로 축소됐다. Phase 3(비Claude 런타임 PoC)은 별도 프로젝트가 아니라 Astra 편입 시 자연 검증된다.

## 4. 04-23 GAP 12항 현재 상태 (기록 탐색 위임 결과)

해소 1(Subagents) · 갭 아님 2(Governance·PF, 독자 자산) · 부분 6(Skills·Rules·Memory 상시·Routines·Hooks·MCP) · 미해소 3(Memory 장기·SDK 판별·ORDER 번역 레이어). 07-16 감사 P0 6건은 PETITION_20260716으로 전건 해소(REPORT_20260716 민아 13/13 정합). PoC 4건(Kimi·MCP 래핑·A2A·Plugin) 전부 미착수.

## 5. 출처 (리서치 위임 65콜 중 판정에 쓴 것)

- Claude Code: changelog(2.1.285, 09-29) · sub-agents(`--agent`, memory 스코프, `omitClaudeMd`) · hooks(33+종) · workflows(05-28) · memory(`paths:`) · routines — code.claude.com/docs
- Anthropic 엔지니어링: Harness design for long-running app dev (2026-03-24) · Scaling Managed Agents (04-08)
- OpenAI: Harness engineering (2026-02-11) · Codex as a platform (08-19) · Codex 0.159.2 subagents GA
- Google: ADK 2.10.0 (09-25) · A2A 1.0 → AAIF (08-17) · Gemini CLI subagents (04-15)
- 표준: MCP 2026-07-28 스펙 · agents.md (60k+) · AAIF
- 담론: marmelab State of AI Harness Engineering 2026 (09-24) · Fowler/Böckeler (04-02) · arXiv 2608.23550 "When Do Not Is Not deny" (08) · arXiv 2609.12039 (09-10)
- 사례: Spec Kit 1.0.13 (09-29) · Kiro GA (05-07) · Superpowers 6.0.3
- 내부: PF_MONK_OS GAP_MATRIX·ROADMAP·AUDIT · COMPLETION_20260716 · REPORT_20260716 · PETITION_20260716
- 로컬 실측: `claude --help`(2.1.282) · settings deny 6 · rules `globs:` 9/`paths:` 0 · CLAUDE.md 206줄

⚠️ 리서치 상충 1건: `--agent` 시 CLAUDE.md가 "대체"(리서치)인지 "덧붙임"(가이드)인지 — `omitClaudeMd` 필드 존재로 보아 **기본은 유지, 옵션으로 제외**. 기능부 설계서 §3.1에 반영.
