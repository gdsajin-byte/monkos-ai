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

# ORDER — T1 결제 연동 트랙 실행 (경로③ 변형: Workflow 막내 대체 2호)

**[2026-07-04 19:18 KST]** 작가님 → iMac/민아

## 지시
- 결제 연동 트랙 승인 (2026-07-04 19:18 "승인"): 토스 direct KR + 레몬 $2 글로벌·JP + v2 다국어화 + E2E 준비
- 실행 방식: 1호(SPECS 2-티어)와 동일 — Workflow 막내 대체 + 기록 유지

## 설계 정본
- [DESIGN_20260704_결제연동트랙.md](../../../tech/designs/2026-07/DESIGN_20260704_결제연동트랙.md)

## 완료 조건
- 머니패스 구현(금액 서버 고정·토큰 Firestore·생성 결제 게이트) + 감사(머니패스 보안 렌즈) 통과 + dev 배포 + 토스 테스트키 검증
- 작가님 액션 대기 항목 명시 보고 (레몬 $2 상품 생성·variant 시크릿 등록)
- COMPLETION + PF_SPECS 히스토리 + 세션로그
