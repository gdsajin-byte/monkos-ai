---
type: completion
date: 2026-04-24
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260424_iMac쌍아→막내2_결제플로우기술점검.md
status: 완료
---

[2026-04-24 14:05 KST] iMac/막내2 → iMac/쌍아

# COMPLETION: 결제 플로우 기술 점검 + 수정

## Phase 1: 진단 결과

### 1. idphoto-kr 결제 경로 (Toss)

| 항목 | 상태 | 비고 |
|------|------|------|
| charge.html Toss v2 SDK 로드 | ✅ | `https://js.tosspayments.com/v2/standard` |
| TOSS_CLIENT_KEY | ✅ | `live_gck_...` 라이브키 정상 |
| 로그인 게이트 (GateModule) | ✅ | Google/Kakao/LINE 팝업 + 콜백 정상 |
| Widget 초기화 + 렌더 | ✅ | `renderPaymentMethods` / `renderAgreement` |
| requestPayment → Toss 리다이렉트 | ✅ | successUrl/failUrl 설정 정상 |
| Toss → charge.html 복귀 | ⚠️ | **버그 발견** (아래 상세) |
| Portal confirm API | ✅ | `/api/payments/toss/confirm` 정상 |
| Firestore 크레딧 추가 | ✅ | 트랜잭션 기반 원자적 적립 |

### 2. idphoto-jp 결제 경로 (Lemon Squeezy)

| 항목 | 상태 | 비고 |
|------|------|------|
| LS JS SDK 로드 | ✅ | `lemon.js` defer 로드 |
| Portal /api/checkout | ✅ | LS checkout URL 생성 정상 |
| LS 웹훅 처리 | ✅ | HMAC 서명 검증 + order_created/refunded |
| VARIANT_CREDITS 매핑 | ✅ | 5개 variant 매핑 일치 |
| **결제 후 복귀 처리** | ⚠️ | `?payment=complete` 미처리 |

### 3. Portal 결제 API

| 항목 | 상태 | 비고 |
|------|------|------|
| handleTossConfirm | ✅ | PRODUCTS 매핑 + custom 충전 검증 |
| handleLemonSqueezyWebhook | ✅ | 서명 검증 + 크레딧 지급 |
| CORS 설정 | ✅ | idphoto-kr/jp 도메인 허용 + credentials |
| 멱등성 보호 | ⚠️ | **없었음** → 추가 완료 |

### 4. Firestore 크레딧 적립

✅ `firestore.runTransaction` 기반 원자적 크레딧 추가. 에러 핸들링 정상.

## 발견된 버그 (3건)

### BUG-1: history.replaceState 타이밍 (치명)
- **위치**: `idphoto-kr/public/shared.js:188`, `studio/public/shared.js:188`
- **증상**: confirm API 호출 **전에** URL 파라미터(paymentKey, orderId, amount) 삭제
- **영향**: 네트워크 에러 시 재시도 불가 → 돈은 빠지고 크레딧 미적립
- **수정**: sessionStorage에 결제 데이터 백업 + confirm 성공 후 삭제

### BUG-2: confirm 실패 시 복구 경로 없음 (중요)
- **위치**: `idphoto-kr/public/shared.js`, `studio/public/shared.js`
- **증상**: confirm 실패 시 alert만 표시하고 결제 데이터 소실
- **수정**: 재시도 버튼 + sessionStorage 유지 + 페이지 재방문 시 자동 복구

### BUG-3: idphoto-jp 결제 후 크레딧 미갱신 (중요)
- **위치**: `idphoto-jp/public/shared.js`
- **증상**: LS 결제 후 `?payment=complete`로 복귀하지만 처리 코드 없음
- **수정**: `_handlePaymentComplete()` 추가 — URL 정리 + 크레딧 폴링 갱신

## Phase 2: 수정 사항

### 수정 파일 4개

| 파일 | 수정 내용 |
|------|----------|
| `monkos_AI/idphoto-kr/public/shared.js` | initFromTossResult 전면 개선: sessionStorage 백업, 재시도 UI, credentials, userId null 가드 |
| `monkos_AI/studio/public/shared.js` | 동일 패턴 적용 |
| `monkos_AI/idphoto-jp/public/shared.js` | `_handlePaymentComplete()` 신설 — LS 결제 후 크레딧 갱신 |
| `monkos_AI/portal/lib/payments.js` | orderId 기반 멱등성 체크 — 중복 confirm 시 기존 결과 반환 |

### 수정 상세

**1. Toss confirm 플로우 재설계 (idphoto-kr, studio)**
- 결제 데이터를 sessionStorage(`monkos_pending_payment`)에 즉시 저장
- confirm 성공 시에만 sessionStorage 삭제
- confirm 실패 시 재시도 버튼 제공
- 페이지 재방문 시 미완료 결제 자동 복구
- `credentials: 'include'` 추가
- 타임아웃 15s → 20s 확대
- alert 대신 풀스크린 결과 UI (`_showPaymentResult`)
- `store.user.id` null 시 로그인 안내 (결제 데이터는 보존)

**2. Portal 멱등성 보호**
- confirm 호출 시 `payments` 컬렉션에서 동일 orderId + type='toss_confirm' 조회
- 이미 처리된 경우 현재 잔액 반환 (크레딧 중복 적립 방지)

**3. idphoto-jp LS 결제 복귀**
- `?payment=complete` 파라미터 감지 → URL 정리
- 2초/5초 딜레이 폴링으로 웹훅 처리 대기 후 크레딧 갱신
- 갱신 완료 시 잔액 표시 alert

## 배포 필요

| 서비스 | deploy.sh |
|--------|-----------|
| monkos-idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` |
| monkos-studio | `monkos_AI/studio/deploy.sh` |
| monkos-idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` |
| monkos-portal | `monkos_AI/portal/deploy.sh` |

## ⚠️ 준수 조항
- ✅ 결제 시크릿 키 미접촉 (환경변수 참조만)
- ✅ deploy.sh 경유 배포 원칙 준수 (직접 배포 미실행)
- ✅ 기존 Toss 라이브키 미변경
