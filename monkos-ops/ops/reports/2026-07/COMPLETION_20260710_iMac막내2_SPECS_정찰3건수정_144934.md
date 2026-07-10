---
type: completion
date: 2026-07-10
time: 14:49 KST
from: iMac/막내2
to: 작가님
order: "[직접지시] 2026-07-10 정찰 워크플로우 적대검증 확정 3건 수정"
portfolio: PF_SPECS
commit: 494bbef
branch: main
---

# COMPLETION — portal 적대검증 확정 3건 수정

**[2026-07-10 14:49 KST]** iMac/막내2 → 작가님

> 호칭 주기: 동시 세션 iMac/막내1(크롭엔진 B5·R1, `6d2fbeb4`)과 구분 위해 본 세션은 막내2로 표기.

## ✅ 완료 항목

### ① POST 핸들러 세션 식별 복원 — server.js
- **문제**: req.sessionId/req.paymentRegion/req.lang이 GET 분기 안에서만 세팅 → 모든 POST 핸들러의 서버측 trackEvent가 세션 연결 상실 (headshot-route.js:103 sessionId 항상 undefined, /api/track ipCountry 항상 null, generate는 인라인 재파싱으로 우회 중)
- **수정**: 식별(쿠키 파싱·언어·권역)을 OPTIONS 처리 직후 메서드 무관 위치로 이동. 쿠키 발급(Set-Cookie: monkos_sid/monkos_lang)은 종전대로 GET 페이지 응답 한정 — 발급 행동 변화 없음. sid 쿠키 없는 POST는 sessionId=null (trackEvent 기존 관용과 동일)
- **부수 정리**: generate 내 인라인 재파싱(구 817행)·/api/track 내 재파싱(구 904행)을 req.sessionId로 일원화

### ② generate 환불 게이트 전구간 확장 — server.js /api/idphoto/generate
- **문제**: outer catch가 게이트 소모(무료 선차감 / 토큰 generateCount / 크레딧 10c) 후 비보호 구간(normalizeImage, cropToSpec 등) throw 시 환불 없이 500 → 과금+무산출
- **수정**: refundGate 예약 패턴 — 게이트 통과 시 모드별 반환 클로저 장착(무료=refundFreeQuota, 토큰=refundGenerateQuota, 크레딧=/api/credits/refund 경유), 산출물 확정 직전 해제, 실패 경로 어디서든 최대 1회 발화(발화 전 null 처리로 이중 환불 구조적 차단). 기존 inner Gemini catch·무료 실패 경로도 동일 훅으로 일원화 — 응답 코드·로그 형식 불변
- **경로 검증**: 게이트 전 throw(parseJsonBody 등)=미장착·무발화 / 게이트 후 비보호 throw=outer catch 발화+WARNING 로그 / 성공 응답=해제

### ③ matte 안착 가드 눈높이 창 정본 정렬 — lib/matte.js cropMetaWithinSpec
- **문제**: 눈 허용창 33~58%가 IDPASS 정본 blocked 게이트(spec-judge.js, eye 40~48%)보다 느슨 → 비-fit matteSpecPipeline 경로가 blocked 범위(예: 눈 35%) 산출물을 검수 게이트 없이 출고 가능
- **수정**: 창을 40~48%로 정렬 — judgeMetrics blocked와 동일 부등호(경계 포함 통과). 이탈 시 기존 흐름대로 재크롭 1회 → Gemini 재프레이밍 폴백
- **사유 문서화**: spec-judge는 "재해석 금지 이식"(SpecData.swift 포팅) 정본이라 상수 공유 리팩토링 대신 수치 정렬 + 주석 명기. 구 창(33~58)이 실측 정상군(39.7~48.0%) 기반 임시치였다는 이력도 주석에 보존

## ✅ 검증 — jest 전체 통과
- 베이스라인(수정 전): 9/10 스위트, 93 테스트 — render-specs-v2-ga 스위트 **사전 존재 실패**(내 변경 무관)
- 수정 후: **10/10 스위트, 101 테스트 전체 통과** (1.27s)
- node --check server.js·lib/matte.js 구문 통과

## 💡 범위 인접 보정 (테스트 전용 2건)
- render-specs-v2-ga.test.js: 파일럿 커밋에서 render-specs.js가 spec-crop.js(getSpecCropParams)를 import하게 된 뒤 config mock 미갱신 → TEAM_CHAT_ID 링크 에러로 스위트 전체 불능(사전 존재). mock에 텔레그램 경보부 3종 추가 — 프로덕션 코드 무변, "jest 전체 통과" 요건 달성에 필수라 동승
- matte.test.js: 가드 케이스를 정본 창에 정렬 — 39.7% true→false 전환 명시, 40.0/48.0 경계 케이스 추가

## ⏳ 대기·영향 사항
- 눈창 40~48 정렬로 비-fit 경로의 가드 이탈→Gemini 폴백 비율 소폭 상승 예상(구 창 통과분 33~40·48~58 구간이 정본대로 재프레이밍 경유) — 규격 보장 우선의 의도된 트레이드오프
- dev/prod 배포는 지시 범위 밖 — 미실행. 파일럿 dev(rev 00083)에 반영하려면 별도 지시 필요 (deploy.sh 경유)

## 📁 변경 파일
- monkos_AI/portal/server.js — 이슈 ①·②
- monkos_AI/portal/lib/matte.js — 이슈 ③
- monkos_AI/portal/__tests__/matte.test.js — 정본 창 케이스
- monkos_AI/portal/__tests__/render-specs-v2-ga.test.js — mock 보정
- monkos-ops/ops/portfolios/PF_SPECS/README.md — 히스토리 1행
- monkos-ops/ops/sessions/2026-07/2026-07-10_iMac_막내2.md — 세션 로그
- 본 보고 파일

## 🔀 커밋·푸시
- 작업 커밋: `494bbef4` (main) — 코드 4파일 + PF_SPECS 행 + 세션 로그. 본 보고 파일은 해시 확정 기입을 위해 직후 [docs] 커밋으로 동일 push에 동승
- 미커밋 잔류(타 작업 — 의도적 제외): lib/auth.js, lib/cms/idphoto-review.js, idphoto-jp·kr index.html, PF_CITADEL README, 쌍아 ORDER 2건
