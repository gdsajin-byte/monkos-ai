---
type: report
id: COMPLETION_20260225_막내2_프론트_크레딧게이트
date: 2026-02-25 19:03 KST
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260225_막내2_프론트_크레딧게이트
result: success
status: completed
---

# 프론트 크레딧 게이트 구현 완료

**[2026-02-25 19:03 KST] iMac/막내2 → iMac/쌍아**

---

## 수정 파일

| # | 파일 | 변경량 |
|---|------|--------|
| 1 | `monkos_AI/idphoto-kr/public/result.js` | 386줄 → 803줄 (+417줄) |

---

## 작업 1: 다운로드 게이트 팝업 — ✅ 완료

### 변경 내용

- `downloadResult()` (line 684-720): 비로그인 시 `showDownloadGatePopup()` 호출 + return
- `showDownloadGatePopup()` (line 72-117): 하단 시트 스타일 팝업 동적 생성
  - Phase 1: "카카오 로그인으로 무료 받기" + "바로 결제 ₩10,150"
  - Phase 2 (로그인 후): "텔레그램 공유 +40c" / "전후사진 동의 +40c"
  - 70c 달성 시 자동 다운로드 진행

### 경로 A: 카카오 로그인 무료 플로우

| 단계 | 함수 | 라인 |
|------|------|------|
| 카카오 로그인 | `startKakaoLogin()` → popup + postMessage | 169-198 |
| 가입 보너스 30c | `onKakaoLoginSuccess()` → POST `/api/credits/event` | 200-238 |
| 텔레그램 공유 +40c | `doShareTelegram()` → `shareTelegram()` + `requestEventCredit('sns_share')` | 272-281 |
| 전후사진 동의 +40c | `doPhotoConsent()` → `requestEventCredit('photo_consent')` | 284-292 |
| 70c 달성 | `updateGateUI()` → `proceedDownloadAfterGate()` | 124-165 |

### 경로 B: 바로 결제 ₩10,150

| 단계 | 함수 | 라인 |
|------|------|------|
| 토스 결제 | `buyDirectKR()` — `GUEST_` customerKey, `DIRECT_` orderId | 294-322 |
| 리다이렉트 | `?toss=direct` → `initDirectPaymentResult()` | 324-353 |
| 서버 확인 | POST `/api/payments/toss/direct` → downloadToken | 337-348 |

---

## 작업 2: 비로그인 1회 생성 제한 — ✅ 완료

- `confirmAndGenerate()` (line 535-542):
  - `localStorage.getItem('monkos_free_gen')` 체크
  - 1회차: 플래그 설정 후 무료 생성 허용
  - 2회차~: `showLoginRequiredModal()` 표시 → 카카오 로그인 유도

---

## 작업 3: 잔액 부족 → showChargeModal() — ✅ 완료

- 생성 402 (line 627-631): `window.showChargeModal()` 우선, 미정의 시 `showCreditModal()` 폴백
- 다운로드 잔액 부족 (line 695-701): 동일 패턴
- 다운로드 402 (line 710-715): 동일 패턴
- 게이트 후 다운로드 (line 143-148): 동일 패턴

> 막내3이 `showChargeModal()` 구현 전까지 기존 크레딧 모달로 폴백 동작

---

## 작업 4: 텔레그램 공유 함수 — ✅ 완료

- `shareTelegram()` (line 262-270): `t.me/share/url` API 사용
- 공유 창 열림 = 공유 완료 간주 (텔레그램 API 제한)

---

## 의존성 대기 목록

| 기능 | 담당 | 현재 상태 |
|------|------|----------|
| `showChargeModal()` | 막내3 (shared.js) | 미구현 → 폴백 동작 |
| `POST /api/credits/event` | 막내1 (portal server.js) | 미구현 → 호출 실패 시 Monk.log |
| `POST /api/payments/toss/direct` | 막내1 (portal server.js) | 미구현 → 단건 결제 경로 불가 |
| portal TOSS_AMOUNT_CREDITS `11600→80` | 막내1 (portal server.js) | 미구현 |

---

## 파일 충돌 확인

- 막내1: server.js (서버만) → 충돌 없음
- 막내3: shared.js (헤더 + showChargeModal) → 충돌 없음
- 본 작업: result.js만 수정 → OK
