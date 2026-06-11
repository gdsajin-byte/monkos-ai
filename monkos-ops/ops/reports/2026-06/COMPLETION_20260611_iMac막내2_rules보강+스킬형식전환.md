---
type: completion
date: 2026-06-11
device: iMac
agent: 막내2
status: 마감
portfolio: PF_MONK_OS
order: ORDER_20260611_iMac쌍아_막내2_rules보강+스킬형식전환.md
---

# COMPLETION — rules/session-log.md 보강 + 스킬 15종 형식 전환

**[2026-06-11 12:03 KST] iMac/막내2 → 작가님**

---

## Task 1: rules/session-log.md 보강

- **Before**: 32줄, 파일명 패턴 3종, globs 3종
- **After**: 53줄 (60줄 이내), 파일명 패턴 10종 + 정본 위치 통합 테이블, globs 8종
- 추가된 내용:
  - A. 파일명 패턴 7종 추가 (PROPOSAL, INCIDENT, SPEC, DESIGN, PETITION, REVIEW, PF)
  - B. 정본 위치 — 파일명 패턴 테이블에 통합 (별도 테이블 대신 컬럼 추가로 간결화)
  - C. PF 귀속 파일명 규칙 1행
  - D. 수발신 헤더 형식 (헌법 2조 2항 발췌)
  - globs 확장: proposals, incidents, specs, designs, petitions 추가

## Task 2: 스킬 15종 commands/ 이동

- `.claude/skills/` → `.claude/commands/` 15종 전수 이동 완료
- 내용 변경 없음, 파일명 그대로
- `.claude/skills/` 디렉토리 유지 (빈 상태)
- 이동 목록: cdp-browser, deploy-cf, deploy-cr, escalation, health-check, makne-finish, model-check, order-write, pf-declare, pf-status, portal-context, registry-add, session-checkpoint, session-end, session-start

## 미변경 (지시서 범위 밖)

- 법률 본문 (ch3, ch4) 미수정
- `.claude/settings.json`, `.claude/settings.local.json` 미수정
- CLAUDE.md 위계표 미수정 (쌍아 별도 보정 예정)
