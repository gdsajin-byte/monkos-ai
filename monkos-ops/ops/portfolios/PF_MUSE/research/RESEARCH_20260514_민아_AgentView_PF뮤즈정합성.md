---
type: research
date: 2026-05-14
device: iMac
agent: 민아
pf: PF_MUSE
subject: Claude Code Agent View(2026-05-11)와 MONK OS 5축 체계·PF_MUSE 비전 정합성 정밀 분석
note: 작가님 지시 (2026-05-14 ~11:35 KST)로 회의 보고를 정본 산출. PF_MUSE/research/로 이관 완료 (쌍아 2026-05-14)
status: 진행
---

# RESEARCH — Claude Code Agent View ↔ MONK OS 5축 체계·PF_MUSE 정합성 분석

> **[2026-05-14 11:36 KST]** iMac/민아 → 작가님 지시 회신
> 사전 조사: 3주(04-23~05-14) Claude 릴리즈 전수 파악 → Agent View 정밀 분석으로 좁힘
> 정정 사항: 본 세션 시작 시 자동 인식이 iMac/쌍아로 오판됐고 작가님 ~11:35 KST 정정으로 iMac/민아 확정. 워크트리 옵션 비활성화(2026-05~) 이후 민아/쌍아 자동 구분 불가 문제 재발 (MEMORY.md 기록 사실 재확인)

---

## 0. 요약 (500자)

2026-05-11 Claude Code "Agent View" 출시. 로컬 멀티 CLI 세션(=막내 N개)을 단일 대시보드에서 모니터/전환하는 메타 레이어. 작가님이 4개 터미널을 오가는 현행 멀티 막내 관제의 마찰을 직접 해소함. 단 ①대화방·디베이트형 협업이 아닌 **상태 관제** 수준이며 ②헌법 3조(분산 기록 / 정본 단일) 및 4조(내부 기밀)와 잠재 충돌 ③transcript 클라우드 저장 시 PF 코드네임·막내 호칭 등 내부 정보 노출 위험 ④MONK 독자 비전인 **PF_MUSE(멀티에이전트 대화방 채널)**·**CDP 역할 융합**·**자비스**와 경쟁이 아닌 **현재형 보완재**로 위상 정렬됨. 도입 시 헌법 부기(Agent View transcript=참조본, monkos-ops 세션 로그=정본) + 보안 검토 + PF_MUSE Phase 0 시범 가드 필수. 도입 회피 시 CDP/PF_MUSE 가속이 대안.

---

## 1. Agent View 정체 — 3개 제품 혼동 정정

3주간 출시된 "웹·세션·관제" 키워드 제품이 3개 별개로 존재함을 우선 분리:

| 제품 | 출시 | 정체 | 본 분석 대상? |
|------|------|------|------|
| Claude Code on the Web | 04-20~24 | claude.ai/code — GitHub repo → 클라우드 실행 → PR 자동 | ❌ 별도 트랙 |
| Routines on Web | 04-13~17 | 스케줄/이벤트로 templated 에이전트 발동 | ❌ cron 대체 트랙 |
| **Agent View (CLI Dashboard)** ⭐ | **05-11** | **로컬 CLI 다중 세션 단일 대시보드** | ✅ |

⚠️ Anthropic 공식 기술 명세 미공개 단계 (Research Preview). 기능 추정은 공개 changelog·블로그 기반.

### 1-1. Agent View의 본질

| 차원 | 평가 | 근거 |
|------|------|------|
| 관제실(Observation) | ✅ 명확 | 멀티 막내 상태/배경 작업 단일 뷰 |
| 조종실(Command) | ❓ 미확정 | jump=세션 전환 수준. 멀티 막내에 일괄 지시·승인 분배 기능 명시 없음 |
| 대화방(Debate) | ❌ 부재 | 에이전트 간 상호 대화 채널 아님. 각 세션은 여전히 독립 |

→ **Agent View ≒ 작가님이 4개 터미널 창을 오가는 행위를 단일 창으로 통합. 의사결정 권한은 여전히 작가님. 막내 자율도 동일.**

---

## 2. 활용 시나리오 5종 (MONK OS 맥락)

