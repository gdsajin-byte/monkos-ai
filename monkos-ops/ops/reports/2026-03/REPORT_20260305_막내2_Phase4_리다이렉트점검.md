---
type: report
id: REPORT_20260305_막내2_Phase4_리다이렉트점검
date: 2026-03-05 15:24 KST
from: 막내2
to: 쌍아
status: completed
task_id: ORDER_20260305_막내2_Phase4_리다이렉트점검
result: success
tags: [Phase4, 리다이렉트, 토스, 로그인콜백, E2E]
---

# Phase 4 완료 보고서: 리다이렉트 시스템 전수 점검

> **[2026-03-05 15:24 KST] iMac/막내2 → iMac/쌍아**

---

## 1. 토스 결제 리다이렉트 검증 (3개 페이지)

| 페이지 | sharedInit 경유 | initFromTossResult 호출 | successUrl | history.replaceState | 판정 |
|--------|----------------|----------------------|-----------|---------------------|------|
| result.html | ✅ result.js init() | ✅ sharedInit() 내 | result.html?toss=success | ✅ pathname으로 정리 | ✅ |
| thankyou.html | ✅ thankyou.js init() | ✅ sharedInit() 내 | thankyou.html?toss=success | ✅ pathname으로 정리 | ✅ |
| charge.html | ✅ charge.html init() | ✅ sharedInit() 내 | charge.html?toss=success | ✅ pathname으로 정리 | ✅ |

### 결제 실패 처리
- `?toss=fail` → `initFromTossResult()`에서 alert(message) → `history.replaceState()` → 원래 상태 유지 ✅

---

## 2. pending_action 자동 진행 검증

| 페이지 | pending_action 값 | set 위치 | check 위치 | removeItem | 무한루프 방지 | 판정 |
|--------|-------------------|---------|-----------|-----------|-------------|------|
| result.js | `'download'` | L338 | init L526 | ✅ 양쪽 분기 | ✅ else 분기에서도 제거 | ✅ |
| thankyou.js | `'full_original'` | L167, L178 | init L292 | ✅ 양쪽 분기 | ✅ else 분기에서도 제거 | ✅ |
| result.js | `'generate'` | **미구현** | — | — | — | ⚠️ 하단 참조 |

### 순서 보장
```
sharedInit()
  → initFromTossResult() → 백엔드 confirm → credits 갱신 → alert
→ [페이지별 init 로직]
→ pending_action check → 조건 충족 시 자동 진행
```
**await 체인으로 순서 보장됨** ✅

### `'generate'` pending_action 부재
- result.js의 생성 402 에러 시: `showChargeModal()`만 호출, pending_action 미설정
- 충전 후 복귀 시 step2(원본 확인) 표시 → 사용자 "리터칭" 재클릭 필요
- 원본은 sessionStorage에 보존되므로 데이터 유실 없음
- **자동 리터칭 재시도는 미구현 (지시서에 명시적 요청 없음, 현행 유지)**

---

## 3. 로그인 후 복귀 개선 — 콜백 방식(A) 구현

### 구현 상세

**gate.js 변경:**
```js
let _loginCallback = null;

function _fireLoginCallback() {
  if (_loginCallback) {
    const cb = _loginCallback;
    _loginCallback = null;
    cb();
  }
}

// showLoginRequired(message, onSuccess) — 2번째 인자 추가
function _showLoginRequired(message, onSuccess) {
  _loginCallback = onSuccess || null;
  // ... 기존 모달 로직 ...
}
```

**콜백 삽입 지점 (5곳):**

| # | 위치 | 로그인 방식 | _fireLoginCallback() |
|---|------|-----------|---------------------|
| 1 | 모달 내 카카오 handler | postMessage auth-success | ✅ store.user 설정 직후 |
| 2 | 모달 내 LINE handler | postMessage auth-success | ✅ store.user 설정 직후 |
| 3 | _startGoogleLoginSimple() | GIS tokenClient callback | ✅ store.user 설정 직후 |
| 4 | _startKakaoLoginSimple() | postMessage auth-success | ✅ store.user 설정 직후 |
| 5 | _startLineLoginSimple() | postMessage auth-success | ✅ store.user 설정 직후 |

