---
type: report
date: 2026-02-28 16:14 KST
from: iMac/막내3
to: iMac/쌍아
order: ORDER_20260228_막내3_Phase2실행_functions제거
---

# Phase 2 실행 완료 보고서

> **[2026-02-28 16:14 KST] iMac/막내3 -> iMac/쌍아**

## 실행 결과

### Step 1. 레거시 백업
- functions/api/ 18개 JS + 2개 README = 20개 파일 -> monkos-ops/tech/archive/functions_cf/
- 인증 페이지 4개 -> monkos-ops/tech/archive/auth_pages/
- ARCHIVE_MANIFEST.md 작성 완료

### Step 2. D1 shared_visitors export
- SQLITE_ERROR: no such table: shared_visitors
- 에러 JSON은 archive/d1_shared_visitors_export.json에 기록됨

### Step 3. functions/ 디렉토리 제거
- git rm -r functions/ -- 20개 파일 제거 완료

### Step 4. 인증 페이지 4개 제거
- auth-success.html, login.html, simple-signup.html, auth-error.html 제거 완료
- 원경로: MONK_kr/ai_lab/

### Step 5. ai_lab.html 수정
- photolab 카드 링크: ./photolab/ -> https://idphoto-kr.monkos.ai
- image_pro 카드 링크: ./image_pro/ -> https://image.monkos.ai
- purposeRoutes 매핑 monkos.ai 도메인으로 전환
- 로그인 가드 모달 (37줄) 제거
- auth-section: 로그인버튼 -> monkos.ai/portal 링크로 대체
- POST /api/visitor fetch 블록 제거 (try-catch 전체)
- monkos_credits localStorage get/set 제거
- checkAuth/fetchUserCredits/goToLogin/goToSimpleSignup/logout 전체 제거 (68줄)
- monk_auth_token, monk_user localStorage 참조 완전 제거
- MONK_VISITOR_INFO localStorage는 유지 (오프라인 폴백)
- 953줄 -> 814줄 (139줄 감소)

### Step 6. wrangler.toml D1 바인딩 제거
- [[d1_databases]] 블록 전체 삭제 완료

### Step 7. _redirects 파일 생성
- /ai_lab/photolab/* -> https://idphoto-kr.monkos.ai/:splat 301
- /ai_lab/image_pro/* -> https://image.monkos.ai/:splat 301
- /api/* -> https://monkos.ai/api/:splat 301

### Step 8. _headers 검토
- photolab 캐시 비활성화 헤더 정리 (리다이렉트 후 불필요)
- monk_studio/ 관련 헤더 없음 (미접촉 확인)

### Step 9. 커밋 + push
- commit: 6dcde0c
- branch: develop
- push: origin/develop 완료
- 30 files changed, 69 insertions(+), 164 deletions(-)

## 준수 사항 확인
- 헌법 8조: 아카이브 백업 완료 후 삭제 실행 (준수)
- ch7 3조: monk_studio/ 미접촉 (준수)
- ch7 1조: develop push만. main 머지 없음 (준수)
- 작가님 조건: 삭제 대상 전체 monkos-ops/tech/archive/에 백업 완료 (준수)

## 요약

| 항목 | 상태 |
|------|------|
| 레거시 백업 | 완료 |
| D1 export | 실패 (테이블 미존재) |
| functions/ 제거 | 완료 (20개) |
| 인증 페이지 제거 | 완료 (4개) |
| ai_lab.html 수정 | 완료 |
| wrangler.toml D1 | 완료 |
| _redirects 301 | 완료 |
| _headers 정리 | 완료 |
| 커밋+push | 완료 (develop) |
| monk_studio 접촉 | 없음 (준수) |
