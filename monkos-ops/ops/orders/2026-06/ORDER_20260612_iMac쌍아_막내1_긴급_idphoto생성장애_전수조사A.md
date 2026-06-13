---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "[긴급] idphoto 생성 장애 전수조사 A — 프론트 플로우 + 크레딧 API 인증 체인"
status: 대기
portfolio: PF_IDPHOTO
priority: P0
---

# 지시서 — [긴급] idphoto 생성 장애 전수조사 A

> **[2026-06-12 18:12 KST]** iMac/쌍아 → iMac/막내1
> 작가님 직접 확인: 크레딧 390 보유 상태에서 생성 버튼 → 충전 페이지로 리다이렉트. 프로덕션 장애.
> 어제부터 고객들이 10c 소진 없이 이탈한 것과 동일 현상.
> 2건 분할 (A: 프론트+API, B: 서버+배포). 상호 교차 감사.

---

## 증상

- 로그인 상태, Cr 390 표시
- 생성 버튼 클릭 → `store.user.credits < CREDIT_COST.generate(10)` → 충전 페이지로 이동
- 이틀 전(6/10)까지 정상 작동

## 용의 커밋

`5715fd96` (2026-06-10 16:33) — 보안 페일클로즈 응급 패치:
- **C-2**: 크레딧 API 인증 미들웨어 (portal 3핸들러 + idphoto-kr/jp 쿠키 포워딩)
- **C-3**: AUTH_SECRET 하드코딩 폴백 제거 → `process.exit(1)`

후속 커밋도 용의 범위:
- `0d43fde6` (6/11) — timingSafeEqual 전환
- `9606ee45` (6/11) — deploy.sh --set-secrets 전환

## Task A — 프론트 플로우 + 크레딧 API 인증 체인

### A-1. 프론트 크레딧 로딩 추적

`monkos_AI/idphoto-kr/public/shared.js`의 `initCredits()`:
1. `verify-cookie` 엔드포인트를 프로덕션에서 실제 호출했을 때 응답 확인 (curl 또는 코드 분석)
2. 쿠키 `monkos_session`이 idphoto-kr.monkos.ai 도메인에서 접근 가능한지 (Domain=.monkos.ai 설정 확인)
3. `initCredits()` 실패 시 `store.user.credits = 0`으로 떨어지는 경로 확인
4. UI "Cr 390" 표시와 `store.user.credits` 실제값 불일치 가능성

### A-2. 보안 패치 C-2 영향 분석

`5715fd96`의 idphoto-kr/server.js 변경 내용 전수 확인:
1. 크레딧 API에 인증 미들웨어가 추가됨 → idphoto-kr에서 portal로 보내는 크레딧 요청이 인증 실패하는지
2. 쿠키 포워딩이 정상 작동하는지 (credentials: 'include' + CORS)
3. `5715fd96` 이전/이후의 `server.js` diff를 정밀 분석

### A-3. 보안 패치 C-3 영향 분석

`5715fd96`의 auth.js 변경:
1. AUTH_SECRET 폴백 'monkos-default-secret' 제거 → `process.exit(1)` — 프로덕션에서 AUTH_SECRET이 정상 로드되는지
2. `verifyAuthToken()` 함수가 실패하면 `handleVerifyCookie`가 401 반환 → `store.user.credits = 0`
3. `0d43fde6`의 timingSafeEqual 전환이 토큰 검증을 깨뜨리지 않았는지

### A-4. 6/10 이전 정상 작동 확인

`git diff 5715fd96^..5715fd96 -- monkos_AI/idphoto-kr/ monkos_AI/portal/lib/auth.js monkos_AI/portal/lib/credits.js`

변경 전후 로직 대조:
1. 어떤 조건에서 크레딧 체크가 실패하는지 정확한 코드 경로 특정
2. 롤백 없이 수정 가능한 최소 패치 식별

## 산출물

`monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_긴급_idphoto생성장애A.md`

## ⚠️ 준수 조항

- **헌법 4조 2항**: 읽기 전용. 코드 수정 금지 — 원인 특정 후 **수정안을 보고**. 수정 실행은 별도 승인.
- **헌법 4조 1항**: 키 값 금지.
- **헌법 3조 1항**: 매 턴 `date` KST.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.

## 교차 감사

막내2 보고서(서버+배포)와 교차:
- 서버측 AUTH_SECRET 로딩 상태와 프론트 인증 실패의 인과 일치 여부
- deploy.sh --set-secrets 전환이 AUTH_SECRET 주입에 영향 줬는지

## 커밋 메시지

```
[research] idphoto 생성 장애 전수조사 A — 프론트+크레딧API 인증 체인 분석
```