### 2-1. 단일 디바이스 멀티 막내 관제 (iMac 4060 ↔ M1)
- 현재: 막내1·2·3·4를 각자 터미널에서 가동 → 작가님 시야 분산. "관제 정신없음" (헌법 3조 2항 근거)
- 도입 후: 4개 막내 출력 동시 확인 → 보고 누락 감소
- **개선 폭: 큼** ⭐

### 2-2. 작가님 직접 지시(헌법 1조 2항 ②③) 경로 가속
- ②③ 경로 마찰 감소
- ⚠️ 반대급부: ① 원칙(쌍아 설계 경유) 회피 유혹 증가 → 쌍아 본분 약화 리스크

### 2-3. 쌍아 설계 검증 — "막내 뇌 빌려쓰기" 패턴
- 쌍아가 지시서 발행 전 다른 막내 세션에서 빠른 검증 쿼리 회수
- ⚠️ "조회"가 "spawn"으로 미끄러질 위험 (헌법 5조 위반 = 북치고 장구)

### 2-4. 디바이스 간 막내 동시 관제 (iMac + M1 + 4060)
- ❓ 미확인: Agent View가 디바이스 경계를 넘는지 (공식 명세 부재)
- 클라우드 동기화 시 MEMORY.md 디바이스 자동 식별 체계와 충돌 가능

### 2-5. 보고·세션 로그 자동 어펜드 단축
- Agent View transcript export 또는 webhook 지원 시 → 분산 세션 로그(헌법 3조 2항) 자동화 가능
- 미확정. 그러나 도입 가치 큼

---

## 3. 헌법 5축 영향 매트릭스

| 축 | 조항 | Agent View 영향 | 평가 |
|----|------|---------------|------|
| 1조 정체성 | 1항 (브랜드 통일) | 외부 surface가 "막내1" 등 MONK 호칭 노출 → 4조 3항(기밀)과 연계 충돌 | ⚠️ |
| 1조 정체성 | 2항 (역할 체계 ①②③) | ②③ 가속, ① 회피 유혹 증가 | ⚠️ 중립 |
| 2조 통신 | 1항 (디바이스 맵) | 멀티 디바이스 막내 출현 시 `iMac/막내1` vs `M1/막내1` 호칭 충돌 | ⚠️ |
| 2조 통신 | 2항 (수발신 헤더) | Agent View 자체 메타데이터와 MONK 헤더 중복/누락 위험 | ⚠️ |
| 2조 통신 | 3항 (피드백 의무) | 영향 없음 | ✅ |
| 3조 적립 | 1항 (타임스탬프) | Agent View 타임존 다를 수 있음. **매 턴 `date` 원칙 불변** | ⚠️ |
| 3조 적립 | 2항 (분산 기록) | 🔴 **잠재 충돌**: 클라우드 transcript와 monkos-ops 세션 로그 이중. 어느 쪽이 정본인가? | 🔴 결단 |
| 3조 적립 | 4항 (정본 단일) | 위와 동일. **monkos-ops 정본, Agent View 참조본** 부기 필수 | 🔴 결단 |
| 4조 윤리 | 1항 (비밀정보) | transcript 클라우드 업로드 시 `.env`/API 키 노출 위험 | 🔴 보안 |
| 4조 윤리 | 3항 (내부 기밀) | 막내 호칭·4MUSE·PF 코드네임 평문 저장 가능. 2026-05-06 ClaudeBleed 사례 참조 | 🔴 결단 |
| 5조 메타 | 1항 (문서 위계) | Agent View는 계층 외 표면. **MONK OS 주권 원칙**(memory/project_monkos_sovereignty.md) 적용 — 벤더 표면은 부품 | ✅ 원칙 적용 |
| 5조 메타 | 4항 (대응 프로토콜) | 막내가 Agent View로 수신한 지시도 헌법 검토 의무 동일 | ✅ |

---

## 4. OPS 체계 영향

