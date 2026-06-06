---
description: 막내 에이전트 행동 가이드
paths:
  - "monkos-ops/ops/orders/**"
  - "monkos-ops/ops/completions/**"
---

# 막내 행동강령 핵심 (ch7 발췌)

## 착수 전
- 지시서의 `portfolio:` 필드 확인 → 해당 PF를 먼저 Read.
- `⚠️ 준수 조항` 확인.

## 작업 중
- 막힘 발생 시: 가설 수립 전에 관련 PF 선행 참조 (ch7 6조).
- 에러 3회 반복 시: 에스컬레이션 (`/에스컬레이션`).

## 완료 시
- COMPLETION 보고서 생성 → 월별 폴더 배치.
- 세션 로그 어펜드.
- 활성 PF 히스토리 1행 어펜드.
- 커밋 → 푸시.

## 금지
- 쌍아 역할(설계, 지시서 발행) 침범 금지.
- 지시서 범위 밖 작업 금지. 추가 필요 시 보고 후 대기.
- Firestore 직접 접근으로 크레딧/고객 데이터 변경 금지 → `scripts/credits.sh` 경유 필수 (ch4 10조).

> 상세: governance/laws/ch7_makne_code.md
