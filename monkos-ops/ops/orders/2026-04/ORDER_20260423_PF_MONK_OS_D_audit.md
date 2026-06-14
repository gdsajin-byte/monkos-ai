---
type: ORDER
date: 2026-04-23
from: iMac/쌍아
to: iMac/막내4
status: 대기
portfolio: PF_MONK_OS
pf: PF_MONK_OS
track: D
parallel_with: ["A → 막내1", "B → 막내2", "C → 막내3"]
---

# [지시서] 현 MONK OS 체제 감사 + 갭 분석 (PF_MONK_OS / Track D)

> **[2026-04-23 11:59 KST] iMac/쌍아 → iMac/막내4**
> 상위 PF: [PF_MONK_OS](../portfolios/PF_MONK_OS/README.md)
> 목적: Claude 4.7 표준·업계 흐름과 대조하기 전에, **현 MONK OS가 실제로 무엇을 갖고 있는지** 전수 감사하고 자기 강점·약점·개헌 후보를 작성 — A/B/C 트랙 결과와 Phase 1에서 합류해 로드맵 초안의 토대가 된다.
> **병렬 맥락**: 4기 동시 가동. 본 트랙은 **로컬 파일 감사 전담**. A/B/C는 외부 리서치 — 본 트랙은 외부 표준 평가 금지, 오직 내부 현황 fact-finding.

---

## 배경

- 작가님 원문: "일단 현 우리 체제의 안정성을 바탕으로 차후 어떤 에이전트라도 우리의 OS가 입혀질수 있는 체제로 갈 로드맵"
- "안정성"은 감사 없이 주장할 수 없다 → 본 트랙이 근거를 제공
- 감사 결과가 "현재 체제가 생각보다 약하다" / "생각보다 강하다" 어느 쪽이어도 **사실 그대로 기록**. 쌍아·작가님이 판단의 재료로 씀

---

## 조사 범위 (12개 축)

### 1. 헌법 (CLAUDE.md) 해부
- 5축 구조(정체성·통신·적립·구속·메타) 조항별 인벤토리
- 최근 개정 이력 (2026-03-25 5축 재편, 03-26 PF 체계 추가 등)
- 현행 조문과 실제 운용의 모순 여부 (에이전트가 따르는지)
- 길이·복잡도 측정 (줄 수, 조항 수, 참조 링크 수)

### 2. 법률 8장 (governance/laws/) 전수
- ch1~ch8 각 파일: 조 수, 최근 개정일, 핵심 조항 1줄 요약
- 각 장이 헌법 어느 조항의 위임인지 재확인
- 중복·공백·모순 후보 식별

### 3. `.claude/rules/` 전수
- 현재 존재하는 rule 파일 목록 + 각각의 역할
- 본 세션에서 로딩된 rule (cdp-browser, deployment) 외 누락 여부
- CLAUDE.md와 rules/의 역할 경계 명확성

### 4. `.claude/skills/` 전수 (존재 시)
- 폴더 존재 여부, 파일 목록
- frontmatter 규격 준수 여부
- Anthropic 공식 Skill 스키마 대조 전 현황만 기록

### 5. MEMORY.md (iMac 디바이스) 감사
- 현재 줄 수, 200줄 캡 준수 여부
- 섹션 구성
- 피드백 메모리·외장 메모리 참조 링크 유효성 (깨진 링크 있나)

### 6. 외장 메모리 (memory/) 전수
- `/Users/jeong-kyushin/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/` 파일 전수
- 타입 분포 (user / feedback / project / reference)
- 최근 30일 추가 항목 · 오래된(90일+) 항목 식별

### 7. monkos-ops/ops/ 구조
- 하위 폴더(sessions/orders/portfolios/proposals/reports/roadmaps/agenda/decisions/templates 등) 용도 매핑
- 실제 기록 빈도 (최근 7일 기준)
- 데드 폴더(오래 비어있는 것) 식별

### 8. 정본 단일 원칙 (헌법 3조 4항) 위반 후보
- 동일 문서가 `docs/` 와 `monkos-ops/` 양쪽에 있는지 표본 점검
- `PF_*.md` 단일 파일 vs `PF_*/` 폴더 공존 케이스 (PF_CDP·PF_SPREAD 등)의 정본 위치
- works/ 와 로컬 Desktop 폴더(쌍아/·철창이/)의 역할 구분 기록 현황