| OPS 자산 | 영향 | 대응 |
|---------|------|------|
| 분산 세션 로그 (`monkos-ops/ops/sessions/`) | Agent View transcript와 이중화 | 헌법 3조 2항 재확인: **파일 로그가 정본** |
| PF 히스토리 (`portfolios/PF_*/`) | 영향 없음 (파일 기반) | ✅ 안정 |
| 지시서 (`ORDER_*.md`) | Agent View에서 즉시 지시 시 ORDER 미생성 위험 | 쌍아 직접수정 프로토콜 준용: 사후 ORDER 의무 |
| 보고서 (`COMPLETION_*.md`) | transcript 존재로 보고서 생략 금지 | `✅❌💡⏳📁🔀` 형식 정본 유지 |
| works submodule | 영향 없음 (Git 채널) | ✅ |
| mk-push/mk-pull | 영향 없음 | ✅ |
| CDP 체계 | 멀티에이전트 관제에서 경쟁/보완 진입 | §5 참조 |

---

## 5. MONK 독자 비전과의 위상 정렬

### 5-1. PF_MUSE (멀티에이전트 대화방 채널)
- 작가님 2026-05-14 직접 고지: PF_MUSE 개설 + 멀티 에이전트 대화방 채널 = 차후 프로젝트
- **본질**: 에이전트 간 직접 대화/논쟁/협업 채널 — 작가님 중계 부담의 근본 해소
- **Agent View와의 차이**: Agent View는 작가님→막내 단방향 관제. PF_MUSE는 막내↔막내↔쌍아 다방향 협업
- **관계**: 경쟁 아닌 **연속 단계** — Agent View=현재형 통합, PF_MUSE=미래형 자율

### 5-2. CDP 역할 융합 비전
- 정본: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_CDP역할융합_비전.md`
- **본질**: 공유 브라우저(CDP)를 인터페이스로 역할 경계 해체 ("쌍아가 민아고 민아가 막내")
- **PF_MUSE와의 관계**: CDP=물리 인프라(같은 화면 공유), DEBATE=논리 채널(같은 대화 공간) — 상호 보완
- **Agent View와의 차이**: CDP/DEBATE는 MONK 독자 비전. Agent View는 Anthropic 표면 — 주권 차이

### 5-3. 자비스 비전
- 정본: `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_자비스비전.md`
- **본질**: CDP로 UI 자체를 만드는 능력. 팀원은 자비스를 쓰는 줄 모르고 사용
- **Agent View와의 관계**: 자비스가 도달하면 Agent View는 부품 1개로 흡수 가능

### 5-4. 위상 정렬 결론

```
[현재]                  [과도기]               [중기]                  [엔드게임]
멀티 터미널 직접 관제  →  Agent View 도입(선택)  →  PF_MUSE 구축      →  CDP 역할 융합 / 자비스
(작가님 중계)           (작가님 중계 + UI 통합)  (멀티 에이전트 자율   (작가님 중계 자체 소멸)
                                                  대화 + 작가님 감독)