**닫기 버튼**: `_closeLoginRequired()`만 호출 → `_loginCallback` 발화하지 않음 → 원래 액션 미실행 ✅

### 호출부 수정

| 파일 | 위치 | 변경 전 | 변경 후 |
|------|------|---------|---------|
| camera.js | init() 로그인 게이트 | 폴링(300ms setInterval) | `showLoginRequired(msg, resolve)` → Promise resolve |
| result.js | confirmAndGenerate() | showLoginRequired(msg) → return | showLoginRequired(msg, confirmAndGenerate) → return |
| result.js | downloadResult() | showLoginRequired(msg) → return | showLoginRequired(msg, downloadResult) → return |

### 개선 효과
- **Before**: 로그인 성공 후 모달만 닫힘 → 사용자가 버튼 재클릭 필요
- **After**: 로그인 성공 → 원래 액션(리터칭/다운로드/카메라 init) 자동 재시도
- camera.js: 폴링(setInterval 300ms) 제거 → 이벤트 기반 콜백으로 전환 (CPU 부하 감소)

---

## 4. charge.html 돌아가기 경로

| 시나리오 | `?return` 값 | goBack() 결과 | 판정 |
|---------|-------------|-------------|------|
| index.html → `charge.html?return=index` | `'index'` | navigateTo('index.html') | ✅ |
| 외부 직접 접근 (return 없음) | null → 기본값 `'index'` | navigateTo('index.html') | ✅ |
| 토스 결제 후 복귀 (return 파라미터 소실) | null → 기본값 `'index'` | navigateTo('index.html') | ✅ |
| ChargeModule 모달 | charge.html 이동 없음 (인페이지 모달) | "닫기" 버튼 → 모달 hide | ✅ (별도 return 불필요) |

> 토스 redirect 시 `buyCreditsKR()`이 `pathname` 기반 successUrl을 생성하므로 `?return=` 파라미터는 소실됨. 그러나 기본값이 `'index'`이므로 index→charge 경로에서 문제 없음.

---

## 5. Phase 3 잔재 점검

| grep 대상 | 결과 | 판정 |
|----------|------|------|
| `buyDirect` | 0건 | ✅ 완전 제거 |
| `initDirectPayment` | 0건 | ✅ 완전 제거 |
| `GateModule.show()` | 0건 | ✅ 완전 제거 |
| `GateModule.close()` | 0건 | ✅ 완전 제거 |
| `toss.*direct` (프론트) | 0건 | ✅ 완전 제거 |
| `monkos_free_gen` | shared.js:239 1건 | ⚠️ `initCredits()` 내 `localStorage.removeItem` — 방어적 정리 코드. 해를 끼치지 않으므로 유지 |

---

## 6. E2E 6개 시나리오 추적

### 시나리오 1: 비로그인 → 촬영 시도 — ✅
```
index.html → "촬영 시작하기" → prep.html → 옵션 선택 → camera.html
  → sharedInit() → store.user.id = null
  → GateModule.showLoginRequired(msg, resolve)
  → Google/Kakao/LINE 로그인 → store.user 설정 → _fireLoginCallback() → resolve
  → 카메라 init 진행 → 촬영 시작
```

### 시나리오 2: 로그인 → 촬영 → 잔고부족(리터칭) — ✅
```
camera.html → 촬영 → result.html
  → confirmAndGenerate() → pipe.run('generate') → 402
  → showChargeModal() → buyCreditsKR() → 토스 redirect
  → result.html?toss=success → sharedInit() → initFromTossResult() → credits 갱신
  → store.generated = null → showOriginal() → step2
  → 사용자 "리터칭" 재클릭 → confirmAndGenerate() → 크레딧 충분 → 생성 진행
```
> pending_action 'generate' 미구현. 수동 재클릭 필요하나 데이터 보존됨.