### 9. 에이전트 명명 체계 vs Anthropic 표준 용어
- 쌍아/민아/막내/용아/소넷이/코웍이 = 내부 명명
- 이것이 Anthropic 공식 용어(Agent / Subagent / Session / Skill / Rule)와 어떻게 매핑되는지 초안 표 1장

### 10. Claude 4.7 이후 MONK OS 변경 필요 후보
> 막내4가 자기 판단으로 **현 체제 조문 그대로 두기 어려워 보이는 항목**을 플래그 (단순 플래그만, 해결책은 Phase 1 쌍아 통합 몫):
- 예: 제2조 통신 1항 디바이스 맵에 4060/Cloudflare Worker 런타임 누락?
- 예: 법률 제3장 세션 로그가 Routines·Skills 시대에 맞게 업데이트 필요?
- 단순 나열 — 해결책 작성 금지

### 11. 위성 환경 (M1/M4/M2) 헌법 에센스 배포 상태
- `monkos-ops/ops/templates/CONSTITUTION_ESSENCE.md` 존재·최신 개정일
- 본진 헌법 v5축과의 동기화 상태
- 에센스 미배포 디바이스 식별 (가능한 범위)

### 12. 감사 결론 (막내4 판단)
> 다음 구조로 기록:

```
## 강점 3
1. ...
2. ...
3. ...

## 약점 3
1. ...
2. ...
3. ...

## 개헌 청구 후보 3
1. (조항) — (이유) — (심각도: 中/高)
2. ...
3. ...
```

---

## 조사 방법

1. **로컬 파일만** (git grep · find · wc · ls · Read). 외부 웹 리서치 금지
2. 발견 사실은 파일 경로 + 줄번호 + 인용 1~2줄로 뒷받침
3. 수치(줄 수·파일 수·조항 수)는 실측
4. "최근 30일"은 `git log` 기준으로 확인
5. 불확실한 판단은 `⚠️ 쌍아 확인 요청` 플래그 남기고 다음 축으로

---

## 산출물

**메인 감사 보고서**: `monkos-ops/ops/portfolios/PF_MONK_OS/audit/AUDIT_current_monk_os.md`

구조:
```
---
type: AUDIT
track: D
pf: PF_MONK_OS
date: 2026-04-23
author: iMac/막내4
---
# AUDIT — 현 MONK OS 체제 전수 감사
## 요약 (500자 내, 최상단)
## 1. 헌법 해부
## 2. 법률 8장
## 3. .claude/rules/
## 4. .claude/skills/
## 5. MEMORY.md
## 6. 외장 memory/
## 7. monkos-ops/ops/ 구조
## 8. 정본 단일 원칙 준수
## 9. 에이전트 명명 vs 공식 용어
## 10. Claude 4.7 이후 변경 필요 후보 (플래그만)
## 11. 위성 환경 에센스
## 12. 결론 (강점 3 / 약점 3 / 개헌 후보 3)
```

**보조 매트릭스**: `monkos-ops/ops/portfolios/PF_MONK_OS/audit/GAP_MATRIX.md`
- Anthropic 공식 개념 vs MONK OS 대응 표 (Skills·Rules·Memory·Routines·Hooks·SubAgents 행)
- 공식 개념 열은 비워두고 플레이스홀더만 — A 트랙 결과와 Phase 1에서 쌍아가 합본
- MONK 측 열은 경로·파일명·현 운용 방식 채움

---

## 준수 조항

⚠️ 타임스탬프: 매 턴 `date` KST
⚠️ 수정·생성 작업 금지 — **읽기 전용 감사**
⚠️ 외부 웹 리서치 금지 (A/B/C 트랙 침범)
⚠️ 모든 발견은 경로·줄번호 인용
⚠️ 추정 금지 — 불확실 시 `⚠️ 쌍아 확인 요청`
⚠️ 완료 시 PF README 히스토리 append
⚠️ 세션 로그: `monkos-ops/ops/sessions/2026-04-23_iMac_막내4.md`

---

## 완료 보고 형식

```
✅ Track D 완료 — AUDIT_current_monk_os.md + GAP_MATRIX.md
📁 감사: [링크](monkos-ops/ops/portfolios/PF_MONK_OS/audit/AUDIT_current_monk_os.md)
📁 매트릭스: [링크](monkos-ops/ops/portfolios/PF_MONK_OS/audit/GAP_MATRIX.md)
💡 강점 3 / 약점 3 / 개헌 후보 3 한 줄씩
⚠️ 쌍아 확인 요청 항목 N건
⏳ Phase 1 통합 시 A 트랙과 병합 권고 지점
```