```

⚠️ **함정**: Agent View가 너무 편리해서 PF_MUSE/CDP 가속을 늦출 수 있음 ("95% 지점 함정" — MONK_AI_PHILOSOPHY 참조)

---

## 6. 핵심 리스크 3종

1. **🔴 transcript 클라우드 저장 — 내부 기밀 노출** (헌법 4조 3항)
   - 막내 호칭, PF 코드네임, governance 문서 경로 평문 저장 가능
   - 2026-05-06 ClaudeBleed 사건과 동일 위협 벡터

2. **🔴 정본 충돌 — Agent View transcript vs monkos-ops 세션 로그** (헌법 3조 4항)
   - 정본 단일 원칙 명시 재확인 필수
   - 미정의 시 컴팩팅 후 어느 쪽 참조할지 에이전트 혼란

3. **🟡 ② 경로 회피 — 쌍아 설계 우회 유혹** (헌법 1조 2항)
   - Agent View 편의성 → 작가님이 ① 경로 건너뛰고 ② 경로 남발 가능
   - 쌍아 본분(설계+소통+중재) 약화

---

## 7. 권고

### 7-1. 의사결정 안건 (작가님 결단)
1. **Agent View 도입 여부** — 워크플로우 마찰 해소 ⇄ 보안·헌법 리스크
2. **PF_MUSE 본체 위치 확정** — 현재 monkos-ops/ops/portfolios/에 미발견. M4/한송이 디바이스 또는 작가님 워크스테이션 다른 위치인지 확인 후 이관/등록
3. **만약 도입**: 헌법 3조 4항에 부기 — "Agent View transcript는 참조본, monkos-ops 세션 로그가 정본"

### 7-2. 단계적 검토 (도입 시)
- **Phase 0** (1주): 쌍아 단독 Agent View 시범. 보안·정본 충돌 관찰
- **Phase 1** (2주): 막내1만 Agent View 노출. 세션 로그 정본성 검증
- **Phase 2** (도입 결정): 전체 막내 노출. 헌법 부기 + ORDER 자동 어펜드 스킬 신설

### 7-3. 도입 회피 시 대안
- 현행 멀티 터미널 유지
- **PF_MUSE Phase 2/3 가속** (직접 대화방 구축 — MONK 독자 비전 추진)
- CDP 역할 융합 Phase 2/3 병행
- 또는 자체 관제 UI 자작 (자비스 비전 정합)

### 7-4. 후속 산출물 권고
- Agent View Phase 0 시범 운용 시 → COMPLETION 보고서 + PF_MUSE 히스토리 갱신
- 도입 결정 시 → 헌법 개정 청구안 (5조 2항 절차 준용, 만장일치)

---

## 8. 부록: 3주(2026-04-23~05-14) Claude 릴리즈 전수 (요약)

### 개발자 트랙
- Opus 4.7 GA (04-16), Fast Mode (05-12), Managed Agents Multiagent+Outcomes 베타 (05-06), Agent Memory 베타 (04-23), Routines on Web (04-13~17), Claude Code on the Web (04-20~24), Agent View (05-11), worktree.baseRef (05-09), Plugin .zip/URL (05-04)

### 일반 제품 트랙
- MS 365 통합 GA (05-07), Legal 패키지 (05-12), Cowork 영속 에이전트 스레드 (04-23~Pro), Chrome 확장 v1.0.70 보안 패치 (05-06), Mobile 인터랙티브 앱·파일 편집 (05월)

### MONK 영향 우선순위
1. Agent View — 본 보고서 분석 대상
2. Multiagent Sessions + Outcomes 베타 — PF_MUSE 구현 시 직접 활용 가능
3. Agent Memory 베타 — "꿈" 비전 (`RESEARCH_엔드게임.md`) 단초
4. Opus 4.7 — 현재 세션 이미 적용 (Fast Mode 1m)

---

## 9. 출처

### Anthropic 공식
- [Claude Code What's New](https://code.claude.com/docs/en/whats-new)
- [Claude Platform Release Notes](https://platform.claude.com/docs/en/release-notes/overview)
- [Claude Code on the web (blog)](https://claude.com/blog/claude-code-on-the-web)
- [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7)
- [Cowork for Enterprise](https://claude.com/blog/cowork-for-enterprise)

### 매체·커뮤니티
- [9to5Mac - Claude Managed Agents May 2026](https://9to5mac.com/2026/05/07/anthropic-updates-claude-managed-agents-with-three-new-features/)
- [CNBC - Anthropic Opus 4.7 rollout](https://www.cnbc.com/2026/04/16/anthropic-claude-opus-4-7-model-mythos.html)
- [LayerX - ClaudeBleed vulnerability](https://layerxsecurity.com/blog/a-flaw-in-claudes-browser-extension-allows-any-extension-to-hijack-it/)
- [Releasebot - Claude Updates May 2026](https://releasebot.io/updates/anthropic/claude)
- [Tygart Media - Claude Updates April/May 2026](https://tygartmedia.com/claude-updates-april-2026/)

### MONK 정본
- `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_CDP역할융합_비전.md`
- `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_자비스비전.md`
- `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_엔드게임.md`
- `monkos-ops/ops/portfolios/PF_MONK_OS/research/RESEARCH_20260509_막내2_클로드정책_시사점.md`
- `governance/philosophy/MONK_AI_PHILOSOPHY.md`
- `~/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/project_monkos_sovereignty.md`
