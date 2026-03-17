---
type: ORDER
from: 작가님
to: iMac/쌍아
date: 2026-03-17
priority: P1
scope: 직접수정 (경미, 작가님 특별승인)
status: 완료
---

# 지시서: 어드민 Google 로그인 추가 + 포털 복귀 버튼

## 지시 내용 (작가님 구두)

1. 어드민 대시보드 로그인 화면에 카카오만 표시됨 → **Google 로그인 버튼 추가**
2. 어드민에서 포털로 돌아가기 버튼 없음 → **nav에 복귀 링크 추가**

## 수정 파일

- `monkos_AI/portal/public/admin/index.html`

## 수정 내역

### 1. Google 로그인 버튼 추가
- `auth.js` 로드 + GIS 초기화 (`loadGISWithRetry`, `initGoogleAuth`)
- `region`/`lang` 변수 사전 선언 (auth.js 의존)
- Google 로그인 성공 시 `updateAuthUI` 오버라이드 → 페이지 새로고침
- 로그인 영역을 `.login-buttons` flex 컨테이너로 감싸 Google/카카오 버튼 수직 배치

### 2. 포털 복귀 버튼
- nav 우측에 `← 포털로 돌아가기` 링크 (`href="/"`) 추가

## 완료 시각

2026-03-17 12:16 KST

## 비고

- 헌법 제2조 1항 ② 경로 (작가님 → 쌍아 직접 지시 → 실행 → 사후 기록)
- 쌍아 본분 예외 조건 충족: 1~2줄 수준, 지시서 발행이 명백히 불합리
