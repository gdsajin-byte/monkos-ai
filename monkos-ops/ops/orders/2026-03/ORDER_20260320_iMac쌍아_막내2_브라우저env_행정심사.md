---
type: ORDER
id: ORDER_20260320_iMac쌍아_막내2_브라우저env_행정심사
date: 2026-03-20
from: iMac/쌍아
to: 막내2
priority: P1
status: 대기
ref: monkos-ops/ops/proposals/PROPOSAL_20260320_민아_브라우저연동_env체계_기안서.md
---

# 민아 브라우저 연동 env 체계 — 행정 심사

**[2026-03-20 18:42 KST] iMac/쌍아 → 막내2**

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내2 → iMac/쌍아` 형식

## 배경

민아 브라우저 연동 env 체계 기안서에 대한 **행정 심사**를 수행하라.

## 리서치 선행 의무

- 기안서: `monkos-ops/ops/proposals/PROPOSAL_20260320_민아_브라우저연동_env체계_기안서.md`
- 현행 env 관리 체계: `monkos_AI/portal/lib/shared/config.js` (환경변수 24개)
- 법률 ch4 (문서/폴더 구조)
- `.gitignore` 확인 (`.env` 제외 여부)

## 검토 항목

1. 기안서의 env 저장 위치 제안(`~/.claude/` 또는 `.env`)이 현행 인프라와 호환되는가
2. Cloud Run env와 로컬 에이전트 env의 분리가 명확한가 (혼동 위험)
3. 각 플랫폼별 인증 방식(세션 쿠키 vs API 키 vs OAuth)의 운영 부담 비교
4. env 키 네이밍 규칙이 기존 `config.js`의 24개 환경변수와 충돌하지 않는가

## 임무

각 항목에 대해 `문제없음` / `보정필요` / `충돌` 판정 + 구체적 영향 범위. 종합 판정 1건.

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `보고 대기` |
| 산출물 | `monkos-ops/ops/reports/REVIEW_20260320_브라우저env_행정_막내2.md` |
| 문서 유형 | `REVIEW` |
| 세션 로그 | 해당 없음 |
