---
type: report
id: REPORT_20260305_막내2_Phase3_로그인게이트이동
date: 2026-03-05 14:24 KST
from: 막내2
to: 쌍아
status: completed
task_id: ORDER_20260305_막내2_Phase3_로그인게이트이동
result: success
tags: [Phase3, 로그인게이트, 비회원결제제거, gate.js]
---

# Phase 3 완료 보고서: 로그인 게이트 촬영실 진입으로 이동

> **[2026-03-05 14:24 KST] iMac/막내2 → iMac/쌍아**

---

## 1. 촬영실 진입 시 로그인 게이트

| 항목 | 상태 | 비고 |
|------|------|------|
| camera.js 로그인 체크 | ✅ 추가 | `init()` 내 데스크톱 차단 이후, format 체크 이전에 설치 |
| 로그인 모달 표시 | ✅ 현행 재사용 | `GateModule.showLoginRequired()` (Google/Kakao/LINE 3버튼) |
| 메시지 | ✅ 지시서 준수 | "촬영을 시작하려면 로그인이 필요합니다\n첫 로그인 시 10c를 드려요!" |
| 로그인 후 카메라 초기화 | ✅ 맥락 보존 | `store.user.id` 폴링(300ms) → resolve → 카메라 init 진행. 페이지 이동 없음 |
| 닫기 버튼 → 랜딩 복귀 | ✅ 추가 | 로그인 안 하고 닫으면 `navigateTo('index.html')` |

---

## 2. 비회원 결제 경로 제거

### 제거된 코드 (gate.js)

| 함수/메서드 | 설명 | 상태 |
|-------------|------|------|
| `_buyDirect()` | 비로그인 ₩9,900 토스 직결제 | ✅ 제거 |
| `_initDirectPaymentResult()` | 직결제 토스 리다이렉트 결과 처리 | ✅ 제거 |
| `GateModule.show()` | deprecated (Phase1/2 이미 비활성) | ✅ 제거 |
| `GateModule.close()` | download-gate DOM 제거 | ✅ 제거 |
| `GateModule.buyDirect()` | _buyDirect export | ✅ 제거 |
| `GateModule.initDirectPayment()` | _initDirectPaymentResult export | ✅ 제거 |
| `TOSS_CLIENT_KEY` import | gate.js에서 직결제 전용으로만 사용 | ✅ 제거 |
| `.gate-btn-pay` CSS | 직결제 버튼 스타일 | ✅ 제거 |

### gate.js 잔존 코드 (보존)

| 함수/메서드 | 역할 |
|-------------|------|
| `GateModule.showLoginRequired(message)` | 로그인 필요 모달 표시 |
| `GateModule.closeLoginRequired()` | 로그인 모달 닫기 |
| `_startGoogleLoginSimple()` | Google OAuth GIS 로그인 |
| `_startKakaoLoginSimple()` | 카카오 팝업 로그인 |
| `_startLineLoginSimple()` | LINE 팝업 로그인 |

---

## 3. result.js 비회원 경로 전환

| 위치 | 변경 전 | 변경 후 |
|------|---------|---------|
| `confirmAndGenerate()` 비로그인 체크 | 무료 체험 1회 제한 + `localStorage monkos_free_gen` | `showLoginRequired()` 즉시 리턴 (방어용) |
| `downloadResult()` 비로그인 체크 | `GateModule.buyDirect()` | `showLoginRequired()` 즉시 리턴 (방어용) |
| `init()` 직결제 리다이렉트 | `GateModule.initDirectPayment(...)` 16줄 블록 | ✅ 전체 제거 |

> 촬영실 게이트에서 이미 로그인이 강제되므로 result.js 도달 시 로그인 상태가 보장됨. result.js의 로그인 체크는 방어적 가드.

---

## 4. 로그인 체크 지점 전수 파악

| 페이지 | 로그인 체크 | 방식 | 비고 |
|--------|-----------|------|------|
| `index.html` | ❌ 불필요 | — | 랜딩은 비로그인 접근 가능 (정상) |
| `prep.html` | ❌ 불필요 | — | 옵션 선택은 비로그인 가능 |
| `camera.html`/`camera.js` | ✅ **Phase 3 신규** | GateModule.showLoginRequired | 촬영실 진입 시점. 핵심 게이트 |
| `result.js` confirmAndGenerate | ✅ 방어적 | GateModule.showLoginRequired | 촬영실 통과했으면 로그인 상태 |
| `result.js` downloadResult | ✅ 방어적 | GateModule.showLoginRequired | 촬영실 통과했으면 로그인 상태 |
| `charge.html` | ✅ 기존재 | `buyCreditsKR()` 내 alert | shared.js:126 `if (!store.user.id)` |
| `thankyou.html` | ✅ 기존재 | 크레딧 사용 시 서버 검증 | creditUse API에서 userId 필수 |

---

## 5. 흐름 검증

### 시나리오 1: 비로그인 → 랜딩 — ✅
```
index.html → 정상 접근 (로그인 불필요)
히어로 + 가격카드 + CTA 버튼 표시
```

### 시나리오 2: 비로그인 → "촬영 시작하기" → camera.html — ✅
```
index.html → prep.html → camera.html
  → sharedInit() → initCredits() → store.user.id = null
  → GateModule.showLoginRequired() 모달
  → Google/Kakao/LINE 로그인
  → store.user.id 설정 → 폴링 감지 → resolve
  → format 체크 → 카메라 시작 → AI 코칭
```

### 시나리오 3: 로그인 상태 → camera.html — ✅
```
camera.html → sharedInit() → initCredits() → store.user.id 존재
  → 로그인 게이트 스킵
  → format 체크 → 카메라 시작 → AI 코칭
```

### 시나리오 4: 비로그인 → charge.html 직접 접근 — ✅
```
charge.html → sharedInit() → initCredits() → store.user.id = null
  → 상품 선택 가능 (열람 OK)
  → "결제" 클릭 → buyCreditsKR() → alert('로그인이 필요합니다')
```

### 시나리오 5: 로그인 → 촬영 → 결과 → 잔고 부족 → 모달 충전 — ✅
```
camera.html (로그인 완료) → 촬영 → result.html
  → confirmAndGenerate() → store.user.id 존재 → pipe.run('generate')
  → 생성 완료 → downloadResult()
  → store.user.credits < 70 → showChargeModal()
  → 상품 선택 → buyCreditsKR() → 토스 리다이렉트
  → result.html 복귀 → initFromTossResult() → 크레딧 갱신
  → pending_action='download' → setTimeout(downloadResult, 300)
  → Phase 2 흐름 보존 ✅
```

---

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `modules/gate.js` | buyDirect/initDirectPayment/show/close 제거. showLoginRequired+소셜로그인만 보존. TOSS_CLIENT_KEY import 제거 |
| 2 | `camera.js` | GateModule import 추가. init()에 로그인 게이트 설치 (모달→폴링→진행) |
| 3 | `result.js` | GateModule.buyDirect() → showLoginRequired. initDirectPayment 블록 제거. 무료 생성 경로 제거 |

---

✅ 촬영실 진입 시 로그인 게이트 설치 완료
✅ 비회원 결제 경로 (buyDirect/initDirectPayment) 완전 소멸
✅ gate.js 정리 완료 (showLoginRequired + closeLoginRequired + 소셜 로그인만 보존)
✅ 로그인 체크 지점 전수 파악 (7개 페이지/파일)
✅ E2E 5개 시나리오 전건 검증 통과
💡 Phase 2 ChargeModule/카드렌더링/E2E 흐름 보존 확인
📁 `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase3_로그인게이트이동.md`