### 시나리오 3: 로그인 → 촬영 → 다운로드 잔고부족 — ✅
```
result.html → downloadResult() → credits < 70
  → sessionStorage.setItem('monkos_pending_action', 'download')
  → showChargeModal() → buyCreditsKR() → 토스
  → result.html?toss=success → sharedInit() → initFromTossResult() → credits 갱신
  → _mo_p 복원 → generated 복원 → 결과 화면 복원
  → pending_action === 'download' && credits >= 70
  → removeItem → setTimeout(downloadResult, 300)
  → doDownload() → creditUse → navigateTo('thankyou.html')
```

### 시나리오 4: thankyou → 풀샷 잔고부족 — ✅
```
thankyou.html → downloadFullOriginal() → credits < fullOriginal
  → sessionStorage.setItem('monkos_pending_action', 'full_original')
  → showChargeModal() → buyCreditsKR() → 토스
  → thankyou.html?toss=success → sharedInit() → initFromTossResult() → credits 갱신
  → setupFullshot() → _fullOriginal = sessionStorage._mo_p (존재)
  → pending_action === 'full_original' → fetchLatestCredits()
  → credits >= cost → setTimeout(downloadFullOriginal, 300) → 자동 풀샷 다운로드
```

### 시나리오 5: 외부유입 → charge.html 직접 — ✅
```
charge.html (no ?return) → sharedInit() → renderPackages()
  → 상품 선택 → buyCreditsKR() → 토스
  → charge.html?toss=success → sharedInit() → initFromTossResult() → credits 갱신 → alert
  → "돌아가기" → goBack() → returnPage = 'index' → navigateTo('index.html')
```
비로그인 시: buyCreditsKR() → `alert('로그인이 필요합니다')` → return ✅

### 시나리오 6: 랜딩 → 패키지보기 → 충전 — ✅
```
index.html → "패키지 할인 보기 →" → charge.html?return=index
  → 상품 선택 → buyCreditsKR() → 토스
  → charge.html?toss=success (return 파라미터 소실)
  → initFromTossResult() → credits 갱신 → history.replaceState → charge.html (clean)
  → "돌아가기" → goBack() → returnPage = 기본값 'index' → navigateTo('index.html')
```

---

## 수정 파일 목록

| # | 파일 | 변경 |
|---|------|------|
| 1 | `modules/gate.js` | `_loginCallback` + `_fireLoginCallback()` 추가. showLoginRequired(msg, onSuccess) 시그니처. 5개 로그인 성공 핸들러에 콜백 발화 삽입 |
| 2 | `camera.js` | 폴링(setInterval) → 콜백(resolve) 방식 전환. showLoginRequired(msg, resolve) |
| 3 | `result.js` | confirmAndGenerate/downloadResult에 로그인 성공 콜백(자기 재호출) 추가 |

---

✅ 토스 결제 리다이렉트 3개 페이지 정상 (initFromTossResult + history.replaceState)
✅ pending_action 자동 진행 검증 — 순서 보장, 중복 방지, 무한루프 없음
✅ 로그인 후 복귀 개선 — 콜백 방식(A) 구현 (gate.js 5곳 + camera.js/result.js 3곳)
✅ charge.html 돌아가기 — return 파라미터 정상, 기본값 index 정상
✅ Phase 3 잔재 0건 (buyDirect/initDirectPayment/show/close 완전 제거)
✅ E2E 6개 시나리오 전건 추적 통과 — 끊어지는 링크 없음
💡 camera.js 폴링 → 이벤트 기반 콜백 전환 (CPU 부하 감소)
💡 `'generate'` pending_action 미구현 — 현행 유지 (수동 재클릭, 데이터 보존)
📁 `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase4_리다이렉트점검.md`
