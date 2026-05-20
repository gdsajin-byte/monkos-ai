---
type: portfolio
id: PF_MONK_OS
name: "MONK_OS"
subject: "어떤 에이전트에도 이식 가능한 범용 Agent OS로의 진화 로드맵"
created: 2026-04-23
owner: 작가님
leads: "iMac/쌍아(설계·통합), iMac/막내1~4(병렬 리서치·감사), 민아(검증·통합 보조)"
status: draft
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

### Phase 2 — 런타임 추상화 PoC (설계 승인 후)

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
