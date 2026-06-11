---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내2
portfolio: PF_MONK_OS
status: 대기
---

# 지시서 — rules/session-log.md 보강 + 스킬 15종 형식 전환

**[2026-06-11 11:59 KST] iMac/쌍아 → iMac/막내2**

---

## 배경

웹민아 실측(REPORT_20260611_웹민아_웹환경_컨텍스트로딩_실측.md)에서 두 가지 문제가 확인되었다:

1. **rules/session-log.md**에 파일명 패턴 3종만 있어, 법률 ch4 상세(16종 네이밍 패턴, 배치 경로, 정본 위치)가 누락. 새 에이전트(웹민아 등)가 문서 위치·서식 규칙을 자동 인지하지 못함.
2. **`.claude/skills/` 15종**이 flat .md(구 커맨드 형식)로 존재하여 현행 스킬 로더에 미인식. 웹·로컬 모든 환경에서 스킬 자동 로딩 0건.

---

## ⚠️ 준수 조항

- 헌법 5조 1항: rules 변경 시 대응하는 법률 조항과 정합성 유지
- 헌법 3조 4항: 정본 단일 원칙 — rules는 법률 발췌이므로 법률 본문과 충돌하지 않을 것
- ch7 3조: 지시서 범위 밖 작업 금지. 법률 본문(ch3, ch4) 자체는 수정하지 않는다

---

## Task 1: rules/session-log.md 보강

현재 31줄. ch4 3조(파일 네이밍 16종)와 ch4 4조(정본 위치)에서 핵심을 발췌하여 보강한다.

### 추가할 내용

**A. 파일명 패턴 확장 (현재 3종 → 주요 10종)**

현재 세션로그/보고서/지시서 3종만 있다. 아래를 추가:

| 패턴 | 대상 폴더 | 예시 |
|------|----------|------|
| `COMPLETION_YYYYMMDD_{주체}_{내용}.md` | `monkos-ops/ops/reports/YYYY-MM/` | `COMPLETION_20260611_막내1_VTON편입.md` |
| `PROPOSAL_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/proposals/` | `PROPOSAL_20260611_민아_스킬형식전환.md` |
| `SPEC_{service}_{feature}.md` | `monkos-ops/tech/specs/{service}/` | `SPEC_idphoto-kr_credit-system.md` |
| `INCIDENT_YYYYMMDD_{service}.md` | `monkos-ops/ops/incidents/YYYY-MM/` | `INCIDENT_20260220_cf-function.md` |
| `DESIGN_YYYYMMDD_{feature}.md` | `monkos-ops/tech/designs/YYYY-MM/` | `DESIGN_20260215_tts-architecture.md` |
| `REVIEW_YYYYMMDD_{agent}_{topic}.md` | `monkos-ops/ops/reports/YYYY-MM/` | `REVIEW_20260302_쌍아_스키마검토.md` |
| `PETITION_YYYYMMDD_{agent}_{topic}.md` | `governance/constitution/petitions/` | `PETITION_20260222_막내6_자동집행.md` |

**B. 정본 위치 테이블 (축약)**

주요 문서 유형별 정본 위치를 5~6행으로 축약 추가. (ch4 4조 전체 테이블이 아닌 핵심만)

| 문서 유형 | 정본 위치 |
|----------|----------|
| 지시서 (ORDER) | `monkos-ops/ops/orders/YYYY-MM/` |
| 보고서/완료보고/리뷰 | `monkos-ops/ops/reports/YYYY-MM/` |
| 제안서 (PROPOSAL) | `monkos-ops/ops/proposals/` |
| 세션 로그 | `monkos-ops/ops/sessions/YYYY-MM/` |
| 기술 스펙 | `monkos-ops/tech/specs/{service}/` |
| 포트폴리오 (PF) | `monkos-ops/ops/portfolios/` |

**C. PF 귀속 파일명 규칙**

PF에 귀속된 문서는 파일명에 PF 코드네임 삽입. 무귀속은 생략.
- 예: `ORDER_20260326_M1쌍아_막내1_CITADEL_Phase1_최적화.md`

**D. 수발신 헤더 형식 (헌법 2조 2항 발췌)**

현재 rules에 수발신 헤더 형식이 없다. 추가:
```
**[YYYY-MM-DD HH:MM KST]** {디바이스}/{에이전트} → {수신자}
```

### 제약

- 보강 후 총 줄 수 **60줄 이내** 유지. 현재 278줄 합계에서 과도한 비대화 방지.
- 법률 본문 원문을 복사하지 말 것. 핵심만 발췌하고 `> 상세: governance/laws/ch4_docs_structure.md 3조, 4조` 참조 유지.
- globs 헤더의 적용 범위 확장 검토: 현재 sessions/reports/orders만 있으나 proposals/incidents/designs 등도 해당될 수 있음.

---

## Task 2: 스킬 15종 형식 전환

### 2-A: 즉시 — commands/ 이동 (A안)

1. `.claude/skills/` 내 flat .md 파일 15종을 `.claude/commands/`로 이동
2. 내용 변경 없음. 파일명 그대로.
3. 이동 전 `.claude/commands/` 디렉토리 존재 여부 확인, 없으면 생성
4. 이동 후 `.claude/skills/`에 해당 15개 파일이 남아있지 않은지 확인

### 2-B: 검증

이동 후 다음을 확인:
- `ls -la .claude/commands/` — 15종 존재
- `ls -la .claude/skills/` — 15종 부재 (디렉토리는 유지, 향후 SKILL.md 디렉토리형 전환용)

### 스킬 15종 목록 (확인용)

이동 전 `ls .claude/skills/`로 실제 목록을 확인하고, 아래와 대조:

예상 목록 (웹민아 보고 기준):
- 세션시작, 세션마감, 에스컬레이션, 막내마감, PF선언
- 배포CF, 배포CR, CDP브라우저
- 기타 (실제 파일명 확인 후 전수 이동)

### 주의

- `.claude/skills/` 디렉토리 자체는 삭제하지 말 것 (향후 SKILL.md 디렉토리형 전환 대비)
- `.claude/settings.json`, `.claude/settings.local.json`은 수정하지 말 것
- CLAUDE.md의 위계표("명령 (Skills) — `.claude/skills/`")는 본 지시서 범위 밖. 쌍아가 별도 보정.

---

## 산출물

1. `.claude/rules/session-log.md` 보강 완료 (60줄 이내)
2. `.claude/commands/` 15종 이동 완료
3. **보고서**: `monkos-ops/ops/reports/2026-06/COMPLETION_20260611_iMac막내2_rules보강+스킬형식전환.md`
4. 세션 로그 어펜드
5. 완료 보고: ✅❌💡⏳📁🔀 형식

---

## 참조 문서

- `REPORT_20260611_웹민아_웹환경_컨텍스트로딩_실측.md` (진단 원본)
- `PROPOSAL_20260611_웹민아_스킬형식전환_제안.md` (A안/B안 비교)
- `governance/laws/ch4_docs_structure.md` 3조, 4조 (법률 본문 — 발췌 원본)
- `governance/laws/ch3_session_log.md` (세션 로그 상세)
