---
type: report
id: COMPLETION_20260225_막내2_토스결제_전수조사
date: 2026-02-25 17:44 KST
from: iMac/막내2
to: iMac/쌍아
order: ORDER_20260225_막내2_토스결제_전수조사
result: success
status: completed
---

# 토스페이먼츠 결제 E2E 전수 조사 결과

**[2026-02-25 17:44 KST] iMac/막내2 → iMac/쌍아**

---

## 코드 수정 (2건)

| # | 파일 | 수정 내용 | 심각도 |
|---|------|----------|--------|
| 1 | `shared.js:166` | `/api/payment/confirm` → `/api/payments/toss/confirm` | **Critical** |
| 2 | `shared.js:174-178` | 결제 성공 후 localStorage 크레딧 동기화 누락 추가 | **High** |

---

## 체크리스트 7개 항목 결과

### 1. 엔드포인트 불일치 — **수정 완료**

| 항목 | Before | After |
|------|--------|-------|
| idphoto-kr | `${API.PORTAL_URL}/api/payment/confirm` | `${API.PORTAL_URL}/api/payments/toss/confirm` |
| portal 서버 | `/api/payments/toss/confirm` (line 1826) | 변경 없음 |

### 2. 결제 플로우 8단계 — **정상 (1건 수정 후)**

| 단계 | 상태 | 비고 |
|------|------|------|
| [1] 트리거 | OK | `buyCreditsKR(amount, credits)` — thankyou/result/camera/prep.html에서 onclick 호출 |
| [2] SDK 초기화 | OK | `TossPayments(TOSS_CLIENT_KEY)` — config.js 테스트키 (`test_ck_***`) |
| [3] requestPayment | OK | successUrl: `${origin}${pathname}?toss=success`, failUrl: `${origin}${pathname}?toss=fail` |
| [4] 리다이렉트 | OK | Toss가 paymentKey/orderId/amount를 쿼리 파라미터로 추가하여 리다이렉트 |
| [5] 콜백 처리 | OK | `initFromTossResult()` — `?toss=success` 마커 + 파라미터 추출 |
| [6] 서버 confirm | **수정됨** | `/api/payments/toss/confirm` POST → Toss API 호출 → 크레딧 적립 |
| [7] 크레딧 적립 | OK | Firestore `runTransaction` — 원자적, userId 검증, lastPurchase 갱신 |
| [8] UI 갱신 | **수정됨** | store.user 갱신 + localStorage 동기화 추가 (기존: store만 갱신, localStorage 미동기) |

### 3. 크레딧 패키지 매핑 — **idphoto-kr ↔ 서버 정합**

**idphoto-kr 현행 (4개 페이지 일관)**:

| 금액(₩) | 크레딧 | 서버 TOSS_AMOUNT_CREDITS |
|---------|--------|-------------------------|
| 1,450 | 10 | 1450 → 10 ✅ |
| 13,050 | 100 | 13050 → 100 ✅ |
| 34,800 | 300 | 34800 → 300 ✅ |
| 50,750 | 500 | 50750 → 500 ✅ |

**portal 프론트엔드 (참고 — 비활성 상태)**:

| 금액(₩) | 크레딧 | 서버 매칭 |
|---------|--------|----------|
| 12,900 | 10 | ❌ 서버 미등록 + 커스텀 검증 실패 (12900/145 = 비정수) |
| 29,900 | 30 | ❌ 서버 미등록 + 커스텀 검증 실패 |
| 45,900 | 50 | ❌ 서버 미등록 + 커스텀 검증 실패 |

> portal은 `TOSS_ENABLED = false`로 비활성이므로 실질적 영향 없음. 추후 portal 토스 활성화 시 매핑 정비 필요.

### 4. 클라이언트 키 상태

| 앱 | 키 | TOSS_ENABLED | 결제 가능 |
|----|-----|-------------|----------|
| idphoto-kr | `test_ck_***` (config.js) | 키 존재=활성 | ✅ 테스트 결제 가능 |
| portal | `''` (빈 문자열) | `false` | ❌ 비활성 |

### 5. CORS / 크로스도메인 — **정상**

portal server.js ALLOWED_ORIGINS (line 771-786):
- `https://idphoto-kr.monkos.ai` ✅ (line 775)
- `https://monkos-idphoto-kr-933456016842.us-central1.run.app` ✅ (line 778)
- `https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app` ✅ (line 781)
- `http://localhost:8080` ✅ (line 786)

CORS 미들웨어가 전역 적용 → `/api/payments/toss/confirm` 포함. OPTIONS 프리플라이트 204 응답 처리 확인 (line 797-801).

### 6. 실패 처리

| 시나리오 | 처리 | 방식 |
|---------|------|------|
| 사용자 취소 | `PAY_PROCESS_CANCELED` / `USER_CANCEL` 코드 감지 | 무시 (로그만) |
| 결제 에러 | `alert('결제 오류: ' + err.message)` | alert |
| Toss 실패 리다이렉트 | `?toss=fail&message=...` → `alert(msg)` | alert |
| 서버 confirm 실패 | `alert('결제 확인 실패: ' + data.error)` | alert |
| 네트워크 에러 | catch 블록 → `Monk.log` (사용자 미통지) | **⚠️ 사일런트** |

> **주의**: 네트워크 에러 시 사용자 피드백 없음 — 결제는 성공했으나 confirm이 실패한 경우 크레딧 미적립 가능. 재시도 로직 없음.
> **이중 결제 방지**: `history.replaceState`로 URL 파라미터 즉시 제거하여 새로고침 시 재확인 방지. 다만 replaceState 전 새로고침 시 이론적 이중 confirm 가능 (Toss API 자체의 idempotency에 의존).

### 7. orderId 형식 차이

| 앱 | 형식 | 예시 |
|----|------|------|
| idphoto-kr | `MONKOS_${uid8}_${time}_${rand6}` | `MONKOS_abc12345_1708876543210_x9k2m1` |
| portal | `monkos_${uid8}_${time}` | `monkos_abc12345_1708876543210` |

서버에서 orderId 파싱/검증 없음 (존재 여부만 체크, line 1832). Toss API로 그대로 전달. **형식 차이로 인한 기능 장애 없음**. 다만 로그 분석 시 출처 구분이 어려울 수 있음 — 접두어(`MONKOS_` vs `monkos_`)로 암묵적 구분 가능.

---

## 발견 이슈 요약

| # | 심각도 | 항목 | 상태 |
|---|--------|------|------|
| 1 | **Critical** | 엔드포인트 불일치 (`/api/payment/confirm`) | ✅ 수정됨 |
| 2 | **High** | 결제 후 localStorage 크레딧 미동기 | ✅ 수정됨 |
| 3 | **Low** | 네트워크 에러 시 사용자 피드백 없음 | 📋 보고 |
| 4 | **Info** | portal 프론트엔드 매핑 불일치 (비활성) | 📋 보고 |
| 5 | **Info** | orderId 형식 비통일 (기능 무관) | 📋 보고 |
