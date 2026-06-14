---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내4
status: 대기
portfolio: PF_SPREAD
priority: P1
pf: PF_SPREAD
---

# 지시서: SPREAD 배포 인프라 Phase 1

> **콘텐츠가 쌓여도 배포 파이프라인이 없으면 확산 불가.**
> 한송이가 매일 vol 콘텐츠를 생산 중이나 수동 배포 상태. 자동화 기반 구축.

---

## 1. 사전 조사

1. PF_SPREAD 포트폴리오 확인: `monkos-ops/ops/portfolios/PF_SPREAD.md`
2. SPREAD 관련 기안서 확인: `monkos-ops/ops/proposals/` 내 SPREAD 관련
3. 기존 배포 스크립트/코드 탐색: `scripts/`, `functions/` 등
4. 한송이 works 콘텐츠 구조 확인: `monkos-ops/works/han/`

## 2. Phase 1 범위

PF에 정의된 Phase 1 항목을 실행. 예상 범위:

1. **OG 공유 버튼** — 콘텐츠 페이지에 SNS 공유 메타/버튼 추가
2. **GitHub Issues 자동 게시** — 콘텐츠 → GitHub Issue 자동 변환 파이프라인
3. **코웍이 워크플로우** — works/ 콘텐츠를 배포 채널로 연결하는 자동화

> PF 확인 후 실제 Phase 1 항목이 다르면 그에 따름.

## 3. 산출물

- Phase 1 구현 코드/스크립트
- 테스트 결과
- 완료 보고 (✅❌💡⏳📁🔀 형식)

## ⚠️ 준수 조항

- 헌법 4조 3항: 내부 기밀 외부 노출 금지
- 헌법 4조 1항: API 키 하드코딩 금지
- 헌법 2조 3항: 코딩 계획 제시 → 승인 → 실행 (규모가 클 경우)
- 법률 ch5: 배포 규칙 준수
