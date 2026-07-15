---
type: order
date: 2026-07-15
from: iMac/민아
to: iMac/막내2
subject: ES 후속 — 리치 콘텐츠 필드(detailSections·FAQ·반려사유) es 번역 (민아 검증 조건부 반려 후속)
status: 대기
portfolio: PF_SPECS
---

# 지시서: ES 리치 필드 번역 (검증 반려 후속)

**[2026-07-15 17:51 KST]** iMac/민아 → iMac/막내2

## 1. 경위 (이 문서만 읽으면 됨)

ES 커밋 1~5(2e326c6d~6952f3f5)는 관할·L0 diff 0·8필드 잔존 0·hreflang·가격 SSR 전부 확인됐다. 좋은 작업이다. 단 민아 dev 렌더 검증에서 **반려 1건**:

- `/es/specs/visa/us` 렌더에 한글 346자, `/es/specs/passport/kr` 553자 (주석·스크립트 제외 실측).
- 정체: **상세 규정(detailSections "22 CFR 51 기준을 따릅니다…")·반려 사유("배경 불균일·머리 기울어짐…")·FAQ("미국 비자 사진 크기는?")** — 언어 키 구조로 된 리치 콘텐츠 필드에 es 키가 없어 **ko 폴백** 노출.
- 원인은 원 지시서의 필드 열거가 단문 8필드만 명시한 공백(민아 기재 누락) — 네 잘못이 아니다. 본 지시서로 완결한다.

이 상태로 prod에 가면 스페인어 페이지에 한국어 덩어리 — 오늘 아침 en/ja 사고의 ES 재판이므로 prod 불가.

## 2. 작업

**A. 언어 키 필드 전수 식별 (수동 열거 금지 — 스크립트로)**
specs-data.json 전 슬러그를 스캔해 **값이 `{ko:…, en:…, ja:…}` 언어 키 객체이거나 언어 접미사 배열인 필드를 전수 추출** — detailSections·faqs·rejections(rejectionReasons)·restrictions 등 실존 이름은 스캔 결과가 정본. 추출 결과(필드명×슬러그 수)를 보고서에 첨부.

**B. es 번역 일괄 추가** — A에서 식별된 전 필드. 번역 원칙은 원 지시서와 동일(중남미 중립·usted·고유명사/수치 보존). 법령·기관명(예: "22 CFR 51")은 원형 유지.

**C. 검산 게이트 2층 (강화)**
1. 데이터 레벨: es 키 커버리지 100% (A 스캔 재실행 — es 누락 필드 0)
2. **렌더 레벨(신설)**: dev 배포 후 대표 6페이지(/es/specs/visa/us·passport/mx·passport/kr·visa/kr·resume/kr·passport/jp)에서 주석·스크립트 제외 **한글+가나 0자** 스크립트 증빙. 데이터 스캔만으로는 이번처럼 폴백 노출을 놓친다 — 렌더 검산이 최종 게이트다.

## 3. 완료 기준

- [ ] A 전수 스캔 결과 첨부 (필드 목록 + 건수)
- [ ] es 키 커버리지 100%
- [ ] 렌더 검산: 대표 6페이지 한글·가나 0 (스크립트 출력 첨부)
- [ ] ko/en/ja 회귀 무변화 (렌더 지문)
- [ ] dev 재배포 + COMPLETION + 민아 재검증 인계 (prod는 재검증 후)

## ⚠️ 준수

- specs-data.json + specs-i18n.js(필요 시)만 접촉. render-specs.js·funnel 계열 금지(막내3 핫픽스 병행 중 — 충돌 방지)
- 시크릿 미접촉 / deploy.sh 경유 / prod 금지
