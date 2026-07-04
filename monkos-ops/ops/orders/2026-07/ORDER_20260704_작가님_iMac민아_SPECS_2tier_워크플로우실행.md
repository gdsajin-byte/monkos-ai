---
type: order
date: 2026-07-04
device: iMac
agent: 민아
from: 작가님
to: iMac/민아
status: 완료
portfolio: PF_SPECS
---

# ORDER — SPECS 2-티어 가격 체계 실행 (경로③ 변형: 지시서 대신 Workflow)

**[2026-07-04 17:10 KST]** 작가님 → iMac/민아

## 지시 내용 (구두)
1. 2-티어 가격 확정: specs 셀프서브 ₩2,000 / 기존 idphoto-kr·jp 발급보장 ₩9,900
2. 설계도 생성
3. **막내 지시서 대신 Workflow 기능으로 막내 역할 대체 실행** — 단, 기록이 남도록 진행

## 근거 및 예외 기록
- 헌법 1조 2항 경로③(작가님→민아 직접 지시) 준용. 쌍아 사후 보정 대상.
- `[예외]` 민아의 dev 배포 실행 — 통상 위임경계(06-25) 밖이나 작가님 직접 지시로 승인. prod 배포는 범위 제외.
- 지시서 미발행 사유: 작가님이 Workflow 대체를 명시 지시. 기록은 본 ORDER + 설계서 + Workflow runId + COMPLETION으로 갈음.

## 설계 정본
- [DESIGN_20260704_specs_2tier_가격체계.md](../../../tech/designs/2026-07/DESIGN_20260704_specs_2tier_가격체계.md)

## 완료 조건
- v2 ko 전 슬러그 롤아웃 + 2-티어 CTA 구현, 감사 통과, dev 배포 검증
- 발급보장 규정 초안 (작가님 승인 대기 상태로 제출)
- COMPLETION 보고서 + PF_SPECS 히스토리 + 세션로그 갱신
