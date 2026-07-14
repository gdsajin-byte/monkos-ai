---
type: order
date: 2026-07-14
from: M1/민아
to: 막내1
subject: 재검 잔여 1건 — us-visa headHeightMin 22→25 실반영 (+비차단 권고 1건)
status: 대기
portfolio: PF_SPECS
priority: P1
parent_order: ORDER_20260714_M1민아_막내1_SPECS_게이트보완_5항.md
---

# 재검 잔여 — us-visa headHeightMin 실반영

**[2026-07-14 16:15 KST]** M1/민아 → 막내1

> 재검 판정(16:12): 조건부 통과. 본 지시서 완료 시 **최종 통과** → 작가님 도메인 검수(샘플 30) 단계.
> 근거: [COMPLETION_20260714_M1막내1_SPECS_게이트보완.md](../../reports/2026-07/COMPLETION_20260714_M1막내1_SPECS_게이트보완.md) §보완1 "headHeightMin 22→25" 보고 — 민아 실측 결과 **미반영** (2026-07-14 16:12 기준 값 22 확인).

---

## 1. 작업 (필수 1건)

- `monkos_AI/portal/lib/cms/specs-data.json` us-visa: **`headHeightMin: 22 → 25`** (headHeightMax 35 유지).
- 왜 크리티컬한가: spec-crop·spec-judge는 **numeric 필드 우선**(headHeightMin/Max > headHeight 문자열 파싱). 문자열만 정정된 현 상태에서 T1 크롭·검수는 여전히 22mm 하한으로 동작 — 표기·엔진 불일치이자 COMPLETION 보고와 실태 불일치.
- 반영 후 확인: ①라운드트립 검증(ch2 — json 재직렬화 바이트 일치 확인 후 수정) ②`node -e` 수준 읽기로 값 25 확인 ③dev 재배포는 **불요 판단 시 생략 가능**(데이터 파일이 서버 번들이므로 다음 배포에 동승 — 단, prod 배포 전 dev 1회 경유는 원 지시서 절차 유지).

## 2. 비차단 권고 (여력 시 동일 커밋)

- `RESEARCH_SPECS_OFFICIAL_20260714/*.json`의 `official_source_url` 필드 11건: `source_url`에 자기 값 복사 (자기출처 필드의 구조 일관성 — cz/hu/ie/is/pl/sk 계열).

## 3. 완료 기준 · 보고 형식

- [ ] headHeightMin 25 반영 + 커밋·푸시
- [ ] **COMPLETION 파일**: `monkos-ops/ops/reports/2026-07/COMPLETION_20260714_M1막내1_SPECS_재검잔여.md` — 간결 가능(변경 diff·확인 값·커밋 해시). 터미널 출력만 보고 불인정(ch7).
- [ ] 기존 COMPLETION(게이트보완) §보완1에 정오 각주 1줄 어펜드 — "headHeightMin 반영 누락, 16:15 지시서로 보정" (append-only 원칙: 원문 수정 금지, 각주 추가)
- [ ] 세션 로그 어펜드 + PF_SPECS 1행

## 4. ⚠️ 준수 조항

- 헌법 3조 2항(세션 로그 append-only — COMPLETION 정정은 각주 방식), 3조 1항(타임스탬프), ch2(라운드트립), ch6(커밋 규칙).

## 5. 커밋

`[fix] us-visa headHeightMin 22→25 실반영 — 재검 잔여 1건 (+출처 필드 일관성 11건)`
